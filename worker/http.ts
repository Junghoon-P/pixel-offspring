import { z } from "zod";
import type { RequestLimit } from "./rateLimit";
import type { Env } from "./types";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const fail = (status: number, code: string, message: string): never => {
  throw new ApiError(status, code, message);
};
export const json = (
  data: unknown,
  status = 200,
  headers: HeadersInit = {},
): Response =>
  Response.json(
    { data },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
export const parseBody = async <T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> => {
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json")
    return fail(415, "CONTENT_TYPE", "JSON 요청이 필요해요.");
  const reader = request.body?.getReader();
  if (!reader) return fail(400, "INPUT", "내용이 없어요.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 8192) {
      await reader.cancel();
      return fail(413, "BODY_SIZE", "요청이 너무 커요.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return fail(400, "INPUT", "입력 내용을 확인해 주세요.");
  }
};
export const ensureOrigin = (request: Request, env: Env): void => {
  if (request.headers.get("Origin") !== env.APP_ORIGIN)
    fail(403, "ORIGIN", "허용되지 않은 요청이에요.");
};
export const limit = async (
  binding: RequestLimit,
  key: string,
): Promise<void> => {
  if (!(await binding.limit({ key })).success)
    fail(429, "RATE_LIMIT", "잠시 후 다시 시도해 주세요.");
};
export const allowCreation = (env: Env): void => {
  if (env.CREATION_ENABLED !== "true")
    fail(
      503,
      "PAUSED",
      "새 생물 만들기를 잠시 쉬고 있어요. 기존 결과는 볼 수 있어요.",
    );
};
export const protect = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, headers });
};
