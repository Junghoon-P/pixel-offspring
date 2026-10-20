import type { Recipe } from "../domain/model";
import { compatible } from "../domain/catalog";
import { recipeSchema } from "../shared/contracts";
import { creatureLayers } from "./creatureLayout";
const images = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (id: string): Promise<HTMLImageElement> => {
  const cached = images.get(id);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const fail = (): void => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      images.delete(id);
      reject(new Error(`파츠 ${id}를 불러오지 못했어요.`));
    };
    const timer = setTimeout(fail, 10000);
    img.onload = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(img);
    };
    img.onerror = fail;
    img.src = id;
  });
  images.set(id, promise);
  return promise;
};
export const drawCreature = async (
  context: CanvasRenderingContext2D,
  input: Recipe,
  x = 0,
  y = 0,
  scale = 3,
): Promise<void> => {
  const recipe = recipeSchema.parse(input);
  if (!Number.isInteger(scale) || scale < 1)
    throw new Error("정수 배율이 필요합니다.");
  if (recipe.decorations.some((d) => !compatible(recipe.body, d)))
    throw new Error("호환되지 않는 장식입니다.");
  const layers = creatureLayers(recipe);
  const loaded = await Promise.all(layers.map((item) => loadImage(item.path)));
  context.save();
  context.imageSmoothingEnabled = false;
  loaded.forEach((img, i) => {
    const { source, target } = layers[i];
    context.drawImage(
      img,
      ...source,
      x + target[0] * scale,
      y + target[1] * scale,
      target[2] * scale,
      target[3] * scale,
    );
  });
  context.restore();
};
