CREATE TABLE sessions(id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, created_at DOUBLE PRECISION NOT NULL, expires_at DOUBLE PRECISION NOT NULL);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE characters(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES sessions(id), snapshot TEXT NOT NULL CHECK(snapshot::jsonb IS NOT NULL), created_at DOUBLE PRECISION NOT NULL, expires_at DOUBLE PRECISION NOT NULL, deleted_at DOUBLE PRECISION);
CREATE INDEX characters_owner ON characters(owner_id,created_at);
CREATE INDEX characters_expiry ON characters(expires_at);
CREATE TABLE invites(id TEXT PRIMARY KEY, character_id TEXT NOT NULL REFERENCES characters(id), owner_id TEXT NOT NULL REFERENCES sessions(id), created_at DOUBLE PRECISION NOT NULL, expires_at DOUBLE PRECISION NOT NULL, deleted_at DOUBLE PRECISION);
CREATE UNIQUE INDEX active_invite ON invites(character_id) WHERE deleted_at IS NULL;
CREATE INDEX invites_expiry ON invites(expires_at);
CREATE TABLE results(id TEXT PRIMARY KEY, low_id TEXT NOT NULL REFERENCES characters(id), high_id TEXT NOT NULL REFERENCES characters(id), snapshot TEXT NOT NULL CHECK(snapshot::jsonb IS NOT NULL), created_at DOUBLE PRECISION NOT NULL, expires_at DOUBLE PRECISION NOT NULL, deleted_at DOUBLE PRECISION, UNIQUE(low_id,high_id), CHECK(low_id<high_id));
CREATE INDEX results_low ON results(low_id,created_at DESC,id DESC);
CREATE INDEX results_high ON results(high_id,created_at DESC,id DESC);
CREATE INDEX results_expiry ON results(expires_at);
CREATE TABLE request_keys(owner_id TEXT NOT NULL REFERENCES sessions(id),operation TEXT NOT NULL,key TEXT NOT NULL,payload_hash TEXT NOT NULL,resource_id TEXT NOT NULL,expires_at DOUBLE PRECISION NOT NULL,PRIMARY KEY(owner_id,operation,key));
CREATE INDEX request_keys_expiry ON request_keys(expires_at);
CREATE TABLE daily_metrics(day TEXT NOT NULL,event TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,event));
CREATE TABLE rate_limits(scope TEXT NOT NULL,key TEXT NOT NULL,bucket DOUBLE PRECISION NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(scope,key));
CREATE INDEX rate_limits_bucket ON rate_limits(bucket);
CREATE FUNCTION record_metric() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO daily_metrics VALUES((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date::text,TG_ARGV[0],1)
 ON CONFLICT(day,event) DO UPDATE SET count=daily_metrics.count+1;
 RETURN NEW;
END;
$$;
CREATE TRIGGER character_metric AFTER INSERT ON characters FOR EACH ROW EXECUTE FUNCTION record_metric('quiz_completed');
CREATE TRIGGER invite_metric AFTER INSERT ON invites FOR EACH ROW EXECUTE FUNCTION record_metric('invite_created');
CREATE TRIGGER result_metric AFTER INSERT ON results FOR EACH ROW EXECUTE FUNCTION record_metric('pair_created');
CREATE FUNCTION propagate_character_deletion() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 UPDATE invites SET deleted_at=NEW.deleted_at WHERE character_id=NEW.id AND deleted_at IS NULL;
 UPDATE results SET deleted_at=NEW.deleted_at WHERE (low_id=NEW.id OR high_id=NEW.id) AND deleted_at IS NULL;
 RETURN NEW;
END;
$$;
CREATE TRIGGER character_delete AFTER UPDATE OF deleted_at ON characters FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL) EXECUTE FUNCTION propagate_character_deletion();
