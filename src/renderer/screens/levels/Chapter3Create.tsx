// ============================================================
// VibeGuide - 第三章：创造平原 · 真正的 Vibe Coding
// 核心体验：用户只需和 AI 对话，AI 负责执行技术操作
// ============================================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useEffects } from '../../effects/useEffects';
import { useLevelProgress } from '../../hooks/useLevelProgress';
import { NpcDialogBubble } from '../../components/NpcDialogBubble';
import { PromptBlock } from '../../components/PromptBlock';
import { TroubleShootPanel } from '../../components/TroubleShootPanel';

interface CreateStep {
  id: string;
  title: string;
  description: string;
  npcDialog: string;
}

const STEPS: CreateStep[] = [
  {
    id: 'arrive',
    title: '踏入创造平原',
    description: '建筑师NPC迎接你',
    npcDialog:
      '勇者，欢迎来到创造平原！我是建筑师洛恩。\n\n从这一章开始，你不需要记命令，不需要碰终端。你只需要告诉 AI 你想建造什么，剩下的执行都交给 AI Agent。\n\n你的目标：建造一座属于你的 React 魔法城堡。',
  },
  {
    id: 'create-project',
    title: '施展蓝图咒语',
    description: '让 AI 创建 Vite + React 项目',
    npcDialog:
      '先让 AI 在当前文件夹初始化项目蓝图。你只要说"帮我初始化项目"，AI 就会自动执行创建与依赖安装。\n\n完成后，我会感应 `vite.config` 是否出现。',
  },
  {
    id: 'vibe-coding',
    title: '施展建造魔法',
    description: '用自然语言描述你的网站',
    npcDialog:
      '蓝图已就位！现在进入 Vibe Coding 核心：描述你想要的网站。\n\n我准备了职业版咒语，你可以直接发给 AI，也可以在此基础上继续补充。',
  },
  {
    id: 'preview',
    title: '点亮灯塔',
    description: '让 AI 启动开发服务器并预览',
    npcDialog:
      '城堡已经有雏形了！下一步，让 AI 帮你启动开发服务器并预览效果。\n\n我会检测 5173 端口是否点亮。',
  },
  {
    id: 'iterate',
    title: '打磨城堡',
    description: '继续与 AI 迭代优化',
    npcDialog:
      '真正的 Vibe Coding，不是一次成品，而是不断迭代。\n\n不满意哪里，就继续告诉 AI：“再改一点”。一次只提一个需求，效果最好。',
  },
  {
    id: 'complete',
    title: '🏰 建造完成！',
    description: '你的 React 城堡矗立在平原上',
    npcDialog:
      '🎉 太棒了，勇者！你已经掌握了真正的 Vibe Coding 节奏：\n\n1. 说目标，不写命令\n2. 遇错就把报错丢给 AI\n3. 持续迭代直到满意\n\n下一站——传送灯塔！你将把作品发布到全世界。',
  },
];

function getPromptTemplate(playerClass: string): string {
  switch (playerClass) {
    case 'product':
      return `请帮我把这个 React 项目改造成个人网站。需求如下：
1. 顶部导航栏：Logo + 菜单（首页、关于我、技能、联系方式）
2. Hero 区域：大标题 + 一句话介绍 + 一个行动按钮
3. 关于我：头像占位 + 简短介绍
4. 技能区：3-5 个技能卡片
5. 页脚：联系方式和版权
风格：简洁现代，深蓝 + 白色。请直接修改 src/App.jsx（或 src/App.tsx）并完善样式。`;
    case 'developer':
      return `请把这个 React 项目改造成开发者主页。要求：
- Header：名字 + 导航
- Hero：有代码感的大标题
- Skills：网格技能卡片
- Projects：至少 3 个项目卡片
- Footer：GitHub 和联系方式
技术要求：响应式布局，深色主题。请直接修改 src/App.jsx（或 src/App.tsx）并完善样式。`;
    case 'artist':
      return `请把这个 React 项目改造成艺术家作品集网站。设计要求：
- 深色背景 + 渐变点缀
- 首屏大标题 + 轻微动画
- 作品区：至少 6 个作品卡片，悬停有动效
- 个人简介：图文排版
- 技能：视觉化标签
请直接修改 src/App.jsx（或 src/App.tsx）并完善样式，突出视觉氛围。`;
    default:
      return '';
  }
}

