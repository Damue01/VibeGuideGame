// ============================================================
// VibeGuide - 奖励弹窗组件
// 完成关卡 / 步骤时的华丽弹窗
// ============================================================

import React, { useEffect, useState } from 'react';

export interface RewardPopupProps {
  visible: boolean;
  title: string;        // 如 "🎉 关卡完成！"
  subtitle?: string;    // 如 "铸铁匠 · 第1章"
  xp?: number;          // 经验值
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  onClose: () => void;
}

const RARITY_COLORS: Record<string, { border: string; glow: string; bg: string }> = {
  common: { border: '#98d8c8', glow: '#98d8c840', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  rare: { border: '#54a0ff', glow: '#54a0ff50', bg: 'linear-gradient(135deg, #0c1445 0%, #1a1a40 100%)' },
  epic: { border: '#c56cf0', glow: '#c56cf060', bg: 'linear-gradient(135deg, #2d1b69 0%, #1a0a3e 100%)' },
  legendary: { border: '#ffd700', glow: '#ffd70070', bg: 'linear-gradient(135deg, #3d2e00 0%, #1a1500 100%)' },
};

const RewardPopup: React.FC<RewardPopupProps> = ({
  visible,
  title,
  subtitle,
  xp = 0,
  rarity = 'common',
  onClose,
}) => {
  const [show, setShow] = useState(false);
  const [xpDisplay, setXpDisplay] = useState(0);

  useEffect(() => {
    if (visible) {
      setShow(false);
      setXpDisplay(0);
      // 入场延迟
      requestAnimationFrame(() => setShow(true));
      // XP 滚动计数
      if (xp > 0) {
        const step = Math.max(1, Math.floor(xp / 30));
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= xp) {
            current = xp;
            clearInterval(timer);
          }
          setXpDisplay(current);
        }, 30);
        return () => clearInterval(timer);
      }
    } else {
      setShow(false);
    }
  }, [visible, xp]);

  if (!visible) return null;

  const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.bg,
          border: `3px solid ${colors.border}`,
          boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
          borderRadius: '8px',
          padding: '40px 60px',
          textAlign: 'center',
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)',
          transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          minWidth: '320px',
          imageRendering: 'pixelated' as React.CSSProperties['imageRendering'],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: colors.border,
            marginBottom: '12px',
            textShadow: `0 0 20px ${colors.glow}`,
            animation: show ? 'reward-bounce 0.6s ease' : 'none',
          }}
        >
          {title}
        </div>

        {/* 副标题 */}
        {subtitle && (
          <div
            style={{
              fontSize: '14px',
              color: '#a0a0a0',
              marginBottom: '20px',
              fontFamily: '"Press Start 2P", monospace',
            }}
          >
            {subtitle}
          </div>
        )}

        {/* XP 滚动 */}
        {xp > 0 && (
          <div
            style={{
              margin: '16px 0',
              padding: '12px 24px',
              background: 'rgba(255,215,0,0.1)',
              border: '2px solid #ffd700',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          >
            <span style={{ color: '#ffd700', fontSize: '24px', fontWeight: 'bold' }}>
              +{xpDisplay} XP
            </span>
          </div>
        )}

        {/* 稀有度标签 */}
        <div
          style={{
            marginTop: '16px',
            fontSize: '11px',
            color: colors.border,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          {rarity}
        </div>

        {/* 提示 */}
        <div
          style={{
            marginTop: '24px',
            fontSize: '12px',
            color: '#666',
            animation: 'blink 1.2s step-end infinite',
          }}
        >
          点击任意处继续
        </div>
      </div>
    </div>
  );
};

export default RewardPopup;
