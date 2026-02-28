// ============================================================
// VibeGuide - 第四章：传送灯塔（AI 对话式部署）
// 核心体验：用户描述部署目标，AI 负责 git + deploy 执行
// ============================================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useEffects } from '../../effects/useEffects';
import { useLevelProgress } from '../../hooks/useLevelProgress';
import { NpcDialogBubble } from '../../components/NpcDialogBubble';
import { PromptBlock } from '../../components/PromptBlock';
import { TroubleShootPanel } from '../../components/TroubleShootPanel';

interface DeployStep {
  id: string;
  title: string;
  description: string;
  npcDialog: string;
}

const STEPS: DeployStep[] = [
  {
    id: 'arrive',
    title: '抵达传送灯塔',
    description: '灯塔守卫迎接你',
    npcDialog:
      '勇者，欢迎来到传送灯塔！我是守卫赫尔墨斯。\n\n这一章你将把作品传送到全世界。依然不需要手敲命令——你只管告诉 AI 目标，AI Agent 会执行部署流程。',
  },
  {
    id: 'check-tools',
    title: '检查传送石',
    description: '检测 Git 是否可用',
    npcDialog:
      '传送阵需要 Git 这块传送石。我先帮你自动检测。\n\n如果没装，也不用慌，直接让 AI 告诉你怎么安装并带你完成。',
  },
  {
    id: 'github-account',
    title: '注册传送阵',
    description: '准备 GitHub 账号',
    npcDialog:
      '接下来需要 GitHub 账号作为云端传送阵。已有账号可直接下一步，没有就先注册。',
  },
  {
    id: 'ai-deploy-config',
    title: '请求 AI 协助配置',
    description: '让 AI 完成 Pages 配置',
    npcDialog:
      '现在请 AI 配置部署：安装 gh-pages、设置 base、补齐 deploy 脚本。\n\n你只需要复制咒语发给 AI。',
  },
  {
    id: 'create-repo',
    title: '建造传送阵底座',
    description: '在 GitHub 网页创建仓库',
    npcDialog:
      '这一步需要网页操作：在 GitHub 新建仓库。仓库建好后，我们就能让 AI 一次性完成推送和部署。',
  },
  {
    id: 'push-and-deploy',
    title: '启动传送！',
    description: '让 AI 推送并部署到 Pages',
    npcDialog:
      '把最终咒语交给 AI：让它把项目推送到 GitHub，并执行部署。\n\n你不需要手工输入 git 和 npm 命令。',
  },
  {
    id: 'verify',
    title: '验证传送',
    description: '访问上线地址确认成功',
    npcDialog:
      '部署通常要 1-3 分钟。完成后访问你的网站地址确认是否上线。\n\n若异常，直接把现象和报错发给 AI。',
  },
  {
    id: 'complete',
    title: '🗼 传送成功！',
    description: '你的作品已传送到全世界',
    npcDialog:
      '🎉 传送成功！你已经掌握了上线作品的完整闭环：\n\n- 描述目标\n- 让 AI 执行\n- 结果验证\n- 出错迭代\n\n这就是高效 Vibe Coding。',
  },
];

