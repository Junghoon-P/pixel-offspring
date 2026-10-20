import type { ReactElement } from "react";
import Link from "next/link";
import { Demo } from "./Demo";
export const Home = (): ReactElement => (
  <>
    <p className="eyebrow">너를 닮고, 나를 닮은</p>
    <h1>
      너랑 나 사이에서
      <br />
      태어난
    </h1>
    <p>
      내 성향을 닮은 생물, 친구와 섞으면 어떤 모습일까?
      <br />
      생김새부터 케미까지. 우리만의 조합을 발견해요.
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
      가입 없이 시작해요 · 질문 24개 · 나를 닮은 16가지 성향
    </p>
    <Demo />
  </>
);
