import type { Env } from "./types";
export const cleanup = async (env: Env): Promise<void> => {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM rate_limits WHERE bucket<$1").bind(
      Math.floor(now / 60000) - 2,
    ),
    env.DB.prepare(
      "UPDATE characters SET deleted_at=COALESCE(deleted_at,$1) WHERE owner_id IN(SELECT id FROM sessions WHERE expires_at<=$2)",
    ).bind(now, now),
    env.DB.prepare(
      "DELETE FROM request_keys WHERE expires_at<=$1 OR owner_id IN(SELECT id FROM sessions WHERE expires_at<=$2) OR resource_id IN(SELECT id FROM characters WHERE deleted_at IS NOT NULL OR expires_at<=$3)",
    ).bind(now, now, now),
    env.DB.prepare(
      "DELETE FROM results WHERE deleted_at IS NOT NULL OR expires_at<=$1 OR low_id IN(SELECT id FROM characters WHERE deleted_at IS NOT NULL OR expires_at<=$2) OR high_id IN(SELECT id FROM characters WHERE deleted_at IS NOT NULL OR expires_at<=$3)",
    ).bind(now, now, now),
    env.DB.prepare(
      "DELETE FROM invites WHERE deleted_at IS NOT NULL OR expires_at<=$1 OR character_id IN(SELECT id FROM characters WHERE deleted_at IS NOT NULL OR expires_at<=$2)",
    ).bind(now, now),
    env.DB.prepare(
      "DELETE FROM characters WHERE deleted_at IS NOT NULL OR expires_at<=$1",
    ).bind(now),
    env.DB.prepare("DELETE FROM sessions WHERE expires_at<=$1").bind(now),
    env.DB.prepare(
      "DELETE FROM daily_metrics WHERE day<(CURRENT_DATE - INTERVAL '90 days')::date::text",
    ),
  ]);
};
