// Publish only this repository's explicitly requested release; credentials never leave GitHub.
import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  BASELINE,
  gitSourceDigest,
  packagingDigest,
  verifyArtifact,
} from "./release-integrity.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = "linwu008/1-percent-of-battery-for-kskbl";
const version = "1.1.2";
const dirty = execFileSync(
  "git",
  [
    "status",
    "--porcelain",
    "--untracked-files=normal",
    "--",
    "src",
    "public",
    "scripts",
    "desktop",
    "package.json",
    "package-lock.json",
  ],
  { cwd: root, encoding: "utf8" },
);
if (dirty.trim())
  throw new Error("Commit application and packaging sources before publishing");
const credential = execFileSync("git", ["credential", "fill"], {
  cwd: root,
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
  stdio: ["pipe", "pipe", "pipe"],
});
const token = credential
  .split(/\r?\n/)
  .find((l) => l.startsWith("password="))
  ?.slice(9);
if (!token) throw new Error("GitHub authentication unavailable");
async function api(path, method = "GET", body) {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok)
    throw new Error(`GitHub ${method} ${path}: ${response.status}`);
  return response.json();
}
const head = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const remote = await api(`/branches/v${version}`);
if (remote.commit.sha !== head)
  throw new Error("Push and verify source branch before publishing");
const files = (await readdir(resolve(root, "release")))
  .filter((f) =>
    /^1013_OnePercentBattery(?:-Windows-x64)?_v1\.(?:0\.0|1\.2)\.(?:html|zip)(?:\.sha256|\.build\.json)?$/.test(
      f,
    ),
  )
  .sort();
if (files.length !== 12)
  throw new Error(
    `Expected 4 packages, 4 checksum files and 4 build manifests; found ${files.length}`,
  );
const packaging = await packagingDigest(root);
for (const artifactVersion of ["1.0.0", "1.1.2"]) {
  const sourceCommit = artifactVersion === "1.0.0" ? BASELINE : head;
  const expected = {
    version: artifactVersion,
    sourceCommit,
    sourceDigest: gitSourceDigest(root, sourceCommit),
    packagingDigest: packaging,
  };
  for (const name of [
    `1013_OnePercentBattery_v${artifactVersion}.html`,
    `1013_OnePercentBattery-Windows-x64_v${artifactVersion}.zip`,
  ]) {
    await verifyArtifact(resolve(root, "release"), name, expected);
    console.log(`Source and checksum verified: ${name}`);
  }
}
const releases = await api("/releases?per_page=100");
let release = releases.find((r) => r.tag_name === `v${version}`);
const body = await readFile(resolve(root, "release/RELEASE_NOTES.md"), "utf8");
if (release && !release.draft)
  throw new Error(
    "Release already published; do not replace existing downloads silently",
  );
if (!release)
  release = await api("/releases", "POST", {
    tag_name: `v${version}`,
    target_commitish: head,
    name: "v1.1.2 · 离线版与变量目录",
    body,
    draft: true,
    prerelease: false,
  });
console.log(`Draft release: ${release.id}`);
for (const name of files) {
  const bytes = await readFile(resolve(root, "release", name));
  const sha = createHash("sha256").update(bytes).digest("hex");
  const existing = (await api(`/releases/${release.id}/assets`)).find(
    (a) => a.name === name,
  );
  if (existing) {
    if (existing.size !== bytes.length || existing.digest !== `sha256:${sha}`)
      throw new Error(`Existing asset differs: ${name}; refusing overwrite`);
    console.log(`Verified existing: ${name}`);
    continue;
  }
  const uploadURL = new URL(release.upload_url.split("{")[0]);
  if (
    uploadURL.hostname !== "uploads.github.com" ||
    uploadURL.protocol !== "https:"
  )
    throw new Error("Unexpected upload host");
  uploadURL.searchParams.set("name", name);
  const response = await fetch(uploadURL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
    signal: AbortSignal.timeout(300000),
  });
  if (!response.ok) throw new Error(`Upload ${name}: ${response.status}`);
  const asset = await response.json();
  if (
    asset.size !== bytes.length ||
    (asset.digest && asset.digest !== `sha256:${sha}`)
  )
    throw new Error(`Asset verification failed: ${name}`);
  console.log(`Uploaded: ${name} ${bytes.length} bytes sha256:${sha}`);
}
release = await api(`/releases/${release.id}`, "PATCH", {
  draft: false,
  body,
  make_latest: "true",
});
console.log(`Published: ${release.html_url}`);
const verified = [];
for (const asset of await api(`/releases/${release.id}/assets`)) {
  if (!files.includes(asset.name)) continue;
  const response = await fetch(asset.browser_download_url, {
    signal: AbortSignal.timeout(300000),
  });
  if (!response.ok)
    throw new Error(`Download ${asset.name}: ${response.status}`);
  const hash = createHash("sha256");
  let size = 0;
  for await (const chunk of response.body) {
    hash.update(chunk);
    size += chunk.length;
  }
  const actual = hash.digest("hex");
  const bytes = await readFile(resolve(root, "release", asset.name));
  if (
    size !== bytes.length ||
    actual !== createHash("sha256").update(bytes).digest("hex")
  )
    throw new Error(`Downloaded asset mismatch: ${asset.name}`);
  verified.push({
    name: asset.name,
    url: asset.browser_download_url,
    size,
    sha256: actual,
    status: response.status,
  });
  console.log(`Download 200 + SHA-256 matched: ${asset.name}`);
}
await writeFile(
  resolve(root, "release/published.json"),
  JSON.stringify(
    { release: release.html_url, source: head, assets: verified },
    null,
    2,
  ),
);
