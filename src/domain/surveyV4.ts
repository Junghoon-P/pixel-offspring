import { answersV4Schema } from "../shared/surveyV4Schemas";
import { QUESTIONS_V4, answerLabel } from "./surveyV4Questions";
import { matchCharacter } from "./characterPersonality";
import { hasPersonalityArt } from "./personalityArt";
import { comicRecipe } from "./comicCatalog";
import { describePersonality } from "./personalityReading";
import type { AnswerEvidence, Profile, Recipe, Traits } from "./model";
import type { TraitAxis } from "./personalityModel";
const createEvidence = (input: unknown): AnswerEvidence[] => {
  const answers = answersV4Schema.parse(input);
  const values = { a: 1, b: 0.5, c: 0, d: -0.5, e: -1 };
  return QUESTIONS_V4.map((question) => {
    const answer = answers.find((item) => item.questionId === question.id)!;
    return { questionId: question.id, question: question.text, answer: answerLabel(question, answer.optionId),
      axis: question.axis, score: question.aScore * values[answer.optionId] || 0 };
  });
};
const scoreEvidence = (evidence: AnswerEvidence[]): Traits => {
  const score = (axis: TraitAxis): number => {
    const entries = evidence.filter((item) => item.axis === axis);
    return entries.reduce((sum, item) => sum + item.score, 0) / entries.length;
  };
  return { adventure: score("adventure"), energy: score("energy"), spontaneity: score("spontaneity"),
    expression: score("expression"), conflict: score("conflict"), support: score("support") };
};
export const scoreSurveyV4 = (input: unknown): Traits => scoreEvidence(createEvidence(input));
export const createSurveyV4 = (input: unknown): { traits: Traits; profile: Profile; recipe: Recipe } => {
  const evidence = createEvidence(input), traits = scoreEvidence(evidence);
  const match = matchCharacter(traits), reading = describePersonality(traits);
  return { traits, recipe: { ...comicRecipe(match.body), ...(hasPersonalityArt(match.body) ? { portraitStyle: "personality" as const } : {}) },
    profile: { typeId: match.typeId, name: match.name, characterMatch: match.characterMatch, reading, evidence,
      description: reading.axes.slice(0, 4).map((axis) => axis.summary).join(". ") + ".", ability: reading.strength } };
};
