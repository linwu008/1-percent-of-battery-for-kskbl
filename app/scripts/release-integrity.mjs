import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import { resolve, extname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

export const BASELINE = "a5494ca57d73b00fe7029cccc8c62deda2f909b4";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const normalize = (name, bytes) =>
  /\.(?:tsx?|css|json|md|txt|mjs|cjs)$/.test(extname(name))
    ? Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"))
    : bytes;
async function walk(root, path) {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? walk(root, `${path}/${e.name}`) : `${path}/${e.name}`,
      ),
    )
  ).flat();
}
async function digestFiles(root, files) {
  const hash = createHash("sha256");
  for (const file of files.sort())
    hash
      .update(file)
      .update("\0")
      .update(normalize(file, await readFile(resolve(root, file))))
      .update("\0");
  return hash.digest("hex");
}
export async function sourceDigest(root) {
  return digestFiles(root, [
    "package.json",
    ...(await walk(root, "src")),
    ...(await walk(root, "public/fonts")),
  ]);
}
export function gitSourceDigest(root, commit) {
  const paths = execFileSync(
    "git",
    [
      "ls-tree",
      "-r",
      "--name-only",
      "-z",
      commit,
      "--",
      "app/src",
      "app/public/fonts",
      "app/package.json",
    ],
    { cwd: resolve(root, ".."), encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .sort();
  const hash = createHash("sha256");
  for (const path of paths) {
    const name = path.slice(4);
    const bytes = execFileSync("git", ["show", `${commit}:${path}`], {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
    });
    hash.update(name).update("\0").update(normalize(name, bytes)).update("\0");
  }
  return hash.digest("hex");
}
export async function packagingDigest(root) {
  return digestFiles(root, [
    "package-lock.json",
    "desktop/main.cjs",
    "scripts/build-offline.mjs",
    "scripts/build-desktop.mjs",
    "scripts/release-integrity.mjs",
  ]);
}
export function headCommit(root) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}
export async function recordArtifact(dir, name, provenance) {
  const bytes = await readFile(resolve(dir, name));
  const manifest = {
    schema: 1,
    ...provenance,
    artifact: name,
    size: bytes.length,
    sha256: sha(bytes),
  };
  await writeFile(
    resolve(dir, `${name}.sha256`),
    `${manifest.sha256}  ${name}\n`,
  );
  await writeFile(
    resolve(dir, `${name}.build.json`),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
export async function verifyArtifact(dir, name, expected) {
  const manifest = JSON.parse(
    await readFile(resolve(dir, `${name}.build.json`), "utf8"),
  );
  for (const [key, value] of Object.entries(expected))
    if (manifest[key] !== value)
      throw new Error(`${name}: ${key} does not match current source`);
  const bytes = await readFile(resolve(dir, name));
  if (
    manifest.schema !== 1 ||
    manifest.artifact !== name ||
    manifest.size !== bytes.length ||
    manifest.sha256 !== sha(bytes)
  )
    throw new Error(`${name}: artifact hash mismatch`);
  const checksum = (
    await readFile(resolve(dir, `${name}.sha256`), "utf8")
  ).trim();
  if (checksum !== `${manifest.sha256}  ${name}`)
    throw new Error(`${name}: checksum file mismatch`);
  return manifest;
}
export async function prepareRuntime(runtime, staging, name) {
  await mkdir(staging, { recursive: true });
  const fresh = await mkdtemp(resolve(staging, "build-"));
  const dest = resolve(fresh, name);
  await cp(runtime, dest, { recursive: true });
  await rename(
    resolve(dest, "electron.exe"),
    resolve(dest, "OnePercentBattery.exe"),
  );
  return dest;
}
