from PIL import Image
from pathlib import Path
root = Path(__file__).resolve().parents[1]
count = 0
for version, expected in [('v1', 13), ('v2', 4), ('v3', 7)]:
    files = [p for p in (root / 'public/creatures' / version).glob('*.png') if not p.name.startswith('source-')]
    assert len(files) == expected
    for p in files:
        image = Image.open(p)
        assert image.size == (64, 64), p.name
        assert image.mode == 'RGBA', p.name
        assert set(image.getchannel('A').getdata()) == {0, 255}, p.name
        assert image.getbbox(), p.name
    count += len(files)
for name in ['happy', 'sleepy']:
    face = Image.open(root / f'public/creatures/v2/{name}.png')
    for box in [(0, 0, 9, 8), (11, 0, 20, 8)]:
        dark = sum(1 for r, g, b, a in face.crop(box).getdata() if a and max(r, g, b) < 130)
        assert dark >= 6, (name, box, dark)
print(f'{count} PNG parts: dimensions, binary alpha, nonempty content and both eyes passed.')
