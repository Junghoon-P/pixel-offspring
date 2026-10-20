import { characterSchema, inviteInputSchema } from "../src/shared/contracts";
import { hash } from "../src/domain/engine";
import { readCharacter } from "./characters";
import { allowCreation, fail, json, limit, parseBody } from "./http";
import { DAY } from "./types";
import type {
  Env,
  InviteRow,
  Session,
  RequestKey,
  CharacterRow,
} from "./types";
export const readInvite = async (env: Env, id: string): Promise<InviteRow> => {
  const row = await env.DB.prepare("SELECT * FROM invites WHERE id=$1")
    .bind(id)
    .first<InviteRow>();
  if (!row) return fail(404, "NOT_FOUND", "초대 링크를 찾을 수 없어요.");
  if (row.deleted_at || row.expires_at <= Date.now())
    return fail(410, "GONE", "초대가 만료되었거나 삭제됐어요.");
  await readCharacter(env, row.character_id);
  return row;
};
export const previewInvite = async (
  env: Env,
  id: string,
): Promise<Response> => {
  const invite = await readInvite(env, id),
    row = await readCharacter(env, invite.character_id);
  const {
    traits: _,
    createdAt: __,
    expiresAt: ___,
    ...parent
  } = characterSchema.parse(JSON.parse(row.snapshot));
  return json({ parent, expiresAt: invite.expires_at });
};
const inviteResponse = (env: Env, row: InviteRow, status = 200): Response =>
  json(
    {
      id: row.id,
      url: `${env.APP_ORIGIN}/i/${row.id}`,
      expiresAt: row.expires_at,
    },
    status,
  );
interface InviteWrite {
  parent: CharacterRow;
  digest: string;
  id: string;
  expiry: number;
  now: number;
  data: { characterId: string; idempotencyKey: string };
}
const persistInvite = async (
  env: Env,
  session: Session,
  input: InviteWrite,
): Promise<void> => {
  const { parent, digest, id, expiry, now, data } = input;
  await env.DB.batch([
    env.DB.prepare("SELECT id FROM characters WHERE id=$1 FOR SHARE").bind(
      parent.id,
    ),
    env.DB.prepare(
      "DELETE FROM request_keys WHERE owner_id=$1 AND operation='invite' AND key=$2 AND expires_at<=$3",
    ).bind(session.id, data.idempotencyKey, now),
    env.DB.prepare(
      "INSERT INTO request_keys VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
    ).bind(session.id, "invite", data.idempotencyKey, digest, id, now + DAY),
    env.DB.prepare(
      "UPDATE invites SET deleted_at=$1 WHERE character_id=$2 AND expires_at<=$3 AND deleted_at IS NULL",
    ).bind(now, parent.id, now),
    env.DB.prepare(
      "INSERT INTO invites SELECT $1,$2,$3,$4,$5,NULL WHERE EXISTS(SELECT 1 FROM characters WHERE id=$6 AND deleted_at IS NULL AND expires_at>$7) AND EXISTS(SELECT 1 FROM request_keys WHERE owner_id=$8 AND operation='invite' AND key=$9 AND resource_id=$10) ON CONFLICT DO NOTHING",
    ).bind(
      id,
      parent.id,
      session.id,
      now,
      expiry,
      parent.id,
      now,
      session.id,
      data.idempotencyKey,
      id,
    ),
    env.DB.prepare(
      "UPDATE request_keys SET resource_id=(SELECT id FROM invites WHERE character_id=$1 AND deleted_at IS NULL AND expires_at>$2) WHERE owner_id=$3 AND operation='invite' AND key=$4 AND payload_hash=$5 AND EXISTS(SELECT 1 FROM invites WHERE character_id=$6 AND deleted_at IS NULL AND expires_at>$7)",
    ).bind(
      parent.id,
      now,
      session.id,
      data.idempotencyKey,
      digest,
      parent.id,
      now,
    ),
  ]);
};
export const createInvite = async (
  request: Request,
  env: Env,
  session: Session,
): Promise<Response> => {
  const data = await parseBody(request, inviteInputSchema),
    now = Date.now();
  const parent = await readCharacter(env, data.characterId, session.id),
    digest = await hash(data.characterId);
  const previous = await env.DB.prepare(
    "SELECT * FROM request_keys WHERE owner_id=$1 AND operation='invite' AND key=$2 AND expires_at>$3",
  )
    .bind(session.id, data.idempotencyKey, now)
    .first<RequestKey>();
  if (previous) {
    if (previous.payload_hash !== digest)
      return fail(409, "KEY_CONFLICT", "같은 요청 키의 내용이 달라요.");
    return inviteResponse(env, await readInvite(env, previous.resource_id));
  }
  const current = await env.DB.prepare(
    "SELECT * FROM invites WHERE character_id=$1 AND deleted_at IS NULL AND expires_at>$2",
  )
    .bind(parent.id, now)
    .first<InviteRow>();
  if (!current) {
    allowCreation(env);
    await limit(env.WRITE_LIMIT, session.id);
  }
  const id = current?.id ?? crypto.randomUUID(),
    expiry = Math.min(now + 30 * DAY, parent.expires_at);
  await persistInvite(env, session, { parent, digest, id, expiry, now, data });
  const key = await env.DB.prepare(
    "SELECT * FROM request_keys WHERE owner_id=$1 AND operation='invite' AND key=$2",
  )
    .bind(session.id, data.idempotencyKey)
    .first<RequestKey>();
  if (!key || key.payload_hash !== digest)
    return fail(409, "KEY_CONFLICT", "같은 요청 키의 내용이 달라요.");
  const saved = await readInvite(env, key.resource_id);
  return inviteResponse(env, saved, !current && saved.id === id ? 201 : 200);
};
