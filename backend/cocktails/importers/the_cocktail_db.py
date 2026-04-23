from __future__ import annotations

import os
import string
import sys
import time
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import quote

import requests
from django.db import transaction
from django.db.utils import OperationalError
from django.utils.text import slugify
from tqdm import tqdm

from cocktails import source_keys
from cocktails.image_pipeline import apply_ingredient_image_cutout, apply_recipe_image_cutout
from cocktails.importers.base import BaseCatalogImporter
from cocktails.importers.http_image import download_into_image_field
from cocktails.importers.measure_parse import parse_measure
from cocktails.models import (
    Category,
    Ingredient,
    IngredientExternalRef,
    Recipe,
    RecipeExternalRef,
    RecipeIngredient,
)

DEFAULT_LETTERS = string.ascii_lowercase + string.digits


def _cocktail_db_api_base(api_version: str, api_key: str) -> str:
    ver = (api_version or "v1").strip().lower()
    if not ver.startswith("v"):
        ver = f"v{ver}"
    return f"https://www.thecocktaildb.com/api/json/{ver}/{api_key}"


# Lowercased strGlass → Recipe.GlassType value
_GLASS_MAP: dict[str, str] = {
    "champagne flute": Recipe.GlassType.FLUTE,
    "flute": Recipe.GlassType.FLUTE,
    "cocktail glass": Recipe.GlassType.MARTINI,
    "cocktail": Recipe.GlassType.MARTINI,
    "martini glass": Recipe.GlassType.MARTINI,
    "margarita glass": Recipe.GlassType.COUPE,
    "coupe glass": Recipe.GlassType.COUPE,
    "coupe": Recipe.GlassType.COUPE,
    "highball glass": Recipe.GlassType.HIGHBALL,
    "collins glass": Recipe.GlassType.HIGHBALL,
    "pint glass": Recipe.GlassType.HIGHBALL,
    "beer pilsner": Recipe.GlassType.HIGHBALL,
    "beer mug": Recipe.GlassType.HIGHBALL,
    "old-fashioned glass": Recipe.GlassType.ROCKS,
    "old fashioned glass": Recipe.GlassType.ROCKS,
    "whiskey sour glass": Recipe.GlassType.ROCKS,
    "rocks glass": Recipe.GlassType.ROCKS,
    "shot glass": Recipe.GlassType.SHOT,
    "wine glass": Recipe.GlassType.WINE,
    "hurricane glass": Recipe.GlassType.HURRICANE,
    "brandy snifter": Recipe.GlassType.SNIFTER,
    "snifter glass": Recipe.GlassType.SNIFTER,
    "balloon glass": Recipe.GlassType.SNIFTER,
    "white wine glass": Recipe.GlassType.WINE,
    "red wine glass": Recipe.GlassType.WINE,
    "irish coffee cup": Recipe.GlassType.OTHER,
    "coffee mug": Recipe.GlassType.OTHER,
    "jar": Recipe.GlassType.HIGHBALL,
    "copper mug": Recipe.GlassType.COPPER,
    "tiki mug": Recipe.GlassType.TIKI,
    "punch bowl": Recipe.GlassType.HIGHBALL,
    "glass": Recipe.GlassType.HIGHBALL,
    "sour glass": Recipe.GlassType.MARTINI,
    "cordial glass": Recipe.GlassType.COUPE,
    "brandys chalice": Recipe.GlassType.SNIFTER,
    "champagne glass": Recipe.GlassType.FLUTE,
    "mason jar": Recipe.GlassType.HIGHBALL,
}


def _norm_glass(raw: str | None) -> str:
    return Recipe.GlassType.OTHER if not raw else _GLASS_MAP.get(raw.strip().lower(), Recipe.GlassType.OTHER)


