import { COMIC_NAMES } from "./catalog";
import type { Body, Recipe } from "./model";
const PERSONALITY_NAMES: Partial<Record<Body, string>> = {
  cat: "상자 썰매 고양이", frog: "커피 산책 개구리", potato: "체크리스트 감자",
  mushroom: "우산 나눔 버섯", jelly: "손인사 젤리", raccoon: "간식 챙김 라쿤", ghost: "랜턴 탐험 유령",
};
export const hasPersonalityArt = (body: Body): boolean => PERSONALITY_NAMES[body] !== undefined;
export const recipeName = (recipe: Recipe): string =>
  (recipe.portraitStyle ? PERSONALITY_NAMES[recipe.body] : undefined) ?? COMIC_NAMES[recipe.body];
