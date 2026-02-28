// ============================================================
// VibeGuide - 标题画面
// 像素风标题 + 开始按钮 + 星空背景
// ============================================================
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './TitleScreen.css';

export const TitleScreen: React.FC = () => {
  const { setScreen, player, resetGame } = useGameStore();
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSubtitle(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNewGame = () => {
    if (player.name) {
      // 已有存档，弹确认
      setShowNewGameConfirm(true);
    } else {
      setScreen('intro');
    }
  };

  const handleConfirmNewGame = () => {
    resetGame(); // 清空所有数据并跳到 intro
  };

  const handleContinue = () => {
    if (player.name) {
      setScreen('world-map');
    }
  };

  return (
    <div className="screen title-screen">
      {/* 星空粒子背景 */}
      <div className="title-stars">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 标题 */}
      <div className="title-content">
        <h1 className="title-logo">
          <span className="title-vibe">Vibe</span>
          <span className="title-guide">Guide</span>
        </h1>

        {showSubtitle && (
          <p className="title-subtitle pixel-text-cn">
            ✨ 用AI的力量，开启你的编程冒险 ✨
          </p>
        )}

        {/* 按钮组 */}
        <div className="title-buttons">
          <button className="pixel-btn pixel-btn--orange pixel-btn--large" onClick={handleNewGame}>
            <span className="pixel-btn__icon">🗡️</span>
            <span className="pixel-btn__label">新的冒险</span>
            <span className="pixel-btn__badge">NEW</span>
          </button>

          {player.name && (
            <button className="pixel-btn pixel-btn--green pixel-btn--large" onClick={handleContinue}>
              <span className="pixel-btn__icon">📖</span>
              <span className="pixel-btn__label">继续冒险</span>
              <span className="pixel-btn__badge">GO</span>
            </button>
          )}

          <button
            className="pixel-btn pixel-btn--blue pixel-btn--small"
            onClick={() => setScreen('settings')}
          >
            <span className="pixel-btn__icon">⚙️</span>
            <span className="pixel-btn__label">设置</span>
            <span className="pixel-btn__badge">SET</span>
          </button>
        </div>

        <p className="title-version pixel-text">v0.1.0</p>
      </div>

      {/* 新游戏确认弹窗 */}
      {showNewGameConfirm && (
        <div
          className="title-overlay"
          onClick={() => setShowNewGameConfirm(false)}
        >
          <div
            className="pixel-panel title-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="pixel-text-cn" style={{ fontSize: 16, marginBottom: 8, color: 'var(--color-warning)' }}>
              ⚠️ 确定要开始新冒险吗？
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)', marginBottom: 20 }}>
              当前存档的所有数据（角色、关卡进度、物品）将被清空
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="pixel-btn pixel-btn--red" onClick={handleConfirmNewGame}>
                <span className="pixel-btn__icon">⚠️</span>
                <span className="pixel-btn__label">确认重新开始</span>
                <span className="pixel-btn__badge">!</span>
              </button>
              <button className="pixel-btn pixel-btn--gray" onClick={() => setShowNewGameConfirm(false)}>
                <span className="pixel-btn__icon">↩</span>
                <span className="pixel-btn__label">取消</span>
                <span className="pixel-btn__badge">X</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
