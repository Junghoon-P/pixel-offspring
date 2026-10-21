import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import pilots from "./pilots.json";

const MemePilots = (): ReactElement => (
  <>
    <Link href="/gallery">캐릭터 도감으로</Link>
    <p className="muted">새로운 스타일 · 대표 6종 시안</p>
    <h1>성격 과다 생물도감</h1>
    <p>우리 섞었더니 이런 게 나옴.</p>
    <p>두 성격이 만나 생긴 이상한 생활 습관. 가장 우리다운 조합을 찾아보세요.</p>
    <nav aria-label="시안 바로 보기">
      {pilots.map((pilot, index) => <p key={pilot.id}>
        <a href={`#${pilot.id}`}>{index + 1}. {pilot.name}</a>
      </p>)}
    </nav>
    {pilots.map((pilot, index) => <article className="panel reading-panel" id={pilot.id} key={pilot.id}>
      <p className="muted">0{index + 1} · {pilot.pair}</p>
      <Image src={`/creatures/v5/pilots/${pilot.id}.png`} alt={pilot.alt}
        width={1254} height={1254} unoptimized priority={index === 0}
        style={{ width: "100%", height: "auto", maxWidth: 400, display: "block", margin: "auto", imageRendering: "pixelated" }} />
      <h2>{pilot.name}</h2>
      <p><strong>“{pilot.line}”</strong></p>
      <p>{pilot.story}</p>
      <details>
        <summary>우리 사이에선 어떻게 나타날까?</summary>
        <p><strong>잘 맞는 순간</strong>{pilot.good}</p>
        <p><strong>삐끗하기 전에</strong>{pilot.clash}</p>
        {pilot.id === "crying-repair" && <p className="muted">이 시안은 공감 우선 × 해결 우선 응답을 가정했어요. 라쿤·감자라는 종만으로 이 성향이 정해지지는 않아요.</p>}
      </details>
      <p><a href={`/creatures/v5/pilots/${pilot.id}.png`} download>그림 저장</a></p>
    </article>)}
    <p className="muted">스타일 비교용 시안이에요. 실제 검사 결과와 전체 조합에는 아직 적용하지 않았어요.</p>
  </>
);
export default MemePilots;
