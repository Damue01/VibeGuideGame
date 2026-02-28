// ============================================================
// VibeGuide - 粒子系统核心
// 自定义轻量级像素方块粒子引擎 (Canvas 2D)
// ============================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  alpha: number;
  decay: number;    // life loss per frame
  trail?: boolean;  // 是否留拖尾
}

export type ParticleBurst = Particle[];

const PIXEL_COLORS = {
  firework: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3', '#54a0ff', '#5f27cd'],
  explosion: ['#ff4757', '#ff6348', '#ffa502', '#ffdd57', '#ff6b6b'],
  star: ['#ffd700', '#fff8dc', '#fffacd', '#ffeaa7'],
  levelup: ['#ffd700', '#54a0ff', '#ff9ff3', '#5f27cd', '#00d2d3'],
  confetti: ['#ff6b6b', '#ffd700', '#4ecdc4', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6348', '#00d2d3', '#f9ca24', '#2ed573'],
};

/** 生成烟花粒子爆发 */
export function createFireworkBurst(cx: number, cy: number, count = 40): ParticleBurst {
  const particles: Particle[] = [];
  const colors = PIXEL_COLORS.firework;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.floor(Math.random() * 4),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      gravity: 0.06,
      alpha: 1,
      decay: 0.012 + Math.random() * 0.008,
      trail: true,
    });
  }
  return particles;
}

/** 生成爆炸粒子 */
export function createExplosionBurst(cx: number, cy: number, count = 30): ParticleBurst {
  const particles: Particle[] = [];
  const colors = PIXEL_COLORS.explosion;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.floor(Math.random() * 5),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      gravity: 0.02,
      alpha: 1,
      decay: 0.02 + Math.random() * 0.01,
    });
  }
  return particles;
}

/** 生成星芒粒子（升级用） */
export function createStarBurst(cx: number, cy: number, count = 50): ParticleBurst {
  const particles: Particle[] = [];
  const colors = PIXEL_COLORS.star;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.floor(Math.random() * 3),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      gravity: -0.01, // 微微上浮
      alpha: 1,
      decay: 0.01 + Math.random() * 0.005,
    });
  }
  return particles;
}

/** 生成升级光柱粒子 */
export function createLevelUpBurst(cx: number, canvasHeight: number, count = 60): ParticleBurst {
  const particles: Particle[] = [];
  const colors = PIXEL_COLORS.levelup;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: canvasHeight + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(3 + Math.random() * 5),
      size: 2 + Math.floor(Math.random() * 4),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      gravity: -0.01,
      alpha: 1,
      decay: 0.008 + Math.random() * 0.004,
      trail: true,
    });
  }
  return particles;
}

/** 生成彩纸飘洒粒子（从顶部连续下落） */
export function createConfettiBurst(canvasWidth: number, count = 50): ParticleBurst {
  const particles: Particle[] = [];
  const colors = PIXEL_COLORS.confetti;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvasWidth,
      y: -10 - Math.random() * 60,
      vx: (Math.random() - 0.5) * 2,
      vy: 1.5 + Math.random() * 2.5,
      size: 3 + Math.floor(Math.random() * 5),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      gravity: 0.02,
      alpha: 1,
      decay: 0.004 + Math.random() * 0.003,
      trail: false,
    });
  }
  return particles;
}

/** 更新粒子，返回存活的粒子 */
export function updateParticles(particles: ParticleBurst): ParticleBurst {
  return particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= p.decay;
    p.alpha = Math.max(0, p.life / p.maxLife);
    // 像素化：整数坐标
    return p.life > 0;
  });
}

/** 渲染粒子到 Canvas */
export function renderParticles(ctx: CanvasRenderingContext2D, particles: ParticleBurst) {
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    // 像素方块（不用圆形）
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    ctx.fillRect(x, y, p.size, p.size);

    // 拖尾效果
    if (p.trail && p.alpha > 0.3) {
      ctx.globalAlpha = p.alpha * 0.4;
      ctx.fillRect(x - p.vx * 1.5, y - p.vy * 1.5, p.size * 0.7, p.size * 0.7);
      ctx.globalAlpha = p.alpha * 0.2;
      ctx.fillRect(x - p.vx * 3, y - p.vy * 3, p.size * 0.5, p.size * 0.5);
    }
  }
  ctx.globalAlpha = 1;
}
