// Windows desktop shell for Rack & Recall. The whole app is web/index.html;
// this file only opens it in a window and keeps a single copy running so two
// windows never write over each other's saved progress.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// Updates without reinstalling: a newer rack-and-recall.html placed next to the app
// (portable copy) or in the app's data folder (installed copy) is used instead of the
// built-in page. "Newer" means a higher build number, read from the page's
// <meta name="rr-build"> tag. (File dates aren't reliable for the built-in page.)
// Names like "rack-and-recall (1).html", which browsers create on repeat downloads, count too.
// All file:// pages share one storage area, so progress carries over.
const BUILT_IN = path.join(__dirname, "..", "web", "index.html");
const UPDATE_FILE = /^rack-and-recall.*\.html$/i;

function buildOf(file) {
  try {
    const head = fs.readFileSync(file, "utf8").slice(0, 4096);
    const m = head.match(/<meta name="rr-build" content="(\d+)"/);
    return m ? Number(m[1]) : 0;
  } catch (e) {
    return -1;
  }
}

function updateFolders() {
  const dirs = [process.env.PORTABLE_EXECUTABLE_DIR, path.dirname(process.execPath), app.getPath("userData")];
  return [...new Set(dirs.filter(Boolean))];
}

function pagePath() {
  let best = BUILT_IN, bestBuild = buildOf(BUILT_IN);
  for (const dir of updateFolders()) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch (e) { continue; }
    for (const name of names) {
      if (!UPDATE_FILE.test(name)) continue;
      const file = path.join(dir, name), b = buildOf(file);
      if (b > bestBuild) { best = file; bestBuild = b; }
    }
  }
  return best;
}

// Used by the build check on GitHub: report which page would load, then quit.
const reportArg = process.argv.find((a) => a.startsWith("--report-page="));

if (!reportArg && !app.requestSingleInstanceLock()) {
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
    if (reportArg) {
      const page = pagePath();
      fs.writeFileSync(reportArg.slice("--report-page=".length), `${page}\n${buildOf(page)}\nfolders: ${updateFolders().join(" | ")}\n`);
      app.exit(0);
      return;
    }
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
