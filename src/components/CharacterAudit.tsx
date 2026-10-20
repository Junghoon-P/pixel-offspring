"use client";
import type { ReactElement } from "react";
import { CreatureCanvas } from "./CreatureCanvas";
import { recipeSchema } from "../shared/contracts";
import report from "../../docs/character-audit-data.json";
const recipes = report.cases.map((value) => recipeSchema.parse(value));
export const CharacterAudit = (): ReactElement => (
  <>
    <h1>캐릭터 전체 조합 검수 · v3 착용 파츠 검수</h1>
    <p>
      6몸통 × 2표정 × 호환 장식 = 84개. 몸통별 착용 파츠·얼굴·주변 장식의 조합을
      검수합니다.
    </p>
    <section className="audit-grid">
      {recipes.map((recipe, index) => {
        const label = `${index + 1}. ${recipe.body} / ${recipe.face} / ${recipe.decorations.join("+")}`;
        return (
          <figure key={index}>
            <CreatureCanvas recipe={recipe} label={label} scale={2} />
            <figcaption>{label}</figcaption>
          </figure>
        );
      })}
    </section>
  </>
);
