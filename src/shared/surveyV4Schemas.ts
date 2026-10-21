import { z } from "zod";
import { QUESTION_IDS_V4, ANSWER_OPTIONS } from "../domain/surveyV4Questions";
const axisSchema = z.enum(["adventure", "energy", "spontaneity", "expression", "conflict", "support"]);
export const answersV4Schema = z.array(z.object({
  questionId: z.enum(QUESTION_IDS_V4), optionId: z.enum(ANSWER_OPTIONS),
}).strict()).length(10).refine((answers) => new Set(answers.map((answer) => answer.questionId)).size === 10);
export const answerEvidenceSchema = z.array(z.object({
  questionId: z.enum(QUESTION_IDS_V4), question: z.string(), answer: z.string(),
  axis: axisSchema, score: z.number().min(-1).max(1),
}).strict()).length(10).refine((answers) => new Set(answers.map((answer) => answer.questionId)).size === 10);
export const combinationReadingSchema = z.object({
  version: z.literal(1), headline: z.string(), evidence: z.array(z.object({
    axis: axisSchema, title: z.string(), parents: z.array(z.object({
      parentId: z.string(), question: z.string(), answer: z.string(),
    }).strict()).length(2), interpretation: z.string(),
  }).strict()).min(2).max(3),
}).strict();
