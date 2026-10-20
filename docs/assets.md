# 캐릭터 에셋

원본 콘셉트: 사용자가 제공한 docs/reference/assets/pixel-family-concept.png.
제작: 2026-10-20 내장 image_gen 도구. 원본 생성 결과는 public/creatures/v1/source-sheet.png에 보존.

생성 프롬프트: 참조 이미지의 스타일·팔레트만 사용, 투명 4열×3행 시트, 얼굴 없는 달팽이/유령/젤리/새/용, 독립 happy/sleepy 얼굴, flame/blanket/sparkles/leaves 장식. 동일 64px 격자, 짙은 자주 외곽선, 텍스트·배경 없음. 얼굴·장식은 분리해서 생성하도록 요청.

시트의 실제 행 경계가 균등하지 않아 prepare-assets.py에서 각 파츠의 실제 경계 상자로 분리했다(스크립트 bounds 참조). 알파 임계값 180, nearest-neighbor 축소, 원본 콘셉트에서 추출한 96색 팔레트에 정규화했다. 달팽이 이불은 얼굴·나선을 가리지 않는 별도 호환 변형이다. 앵커는 src/components/renderCreature.ts에 있다.

초기v1 에셋: 몸통 6, 표정 2, 장식 4 + 달팽이 이불 변형 1 = 투명 PNG 13개. 부모 답변 64패턴과 4096쌍 레시피를 지원한다. 최초 제안의 표정 8·장식 12·팔레트 8세트는 제작 목표였으며 이번 구현에서는 단일 승인 참조 팔레트와 2/4 파츠로 범위를 줄였다. 수량을 완성했다고 주장하지 않는다.

/gallery에서 64패턴과 고정 12쌍을 실제 공통 렌더러로 확인한다. 얼굴은 몸통별 앵커, 불꽃과 새싹은 같은 head 슬롯이므로 동시에 물려받지 않는다. 이불은 달팽이/유령/젤리에서만 허용한다. 생성형 API는 사용자 요청 처리에 사용하지 않는다.

출처는 사용자 시안 + 이 프로젝트용 AI 생성이며 제3자 스프라이트팩을 사용하지 않았다. AI 산출물의 독점권·법적 권리를 별도 검증한 것은 아니다. 생성 원본과 가공 스크립트, 팔레트를 함께 보존한다.

## v2 이력 — 사용자 검수에서 이불 재작업 결정

눈 2종과 이불 2종을 imagegen으로 새로 만들었으며 원본은 public/creatures/v2/source-faces.png 및 source-blankets.png에 있다. prepare-character-v2.py는 원본 분리·알파 이진화·최근접 축소·기존 콘셉트 팔레트 정규화만 수행한다. 몸통 6종과 불꽃/새싹/반짝임은 v1 파일을 재사용한다.

표정은 20×10 파츠이며 몸통에 따라 최종18×10 또는20×10로 표시한다. 합성 순서는 몸통→이불→얼굴→머리/주변 장식이고 좌표는 creatureLayout.ts에 있다. 당시 새 부모의 assetVersion은2, 새 자식은 몸통 부모의 버전을 따른다. 기존 저장 결과의 v1 에셋·좌표·레이어 순서를 유지한다. 혼합 버전에서 표정 스타일이 몸통 버전으로 정규화되는 제약은 별도 감사 문서에 기록했다.

**사용자 검수에서 달팽이 이불의 ‘몸을 덮는’ 의미가 충족되지 않은 것으로 확인됐다.** v2는 완료된 아트가 아니다. docs/character-audit.md의 수정 항목과 승인 기준을 적용한다. 갤러리의 버전 선택은 비교용이며 기존 저장 데이터를 변경하지 않는다.

## v3 적용

