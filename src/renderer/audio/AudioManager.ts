// ============================================================
// VibeGuide - 音频管理器 (Web Audio API)
// 单例模式，管理 BGM 和 SFX 的播放
// ============================================================
import { BGMTrack, SFXId } from '../../shared/types';
import { allTracks, Track } from './tracks';
import { allSFX, SFXDef } from './sfx';

class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // BGM playback state
  private currentTrack: BGMTrack | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmTimeouts: ReturnType<typeof setTimeout>[] = [];
  private bgmLoopTimeout: ReturnType<typeof setTimeout> | null = null;
  private isBGMPlaying = false;

  private musicVolume = 0.7;
  private sfxVolume = 0.8;

  // ============================================================
  // Initialization
  // ============================================================
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }
    return this.ctx;
  }

  async unlockAudioContext() {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (error) {
        console.warn('AudioContext resume failed:', error);
      }
    }
  }

  // ============================================================
  // Volume Control
  // ============================================================
  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.musicGain) {
      this.musicGain.gain.value = v;
    }
  }

  setSFXVolume(v: number) {
    this.sfxVolume = v;
    if (this.sfxGain) {
      this.sfxGain.gain.value = v;
    }
  }

  getMusicVolume(): number { return this.musicVolume; }
  getSFXVolume(): number { return this.sfxVolume; }

  // ============================================================
  // BGM Playback
  // ============================================================
  playBGM(trackId: BGMTrack) {
    if (this.currentTrack === trackId && this.isBGMPlaying) return;
    this.stopBGM();
    this.currentTrack = trackId;
    this.isBGMPlaying = true;

    const track = allTracks[trackId];
    if (!track) return;

    this.scheduleTrack(track);
  }

  private scheduleTrack(track: Track) {
    const ctx = this.ensureContext();
    const beatDuration = 60 / track.bpm;
    let maxChannelDuration = 0;

    // 调度所有声道的音符
    for (const channel of track.channels) {
      let time = 0;
      for (const note of channel.notes) {
        const noteStart = time;
        const noteDuration = note.duration * beatDuration;

        if (note.freq > 0) {
          const timeout = setTimeout(() => {
            if (!this.isBGMPlaying) return;
            this.playTone(
              note.freq,
              noteDuration * 0.9,
              channel.type,
              channel.gain,
              this.musicGain!
            );
          }, noteStart * 1000);
          this.bgmTimeouts.push(timeout);
        }

        time += noteDuration;
      }
      maxChannelDuration = Math.max(maxChannelDuration, time);
    }

    // 循环：统一用最长声道时长设一个 loop timeout，避免多声道各自循环导致重叠
    if (track.loop && maxChannelDuration > 0) {
      this.bgmLoopTimeout = setTimeout(() => {
        if (this.isBGMPlaying && this.currentTrack) {
          for (const t of this.bgmTimeouts) clearTimeout(t);
          this.bgmTimeouts = [];
          this.scheduleTrack(track);
        }
      }, maxChannelDuration * 1000);
    }
  }

  stopBGM() {
    this.isBGMPlaying = false;
    this.currentTrack = null;

    // 清除所有调度的 timeout
    for (const t of this.bgmTimeouts) clearTimeout(t);
    this.bgmTimeouts = [];
    if (this.bgmLoopTimeout) {
      clearTimeout(this.bgmLoopTimeout);
      this.bgmLoopTimeout = null;
    }

    // 停止正在播放的振荡器
    for (const osc of this.bgmOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.bgmOscillators = [];
  }

  fadeOut(duration: number = 1) {
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicVolume, now);
      this.musicGain.gain.linearRampToValueAtTime(0, now + duration);
      setTimeout(() => {
        this.stopBGM();
        if (this.musicGain) {
          this.musicGain.gain.value = this.musicVolume;
        }
      }, duration * 1000);
    } else {
      this.stopBGM();
    }
  }

  // ============================================================
  // SFX Playback
  // ============================================================
  playSFX(sfxId: SFXId) {
    const sfxDef = allSFX[sfxId];
    if (!sfxDef) return;
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      void ctx.resume()
        .then(() => this.scheduleSFX(sfxDef))
        .catch(() => {
          // ignore browser autoplay rejection; next user gesture will unlock
        });
      return;
    }
    this.scheduleSFX(sfxDef);
  }

  private scheduleSFX(sfx: SFXDef) {
    for (const tone of sfx.tones) {
      setTimeout(() => {
        this.playTone(
          tone.freq,
          tone.duration,
          tone.type,
          tone.gain,
          this.sfxGain!,
          tone.slide
        );
      }, tone.delay * 1000);
    }
  }

  // ============================================================
  // Core Tone Playback
  // ============================================================
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    destination: GainNode,
    slideTarget?: number
  ) {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    // 频率滑动 (用于烟花上升音效等)
    if (slideTarget) {
      osc.frequency.linearRampToValueAtTime(slideTarget, ctx.currentTime + duration);
    }

    gainNode.gain.value = gain;
    // 8-bit 风格：快速 attack，短 release
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime + duration * 0.8);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);

    // 跟踪 BGM oscillators 以便停止
    if (destination === this.musicGain) {
      this.bgmOscillators.push(osc);
      osc.onended = () => {
        const idx = this.bgmOscillators.indexOf(osc);
        if (idx >= 0) this.bgmOscillators.splice(idx, 1);
      };
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================
  dispose() {
    this.stopBGM();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// 单例导出
export const AudioManager = new AudioManagerClass();
