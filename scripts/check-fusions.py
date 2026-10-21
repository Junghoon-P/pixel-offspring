from pathlib import Path
from PIL import Image
import hashlib
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
catalog = (root / 'src/domain/catalog.ts').read_text().split('export const COMIC_NAMES')[0]
bodies = sorted(re.findall(r'^  (\w+):', catalog, re.M))
assert len(bodies) == 20
pairs = {'-'.join(sorted((a, b))) for i, a in enumerate(bodies) for b in bodies[i:]}
expected = pairs
files = {path.stem: path for path in (root / 'public/creatures/v5/fusions').glob('*.png')}
missing = sorted(expected - files.keys())
assert not missing, f'{len(missing)} missing fusion portraits: {missing}'
assert files.keys() == expected, 'Unexpected fusion files'
sizes = {}
hashes = set()
for key, path in sorted(files.items()):
    image = Image.open(path)
    assert image.mode == 'RGBA', key
    assert image.getchannel('A').getextrema() == (0, 255), key
    assert image.getpixel((0, 0))[3] <= 1 and image.getbbox(), key
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest not in hashes, f'Duplicate portrait: {key}'
    hashes.add(digest)
    sizes[key] = list(image.size)
manifest = root / 'src/domain/memeFusionSizes.json'
legacy_sizes = {path.stem: list(Image.open(path).size) for path in
                sorted((root / 'public/creatures/v4/fusions').glob('*.png'))}
legacy_manifest = root / 'src/domain/fusionSizes.json'
if '--write-sizes' in sys.argv:
    manifest.write_text(json.dumps(sizes, separators=(',', ':')) + '\n')
    legacy_manifest.write_text(json.dumps(legacy_sizes, separators=(',', ':')) + '\n')
else:
    assert json.loads(manifest.read_text()) == sizes, 'Fusion source dimensions differ'
    assert json.loads(legacy_manifest.read_text()) == legacy_sizes, 'Legacy fallback metadata differs'
assert len(files) == 210
print(f'{len(files)} unique v5 portraits; alpha and source dimensions passed. {len(legacy_sizes)} existing v4 portraits preserved; other legacy fusions use v5.')
