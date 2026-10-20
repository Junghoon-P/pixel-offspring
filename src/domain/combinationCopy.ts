import type { Parent, Recipe, Traits } from "./model";
import { DECORATION_NAMES, compatible } from "./catalog";
import { describeTraits } from "./survey";
interface CombinationCopy {
  description: string;
  ability: string;
  notes: string[];
  engineVersion: 2;
  copyVersion: 2;
}
const notesFor = (parents: Parent[], recipe: Recipe): string[] => {
  const notes = parents.flatMap((parent) =>
    parent.recipe.decorations
      .filter((part) => !recipe.decorations.includes(part))
      .map(
        (part) =>
          `${parent.nickname}의 ${DECORATION_NAMES[part]}은 ${compatible(recipe.body, part) ? "같은 자리에 다른 장식이 있어" : "새 몸통에 맞지 않아"} 이번 그림에서 쉬고 있어요.`,
      ),
  );
  const shared = parents[0].recipe.decorations.filter((part) =>
    parents[1].recipe.decorations.includes(part),
  );
  if (shared.length)
    notes.push(
      `두 사람의 같은 ${shared.map((p) => DECORATION_NAMES[p]).join("·")} 특징은 하나로 모였어요.`,
    );
  if (parents[0].recipe.assetVersion !== parents[1].recipe.assetVersion)
    notes.push("서로 다른 그림 버전의 파츠는 몸통 부모의 그림체에 맞췄어요.");
  if (parents.some((parent) => parent.traits.expression === undefined))
    notes.push("이전 설문에 없던 표현 성향은 추측해서 합치지 않았어요.");
  return notes;
};
export const combinationCopy = (
  parents: Parent[],
  bodyParent: Parent,
  recipe: Recipe,
): CombinationCopy => {
  const [a, b] = parents;
  const average = (key: keyof Traits): number =>
    ((a.traits[key] ?? 0) + (b.traits[key] ?? 0)) / 2 ||
    (bodyParent.traits[key] ?? 0);
  const notes = notesFor(parents, recipe);
  if (a.traits.expression === undefined || b.traits.expression === undefined)
    return {
      description: recipe.decorations.includes("blanket")
        ? "서로의 작은 특징을 포근하게 덮어 주는 사이예요."
        : "서로의 작은 특징을 모아 둘만의 생물이 됐어요.",
      ability:
        average("energy") > 0
          ? "함께 산책하며 새로운 이야기 모으기"
          : "좋아하는 곳에서 함께 쉬어 가기",
      notes,
      engineVersion: 2,
      copyVersion: 2,
    };
  const profile = describeTraits({
    adventure: average("adventure"),
    energy: average("energy"),
    spontaneity: average("spontaneity"),
    expression: average("expression"),
  });
  return {
    description: profile.description,
    ability: profile.ability,
    notes,
    engineVersion: 2,
    copyVersion: 2,
  };
};
