// ============================================================
// VibeGuide - 特效全局上下文
// 让所有子组件都能触发粒子、抖屏等特效
// ============================================================
import React, { createContext, useContext, useRef } from 'react';
import type { EffectsLayerHandle } from './EffectsLayer';
import type { ScreenShakeHandle } from './ScreenShake';

interface EffectsContextValue {
  effectsRef: React.RefObject<EffectsLayerHandle | null>;
  shakeRef: React.RefObject<ScreenShakeHandle | null>;
}

const EffectsContext = createContext<EffectsContextValue | null>(null);

export const EffectsProvider: React.FC<{
  effectsRef: React.RefObject<EffectsLayerHandle | null>;
  shakeRef: React.RefObject<ScreenShakeHandle | null>;
  children: React.ReactNode;
}> = ({ effectsRef, shakeRef, children }) => {
  return (
    <EffectsContext.Provider value={{ effectsRef, shakeRef }}>
      {children}
    </EffectsContext.Provider>
  );
};

export function useEffectsContext(): EffectsContextValue {
  const ctx = useContext(EffectsContext);
  if (!ctx) {
    // 降级：返回空 ref，不会崩溃
    return {
      effectsRef: { current: null },
      shakeRef: { current: null },
    };
  }
  return ctx;
}
