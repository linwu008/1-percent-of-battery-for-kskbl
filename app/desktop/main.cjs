const { app, BrowserWindow, protocol, net, session } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
// 便携目录：移动整份文件夹时记录随之保留；测试也不会污染用户系统目录。
app.setPath(
  "userData",
  path.join(path.dirname(app.getPath("exe")), "userdata"),
);
protocol.registerSchemesAsPrivileged([
  {
    scheme: "onepct",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
app.whenReady().then(() => {
  protocol.handle("onepct", (request) => {
    const url = new URL(request.url);
    if (url.host !== "game" || url.pathname !== "/index.html")
      return new Response("Not found", { status: 404 });
    return net.fetch(
      pathToFileURL(path.join(__dirname, "game.html")).toString(),
    );
  });
  session.defaultSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  session.defaultSession.webRequest.onBeforeRequest((details, callback) =>
    callback({ cancel: /^https?:/i.test(details.url) }),
  );
  const win = new BrowserWindow({
    width: 1440,
    height: 1000,
    minWidth: 390,
    minHeight: 620,
    show: false,
    backgroundColor: "#263c32",
    autoHideMenuBar: true,
    title: `1% Battery · v${app.getVersion()}`,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.loadURL("onepct://game/index.html");
  win.once("ready-to-show", () => win.show());
});
app.on("window-all-closed", () => app.quit());
