import { test, expect } from "@playwright/test";
import { characterSchema, resultSchema } from "../../src/shared/contracts";
import { QUESTIONS_V4, answerLabel } from "../../src/domain/surveyV4Questions";
const origin = "http://127.0.0.1:5174";

test("10문항 답변이 저장·재조회되고 실제 조합 근거와 공유 카드로 이어진다", async ({ browser }) => {
  const contexts = await Promise.all([0, 1].map(() => browser.newContext({
    baseURL: origin, extraHTTPHeaders: { Origin: origin, "x-vercel-forwarded-for": `combination-${crypto.randomUUID()}` }, viewport: { width: 390, height: 844 },
  })));
  try {
    const characters = [];
    for (const [index, context] of contexts.entries()) {
      await context.request.post("/api/session");
      const optionId = index === 0 ? "a" : "e";
      const answers = QUESTIONS_V4.map((q) => ({ questionId: q.id, optionId }));
      const payload = { quizVersion: 4, nickname: `조합친구${index}`, answers, idempotencyKey: crypto.randomUUID() };
      if (index === 0) {
        for (const invalid of [answers.slice(1), [...answers, answers[0]], [...answers.slice(1), answers[1]]]) {
          const rejected = await context.request.post("/api/characters", { data: { ...payload, answers: invalid } });
          expect(rejected.status()).toBe(400);
        }
      }
      const response = await context.request.post("/api/characters", { data: payload });
      expect(response.status()).toBe(201);
      const character = characterSchema.parse((await response.json()).data);
      expect(character.scoreVersion).toBe(4);
      expect(character.profile?.evidence).toHaveLength(10);
      expect(character.profile?.evidence?.map((item) => item.answer)).toEqual(QUESTIONS_V4.map((q) => answerLabel(q, optionId)));
      characters.push(character);
      const retry = await context.request.post("/api/characters", { data: payload });
      expect(characterSchema.parse((await retry.json()).data)).toEqual(character);
    }
    const inviteResponse = await contexts[0].request.post("/api/invites", { data: { characterId: characters[0].id, idempotencyKey: crypto.randomUUID() } });
    const invite = (await inviteResponse.json()).data;
    const paired = await contexts[1].request.post(`/api/invites/${invite.id}/pair`, { data: { characterId: characters[1].id } });
    expect(paired.status()).toBe(201);
    const pair = (await paired.json()).data;
    const result = resultSchema.parse((await (await contexts[0].request.get(`/api/results/${pair.resultId}`)).json()).data);
    expect(result.child.combinationReading?.evidence).toHaveLength(3);
    for (const item of result.child.combinationReading?.evidence ?? []) {
      for (const parent of item.parents) {
        const saved = characters.find((character) => character.id === parent.parentId)?.profile?.evidence;
        expect(saved?.some((answer) => answer.question === parent.question && answer.answer === parent.answer)).toBe(true);
      }
    }
    const page = await contexts[0].newPage();
    await page.goto(`/r/${pair.resultId}`);
    await expect(page.getByRole("heading", { name: "우리, 이런 점이 닮고 달라요" })).toBeVisible();
    await expect(page.locator('canvas[data-ready="true"]')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: "test-results/combination-mobile.png", fullPage: true });
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG 저장" }).click();
    await (await download).saveAs("test-results/combination-card.png");
    await page.reload();
    await expect(page.getByRole("heading", { name: "우리, 이런 점이 닮고 달라요" })).toBeVisible();
    const reread = resultSchema.parse((await (await contexts[1].request.get(`/api/results/${pair.resultId}`)).json()).data);
    expect(reread).toEqual(result);
  } finally { await Promise.all(contexts.map((context) => context.close())); }
});
