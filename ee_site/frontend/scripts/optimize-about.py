"""Generate full-frame public WebP copies; run with Pillow==12.3.0.

Original files are read-only inputs. EXIF orientation is applied before removing
metadata; embedded profiles are converted to sRGB. No generative processing.
"""
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

ROOT = Path(__file__).resolve().parents[1] / "src/assets/about"
SOURCES = ["DSC05801.jpg", "IMG_5539.jpg", "IMG_6486.JPG", "IMG_5858.png",
           "IMG_1497.png", "IMG_5629.jpg", "IMG_4442.JPG"]
OUTPUT = ROOT / "optimized"
OUTPUT.mkdir(exist_ok=True)
manifest = []
for source in SOURCES:
    path = ROOT / source
    with Image.open(path) as original:
        image = ImageOps.exif_transpose(original)
        profile = image.info.get("icc_profile")
        if profile:
            image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(io.BytesIO(profile)),
                                             ImageCms.createProfile("sRGB"), outputMode="RGB")
        else:
            image = image.convert("RGB")
        row = {"source": source, "sourceWidth": image.width, "sourceHeight": image.height,
               "sourceBytes": path.stat().st_size, "sourceSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
               "variants": {}}
        for role, limit, quality in [("small", 600, 82), ("page", 1200, 84), ("large", 2000, 87)]:
            copy = image.copy()
            copy.thumbnail((limit, limit), Image.Resampling.LANCZOS)
            # A fresh image has no EXIF, GPS, ICC or source metadata to propagate.
            clean = Image.new("RGB", copy.size)
            clean.paste(copy)
            target = OUTPUT / f"{path.stem.lower()}-{role}.webp"
            temporary = target.with_suffix('.tmp')
            clean.save(temporary, "WEBP", quality=quality, method=6, exact=True)
            temporary.replace(target)
            row["variants"][role] = {"file": target.name, "width": clean.width,
                                     "height": clean.height, "bytes": target.stat().st_size}
        manifest.append(row)
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"Generated {len(manifest) * 3} WebP files; originals unchanged.")
