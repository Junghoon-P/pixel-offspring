# 우리 무슨 조합?

각자 10문항·6성향 축으로 만든 캐릭터를 조합하고, 실제 선택 답변으로 잘 맞는 점과 조율할 점을 알아보는 모바일 웹 앱. Next.js App Router + React + TypeScript, Vercel + Neon PostgreSQL, Canvas 2D, Zod. 외부 이미지 생성 API는 앱 실행에 사용하지 않습니다.

## 실행

Node 22.18+와 pnpm 10을 사용합니다.

```sh
cd '/Users/junghoon-pullim/Desktop/Pullim/1. service/GitHub/pixel-offspring'
pnpm install --frozen-lockfile
pnpm dev
```

- 앱: http://127.0.0.1:5173
- 실제 파츠 64패턴/12쌍 검수: http://127.0.0.1:5173/gallery
- 로컬 PGlite PostgreSQL은 `.data/pglite`에 지속 저장됩니다. Neon 계정 없이 실행 가능합니다.
- 개발 Origin은 `http://127.0.0.1:5173`입니다. E2E는5174의 독립 서버와 메모리 DB를 자동 생성합니다.
- 원격 DB 비밀 없이 로컬 실행할 수 있습니다. 로컬 개발 서버를 외부에 공개하지 마세요.

## 검증

다음 검사를 실행합니다. E2E와 측정 명령은 먼저 pnpm build로 만든 Next 프로덕션 빌드에서 서버를 자동 생성합니다. E2E는 로컬 테스트 데이터를 생성·삭제·만료시킵니다. 운영 DB에서는 실행하지 않습니다.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm assets:check
pnpm e2e
pnpm measure
```

E2E는 설치된 Google Chrome을 사용합니다. Chrome이 없다면 Playwright Chromium을 설치하고 playwright.config.ts의 `channel: 'chrome'`을 제거하세요. Python 3 + Pillow는 파츠 재가공·검사에만 필요하며 앱 실행에는 필요하지 않습니다. 측정은 E2E와 동시에 실행하지 않습니다.

## 구현

- M1: 64패턴 성격 엔진, 부모 순서와 무관한 SHA-256 유전, 실제 투명 PNG 파츠, 데모·검수 갤러리.
- M2: 닉네임·12문항·16유형, 이전/다음, sessionStorage 초안, 제출 검증·실패 재시도.
- M3: PostgreSQL 저장, 해시 관리 토큰과 HttpOnly 쿠키, 다중 친구 초대, 멱등성 키, 쌍 고유 제약, 양쪽 결과 목록, 삭제·만료.
- M4: 저장 후 탄생 연출, reduced-motion·건너뛰기, 동일 렌더러의 PNG 카드, 공유/취소/미지원·복사·이미지 열기, 공통 OG.
- M5: 요청 제한, 생성 중지 설정, 일일 정리, 익명 일자 집계, 자동 검사와 로컬 측정, 환경별 배포·복구 절차.

전체 흐름은 로컬 검증 대상입니다. 운영 배포·실기기 공유·클라우드 CPU/읽기·쓰기 과금 측정은 아직 수행하지 않았습니다. 이를 포함한 출시 완료 상태는 아닙니다.

## 문서

- [검증 기록](docs/qa.md)
- [운영·배포·복구](docs/operations.md)
- [사용량과 비용 전제](docs/cost.md)
- [에셋·제작 범위](docs/assets.md)
- [원본 작업 지시](docs/reference/2026-10-20-pixel-offspring-start-prompt.md)
- [계획·결정 기록](tasks/todo.md)

현재 질문은 v4(10문항)이며 보관 기간은 제공 문서의 제안값을 유지합니다. 캐릭터·세션 최대 90일, 초대 최대 30일, 요청 키 24시간, 집계 90일입니다. 결과는 두 부모 중 먼저 만료되는 시점에 끝납니다. 현재 브라우저의 쿠키를 잃으면 관리 권한을 복구하지 못합니다.

## 현재 설문과 결과

- 새 검사는 v4 10문항입니다. 기존 v1~v3 캐릭터와 결과도 지원합니다.
- 선택한 질문·답변과 점수·풀이를 저장하며 초대·결과 링크를 아는 사람에게 공개합니다.
- 두 v4 캐릭터의 결과는 실제 답변을 인용해 세 가지 축의 조합 이유와 조율 방법을 설명합니다. 이전 설문 답변은 추측하지 않습니다.
- 공식 MBTI 검사나 사주·관계 진단이 아닌 오락 콘텐츠입니다.

## 이전 캐릭터·설문 변경 기록

- `/gallery`: 새16유형과 이전64패턴·12쌍, 에셋v1/v2/v3 비교.
- `/docs/character-audit.html`: 84개 허용 조합 검수판.
- 새 캐릭터는 에셋v3. 이불3종은 몸을 실제로 덮은 전용 파츠이며 기존 저장 그림은 해당 버전으로 유지합니다.
- 설문v2 원본 답변은 저장하지 않고4축 점수·유형·버전만 저장합니다. v1 API/결과를 계속 읽습니다.
- 단위18개, E2E16개, 타입 검사·빌드·PNG24개 검사 통과. 상세는 docs/qa.md.


최신 품질 검증(2026-10-20, Next.js 전환): `pnpm check` 소스 길이·타입·커버리지80% 하한·프로덕션 빌드 통과. 단위/DOM/PostgreSQL 통합60개, Chrome E2E26개 통과. 전체 줄94.22%·분기91.02%·함수92.26%. 새 Next 페이지도 커버리지 측정 범위에 포함하며 E2E 실행률은 합산하지 않습니다. `pnpm source:check`는 src/worker/scripts의 함수50줄·파일300줄 상한을 검사합니다. DB 테스트는 메모리 PGlite, DOM 테스트의 Canvas·네트워크 경계는 대체하며 실제 화면은 Chrome에서 검증합니다. 상세는 [QA 기록](docs/qa.md) 참고.

## Vercel 배포

`vercel.json`에 Next.js 프레임워크·빌드·Cron 설정이 있습니다. 대시보드의 Framework Preset은 **Next.js**로 바꾸고 기존 Output Directory Override(`dist`/`dist/client`)는 해제합니다. Neon DB를 연결하고 DATABASE_URL, APP_ORIGIN, CRON_SECRET, CREATION_ENABLED를 설정한 뒤 `pnpm db:migrate`로 스키마를 적용합니다. 상세 순서와 환경 분리는 [운영 가이드](docs/operations.md)를 따릅니다. 실제 계정 연결·배포는 별도 단계입니다.