def _map_ingredient_type(api: str | None) -> str:
    if not api:
        return Ingredient.IngredientType.OTHER
    t = api.lower()
    if "bitter" in t:
        return Ingredient.IngredientType.BITTER
    if any(
        x in t
        for x in (
            "gin",
            "vodka",
            "rum",
            "whisk",
            "brandy",
            "tequila",
            "cognac",
            "mezcal",
            "spirit",
            "liqueur",
        )
    ):
        if "liqueur" in t:
            return Ingredient.IngredientType.LIQUEUR
        return Ingredient.IngredientType.SPIRIT
    if "vermouth" in t or "wine" in t or "sake" in t or "sherry" in t:
        return Ingredient.IngredientType.WINE
    if "beer" in t or "cider" in t:
        return Ingredient.IngredientType.BEER
    if "juice" in t:
        return Ingredient.IngredientType.JUICE
    if "syrup" in t or "sugar" in t or "cordial" in t or "grenadine" in t:
        return Ingredient.IngredientType.SYRUP
    if "water" in t or "soda" in t or "tonic" in t or "cola" in t or "mixer" in t:
        return Ingredient.IngredientType.MIXER
    if "cream" in t or "milk" in t or "egg" in t or "yolk" in t:
        return Ingredient.IngredientType.DAIRY
    if "fruit" in t or "herb" in t or "garnish" in t or "peel" in t or "twist" in t:
        return Ingredient.IngredientType.GARNISH
    return Ingredient.IngredientType.OTHER


def _recipe_description(instructions: str | None) -> str:
    t = (instructions or "").strip()
    if not t:
        return "Imported cocktail recipe."
    if len(t) <= 300:
        return t
    cut = t[:300].rsplit(" ", 1)[0]
    return (cut or t[:300]) + "…"


def _recipe_instructions(instructions: str | None) -> str:
    t = (instructions or "").strip()
    return t if t else "Preparation details were not supplied by the source catalog."


def _parse_is_alcoholic(s: str | None) -> bool:
    if not s:
        return True
    return "non" not in s.lower()


def _allocate_slug(model_cls, base: str, *, exclude_pk: int | None = None, max_len: int = 250) -> str:
    root = slugify(base)[:max_len] or "item"
    candidate = root
    n = 2
    qs = model_cls.objects.all()
    if exclude_pk is not None:
        qs = qs.exclude(pk=exclude_pk)
    while qs.filter(slug=candidate).exists():
        suffix = f"-{n}"
        candidate = root[: max_len - len(suffix)] + suffix
        n += 1
    return candidate


def _pick_metadata(drink: dict[str, Any]) -> dict[str, Any]:
    keys = (
        "strTags",
        "strIBA",
        "strVideo",
        "strImageSource",
        "strImageAttribution",
        "strCreativeCommonsConfirmed",
        "dateModified",
        "strAlcoholic",
        "strCategory",
        "strGlass",
    )
    out: dict[str, Any] = {}
    for k in keys:
        if drink.get(k):
            out[k] = drink[k]
    return out


def _ingredient_metadata(row: dict[str, Any]) -> dict[str, Any]:
    keep = ("strType", "strAlcohol", "strABV")
    return {k: row[k] for k in keep if row.get(k)}


def _apply_api_row_to_ingredient(ing: Ingredient, row: dict[str, Any] | None) -> None:
    if not row:
        return
    ing.type = _map_ingredient_type(row.get("strType"))
    ing.description = (row.get("strDescription") or "").strip()
    if row.get("strABV"):
        try:
            ing.abv = Decimal(str(row["strABV"]))
        except (InvalidOperation, ValueError):
            pass
    else:
        ing.abv = None


def _ingredient_thumb_url(name: str) -> str:
    return f"https://www.thecocktaildb.com/images/ingredients/{quote(name.strip())}-Medium.png"


