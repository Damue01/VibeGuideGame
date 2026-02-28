// ============================================================
// VibeGuide - 8-bit 音效定义
// 使用 Web Audio API 程序化生成像素风 SFX
// ============================================================

export interface SFXDef {
  /** 音效由多个短音组成 */
  tones: {
    freq: number;
    duration: number; // seconds
    type: OscillatorType;
    gain: number;
    delay: number; // offset seconds from start
    slide?: number; // frequency slide target
  }[];
}

// ============================================================
// 音效定义
// ============================================================

/** 按钮点击 — 高频短促 */
export const clickSFX: SFXDef = {
  tones: [
    { freq: 800, duration: 0.05, type: 'square', gain: 0.2, delay: 0 },
    { freq: 1200, duration: 0.03, type: 'square', gain: 0.15, delay: 0.02 },
  ],
};

/** 步骤完成 — 上升音阶 */
export const completeSFX: SFXDef = {
  tones: [
    { freq: 523.25, duration: 0.08, type: 'square', gain: 0.18, delay: 0 },
    { freq: 659.25, duration: 0.08, type: 'square', gain: 0.18, delay: 0.08 },
    { freq: 783.99, duration: 0.12, type: 'square', gain: 0.2, delay: 0.16 },
  ],
};

/** 奖励获得 — 琶音上行 */
export const rewardSFX: SFXDef = {
  tones: [
    { freq: 523.25, duration: 0.1, type: 'square', gain: 0.15, delay: 0 },
    { freq: 659.25, duration: 0.1, type: 'square', gain: 0.15, delay: 0.1 },
    { freq: 783.99, duration: 0.1, type: 'square', gain: 0.18, delay: 0.2 },
    { freq: 1046.5, duration: 0.2, type: 'square', gain: 0.22, delay: 0.3 },
    { freq: 1046.5, duration: 0.3, type: 'triangle', gain: 0.15, delay: 0.35 },
  ],
};

/** 升级 — 华丽 fanfare */
export const levelupSFX: SFXDef = {
  tones: [
    { freq: 392, duration: 0.1, type: 'square', gain: 0.2, delay: 0 },
    { freq: 523.25, duration: 0.1, type: 'square', gain: 0.2, delay: 0.1 },
    { freq: 659.25, duration: 0.1, type: 'square', gain: 0.2, delay: 0.2 },
    { freq: 783.99, duration: 0.15, type: 'square', gain: 0.22, delay: 0.3 },
    { freq: 1046.5, duration: 0.3, type: 'square', gain: 0.25, delay: 0.45 },
    { freq: 1046.5, duration: 0.5, type: 'triangle', gain: 0.18, delay: 0.5 },
    { freq: 783.99, duration: 0.15, type: 'triangle', gain: 0.12, delay: 0.6 },
    { freq: 1046.5, duration: 0.4, type: 'triangle', gain: 0.15, delay: 0.75 },
  ],
};

/** 错误 — 低频短促 */
export const errorSFX: SFXDef = {
  tones: [
    { freq: 200, duration: 0.12, type: 'square', gain: 0.2, delay: 0 },
    { freq: 150, duration: 0.15, type: 'square', gain: 0.18, delay: 0.1 },
  ],
};

/** 打字机音效 — 极短 tick */
export const typingSFX: SFXDef = {
  tones: [
    { freq: 1800, duration: 0.015, type: 'square', gain: 0.08, delay: 0 },
  ],
};

/** 检测成功 — 叮 */
export const detectSFX: SFXDef = {
  tones: [
    { freq: 1200, duration: 0.08, type: 'sine', gain: 0.2, delay: 0 },
    { freq: 1600, duration: 0.12, type: 'sine', gain: 0.18, delay: 0.06 },
  ],
};

/** 烟花音效 — 上升 + 炸开 */
export const fireworkSFX: SFXDef = {
  tones: [
    { freq: 300, duration: 0.3, type: 'sawtooth', gain: 0.08, delay: 0, slide: 2000 },
    // 炸开的噪声效果用多个频率模拟
    { freq: 800, duration: 0.05, type: 'square', gain: 0.12, delay: 0.3 },
    { freq: 1200, duration: 0.04, type: 'square', gain: 0.1, delay: 0.32 },
    { freq: 600, duration: 0.06, type: 'square', gain: 0.08, delay: 0.34 },
    { freq: 1600, duration: 0.03, type: 'square', gain: 0.06, delay: 0.36 },
  ],
};

export const allSFX = {
  click: clickSFX,
  complete: completeSFX,
  reward: rewardSFX,
  levelup: levelupSFX,
  error: errorSFX,
  typing: typingSFX,
  detect: detectSFX,
  firework: fireworkSFX,
};
