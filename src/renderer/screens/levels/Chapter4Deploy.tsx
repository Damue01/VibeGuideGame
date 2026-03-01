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
      '勇者，欢迎来到最后一站——传送灯塔！我是守卫赫尔墨斯。\n\n这一章你要把做好的网站发布到网上，让全世界都能看到。\n\n放心，和之前一样，你只要告诉 AI 想做什么，它来帮你搞定。',
  },
  {
    id: 'check-tools',
    title: '检查工具',
    description: '检测 Git 是否可用',
    npcDialog:
      '发布网站需要一个叫 Git 的小工具。我先帮你检查一下有没有。\n\n如果没有也不用担心，直接让 AI 帮你装就行。',
  },
  {
    id: 'confirm-login',
    title: '确认登录',
    description: '确认 GitHub 账号已登录',
    npcDialog:
      '网站会发布到 GitHub 上面。你需要一个 GitHub 账号。\n\n好消息是，你的 IDE 里很可能已经登录了。如果没有，让 AI 帮你登录就好。',
  },
  {
    id: 'ai-deploy',
    title: '一键发布',
    description: '让 AI 帮你发布网站',
    npcDialog:
      '现在是最关键的一步！把下面这句话发给 AI，它会帮你完成所有操作：创建仓库、上传代码、发布网站。\n\n你什么都不用做，等 AI 告诉你网站地址就行。\n\n⚠️ 注意：如果发布后报错 Pages 未启用或权限不足，参考右边的「排障指南」，把相关信息告诉 AI 即可。',
  },
  {
    id: 'verify',
    title: '查看网站',
    description: '打开网址看看你的网站',
    npcDialog:
      'AI 应该已经给你网站地址了。点开看看吧！\n\n第一次可能需要等 1-3 分钟才能打开。如果打不开，把情况告诉 AI 让它帮你排查。\n\n如果 GitHub Actions 显示红色叉号，很可能是仓库的 Pages 功能没开启。告诉 AI，它会帮你处理。',
  },
  {
    id: 'complete',
    title: '🗼 发布成功！',
    description: '你的作品已经上线了',
    npcDialog:
      '🎉 恭喜你！你的网站已经上线，全世界都能看到了！\n\n你已经学会了完整的 Vibe Coding：\n- 告诉 AI 你想要什么\n- 让 AI 帮你做\n- 看效果，提意见\n- 不满意就让 AI 改\n\n这就是现代编程的新方式。去创造更多吧！',
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
          showNotification('✅ 检测到 Git！');
          setTimeout(() => handleNext(), 400);
        } else {
          showNotification('❌ 没检测到 Git，让 AI 帮你装');
        }
      } catch {
        showNotification('⚠️ 检测失败，可用手动确认继续');
      }
    }
    setIsDetecting(false);
  };

  const gitInstallPrompt = '帮我检查有没有安装 Git，如果没有请帮我装上。';

  const confirmLoginPrompt = '帮我检查一下我的 IDE 里有没有登录 GitHub。如果没有，请帮我登录。';

  const aiDeployPrompt = `帮我把这个网站发布到网上，让别人也能访问。
请帮我完成所有步骤：
1. 创建 GitHub 仓库
2. 上传代码
3. 检查Pages相关设置，确保部署权限和 Pages Source 配置正确
4. 部署到 GitHub Pages

完成后告诉我网站地址，如果遇到任何问题，先尝试帮我解决，最终实在不行再引导我操作。`;

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
                    接受发布任务 →
                  </button>
                </div>
              )}

              {displayedStepIndex === 1 && (
                <>
                  <div className="level-panels-row">
                    {!gitInstalled && (
                      <PromptBlock
                        prompt={gitInstallPrompt}
                        label="🧭 如果检测失败，对 AI 说："
                        explanation="让 AI 帮你检查并安装 Git。"
                      />
                    )}
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '安装过程中报错',
                          prompt: '安装 Git 时报错了，我把错误贴给你，帮我解决。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--accent" onClick={handleCheckGit} disabled={isDetecting}>
                        {isDetecting ? '⏳ 检测中...' : '🔍 检测 Git'}
                      </button>
                      <button className="pixel-btn pixel-btn--small" onClick={handleManualConfirm}>
                        手动确认：我已准备好 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 2 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={confirmLoginPrompt}
                      label="💬 对 AI 说："
                      explanation="让 AI 检查你的 IDE 里有没有登录 GitHub。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '不知道怎么注册 GitHub',
                          prompt: '我还没有 GitHub 账号，请帮我注册一个。',
                        },
                        {
                          situation: '登录失败',
                          prompt: 'GitHub 登录失败了，帮我解决。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--primary" onClick={() => {
                        handleNext();
                        showNotification(
                          '⭐ 顺手给冒险指南点颗星？你的支持是我们最大的动力！',
                          { url: 'https://github.com/Damue01/VibeGuideGame', duration: 5000 },
                        );
                      }}>
                        ✅ 已确认登录 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 3 && (
                <>
                  <div className="level-panels-row">
                    <PromptBlock
                      prompt={aiDeployPrompt}
                      label="🚀 对 AI 说："
                      explanation="这句话会让 AI 帮你完成所有发布步骤，你什么都不用做。"
                    />
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '发布失败了',
                          prompt: '发布失败了，我把错误信息贴给你，帮我解决。',
                        },
                        {
                          situation: 'AI 只给解释，没有动手',
                          prompt: '请直接帮我执行所有步骤，不要只给解释。',
                        },
                        {
                          situation: '报错 Pages 未启用 / 权限不足 / 404',
                          prompt: 'GitHub Actions 部署失败，报错说 Pages 未启用或权限不足。请帮我在仓库 Settings 里把 Pages 的 Source 设为 GitHub Actions，或者用命令行执行：gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow',
                        },
                        {
                          situation: 'workflow 报错 "Resource not accessible by integration"',
                          prompt: '部署工作流报错 Resource not accessible by integration。请帮我检查仓库 Settings → Actions → General 里的 Workflow permissions 是否设为 Read and write permissions，以及 Settings → Pages → Source 是否选了 GitHub Actions。',
                        },
                      ]}
                    />
                  </div>
                  {!isViewing && (
                    <div className="level-actions">
                      <button className="pixel-btn pixel-btn--primary" onClick={handleNext}>
                        ✅ AI 已完成发布 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {displayedStepIndex === 4 && (
                <>
                  <div className="level-panels-row">
                    <div className="pixel-panel" style={{ borderColor: '#ffd700', background: 'rgba(255,215,0,0.08)' }}>
                      <p className="pixel-text-cn" style={{ fontSize: 14, color: '#ffd700', marginBottom: 8 }}>
                        🌐 你的网站已上线！
                      </p>
                      <p className="pixel-text-cn" style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                        AI 应该已经告诉你网站地址了。打开看看吧！
                        <br />
                        第一次可能需要等 1-3 分钟才能打开。
                      </p>
                    </div>
                    <TroubleShootPanel
                      tips={[
                        {
                          situation: '打开是 404',
                          prompt: '网站打开显示 404，帮我检查哪里有问题并修复。',
                        },
                        {
                          situation: '页面空白',
                          prompt: '网站打开是空白的，帮我检查并修复。',
                        },
                        {
                          situation: 'GitHub Actions 显示失败（红色叉号）',
                          prompt: 'GitHub Actions 里的部署工作流失败了，帮我查看 Actions 页面的报错日志并修复。如果是 Pages 没开启，帮我去 Settings → Pages 里把 Source 改为 GitHub Actions。',
                        },
                        {
                          situation: '等了很久还是打不开',
                          prompt: '网站地址等了 5 分钟还是打不开。帮我检查 GitHub Actions 的部署状态，看看是不是 Pages 没有正确配置。',
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

              {displayedStepIndex === 5 && !isViewing && (
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
            <h3 className="level-tasks__title">📋 发布步骤</h3>
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
              💡 和AI说话的三个秘诀
            </p>
            <p className="pixel-text-cn" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-dim)' }}>
              <strong>1. 直接说你想要什么</strong>
              <br />
              不用管怎么做，只说结果。
              <br />
              <strong>2. 遇到问题截图给AI</strong>
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
              装工具、登录账号、创建仓库、上传代码、发布网站、修复问题……你只管说，它来做。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
