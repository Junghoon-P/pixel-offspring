import { z } from "zod";
import { eventSchema, idSchema } from "../src/shared/contracts";
import { hash } from "../src/domain/engine";
import {
  ApiError,
  ensureOrigin,
  fail,
  json,
  limit,
  parseBody,
  protect,
} from "./http";
import { createSession, getSession } from "./session";
import { createCharacter, deleteCharacter, listCharacters } from "./characters";
import { createInvite, previewInvite } from "./invites";
import { listResults, pairCharacters, readResult } from "./results";
import { runCleanup } from "./cron";
import type { Env } from "./types";
const publicRoute = async (
  request: Request,
  env: Env,
  path: string,
): Promise<Response | null> => {
  const result = path.match(/^\/api\/results\/([^/]+)$/);
  if (result && request.method === "GET")
    return json(await readResult(env, idSchema.parse(result[1])));
  const invite = path.match(/^\/api\/invites\/([^/]+)$/);
  if (invite && request.method === "GET")
    return previewInvite(env, idSchema.parse(invite[1]));
  return null;
};
const api = async (
  request: Request,
  env: Env,
  path: string,
): Promise<Response> => {
  if (request.method !== "GET") ensureOrigin(request, env);
  const session = await getSession(request, env, false);
  await limit(
    env.READ_LIMIT,
    session?.id ??
      (await hash(
        `read:${request.headers.get("x-vercel-forwarded-for") ?? "local"}`,
      )),
  );
  if (path === "/api/session" && request.method === "POST")
    return createSession(request, env);
  const publicResponse = await publicRoute(request, env, path);
  if (publicResponse) return publicResponse;
  if (!session)
    return fail(
      401,
      "SESSION",
      "이 브라우저의 관리 세션이 없거나 만료됐어요. 새 생물을 만들어 주세요.",
    );
  if (path === "/api/characters" && request.method === "POST")
    return createCharacter(request, env, session);
  if (path === "/api/invites" && request.method === "POST")
    return createInvite(request, env, session);
  if (path === "/api/me/characters" && request.method === "GET")
    return listCharacters(env, session);
  if (path === "/api/me/results" && request.method === "GET")
    return listResults(request, env, session);
  const pair = path.match(/^\/api\/invites\/([^/]+)\/pair$/);
  if (pair && request.method === "POST")
    return pairCharacters(request, env, session, idSchema.parse(pair[1]));
  const deletion = path.match(/^\/api\/me\/characters\/([^/]+)$/);
  if (deletion && request.method === "DELETE")
    return deleteCharacter(env, session, idSchema.parse(deletion[1]));
  if (path === "/api/events" && request.method === "POST") {
    const { event } = await parseBody(request, eventSchema);
    await limit(env.WRITE_LIMIT, `events:${session.id}`);
    await env.DB.prepare(
      "INSERT INTO daily_metrics VALUES(CURRENT_DATE::text,$1,1) ON CONFLICT(day,event) DO UPDATE SET count=daily_metrics.count+1",
    )
      .bind(event)
      .run();
    return json({ accepted: true }, 202);
  }
  return fail(404, "NOT_FOUND", "요청한 경로를 찾을 수 없어요.");
};
export const errorResponse = (error: unknown): Response => {
  const known =
    error instanceof ApiError
      ? error
      : error instanceof z.ZodError
        ? new ApiError(400, "INPUT", "입력 내용을 확인해 주세요.")
        : new ApiError(
            503,
            "UNAVAILABLE",
            "잠시 연결이 어려워요. 다시 시도해 주세요.",
          );
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (known.status === 429) headers["Retry-After"] = "60";
  return protect(
    Response.json(
      {
        error: {
          code: known.code,
          message: known.message,
          ...(known.status === 429 ? { retryAfterSeconds: 60 } : {}),
        },
      },
      { status: known.status, headers },
    ),
  );
};
const fetchRequest = async (request: Request, env: Env): Promise<Response> => {
  try {
    const path = new URL(request.url).pathname;
    if (path === "/api/cron/cleanup")
      return protect(await runCleanup(request, env));
    if (path.startsWith("/api/")) return protect(await api(request, env, path));
    return fail(404, "NOT_FOUND", "요청한 경로를 찾을 수 없어요.");
  } catch (error) {
    return errorResponse(error);
  }
};
export default { fetch: fetchRequest };
