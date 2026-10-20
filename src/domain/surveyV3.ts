import { answersV3Schema } from "../shared/personalitySchemas";
import { QUESTIONS_V3 } from "./surveyV3Questions";
import { describeTraits, TYPE_BODIES } from "./survey";
import { comicRecipe } from "./comicCatalog";
import { describePersonality } from "./personalityReading";
import type { Body, Profile, Recipe, Traits } from "./model";
import type { TraitAxis } from "./personalityModel";
const AXES: TraitAxis[] = ["adventure", "energy", "spontaneity", "expression", "conflict", "support"];
export const scoreSurveyV3 = (input: unknown): Traits => {
  const answers = answersV3Schema.parse(input);
  const values = { a: 2, b: 1, c: 0, d: -1, e: -2 };
  const score = (axis: TraitAxis): number => QUESTIONS_V3.filter((q) => q.axis === axis).reduce(
    (sum, q) => sum + q.aScore * values[answers.find((a) => a.questionId === q.id)!.optionId], 0,
  ) / 8;
  return { adventure: score("adventure"), energy: score("energy"), spontaneity: score("spontaneity"),
    expression: score("expression"), conflict: score("conflict"), support: score("support") };
};
const selectBody = (typeId: string, traits: Traits): Body => {
  if (typeId === "0000" && traits.energy < 0 && traits.energy >= -0.5 && traits.expression! <= -0.75) return "cucumber";
  if (typeId === "1101" && traits.energy > 0 && traits.energy <= 0.5 && traits.expression! >= 0.75) return "broccoli";
  if (typeId === "0101" && traits.energy > 0 && traits.energy <= 0.5 && traits.expression! >= 0.75) return "pepe";
  if (typeId === "1000" && traits.energy < 0 && traits.energy >= -0.5 && traits.expression! <= -0.75) return "squidward";
  return TYPE_BODIES[parseInt(typeId, 2)];
};
export const createSurveyV3 = (input: unknown): { traits: Traits; profile: Profile; recipe: Recipe } => {
  const traits = scoreSurveyV3(input);
  const base = describeTraits(traits), reading = describePersonality(traits);
  return { traits, recipe: comicRecipe(selectBody(base.typeId, traits)), profile: {
    ...base, reading, description: reading.axes.slice(0, 4).map((axis) => axis.summary).join(". ") + ".",
    ability: reading.strength,
  } };
};
export const surveyV3Examples = (): ReturnType<typeof createSurveyV3>[] => Array.from({ length: 16 }, (_, index) => {
  const bits = index.toString(2).padStart(4, "0");
  return createSurveyV3(QUESTIONS_V3.map((q) => ({ questionId: q.id,
    optionId: AXES.indexOf(q.axis) >= 4 ? "c" : q.aScore === (bits[AXES.indexOf(q.axis)] === "1" ? 1 : -1) ? "a" : "e",
  })));
});
