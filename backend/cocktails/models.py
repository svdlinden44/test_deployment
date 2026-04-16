from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill, ResizeToFit


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    class IngredientType(models.TextChoices):
        SPIRIT = "spirit", "Spirit"
        LIQUEUR = "liqueur", "Liqueur"
        WINE = "wine", "Wine / Vermouth"
        BEER = "beer", "Beer / Cider"
        MIXER = "mixer", "Mixer / Soda"
        JUICE = "juice", "Juice"
        SYRUP = "syrup", "Syrup / Sweetener"
        BITTER = "bitter", "Bitters"
        GARNISH = "garnish", "Garnish"
        DAIRY = "dairy", "Dairy / Egg"
        OTHER = "other", "Other"

    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    type = models.CharField(max_length=20, choices=IngredientType.choices)
    description = models.TextField(blank=True)
    abv = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Alcohol by volume (%)",
    )
    image = models.ImageField(upload_to="ingredients/", blank=True)
    image_card = ImageSpecField(
        source="image",
        processors=[ResizeToFill(400, 400)],
        format="WEBP",
        options={"quality": 80},
    )

    class Meta:
        ordering = ["type", "name"]

    def __str__(self):
        return self.name


class Recipe(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"
        EXPERT = "expert", "Expert"

    class GlassType(models.TextChoices):
        COUPE = "coupe", "Coupe"
        ROCKS = "rocks", "Rocks / Old Fashioned"
        HIGHBALL = "highball", "Highball / Collins"
        MARTINI = "martini", "Martini"
        FLUTE = "flute", "Champagne Flute"
        TIKI = "tiki", "Tiki Mug"
        HURRICANE = "hurricane", "Hurricane"
        COPPER = "copper", "Copper Mug"
        WINE = "wine", "Wine Glass"
        SHOT = "shot", "Shot Glass"
        SNIFTER = "snifter", "Snifter"
        OTHER = "other", "Other"

    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=250, unique=True)
    description = models.TextField(help_text="Short intro shown in cards and search results")
    instructions = models.TextField(help_text="Step-by-step preparation instructions")
    history = models.TextField(blank=True, help_text="Origin story behind the cocktail")
    image = models.ImageField(upload_to="recipes/", blank=True)
    image_card = ImageSpecField(
        source="image",
        processors=[ResizeToFill(400, 400)],
        format="WEBP",
        options={"quality": 80},
    )
    image_hero = ImageSpecField(
        source="image",
        processors=[ResizeToFit(1200, 800)],
        format="WEBP",
        options={"quality": 85},
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recipes",
    )
    ingredients = models.ManyToManyField(
        Ingredient,
        through="RecipeIngredient",
        related_name="recipes",
    )

    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
    )
    glass_type = models.CharField(
        max_length=20,
        choices=GlassType.choices,
        default=GlassType.ROCKS,
    )
    prep_time_minutes = models.PositiveSmallIntegerField(
        default=5,
        help_text="Estimated preparation time in minutes",
    )
    is_alcoholic = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Show on the homepage")
    is_published = models.BooleanField(default=True)

    gallery = GenericRelation("Image", related_query_name="recipe")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_recipes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def average_rating(self):
        avg = self.ratings.aggregate(models.Avg("score"))["score__avg"]
        return round(avg, 1) if avg else None

    @property
    def rating_count(self):
        return self.ratings.count()


class RecipeIngredient(models.Model):
    class Unit(models.TextChoices):
        OZ = "oz", "oz"
        ML = "ml", "ml"
        CL = "cl", "cl"
        DASH = "dash", "dash(es)"
        DROP = "drop", "drop(s)"
        TSP = "tsp", "teaspoon(s)"
        TBSP = "tbsp", "tablespoon(s)"
        CUP = "cup", "cup(s)"
        PIECE = "piece", "piece(s)"
        SLICE = "slice", "slice(s)"
        SPRIG = "sprig", "sprig(s)"
        WEDGE = "wedge", "wedge(s)"
        WHOLE = "whole", "whole"
        BARSPOON = "barspoon", "barspoon(s)"
        RINSE = "rinse", "rinse"
        TOP = "top", "top off"
        TO_TASTE = "to_taste", "to taste"

    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="recipe_ingredients")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name="recipe_uses")
    quantity = models.CharField(max_length=20, blank=True, help_text="e.g. 2, 1.5, 1/2")
    unit = models.CharField(max_length=20, choices=Unit.choices, blank=True)
    notes = models.CharField(max_length=200, blank=True, help_text="e.g. 'freshly squeezed', 'chilled'")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]
        unique_together = [("recipe", "ingredient")]

    def __str__(self):
        parts = [self.quantity, self.get_unit_display(), str(self.ingredient)]
        return " ".join(p for p in parts if p)


class Rating(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings")
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("recipe", "user")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} → {self.recipe} ({self.score}★)"


class Comment(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} on {self.recipe} ({self.created_at:%Y-%m-%d})"


class Bar(models.Model):
    name = models.CharField(max_length=250)
    slug = models.SlugField(max_length=250, unique=True)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    website = models.URLField(blank=True)
    image = models.ImageField(upload_to="bars/", blank=True)
    image_card = ImageSpecField(
        source="image",
        processors=[ResizeToFill(400, 400)],
        format="WEBP",
        options={"quality": 80},
    )
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)

    gallery = GenericRelation("Image", related_query_name="bar")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        parts = [self.name]
        if self.city:
            parts.append(self.city)
        return " — ".join(parts)


class Image(models.Model):
    """Reusable image model -- attach to any model via GenericForeignKey."""

    file = models.ImageField(upload_to="gallery/%Y/%m/")
    file_card = ImageSpecField(
        source="file",
        processors=[ResizeToFill(400, 400)],
        format="WEBP",
        options={"quality": 80},
    )
    file_full = ImageSpecField(
        source="file",
        processors=[ResizeToFit(1600, 1200)],
        format="WEBP",
        options={"quality": 85},
    )

    caption = models.CharField(max_length=300, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return self.caption or f"Image #{self.pk}"
