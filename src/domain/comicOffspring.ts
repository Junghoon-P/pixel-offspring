import { BODY_NAMES, COMIC_NAMES } from "./catalog";
import { COMIC_COPY, findHybrid } from "./comicCatalog";
import { combinationCopy } from "./combinationCopy";
import type { Child, Parent, Recipe } from "./model";
export const comicOffspring = (parents: Parent[], bodyParent: Parent): Child | undefined => {
  const [a, b] = parents;
  const hybrid = parents.every((parent) => parent.recipe.assetVersion >= 3)
    ? findHybrid(a.recipe.body, b.recipe.body) : undefined;
  if (!hybrid && bodyParent.recipe.assetVersion !== 4) return undefined;
  const recipe: Recipe = hybrid
    ? { assetVersion: 4, body: hybrid.baseBody, hybrid: hybrid.id, hybridStyle: "costume",
        face: "signature", decorations: [], palette: "original" }
    : { ...bodyParent.recipe, decorations: [] };
  const copy = combinationCopy(parents, bodyParent, recipe);
  const comic = COMIC_COPY[bodyParent.recipe.body];
  return {
    ...copy, recipe, engineVersion: 3,
    name: hybrid?.name ?? COMIC_NAMES[bodyParent.recipe.body],
    description: hybrid?.description ?? `${comic.description} ${copy.description}`,
    ability: hybrid?.ability ?? `${comic.ability}. ${copy.ability}`,
    inheritance: (hybrid ? parents : [bodyParent]).map((parent) => ({
      parentId: parent.id, partId: parent.recipe.body,
      slot: hybrid && parent.recipe.body !== hybrid.baseBody ? "decoration" : "body",
      label: hybrid && parent.recipe.body !== hybrid.baseBody ? hybrid.costumeLabel
        : (parent.recipe.assetVersion === 4 ? COMIC_NAMES : BODY_NAMES)[parent.recipe.body],
    })),
    notes: [
      ...(parents.some((parent) => parent.traits.expression === undefined)
        ? ["이전 설문에 없던 표현 성향은 추측해서 합치지 않았어요."] : []),
      hybrid ? "한 부모의 몸과 다른 부모를 닮은 옷·소품을 함께 담았어요."
        : "이번 조합은 한 부모의 고유 외형을 이어받고, 두 사람의 성향을 설명에 담았어요.",
      ...(parents.some((parent) => parent.recipe.decorations.length)
        ? ["고유 표정과 소품을 가리지 않도록 기존 장식은 덧붙이지 않았어요."] : []),
    ],
  };
};
