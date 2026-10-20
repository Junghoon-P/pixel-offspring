import { z } from "zod";
import { characterSchema, resultSchema, publicParentSchema } from "./contracts";
import type {
  Character,
  Invite,
  InvitePreview,
  Pair,
  PublicResult,
  ResultPage,
} from "../domain/model";
export class RequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export const api = async <T>(
  path: string,
  schema: z.ZodType<T>,
  method = "GET",
  body?: unknown,
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new RequestError(
      0,
      "NETWORK",
      "인터넷 연결을 확인하고 다시 시도해 주세요.",
    );
  }
  if (response.status === 204) return schema.parse(undefined);
  const value: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = errorSchema.safeParse(value);
    throw new RequestError(
      response.status,
      error.success ? error.data.error.code : "SERVER",
      error.success
        ? error.data.error.message
        : "잠시 연결이 어려워요. 다시 시도해 주세요.",
    );
  }
  const parsed = z.object({ data: schema }).safeParse(value);
  if (!parsed.success)
    throw new RequestError(
      response.status,
      "RESPONSE",
      "응답을 확인하지 못했어요. 다시 시도해 주세요.",
    );
  return parsed.data.data;
};
export const ensureSession = (): Promise<{ active: boolean }> =>
  api("/api/session", z.object({ active: z.boolean() }), "POST");
export const getCharacters = (): Promise<Character[]> =>
  api("/api/me/characters", z.array(characterSchema));
export const getResults = (cursor?: string): Promise<ResultPage> =>
  api(
    `/api/me/results${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    z.object({
      items: z.array(resultSchema),
      nextCursor: z.string().nullable(),
    }),
  );
export const getResult = (id: string): Promise<PublicResult> =>
  api(`/api/results/${id}`, resultSchema);
export const getInvite = (id: string): Promise<InvitePreview> =>
  api(
    `/api/invites/${id}`,
    z.object({ parent: publicParentSchema, expiresAt: z.number() }),
  );
export const createInvite = (
  characterId: string,
  key: string,
): Promise<Invite> =>
  api(
    "/api/invites",
    z.object({ id: z.string(), url: z.string(), expiresAt: z.number() }),
    "POST",
    { characterId, idempotencyKey: key },
  );
export const createPair = (id: string, characterId: string): Promise<Pair> =>
  api(
    `/api/invites/${id}/pair`,
    z.object({
      resultId: z.string(),
      resultUrl: z.string(),
      created: z.boolean(),
      expiresAt: z.number(),
    }),
    "POST",
    { characterId },
  );
export const recordEvent = (event: string): void => {
  void api("/api/events", z.object({ accepted: z.boolean() }), "POST", {
    event,
  }).catch(() => undefined);
};
