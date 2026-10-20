import { describeCompatibility } from "./compatibility";
import { discoverLegend } from "./legends";
import { BODY_NAMES, COMIC_NAMES } from "./catalog";
import { COMIC_COPY, findHybrid } from "./comicCatalog";
import { combinationCopy } from "./combinationCopy";
import type { Child, Parent, Recipe } from "./model";
export const comicOffspring = (parents: Parent[], bodyParent: Parent): Child | undefined => {
  const [a, b] = parents;
  const hybrid = parents.every((parent) => parent.recipe.assetVersion >= 3)
    ? findHybrid(a.recipe.body, b.recipe.body) : undefined;
  if (!hybrid && parents.every((parent) => parent.recipe.assetVersion !== 4)) return undefined;
  const otherParent = parents.find((parent) => parent.id !== bodyParent.id)!;
  const legend = discoverLegend(parents);
  const compatibility = parents.some((parent) => parent.quizVersion === 3) ? describeCompatibility(parents) : undefined;
  const recipe: Recipe = hybrid
    ? { assetVersion: 4, body: hybrid.baseBody, hybrid: hybrid.id, hybridStyle: "costume",
        face: "signature", decorations: [], palette: "original" }
    : { assetVersion: 4, body: bodyParent.recipe.body, fusionBody: otherParent.recipe.body,
        face: "signature", decorations: [], palette: "original" };
  const resultRecipe = legend ? { ...recipe, legend: legend.id } : recipe;
  const copy = combinationCopy(parents, bodyParent, recipe);
  const comic = COMIC_COPY[bodyParent.recipe.body];
  return {
    ...copy, recipe: resultRecipe, engineVersion: 3,
    ...(compatibility ? { compatibility } : {}), ...(legend ? { legend } : {}),
    name: legend?.name ?? hybrid?.name ?? `${BODY_NAMES[bodyParent.recipe.body]} × ${BODY_NAMES[otherParent.recipe.body]}`,
    description: legend?.reason ?? (compatibility ? compatibility.strengths.join(" ") : undefined) ?? hybrid?.description ?? `${comic.description} ${copy.description}`,
    ability: legend?.ability ?? (compatibility ? "서로의 다른 방식을 알아보고 둘만의 공략법 만들기" : undefined) ?? hybrid?.ability ?? `${comic.ability}. ${copy.ability}`,
    inheritance: parents.map((parent) => ({
      parentId: parent.id, partId: parent.recipe.body,
      slot: hybrid ? (parent.recipe.body !== hybrid.baseBody ? "decoration" : "body")
        : (parent.id === bodyParent.id ? "body" : "face"),
      label: hybrid && parent.recipe.body !== hybrid.baseBody ? hybrid.costumeLabel
        : (parent.recipe.assetVersion === 4 ? COMIC_NAMES : BODY_NAMES)[parent.recipe.body],
    })),
    notes: [
      ...(parents.some((parent) => parent.traits.expression === undefined)
        ? ["이전 설문에 없던 표현 성향은 추측해서 합치지 않았어요."] : []),
      hybrid ? "한 부모의 몸과 다른 부모를 닮은 옷·소품을 함께 담았어요."
        : "두 부모의 상반신과 몸통이 합쳐졌어요. 같은 종끼리도 두 머리로 태어나요.",
      ...(parents.some((parent) => parent.recipe.decorations.length)
        ? ["고유 표정과 소품을 가리지 않도록 기존 장식은 덧붙이지 않았어요."] : []),
    ],
  };
};
