import { expect, it } from "vitest";
import { creatureLayers } from "../components/creatureLayout";
import { recipeSchema, bodySchema } from "../shared/contracts";
import { comicRecipe } from "./comicCatalog";
import { offspring } from "./engine";
import { describeCompatibility } from "./compatibility";
import fusionSizes from "./fusionSizes.json";
import memes from "./memeFusions.json";
import type { Body, Parent } from "./model";
const parent = (body: Body, id: string): Parent => ({ id, nickname: id, assetVersion: 4,
  quizVersion: 3, recipe: comicRecipe(body),
  traits: { adventure: 1, energy: 1, spontaneity: 1, expression: 1, conflict: 1, support: 1 } });
it("210조합의 이야기에는 누락·중복이 없고 각 원화와 연결된다", () => {
  const bodies = [...bodySchema.options].sort();
  const pairs = bodies.flatMap((a, i) => bodies.slice(i).map((b) => `${a}-${b}`));
  expect(memes.map((item) => item.id).sort()).toEqual(pairs);
  for (const item of memes) {
    expect([item.name, item.line, item.description, item.ability, item.scene].every(Boolean)).toBe(true);
  }
});
it("밈 스타일은 v4의 독립 합성 레시피에만 허용한다", () => {
  const recipe = { ...comicRecipe("cat"), fusionBody: "frog", fusionStyle: "meme" };
  expect(recipeSchema.safeParse(recipe).success).toBe(true);
  for (const patch of [{ assetVersion: 3 }, { fusionBody: undefined }, { portraitStyle: "personality" },
    { hybrid: "duck-cat" }, { hybridStyle: "costume" }, { fusionStyle: "unknown" }]) {
    expect(recipeSchema.safeParse({ ...recipe, ...patch }).success).toBe(false);
  }
});
it("레전드의 메타와 실제 궁합을 유지하며 밈 이야기와 대사를 표시한다", async () => {
  const parents = [parent("cat", "a"), parent("cat", "b")];
  const child = await offspring(parents[0], parents[1]);
  const copy = memes.find((item) => item.id === "cat-cat")!;
  expect(child.legend).toBeDefined();
  expect(child.name).toBe(copy.name);
  expect(child.description).toContain(copy.line);
  expect(child.ability).toBe(copy.ability);
  expect(child.compatibility).toEqual(describeCompatibility(parents));
  expect(child).toEqual(await offspring(parents[1], parents[0]));
});
it("기존 원화는 보존하고 미제작 v4 조합만 v5 완성 그림을 사용한다", () => {
  const sizes: Record<string, number[]> = fusionSizes;
  for (const pair of [["cat", "mushroom"], ["sloth", "squidward"]] as const) {
    const id = [...pair].sort().join("-");
    const recipe = { ...comicRecipe(pair[0]), fusionBody: pair[1] };
    expect(creatureLayers(recipe)[0].path).toBe(`/creatures/${sizes[id] ? "v4" : "v5"}/fusions/${id}.png`);
    expect(creatureLayers({ ...recipe, fusionStyle: "meme" })[0].path).toBe(`/creatures/v5/fusions/${id}.png`);
  }
});
