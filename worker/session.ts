import { hash } from "../src/domain/engine";
import { DAY } from "./types";
import type { Env, Session } from "./types";
import { fail, json, limit } from "./http";
const cookieName = (env: Env): string =>
  env.LOCAL_DEV === "true" ? "creature_session_dev" : "__Host-creature_session";
export const getSession = async (
  request: Request,
  env: Env,
  required = true,
): Promise<Session | null> => {
  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${cookieName(env)}=`))
    ?.split("=")[1];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (required)
      fail(401, "SESSION", "이 브라우저의 관리 세션이 없거나 만료됐어요.");
    return null;
  }
  const row = await env.DB.prepare(
    "SELECT id,expires_at FROM sessions WHERE token_hash=$1 AND expires_at>$2",
  )
    .bind(await hash(token), Date.now())
    .first<Session>();
  if (!row && required)
    fail(401, "SESSION", "관리 세션이 만료됐어요. 새 생물을 만들어 주세요.");
  return row;
};
export const createSession = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  if (await getSession(request, env, false)) return json({ active: true });
  const ip = request.headers.get("x-vercel-forwarded-for") ?? "local";
  await limit(env.SESSION_LIMIT, await hash(`session:${ip}`));
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions VALUES($1,$2,$3,$4)")
    .bind(crypto.randomUUID(), await hash(token), now, now + 90 * DAY)
    .run();
  const secure = env.LOCAL_DEV === "true" ? "" : "; Secure";
  return json({ active: true }, 200, {
    "Set-Cookie": `${cookieName(env)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7776000${secure}`,
  });
};
