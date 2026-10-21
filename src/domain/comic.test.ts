import { readFileSync } from "node:fs";
import { comicRecipe, HYBRIDS } from "./comicCatalog";
import { expect, it } from "vitest";
import { surveyExamples } from "./survey";
import { offspring } from "./engine";
import { bodySchema, recipeSchema, childSchema } from "../shared/contracts";
import { creatureLayers } from "../components/creatureLayout";
import type { Parent } from "./model";

it("기존 코스튬 조합도 새 밈 원화로 생성하며 부모 순서와 무관하다", async () => {
  const pairs = [["capybara", "frog", "capybara-frog"], ["duck", "cat", "duck-cat"],
    ["hamster", "potato", "hamster-potato"], ["raccoon", "penguin", "raccoon-penguin"],
    ["axolotl", "sloth", "axolotl-sloth"]] as const;
  const samples = surveyExamples();
  for (const [a, b] of pairs) {
    const parent = (body: typeof a | typeof b): Parent => ({
      ...samples.find((sample) => sample.recipe.body === body)!, id: body, nickname: body, assetVersion: 4,
    });
    const first = parent(a), second = parent(b);
    const child = await offspring(first, second);
    expect(child.recipe.fusionStyle).toBe("meme");
    expect(child).toEqual(await offspring(second, first));
    expect(child.inheritance.map((item) => item.partId).sort()).toEqual([a, b].sort());
    expect(childSchema.safeParse(child).success).toBe(true);
    expect(creatureLayers(child.recipe)[0].path).toBe(`/creatures/v5/fusions/${[a, b].sort().join("-")}.png`);
  }
});

it("설문에서 신규 여섯 종이 나오며 고유 얼굴을 중복 합성하지 않는다", () => {
  const samples = surveyExamples();
  for (const body of ["capybara", "frog", "duck", "cat", "hamster", "potato"]) {
    const item = samples.find((sample) => sample.recipe.body === body);
    expect(item, body).toBeDefined();
    expect(recipeSchema.safeParse(item!.recipe).success).toBe(true);
    const layers = creatureLayers(item!.recipe);
    expect(layers).toHaveLength(1);
    expect(layers[0].path).toBe(`/creatures/v4/${body}.png`);
  }
});

it("v3 전용 조합도 신규 밈 원화와 양쪽 상속을 사용한다", async () => {
  const pairs = [["mushroom", "bird", "mushroom-bird"], ["snail", "dragon", "snail-dragon"], ["ghost", "jelly", "ghost-jelly"]] as const;
  for (const [a, b] of pairs) {
    const parent = (body: typeof a | typeof b, id: string): Parent => ({
      id, nickname: id, assetVersion: 3,
      traits: { adventure: 0, energy: 0, spontaneity: 0 },
      recipe: { body, assetVersion: 3, face: "happy", decorations: [], palette: "original" },
    });
    const first = parent(a, "first"), second = parent(b, "second");
    const child = await offspring(first, second);
    expect(child.recipe.fusionStyle).toBe("meme");
    expect(child.recipe.assetVersion).toBe(4);
    expect(child).toEqual(await offspring(second, first));
    expect(child.inheritance.map((item) => item.partId).sort()).toEqual([a, b].sort());
    expect(childSchema.safeParse(child).success).toBe(true);
    expect(creatureLayers(child.recipe)).toHaveLength(1);
  }
});

it("신규 외형의 구버전 위장과 이중 얼굴·소품 조합을 거부한다", () => {
  const recipe = { body: "frog", assetVersion: 4, face: "signature", decorations: [], palette: "original" };
  expect(recipeSchema.safeParse(recipe).success).toBe(true);
  for (const patch of [{ assetVersion: 3 }, { face: "happy" }, { decorations: ["blanket"] }, { hybrid: "ghost-jelly" }])
    expect(recipeSchema.safeParse({ ...recipe, ...patch }).success).toBe(false);
});

it("16유형은 표정 변형 없이 16개 독립 몸통을 사용한다", () => {
  const samples = surveyExamples();
  expect(new Set(samples.map((item) => item.recipe.body)).size).toBe(16);
  for (const sample of samples) {
    expect(sample.recipe.assetVersion).toBe(4);
    expect(sample.recipe.face).toBe("signature");
    expect(sample.recipe.decorations).toEqual([]);
    expect(recipeSchema.safeParse(sample.recipe).success).toBe(true);
  }
});

