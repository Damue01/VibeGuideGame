// ============================================================
// VibeGuide - 屏幕抖动包装器
// ============================================================

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface ScreenShakeHandle {
  shake: (intensity?: number, duration?: number) => void;
}

interface Props {
  children: React.ReactNode;
}

const ScreenShake = forwardRef<ScreenShakeHandle, Props>(({ children }, ref) => {
  const [style, setStyle] = useState<React.CSSProperties>({});

  const shake = useCallback((intensity = 6, duration = 400) => {
    let start = performance.now();
    const doShake = (now: number) => {
      const elapsed = now - start;
      if (elapsed > duration) {
        setStyle({});
        return;
      }
      const progress = 1 - elapsed / duration;
      const dx = (Math.random() - 0.5) * intensity * 2 * progress;
      const dy = (Math.random() - 0.5) * intensity * 2 * progress;
      setStyle({ transform: `translate(${dx}px, ${dy}px)` });
      requestAnimationFrame(doShake);
    };
    requestAnimationFrame(doShake);
  }, []);

  useImperativeHandle(ref, () => ({ shake }), [shake]);

  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      {children}
    </div>
  );
});

ScreenShake.displayName = 'ScreenShake';
export default ScreenShake;
