// ============================================================
// VibeGuide - 主应用组件
// 根据游戏状态切换不同画面
// ============================================================
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { TitleScreen } from './screens/TitleScreen';
import { IntroScreen } from './screens/IntroScreen';
import { ClassSelectScreen } from './screens/ClassSelectScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { LevelScreen } from './screens/LevelScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { DialogOverlay } from './components/DialogOverlay';
import { NotificationToast } from './components/NotificationToast';
import { SettingsScreen } from './screens/SettingsScreen';
import EffectsLayer, { EffectsLayerHandle } from './effects/EffectsLayer';
import ScreenShake, { ScreenShakeHandle } from './effects/ScreenShake';
import { EffectsProvider } from './effects/EffectsContext';
import { useAudio } from './audio/useAudio';
import type { BGMTrack } from '../shared/types';

const SCREEN_BGM: Record<string, BGMTrack> = {
  'title': 'title',
  'intro': 'title',
  'class-select': 'title',
  'world-map': 'worldmap',
  'level': 'level',
  'settings': 'worldmap',
  'dialog': 'level',
  'victory': 'victory',
};

const App: React.FC = () => {
  const { ui, isLoaded, setLoaded } = useGameStore();
  const effectsRef = useRef<EffectsLayerHandle>(null);
  const shakeRef = useRef<ScreenShakeHandle>(null);
  const { playBGM, playClick, unlockAudio } = useAudio();

  // 启动时尝试加载存档
  useEffect(() => {
    const loadSave = async () => {
      if (window.electronAPI) {
        try {
          const saveStr = await window.electronAPI.loadGame();
          if (saveStr) {
            const save = JSON.parse(saveStr);
            useGameStore.getState().loadSaveData(save);
          }
        } catch (e) {
          console.warn('Failed to load save:', e);
        }
      }
      setLoaded(true);
    };
    loadSave();
  }, [setLoaded]);

  // BGM 随画面切换
  useEffect(() => {
    const track = SCREEN_BGM[ui.currentScreen] || 'title';
    playBGM(track);
  }, [ui.currentScreen, playBGM]);

  // 首次交互解锁音频上下文 + 全局按钮点击音效委托
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      void unlockAudio();

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest(
        'button, [role="button"], .dialog-next-hint, .class-card, .prompt-option, .command-option'
      );

      if (!clickable) return;

      if (clickable instanceof HTMLButtonElement && clickable.disabled) {
        return;
      }

      playClick();
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [playClick, unlockAudio]);

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="pixel-spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (ui.currentScreen) {
      case 'title':
        return <TitleScreen />;
      case 'intro':
        return <IntroScreen />;
      case 'class-select':
        return <ClassSelectScreen />;
      case 'world-map':
        return <WorldMapScreen />;
      case 'level':
        return <LevelScreen />;
      case 'victory':
        return <VictoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'dialog':
        // dialog is an overlay on top of current screen
        return (
          <>
            {ui.currentLevel ? <LevelScreen /> : <WorldMapScreen />}
            <DialogOverlay />
          </>
        );
      default:
        return <TitleScreen />;
    }
  };

  return (
    <ScreenShake ref={shakeRef}>
      <EffectsProvider effectsRef={effectsRef} shakeRef={shakeRef}>
        <div className="game-container">
          {/* key 触发每次切屏的淡入动画 */}
          <div
            key={ui.currentScreen}
            className="screen-transition"
          >
            {renderScreen()}
          </div>
          <NotificationToast />
          <EffectsLayer ref={effectsRef} />
        </div>
      </EffectsProvider>
    </ScreenShake>
  );
};

export default App;
