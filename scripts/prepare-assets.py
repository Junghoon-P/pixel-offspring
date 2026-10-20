from PIL import Image
from pathlib import Path
from collections import Counter
import json
root=Path(__file__).resolve().parents[1]
reference=Image.open(root/'docs/reference/assets/pixel-family-concept.png').convert('RGB')
# The source palette is sampled, never invented; all sprites use the same finite palette.
palette=reference.quantize(colors=96).getpalette()[:288]
colors=[tuple(palette[i:i+3]) for i in range(0,len(palette),3)]
source=Image.open(root/'public/creatures/v1/source-sheet.png').convert('RGBA')
names=['snail','ghost','jelly','mushroom','bird','dragon','happy','sleepy','flame','blanket','sparkles','leaves']
sizes=[(54,44),(40,36),(46,32),(46,44),(40,36),(48,44),(18,8),(18,8),(16,20),(48,40),(10,16),(16,10)]
for index,(name,size) in enumerate(zip(names,sizes)):
    x,y=index%4,index//4
    bounds=[(30,125,360,415),(420,170,715,415),(750,200,1065,415),(1100,125,1415,415),(35,480,350,740),(375,435,715,740),(790,555,1040,695),(1140,555,1390,695),(85,810,280,1035),(360,760,750,1065),(865,800,990,975),(1165,845,1380,1000)]
    cell=source.crop(bounds[index])
    alpha=cell.getchannel('A').point(lambda a:255 if a>=180 else 0)
    cell.putalpha(alpha)
    bbox=alpha.getbbox()
    if not bbox: raise ValueError(name)
    sprite=cell.crop(bbox).resize(size,Image.Resampling.NEAREST)
    pixels=[]
    for r,g,b,a in sprite.getdata():
        color=min(colors,key=lambda c:(r-c[0])**2+(g-c[1])**2+(b-c[2])**2)
        pixels.append((*color,255 if a>=180 else 0))
    sprite.putdata(pixels)
    canvas=Image.new('RGBA',(64,64))
    if index<6: position=((64-size[0])//2,58-size[1])
    elif index<8: position=(0,0)
    elif name=='blanket': position=(6,18)
    else: position=(0,0)
    canvas.alpha_composite(sprite,position)
    canvas.save(root/f'public/creatures/v1/{name}.png')
    if name=='blanket':
        variant=Image.new('RGBA',(64,64))
        variant.alpha_composite(sprite.resize((42,30),Image.Resampling.NEAREST),(3,14))
        for px in range(35,64):
            for py in range(32,64): variant.putpixel((px,py),(0,0,0,0))
        variant.save(root/'public/creatures/v1/blanket-snail.png')
(root/'docs/palette.json').write_text(json.dumps({'source':'docs/reference/assets/pixel-family-concept.png','colors':['#%02x%02x%02x'%c for c in colors]},indent=2))
print('12 transparent 64x64 PNG parts normalized; sampled palette saved.')
