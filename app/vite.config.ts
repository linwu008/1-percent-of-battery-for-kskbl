import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 托管环境会把端口塞进 PORT，并用一个反代域名访问。
// 默认配置会做两件让线上打不开的事：绑 127.0.0.1、拦未知 Host。
// 这里只用到 PORT 一个变量，为它加一个本地声明就够了，不必引 @types/node。
declare const process: { env: Record<string, string | undefined> };
const port = Number(process.env.PORT ?? 5173);

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", port, strictPort: true, allowedHosts: true },
  preview: { host: "0.0.0.0", port, strictPort: true, allowedHosts: true },
  test: { include: ["src/**/*.test.ts"] },
});
