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
    npcDialog: '勇者，欢迎来到觉醒神殿。我是祭司艾拉。我将引导你觉醒与AI精灵对话的能力——学会和AI说话，让它帮你实现你的想法。',
  },
  {
    id: 'login-guide',
    title: '连接精灵',
    description: '登录你的AI工具',
    npcDialog: '首先，你需要让你的武器（IDE）连上AI精灵——也就是登录账号。\n\n打开你的 IDE，找到"登录"或"Sign In"按钮：\n\n• Cursor：左下角 → 用 GitHub 或 Google 账号登录\n• Trae：左下角 → 用字节跳动账号登录\n• VS Code：先在扩展商店搜索安装 GitHub Copilot，然后用 GitHub 账号登录\n\n登录好了就点下方按钮继续。',
  },
  {
    id: 'test-project',
    title: '准备试炼场',
    description: '创建练习用的文件夹',
    npcDialog: '接下来，让我们创建你的"试炼场"——一个专门用来练习的文件夹。\n\n设置好名字和保存位置后点击创建，我会自动帮你用 IDE 打开它。',
  },
  {
    id: 'first-spell',
    title: '释放第一个咒语',
    description: '对AI说一句话',
    npcDialog: '试炼场已经准备好了！现在来释放你的第一个"咒语"！\n\n在 IDE 里找到 AI 对话窗口（通常在侧边栏或底部，找找聊天图标💬），然后对 AI 说：\n\n"请帮我创建一个 hello.txt 文件，在里面写上：我已觉醒"\n\n说完之后，AI 会自动帮你创建这个文件。',
  },
  {
    id: 'verify',
    title: '验证觉醒',
    description: '检查AI是否帮你完成了',
    npcDialog: '让我感应一下...我正在检查你的试炼场中是否出现了 hello.txt 文件...',
  },
  {
    id: 'complete',
    title: '觉醒成功！',
    description: '获得技能奖励',
    npcDialog: '🌟 太棒了！我感受到了AI精灵的回应！你已经成功觉醒了"AI对话术"！\n\n记住：你只需要用自然语言告诉AI你想要什么，它就会帮你做到。\n\n现在，去创造平原吧，建造属于你的第一座建筑！',
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
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('my-website');

  // 浏览选择文件夹基准路径
  const handleBrowseDir = async () => {
    if (window.electronAPI) {
      // Electron 环境：使用原生目录选择对话框
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        const fullPath = dir + (dir.endsWith('/') || dir.endsWith('\\') ? '' : '/') + projectName;
        setProjectPath(fullPath);
      }
    } else if ('showDirectoryPicker' in window) {
      // 网页端：使用 File System Access API
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        const fullPath = dirHandle.name + '/' + projectName;
        setProjectPath(fullPath);
        showNotification('📂 已选择目录：' + dirHandle.name);
      } catch (e: any) {
        // 用户取消选择不做处理
        if (e?.name !== 'AbortError') {
          showNotification('⚠️ 无法打开目录选择器，请直接在输入框中填写路径');
        }
      }
    } else {
      // 浏览器不支持 File System Access API
      showNotification('⚠️ 当前浏览器不支持目录选择，请直接在输入框中手动填写完整路径（如 C:/Projects/' + projectName + '）');
    }
  };

  // 创建文件夹并自动用 IDE 打开
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
        // 自动用 IDE 打开该文件夹
        const opened = await window.electronAPI.openIDE(player.selectedIDE, projectPath);
        if (opened) {
          showNotification('📂 试炼场已创建，IDE 已自动打开！');
        } else {
          showNotification('📂 试炼场已创建！请手动在 IDE 中打开该文件夹。');
        }
      } else {
        showNotification('💡 网页端无法自动创建，请手动在电脑上创建目录：' + projectPath);
      }
      setIsCreatingProject(false);
      handleNext();
    } catch (e) {
      setIsCreatingProject(false);
      showNotification('⚠️ 创建失败，请手动创建目录：' + projectPath);
    }
  };

  // 释放第一个咒语 - 指引用户操作后进入检测
  const handleStartSpell = () => {
    handleNext();
    setIsDetecting(true);
  };

  // 轮询检测 hello.txt
  useEffect(() => {
    if (currentStepIndex === 4 && isDetecting && projectPath) {
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
              <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                我已登录 →
              </button>
            )}

            {currentStepIndex === 2 && (
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
                    保存位置：
                  </span>
                  <input
                    type="text"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    className="pixel-input"
                    style={{ width: 240, fontSize: 12 }}
                    placeholder="点击浏览选择文件夹"
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
                  {isCreatingProject ? '⏳ 创建中...' : '📂 创建试炼场并打开'}
                </button>
              </>
            )}

            {currentStepIndex === 3 && (
              <button className="pixel-btn pixel-btn--accent" onClick={handleStartSpell}>
                ✨ 开始施法
              </button>
            )}

            {currentStepIndex === 4 && (
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

            {currentStepIndex === 5 && (
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
              <strong>和AI说话的三个秘诀</strong><br />
              1) 直接说你想要什么结果就好。<br />
              2) 遇到报错？直接截图或复制给AI。<br />
              3) 一次只说一个要求，效果最好。<br /><br />
              <strong>AI 能帮你做什么？</strong><br />
              创建文件、写内容、装软件、启动网站、修复问题……你只管说，它来做。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