- 원본 `public/creatures/v3/source-covered.png`는 사용자 원본 시안과 v1몸통을 참조해 imagegen으로 생성했다. 프롬프트 핵심: 세 몸통 전체가 두꺼운 민트 별무늬 천에 실제로 덮인 모습, 달팽이 등껍질은 일부만 노출, 얼굴/불꽃/주변 장식 제외, 투명 배경·짙은 자주 윤곽선.
- `prepare-character-v3.py`는3열 분리·실제 경계 추출·알파 이진화·기존 팔레트 정규화·최종64px 좌표 배치와 얼굴 크기 정규화를 수행한다.
- 이불은 몸통과 함께 그린 착용 파츠3종(snail/ghost/jelly-blanket). 천의 앞뒤 관계를 에셋에 확정하고 얼굴과 머리 장식은 별도로 유전한다. 원래 몸통 파츠ID와 착용 상태로 조합하므로 이불을 벗은 모습도 유지한다.
- v3 PNG7개(착용 몸통3, 달팽이/유령 전용 표정4). 단순 별 모양 반짝임은 코드 기반8×12 SVG1개로 제작했다. 전체 PNG24개, 원본 시트는 런타임 수량에서 제외한다.
- v3 레이아웃은 모든 파츠를1:1픽셀로 배치하고 화면은 정수 배율로 확대한다. 이불 또는 용의 머리 장식은 몸 뒤에 배치해 천/뿔이 뿌리를 가린다. 반짝임은 더듬이 반대쪽 여백을 사용한다.
- v1/v2 렌더링은 유지한다. 혼합 버전 조합은 몸통 부모 버전의 그림체로 맞췄다는 설명을 표시한다. 원본 이미지3종의 조형은 각각 다르며 범용이불을 늘려 쓰지 않는다.
- 84개 최종 v3검수와 공유PNG를 확인했다. 사용자 최종 아트 선호 승인을 자동 테스트 통과와 동일시하지 않는다.


## v4 · 독립 캐릭터 16종과 전용 혼합 3종

내장 imagegen으로 개별 투명 PNG를 생성하고 선택한 원본을 `public/creatures/v4/`에 보존했다. CLI/API 우회와 새 라이브러리는 사용하지 않았다. 콘셉트 보드는 `docs/design/character-v4-comic-concepts.png`다.

공통 생성 프롬프트: single original funny game character sprite, full centered silhouette with transparent margin, chunky pixel art, dark plum outlines, muted cream/mint/lavender/coral palette, clear correctly placed eyes and mouth, no text, no scenery, no glow. 각 파일의 구체적인 피사체/소품 프롬프트는 다음과 같다.

| 파일 | 피사체·행동·소품 |
|---|---|
| capybara.png | 귤을 머리에 얹고 작은 목욕통에서 쉬는 무표정 카피바라 |
| frog.png | 큰 다크서클과 졸린 눈, 두 손으로 큰 커피 컵을 든 개구리 |
| duck.png | 식빵 구멍에 몸이 끼어 날개만 펼친 오리 |
| cat.png | 너무 작은 상자 밖으로 볼과 몸이 넘치는 불만스러운 고양이 |
| hamster.png | 과도하게 부푼 볼주머니, 씨앗 하나를 붙드는 초조한 햄스터 |
| potato.png | 비뚤어진 넥타이를 매고 앉아 멍한 눈으로 바라보는 감자 |
| ghost.png | 청소기 줄에 엉킨 채 노즐을 잡고 놀란 유령 |
| jelly.png | 접시 위로 녹아내리며 백기를 흔드는 젤리. 외부 번짐 제거 편집 적용 |
| snail.png | 등껍질에 택배 세 개를 묶은 배달 달팽이. 수정 프롬프트: 머리의 중복 눈 두 개 제거, 더듬이 끝 눈 두 개와 입만 유지 |
| dragon.png | 마시멜로 하나에 작은 불을 뿜으려고 볼을 부풀린 초보 용 |
| mushroom.png | 자기 갓 위에 우산을 하나 더 쓰고 장화를 신은 걱정 많은 버섯 |
| bird.png | 자기보다 큰 쿠키를 붙들고 몸을 기울인 작은 새 |
| raccoon.png | 대야에서 솜사탕을 씻다가 녹아버려 놀란 라쿤 |
| penguin.png | 큰 안전모를 쓰고 스케이트 옆에서 엉덩방아를 찧은 펭귄 |
| axolotl.png | 물안경과 오리 튜브를 착용한 우파루파 |
| sloth.png | 잠옷 차림으로 알람시계 세 개를 안고 졸고 있는 나무늘보 |
| mushroom-bird.png | 무거운 버섯 갓 아래에서 날개를 퍼덕이지만 날지 못하는 새 |
| snail-dragon.png | 용 머리·달팽이 껍질·짧은 발, 껍질 배기구에서 작은 불꽃이 나는 초저속 용 |
| ghost-jelly.png | 푸딩 외피 안에 갇혀 손으로 벽을 밀며 놀란 유령 |

생성 원본은 비정형 크기이므로 `creatureLayoutV4.ts`의 source 영역에 실제 PNG 크기를 기록했다. 파일 헤더와 좌표 일치 테스트가 잘못된 크롭을 차단한다. 공통 렌더러는 비율을 유지해 128px 투명 캔버스에 정규화한 뒤 화면/공유 PNG에 같은 외형을 출력한다. 기존 v1~v3 레시피와 파츠 경로를 유지한다. v4 얼굴은 `signature`이며 범용 표정·장식을 중복해서 올리지 않는다.

