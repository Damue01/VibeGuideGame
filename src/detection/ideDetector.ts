// ============================================================
// VibeGuide - IDE 检测模块
// 支持 Cursor 和 Trae 在 Windows/macOS 上的检测
// ============================================================
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { IDEType, IDEStatus } from '../shared/types';

interface IDEConfig {
  type: IDEType;
  name: string;
  /** Windows 可执行文件路径候选 */
  winPaths: string[];
  /** macOS .app 路径候选 */
  macPaths: string[];
  /** CLI 命令名 */
  cliCommand: string;
  /** URI scheme */
  uriScheme: string;
  /** 下载链接 */
  downloadUrl: string;
}

const IDE_CONFIGS: IDEConfig[] = [
  {
    type: 'cursor',
    name: 'Cursor',
    winPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'cursor', 'Cursor.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'cursor', 'Cursor.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Cursor', 'Cursor.exe'),
    ],
    macPaths: [
      '/Applications/Cursor.app',
      path.join(process.env.HOME || '', 'Applications', 'Cursor.app'),
    ],
    cliCommand: 'cursor',
    uriScheme: 'cursor://',
    downloadUrl: 'https://cursor.sh',
  },
  {
    type: 'trae',
    name: 'Trae',
    winPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Trae', 'Trae.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Trae', 'Trae.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Trae', 'Trae.exe'),
      // Trae CN version
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Trae CN', 'Trae CN.exe'),
    ],
    macPaths: [
      '/Applications/Trae.app',
      '/Applications/Trae CN.app',
      path.join(process.env.HOME || '', 'Applications', 'Trae.app'),
    ],
    cliCommand: 'trae',
    uriScheme: 'trae://',
    downloadUrl: 'https://www.trae.ai',
  },
  {
    type: 'vscode',
    name: 'VS Code',
    winPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
    ],
    macPaths: [
      '/Applications/Visual Studio Code.app',
      path.join(process.env.HOME || '', 'Applications', 'Visual Studio Code.app'),
    ],
    cliCommand: 'code',
    uriScheme: 'vscode://',
    downloadUrl: 'https://code.visualstudio.com',
  },
];

export class IDEDetector {
  private configs: Map<IDEType, IDEConfig>;
  private detectCache: Map<IDEType, { status: IDEStatus; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 秒缓存

  constructor() {
    this.configs = new Map();
    for (const config of IDE_CONFIGS) {
      this.configs.set(config.type, config);
    }
  }

  /** 检测单个 IDE */
  async detect(ideType: IDEType): Promise<IDEStatus> {
    // 返回缓存结果，避免重复触发 5 秒 CLI 子进程
    const cached = this.detectCache.get(ideType);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.status;
    }

    const config = this.configs.get(ideType);
    if (!config) {
      return { type: ideType, installed: false };
    }

    let result: IDEStatus;

    // 方法 1：检测本地文件路径
    const foundPath = this.checkPaths(config);
    if (foundPath) {
      const version = await this.getVersion(config);
      result = {
        type: ideType,
        installed: true,
        path: foundPath,
        version: version || undefined,
      };
    } else {
      // 方法 2：通过 CLI 命令检测
      const cliResult = await this.checkCLI(config);
      if (cliResult) {
        result = {
          type: ideType,
          installed: true,
          version: cliResult,
        };
      } else {
        result = { type: ideType, installed: false };
      }
    }

    // 缓存检测结果
    this.detectCache.set(ideType, { status: result, timestamp: Date.now() });
    return result;
  }

  /** 检测所有支持的 IDE */
  async detectAll(): Promise<IDEStatus[]> {
    const results = await Promise.all(
      Array.from(this.configs.keys()).map(type => this.detect(type))
    );
    return results;
  }

  /** 打开 IDE，可选打开指定项目 */
  async openIDE(ideType: IDEType, projectPath?: string): Promise<boolean> {
    const config = this.configs.get(ideType);
    if (!config) return false;

    const status = await this.detect(ideType);
    if (!status.installed) return false;

    return new Promise((resolve) => {
      const args = projectPath ? `"${projectPath}"` : '';
      
      if (status.path) {
        // 直接用可执行文件路径打开
        exec(`"${status.path}" ${args}`, { timeout: 10000 }, (error) => {
          resolve(!error);
        });
      } else {
        // 用 CLI 命令打开
        exec(`${config.cliCommand} ${args}`, { timeout: 10000 }, (error) => {
          resolve(!error);
        });
      }
    });
  }

  /** 获取下载链接 */
  getDownloadUrl(ideType: IDEType): string {
    return this.configs.get(ideType)?.downloadUrl || '';
  }

  // --- 内部方法 ---

  private checkPaths(config: IDEConfig): string | null {
    const paths = process.platform === 'darwin' ? config.macPaths : config.winPaths;

    for (const p of paths) {
      try {
        if (fs.existsSync(p)) {
          return p;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private async checkCLI(config: IDEConfig): Promise<string | null> {
    return new Promise((resolve) => {
      exec(`${config.cliCommand} --version`, { timeout: 5000 }, (error, stdout) => {
        if (error) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  private async getVersion(config: IDEConfig): Promise<string | null> {
    return this.checkCLI(config);
  }
}
