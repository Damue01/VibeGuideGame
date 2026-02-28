// ============================================================
// VibeGuide - 世界地图萤火虫 Canvas 渲染器
// 有机运动轨迹 + 呼吸感光晕，围绕关卡图标飘舞
// ============================================================
import React, { useRef, useEffect, useCallback } from 'react';
import { LevelStatus } from '../../shared/types';

export interface FireflyNode {
  /** 节点百分比坐标 x (0-100) */
  x: number;
  /** 节点百分比坐标 y (0-100) */
  y: number;
  status: LevelStatus;
}

interface Props {
  nodes: FireflyNode[];
}

/* ------ 萤火虫粒子对象 ------ */
interface Firefly {
  // 所属节点索引
  nodeIdx: number;
  // 当前角度 (rad)
  angle: number;
  // 角速度 (rad/s)，各萤火虫不同
  angularSpeed: number;
  // 椭圆半径 X / Y
  orbitX: number;
  orbitY: number;
  // 用于叠加有机扰动的偏移相位
  noisePhaseX: number;
  noisePhaseY: number;
  noiseFreqX: number;
  noiseFreqY: number;
  noiseAmpX: number;
  noiseAmpY: number;
  // 第二层噪声（更慢、更大幅）
  driftPhase: number;
  driftFreq: number;
  driftAmp: number;
  // 呼吸参数
  breathPhase: number;
  breathSpeed: number;
  // 大小 (px)
  size: number;
  // 是否为 active 节点 (in-progress)
  active: boolean;
}

/* ------ 颜色配置 ------ */
const COLOR_CORE   = { r: 255, g: 248, b: 192 };  // #fff8c0 核心亮点
const COLOR_MID    = { r: 255, g: 215, b: 0 };     // #ffd700 中间色
const COLOR_ACTIVE = { r: 255, g: 255, b: 220 };   // 更亮的 active 核心

const FIREFLY_COUNTS: Record<string, number> = {
  available: 5,
  'in-progress': 8,
};

/* 半径配置：需要大致覆盖图标大小（icon font-size ~28-42px）
   让椭圆半径在 36~52px 之间波动 */
const ORBIT_X_BASE = 36;
const ORBIT_X_RANGE = 16; // 36~52
const ORBIT_Y_BASE = 30;
const ORBIT_Y_RANGE = 16; // 30~46

/* 噪声幅度：±8~14px 的随机偏移让轨迹不规则 */
const NOISE_AMP_MIN = 6;
const NOISE_AMP_MAX = 14;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createFirefly(nodeIdx: number, i: number, count: number, active: boolean): Firefly {
  const angleOffset = (i / count) * Math.PI * 2;
  return {
    nodeIdx,
    angle: angleOffset,
    angularSpeed: rand(0.5, 1.1) * (Math.random() > 0.5 ? 1 : -1), // 有的顺时针有的逆时针
    orbitX: ORBIT_X_BASE + rand(0, ORBIT_X_RANGE),
    orbitY: ORBIT_Y_BASE + rand(0, ORBIT_Y_RANGE),
    noisePhaseX: rand(0, Math.PI * 2),
    noisePhaseY: rand(0, Math.PI * 2),
    noiseFreqX: rand(0.8, 2.0),
    noiseFreqY: rand(0.6, 1.8),
    noiseAmpX: rand(NOISE_AMP_MIN, NOISE_AMP_MAX),
    noiseAmpY: rand(NOISE_AMP_MIN, NOISE_AMP_MAX),
    driftPhase: rand(0, Math.PI * 2),
    driftFreq: rand(0.15, 0.4),
    driftAmp: rand(4, 10),
    breathPhase: rand(0, Math.PI * 2),
    breathSpeed: rand(1.5, 3.5),
    size: active ? rand(3, 5) : rand(2, 4),
    active,
  };
}

