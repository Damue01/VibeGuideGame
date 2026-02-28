// ============================================================
// VibeGuide - 关卡画面（通用容器）
// 根据当前关卡ID加载对应的关卡组件
// ============================================================
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Chapter1Forge } from './levels/Chapter1Forge';
import { Chapter2Temple } from './levels/Chapter2Temple';
import { Chapter3Create } from './levels/Chapter3Create';
import { Chapter4Deploy } from './levels/Chapter4Deploy';
import { LevelBackground } from './LevelBackground';
import './LevelScreen.css';

export const LevelScreen: React.FC = () => {
  const { ui, setScreen } = useGameStore();

  const renderLevel = () => {
    switch (ui.currentLevel) {
      case 'chapter1-forge':
        return <Chapter1Forge key="chapter1-forge" />;
      case 'chapter2-temple':
        return <Chapter2Temple key="chapter2-temple" />;
      case 'chapter3-create':
        return <Chapter3Create key="chapter3-create" />;
      case 'chapter4-deploy':
        return <Chapter4Deploy key="chapter4-deploy" />;
      default:
        return (
          <div className="level-placeholder">
            <p className="pixel-text-cn">🚧 关卡开发中...</p>
            <button className="pixel-btn" onClick={() => setScreen('world-map')}>
              返回地图
            </button>
          </div>
        );
    }
  };

  return (
    <div className="screen level-screen">
      {ui.currentLevel && <LevelBackground levelId={ui.currentLevel} />}
      {renderLevel()}
    </div>
  );
};
