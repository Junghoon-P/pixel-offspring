import type { PublicResult } from "../domain/model";
import { drawCreature } from "../components/renderCreature";
import { wrapText } from "../shared/share";
const text = (
  context: CanvasRenderingContext2D,
  value: string,
  y: number,
  size = 32,
): number => {
  context.font = `700 ${size}px system-ui, sans-serif`;
  context.fillStyle = "#4c273b";
  context.textAlign = "center";
  const lines = wrapText(value, (t) => context.measureText(t).width, 940);
  for (const [i, line] of lines.entries())
    context.fillText(line, 540, y + i * (size + 12));
  return y + lines.length * (size + 12);
};
export const renderCard = async (result: PublicResult): Promise<Blob> => {
  // 시스템 폰트만 사용하므로 관련 없는 웹폰트의 실패·지연을 기다리지 않는다.
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = result.child.copyVersion === 2 ? 1600 : 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("이 브라우저에서는 이미지 저장을 준비할 수 없어요.");
  ctx.fillStyle = "#fefaee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text(ctx, "너랑 나 사이에서 태어난", 90, 48);
  await Promise.all(
    result.parents.map((parent, i) =>
      drawCreature(ctx, parent.recipe, 180 + i * 480, 140, 3),
    ),
  );
  ctx.font = "700 28px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#4c273b";
  result.parents.forEach((p, i) => {
    const lines = wrapText(p.nickname, (t) => ctx.measureText(t).width, 400);
    lines.forEach((line, j) => ctx.fillText(line, 276 + i * 480, 370 + j * 38));
  });
  await drawCreature(ctx, result.child.recipe, 348, 430, 6);
  let y = text(ctx, result.child.name, 870, 44);
  y = text(ctx, result.child.description, y + 12, 30);
  y = text(ctx, `특수 능력 · ${result.child.ability}`, y + 20, 28);
  const grouped = result.parents.map(
    (parent) =>
      `${parent.nickname}: ${result.child.inheritance
        .filter((item) => item.parentId === parent.id)
        .map((item) => item.label)
        .join(" · ")}`,
  );
  for (const line of grouped) y = text(ctx, line, y + 16, 24);
  text(ctx, "두 사람의 작은 특징이 만나는 조합 놀이", canvas.height - 50, 22);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("PNG 변환에 실패했어요.")),
      "image/png",
    ),
  );
};
