// ============================================================
// VibeGuide - 世界地图
// 像素风俯视角地图，显示关卡节点和路径
// ============================================================
import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LevelId, LevelStatus } from '../../shared/types';
import { useAudio } from '../audio/useAudio';
import { MapFireflies, FireflyNode } from './MapFireflies';
import './WorldMapScreen.css';

interface MapNode {
  id: LevelId;
  name: string;
  description: string;
  icon: string;
  x: number; // % position
  y: number;
}

// 节点位置沿 S 形曲线分布，确保路径和节点对齐
const MAP_NODES: MapNode[] = [
  {
    id: 'prologue',
    name: '起源村',
    description: '一切冒险的起点',
    icon: '🏘️',
    x: 12,
    y: 78,
  },
  {
    id: 'chapter1-forge',
    name: '工具锻造谷',
    description: '在这里锻造你的武器（安装IDE）',
    icon: '⚒️',
    x: 32,
    y: 60,
  },
  {
    id: 'chapter2-temple',
    name: '觉醒神殿',
    description: '觉醒与AI精灵对话的能力',
    icon: '🏛️',
    x: 52,
    y: 45,
  },
  {
    id: 'chapter3-create',
    name: '创造平原',
    description: '用 Vite + React 建造你的网站',
    icon: '🏰',
    x: 72,
    y: 32,
  },
  {
    id: 'chapter4-deploy',
    name: '传送灯塔',
    description: '将你的作品传送到全世界（GitHub Pages）',
    icon: '🗼',
    x: 88,
    y: 18,
  },
];

// 地图装饰物（按地形区域主题分组）
const MAP_DECORATIONS = [
  // 起源村区域（左下）— 田园风
  { icon: '🏠', x: 4,  y: 88, size: 18, opacity: 0.4 },
  { icon: '🌾', x: 8,  y: 82, size: 14, opacity: 0.35 },
  { icon: '🌿', x: 20, y: 90, size: 13, opacity: 0.3 },
  { icon: '🐓', x: 6,  y: 70, size: 12, opacity: 0.3 },
  { icon: '🌲', x: 22, y: 76, size: 17, opacity: 0.38 },
  // 工具锻造谷区域 — 火山/作坊风
  { icon: '🌋', x: 40, y: 72, size: 26, opacity: 0.35 },
  { icon: '💨', x: 28, y: 55, size: 14, opacity: 0.28 },
  { icon: '🔥', x: 44, y: 50, size: 13, opacity: 0.32 },
  { icon: '⛏️', x: 36, y: 68, size: 12, opacity: 0.25 },
  // 觉醒神殿区域 — 神秘风
  { icon: '🌙', x: 58, y: 36, size: 15, opacity: 0.35 },
  { icon: '🕯️', x: 63, y: 55, size: 13, opacity: 0.28 },
  { icon: '✨', x: 47, y: 32, size: 11, opacity: 0.4 },
  { icon: '🏔️', x: 60, y: 62, size: 28, opacity: 0.3 },
  // 创造平原区域 — 明亮创造风
  { icon: '🌻', x: 68, y: 44, size: 14, opacity: 0.35 },
  { icon: '🦋', x: 78, y: 38, size: 12, opacity: 0.32 },
  { icon: '🌈', x: 65, y: 27, size: 16, opacity: 0.28 },
  // 传送灯塔区域（右上）— 能量/星海风
  { icon: '🌟', x: 82, y: 50, size: 14, opacity: 0.4 },
  { icon: '💫', x: 95, y: 28, size: 12, opacity: 0.45 },
  { icon: '⚡', x: 92, y: 42, size: 11, opacity: 0.35 },
  { icon: '🌊', x: 80, y: 58, size: 18, opacity: 0.3 },
  // 天空云层（全图）
  { icon: '☁️', x: 15, y: 12, size: 22, opacity: 0.22 },
  { icon: '☁️', x: 48, y: 8,  size: 18, opacity: 0.18 },
  { icon: '☁️', x: 78, y: 6,  size: 20, opacity: 0.2 },
  { icon: '💎', x: 95, y: 18, size: 10, opacity: 0.4 },
];

