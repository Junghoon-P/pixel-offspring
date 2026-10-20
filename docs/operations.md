# Vercel + Neon 운영·배포

## 현재 상태

Next.js App Router와 Node.js Route Handlers, Neon PostgreSQL 구성입니다. 서버 코드는 기존 `worker/` 디렉터리를 유지하지만 Cloudflare 런타임에는 의존하지 않습니다. API 진입점은 `src/app/api/[...path]/route.ts`입니다. 공통 레이아웃·메타데이터는 Server Component, 설문·Canvas·브라우저 저장소는 Client Component입니다. 실제 계정·원격 DB 연결과 배포는 별도 단계이며 로컬 테스트 결과와 구분합니다.

## 최초 연결

1. 기존 Vercel 프로젝트에 `Junghoon-P/pixel-offspring` 저장소를 연결합니다. 현재 개발 브랜치는 `dev`이며 Production Branch도 실제 배포할 브랜치와 일치시킵니다.
2. Storage에서 Neon PostgreSQL을 생성/연결하고 이 프로젝트 전용 DB를 사용합니다. Preview와 Production은 서로 다른 DB/Neon 브랜치를 연결합니다.
3. 아래 서버 환경변수를 설정합니다. `.env.example`은 키 안내이며 실제 비밀 값은 커밋하거나 채팅에 공유하지 않습니다.
4. 원격 DB 스키마를 적용하고 배포한 다음, 생성 중지 상태의 안전한 조회부터 검증합니다. 최종 생성 활성화 후 두 브라우저에서 설문·초대·조합·공유·삭제를 확인합니다.

| 변수 | 값 |
|---|---|
| DATABASE_URL | 연결된 Neon PostgreSQL URL. NEXT_PUBLIC_ 접두사 금지 |
| APP_ORIGIN | `https://pixel-offspring.vercel.app`처럼 경로·마지막 슬래시 없는 정확한 HTTPS 주소 |
| CRON_SECRET | 무작위 32자 이상 비밀 문자열. Vercel Cron이 Bearer 인증에 사용 |
| CREATION_ENABLED | 최초 `false`, DB 검증 후 `true` |

Preview에는 별도의 DB와 해당 Preview의 고정 도메인을 APP_ORIGIN으로 설정합니다. Production의 URL을 복사하면 Preview의 쓰기 요청은 Origin 검사에서 거부됩니다. 임의 Host 헤더를 신뢰해 Origin을 자동 허용하지 않습니다.

설정은 `vercel.json`에 기록되어 있습니다. Framework Preset **Next.js**, Build Command **pnpm build**, Node.js **22.x**입니다. 기존 Output Directory Override(`dist`/`dist/client`)는 해제합니다. Next가 페이지·API·정적 파일 라우팅을 생성하므로 SPA rewrite와 includeFiles는 사용하지 않습니다. 결과 페이지는 캐시하지 않는 화면을 렌더링하고, 결과 API가 삭제·만료·존재 여부를 판정합니다. 삭제된 결과의 HTML 응답은200이며 API 응답은410입니다.

## 마이그레이션

Neon 연결 문자열을 로컬 `.env.local`의 DATABASE_URL로 저장한 뒤 실행합니다. 이 명령은 실제 원격 DB를 변경합니다. 대상이 이 프로젝트 전용 DB인지 먼저 확인합니다.

```sh
pnpm db:migrate
```

`migrations/0001_postgres.sql`을 트랜잭션으로 적용합니다. 실행 중 잠금과 적용 이력을 사용하므로 중복 실행은 데이터를 지우지 않습니다. 적용된 파일의 체크섬이 달라지면 중단합니다. 향후 스키마 변경은 적용된 초기 파일을 수정하지 말고 새 버전 마이그레이션을 추가해야 합니다. 빌드마다 자동 마이그레이션하지 않습니다.

기존 D1 스키마는 `docs/reference/legacy-d1-schema.sql`에 보관했습니다. 기존 `.wrangler` 데이터는 삭제하지 않았고 PostgreSQL로 자동 이전하지도 않았습니다. 보존해야 할 원격 D1 데이터가 있다면 별도 이전·대조 후 전환해야 합니다.