class TheCocktailDbImporter(BaseCatalogImporter):
    """
    Pulls drinks from TheCocktailDB public JSON API into local Recipe/Ingredient rows.
    Provider-specific fields stay in RecipeExternalRef / IngredientExternalRef metadata.
    """

    source_key = source_keys.THECOCKTAILDB

    def __init__(self) -> None:
        self._session = requests.Session()
        self._session.headers.update({"User-Agent": "TheDistillistCatalogImporter/1.2"})

    def run(
        self,
        stdout: Any,
        stderr: Any,
        style: Any,
        *,
        dry_run: bool,
        update: bool,
        skip_images: bool,
        with_ingredient_images: bool,
        delay_seconds: float,
        letters: str,
        max_recipes: int | None,
        api_key: str,
        api_version: str = "v1",
        cutouts: bool = True,
        sync_all_ingredients: bool = False,
        show_progress: bool = True,
    ) -> None:
        key = api_key or os.environ.get("THECOCKTAILDB_API_KEY", "1")
        ver = os.environ.get("THECOCKTAILDB_API_VERSION", api_version)
        self._base = _cocktail_db_api_base(ver, key)

        ids = self._collect_drink_ids(letters, delay_seconds, stderr, show_progress=show_progress)
        if max_recipes is not None:
            ids = sorted(ids)[: max_recipes]

        stdout.write(style.NOTICE(f"Discovered {len(ids)} unique drink ids to process."))

        done = skipped = errors = 0
        self._name_cache: dict[str, Ingredient] = {}

        if dry_run:
            try:
                RecipeExternalRef.objects.exists()
            except OperationalError:
                stdout.write(
                    style.WARNING(
                        "Database tables for catalog refs are missing — run migrations "
                        "(cocktails.0004_catalog_external_refs). Cannot estimate skip vs new counts."
                    )
                )
                return

        id_list = sorted(ids)
        iterator: Any = id_list
        if show_progress and not dry_run:
            iterator = tqdm(id_list, desc="Catalog recipes", unit="drink", file=sys.stderr)

        for idx, ext_id in enumerate(iterator, start=1):
            try:
                if dry_run:
                    exists = RecipeExternalRef.objects.filter(
                        source_key=self.source_key,
                        external_id=str(ext_id),
                    ).exists()
                    if exists and not update:
                        skipped += 1
                    else:
                        done += 1
                    continue

                created = self._import_one_drink(
                    ext_id,
                    update=update,
                    skip_images=skip_images,
                    with_ingredient_images=with_ingredient_images,
                    cutouts=cutouts,
                    stdout=stdout,
                    style=style,
                    drink_index=idx,
                    drink_total=len(id_list),
                )
                if created is True:
                    done += 1
                elif created is False:
                    skipped += 1
                if delay_seconds and not dry_run:
                    time.sleep(delay_seconds)
            except Exception as exc:  # noqa: BLE001 — log and continue bulk import
                errors += 1
                stderr.write(style.ERROR(f"Failed id {ext_id}: {exc}"))

        if dry_run:
            stdout.write(
                style.SUCCESS(
                    f"Dry run finished. Would create/update: {done}, would skip: {skipped}, errors: {errors}"
                )
            )
        else:
            stdout.write(style.SUCCESS(f"Recipes done. imported/updated: {done}, skipped: {skipped}, errors: {errors}"))

        if dry_run or not sync_all_ingredients:
            return

        ing_done, ing_err = self._import_all_ingredients_from_list(
            stdout,
            stderr,
            style,
            update=update,
            with_images=with_ingredient_images,
            cutouts=cutouts,
            delay_seconds=delay_seconds,
            show_progress=show_progress,
        )
        stdout.write(
            style.SUCCESS(f"Ingredient list pass done. upserted: {ing_done}, errors: {ing_err}")
        )

    def _import_all_ingredients_from_list(
        self,
        stdout: Any,
        stderr: Any,
        style: Any,
        *,
        update: bool,
        with_images: bool,
        cutouts: bool,
        delay_seconds: float,
        show_progress: bool,
    ) -> tuple[int, int]:
        """Walk list.php?i=list so standalone ingredients get rows/images (patron/v2 lists are complete)."""
        data = self._get("list.php", {"i": "list"})
        rows = data.get("drinks") or data.get("ingredients") or []
        names: list[str] = []
        for row in rows:
            n = row.get("strIngredient1") or row.get("strIngredient")
            if n and str(n).strip():
                names.append(str(n).strip())

        if len(names) < 200:
            stderr.write(
                style.WARNING(
                    f"Ingredient list returned only {len(names)} items. "
                    "Free tier key `1` often caps this (~100). "
                    "Use a patron API key and THECOCKTAILDB_API_VERSION=v2 for the full ~489 list."
                )
            )

        done = errors = 0
        iterator: Any = names
        if show_progress:
            iterator = tqdm(names, desc="Ingredients (full list)", unit="ing", file=sys.stderr)

        for name in iterator:
            try:
                self._resolve_ingredient(
                    name,
                    update=update,
                    with_images=with_images,
                    cutouts=cutouts,
                    force_refresh_images=update and with_images,
                )
                done += 1
                if delay_seconds:
                    time.sleep(delay_seconds)
            except Exception as exc:  # noqa: BLE001
                errors += 1
                stderr.write(style.ERROR(f"Ingredient list item {name!r}: {exc}"))

        return done, errors

    def _get(self, path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        """GET JSON with backoff when TheCocktailDB rate-limits (429) or errors (5xx)."""
        url = f"{self._base}/{path}"
        params = params or {}
        r: requests.Response | None = None
        for attempt in range(14):
            r = self._session.get(url, params=params, timeout=60)
            if r.status_code == 429:
                time.sleep(min(2**min(attempt, 8), 120))
                continue
            if r.status_code >= 500:
                time.sleep(min(2**min(attempt, 5), 60))
                continue
            r.raise_for_status()
            return r.json()
        if r is not None:
            r.raise_for_status()
        return {}

    def _collect_drink_ids(
        self,
        letters: str,
        delay: float,
        stderr: Any,
        *,
        show_progress: bool,
    ) -> set[str]:
        out: set[str] = set()
        letter_iter: Any = letters
        if show_progress:
            letter_iter = tqdm(letters, desc="Discover drinks (by letter)", unit="letter", file=sys.stderr)

        for letter in letter_iter:
            try:
                data = self._get("search.php", {"f": letter})
            except requests.RequestException as exc:
                stderr.write(f"Letter {letter} search failed: {exc}")
                continue
            for row in data.get("drinks") or []:
                did = row.get("idDrink")
                if did:
                    out.add(str(did))
            if delay:
                time.sleep(delay)
        return out

    def _import_one_drink(
        self,
        ext_id: str,
        *,
        update: bool,
        skip_images: bool,
        with_ingredient_images: bool,
        cutouts: bool,
        stdout: Any = None,
        style: Any = None,
        drink_index: int | None = None,
        drink_total: int | None = None,
    ) -> bool | None:
        """Returns True if created/updated, False if skipped, None on weird empty payload."""
        data = self._get("lookup.php", {"i": ext_id})
        drinks = data.get("drinks")
        if not drinks:
            return None
        d = drinks[0]

        title = (d.get("strDrink") or "Untitled").strip()[:250]
        if (
            stdout
            and style
            and drink_index is not None
            and drink_total is not None
        ):
            stdout.write(style.NOTICE(f"[{drink_index}/{drink_total}] {title}\n"))
            stdout.flush()

        ref = RecipeExternalRef.objects.filter(
            source_key=self.source_key,
            external_id=str(ext_id),
        ).first()
        if ref and not update:
            return False

        instructions = _recipe_instructions(d.get("strInstructions"))
        description = _recipe_description(instructions)

        cat = None
        cname = d.get("strCategory")
        if cname and str(cname).strip():
            cn = str(cname).strip()[:100]
            cslug = slugify(cn)[:100] or "cocktail"
            cat, _ = Category.objects.get_or_create(
                slug=cslug,
                defaults={"name": cn, "description": "", "sort_order": 0},
            )

        meta = _pick_metadata(d)

        with transaction.atomic():
            if ref:
                recipe = ref.recipe
                recipe.title = title
                recipe.description = description
                recipe.instructions = instructions
                recipe.category = cat
                recipe.is_alcoholic = _parse_is_alcoholic(d.get("strAlcoholic"))
                recipe.glass_type = _norm_glass(d.get("strGlass"))
                recipe.source = Recipe.Source.CATALOG
                recipe.save()
                ref.metadata = meta
                ref.save(update_fields=["metadata", "updated_at"])
                RecipeIngredient.objects.filter(recipe=recipe).delete()
            else:
                recipe = Recipe(
                    title=title,
                    slug=_allocate_slug(Recipe, title),
                    description=description,
                    instructions=instructions,
                    history="",
                    category=cat,
                    difficulty=Recipe.Difficulty.MEDIUM,
                    glass_type=_norm_glass(d.get("strGlass")),
                    prep_time_minutes=5,
                    is_alcoholic=_parse_is_alcoholic(d.get("strAlcoholic")),
                    is_featured=False,
                    is_published=True,
                    source=Recipe.Source.CATALOG,
                )
                recipe.save()
                RecipeExternalRef.objects.create(
                    recipe=recipe,
                    source_key=self.source_key,
                    external_id=str(ext_id),
                    metadata=meta,
                )

            seen_ingredient_ids: set[int] = set()
            sort_order = 0
            for i in range(1, 16):
                name = d.get(f"strIngredient{i}")
                if not name or not str(name).strip():
                    continue
                measure = d.get(f"strMeasure{i}") or ""
                ing = self._resolve_ingredient(
                    str(name).strip(),
                    update=update,
                    with_images=with_ingredient_images,
                    cutouts=cutouts,
                    force_refresh_images=bool(update and with_ingredient_images),
                )
                if ing.pk in seen_ingredient_ids:
                    continue
                seen_ingredient_ids.add(ing.pk)

                qty, unit, notes = parse_measure(measure)
                RecipeIngredient.objects.create(
                    recipe=recipe,
                    ingredient=ing,
                    quantity=qty[:20],
                    unit=unit,
                    notes=(notes or "")[:200],
                    sort_order=sort_order,
                )
                sort_order += 1

        # Hero image + rembg after commit — keeps DB transactions short and matches member pipeline timing.
        if not skip_images:
            thumb = d.get("strDrinkThumb")
            if thumb:
                recipe = Recipe.objects.get(pk=recipe.pk)
                download_into_image_field(recipe, "image", thumb)
                recipe.save(update_fields=["image"])
                if cutouts:
                    apply_recipe_image_cutout(recipe)

        return True

    def _resolve_ingredient(
        self,
        name: str,
        *,
        update: bool,
        with_images: bool,
        cutouts: bool,
        force_refresh_images: bool,
    ) -> Ingredient:
        key = name.strip().lower()
        if key in self._name_cache:
            return self._name_cache[key]

        try:
            data = self._get("search.php", {"i": name})
        except requests.RequestException:
            data = {}

        rows = data.get("ingredients") or []
        row = rows[0] if rows else None
        ext_id = str(row["idIngredient"]) if row else None

        if ext_id:
            hit = IngredientExternalRef.objects.filter(
                source_key=self.source_key,
                external_id=ext_id,
            ).select_related("ingredient").first()
            if hit:
                ing = hit.ingredient
                if update and row:
                    _apply_api_row_to_ingredient(ing, row)
                    ing.save()
                    hit.metadata = _ingredient_metadata(row)
                    hit.save(update_fields=["metadata", "updated_at"])
                self._maybe_fetch_ingredient_image(
                    ing,
                    name,
                    with_images=with_images,
                    cutouts=cutouts,
                    force_refresh=force_refresh_images,
                )
                self._name_cache[key] = ing
                return ing

        existing = Ingredient.objects.filter(name__iexact=name.strip()).first()
        if existing:
            if update and row:
                _apply_api_row_to_ingredient(existing, row)
                existing.save()
            if ext_id:
                ref_obj, created = IngredientExternalRef.objects.get_or_create(
                    source_key=self.source_key,
                    external_id=ext_id,
                    defaults={
                        "ingredient": existing,
                        "metadata": _ingredient_metadata(row) if row else {},
                    },
                )
                if not created and row:
                    ref_obj.metadata = _ingredient_metadata(row)
                    ref_obj.save(update_fields=["metadata", "updated_at"])
            self._maybe_fetch_ingredient_image(
                existing,
                name,
                with_images=with_images,
                cutouts=cutouts,
                force_refresh=force_refresh_images,
            )
            self._name_cache[key] = existing
            return existing

        ing_type = _map_ingredient_type(row.get("strType") if row else None)
        desc = ""
        abv_val = None
        if row:
            desc = (row.get("strDescription") or "").strip()
            if row.get("strABV"):
                try:
                    abv_val = Decimal(str(row["strABV"]))
                except (InvalidOperation, ValueError):
                    abv_val = None

        ing = Ingredient.objects.create(
            name=name.strip()[:200],
            slug=_allocate_slug(Ingredient, name, max_len=200),
            type=ing_type,
            description=desc,
            abv=abv_val,
        )

        if ext_id:
            IngredientExternalRef.objects.create(
                ingredient=ing,
                source_key=self.source_key,
                external_id=ext_id,
                metadata=_ingredient_metadata(row) if row else {},
            )

        self._maybe_fetch_ingredient_image(
            ing,
            name,
            with_images=with_images,
            cutouts=cutouts,
            force_refresh=True,
        )

        self._name_cache[key] = ing
        return ing

    def _maybe_fetch_ingredient_image(
        self,
        ing: Ingredient,
        name: str,
        *,
        with_images: bool,
        cutouts: bool,
        force_refresh: bool,
    ) -> None:
        if not with_images:
            return
        need_download = force_refresh or not ing.image
        downloaded = False
        if need_download:
            url = _ingredient_thumb_url(name)
            if download_into_image_field(ing, "image", url):
                ing.save(update_fields=["image"])
                downloaded = True
        if cutouts and ing.image and downloaded:
            apply_ingredient_image_cutout(ing)
