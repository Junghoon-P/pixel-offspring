import { expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({
  query: vi.fn(),
  transaction: vi.fn(),
  neon: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({ neon: fake.neon }));
import { createNeonDatabase } from "./neon";
it("Neon에 SQL과 파라미터를 분리하고 배치 전체를 한 트랜잭션으로 전달한다", async () => {
  fake.neon.mockReturnValue(fake);
  fake.query.mockResolvedValue([{ id: "one" }]);
  fake.transaction.mockResolvedValue([]);
  const db = createNeonDatabase("postgresql://example.invalid/test");
  expect(
    await db
      .prepare("SELECT id FROM sessions WHERE id=$1")
      .bind("' OR 1=1")
      .first(),
  ).toEqual({ id: "one" });
  expect(fake.query).toHaveBeenCalledWith(
    "SELECT id FROM sessions WHERE id=$1",
    ["' OR 1=1"],
  );
  await db.batch([db.prepare("DELETE FROM sessions WHERE id=$1").bind("one")]);
  expect(fake.transaction).toHaveBeenCalledTimes(1);
});
