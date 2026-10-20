import type { Recipe } from "../domain/model";
import type { CreatureLayer } from "./creatureLayout";
const SIZES: Record<string, [number, number]> = {
  "pepe": [1254, 1254],
  "squidward": [1254, 1254],
  "cucumber": [1254, 1254],
  "broccoli": [1254, 1254],
  "capybara-frog": [1254, 1254],
  "duck-cat": [1254, 1254],
  "hamster-potato": [1254, 1254],
  "raccoon-penguin": [1254, 1254],
  "axolotl-sloth": [1254, 1254],
  "axolotl": [1254, 1254],
  "bird": [1254, 1254],
  "capybara": [1254, 1254],
  "cat": [1261, 1247],
  "dragon": [1254, 1254],
  "duck": [1254, 1254],
  "frog": [1295, 1214],
  "ghost-jelly": [1271, 1237],
  "ghost": [1254, 1254],
  "hamster": [1254, 1254],
  "jelly": [1536, 1024],
  "mushroom-bird": [1303, 1207],
  "mushroom": [1254, 1254],
  "penguin": [1254, 1254],
  "potato": [1330, 1182],
  "raccoon": [1254, 1254],
  "sloth": [1254, 1254],
  "snail-dragon": [1254, 1254],
  "snail": [1254, 1254],
};
export const creatureLayersV4 = (recipe: Recipe): CreatureLayer[] => {
  const id = recipe.hybrid ?? recipe.body;
  const isCostume = recipe.hybridStyle === "costume" && Boolean(recipe.hybrid);
  const size: [number, number] | undefined = isCostume ? [1254, 1254] : SIZES[id];
  if (!size) throw new Error("준비되지 않은 캐릭터 외형입니다.");
  const ratio = 60 / Math.max(...size);
  const width = Math.round(size[0] * ratio), height = Math.round(size[1] * ratio);
  return [{ id, path: `/creatures/v4/${isCostume ? "costumes/" : ""}${id}.png`, source: [0, 0, ...size],
    target: [Math.floor((64 - width) / 2), 62 - height, width, height] }];
};
