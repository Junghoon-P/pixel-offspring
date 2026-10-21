import { offspring } from "./engine";
import { discoverLegend } from "./legends";
import { childSchema } from "../shared/contracts";
import { describe, expect, it } from "vitest";
import { QUESTIONS_V4, answerLabel, type AnswerOption } from "./surveyV4Questions";
import { createSurveyV4, scoreSurveyV4 } from "./surveyV4";
import { submissionSchema } from "../shared/contracts";
import { describeCombination } from "./combinationReading";
import type { Parent } from "./model";
const answers = (optionId: AnswerOption = "a"): { questionId: string; optionId: AnswerOption }[] => QUESTIONS_V4.map((q) => ({ questionId: q.id, optionId }));
const parent = (id: string, option: AnswerOption): Parent => ({ id, nickname: id, quizVersion: 4, scoreVersion: 4, assetVersion: 4, ...createSurveyV4(answers(option)) });
describe("ten-question survey", () => {
  it("requires exactly ten unique known answers and rejects client evidence", () => {
    expect(QUESTIONS_V4).toHaveLength(10);
    const input = { quizVersion: 4, nickname: "테스트", answers: answers(), idempotencyKey: "00000000-0000-4000-8000-000000000001" };
    expect(submissionSchema.safeParse(input).success).toBe(true);
    for (const invalid of [answers().slice(1), [...answers(), answers()[0]], [...answers().slice(1), answers()[1]], answers().map((a) => ({ ...a, optionId: "x" }))]) {
      expect(submissionSchema.safeParse({ ...input, answers: invalid }).success).toBe(false);
    }
    expect(submissionSchema.safeParse({ ...input, evidence: [] }).success).toBe(false);
  });
  it("normalizes every axis by its own question count", () => {
    const maximum = QUESTIONS_V4.map((q) => ({ questionId: q.id, optionId: q.aScore === 1 ? "a" : "e" }));
    expect(Object.values(scoreSurveyV4(maximum))).toEqual([1, 1, 1, 1, 1, 1]);
    expect(Object.values(scoreSurveyV4(answers("c")))).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it("stores exact question and selected label in canonical question order", () => {
    const profile = createSurveyV4(answers("b").reverse()).profile;
    expect(profile.evidence).toHaveLength(10);
    expect(profile.evidence?.[0]).toMatchObject({ questionId: "q1", question: QUESTIONS_V4[0].text, answer: answerLabel(QUESTIONS_V4[0], "b") });
  });
  it("explains neutral and differing answers without inventing legacy answers", () => {
    const a = parent("a", "c"), b = parent("b", "e");
    const result = describeCombination([a, b]);
    expect(result?.evidence).toHaveLength(3);
    expect(result).toEqual(describeCombination([b, a]));
    expect(result?.evidence.every((item) => item.interpretation.includes("비슷"))).toBe(true);
    expect(result?.evidence[0].parents[0].answer).toBe("둘 다 비슷해요");
    expect(describeCombination([a, { ...b, quizVersion: 3 }])).toBeUndefined();
    expect(describeCombination([a, { ...b, profile: undefined }])).toBeUndefined();
  });
});

describe("ten-question combinations", () => {
  it("keeps exact excerpts and does not depend on character anatomy", () => {
    const a = parent("a", "a"), b = parent("b", "e");
    const reading = describeCombination([a, b]);
    for (const item of reading!.evidence) {
      expect(item.interpretation.length).toBeGreaterThan(20);
      for (const excerpt of item.parents) {
        const source = (excerpt.parentId === a.id ? a : b).profile!.evidence!;
        expect(source.some((answer) => answer.question === excerpt.question && answer.answer === excerpt.answer)).toBe(true);
      }
    }
    expect(describeCombination([{ ...a, recipe: { ...a.recipe, body: "squidward" } }, b])).toEqual(reading);
  });
  it("has explicit neutral and matching interpretations", () => {
    expect(describeCombination([parent("a", "c"), parent("b", "c")])?.evidence[0].interpretation).toContain("상황에 따라 선택이 달라질 수");
    expect(describeCombination([parent("a", "a"), parent("b", "a")])?.evidence[0].interpretation).toContain("강도도 같았네요");
    expect(describeCombination([parent("a", "a"), parent("b", "b")])?.evidence[0].interpretation).toContain("조금 달랐어요");
  });
});

it("uses v4 scores for compatibility and legends while preserving old parents", async () => {
  const a = parent("a", "a"), b = parent("b", "e");
  const child = await offspring(a, b);
  expect(childSchema.safeParse(child).success).toBe(true);
  expect(child.combinationReading).toEqual(describeCombination([a, b]));
  expect(child.compatibility?.partial).toBe(false);
  const traits = { adventure: 1, energy: 1, spontaneity: 1, expression: 1, conflict: 1, support: 1 };
  expect(discoverLegend([{ ...a, traits }, { ...b, traits }])?.id).toBe("chaos");
  const old = { ...b, quizVersion: 1 as const, scoreVersion: 1 as const, profile: undefined,
    traits: { adventure: 0, energy: 0, spontaneity: 0 },
    recipe: { ...b.recipe, assetVersion: 1 as const, body: "snail" as const, face: "happy" as const, portraitStyle: undefined } };
  const mixed = await offspring(a, old);
  expect(childSchema.safeParse(mixed).success).toBe(true);
  expect(mixed.combinationReading).toBeUndefined();
  expect(mixed.compatibility?.partial).toBe(true);
  expect(mixed.legend).toBeUndefined();
});

it("uses concrete axis-specific explanations for opposite answers", () => {
  const a = parent("a", "a"), b = parent("b", "a");
  const changed = answers("a").map((answer) => ({ ...answer, optionId: ["q1", "q9", "q10"].includes(answer.questionId) ? "e" as const : answer.optionId }));
  const reading = describeCombination([a, { ...b, ...createSurveyV4(changed) }]);
  expect(reading?.evidence.find((item) => item.axis === "energy")?.interpretation).toContain("활동과 휴식");
  expect(reading?.evidence.find((item) => item.axis === "conflict")?.interpretation).toContain("언제 다시 이야기");
  expect(reading?.evidence.find((item) => item.axis === "support")?.interpretation).toContain("해결책과 공감");
});
