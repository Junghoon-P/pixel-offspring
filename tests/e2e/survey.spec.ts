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
