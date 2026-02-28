// ============================================================
// VibeGuide - 关卡主题背景层
// 每个关卡显示对应主题的漂浮 emoji + 微妙渐变底色
// 设计原则：氛围感 > 注意力，绝不抢夺游玩焦点
// ============================================================
import React, { useMemo } from 'react';
import { LevelId } from '../../shared/types';
import { LEVEL_BG_EMOJIS } from './WorldMapScreen';
import './LevelBackground.css';

/** 每个关卡的主题渐变色（极低饱和度，仅做微弱色调暗示） */
const LEVEL_THEME: Record<LevelId, { gradient: string; accentColor: string }> = {
  'prologue': {
    gradient: 'radial-gradient(ellipse at 30% 80%, rgba(62,90,40,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(180,140,60,0.06) 0%, transparent 50%)',
    accentColor: 'rgba(120,160,60,0.08)',
  },
  'chapter1-forge': {
    gradient: 'radial-gradient(ellipse at 50% 90%, rgba(180,60,20,0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 30%, rgba(200,120,40,0.06) 0%, transparent 50%)',
    accentColor: 'rgba(200,80,30,0.06)',
  },
  'chapter2-temple': {
    gradient: 'radial-gradient(ellipse at 50% 50%, rgba(80,50,160,0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(60,80,180,0.06) 0%, transparent 50%)',
    accentColor: 'rgba(100,60,180,0.06)',
  },
  'chapter3-create': {
    gradient: 'radial-gradient(ellipse at 40% 60%, rgba(40,160,120,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(200,140,220,0.05) 0%, transparent 50%)',
    accentColor: 'rgba(60,180,100,0.06)',
  },
  'chapter4-deploy': {
    gradient: 'radial-gradient(ellipse at 60% 30%, rgba(40,60,180,0.10) 0%, transparent 55%), radial-gradient(ellipse at 30% 80%, rgba(100,200,240,0.06) 0%, transparent 50%)',
    accentColor: 'rgba(60,100,220,0.06)',
  },
};

import { seededRandom, hashStr } from '../utils/random';

interface FloatingEmoji {
  icon: string;
  x: number;      // vw %
  y: number;      // vh %
  size: number;    // px
  opacity: number;
  driftX: number;  // px 水平漂移幅度
  driftY: number;  // px 垂直漂移幅度
  duration: number; // s 动画周期
  delay: number;    // s 动画延迟
  rotate: number;   // deg 初始旋转
}

/**
 * 为指定关卡生成散列式漂浮 emoji 列表
 * 数量不多（~18 个），配合 CSS 慢速飘动就足以营造氛围
 */
function generateFloatingEmojis(levelId: LevelId): FloatingEmoji[] {
  const emojis = LEVEL_BG_EMOJIS[levelId];
  if (!emojis) return [];

  const base = hashStr(levelId);
  const cols = 3, rows = 3;
  const perCell = 2; // 3×3 = 9 cells, 2 each = 18 emojis
  const cellW = 96 / cols; // each cell width in vw%
  const cellH = 96 / rows;
  const result: FloatingEmoji[] = [];
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      for (let k = 0; k < perCell; k++) {
        const seed = base + idx * 173;
        result.push({
          icon: emojis[idx % emojis.length],
          x: 2 + col * cellW + seededRandom(seed) * cellW,
          y: 2 + row * cellH + seededRandom(seed + 1) * cellH,
          size: 20 + seededRandom(seed + 2) * 28,
          opacity: 0.12 + seededRandom(seed + 3) * 0.10,
          driftX: 6 + seededRandom(seed + 4) * 14,
          driftY: 4 + seededRandom(seed + 5) * 10,
          duration: 18 + seededRandom(seed + 6) * 24,
          delay: seededRandom(seed + 7) * 12,
          rotate: seededRandom(seed + 8) * 360,
        });
        idx++;
      }
    }
  }
  return result;
}

interface LevelBackgroundProps {
  levelId: LevelId;
}

export const LevelBackground: React.FC<LevelBackgroundProps> = ({ levelId }) => {
  const items = useMemo(() => generateFloatingEmojis(levelId), [levelId]);
  const theme = LEVEL_THEME[levelId];

  return (
    <div className="level-bg" aria-hidden="true">
      {/* 主题渐变底色层 */}
      {theme && (
        <div
          className="level-bg__gradient"
          style={{ backgroundImage: theme.gradient }}
        />
      )}

      {/* 漂浮 Emoji 层 */}
      {items.map((item, idx) => (
        <span
          key={idx}
          className="level-bg__emoji"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
            opacity: item.opacity,
            transform: `rotate(${item.rotate}deg)`,
            '--drift-x': `${item.driftX}px`,
            '--drift-y': `${item.driftY}px`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          } as React.CSSProperties}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
};
