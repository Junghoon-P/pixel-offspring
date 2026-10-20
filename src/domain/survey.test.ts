import { describe, expect, it } from "vitest";
import { QUESTIONS_V2, createSurveyProfile } from "./survey";
import { submissionSchema, childSchema } from "../shared/contracts";
const answers = (mask: number): { questionId: string; optionId: string }[] =>
  QUESTIONS_V2.map((q, i) => ({
    questionId: q.id,
    optionId: mask & (1 << i) ? "b" : "a",
  }));
describe("12문항·4축·16유형", () => {
  it("4096답변은16유형을 유지하며20종 외형과 밈 후보에 결정적으로 배정된다", () => {
    const counts = new Map<string, number>();
    const recipes = new Set<string>();
    const bodies = new Map<string, Set<string>>();
    for (let mask = 0; mask < 4096; mask++) {
      const result = createSurveyProfile(answers(mask));
      counts.set(
        result.profile.typeId,
        (counts.get(result.profile.typeId) ?? 0) + 1,
      );
      recipes.add(JSON.stringify(result.recipe));
      const variants = bodies.get(result.profile.typeId) ?? new Set<string>();
      variants.add(result.recipe.body);
      bodies.set(result.profile.typeId, variants);
      expect(result.traits.expression).not.toBe(0);
      expect(createSurveyProfile([...answers(mask)].reverse())).toEqual(result);
    }
    expect(counts.size).toBe(16);
    expect(new Set(counts.values())).toEqual(new Set([256]));
    expect(recipes.size).toBe(20);
    expect(bodies.get("0000")).toEqual(new Set(["potato", "cucumber"]));
    expect(bodies.get("1101")).toEqual(new Set(["raccoon", "broccoli"]));
    expect(bodies.get("0101")).toEqual(new Set(["bird", "pepe"]));
    expect(bodies.get("1000")).toEqual(new Set(["snail", "squidward"]));
  });
  it("버전과 문항 수·ID가 맞을 때만 저장한다", () => {
    const payload = {
      quizVersion: 2,
      nickname: "별",
      answers: answers(0),
      idempotencyKey: crypto.randomUUID(),
    };
    expect(submissionSchema.safeParse(payload).success).toBe(true);
    for (const patch of [
      { quizVersion: 1 },
      { answers: answers(0).slice(0, 6) },
      { answers: Array(12).fill(answers(0)[0]) },
      {
        answers: [...answers(0).slice(1), { questionId: "q13", optionId: "a" }],
      },
    ])
      expect(submissionSchema.safeParse({ ...payload, ...patch }).success).toBe(
        false,
      );
  });
});
it("20종의400쌍과 구버전 혼합은 역순에도 같고 없는 성향을 만들지 않는다", async () => {
  const { offspring } = await import("./engine");
  const profiles = new Map<string, ReturnType<typeof createSurveyProfile>>();
  for (let mask = 0; mask < 4096; mask++) {
    const profile = createSurveyProfile(answers(mask));
    profiles.set(profile.recipe.body, profile);
  }
  expect(profiles.size).toBe(20);
  const parents = [...profiles.values()].map((p, i) => ({
    ...p,
    id: `new-${i}`,
    nickname: `친구${i}`,
    quizVersion: 2 as const,
    scoreVersion: 2 as const,
    assetVersion: 4 as const,
  }));
  for (const a of parents)
    for (const b of parents) {
      const second = { ...b, id: `other-${b.id}` };
      const child = await offspring(a, second);
      expect(child).toEqual(await offspring(second, a));
      expect(child.copyVersion).toBe(2);
      expect(childSchema.safeParse(child).success).toBe(true);
      expect(child.description.length).toBeGreaterThan(20);
    }
  const old = {
    ...parents[0],
    id: "old",
    quizVersion: 1 as const,
    traits: { adventure: 0, energy: 0, spontaneity: 0 },
    recipe: { ...parents[0].recipe, body: "ghost" as const, face: "happy" as const, assetVersion: 1 as const },
    assetVersion: 1 as const,
  };
  expect((await offspring(old, parents[1])).notes).toContain(
    "이전 설문에 없던 표현 성향은 추측해서 합치지 않았어요.",
  );
  expect((await offspring(old, { ...old, id: "old2" })).engineVersion).toBe(1);
});
