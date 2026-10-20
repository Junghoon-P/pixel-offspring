# Vercel + Neon 비용과 측정

배포 대상은 Vercel Functions + Neon PostgreSQL입니다. 이전 Cloudflare/D1 측정은 현재 비용의 근거로 사용하지 않습니다.

`pnpm measure`는 독립된 로컬 Next.js + PGlite 서버에서 두 사람 생성 → 초대 → 조합 → 양쪽 조회를 실행하고 `docs/measurement.json`에 기록합니다. 원격 DB나 운영 트래픽을 사용하지 않습니다. wallMs는 응답 시간이며 CPU 또는 Neon 과금 시간으로 환산할 수 없습니다. snapshot_bytes는 스냅샷 문자열의 논리 크기이고 인덱스·세션·요청 키·집계·DB 페이지를 제외합니다.

최소 API 흐름은 두 사람당12회입니다. 실제 화면의 이벤트·재검증·결과 HTML·새로고침·정리 호출이 추가됩니다. PostgreSQL 기반 요청 제한은 API 호출마다 추가 DB 작업이 발생하므로 API 요청 수와 SQL 실행 수가 같지 않습니다.

비용 항목은 Vercel 플랜·함수 호출/CPU/메모리·전송량과 Neon 컴퓨트·저장·백업입니다. 기존 Vercel 팀 플랜의 공유 포함량과 Neon 연결 플랜을 기준으로 계산해야 합니다. 무료 한도나 고정 월 예산 내 운영을 보장하지 않습니다.

- Vercel 공식 요금: https://vercel.com/pricing
- Neon 공식 요금: https://neon.com/pricing

원격 연결 후 별도 스테이징에서10→50→100동시 요청, 오류율·응답 지연·함수 실행량·DB 컴퓨트·저장 증가를 측정하고 예산 알림과 제한을 설정합니다. 실제 Neon 다중 연결 경합, 장시간 정리, 중지·롤백·복원은 출시 전에 별도로 검증합니다.
