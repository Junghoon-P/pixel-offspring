"use client";
import Link from "next/link";
import { useState } from "react";
import type { ReactElement } from "react";
import { bodySchema } from "../shared/contracts";
import memeFusions from "../domain/memeFusions.json";
import { comicRecipe } from "../domain/comicCatalog";
import { hasPersonalityArt, recipeName } from "../domain/personalityArt";
import type { Body, Recipe } from "../domain/model";
import { CreatureCanvas } from "./CreatureCanvas";
const parentName = (body: Body): string => recipeName({ ...comicRecipe(body),
  ...(hasPersonalityArt(body) ? { portraitStyle: "personality" as const } : {}) });
const bodies = [...bodySchema.options].sort();
const pairs = bodies.flatMap((a, i) => bodies.slice(i).map((b) => {
  const recipe: Recipe = { ...comicRecipe(a), fusionBody: b, fusionStyle: "meme" };
  const id = `${a}-${b}`;
  const copy = memeFusions.find((item) => item.id === id);
  return { id, recipe, copy, label: `${parentName(a)} × ${parentName(b)}` };
}));
const PAGE_SIZE = 21;
export const FusionGallery = (): ReactElement => {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(pairs.length / PAGE_SIZE);
  return <>
    <Link href="/gallery">캐릭터 검수로 돌아가기</Link>
    <h1>우리 조합, 전부 모아보기</h1>
    <p>같은 종끼리 만난 모습까지 총 {pairs.length}조합. 결과 화면과 PNG에 쓰는 완성 그림이에요.</p>
    <nav aria-label="조합 페이지">
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>이전 조합</button>
      <span role="status"> {page + 1} / {pages} </span>
      <button disabled={page === pages - 1} onClick={() => setPage(page + 1)}>다음 조합</button>
    </nav>
    <div className="audit-grid">
      {pairs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((pair) => <figure key={pair.id}>
        <CreatureCanvas recipe={pair.recipe} label={pair.label} scale={3} />
        <figcaption><strong>{pair.copy?.name}</strong><p>{pair.copy?.line}</p>
          <small>{pair.label}</small><br /><small>{pair.id}</small></figcaption>
      </figure>)}
    </div>
  </>;
};
