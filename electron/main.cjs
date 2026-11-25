const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 960,
    minHeight: 680,
    show: false,
    backgroundColor: "#f2f0e8",
    title: "KHELO — Chess Training Club",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  mainWindow.on("closed", () => { mainWindow = null; });
}

ipcMain.handle("khelo:app-version", () => app.getVersion());

ipcMain.handle("khelo:choose-engine", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose a UCI chess engine",
    properties: ["openFile"],
    filters: process.platform === "win32"
      ? [{ name: "Chess engine executable", extensions: ["exe"] }, { name: "All files", extensions: ["*"] }]
      : [{ name: "Executable files", extensions: ["*"] }, { name: "All files", extensions: ["*"] }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

function runUciEngine(enginePath, fen, depth) {
  return new Promise((resolve, reject) => {
    if (!enginePath || !fs.existsSync(enginePath)) {
      reject(new Error("The selected chess engine file could not be found."));
      return;
    }

    let child;
    try {
      child = spawn(enginePath, [], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      reject(new Error("Could not start the selected engine: " + error.message));
      return;
    }

    let phase = "uci";
    let finished = false;
    let buffer = "";
    const safeDepth = Math.max(1, Math.min(18, Number(depth) || 8));

    const finish = (error, bestmove) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { child.stdin.write("quit\n"); } catch (_) {}
      try { child.kill(); } catch (_) {}
      if (error) reject(error);
      else resolve(bestmove);
    };

    const timer = setTimeout(() => finish(new Error("The chess engine took too long to respond.")), 18000);

    child.on("error", (error) => finish(new Error("Engine launch failed: " + error.message)));
    child.on("close", (code) => {
      if (!finished) finish(new Error("The chess engine closed before returning a move (code " + code + ")."));
    });

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (phase === "uci" && line === "uciok") {
          phase = "ready";
          child.stdin.write("isready\n");
        } else if (phase === "ready" && line === "readyok") {
          phase = "search";
          child.stdin.write("position fen " + fen + "\n");
          child.stdin.write("go depth " + safeDepth + "\n");
        } else if (phase === "search" && line.startsWith("bestmove ")) {
          const bestmove = line.split(/\s+/)[1];
          if (!bestmove || bestmove === "(none)" || bestmove === "0000") {
            finish(new Error("The selected engine did not return a legal move."));
          } else {
            finish(null, bestmove);
          }
        }
      }
    });
    child.stderr.on("data", () => {});
    child.stdin.write("uci\n");
  });
}

ipcMain.handle("khelo:engine-bestmove", async (_event, payload) => {
  if (!payload || typeof payload.fen !== "string" || typeof payload.enginePath !== "string") {
    throw new Error("Invalid chess engine request.");
  }
  return runUciEngine(payload.enginePath, payload.fen, payload.depth);
});

app.whenReady().then(() => {
  app.setAppUserModelId("com.khelo.chess");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
