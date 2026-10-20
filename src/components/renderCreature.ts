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
const rasterizePortrait = (image: HTMLImageElement, layer: ReturnType<typeof creatureLayers>[number]): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("캐릭터 그림을 준비할 수 없어요.");
  // 고유 표정과 소품은 128px에서 정규화해 작은 눈과 윤곽을 보존한다.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const [x, y, width, height] = layer.target;
  context.drawImage(image, ...layer.source, x * 2, y * 2, width * 2, height * 2);
  return canvas;
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
  const portrait = recipe.assetVersion === 4 ? rasterizePortrait(loaded[0], layers[0]) : undefined;
  context.save();
  context.imageSmoothingEnabled = false;
  if (portrait) {
    context.drawImage(portrait, x, y, 64 * scale, 64 * scale);
    context.restore();
    return;
  }
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
