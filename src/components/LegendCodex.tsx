import Link from "next/link";
import type { ReactElement } from "react";
import type { PublicResult } from "../domain/model";
import { LEGENDS } from "../domain/legends";
import { CreatureCanvas } from "./CreatureCanvas";
export const LegendCodex = ({ results, hasMore }: { results: PublicResult[]; hasMore: boolean }): ReactElement => (
  <details className="panel codex">
    <summary>레전드 도감 · {LEGENDS.filter((design) => results.some((result) => result.child.legend?.matched.includes(design.id))).length} / {LEGENDS.length}</summary>
    <p>찰떡이어도, 정반대여도. 특별한 성향이 만나면 레전드 조합이 태어나요.</p>
    {LEGENDS.map((design) => {
      const result = results.find((item) => item.child.legend?.matched.includes(design.id));
      return <section className="codex-entry" key={design.id}>
        <h3>{result ? design.name : "아직 만나지 못한 레전드"}</h3>
        {result ? <><CreatureCanvas recipe={result.child.recipe} label={design.name} scale={2} />
          <p>{result.child.legend?.id === design.id ? result.child.legend.reason : design.reason}</p>
          {result.child.legend?.id !== design.id && <p className="muted">함께 달성한 조건이에요. 이 결과의 대표 외형은 {result.child.legend?.name}예요.</p>}<Link href={`/r/${result.resultId}`}>{design.name} 결과 보기</Link></>
          : <><p className="undiscovered" aria-label="아직 발견하지 못한 조합">?</p><p>{design.hint}</p></>}
      </section>;
    })}
    <p className="muted">이 브라우저에서 불러온 유효한 결과 기준이에요. 삭제·만료된 결과는 도감에서도 사라져요.</p>
    {hasMore && <p role="status">아직 불러오지 않은 결과가 있어요. 아래 ‘더 보기’로 이전 발견도 확인하세요.</p>}
  </details>
);
