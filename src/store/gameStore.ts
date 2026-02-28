// ============================================================
// VibeGuide - Zustand 游戏状态管理
// 管理玩家数据、关卡进度、界面状态
// ============================================================
import { create } from 'zustand';
import {
  PlayerClass,
  PlayerSave,
  PlayerData,
  LevelId,
  LevelProgress,
  LevelStatus,
  GameSettings,
  IDEType,
  IDEStatus,
  ItemReward,
  SkillReward,
  Reward,
} from '../shared/types';

// ============================================================
// 界面状态
// ============================================================
export type GameScreen =
  | 'title'          // 标题画面
  | 'intro'          // 开场CG
  | 'class-select'   // 职业选择
  | 'world-map'      // 大地图
  | 'level'          // 关卡内
  | 'dialog'         // NPC对话
  | 'inventory'      // 背包/状态
  | 'settings'       // 设置
  | 'victory';       // 通关结算

/** 通知负载：支持纯文本或带可点击链接的通知 */
export interface NotificationPayload {
  msg: string;
  url?: string;
}

interface GameUIState {
  currentScreen: GameScreen;
  currentLevel: LevelId | null;
  dialogQueue: string[];
  dialogSpeaker: string;
  isTransitioning: boolean;
  notification: NotificationPayload | null;
}

// ============================================================
// 完整 Store 类型
// ============================================================
interface GameStore {
  // --- 界面状态 ---
  ui: GameUIState;
  setScreen: (screen: GameScreen) => void;
  enterLevel: (level: LevelId) => void;
  showDialog: (speaker: string, lines: string[]) => void;
  advanceDialog: () => string | null;
  showNotification: (msg: string, options?: { url?: string }) => void;
  clearNotification: () => void;

  // --- 玩家数据 ---
  player: PlayerData;
  setPlayerName: (name: string) => void;
  selectClass: (playerClass: PlayerClass) => void;
  selectIDE: (ide: IDEType) => void;
  addXP: (amount: number) => void;
  addItem: (item: ItemReward) => void;
  addSkill: (skill: SkillReward) => void;
  addBadge: (badge: string) => void;
  applyReward: (reward: Reward) => void;

  // --- 关卡进度 ---
  levels: Record<LevelId, LevelProgress>;
  setLevelStatus: (level: LevelId, status: LevelStatus) => void;
  completeStep: (level: LevelId, stepId: string) => void;
  setCurrentStep: (level: LevelId, step: number) => void;
  resetLevel: (level: LevelId) => void;

  // --- IDE 状态 ---
  ideStatuses: IDEStatus[];
  setIDEStatuses: (statuses: IDEStatus[]) => void;

  // --- 设置 ---
  settings: GameSettings;
  updateSettings: (patch: Partial<GameSettings>) => void;

  // --- 存档 ---
  toSaveData: () => PlayerSave;
  loadSaveData: (save: PlayerSave) => void;
  isLoaded: boolean;
  setLoaded: (v: boolean) => void;

  // --- 重置 ---
  resetGame: () => void;
}

// ============================================================
// XP 升级公式
// ============================================================
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ============================================================
// 默认值
// ============================================================
const defaultPlayer: PlayerData = {
  name: '',
  class: 'developer',
  level: 1,
  xp: 0,
  xpToNext: xpForLevel(1),
  items: [],
  skills: [],
  badges: [],
  titles: [],
  currentTitle: undefined,
  selectedIDE: 'cursor',
};

const defaultLevels: Record<LevelId, LevelProgress> = {
  'prologue': { status: 'available', currentStep: 0, completedSteps: [] },
  'chapter1-forge': { status: 'locked', currentStep: 0, completedSteps: [] },
  'chapter2-temple': { status: 'locked', currentStep: 0, completedSteps: [] },
  'chapter3-create': { status: 'locked', currentStep: 0, completedSteps: [] },
  'chapter4-deploy': { status: 'locked', currentStep: 0, completedSteps: [] },
};

const defaultSettings: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  language: 'zh-CN',
};

