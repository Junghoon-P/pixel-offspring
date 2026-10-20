"""Generated face sheet → fixed runtime grid; no painted or synthesized pixels."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
folder = root / 'public/creatures/v2'
reference = Image.open(root / 'docs/reference/assets/pixel-family-concept.png').convert('RGB')
palette = reference.quantize(colors=96).getpalette()[:288]
colors = [tuple(palette[i:i + 3]) for i in range(0, len(palette), 3)]
parts = [('source-faces.png', 0, 'happy', (20, 10)), ('source-faces.png', 1, 'sleepy', (20, 10)), ('source-blankets.png', 0, 'blanket-snail', (48, 40)), ('source-blankets.png', 1, 'blanket', (48, 40))]
for filename, index, name, size in parts:
    sheet = Image.open(folder / filename).convert('RGBA')
    part = sheet.crop((index * sheet.width // 2, 0, (index + 1) * sheet.width // 2, sheet.height))
    part.putalpha(part.getchannel('A').point(lambda alpha: 255 if alpha >= 180 else 0))
    part = part.crop(part.getbbox()).resize(size, Image.Resampling.NEAREST)
    part.putdata([(*min(colors, key=lambda c: sum((a-b)**2 for a,b in zip((r,g,b),c))), alpha) for r,g,b,alpha in part.getdata()])
    canvas = Image.new('RGBA', (64, 64))
    canvas.paste(part, (0, 0))
    canvas.save(folder / f'{name}.png')
