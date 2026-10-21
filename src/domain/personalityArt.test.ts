import { expect, it } from "vitest";
import { surveyV3Examples } from "./surveyV3";
import { comicRecipe } from "./comicCatalog";
import { creatureLayers } from "../components/creatureLayout";
import { recipeSchema } from "../shared/contracts";
it("새 검사 7종은 완성 원화를 사용하고 저장된 레시피는 기존 그림을 유지한다", () => {
  const revised = ["cat", "frog", "potato", "mushroom", "jelly", "raccoon", "ghost"];
  for (const { recipe } of surveyV3Examples()) {
    const layers = creatureLayers(recipeSchema.parse(recipe));
    const folder = revised.includes(recipe.body) ? "personality/" : "";
    expect(layers).toHaveLength(1);
    expect(layers[0].path).toBe(`/creatures/v4/${folder}${recipe.body}.png`);
    if (folder) expect(layers[0].source).toEqual([0, 0, 1254, 1254]);
    expect(creatureLayers(comicRecipe(recipe.body))[0].path).toBe(`/creatures/v4/${recipe.body}.png`);
  }
});
it("개인 원화를 합성·구버전·미지원 종에 적용하는 레시피를 거부한다", () => {
  const base = { ...comicRecipe("cat"), portraitStyle: "personality" };
  expect(recipeSchema.safeParse(base).success).toBe(true);
  for (const patch of [{ fusionBody: "frog" }, { hybrid: "duck-cat" }, { assetVersion: 3 }, { body: "dragon" }])
    expect(recipeSchema.safeParse({ ...base, ...patch }).success).toBe(false);
});
