// ============================================================
// VibeGuide - 设置画面
// ============================================================
import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, setScreen, player } = useGameStore();

  const handleSave = async () => {
    if (window.electronAPI) {
      const save = useGameStore.getState().toSaveData();
      await window.electronAPI.saveGame(JSON.stringify(save));
      useGameStore.getState().showNotification('💾 游戏已保存！');
    }
  };

  const handleBack = () => {
    if (player.name) {
      setScreen('world-map');
    } else {
      setScreen('title');
    }
  };

  return (
    <div className="screen" style={{ background: 'var(--color-bg-dark)', padding: 40, gap: 24 }}>
      <h2 className="pixel-text-cn" style={{ color: 'var(--color-accent)', fontSize: 'clamp(18px, 3vw, 24px)' }}>
        ⚙️ 设置
      </h2>

      <div className="pixel-panel" style={{ width: 'min(400px, 90vw)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 音乐音量 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="pixel-text-cn" style={{ fontSize: 14 }}>🎵 音乐音量</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.musicVolume}
            onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
            style={{ width: 150 }}
          />
        </div>

        {/* 音效音量 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="pixel-text-cn" style={{ fontSize: 14 }}>🔊 音效音量</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.sfxVolume}
            onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
            style={{ width: 150 }}
          />
        </div>

        {/* 项目路径 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="pixel-text-cn" style={{ fontSize: 14, color: 'var(--color-text-dim)' }}>
            📁 项目路径
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              className="pixel-input"
              value={settings.projectPath || ''}
              onChange={(e) => updateSettings({ projectPath: e.target.value || undefined })}
              placeholder="未设置（在第二章中配置）"
              style={{ flex: 1, fontSize: 12 }}
            />
            <button
              className="pixel-btn pixel-btn--small"
              onClick={async () => {
                if (window.electronAPI) {
                  const dir = await window.electronAPI.selectDirectory();
                  if (dir) updateSettings({ projectPath: dir });
                }
              }}
            >
              浏览
            </button>
            {settings.projectPath && (
              <button
                className="pixel-btn pixel-btn--small"
                onClick={() => updateSettings({ projectPath: undefined })}
                title="清空路径"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button className="pixel-btn pixel-btn--primary" onClick={handleSave}>
          💾 保存游戏
        </button>
        <button className="pixel-btn" onClick={handleBack}>
          ← 返回
        </button>
      </div>
    </div>
  );
};