export const Chapter3Create: React.FC = () => {
  const {
    player,
    settings,
    setScreen,
    completeStep,
    setLevelStatus,
    addXP,
    addBadge,
    addItem,
    showNotification,
  } = useGameStore();
  const { onDetectSuccess } = useEffects();

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
  } = useLevelProgress({ levelId: 'chapter3-create', steps: STEPS });

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectMode, setDetectMode] = useState<'vite' | 'app' | 'port' | null>(null);
  const projectPath = settings.projectPath || '';
  const fullProjectPath = projectPath;

  const createProjectPrompt = `请在当前文件夹初始化一个 Vite + React 项目（不要创建子文件夹，直接在当前目录下生成）。
请直接完成项目初始化，并确认依赖已安装好。
完成后请告诉我下一步怎么预览。`;

  const previewPrompt = `请帮我启动这个项目的开发服务器，我想预览网站效果。
如果端口冲突请自动处理，并告诉我预览地址。`;

  const iteratePrompt = `请在当前网站基础上继续优化：
1. 先给我 3 条可改进建议（结构、视觉、文案各 1 条）
2. 我确认后请逐条实现
3. 每次只修改一个方向，修改后告诉我变化点`;

  const startDetectCreateProject = () => {
    setDetectMode('vite');
    setIsDetecting(true);
    showNotification('🔍 开始感应项目蓝图...');
  };

  const startDetectAppModified = () => {
    setDetectMode('app');
    setIsDetecting(true);
    showNotification('🔍 开始感应 App 组件变化...');
  };

  const startDetectPreview = () => {
    setDetectMode('port');
    setIsDetecting(true);
    showNotification('🔍 开始检测开发服务器端口...');
  };

  useEffect(() => {
    if (!isDetecting || !window.electronAPI) return;

    const interval = setInterval(async () => {
      if (detectMode === 'vite' && currentStepIndex === 1 && projectPath) {
        const paths = [`${fullProjectPath}/vite.config.js`, `${fullProjectPath}/vite.config.ts`];
        for (const path of paths) {
          const exists = await window.electronAPI.checkFile(path);
          if (exists) {
            setIsDetecting(false);
            setDetectMode(null);
            clearInterval(interval);
            onDetectSuccess();
            showNotification('📐 检测到 Vite 蓝图，项目创建成功！');
            handleNext();
            return;
          }
        }
      }

      if (detectMode === 'app' && currentStepIndex === 2 && projectPath) {
        const paths = [`${fullProjectPath}/src/App.jsx`, `${fullProjectPath}/src/App.tsx`];
        for (const path of paths) {
          const exists = await window.electronAPI.checkFile(path);
          if (!exists) continue;
          const hasViteLogo = await window.electronAPI.checkFileContent(path, 'Vite + React');
          if (!hasViteLogo) {
            setIsDetecting(false);
            setDetectMode(null);
            clearInterval(interval);
            onDetectSuccess();
            showNotification('✨ 检测到你的建造魔法，网站已被改造！');
            handleNext();
            return;
          }
        }
      }

      if (detectMode === 'port' && currentStepIndex === 3) {
        const open = await window.electronAPI.checkPort(5173);
        if (open) {
          setIsDetecting(false);
          setDetectMode(null);
          clearInterval(interval);
          onDetectSuccess();
          showNotification('💡 灯塔点亮成功，已检测到 5173 端口！');
          handleNext();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isDetecting, detectMode, currentStepIndex, projectPath, fullProjectPath, onDetectSuccess, handleNext, showNotification]);

  const handleManualConfirm = () => {
    setIsDetecting(false);
    setDetectMode(null);
    handleNext();
  };

  const handleComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    addXP(150);
    addBadge('first-creation');
    addItem({
      id: 'react-castle',
      name: 'React 城堡地契',
      description: '你用 Vite + React 在创造平原上建造的魔法城堡的所有权证明',
      rarity: 'epic',
      icon: '🏰',
    });
    completeStep('chapter3-create', 'complete');
    setLevelStatus('chapter3-create', 'completed');
    setLevelStatus('chapter4-deploy', 'available');
    showNotification('🏰 获得 React 城堡地契（史诗）！+150 XP！🎉');
    saveGame();

    setTimeout(() => setScreen('world-map'), 3000);
  };

  return (
    <div className="level-layout">
      <div className="level-header">
        <span className="level-header__title">🏰 第三章：创造平原 · 真正的 Vibe Coding</span>
        <div className="level-header__progress">
          <div className="pixel-progress" style={{ width: 200 }}>
            <div className="pixel-progress__fill" style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }} />
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
        <div className="level-scene level-scene--create">
          <div className="npc-container">
            <div className="npc-sprite">👷</div>
            <div className="npc-name">建筑师 洛恩</div>
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
            <div className="level-step-content">
              {currentStepIndex === 0 && (
                <div className="level-actions">
                  <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                    接受任务 →
                  </button>
                </div>
              )}

              {currentStepIndex === 1 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={createProjectPrompt}
                      label="🪄 对 AI 说（蓝图咒语）："
                      explanation="你只要描述目标，AI Agent 会自动执行项目创建与依赖安装，不需要你手写任何命令。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: 'AI 没有创建成功',
                          prompt: '请检查当前目录的 Vite 项目是否初始化成功，如果失败请自动重试并告诉我原因。',
                        },
                        {
                          situation: 'AI 说缺少 Node/npm',
                          prompt: '请检查我本机是否安装 Node.js 和 npm，如果缺失请告诉我最简单的安装步骤。',
                        },
                      ]}
                    />
                  </div>
                  <div className="level-actions">
                    <button className="pixel-btn pixel-btn--accent" onClick={startDetectCreateProject}>
                      ✨ 我已发送给 AI，开始检测蓝图
                    </button>
                    <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                      手动确认：项目已创建 →
                    </button>
                  </div>
                  {isDetecting && detectMode === 'vite' && (
                    <div className="detection-status">
                      <div className="detection-dot detection-dot--checking" />
                      <span className="pixel-text-cn">🔍 搜索 Vite 蓝图能量...</span>
                    </div>
                  )}
                </>
              )}

              {currentStepIndex === 2 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={getPromptTemplate(player.class)}
                      label="✨ 对 AI 说（建造魔法）："
                      classTag={player.class === 'product' ? '产品策划版' : player.class === 'developer' ? '开发工程版' : '美术设计版'}
                      explanation="把你想要的页面结构、风格、内容一次说清楚，AI 会直接改代码。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '生成结果和你想的不一样',
                          prompt: '这个版本和我预期不一致，请先总结差异，再按我的目标重做。',
                        },
                        {
                          situation: '出现报错',
                          prompt: '这个报错了，我把完整错误贴给你，请定位原因并直接修复。',
                        },
                      ]}
                    />
                  </div>
                  <div className="level-actions">
                    <button className="pixel-btn pixel-btn--accent" onClick={startDetectAppModified}>
                      ✨ 我已让 AI 建造，开始感应魔力
                    </button>
                    <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                      手动确认：网站已修改 →
                    </button>
                  </div>
                  {isDetecting && detectMode === 'app' && (
                    <div className="detection-status">
                      <div className="detection-dot detection-dot--checking" />
                      <span className="pixel-text-cn">🔍 感应 App 组件的魔力变化...</span>
                    </div>
                  )}
                </>
              )}

              {currentStepIndex === 3 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={previewPrompt}
                      label="💡 对 AI 说（点亮灯塔）："
                      explanation="AI 会帮你启动开发服务器。你只需要打开预览地址确认效果。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '服务器启动失败',
                          prompt: '开发服务器没启动成功，请自动排查并修复后重新启动。',
                        },
                        {
                          situation: '端口被占用',
                          prompt: '5173 端口可能被占用，请帮我切换可用端口并告诉我预览地址。',
                        },
                      ]}
                    />
                  </div>
                  <div className="level-actions">
                    <button className="pixel-btn pixel-btn--accent" onClick={startDetectPreview}>
                      ✨ 我已让 AI 启动，开始检测灯塔
                    </button>
                    <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                      手动确认：我已成功预览 →
                    </button>
                  </div>
                  {isDetecting && detectMode === 'port' && (
                    <div className="detection-status">
                      <div className="detection-dot detection-dot--checking" />
                      <span className="pixel-text-cn">🔍 检测 5173 端口中...</span>
                    </div>
                  )}
                </>
              )}

              {currentStepIndex === 4 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={iteratePrompt}
                      label="🔁 对 AI 说（迭代打磨）："
                      explanation="一次只改一个点：例如先改导航，再改配色，再改文案。小步快跑是 Vibe Coding 的关键。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '我不知道下一步改什么',
                          prompt: '请基于当前页面给我 3 条高价值改进建议，并按优先级排序。',
                        },
                        {
                          situation: '改动太大，想回退一部分',
                          prompt: '请保留这次改动里我喜欢的部分，其他内容恢复到上一版风格。',
                        },
                      ]}
                    />
                  </div>
                  <div className="level-actions">
                    <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                      ✅ 我已完成至少一次迭代 →
                    </button>
                  </div>
                </>
              )}

              {currentStepIndex === 5 && (
                <div className="level-actions">
                  <button className="pixel-btn pixel-btn--accent pixel-btn--large" onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? '⏳ 处理中...' : '🏰 接收城堡地契！'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="level-tasks">
          <div className="level-tasks__header">
            <h3 className="level-tasks__title">📋 任务步骤</h3>
            <div className="level-tasks__progress">
              <div className="level-tasks__progress-bar">
                <div className="level-tasks__progress-fill" style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }} />
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
              💡 Vibe Coding 三原则
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>1. 描述目标，不描述命令</strong>
              <br />
              直接告诉 AI 你想要什么结果。
              <br />
              <strong>2. 报错直接贴给 AI</strong>
              <br />
              不用自己排查，先让 AI 解释并修复。
              <br />
              <strong>3. 持续迭代，一次一个需求</strong>
              <br />
              小步修改，快速反馈，直到满意。
            </p>
          </div>

          <div className="pixel-panel" style={{ marginTop: 12, fontSize: 12 }}>
            <p className="pixel-text-cn" style={{ color: '#54a0ff', marginBottom: 8 }}>
              🤖 AI Agent 能做什么？
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 11, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              读取和修改项目文件、安装依赖、启动开发服务、根据报错自动修复问题。你负责表达创意，AI 负责执行细节。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
