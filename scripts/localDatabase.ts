import { migrationStatements } from "./migration";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { createDatabase, type Database } from "../worker/database";
export interface LocalDatabase {
  db: Database;
  pg: PGlite;
}
export const openLocalDatabase = async (
  directory?: string,
): Promise<LocalDatabase> => {
  const pg = new PGlite(directory);
  const statements = migrationStatements(
    await readFile("migrations/0001_postgres.sql", "utf8"),
  );
  await pg.transaction(async (tx): Promise<void> => {
    for (const statement of statements) await tx.query(statement);
  });
  const db = createDatabase({
    query: async (sql, params): Promise<unknown[]> =>
      (await pg.query(sql, [...params])).rows,
    batch: async (statements): Promise<void> => {
      await pg.transaction(async (tx): Promise<void> => {
        for (const statement of statements)
          await tx.query(statement.sql, [...statement.params]);
      });
    },
  });
  return { db, pg };
};
