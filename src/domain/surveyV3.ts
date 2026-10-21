import { answersV3Schema } from "../shared/personalitySchemas";
import { QUESTIONS_V3 } from "./surveyV3Questions";
import { matchCharacter } from "./characterPersonality";
import { hasPersonalityArt } from "./personalityArt";
import { comicRecipe } from "./comicCatalog";
import { describePersonality } from "./personalityReading";
import type { Profile, Recipe, Traits } from "./model";
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
export const createSurveyV3 = (input: unknown): { traits: Traits; profile: Profile; recipe: Recipe } => {
  const traits = scoreSurveyV3(input);
  const match = matchCharacter(traits), reading = describePersonality(traits);
  return { traits, recipe: { ...comicRecipe(match.body), ...(hasPersonalityArt(match.body) ? { portraitStyle: "personality" as const } : {}) }, profile: {
    typeId: match.typeId, name: match.name, characterMatch: match.characterMatch, reading, description: reading.axes.slice(0, 4).map((axis) => axis.summary).join(". ") + ".",
    ability: reading.strength,
  } };
};
export const surveyV3Examples = (): ReturnType<typeof createSurveyV3>[] => Array.from({ length: 16 }, (_, index) => {
  const bits = index.toString(2).padStart(4, "0");
  return createSurveyV3(QUESTIONS_V3.map((q) => ({ questionId: q.id,
    optionId: AXES.indexOf(q.axis) >= 4 ? "c" : q.aScore === (bits[AXES.indexOf(q.axis)] === "1" ? 1 : -1) ? "a" : "e",
  })));
});
