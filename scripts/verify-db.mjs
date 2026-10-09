/**
 * Executes the real SQL from src/lib/db-queries.ts against an in-process
 * Postgres engine (PGlite) so the statements are verified rather than assumed.
 *
 *   node scripts/verify-db.mjs
 *
 * This validates the schema, the JSONB round-trip and every statement used by
 * src/lib/db.ts. It does not exercise PII encryption, which is covered by the
 * admin round-trip test.
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const queriesModule = await import(
  pathToFileURL(path.join(here, "..", "src", "lib", "db-queries.ts")).href
).catch(async () => {
  // Node cannot import .ts directly; transpile on the fly with esbuild-free
  // approach by reading the source and stripping the type-only syntax.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(
    path.join(here, "..", "src", "lib", "db-queries.ts"),
    "utf8",
  )
    .replace(/export type[\s\S]*?;\n/g, "")
    .replace(/export interface[\s\S]*?\}\n/g, "")
    .replace(/:\s*Record<string, unknown>\[\]/g, "")
    .replace(/:\s*string/g, "")
    .replace(/:\s*unknown\[\]/g, "")
    .replace(/\(sql,\s*params\)/g, "(sql, params)");
  const dataUrl = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return await import(dataUrl);
});

const { PGlite } = await import("@electric-sql/pglite");
const pg = await PGlite.create();

let passed = 0;
function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ""}`);
    process.exitCode = 1;
  }
}

console.log("Schema");
await pg.exec(queriesModule.SCHEMA_SQL);
const tables = await pg.query(
  "SELECT table_name FROM information_schema.tables WHERE table_name = 'records'",
);
check("records table created", tables.rows.length === 1);
const indexes = await pg.query(
  "SELECT indexname FROM pg_indexes WHERE tablename = 'records'",
);
check(
  "indexes created",
  indexes.rows.length >= 3,
  `found ${indexes.rows.length}`,
);

const sql = queriesModule.toExecutor(pg);

const cols = (collection, record) =>
  queriesModule.insertParams(queriesModule.toColumns(collection, record));
const upd = (collection, record, targetId) =>
  queriesModule.updateParams(
    queriesModule.toColumns(collection, record),
    targetId,
  );

console.log("\nINSERT + JSONB round-trip");
const record = {
  id: "EXH-TEST-1",
  reference: "INDTEC/2026/0001",
  createdAt: "2026-10-09T10:00:00.000Z",
  stage: "new",
  companyName: "Acme Industries",
  contactPerson: "Jane Doe",
  email: "enc:v1:abcdef",
};
await sql.query(
  queriesModule.INSERT,
  cols("exhibitorEnquiries", record),
);
const fetched = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_BY_ID, ["exhibitorEnquiries", "EXH-TEST-1"]),
);
check("record round-trips", fetched.length === 1, JSON.stringify(fetched));
check("scalar field intact", fetched[0]?.companyName === "Acme Industries");
check("ISO timestamp preserved verbatim", fetched[0]?.createdAt === record.createdAt);
check(
  "encrypted value not mangled",
  fetched[0]?.email === "enc:v1:abcdef",
  String(fetched[0]?.email),
);

console.log("\nIdempotent re-insert (upsert path)");
await sql.query(
  queriesModule.INSERT,
  cols("exhibitorEnquiries", { ...record, stage: "won" }),
);
const afterUpsert = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_BY_ID, ["exhibitorEnquiries", "EXH-TEST-1"]),
);
check("still exactly one row", afterUpsert.length === 1, `rows=${afterUpsert.length}`);
check("stage updated to won", afterUpsert[0]?.stage === "won");

console.log("\nOrdering + collection isolation");
for (const [id, createdAt] of [
  ["EXH-TEST-2", "2026-10-08T09:00:00.000Z"],
  ["EXH-TEST-3", "2026-10-10T09:00:00.000Z"],
]) {
  await sql.query(
    queriesModule.INSERT,
    cols("exhibitorEnquiries", {
      ...record,
      id,
      createdAt,
    }),
  );
}
await sql.query(
  queriesModule.INSERT,
  cols("visitorRegistrations", { ...record, id: "VIS-TEST-1" }),
);
const exhibitors = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_ALL, ["exhibitorEnquiries"]),
);
check("only own collection returned", exhibitors.length === 3, `got ${exhibitors.length}`);
check(
  "ordered newest first",
  exhibitors[0]?.id === "EXH-TEST-3" &&
    exhibitors[1]?.id === "EXH-TEST-1" &&
    exhibitors[2]?.id === "EXH-TEST-2",
  exhibitors.map((r) => r.id).join(","),
);

console.log("\nUPDATE");
const updateRows = await sql.query(
  queriesModule.UPDATE_BY_ID,
  upd(
    "exhibitorEnquiries",
    {
      ...record,
      id: "EXH-TEST-2",
      stage: "proposal",
      updatedAt: "2026-10-11T10:00:00.000Z",
    },
    "EXH-TEST-2",
  ),
);
check("update returns a row", updateRows.length === 1);
const updated = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_BY_ID, ["exhibitorEnquiries", "EXH-TEST-2"]),
);
check("stage persisted", updated[0]?.stage === "proposal", updated[0]?.stage);
check("updatedAt persisted", updated[0]?.updatedAt === "2026-10-11T10:00:00.000Z");

console.log("\nEvent override lookup by slug");
await sql.query(
  queriesModule.INSERT,
  cols("events", {
    ...record,
    id: "evt-abc",
    slug: "bengaluru",
    name: "INDTEC EXPO Bengaluru",
  }),
);
const bySlug = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_BY_SLUG, ["events", "bengaluru"]),
);
check("found by slug", bySlug.length === 1 && bySlug[0]?.id === "evt-abc");
const noSlug = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_BY_SLUG, ["events", "does-not-exist"]),
);
check("missing slug returns nothing", noSlug.length === 0);

console.log("\nDELETE");
const del = await sql.query(queriesModule.DELETE_BY_ID, [
  "exhibitorEnquiries",
  "EXH-TEST-3",
]);
check("delete reports success", del.length === 1);
const gone = queriesModule.rowsToRecords(
  await sql.query(queriesModule.SELECT_BY_ID, ["exhibitorEnquiries", "EXH-TEST-3"]),
);
check("row actually gone", gone.length === 0);
const delAgain = await sql.query(queriesModule.DELETE_BY_ID, [
  "exhibitorEnquiries",
  "EXH-TEST-3",
]);
check("delete of missing row reports failure", delAgain.length === 0);

console.log(
  `\n${process.exitCode ? "FAILED" : "ALL PASS"} — ${passed} checks passed`,
);
await pg.close();