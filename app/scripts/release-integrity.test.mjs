import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  sourceDigest,
  recordArtifact,
  verifyArtifact,
  prepareRuntime,
} from "./release-integrity.mjs";

await mkdir(".cache/integrity-tests", { recursive: true });
const fixture = () => mkdtemp(resolve(".cache/integrity-tests/run-"));
test("source changes and checksum tampering prevent publication", async () => {
  const root = await fixture();
  await mkdir(resolve(root, "src"));
  await mkdir(resolve(root, "public/fonts"), { recursive: true });
  await writeFile(resolve(root, "src/main.ts"), "original");
  await writeFile(resolve(root, "package.json"), "{}");
  await writeFile(resolve(root, "game.html"), "built application");
  const provenance = {
    sourceDigest: await sourceDigest(root),
    packagingDigest: "packaging",
    sourceCommit: "commit",
    version: "1.1.2",
  };
  await recordArtifact(root, "game.html", provenance);
  await verifyArtifact(root, "game.html", provenance);
  await writeFile(resolve(root, "src/main.ts"), "changed");
  await assert.rejects(
    verifyArtifact(root, "game.html", {
      ...provenance,
      sourceDigest: await sourceDigest(root),
    }),
    /sourceDigest/,
  );
  await writeFile(resolve(root, "game.html.sha256"), "incorrect");
  await assert.rejects(
    verifyArtifact(root, "game.html", provenance),
    /checksum/,
  );
});
test("each package gets a fresh complete runtime, preserving older copies", async () => {
  const root = await fixture();
  const runtime = resolve(root, "runtime");
  await mkdir(runtime);
  await writeFile(resolve(runtime, "electron.exe"), "runtime");
  await writeFile(resolve(runtime, "required.dll"), "current");
  const first = await prepareRuntime(runtime, resolve(root, "stages"), "game");
  await writeFile(resolve(first, "required.dll"), "stale");
  const second = await prepareRuntime(runtime, resolve(root, "stages"), "game");
  assert.notEqual(first, second);
  assert.equal(
    await readFile(resolve(second, "required.dll"), "utf8"),
    "current",
  );
  assert.equal(await readFile(resolve(first, "required.dll"), "utf8"), "stale");
});
