import type { ReactElement } from "react";
import Link from "next/link";
import { Demo } from "./Demo";
export const Home = (): ReactElement => (
  <>
    <p className="eyebrow">친구도, 썸도, 연인도</p>
    <h1>우리 무슨 조합?</h1>
    <p>
      우리 사이를 캐릭터로 그려보면?
      <br />
      각자 열 가지 질문에 답하면 둘만의 조합이 나와요.
    </p>
    <div className="actions">
      <Link className="button" href="/create">
        내 생물 만들기
      </Link>
      <Link className="button secondary" href="/me">
        내 생물 보기
      </Link>
    </div>
    <p className="muted">
      각자 10문항 · 회원가입 없이 바로 시작
    </p>
    <Demo />
  </>
);
