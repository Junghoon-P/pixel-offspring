import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { createDatabase } from "./database";
import { createRateLimit } from "./rateLimit";
const pg = new PGlite();
const db = createDatabase({
  query: async (sql, params) => (await pg.query(sql, [...params])).rows,
  batch: async (statements) =>
    pg.transaction(async (tx) => {
      for (const statement of statements)
        await tx.query(statement.sql, [...statement.params]);
    }),
});
beforeAll(async () => {
  await pg.exec(readFileSync("migrations/0001_postgres.sql", "utf8"));
});
afterAll(async () => {
  await pg.close();
});
it("PostgreSQL 배치는 실패 시 전체 롤백하고 정상 행을 읽는다", async () => {
  await expect(
    db.batch([
      db
        .prepare("INSERT INTO sessions VALUES($1,$2,0,1)")
        .bind("rollback", "hash"),
      db.prepare("INSERT INTO missing_table VALUES(1)"),
    ]),
  ).rejects.toThrow();
  expect(
    await db
      .prepare("SELECT * FROM sessions WHERE id=$1")
      .bind("rollback")
      .first(),
  ).toBeNull();
  await db
    .prepare("INSERT INTO sessions VALUES($1,$2,0,1)")
    .bind("kept", "hash")
    .run();
  expect((await db.prepare("SELECT id FROM sessions").all()).results).toEqual([
    { id: "kept" },
  ]);
});
it("동시 요청 제한은 DB에서 공유되고 다른 키는 독립적이다", async () => {
  const limit = createRateLimit(db, "read", 3);
  const responses = await Promise.all(
    Array.from({ length: 10 }, () => limit.limit({ key: "same" })),
  );
  expect(responses.filter((value) => value.success)).toHaveLength(3);
  expect((await limit.limit({ key: "other" })).success).toBe(true);
});

it("마이그레이션 재실행은 데이터를 보존하고 적용된 파일 변경은 거부한다", async () => {
  const { migrationStatements } = await import("../scripts/migration");
  const migrationDb = new PGlite();
  const source = readFileSync("migrations/0001_postgres.sql", "utf8");
  const apply = async (content: string): Promise<void> => {
    await migrationDb.transaction(async (tx): Promise<void> => {
      for (const statement of migrationStatements(content))
        await tx.query(statement);
    });
  };
  try {
    await apply(source);
    await migrationDb.query(
      "INSERT INTO sessions VALUES('preserved','hash',0,1)",
    );
    await apply(source);
    expect((await migrationDb.query("SELECT id FROM sessions")).rows).toEqual([
      { id: "preserved" },
    ]);
    await expect(apply(`${source}\n`)).rejects.toThrow("checksum mismatch");
  } finally {
    await migrationDb.close();
  }
});