export const Chapter4Deploy: React.FC = () => {
  const {
    settings,
    setScreen,
    completeStep,
    setLevelStatus,
    addXP,
    addBadge,
    addItem,
    showNotification,
  } = useGameStore();
  const { onDetectSuccess, onLevelComplete } = useEffects();

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
  } = useLevelProgress({ levelId: 'chapter4-deploy', steps: STEPS });

  const [gitInstalled, setGitInstalled] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [repoName, setRepoName] = useState(() => {
    const p = settings.projectPath || '';
    const parts = p.replace(/[\\/]+$/, '').split(/[\\/]/);
    return parts[parts.length - 1] || 'my-website';
  });
  const [githubUsername, setGithubUsername] = useState('YOUR-USERNAME');
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const projectPath = settings.projectPath || '';

  useEffect(() => {
    if (isLevelCompleted) {
      const timer = setTimeout(() => setScreen('victory'), 4000);
      return () => clearTimeout(timer);
    }
  }, [isLevelCompleted, setScreen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('📋 已复制到剪贴板！');
    });
  };

  const handleCheckGit = async () => {
    setIsDetecting(true);
    if (window.electronAPI) {
      try {
        const found = await window.electronAPI.checkCommand('git');
        setGitInstalled(found);
        if (found) {
          onDetectSuccess();
          showNotification('✅ 检测到传送石（Git）！');
          setTimeout(() => handleNext(), 400);
        } else {
          showNotification('❌ 未检测到 Git，请让 AI 协助安装');
        }
      } catch {
        showNotification('⚠️ 检测失败，可用手动确认继续');
      }
    }
    setIsDetecting(false);
  };

  const handleOpenGitDownload = () => {
    const url = 'https://git-scm.com/downloads';
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleOpenGitHubSignup = () => {
    const url = 'https://github.com/signup';
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const deployConfigPrompt = `我想把当前 Vite + React 项目部署到 GitHub Pages。
请你直接帮我完成部署配置：
1) 安装 gh-pages
2) 在 vite.config 中正确设置 base（仓库名是 ${repoName}）
3) 在 package.json 添加 predeploy/deploy 脚本
4) 检查配置是否可执行
完成后请告诉我“可以部署了”。`;

  const pushAndDeployPrompt = `请帮我把当前项目上传到 GitHub 并部署到 GitHub Pages。
我的仓库地址是：https://github.com/${githubUsername}/${repoName}

请你自动完成：
1) 初始化并检查 git 状态
2) 提交当前代码并推送到 main
3) 执行部署命令
4) 告诉我最终线上地址和下一步验证方法`;

  const gitInstallPrompt = '帮我检查系统是否安装了 Git；如果没有，请一步步指导我安装并验证可用。';

  const handleManualConfirm = () => {
    handleNext();
  };

  const handleComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    addXP(200);
    addBadge('first-deploy');
    addItem({
      id: 'beacon-key',
      name: '灯塔之钥',
      description: '你成功将作品传送到全世界的证明——永久发光的传说级钥匙',
      rarity: 'legendary',
      icon: '🗝️',
    });
    completeStep('chapter4-deploy', 'complete');
    setLevelStatus('chapter4-deploy', 'completed');
    showNotification('🗝️ 获得 灯塔之钥（传说）！+200 XP！🎉🎉🎉');
    onLevelComplete();
    saveGame();

    setIsLevelCompleted(true);
  };

  return (
    <div className="level-layout">
      <div className="level-header">
        <span className="level-header__title">🗼 第四章：传送灯塔</span>
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
        <div className="level-scene level-scene--deploy">
          <div className="npc-container">
            <div className="npc-sprite">🧙</div>
            <div className="npc-name">灯塔守卫 赫尔墨斯</div>
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
                    接受传送任务 →
                  </button>
                </div>
              )}

              {displayedStepIndex === 1 && (
                <>
                  <div className="level-panels-row">
                    {!gitInstalled && (
                      <PromptBlock
                        prompt={gitInstallPrompt}
                        label="🧭 未检测到 Git 时，对 AI 说："
                        explanation="这一步只用来获得安装引导。安装完成后，回到这里再点一次检测即可。"
                      />
                    )}
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '不知道如何验证 Git 是否安装成功',
                          prompt: '请告诉我如何验证 Git 已安装，并帮我解读验证结果。',
                        },
                        {
                          situation: '安装过程报错',
                          prompt: '安装 Git 报错了，我把错误贴给你，请帮我修复安装问题。',
                        },
                      ]}
                    />
                  </div>

                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--accent" onClick={handleCheckGit} disabled={isDetecting}>
                        {isDetecting ? '⏳ 检测中...' : '🔍 检测传送石（Git）'}
                      </button>
                      <button className="pixel-btn pixel-btn--small" onClick={handleOpenGitDownload}>
                        📥 打开 Git 下载页
                      </button>
                      <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                        手动确认：我已准备好 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 2 && !isViewing && (
                <div className="level-actions">
                  <button className="pixel-btn pixel-btn--accent" onClick={handleOpenGitHubSignup}>
                    🌐 前往 GitHub 注册
                  </button>
                  <button className="pixel-btn pixel-btn--primary" onClick={() => {
                    handleNext();
                    // 刚确认/注册完 GitHub 账号，立即引导点星，停留 5 秒
                    showNotification(
                      '⭐ 顺手给冒险指南点颗星？你的支持是我们最大的动力！',
                      { url: 'https://github.com/Damue01/VibeGuideGame', duration: 5000 },
                    );
                  }}>
                    我已有 GitHub 账号 →
                  </button>
                </div>
              )}

              {displayedStepIndex === 3 && (
                <>
                  {!isViewing && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                        仓库名称：
                      </span>
                      <input
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                        className="pixel-input"
                        style={{ width: 160, fontSize: 13 }}
                      />
                      <span className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                        GitHub 用户名：
                      </span>
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        className="pixel-input"
                        style={{ width: 180, fontSize: 13 }}
                      />
                    </div>
                  )}

                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={deployConfigPrompt}
                      label="⚙️ 对 AI 说（部署配置）："
                      explanation="这句会把 gh-pages 配置步骤一次讲清，让 AI 直接改好项目配置。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: 'AI 只给解释，没有改文件',
                          prompt: '请直接修改项目文件并执行必要操作，完成后告诉我变更点。',
                        },
                        {
                          situation: '配置后仍然不能部署',
                          prompt: '请检查当前部署配置哪里不完整，直接修复到可部署状态。',
                        },
                      ]}
                    />
                  </div>

                  {!isViewing && (
                    <div className="level-actions">
                      <button
                        className="pixel-btn pixel-btn--accent"
                        onClick={handleNext}
                      >
                        ✅ AI 已帮我配置好 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 4 && (
                <>
                  <div className="pixel-panel" style={{ marginTop: 12, maxWidth: 560, borderColor: '#54a0ff' }}>
                    <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
                      📝 创建仓库步骤：
                      <br />
                      1. 前往 <strong>github.com/new</strong>
                      <br />
                      2. Repository name 填写：<strong>{repoName}</strong>
                      <br />
                      3. 选择 <strong>Public</strong>
                      <br />
                      4. 不勾选 "Add a README file"
                      <br />
                      5. 点击 "Create repository"
                    </p>
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button
                        className="pixel-btn pixel-btn--accent"
                        onClick={() => {
                          const url = 'https://github.com/new';
                          if (window.electronAPI) window.electronAPI.openExternal(url);
                          else window.open(url, '_blank');
                        }}
                      >
                        🌐 打开 GitHub 创建仓库
                      </button>
                      <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                        仓库已创建 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 5 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={pushAndDeployPrompt}
                      label="🚀 对 AI 说（推送 + 部署）："
                      explanation="一次性把 git 初始化、推送和 GitHub Pages 部署都交给 AI。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '推送时报鉴权错误',
                          prompt: 'Git 推送鉴权失败，请帮我判断原因并给出最短修复路径。',
                        },
                        {
                          situation: '部署后 404 或空白页',
                          prompt: 'GitHub Pages 上线后异常，请按 base 路径、构建产物、分支配置顺序排查并修复。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                        ✅ AI 已完成推送与部署 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 6 && (
                <>
                  <div className="level-panels-row">
                    <div className="pixel-panel" style={{ borderColor: '#ffd700', background: 'rgba(255,215,0,0.08)' }}>
                      <p className="pixel-text-cn" style={{ fontSize: 14, color: '#ffd700', marginBottom: 8 }}>
                        🌐 你的网站地址：
                      </p>
                      <p
                        className="pixel-text"
                        style={{ fontSize: 13, color: '#98d8c8', wordBreak: 'break-all' }}
                        onClick={() => {
                          const url = `https://${githubUsername}.github.io/${repoName}/`;
                          handleCopy(url);
                          if (window.electronAPI) window.electronAPI.openExternal(url);
                          else window.open(url, '_blank');
                        }}
                      >
                        https://{githubUsername}.github.io/{repoName}/
                      </p>
                      <p className="pixel-text-cn" style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 8 }}>
                        点击上方链接查看（首次部署可能需要等待 1-3 分钟）
                      </p>
                    </div>
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '访问 404',
                          prompt: '线上地址 404，请检查 Pages 分支、目录和 base 配置并修复。',
                        },
                        {
                          situation: '页面空白或样式错乱',
                          prompt: '页面空白/样式异常，请检查资源路径与构建输出并修复。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                        ✅ 我的网站上线了！
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 7 && !isViewing && (
                <div className="level-actions">
                  <button className="pixel-btn pixel-btn--accent pixel-btn--large" onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? '⏳ 处理中...' : '🗝️ 接收灯塔之钥！'}
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
            <h3 className="level-tasks__title">📋 传送步骤</h3>
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
            <p className="pixel-text-cn" style={{ color: '#ffd700', marginBottom: 8 }}>
              🌟 Vibe Coding 三原则
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>1. 描述目标，不要求自己会命令</strong>
              <br />
              <strong>2. 把报错原样贴回给 AI</strong>
              <br />
              <strong>3. 一次一个需求，持续迭代</strong>
            </p>
          </div>

          <div className="pixel-panel" style={{ marginTop: 12, fontSize: 12 }}>
            <p className="pixel-text-cn" style={{ color: '#54a0ff', marginBottom: 8 }}>
              🤖 AI Agent 能力
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 11, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              可执行命令、读写项目文件、安装依赖、修复部署错误并给出验证路径。你只要持续给目标和反馈。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
