/**
 * Neuro-TOEIC Part 4 Studio Pro — Pro Audio & Waveform Engine
 * Powered by Web Audio API, HiDPI Theme-Adaptive Canvas Waveform,
 * Seek-Aware Boundary Skipping, A-B Loop & Ambient Soundscape Synthesizer
 */

import { getCachedWaveform, setCachedWaveform } from "./idb.js";
import { recordActiveTime } from "./store.js?v=27.0";

let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

const THEME_WAVE_PALETTES = {
  light: {
    played: "#0369a1",
    unplayed: "#bae6fd",
    hover: "#0284c7",
    cursor: "#0f2942",
    loopBg: "rgba(14, 165, 233, 0.18)",
    loopLine: "#0369a1",
    skipBg: "rgba(66, 93, 120, 0.12)",
    skipLine: "#425d78",
    boundLine: "rgba(66, 93, 120, 0.42)"
  },
  dark: {
    played: "#3b82f6",
    unplayed: "#2c3c55",
    hover: "#93c5fd",
    cursor: "#f8fafc",
    loopBg: "rgba(59, 130, 246, 0.24)",
    loopLine: "#60a5fa",
    skipBg: "rgba(148, 163, 184, 0.14)",
    skipLine: "#94a3b8",
    boundLine: "rgba(148, 163, 184, 0.4)"
  }
};