실제 검수 증빙: `qa/character-v4-sixteen.png`, `qa/character-v4-card.png`.

## v4 2차 혼합·밈 확장 · 2026-10-20
내장 image_gen으로 개별 생성, 원본 PNG를 public/creatures/v4에 복사했다. 모두1254×1254 RGBA 투명 배경. 기존 에셋은 덮어쓰지 않았다.
공통 생성 지시: original funny pixel-art game creature, true transparent background, centered full body with margin, coherent anatomy, exactly two eyes on face, stepped dark plum outline, limited cream/mint/coral palette, readable at128px, no text/logos/checkerboard. 혼합은 두 동물을 별도로 배치하지 않고 신체 특징을 한 몸으로 결합했다.

| 파일 | 개별 생성 지시·기믹 |
| --- | --- |
| capybara-frog.png | capybara muzzle/round ears + frog green body/large hind legs/webbed feet; orange on head; relaxing in oversized coffee mug while holding tiny cup |
| duck-cat.png | cat ears/whiskers/striped tail + duck bill/wings/webbed feet; bread around neck and wedged in cardboard box |
| hamster-potato.png | lumpy potato body/sprout + hamster huge cheeks/round ears/paws; crooked office tie and briefcase, cheeks packed with seeds |
| raccoon-penguin.png | penguin oval body/beak/webbed feet + raccoon mask/ears/ringed tail; washing cotton candy on an ice floe |
| axolotl-sloth.png | axolotl pink gills/tail + sloth eye patches/long clawed arms; asleep hugging duck swim ring beside alarm clock |
| cucumber.png | existential cucumber; tall skinny elongated face, droopy yellowish eyes, long angular nose, tiny pursed mouth; slumped shoulders, loose tie and empty mug; coarse muted olive pixel art |
| broccoli.png | pretending everything is fine broccoli; broad floret head, stalk body, half-lidded tired eyes, forced sideways smile, sweat droplet, thumbs-up; coarse muted olive pixel art |

설문은16유형을 유지하며 새로 생성할 때 답변 강도로 두 후보를 선택한다. 0000유형에서energy=-1/3, expression=-1이면오이; 1101유형에서energy=1/3, expression=1이면브로콜리다. 나머지는기존16종매핑을 유지한다. 재시도/답변순서로바뀌지않으며 저장된레시피는재계산하지않는다.

## 첨부 캐릭터 추가 · 페페와 징징이
- 사용자 제공 참고 이미지 2장을 내장 image_gen의 참조로 사용했다. 오이·브로콜리와 별도 캐릭터이며 기존 PNG는 보존한다.
- `public/creatures/v4/pepe.png`: Pepe the Frog, reference face, wet half-lidded eyes, thick brown-orange lips, awkward reassuring smile, thumbs-up, pixel-art bust, transparent background, no grid/text. 최종 편집 프롬프트: preserve face/hand; replace chest below chin with opaque navy t-shirt, solid fill, no transparent holes. 실제 화면에서 발견한 목 아래 알파 결손을 이 편집으로 해결했다.
- `public/creatures/v4/squidward.png`: Squidward Tentacles, huge pale teal head, long drooping nose, tired yellow eyes, small pursed mouth, brown polo shoulders, pixel-art bust, transparent background, no grid/text.
- 두 파일 모두 1254×1254 RGBA. 원본 비율을 유지하는 기존 화면·PNG 공통 렌더러를 사용한다.
- 기존 16유형을 유지한다. 0101에서 energy=1/3·expression=1은 페페, 1000에서 energy=-1/3·expression=-1은 징징이. 기존 저장 레시피는 재계산하지 않는다.
- 전체 20종+전용 혼합 8종=28개. 서로 다른 190쌍 중 전용 혼합 8쌍, 나머지 182쌍은 기존 부모 외형 선택 방식이다.
## 코스튬 개정 생성 프롬프트 · 2026-10-20

내장 image_gen 사용. 개별 파일 8종은 `public/creatures/v4/costumes/`에 저장했다. 참고 이미지는 기존 16종 갤러리이며 조형·팔레트 안내에만 사용했다.

공통 프롬프트:

```
Create ONE cute funny game character sprite. Reference sheet is ONLY art direction and character identity guide, NOT a layout to copy. Chunky stepped pixel-art contours, dark plum outline, simple flat muted cream/mint/lavender/coral colors, rounded plush-like shapes, tiny clear face, readable at128px. Full centered character with 10% transparent margin, square image, true transparent background. Exactly one coherent animal body and one face. Costume is visibly sewn fabric with an open face hole; accessories are removable. NO fused species, NO second face, NO extra limbs, NO realistic skin/fur, NO detailed wrinkles, NO wet anatomy, NO scary eyes. No scenery, no captions, no text, no sheet/grid.
```

