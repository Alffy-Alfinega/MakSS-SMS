#!/usr/bin/env node
// Regenerates the Better Auth Prisma schema.
//
// The Better Auth CLI loads `src/lib/auth.ts` in a plain Node context, where
// the `server-only` guard throws. This script strips the guard from the files
// in the import graph, runs the CLI against a temp file, then restores the
// files byte-for-byte and merges the generated models into prisma/schema.prisma.
//
// The project's generator block (which owns the client `output` path) and the
// datasource block (whose URL lives in prisma7.config.ts) are preserved.
//
// Usage: node scripts/generate-auth-schema.mjs

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = resolve(root, "prisma/schema.prisma");

// Files the CLI pulls in transitively from the auth config.
const GUARDED = ["src/lib/auth.ts", "src/lib/db.ts"];

const SERVER_ONLY = 'import "server-only";';
const STRIPPED = "// server-only stripped by generate-auth-schema.mjs";

// Splits prisma/schema.prisma: header (generator + datasource) above this,
// regenerated Better Auth models below it.
const AUTH_MARKER = "// ---------- Better Auth models ----------";

const originals = new Map();
for (const rel of GUARDED) {
  const path = resolve(root, rel);
  const source = readFileSync(path, "utf8");
  if (source.includes(SERVER_ONLY)) {
    originals.set(path, source);
    writeFileSync(path, source.replace(SERVER_ONLY, STRIPPED));
  }
}

function restore() {
  for (const [path, source] of originals) {
    writeFileSync(path, source);
  }
}

const tmp = mkdtempSync(join(tmpdir(), "makindye-auth-"));
const generatedPath = join(tmp, "auth.prisma");

try {
  const cli = process.env.BETTER_AUTH_CLI ?? "@better-auth/cli@1.4.21";
  execFileSync(
    "npx",
    [
      "--yes",
      cli,
      "generate",
      "--config",
      "src/lib/auth.ts",
      "--output",
      generatedPath,
      "-y",
    ],
    { cwd: root, stdio: "inherit" }
  );
} finally {
  restore();
}

const generated = readFileSync(generatedPath, "utf8");

// Pull the model definitions out of the generated schema.
const modelStart = generated.indexOf("model ");
if (modelStart === -1) {
  throw new Error("Better Auth generated no models.");
}
const models = generated.slice(modelStart).trimEnd();

// Merge into the project schema: keep the project's generator + datasource,
// replace the Better Auth model block.
//
// The split point is the AUTH_MARKER comment. Everything before it (project
// header, generator, datasource) is preserved; everything after it is
// regenerated. Running this script twice produces the same file.
const current = readFileSync(SCHEMA, "utf8");
const markerIndex = current.indexOf(AUTH_MARKER);
if (markerIndex === -1) {
  throw new Error(
    `prisma/schema.prisma is missing the "${AUTH_MARKER}" marker.`
  );
}

const header = current.slice(0, markerIndex).trimEnd();
const next = [
  header,
  "",
  AUTH_MARKER,
  "",
  models,
  "",
].join("\n");

writeFileSync(SCHEMA, next);
console.log(`✔ Better Auth models merged into prisma/schema.prisma`);
