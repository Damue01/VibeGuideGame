// ============================================================
// VibeGuide - 全局类型声明
// ============================================================

/** Electron preload 暴露的 API */
interface ElectronAPI {
  // IDE 检测
  detectIDE: (ideType: string) => Promise<import('./shared/types').IDEStatus>;
  detectAllIDEs: () => Promise<import('./shared/types').IDEStatus[]>;
  openIDE: (ideType: string, projectPath?: string) => Promise<boolean>;

  // 文件系统
  watchDir: (dirPath: string) => Promise<void>;
  unwatchDir: (dirPath: string) => Promise<void>;
  onFileChanged: (callback: (data: { eventType: string; filePath: string }) => void) => () => void;
  checkFile: (filePath: string) => Promise<boolean>;
  checkFileContent: (filePath: string, content: string) => Promise<boolean>;
  createProjectDir: (dirPath: string) => Promise<boolean>;

  // 命令检测
  checkCommand: (cmd: string) => Promise<boolean>;

  // 端口检测
  checkPort: (port: number) => Promise<boolean>;

  // 系统
  openExternal: (url: string) => Promise<void>;
  getAppPath: () => Promise<string>;
  selectDirectory: () => Promise<string | null>;

  // 存档
  saveGame: (data: string) => Promise<boolean>;
  loadGame: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
