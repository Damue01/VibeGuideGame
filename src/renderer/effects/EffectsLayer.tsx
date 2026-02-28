// ============================================================
// VibeGuide - 全屏粒子特效层 (Canvas 2D)
// 覆盖在整个游戏画面之上，pointer-events: none
// ============================================================

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Particle,
  createFireworkBurst,
  createExplosionBurst,
  createStarBurst,
  createLevelUpBurst,
  createConfettiBurst,
  updateParticles,
  renderParticles,
} from './particles';

export interface EffectsLayerHandle {
  triggerFireworks: (x?: number, y?: number) => void;
  triggerExplosion: (x?: number, y?: number) => void;
  triggerStarBurst: (x?: number, y?: number) => void;
  triggerLevelUp: () => void;
  triggerCelebration: () => void;
  triggerConfetti: () => void;
}

const EffectsLayer = forwardRef<EffectsLayerHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const pendingTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  /** 调度一个 setTimeout 并自动跟踪，卸载时统一清理 */
  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      pendingTimers.current.delete(id);
      fn();
    }, delay);
    pendingTimers.current.add(id);
  }, []);

  // 记录最后一次鼠标点击位置，用于将特效生成在点击处
  const lastClickRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      lastClickRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, []);

  // 自动适配窗口大小
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
      // 清理所有未完成的定时器
      for (const id of pendingTimers.current) clearTimeout(id);
      pendingTimers.current.clear();
    };
  }, [resize]);

  // 动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = updateParticles(particlesRef.current);

    if (particlesRef.current.length > 0) {
      renderParticles(ctx, particlesRef.current);
      animRef.current = requestAnimationFrame(animate);
    } else {
      isRunningRef.current = false;
    }
  }, []);

  const ensureRunning = useCallback(() => {
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      animRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // 暴露 API
  useImperativeHandle(
    ref,
    () => ({
      triggerFireworks(x?: number, y?: number) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const click = lastClickRef.current;
        const cx = x ?? click?.x ?? canvas.width / 2;
        const cy = y ?? click?.y ?? canvas.height / 3;
        // 多次连发，随机偏移
        const randOff = () => (Math.random() - 0.5) * 200;
        particlesRef.current.push(...createFireworkBurst(cx, cy, 50));
        schedule(() => {
          particlesRef.current.push(
            ...createFireworkBurst(cx + randOff(), cy + randOff() * 0.5, 35)
          );
        }, 200);
        schedule(() => {
          particlesRef.current.push(
            ...createFireworkBurst(cx + randOff(), cy + randOff() * 0.5, 45)
          );
        }, 400);
        ensureRunning();
      },

      triggerExplosion(x?: number, y?: number) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const click = lastClickRef.current;
        const cx = x ?? click?.x ?? canvas.width / 2;
        const cy = y ?? click?.y ?? canvas.height / 2;
        particlesRef.current.push(...createExplosionBurst(cx, cy, 40));
        ensureRunning();
      },

      triggerStarBurst(x?: number, y?: number) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const click = lastClickRef.current;
        const cx = x ?? click?.x ?? canvas.width / 2;
        const cy = y ?? click?.y ?? canvas.height / 2;
        particlesRef.current.push(...createStarBurst(cx, cy, 60));
        ensureRunning();
      },

      triggerLevelUp() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cx = canvas.width / 2;
        particlesRef.current.push(...createLevelUpBurst(cx, canvas.height, 80));
        ensureRunning();
      },

      triggerCelebration() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        const click = lastClickRef.current;
        const cx = click?.x ?? w / 2;
        const cy = click?.y ?? h / 2;

        // 中心星芒 - 在点击位置
        particlesRef.current.push(...createStarBurst(cx, cy, 50));

        // 围绕点击位置的烟花
        const randOff = () => (Math.random() - 0.5) * 300;
        schedule(() => {
          particlesRef.current.push(...createFireworkBurst(cx + randOff(), cy + randOff() * 0.5, 40));
          ensureRunning();
        }, 150);
        schedule(() => {
          particlesRef.current.push(...createFireworkBurst(cx + randOff(), cy + randOff() * 0.5, 40));
          ensureRunning();
        }, 350);
        schedule(() => {
          particlesRef.current.push(...createFireworkBurst(cx + randOff(), cy + randOff() * 0.5, 50));
          ensureRunning();
        }, 550);

        // 升级光柱
        schedule(() => {
          particlesRef.current.push(...createLevelUpBurst(cx, h, 70));
          ensureRunning();
        }, 200);

        ensureRunning();
      },

      triggerConfetti() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        particlesRef.current.push(...createConfettiBurst(canvas.width, 60));
        ensureRunning();
      },
    }),
    [ensureRunning, schedule]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
});

EffectsLayer.displayName = 'EffectsLayer';
export default EffectsLayer;
