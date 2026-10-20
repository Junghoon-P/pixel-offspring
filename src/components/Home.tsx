import type { ReactElement } from "react";
import Link from "next/link";
import { Demo } from "./Demo";
export const Home = (): ReactElement => (
  <>
    <p className="eyebrow">작은 도트, 둘의 이야기</p>
    <h1>
      너랑 나 사이에서
      <br />
      태어난
    </h1>
    <p>
      나를 닮은 생물과 친구의 생물이 만나면?
      <br />
      서로의 작은 특징을 물려받은 생물이 태어나요.
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
      가입 없이 · 질문 12개 · 16가지 유형 · 가볍게 즐기는 조합 놀이
    </p>
    <Demo />
  </>
);
