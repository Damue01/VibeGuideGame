// ============================================================
// VibeGuide - 8-bit 音轨定义
// 使用 Web Audio API 程序化生成像素风 BGM
// 风格：欢快、热情、节奏快、经典 RPG 冒险感
// ============================================================

export interface Note {
  freq: number;   // Hz, 0 = rest
  duration: number; // beats
}

export interface Track {
  bpm: number;
  loop: boolean;
  channels: {
    type: OscillatorType;
    gain: number;
    notes: Note[];
  }[];
}

// 音符频率表 (含升降号)
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  'Eb3': 155.56, 'F#3': 185.00, 'Bb3': 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  'Eb4': 311.13, 'F#4': 369.99, 'Ab4': 415.30, 'Bb4': 466.16,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  'F#5': 739.99, 'Ab5': 830.61,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
  R: 0,
};

// ============================================================
// 标题画面 BGM — 120 BPM，明快大调，英雄集结感
// ============================================================
export const titleTrack: Track = {
  bpm: 120,
  loop: true,
  channels: [
    // 旋律 (square wave, 欢快8-bit主旋律)
    {
      type: 'square',
      gain: 0.13,
      notes: [
        // A段：明快开场
        { freq: N.E4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.A4, duration: 0.5 }, { freq: N.B4, duration: 0.5 },
        { freq: N.C5, duration: 1 },   { freq: N.B4, duration: 0.5 },
        { freq: N.A4, duration: 0.5 },
        { freq: N.G4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.C5, duration: 0.5 },
        { freq: N.D5, duration: 1 },   { freq: N.R, duration: 0.5 },
        { freq: N.C5, duration: 0.5 },
        // B段：高潮推进
        { freq: N.E5, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.C5, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.E5, duration: 1 },   { freq: N.G5, duration: 0.5 },
        { freq: N.E5, duration: 0.5 },
        { freq: N.D5, duration: 0.5 }, { freq: N.C5, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.G4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.C5, duration: 0.5 },
        // 收束
        { freq: N.D5, duration: 0.5 }, { freq: N.E5, duration: 0.5 },
        { freq: N.C5, duration: 1 },   { freq: N.R, duration: 1 },
        { freq: N.G4, duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.C4, duration: 1 },   { freq: N.R, duration: 1 },
      ],
    },
    // 低音和弦 (triangle)
    {
      type: 'triangle',
      gain: 0.18,
      notes: [
        { freq: N.C3, duration: 2 }, { freq: N.G3, duration: 2 },
        { freq: N.A3, duration: 2 }, { freq: N.E3, duration: 2 },
        { freq: N.C3, duration: 2 }, { freq: N.G3, duration: 2 },
        { freq: N.F3, duration: 2 }, { freq: N.G3, duration: 2 },
        { freq: N.A3, duration: 2 }, { freq: N.E3, duration: 2 },
        { freq: N.C3, duration: 2 }, { freq: N.G3, duration: 2 },
      ],
    },
    // 节奏打点
    {
      type: 'square',
      gain: 0.03,
      notes: Array.from({ length: 24 }, (_, i) => ({
        freq: i % 4 === 0 ? N.C3 : (i % 2 === 0 ? N.G3 : N.R),
        duration: 1,
      })),
    },
  ],
};

