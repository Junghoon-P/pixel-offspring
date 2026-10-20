"""Normalize generated covered-body sprites without painting new artwork."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
folder = root / 'public/creatures/v3'
sheet = Image.open(folder / 'source-covered.png').convert('RGBA')
reference = Image.open(root / 'docs/reference/assets/pixel-family-concept.png').convert('RGB')
palette = reference.quantize(colors=96).getpalette()[:288]
colors = [tuple(palette[i:i+3]) for i in range(0,len(palette),3)]
for index, (name, size) in enumerate([('snail',(54,36)),('ghost',(52,36)),('jelly',(54,30))]):
    part = sheet.crop((index*sheet.width//3,0,(index+1)*sheet.width//3,sheet.height))
    part.putalpha(part.getchannel('A').point(lambda a:255 if a>=180 else 0))
    part = part.crop(part.getbbox()).resize(size,Image.Resampling.NEAREST)
    part.putdata([(*min(colors,key=lambda c:sum((a-b)**2 for a,b in zip((r,g,b),c))),alpha) for r,g,b,alpha in part.getdata()])
    canvas = Image.new('RGBA',(64,64))
    canvas.paste(part,((64-size[0])//2,60-size[1]))
    canvas.save(folder/f'{name}-blanket.png')
for name in ['happy','sleepy']:
    for body, size in [('snail',(16,8)),('ghost',(18,9))]:
        part = Image.open(root/f'public/creatures/v2/{name}.png').crop((0,0,20,10)).resize(size,Image.Resampling.NEAREST)
        canvas = Image.new('RGBA',(64,64))
        canvas.paste(part,(0,0))
        canvas.save(folder/f'{name}-{body}.png')
