"use client";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { offspring } from "../domain/engine";
import { BODY_NAMES } from "../domain/catalog";
import type { Body, Child, Parent } from "../domain/model";
import { CreatureCanvas } from "./CreatureCanvas";
const demoParent = (id: string, body: Body): Parent => ({
  id,
  nickname: BODY_NAMES[body],
  traits: { adventure: body === "snail" ? 1 : -1, energy: 0, spontaneity: 0 },
  assetVersion: 3,
  recipe: {
    assetVersion: 3,
    body,
    face: body === "snail" ? "happy" : "sleepy",
    decorations: body === "snail" ? ["flame"] : ["blanket"],
    palette: "original",
  },
});
const DemoChild = ({ child }: { child: Child }): ReactElement => (
  <>
    <CreatureCanvas recipe={child.recipe} label={child.name} />
    <h2>{child.name}</h2>
    <p>{child.description}</p>
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
export const Demo = (): ReactElement => {
  const [left, setLeft] = useState<Body>("snail"),
    [right, setRight] = useState<Body>("ghost"),
    [child, setChild] = useState<Child>();
  const a = demoParent("demo-a1", left),
    b = demoParent("demo-b", right);
  useEffect(() => {
    void offspring(
      demoParent("demo-a1", left),
      demoParent("demo-b", right),
    ).then(setChild);
  }, [left, right]);
  return (
    <section className="panel">
      <p className="eyebrow">조합 미리보기 · 저장되지 않는 데모</p>
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
                const v = e.target.value === "snail" ? "snail" : "ghost";
                if (i === 0) setLeft(v);
                else setRight(v);
              }}
            >
              <option value="snail">불꽃 달팽이</option>
              <option value="ghost">이불 유령</option>
            </select>
          </div>
        ))}
      </div>
      {child && <DemoChild child={child} />}
    </section>
  );
};