// ============================================================
// Store 实现
// ============================================================
export const useGameStore = create<GameStore>((set, get) => ({
  // --- UI ---
  ui: {
    currentScreen: 'title',
    currentLevel: null,
    dialogQueue: [],
    dialogSpeaker: '',
    isTransitioning: false,
    notification: null,
  },

  setScreen: (screen) =>
    set((s) => ({ ui: { ...s.ui, currentScreen: screen, isTransitioning: false } })),

  enterLevel: (level) =>
    set((s) => ({
      ui: { ...s.ui, currentScreen: 'level', currentLevel: level },
    })),

  showDialog: (speaker, lines) =>
    set((s) => ({
      ui: { ...s.ui, dialogQueue: [...lines], dialogSpeaker: speaker, currentScreen: 'dialog' },
    })),

  advanceDialog: () => {
    const state = get();
    const queue = [...state.ui.dialogQueue];
    const next = queue.shift();
    if (queue.length === 0) {
      // 对话结束, 回到之前的画面
      set((s) => ({
        ui: { ...s.ui, dialogQueue: [], dialogSpeaker: '', currentScreen: s.ui.currentLevel ? 'level' : 'world-map' },
      }));
    } else {
      set((s) => ({ ui: { ...s.ui, dialogQueue: queue } }));
    }
    return next || null;
  },

  showNotification: (msg, options) =>
    set((s) => ({ ui: { ...s.ui, notification: { msg, url: options?.url } } })),

  clearNotification: () =>
    set((s) => ({ ui: { ...s.ui, notification: null } })),

  // --- Player ---
  player: { ...defaultPlayer },

  setPlayerName: (name) =>
    set((s) => ({ player: { ...s.player, name } })),

  selectClass: (playerClass) =>
    set((s) => ({ player: { ...s.player, class: playerClass } })),

  selectIDE: (ide) =>
    set((s) => ({ player: { ...s.player, selectedIDE: ide } })),

  addXP: (amount) =>
    set((s) => {
      let { xp, level, xpToNext } = s.player;
      xp += amount;
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level += 1;
        xpToNext = xpForLevel(level);
      }
      return { player: { ...s.player, xp, level, xpToNext } };
    }),

  addItem: (item) =>
    set((s) => ({ player: { ...s.player, items: [...s.player.items, item] } })),

  addSkill: (skill) =>
    set((s) => ({ player: { ...s.player, skills: [...s.player.skills, skill] } })),

  addBadge: (badge) =>
    set((s) => ({
      player: { ...s.player, badges: [...s.player.badges, badge] },
    })),

  applyReward: (reward: Reward) => {
    set((s) => {
      let { xp, level, xpToNext } = s.player;
      const items = [...s.player.items];
      const skills = [...s.player.skills];
      const badges = [...s.player.badges];
      const titles = [...s.player.titles];

      // XP + 升级
      if (reward.xp) {
        xp += reward.xp;
        while (xp >= xpToNext) {
          xp -= xpToNext;
          level += 1;
          xpToNext = xpForLevel(level);
        }
      }
      if (reward.item) items.push(reward.item);
      if (reward.skill) skills.push(reward.skill);
      if (reward.badge) badges.push(reward.badge);
      if (reward.title) titles.push(reward.title);

      return {
        player: { ...s.player, xp, level, xpToNext, items, skills, badges, titles },
      };
    });
  },

  // --- Levels ---
  levels: { ...defaultLevels },

  setLevelStatus: (level, status) =>
    set((s) => ({
      levels: {
        ...s.levels,
        [level]: { ...s.levels[level], status },
      },
    })),

  completeStep: (level, stepId) =>
    set((s) => {
      const lp = s.levels[level];
      if (lp.completedSteps.includes(stepId)) return s;
      return {
        levels: {
          ...s.levels,
          [level]: {
            ...lp,
            completedSteps: [...lp.completedSteps, stepId],
            currentStep: lp.currentStep + 1,
          },
        },
      };
    }),

  setCurrentStep: (level, step) =>
    set((s) => ({
      levels: {
        ...s.levels,
        [level]: { ...s.levels[level], currentStep: step },
      },
    })),

  resetLevel: (level) =>
    set((s) => {
      const lp = s.levels[level];
      return {
        levels: {
          ...s.levels,
          [level]: {
            ...lp,
            status: 'in-progress',
            currentStep: 0,
            completedSteps: [],
            replayCount: (lp.replayCount || 0) + 1,
          },
        },
      };
    }),

  // --- IDE ---
  ideStatuses: [],
  setIDEStatuses: (statuses) => set({ ideStatuses: statuses }),

  // --- Settings ---
  settings: { ...defaultSettings },
  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  // --- Save/Load ---
  isLoaded: false,
  setLoaded: (v) => set({ isLoaded: v }),

  toSaveData: () => {
    const s = get();
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      player: s.player,
      levels: s.levels,
      settings: s.settings,
    };
  },

  resetGame: () => {
    set({
      player: { ...defaultPlayer },
      levels: JSON.parse(JSON.stringify(defaultLevels)),
      settings: { ...defaultSettings },
      ui: {
        currentScreen: 'intro',
        currentLevel: null,
        dialogQueue: [],
        dialogSpeaker: '',
        isTransitioning: false,
        notification: null,
      },
    });
    // 清除本地存档
    if (window.electronAPI) {
      window.electronAPI.saveGame(JSON.stringify({
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        player: { ...defaultPlayer },
        levels: { ...defaultLevels },
        settings: { ...defaultSettings },
      }));
    }
  },

  loadSaveData: (save) => {
    // 兼容旧存档：确保所有关卡 ID 都存在
    const mergedLevels = { ...defaultLevels };
    for (const key of Object.keys(save.levels) as LevelId[]) {
      if (key in mergedLevels) {
        mergedLevels[key] = save.levels[key];
      }
    }
    // 处理旧存档中 chapter4-branch → chapter4-deploy 的迁移
    if ('chapter4-branch' in (save.levels as any)) {
      mergedLevels['chapter4-deploy'] = (save.levels as any)['chapter4-branch'];
    }
    set({
      player: save.player,
      levels: mergedLevels,
      settings: save.settings,
      isLoaded: true,
    });
  },
}));
