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

v4_files = list((root / 'public/creatures/v4').glob('*.png'))
assert len(v4_files) == 28
for path in v4_files:
    image = Image.open(path)
    assert image.mode == 'RGBA', path.name
    low, high = image.getchannel('A').getextrema()
    assert low == 0 and high >= 250, path.name
    assert image.getpixel((0, 0))[3] == 0, path.name
    assert image.getbbox(), path.name
print('28 v4 portraits: RGBA transparency, transparent corner and nonempty content passed.')

expected_costumes = {"capybara-frog", "duck-cat", "hamster-potato", "raccoon-penguin",
                     "axolotl-sloth", "mushroom-bird", "snail-dragon", "ghost-jelly"}
costumes = list((root / 'public/creatures/v4/costumes').glob('*.png'))
assert {path.stem for path in costumes} == expected_costumes
for path in costumes:
    image = Image.open(path)
    assert image.size == (1254, 1254), path.name
    assert image.mode == 'RGBA', path.name
    assert image.getchannel('A').getextrema() == (0, 255), path.name
    # 생성 PNG의 알파 1/255 잔여값은 육안상 투명하며 불투명 배경과 구분한다.
    assert image.getpixel((0, 0))[3] <= 1 and image.getbbox(), path.name
print('8 costume portraits: exact set, dimensions and transparency passed.')

personality = list((root / 'public/creatures/v4/personality').glob('*.png'))
assert {path.stem for path in personality} == {'cat', 'frog', 'potato', 'mushroom', 'jelly', 'raccoon', 'ghost'}
for path in personality:
    image = Image.open(path)
    assert image.size == (1254, 1254) and image.mode == 'RGBA', path.name
    assert image.getchannel('A').getextrema() == (0, 255), path.name
    assert image.getpixel((0, 0))[3] <= 1 and image.getbbox(), path.name
print('7 personality portraits: exact set, dimensions and transparency passed.')
