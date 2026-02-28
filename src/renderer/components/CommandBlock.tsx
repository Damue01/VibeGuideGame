// ============================================================
// VibeGuide - 命令区块组件
// 像素风终端命令展示 + 一键复制
// @deprecated 已被 PromptBlock 替代，不再用于主线关卡流程
// ============================================================
import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import './CommandBlock.css';

interface Props {
  /** 命令文本 */
  cmd: string;
  /** 标签描述，如 "⌨️ 在终端中输入：" */
  label?: string;
}

export const CommandBlock: React.FC<Props> = ({ cmd, label }) => {
  const { showNotification } = useGameStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cmd).then(() => {
      showNotification('📋 已复制到剪贴板！');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [cmd, showNotification]);

  return (
    <div className="pixel-panel command-block">
      {label && (
        <p className="command-block__label pixel-text-cn">{label}</p>
      )}
      <div className="command-block__code-area">
        <div className="command-block__line-numbers">
          {cmd.split('\n').map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre className="command-block__code">
          {cmd.split('\n').map((line, i) => (
            <span key={i} className="command-block__line">
              <span className="command-block__prompt">$</span> {highlightLine(line)}
              {'\n'}
            </span>
          ))}
        </pre>
      </div>
      <button
        className={`pixel-btn pixel-btn--small command-block__copy ${copied ? 'command-block__copy--done' : ''}`}
        onClick={handleCopy}
      >
        {copied ? '✓ 已复制' : '📋 复制命令'}
      </button>
    </div>
  );
};

/** 简单的命令语法高亮 */
function highlightLine(line: string): React.ReactNode {
  // 匹配命令关键词
  const keywords = ['npm', 'npx', 'cd', 'git', 'node', 'mkdir', 'code', 'cursor', 'trae'];
  const flags = /(\s--?\w+[-\w]*)/g;
  const strings = /("[^"]*"|'[^']*')/g;

  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  // 先处理第一个词（通常是命令）
  const firstSpace = remaining.indexOf(' ');
  if (firstSpace > 0) {
    const firstWord = remaining.slice(0, firstSpace);
    if (keywords.includes(firstWord)) {
      parts.push(<span key={key++} className="cmd-keyword">{firstWord}</span>);
      remaining = remaining.slice(firstSpace);
    }
  }

  // 简单处理剩余部分：flags 和 strings
  const tokens = remaining.split(/(\s--?\w+[-\w]*|"[^"]*"|'[^']*')/g);
  for (const token of tokens) {
    if (!token) continue;
    if (flags.test(token)) {
      flags.lastIndex = 0;
      parts.push(<span key={key++} className="cmd-flag">{token}</span>);
    } else if (strings.test(token)) {
      strings.lastIndex = 0;
      parts.push(<span key={key++} className="cmd-string">{token}</span>);
    } else {
      parts.push(<span key={key++}>{token}</span>);
    }
  }

  return parts.length > 0 ? parts : remaining;
}
