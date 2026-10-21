import type { ReactElement } from "react";
import type { PublicResult } from "../domain/model";

export const AnswerEvidenceDetails = ({ result }: { result: PublicResult }): ReactElement | null => {
  const reading = result.child.combinationReading;
  if (!reading) return null;
  return (
    <section className="panel reading-panel">
      <p className="eyebrow">같은 질문, 우리의 대답</p>
      <h2>우리, 이런 점이 닮고 달라요</h2>
      <p className="story">{reading.headline}</p>
      {reading.evidence.map((item, index) => (
        <details className="reading" key={item.axis} open={index === 0}>
          <summary>{item.title}</summary>
          {item.parents.map((parent) => (
            <p key={parent.parentId}>
              <strong>{result.parents.find((p) => p.id === parent.parentId)?.nickname ?? "참여자"}</strong>
              {" · "}{parent.question}<br />
              <q>{parent.answer}</q>
            </p>
          ))}
          <p>{item.interpretation}</p>
        </details>
      ))}
      <p className="muted">두 사람이 고른 답변을 비교했어요. 서로를 알아가는 재미로 봐주세요.</p>
    </section>
  );
};