export const MapFireflies: React.FC<Props> = ({ nodes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const animFrameRef = useRef<number>(0);
  const containerSizeRef = useRef({ w: 0, h: 0 });

  // 初始化萤火虫粒子
  const initFireflies = useCallback(() => {
    const flies: Firefly[] = [];
    nodes.forEach((node, nodeIdx) => {
      const count = FIREFLY_COUNTS[node.status];
      if (!count) return;
      const active = node.status === 'in-progress';
      for (let i = 0; i < count; i++) {
        flies.push(createFirefly(nodeIdx, i, count, active));
      }
    });
    firefliesRef.current = flies;
  }, [nodes]);

  useEffect(() => {
    initFireflies();
  }, [initFireflies]);

  // 动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      containerSizeRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // 秒，最大 0.1s 防跳帧
      lastTime = now;
      const { w, h } = containerSizeRef.current;

      ctx.clearRect(0, 0, w, h);

      const flies = firefliesRef.current;
      for (const fly of flies) {
        const node = nodes[fly.nodeIdx];
        if (!node) continue;
        // 没有对应状态的萤火虫就跳过
        if (!FIREFLY_COUNTS[node.status]) continue;

        // 更新角度（角速度也带 sin 波动，产生时快时慢）
        const speedMod = 1 + 0.3 * Math.sin(now * 0.001 * fly.driftFreq + fly.driftPhase);
        fly.angle += fly.angularSpeed * speedMod * dt;

        // 基础椭圆位置
        const baseX = Math.cos(fly.angle) * fly.orbitX;
        const baseY = Math.sin(fly.angle) * fly.orbitY;

        // 多频 sin 噪声扰动
        const t = now * 0.001; // 秒
        const noiseX =
          Math.sin(t * fly.noiseFreqX + fly.noisePhaseX) * fly.noiseAmpX * 0.7 +
          Math.sin(t * fly.noiseFreqX * 1.7 + fly.noisePhaseX * 2.1) * fly.noiseAmpX * 0.3;
        const noiseY =
          Math.sin(t * fly.noiseFreqY + fly.noisePhaseY) * fly.noiseAmpY * 0.7 +
          Math.sin(t * fly.noiseFreqY * 2.3 + fly.noisePhaseY * 1.3) * fly.noiseAmpY * 0.3;

        // 慢漂移（大幅度，低频率）
        const driftX = Math.sin(t * fly.driftFreq + fly.driftPhase) * fly.driftAmp;
        const driftY = Math.cos(t * fly.driftFreq * 0.8 + fly.driftPhase + 1.0) * fly.driftAmp * 0.7;

        // 节点中心 (百分比 → 像素)
        const cx = (node.x / 100) * w;
        const cy = (node.y / 100) * h;

        // 最终位置
        const px = Math.round(cx + baseX + noiseX + driftX);
        const py = Math.round(cy + baseY + noiseY + driftY);

        // 呼吸 alpha + glow
        fly.breathPhase += fly.breathSpeed * dt;
        const breath = 0.5 + 0.5 * Math.sin(fly.breathPhase);
        const alpha = 0.25 + 0.75 * breath;
        const glowRadius = (fly.active ? 10 : 7) + breath * (fly.active ? 8 : 5);

        // 绘制光晕（径向渐变）
        const core = fly.active ? COLOR_ACTIVE : COLOR_CORE;
        const mid = COLOR_MID;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
        grad.addColorStop(0, `rgba(${core.r},${core.g},${core.b},${(alpha * 0.95).toFixed(2)})`);
        grad.addColorStop(0.3, `rgba(${mid.r},${mid.g},${mid.b},${(alpha * 0.5).toFixed(2)})`);
        grad.addColorStop(1, `rgba(${mid.r},${mid.g},${mid.b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 像素风方块核心（保持像素美学）
        const sz = Math.round(fly.size);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${core.r},${core.g},${core.b})`;
        ctx.fillRect(px - Math.floor(sz / 2), py - Math.floor(sz / 2), sz, sz);
        ctx.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes]);

  return (
    <canvas
      ref={canvasRef}
      className="map-firefly-canvas"
    />
  );
};