// ============================================================
// 世界地图 BGM — 168 BPM，大调进行曲，冒险启程！
// ============================================================
export const worldmapTrack: Track = {
  bpm: 168,
  loop: true,
  channels: [
    // 旋律 — 快节奏跳跃冒险曲
    {
      type: 'square',
      gain: 0.12,
      notes: [
        // A段：快速上行
        { freq: N.G4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.E5, duration: 0.5 }, { freq: N['F#5'], duration: 0.5 },
        { freq: N.G5, duration: 1 },
        { freq: N.E5, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.G4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.B4, duration: 1 },
        // B段：高潮跳跃
        { freq: N.D5, duration: 0.5 }, { freq: N.E5, duration: 0.5 },
        { freq: N.G5, duration: 0.5 }, { freq: N.A5, duration: 0.5 },
        { freq: N.G5, duration: 0.5 }, { freq: N['F#5'], duration: 0.5 },
        { freq: N.E5, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.E5, duration: 0.5 }, { freq: N.G5, duration: 0.5 },
        { freq: N['F#5'], duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        // 衔接过渡
        { freq: N.A4, duration: 0.5 }, { freq: N.B4, duration: 0.5 },
        { freq: N.D5, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.R, duration: 1 },    { freq: N.R, duration: 1 },
      ],
    },
    // 低音线 — 有力的行进感
    {
      type: 'triangle',
      gain: 0.2,
      notes: [
        { freq: N.G3, duration: 0.5 }, { freq: N.G3, duration: 0.5 },
        { freq: N.D3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.E3, duration: 0.5 }, { freq: N.E3, duration: 0.5 },
        { freq: N.G3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.G3, duration: 0.5 }, { freq: N.G3, duration: 0.5 },
        { freq: N.A3, duration: 0.5 }, { freq: N.A3, duration: 0.5 },
        { freq: N.B3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.G3, duration: 1 },
        // B段低音
        { freq: N.G3, duration: 0.5 }, { freq: N.G3, duration: 0.5 },
        { freq: N['F#3'], duration: 0.5 }, { freq: N['F#3'], duration: 0.5 },
        { freq: N.E3, duration: 0.5 }, { freq: N.E3, duration: 0.5 },
        { freq: N.D3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.C3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.G3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.E3, duration: 0.5 }, { freq: N.D3, duration: 0.5 },
        { freq: N.G3, duration: 1 },   { freq: N.R, duration: 1 },
      ],
    },
    // 节奏打点
    {
      type: 'square',
      gain: 0.04,
      notes: Array.from({ length: 24 }, (_, i) => ({
        freq: i % 4 === 0 ? N.C3 : (i % 2 === 0 ? N.G3 : N.R),
        duration: 1,
      })),
    },
  ],
};

// ============================================================
// 关卡内 BGM — 144 BPM，紧凑有力，专注又带劲
// ============================================================
export const levelTrack: Track = {
  bpm: 144,
  loop: true,
  channels: [
    // 旋律
    {
      type: 'square',
      gain: 0.10,
      notes: [
        // A段：紧凑推进
        { freq: N.E4, duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.G4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.B4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.G4, duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.D4, duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.G4, duration: 0.5 }, { freq: N.A4, duration: 0.5 },
        { freq: N.C5, duration: 1 },   { freq: N.R, duration: 0.5 },
        { freq: N.B4, duration: 0.5 },
        // B段：上行爆发
        { freq: N.C5, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.E5, duration: 0.5 }, { freq: N.D5, duration: 0.5 },
        { freq: N.C5, duration: 0.5 }, { freq: N.B4, duration: 0.5 },
        { freq: N.A4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.A4, duration: 0.5 }, { freq: N.B4, duration: 0.5 },
        { freq: N.C5, duration: 0.5 }, { freq: N.E5, duration: 0.5 },
        { freq: N.D5, duration: 0.5 }, { freq: N.C5, duration: 0.5 },
        { freq: N.A4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        // 衔接
        { freq: N.E4, duration: 0.5 }, { freq: N.D4, duration: 0.5 },
        { freq: N.C4, duration: 1 },   { freq: N.R, duration: 1 },
      ],
    },
    // 低音
    {
      type: 'triangle',
      gain: 0.16,
      notes: [
        { freq: N.A3, duration: 1 }, { freq: N.A3, duration: 1 },
        { freq: N.E3, duration: 1 }, { freq: N.E3, duration: 1 },
        { freq: N.F3, duration: 1 }, { freq: N.G3, duration: 1 },
        { freq: N.A3, duration: 1 }, { freq: N.C3, duration: 1 },
        { freq: N.D3, duration: 1 }, { freq: N.E3, duration: 1 },
        { freq: N.A3, duration: 1 }, { freq: N.G3, duration: 1 },
        { freq: N.F3, duration: 1 }, { freq: N.E3, duration: 1 },
        { freq: N.D3, duration: 1 }, { freq: N.C3, duration: 1 },
        { freq: N.A3, duration: 1 }, { freq: N.G3, duration: 1 },
        { freq: N.C3, duration: 1 }, { freq: N.R, duration: 1 },
      ],
    },
    // 节奏
    {
      type: 'square',
      gain: 0.03,
      notes: Array.from({ length: 20 }, (_, i) => ({
        freq: i % 2 === 0 ? N.C3 : N.R,
        duration: 1,
      })),
    },
  ],
};

// ============================================================
// 奖励 BGM — 168 BPM 欢快胜利号角！
// ============================================================
export const rewardTrack: Track = {
  bpm: 168,
  loop: false,
  channels: [
    {
      type: 'square',
      gain: 0.16,
      notes: [
        // 上行号角（快速）
        { freq: N.C5, duration: 0.25 }, { freq: N.E5, duration: 0.25 },
        { freq: N.G5, duration: 0.25 }, { freq: N.C6, duration: 0.75 },
        { freq: N.R, duration: 0.25 },
        // 胜利旋律
        { freq: N.B5, duration: 0.25 }, { freq: N.A5, duration: 0.25 },
        { freq: N.G5, duration: 0.25 }, { freq: N.A5, duration: 0.25 },
        { freq: N.B5, duration: 0.25 }, { freq: N.C6, duration: 0.75 },
        { freq: N.R, duration: 0.25 },
        // 重复推进
        { freq: N.G5, duration: 0.25 }, { freq: N.A5, duration: 0.25 },
        { freq: N.B5, duration: 0.25 }, { freq: N.C6, duration: 0.25 },
        { freq: N.D6, duration: 0.5 },  { freq: N.C6, duration: 0.5 },
        // 收束
        { freq: N.E5, duration: 0.25 }, { freq: N.G5, duration: 0.25 },
        { freq: N.A5, duration: 0.25 }, { freq: N.B5, duration: 0.25 },
        { freq: N.C6, duration: 1.5 },
      ],
    },
    {
      type: 'triangle',
      gain: 0.22,
      notes: [
        { freq: N.C4, duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.G4, duration: 1 },    { freq: N.R, duration: 0.25 },
        { freq: N.F4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.A4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.C4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.E4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N.C4, duration: 1.5 },
      ],
    },
  ],
};

// ============================================================
// Boss/紧张 BGM — 156 BPM，小调，紧迫感
// ============================================================
export const bossTrack: Track = {
  bpm: 156,
  loop: true,
  channels: [
    {
      type: 'square',
      gain: 0.11,
      notes: [
        // 紧迫小调旋律
        { freq: N.E4, duration: 0.5 }, { freq: N.E4, duration: 0.25 },
        { freq: N.E4, duration: 0.25 }, { freq: N.G4, duration: 0.5 },
        { freq: N['F#4'], duration: 0.5 },
        { freq: N.E4, duration: 0.5 }, { freq: N.D4, duration: 0.5 },
        { freq: N.C4, duration: 0.5 }, { freq: N.D4, duration: 0.5 },
        { freq: N.E4, duration: 1 },
        { freq: N.R, duration: 0.5 },  { freq: N.B4, duration: 0.5 },
        { freq: N.A4, duration: 0.5 }, { freq: N.G4, duration: 0.5 },
        { freq: N['F#4'], duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.D4, duration: 0.5 }, { freq: N.E4, duration: 0.5 },
        { freq: N.C4, duration: 1 },   { freq: N.R, duration: 1 },
      ],
    },
    {
      type: 'triangle',
      gain: 0.18,
      notes: [
        { freq: N.A3, duration: 0.5 }, { freq: N.A3, duration: 0.5 },
        { freq: N.E3, duration: 0.5 }, { freq: N.E3, duration: 0.5 },
        { freq: N.F3, duration: 0.5 }, { freq: N.F3, duration: 0.5 },
        { freq: N.E3, duration: 0.5 }, { freq: N.E3, duration: 0.5 },
        { freq: N.A3, duration: 0.5 }, { freq: N.A3, duration: 0.5 },
        { freq: N.G3, duration: 0.5 }, { freq: N.G3, duration: 0.5 },
        { freq: N.F3, duration: 0.5 }, { freq: N.E3, duration: 0.5 },
        { freq: N.D3, duration: 0.5 }, { freq: N.C3, duration: 0.5 },
        { freq: N.A3, duration: 1 },   { freq: N.R, duration: 1 },
      ],
    },
    // 快速脉冲打点
    {
      type: 'square',
      gain: 0.04,
      notes: Array.from({ length: 20 }, (_, i) => ({
        freq: i % 2 === 0 ? N.E3 : N.R,
        duration: 0.5,
      })),
    },
  ],
};

// ============================================================
// 通关庆祝 BGM — 152 BPM，华丽凯旋曲！
// ============================================================
export const victoryTrack: Track = {
  bpm: 152,
  loop: true,
  channels: [
    // 华丽主旋律
    {
      type: 'square',
      gain: 0.14,
      notes: [
        // 凯旋号角
        { freq: N.C5, duration: 0.5 }, { freq: N.E5, duration: 0.5 },
        { freq: N.G5, duration: 0.5 }, { freq: N.C6, duration: 1 },
        { freq: N.B5, duration: 0.5 },
        { freq: N.A5, duration: 0.5 }, { freq: N.G5, duration: 0.5 },
        { freq: N.A5, duration: 0.5 }, { freq: N.B5, duration: 0.5 },
        { freq: N.C6, duration: 1 },   { freq: N.R, duration: 0.5 },
        { freq: N.G5, duration: 0.5 },
        // 庆祝段
        { freq: N.A5, duration: 0.5 }, { freq: N.G5, duration: 0.5 },
        { freq: N.E5, duration: 0.5 }, { freq: N.G5, duration: 0.5 },
        { freq: N.A5, duration: 0.5 }, { freq: N.B5, duration: 0.5 },
        { freq: N.C6, duration: 0.5 }, { freq: N.D6, duration: 0.5 },
        { freq: N.E6, duration: 1 },   { freq: N.D6, duration: 0.5 },
        { freq: N.C6, duration: 0.5 },
        // 收束回旋
        { freq: N.B5, duration: 0.5 }, { freq: N.A5, duration: 0.5 },
        { freq: N.G5, duration: 0.5 }, { freq: N.E5, duration: 0.5 },
        { freq: N.C5, duration: 0.5 }, { freq: N.E5, duration: 0.5 },
        { freq: N.G5, duration: 0.5 }, { freq: N.C6, duration: 0.5 },
        { freq: N.E6, duration: 1 },   { freq: N.C6, duration: 1 },
        { freq: N.R, duration: 1 },
      ],
    },
    // 和弦伴奏
    {
      type: 'triangle',
      gain: 0.2,
      notes: [
        { freq: N.C4, duration: 1 }, { freq: N.E4, duration: 1 },
        { freq: N.G4, duration: 1 }, { freq: N.C4, duration: 1 },
        { freq: N.F4, duration: 1 }, { freq: N.A4, duration: 1 },
        { freq: N.G4, duration: 1 }, { freq: N.C4, duration: 1 },
        { freq: N.F4, duration: 1 }, { freq: N.G4, duration: 1 },
        { freq: N.A4, duration: 1 }, { freq: N.G4, duration: 1 },
        { freq: N.C4, duration: 1 }, { freq: N.E4, duration: 1 },
        { freq: N.G4, duration: 1 }, { freq: N.C4, duration: 1 },
        { freq: N.C4, duration: 1 }, { freq: N.R, duration: 1 },
      ],
    },
    // 欢快打点
    {
      type: 'square',
      gain: 0.035,
      notes: Array.from({ length: 18 }, (_, i) => ({
        freq: i % 4 === 0 ? N.C3 : (i % 2 === 0 ? N.G3 : N.E3),
        duration: 1,
      })),
    },
  ],
};

export const allTracks: Record<string, Track> = {
  title: titleTrack,
  worldmap: worldmapTrack,
  level: levelTrack,
  reward: rewardTrack,
  boss: bossTrack,
  victory: victoryTrack,
};
