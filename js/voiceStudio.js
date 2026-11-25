/**
 * Neuro-TOEIC Part 4 Studio Pro — Voice Shadowing Studio
 * MediaRecorder + HiDPI Live Mic Meter + Zero-Leak Lifecycle + Smooth A/B Dual Comparison
 */

import { saveShadowingRecording, getShadowingRecording } from "./idb.js";
import { updateMastery } from "./store.js?v=26.1";

const liveStudiosByKey = new Map();

function mapMicErrorToVietnamese(err) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "Trình duyệt không hỗ trợ ghi âm Microphone (vui lòng mở bằng Chrome/Edge qua HTTPS hoặc localhost).";
  }
  const name = err && err.name ? String(err.name) : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Quyền truy cập Microphone đã bị từ chối. Vui lòng bấm biểu tượng ổ khóa trên thanh địa chỉ trình duyệt để cấp quyền Micro.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Không tìm thấy thiết bị Microphone nào trên máy. Vui lòng kết nối tai nghe/micro rồi thử lại.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Microphone đang bận hoặc bị ứng dụng khác chiếm quyền. Vui lòng đóng ứng dụng đang dùng micro rồi thử lại.";
  }
  if (name === "SecurityError") {
    return "Trình duyệt chặn Microphone do chính sách bảo mật trang. Vui lòng kiểm tra cài đặt quyền riêng tư.";
  }
  return "Không thể truy cập Microphone. Vui lòng kiểm tra kết nối thiết bị và cấp quyền micro cho trình duyệt.";
}

function showStudioToast(msg, variant = "bad") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${variant === "bad" ? "is-bad" : variant === "success" ? "is-success" : ""}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 240);
  }, 3200);
}

export class VoiceStudio {
  constructor(talkKey, meterCanvasEl, options = {}) {
    // Auto-destroy any previous instance bound to the same talkKey to prevent leaks on re-render
    const prev = liveStudiosByKey.get(talkKey);
    if (prev && prev !== this) {
      prev.destroy();
    }

    this.talkKey = talkKey;
    this.canvas = meterCanvasEl;
    this.options = options; // { onStateChange: fn }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isComparing = false;
    this.userAudioUrl = null;
    this.userAudioEl = new Audio();
    this.userAudioEl.preload = "metadata";
    this.recordedDurationSec = 0;

    this.audioCtx = null;
    this.sourceNode = null;
    this.analyser = null;
    this.animFrameId = null;
    this.stream = null;

    this._destroyed = false;
    this._recordStartedAt = 0;
    this._compareCancel = null;

    liveStudiosByKey.set(talkKey, this);
    this.loadSavedRecording();
  }

  getPanelEl() {
    return this.canvas ? this.canvas.closest(".shadowing-panel") : null;
  }

  renderInlineStatus(text = "", tone = "muted") {
    const panel = this.getPanelEl();
    if (!panel) return;

    let statusEl = panel.querySelector(".shadowing-inline-status");
    if (!text) {
      if (statusEl) statusEl.remove();
      return;
    }

    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "shadowing-inline-status";
      panel.appendChild(statusEl);
    }

