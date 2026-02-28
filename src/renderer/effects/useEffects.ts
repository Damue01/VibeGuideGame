// ============================================================
// VibeGuide - useEffects 组合 Hook
// 统一调用 粒子 + 音效 + 抖屏
// 通过 EffectsContext 获取全局共享的 refs
// ============================================================

import { useCallback } from 'react';
import { useEffectsContext } from './EffectsContext';
import { useAudio } from '../audio/useAudio';

export interface UseEffectsReturn {
  /** 步骤完成：轻微爆炸 + 音效 */
  onStepComplete: (x?: number, y?: number) => void;
  /** 关卡完成：全屏庆祝组合 */
  onLevelComplete: () => void;
  /** 检测成功：星芒 + 音效 */
  onDetectSuccess: (x?: number, y?: number) => void;
  /** 通用点击 */
  onClick: () => void;
  /** 错误 */
  onError: () => void;
  /** 烟花 */
  onFirework: (x?: number, y?: number) => void;
}

export function useEffects(): UseEffectsReturn {
  const { effectsRef, shakeRef } = useEffectsContext();
  const audio = useAudio();

  const onStepComplete = useCallback(
    (x?: number, y?: number) => {
      effectsRef.current?.triggerExplosion(x, y);
      shakeRef.current?.shake(4, 200);
      audio.playComplete();
    },
    [effectsRef, shakeRef, audio]
  );

  const onLevelComplete = useCallback(() => {
    effectsRef.current?.triggerCelebration();
    shakeRef.current?.shake(8, 500);
    audio.playReward();
    setTimeout(() => audio.playLevelUp(), 600);
    setTimeout(() => audio.playFirework(), 1000);
  }, [effectsRef, shakeRef, audio]);

  const onDetectSuccess = useCallback(
    (x?: number, y?: number) => {
      effectsRef.current?.triggerStarBurst(x, y);
      audio.playDetect();
    },
    [effectsRef, audio]
  );

  const onClick = useCallback(() => {
    audio.playClick();
  }, [audio]);

  const onError = useCallback(() => {
    shakeRef.current?.shake(6, 300);
    audio.playError();
  }, [shakeRef, audio]);

  const onFirework = useCallback(
    (x?: number, y?: number) => {
      effectsRef.current?.triggerFireworks(x, y);
      audio.playFirework();
    },
    [effectsRef, audio]
  );

  return {
    onStepComplete,
    onLevelComplete,
    onDetectSuccess,
    onClick,
    onError,
    onFirework,
  };
}
