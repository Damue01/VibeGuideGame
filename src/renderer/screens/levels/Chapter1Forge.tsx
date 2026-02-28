// ============================================================
// VibeGuide - 第一章：工具锻造谷
// 引导玩家安装 IDE（Cursor 或 Trae）
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useEffects } from '../../effects/useEffects';
import { useLevelProgress } from '../../hooks/useLevelProgress';
import { NpcDialogBubble } from '../../components/NpcDialogBubble';
import { IDEType, IDEStatus } from '../../../shared/types';

interface ForgeStep {
  id: string;
  title: string;
  description: string;
  npcDialog: string;
}

const STEPS: ForgeStep[] = [
  {
    id: 'welcome',
    title: '抵达锻造谷',
    description: '铁匠NPC迎接你',
    npcDialog: '欢迎来到工具锻造谷！我是铁匠加尔德。要去冒险，首先你需要一件趁手的武器——在我们的世界里，武器就是你的IDE：一个AI编程工具。',
  },
  {
    id: 'choose-ide',
    title: '选择你的武器',
    description: '选择要安装的IDE',
    npcDialog: '我这里有三件神兵利器：\n\n⚔️「Cursor之剑」——灵活锋利，深受冒险者喜爱\n🛡️「Trae之盾」——承受力强，对中文咒语理解极佳\n🔮「VSCode之杖」——经典法杖，搭配Copilot精灵后同样威力无穷\n\n你选哪件？',
  },
  {
    id: 'download',
    title: '锻造武器',
    description: '下载并安装IDE',
    npcDialog: '好的选择！现在点击下方按钮，前往下载页面。下载后安装它，就像锻造一把武器需要一点时间。安装过程中我给你讲讲这把武器的故事...',
  },
  {
    id: 'detect',
    title: '检验武器',
    description: '等待检测IDE安装完成',
    npcDialog: '我正在感应你的武器...让我看看锻造是否成功...',
  },
  {
    id: 'complete',
    title: '锻造完成！',
    description: '获得武器奖励',
    npcDialog: '太棒了！🎉 武器锻造成功！我能感受到它的力量。带上它继续前进吧，勇者！前往觉醒神殿，学习如何与AI精灵对话。',
  },
];

const IDE_INFO: Record<string, { name: string; url: string; weapon: string; icon: string }> = {
  cursor: {
    name: 'Cursor',
    url: 'https://cursor.com/home',
    weapon: 'Cursor之剑',
    icon: '⚔️',
  },
  trae: {
    name: 'Trae',
    url: 'https://www.trae.ai',
    weapon: 'Trae之盾',
    icon: '🛡️',
  },
  vscode: {
    name: 'VS Code',
    url: 'https://code.visualstudio.com',
    weapon: 'VSCode之杖',
    icon: '🔮',
  },
};