    const isError = tone === "error";
    const isActive = tone === "active";
    statusEl.style.cssText = `
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.45;
      padding: 7px 11px;
      border-radius: var(--radius-sm);
      border: 1px solid ${isError ? "var(--bad-border)" : isActive ? "var(--accent-border)" : "var(--border)"};
      background: ${isError ? "var(--bad-soft)" : isActive ? "var(--accent-soft)" : "var(--surface-2)"};
      color: ${isError ? "var(--bad)" : isActive ? "var(--accent)" : "var(--text-muted)"};
    `;
    statusEl.textContent = text;
  }

  revokeUserAudioUrl() {
    if (this.userAudioEl) {
      try {
        this.userAudioEl.pause();
        this.userAudioEl.removeAttribute("src");
        this.userAudioEl.load();
      } catch (_) {}
    }
    if (this.userAudioUrl) {
      try {
        URL.revokeObjectURL(this.userAudioUrl);
      } catch (_) {}
      this.userAudioUrl = null;
    }
  }

  cleanupAudioGraph() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }
    this.analyser = null;
    if (this.audioCtx) {
      try { this.audioCtx.close().catch(() => {}); } catch (_) {}
      this.audioCtx = null;
    }
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      this.stream = null;
    }
  }

  async loadSavedRecording() {
    try {
      const saved = await getShadowingRecording(this.talkKey);
      if (this._destroyed) return;
      if (saved && saved.blob) {
        this.revokeUserAudioUrl();
        this.userAudioUrl = URL.createObjectURL(saved.blob);
        this.userAudioEl.src = this.userAudioUrl;
        if (saved.durationSec && Number.isFinite(saved.durationSec)) {
          this.recordedDurationSec = saved.durationSec;
        }
        if (this.options.onStateChange) {
          this.options.onStateChange({ hasRecording: true, isRecording: false });
        }
      }
    } catch (_) {}
  }

  async startRecording() {
    if (this._destroyed) return false;
    this.cancelDualComparison();
    this.renderInlineStatus("", "muted");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw Object.assign(new Error("Unsupported"), { name: "NotSupportedError" });
      }

      this.cleanupAudioGraph();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (this._destroyed) {
        this.cleanupAudioGraph();
        return false;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        if (this.audioCtx.state === "suspended") {
          await this.audioCtx.resume().catch(() => {});
        }
        this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.72;
        this.sourceNode.connect(this.analyser);
      }

      this.audioChunks = [];
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mimeType = "audio/webm;codecs=opus";
        else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
      }

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this._recordStartedAt = Date.now();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const elapsedSec = Math.max(0.5, (Date.now() - this._recordStartedAt) / 1000);
        this.cleanupAudioGraph();
        this.clearMicMeter();

        if (this._destroyed || !this.audioChunks.length) return;

        const mime = (this.mediaRecorder && this.mediaRecorder.mimeType) || mimeType || "audio/webm";
        const blob = new Blob(this.audioChunks, { type: mime });
        this.audioChunks = [];

        // Revoke previous URL before creating new blob URL to prevent memory leaks
        this.revokeUserAudioUrl();
        this.recordedDurationSec = elapsedSec;
        this.userAudioUrl = URL.createObjectURL(blob);
        this.userAudioEl.src = this.userAudioUrl;

        try {
          await saveShadowingRecording(this.talkKey, blob, {
            mimeType: mime,
            durationSec: elapsedSec
          });
        } catch (_) {}

        updateMastery(this.talkKey, "shadowing", true);
        this.renderInlineStatus(`Đã lưu bản thu (${elapsedSec.toFixed(1)}s). Bấm "So sánh tuần tự" để đối chiếu với người bản xứ.`, "muted");

        if (this.options.onStateChange) {
          this.options.onStateChange({ hasRecording: true, isRecording: false });
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.drawMicMeter();
      this.renderInlineStatus("Đang thu âm giọng nói của bạn... Hãy đọc to rõ theo nhịp bản xứ.", "active");

      if (this.options.onStateChange) {
        this.options.onStateChange({ hasRecording: Boolean(this.userAudioUrl), isRecording: true });
      }
      return true;
    } catch (err) {
      this.cleanupAudioGraph();
      this.isRecording = false;
      const viMsg = mapMicErrorToVietnamese(err);
      console.warn("VoiceStudio microphone access issue:", err?.name || err);
      this.renderInlineStatus(viMsg, "error");
      showStudioToast(viMsg, "bad");
      if (this.options.onStateChange) {
        this.options.onStateChange({
          hasRecording: Boolean(this.userAudioUrl),
          isRecording: false,
          error: viMsg
        });
      }
      return false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      try {
        if (this.mediaRecorder.state !== "inactive") {
          this.mediaRecorder.stop();
        }
      } catch (_) {
        this.cleanupAudioGraph();
      }
      this.clearMicMeter();
    } else {
      this.cleanupAudioGraph();
      this.clearMicMeter();
    }
  }

  drawMicMeter() {
    if (!this.canvas || !this.analyser || !this.isRecording || this._destroyed) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!this.isRecording || !this.analyser || this._destroyed) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;
      const level = Math.min(1, Math.max(0.04, avg / 115));

      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const cssW = rect.width > 0 ? rect.width : 90;
      const cssH = rect.height > 0 ? rect.height : 20;

      if (this.canvas.width !== Math.round(cssW * dpr) || this.canvas.height !== Math.round(cssH * dpr)) {
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const fillW = Math.max(4, level * cssW);
      const gradient = ctx.createLinearGradient(0, 0, cssW, 0);
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(0.68, "#eab308");
      gradient.addColorStop(1, "#ef4444");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(0, 2, fillW, Math.max(4, cssH - 4), 3);
      } else {
        ctx.rect(0, 2, fillW, Math.max(4, cssH - 4));
      }
      ctx.fill();
      ctx.restore();

      this.animFrameId = requestAnimationFrame(render);
    };

    render();
  }

  clearMicMeter() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  playUserVoice() {
    if (!this.userAudioUrl || this._destroyed) return;
    this.cancelDualComparison();
    this.userAudioEl.currentTime = 0;
    this.renderInlineStatus("Đang phát lại bản thu giọng của bạn...", "active");
    this.userAudioEl.onended = () => {
      if (!this._destroyed && !this.isComparing) {
        this.renderInlineStatus("", "muted");
      }
    };
    this.userAudioEl.play().catch(() => {});
  }

  cancelDualComparison() {
    if (this._compareCancel) {
      const fn = this._compareCancel;
      this._compareCancel = null;
      fn();
    }
    this.isComparing = false;
  }

  async playDualComparison(originalAudioEl, segStart = null, segEnd = null) {
    if (!this.userAudioUrl || !originalAudioEl || this._destroyed) return;

    // Clicking again while comparing cleanly stops comparison playback
    if (this.isComparing) {
      this.cancelDualComparison();
      try { originalAudioEl.pause(); } catch (_) {}
      try { this.userAudioEl.pause(); } catch (_) {}
      this.renderInlineStatus("Đã dừng chế độ so sánh tuần tự.", "muted");
      return;
    }

    this.cancelDualComparison();
    try { this.userAudioEl.pause(); } catch (_) {}
    this.isComparing = true;

    let cancelled = false;
    let gapTimer = null;
    let maxGuardTimer = null;
    let origTimeHandler = null;
    let userEndedHandler = null;

    const panel = this.getPanelEl();
    const dualBtn = panel ? panel.querySelector(".play-dual-btn") : null;
    const originalBtnHtml = dualBtn ? dualBtn.innerHTML : null;

    const cleanup = () => {
      cancelled = true;
      this.isComparing = false;
      if (gapTimer) clearTimeout(gapTimer);
      if (maxGuardTimer) clearTimeout(maxGuardTimer);
      if (origTimeHandler) {
        originalAudioEl.removeEventListener("timeupdate", origTimeHandler);
        originalAudioEl.removeEventListener("ended", origTimeHandler);
      }
      if (userEndedHandler) {
        this.userAudioEl.removeEventListener("ended", userEndedHandler);
        this.userAudioEl.removeEventListener("error", userEndedHandler);
      }
      if (dualBtn && originalBtnHtml !== null && !this._destroyed) {
        dualBtn.innerHTML = originalBtnHtml;
        dualBtn.classList.remove("is-active");
      }
    };

    this._compareCancel = () => {
      cleanup();
      try { originalAudioEl.pause(); } catch (_) {}
      try { this.userAudioEl.pause(); } catch (_) {}
    };

    // Determine sensible native reference slice matching user recording duration
    const origDur = Number.isFinite(originalAudioEl.duration) && originalAudioEl.duration > 0 ? originalAudioEl.duration : 0;
    const userDur =
      Number.isFinite(this.userAudioEl.duration) && this.userAudioEl.duration > 0.4
        ? this.userAudioEl.duration
        : (this.recordedDurationSec > 0.4 ? this.recordedDurationSec : 10);

    const refStart =
      segStart !== null
        ? Math.max(0, segStart)
        : (origDur > 0 && originalAudioEl.currentTime > 0.5 && originalAudioEl.currentTime < origDur - 2
            ? originalAudioEl.currentTime
            : 0);

    const refWindow = Math.min(24, Math.max(4.5, userDur + 1.5));
    const refEnd =
      segEnd !== null
        ? segEnd
        : (origDur > 0 ? Math.min(origDur, refStart + refWindow) : refStart + refWindow);

    if (dualBtn) {
      dualBtn.classList.add("is-active");
      dualBtn.innerHTML = `<span>1/2 · Giọng bản xứ...</span>`;
    }
    this.renderInlineStatus("Bước 1/2: Đang phát giọng đọc mẫu người bản xứ...", "active");

    try {
      originalAudioEl.currentTime = refStart;
      await originalAudioEl.play();
    } catch (_) {
      cleanup();
      this.renderInlineStatus("Không thể tự động phát Audio gốc. Vui lòng thử bấm lại.", "error");
      return;
    }

    if (cancelled || this._destroyed) return;

    await new Promise((resolve) => {
      origTimeHandler = () => {
        if (cancelled || this._destroyed) {
          resolve();
          return;
        }
        if (originalAudioEl.currentTime >= refEnd || originalAudioEl.ended || originalAudioEl.paused) {
          if (!originalAudioEl.paused) {
            try { originalAudioEl.pause(); } catch (_) {}
          }
          originalAudioEl.removeEventListener("timeupdate", origTimeHandler);
          originalAudioEl.removeEventListener("ended", origTimeHandler);
          origTimeHandler = null;
          resolve();
        }
      };
      originalAudioEl.addEventListener("timeupdate", origTimeHandler);
      originalAudioEl.addEventListener("ended", origTimeHandler);
      maxGuardTimer = setTimeout(() => {
        if (origTimeHandler) origTimeHandler();
        else resolve();
      }, Math.max(1500, (refEnd - refStart + 1.2) * 1000));
    });

    if (maxGuardTimer) {
      clearTimeout(maxGuardTimer);
      maxGuardTimer = null;
    }
    if (cancelled || this._destroyed) return;

    // Smooth 380ms transition pause before user's voice
    await new Promise((resolve) => {
      gapTimer = setTimeout(resolve, 380);
    });

    if (cancelled || this._destroyed) return;

    if (dualBtn) {
      dualBtn.innerHTML = `<span>2/2 · Giọng của bạn...</span>`;
    }
    this.renderInlineStatus("Bước 2/2: Đang phát bản thu giọng của bạn để đối chiếu...", "active");

    await new Promise((resolve) => {
      userEndedHandler = () => {
        this.userAudioEl.removeEventListener("ended", userEndedHandler);
        this.userAudioEl.removeEventListener("error", userEndedHandler);
        userEndedHandler = null;
        resolve();
      };
      this.userAudioEl.addEventListener("ended", userEndedHandler);
      this.userAudioEl.addEventListener("error", userEndedHandler);
      this.userAudioEl.currentTime = 0;
      this.userAudioEl.play().catch(() => resolve());
    });

    if (!cancelled && !this._destroyed) {
      this._compareCancel = null;
      cleanup();
      this.renderInlineStatus("✓ Hoàn tất so sánh tuần tự! Bấm lại nếu muốn nghe đối chiếu lần nữa.", "muted");
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    if (liveStudiosByKey.get(this.talkKey) === this) {
      liveStudiosByKey.delete(this.talkKey);
    }
    this.cancelDualComparison();
    this.stopRecording();
    this.cleanupAudioGraph();
    this.revokeUserAudioUrl();
  }
}
