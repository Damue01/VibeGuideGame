// ============================================================
// VibeGuide - 第二章：觉醒神殿
// 引导玩家登录IDE并运行第一次AI对话
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useEffects } from '../../effects/useEffects';
import { useLevelProgress } from '../../hooks/useLevelProgress';
import { NpcDialogBubble } from '../../components/NpcDialogBubble';

interface TempleStep {
  id: string;
  title: string;
  description: string;
  npcDialog: string;
}

const STEPS: TempleStep[] = [
  {
    id: 'enter',
    title: '进入神殿',
    description: '祭司迎接你',
    npcDialog: '勇者，欢迎来到觉醒神殿。我是祭司艾拉。我将引导你觉醒与AI精灵对话的能力。首先，让我打开你的武器——',
  },
  {
    id: 'open-ide',
    title: '唤醒武器',
    description: '打开你的IDE',
    npcDialog: '点击下方按钮，我将帮你唤醒你的武器（打开IDE）。如果它没有自动打开，你也可以手动从桌面或开始菜单找到它。',
  },
  {
    id: 'login-guide',
    title: '连接精灵',
    description: '登录IDE账号',
    npcDialog: '很好，武器已经苏醒了！现在你需要“连接”AI精灵——也就是登录你的IDE账号。\n\n在 IDE 中找到“Sign In”或“登录”按钮：\n\n• Cursor：左下角 → 用 GitHub 或 Google 账号登录\n• Trae：左下角 → 用字节跳动账号登录\n• VS Code：先在扩展商店安装 GitHub Copilot 插件，然后用 GitHub 账号登录',
  },
  {
    id: 'test-project',
    title: '准备试炼场',
    description: '创建测试项目文件夹',
    npcDialog: '接下来，让我们创建你的"试炼场"——一个专门用来练习的项目文件夹。\n\n设置好项目名和路径后点击创建，然后在 IDE 中手动打开它：\n• File → Open Folder → 选中该文件夹\n• 或在文件管理器中右键文件夹 → 选择"用 IDE 打开"\n\n右侧笔记里有详细说明。',
  },
  {
    id: 'first-spell',
    title: '释放第一个咒语',
    description: '向AI说一句话',
    npcDialog: '现在来释放你的第一个"咒语"（Prompt）！切换到你已打开的 IDE 窗口，找到 AI 对话窗口（不同 IDE 位置不同：通常在侧边栏、底部面板或聊天图标里）。\n\n对 AI 说：\n"请创建一个 hello.txt 文件，在里面写上：我已觉醒"\n\n记住：AI 不仅能写文件，后续还可以帮你执行安装、启动、部署等操作。',
  },
  {
    id: 'verify',
    title: '验证觉醒',
    description: '检查AI是否响应了你的咒语',
    npcDialog: '让我感应一下...我正在检查你的试炼场中是否出现了 hello.txt 文件...',
  },
  {
    id: 'complete',
    title: '觉醒成功！',
    description: '获得技能奖励',
    npcDialog: '🌟 太棒了！我感受到了AI精灵的回应！你已经成功觉醒了"AI对话术"！你能用自然语言让AI帮你创造任何东西。现在，去创造平原吧，建造属于你的第一座建筑！',
  },
];

