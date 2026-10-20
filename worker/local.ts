import type { LocalDatabase } from "../scripts/localDatabase";
import type { Env } from "./types";
import { createRateLimit } from "./rateLimit";
export const usesLocalDatabase = (): boolean =>
  process.env.VERCEL !== "1" &&
  (process.env.NODE_ENV === "development" ||
    process.env.PIXEL_LOCAL_DB === "true");
const cache = globalThis as typeof globalThis & {
  pixelLocalDatabase?: Promise<LocalDatabase>;
};
export const localDatabase = (): Promise<LocalDatabase> => {
  if (!usesLocalDatabase()) throw new Error("Local database is disabled");
  cache.pixelLocalDatabase ??= import("../scripts/localDatabase").then(
    ({ openLocalDatabase }) =>
      openLocalDatabase(process.env.E2E_DB_TOKEN ? undefined : ".data/pglite"),
  );
  return cache.pixelLocalDatabase;
};
export const localEnvironment = async (): Promise<Env> => {
  const { db: DB } = await localDatabase();
  return {
    DB,
    APP_ORIGIN: process.env.APP_ORIGIN ?? "http://127.0.0.1:5173",
    LOCAL_DEV: "true",
    CREATION_ENABLED: "true",
    CRON_SECRET: process.env.E2E_DB_TOKEN,
    READ_LIMIT: createRateLimit(DB, "read", 60),
    WRITE_LIMIT: createRateLimit(DB, "write", 30),
    SESSION_LIMIT: createRateLimit(DB, "session", 30),
  };
};
