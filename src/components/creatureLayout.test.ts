import { describe, expect, it } from "vitest";
import { creatureLayers } from "./creatureLayout";
import { parentRecipe, offspring } from "../domain/engine";
import type { Parent, Recipe } from "../domain/model";
import { recipeSchema } from "../shared/contracts";
const recipe: Recipe = {
  assetVersion: 2,
  body: "snail",
  face: "sleepy",
  decorations: ["flame", "blanket"],
  palette: "original",
};
describe("읽기 쉬운 캐릭터 합성", () => {
  it("이불 뒤에 얼굴을 숨기지 않고 머리 장식을 마지막에 그린다", () => {
    expect(creatureLayers(recipe).map((layer) => layer.id)).toEqual([
      "snail",
      "blanket-snail",
      "sleepy",
      "flame",
    ]);
  });
  it("달팽이 이불이 얼굴 영역과 겹치지 않는다", () => {
    const layers = creatureLayers(recipe);
    const blanket = layers.find((layer) => layer.id === "blanket-snail")!;
    const face = layers.find((layer) => layer.id === "sleepy")!;
    expect(blanket.target[0] + blanket.target[2]).toBeLessThanOrEqual(
      face.target[0],
    );
    expect(face.target[3]).toBeGreaterThanOrEqual(8);
  });
  it("구버전 저장 레시피의 경로·합성 순서·좌표를 유지한다", () => {
    const legacy = { ...recipe, assetVersion: 1 as const };
    expect(recipeSchema.parse(legacy)).toEqual(legacy);
    expect(
      creatureLayers(legacy).map((layer) => [layer.path, layer.target]),
    ).toEqual([
      ["/creatures/v1/snail.png", [0, 0, 64, 64]],
      ["/creatures/v1/sleepy.png", [38, 40, 64, 64]],
      ["/creatures/v1/flame.png", [17, 0, 64, 64]],
      ["/creatures/v1/blanket-snail.png", [-2, 0, 64, 64]],
    ]);
  });
  it("새 부모는 v3, 혼합 버전 자식은 몸통 부모 버전을 따른다", async () => {
    const answers = Array.from({ length: 6 }, (_, i) => ({
      questionId: `q${i + 1}`,
      optionId: "a",
    }));
    expect(parentRecipe(answers).assetVersion).toBe(3);
    const a: Parent = {
      id: "a",
      nickname: "a",
      traits: { adventure: 0, energy: 0, spontaneity: 0 },
      recipe,
      assetVersion: 2,
    };
    const b: Parent = {
      ...a,
      id: "b",
      recipe: { ...recipe, assetVersion: 1 },
      assetVersion: 1,
    };
    const child = await offspring(a, b);
    const source = child.inheritance.find((item) => item.slot === "body")!;
    expect(child.recipe.assetVersion).toBe(source.parentId === "a" ? 2 : 1);
  });
});
it("이불 v3은 몸통별 착용 파츠이며 불꽃이 천 뒤에서 솟는다", () => {
  for (const body of ["snail", "ghost", "jelly"] as const) {
    const layers = creatureLayers({ ...recipe, body, assetVersion: 3 });
    expect(layers.map((item) => item.id)).toEqual([
      "flame",
      `${body}-blanket`,
      body === "jelly" ? "sleepy" : `sleepy-${body}`,
    ]);
    expect(layers[1].path).toBe(`/creatures/v3/${body}-blanket.png`);
    for (const item of layers)
      expect(item.source.slice(2)).toEqual(item.target.slice(2));
  }
});
it("v3 반짝임은 더듬이와 뿔이 없는 좌측 여백에 둔다", () => {
  const layers = creatureLayers({
    ...recipe,
    assetVersion: 3,
    decorations: ["sparkles"],
  });
  const sparkle = layers.find((item) => item.id === "sparkles")!;
  expect(sparkle.target).toEqual([0, 4, 8, 12]);
});
it("중복 장식과 같은 머리 슬롯 충돌을 거부한다", () => {
  for (const decorations of [
    ["flame", "flame"],
    ["flame", "leaves"],
  ]) {
    expect(recipeSchema.safeParse({ ...recipe, decorations }).success).toBe(
      false,
    );
  }
});
it("전체84개 v3 허용 조합의 파츠는64px 안에서 원래 픽셀 크기로 합성한다", () => {
  const bodies = [
    "snail",
    "ghost",
    "jelly",
    "mushroom",
    "bird",
    "dragon",
  ] as const;
  const decorations = ["flame", "blanket", "sparkles", "leaves"] as const;
  const sets = decorations.flatMap((first, i) => [
    [first],
    ...decorations.slice(i + 1).map((second) => [first, second]),
  ]);
  let count = 0;
  for (const body of bodies)
    for (const face of ["happy", "sleepy"] as const)
      for (const selected of sets) {
        const parsed = recipeSchema.safeParse({
          assetVersion: 3,
          body,
          face,
          decorations: selected,
          palette: "original",
        });
        if (!parsed.success) continue;
        count++;
        for (const item of creatureLayers(parsed.data)) {
          expect(item.source.slice(2)).toEqual(item.target.slice(2));
          expect(item.target[0]).toBeGreaterThanOrEqual(0);
          expect(item.target[1]).toBeGreaterThanOrEqual(0);
          expect(item.target[0] + item.target[2]).toBeLessThanOrEqual(64);
          expect(item.target[1] + item.target[3]).toBeLessThanOrEqual(64);
        }
      }
  expect(count).toBe(84);
});

it("작은 새의 얼굴은 왼쪽 날개를 피하고 머리 안에 배치한다", () => {
  for (const face of ["happy", "sleepy"] as const) {
    const layers = creatureLayers({
      assetVersion: 3, body: "bird", face,
      decorations: ["leaves", "sparkles"], palette: "original",
    });
    const placed = layers.find((item) => item.id === face)!;
    const [x, y, width, height] = placed.target;
    expect(x).toBeGreaterThanOrEqual(29);
    expect(y).toBeGreaterThanOrEqual(32);
    expect(x + width).toBeLessThanOrEqual(51);
    expect(y + height).toBeLessThanOrEqual(44);
  }
});

it("버섯과 고양이는 순서와 관계없이 절단 없는 동일한 완성 외형을 사용한다", () => {
  const first = creatureLayers({ assetVersion: 4, body: "mushroom", fusionBody: "cat",
    face: "signature", decorations: [], palette: "original" });
  const reverse = creatureLayers({ assetVersion: 4, body: "cat", fusionBody: "mushroom",
    face: "signature", decorations: [], palette: "original" });
  expect(first).toEqual(reverse);
  expect(first).toHaveLength(1);
  expect(first[0].path).toBe("/creatures/v4/fusions/cat-mushroom.png");
  expect(first[0].source).toEqual([0, 0, 1254, 1254]);
});
