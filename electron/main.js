// Windows desktop shell for Rack & Recall. The whole app is web/index.html;
// this file only opens it in a window and keeps a single copy running so two
// windows never write over each other's saved progress.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win = null;

  function createWindow() {
    win = new BrowserWindow({
      width: 1100,
      height: 920,
      minWidth: 380,
      minHeight: 500,
      title: "Rack & Recall",
      backgroundColor: "#eef2f4",
      autoHideMenuBar: true,
      icon: path.join(__dirname, "..", "build", "icon.png"),
      webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false },
    });
    win.loadFile(path.join(__dirname, "..", "web", "index.html"));
    // Links to other sites open in the normal browser, not inside the app.
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
    win.webContents.on("will-navigate", (e, url) => {
      if (!url.startsWith("file://")) { e.preventDefault(); shell.openExternal(url); }
    });
  }

  app.on("second-instance", () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
