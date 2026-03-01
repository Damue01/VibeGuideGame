// ============================================================
// VibeGuide - 音频 React Hook
// 提供便捷的音效和 BGM 调用方法
// ============================================================
import { useCallback, useEffect, useMemo } from 'react';
import { AudioManager } from './AudioManager';
import { useGameStore } from '../../store/gameStore';
import type { BGMTrack, SFXId } from '../../shared/types';

/**
 * 音频控制 hook
 * - 自动将 store 中的音量同步到 AudioManager
 * - 提供快捷音效方法
 */
export function useAudio() {
  const { musicVolume, sfxVolume } = useGameStore((s) => s.settings);

  // 同步音量到 AudioManager
  useEffect(() => {
    AudioManager.setMusicVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    AudioManager.setSFXVolume(sfxVolume);
  }, [sfxVolume]);

  const playBGM = useCallback((track: BGMTrack, fadeInDuration?: number) => {
    AudioManager.playBGM(track, fadeInDuration);
  }, []);

  const stopBGM = useCallback(() => {
    AudioManager.stopBGM();
  }, []);

  const fadeOutBGM = useCallback((duration?: number) => {
    AudioManager.fadeOut(duration);
  }, []);

  const playSFX = useCallback((sfx: SFXId) => {
    AudioManager.playSFX(sfx);
  }, []);

  // 快捷方法
  const playClick = useCallback(() => AudioManager.playSFX('click'), []);
  const playComplete = useCallback(() => AudioManager.playSFX('complete'), []);
  const playReward = useCallback(() => AudioManager.playSFX('reward'), []);
  const playLevelUp = useCallback(() => AudioManager.playSFX('levelup'), []);
  const playError = useCallback(() => AudioManager.playSFX('error'), []);
  const playDetect = useCallback(() => AudioManager.playSFX('detect'), []);
  const playFirework = useCallback(() => AudioManager.playSFX('firework'), []);
  const playTyping = useCallback(() => AudioManager.playSFX('typing'), []);
  const unlockAudio = useCallback(() => AudioManager.unlockAudioContext(), []);

  return useMemo(() => ({
    playBGM,
    stopBGM,
    fadeOutBGM,
    playSFX,
    playClick,
    playComplete,
    playReward,
    playLevelUp,
    playError,
    playDetect,
    playFirework,
    playTyping,
    unlockAudio,
  }), [
    playBGM,
    stopBGM,
    fadeOutBGM,
    playSFX,
    playClick,
    playComplete,
    playReward,
    playLevelUp,
    playError,
    playDetect,
    playFirework,
    playTyping,
    unlockAudio,
  ]);
}
