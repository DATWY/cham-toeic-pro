/**
 * Neuro-TOEIC Part 4 Studio Pro — Live Karaoke, Smart Scroll & Cloze Dictation
 * Features: Word-level highlighting, User scroll detection, Viewport-clamped Word Popover
 * with Web Speech TTS fallback, 2-way Evidence Linking & Interactive Cloze Dictation
 */

import { updateMastery, state, saveState } from "./store.js?v=27.0";
import { saveFlashcard } from "./idb.js";
import { getIcon } from "./uiIcons.js";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeClozeToken(raw = "") {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u2032`]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/^[.,!?;:"()[\]{}]+|[.,!?;:"()[\]{}]+$/g, "")
    .replace(/\s+/g, " ");
}

export function isDictationWordMatch(rawInput, rawTarget) {
  const normVal = normalizeClozeToken(rawInput);
  const normTarget = normalizeClozeToken(rawTarget);
  if (!normVal || !normTarget) return false;
  if (normVal === normTarget) return true;

  // Graceful contraction matching (e.g. "I’ll" / "ill" -> "i'll", "dont" -> "don't")
  if (normTarget.includes("'") && normVal.replace(/'/g, "") === normTarget.replace(/'/g, "")) {
    return true;
  }

  // Graceful hyphenated compound matching (e.g. "well known" / "wellknown" -> "well-known")
  if (
    normTarget.includes("-") &&
    (normVal.replace(/-/g, "") === normTarget.replace(/-/g, "") ||
      normVal.replace(/\s+/g, "-") === normTarget)
  ) {
    return true;
  }

  return false;
}

function speakPhraseTTS(phrase) {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window && phrase) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase);
      utter.lang = "en-US";
      utter.rate = 0.92;
      window.speechSynthesis.speak(utter);
      return true;
    }
  } catch (_) {}
  return false;
}

function emitMiniToast(message, variant = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${variant === "success" ? "is-success" : variant === "bad" ? "is-bad" : ""}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 220);
  }, 1800);
}

let dictationDelegationInitialized = false;
const activeFocusedBlankByWrap = new WeakMap();

function syncDictationWrapProgress(wrap, persistDraft = false) {
  if (!wrap) return;
  const inputs = Array.from(wrap.querySelectorAll(".cloze-input"));
  const total = inputs.length;
  let filled = 0;
  let correct = 0;
  const answers = {};

  inputs.forEach((inp) => {
    const val = inp.value || "";
    const idx = inp.dataset.blankIdx;
    if (idx !== undefined) answers[idx] = val;
    if (val.trim().length > 0) filled++;
    if (isDictationWordMatch(val, inp.dataset.target || "")) correct++;
  });

  const filledPct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const filledEl = wrap.querySelector(".dict-prog-filled");
  const correctEl = wrap.querySelector(".dict-prog-correct");
  const barFillEl = wrap.querySelector(".dict-prog-bar-fill");

  if (filledEl) {
    filledEl.textContent = `Tiến độ: ${filled}/${total} ô (${filledPct}%)`;
  }
  if (correctEl) {
    correctEl.textContent = `Đúng: ${correct}/${total} (${correctPct}%)`;
    correctEl.style.color = correctPct >= 80 ? "var(--ok)" : "var(--accent)";
  }
  if (barFillEl) {
    barFillEl.style.width = `${filledPct}%`;
    barFillEl.style.background = correctPct >= 80 ? "var(--ok)" : "var(--accent)";
  }

  if (persistDraft) {
    const talkKey = wrap.dataset.talkKey;
    if (talkKey) {
      if (!state.dictationProgress[talkKey]) state.dictationProgress[talkKey] = {};
      state.dictationProgress[talkKey].answers = answers;
      state.dictationProgress[talkKey].score = correctPct;
      if (correctPct >= 80) {
        updateMastery(talkKey, "dictation", true);
      }
      saveState();
    }
  }
}

function ensureDictationDelegation() {
  if (dictationDelegationInitialized || typeof document === "undefined") return;
  dictationDelegationInitialized = true;

  // Track focused blank per dictation container
  document.addEventListener("focusin", (e) => {
    const inp = e.target?.closest?.(".cloze-input");
    if (!inp) return;
    const wrap = inp.closest(".dictation-wrap");
    if (wrap) activeFocusedBlankByWrap.set(wrap, inp);
  });

  // Live progress & draft persistence while typing
  document.addEventListener("input", (e) => {
    const inp = e.target?.closest?.(".cloze-input");
    if (!inp) return;
    inp.classList.remove("is-wrong");
    if (isDictationWordMatch(inp.value, inp.dataset.target || "")) {
      inp.classList.add("is-correct");
    } else {
      inp.classList.remove("is-correct");
    }
    const wrap = inp.closest(".dictation-wrap");
    if (wrap) syncDictationWrapProgress(wrap, true);
  });

  // Capture-phase canonicalization BEFORE main.js checks Enter on .cloze-input
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter") return;
      const inp = e.target?.closest?.(".cloze-input");
      if (!inp) return;
      const target = inp.dataset.target || "";
      if (isDictationWordMatch(inp.value, target)) {
        inp.value = target;
      }
      const wrap = inp.closest(".dictation-wrap");
      if (wrap) {
        requestAnimationFrame(() => syncDictationWrapProgress(wrap, true));
      }
    },
    true
  );

  // Capture-phase canonicalization on "Kiểm tra đáp án" + Hint & Sentence Reveal controls
  document.addEventListener(
    "click",
    (e) => {
      const checkBtn = e.target?.closest?.(".check-dictation-btn");
      if (checkBtn) {
        const wrap = checkBtn.closest(".dictation-wrap") || checkBtn.parentElement?.parentElement;
        if (wrap) {
          wrap.querySelectorAll(".cloze-input").forEach((inp) => {
            const target = inp.dataset.target || "";
            if (isDictationWordMatch(inp.value, target)) {
              inp.value = target;
            }
          });
          requestAnimationFrame(() => syncDictationWrapProgress(wrap, false));
        }
        return;
      }

      const resetBtn = e.target?.closest?.(".reset-dictation-btn");
      if (resetBtn) {
        const wrap = resetBtn.closest(".dictation-wrap");
        if (wrap) {
          requestAnimationFrame(() => syncDictationWrapProgress(wrap, false));
        }
        return;
      }

      const hintBtn = e.target?.closest?.(".dict-hint-btn");
      if (hintBtn) {
        e.preventDefault();
        const wrap = hintBtn.closest(".dictation-wrap");
        if (!wrap) return;
        const inputs = Array.from(wrap.querySelectorAll(".cloze-input"));
        if (!inputs.length) return;

        let targetInp = activeFocusedBlankByWrap.get(wrap);
        if (
          !targetInp ||
          !wrap.contains(targetInp) ||
          isDictationWordMatch(targetInp.value, targetInp.dataset.target || "")
        ) {
          targetInp = inputs.find((inp) => !isDictationWordMatch(inp.value, inp.dataset.target || ""));
        }

        if (!targetInp) {
          emitMiniToast("Tất cả ô trống đã chính xác 100%!", "success");
          return;
        }

        const answer = targetInp.dataset.target || "";
        const curRaw = normalizeClozeToken(targetInp.value);
        let matchedPrefix = 0;
        while (
          matchedPrefix < curRaw.length &&
          matchedPrefix < answer.length &&
          curRaw[matchedPrefix] === answer[matchedPrefix]
        ) {
          matchedPrefix++;
        }

        const nextLen = Math.min(answer.length, matchedPrefix + 1);
        targetInp.value = answer.slice(0, nextLen);
        const nowComplete = isDictationWordMatch(targetInp.value, answer);
        targetInp.classList.toggle("is-correct", nowComplete);
        targetInp.classList.remove("is-wrong");
        activeFocusedBlankByWrap.set(wrap, targetInp);
        targetInp.focus();
        try {
          targetInp.setSelectionRange(targetInp.value.length, targetInp.value.length);
        } catch (_) {}
        syncDictationWrapProgress(wrap, true);
        return;
      }

      const revealSegBtn = e.target?.closest?.(".dict-reveal-seg-btn");
      if (revealSegBtn) {
        e.preventDefault();
        const segRow = revealSegBtn.closest(".dict-seg-row");
        const wrap = revealSegBtn.closest(".dictation-wrap");
        if (!segRow) return;
        const segInputs = Array.from(segRow.querySelectorAll(".cloze-input"));
        segInputs.forEach((inp) => {
          inp.value = inp.dataset.target || "";
          inp.classList.add("is-correct");
          inp.classList.remove("is-wrong");
        });
        if (wrap) syncDictationWrapProgress(wrap, true);
        emitMiniToast(`Đã hiện ${segInputs.length} đáp án của câu này!`, "info");
      }
    },
    true
  );
}

let activePopoverCleanup = null;

export class TranscriptSync {
  constructor(talk, containerEl, audioEl, options = {}) {
    this.talk = talk;
    this.container = containerEl;
    this.audio = audioEl;
    this.options = options; // { onWordClick: fn, onEvidenceClick: fn }

    this.userHasScrolled = false;
    this.isProgrammaticScroll = false;
    this.progScrollTimer = null;
    this.activeSegIdx = -1;
    this.activeWordEl = null;

    ensureDictationDelegation();
    this.initScrollDetection();
  }

  initScrollDetection() {
    if (!this.container) return;

    this.container.addEventListener(
      "scroll",
      () => {
        if (this.isProgrammaticScroll) return;
        this.syncFollowState();
      },
      { passive: true }
    );

    this.container.addEventListener("wheel", () => this.handleUserScroll(), { passive: true });
    this.container.addEventListener("touchmove", () => this.handleUserScroll(), { passive: true });
  }

  getActiveSegmentPosition() {
    if (!this.container || this.activeSegIdx === -1) return "none";
    const activeSeg = this.container.querySelector(".lt-seg.is-active");
    if (!activeSeg) return "none";
    const parentRect = this.container.getBoundingClientRect();
    const segRect = activeSeg.getBoundingClientRect();
    if (segRect.bottom < parentRect.top + 16) return "above";
    if (segRect.top > parentRect.bottom - 16) return "below";
    return "visible";
  }

  syncFollowState() {
    const pos = this.getActiveSegmentPosition();
    if (pos === "above" || pos === "below") {
      this.userHasScrolled = true;
    } else {
      this.userHasScrolled = false;
    }
    this.updateFollowButton(pos);
  }

  handleUserScroll() {
    this.isProgrammaticScroll = false;
    clearTimeout(this.progScrollTimer);
    if (this.activeSegIdx === -1) return;
    requestAnimationFrame(() => this.syncFollowState());
  }

  resumeAutoScroll() {
    this.userHasScrolled = false;
    this.updateFollowButton("visible");
    this.scrollToActive();
  }

  updateFollowButton(pos = this.getActiveSegmentPosition()) {
    const btn = this.container ? this.container.querySelector(".floating-follow-btn") : null;
    if (!btn) return;
    const shouldShow = this.userHasScrolled && (pos === "above" || pos === "below");
    btn.style.display = shouldShow ? "inline-flex" : "none";
    if (shouldShow) {
      const iconName = pos === "above" ? "chevronUp" : "chevronDown";
      const label = pos === "above" ? "Lên đoạn đang đọc" : "Xuống đoạn đang đọc";
      btn.innerHTML = `${getIcon(iconName, 14)} <span>${label}</span>`;
    }
  }

  scrollToActive() {
    if (this.userHasScrolled || !this.container) return;
    const activeSeg = this.container.querySelector(".lt-seg.is-active");
    if (!activeSeg) return;

    const parentRect = this.container.getBoundingClientRect();
    const segRect = activeSeg.getBoundingClientRect();
    if (segRect.top < parentRect.top + 16 || segRect.bottom > parentRect.bottom - 16) {
      const offsetTop = segRect.top - parentRect.top + this.container.scrollTop;
      const targetTop = Math.max(0, offsetTop - this.container.clientHeight * 0.32);
      if (Math.abs(this.container.scrollTop - targetTop) < 4) return;
      this.isProgrammaticScroll = true;
      clearTimeout(this.progScrollTimer);
      this.container.scrollTo({ top: targetTop, behavior: "smooth" });
      this.progScrollTimer = setTimeout(() => {
        this.isProgrammaticScroll = false;
      }, 400);
    }
  }

  /**
   * Called on audio timeupdate
   */
  syncTime(currentTime) {
    if (!this.container || !this.talk.segments) return;

    const segments = this.talk.segments;
    let foundSegIdx = -1;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (currentTime >= seg.s && currentTime <= seg.e) {
        foundSegIdx = i;
        break;
      }
    }

    if (foundSegIdx !== this.activeSegIdx) {
      this.activeSegIdx = foundSegIdx;
      const segEls = this.container.querySelectorAll(".lt-seg");
      segEls.forEach((el, idx) => {
        el.classList.toggle("is-active", idx === foundSegIdx);
      });
      if (foundSegIdx !== -1) {
        if (this.userHasScrolled) {
          this.updateFollowButton();
        } else {
          this.scrollToActive();
        }
      } else {
        this.updateFollowButton("none");
      }
    }

    // Sync words inside active segment
    if (foundSegIdx !== -1) {
      const seg = segments[foundSegIdx];
      const activeSegEl = this.container.querySelector(`.lt-seg[data-seg-idx="${foundSegIdx}"]`);
      if (activeSegEl && seg.words) {
        const wordEls = activeSegEl.querySelectorAll(".lt-word");
        seg.words.forEach((w, wIdx) => {
          const wEl = wordEls[wIdx];
          if (!wEl) return;

          const isNow = currentTime >= w.s && currentTime <= w.e;
          const isPast = currentTime > w.e;

          wEl.classList.toggle("is-now", isNow);
          wEl.classList.toggle("is-past", isPast);
        });
      }
    }
  }

  /**
   * Render Live Script Karaoke
   */
  renderLiveScript(viewMode = "bilingual") {
    if (!this.talk.segments) {
      return `<div class="muted-text">Chưa có dữ liệu phân đoạn âm thanh.</div>`;
    }

    const html = `
      <div class="script-toolbar">
        <div class="tool-group">
          <span style="font-size: 0.76rem; font-weight: 500; color: var(--text-muted);">Hiển thị:</span>
          <button type="button" class="mini-pill ${viewMode === 'bilingual' ? 'is-active' : ''}" data-view="bilingual">Song ngữ</button>
          <button type="button" class="mini-pill ${viewMode === 'en' ? 'is-active' : ''}" data-view="en">Chỉ Tiếng Anh</button>
          <button type="button" class="mini-pill ${viewMode === 'blur' ? 'is-active' : ''}" data-view="blur">Ẩn Dịch (Hover)</button>
        </div>
      </div>

      <div class="live-transcript" data-view-mode="${viewMode}">
        ${this.talk.segments.map((seg, idx) => {
          const isQSeg = seg.t.startsWith("Question ") || seg.t.startsWith("Questions ") || seg.t.startsWith("Number ");
          const wordsHtml = (seg.words || []).map((w) => {
            const trimmedWord = String(w.w || "").trim();
            const cleanWord = trimmedWord
              .replace(/[\u2018\u2019\u02BC]/g, "'")
              .replace(/^[.,!?;:"()]+|[.,!?;:"()]+$/g, "");
            return `<span class="lt-word" data-word="${escapeHtml(cleanWord)}" data-start="${w.s}" data-end="${w.e}" title="Click đúp để nghe phát âm &amp; tra nghĩa">${escapeHtml(trimmedWord)}</span>`;
          }).join(" ");

          return `
            <div class="lt-seg ${isQSeg ? 'is-question-seg' : ''}" data-seg-idx="${idx}" data-start="${seg.s}" data-end="${seg.e}">
              <span class="lt-time">${this.fmtTime(seg.s)}</span>
              <span class="lt-content">${wordsHtml || seg.t}</span>
              <button type="button" class="seg-loop-btn" title="Lặp câu này" data-start="${seg.s}" data-end="${seg.e}">${getIcon("repeat1", 13)} <span>Lặp</span></button>
            </div>
          `;
        }).join("")}
      </div>

      ${viewMode !== 'en' ? `
        <div class="trans-section ${viewMode === 'blur' ? 'is-blurred' : ''}" style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border);">
          <h4 style="font-size: 0.78rem; text-transform: uppercase; color: var(--accent); margin: 0 0 6px;">Bản Dịch Tiếng Việt</h4>
          <p class="trans-text" style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted);">${this.talk.translation}</p>
        </div>
      ` : ''}

      <div class="floating-follow-wrap">
        <button type="button" class="floating-follow-btn" style="display: none;">
          ${getIcon("chevronDown", 14)} <span>Xuống đoạn đang đọc</span>
        </button>
      </div>
    `;

    return html;
  }

  /**
   * Render Cloze Dictation
   * Preserves exact blank counts (12 basic / 24 adv / 31 hard on Q71-73) while adding
   * real-time progress, first-character Hint ("Gợi ý ký tự đầu"), and per-sentence Reveal ("Hiện đáp án câu này").
   */
  renderDictation(level = "basic", savedAnswers = {}) {
    ensureDictationDelegation();
    if (!this.talk.segments) return "";

    const segments = this.talk.segments.filter((s) => !s.t.startsWith("Number ") && !s.t.startsWith("Question"));
    const talkKey = `${this.talk.testId || state.activeTest}_${this.talk.range}`;

    let blankIndex = 0;
    let initialFilled = 0;
    let initialCorrect = 0;

    const rowsHtml = segments.map((seg) => {
      const words = seg.words || [];
      let segBlankCount = 0;

      const segHtml = words.map((w, wIdx) => {
        const rawWord = w.w.trim();
        const match = rawWord.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
        const leadPunct = match ? match[1] : "";
        const coreWord = match ? match[2] : rawWord;
        const trailPunct = match ? match[3] : "";
        const cleanWord = coreWord
          .replace(/[\u2018\u2019\u02BC]/g, "'")
          .replace(/[.,!?;:"]/g, "")
          .toLowerCase();

        // Exact level blanking rules (preserves 12 basic / 24 adv / 31 hard on Q71-73)
        let isBlank = false;
        if (cleanWord.length > 3) {
          if (level === "basic" && (wIdx % 6 === 2)) isBlank = true;
          else if (level === "adv" && (wIdx % 3 === 1)) isBlank = true;
          else if (level === "hard" && (wIdx % 2 === 0)) isBlank = true;
        }

        if (isBlank) {
          const bIdx = blankIndex++;
          segBlankCount++;
          const userVal = savedAnswers[bIdx] || "";
          if (String(userVal).trim().length > 0) initialFilled++;
          const matched = isDictationWordMatch(userVal, cleanWord);
          if (matched) initialCorrect++;

          return `${leadPunct}<input type="text" class="cloze-input ${matched ? 'is-correct' : ''}" data-blank-idx="${bIdx}" data-target="${escapeHtml(cleanWord)}" value="${escapeHtml(userVal)}" style="width: ${Math.max(54, cleanWord.length * 11)}px" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />${trailPunct} `;
        }
        return `${rawWord} `;
      }).join("");

      return `
        <div class="dict-seg-row" style="margin-bottom: 12px; padding: 9px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap;">
            <span class="lt-time dict-play-time" style="cursor: pointer;" data-start="${seg.s}" title="Bấm để nghe câu này">${this.fmtTime(seg.s)}</span>
            <button type="button" class="mini-pill dict-play-btn" data-start="${seg.s}" data-end="${seg.e}" title="Nghe lại câu này" style="padding: 2px 8px; font-size: 0.72rem;">${getIcon("play", 10)} <span>Nghe câu</span></button>
            ${segBlankCount > 0 ? `
              <button type="button" class="mini-pill dict-reveal-seg-btn" title="Điền đáp án cho ${segBlankCount} chỗ trống của câu này" style="margin-left: auto; padding: 2px 8px; font-size: 0.72rem; color: var(--text-muted);">
                ${getIcon("eye", 11)} <span>Hiện đáp án câu này</span>
              </button>
            ` : ''}
          </div>
          <div class="dict-seg-words">${segHtml}</div>
        </div>
      `;
    }).join("");

    const totalBlanks = blankIndex;
    const initFilledPct = totalBlanks > 0 ? Math.round((initialFilled / totalBlanks) * 100) : 0;
    const initCorrectPct = totalBlanks > 0 ? Math.round((initialCorrect / totalBlanks) * 100) : 0;

    return `
      <div class="dictation-wrap" data-talk-key="${escapeHtml(talkKey)}">
        <div class="dictation-toolbar">
          <div class="tool-group">
            <span style="font-size: 0.76rem; font-weight: 500; color: var(--text-muted);">Độ khó:</span>
            <button type="button" class="mini-pill ${level === 'basic' ? 'is-active' : ''}" data-dict-level="basic">Cơ bản (15%)</button>
            <button type="button" class="mini-pill ${level === 'adv' ? 'is-active' : ''}" data-dict-level="adv">Nâng cao (30%)</button>
            <button type="button" class="mini-pill ${level === 'hard' ? 'is-active' : ''}" data-dict-level="hard">Thử thách (50%)</button>
          </div>
          <div class="tool-group">
            <button type="button" class="mini-pill dict-hint-btn" title="Gợi ý thêm 1 ký tự đầu cho ô đang chọn (hoặc ô trống kế tiếp)" style="border-color: var(--accent-border); color: var(--accent);">
              ${getIcon("sparkles", 12)} <span>Gợi ý ký tự đầu</span>
            </button>
            <button type="button" class="tool-btn check-dictation-btn">Kiểm tra đáp án</button>
            <button type="button" class="tool-btn reset-dictation-btn icon-only" title="Làm lại">${getIcon("rotateCcw", 14)}</button>
          </div>
        </div>

        <div class="dictation-progress-panel" style="margin-bottom: 12px; padding: 9px 12px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; font-size: 0.78rem; font-weight: 500;">
            <span class="dict-prog-filled tabular-nums" style="color: var(--text-muted);">Tiến độ: ${initialFilled}/${totalBlanks} ô (${initFilledPct}%)</span>
            <span class="dict-prog-correct tabular-nums" style="color: ${initCorrectPct >= 80 ? 'var(--ok)' : 'var(--accent)'};">Đúng: ${initialCorrect}/${totalBlanks} (${initCorrectPct}%)</span>
          </div>
          <div style="width: 100%; height: 6px; border-radius: 999px; background: var(--surface-3); overflow: hidden;">
            <div class="dict-prog-bar-fill" style="height: 100%; width: ${initFilledPct}%; background: ${initCorrectPct >= 80 ? 'var(--ok)' : 'var(--accent)'}; border-radius: 999px; transition: width 180ms ease;"></div>
          </div>
        </div>

        <div class="dictation-stats" id="dictation-score-wrap" style="display: none; margin-bottom: 12px; padding: 10px 14px; border-radius: var(--radius-md); background: var(--ok-soft); color: var(--ok); font-weight: 500;"></div>

        <div class="dictation-body" style="font-size: 0.94rem; line-height: 2;">
          ${rowsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Sleek Viewport-Clamped Word Click Popover with Web Speech TTS Fallback
   */
  showWordPopover(word, start, end, x, y) {
    this.removeWordPopover();
    if (!word) return;

    const cleanW = word.trim().toLowerCase();
    const esc = cleanW.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wordRegex = new RegExp(`\\b${esc}\\b`, "i");
    const matchEntry = (v) => wordRegex.test(v.split(":")[0] || "");

    let vocabMatch = (this.talk.vocab || []).find(matchEntry);
    if (!vocabMatch && Array.isArray(window.TOEIC_TESTS)) {
      for (const test of window.TOEIC_TESTS) {
        for (const tk of test.talks || []) {
          vocabMatch = (tk.vocab || []).find(matchEntry);
          if (vocabMatch) break;
        }
        if (vocabMatch) break;
      }
    }

    let bankMatch = null;
    if (Array.isArray(window.TOEIC_VOCAB_BANK)) {
      bankMatch =
        window.TOEIC_VOCAB_BANK.find((item) => (item.word || "").toLowerCase() === cleanW) ||
        window.TOEIC_VOCAB_BANK.find((item) => wordRegex.test(item.word || ""));
    }

    const meaningLine = vocabMatch
      ? vocabMatch
      : bankMatch
      ? `${bankMatch.word}: ${bankMatch.translation}`
      : "";
    const ipaBadge = bankMatch && bankMatch.ipa ? bankMatch.ipa : "";
    const posBadge = bankMatch && bankMatch.type ? bankMatch.type : "";
    const hasNativeSlice = Boolean(
      this.audio &&
        (this.audio.currentSrc || this.audio.getAttribute("src")) &&
        !this.audio.error &&
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start
    );

    const popover = document.createElement("div");
    popover.className = "word-popover";
    popover.style.position = "fixed";
    popover.style.zIndex = "220";
    popover.style.width = "min(284px, calc(100vw - 24px))";
    popover.style.left = "12px";
    popover.style.top = "12px";

    popover.innerHTML = `
      <div class="word-popover-word" style="gap: 8px; align-items: center;">
        <div style="min-width: 0; flex: 1;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-weight: 600; font-size: 1rem; color: var(--accent); word-break: break-word;">${escapeHtml(word)}</span>
            ${posBadge ? `<span class="badge" style="font-size: 0.66rem; padding: 1px 6px; background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border);">${escapeHtml(posBadge)}</span>` : ""}
          </div>
          ${ipaBadge ? `<div style="font-size: 0.78rem; font-weight: 500; color: var(--text-muted); font-family: var(--font-ipa); letter-spacing: 0.01em; margin-top: 2px;">${escapeHtml(ipaBadge)}</div>` : ""}
        </div>
        <div style="display: inline-flex; align-items: center; gap: 4px; flex: none;">
          <button type="button" class="tool-btn icon-only popover-play-btn" title="${hasNativeSlice ? 'Nghe đoạn phát âm gốc trong bài' : 'Đọc phát âm chuẩn (TTS)'}">${getIcon("play", 13)}</button>
          <button type="button" class="tool-btn icon-only popover-tts-btn" title="Phát âm từ điển chuẩn Mỹ (TTS)">${getIcon("volume2", 13)}</button>
        </div>
      </div>
      ${
        meaningLine
          ? `<div style="font-size: 0.82rem; line-height: 1.48; color: var(--text); background: var(--surface-2); padding: 6px 9px; border-radius: var(--radius-sm); border: 1px solid var(--border);">${escapeHtml(meaningLine)}</div>`
          : `<div style="font-size: 0.78rem; color: var(--text-muted);">Bấm loa để nghe phát âm hoặc ghim vào bộ thẻ ôn tập SM-2.</div>`
      }
      <button type="button" class="tool-btn popover-add-srs-btn" style="width: 100%; margin-top: 2px; justify-content: center; font-weight: 500;">
        + Ghim vào Flashcard
      </button>
    `;

    document.body.appendChild(popover);

    // Viewport-clamped positioning (never clipped off-screen on any scroll position or mobile viewport)
    const popRect = popover.getBoundingClientRect();
    const pad = 12;
    const vw = window.innerWidth || document.documentElement.clientWidth || 360;
    const vh = window.innerHeight || document.documentElement.clientHeight || 640;

    let targetLeft = (Number.isFinite(x) ? x : vw / 2) - popRect.width / 2 + 24;
    targetLeft = Math.min(vw - popRect.width - pad, Math.max(pad, targetLeft));

    let targetTop = (Number.isFinite(y) ? y : vh / 2) + 10;
    if (targetTop + popRect.height > vh - pad) {
      targetTop = (Number.isFinite(y) ? y : vh / 2) - popRect.height - 28;
    }
    targetTop = Math.min(vh - popRect.height - pad, Math.max(pad, targetTop));

    popover.style.left = `${Math.round(targetLeft)}px`;
    popover.style.top = `${Math.round(targetTop)}px`;

    // Play native audio slice with automatic Web Speech TTS fallback if audio isn't loaded/playable
    popover.querySelector(".popover-play-btn")?.addEventListener("click", () => {
      if (hasNativeSlice && this.audio) {
        this.audio.currentTime = Math.max(0, start - 0.05);
        const playPromise = this.audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            speakPhraseTTS(word);
          });
        }
        const targetEnd = end + 0.12;
        const timeHandler = () => {
          if (!this.audio || this.audio.currentTime >= targetEnd) {
            if (this.audio) {
              this.audio.pause();
              this.audio.removeEventListener("timeupdate", timeHandler);
            }
          }
        };
        this.audio.addEventListener("timeupdate", timeHandler);
        setTimeout(() => {
          if (this.audio) {
            this.audio.removeEventListener("timeupdate", timeHandler);
            if (!this.audio.paused && this.audio.currentTime >= end) {
              this.audio.pause();
            }
          }
        }, Math.max(550, (end - start + 0.35) * 1000));
      } else {
        speakPhraseTTS(word);
      }
    });

    popover.querySelector(".popover-tts-btn")?.addEventListener("click", () => {
      speakPhraseTTS(word);
    });

    popover.querySelector(".popover-add-srs-btn")?.addEventListener("click", async () => {
      const cardData = {
        id: `card_${Date.now()}_${word}`,
        word,
        context: (this.talk.transcript || "").replace(/<[^>]*>/g, ""),
        translation: meaningLine || this.talk.translation || word,
        audioUrl: this.talk.audio || null,
        start: Number.isFinite(start) ? start : 0,
        end: Number.isFinite(end) ? end : 0,
        talkRange: this.talk.range,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: Date.now()
      };
      if (window.__app && window.__app.vocabSRS) {
        await window.__app.vocabSRS.addCard(cardData);
      } else {
        await saveFlashcard(cardData);
      }
      const addBtn = popover.querySelector(".popover-add-srs-btn");
      if (addBtn) {
        addBtn.innerHTML = `${getIcon("check", 13)} <span>Đã lưu Flashcard!</span>`;
      }
      setTimeout(() => this.removeWordPopover(), 900);
    });

    const closeOnPointer = (e) => {
      if (!popover.contains(e.target)) {
        this.removeWordPopover();
      }
    };
    const closeOnKey = (e) => {
      if (e.key === "Escape") {
        this.removeWordPopover();
      }
    };

    const bindTimer = setTimeout(() => {
      document.addEventListener("pointerdown", closeOnPointer);
      document.addEventListener("keydown", closeOnKey);
    }, 40);

    activePopoverCleanup = () => {
      clearTimeout(bindTimer);
      document.removeEventListener("pointerdown", closeOnPointer);
      document.removeEventListener("keydown", closeOnKey);
    };
  }

  removeWordPopover() {
    if (activePopoverCleanup) {
      activePopoverCleanup();
      activePopoverCleanup = null;
    }
    document.querySelectorAll(".word-popover").forEach((el) => el.remove());
  }

  fmtTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
}
