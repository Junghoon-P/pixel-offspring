import type { PublicResult } from "../domain/model";
import { drawCreature } from "../components/renderCreature";
import { wrapText } from "../shared/share";
interface TextBlock { value: string; size: number; y: number }
const text = (context: CanvasRenderingContext2D, value: string, y: number, size = 32, left = false): number => {
  context.font = `${size >= 32 ? 700 : 400} ${size}px system-ui, sans-serif`;
  context.fillStyle = "#4c273b";
  context.textAlign = left ? "left" : "center";
  const lines = wrapText(value, (t) => context.measureText(t).width, 900);
  for (const [i, line] of lines.entries()) context.fillText(line, left ? 90 : 540, y + i * (size + 12));
  return y + lines.length * (size + 12);
};
const cardBlocks = (result: PublicResult, context: CanvasRenderingContext2D): TextBlock[] => {
  const { child, parents } = result;
  const content = [
    { value: `${child.legend ? "레전드 조합 · " : ""}${child.name}`, size: 44 },
    { value: child.description, size: 30 },
    { value: `특수 능력 · ${child.ability}`, size: 28 },
    ...parents.map((parent) => ({ size: 24, value: `${parent.nickname}: ${child.inheritance.filter((part) => part.parentId === parent.id).map((part) => part.label).join(" · ")}` })),
    ...(child.compatibility ? [{ value: child.compatibility.title, size: 36 },
      ...child.compatibility.situations.flatMap((situation) => [
        { value: situation.title, size: 32 },
        { value: situation.match, size: 28 },
        { value: `엇갈릴 땐 · ${situation.friction}`, size: 24 },
        { value: `둘만의 공략법 · ${situation.tip}`, size: 24 },
      ])] : []),
  ];
  let y = 870;
  return content.map((block) => {
    context.font = `${block.size >= 32 ? 700 : 400} ${block.size}px system-ui, sans-serif`;
    const start = y;
    y += wrapText(block.value, (t) => context.measureText(t).width, 900).length * (block.size + 12) + 20;
    return { ...block, y: start };
  });
};
const drawParents = async (ctx: CanvasRenderingContext2D, result: PublicResult): Promise<void> => {
  await Promise.all(result.parents.map((parent, i) => drawCreature(ctx, parent.recipe, 180 + i * 480, 140, 3)));
  ctx.font = "700 28px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#4c273b";
  result.parents.forEach((p, i) => {
    const lines = wrapText(p.nickname, (t) => ctx.measureText(t).width, 400);
    lines.forEach((line, j) => ctx.fillText(line, 276 + i * 480, 370 + j * 38));
  });
};
export const renderCard = async (result: PublicResult): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저에서는 이미지 저장을 준비할 수 없어요.");
  const blocks = cardBlocks(result, ctx), last = blocks[blocks.length - 1];
  ctx.font = `${last.size >= 32 ? 700 : 400} ${last.size}px system-ui, sans-serif`;
  const end = last.y + wrapText(last.value, (t) => ctx.measureText(t).width, 900).length * (last.size + 12);
  // 풀이가 길어져도 PNG에 담긴 마지막 공략법과 하단 문구가 겹치지 않게 한다.
  const baseHeight = result.child.copyVersion === 2 ? 1600 : 1350;
  canvas.height = result.child.compatibility ? Math.max(baseHeight, end + 120) : baseHeight;
  ctx.fillStyle = "#fefaee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text(ctx, "너랑 나 사이에서 태어난", 90, 48);
  await drawParents(ctx, result);
  await drawCreature(ctx, result.child.recipe, 348, 430, 6);
  blocks.forEach((block) => text(ctx, block.value, block.y, block.size, block.size < 40));
  text(ctx, "너를 닮고, 나를 닮은. 우리만의 조합 놀이", canvas.height - 50, 22);
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("PNG 변환에 실패했어요.")), "image/png",
  ));
};
