import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE,
  headCommit,
  sourceDigest,
  packagingDigest,
  recordArtifact,
} from "./release-integrity.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(process.argv[2] ?? appRoot);
const pkg = JSON.parse(
  await readFile(resolve(appRoot, "package.json"), "utf8"),
);
const version = process.argv[3] ?? pkg.version;
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error("Invalid release version");
const results = await build({
  configFile: false,
  root: source,
  plugins: [react()],
  base: "./",
  publicDir: false,
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    write: false,
    minify: true,
    lib: {
      entry: resolve(source, "src/main.tsx"),
      name: "OnePercentBattery",
      formats: ["iife"],
      fileName: "game",
    },
    cssCodeSplit: false,
  },
});
const outputs = (Array.isArray(results) ? results : [results]).flatMap(
  (r) => r.output,
);
let js = outputs
  .filter((o) => o.type === "chunk")
  .map((o) => o.code)
  .join("\n");
let css = outputs
  .filter((o) => o.type === "asset" && o.fileName.endsWith(".css"))
  .map((o) => String(o.source))
  .join("\n");
for (const match of [
  ...css.matchAll(/url\((['"]?)\/fonts\/([^)'"\s]+)\1\)/g),
]) {
  const bytes = await readFile(resolve(source, "public/fonts", match[2]));
  const mime = match[2].endsWith(".woff2") ? "font/woff2" : "font/ttf";
  css = css.replace(
    match[0],
    `url(data:${mime};base64,${bytes.toString("base64")})`,
  );
}
if (/url\(\s*['"]?(?:https?:|\/fonts\/)/.test(css))
  throw new Error("Offline build contains external asset references");
// 基线源码中的版本文字滞后，仅在交付副本里修正版本标识。
if (version === "1.0.0") js = js.replaceAll("v0.7.0", "v1.0.0");
const notices = {};
for (const file of ["NotoSansSC-OFL.txt", "Rajdhani-OFL.txt", "README.md"])
  notices[`fonts/${file}`] = await readFile(
    resolve(source, "public/fonts", file),
    "utf8",
  );
for (const dependency of ["react", "react-dom", "scheduler"])
  notices[`${dependency}/LICENSE`] = await readFile(
    resolve(appRoot, "node_modules", dependency, "LICENSE"),
    "utf8",
  );
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="offline-version" content="${version}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>1% Battery · v${version} 离线版</title><style>${css.replaceAll("</style", "<\\/style")}</style></head><body><div id="root"></div><script type="application/json" id="third-party-notices">${JSON.stringify(notices).replaceAll("<", "\\u003c")}</script><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`;
const dest = resolve(appRoot, "release");
await mkdir(dest, { recursive: true });
const name = `1013_OnePercentBattery_v${version}.html`;
await writeFile(resolve(dest, name), html, "utf8");
await recordArtifact(dest, name, {
  version,
  format: "html",
  sourceCommit: version === "1.0.0" ? BASELINE : headCommit(appRoot),
  sourceDigest: await sourceDigest(source),
  packagingDigest: await packagingDigest(appRoot),
});
console.log(`Offline: ${name} (${Buffer.byteLength(html)} bytes)`);
