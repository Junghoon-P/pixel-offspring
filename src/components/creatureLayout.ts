import { creatureLayersV4 } from "./creatureLayoutV4";
import { isLegacyBody } from "../domain/comicCatalog";
import { creatureLayersV3 } from "./creatureLayoutV3";
import type { LegacyBody, Recipe } from "../domain/model";
type Rect = [number, number, number, number];
interface Anchor {
  face: [number, number];
  head: [number, number];
  blanket: [number, number];
}
export interface CreatureLayer {
  id: string;
  path: string;
  source: Rect;
  target: Rect;
}
const LEGACY: Record<LegacyBody, Anchor> = {
  snail: { face: [38, 40], head: [17, 0], blanket: [-2, 0] },
  ghost: { face: [18, 35], head: [24, 2], blanket: [0, 0] },
  jelly: { face: [23, 40], head: [24, 8], blanket: [0, 0] },
  mushroom: { face: [23, 44], head: [24, 0], blanket: [0, 0] },
  bird: { face: [23, 36], head: [24, 2], blanket: [0, 0] },
  dragon: { face: [29, 32], head: [30, 0], blanket: [0, 0] },
};
interface Layout {
  face: Rect;
  head: [number, number];
  blanket: Rect;
}
const LAYOUT: Record<LegacyBody, Layout> = {
  snail: { face: [38, 38, 18, 10], head: [14, 8], blanket: [4, 20, 34, 36] },
  ghost: { face: [22, 36, 20, 10], head: [24, 4], blanket: [6, 19, 52, 40] },
  jelly: { face: [22, 40, 20, 10], head: [24, 8], blanket: [6, 25, 52, 34] },
  mushroom: { face: [22, 44, 20, 10], head: [24, 0], blanket: [0, 0, 0, 0] },
  bird: { face: [22, 38, 20, 10], head: [24, 4], blanket: [0, 0, 0, 0] },
  dragon: { face: [30, 36, 20, 10], head: [28, 0], blanket: [0, 0, 0, 0] },
};
const layer = (
  id: string,
  target: Rect,
  source: Rect = [0, 0, 64, 64],
  version = 1,
): CreatureLayer => ({
  id,
  path: `/creatures/v${version}/${id}.png`,
  source,
  target,
});
const legacyLayers = (recipe: Recipe): CreatureLayer[] => {
  if (!isLegacyBody(recipe.body)) throw new Error("구버전 몸통이 아닙니다.");
  const anchor = LEGACY[recipe.body];
  return [
    layer(recipe.body, [0, 0, 64, 64]),
    layer(recipe.face, [...anchor.face, 64, 64]),
    ...recipe.decorations.map((id): CreatureLayer => {
      const position =
        id === "blanket"
          ? anchor.blanket
          : id === "sparkles"
            ? [51, 12]
            : id === "leaves"
              ? [anchor.head[0], anchor.head[1] + 10]
              : anchor.head;
      return layer(
        id === "blanket" && recipe.body === "snail" ? "blanket-snail" : id,
        [position[0], position[1], 64, 64],
      );
    }),
  ];
};
export const creatureLayers = (recipe: Recipe): CreatureLayer[] => {
  if (recipe.assetVersion === 4) return creatureLayersV4(recipe);
  if (!isLegacyBody(recipe.body)) throw new Error("구버전 몸통이 아닙니다.");
  if (recipe.assetVersion === 3) return creatureLayersV3(recipe);
  if (recipe.assetVersion === 1) return legacyLayers(recipe);
  const layout = LAYOUT[recipe.body];
  const hasBlanket = recipe.decorations.includes("blanket");
  const headY = hasBlanket ? layout.blanket[1] - 18 : layout.head[1];
  return [
    layer(recipe.body, [0, 0, 64, 64]),
    ...(hasBlanket
      ? [
          layer(
            recipe.body === "snail" ? "blanket-snail" : "blanket",
            layout.blanket,
            [0, 0, 48, 40],
            2,
          ),
        ]
      : []),
    layer(recipe.face, layout.face, [0, 0, 20, 10], 2),
    ...recipe.decorations
      .filter((id) => id !== "blanket")
      .map((id): CreatureLayer => {
        if (id === "sparkles")
          return layer(id, [52, 15, 10, 16], [0, 0, 10, 16]);
        if (id === "leaves")
          return layer(
            id,
            [layout.head[0], headY + 10, 16, 10],
            [0, 0, 16, 10],
          );
        return layer(id, [layout.head[0], headY, 16, 20], [0, 0, 16, 20]);
      }),
  ];
};
