#!/usr/bin/env python3
"""
Rebuild frontend/public/images/logo-hero.png from the high-res source in Downloads.

1) Edge-connected flood fill: very dark pixels touching the image border → transparent.
2) Interior cleanup: remaining opaque pixels that are still "neutral near-black"
   (low max channel + low chroma) → transparent, so enclosed pockets between gold
   borders and inside the flask can clear without nuking saturated gold/greens.

Requires: pip install Pillow
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

# Tunables
SRC = Path.home() / "Downloads" / "high res logo.png"
DST = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images" / "logo-hero.png"
MAX_SIDE = 768
RGB_EDGE_MAX = 58  # edge flood: max(R,G,B) <= this, connected to border
RGB_INNER_MAX = 64  # second pass: remove enclosed dark neutrals
CHROMA_INNER_MAX = 30  # max(R,G,B) - min(R,G,B) <= this → treat as neutral dark


def rgb_max(r: int, g: int, b: int) -> int:
    return max(r, g, b)


def rgb_min(r: int, g: int, b: int) -> int:
    return min(r, g, b)


def edge_flood_transparent(rgb: Image.Image, edge_threshold: int) -> Image.Image:
    """Return RGBA: pixels edge-connected with max RGB <= threshold become transparent."""
    w, h = rgb.size
    px = rgb.load()
    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if x < 0 or x >= w or y < 0 or y >= h:
            return
        i = y * w + x
        if visited[i]:
            return
        r, g, b = px[x, y]
        if rgb_max(r, g, b) > edge_threshold:
            return
        visited[i] = 1
        q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            push(nx, ny)

    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            i = y * w + x
            if visited[i]:
                opx[x, y] = (r, g, b, 0)
            else:
                opx[x, y] = (r, g, b, 255)
    return out


def inner_dark_cleanup(im: Image.Image) -> Image.Image:
    """Remove enclosed near-black neutral pixels (still opaque)."""
    w, h = im.size
    px = im.load()
    out = im.copy()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = opx[x, y]
            if a < 128:
                continue
            mx = rgb_max(r, g, b)
            chroma = mx - rgb_min(r, g, b)
            if mx <= RGB_INNER_MAX and chroma <= CHROMA_INNER_MAX:
                opx[x, y] = (r, g, b, 0)
    return out


def main() -> int:
    if not SRC.is_file():
        print(f"Missing source image: {SRC}", file=sys.stderr)
        return 1

    rgb = Image.open(SRC).convert("RGB")
    rgb.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)

    rgba = edge_flood_transparent(rgb, RGB_EDGE_MAX)
    rgba = inner_dark_cleanup(rgba)

    DST.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(DST, format="PNG", optimize=True, compress_level=9)
    print(f"Wrote {DST} ({rgba.size[0]}x{rgba.size[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
