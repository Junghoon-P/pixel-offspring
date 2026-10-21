import { findHybrid } from "../domain/comicCatalog";
import memeFusionSizes from "../domain/memeFusionSizes.json";
import fusionSizes from "../domain/fusionSizes.json";
import { LEGENDS } from "../domain/legends";
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
const portraitLayers = (recipe: Recipe): CreatureLayer[] => {
  if (recipe.portraitStyle) return [{ id: recipe.body, path: `/creatures/v4/personality/${recipe.body}.png`,
    source: [0, 0, 1254, 1254], target: [2, 2, 60, 60] }];
  if (recipe.fusionBody) {
    const pair = [recipe.body, recipe.fusionBody].sort().join("-");
    const sizes: Record<string, number[]> = fusionSizes;
    const costume = recipe.fusionStyle ? undefined : findHybrid(recipe.body, recipe.fusionBody);
    const memeSizes: Record<string, number[]> = memeFusionSizes;
    const useMeme = recipe.fusionStyle === "meme" || (!costume && !sizes[pair]);
    const size = costume ? [1254, 1254] : (useMeme ? memeSizes : sizes)[pair];
    if (!size) throw new Error("준비되지 않은 조합 외형입니다.");
    const ratio = 60 / Math.max(...size);
    const width = Math.round(size[0] * ratio), height = Math.round(size[1] * ratio);
    return [{ id: pair, path: costume ? `/creatures/v4/costumes/${costume.id}.png` : `/creatures/${useMeme ? "v5" : "v4"}/fusions/${pair}.png`,
      source: [0, 0, size[0], size[1]],
      target: [Math.floor((64 - width) / 2), 62 - height, width, height] }];
  }
  const id = recipe.hybrid ?? recipe.body;
  const isCostume = recipe.hybridStyle === "costume" && Boolean(recipe.hybrid);
  const size: [number, number] | undefined = isCostume ? [1254, 1254] : SIZES[id];
  if (!size) throw new Error("준비되지 않은 캐릭터 외형입니다.");
  const ratio = 60 / Math.max(...size);
  const width = Math.round(size[0] * ratio), height = Math.round(size[1] * ratio);
  return [{ id, path: `/creatures/v4/${isCostume ? "costumes/" : ""}${id}.png`, source: [0, 0, ...size],
    target: [Math.floor((64 - width) / 2), 62 - height, width, height] }];
};

export const creatureLayersV4 = (recipe: Recipe): CreatureLayer[] => {
  const layers = portraitLayers(recipe);
  const legend = LEGENDS.find((design) => design.id === recipe.legend);
  if (!legend) return layers;
  return [...layers,
    { id: legend.id, path: `/creatures/v1/${legend.decoration}.png`, source: [0, 0, 64, 64], target: [0, 44, 20, 20] },
    { id: `${legend.id}-right`, path: `/creatures/v1/${legend.decoration}.png`, source: [0, 0, 64, 64], target: [44, 44, 20, 20] },
  ];
};
