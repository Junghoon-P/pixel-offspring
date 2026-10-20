import { describe, it, expect } from "vitest";
import { parentRecipe, scoreAnswers, offspring } from "./engine";
import { submissionSchema } from "../shared/contracts";
const answers = (mask: number): { questionId: string; optionId: string }[] =>
  Array.from({ length: 6 }, (_, i) => ({
    questionId: `q${i + 1}`,
    optionId: mask & (1 << i) ? "b" : "a",
  }));
const parent = (id: string, mask: number) => ({
  id,
  nickname: id,
  traits: scoreAnswers(answers(mask)),
  recipe: parentRecipe(answers(mask)),
  assetVersion: 2 as const,
});
describe("검증과 유전 엔진", () => {
  it("64개 패턴을 유효하고 재현 가능한 부모로 변환한다", () => {
    for (let i = 0; i < 64; i++) {
      const value = parentRecipe(answers(i));
      expect(value).toEqual(parentRecipe(answers(i)));
      expect([
        "ghost",
        "jelly",
        "mushroom",
        "bird",
        "snail",
        "dragon",
      ]).toContain(value.body);
    }
  });
  it("전체 4096쌍은 반전해도 같고 실제 파츠 출처가 맞다", async () => {
    for (let a = 0; a < 64; a++)
      for (let b = 0; b < 64; b++) {
        const first = parent(`a${a}`, a),
          second = parent(`b${b}`, b);
        const child = await offspring(first, second);
        expect(child).toEqual(await offspring(second, first));
        const bodySource = child.inheritance.find((x) => x.slot === "body")!;
        expect(child.recipe.body).toBe(
          bodySource.parentId === first.id
            ? first.recipe.body
            : second.recipe.body,
        );
        expect(
          child.inheritance.find((x) => x.slot === "face")!.parentId,
        ).not.toBe(bodySource.parentId);
      }
  });
  it("자기 조합을 거부하고 버전을 저장한다", async () => {
    await expect(offspring(parent("a", 0), parent("a", 0))).rejects.toThrow();
    expect(
      (await offspring(parent("a", 0), parent("b", 63))).engineVersion,
    ).toBe(2);
  });
  it("누락, 중복, 알 수 없는 선택지/버전과 제어문자를 거부한다", () => {
    const base = {
      quizVersion: 1,
      nickname: "정훈🙂",
      answers: answers(0),
      idempotencyKey: crypto.randomUUID(),
    };
    expect(submissionSchema.safeParse(base).success).toBe(true);
    for (const patch of [
      { answers: answers(0).slice(1) },
      { answers: Array(6).fill(answers(0)[0]) },
      { quizVersion: 2 },
      { nickname: "a\nb" },
      { nickname: "가".repeat(13) },
      {
        answers: [...answers(0).slice(1), { questionId: "q1", optionId: "c" }],
      },
    ])
      expect(submissionSchema.safeParse({ ...base, ...patch }).success).toBe(
        false,
      );
    expect(
      submissionSchema.parse({ ...base, nickname: "  👨‍👩‍👧‍👦  " }).nickname,
    ).toBe("👨‍👩‍👧‍👦");
  });
});
it("같은 머리 슬롯의 불꽃과 새싹이 겹치지 않는다", async () => {
  const a = parent("first", 63),
    b = parent("second", 0);
  b.recipe = { ...b.recipe, decorations: ["leaves"] };
  const child = await offspring(a, b);
  expect(
    child.recipe.decorations.filter((d) => d === "flame" || d === "leaves"),
  ).toHaveLength(1);
});