const statusStyles: Record<LevelStatus, string> = {
  locked: 'node--locked',
  available: 'node--available',
  'in-progress': 'node--active',
  completed: 'node--completed',
};

// 关卡主题背景 emoji —— 每个关卡周围的氛围装饰（同时在 LevelScreen 中复用）
export const LEVEL_BG_EMOJIS: Record<LevelId, string[]> = {
  'prologue':        ['🏡', '🌾', '🌿', '🍃', '🐔', '🌻', '🌲', '🌽', '🍂', '🐑'],
  'chapter1-forge':  ['🔨', '🔥', '⚙️', '💨', '🧱', '🗿', '⛏️', '🌋', '🔩', '⚒️'],
  'chapter2-temple': ['🌙', '✨', '🔮', '🕯️', '📜', '🏔️', '🦉', '🌌', '💎', '🔯'],
  'chapter3-create': ['🌈', '🦋', '🌻', '🎨', '🧩', '🏗️', '🌱', '🎪', '🎈', '✏️'],
  'chapter4-deploy': ['⚡', '🌟', '💫', '🚀', '🌊', '🔭', '🛸', '💠', '🌠', '🗼'],
};

// 确定性伪随机（从共享工具导入）
import { seededRandom, hashStr } from '../utils/random';

interface BgItem { icon: string; x: number; y: number; size: number; opacity: number; delay: number }

function generateLevelBgItems(): BgItem[] {
  const items: BgItem[] = [];
  for (const node of MAP_NODES) {
    const emojis = LEVEL_BG_EMOJIS[node.id];
    const base = hashStr(node.id);
    const count = 10; // 每个关卡 10 个装饰
    for (let i = 0; i < count; i++) {
      const seed = base + i * 137;
      const angle = seededRandom(seed) * Math.PI * 2;
      const dist = 4 + seededRandom(seed + 1) * 10; // 4% ~ 14% 半径
      const x = Math.max(1, Math.min(99, node.x + Math.cos(angle) * dist));
      const y = Math.max(1, Math.min(99, node.y + Math.sin(angle) * dist * 0.8));
      items.push({
        icon: emojis[i % emojis.length],
        x, y,
        size: 8 + seededRandom(seed + 2) * 6,         // 8~14px
        opacity: 0.12 + seededRandom(seed + 3) * 0.1, // 0.12~0.22
        delay: seededRandom(seed + 4) * 8,             // 0~8s 延迟
      });
    }
  }
  return items;
}

const LEVEL_BG_ITEMS = generateLevelBgItems();

// 生成两个节点之间的像素格子路径坐标（Bresenham 直线 + 90°折线）
// 返回格子坐标数组，路径宽度 2-3 格
interface PathCell {
  gx: number;
  gy: number;
  type: 'center' | 'edge' | 'decoration';
  hueShift: number; // 碎石色差
}

const GRID_COLS = 60;
const GRID_ROWS = 35;

// 将百分比坐标转换为网格坐标
function pctToGrid(px: number, py: number): [number, number] {
  return [
    Math.round((px / 100) * (GRID_COLS - 1)),
    Math.round((py / 100) * (GRID_ROWS - 1)),
  ];
}

