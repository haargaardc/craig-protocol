#!/usr/bin/env python3
"""Generate the PWA / iOS home-screen icons with zero dependencies.

Draws a kettlebell mark (the Craig Protocol's signature movement) in the app's
sea-green over the deep-navy brand background. Pure stdlib PNG writer so this
runs anywhere Python 3 is installed — no Pillow required.
"""
import struct
import zlib
import os

# ---- Brand palette (matches src/App.jsx design tokens) ----
DEEP = (0x0A, 0x18, 0x26)   # background
SEA  = (0x39, 0xC4, 0xB6)   # mark

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")


def blend(bg, fg, a):
    return tuple(round(bg[i] * (1 - a) + fg[i] * a) for i in range(3))


def coverage(cx, cy, px, py, r, aa=0.9):
    """Anti-aliased inside/outside test for a circle of radius r."""
    d = ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5
    return max(0.0, min(1.0, (r - d) / aa + 0.5))


def draw(size, maskable=False):
    # Safe zone: maskable icons get extra padding so the OS mask never clips.
    pad = 0.16 if maskable else 0.12
    lo, span = pad, 1 - 2 * pad

    cx = 0.5 * size
    bell_cy = (lo + 0.62 * span) * size
    bell_r = 0.34 * span * size
    handle_cy = (lo + 0.24 * span) * size
    handle_outer = 0.26 * span * size
    handle_inner = 0.155 * span * size

    px = bytearray()
    for y in range(size):
        px.append(0)  # PNG filter byte (none) per scanline
        for x in range(size):
            fx, fy = x + 0.5, y + 0.5
            # kettlebell = filled bell circle UNION top arc of a ring
            a_bell = coverage(cx, bell_cy, fx, fy, bell_r)
            d_h = ((fx - cx) ** 2 + (fy - handle_cy) ** 2) ** 0.5
            ring = 0.0
            if fy <= bell_cy:  # only the upper handle loop
                outer = max(0.0, min(1.0, (handle_outer - d_h) / 0.9 + 0.5))
                inner = max(0.0, min(1.0, (d_h - handle_inner) / 0.9 + 0.5))
                ring = min(outer, inner)
            a = max(a_bell, ring)
            r, g, b = blend(DEEP, SEA, a)
            px.extend((r, g, b))
    return _png(size, bytes(px))


def _chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data +
            struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))


def _png(size, raw):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    idat = zlib.compress(raw, 9)
    return sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b"")


def main():
    os.makedirs(OUT, exist_ok=True)
    targets = [
        ("pwa-192.png", 192, False),
        ("pwa-512.png", 512, False),
        ("maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, False),  # iOS home screen
        ("favicon-32.png", 32, False),
    ]
    for name, size, maskable in targets:
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(draw(size, maskable))
        print(f"wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