it("모든 전용 외형 파일의 실제 크기와 렌더러가 일치한다", () => {
  const recipes = [...bodySchema.options.map(comicRecipe),
    ...HYBRIDS.map((design) => ({ assetVersion: 4 as const, body: design.parents[0], hybrid: design.id,
      face: "signature" as const, decorations: [], palette: "original" as const }))];
  for (const recipe of recipes) {
    const layer = creatureLayers(recipe)[0];
    const png = readFileSync(`public${layer.path}`);
    expect(layer.source).toEqual([0, 0, png.readUInt32BE(16), png.readUInt32BE(20)]);
    const [x, y, width, height] = layer.target;
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(64);
    expect(y + height).toBeLessThanOrEqual(64);
  }
});

it("신규 8조합은 밈 원화를 쓰고 저장된 기존 레시피의 외형은 보존한다", async () => {
  for (const design of HYBRIDS) {
    const parents: Parent[] = design.parents.map((body) => ({
      id: body, nickname: body, assetVersion: 4, recipe: comicRecipe(body),
      traits: { adventure: 0, energy: 0, spontaneity: 0, expression: 0 },
    }));
    const child = await offspring(parents[0], parents[1]);
    expect(child.recipe.fusionStyle).toBe("meme");
    expect(child.recipe.hybrid).toBeUndefined();
    expect(creatureLayers(child.recipe)[0].path).toBe(`/creatures/v5/fusions/${[...design.parents].sort().join("-")}.png`);
    const legacy = { ...comicRecipe(design.parents[0]), hybrid: design.id };
    expect(recipeSchema.safeParse(legacy).success).toBe(true);
    expect(creatureLayers(legacy)[0].path).toBe(`/creatures/v4/${design.id}.png`);
    expect(recipeSchema.safeParse({ ...comicRecipe(design.baseBody), hybridStyle: "costume" }).success).toBe(false);
  }
});

it("20종의 모든 신규 조합은 같은 종까지 양쪽 부모 외형을 합성한다", async () => {
  for (const [i, a] of bodySchema.options.entries()) {
    for (const b of bodySchema.options.slice(i)) {
      const parents: Parent[] = [a, b].map((body, index) => ({
        id: `${index}-${body}`, nickname: body, assetVersion: 4, recipe: comicRecipe(body),
        traits: { adventure: 0, energy: 0, spontaneity: 0, expression: 0 },
      }));
      const child = await offspring(parents[0], parents[1]);
      expect(child).toEqual(await offspring(parents[1], parents[0]));
      expect(childSchema.safeParse(child).success).toBe(true);
      expect(child.inheritance.map((part) => part.parentId).sort()).toEqual(parents.map((p) => p.id).sort());
      if (child.recipe.hybrid) continue;
      const layers = creatureLayers(child.recipe);
      const pair = [a, b].sort().join("-");
      expect(layers.map((layer) => layer.path)).toEqual([`/creatures/v5/fusions/${pair}.png`]);
      const png = readFileSync(`public${layers[0].path}`);
      expect(layers[0].source).toEqual([0, 0, png.readUInt32BE(16), png.readUInt32BE(20)]);
      expect(layers).not.toEqual(creatureLayers(parents[0].recipe));
      expect(layers).not.toEqual(creatureLayers(parents[1].recipe));
    }
  }
});

it("합성 레시피는 구버전·코스튬 혼용과 알 수 없는 부모를 거부한다", () => {
  const recipe = { ...comicRecipe("cat"), fusionBody: "raccoon" };
  expect(recipeSchema.safeParse(recipe).success).toBe(true);
  for (const patch of [{ assetVersion: 3 }, { fusionBody: "missing" }, { hybrid: "duck-cat" }, { hybridStyle: "costume" }]) {
    expect(recipeSchema.safeParse({ ...recipe, ...patch }).success).toBe(false);
  }
});

it("저장된 fusion 레시피도 코스튬 8쌍의 완성 그림을 양방향으로 조회한다", () => {
  for (const design of HYBRIDS) {
    const [a, b] = design.parents;
    const first = creatureLayers({ ...comicRecipe(a), fusionBody: b });
    const reverse = creatureLayers({ ...comicRecipe(b), fusionBody: a });
    expect(first).toEqual(reverse);
    expect(first).toHaveLength(1);
    expect(first[0].path).toBe(`/creatures/v4/costumes/${design.id}.png`);
  }
});

it("v1 달팽이와 v4 용의 혼합도 완성 원화를 표시한다", async () => {
  const first: Parent = { id: "old", nickname: "old", assetVersion: 1,
    traits: { adventure: 0, energy: 0, spontaneity: 0 },
    recipe: { assetVersion: 1, body: "snail", face: "happy", decorations: [], palette: "original" } };
  const second: Parent = { ...first, id: "new", assetVersion: 4, recipe: comicRecipe("dragon") };
  const child = await offspring(first, second);
  expect(child.recipe.fusionBody).toBeDefined();
  expect(creatureLayers(child.recipe)[0].path).toBe("/creatures/v5/fusions/dragon-snail.png");
});
