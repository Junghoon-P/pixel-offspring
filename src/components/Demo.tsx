"use client";
import { comicRecipe } from "../domain/comicCatalog";
import { bodySchema } from "../shared/contracts";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useResultCard } from "../features/useResultCard";
import { offspring } from "../domain/engine";
import { COMIC_NAMES } from "../domain/catalog";
import type { Body, Child, Parent } from "../domain/model";
import { CreatureCanvas } from "./CreatureCanvas";
const demoParent = (id: string, body: Body): Parent => ({
  id,
  nickname: COMIC_NAMES[body],
  traits: { adventure: body === "snail" ? 1 : -1, energy: 0, spontaneity: 0 },
  assetVersion: 4,
  recipe: comicRecipe(body),
});
const DemoChild = ({ child }: { child: Child }): ReactElement => (
  <>
    <CreatureCanvas recipe={child.recipe} label={child.name} />
    <h2>{child.name}</h2>
    <p className="story">{child.description}</p>
    <ul>
      {child.inheritance.map((item, i) => (
        <li key={i}>
          {item.parentId === "demo-a1" ? "첫 번째" : "두 번째"} 부모의{" "}
          {item.label}
        </li>
      ))}
    </ul>
  </>
);
const DemoCard = ({ child, parents }: { child: Child; parents: Parent[] }): ReactElement => {
  const result = useMemo(() => ({ resultId: "demo", parents, child, createdAt: 0, expiresAt: 0 }), [child, parents]);
  const card = useResultCard(result);
  return <details>
    <summary>PNG 카드 미리보기</summary>
    {card.cardError && <p role="alert">{card.cardError}<button onClick={card.retry}>다시 준비</button></p>}
    {card.imageUrl ? <>
      <img src={card.imageUrl} alt="두 부모와 조합 결과의 공유 카드" width={270} />
      <a href={card.imageUrl} download="pixel-offspring-demo.png">데모 PNG 저장</a>
    </> : <p>카드를 준비하고 있어요.</p>}
  </details>;
};
export const Demo = (): ReactElement => {
  const [left, setLeft] = useState<Body>("mushroom"),
    [right, setRight] = useState<Body>("bird"),
    [child, setChild] = useState<Child>();
  const parents = useMemo(() => [demoParent("demo-a1", left), demoParent("demo-b", right)], [left, right]);
  const [a, b] = parents;
  useEffect(() => {
    void offspring(
      demoParent("demo-a1", left),
      demoParent("demo-b", right),
    ).then(setChild);
  }, [left, right]);
  return (
    <section className="panel">
      <p className="eyebrow">둘을 고르면, 바로 섞여요</p>
      <p className="muted">마음껏 바꿔보세요. 미리보기는 저장되지 않아요.</p>
      <div className="parents">
        {[a, b].map((parent, i) => (
          <div key={parent.id}>
            <CreatureCanvas
              recipe={parent.recipe}
              label={parent.nickname}
              scale={2}
            />
            <select
              aria-label={`${i + 1}번 부모`}
              value={i === 0 ? left : right}
              onChange={(e) => {
                const v = bodySchema.parse(e.target.value);
                if (i === 0) setLeft(v);
                else setRight(v);
              }}
            >
              {bodySchema.options.map((body) => <option key={body} value={body}>{COMIC_NAMES[body]}</option>)}
            </select>
          </div>
        ))}
      </div>
      {child && <><DemoChild child={child} /><DemoCard child={child} parents={parents} /></>}
    </section>
  );
};
