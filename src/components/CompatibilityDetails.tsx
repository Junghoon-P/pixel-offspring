import Link from "next/link";
import type { ReactElement } from "react";
import type { Compatibility } from "../domain/personalityModel";
export const CompatibilityDetails = ({ compatibility }: { compatibility: Compatibility }): ReactElement => (
  <section className="panel reading-panel">
    <p className="eyebrow">같이 있으면 이런 사이</p>
    <h2>{compatibility.title}</h2>
    <ul>{compatibility.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
    <p>{compatibility.complement}</p>
    {compatibility.situations.map((situation) => <details className="reading" key={situation.title}>
      <summary>{situation.title}</summary>
      <p><strong>통하는 부분</strong> {situation.match}</p>
      <p><strong>부딪힐 수 있는 부분</strong> {situation.friction}</p>
      <p><strong>둘만의 공략법</strong> {situation.tip}</p>
    </details>)}
    {compatibility.partial && <p className="muted">이전 설문에 없는 관계 성향은 추정하지 않았어요. <Link href="/create">새 설문으로 더 알아보기</Link></p>}
    <p className="muted">잘 맞는 순간도, 엇갈리는 순간도 재미로 읽어주세요. 실제 관계를 판정하는 결과는 아니에요.</p>
  </section>
);