export const Chapter1Forge: React.FC = () => {
  const { player, setScreen, completeStep, setLevelStatus, addXP, addItem, showNotification, selectIDE } =
    useGameStore();
  const { onLevelComplete, onDetectSuccess } = useEffects();

  const {
    currentStepIndex,
    currentStep,
    npcDone,
    isCompleting,
    setIsCompleting,
    handleNpcComplete,
    handleNext,
    saveGame,
    viewingStepIndex,
    isViewing,
    displayedNpcDialog,
    handleViewStep,
    handleExitViewing,
  } = useLevelProgress({ levelId: 'chapter1-forge', steps: STEPS });

  const [selectedIDE, setSelectedIDELocal] = useState<IDEType>(player.selectedIDE);
  const [ideStatus, setIdeStatus] = useState<IDEStatus | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const ideInfo = IDE_INFO[selectedIDE];

  // 检测 IDE
  const detectIDE = useCallback(async () => {
    if (!window.electronAPI) {
      // 开发模式下模拟
      return { type: selectedIDE, installed: false } as IDEStatus;
    }
    return window.electronAPI.detectIDE(selectedIDE);
  }, [selectedIDE]);

  // 轮询检测
  useEffect(() => {
    if (currentStepIndex === 3 && isDetecting) {
      const interval = setInterval(async () => {
        const status = await detectIDE();
        setIdeStatus(status);
        if (status.installed) {
          setIsDetecting(false);
          clearInterval(interval);
          onDetectSuccess();
          handleNext();
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentStepIndex, isDetecting, detectIDE, onDetectSuccess, handleNext]);

  const handleIDESelect = (ide: IDEType) => {
    setSelectedIDELocal(ide);
    selectIDE(ide);
  };

  const handleDownload = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(ideInfo.url);
    } else {
      window.open(ideInfo.url, '_blank');
    }
    // 进入检测步骤
    handleNext();
    setIsDetecting(true);
  };

  const handleSkipDetection = () => {
    // 允许手动确认（已安装但检测不到的情况）
    handleNext();
  };

  const handleComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    // 给奖励
    addXP(50);
    addItem({
      id: `${selectedIDE}-weapon`,
      name: ideInfo.weapon,
      description: `你在锻造谷获得的第一件武器——${ideInfo.name}`,
      rarity: 'rare',
      icon: ideInfo.icon,
    });
    completeStep('chapter1-forge', 'complete');
    setLevelStatus('chapter1-forge', 'completed');
    setLevelStatus('chapter2-temple', 'available');
    showNotification(`🎉 获得 ${ideInfo.weapon}！+50 XP`);
    onLevelComplete();
    saveGame();

    setTimeout(() => {
      setScreen('world-map');
    }, 2000);
  };

  return (
    <div className="level-layout">
      {/* 顶栏 */}
      <div className="level-header">
        <span className="level-header__title">⚒️ 第一章：工具锻造谷</span>
        <div className="level-header__progress">
          <div className="pixel-progress" style={{ width: 200 }}>
            <div
              className="pixel-progress__fill"
              style={{
                width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
          <span className="pixel-text" style={{ fontSize: 10 }}>
            {currentStepIndex + 1}/{STEPS.length}
          </span>
        </div>
        <button className="pixel-btn pixel-btn--small" onClick={() => setScreen('world-map')}>
          📍 地图
        </button>
      </div>

      <div className="level-body">
        {/* 左侧场景 */}
        <div className="level-scene level-scene--forge">
          {/* NPC */}
          <div className="npc-container">
            <div className="npc-sprite">🧔</div>
            <div className="npc-name">铁匠 加尔德</div>
          </div>

          {/* 对话气泡 */}
          <NpcDialogBubble
            text={displayedNpcDialog}
            key={isViewing ? `view-${viewingStepIndex}` : `step-${currentStepIndex}`}
            onTypingComplete={handleNpcComplete}
          />

          {/* 回看模式提示 */}
          {isViewing && (
            <div className="level-actions">
              <button className="pixel-btn pixel-btn--primary" onClick={handleExitViewing}>
                ↩ 回到当前步骤
              </button>
            </div>
          )}

          {/* 操作按钮（回看模式下隐藏） */}
          {npcDone && !isViewing && (
          <div className="level-actions">
            {currentStepIndex === 0 && (
              <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                继续 →
              </button>
            )}

            {currentStepIndex === 1 && (
              <>
                <button
                  className={`pixel-btn ${selectedIDE === 'cursor' ? 'pixel-btn--accent' : ''}`}
                  onClick={() => handleIDESelect('cursor')}
                >
                  ⚔️ Cursor之剑
                </button>
                <button
                  className={`pixel-btn ${selectedIDE === 'trae' ? 'pixel-btn--accent' : ''}`}
                  onClick={() => handleIDESelect('trae')}
                >
                  🛡️ Trae之盾
                </button>
                <button
                  className={`pixel-btn ${selectedIDE === 'vscode' ? 'pixel-btn--accent' : ''}`}
                  onClick={() => handleIDESelect('vscode')}
                >
                  🔮 VSCode之杖
                </button>
                <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                  确认选择 →
                </button>
              </>
            )}

            {currentStepIndex === 2 && (
              <button className="pixel-btn pixel-btn--accent" onClick={handleDownload}>
                🔗 前往下载 {ideInfo.name}
              </button>
            )}

            {currentStepIndex === 3 && (
              <>
                <div className="detection-status">
                  <div
                    className={`detection-dot ${
                      ideStatus?.installed ? 'detection-dot--success' : 'detection-dot--checking'
                    }`}
                  />
                  <span className="pixel-text-cn">
                    {ideStatus?.installed
                      ? `✅ 检测到 ${ideInfo.name}！`
                      : `🔍 正在检测 ${ideInfo.name} 安装状态...`}
                  </span>
                </div>
                <button className="pixel-btn pixel-btn--small" onClick={handleSkipDetection}>
                  我已安装，手动确认 →
                </button>
              </>
            )}

            {currentStepIndex === 4 && (
              <button className="pixel-btn pixel-btn--accent pixel-btn--large" onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? '⏳ 处理中...' : '🎉 领取奖励！'}
              </button>
            )}
          </div>
          )}
        </div>

        {/* 右侧任务面板 */}
        <div className="level-tasks">
          <div className="level-tasks__header">
            <h3 className="level-tasks__title">📋 任务步骤</h3>
            <div className="level-tasks__progress">
              <div className="level-tasks__progress-bar">
                <div
                  className="level-tasks__progress-fill"
                  style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
                />
              </div>
              <span>{currentStepIndex + 1}/{STEPS.length}</span>
            </div>
          </div>
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className={`task-step ${
                i === currentStepIndex
                  ? 'task-step--current'
                  : i < currentStepIndex
                  ? 'task-step--completed'
                  : 'task-step--locked'
              }${viewingStepIndex === i ? ' task-step--viewing' : ''}`}
              onClick={i < currentStepIndex ? () => handleViewStep(i) : undefined}
            >
              <div className="task-step__number">
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <div className="task-step__content">
                <div className="task-step__title">
                  {step.title}
                  {viewingStepIndex === i && <span className="task-step__viewing-tag">👁 回看中</span>}
                </div>
                <div className="task-step__desc">{step.description}</div>
              </div>
            </div>
          ))}

          {/* 知识小贴士 */}
          <div className="pixel-panel" style={{ marginTop: 16, fontSize: 12 }}>
            <p className="pixel-text-cn" style={{ color: 'var(--color-accent)', marginBottom: 8 }}>
              💡 冒险者笔记
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>什么是IDE？</strong><br />
              IDE就像冒险者的工作台。在Vibe Coding的世界里，IDE是你和AI精灵对话的地方。
              你在这里输入你的想法（Prompt），AI就会帮你生成代码。就像对精灵许愿一样！✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
