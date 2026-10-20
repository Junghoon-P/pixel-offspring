import { createNeonDatabase } from "./neon";
import { readConfig } from "./config";
import { createRateLimit } from "./rateLimit";
import { usesLocalDatabase, localEnvironment } from "./local";
import type { Env } from "./types";
let cached: Env | undefined;
export const runtimeEnvironment = async (): Promise<Env> => {
  if (usesLocalDatabase()) return localEnvironment();
  if (cached) return cached;
  const config = readConfig(process.env);
  const DB = createNeonDatabase(config.DATABASE_URL);
  cached = {
    ...config,
    DB,
    LOCAL_DEV: "false",
    READ_LIMIT: createRateLimit(DB, "read", 60),
    WRITE_LIMIT: createRateLimit(DB, "write", 30),
    SESSION_LIMIT: createRateLimit(DB, "session", 30),
  };
  return cached;
};
