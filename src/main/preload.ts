// ============================================================
// VibeGuide - Electron Preload Script
// 安全地暴露 IPC 给渲染进程
// ============================================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // IDE 检测
  detectIDE: (ideType: string) => ipcRenderer.invoke('detect-ide', ideType),
  detectAllIDEs: () => ipcRenderer.invoke('detect-all-ides'),
  openIDE: (ideType: string, projectPath?: string) =>
    ipcRenderer.invoke('open-ide', ideType, projectPath),

  // 文件系统
  watchDir: (dirPath: string) => ipcRenderer.invoke('watch-dir', dirPath),
  unwatchDir: (dirPath: string) => ipcRenderer.invoke('unwatch-dir', dirPath),
  onFileChanged: (callback: (data: { eventType: string; filePath: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('file-changed', handler);
    return () => ipcRenderer.removeListener('file-changed', handler);
  },
  checkFile: (filePath: string) => ipcRenderer.invoke('check-file', filePath),
  checkFileContent: (filePath: string, content: string) =>
    ipcRenderer.invoke('check-file-content', filePath, content),
  createProjectDir: (dirPath: string) => ipcRenderer.invoke('create-project-dir', dirPath),

  // 命令检测
  checkCommand: (cmd: string) => ipcRenderer.invoke('check-command', cmd),

  // 端口检测
  checkPort: (port: number) => ipcRenderer.invoke('check-port', port),

  // 系统
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // 存档
  saveGame: (data: string) => ipcRenderer.invoke('save-game', data),
  loadGame: () => ipcRenderer.invoke('load-game'),
});