### capybara-frog.png

A small sleepy tan CAPYBARA wearing a mint-green FROG RAINCOAT. Capybara's normal broad tan muzzle and small black eyes fully visible through hood opening. Two simple sewn round frog-eye bumps on top of hood, small raincoat buttons. Short capybara paws and round body remain normal. Holds one tiny purple coffee cup. Deadpan relaxed expression; almost comically unprepared for rain. No frog legs or real frog eyeballs.

### duck-cat.png

A small cream DUCK wearing a lavender CAT HOOD with two triangular sewn ears. Duck's normal orange bill, two small sleepy eyes, cream cheeks fully visible in hood opening; ordinary duck wings and two orange webbed feet. Hoodie sits on a simple chubby duck torso. The duck looks proud to be disguised as a cat. NO whiskers on duck face, no real cat tail, no box or bread, no animal fusion.

### hamster-potato.png

A normal round peach HAMSTER with two round ears, small paws and gently puffed cheeks, wearing a removable tan POTATO-shaped soft pajama suit. Hamster face fully visible through fabric hood opening. Suit is smooth rounded potato shape with only three simple darker stitched dots, a tiny green sewn sprout on hood and a small crooked coral office tie. Small mitten-like hamster paws emerge from sleeves. Sleepy deadpan office pose. Clearly a hamster dressing as a potato, never potato flesh or body mutation. No textures, roots, wrinkles.

### raccoon-penguin.png

A normal small gray RACCOON with its own round ears, classic dark eye mask, short raccoon paws and a single short striped raccoon tail visible. Wearing a removable navy-and-cream PENGUIN HOODED CAPE. A small orange fabric triangle on top of hood identifies penguin costume but has NO extra face or eyes. Raccoon face fully visible in hood opening. Two tiny ordinary raccoon feet sticking out, no flippers or webbed feet. Calm proud expression with tiny smile, slightly awkward stiff standing pose. Cute simple plush-like costume. No cotton candy or washing tub.

### axolotl-sloth.png

A normal small pink AXOLOTL with exactly two eyes and symmetrical three soft pink external gill tufts on each side of head, short mitten paws and one simple tail. Wears a removable lavender nightcap with a small SLOTH-face embroidered patch, plus lavender star-print pajamas. Axolotl's own pink face unobstructed, absolutely NO sloth mask on its face, NO claws. Sleepy content closed eyes and tiny smile, hugs a small round alarm clock like a pillow. Nightcap tilted between gills, simplified smooth rounded silhouette. The sloth patch is tiny flat stitching, not a second creature.

### mushroom-bird.png

A normal tiny round cream BIRD with tiny orange beak, two small dot eyes, two normal feathered wings and two tiny orange bird feet. Wears a removable oversized lavender MUSHROOM HAT with large cream polka dots, thin cream brim and visible chin ribbon. Hat looks like a soft cloth bonnet, not growing from head; NO gills, NO realistic mushroom underside. Bird proudly tries to flap its short wings while hat tilts slightly. Simple cute softly silly expression, not straining or suffering. One bird only; no human hands or mushroom body.

### snail-dragon.png

A normal cute small mint-green baby DRAGON, standing on two short chubby feet with two short forepaws, one little tail, tiny folded wings and two tiny cream horns. Wearing a removable coral SNAIL-SHELL BACKPACK, clearly a fabric spiral round bag with visible lavender shoulder straps across the dragon chest and a small zipper pull. Backpack hangs behind side of dragon, NOT replacing dragon torso, NOT growing out of body. Dragon looks over shoulder at ridiculously large bag with mild deadpan surprise. No snail flesh or eyestalks, no fire or exhaust, no sharp claws. Rounded plush-like simple silhouette.

### ghost-jelly.png

One tiny friendly lavender GHOST with a simple rounded floating sheet body, two short rounded waving arms, two black dot eyes and a tiny smiling mouth. Wears a removable CARAMEL PUDDING HAT: a small cream fluted pudding-shaped fabric cap with smooth coral caramel crown, clear hat brim and small lavender chin ribbon. Ghost face completely exposed below hat; not trapped inside gelatin, not melting, no transparent belly, no dripping slime. Proud little wave like showing off a party hat. Smooth simple body ending in three rounded sheet scallops. No extra face on hat.
