import type { Database } from "./database";
import type { RequestLimit } from "./rateLimit";
export interface Env {
  DB: Database;
  CRON_SECRET?: string;
  APP_ORIGIN: string;
  CREATION_ENABLED: string;
  LOCAL_DEV?: string;
  READ_LIMIT: RequestLimit;
  WRITE_LIMIT: RequestLimit;
  SESSION_LIMIT: RequestLimit;
}
export interface Session {
  id: string;
  expires_at: number;
}
export interface CharacterRow {
  id: string;
  owner_id: string;
  snapshot: string;
  created_at: number;
  expires_at: number;
  deleted_at: number | null;
}
export interface InviteRow {
  id: string;
  character_id: string;
  owner_id: string;
  created_at: number;
  expires_at: number;
  deleted_at: number | null;
}
export interface ResultRow {
  id: string;
  low_id: string;
  high_id: string;
  snapshot: string;
  created_at: number;
  expires_at: number;
  deleted_at: number | null;
}
export interface RequestKey {
  payload_hash: string;
  resource_id: string;
}
export const DAY = 86400000;
