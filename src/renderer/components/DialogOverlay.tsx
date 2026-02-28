// ============================================================
// VibeGuide - NPC 对话覆盖层
// 像素风对话框 + 打字机效果 + 打字音效 + 微震
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAudio } from '../audio/useAudio';
import { useEffectsContext } from '../effects/EffectsContext';

export const DialogOverlay: React.FC = () => {
  const { ui, advanceDialog } = useGameStore();
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const charCount = useRef(0);
  const currentLine = ui.dialogQueue[0] || '';
  const { playTyping } = useAudio();
  const { shakeRef } = useEffectsContext();

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    charCount.current = 0;
    // 新行出现时微震
    if (currentLine) {
      shakeRef.current?.shake(2, 120);
    }
  }, [currentLine, shakeRef]);

  useEffect(() => {
    if (!currentLine) return;

    if (displayedText.length < currentLine.length) {
      const timer = setTimeout(() => {
        charCount.current += 1;
        setDisplayedText(currentLine.substring(0, charCount.current));
        // 每 2 个字符播放打字音效
        if (charCount.current % 2 === 0) {
          playTyping();
        }
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [displayedText, currentLine, playTyping]);

  const handleClick = () => {
    if (isTyping) {
      // 跳过打字动画
      setDisplayedText(currentLine);
      setIsTyping(false);
    } else {
      advanceDialog();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleClick}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        {ui.dialogSpeaker && (
          <div className="dialog-box__speaker">{ui.dialogSpeaker}</div>
        )}
        <div className="dialog-box__text" onClick={handleClick}>
          {displayedText}
          {isTyping && <span style={{ opacity: 0.5 }}>▌</span>}
        </div>
        {!isTyping && (
          <div className="dialog-box__indicator">
            点击继续 ▼
          </div>
        )}
      </div>
    </div>
  );
};