## 로컬 실행·검증

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm e2e
pnpm measure
```

`pnpm dev`는 127.0.0.1:5173에서 PGlite PostgreSQL을 `.data/pglite`에 저장합니다. Neon 계정과 원격 비밀 없이 실행합니다. `pnpm e2e`는 5174에 별도의 메모리 DB/서버를 자동 생성하고 종료하며 기존 개발 DB를 사용하지 않습니다. `pnpm measure`도 5175의 독립 서버를 사용합니다. E2E/측정 전에 `pnpm build` 또는 `pnpm check`를 실행합니다. `pnpm preview`와 `pnpm start`는 Next 프로덕션 서버입니다. 로컬 DB를 사용하려면 `PIXEL_LOCAL_DB=true`와 실행 포트에 맞는 `APP_ORIGIN`을 지정합니다. 지정하지 않으면 Neon 운영 환경변수를 요구합니다.

테스트 SQL 엔드포인트 `/api/testing/sql`은 로컬 DB 모드와 무작위 E2E_DB_TOKEN 인증을 모두 요구합니다. 일반 dev 실행에서는 비활성이고 Vercel에서는 VERCEL=1 검사로 환경 플래그에 관계없이404를 반환합니다. 배포 빌드에는 경로가 포함되지만 SQL 실행은 차단됩니다. 개발 서버는 외부에 공개하지 않습니다. PGlite는 SQL/트리거/롤백 검증용이며 Neon의 다중 연결 동시성·네트워크·과금 측정을 대체하지 않습니다.

## 개인정보·삭제·요청 제한

관리 토큰은 SHA-256 해시만 저장하며 운영 쿠키는 `__Host-creature_session`, HttpOnly, Secure, SameSite=Lax입니다. 원본 설문 답변은 저장하지 않습니다. 생성 요청의 8KiB 제한, Zod 검증, 소유권 검사, 저장 스냅샷과 멱등성 키를 유지합니다.

캐릭터 삭제는 PostgreSQL 트리거로 초대·공동 결과를 비공개 처리합니다. 삽입 트랜잭션의 부모 행 잠금과 공개 조회 재검증으로 삭제와 생성의 경합을 처리합니다. 보관 기간은 세션/캐릭터 최대90일, 초대 최대30일, 요청 키24시간, 집계90일입니다.

요청 제한은 PostgreSQL 원자적 upsert로 서버 인스턴스 간 공유합니다. 읽기60회/분, 신규 쓰기30회/분, 세션 발급 IP 해시별30회/분이며 고정 분 단위입니다. 분 경계에서는 연속 요청이 더 허용될 수 있고 월 비용 상한이 아닙니다. 요청 제한 자체에도 DB 쓰기가 발생합니다. 원본 IP 대신 Vercel이 제공하는 `x-vercel-forwarded-for` 값의 해시를 사용합니다.

`CREATION_ENABLED=false`는 신규 생물·초대·조합을 중지하고 기존 결과 조회·삭제·멱등 재조회를 유지합니다. 환경변수 변경 후 재배포해야 하며 배포 전파 시간을 고려해야 합니다.

## 예약 정리·복구

Vercel Cron이 매일03:00 UTC에 `/api/cron/cleanup`을 호출합니다. CRON_SECRET 없는 호출은401, GET 이외는405로 거부합니다. 만료는 조회 즉시 적용되고 물리 정리는 예약 실행 시점에 수행됩니다. 재실행해도 안전하며 오래된 요청 제한 버킷도 정리합니다. 실행 시간이 함수 한도를 넘지 않는지 실제 데이터 규모에서 확인해야 합니다.

배포 전 Neon 플랜의 복원 보관 범위와 백업을 확인합니다. 백업은 비공개 저장소에 보관하고 Git에 올리지 않습니다. 앱 오류는 Vercel 이전 배포로 롤백하되 DB를 자동 되돌리지 않습니다. DB 복구는 생성 중지 → 격리 DB 복원 → 백업 이후 삭제·만료 상태 재적용 → 초대/결과/삭제 검증 → DATABASE_URL 전환 순서입니다. 실제 원격 복구는 아직 검증하지 않았습니다.
