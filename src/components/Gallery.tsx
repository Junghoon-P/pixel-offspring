"use client";
import Link from "next/link";
import { recipeName } from "../domain/personalityArt";
import { comicRecipe, HYBRIDS } from "../domain/comicCatalog";
import { COMIC_NAMES } from "../domain/catalog";
import { surveyV3Examples } from "../domain/surveyV3";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { parentRecipe, scoreAnswers, offspring } from "../domain/engine";
import type { Child, Parent, Recipe } from "../domain/model";
import { CreatureCanvas } from "./CreatureCanvas";
const types = surveyV3Examples();
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
  items: { recipe: Recipe; label: string; detail?: string }[];
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
            recipe={item.recipe.assetVersion === 4 ? item.recipe : { ...item.recipe, assetVersion: version }}
            label={item.label}
            scale={2}
          />
          <figcaption>{item.label}{item.detail && <p>{item.detail}</p>}</figcaption>
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
      <p>새 검사의 16유형과 성향을 나타내는 소품을 확인해요. 중립인 축은 혼합형으로 남기고, 밈 캐릭터는 관계 성향 조건까지 맞을 때 나타나요. 실제 화면·카드와 같은 Canvas 렌더러입니다.</p>
      <p><Link href="/gallery/fusions">210개 조합 완성 그림 보기</Link></p>
      <p><Link href="/gallery/memes">성격 과다 생물도감 · 새 스타일 6종</Link></p>
      <RecipeGrid title="16유형 · 16개의 독립 캐릭터" version={3}
        items={types.map((item) => ({ recipe: item.recipe,
          label: `${recipeName(item.recipe)} · ${item.profile.name}`, detail: item.profile.characterMatch?.reason }))} />
      <RecipeGrid title="설문에서 만나는 밈 캐릭터" version={3}
        items={[comicRecipe("cucumber"), comicRecipe("broccoli"), comicRecipe("pepe"), comicRecipe("squidward")].map((recipe) => ({
          recipe, label: COMIC_NAMES[recipe.body] }))} />
      <RecipeGrid title={`옷과 소품을 나눈 ${HYBRIDS.length}개 조합`} version={3}
        items={HYBRIDS.map((design) => ({ label: design.name,
          recipe: { assetVersion: 4, body: design.baseBody, hybrid: design.id, hybridStyle: "costume",
            face: "signature", decorations: [], palette: "original" } }))} />
      <details>
      <summary>저장된 구버전 그림 비교</summary>
      <VersionSelector version={version} setVersion={setVersion} />
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
      </details>
    </>
  );
};