// 生成两点间的像素路径（仅水平+垂直+45°走向，L形折线）
function buildPixelPath(
  ax: number, ay: number, bx: number, by: number, seed: number
): PathCell[] {
  const [gx1, gy1] = pctToGrid(ax, ay);
  const [gx2, gy2] = pctToGrid(bx, by);
  const cells: PathCell[] = [];
  const cellSet = new Set<string>();

  const addCell = (x: number, y: number, type: PathCell['type']) => {
    const key = `${x},${y}`;
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;
    if (cellSet.has(key) && type !== 'decoration') return;
    cellSet.add(key);
    cells.push({
      gx: x,
      gy: y,
      type,
      hueShift: ((x * 7 + y * 13 + seed) % 20) - 10,
    });
  };

  // L形折线：先水平走到中点，再垂直走
  const midX = Math.round((gx1 + gx2) / 2);

  // 水平段1: gx1 → midX
  const xDir1 = midX > gx1 ? 1 : -1;
  for (let x = gx1; x !== midX; x += xDir1) {
    addCell(x, gy1, 'center');
    addCell(x, gy1 - 1, 'edge');
    addCell(x, gy1 + 1, 'edge');
  }

  // 垂直段: gy1 → gy2 at midX
  const yDir = gy2 > gy1 ? 1 : -1;
  for (let y = gy1; y !== gy2; y += yDir) {
    addCell(midX, y, 'center');
    addCell(midX - 1, y, 'edge');
    addCell(midX + 1, y, 'edge');
  }

  // 水平段2: midX → gx2
  const xDir2 = gx2 > midX ? 1 : -1;
  for (let x = midX; x !== gx2 + xDir2; x += xDir2) {
    addCell(x, gy2, 'center');
    addCell(x, gy2 - 1, 'edge');
    addCell(x, gy2 + 1, 'edge');
  }

  // 转角处加宽为更自然的路口
  addCell(midX, gy1, 'center');
  addCell(midX - 1, gy1, 'center');
  addCell(midX + 1, gy1, 'center');
  addCell(midX, gy2, 'center');

  // 路边装饰（杂草/小石子）
  for (const cell of [...cells]) {
    if (cell.type === 'edge') {
      const rng = (cell.gx * 31 + cell.gy * 17 + seed) % 7;
      if (rng === 0) {
        const dx = cell.gx < midX ? -1 : 1;
        addCell(cell.gx + dx, cell.gy, 'decoration');
      }
    }
  }

  return cells;
}

// 计算路径中心格子的有序列表（用于行军动画延迟）
function getOrderedCenterCells(cells: PathCell[]): PathCell[] {
  return cells.filter(c => c.type === 'center');
}

