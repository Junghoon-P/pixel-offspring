import { test, expect, request } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
const origin = "http://127.0.0.1:5174";
const makeClient = async (): Promise<APIRequestContext> =>
  request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin } });
const create = async (
  client: APIRequestContext,
  name: string,
  option = "a",
) => {
  expect((await client.post("/api/session")).status()).toBe(200);
  const payload = {
    quizVersion: 1,
    nickname: name,
    answers: Array.from({ length: 6 }, (_, i) => ({
      questionId: `q${i + 1}`,
      optionId: option,
    })),
    idempotencyKey: crypto.randomUUID(),
  };
  const response = await client.post("/api/characters", { data: payload });
  expect(response.status()).toBe(201);
  return { character: (await response.json()).data, payload };
};
test("PostgreSQL: 멱등성·다중 친구·역방향·20개 동시 요청·소유권·삭제", async () => {
  const a = await makeClient(),
    b = await makeClient(),
    c = await makeClient();
  const A = await create(a, "초대자🙂"),
    B = await create(b, "친구", "b"),
    C = await create(c, "다른 친구");
  const retry = await a.post("/api/characters", { data: A.payload });
  expect(retry.status()).toBe(200);
  expect((await retry.json()).data.id).toBe(A.character.id);
  expect(
    (
      await a.post("/api/characters", {
        data: { ...A.payload, nickname: "변경" },
      })
    ).status(),
  ).toBe(409);
  const inviteResponse = await a.post("/api/invites", {
    data: { characterId: A.character.id, idempotencyKey: crypto.randomUUID() },
  });
  expect(inviteResponse.status()).toBe(201);
  const invite = (await inviteResponse.json()).data;
  expect(
    (
      await b.post("/api/invites", {
        data: {
          characterId: A.character.id,
          idempotencyKey: crypto.randomUUID(),
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await a.post(`/api/invites/${invite.id}/pair`, {
        data: { characterId: A.character.id },
      })
    ).status(),
  ).toBe(409);
  const paired = await b.post(`/api/invites/${invite.id}/pair`, {
    data: { characterId: B.character.id },
  });
  expect(paired.status()).toBe(201);
  const pair = (await paired.json()).data;
  // Existing pair requests are reads after authorization, so write quota does not block retries.
  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      b.post(`/api/invites/${invite.id}/pair`, {
        data: { characterId: B.character.id },
      }),
    ),
  );
  for (const res of responses) {
    expect(res.status()).toBe(200);
    expect((await res.json()).data.resultId).toBe(pair.resultId);
  }
  const second = await c.post(`/api/invites/${invite.id}/pair`, {
    data: { characterId: C.character.id },
  });
  expect(second.status()).toBe(201);
  expect((await second.json()).data.resultId).not.toBe(pair.resultId);
  const bInvite = (
    await (
      await b.post("/api/invites", {
        data: {
          characterId: B.character.id,
          idempotencyKey: crypto.randomUUID(),
        },
      })
    ).json()
  ).data;
  const reverse = await a.post(`/api/invites/${bInvite.id}/pair`, {
    data: { characterId: A.character.id },
  });
  expect((await reverse.json()).data.resultId).toBe(pair.resultId);
  const listA = (await (await a.get("/api/me/results")).json()).data;
  expect(listA.items).toHaveLength(2);
  expect(
    (await (await b.get("/api/me/results")).json()).data.items,
  ).toHaveLength(1);
  const publicResult = await a.get(`/api/results/${pair.resultId}`);
  const text = await publicResult.text();
  const html = await a.get(`/r/${pair.resultId}`);
  expect(await html.text()).toContain(`${origin}/og.png`);
  expect(html.headers()["cache-control"]).toContain("no-store");
  expect(text).not.toMatch(/tokenHash|ownerSession|traits|answers/);
  expect(
    (await c.delete(`/api/me/characters/${A.character.id}`)).status(),
  ).toBe(403);
  expect(
    (await a.delete(`/api/me/characters/${A.character.id}`)).status(),
  ).toBe(204);
  expect((await b.get(`/api/results/${pair.resultId}`)).status()).toBe(410);
  expect(
    (
      await b.post(`/api/invites/${invite.id}/pair`, {
        data: { characterId: B.character.id },
      })
    ).status(),
  ).toBe(410);
  expect(
    (await (await b.get("/api/me/results")).json()).data.items,
  ).toHaveLength(0);
  await Promise.all([a.dispose(), b.dispose(), c.dispose()]);
});
test("Origin·세션·본문·닉네임·ID·커서 검증", async () => {
  const a = await makeClient();
  const evil = await request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: "https://evil.example" },
  });
  expect((await evil.post("/api/session")).status()).toBe(403);
  expect((await a.get("/api/me/results")).status()).toBe(401);
  await create(a, "검증");
  expect((await a.get("/api/me/results?cursor=broken")).status()).toBe(400);
  expect((await a.get("/api/results/not-id")).status()).toBe(400);
  expect(
    (
      await a.post("/api/events", {
        data: { event: "secret", nickname: "정보" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await a.post("/api/characters", { data: { nickname: "x".repeat(9000) } })
    ).status(),
  ).toBe(413);
  await a.dispose();
  await evil.dispose();
});
test("초대 생성 요청 키는 다른 생물에 재사용할 수 없다", async () => {
  const a = await makeClient();
  const A = await create(a, "키 A"),
    B = await create(a, "키 B");
  const key = crypto.randomUUID();
  const first = await a.post("/api/invites", {
    data: { characterId: A.character.id, idempotencyKey: key },
  });
  expect(first.status()).toBe(201);
  const conflict = await a.post("/api/invites", {
    data: { characterId: B.character.id, idempotencyKey: key },
  });
  expect(conflict.status()).toBe(409);
  await a.dispose();
});
