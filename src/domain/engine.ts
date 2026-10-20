import { comicOffspring } from "./comicOffspring";
import { combinationCopy } from "./combinationCopy";
import { answersSchema } from "../shared/contracts";
import {
  BODY_NAMES,
  DECORATION_NAMES,
  FACE_NAMES,
  compatible,
} from "./catalog";
import type {
  Body,
  Child,
  Decoration,
  Parent,
  Recipe,
  Traits,
  Inheritance,
} from "./model";
export const scoreAnswers = (input: unknown): Traits => {
  const answers = answersSchema.parse(input);
  const scores = ["q1", "q2", "q3", "q4", "q5", "q6"].map((id) =>
    answers.find((a) => a.questionId === id)!.optionId === "a" ? -1 : 1,
  );
  return {
    adventure: (scores[0] + scores[1]) / 2,
    energy: (scores[2] + scores[3]) / 2,
    spontaneity: (scores[4] + scores[5]) / 2,
  };
};
export const parentRecipe = (input: unknown): Recipe => {
  const traits = scoreAnswers(input);
  const bodies: Body[] =
    traits.energy > 0
      ? ["jelly", "bird", "dragon"]
      : ["ghost", "mushroom", "snail"];
  const body = bodies[traits.adventure + 1];
  const decoration: Decoration =
    traits.adventure > 0
      ? "flame"
      : traits.spontaneity <= 0
        ? "blanket"
        : "sparkles";
  return {
    assetVersion: 3,
    body,
    face: traits.energy > 0 ? "happy" : "sleepy",
    decorations: [compatible(body, decoration) ? decoration : "leaves"],
    palette: "original",
  };
};
export const hash = async (text: string): Promise<string> =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
const inheritDecorations = (
  body: Body,
  parents: Parent[],
): { decorations: Decoration[]; inheritance: Inheritance[] } => {
  const decorations: Decoration[] = [];
  const inheritance: Inheritance[] = [];
  for (const parent of parents) {
    const part = parent.recipe.decorations.find(
      (d) =>
        compatible(body, d) &&
        !decorations.includes(d) &&
        !(
          ["flame", "leaves"].includes(d) &&
          decorations.some((existing) => ["flame", "leaves"].includes(existing))
        ),
    );
    if (!part) continue;
    decorations.push(part);
    inheritance.push({
      parentId: parent.id,
      partId: part,
      slot: "decoration",
      label: DECORATION_NAMES[part],
    });
  }
  return { decorations, inheritance };
};
const baseInheritance = (
  bodyParent: Parent,
  faceParent: Parent,
  recipe: Recipe,
  inheritance: Inheritance[],
): Inheritance[] => [
  {
    parentId: bodyParent.id,
    partId: recipe.body,
    slot: "body",
    label: BODY_NAMES[recipe.body],
  },
  {
    parentId: faceParent.id,
    partId: recipe.face,
    slot: "face",
    label: FACE_NAMES[recipe.face],
  },
  {
    parentId: bodyParent.id,
    partId: recipe.palette,
    slot: "palette",
    label: "원래 몸통 색",
  },
  ...inheritance,
];
export const offspring = async (a: Parent, b: Parent): Promise<Child> => {
  if (a.id === b.id) throw new Error("자기 캐릭터와 조합할 수 없어요.");
  const parents = [a, b].sort((x, y) => x.id.localeCompare(y.id));
  const seed = await hash(`${parents[0].id}:${parents[1].id}:engine=1:body`);
  const index = parseInt(seed.slice(0, 2), 16) % 2;
  const bodyParent = parents[index],
    faceParent = parents[1 - index];
  const comic = comicOffspring(parents, bodyParent);
  if (comic) return comic;
  const { decorations, inheritance } = inheritDecorations(
    bodyParent.recipe.body,
    parents,
  );
  const recipe: Recipe = {
    assetVersion: bodyParent.recipe.assetVersion,
    body: bodyParent.recipe.body,
    face: faceParent.recipe.face === "signature" ? bodyParent.recipe.face : faceParent.recipe.face,
    decorations,
    palette: bodyParent.recipe.palette,
  };
  const upgraded = parents.some((parent) => parent.recipe.assetVersion >= 3);
  const nameParts = upgraded
    ? (["flame", "blanket", "leaves", "sparkles"] as Decoration[]).filter(
        (part) => decorations.includes(part),
      )
    : decorations;
  const name = [
    ...nameParts.map((d) => DECORATION_NAMES[d]),
    BODY_NAMES[recipe.body],
  ].join(" ");
  const energy = (a.traits.energy + b.traits.energy) / 2;
  return {
    recipe,
    name,
    description:
      energy > 0
        ? "같이 있으면 작은 모험도 축제가 돼요."
        : "모험은 하고 싶고, 이불은 못 놓고.",
    ability:
      energy > 0
        ? "산책 한 번에 이야기 열 개 모으기"
        : "여행 계획만 세우고 집에 있기",
    inheritance: baseInheritance(bodyParent, faceParent.recipe.face === "signature" ? bodyParent : faceParent, recipe, inheritance),
    engineVersion: 1,
    copyVersion: 1,
    ...(upgraded ? combinationCopy(parents, bodyParent, recipe) : {}),
  };
};
