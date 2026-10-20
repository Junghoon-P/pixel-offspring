import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { migrationStatements } from "./migration.ts";
const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("DATABASE_URL is required; use a dedicated Neon database.");
const sql = neon(url);
const statements = migrationStatements(
  await readFile("migrations/0001_postgres.sql", "utf8"),
);
await sql.transaction(statements.map((statement) => sql.query(statement)));
process.stdout.write("PostgreSQL migration applied successfully.\n");