export const Chapter2Temple: React.FC = () => {
  const {
    player,
    settings,
    setScreen,
    completeStep,
    setLevelStatus,
    addXP,
    addSkill,
    showNotification,
    updateSettings,
  } = useGameStore();
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
  } = useLevelProgress({ levelId: 'chapter2-temple', steps: STEPS });

  const [projectPath, setProjectPath] = useState(settings.projectPath || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [fileFound, setFileFound] = useState(false);
  const [isOpeningIDE, setIsOpeningIDE] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('my-website');

  // 打开 IDE
  const handleOpenIDE = async () => {
    if (isOpeningIDE) return;
    setIsOpeningIDE(true);
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.openIDE(player.selectedIDE);
        if (success) {
          showNotification('✅ IDE 已打开！');
          handleNext();
        } else {
          showNotification('⚠️ 未能自动打开 IDE，请手动启动后点击下方按鈕继续');
        }
      } else {
        handleNext();
      }
    } finally {
      setIsOpeningIDE(false);
    }
  };

  // 浏览选择文件夹基准路径
  const handleBrowseDir = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        const fullPath = dir + (dir.endsWith('/') || dir.endsWith('\\') ? '' : '/') + projectName;
        setProjectPath(fullPath);
      }
    }
  };

  // 创建文件夹并在 IDE 中打开
  const handleCreateAndOpenProject = async () => {
    if (isCreatingProject) return;
    if (!projectPath) {
      showNotification('⚠️ 请先设置试炼场路径');
      return;
    }
    setIsCreatingProject(true);
    try {
      updateSettings({ projectPath });
      if (window.electronAPI) {
        await window.electronAPI.createProjectDir(projectPath);
      }
      showNotification('📂 试炼场已创建！请在 IDE 中打开该文件夹。');
      setIsCreatingProject(false);
      handleNext();
    } catch (e) {
      setIsCreatingProject(false);
    }
  };

  // 释放第一个咒语 - 指引用户操作后进入检测
  const handleStartSpell = () => {
    handleNext();
    setIsDetecting(true);
  };

  // 轮询检测 hello.txt
  useEffect(() => {
    if (currentStepIndex === 5 && isDetecting && projectPath) {
      const interval = setInterval(async () => {
        if (window.electronAPI) {
          const exists = await window.electronAPI.checkFile(
            projectPath + '/hello.txt'
          );
          if (exists) {
            const hasContent = await window.electronAPI.checkFileContent(
              projectPath + '/hello.txt',
              '觉醒'
            );
            if (hasContent || exists) {
              setFileFound(true);
              setIsDetecting(false);
              clearInterval(interval);
              handleNext();
            }
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentStepIndex, isDetecting, projectPath]);

  const handleManualConfirm = () => {
    setFileFound(true);
    setIsDetecting(false);
    handleNext();
  };

  const handleComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    addXP(80);
    addSkill({ id: 'ai-dialog', name: 'AI对话术', level: 1 });
    completeStep('chapter2-temple', 'complete');
    setLevelStatus('chapter2-temple', 'completed');
    setLevelStatus('chapter3-create', 'available');
    showNotification('🌟 技能觉醒：AI对话术 Lv.1！+80 XP');
    onLevelComplete();
    saveGame();

    setTimeout(() => setScreen('world-map'), 2000);
  };

  return (
    <div className="level-layout">
      <div className="level-header">
        <span className="level-header__title">🏛️ 第二章：觉醒神殿</span>
        <div className="level-header__progress">
          <div className="pixel-progress" style={{ width: 200 }}>
            <div
              className="pixel-progress__fill"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
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
        <div className="level-scene level-scene--temple">
          <div className="npc-container">
            <div className="npc-sprite">🧙‍♀️</div>
            <div className="npc-name">祭司 艾拉</div>
          </div>

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

          {npcDone && !isViewing && (
          <div className="level-actions">
            {currentStepIndex === 0 && (
              <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                继续 →
              </button>
            )}

            {currentStepIndex === 1 && (
              <>
                <button className="pixel-btn pixel-btn--accent" onClick={handleOpenIDE} disabled={isOpeningIDE}>
                  {isOpeningIDE ? '⏳ 正在打开...' : '✨ 唤醒武器（打开IDE）'}
                </button>
                <button className="pixel-btn pixel-btn--small" onClick={handleNext} disabled={isOpeningIDE}>
                  我已手动打开 →
                </button>
              </>
            )}

            {currentStepIndex === 2 && (
              <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                我已登录 →
              </button>
            )}

            {currentStepIndex === 3 && (
              <>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                    项目名：
                  </span>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                    className="pixel-input"
                    style={{ width: 150, fontSize: 12 }}
                    placeholder="my-website"
                  />
                </div>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                    路径：
                  </span>
                  <input
                    type="text"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    className="pixel-input"
                    style={{ width: 240, fontSize: 12 }}
                    placeholder="输入或浏览文件夹路径"
                  />
                  <button className="pixel-btn pixel-btn--small" onClick={handleBrowseDir}>
                    浏览...
                  </button>
                </div>
                <button
                  className="pixel-btn pixel-btn--accent"
                  onClick={handleCreateAndOpenProject}
                  disabled={!projectPath || isCreatingProject}
                >
                  {isCreatingProject ? '⏳ 创建中...' : '📂 创建试炼场'}
                </button>
              </>
            )}

            {currentStepIndex === 4 && (
              <button className="pixel-btn pixel-btn--accent" onClick={handleStartSpell}>
                ✨ 开始施法
              </button>
            )}

            {currentStepIndex === 5 && (
              <>
                <div className="detection-status">
                  <div className={`detection-dot ${fileFound ? 'detection-dot--success' : 'detection-dot--checking'}`} />
                  <span className="pixel-text-cn">
                    {fileFound ? '✅ 检测到 hello.txt！' : '🔍 等待AI精灵的回应...'}
                  </span>
                </div>
                <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                  手动确认：我已完成 →
                </button>
              </>
            )}

            {currentStepIndex === 6 && (
              <button className="pixel-btn pixel-btn--accent pixel-btn--large" onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? '⏳ 处理中...' : '🌟 领取觉醒奖励！'}
              </button>
            )}
          </div>
          )}
        </div>

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
                i === currentStepIndex ? 'task-step--current' : i < currentStepIndex ? 'task-step--completed' : 'task-step--locked'
              }${viewingStepIndex === i ? ' task-step--viewing' : ''}`}
              onClick={i < currentStepIndex ? () => handleViewStep(i) : undefined}
            >
              <div className="task-step__number">{i < currentStepIndex ? '✓' : i + 1}</div>
              <div className="task-step__content">
                <div className="task-step__title">
                  {step.title}
                  {viewingStepIndex === i && <span className="task-step__viewing-tag">👁 回看中</span>}
                </div>
                <div className="task-step__desc">{step.description}</div>
              </div>
            </div>
          ))}

          <div className="pixel-panel" style={{ marginTop: 16, fontSize: 12 }}>
            <p className="pixel-text-cn" style={{ color: 'var(--color-accent)', marginBottom: 8 }}>
              💡 冒险者笔记
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>Vibe Coding 三原则</strong><br />
              1) 描述你想要什么，不必先会怎么做。<br />
              2) 报错直接贴给 AI，让它定位并修复。<br />
              3) 一次一个需求，持续迭代到满意。<br /><br />
              <strong>AI Agent 能力</strong><br />
              除了写代码，AI 还能读写文件、执行命令、安装依赖和启动项目。
            </p>
          </div>

          <div className="pixel-panel" style={{ marginTop: 12, fontSize: 12 }}>
            <p className="pixel-text-cn" style={{ color: '#54a0ff', marginBottom: 8 }}>
              📂 如何在 IDE 中打开文件夹？
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 11, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>方法一：菜单打开</strong><br />
              IDE → File → Open Folder → 选择文件夹<br />
              <strong>方法二：右键打开</strong><br />
              文件管理器中右键文件夹 → &quot;用 IDE 打开&quot;<br />
              <strong>方法三：拖放打开</strong><br />
              把文件夹直接拖到 IDE 窗口中
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
