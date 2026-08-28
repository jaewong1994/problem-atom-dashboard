from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "pwa"
OUT.mkdir(parents=True, exist_ok=True)


def font(size: int):
    for path in (Path(r"C:\Windows\Fonts\georgiab.ttf"), Path(r"C:\Windows\Fonts\timesbd.ttf")):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def make_icon(size: int, filename: str, maskable: bool = False):
    scale = 4
    canvas = size * scale
    image = Image.new("RGB", (canvas, canvas), "#0d7469")
    draw = ImageDraw.Draw(image)
    inset = int(canvas * (0.19 if maskable else 0.11))
    cx = cy = canvas // 2
    orbit = canvas * (0.28 if maskable else 0.34)
    pale = "#63c7ba"
    for angle, width in ((-26, 5), (35, 4)):
        box = (cx - orbit, cy - orbit * 0.55, cx + orbit, cy + orbit * 0.55)
        layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.ellipse(box, outline=pale, width=width * scale)
        layer = layer.rotate(angle, center=(cx, cy), resample=Image.Resampling.BICUBIC)
        image.paste(layer, (0, 0), layer)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((inset, inset, canvas - inset, canvas - inset), radius=int(canvas * 0.18), outline="#a9e0d9", width=3 * scale)
    text = "PA"
    face = font(int(canvas * (0.34 if maskable else 0.38)))
    bounds = draw.textbbox((0, 0), text, font=face)
    tw, th = bounds[2] - bounds[0], bounds[3] - bounds[1]
    draw.text((cx - tw / 2, cy - th / 2 - bounds[1]), text, font=face, fill="white")
    image.resize((size, size), Image.Resampling.LANCZOS).save(OUT / filename, optimize=True)


make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(512, "icon-maskable-512.png", maskable=True)
make_icon(180, "apple-touch-icon.png")
print(f"PWA icons created in {OUT}")
