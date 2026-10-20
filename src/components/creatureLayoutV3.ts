import type { Body, Recipe } from "../domain/model";
import type { CreatureLayer } from "./creatureLayout";
type Point = [number, number];
interface Placement {
  face: Point;
  head: Point;
  coveredFace: Point;
  coveredHead: Point;
}
const PLACEMENTS: Record<Body, Placement> = {
  snail: {
    face: [39, 40],
    head: [14, 8],
    coveredFace: [39, 44],
    coveredHead: [18, 6],
  },
  ghost: {
    face: [22, 36],
    head: [24, 4],
    coveredFace: [18, 38],
    coveredHead: [24, 6],
  },
  jelly: {
    face: [22, 40],
    head: [24, 8],
    coveredFace: [25, 43],
    coveredHead: [24, 12],
  },
  mushroom: {
    face: [22, 44],
    head: [24, 0],
    coveredFace: [22, 44],
    coveredHead: [24, 0],
  },
  bird: {
    face: [22, 38],
    head: [24, 4],
    coveredFace: [22, 38],
    coveredHead: [24, 4],
  },
  dragon: {
    face: [30, 36],
    head: [27, 0],
    coveredFace: [30, 36],
    coveredHead: [27, 0],
  },
};
const part = (
  id: string,
  version: number,
  position: Point,
  width = 64,
  height = 64,
  extension = "png",
): CreatureLayer => ({
  id,
  path: `/creatures/v${version}/${id}.${extension}`,
  source: [0, 0, width, height],
  target: [...position, width, height],
});
export const creatureLayersV3 = (recipe: Recipe): CreatureLayer[] => {
  const covered = recipe.decorations.includes("blanket");
  const placement = PLACEMENTS[recipe.body];
  const head = covered ? placement.coveredHead : placement.head;
  const accessories = recipe.decorations
    .filter((id) => id !== "blanket")
    .map((id): CreatureLayer => {
      if (id === "sparkles") return part(id, 3, [0, 4], 8, 12, "svg");
      if (id === "leaves") return part(id, 1, [head[0], head[1] + 10], 16, 10);
      return part(id, 1, head, 16, 20);
    });
  const body = part(
    covered ? `${recipe.body}-blanket` : recipe.body,
    covered ? 3 : 1,
    [0, 0],
  );
  const fitted =
    recipe.body === "snail" || (covered && recipe.body === "ghost");
  const width = recipe.body === "snail" ? 16 : fitted ? 18 : 20;
  const height = recipe.body === "snail" ? 8 : fitted ? 9 : 10;
  const face = part(
    fitted ? `${recipe.face}-${recipe.body}` : recipe.face,
    fitted ? 3 : 2,
    covered ? placement.coveredFace : placement.face,
    width,
    height,
  );
  // 착용 파츠가 불꽃의 뿌리를 가려 천 뒤에서 솟는 앞뒤 관계를 만든다.
  return covered || recipe.body === "dragon"
    ? [...accessories, body, face]
    : [body, face, ...accessories];
};
