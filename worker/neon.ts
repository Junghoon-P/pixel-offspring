import { neon } from "@neondatabase/serverless";
import { createDatabase, type Database } from "./database";
export const createNeonDatabase = (url: string): Database => {
  const sql = neon(url);
  return createDatabase({
    query: async (text, params): Promise<unknown[]> =>
      sql.query(text, [...params]),
    batch: async (statements): Promise<void> => {
      await sql.transaction(
        statements.map((item) => sql.query(item.sql, [...item.params])),
      );
    },
  });
};
