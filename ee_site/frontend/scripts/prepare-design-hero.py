"""EXIF-aware responsive WebP for the drawing; keep the source JPEG unchanged.

Run with the backend Pillow dependency. No cropping, sharpening, or upscaling.
Lossless encoding preserves the resized drawing's fine lines and labels.
"""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
source = root / "src/assets/service-design-hero.jpg"
output = root / "src/assets/services/design"
output.mkdir(parents=True, exist_ok=True)
with Image.open(source) as original:
    image = ImageOps.exif_transpose(original).convert("RGB")
    for width in (480, 960, 1536):
        if width > image.width:
            raise ValueError("Do not upscale the drawing")
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        path = output / f"design-{width}.webp"
        resized.save(path, "WEBP", lossless=True, method=6)
        print(f"{path.name}: {width}x{height}, {path.stat().st_size} bytes")
