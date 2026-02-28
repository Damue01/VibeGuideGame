// ============================================================
// VibeGuide - 排错引导面板
// 当用户遇到问题时，指导用户如何与 AI 对话来解决
// 替代旧的 HelpPanel，强调 "把问题丢给 AI" 的 Vibe Coding 理念
// ============================================================
import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import './PromptBlock.css'; // shared styles

export interface TroubleTip {
  /** 什么情况下出问题 */
  situation: string;
  /** 对 AI 说什么（可点击复制） */
  prompt: string;
}

interface Props {
  /** 排错建议列表 */
  tips: TroubleTip[];
  /** 标题 */
  title?: string;
}

export const TroubleShootPanel: React.FC<Props> = ({
  tips,
  title = '🛠️ 遇到问题？这样和 AI 说：',
}) => {
  const { showNotification } = useGameStore();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('📋 已复制！粘贴到 IDE 的 AI 对话框中');
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    });
  }, [showNotification]);

  return (
    <div className="pixel-panel troubleshoot-panel">
      <p className="troubleshoot-panel__title pixel-text-cn">{title}</p>
      <div className="troubleshoot-panel__items">
        {tips.map((tip, i) => (
          <div key={i} className="troubleshoot-panel__item">
            <span className="troubleshoot-panel__situation pixel-text-cn">
              ⚠️ {tip.situation}
            </span>
            <span
              className={`troubleshoot-panel__action pixel-text-cn ${copiedIdx === i ? 'troubleshoot-panel__action--copied' : ''}`}
              onClick={() => handleCopy(tip.prompt, i)}
              title="点击复制这句话"
            >
              → 对 AI 说：&quot;{tip.prompt}&quot;{' '}
              <span style={{ fontSize: 10, opacity: 0.6 }}>
                {copiedIdx === i ? '✓ 已复制' : '📋'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
