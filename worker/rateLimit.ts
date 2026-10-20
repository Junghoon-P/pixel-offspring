import type { Database } from "./database";
import { hash } from "../src/domain/engine";
export interface RequestLimit {
  limit: (input: { key: string }) => Promise<{ success: boolean }>;
}
export const createRateLimit = (
  db: Database,
  scope: string,
  maximum: number,
): RequestLimit => ({
  limit: async ({ key }): Promise<{ success: boolean }> => {
    const bucket = Math.floor(Date.now() / 60000);
    const row = await db
      .prepare(
        `INSERT INTO rate_limits(scope,key,bucket,count) VALUES($1,$2,$3,1)
      ON CONFLICT(scope,key) DO UPDATE SET bucket=EXCLUDED.bucket,
      count=CASE WHEN rate_limits.bucket=EXCLUDED.bucket THEN LEAST(rate_limits.count+1,$4+1) ELSE 1 END
      RETURNING count`,
      )
      .bind(scope, await hash(key), bucket, maximum)
      .first<{ count: number }>();
    return { success: row !== null && row.count <= maximum };
  },
});
