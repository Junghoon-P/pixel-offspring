import { test, expect, request } from "@playwright/test";
import { sql } from "./database";
import type { APIRequestContext } from "@playwright/test";
const origin = "http://127.0.0.1:5174";
const setup = async (
  name: string,
): Promise<{ client: APIRequestContext; id: string; invite: string }> => {
  const client = await request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  expect((await client.post("/api/session")).status()).toBe(200);
  const res = await client.post("/api/characters", {
    data: {
      quizVersion: 1,
      nickname: name,
      answers: Array.from({ length: 6 }, (_, i) => ({
        questionId: `q${i + 1}`,
        optionId: "b",
      })),
      idempotencyKey: crypto.randomUUID(),
    },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).data.id;
  const invite = await client.post("/api/invites", {
    data: { characterId: id, idempotencyKey: crypto.randomUUID() },
  });
  expect(invite.status()).toBe(201);
  return { client, id, invite: (await invite.json()).data.id };
};
test("20개 동시 신규 생성이 단일 ID이며 삭제 경합 후 공개되지 않는다", async () => {
  const a = await setup("동시 A"),
    b = await setup("동시 B");
  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      b.client.post(`/api/invites/${a.invite}/pair`, {
        data: { characterId: b.id },
      }),
    ),
  );
  const ids = [];
  for (const response of responses) {
    expect([200, 201]).toContain(response.status());
    ids.push((await response.json()).data.resultId);
  }
  expect(new Set(ids).size).toBe(1);
  expect(responses.filter((r) => r.status() === 201)).toHaveLength(1);
  const c = await setup("경합 C");
  await Promise.all([
    a.client.delete(`/api/me/characters/${a.id}`),
    c.client.post(`/api/invites/${a.invite}/pair`, {
      data: { characterId: c.id },
    }),
  ]);
  expect((await b.client.get(`/api/results/${ids[0]}`)).status()).toBe(410);
  expect(
    (await (await c.client.get("/api/me/results")).json()).data.items,
  ).toHaveLength(0);
  await Promise.all([
    a.client.dispose(),
    b.client.dispose(),
    c.client.dispose(),
  ]);
});
test("만료 초대와 세션을 서버에서 차단한다", async () => {
  const a = await setup("만료 A");
  await sql(`UPDATE invites SET expires_at=0 WHERE id='${a.invite}'`);
  expect((await a.client.get(`/api/invites/${a.invite}`)).status()).toBe(410);
  await sql(
    `UPDATE sessions SET expires_at=0 WHERE id=(SELECT owner_id FROM characters WHERE id='${a.id}')`,
  );
  expect((await a.client.get("/api/me/characters")).status()).toBe(401);
  await a.client.dispose();
});
test("21개 결과의 같은 시각 커서 페이지는 중복·누락이 없다", async () => {
  const a = await setup("페이지 A"),
    b = await setup("페이지 B");
  const response = await b.client.post(`/api/invites/${a.invite}/pair`, {
    data: { characterId: b.id },
  });
  expect(response.status()).toBe(201);
  const result = (await response.json()).data.resultId;
  const queries = Array.from({ length: 21 }, () => {
    const id = crypto.randomUUID(),
      rid = crypto.randomUUID();
    const low = [id, a.id].sort()[0],
      high = [id, a.id].sort()[1];
    return `INSERT INTO characters SELECT '${id}',owner_id,jsonb_set(snapshot::jsonb,'{id}',to_jsonb('${id}'::text))::text,created_at,expires_at,NULL FROM characters WHERE id='${b.id}'; INSERT INTO results SELECT '${rid}','${low}','${high}',jsonb_set(snapshot::jsonb,'{resultId}',to_jsonb('${rid}'::text))::text,created_at,expires_at,NULL FROM results WHERE id='${result}';`;
  });
  await sql(queries.join("\n"));
  const first = (await (await a.client.get("/api/me/results")).json()).data;
  expect(first.items).toHaveLength(20);
  expect(first.nextCursor).toBeTruthy();
  const second = (
    await (
      await a.client.get(
        `/api/me/results?cursor=${encodeURIComponent(first.nextCursor)}`,
      )
    ).json()
  ).data;
  expect(second.items).toHaveLength(2);
  expect(second.nextCursor).toBeNull();
  expect(
    new Set(
      [...first.items, ...second.items].map(
        (v: { resultId: string }) => v.resultId,
      ),
    ).size,
  ).toBe(22);
  await a.client.dispose();
  await b.client.dispose();
});
test("읽기 요청 제한은 429와 Retry-After를 제공한다", async () => {
  const a = await setup("제한");
  let limited = false;
  for (let i = 0; i < 65; i++) {
    const response = await a.client.get("/api/me/characters");
    if (response.status() === 429) {
      limited = true;
      expect(response.headers()["retry-after"]).toBe("60");
      break;
    }
  }
  expect(limited).toBe(true);
  await a.client.dispose();
});
