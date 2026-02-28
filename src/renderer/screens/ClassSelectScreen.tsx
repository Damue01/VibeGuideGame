// ============================================================
// VibeGuide - 职业选择画面
// 三大职业：产品策划 / 开发工程师 / 美术设计师
// ============================================================
import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerClass, ClassInfo } from '../../shared/types';
import './ClassSelectScreen.css';

const CLASSES: ClassInfo[] = [
  {
    id: 'product',
    name: '产品策划师',
    title: '需求洞察者',
    description:
      '擅长将模糊的想法转化为清晰的需求。你的超能力是写出让AI精灵完全理解你意图的"咒语"（Prompt）。',
    skill: '需求分析',
    skillDescription: '将复杂需求拆解为可执行的任务',
    color: '#3498db',
    icon: '🎯',
  },
  {
    id: 'developer',
    name: '开发工程师',
    title: '代码驾驭者',
    description:
      '能理解AI生成的代码结构，知道如何调试和部署。你是团队中把想法变为现实的关键人物。',
    skill: '代码理解',
    skillDescription: '快速看懂AI生成的代码并定位问题',
    color: '#2ecc71',
    icon: '⚡',
  },
  {
    id: 'artist',
    name: '美术设计师',
    title: '视觉表达者',
    description:
      '用精准的自然语言描述视觉效果，让AI帮你实现脑海中的画面。CSS和设计是你的战场。',
    skill: '视觉直觉',
    skillDescription: '用语言精确描述颜色、布局、动画',
    color: '#e94560',
    icon: '🎨',
  },
];

export const ClassSelectScreen: React.FC = () => {
  const { selectClass, setScreen, setPlayerName, player } = useGameStore();
  const [selected, setSelected] = useState<PlayerClass | null>(null);
  const [name, setName] = useState(player.name || '');
  const [step, setStep] = useState<'name' | 'class'>('name');

  const handleNameConfirm = () => {
    if (name.trim()) {
      setPlayerName(name.trim());
      setStep('class');
    }
  };

  const handleClassSelect = (cls: PlayerClass) => {
    setSelected(cls);
  };

  const handleConfirm = () => {
    if (selected) {
      selectClass(selected);
      // 解锁第一章
      const store = useGameStore.getState();
      store.setLevelStatus('prologue', 'completed');
      store.setLevelStatus('chapter1-forge', 'available');
      store.setScreen('world-map');
    }
  };

  const selectedClass = CLASSES.find((c) => c.id === selected);

  if (step === 'name') {
    return (
      <div className="screen class-screen">
        <div className="name-input-container pixel-panel">
          <h2 className="pixel-text-cn">勇者，你叫什么名字？</h2>
          <input
            className="pixel-input"
            type="text"
            placeholder="输入你的名字..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
            maxLength={20}
            autoFocus
          />
          <button
            className="pixel-btn pixel-btn--primary"
            onClick={handleNameConfirm}
            disabled={!name.trim()}
          >
            确认 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen class-screen">
      <h2 className="pixel-text-cn class-title">
        {name}，选择你的职业
      </h2>
      <p className="pixel-text-cn class-hint">
        （职业影响任务风格和Prompt模板，随时可切换）
      </p>

      <div className="class-cards">
        {CLASSES.map((cls) => (
          <div
            key={cls.id}
            className={`class-card pixel-panel ${selected === cls.id ? 'class-card--selected' : ''}`}
            style={{ '--class-color': cls.color } as React.CSSProperties}
            onClick={() => handleClassSelect(cls.id)}
          >
            <div className="class-card__icon">{cls.icon}</div>
            <h3 className="class-card__name pixel-text-cn">{cls.name}</h3>
            <p className="class-card__title">{cls.title}</p>
            <p className="class-card__desc pixel-text-cn">{cls.description}</p>
            <div className="class-card__skill">
              <span className="skill-label">技能：</span>
              <span className="skill-name">{cls.skill}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="class-confirm">
          <p className="pixel-text-cn">
            选择 <strong style={{ color: selectedClass.color }}>{selectedClass.name}</strong>？
          </p>
          <button className="pixel-btn pixel-btn--accent pixel-btn--large" onClick={handleConfirm}>
            ⚔️ 踏上冒险之旅！
          </button>
        </div>
      )}
    </div>
  );
};
