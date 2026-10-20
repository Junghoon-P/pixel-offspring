import { beforeAll, afterAll, it, expect } from "vitest";
import { openLocalDatabase } from "../scripts/localDatabase";
import { z } from "zod";
import worker from "./index";
import { cleanup } from "./cleanup";
import { getSession } from "./session";
import type { Env } from "./types";
import { characterSchema, resultSchema } from "../src/shared/contracts";
let env: Env;
let dispose: () => Promise<void>;
const origin = "http://127.0.0.1:5173";
const send = (
  path: string,
  cookie = "",
  body?: unknown,
  active = true,
  method = body ? "POST" : "GET",
): Promise<Response> =>
  worker.fetch(
    new Request(`${origin}${path}`, {
      method,
      headers: {
        Origin: origin,
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    { ...env, CREATION_ENABLED: String(active) },
  );
const data = <T>(response: Response, schema: z.ZodType<T>): Promise<T> =>
  response
    .json()
    .then((value: unknown) => z.object({ data: schema }).parse(value).data);
const payload = () => ({
  quizVersion: 2,
  nickname: "안정성👨‍👩‍👧‍👦",
  answers: Array.from({ length: 12 }, (_, i) => ({
    questionId: `q${i + 1}`,
    optionId: "a",
  })),
  idempotencyKey: crypto.randomUUID(),
});
const session = async (): Promise<string> => {
  const response = await send("/api/session", "", {});
  expect(response.status).toBe(200);
  return response.headers.get("set-cookie")!.split(";")[0];
};
const create = async (
  cookie: string,
): Promise<z.infer<typeof characterSchema>> =>
  data(await send("/api/characters", cookie, payload()), characterSchema);
const invite = async (cookie: string, id: string): Promise<{ id: string }> =>
  data(
    await send("/api/invites", cookie, {
      characterId: id,
      idempotencyKey: crypto.randomUUID(),
    }),
    z.object({ id: z.string() }),
  );
const pair = async (
  cookie: string,
  id: string,
  characterId: string,
  active = true,
) => send(`/api/invites/${id}/pair`, cookie, { characterId }, active);
beforeAll(async () => {
  const local = await openLocalDatabase();
  dispose = (): Promise<void> => local.pg.close();
  const limiter = {
    limit: async (): Promise<{ success: boolean }> => ({ success: true }),
  };
  env = {
    DB: local.db,
    APP_ORIGIN: origin,
    LOCAL_DEV: "true",
    CREATION_ENABLED: "true",
    READ_LIMIT: limiter,
    WRITE_LIMIT: limiter,
    SESSION_LIMIT: limiter,
    CRON_SECRET: "integration-test-secret-with-32-characters",
  };
}, 30000);
afterAll(async () => {
  await dispose?.();
});

it("생성 중지에서도 기존 조회·멱등 재조회·삭제는 유지하고 새 생물·초대·조합은 차단한다", async () => {
  const a = await session(),
    b = await session();
  const input = payload();
  const parent = await data(
    await send("/api/characters", a, input),
    characterSchema,
  );
  const second = await create(b),
    unused = await create(a),
    third = await create(b);
  const invitation = await invite(a, parent.id);
  const result = await data(
    await pair(b, invitation.id, second.id),
    z.object({ resultId: z.string() }),
  );
  expect((await send("/api/characters", a, payload(), false)).status).toBe(503);
  expect(
    (
      await send(
        "/api/invites",
        a,
        { characterId: unused.id, idempotencyKey: crypto.randomUUID() },
        false,
      )
    ).status,
  ).toBe(503);
  expect((await pair(b, invitation.id, third.id, false)).status).toBe(503);
  expect(
    await data(await send("/api/characters", a, input, false), characterSchema),
  ).toEqual(parent);
  expect((await pair(b, invitation.id, second.id, false)).status).toBe(200);
  expect(
    (await send(`/api/results/${result.resultId}`, a, undefined, false)).status,
  ).toBe(200);
  expect((await send("/api/me/characters", a, undefined, false)).status).toBe(
    200,
  );
  expect(
    (
      await send(
        `/api/me/characters/${parent.id}`,
        a,
        undefined,
        false,
        "DELETE",
      )
    ).status,
  ).toBe(204);
  expect((await send(`/api/results/${result.resultId}`, b)).status).toBe(410);
});

it("동일 생성 키의 동시 요청은 하나만 저장하고 내용 변경은 거부한다", async () => {
  const cookie = await session(),
    input = payload();
  const responses = await Promise.all(
    Array.from({ length: 10 }, () => send("/api/characters", cookie, input)),
  );
  expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
  const values = await Promise.all(
    responses.map((r) => data(r, characterSchema)),
  );
  expect(new Set(values.map((v) => v.id)).size).toBe(1);
  expect(
    (await send("/api/characters", cookie, { ...input, nickname: "변경" }))
      .status,
  ).toBe(409);
  expect(
    await data(
      await send("/api/me/characters", cookie),
      z.array(characterSchema),
    ),
  ).toHaveLength(1);
});

it("저장 스냅샷을 재계산하지 않고 부모 만료 뒤 공개·목록에서 차단한다", async () => {
  const a = await session(),
    b = await session();
  const parent = await create(a),
    second = await create(b);
  const invitation = await invite(a, parent.id);
  const result = await data(
    await pair(b, invitation.id, second.id),
    z.object({ resultId: z.string() }),
  );
  await env.DB.prepare(
    "UPDATE results SET snapshot=jsonb_set(snapshot::jsonb,'{child,name}',to_jsonb($1::text))::text WHERE id=$2",
  )
    .bind("저장 시점의 이름", result.resultId)
    .run();
  const saved = await data(
    await send(`/api/results/${result.resultId}`),
    resultSchema,
  );
  expect(saved.child.name).toBe("저장 시점의 이름");
  await pair(b, invitation.id, second.id);
  expect(
    await data(await send(`/api/results/${result.resultId}`), resultSchema),
  ).toEqual(saved);
  await env.DB.prepare("UPDATE characters SET expires_at=0 WHERE id=$1")
    .bind(parent.id)
    .run();
  expect((await send(`/api/results/${result.resultId}`)).status).toBe(410);
  expect((await send(`/api/invites/${invitation.id}`)).status).toBe(410);
  const listed = await data(
    await send("/api/me/results", b),
    z.object({ items: z.array(resultSchema) }),
  );
  expect(listed.items).toHaveLength(0);
  await cleanup(env);
  expect((await send(`/api/results/${result.resultId}`)).status).toBe(404);
});

it("세션·소유권·Origin·입력 오류를 거부하며 보안 헤더를 제공한다", async () => {
  const a = await session(),
    b = await session(),
    parent = await create(a);
  expect(
    (
      await send(
        `/api/me/characters/${parent.id}`,
        b,
        undefined,
        true,
        "DELETE",
      )
    ).status,
  ).toBe(403);
  expect((await send("/api/me/characters")).status).toBe(401);
  expect((await send("/api/characters", a, {})).status).toBe(400);
  expect((await send("/api/me/results?cursor=bad", a)).status).toBe(400);
  expect((await send("/api/me/results?limit=999", a)).status).toBe(400);
  const denied = await worker.fetch(
    new Request(`${origin}/api/session`, { method: "POST" }),
    env,
  );
  expect(denied.status).toBe(403);
  expect(denied.headers.get("X-Content-Type-Options")).toBe("nosniff");
  await expect(getSession(new Request(origin), env)).rejects.toMatchObject({
    status: 401,
  });
  const secure = await worker.fetch(
    new Request(`${origin}/api/session`, {
      method: "POST",
      headers: { Origin: origin },
    }),
    { ...env, LOCAL_DEV: "false" },
  );
  expect(secure.headers.get("set-cookie")).toContain(
    "__Host-creature_session=",
  );
  expect(secure.headers.get("set-cookie")).toContain("; Secure");
});

it("Cron은 인증하고 반복 정리를 안전하게 수행한다", async () => {
  expect((await send("/api/cron/cleanup")).status).toBe(401);
  const cron = (): Promise<Response> =>
    worker.fetch(
      new Request(`${origin}/api/cron/cleanup`, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }),
      env,
    );
  expect((await cron()).status).toBe(200);
  expect((await cron()).status).toBe(200);
  expect((await send("/api/cron/cleanup", "", {}, true, "POST")).status).toBe(
    405,
  );
});
