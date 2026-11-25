const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kheloDesktop", Object.freeze({
  appVersion: () => ipcRenderer.invoke("khelo:app-version"),
  chooseEngine: () => ipcRenderer.invoke("khelo:choose-engine"),
  getEngineMove: (request) => ipcRenderer.invoke("khelo:engine-bestmove", request)
}));
