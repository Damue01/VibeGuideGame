// ============================================================
// VibeGuide - 咒语区块组件（Prompt Block）
// 像素风对话气泡，展示「对 AI 说的话」+ 一键复制
// 用于替代 CommandBlock，体现 Vibe Coding "用自然语言与 AI 对话" 的核心理念
// ============================================================
import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import './PromptBlock.css';

interface Props {
  /** 要对 AI 说的话（Prompt 内容） */
  prompt: string;
  /** 标签描述，如 "✨ 对 AI 说：" */
  label?: string;
  /** 可选：为什么这样说？展开解释 */
  explanation?: string;
  /** 可选：职业标签，如 "产品策划版" */
  classTag?: string;
}

export const PromptBlock: React.FC<Props> = ({
  prompt,
  label = '✨ 对 AI 说：',
  explanation,
  classTag,
}) => {
  const { showNotification } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prompt).then(() => {
      showNotification('📋 咒语已复制！去 IDE 中对 AI 说吧！');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [prompt, showNotification]);

  return (
    <div className="pixel-panel prompt-block">
      <div className="prompt-block__header">
        {classTag && (
          <span className="prompt-block__class-tag">{classTag}</span>
        )}
        <p className="prompt-block__label pixel-text-cn">{label}</p>
      </div>

      <div className="prompt-block__bubble">
        <div className="prompt-block__avatar">💬</div>
        <pre className="prompt-block__text pixel-text-cn">
          {prompt}
        </pre>
      </div>

      <div className="prompt-block__actions">
        <button
          className={`pixel-btn pixel-btn--small prompt-block__copy ${copied ? 'prompt-block__copy--done' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✓ 已复制' : '📋 复制咒语'}
        </button>

        {explanation && (
          <button
            className="pixel-btn pixel-btn--small prompt-block__explain-btn"
            onClick={() => setShowExplain(!showExplain)}
          >
            {showExplain ? '收起' : '💡 为什么这样说？'}
          </button>
        )}
      </div>

      {explanation && showExplain && (
        <div className="prompt-block__explanation pixel-text-cn">
          {explanation}
        </div>
      )}
    </div>
  );
};
