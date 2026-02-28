// ============================================================
// VibeGuide - 开场 CG / 故事介绍
// 打字机效果展示世界观
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import './IntroScreen.css';

const INTRO_LINES = [
  '在遥远的数字大陆上，曾经有无数美妙的创造...',
  '人们用"代码语言"构建出网站、应用、游戏——',
  '但这门古老的语言，只有少数人能掌握。',
  '',
  '直到有一天，AI精灵苏醒了。',
  '',
  '它们能理解人类的自然语言，',
  '将你的想法直接转化为代码，',
  '让每一个人都拥有了"创造"的力量。',
  '',
  '这就是——Vibe Coding。',
  '',
  '现在，数字大陆需要新的建造者。',
  '勇者，你准备好开始冒险了吗？',
];

export const IntroScreen: React.FC = () => {
  const { setScreen } = useGameStore();
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [allLines, setAllLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(true);

  // 打字机效果
  useEffect(() => {
    if (currentLine >= INTRO_LINES.length) {
      return;
    }

    const line = INTRO_LINES[currentLine];

    if (line === '') {
      // 空行直接完成
      setAllLines((prev) => [...prev, '']);
      setCurrentLine((prev) => prev + 1);
      return;
    }

    if (charIndex < line.length) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setDisplayedText(line.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // 当前行打完，下一行
      setIsTyping(false);
      const timer = setTimeout(() => {
        setAllLines((prev) => [...prev, line]);
        setDisplayedText('');
        setCharIndex(0);
        setCurrentLine((prev) => prev + 1);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentLine, charIndex]);

  const handleSkip = useCallback(() => {
    setScreen('class-select');
  }, [setScreen]);

  const handleClick = useCallback(() => {
    if (currentLine >= INTRO_LINES.length) {
      setScreen('class-select');
      return;
    }
    // 点击加速：直接显示当前行
    if (isTyping) {
      const line = INTRO_LINES[currentLine];
      setAllLines((prev) => [...prev, line]);
      setDisplayedText('');
      setCharIndex(0);
      setCurrentLine((prev) => prev + 1);
    }
  }, [currentLine, isTyping, setScreen]);

  const isComplete = currentLine >= INTRO_LINES.length;

  // 自动滚动到最新行
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [allLines, displayedText]);

  // 渐隐基准仅依赖已完成行数（单调递增，避免正在打字的行导致闪烁）
  const fadeBase = allLines.length;

  return (
    <div className="screen intro-screen" onClick={handleClick}>
      <div className="intro-text-container">
        {/* 上部留白，让第一行出现在容器中间 */}
        <div className="intro-spacer" />
        {allLines.map((line, i) => {
          const distFromEnd = fadeBase - 1 - i;
          const fadeClass = distFromEnd >= 5 ? 'intro-line--faded-3'
            : distFromEnd >= 3 ? 'intro-line--faded-2'
            : distFromEnd >= 1 ? 'intro-line--faded-1'
            : '';
          return (
            <p key={i} className={`intro-line pixel-text-cn ${fadeClass}`}>
              {line || '\u00A0'}
            </p>
          );
        })}
        {!isComplete && displayedText && (
          <p className="intro-line intro-line--current pixel-text-cn">
            {displayedText}
            <span className="intro-cursor">▌</span>
          </p>
        )}
        {/* 滚动锚点 */}
        <div ref={scrollAnchorRef} className="intro-scroll-anchor" />
        {/* 下部留白 */}
        <div className="intro-spacer" />
      </div>

      {isComplete && (
        <button className="pixel-btn pixel-btn--primary pixel-btn--large intro-continue" onClick={handleSkip}>
          开始冒险 →
        </button>
      )}

      {!isComplete && (
        <button className="pixel-btn pixel-btn--small intro-skip" onClick={handleSkip}>
          跳过 »
        </button>
      )}
    </div>
  );
};
