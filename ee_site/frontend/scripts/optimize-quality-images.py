"""Optional asset regeneration; requires Pillow 12.3.0, not an app dependency."""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parent.parent / 'src/assets'
for name in ('hero.jpg', 'bmk-gigaterm-hero.png', 'btp-energolain-hero.png',
             'vns-aquarus-hero.png', 'pns-fire-hero.jpg', 'automation-cabinets-hero.png'):
    source = assets / name
    image = Image.open(source)
    if image.getexif().get(274, 1) != 1:
        raise ValueError(f'Handle EXIF orientation explicitly before converting {name}')
    destination = source.with_suffix('.webp')
    image.save(destination, quality=92, method=6, exact=True,
               icc_profile=image.info.get('icc_profile', b''))
    converted = Image.open(destination)
    assert converted.size == image.size
    if 'A' in image.getbands():
        assert converted.getchannel('A').tobytes() == image.getchannel('A').tobytes()
    print(f'{name}: {source.stat().st_size} -> {destination.stat().st_size} bytes')

# Responsive derivatives keep the same composition; full-resolution files remain.
for name, widths in (('hero.jpg', (480, 780)), ('btp-energolain-hero.png', (720,))):
    image = Image.open(assets / name)
    for width in widths:
        height = round(image.height * width / image.width)
        destination = assets / f'{Path(name).stem}-{width}.webp'
        image.resize((width, height), Image.Resampling.LANCZOS).save(
            destination, quality=92, method=6, exact=True,
            icc_profile=image.info.get('icc_profile', b''))
        print(f'{destination.name}: {width}x{height}, {destination.stat().st_size} bytes')
