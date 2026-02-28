// ============================================================
// VibeGuide - 文件监控模块
// 使用 chokidar 监控项目目录变化来验证任务完成
// ============================================================
import * as chokidar from 'chokidar';

type FileChangeCallback = (eventType: string, filePath: string) => void;

export class FileWatcher {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();

  /** 监控指定目录 */
  watch(dirPath: string, callback: FileChangeCallback): void {
    // 避免重复监控
    if (this.watchers.has(dirPath)) {
      this.unwatch(dirPath);
    }

    const watcher = chokidar.watch(dirPath, {
      ignoreInitial: true,
      persistent: true,
      depth: 3, // 只监控3层深度
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.next/**',
      ],
    });

    watcher
      .on('add', (path) => callback('add', path))
      .on('change', (path) => callback('change', path))
      .on('unlink', (path) => callback('unlink', path));

    this.watchers.set(dirPath, watcher);
  }

  /** 停止监控 */
  unwatch(dirPath: string): void {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(dirPath);
    }
  }

  /** 停止所有监控 */
  unwatchAll(): void {
    for (const [, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
  }
}
