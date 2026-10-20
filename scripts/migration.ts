import { createHash } from "node:crypto";
export const migrationStatements = (source: string): string[] => {
  const digest = createHash("sha256").update(source).digest("hex");
  return [
    "SELECT pg_advisory_xact_lock(76203118)",
    "CREATE TABLE IF NOT EXISTS schema_migrations(id TEXT PRIMARY KEY, checksum TEXT NOT NULL)",
    `DO $migration$ BEGIN
      IF EXISTS(SELECT 1 FROM schema_migrations WHERE id='0001_postgres' AND checksum<>'${digest}') THEN
        RAISE EXCEPTION 'Applied migration checksum mismatch';
      END IF;
      IF NOT EXISTS(SELECT 1 FROM schema_migrations WHERE id='0001_postgres') THEN
        ${source}
        INSERT INTO schema_migrations VALUES('0001_postgres','${digest}');
      END IF;
    END $migration$;`,
  ];
};
