// ============================================================
// VibeGuide - NPC 对话气泡（带打字机效果 + 音效 + 微震）
// 用于关卡场景中的 NPC 对话展示
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../audio/useAudio';
import { useEffectsContext } from '../effects/EffectsContext';

interface NpcDialogBubbleProps {
  text: string;
  /** NPC 名字 / 头衔 */
  speaker?: string;
  /** 表情标识 emoji */
  emotion?: string;
  /** 每个字符的打字延迟 (ms)，默认 25 */
  speed?: number;
  /** 打字完成后的回调 */
  onTypingComplete?: () => void;
}

export const NpcDialogBubble: React.FC<NpcDialogBubbleProps> = ({
  text,
  speaker,
  emotion,
  speed = 25,
  onTypingComplete,
}) => {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const charIndex = useRef(0);
  const { playTyping } = useAudio();
  const { shakeRef } = useEffectsContext();

  // 当文本变化时重置打字机
  useEffect(() => {
    setDisplayed('');
    setIsTyping(true);
    charIndex.current = 0;

    // 新对话出现时微震
    shakeRef.current?.shake(2, 150);
  }, [text, shakeRef]);

  // 打字机效果
  useEffect(() => {
    if (!text || charIndex.current >= text.length) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      charIndex.current += 1;
      setDisplayed(text.substring(0, charIndex.current));

      // 每 2 个字符播放一次打字音效（避免太密集）
      if (charIndex.current % 2 === 0) {
        playTyping();
      }

      if (charIndex.current >= text.length) {
        setIsTyping(false);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayed, text, speed, playTyping]);

  // ref 存储回调，避免父组件重渲染导致依赖变化而重复触发
  const onCompleteRef = useRef(onTypingComplete);
  useEffect(() => { onCompleteRef.current = onTypingComplete; });

  // 打字完成时通知父组件（仅在 isTyping / displayed 变更时检查）
  useEffect(() => {
    if (!isTyping && displayed.length > 0) {
      onCompleteRef.current?.();
    }
  }, [isTyping, displayed]);

  // 点击跳过打字动画
  const handleClick = () => {
    if (isTyping) {
      charIndex.current = text.length;
      setDisplayed(text);
      setIsTyping(false);
    }
  };

  return (
    <div
      className="npc-dialog-bubble"
      style={{ marginTop: 24, whiteSpace: 'pre-line' }}
      onClick={handleClick}
      title={isTyping ? '点击跳过' : undefined}
    >
      {/* 说话人标签 */}
      {speaker && (
        <div className="npc-dialog-bubble__speaker">
          {emotion && <span className="npc-dialog-bubble__emotion">{emotion}</span>}
          {speaker}
        </div>
      )}
      <div className="npc-dialog-bubble__body">
        {displayed}
        {isTyping && <span className="npc-dialog-bubble__cursor">▌</span>}
      </div>
    </div>
  );
};
