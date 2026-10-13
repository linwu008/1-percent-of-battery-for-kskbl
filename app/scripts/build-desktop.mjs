import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";
import { createWriteStream } from "node:fs";
import {
  packagingDigest,
  prepareRuntime,
  recordArtifact,
  verifyArtifact,
} from "./release-integrity.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version =
  process.argv[2] ??
  JSON.parse(await readFile(resolve(root, "package.json"), "utf8")).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid version");
const name = `1013_OnePercentBattery-Windows-x64_v${version}`;
const releaseDir = resolve(root, "release");
const provenance = await verifyArtifact(
  releaseDir,
  `1013_OnePercentBattery_v${version}.html`,
  { version, packagingDigest: await packagingDigest(root) },
);
const runtime = resolve(root, "node_modules/electron/dist");
const runtimeVersion = (
  await readFile(resolve(runtime, "version"), "utf8")
).trim();
const expectedVersion = JSON.parse(
  await readFile(resolve(root, "node_modules/electron/package.json"), "utf8"),
).version;
if (runtimeVersion !== expectedVersion)
  throw new Error("Electron runtime version differs from installed dependency");
const dest = await prepareRuntime(
  runtime,
  resolve(root, ".cache/packages"),
  name,
);
const resources = resolve(dest, "resources/app");
await mkdir(resources, { recursive: true });
await cp(resolve(root, "desktop/main.cjs"), resolve(resources, "main.cjs"));
await cp(
  resolve(root, `release/1013_OnePercentBattery_v${version}.html`),
  resolve(resources, "game.html"),
);
await writeFile(
  resolve(resources, "package.json"),
  JSON.stringify({
    name: "one-percent-battery",
    productName: "1% Battery",
    version,
    main: "main.cjs",
  }),
);
await cp(resolve(root, "public/fonts"), resolve(dest, "font-licenses"), {
  recursive: true,
});
await writeFile(
  resolve(dest, "启动说明.txt"),
  `1% Battery v${version}\r\n解压整个文件夹后，双击 OnePercentBattery.exe。无需网络或安装开发工具。\r\n请保留同目录所有文件，不能只移动EXE。存档在userdata目录。\r\n本软件未购买代码签名证书。\r\n`,
);
const zipPath = resolve(releaseDir, name + ".zip");
const output = createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });
const completed = new Promise((res, rej) => {
  output.on("close", res);
  output.on("error", rej);
  archive.on("error", rej);
  archive.on("warning", rej);
});
archive.pipe(output);
archive.glob(
  "**/*",
  { cwd: dest, ignore: ["userdata/**", "resources/default_app.asar"] },
  { prefix: name },
);
await archive.finalize();
await completed;
const manifest = await recordArtifact(releaseDir, name + ".zip", {
  version,
  format: "windows-x64",
  sourceCommit: provenance.sourceCommit,
  sourceDigest: provenance.sourceDigest,
  packagingDigest: provenance.packagingDigest,
  electron: runtimeVersion,
});
console.log(`Desktop: ${name}.zip (${manifest.size} bytes)`);