export const WorldMapScreen: React.FC = () => {
  const { levels, player, enterLevel, setScreen, setLevelStatus, resetLevel } = useGameStore();
  const audio = useAudio();
  const [replayConfirm, setReplayConfirm] = useState<LevelId | null>(null);

  const handleNodeClick = (nodeId: LevelId) => {
    const level = levels[nodeId];
    if (level.status === 'locked') return;

    audio.playClick();

    if (level.status === 'completed') {
      setReplayConfirm(nodeId);
      return;
    }

    if (level.status === 'available') {
      setLevelStatus(nodeId, 'in-progress');
    }
    enterLevel(nodeId);
  };

  const handleReplayConfirm = () => {
    if (!replayConfirm) return;
    resetLevel(replayConfirm);
    enterLevel(replayConfirm);
    setReplayConfirm(null);
  };

  const completedCount = MAP_NODES.filter(n => levels[n.id]?.status === 'completed').length;
  const nextNode = MAP_NODES.find(n => levels[n.id]?.status === 'available' || levels[n.id]?.status === 'in-progress');

  // 萤火虫 Canvas 需要的节点数据
  const fireflyNodes: FireflyNode[] = useMemo(
    () => MAP_NODES.map(n => ({ x: n.x, y: n.y, status: levels[n.id].status })),
    [levels],
  );

  // 预计算所有路径格子
  const allPathCells = useMemo(() => {
    return MAP_NODES.slice(0, -1).map((node, i) => {
      const next = MAP_NODES[i + 1];
      const fromStatus = levels[node.id].status;
      const toStatus = levels[next.id].status;
      const isActive = fromStatus === 'completed' || toStatus !== 'locked';
      const cells = buildPixelPath(node.x, node.y, next.x, next.y, i * 137);
      return { cells, isActive, index: i };
    });
  }, [levels]);

  return (
    <div className="screen world-map-screen">
      {/* 顶部状态栏 */}
      <div className="map-hud">
        <div className="hud-player">
          <div className="hud-avatar">
            {player.class === 'product' ? '🎯' :
             player.class === 'developer' ? '⚡' : '🎨'}
          </div>
          <div className="hud-player-info">
            <span className="hud-name pixel-text-cn">{player.name}</span>
            <span className="hud-class pixel-text-cn">
              {player.class === 'product' ? '产品策划师' : 
               player.class === 'developer' ? '开发工程师' : '美术设计师'}
            </span>
          </div>
        </div>
        <div className="hud-xp">
          <span className="hud-level-badge pixel-text">Lv.{player.level}</span>
          <div className="pixel-progress hud-xp-bar">
            <div
              className="pixel-progress__fill"
              style={{ width: `${(player.xp / player.xpToNext) * 100}%` }}
            />
          </div>
          <span className="pixel-text hud-xp-text">
            {player.xp}/{player.xpToNext}
          </span>
        </div>
        <div className="hud-actions">
          <button
            className="pixel-btn pixel-btn--small"
            onClick={() => setScreen('settings')}
          >
            ⚙️
          </button>
          <button
            className="pixel-btn pixel-btn--small"
            onClick={() => setScreen('title')}
            title="返回主页"
          >
            🏠
          </button>
        </div>
      </div>

      {/* 地图区域 */}
      <div className="map-container">
        {/* 萤火虫 Canvas 层 */}
        <MapFireflies nodes={fireflyNodes} />

        {/* 关卡背景 emoji 层（最底层） */}
        {LEVEL_BG_ITEMS.map((item, i) => (
          <div
            key={`lvl-bg-${i}`}
            className="level-bg-deco"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.size}px`,
              opacity: item.opacity,
              animationDelay: `${item.delay.toFixed(1)}s`,
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* 装饰物层 */}
        {MAP_DECORATIONS.map((d, i) => (
          <div
            key={`deco-${i}`}
            className="map-decoration"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              fontSize: `${d.size}px`,
              opacity: d.opacity ?? 0.35,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {d.icon}
          </div>
        ))}

        {/* 像素格子路径层 */}
        <div className="map-grid-paths">
          {allPathCells.map(({ cells, isActive, index }) =>
            cells.map((cell, ci) => (
              <div
                key={`path-${index}-${ci}`}
                className={[
                  'path-cell',
                  `path-cell--${cell.type}`,
                  isActive ? 'path-cell--active' : 'path-cell--locked',
                ].join(' ')}
                style={{
                  gridColumn: cell.gx + 1,
                  gridRow: cell.gy + 1,
                  '--stone-hue': `${cell.hueShift}deg`,
                  '--march-delay': cell.type === 'center' ? `${ci * 0.04}s` : '0s',
                } as React.CSSProperties}
              />
            ))
          )}
        </div>

        {/* 地图节点 */}
        {MAP_NODES.map((node) => {
          const status = levels[node.id].status;

          return (
            <div
              key={node.id}
              className={`map-node ${statusStyles[status]}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => handleNodeClick(node.id)}
            >
              {/* Hover Tooltip 气泡 */}
              <div className="node-tooltip">
                <div className="node-tooltip-name pixel-text-cn">{node.name}</div>
                <div className="node-tooltip-desc pixel-text-cn">{node.description}</div>
              </div>

              <div className="node-icon">{node.icon}</div>
              <div className="node-label pixel-text-cn">{node.name}</div>

              {/* 已完成：红旗图标 */}
              {status === 'completed' && (
                <div className="node-flag" title="已完成">🚩</div>
              )}
              {/* 锁定：小锁图标 */}
              {status === 'locked' && (
                <div className="node-lock">🔒</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div className="map-hint anim-slide-up">
        <span className="map-hint-progress pixel-text-cn">
          ✨ 已完成 {completedCount}/{MAP_NODES.length}
        </span>
        {nextNode && (
          <span className="map-hint-next pixel-text-cn">
            · 下一站：{nextNode.name} {nextNode.icon}
          </span>
        )}
        {completedCount === MAP_NODES.length && (
          <span className="map-hint-done pixel-text-cn">· 🎉 全部完成！</span>
        )}
      </div>

      {/* 重玩确认弹窗 */}
      {replayConfirm && (
        <div className="map-overlay" onClick={() => setReplayConfirm(null)}>
          <div
            className="pixel-panel map-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="pixel-text-cn" style={{ fontSize: 16, marginBottom: 8 }}>
              🔄 重新体验关卡？
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)', marginBottom: 20 }}>
              进度将重置，但已获得的奖励不会消失
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="pixel-btn pixel-btn--accent" onClick={handleReplayConfirm}>
                ✅ 确认重玩
              </button>
              <button className="pixel-btn" onClick={() => setReplayConfirm(null)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
