// ============================================================
// VibeGuide - 帮助面板组件
// "遇到问题？问 AI！" — 可点击复制的建议提示列表
// @deprecated 已被 TroubleShootPanel 替代，不再用于主线关卡流程
// ============================================================
import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import './CommandBlock.css'; // shared styles

interface Props {
  /** 帮助建议列表 */
  tips: string[];
  /** 标题，默认 "🤔 遇到问题？问 AI！" */
  title?: string;
}

export const HelpPanel: React.FC<Props> = ({
  tips,
  title = '🤔 遇到问题？问 AI！',
}) => {
  const { showNotification } = useGameStore();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = useCallback((tip: string, idx: number) => {
    navigator.clipboard.writeText(tip).then(() => {
      showNotification('📋 已复制到剪贴板！');
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    });
  }, [showNotification]);

  return (
    <div className="pixel-panel help-panel">
      <p className="help-panel__title pixel-text-cn">{title}</p>
      <div className="help-panel__tips">
        {tips.map((tip, i) => (
          <div
            key={i}
            className={`help-panel__tip ${copiedIdx === i ? 'help-panel__tip--copied' : ''}`}
            onClick={() => handleCopy(tip, i)}
            title="点击复制"
          >
            <span className="help-panel__tip-icon">💬</span>
            <span className="help-panel__tip-text pixel-text-cn">
              &quot;{tip}&quot;
            </span>
            <span className="help-panel__tip-copy">
              {copiedIdx === i ? '✓' : '📋'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
