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
      '勇者，欢迎来到创造平原！我是建筑师洛恩。\n\n在这里，你只需要告诉 AI 你想建什么样的网站，它会帮你全部搞定——从创建到设计，一句话搞定。\n\n你的目标：建造一座属于你的魔法城堡（个人网站）。',
  },
  {
    id: 'create-and-build',
    title: '建造你的城堡',
    description: '告诉AI你想要什么样的网站',
    npcDialog:
      '现在，把下面的话发给 AI，告诉它你想要什么样的网站。\n\nAI 会先问你几个问题了解你的想法，然后自动帮你建好整个网站。\n\n你什么都不用做，就等着看成果就好！',
  },
  {
    id: 'preview',
    title: '预览你的网站',
    description: '让AI帮你打开网站看看效果',
    npcDialog:
      '城堡已经有雏形了！现在让 AI 帮你打开网站看看效果。\n\n把下面的话发给 AI，它会帮你启动网站。',
  },
  {
    id: 'iterate',
    title: '打磨城堡',
    description: '继续告诉AI改进',
    npcDialog:
      '看到效果了吗？不满意哪里，直接告诉 AI。比如"把颜色换成蓝色"、"标题再大一点"。\n\n一次说一个要求，效果最好。改到你满意为止！',
  },
  {
    id: 'complete',
    title: '🏰 建造完成！',
    description: '你的网站建好了',
    npcDialog:
      '🎉 太棒了，勇者！你已经掌握了真正的 Vibe Coding 节奏：\n\n1. 告诉 AI 你想要什么\n2. 不满意就继续说\n3. 遇到问题就把错误信息丢给 AI\n\n下一站——传送灯塔！你将把网站发布到网上让所有人看到。',
  },
];

