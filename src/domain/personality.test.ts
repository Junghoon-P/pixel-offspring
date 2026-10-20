import { expect, it } from "vitest";
import { createSurveyV3, scoreSurveyV3 } from "./surveyV3";
import { QUESTIONS_V3 } from "./surveyV3Questions";
import { submissionSchema, characterSchema, childSchema } from "../shared/contracts";
import { offspring } from "./engine";
import type { Parent } from "./model";
const answers = (optionId: string) => QUESTIONS_V3.map((q) => ({ questionId: q.id, optionId }));
it("24문항은 여섯 축을 고르게 측정하고 중립을 임의 성향으로 바꾸지 않는다", () => {
  expect(QUESTIONS_V3).toHaveLength(24);
  expect(new Set(QUESTIONS_V3.map((q) => q.id)).size).toBe(24);
  for (const axis of new Set(QUESTIONS_V3.map((q) => q.axis)))
    expect(QUESTIONS_V3.filter((q) => q.axis === axis)).toHaveLength(4);
  const profile = createSurveyV3(answers("c"));
  expect(Object.values(profile.traits)).toEqual([0, 0, 0, 0, 0, 0]);
  expect(profile.profile.reading?.axes.every((axis) => axis.summary.includes("균형"))).toBe(true);
  expect(createSurveyV3([...answers("c")].reverse())).toEqual(profile);
});
it("v3 계약은 누락·중복·다른 버전·알 수 없는 선택지를 거부한다", () => {
  const base = { quizVersion: 3, nickname: "친구", answers: answers("a"), idempotencyKey: crypto.randomUUID() };
  expect(submissionSchema.safeParse(base).success).toBe(true);
  for (const patch of [{ answers: base.answers.slice(1) }, { answers: Array(24).fill(base.answers[0]) },
    { quizVersion: 2 }, { answers: answers("f") }])
    expect(submissionSchema.safeParse({ ...base, ...patch }).success).toBe(false);
  expect(() => scoreSurveyV3(answers("f"))).toThrow();
});
it("새 결과는 개인 풀이·궁합·레전드를 저장하고 부모 순서를 바꿔도 같다", async () => {
  const responses = QUESTIONS_V3.map((q) => ({ questionId: q.id, optionId: q.aScore === 1 ? "a" : "e" }));
  const survey = createSurveyV3(responses);
  const parent = (id: string): Parent => ({ ...survey, id, nickname: id, quizVersion: 3, scoreVersion: 3, assetVersion: 4 });
  const first = parent("first"), second = parent("second");
  expect(characterSchema.safeParse({ ...first, id: crypto.randomUUID(), createdAt: 0, expiresAt: 1 }).success).toBe(true);
  const child = await offspring(first, second);
  expect(child).toEqual(await offspring(second, first));
  expect(childSchema.safeParse(child).success).toBe(true);
  expect(child.compatibility?.situations).toHaveLength(3);
  expect(child.legend?.id).toBe("chaos");
  expect(child.recipe.legend).toBe("chaos");
  const old = { ...second, quizVersion: 2 as const, traits: { adventure: 1, energy: 1, spontaneity: 1, expression: 1 } };
  const mixed = await offspring(first, old);
  expect(mixed.compatibility?.partial).toBe(true);
  expect(mixed.legend).toBeUndefined();
});

it("레전드4종은 조건 경계와 겹침을 처리하고 역순에도 같다", async () => {
  const { discoverLegend } = await import("./legends");
  const base = createSurveyV3(answers("c"));
  const make = (id: string, traits: Partial<Parent["traits"]>): Parent => ({
    ...base, id, nickname: id, quizVersion: 3, assetVersion: 4, traits: { ...base.traits, ...traits },
  });
  const cases = [
    { id: "expedition", a: { adventure: 0.5, energy: 0.5 }, b: { adventure: 0.5, energy: -0.5 } },
    { id: "chaos", a: { adventure: 0.5, spontaneity: 0.75 }, b: { adventure: 0.5, spontaneity: 0.75 } },
    { id: "silent", a: { expression: -0.75, support: -0.5 }, b: { expression: -0.75, support: -0.5 } },
    { id: "guardian", a: { conflict: -0.75, support: -0.5 }, b: { conflict: 0.75, support: -0.5 } },
  ];
  for (const entry of cases) {
    const a = make("a", entry.a), b = make("b", entry.b);
    expect(discoverLegend([a, b])?.id).toBe(entry.id);
    expect(discoverLegend([b, a])).toEqual(discoverLegend([a, b]));
  }
  expect(discoverLegend([make("a", {}), make("b", {})])).toBeUndefined();
  expect(discoverLegend([make("a", { adventure: 0.5, spontaneity: 0.625 }), make("b", { adventure: 0.5, spontaneity: 0.75 })])).toBeUndefined();
  const a = make("a", { adventure: 1, energy: 1, spontaneity: 1, conflict: 1, support: -1 });
  const b = make("b", { adventure: 1, energy: -1, spontaneity: 1, conflict: -1, support: -1 });
  expect(discoverLegend([a, b])?.matched).toEqual(["guardian", "expedition", "chaos"]);
});

it("v3의 모든 기본16유형 조합은 성향과 관계 풀이를 보존한다", async () => {
  const { surveyV3Examples } = await import("./surveyV3");
  const profiles = surveyV3Examples();
  expect(new Set(profiles.map((profile) => profile.profile.typeId)).size).toBe(16);
  const parents: Parent[] = profiles.map((profile, i) => ({ ...profile, id: `${i}`, nickname: `${i}`, quizVersion: 3, assetVersion: 4 }));
  for (const a of parents) for (const b of parents) {
    const other = { ...b, id: `${b.id}-other` };
    const child = await offspring(a, other);
    expect(child).toEqual(await offspring(other, a));
    expect(childSchema.safeParse(child).success).toBe(true);
    expect(child.compatibility?.partial).toBe(false);
  }
});
