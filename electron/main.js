// Windows desktop shell for Rack & Recall. The whole app is web/index.html;
// this file only opens it in a window and keeps a single copy running so two
// windows never write over each other's saved progress.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// Updates without reinstalling: if a newer rack-and-recall.html sits next to the
// app (portable copy) or in the app's data folder (installed copy), use it instead
// of the built-in page. All file:// pages share one storage area, so progress carries over.
const UPDATE_NAME = "rack-and-recall.html";
function pagePath() {
  const builtIn = path.join(__dirname, "..", "web", "index.html");
  const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch (e) { return -1; } };
  let best = builtIn, bestTime = mtime(builtIn);
  const folders = [path.dirname(process.execPath), app.getPath("userData")];
  if (process.env.PORTABLE_EXECUTABLE_DIR) folders.unshift(process.env.PORTABLE_EXECUTABLE_DIR);
  for (const dir of folders) {
    const p = path.join(dir, UPDATE_NAME), t = mtime(p);
    if (t > bestTime) { best = p; bestTime = t; }
  }
  return best;
}

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
    win.loadFile(pagePath());
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