function getPromptTemplate(playerClass: string): string {
  switch (playerClass) {
    case 'product':
      return `帮我创建一个个人网站，包含这几个部分：
- 首页：大标题 + 一句话介绍自己
- 关于我：简单的自我介绍
- 技能展示：3~5个技能卡片
- 联系方式
风格简洁现代，你可以先问我几个问题了解我的需求，然后再开始做。`;
    case 'developer':
      return `帮我创建一个开发者主页，包含这几个部分：
- 个人介绍
- 技能展示
- 项目展示：至少3个项目卡片
- 联系方式
深色主题风格，你可以先问我几个问题了解我的需求，然后再开始做。`;
    case 'artist':
      return `帮我创建一个作品集网站，包含这几个部分：
- 作品展示区：至少6个作品卡片，鼠标悬停有动效
- 个人简介
- 技能标签
要有艺术感和动画效果，你可以先问我几个问题了解我的需求，然后再开始做。`;
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
    displayedStepIndex,
    displayedNpcDialog,
    handleViewStep,
    handleExitViewing,
  } = useLevelProgress({ levelId: 'chapter3-create', steps: STEPS });

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectMode, setDetectMode] = useState<'build' | 'port' | null>(null);
  const projectPath = settings.projectPath || '';
  const fullProjectPath = projectPath;

  const previewPrompt = `帮我启动这个网站，我想看看效果。`;

  const iteratePrompt = `帮我继续改进这个网站：
1. 先给我 3 个可以改进的建议
2. 我确认后你再开始改
3. 每次只改一个地方，改完告诉我变了什么`;

  const startDetectBuild = () => {
    setDetectMode('build');
    setIsDetecting(true);
    showNotification('🔍 开始感应网站建造进度...');
  };

  const startDetectPreview = () => {
    setDetectMode('port');
    setIsDetecting(true);
    showNotification('🔍 开始检测网站是否已启动...');
  };

  useEffect(() => {
    if (!isDetecting || !window.electronAPI) return;

    const interval = setInterval(async () => {
      // 网站创建检测：支持任意技术栈（纯 HTML / Vite / Next / Nuxt / Angular / Svelte / Astro / Vue CLI 等）
      if (detectMode === 'build' && currentStepIndex === 1 && projectPath) {
        let detected = false;

        // ── 1. 检查 index.html ──
        const htmlPath = `${fullProjectPath}/index.html`;
        const htmlExists = await window.electronAPI.checkFile(htmlPath);
        if (htmlExists) {
          const hasHead = await window.electronAPI.checkFileContent(htmlPath, '<head');
          const hasBody = await window.electronAPI.checkFileContent(htmlPath, '<body');
          if (hasHead || hasBody) {
            // 判断是否为 Vite 脚手架未修改的空入口（只有 <div id="root"> + <script type="module">）
            const isViteEntry = await window.electronAPI.checkFileContent(htmlPath, 'id="root"');
            const hasModuleScript = await window.electronAPI.checkFileContent(htmlPath, 'type="module"');
            if (isViteEntry && hasModuleScript) {
              // 可能是 Vite/React/Vue/Svelte 脚手架入口，需确认源码已被修改
              const appFiles = [
                `${fullProjectPath}/src/App.jsx`, `${fullProjectPath}/src/App.tsx`,
                `${fullProjectPath}/src/App.vue`, `${fullProjectPath}/src/App.svelte`,
              ];
              for (const ap of appFiles) {
                const appExists = await window.electronAPI.checkFile(ap);
                if (!appExists) continue;
                const isDefault = await window.electronAPI.checkFileContent(ap, 'Vite + React');
                if (!isDefault) { detected = true; break; }
              }
            } else {
              // 纯 HTML 网站（或其他带 index.html 的框架），有 head/body 即通过
              detected = true;
            }
          }
        }

        // ── 2. 检查各种框架配置文件 ──
        if (!detected) {
          const frameworkConfigs = [
            // Vite
            `${fullProjectPath}/vite.config.js`, `${fullProjectPath}/vite.config.ts`,
            // Next.js
            `${fullProjectPath}/next.config.js`, `${fullProjectPath}/next.config.ts`, `${fullProjectPath}/next.config.mjs`,
            // Nuxt
            `${fullProjectPath}/nuxt.config.js`, `${fullProjectPath}/nuxt.config.ts`,
            // Angular
            `${fullProjectPath}/angular.json`,
            // Svelte / SvelteKit
            `${fullProjectPath}/svelte.config.js`,
            // Astro
            `${fullProjectPath}/astro.config.mjs`, `${fullProjectPath}/astro.config.ts`,
            // Vue CLI
            `${fullProjectPath}/vue.config.js`,
          ];
          for (const cfgPath of frameworkConfigs) {
            const exists = await window.electronAPI.checkFile(cfgPath);
            if (exists) { detected = true; break; }
          }
        }

        // ── 3. 检查 package.json + 源码目录（兜底：任何 Node 项目）──
        if (!detected) {
          const pkgExists = await window.electronAPI.checkFile(`${fullProjectPath}/package.json`);
          if (pkgExists) {
            const srcExists = await window.electronAPI.checkFile(`${fullProjectPath}/src`);
            const pagesExists = await window.electronAPI.checkFile(`${fullProjectPath}/pages`);
            const appDirExists = await window.electronAPI.checkFile(`${fullProjectPath}/app`);
            if (srcExists || pagesExists || appDirExists) {
              detected = true;
            }
          }
        }

        if (detected) {
          setIsDetecting(false);
          setDetectMode(null);
          clearInterval(interval);
          onDetectSuccess();
          showNotification('✨ 网站建造成功！');
          handleNext();
          return;
        }
      }

      // 预览检测：扫描所有常见开发服务器端口
      if (detectMode === 'port' && currentStepIndex === 2) {
        const portsToCheck = [
          5173, 5174,       // Vite
          3000, 3001,       // Next.js / CRA / Nuxt / Express
          4200,             // Angular
          5500, 5501,       // VS Code Live Server
          8000,             // Python http.server / Django
          8080, 8888,       // Vue CLI / 通用
          4173,             // Vite preview
          1234,             // Parcel
          4321,             // Astro
        ];
        for (const port of portsToCheck) {
          const open = await window.electronAPI.checkPort(port);
          if (open) {
            setIsDetecting(false);
            setDetectMode(null);
            clearInterval(interval);
            onDetectSuccess();
            showNotification('💡 网站已启动，可以预览了！');
            handleNext();
            return;
          }
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

          {(npcDone || isViewing) && (
            <div className="level-step-content">
              {displayedStepIndex === 0 && !isViewing && (
                <div className="level-actions">
                  <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                    接受任务 →
                  </button>
                </div>
              )}

              {displayedStepIndex === 1 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={getPromptTemplate(player.class)}
                      label="✨ 对 AI 说："
                      classTag={player.class === 'product' ? '产品策划版' : player.class === 'developer' ? '开发工程版' : '美术设计版'}
                      explanation="把你想要什么样的网站告诉 AI，它会帮你从头开始建好。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: 'AI 没有开始做',
                          prompt: '请帮我创建网站，如果之前失败了请重新开始，并告诉我原因。',
                        },
                        {
                          situation: '做出来的和我想的不一样',
                          prompt: '这个和我想的不一样，请先问我具体想要什么样的，然后重新做。',
                        },
                        {
                          situation: '出现报错',
                          prompt: '这里报错了，我把错误信息贴给你，帮我修复。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--accent" onClick={startDetectBuild}>
                        ✨ 我已发给 AI，开始检测
                      </button>
                      <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                        手动确认：网站已建好 →
                      </button>
                    </div>
                  )}
                  {isDetecting && detectMode === 'build' && (
                    <div className="detection-status">
                      <div className="detection-dot detection-dot--checking" />
                      <span className="pixel-text-cn">🔍 感应网站建造进度...</span>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 2 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={previewPrompt}
                      label="💡 对 AI 说："
                      explanation="AI 会帮你启动网站，你只要打开它给你的网址看效果。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '网站启动失败',
                          prompt: '网站没启动成功，帮我检查一下哪里有问题并修复。',
                        },
                        {
                          situation: '打开是空白的',
                          prompt: '网站打开是空白的，帮我检查哪里有问题并修复。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--accent" onClick={startDetectPreview}>
                        ✨ 我已让 AI 启动，开始检测
                      </button>
                      <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                        手动确认：我已成功预览 →
                      </button>
                    </div>
                  )}
                  {isDetecting && detectMode === 'port' && (
                    <div className="detection-status">
                      <div className="detection-dot detection-dot--checking" />
                      <span className="pixel-text-cn">🔍 检测网站是否已启动...</span>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 3 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={iteratePrompt}
                      label="🔁 对 AI 说："
                      explanation="一次只说一个想改的地方，比如先改颜色，再改文字。小步快跑是关键。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '不知道还能改什么',
                          prompt: '帮我看看这个网站还有哪里可以改进，给我 3 个建议。',
                        },
                        {
                          situation: '改太多了，想回退',
                          prompt: '这次改的太多了，帮我保留我喜欢的部分，其他的改回去。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                        ✅ 我已完成至少一次迭代 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 4 && !isViewing && (
                <div className="level-actions">
                  <button className="pixel-btn pixel-btn--accent pixel-btn--large" onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? '⏳ 处理中...' : '🏰 接收城堡地契！'}
                  </button>
                </div>
              )}

              {/* 回看模式：回到当前步骤按钮 */}
              {isViewing && (
                <div className="level-actions" style={{ marginTop: 12 }}>
                  <button className="pixel-btn pixel-btn--primary" onClick={handleExitViewing}>
                    ↩ 回到当前步骤
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
              💡 和AI说话的三个秘诀
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>1. 直接说你想要什么</strong>
              <br />
              不用管怎么做，只说结果。
              <br />
              <strong>2. 遇到问题直接截图给AI</strong>
              <br />
              别自己研究，让 AI 帮你解决。
              <br />
              <strong>3. 一次只说一个要求</strong>
              <br />
              慢慢来，一点一点改，效果最好。
            </p>
          </div>

          <div className="pixel-panel" style={{ marginTop: 12, fontSize: 12 }}>
            <p className="pixel-text-cn" style={{ color: '#54a0ff', marginBottom: 8 }}>
              🤖 AI 能帮你做什么？
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 11, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              创建网站、改设计、加功能、启动网站、修复问题……你只管说，它来做。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
