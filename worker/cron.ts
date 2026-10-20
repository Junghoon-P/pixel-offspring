import { timingSafeEqual } from "node:crypto";
import { cleanup } from "./cleanup";
import { fail, json } from "./http";
import type { Env } from "./types";
export const runCleanup = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  if (request.method !== "GET")
    return fail(405, "METHOD", "허용되지 않은 요청이에요.");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET ?? ""}`);
  const actual = Buffer.from(request.headers.get("Authorization") ?? "");
  if (
    !env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return fail(401, "CRON_AUTH", "인증이 필요해요.");
  await cleanup(env);
  return json({ cleaned: true });
};
