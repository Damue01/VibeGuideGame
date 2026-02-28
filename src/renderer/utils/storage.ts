// ============================================================
// VibeGuide - 跨平台存档工具
// Electron 环境用 IPC 存文件，浏览器环境用 localStorage
// ============================================================

const SAVE_KEY = 'vibeguide-save';

/** 保存游戏存档 */
export async function saveGameData(json: string): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.saveGame(json);
  } else {
    try {
      localStorage.setItem(SAVE_KEY, json);
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }
}

/** 读取游戏存档 */
export async function loadGameData(): Promise<string | null> {
  if (window.electronAPI) {
    return window.electronAPI.loadGame();
  }
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}
