import { test, expect, request } from "@playwright/test";
import { z } from "zod";
import { characterSchema, resultSchema } from "../../src/shared/contracts";
const origin = "http://127.0.0.1:5174";
test("v2 설문은 버전·유형을 실제 저장하고 v1 친구와 조합·재조회한다", async () => {
  const contexts = await Promise.all(
    [1, 2].map(() =>
      request.newContext({
        baseURL: origin,
        extraHTTPHeaders: { Origin: origin },
      }),
    ),
  );
  try {
    const characters = [];
    for (const [index, client] of contexts.entries()) {
      await client.post("/api/session");
      const payload = {
        quizVersion: index + 1,
        nickname: `설문${index}`,
        answers: Array.from({ length: index ? 12 : 6 }, (_, i) => ({
          questionId: `q${i + 1}`,
          optionId: "a",
        })),
        idempotencyKey: crypto.randomUUID(),
      };
      const res = await client.post("/api/characters", { data: payload });
      expect(res.status()).toBe(201);
      const value = z
        .object({ data: characterSchema })
        .parse(await res.json()).data;
      characters.push(value);
      const retry = await client.post("/api/characters", { data: payload });
      expect(
        z.object({ data: characterSchema }).parse(await retry.json()).data,
      ).toEqual(value);
      const saved = z
        .object({ data: z.array(characterSchema) })
        .parse(await (await client.get("/api/me/characters")).json());
      expect(saved.data).toContainEqual(value);
    }
    expect(characters[0].traits.expression).toBeUndefined();
    expect(characters[1].profile?.name).toBe("든든한 분위기꾼");
    expect(characters[1].scoreVersion).toBe(2);
    const invite = z
      .object({ data: z.object({ id: z.string() }) })
      .parse(
        await (
          await contexts[0].post("/api/invites", {
            data: {
              characterId: characters[0].id,
              idempotencyKey: crypto.randomUUID(),
            },
          })
        ).json(),
      ).data;
    const paired = await contexts[1].post(`/api/invites/${invite.id}/pair`, {
      data: { characterId: characters[1].id },
    });
    expect(paired.status()).toBe(201);
    const pair = z
      .object({ data: z.object({ resultId: z.string() }) })
      .parse(await paired.json()).data;
    const read = async (index: number): Promise<z.infer<typeof resultSchema>> =>
      z
        .object({ data: resultSchema })
        .parse(
          await (
            await contexts[index].get(`/api/results/${pair.resultId}`)
          ).json(),
        ).data;
    const first = await read(0);
    expect(first.child.notes).toContain(
      "이전 설문에 없던 표현 성향은 추측해서 합치지 않았어요.",
    );
    expect(await read(1)).toEqual(first);
  } finally {
    await Promise.all(contexts.map((client) => client.dispose()));
  }
});

test("v3는 개인 풀이·레전드 궁합을 저장하고 도감·공유·삭제까지 이어진다", async ({ browser }) => {
  const { QUESTIONS_V3 } = await import("../../src/domain/surveyV3Questions");
  const contexts = await Promise.all([0, 1].map(() => browser.newContext({
    baseURL: origin, extraHTTPHeaders: { Origin: origin }, viewport: { width: 390, height: 844 },
  })));
  try {
    const characters = [];
    for (const [index, context] of contexts.entries()) {
      await context.request.post("/api/session");
      const payload = { quizVersion: 3, nickname: `새친구${index}`, idempotencyKey: crypto.randomUUID(),
        answers: QUESTIONS_V3.map((q) => ({ questionId: q.id, optionId: q.aScore === 1 ? "a" : "e" })),
      };
      const response = await context.request.post("/api/characters", { data: payload });
      expect(response.status()).toBe(201);
      const character = characterSchema.parse((await response.json()).data);
      expect(character.scoreVersion).toBe(3);
      expect(character.profile?.reading?.axes).toHaveLength(6);
      expect(character).not.toHaveProperty("answers");
      const retry = await context.request.post("/api/characters", { data: payload });
      expect(characterSchema.parse((await retry.json()).data)).toEqual(character);
      characters.push(character);
    }
    const inviteResponse = await contexts[0].request.post("/api/invites", { data: { characterId: characters[0].id, idempotencyKey: crypto.randomUUID() } });
    const invite = (await inviteResponse.json()).data;
    const response = await contexts[1].request.post(`/api/invites/${invite.id}/pair`, { data: { characterId: characters[1].id } });
    expect(response.status()).toBe(201);
    const pair = (await response.json()).data;
    const read = await contexts[0].request.get(`/api/results/${pair.resultId}`);
    const result = resultSchema.parse((await read.json()).data);
    expect(result.child.legend?.id).toBe("chaos");
    expect(result.child.compatibility?.partial).toBe(false);
    const reread = await contexts[1].request.get(`/api/results/${pair.resultId}`);
    expect(resultSchema.parse((await reread.json()).data)).toEqual(result);
    const page = await contexts[0].newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/me");
    await page.getByText("나라는 생물의 사용 설명서", { exact: true }).click();
    await expect(page.getByText("나와 친해지는 방법", { exact: true })).toBeVisible();
    await page.getByText(/레전드 도감 ·/).click();
    await expect(page.getByRole("link", { name: "무계획 대참사 결과 보기", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/personality-v3.png", fullPage: true });
    await page.goto(`/r/${pair.resultId}`);
    await expect(page.getByText("이 조합, 레전드다.", { exact: true })).toBeVisible();
    await page.getByText("대화하고 위로할 때", { exact: true }).click();
    await expect(page.locator("details[open]").getByText("둘만의 공략법", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "PNG 저장" })).toBeEnabled();
    await expect(page.locator('canvas[data-ready="true"]')).toHaveCount(3);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG 저장" }).click();
    await (await download).saveAs("test-results/legend-card.png");
    await page.screenshot({ path: "test-results/legend-result.png", fullPage: true });
    expect(errors).toEqual([]);
    await contexts[1].request.delete(`/api/me/characters/${characters[1].id}`);
    await page.goto("/me");
    await page.getByText(/레전드 도감 ·/).click();
    await expect(page.getByText("레전드 도감 · 0 / 4", { exact: true })).toBeVisible();
    expect((await contexts[0].request.get(`/api/results/${pair.resultId}`)).status()).toBe(410);
  } finally { await Promise.all(contexts.map((context) => context.close())); }
});
