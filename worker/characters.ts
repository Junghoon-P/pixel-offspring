import { createSurveyV3 } from "../src/domain/surveyV3";
import type { z } from "zod";
import { createSurveyProfile } from "../src/domain/survey";
import { characterSchema, submissionSchema } from "../src/shared/contracts";
import { hash, parentRecipe, scoreAnswers } from "../src/domain/engine";
import type { Character } from "../src/domain/model";
import type { CharacterRow, Env, RequestKey, Session } from "./types";
import { DAY } from "./types";
import { allowCreation, fail, json, limit, parseBody } from "./http";
export const readCharacter = async (
  env: Env,
  id: string,
  owner?: string,
): Promise<CharacterRow> => {
  const row = await env.DB.prepare("SELECT * FROM characters WHERE id=$1")
    .bind(id)
    .first<CharacterRow>();
  if (!row) return fail(404, "NOT_FOUND", "생물을 찾을 수 없어요.");
  if (owner && row.owner_id !== owner)
    return fail(403, "OWNER", "내 생물만 관리할 수 있어요.");
  const session = await env.DB.prepare(
    "SELECT expires_at FROM sessions WHERE id=$1",
  )
    .bind(row.owner_id)
    .first<Session>();
  if (
    row.deleted_at ||
    row.expires_at <= Date.now() ||
    !session ||
    session.expires_at <= Date.now()
  )
    return fail(410, "GONE", "삭제되었거나 보관 기간이 끝난 생물이에요.");
  return row;
};
const persistCharacter = async (
  env: Env,
  session: Session,
  character: Character,
  idempotencyKey: string,
  digest: string,
): Promise<void> => {
  const { id, createdAt: now } = character;
  await env.DB.batch([
    env.DB.prepare("SELECT id FROM sessions WHERE id=$1 FOR SHARE").bind(
      session.id,
    ),
    env.DB.prepare(
      "DELETE FROM request_keys WHERE owner_id=$1 AND operation=$2 AND key=$3 AND expires_at<=$4",
    ).bind(session.id, "character", idempotencyKey, now),
    env.DB.prepare(
      "INSERT INTO request_keys VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
    ).bind(session.id, "character", idempotencyKey, digest, id, now + DAY),
    env.DB.prepare(
      "INSERT INTO characters SELECT $1,$2,$3,$4,$5,NULL WHERE EXISTS(SELECT 1 FROM request_keys WHERE owner_id=$6 AND operation='character' AND key=$7 AND resource_id=$8) AND EXISTS(SELECT 1 FROM sessions WHERE id=$9 AND expires_at>$10)",
    ).bind(
      id,
      session.id,
      JSON.stringify(character),
      now,
      character.expiresAt,
      session.id,
      idempotencyKey,
      id,
      session.id,
      now,
    ),
  ]);
};
const createSnapshot = (
  data: z.infer<typeof submissionSchema>,
  session: Session,
  now: number,
  id: string,
): Character => {
  const survey =
    data.quizVersion === 3 ? createSurveyV3(data.answers) : data.quizVersion === 2 ? createSurveyProfile(data.answers) : undefined;
  const recipe = survey?.recipe ?? parentRecipe(data.answers);
  return {
    id,
    nickname: data.nickname,
    traits: survey?.traits ?? scoreAnswers(data.answers),
    quizVersion: data.quizVersion,
    scoreVersion: data.quizVersion,
    ...(survey ? { profile: survey.profile } : {}),
    recipe,
    assetVersion: recipe.assetVersion,
    createdAt: now,
    expiresAt: Math.min(now + 90 * DAY, session.expires_at),
  };
};
const storedCharacter = async (
  env: Env,
  id: string,
  owner: string,
): Promise<Character> =>
  characterSchema.parse(
    JSON.parse((await readCharacter(env, id, owner)).snapshot),
  );
export const createCharacter = async (
  request: Request,
  env: Env,
  session: Session,
): Promise<Response> => {
  const data = await parseBody(request, submissionSchema);
  const { idempotencyKey, ...payload } = data;
  const digest = await hash(
    JSON.stringify({
      ...payload,
      answers: [...payload.answers].sort((a, b) =>
        a.questionId.localeCompare(b.questionId),
      ),
    }),
  );
  const previous = await env.DB.prepare(
    "SELECT * FROM request_keys WHERE owner_id=$1 AND operation='character' AND key=$2 AND expires_at>$3",
  )
    .bind(session.id, idempotencyKey, Date.now())
    .first<RequestKey>();
  if (previous) {
    if (previous.payload_hash !== digest)
      return fail(409, "KEY_CONFLICT", "같은 요청 키의 내용이 달라요.");
    return json(await storedCharacter(env, previous.resource_id, session.id));
  }
  allowCreation(env);
  await limit(env.WRITE_LIMIT, session.id);
  const now = Date.now(),
    id = crypto.randomUUID();
  const character = createSnapshot(data, session, now, id);
  await persistCharacter(env, session, character, idempotencyKey, digest);
  const saved = await env.DB.prepare(
    "SELECT * FROM request_keys WHERE owner_id=$1 AND operation='character' AND key=$2",
  )
    .bind(session.id, idempotencyKey)
    .first<RequestKey>();
  if (!saved || saved.payload_hash !== digest)
    return fail(409, "KEY_CONFLICT", "같은 요청 키의 내용이 달라요.");
  return json(
    characterSchema.parse(
      JSON.parse(
        (await readCharacter(env, saved.resource_id, session.id)).snapshot,
      ),
    ),
    saved.resource_id === id ? 201 : 200,
  );
};
export const listCharacters = async (
  env: Env,
  session: Session,
): Promise<Response> => {
  const rows = await env.DB.prepare(
    "SELECT * FROM characters WHERE owner_id=$1 AND deleted_at IS NULL AND expires_at>$2 ORDER BY created_at DESC,id DESC",
  )
    .bind(session.id, Date.now())
    .all<CharacterRow>();
  return json(
    rows.results.map((row) => characterSchema.parse(JSON.parse(row.snapshot))),
  );
};
export const deleteCharacter = async (
  env: Env,
  session: Session,
  id: string,
): Promise<Response> => {
  const row = await env.DB.prepare(
    "SELECT owner_id FROM characters WHERE id=$1",
  )
    .bind(id)
    .first<{ owner_id: string }>();
  if (!row) return fail(404, "NOT_FOUND", "생물을 찾을 수 없어요.");
  if (row.owner_id !== session.id)
    return fail(403, "OWNER", "내 생물만 삭제할 수 있어요.");
  await env.DB.prepare(
    "UPDATE characters SET deleted_at=COALESCE(deleted_at,$1) WHERE id=$2 AND owner_id=$3",
  )
    .bind(Date.now(), id, session.id)
    .run();
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
};
