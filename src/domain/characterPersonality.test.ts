import { expect, it } from "vitest";
import { createSurveyV3, surveyV3Examples } from "./surveyV3";
import { QUESTIONS_V3 } from "./surveyV3Questions";
import { profileSchema } from "../shared/contracts";
import { matchCharacter, PERSONALITY_CHARACTERS } from "./characterPersonality";
import type { Traits } from "./model";
const traits: Traits = { adventure: 0, energy: 0, spontaneity: 0, expression: 0, conflict: 0, support: 0 };
it("뚜렷한 16유형은 중복 없는 기본 캐릭터와 근거를 가진다", () => {
  const profiles = surveyV3Examples();
  expect(PERSONALITY_CHARACTERS).toHaveLength(16);
  expect(new Set(profiles.map((p) => p.recipe.body)).size).toBe(16);
  for (const item of profiles) {
    expect(item.profile.characterMatch?.kind).toBe("type");
    expect(item.profile.characterMatch?.reason.length).toBeGreaterThan(20);
    expect(profileSchema.safeParse(item.profile).success).toBe(true);
  }
  expect(matchCharacter({ ...traits, adventure: -1, energy: -1, spontaneity: -1, expression: 1 }).body).toBe("mushroom");
  expect(matchCharacter({ ...traits, adventure: 1, energy: -1, spontaneity: 1, expression: 1 }).body).toBe("duck");
});
it("모두 중립이면 특정 16유형으로 확정하지 않고 대표 외형임을 알린다", () => {
  const answers = QUESTIONS_V3.map((q) => ({ questionId: q.id, optionId: "c" }));
  const result = createSurveyV3(answers);
  expect(result.profile.typeId).toBe("xxxx");
  expect(result.profile.name).toBe("경계 없는 균형가");
  expect(result.profile.characterMatch?.kind).toBe("balanced");
  expect(result.profile.characterMatch?.reason).toContain("대표 외형");
  expect(createSurveyV3([...answers].reverse())).toEqual(result);
});
it("중립 경계와 일부 축만 뚜렷한 답변은 풀이 기준과 일치한다", () => {
  expect(matchCharacter({ ...traits, adventure: 0.125 }).typeId).toBe("xxxx");
  expect(matchCharacter({ ...traits, adventure: 0.25 }).typeId).toBe("1xxx");
  expect(matchCharacter({ ...traits, adventure: -0.25 }).typeId).toBe("0xxx");
  expect(matchCharacter({ ...traits, adventure: 1 }).characterMatch.kind).toBe("mixed");
  expect(matchCharacter({ ...traits, adventure: 1 }).characterMatch.reason).toContain("대표 외형");
});
it("페페와 징징이는 관계 성향 조건까지 맞을 때만 등장한다", () => {
  const supportive = { ...traits, adventure: -1, energy: 1, spontaneity: -1, expression: 1 };
  expect(matchCharacter(supportive).body).toBe("raccoon");
  expect(matchCharacter({ ...supportive, support: -0.75 }).body).toBe("pepe");
  expect(matchCharacter({ ...supportive, support: -0.625 }).body).toBe("raccoon");
  const quiet = { ...traits, adventure: -1, energy: -1, spontaneity: 1, expression: -1 };
  expect(matchCharacter(quiet).body).toBe("capybara");
  expect(matchCharacter({ ...quiet, conflict: -0.75 }).body).toBe("squidward");
});
it("81가지 중립 포함 패턴은 알려진 방향을 거스르는 대표 외형을 고르지 않는다", () => {
  const values = [-0.25, 0, 0.25];
  for (let index = 0; index < 81; index++) {
    const scores = Array.from({ length: 4 }, (_, axis) => values[Math.floor(index / 3 ** axis) % 3]);
    const match = matchCharacter({ ...traits, adventure: scores[0], energy: scores[1], spontaneity: scores[2], expression: scores[3] });
    const design = PERSONALITY_CHARACTERS.find((item) => item.body === match.body)!;
    expect(design).toBeDefined();
    expect([...match.typeId].every((bit, axis) => bit === "x" || bit === design.typeId[axis])).toBe(true);
    expect(match.typeId).toBe(scores.map((value) => value === 0 ? "x" : value > 0 ? "1" : "0").join(""));
  }
});
it("오이·브로콜리 조건과 중립 축이 있는 변형 제외 규칙을 보존한다", () => {
  const quiet = { ...traits, adventure: -1, energy: -0.5, spontaneity: -1, expression: -1, conflict: -0.75 };
  expect(matchCharacter(quiet).body).toBe("cucumber");
  expect(matchCharacter({ ...quiet, conflict: -0.625 }).body).toBe("sloth");
  expect(matchCharacter({ ...quiet, spontaneity: 0 }).body).not.toBe("cucumber");
  const helper = { ...traits, adventure: 1, energy: 1, spontaneity: -1, expression: 1, support: 0.75 };
  expect(matchCharacter(helper).body).toBe("broccoli");
  expect(matchCharacter({ ...helper, support: 0.625 }).body).toBe("axolotl");
});
