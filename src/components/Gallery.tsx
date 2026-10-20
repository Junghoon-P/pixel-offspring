"use client";
import { surveyExamples } from "../domain/survey";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { parentRecipe, scoreAnswers, offspring } from "../domain/engine";
import type { Child, Parent, Recipe } from "../domain/model";
import { CreatureCanvas } from "./CreatureCanvas";
const types = surveyExamples();
const examples: Parent[] = Array.from({ length: 64 }, (_, mask) => {
  const answers = Array.from({ length: 6 }, (_, i) => ({
    questionId: `q${i + 1}`,
    optionId: mask & (1 << i) ? "b" : "a",
  }));
  return {
    id: `sample-${mask}`,
    nickname: `패턴 ${mask + 1}`,
    traits: scoreAnswers(answers),
    recipe: parentRecipe(answers),
    assetVersion: 3,
  };
});
interface RecipeGridProps {
  title: string;
  version: 1 | 2 | 3;
  items: { recipe: Recipe; label: string }[];
}
const RecipeGrid = ({
  title,
  version,
  items,
}: RecipeGridProps): ReactElement => (
  <>
    <h2>{title}</h2>
    <div className="gallery">
      {items.map((item, i) => (
        <figure key={i}>
          <CreatureCanvas
            recipe={{ ...item.recipe, assetVersion: version }}
            label={item.label}
            scale={2}
          />
          <figcaption>{item.label}</figcaption>
        </figure>
      ))}
    </div>
  </>
);
const VersionSelector = ({
  version,
  setVersion,
}: {
  version: 1 | 2 | 3;
  setVersion: (version: 1 | 2 | 3) => void;
}): ReactElement => (
  <label>
    그림 버전
    <select
      value={version}
      onChange={(event) =>
        setVersion(
          event.target.value === "1" ? 1 : event.target.value === "2" ? 2 : 3,
        )
      }
    >
      <option value="3">몸통에 맞춰 덮은 이불 · v3</option>
      <option value="2">개선 버전 · 선명한 눈과 몸통별 이불</option>
      <option value="1">이전 버전 · 비교용</option>
    </select>
  </label>
);
export const Gallery = (): ReactElement => {
  const [version, setVersion] = useState<1 | 2 | 3>(3);
  const [children, setChildren] = useState<Child[]>([]);
  useEffect(() => {
    void Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        offspring(examples[i * 5], examples[63 - i * 3]),
      ),
    ).then(setChildren);
  }, []);
  return (
    <>
      <h1>파츠 검수 미리보기</h1>
      <p>
        새 설문 16유형, 이전 설문 64패턴과 고정 12쌍. 실제 화면·카드와 같은
        Canvas 렌더러입니다.
      </p>
      <VersionSelector version={version} setVersion={setVersion} />
      <RecipeGrid
        title="새 설문 16유형"
        version={version}
        items={types.map((item) => ({
          recipe: item.recipe,
          label: item.profile.name,
        }))}
      />
      <RecipeGrid
        title="이전 설문 64패턴"
        version={version}
        items={examples.map((item) => ({
          recipe: item.recipe,
          label: item.nickname,
        }))}
      />
      <RecipeGrid
        title="고정 조합 12쌍"
        version={version}
        items={children.map((item) => ({
          recipe: item.recipe,
          label: item.name,
        }))}
      />
    </>
  );
};
