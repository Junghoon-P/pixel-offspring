import {
  characterSchema,
  cursorSchema,
  pairInputSchema,
  resultSchema,
} from "../src/shared/contracts";
import { offspring } from "../src/domain/engine";
import type { PublicResult } from "../src/domain/model";
import { readCharacter } from "./characters";
import { readInvite } from "./invites";
import { allowCreation, fail, json, limit, parseBody } from "./http";
import type { Env, ResultRow, Session, CharacterRow } from "./types";
export const readResult = async (
  env: Env,
  id: string,
): Promise<PublicResult> => {
  const row = await env.DB.prepare("SELECT * FROM results WHERE id=$1")
    .bind(id)
    .first<ResultRow>();
  if (!row) return fail(404, "NOT_FOUND", "결과를 찾을 수 없어요.");
  if (row.deleted_at || row.expires_at <= Date.now())
    return fail(410, "GONE", "삭제되었거나 보관 기간이 끝난 결과예요.");
  await Promise.all([
    readCharacter(env, row.low_id),
    readCharacter(env, row.high_id),
  ]);
  return resultSchema.parse(JSON.parse(row.snapshot));
};
const persistResult = async (
  env: Env,
  snapshot: PublicResult,
  ids: string[],
  inviteId: string,
): Promise<void> => {
  const { resultId: id, createdAt: now } = snapshot;
  // Keep deletion propagation and insertion ordered across PostgreSQL connections.
  await env.DB.batch([
    env.DB.prepare(
      "SELECT id FROM characters WHERE id IN($1,$2) ORDER BY id FOR SHARE",
    ).bind(...ids),
    env.DB.prepare(
      `INSERT INTO results SELECT $1,$2,$3,$4,$5,$6,NULL WHERE
 EXISTS(SELECT 1 FROM characters c JOIN sessions s ON s.id=c.owner_id WHERE c.id=$7 AND c.deleted_at IS NULL AND c.expires_at>$8 AND s.expires_at>$9) AND
 EXISTS(SELECT 1 FROM characters c JOIN sessions s ON s.id=c.owner_id WHERE c.id=$10 AND c.deleted_at IS NULL AND c.expires_at>$11 AND s.expires_at>$12) AND
 EXISTS(SELECT 1 FROM invites WHERE id=$13 AND deleted_at IS NULL AND expires_at>$14) ON CONFLICT DO NOTHING`,
    ).bind(
      id,
      ...ids,
      JSON.stringify(snapshot),
      now,
      snapshot.expiresAt,
      ids[0],
      now,
      now,
      ids[1],
      now,
      now,
      inviteId,
      now,
    ),
  ]);
};
const createResultSnapshot = async (
  rows: CharacterRow[],
): Promise<PublicResult> => {
  const [a, b] = rows;
  const parents = rows.map((row) =>
    characterSchema.parse(JSON.parse(row.snapshot)),
  );
  const now = Date.now(),
    id = crypto.randomUUID();
  return {
    resultId: id,
    parents: parents.map(
      ({ traits: _, createdAt: __, expiresAt: ___, ...parent }) => parent,
    ),
    child: await offspring(parents[0], parents[1]),
    createdAt: now,
    expiresAt: Math.min(a.expires_at, b.expires_at),
  };
};
const pairResponse = (value: PublicResult, created: boolean): Response =>
  json(
    {
      resultId: value.resultId,
      resultUrl: `/r/${value.resultId}`,
      created,
      expiresAt: value.expiresAt,
    },
    created ? 201 : 200,
  );
export const pairCharacters = async (
  request: Request,
  env: Env,
  session: Session,
  inviteId: string,
): Promise<Response> => {
  const data = await parseBody(request, pairInputSchema),
    invite = await readInvite(env, inviteId);
  const [a, b] = await Promise.all([
    readCharacter(env, invite.character_id),
    readCharacter(env, data.characterId, session.id),
  ]);
  if (a.id === b.id)
    return fail(
      409,
      "SELF_PAIR",
      "자신의 생물끼리는 조합할 수 없어요. 친구를 초대해 주세요.",
    );
  const rows = [a, b].sort((x, y) => (x.id < y.id ? -1 : 1)),
    ids = rows.map((row) => row.id);
  const existing = await env.DB.prepare(
    "SELECT id FROM results WHERE low_id=$1 AND high_id=$2",
  )
    .bind(...ids)
    .first<{ id: string }>();
  if (existing) {
    const value = await readResult(env, existing.id);
    return pairResponse(value, false);
  }
  allowCreation(env);
  await limit(env.WRITE_LIMIT, session.id);
  const snapshot = await createResultSnapshot(rows);
  const id = snapshot.resultId;
  await persistResult(env, snapshot, ids, inviteId);
  const saved = await env.DB.prepare(
    "SELECT id FROM results WHERE low_id=$1 AND high_id=$2",
  )
    .bind(...ids)
    .first<{ id: string }>();
  if (!saved)
    return fail(410, "GONE", "초대 또는 생물의 보관 기간이 끝났어요.");
  const result = await readResult(env, saved.id);
  return pairResponse(result, saved.id === id);
};
export const listResults = async (
  request: Request,
  env: Env,
  session: Session,
): Promise<Response> => {
  const params = new URL(request.url).searchParams;
  const limitValue = params.get("limit") ?? "20";
  if (!/^(?:[1-9]|1[0-9]|20)$/.test(limitValue))
    return fail(400, "CURSOR", "목록 크기가 올바르지 않아요.");
  let cursor: { createdAt: number; id: string } | null = null;
  if (params.has("cursor")) {
    try {
      const raw = params.get("cursor")!;
      if (raw.length > 256) throw new Error();
      cursor = cursorSchema.parse(JSON.parse(atob(raw)));
    } catch {
      return fail(400, "CURSOR", "목록 위치가 올바르지 않아요.");
    }
  }
  const count = Number(limitValue),
    now = Date.now();
  const rows = await env.DB.prepare(
    `SELECT r.* FROM results r JOIN characters a ON a.id=r.low_id JOIN characters b ON b.id=r.high_id JOIN sessions sa ON sa.id=a.owner_id JOIN sessions sb ON sb.id=b.owner_id
 WHERE (a.owner_id=$1 OR b.owner_id=$2) AND r.deleted_at IS NULL AND a.deleted_at IS NULL AND b.deleted_at IS NULL AND r.expires_at>$3 AND a.expires_at>$4 AND b.expires_at>$5 AND sa.expires_at>$6 AND sb.expires_at>$7
 AND (r.created_at<$8 OR (r.created_at=$9 AND r.id<$10)) ORDER BY r.created_at DESC,r.id DESC LIMIT $11`,
  )
    .bind(
      session.id,
      session.id,
      now,
      now,
      now,
      now,
      now,
      cursor?.createdAt ?? Number.MAX_SAFE_INTEGER,
      cursor?.createdAt ?? Number.MAX_SAFE_INTEGER,
      cursor?.id ?? "~",
      count + 1,
    )
    .all<ResultRow>();
  const page = rows.results.slice(0, count),
    last = page.at(-1);
  return json({
    items: page.map((row) => resultSchema.parse(JSON.parse(row.snapshot))),
    nextCursor:
      rows.results.length > count && last
        ? btoa(JSON.stringify({ createdAt: last.created_at, id: last.id }))
        : null,
  });
};
