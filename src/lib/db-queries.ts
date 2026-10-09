/**
 * SQL and row mapping for the Postgres-backed record store.
 *
 * Deliberately free of `server-only` and of any Node/crypto imports so the
 * exact statements below can be executed against a real Postgres engine
 * (Neon in production, PGlite in `scripts/verify-db.mjs`) and the results
 * compared. Keep all SQL here rather than inline in `db.ts`.
 */

/**
 * Minimal shape shared by the Neon driver and the PGlite test harness.
 *
 * A plain `query(text, params)` method is used rather than a tagged template so
 * the same `$1`-style statements can be executed by both. (Tagged-template
 * interpolation inlines values instead of binding them, which would leave the
 * `$1` placeholders unbound.)
 */
export type SqlExecutor = {
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<Record<string, unknown>[]>;
};

export type Queryable = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

/** Adapts a driver that returns `{ rows }` into the flat executor shape. */
export function toExecutor(db: Queryable): SqlExecutor {
  return {
    async query(sql, params) {
      const result = await db.query(sql, params);
      return result.rows as Record<string, unknown>[];
    },
  };
}

/**
 * One table for every collection. Records keep their flexible document shape
 * in `data`; `collection`/`created_at`/`stage` are mirrored into columns so
 * ordering and filtering stay indexable.
 *
 * `created_at` is TEXT rather than TIMESTAMPTZ on purpose: the rest of the app
 * compares these values with `localeCompare`, so preserving the original ISO
 * string avoids any timezone-shifting of stored timestamps.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS records (
  collection   TEXT NOT NULL,
  id           TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT,
  stage        TEXT,
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS records_collection_created_at_idx
  ON records (collection, created_at DESC);

CREATE INDEX IF NOT EXISTS records_collection_slug_idx
  ON records (collection, (data ->> 'slug'));
`;

export const SELECT_ALL = `
  SELECT data FROM records
  WHERE collection = $1
  ORDER BY created_at DESC
`;

export const SELECT_BY_ID = `
  SELECT data FROM records
  WHERE collection = $1 AND id = $2
  LIMIT 1
`;

export const SELECT_BY_SLUG = `
  SELECT data FROM records
  WHERE collection = $1 AND data ->> 'slug' = $2
  LIMIT 1
`;

export const INSERT = `
  INSERT INTO records (collection, id, created_at, updated_at, stage, data)
  VALUES ($1, $2, $3, $4, $5, $6::jsonb)
  ON CONFLICT (collection, id) DO UPDATE
    SET created_at = EXCLUDED.created_at,
        stage      = EXCLUDED.stage,
        data       = EXCLUDED.data
`;

export const UPDATE_BY_ID = `
  UPDATE records
  SET data = $3::jsonb, updated_at = $4, stage = $5
  WHERE collection = $1 AND id = $2
  RETURNING data
`;

export const DELETE_BY_ID = `
  DELETE FROM records
  WHERE collection = $1 AND id = $2
  RETURNING id
`;

/**
 * Postgres already hands back parsed JSONB, but a driver configured to return
 * raw strings would otherwise leak `"[object Object]"` into the admin UI.
 */
export function rowToRecord<T>(row: Record<string, unknown> | undefined): T | null {
  if (!row) return null;
  const data = row.data;
  if (data === null || data === undefined) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return data as T;
}

/** Row columns mirrored out of a record alongside its JSONB payload. */
export interface RecordColumns {
  collection: string;
  id: string;
  createdAt: string;
  updatedAt: string | null;
  stage: string | null;
  json: string;
}

/**
 * Derives the mirrored columns from a record.
 *
 * Returns a named object rather than a positional tuple on purpose: an earlier
 * version returned an array and the UPDATE call sites silently read the wrong
 * indices, writing a timestamp into the JSONB column.
 */
export function toColumns(
  collection: string,
  record: Record<string, unknown>,
): RecordColumns {
  const createdAt =
    typeof record.createdAt === "string" && record.createdAt
      ? record.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === "string" && record.updatedAt
      ? record.updatedAt
      : null;
  const stage =
    typeof record.stage === "string" && record.stage ? record.stage : null;
  return {
    collection,
    id: String(record.id ?? ""),
    createdAt,
    updatedAt,
    stage,
    json: JSON.stringify(record),
  };
}

/** Bind parameters for `INSERT`, in positional order. */
export function insertParams(columns: RecordColumns): unknown[] {
  const { collection, id, createdAt, updatedAt, stage, json } = columns;
  return [collection, id, createdAt, updatedAt, stage, json];
}

/** Bind parameters for `UPDATE_BY_ID`, targeting the given row id. */
export function updateParams(
  columns: RecordColumns,
  targetId: string,
): unknown[] {
  const { collection, json, updatedAt, stage } = columns;
  return [collection, targetId, json, updatedAt, stage];
}

/** Collects every `data` column from a result set into records. */
export function rowsToRecords<T>(rows: Record<string, unknown>[]): T[] {
  const out: T[] = [];
  for (const row of rows) {
    const record = rowToRecord<T>(row);
    if (record) out.push(record);
  }
  return out;
}