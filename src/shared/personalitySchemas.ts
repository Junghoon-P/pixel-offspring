import { z } from "zod";
import { QUESTION_IDS_V3, ANSWER_OPTIONS } from "../domain/surveyV3Questions";
export const answersV3Schema = z.array(z.object({
  questionId: z.enum(QUESTION_IDS_V3), optionId: z.enum(ANSWER_OPTIONS),
}).strict()).length(24).refine((answers) => new Set(answers.map((answer) => answer.questionId)).size === 24);
export const legendIdSchema = z.enum(["expedition", "chaos", "silent", "guardian"]);
export const personalityReadingSchema = z.object({
  version: z.literal(1), headline: z.string(), strength: z.string(), misunderstanding: z.string(),
  stress: z.string(), friendship: z.string(), axes: z.array(z.object({
    axis: z.enum(["adventure", "energy", "spontaneity", "expression", "conflict", "support"]),
    label: z.string(), score: z.number().min(-1).max(1), summary: z.string(),
  }).strict()).length(6),
}).strict();
export const compatibilitySchema = z.object({
  version: z.literal(1), title: z.string(), partial: z.boolean(), strengths: z.array(z.string()).length(2),
  complement: z.string(), situations: z.array(z.object({
    title: z.string(), match: z.string(), friction: z.string(), tip: z.string(),
  }).strict()).length(3),
}).strict();
export const legendDiscoverySchema = z.object({
  version: z.literal(1), id: legendIdSchema, name: z.string(), reason: z.string(), ability: z.string(),
  matched: z.array(legendIdSchema).min(1).max(4),
}).strict();
