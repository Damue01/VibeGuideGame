// ============================================================
// VibeGuide - 共享类型定义
// 在主进程和渲染进程之间共享的类型
// ============================================================

/** 玩家职业 */
export type PlayerClass = 'product' | 'developer' | 'artist';

/** 职业详细信息 */
export interface ClassInfo {
  id: PlayerClass;
  name: string;
  title: string;
  description: string;
  skill: string;
  skillDescription: string;
  color: string;
  icon: string; // emoji for now, pixel sprite later
}

/** IDE类型 */
export type IDEType = 'cursor' | 'trae' | 'vscode';

/** IDE安装状态 */
export interface IDEStatus {
  type: IDEType;
  installed: boolean;
  path?: string;
  version?: string;
  running?: boolean;
}

/** 关卡ID */
export type LevelId =
  | 'prologue'          // 序章：起源村
  | 'chapter1-forge'    // 第一章：工具锻造谷
  | 'chapter2-temple'   // 第二章：觉醒神殿
  | 'chapter3-create'   // 第三章：创造平原·初阵（Vite+React 个人网站）
  | 'chapter4-deploy';  // 第四章：传送灯塔（GitHub Pages 部署）

/** 关卡状态 */
export type LevelStatus = 'locked' | 'available' | 'in-progress' | 'completed';

/** 任务步骤状态 */
export interface TaskStep {
  id: string;
  title: string;
  description: string;
  npcDialog?: string[];
  /** 验证类型 */
  validation: TaskValidation;
  /** 步骤完成时的奖励 */
  reward?: Reward;
  completed: boolean;
}

/** 任务验证方式 */
export type TaskValidation =
  | { type: 'auto-detect-ide'; ide: IDEType }           // 自动检测IDE安装
  | { type: 'command-available'; command: string }       // 检测系统命令是否可用
  | { type: 'file-exists'; path: string }                // 检测文件存在
  | { type: 'file-contains'; path: string; content: string } // 检测文件内容
  | { type: 'port-open'; port: number }                  // 检测端口开放
  | { type: 'process-running'; name: string }            // 检测进程运行
  | { type: 'manual-confirm' }                           // 手动确认
  | { type: 'none' };                                    // 无需验证（纯叙事）

/** 奖励 */
export interface Reward {
  xp?: number;
  item?: ItemReward;
  skill?: SkillReward;
  badge?: string;
  title?: string;
}

export interface ItemReward {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

export interface SkillReward {
  id: string;
  name: string;
  level: number;
}

/** 玩家存档数据 */
export interface PlayerSave {
  version: number;
  createdAt: string;
  updatedAt: string;
  player: PlayerData;
  levels: Record<LevelId, LevelProgress>;
  settings: GameSettings;
}

export interface PlayerData {
  name: string;
  class: PlayerClass;
  level: number;
  xp: number;
  xpToNext: number;
  items: ItemReward[];
  skills: SkillReward[];
  badges: string[];
  titles: string[];
  currentTitle?: string;
  selectedIDE: IDEType;
}

export interface LevelProgress {
  status: LevelStatus;
  currentStep: number;
  completedSteps: string[];
  startedAt?: string;
  completedAt?: string;
  replayCount?: number; // 重玩次数
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  language: 'zh-CN' | 'en';
  projectPath?: string; // 用户的Vibe Coding项目目录
}

/** IPC 通信通道定义 */
export const IPC_CHANNELS = {
  // IDE 检测
  DETECT_IDE: 'detect-ide',
  DETECT_ALL_IDES: 'detect-all-ides',
  OPEN_IDE: 'open-ide',

  // 文件系统
  WATCH_DIR: 'watch-dir',
  UNWATCH_DIR: 'unwatch-dir',
  FILE_CHANGED: 'file-changed',
  CHECK_FILE: 'check-file',
  CHECK_FILE_CONTENT: 'check-file-content',
  CREATE_PROJECT_DIR: 'create-project-dir',

  // 端口检测
  CHECK_PORT: 'check-port',

  // 系统
  OPEN_EXTERNAL: 'open-external',
  GET_APP_PATH: 'get-app-path',
  SELECT_DIRECTORY: 'select-directory',

  // 存档
  SAVE_GAME: 'save-game',
  LOAD_GAME: 'load-game',

  // 命令检测
  CHECK_COMMAND: 'check-command',
} as const;

/** 音频轨道 ID */
export type BGMTrack = 'title' | 'worldmap' | 'level' | 'reward' | 'boss' | 'victory';

/** 音效 ID */
export type SFXId = 'click' | 'complete' | 'reward' | 'levelup' | 'error' | 'typing' | 'detect' | 'firework';
