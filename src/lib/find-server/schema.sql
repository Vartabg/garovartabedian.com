-- Run explicitly with research:find:server -- migrate. Never applied by a page load.
CREATE TABLE IF NOT EXISTS find_control (
  id integer PRIMARY KEY CHECK (id = 1), enabled boolean NOT NULL DEFAULT false
);
INSERT INTO find_control (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS find_usage (
  bucket text PRIMARY KEY, jobs integer NOT NULL DEFAULT 0,
  nanos bigint NOT NULL DEFAULT 0 CHECK (nanos >= 0), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS find_jobs (
  id uuid PRIMARY KEY, owner text NOT NULL, request_key text NOT NULL,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  cancelled boolean NOT NULL DEFAULT false, UNIQUE(owner, request_key)
);
ALTER TABLE find_jobs ADD COLUMN IF NOT EXISTS dispatch_after timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS find_items (
  job uuid NOT NULL REFERENCES find_jobs(id) ON DELETE CASCADE, position integer NOT NULL,
  cache_key text NOT NULL, state text NOT NULL DEFAULT 'queued', attempts integer NOT NULL DEFAULT 0,
  lease uuid, lease_until timestamptz, next_at timestamptz NOT NULL DEFAULT now(),
  reply jsonb, error text, PRIMARY KEY(job, position),
  CHECK (state IN ('queued', 'running', 'complete', 'incomplete'))
);
CREATE INDEX IF NOT EXISTS find_items_pending ON find_items(state, next_at);
CREATE TABLE IF NOT EXISTS find_attempts (
  lease uuid PRIMARY KEY, job uuid NOT NULL, position integer NOT NULL,
  day_bucket text NOT NULL, month_bucket text NOT NULL, reserved bigint NOT NULL,
  charged bigint NOT NULL, input_tokens integer, output_tokens integer,
  state text NOT NULL DEFAULT 'unknown', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS find_cache (
  key text PRIMARY KEY, reply jsonb NOT NULL, expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
