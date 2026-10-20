import type { ReactElement } from "react";
import type { PersonalityReading } from "../domain/personalityModel";
export const PersonalityDetails = ({ reading }: { reading: PersonalityReading }): ReactElement => (
  <details className="reading">
    <summary>나라는 생물의 사용 설명서</summary>
    <dl>
      <dt>내가 잘하는 것</dt><dd>{reading.strength}</dd>
      <dt>오해받기 쉬운 점</dt><dd>{reading.misunderstanding}</dd>
      <dt>지칠 때의 나</dt><dd>{reading.stress}</dd>
      <dt>나와 친해지는 방법</dt><dd>{reading.friendship}</dd>
    </dl>
    {reading.axes.map((axis) => <div className="trait" key={axis.axis}>
      <p><strong>{axis.label}</strong> {axis.summary}</p>
      <meter min={-1} max={1} value={axis.score} aria-label={`${axis.label}: ${axis.summary}`} />
    </div>)}
    <p className="muted">어느 쪽이 더 나답게 느껴지는지 보여줘요. 잘하고 못하는 점수는 아니에요.</p>
  </details>
);
