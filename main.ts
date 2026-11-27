// Deal Beacon — the hand-in program for the Black Friday deal finder bounty.
//
// It takes this repository's app/ (the static deal-finder site) and
// screenshots/ (renders of that site in a browser) and hands them to the
// grader: it copies both into the output directory and writes
// /output/dossier.json, the summary the judge reads, using make.fun's own
// vendored dossier library. Node 22 standard library only; no install, no
// network, no build step.
//
// Run it locally the same way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

// The output directory is created first, before anything is written, and
// only its contents are cleared — the directory itself is never removed,
// so a second run over the same directory starts from a clean slate.
mkdirSync(outputDir, { recursive: true });
for (const entry of readdirSync(outputDir)) {
  rmSync(join(outputDir, entry), { recursive: true, force: true });
}

cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), { recursive: true });
} else {
  throw new Error("screenshots/ is missing: the entry needs 3 or 4 renders of the site");
}

// The caps match the scorer's gate: at most 4 screenshots of 256 KiB each,
// at most 993 files and 16 MiB under app/, and the dossier text capped at
// 160 KiB. The dossier must be byte for byte what buildDossier writes.
const dossierPath = join(outputDir, "dossier.json");
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

// The hand-in is only complete when the dossier landed on disk; a missing
// file here means the copy above went wrong, so fail loudly instead of
// handing in a half-built output directory.
if (!existsSync(dossierPath)) {
  throw new Error("dossier.json was not written");
}

console.log(`Deal Beacon handed in to ${outputDir}`);
