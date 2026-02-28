// ============================================================
// VibeGuide - 关卡进度管理 Hook
// 抽取四章共同的步骤推进、NPC 对话、过渡动画等逻辑
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEffects } from '../effects/useEffects';
import { LevelId } from '../../shared/types';

export interface LevelStep {
  id: string;
  title: string;
  description: string;
  npcDialog: string;
}

interface UseLevelProgressOptions {
  levelId: LevelId;
  steps: readonly LevelStep[];
}

/**
 * 管理关卡内公共的推进状态：
 * - currentStepIndex / currentStep
 * - npcDone（对话打字完成后才显示操作按钮）
 * - isCompleting（防止重复提交）
 * - handleNext（推进到下一步 + 特效 + 防抖）
 * - viewingStepIndex / viewingStep（回看已完成步骤的对话）
 * - saveGame 便捷方法
 */
export function useLevelProgress({ levelId, steps }: UseLevelProgressOptions) {
  const { levels, completeStep } = useGameStore();
  const { onStepComplete } = useEffects();

  const levelProgress = levels[levelId];
  const safeStep = Math.min(levelProgress.currentStep, steps.length - 1);

  const [currentStepIndex, setCurrentStepIndex] = useState(safeStep);
  const [npcDone, setNpcDone] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const isTransitioning = useRef(false);

  // 回看功能：null 表示未回看，数字表示正在查看的历史步骤索引
  const [viewingStepIndex, setViewingStepIndex] = useState<number | null>(null);

  // 是否处于回看模式
  const isViewing = viewingStepIndex !== null;

  // 回看时使用回看步骤，否则使用当前步骤
  const displayedStep = isViewing ? steps[viewingStepIndex!] : steps[currentStepIndex];

  // 回看时对话直接显示全文（不走打字机动画），所以用 displayedStep.npcDialog 的 key 来区分
  const displayedNpcDialog = displayedStep.npcDialog;

  // 当 store 中 currentStep 变化时（如 resetLevel），同步本地状态
  useEffect(() => {
    setCurrentStepIndex(Math.min(levelProgress.currentStep, steps.length - 1));
  }, [levelProgress.currentStep, steps.length]);

  // NPC 对话变化时重置操作按钮显示
  useEffect(() => {
    setNpcDone(false);
  }, [currentStepIndex]);

  const currentStep = steps[currentStepIndex];

  const handleNpcComplete = useCallback(() => setNpcDone(true), []);

  // 点击已完成步骤，进入回看模式
  const handleViewStep = useCallback((index: number) => {
    if (index < currentStepIndex) {
      setViewingStepIndex(index);
    }
  }, [currentStepIndex]);

  // 退出回看模式，回到当前步骤
  const handleExitViewing = useCallback(() => {
    setViewingStepIndex(null);
  }, []);

  const handleNext = useCallback(() => {
    if (isTransitioning.current) return;
    // 如果在回看模式，先退出
    if (viewingStepIndex !== null) {
      setViewingStepIndex(null);
      return;
    }
    if (currentStepIndex < steps.length - 1) {
      isTransitioning.current = true;
      setNpcDone(false);
      completeStep(levelId, steps[currentStepIndex].id);
      setCurrentStepIndex((prev) => prev + 1);
      onStepComplete();
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    }
  }, [currentStepIndex, steps, levelId, completeStep, onStepComplete, viewingStepIndex]);

  /** 保存游戏存档（Electron / 浏览器 localStorage） */
  const saveGame = useCallback(async () => {
    const { saveGameData } = await import('../utils/storage');
    const save = useGameStore.getState().toSaveData();
    await saveGameData(JSON.stringify(save));
  }, []);

  return {
    currentStepIndex,
    currentStep,
    npcDone,
    isCompleting,
    setIsCompleting,
    levelProgress,
    handleNpcComplete,
    handleNext,
    saveGame,
    // 回看功能
    viewingStepIndex,
    isViewing,
    displayedStep,
    displayedNpcDialog,
    handleViewStep,
    handleExitViewing,
  };
}
