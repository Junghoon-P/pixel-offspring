import { describeCombination } from "./combinationReading";
import { recipeName } from "./personalityArt";
import { describeCompatibility } from "./compatibility";
import { discoverLegend } from "./legends";
import memeFusions from "./memeFusions.json" with { type: "json" };
import { BODY_NAMES } from "./catalog";
import { findHybrid } from "./comicCatalog";
import { combinationCopy } from "./combinationCopy";
import type { Child, Parent, Recipe } from "./model";
export const comicOffspring = (parents: Parent[], bodyParent: Parent): Child | undefined => {
  const [a, b] = parents;
  const hybrid = parents.every((parent) => parent.recipe.assetVersion >= 3)
    ? findHybrid(a.recipe.body, b.recipe.body) : undefined;
  if (!hybrid && parents.every((parent) => parent.recipe.assetVersion !== 4)) return undefined;
  const otherParent = parents.find((parent) => parent.id !== bodyParent.id)!;
  const legend = discoverLegend(parents);
  const combinationReading = describeCombination(parents);
  const compatibility = parents.some((parent) => (parent.quizVersion ?? 0) >= 3) ? describeCompatibility(parents) : undefined;
  const recipe: Recipe = { assetVersion: 4, body: bodyParent.recipe.body,
    fusionBody: otherParent.recipe.body, fusionStyle: "meme",
    face: "signature", decorations: [], palette: "original" };
  const pair = [recipe.body, recipe.fusionBody].sort().join("-");
  const meme = memeFusions.find((item) => item.id === pair);
  if (!meme) throw new Error("준비되지 않은 조합 이야기입니다.");
  const resultRecipe = legend ? { ...recipe, legend: legend.id } : recipe;
  const copy = combinationCopy(parents, bodyParent, recipe);
  return {
    ...(combinationReading ? { combinationReading } : {}),
    ...copy, recipe: resultRecipe, engineVersion: 3,
    ...(compatibility ? { compatibility } : {}), ...(legend ? { legend } : {}),
    name: meme.name, description: `${meme.line} ${meme.description}`, ability: meme.ability,
    inheritance: parents.map((parent) => ({
      parentId: parent.id, partId: parent.recipe.body,
      slot: parent.id === bodyParent.id ? "body" : "face",
      label: parent.recipe.assetVersion === 4 ? recipeName(parent.recipe) : BODY_NAMES[parent.recipe.body],
    })),
    notes: [
      ...(parents.some((parent) => parent.traits.expression === undefined)
        ? ["이전 설문에 없던 표현 성향은 추측해서 합치지 않았어요."] : []),
      "그림은 두 캐릭터를 섞은 상상이에요. 관계 풀이는 두 사람이 고른 답변을 바탕으로 안내해요.",
      ...(parents.some((parent) => parent.recipe.decorations.length)
        ? ["고유 표정과 소품을 가리지 않도록 기존 장식은 덧붙이지 않았어요."] : []),
    ],
  };
};
