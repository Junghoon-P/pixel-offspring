import { randomUUID } from "node:crypto";
import { createSurveyProfile } from "../../src/domain/survey";
import { offspring } from "../../src/domain/engine";
import type { Character, PublicResult } from "../../src/domain/model";
export const character = (nickname = "친구"): Character => ({
  ...createSurveyProfile(
    Array.from({ length: 12 }, (_, i) => ({
      questionId: `q${i + 1}`,
      optionId: "a",
    })),
  ),
  id: randomUUID(),
  nickname,
  quizVersion: 2,
  scoreVersion: 2,
  assetVersion: 3,
  createdAt: Date.now(),
  expiresAt: Date.now() + 86400000,
});
export const result = async (): Promise<PublicResult> => {
  const a = character("첫친구"),
    b = character("둘째친구");
  return {
    resultId: randomUUID(),
    parents: [a, b].map(
      ({ traits: _, createdAt: __, expiresAt: ___, ...parent }) => parent,
    ),
    child: await offspring(a, b),
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  };
};
export const ok = (data: unknown): Response => Response.json({ data });
export const failure = (message = "연결 실패", status = 503): Response =>
  Response.json({ error: { code: "TEST", message } }, { status });
