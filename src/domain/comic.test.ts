import { readFileSync } from "node:fs";
import { comicRecipe, HYBRIDS } from "./comicCatalog";
import { expect, it } from "vitest";
import { surveyExamples } from "./survey";
import { offspring } from "./engine";
import { bodySchema, recipeSchema, childSchema } from "../shared/contracts";
import { creatureLayers } from "../components/creatureLayout";
import type { Parent } from "./model";

it("추가 열 종의 다섯 코스튬은 양쪽 특징을 상속하며 순서와 무관하다", async () => {
  const pairs = [["capybara", "frog", "capybara-frog"], ["duck", "cat", "duck-cat"],
    ["hamster", "potato", "hamster-potato"], ["raccoon", "penguin", "raccoon-penguin"],
    ["axolotl", "sloth", "axolotl-sloth"]] as const;
  const samples = surveyExamples();
  for (const [a, b, id] of pairs) {
    const parent = (body: typeof a | typeof b): Parent => ({
      ...samples.find((sample) => sample.recipe.body === body)!, id: body, nickname: body, assetVersion: 4,
    });
    const first = parent(a), second = parent(b);
    const child = await offspring(first, second);
    expect(child.recipe.hybrid).toBe(id);
    expect(child).toEqual(await offspring(second, first));
    expect(child.inheritance.map((item) => item.partId).sort()).toEqual([a, b].sort());
    expect(childSchema.safeParse(child).success).toBe(true);
    expect(creatureLayers(child.recipe)[0].path).toBe(`/creatures/v4/costumes/${id}.png`);
    expect(recipeSchema.safeParse({ ...child.recipe, body: "bird" }).success).toBe(false);
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

it("세 전용 코스튬은 몸통과 소품을 상속하고 순서가 바뀌어도 같다", async () => {
  const pairs = [["mushroom", "bird", "mushroom-bird"], ["snail", "dragon", "snail-dragon"], ["ghost", "jelly", "ghost-jelly"]] as const;
  for (const [a, b, hybrid] of pairs) {
    const parent = (body: typeof a | typeof b, id: string): Parent => ({
      id, nickname: id, assetVersion: 3,
      traits: { adventure: 0, energy: 0, spontaneity: 0 },
      recipe: { body, assetVersion: 3, face: "happy", decorations: [], palette: "original" },
    });
    const first = parent(a, "first"), second = parent(b, "second");
    const child = await offspring(first, second);
    expect(child.recipe.hybrid).toBe(hybrid);
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

it("코스튬 8종은 새 조합에만 적용하고 저장된 기존 레시피의 외형은 보존한다", async () => {
  for (const design of HYBRIDS) {
    const parents: Parent[] = design.parents.map((body) => ({
      id: body, nickname: body, assetVersion: 4, recipe: comicRecipe(body),
      traits: { adventure: 0, energy: 0, spontaneity: 0, expression: 0 },
    }));
    const child = await offspring(parents[0], parents[1]);
    expect(child.recipe).toMatchObject({ hybrid: design.id, hybridStyle: "costume", body: design.baseBody });
    expect(child.inheritance.find((item) => item.slot === "body")?.partId).toBe(design.baseBody);
    expect(child.inheritance.find((item) => item.slot === "decoration")?.label).toBe(design.costumeLabel);
    expect(child.notes).toContain("한 부모의 몸과 다른 부모를 닮은 옷·소품을 함께 담았어요.");
    const layer = creatureLayers(child.recipe)[0];
    expect(layer.path).toBe(`/creatures/v4/costumes/${design.id}.png`);
    const png = readFileSync(`public${layer.path}`);
    expect(layer.source).toEqual([0, 0, png.readUInt32BE(16), png.readUInt32BE(20)]);
    const legacy = { ...comicRecipe(design.parents[0]), hybrid: design.id };
    expect(recipeSchema.safeParse(legacy).success).toBe(true);
    expect(creatureLayers(legacy)[0].path).toBe(`/creatures/v4/${design.id}.png`);
    expect(recipeSchema.safeParse({ ...comicRecipe(design.baseBody), hybridStyle: "costume" }).success).toBe(false);
    const otherBody = design.parents.find((body) => body !== design.baseBody);
    expect(recipeSchema.safeParse({ ...child.recipe, body: otherBody }).success).toBe(false);
  }
});
