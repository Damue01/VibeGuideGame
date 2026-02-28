// ============================================================
// VibeGuide - Electron 主进程入口
// ============================================================
import { app, BrowserWindow, ipcMain, shell, dialog, session } from 'electron';
import * as path from 'path';
import { IDEDetector } from '../detection/ideDetector';
import { FileWatcher } from '../detection/fileWatcher';
import { PortChecker } from '../detection/portChecker';
import { IPC_CHANNELS, IDEType, IDEStatus } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
const ideDetector = new IDEDetector();
const fileWatcher = new FileWatcher();
const portChecker = new PortChecker();

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'VibeGuide',
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '../../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // 像素风不需要标题栏
    frame: true,
    resizable: true,
    show: false,
  });

  // 窗口准备好后再显示，避免白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    fileWatcher.unwatchAll();
  });
}

// ============================================================
// IPC Handlers
// ============================================================

function setupIPC() {
  // --- IDE 检测 ---
  ipcMain.handle(IPC_CHANNELS.DETECT_IDE, async (_event, ideType: IDEType): Promise<IDEStatus> => {
    return ideDetector.detect(ideType);
  });

  ipcMain.handle(IPC_CHANNELS.DETECT_ALL_IDES, async (): Promise<IDEStatus[]> => {
    return ideDetector.detectAll();
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_IDE, async (_event, ideType: IDEType, projectPath?: string) => {
    return ideDetector.openIDE(ideType, projectPath);
  });

  // --- 文件系统 ---
  ipcMain.handle(IPC_CHANNELS.WATCH_DIR, async (_event, dirPath: string) => {
    fileWatcher.watch(dirPath, (eventType, filePath) => {
      mainWindow?.webContents.send(IPC_CHANNELS.FILE_CHANGED, { eventType, filePath });
    });
  });

  ipcMain.handle(IPC_CHANNELS.UNWATCH_DIR, async (_event, dirPath: string) => {
    fileWatcher.unwatch(dirPath);
  });

  ipcMain.handle(IPC_CHANNELS.CHECK_FILE, async (_event, filePath: string): Promise<boolean> => {
    const fs = require('fs');
    return fs.existsSync(filePath);
  });

  ipcMain.handle(
    IPC_CHANNELS.CHECK_FILE_CONTENT,
    async (_event, filePath: string, searchContent: string): Promise<boolean> => {
      const fs = require('fs');
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes(searchContent);
      } catch {
        return false;
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.CREATE_PROJECT_DIR, async (_event, dirPath: string) => {
    const fs = require('fs');
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  });

  // --- 命令检测 ---
  ipcMain.handle(IPC_CHANNELS.CHECK_COMMAND, async (_event, cmd: string): Promise<boolean> => {
    const { execSync } = require('child_process');
    try {
      execSync(process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });

  // --- 端口检测 ---
  ipcMain.handle(IPC_CHANNELS.CHECK_PORT, async (_event, port: number): Promise<boolean> => {
    return portChecker.isPortOpen(port);
  });

  // --- 系统 ---
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (_event, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle(IPC_CHANNELS.GET_APP_PATH, async () => {
    return app.getPath('userData');
  });

  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: '选择你的项目文件夹',
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // --- 存档 ---
  ipcMain.handle(IPC_CHANNELS.SAVE_GAME, async (_event, saveData: string) => {
    const fs = require('fs');
    const savePath = path.join(app.getPath('userData'), 'save.json');
    fs.writeFileSync(savePath, saveData, 'utf-8');
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.LOAD_GAME, async () => {
    const fs = require('fs');
    const savePath = path.join(app.getPath('userData'), 'save.json');
    try {
      return fs.readFileSync(savePath, 'utf-8');
    } catch {
      return null;
    }
  });
}

// ============================================================
// App Lifecycle
// ============================================================

app.whenReady().then(() => {
  // === Content Security Policy ===
  // 开发模式允许 unsafe-eval（Vite HMR 需要）和 localhost 连接
  // 生产模式最小权限策略
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval'`
    : `'self' 'unsafe-inline'`;
  const connectSrc = isDev
    ? `'self' ws://localhost:* http://localhost:5173`
    : `'self'`;
  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob:`,
    `connect-src ${connectSrc}`,
    `media-src 'none'`,
    `object-src 'none'`,
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
