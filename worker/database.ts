export interface Statement {
  sql: string;
  params: readonly unknown[];
  bind: (...params: unknown[]) => Statement;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results: T[] }>;
  run: () => Promise<void>;
}
export interface Database {
  prepare: (sql: string) => Statement;
  batch: (statements: Statement[]) => Promise<void>;
}
export interface DatabaseDriver {
  query: (sql: string, params: readonly unknown[]) => Promise<unknown[]>;
  batch: (statements: readonly Statement[]) => Promise<void>;
}
export const createDatabase = (driver: DatabaseDriver): Database => {
  const prepare = (
    sql: string,
    params: readonly unknown[] = [],
  ): Statement => ({
    sql,
    params,
    bind: (...values): Statement => prepare(sql, values),
    // DB rows remain internal; public snapshots are validated by the domain schemas.
    first: async <T>(): Promise<T | null> =>
      ((await driver.query(sql, params))[0] as T | undefined) ?? null,
    all: async <T>(): Promise<{ results: T[] }> => ({
      results: (await driver.query(sql, params)) as T[],
    }),
    run: async (): Promise<void> => {
      await driver.query(sql, params);
    },
  });
  return { prepare, batch: driver.batch };
};
