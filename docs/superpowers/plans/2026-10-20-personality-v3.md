# 캐릭터 성향·궁합·레전드 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. 기존 in-place 선택 유지. 단계별 TDD와 마지막 전체 diff 리뷰.

**Goal:** 24문항 개인 풀이에서 상황별 궁합·레전드 발견·도감·공유까지 연결한다.
**Architecture:** 기존 서버 스냅샷에 선택 필드를 추가해 구버전 조회를 보존한다. 점수·궁합·레전드는 순수 함수로 계산하고 화면과 공유 카드는 저장 결과만 읽는다.
**Tech Stack:** 현재 Next/React/TypeScript/Zod/Vitest/Playwright. 새 의존성 없음.
**Spec:** docs/design/personality-v3.md

## Global Constraints
- 현재 dev, in-place. 푸시·릴리스 없이 구현 검증.
- 자체16유형, 게임 규칙 기반 풀이. 공개 명칭은 레전드 조합.
- 원본 답변 저장 금지. 개인 점수와 풀이 스냅샷 저장, 구버전 재계산 금지.
- 함수50줄·파일300줄 이하, 화살표 함수·반환 타입.

## Review Focus
- 구버전 친구에게 없는 축을 추정하지 않는다.
- 중립 답변을 극단 성향으로 설명하지 않는다.
- 레전드 조건 충돌과 부모 반전에 결과가 달라지지 않는다.
- 기존 결과 재조회와 삭제된 결과의 도감 노출을 확인한다.
- 공유 카드의 긴 문구가 잘리지 않게 한다.

## Tasks
- [x] Domain: personality.test.ts에서24문항·중립·계약·대칭·레전드 실패 테스트 → surveyV3Questions.ts/surveyV3.ts/personalityReading.ts/compatibility.ts/legends.ts 구현 → 테스트. model.ts와contracts.ts는 optional 확장. 신규 스키마는personalitySchemas.ts로 분리.
- [x] Integration: Quiz.test.tsx를24문항·5선택으로 갱신해 실패 확인 → Quiz.tsx와worker/characters.ts 저장 연결 → 개인 reading UI 및 버전 호환 테스트.
- [x] Result: comicOffspring.ts의 저장 결과에 궁합·레전드 연결 → Result.tsx/Me.tsx/card.ts에 검수한 패널·details 스타일로 표시 → 레전드 도감은 서버에서 권한·만료 검사된 현재 결과 목록으로만 집계. 아직 더 읽을 결과가 있으면 미확인 상태를 구분.
- [x] Rendering: 기존 합성과 코스튬에 레전드별 기존 픽셀 소품을 추가해 두 부모 기여 보존. 레전드와 일반 결과의 실제 렌더러·PNG 검증.
- [x] Verify: source:check/typecheck/test/build/e2e, 실제24문항→내 결과→초대→궁합→레전드 및 모바일 크기 검수, 최종1회 전체 리뷰.

검증: 80테스트·E2E27·소스·타입·빌드 통과. 최종 리뷰1회 및 발견 문제 수정 완료.
