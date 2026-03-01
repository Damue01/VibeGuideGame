// ============================================================
// VibeGuide - 通关结算画面
// 所有章节完成后的庆祝页面
// 持续粒子特效，直到用户点击返回主页
// ============================================================
import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEffectsContext } from '../effects/EffectsContext';
import { useAudio } from '../audio/useAudio';
import './VictoryScreen.css';

export const VictoryScreen: React.FC = () => {
  const { player, setScreen, showNotification, clearNotification } = useGameStore();
  const { effectsRef, shakeRef } = useEffectsContext();
  const { playFirework, playReward, playLevelUp } = useAudio();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 持续庆祝特效循环
  const startCelebration = useCallback(() => {
    // 初始大爆发
    effectsRef.current?.triggerCelebration();
    shakeRef.current?.shake(10, 600);
    playReward();

    const t1 = setTimeout(() => playLevelUp(), 600);
    const t2 = setTimeout(() => playFirework(), 1200);
    const t3 = setTimeout(() => {
      effectsRef.current?.triggerConfetti();
    }, 800);
    timeoutRefs.current.push(t1, t2, t3);

    // 每隔一段时间持续放烟花 + 彩纸
    intervalRef.current = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.35) {
        effectsRef.current?.triggerFireworks(
          Math.random() * window.innerWidth,
          50 + Math.random() * (window.innerHeight * 0.4),
        );
        playFirework();
      } else if (rand < 0.65) {
        effectsRef.current?.triggerConfetti();
      } else if (rand < 0.85) {
        effectsRef.current?.triggerExplosion(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
        );
      } else {
        effectsRef.current?.triggerStarBurst(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
        );
      }
    }, 1200);
  }, [effectsRef, shakeRef, playFirework, playReward, playLevelUp]);

  useEffect(() => {
    startCelebration();

    // 进入通关画面 3 秒后弹出 GitHub 点星引导 Toast（持久显示，不自动消失）
    const starTimer = setTimeout(() => {
      showNotification(
        '⭐ 喜欢这段冒险？点击给冒险指南点亮星光！',
        { url: 'https://github.com/Damue01/VibeGuideGame', persistent: true },
      );
    }, 3000);
    timeoutRefs.current.push(starTimer);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      for (const t of timeoutRefs.current) clearTimeout(t);
    };
  }, [startCelebration]);

  const handleClick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    for (const t of timeoutRefs.current) clearTimeout(t);
    // 清除可能残留的持久 toast（如 GitHub 引导）
    clearNotification();
    setScreen('title');
  };

  return (
    <div className="victory-screen" onClick={handleClick}>
      <div className="victory-stars" />

      <div className="victory-content">
        <div className="victory-title">🎉 通关！🎉</div>
        <div className="victory-subtitle">
          恭喜你，勇者 <strong>{player.name || '冒险者'}</strong>！
          <br />
          你已经完成了所有的 Vibe Coding 冒险！
          <br />
          从工具锻造到网站部署，你掌握了现代开发的核心流程。
          <br />
          <span style={{ color: '#ffd700' }}>未来的路，由你来书写！</span>
        </div>

        {/* 统计数据 */}
        <div className="victory-stats">
          <div className="victory-stat">
            <div className="victory-stat__icon">⚔️</div>
            <div className="victory-stat__value">Lv.{player.level}</div>
            <div className="victory-stat__label">等级</div>
          </div>
          <div className="victory-stat">
            <div className="victory-stat__icon">✨</div>
            <div className="victory-stat__value">{player.xp}</div>
            <div className="victory-stat__label">经验值</div>
          </div>
          <div className="victory-stat">
            <div className="victory-stat__icon">🏅</div>
            <div className="victory-stat__value">{player.badges.length}</div>
            <div className="victory-stat__label">徽章</div>
          </div>
          <div className="victory-stat">
            <div className="victory-stat__icon">🎒</div>
            <div className="victory-stat__value">{player.items.length}</div>
            <div className="victory-stat__label">物品</div>
          </div>
        </div>

        {/* 收集物品展示 */}
        {player.items.length > 0 && (
          <div className="victory-items">
            {player.items.map((item) => (
              <div key={item.id} className="victory-item" title={item.description}>
                <div className="victory-item__icon">{item.icon}</div>
                <div className="victory-item__name">{item.name}</div>
              </div>
            ))}
          </div>
        )}

        <div className="victory-hint">🖱️ 点击任意位置返回主页</div>
      </div>
    </div>
  );
};