function drawRoundedBar(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

export class AudioEngine {
  constructor(audioEl, canvasEl, options = {}) {
    this.audio = audioEl;
    this.canvas = canvasEl;
    this.options = options; // { segments: [], talkKey: '', talkBounds: {}, playIntro: true, playQuestions: true, onTimeUpdate: fn, onPlayStateChange: fn, onMonologueEnd: fn, onWaveformHover: fn }

    this.talkBounds = options.talkBounds || null;
    this.playIntro = options.playIntro !== false;
    this.playQuestions = options.playQuestions !== false;
    this.peaks = null;
    this.isDecoding = false;
    this.loopA = null;
    this.loopB = null;
    this.isLooping = false;
    this.hoverTime = null;
    this.hoverX = null;
    this.isMonologueEnded = false;
    this.userSeeking = false;
    this.lastPlayTime = null;

    this._destroyed = false;
    this._isInternalSkip = false;
    this._pendingIntroSkip = false;
    this._deliberateIntroSeek = false;
    this._deliberateQuestionsSeek = false;
    this._seekResetTimer = null;
    this._rafId = null;
    this._resizeObserver = null;
    this._themeObserver = null;
    this._abortCtrl = null;
    this.activeTimeTicker = null;

    if (this.audio) {
      this.audio.preservesPitch = true;
      if ("mozPreservesPitch" in this.audio) this.audio.mozPreservesPitch = true;
      if ("webkitPreservesPitch" in this.audio) this.audio.webkitPreservesPitch = true;
    }

    this._handlers = {
      onTimeUpdate: () => this.handleTimeUpdate(),
      onLoadedMetadata: () => {
        if (this._destroyed) return;
        this._tryApplyPendingIntroSkip();
        this.scheduleDraw();
        if (this.options.onTimeUpdate && this.audio) {
          this.options.onTimeUpdate(this.audio.currentTime || 0, this.audio.duration || 0);
        }
      },
      onCanPlay: () => {
        if (this._destroyed) return;
        this._tryApplyPendingIntroSkip();
      },
      onSeeking: () => {
        if (this._destroyed || !this.audio) return;
        if (this._isInternalSkip) return;

        this.userSeeking = true;
        if (this._seekResetTimer) clearTimeout(this._seekResetTimer);

        if (this.talkBounds) {
          const cur = this.audio.currentTime || 0;
          const introTarget = this.talkBounds.talkStart || this.talkBounds.introEnd || 0;
          if (introTarget > 0 && cur < introTarget) {
            this._deliberateIntroSeek = true;
          }
          if (this.talkBounds.questionsStart > 0 && cur >= this.talkBounds.questionsStart - 0.25) {
            this._deliberateQuestionsSeek = true;
            this.isMonologueEnded = false;
          } else {
            this._deliberateQuestionsSeek = false;
            if (this.talkBounds.questionsStart > 0 && cur < this.talkBounds.questionsStart) {
              this.isMonologueEnded = false;
            }
          }
        }
      },
      onSeeked: () => {
        if (this._destroyed || !this.audio) return;
        this.lastPlayTime = this.audio.currentTime;
        if (this.talkBounds && this.talkBounds.questionsStart > 0 && this.audio.currentTime < this.talkBounds.questionsStart - 0.25) {
          this.isMonologueEnded = false;
          this._deliberateQuestionsSeek = false;
        }
        if (this._seekResetTimer) clearTimeout(this._seekResetTimer);
        this._seekResetTimer = setTimeout(() => {
          this.userSeeking = false;
          this._isInternalSkip = false;
          this._seekResetTimer = null;
        }, 160);
        this.scheduleDraw();
      },
      onPlay: () => {
        if (this._destroyed || !this.audio) return;
        const introTarget = this.talkBounds ? (this.talkBounds.talkStart || this.talkBounds.introEnd || 0) : 0;

        // Skip intro ONLY when starting fresh near 0s (< 0.4s) and NOT from a deliberate user seek into intro
        if (!this.playIntro && introTarget > 0 && !this.userSeeking && !this._deliberateIntroSeek) {
          if (this.audio.currentTime < 0.4) {
            this._pendingIntroSkip = true;
            this._tryApplyPendingIntroSkip();
          }
        }

        if (this.talkBounds && this.talkBounds.questionsStart > 0 && this.audio.currentTime < this.talkBounds.questionsStart - 0.25) {
          this.isMonologueEnded = false;
          this._deliberateQuestionsSeek = false;
        }

        if (this.options.onPlayStateChange) this.options.onPlayStateChange(true);
        this.startActiveTracking();
      },
      onPause: () => {
        if (this._destroyed) return;
        this._pendingIntroSkip = false;
        if (this.options.onPlayStateChange) this.options.onPlayStateChange(false);
        this.stopActiveTracking();
      },
      onEnded: () => {
        if (this._destroyed || !this.audio) return;
        this._pendingIntroSkip = false;
        this._deliberateIntroSeek = false;
        this._deliberateQuestionsSeek = false;
        this.isMonologueEnded = false;
        this.lastPlayTime = null;

        if (this.isLooping && this.loopA !== null) {
          this._isInternalSkip = true;
          this.audio.currentTime = this.loopA;
          this.audio.play().catch(() => {});
        } else {
          if (this.options.onPlayStateChange) this.options.onPlayStateChange(false);
          this.stopActiveTracking();
          this.scheduleDraw();
        }
      },
      onCanvasClick: (e) => this.handleWaveformClick(e),
      onCanvasMove: (e) => this.handleWaveformHover(e),
      onCanvasLeave: () => {
        if (this._destroyed) return;
        this.hoverTime = null;
        this.hoverX = null;
        this.scheduleDraw();
        if (this.options.onWaveformHover) this.options.onWaveformHover(null);
      },
      onWindowResize: () => this.scheduleDraw()
    };

    this.initEvents();
    this.initObservers();
    this.loadWaveform();
  }

  _tryApplyPendingIntroSkip() {
    if (!this._pendingIntroSkip || this._destroyed || !this.audio || this.audio.paused) return false;
    if (this.playIntro || this._deliberateIntroSeek) {
      this._pendingIntroSkip = false;
      return false;
    }
    const introTarget = this.talkBounds ? (this.talkBounds.talkStart || this.talkBounds.introEnd || 0) : 0;
    if (introTarget <= 0) {
      this._pendingIntroSkip = false;
      return false;
    }
    if (this.audio.currentTime >= introTarget - 0.15) {
      this._pendingIntroSkip = false;
      return true;
    }
    try {
      this._isInternalSkip = true;
      this.audio.currentTime = introTarget;
      if (this.audio.currentTime >= introTarget - 0.2) {
        this._pendingIntroSkip = false;
        this.lastPlayTime = introTarget;
        return true;
      }
    } catch (_) {}
    this._isInternalSkip = false;
    return false;
  }

  setPlayIntro(enabled) {
    this.playIntro = Boolean(enabled);
    if (this.playIntro) this._pendingIntroSkip = false;
    this._deliberateIntroSeek = false;
    this.scheduleDraw();
  }

  setPlayQuestions(enabled) {
    this.playQuestions = Boolean(enabled);
    this.isMonologueEnded = false;
    if (this.playQuestions) {
      this._deliberateQuestionsSeek = false;
    }
    this.scheduleDraw();
  }

  initEvents() {
    if (this.audio) {
      this.audio.addEventListener("timeupdate", this._handlers.onTimeUpdate);
      this.audio.addEventListener("loadedmetadata", this._handlers.onLoadedMetadata);
      this.audio.addEventListener("durationchange", this._handlers.onLoadedMetadata);
      this.audio.addEventListener("canplay", this._handlers.onCanPlay);
      this.audio.addEventListener("canplaythrough", this._handlers.onCanPlay);
      this.audio.addEventListener("progress", this._handlers.onCanPlay);
      this.audio.addEventListener("seeking", this._handlers.onSeeking);
      this.audio.addEventListener("seeked", this._handlers.onSeeked);
      this.audio.addEventListener("play", this._handlers.onPlay);
      this.audio.addEventListener("pause", this._handlers.onPause);
      this.audio.addEventListener("ended", this._handlers.onEnded);
    }

    if (this.canvas) {
      this.canvas.addEventListener("click", this._handlers.onCanvasClick);
      this.canvas.addEventListener("mousemove", this._handlers.onCanvasMove);
      this.canvas.addEventListener("mouseleave", this._handlers.onCanvasLeave);
    }

    window.addEventListener("resize", this._handlers.onWindowResize, { passive: true });
  }

  initObservers() {
    if (this.canvas && typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(() => {
        this.scheduleDraw();
      });
      this._resizeObserver.observe(this.canvas.parentElement || this.canvas);
    }

    if (typeof MutationObserver !== "undefined" && document.documentElement) {
      this._themeObserver = new MutationObserver(() => {
        this.scheduleDraw();
      });
      this._themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class"]
      });
    }
  }

  scheduleDraw() {
    if (this._destroyed || !this.canvas) return;
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      if (!this._destroyed) {
        this.drawWaveform();
      }
    });
  }

  startActiveTracking() {
    this.stopActiveTracking();
    this.activeTimeTicker = setInterval(() => {
      recordActiveTime(1);
    }, 1000);
  }

  stopActiveTracking() {
    if (this.activeTimeTicker) {
      clearInterval(this.activeTimeTicker);
      this.activeTimeTicker = null;
    }
  }

  handleTimeUpdate() {
    if (this._destroyed || !this.audio) return;
    if (this._pendingIntroSkip) {
      this._tryApplyPendingIntroSkip();
    }
    const cur = this.audio.currentTime;

    // Clear deliberate intro flag once playback moves past intro
    const introTarget = this.talkBounds ? (this.talkBounds.talkStart || this.talkBounds.introEnd || 0) : 0;
    if (this._deliberateIntroSeek && introTarget > 0 && cur >= introTarget) {
      this._deliberateIntroSeek = false;
    }

    // Check A-B loop boundary first
    if (this.isLooping && this.loopB !== null && this.loopA !== null) {
      if (cur >= this.loopB) {
        this._isInternalSkip = true;
        this.audio.currentTime = this.loopA;
        this.lastPlayTime = this.loopA;
        this.drawWaveform();
        if (this.options.onTimeUpdate) {
          this.options.onTimeUpdate(this.loopA, this.audio.duration || 0);
        }
        return;
      }
    } else if (
      !this.playQuestions &&
      this.talkBounds &&
      this.talkBounds.questionsStart > 0 &&
      !this.userSeeking &&
      !this._deliberateQuestionsSeek
    ) {
      // Natural continuous crossing of questionsStart from the monologue segment
      const qStart = this.talkBounds.questionsStart;
      const wasBefore = this.lastPlayTime !== null && this.lastPlayTime < qStart;
      const isNowPast = cur >= qStart;
      const delta = this.lastPlayTime !== null ? (cur - this.lastPlayTime) : 0;
      const isNormalStep = delta >= 0 && delta < 2.2;

      if (wasBefore && isNowPast && isNormalStep && !this.isMonologueEnded) {
        this.isMonologueEnded = true;
        this.audio.pause();
        if (this.options.onPlayStateChange) this.options.onPlayStateChange(false);
        if (this.options.onMonologueEnd) this.options.onMonologueEnd();
      }
    }

    this.lastPlayTime = cur;
    this.drawWaveform();

    if (this.options.onTimeUpdate) {
      this.options.onTimeUpdate(cur, this.audio.duration || 0);
    }
  }

  setSpeed(rate) {
    if (this.audio && Number.isFinite(rate) && rate > 0) {
      this.audio.playbackRate = rate;
    }
  }

  setABLoop(a, b) {
    this.loopA = Math.max(0, a);
    this.loopB = Math.max(this.loopA + 0.5, b);
    this.isLooping = true;
    this.drawWaveform();
  }

  clearABLoop() {
    this.loopA = null;
    this.loopB = null;
    this.isLooping = false;
    this.drawWaveform();
  }

  setSentenceLoop(segStart, segEnd) {
    if (this.isLooping && this.loopA === segStart && this.loopB === segEnd) {
      this.clearABLoop();
      return false;
    }
    this.setABLoop(segStart, segEnd);
    if (this.audio) {
      if (this.talkBounds && this.talkBounds.questionsStart > 0 && segStart >= this.talkBounds.questionsStart - 0.25) {
        this._deliberateQuestionsSeek = true;
      }
      if (this.talkBounds && (this.talkBounds.talkStart || this.talkBounds.introEnd) > 0 && segStart < (this.talkBounds.talkStart || this.talkBounds.introEnd)) {
        this._deliberateIntroSeek = true;
      }
      this.audio.currentTime = segStart;
      this.audio.play().catch(() => {});
    }
    return true;
  }

  async loadWaveform() {
    if (!this.canvas || !this.audio || this._destroyed) return;
    const url = this.audio.currentSrc || this.audio.getAttribute("src") || this.audio.src;
    if (!url) return;

    // 1. Try IndexedDB Cache first (0ms instant!)
    try {
      const cached = await getCachedWaveform(url);
      if (this._destroyed) return;
      if (cached && cached.length) {
        this.peaks = cached;
        this.drawWaveform();
        return;
      }
    } catch (_) {}

    // 2. Decode via Web Audio API once
    if (this.isDecoding || this._destroyed) return;
    this.isDecoding = true;
    this._abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;

    try {
      const resp = await fetch(url, this._abortCtrl ? { signal: this._abortCtrl.signal } : undefined);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuffer = await resp.arrayBuffer();
      if (this._destroyed) return;

      const OfflineAudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      let audioBuffer = null;
      if (OfflineAudioCtx) {
        const offlineCtx = new OfflineAudioCtx(1, 1, 44100);
        audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      } else {
        const ctx = getAudioContext();
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      }
      if (this._destroyed) return;

      // Decimate to 300 normalized perceptual peaks
      const channelData = audioBuffer.getChannelData(0);
      const totalSamples = channelData.length;
      const numPeaks = 300;
      const step = Math.max(1, Math.floor(totalSamples / numPeaks));
      const rawPeaks = new Float32Array(numPeaks);
      let globalMax = 0.01;

      for (let i = 0; i < numPeaks; i++) {
        let max = 0;
        const start = i * step;
        const end = Math.min(start + step, totalSamples);
        const stride = Math.max(1, Math.floor((end - start) / 64));
        for (let j = start; j < end; j += stride) {
          const val = Math.abs(channelData[j]);
          if (val > max) max = val;
        }
        rawPeaks[i] = max;
        if (max > globalMax) globalMax = max;
      }

      const normalized = new Array(numPeaks);
      for (let i = 0; i < numPeaks; i++) {
        normalized[i] = Math.min(1, Math.max(0.04, rawPeaks[i] / globalMax));
      }

      this.peaks = normalized;
      await setCachedWaveform(url, this.peaks);
      if (!this._destroyed) this.drawWaveform();
    } catch (err) {
      if (this._destroyed || (err && err.name === "AbortError")) return;
      // Deterministic clean fallback wave (avoids jitter on redraw)
      this.peaks = Array.from({ length: 220 }, (_, idx) => {
        const wave = 0.38 + 0.28 * Math.sin(idx * 0.23) + 0.16 * Math.cos(idx * 0.61);
        return Math.min(0.92, Math.max(0.12, wave));
      });
      this.drawWaveform();
    } finally {
      this.isDecoding = false;
      this._abortCtrl = null;
    }
  }

  getThemeColors() {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const base = THEME_WAVE_PALETTES[theme] || THEME_WAVE_PALETTES.light;
    try {
      const styles = getComputedStyle(document.documentElement);
      const played = styles.getPropertyValue("--wave-played").trim() || base.played;
      const unplayed = styles.getPropertyValue("--wave-unplayed").trim() || base.unplayed;
      const hover = styles.getPropertyValue("--wave-hover").trim() || base.hover;
      const cursor = styles.getPropertyValue("--wave-cursor").trim() || base.cursor;
      const loopBg = styles.getPropertyValue("--wave-loop-bg").trim() || base.loopBg;
      const loopLine = styles.getPropertyValue("--accent").trim() || base.loopLine;
      return {
        ...base,
        played,
        unplayed,
        hover,
        cursor,
        loopBg,
        loopLine
      };
    } catch (_) {
      return base;
    }
  }

  drawWaveform() {
    if (this._destroyed || !this.canvas || !this.peaks || !this.peaks.length) return;

    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelW = Math.round(rect.width * dpr);
    const pixelH = Math.round(rect.height * dpr);

    if (this.canvas.width !== pixelW || this.canvas.height !== pixelH) {
      this.canvas.width = pixelW;
      this.canvas.height = pixelH;
    }

    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;
    const rawDur = this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : 0;
    const duration = rawDur || 1;
    const curTime = this.audio ? (this.audio.currentTime || 0) : 0;
    const progress = rawDur > 0 ? Math.min(1, Math.max(0, curTime / rawDur)) : 0;
    const playedX = progress * w;
    const hoverX = this.hoverX !== null ? Math.min(w, Math.max(0, this.hoverX)) : null;

    const palette = this.getThemeColors();

    // 1. Draw Intro / Questions skipped overlays behind bars
    if (this.talkBounds && rawDur > 0) {
      const introLimit = this.talkBounds.introEnd || 0;
      if (introLimit > 0 && introLimit < rawDur && !this.playIntro) {
        const xIntro = (introLimit / rawDur) * w;
        ctx.fillStyle = palette.skipBg;
        ctx.fillRect(0, 0, xIntro, h);
      }
      const qStart = this.talkBounds.questionsStart || 0;
      if (qStart > 0 && qStart < rawDur && !this.playQuestions) {
        const xQ = (qStart / rawDur) * w;
        ctx.fillStyle = palette.skipBg;
        ctx.fillRect(xQ, 0, w - xQ, h);
      }
    }

    // 2. Draw A-B loop highlight region
    if (this.isLooping && this.loopA !== null && this.loopB !== null && rawDur > 0) {
      const xA = Math.max(0, Math.min(w, (this.loopA / rawDur) * w));
      const xB = Math.max(0, Math.min(w, (this.loopB / rawDur) * w));
      ctx.fillStyle = palette.loopBg;
      ctx.fillRect(xA, 0, Math.max(2, xB - xA), h);
    }

    // 3. Adaptive bar count so HiDPI waveform stays crisp on both mobile (320px) and ultrawide (1600px)
    const targetSlots = Math.max(60, Math.min(this.peaks.length, Math.floor(w / 3.2)));
    const slotW = w / targetSlots;
    const gap = slotW >= 3.2 ? 1.15 : 0.75;
    const barWidth = Math.max(1.35, slotW - gap);
    const midY = h / 2;

    for (let i = 0; i < targetSlots; i++) {
      const srcIdx = Math.min(this.peaks.length - 1, Math.floor((i / targetSlots) * this.peaks.length));
      const val = this.peaks[srcIdx];
      const x = i * slotW;
      const barH = Math.max(2.5, val * (h * 0.84));

      let fill = palette.unplayed;
      if (x + barWidth * 0.5 <= playedX) {
        fill = palette.played;
      } else if (hoverX !== null && x <= hoverX && hoverX > playedX) {
        fill = palette.hover;
      }

      ctx.fillStyle = fill;
      drawRoundedBar(ctx, x, midY - barH / 2, barWidth, barH, Math.min(2, barWidth / 2));
    }

    // 4. Draw Intro / Questions dashed boundary guides
    if (this.talkBounds && rawDur > 0) {
      const introLimit = this.talkBounds.introEnd || 0;
      if (introLimit > 0 && introLimit < rawDur) {
        const xIntro = Math.round((introLimit / rawDur) * w) + 0.5;
        ctx.strokeStyle = this.playIntro ? palette.boundLine : palette.skipLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(xIntro, 0);
        ctx.lineTo(xIntro, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const qStart = this.talkBounds.questionsStart || 0;
      if (qStart > 0 && qStart < rawDur) {
        const xQ = Math.round((qStart / rawDur) * w) + 0.5;
        ctx.strokeStyle = this.playQuestions ? palette.boundLine : palette.skipLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(xQ, 0);
        ctx.lineTo(xQ, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 5. Draw A-B loop flag lines on top
    if (this.isLooping && this.loopA !== null && this.loopB !== null && rawDur > 0) {
      const xA = Math.max(1, Math.min(w - 1, (this.loopA / rawDur) * w));
      const xB = Math.max(1, Math.min(w - 1, (this.loopB / rawDur) * w));
      ctx.strokeStyle = palette.loopLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xA, 0);
      ctx.lineTo(xA, h);
      ctx.moveTo(xB, 0);
      ctx.lineTo(xB, h);
      ctx.stroke();
    }

    // 6. Hover scrub hairline
    if (hoverX !== null) {
      ctx.strokeStyle = palette.hover;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(hoverX) + 0.5, 0);
      ctx.lineTo(Math.round(hoverX) + 0.5, h);
      ctx.stroke();
    }

    // 7. Crisp Playhead cursor
    if (rawDur > 0 || curTime > 0) {
      const cursorX = Math.max(1, Math.min(w - 1.5, playedX));
      ctx.fillStyle = palette.cursor;
      ctx.fillRect(cursorX - 1, 0, 2.2, h);
    }

    ctx.restore();
  }

  handleWaveformClick(e) {
    if (this._destroyed || !this.canvas || !this.audio) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const duration = this.audio.duration || 0;
    if (duration > 0) {
      const targetTime = pct * duration;
      if (this.talkBounds) {
        const introTarget = this.talkBounds.talkStart || this.talkBounds.introEnd || 0;
        this._deliberateIntroSeek = introTarget > 0 && targetTime < introTarget;
        this._deliberateQuestionsSeek = this.talkBounds.questionsStart > 0 && targetTime >= this.talkBounds.questionsStart - 0.25;
        if (!this._deliberateQuestionsSeek) {
          this.isMonologueEnded = false;
        }
      }
      this.audio.currentTime = targetTime;
      this.lastPlayTime = targetTime;
      this.drawWaveform();
    }
  }

  handleWaveformHover(e) {
    if (this._destroyed || !this.canvas || !this.audio) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) return;

    const hoverX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = hoverX / rect.width;
    const duration = this.audio.duration || 0;
    this.hoverTime = pct * duration;
    this.hoverX = hoverX;
    this.scheduleDraw();

    let segText = "";
    if (this.options.segments && duration > 0) {
      const seg = this.options.segments.find((s) => this.hoverTime >= s.s && this.hoverTime <= s.e);
      if (seg) segText = seg.t;
    }

    if (this.options.onWaveformHover) {
      const clampedTooltipX = Math.max(36, Math.min(rect.width - 36, hoverX));
      this.options.onWaveformHover({
        time: this.hoverTime,
        text: segText,
        x: clampedTooltipX
      });
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.stopActiveTracking();

    if (this._seekResetTimer) {
      clearTimeout(this._seekResetTimer);
      this._seekResetTimer = null;
    }
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._abortCtrl) {
      try { this._abortCtrl.abort(); } catch (_) {}
      this._abortCtrl = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }

    if (this.audio && this._handlers) {
      this.audio.removeEventListener("timeupdate", this._handlers.onTimeUpdate);
      this.audio.removeEventListener("loadedmetadata", this._handlers.onLoadedMetadata);
      this.audio.removeEventListener("durationchange", this._handlers.onLoadedMetadata);
      this.audio.removeEventListener("canplay", this._handlers.onCanPlay);
      this.audio.removeEventListener("canplaythrough", this._handlers.onCanPlay);
      this.audio.removeEventListener("progress", this._handlers.onCanPlay);
      this.audio.removeEventListener("seeking", this._handlers.onSeeking);
      this.audio.removeEventListener("seeked", this._handlers.onSeeked);
      this.audio.removeEventListener("play", this._handlers.onPlay);
      this.audio.removeEventListener("pause", this._handlers.onPause);
      this.audio.removeEventListener("ended", this._handlers.onEnded);
    }

    if (this.canvas && this._handlers) {
      this.canvas.removeEventListener("click", this._handlers.onCanvasClick);
      this.canvas.removeEventListener("mousemove", this._handlers.onCanvasMove);
      this.canvas.removeEventListener("mouseleave", this._handlers.onCanvasLeave);
    }

    if (this._handlers) {
      window.removeEventListener("resize", this._handlers.onWindowResize);
    }
  }
}

/**
 * Ambient Soundscape Generator (Web Audio Synthesizer)
 * Soft Rain / Warm Room Pink Noise generator
 */
class AmbientSoundscape {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    this.ctx = getAudioContext();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.2;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.value = 900;

    this.gainNode.connect(this.ctx.destination);
    this.filterNode.connect(this.gainNode);
  }

  start(type = "rain", volume = 0.2) {
    this.init();
    if (!this.ctx) return;
    if (this.isPlaying) this.stop();

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise / rain pattern
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.filterNode.frequency.setValueAtTime(type === "rain" ? 1100 : 650, this.ctx.currentTime);
    this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.noiseNode.start(0);
    this.isPlaying = true;
  }

  setVolume(vol) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  setType(type) {
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setValueAtTime(type === "rain" ? 1100 : 650, this.ctx.currentTime);
    }
  }

  stop() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (_) {}
      try { this.noiseNode.disconnect(); } catch (_) {}
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }
}

export const ambientSoundscape = new AmbientSoundscape();
