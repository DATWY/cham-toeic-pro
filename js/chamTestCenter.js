/**
 * CHAM TOEIC × Neuro-TOEIC Pro — Complete 35-Test Online Center
 * Cloned & Refined from https://chamtoeic.edu.vn/tests (6,600 Questions, ETS 2022–2026)
 * Features:
 *  - Full 35-Test Searchable & Filterable Library (Pagination + View-All)
 *  - Test Overview with Practice (Part Picker + Custom Timer) & Full Exam Simulation
 *  - Configurable IIG Listening Answer Pause (5s/8s/3s/0s) — fixes ChamTOEIC's 0s Part 1 jump bug
 *  - Split-Screen Independent-Scroll Runner with Resizable Panes, Passage/Graphic Zoom & Lightbox
 *  - Complete Part 1/2 Transcript Stem & Option Parser + Optional Practice Peek Toggle
 *  - Theme-Adaptive Rich-Text Sanitizer (100% WCAG AA across Light, Dark & Sepia)
 *  - Right-Click & ⊘ Option Elimination, Question Flagging & Instant Group Check (Practice)
 *  - Accurate ETS /990 vs /495 vs Partial Practice Scoring, Skill Tag Breakdown & 5-Filter Split Review
 *  - Resilient 1-Click Per-Test Offline Media Caching & Exact Mistake Retake + Draft Resume
 */

import { getIcon } from "./uiIcons.js";
import { state, saveState, recordActiveTime } from "./store.js?v=26.1";
import { estimateListeningScaledScore, estimateReadingScaledScore, mapTotalScoreToCEFR } from "./examSimulator.js?v=26.1";
import { openGraphicLightbox, showToast, clearToasts } from "./renderers.js?v=26.1";
import { analyzeQuestionTrapsAndTips, decodeRichEntities, stripPart12SpeakerTags } from "./toeicTrapEngine.js?v=25.4";

const CHAM_SVG = {
  users: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  flag: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  flagFill: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  typeAa: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  ban: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="5.7" y1="5.7" x2="18.3" y2="18.3"/></svg>`,
  books: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  volume: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  help: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  highlighter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2.78 2.78 0 0 1-3.9 0L4.8 7.9a2.78 2.78 0 0 1 0-3.9L7 1.8a2.78 2.78 0 0 1 3.9 0L19.6 10.5c.5.5.9 1.2.9 1.9Z"/></svg>`,
  vocabAdd: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/></svg>`,
  repeat: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`
};

const CHAM_STORAGE_KEY = "neuro_cham_toeic_history_v1";
const CHAM_DRAFT_KEY = "neuro_cham_toeic_draft_v1";
const CHAM_MEDIA_CACHE = "cham-toeic-offline-v1";
const CHAM_JSON_CACHE = "cham-toeic-json-bank-v7";

const PART_META = {
  1: { label: "PART 1", short: "Part 1", desc: "Mô tả tranh", defaultCount: 6, directions: "Directions: For each question, you will see a picture and hear four short statements. Select the one statement that best describes what you see in the picture." },
  2: { label: "PART 2", short: "Part 2", desc: "Hỏi - Đáp", defaultCount: 25, directions: "Directions: You will hear a question or statement and three responses spoken in English. They will not be printed. Select the best response (A), (B), or (C)." },
  3: { label: "PART 3", short: "Part 3", desc: "Đoạn hội thoại", defaultCount: 39, directions: "Directions: You will hear some conversations between two or three people. Answer three questions about what the speakers say in each conversation." },
  4: { label: "PART 4", short: "Part 4", desc: "Bài nói ngắn", defaultCount: 30, directions: "Directions: You will hear some talks given by a single speaker. Answer three questions about what the speaker says in each talk." },
  5: { label: "PART 5", short: "Part 5", desc: "Hoàn thành câu", defaultCount: 30, directions: "Directions: A word or phrase is missing in each of the sentences below. Four answer choices are given below each sentence. Select the best answer to complete the sentence." },
  6: { label: "PART 6", short: "Part 6", desc: "Hoàn thành đoạn văn", defaultCount: 16, directions: "Directions: Read the texts that follow. A word, phrase, or sentence is missing in parts of each text. Four answer choices are given for each question." },
  7: { label: "PART 7", short: "Part 7", desc: "Đọc hiểu", defaultCount: 54, directions: "Directions: In this part you will read a selection of texts, such as magazine and newspaper articles, e-mails, and instant messages. Select the best answer for each question." }
};

function getCefrBadgeToneClass(cefr = "") {
  const s = String(cefr).toUpperCase();
  if (s.includes("C2")) return "cefr-c2";
  if (s.includes("C1")) return "cefr-c1";
  if (s.includes("B2")) return "cefr-b2";
  if (s.includes("B1")) return "cefr-b1";
  return "cefr-a12";
}

function getChamDifficultyMeta(slug) {
  return window.TOEIC_DIFFICULTY_DATA?.chamTests?.[slug] || null;
}

function playChamSoundCheck() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.11;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.24);
      });
    }
    if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("TOEIC Listening audio check. Volume is clear.");
      u.lang = "en-US";
      u.rate = 0.96;
      window.speechSynthesis.speak(u);
    }
  } catch {}
}

function escHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtmlEntities(str = "") {
  return decodeRichEntities(str);
}

/**
 * Parses all ChamTOEIC Part 1 & Part 2 transcript HTML formats:
 *  - <p>(A) ...</p>, <span>A. ...</span><br/>, <p>✔B. ...</p>, single-line (A)...(B)...
 *  - Extracts Part 2 spoken question stem and unescapes HTML entities cleanly.
 */
function parsePart12Transcript(transcriptHtml = "") {
  if (!transcriptHtml) return { stem: "", options: {} };
  const withNewlines = String(transcriptHtml)
    .replace(/<(?:br\s*\/?|\/p|\/div|\/li|\/tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const fullText = decodeHtmlEntities(withNewlines)
    .split(/\r?\n/)
    .map((ln) => ln.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  if (!fullText) return { stem: "", options: {} };

  const pattern = /(?:(?<=^|\n|\s)[✓✔✅ \t]*\(\s*([A-D])\s*\)|(?<=^|\n)[✓✔✅ \t]*([A-D])[.)])[ \t]*/g;
  const matches = Array.from(fullText.matchAll(pattern));
  if (!matches.length) return { stem: "", options: {} };

  const stem = stripPart12SpeakerTags(
    fullText
      .slice(0, matches[0].index)
      .replace(/^(?:Transcript|Tapescript)\s*[:.-]?\s*/i, "")
      .replace(/^(?:Questions?\s*(?:\d+)?\s*[:.)]|Numbers?\s*\d+[:.)]?|\d+[.)])\s*/i, "")
      .replace(/\s*[✓✔✅]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );

  const options = {};
  for (let i = 0; i < matches.length; i++) {
    const letter = (matches[i][1] || matches[i][2] || "").toUpperCase();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : fullText.length;
    const val = fullText
      .slice(start, end)
      .replace(/\s*[✓✔✅]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (letter && !options[letter] && val) {
      options[letter] = val;
    }
  }
  return { stem, options };
}

function cleanChamOptionText(raw = "", choice = "") {
  const txt = decodeHtmlEntities(raw || "").replace(/\ufeff/g, "").trim();
  if (!txt || /\{\{blank\}\}/i.test(txt)) return "";
  if (!choice) return txt;
  const esc = String(choice).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefRe = new RegExp(`^\\s*(?:\\(${esc}\\)|${esc}[.)])\\s+(.+)$`, "i");
  const m = txt.match(prefRe);
  return m ? m[1].trim() : txt;
}

/**
 * Normalizes scraped inline rich-text styles in passages, transcripts, and explanations
 * so neutral black/tiny-font spans never break Dark/Sepia themes while semantic highlights
 * map to WCAG AA-compliant theme tokens.
 */
function sanitizeChamRichHtml(rawHtml = "") {
  if (!rawHtml) return "";
  const cleaned = String(rawHtml)
    .replace(/<span[^>]*class=(["'])?ql-cursor\1[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/^(<p[^>]*>)?\s*style\s*=\s*(?:'[^']*'|"[^"]*")\s*>\s*/i, (_, p) => p || "<p>")
    .replace(/\ufeff/g, "");
  return cleaned.replace(/\sstyle=(["'])(.*?)\1/gi, (_full, _q, cssText) => {
    if (/background(?:-color)?\s*:\s*rgb\(\s*0\s*,\s*138\s*,\s*0\s*\)/i.test(cssText)) {
      return ' style="background: var(--ok-soft); color: var(--ok); border: 1px solid var(--ok-border); font-weight: 500; padding: 1px 6px; border-radius: 4px;"';
    }
    const kept = [];
    const parts = cssText.split(";").map((x) => x.trim()).filter(Boolean);
    for (const decl of parts) {
      const colon = decl.indexOf(":");
      if (colon < 0) continue;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      const val = decl.slice(colon + 1).trim().toLowerCase();
      if (prop === "font-weight" || prop === "font-style" || prop === "text-decoration" || prop === "text-align") {
        kept.push(`${prop}: ${val}`);
      } else if (prop === "color") {
        if (/rgb\(\s*0\s*,\s*138\s*,\s*0\s*\)/.test(val)) {
          kept.push("color: var(--ok)", "font-weight: 500");
        } else if (/rgb\(\s*(?:0\s*,\s*102\s*,\s*204|53\s*,\s*80\s*,\s*154)\s*\)/.test(val)) {
          kept.push("color: var(--cham-royal)", "font-weight: 500");
        } else if (/rgb\(\s*230\s*,\s*0\s*,\s*0\s*\)/.test(val)) {
          kept.push("color: var(--bad)", "font-weight: 500");
        } else if (/rgb\(\s*255\s*,\s*153\s*,\s*0\s*\)/.test(val)) {
          kept.push("color: var(--warn)", "font-weight: 500");
        } else if (/rgb\(\s*153\s*,\s*51\s*,\s*255\s*\)/.test(val)) {
          kept.push("color: var(--cham-purple)", "font-weight: 500");
        }
      }
    }
    return kept.length ? ` style="${kept.join("; ")}"` : "";
  });
}

function fmtCompactCount(n) {
  const num = Number(n || 0);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function fmtHMS(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtAudioClock(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function loadHistoryStore() {
  try {
    const raw = localStorage.getItem(CHAM_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.attemptsBySlug === "object" ? parsed : { attemptsBySlug: {} };
  } catch (_) {
    return { attemptsBySlug: {} };
  }
}

function saveHistoryStore(store) {
  try {
    localStorage.setItem(CHAM_STORAGE_KEY, JSON.stringify(store));
  } catch (_) {
    // Graceful QuotaExceededError eviction: trim oldest attempts across slugs and retry
    try {
      const slugs = Object.keys(store.attemptsBySlug || {});
      for (const sl of slugs) {
        const arr = store.attemptsBySlug[sl];
        if (Array.isArray(arr) && arr.length > 5) {
          store.attemptsBySlug[sl] = arr.slice(-5);
        }
      }
      localStorage.setItem(CHAM_STORAGE_KEY, JSON.stringify(store));
    } catch (_e2) {}
  }
}

function loadDraftStore() {
  try {
    const raw = localStorage.getItem(CHAM_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function saveDraftStore(draft) {
  try {
    if (!draft) localStorage.removeItem(CHAM_DRAFT_KEY);
    else localStorage.setItem(CHAM_DRAFT_KEY, JSON.stringify(draft));
  } catch (_) {}
}

class ChamTestCenter {
  constructor(options = {}) {
    this.onOpen = options.onOpen || (() => {});
    this.onExitToStudio = options.onExitToStudio || (() => {});
    this.onOpenMaterials = options.onOpenMaterials || (() => {});
    this.onOpenPracticePart = options.onOpenPracticePart || (() => {});
    this.onOpenPractice = options.onOpenPractice || (() => {});
    this.onHistoryUpdated = options.onHistoryUpdated || (() => {});
    this.catalog = window.CHAM_TOEIC_CATALOG || { collections: [], tests: [] };
    this.testCache = new Map(); // slug -> full test json
    this.offlineDownloads = new Map(); // slug -> { running, statusText, cachedAll }
    this.history = loadHistoryStore();

    // Library Filter State
    this.libState = {
      query: "",
      typeFilter: "ALL", // ALL | FULL | MINI | PART
      partFilter: "ALL", // ALL | "1".."7"
      collection: "ALL",
      statusFilter: "ALL", // ALL | DONE | TODO
      cefrFilter: "ALL", // ALL | A12 | B12 | C12 | A1 | A2 | B1 | B2 | C1 | C2
      sortBy: "DEFAULT", // DEFAULT | DIFF_ASC | DIFF_DESC | POPULAR
      page: 1,
      pageSize: 12,
      showAll: false,
      mobileFiltersOpen: false
    };

    // Detail View State
    this.detailState = {
      slug: null,
      modeTab: "practice", // 'practice' | 'exam'
      examScope: "full", // 'full' | 'listening' | 'reading' (for dual-section tests)
      selectedParts: new Set([1, 2, 3, 4, 5, 6, 7]),
      timeLimitMin: 0, // 0 = unlimited stopwatch
      examPauseSec: 5, // 5s IIG pause after audio in exam mode
      strictIigMode: false // true = Official Two-Phase 45m Listening Lock + 75m Reading Transition (or Locked Audio in LC-only)
    };

    // Runner / Review Active Session
    this.session = null;
    this.clockInterval = null;
    this.autoAdvanceInterval = null;
    this.autoAdvanceRemaining = 0;
    this.autoPlayTimer = null;
    this.activeAudioEl = null;
    this.audioVolume = 1.0;
    this.audioSpeed = 1.0;
    this.audioLoop = false;
    this.focusedQNum = null;
    this.vocabSaveDraft = null; // { word, ipa, type, translation, context }
    this._preloadAudioEl = null;
    this.passageZoom = 100;
    this.splitLeftPct = 52;
    this.mobilePaletteOpen = false;
    this.paletteFilter = "ALL"; // ALL | TODO | FLAGGED
    this.hideTimer = false;
    this.showDirectionsBanner = false;
    this.showHelpModal = false;
    this.showReviewModal = false;
    this.showSectionGate = false;
    this.volumeMenuOpen = false;
    this.listeningReviewTab = "transcript"; // 'transcript' | 'karaoke' | 'dictation' | 'shadowing'
    this.dictationState = {}; // { `${groupIdx}`: { checked: bool, inputs: {} } }
    this.shadowingLoop = false;
    this._shadowRec = null;
    this._shadowChunks = [];
    this._shadowAudioUrl = null;
    this._shadowRecording = false;
    this.resultTab = "overview"; // 'overview' | 'list'
    this.resultListFilter = "ALL"; // 'ALL' | 'WRONG' | 'SKIPPED' | 'CORRECT' | 'FLAGGED'
    this.reviewFilter = "ALL"; // 'ALL' | 'WRONG' | 'SKIPPED' | 'CORRECT' | 'FLAGGED'
    this.view = "library"; // 'library' | 'detail' | 'runner' | 'result' | 'review'
    this.isActive = false;
    this._suppressHashSync = false;
    this._navSeq = 0;
    this._pendingRightClick = null;
    this._rightClickSeq = 0;

    this._boundKeyDown = (e) => this.handleKeyDown(e);
    this._boundRightMouseDown = (e) => this.handleRightMouseDown(e);
    this._boundContextMenu = (e) => this.handleRightClickEliminate(e);
    this._boundRightMouseUp = (e) => this.handleRightMouseUp(e);
  }

  get rootEl() {
    return document.getElementById("cham-hub-root");
  }

  getAvailablePartsForMeta(meta) {
    if (!meta) return [1, 2, 3, 4, 5, 6, 7];
    const partCounts = meta.partCounts || {};
    const available = [1, 2, 3, 4, 5, 6, 7].filter((p) => (partCounts[`PART_${p}`] || 0) > 0);
    return available.length ? available : [1, 2, 3, 4, 5, 6, 7];
  }

  syncUrlHash(targetHash, replace = false) {
    if (location.hash === targetHash) return;
    this._suppressHashSync = true;
    try {
      if (replace) history.replaceState(null, "", targetHash);
      else history.pushState(null, "", targetHash);
    } finally {
      setTimeout(() => {
        this._suppressHashSync = false;
      }, 0);
    }
  }

  reloadHistory() {
    this.history = loadHistoryStore();
    if (this.isActive && (this.view === "library" || this.view === "detail")) {
      this.render();
    }
  }

  async matchCachedTestJson(absUrl) {
    if (!("caches" in window)) return null;
    try {
      for (const cacheName of [CHAM_JSON_CACHE, CHAM_MEDIA_CACHE]) {
        const c = await caches.open(cacheName);
        const hit = await c.match(absUrl, { ignoreSearch: true });
        if (hit && hit.ok) return hit;
      }
      const anyHit = await caches.match(absUrl, { ignoreSearch: true });
      if (anyHit && anyHit.ok) return anyHit;
    } catch (_) {}
    return null;
  }

  async loadTestJson(slug) {
    if (!slug || String(slug).startsWith("practice-part-")) {
      throw new Error(`Bộ đề luyện tập tùy chỉnh (${slug}) không có tệp JSON tĩnh.`);
    }
    if (this.testCache.has(slug)) return this.testCache.get(slug);
    const meta = (this.catalog.tests || []).find((t) => t.slug === slug);
    const url = meta?.dataFile || `data/cham_tests/${slug}.json`;
    const absUrl = new URL(url, window.location.href).href;

    // Fast path when browser explicitly reports offline: check CacheStorage first without firing a doomed request
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const cachedResp = await this.matchCachedTestJson(absUrl);
      if (cachedResp) {
        const cachedData = await cachedResp.json();
        this.testCache.set(slug, cachedData);
        return cachedData;
      }
      const offErr = new Error("Đang ngoại tuyến (Offline) và đề thi này chưa được lưu trong bộ nhớ đệm. Hãy kết nối lại máy chủ rồi thử lại.");
      offErr.isOffline = true;
      throw offErr;
    }

    let resp = null;
    let fetchError = null;
    try {
      resp = await fetch(url);
    } catch (e) {
      fetchError = e;
    }

    const isSwOffline = Boolean(
      resp && (resp.status === 503 || resp.headers.get("X-SW-Offline") === "1")
    );

    if (!resp || !resp.ok) {
      // Fallback directly to CacheStorage in case SW hasn't claimed control yet
      const cachedResp = await this.matchCachedTestJson(absUrl);
      if (cachedResp) {
        const cachedData = await cachedResp.json();
        this.testCache.set(slug, cachedData);
        return cachedData;
      }
      if (fetchError || isSwOffline) {
        const offErr = new Error("Không thể kết nối máy chủ cục bộ (Offline) và đề thi này chưa được lưu đệm. Hãy khởi động lại máy chủ hoặc kiểm tra kết nối mạng rồi thử lại.");
        offErr.isOffline = true;
        throw offErr;
      }
      throw new Error(`HTTP ${resp.status} khi tải đề ${slug}`);
    }

    const clonedForCache = resp.clone();
    const data = await resp.json();
    this.testCache.set(slug, data);
    if ("caches" in window) {
      caches.open(CHAM_JSON_CACHE).then((c) => c.put(absUrl, clonedForCache)).catch(() => {});
    }
    return data;
  }

  stopTimersAndAudio() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (this.autoAdvanceInterval) {
      clearInterval(this.autoAdvanceInterval);
      this.autoAdvanceRemaining = 0;
      this.autoAdvanceInterval = null;
    }
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.pause();
      } catch (_) {}
      this.activeAudioEl = null;
    }
    try {
      if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
  }

  activateShell() {
    this.onOpen();
    this.isActive = true;
    document.body.classList.add("is-cham-hub-active");
    const root = this.rootEl;
    if (root) root.removeAttribute("hidden");

    window.removeEventListener("keydown", this._boundKeyDown);
    window.addEventListener("keydown", this._boundKeyDown);
    window.removeEventListener("mousedown", this._boundRightMouseDown, true);
    window.addEventListener("mousedown", this._boundRightMouseDown, true);
    window.removeEventListener("contextmenu", this._boundContextMenu, true);
    window.addEventListener("contextmenu", this._boundContextMenu, true);
    window.removeEventListener("mouseup", this._boundRightMouseUp, true);
    window.addEventListener("mouseup", this._boundRightMouseUp, true);
  }

  open(initialSlug = null, subRoute = null, fromHashChange = false) {
    if (this.session?.isCustomPartPractice && !(initialSlug && String(initialSlug).startsWith("practice-part-"))) {
      this.session = null;
    }
    this.activateShell();

    if (initialSlug) {
      this.routeToSlugSubView(initialSlug, subRoute);
    } else {
      this.openLibrary(fromHashChange);
    }
  }

  async routeToSlugSubView(slug, subRoute = null) {
    if (String(slug || "").startsWith("practice-part-")) {
      if (this.session && this.session.slug === slug && this.session.submittedResult && (subRoute === "result" || subRoute === "review")) {
        this.stopTimersAndAudio();
        this.view = subRoute;
        this.render();
        return;
      }
      const pNum = Number(String(slug).replace("practice-part-", "")) || 5;
      this.close({ keepHash: true, skipExitCallback: true });
      this.onOpenPracticePart(pNum);
      return;
    }
    if (subRoute === "run") {
      const draft = loadDraftStore();
      if (draft && draft.slug === slug) {
        await this.startSession({
          slug: draft.slug,
          mode: draft.mode || "practice",
          parts: draft.parts || [1, 2, 3, 4, 5, 6, 7],
          timeLimitMin: draft.timeLimitMin || 0,
          examPauseSec: draft.examPauseSec ?? 5,
          strictIigMode: Boolean(draft.strictIigMode),
          filterQNums: draft.filterQNums || null,
          resumeDraft: draft
        });
        return;
      }
    }
    if (subRoute === "result" || subRoute === "review") {
      if (this.session && this.session.slug === slug && this.session.submittedResult) {
        this.stopTimersAndAudio();
        this.view = subRoute;
        this.render();
        return;
      }
      const list = this.history.attemptsBySlug[slug] || [];
      if (list.length > 0) {
        await this.openHistoricalAttempt(slug, list.length - 1);
        if (!this.isActive) return;
        if (subRoute === "review" && this.session?.submittedResult) {
          this.view = "review";
          this.reviewFilter = "ALL";
          this.session.groupIdx = 0;
          this.syncUrlHash(`#/tests/${slug}/review`, true);
          this.render();
        }
        return;
      }
    }
    if (!this.isActive) return;
    this.openDetail(slug, true);
  }

  close(fromHashChangeOrOpts = false) {
    const opts = typeof fromHashChangeOrOpts === "object" && fromHashChangeOrOpts !== null
      ? fromHashChangeOrOpts
      : { fromHashChange: Boolean(fromHashChangeOrOpts), skipExitCallback: false, keepHash: false };
    const fromHashChange = Boolean(opts.fromHashChange);
    this._navSeq++;
    this.stopTimersAndAudio();
    this.isActive = false;
    if (this.session?.isCustomPartPractice) {
      this.session = null;
    }
    document.body.classList.remove("is-cham-hub-active");
    document.body.classList.remove("is-cham-runner-active");
    const root = this.rootEl;
    if (root) root.setAttribute("hidden", "");
    this._pendingRightClick = null;
    window.removeEventListener("keydown", this._boundKeyDown);
    window.removeEventListener("mousedown", this._boundRightMouseDown, true);
    window.removeEventListener("contextmenu", this._boundContextMenu, true);
    window.removeEventListener("mouseup", this._boundRightMouseUp, true);
    if (!fromHashChange && !opts.keepHash && (location.hash.startsWith("#/tests") || location.hash.startsWith("#/result") || location.hash === "#tests")) {
      this._suppressHashSync = true;
      history.pushState(null, "", "#/practice");
      setTimeout(() => {
        this._suppressHashSync = false;
      }, 0);
    }
    if (!opts.skipExitCallback) {
      this.onExitToStudio({ fromHashChange });
    }
  }

  cycleTheme() {
    state.theme = state.theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
    saveState();
    const themeNames = { light: "Xanh Sáng (Light Blue)", dark: "Tối Slate" };
    showToast(`Giao diện: ${themeNames[state.theme] || state.theme.toUpperCase()}`);
  }

  /* ============================================================
     VIEW 1: FULL / MINI / SINGLE-PART TEST LIBRARY HUB
     ============================================================ */
  getTestCategory(t) {
    if (!t) return "FULL";
    const tt = String(t.testType || "").toLowerCase();
    if (tt === "full") return "FULL";
    if (tt === "mini") return "MINI";
    if (tt === "part" || tt === "section") return "PART";
    const totalQ = Number(t.totalQuestions || 0);
    const parts = this.getAvailablePartsForMeta(t);
    if (totalQ >= 190 && parts.length >= 7) return "FULL";
    if (parts.length >= 5) return "MINI";
    return "PART";
  }

  getFormatBadge(t) {
    const tt = String(t.testType || "").toLowerCase();
    if (tt === "full" || (!tt && Number(t.totalQuestions) >= 190)) {
      return { label: "Full Test", cls: "is-full" };
    }
    if (tt === "mini") {
      return { label: "Mini Test", cls: "is-mini" };
    }
    if (tt === "section") {
      return { label: t.focusSection === "reading" ? "Reading 100" : "Listening 100", cls: "is-mini" };
    }
    const fp = Number(t.focusPart || this.getAvailablePartsForMeta(t)[0] || 5);
    const sub = t.subLabel ? ` · ${t.subLabel}` : "";
    return { label: `Part ${fp}${sub}`, cls: "is-part" };
  }

  openLibraryFiltered({ typeFilter = "ALL", partFilter = "ALL", collection = "ALL" } = {}) {
    this.libState.typeFilter = typeFilter;
    this.libState.partFilter = String(partFilter || "ALL");
    this.libState.collection = collection;
    this.libState.page = 1;
    if (!this.isActive) {
      this.open(null, null, false);
    } else {
      this.openLibrary(false);
    }
  }

  openLibrary(replaceHash = false) {
    this._navSeq++;
    this.stopTimersAndAudio();
    clearToasts();
    if (this.session?.isCustomPartPractice) {
      this.session = null;
    }
    this.view = "library";
    this.syncUrlHash("#/tests", replaceHash);
    this.render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  getFilteredTests() {
    const q = this.libState.query.trim().toLowerCase();
    const cf = this.libState.cefrFilter || "ALL";
    const tf = this.libState.typeFilter || "ALL";
    const pf = String(this.libState.partFilter || "ALL");
    const list = (this.catalog.tests || []).filter((t) => {
      if (tf !== "ALL" && this.getTestCategory(t) !== tf) {
        return false;
      }
      if (pf !== "ALL") {
        if (pf === "SECTION") {
          if (t.testType !== "section") return false;
        } else {
          const pNum = Number(pf);
          if (tf === "PART") {
            if (t.testType !== "part" || Number(t.focusPart) !== pNum) return false;
          } else if (t.testType === "part") {
            if (Number(t.focusPart) !== pNum) return false;
          } else if (!Number(t.partCounts?.[`PART_${pNum}`] || 0)) {
            return false;
          }
        }
      }
      if (this.libState.collection !== "ALL" && t.collection !== this.libState.collection) {
        return false;
      }
      const attempts = this.history.attemptsBySlug[t.slug] || [];
      if (this.libState.statusFilter === "DONE" && attempts.length === 0) return false;
      if (this.libState.statusFilter === "TODO" && attempts.length > 0) return false;

      const diff = getChamDifficultyMeta(t.slug);
      const cefr = diff?.cefr || "B1";
      const cefrGroup = diff?.cefrGroup || "B12";
      if (cf !== "ALL") {
        if (["A12", "B12", "C12"].includes(cf)) {
          if (cefrGroup !== cf) return false;
        } else if (cefr !== cf) {
          return false;
        }
      }

      if (q) {
        const fpLabel = t.focusPart ? `part ${t.focusPart} p${t.focusPart}` : "";
        const hay = `${t.title} ${t.collection} ${t.slug} ${t.subLabel || ""} ${fpLabel} ${cefr} ${diff?.toeicBand || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sortBy = this.libState.sortBy || "DEFAULT";
    if (sortBy === "DIFF_ASC") {
      list.sort((a, b) => (getChamDifficultyMeta(a.slug)?.difficultyScore ?? 60) - (getChamDifficultyMeta(b.slug)?.difficultyScore ?? 60));
    } else if (sortBy === "DIFF_DESC") {
      list.sort((a, b) => (getChamDifficultyMeta(b.slug)?.difficultyScore ?? 60) - (getChamDifficultyMeta(a.slug)?.difficultyScore ?? 60));
    } else if (sortBy === "POPULAR") {
      list.sort((a, b) => (b.attemptCount || 0) - (a.attemptCount || 0));
    }
    return list;
  }

  buildPaginationItems(curPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set([1, totalPages, curPage, curPage - 1, curPage + 1]);
    if (curPage <= 3) { pages.add(2); pages.add(3); pages.add(4); }
    if (curPage >= totalPages - 2) { pages.add(totalPages - 1); pages.add(totalPages - 2); pages.add(totalPages - 3); }
    const sorted = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("...");
      out.push(sorted[i]);
    }
    return out;
  }

  renderHeaderHTML() {
    // v21.0: Single unified global header lives in index.html (.topbar-global-bar).
    return "";
  }

  renderLibraryHTML() {
    const allTests = this.catalog.tests || [];
    const filtered = this.getFilteredTests();
    const draft = loadDraftStore();

    const pageSize = this.libState.showAll ? Math.max(1, filtered.length) : this.libState.pageSize;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (this.libState.page > totalPages) this.libState.page = totalPages;
    const startIdx = (this.libState.page - 1) * pageSize;
    const visibleTests = filtered.slice(startIdx, startIdx + pageSize);

    const typeCounts = { ALL: allTests.length, FULL: 0, MINI: 0, PART: 0 };
    const colCounts = { ALL: allTests.length };
    const partTestCounts = { ALL: 0, SECTION: 0 };
    for (let p = 1; p <= 7; p++) partTestCounts[String(p)] = 0;

    allTests.forEach((t) => {
      const cat = this.getTestCategory(t);
      typeCounts[cat] = (typeCounts[cat] || 0) + 1;
      colCounts[t.collection] = (colCounts[t.collection] || 0) + 1;
      if (cat === "PART") {
        partTestCounts.ALL++;
        if (t.testType === "section") {
          partTestCounts.SECTION++;
        } else if (t.focusPart) {
          partTestCounts[String(t.focusPart)] = (partTestCounts[String(t.focusPart)] || 0) + 1;
        }
      }
    });

    const uniqueCollections = ["ALL", ...Array.from(new Set(allTests.map((t) => t.collection)))];
    const hasActiveFilter = Boolean(
      this.libState.query.trim() ||
      this.libState.typeFilter !== "ALL" ||
      this.libState.partFilter !== "ALL" ||
      this.libState.collection !== "ALL" ||
      this.libState.cefrFilter !== "ALL" ||
      this.libState.statusFilter !== "ALL"
    );
    const totalQuestionsBank = Number(this.catalog.totalQuestions || allTests.reduce((s, t) => s + Number(t.totalQuestions || 0), 0));
    const pageItems = this.buildPaginationItems(this.libState.page, totalPages);

    return `
      <div class="v21-container">
        <div class="v21-page-head v21-tests-head">
          <div>
            <h1 class="v21-page-title">Thi thử TOEIC</h1>
            <p class="v21-page-sub">Kho <strong>${allTests.length} đề thi</strong> (${totalQuestionsBank.toLocaleString("vi-VN")} câu hỏi): ${typeCounts.FULL} Full Test 200 câu, ${typeCounts.MINI} Mini Test 100 câu và ${typeCounts.PART} đề thi lẻ từng Part.</p>
          </div>
          ${draft && draft.slug ? `
            <button type="button" class="cham-btn cham-btn-warm" id="cham-resume-draft-btn" title="Tiếp tục bài đang làm dở: ${escHtml(draft.title)}">
              ${getIcon("play", 14)}
              <span>Tiếp tục: ${escHtml(draft.title)} (${Object.keys(draft.answers || {}).length}/${draft.totalQ})</span>
            </button>
          ` : `
            <button type="button" class="cham-btn cham-btn-warm" id="cham-lib-placement-btn" title="Làm đề đầu vào chẩn đoán trình độ A1–C1">
              <span>Test Đầu Vào (A2)</span>
              ${getIcon("arrowRight", 14)}
            </button>
          `}
        </div>

        <!-- Format Category Tabs: All / Full Test / Mini Test / Đề thi lẻ -->
        <div class="v21-type-tabs" role="tablist" aria-label="Lọc theo định dạng đề thi">
          ${[
            ["ALL", "Tất cả đề", typeCounts.ALL],
            ["FULL", "Full Test (200 câu)", typeCounts.FULL],
            ["MINI", "Mini Test (100 câu)", typeCounts.MINI],
            ["PART", "Đề thi lẻ (Part 1–7)", typeCounts.PART]
          ].map(([id, lbl, cnt]) => `
            <button type="button" role="tab" aria-selected="${this.libState.typeFilter === id}" class="v21-type-tab ${this.libState.typeFilter === id ? "is-active" : ""}" data-cham-type="${id}">
              <span>${lbl}</span>
              <span class="v21-type-count tabular-nums">${cnt}</span>
            </button>
          `).join("")}
        </div>

        ${this.libState.typeFilter === "PART" ? `
          <div class="v21-part-subpills" role="group" aria-label="Chọn Part cho đề thi lẻ">
            <button type="button" class="v21-filter-pill ${this.libState.partFilter === "ALL" ? "is-active" : ""}" data-cham-part-filter="ALL">Tất cả Part (${partTestCounts.ALL})</button>
            ${[1, 2, 3, 4, 5, 6, 7].map((p) => `
              <button type="button" class="v21-filter-pill ${this.libState.partFilter === String(p) ? "is-active" : ""}" data-cham-part-filter="${p}">
                Part ${p} (${partTestCounts[String(p)] || 0})
              </button>
            `).join("")}
            ${partTestCounts.SECTION > 0 ? `
              <button type="button" class="v21-filter-pill ${this.libState.partFilter === "SECTION" ? "is-active" : ""}" data-cham-part-filter="SECTION">
                Listening 100 (${partTestCounts.SECTION})
              </button>
            ` : ""}
          </div>
        ` : ""}

        <div class="v21-tests-layout">
          <!-- Left Filter Sidebar -->
          <aside class="v21-card v21-tests-sidebar ${this.libState.mobileFiltersOpen ? "is-open" : ""}" aria-label="Bộ lọc đề thi">
            <div class="v21-filter-group">
              <label class="v21-filter-title" for="cham-search-input">Tìm kiếm</label>
              <div class="v21-search-box">
                <span class="v21-search-ico">${getIcon("search", 15)}</span>
                <input type="search" class="v21-search-input" id="cham-search-input" placeholder="ETS 2026, Full Test, Part 5, Mini..." value="${escHtml(this.libState.query)}" />
              </div>
            </div>

            <div class="v21-filter-group">
              <div class="v21-filter-title">Bộ sách &amp; Nguồn đề</div>
              <div class="v21-side-list" role="group" aria-label="Lọc theo bộ sách">
                ${uniqueCollections.map((col) => `
                  <button type="button" class="v21-side-item ${this.libState.collection === col ? "is-active" : ""}" data-cham-col="${escHtml(col)}">
                    <span>${col === "ALL" ? "Tất cả bộ đề" : escHtml(col)}</span>
                    <span class="v21-side-count tabular-nums">${colCounts[col] || 0}</span>
                  </button>
                `).join("")}
              </div>
            </div>

            <div class="v21-filter-group">
              <div class="v21-filter-title">Trình độ CEFR</div>
              <div class="v21-cefr-filter-pills" role="group" aria-label="Lọc theo trình độ CEFR">
                ${[
                  ["ALL", "Tất cả"],
                  ["A12", "A1–A2"],
                  ["B12", "B1–B2"],
                  ["C12", "C1–C2"],
                  ["A1", "A1"],
                  ["A2", "A2"],
                  ["B1", "B1"],
                  ["B2", "B2"],
                  ["C1", "C1"],
                  ["C2", "C2"]
                ].map(([id, label]) => `
                  <button type="button" class="v21-filter-pill ${(this.libState.cefrFilter || "ALL") === id ? "is-active" : ""}" data-cham-cefr="${id}">${label}</button>
                `).join("")}
              </div>
            </div>

            <div class="v21-filter-group">
              <label class="v21-filter-title" for="cham-status-filter">Trạng thái</label>
              <select id="cham-status-filter" class="v21-select" aria-label="Lọc trạng thái làm bài">
                <option value="ALL" ${this.libState.statusFilter === "ALL" ? "selected" : ""}>Tất cả trạng thái</option>
                <option value="TODO" ${this.libState.statusFilter === "TODO" ? "selected" : ""}>Chưa làm</option>
                <option value="DONE" ${this.libState.statusFilter === "DONE" ? "selected" : ""}>Đã làm</option>
              </select>
            </div>

            ${hasActiveFilter ? `
              <button type="button" class="v21-text-btn" id="cham-clear-filters-btn" style="margin-top: 4px;">
                Xóa toàn bộ bộ lọc
              </button>
            ` : ""}
          </aside>

          <!-- Right Row List -->
          <div class="v21-tests-main">
            <div class="v21-tests-toolbar">
              <div class="v21-toolbar-left">
                <button type="button" class="cham-btn v21-mobile-filter-btn" id="v21-mobile-filter-toggle">
                  <span>Bộ lọc${hasActiveFilter ? " •" : ""}</span>
                </button>
                <span class="v21-result-count tabular-nums"><strong>${filtered.length}</strong> bộ đề</span>
              </div>
              <div class="v21-toolbar-right">
                <label class="v21-sort-label" for="cham-sort-select">Sắp xếp:</label>
                <select id="cham-sort-select" class="v21-select v21-select-inline" aria-label="Sắp xếp danh sách đề thi">
                  <option value="DEFAULT" ${this.libState.sortBy === "DEFAULT" ? "selected" : ""}>Mặc định</option>
                  <option value="DIFF_ASC" ${this.libState.sortBy === "DIFF_ASC" ? "selected" : ""}>Độ khó: Dễ → Khó</option>
                  <option value="DIFF_DESC" ${this.libState.sortBy === "DIFF_DESC" ? "selected" : ""}>Độ khó: Khó → Dễ</option>
                  <option value="POPULAR" ${this.libState.sortBy === "POPULAR" ? "selected" : ""}>Phổ biến nhất</option>
                </select>
              </div>
            </div>

            ${visibleTests.length === 0 ? `
              <div class="v21-card" style="text-align: center; padding: 40px 20px;">
                <p style="font-size: 15px; font-weight: 500; margin: 0 0 12px;">Không tìm thấy bộ đề nào khớp với bộ lọc hiện tại.</p>
                <button type="button" class="cham-btn cham-btn-primary" id="cham-clear-filters-empty-btn">Xem tất cả ${allTests.length} đề thi</button>
              </div>
            ` : `
              <div class="v21-card v21-test-list" role="list">
                ${visibleTests.map((t) => {
                  const attempts = this.history.attemptsBySlug[t.slug] || [];
                  const bestAttempt = attempts.reduce((best, cur) => (!best || (cur.accuracy || 0) > (best.accuracy || 0) ? cur : best), null);
                  const showScaledBadge = bestAttempt && (bestAttempt.isFull990 || bestAttempt.isFull200 || bestAttempt.isFull495);
                  const diff = getChamDifficultyMeta(t.slug);
                  const cefrCode = diff?.cefr || "B1";
                  const cefrCls = getCefrBadgeToneClass(cefrCode);
                  const fmtBadge = this.getFormatBadge(t);
                  const scoreDisplay = bestAttempt
                    ? (showScaledBadge ? `${bestAttempt.scaledTotal}/${bestAttempt.isFull495 ? "495" : "990"}` : `${bestAttempt.accuracy}%`)
                    : "Chưa làm";
                  return `
                    <div class="v21-test-row" role="listitem" data-test-slug="${escHtml(t.slug)}" data-cefr="${escHtml(cefrCode)}" data-test-type="${escHtml(t.testType || "full")}">
                      <div class="v21-test-row-main">
                        <div class="v21-test-row-title-line">
                          <span class="v21-test-row-title">${escHtml(t.title)}</span>
                          <span class="v21-fmt-badge ${fmtBadge.cls}">${escHtml(fmtBadge.label)}</span>
                          <span class="cefr-badge cefr-sm ${cefrCls}">${escHtml(cefrCode)}</span>
                        </div>
                        <span class="v21-test-row-meta tabular-nums">${escHtml(t.collection)} · ${t.duration} phút · ${t.totalQuestions} câu</span>
                      </div>

                      <div class="v21-test-row-right">
                        <span class="v21-test-row-score tabular-nums ${bestAttempt ? "is-done" : ""}">${escHtml(scoreDisplay)}</span>
                        <button type="button" class="cham-btn v21-row-btn cham-open-detail-btn" data-slug="${escHtml(t.slug)}">
                          Làm bài
                        </button>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>

              <div class="cham-pagination-row">
                <span style="font-size: 13px; color: var(--text-muted); font-weight: 500;">
                  Hiển thị ${startIdx + 1}–${Math.min(filtered.length, startIdx + visibleTests.length)} / ${filtered.length} đề thi
                  ${!this.libState.showAll ? `(Trang ${this.libState.page}/${totalPages})` : "(Tất cả)"}
                </span>

                <div class="cham-page-btns">
                  <button type="button" class="cham-btn" id="cham-toggle-showall-btn" style="padding: 6px 12px; font-size: 13px;">
                    ${this.libState.showAll ? "Phân trang (12)" : `Hiện tất cả (${filtered.length})`}
                  </button>
                  ${!this.libState.showAll && totalPages > 1 ? `
                    <button type="button" class="cham-page-btn" data-cham-page="${Math.max(1, this.libState.page - 1)}" ${this.libState.page <= 1 ? "disabled" : ""} aria-label="Trang trước">‹</button>
                    ${pageItems.map((p) => p === "..."
                      ? `<span class="cham-page-ellipsis" aria-hidden="true">…</span>`
                      : `<button type="button" class="cham-page-btn ${p === this.libState.page ? "is-active" : ""}" data-cham-page="${p}">${p}</button>`
                    ).join("")}
                    <button type="button" class="cham-page-btn" data-cham-page="${Math.min(totalPages, this.libState.page + 1)}" ${this.libState.page >= totalPages ? "disabled" : ""} aria-label="Trang sau">›</button>
                  ` : ""}
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     VIEW 2: TEST OVERVIEW & PRACTICE / EXAM CONFIG
     ============================================================ */
  async openDetail(slug, replaceHash = false) {
    this._navSeq++;
    this.stopTimersAndAudio();
    clearToasts();
    this.view = "detail";
    if (this.detailState.slug !== slug) {
      this.detailState.modeTab = "practice";
      this.detailState.examScope = "full";
      this.detailState.strictIigMode = false;
    }
    this.detailState.slug = slug;
    this.syncUrlHash(`#/tests/${slug}`, replaceHash);
    const meta = (this.catalog.tests || []).find((t) => t.slug === slug);
    if (meta) {
      const availableParts = this.getAvailablePartsForMeta(meta);
      this.detailState.selectedParts = new Set(availableParts);
      this.detailState.timeLimitMin = 0;
    }
    this.render();
    window.scrollTo({ top: 0, behavior: "instant" });
    // Pre-warm test JSON & check offline cache status in background
    this.probeOfflineCacheForSlug(slug).catch(() => {});
  }

  async probeOfflineCacheForSlug(slug) {
    const curState = this.offlineDownloads.get(slug);
    if (curState?.running) return;
    if (!slug || String(slug).startsWith("practice-part-")) return;
    const meta = (this.catalog.tests || []).find((t) => t.slug === slug);
    const jsonRelUrl = meta?.dataFile || `data/cham_tests/${slug}.json`;
    const jsonAbsUrl = new URL(jsonRelUrl, window.location.href).href;

    let testData = this.testCache.get(slug) || null;
    if (!testData && "caches" in window) {
      const cachedResp = await this.matchCachedTestJson(jsonAbsUrl);
      if (cachedResp) {
        try {
          testData = await cachedResp.json();
          this.testCache.set(slug, testData);
        } catch (_) {
          testData = null;
        }
      }
    }

    if (!testData) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        const offlineHint = "Đang ngoại tuyến — đề này chưa có trong bộ nhớ đệm cục bộ.";
        this.offlineDownloads.set(slug, {
          running: false,
          cachedAll: false,
          statusText: offlineHint
        });
        if (this.view === "detail" && this.detailState.slug === slug) {
          const statusEl = document.getElementById("cham-offline-status");
          if (statusEl) statusEl.textContent = offlineHint;
        }
        return;
      }
      try {
        testData = await this.loadTestJson(slug);
      } catch (err) {
        if (err?.isOffline) {
          const offlineHint = "Mất kết nối máy chủ — đề này chưa có trong bộ nhớ đệm.";
          this.offlineDownloads.set(slug, {
            running: false,
            cachedAll: false,
            statusText: offlineHint
          });
          if (this.view === "detail" && this.detailState.slug === slug) {
            const statusEl = document.getElementById("cham-offline-status");
            if (statusEl) statusEl.textContent = offlineHint;
          }
        }
        return;
      }
    }

    if (!("caches" in window) || !testData) return;
    const urls = this.collectTestAssetUrls(slug, testData);
    const cache = await caches.open(CHAM_MEDIA_CACHE);
    const keys = await cache.keys();
    const keySet = new Set(keys.map((r) => r.url));
    let matched = 0;
    for (const u of urls) {
      const abs = new URL(u, window.location.href).href;
      if (keySet.has(abs) || keySet.has(u)) matched++;
    }
    if (matched >= urls.length && urls.length > 0) {
      this.offlineDownloads.set(slug, {
        running: false,
        cachedAll: true,
        statusText: `✓ Đã sẵn sàng Offline (${urls.length} tệp)`
      });
      if (this.view === "detail" && this.detailState.slug === slug) {
        const statusEl = document.getElementById("cham-offline-status");
        const btnEl = document.getElementById("cham-offline-dl-btn");
        if (statusEl) statusEl.textContent = `✓ Đã sẵn sàng Offline (${urls.length} tệp)`;
        if (btnEl) btnEl.innerHTML = `${getIcon("checkCircle", 14)} <span>Đã lưu Offline</span>`;
      }
    } else if (matched > 0 && !this.offlineDownloads.has(slug)) {
      const partialMsg = `Đã lưu sẵn ${matched}/${urls.length} tệp Offline — bấm để tải tiếp phần thiếu`;
      this.offlineDownloads.set(slug, {
        running: false,
        cachedAll: false,
        statusText: partialMsg
      });
      if (this.view === "detail" && this.detailState.slug === slug) {
        const statusEl = document.getElementById("cham-offline-status");
        if (statusEl) statusEl.textContent = partialMsg;
      }
    } else if (!this.offlineDownloads.has(slug)) {
      const jsonCached = await this.matchCachedTestJson(jsonAbsUrl);
      if (jsonCached) {
        const jsonReadyMsg = "✓ Đã lưu đề thi (JSON) · Bấm Tải Offline để lưu thêm audio & ảnh";
        this.offlineDownloads.set(slug, {
          running: false,
          cachedAll: false,
          statusText: jsonReadyMsg
        });
        if (this.view === "detail" && this.detailState.slug === slug) {
          const statusEl = document.getElementById("cham-offline-status");
          if (statusEl && !statusEl.textContent.trim()) statusEl.textContent = jsonReadyMsg;
        }
      }
    }
  }

  collectTestAssetUrls(slug, testData) {
    const meta = (this.catalog.tests || []).find((t) => t.slug === slug);
    const jsonUrl = new URL(meta?.dataFile || `data/cham_tests/${slug}.json`, window.location.href).href;
    const urls = new Set([jsonUrl]);
    const inlineImgRe = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
    (testData.groups || []).forEach((g) => {
      if (g.audio) urls.add(g.audio);
      (g.images || []).forEach((im) => urls.add(im));
      for (const htmlField of [g.passageHtml, g.transcriptHtml, g.explanationHtml]) {
        if (!htmlField) continue;
        let m;
        inlineImgRe.lastIndex = 0;
        while ((m = inlineImgRe.exec(htmlField)) !== null) {
          if (m[1]) urls.add(m[1]);
        }
      }
    });
    return Array.from(urls);
  }

  renderDetailHTML() {
    const slug = this.detailState.slug;
    const meta = (this.catalog.tests || []).find((t) => t.slug === slug) || this.catalog.tests?.[0];
    if (!meta) return this.renderLibraryHTML();

    const partCounts = meta.partCounts || {};
    const partsList = this.getAvailablePartsForMeta(meta);
    const attempts = this.history.attemptsBySlug[slug] || [];
    const dlState = this.offlineDownloads.get(slug) || null;

    const selectedValidParts = partsList.filter((p) => this.detailState.selectedParts.has(p));
    const selectedQCount = selectedValidParts
      .reduce((acc, p) => acc + (partCounts[`PART_${p}`] || PART_META[p].defaultCount), 0);

    const diff = getChamDifficultyMeta(meta.slug);
    const cefrCode = diff?.cefr || "B1";
    const cefrCls = getCefrBadgeToneClass(cefrCode);
    const diffScore = Math.round(diff?.difficultyScore ?? 65);
    const partDiffEntries = Object.entries(diff?.partDifficulty || {});
    const recMaterials = (diff?.recommendedMaterials || [])
      .map((id) => {
        const b = (window.TOEIC_MATERIALS_DATA?.books || []).find((x) => x.id === id);
        if (b) return { tab: "books", label: b.title };
        const g = (window.TOEIC_MATERIALS_DATA?.grammarTopics || []).find((x) => x.id === id);
        if (g) return { tab: "grammar", label: g.title };
        if (id.includes("paraphrase")) return { tab: "paraphrase", label: "Từ điển Paraphrase ETS" };
        if (id.includes("vocab")) return { tab: "vocab", label: "Từ vựng Hackers 30 Ngày" };
        if (id === "cefr_roadmap" || id.includes("matrix") || id.includes("roadmap")) return { tab: "matrix", label: "Lộ trình & Ma trận CEFR" };
        return null;
      })
      .filter(Boolean);

    return `
      <div class="v21-container">
        <div class="v21-breadcrumb-row">
          <button type="button" class="v21-back-btn" id="cham-back-library-btn">
            ${getIcon("arrowLeft", 15)}
            <span>Danh sách đề thi</span>
          </button>
          <span class="v21-neutral-pill">${escHtml(meta.collection)}</span>
        </div>

        <div class="v21-card v21-detail-head-card">
          <div class="v21-detail-head-main">
            <div class="v21-detail-title-row">
              <h1 class="v21-page-title" style="margin: 0;">${escHtml(meta.title)}</h1>
              <span class="cefr-badge ${cefrCls}">${escHtml(cefrCode)}</span>
            </div>
            <div class="v21-detail-meta-row tabular-nums">
              <span>${meta.duration} phút</span>
              <span>·</span>
              <span>${partsList.length === 1 ? `Part ${partsList[0]}` : `${partsList.length} phần thi`}</span>
              <span>·</span>
              <span>${meta.totalQuestions} câu hỏi</span>
              ${Number(meta.attemptCount || 0) > 0 ? `<span>·</span><span>${Number(meta.attemptCount).toLocaleString("vi-VN")} lượt thi</span>` : ""}
              ${diff ? `<span>·</span><span>Độ khó ${diffScore}/100 (${escHtml(diff.toeicBand || "550–780")}đ)</span>` : ""}
            </div>
          </div>

          <div class="v21-detail-offline-col">
            <button type="button" class="cham-btn" id="cham-offline-dl-btn" data-slug="${escHtml(slug)}" ${dlState?.running ? "disabled" : ""} title="Tải toàn bộ file âm thanh và hình ảnh của đề này để làm offline">
              ${dlState?.running
                ? `${getIcon("clock", 14)} <span>Đang tải Offline...</span>`
                : (dlState?.cachedAll
                  ? `${getIcon("checkCircle", 14)} <span>Đã lưu Offline</span>`
                  : `${getIcon("download", 14)} <span>Tải Offline</span>`)}
            </button>
            <span id="cham-offline-status" class="v21-offline-status">${escHtml(dlState?.statusText || "")}</span>
          </div>
        </div>

        <div class="cham-detail-grid">
          <div class="v21-card">
            <div class="cham-mode-tabs">
              <button type="button" class="cham-mode-tab ${this.detailState.modeTab === "practice" ? "is-active" : ""}" data-detail-mode="practice">
                <span>${partsList.length === 1 ? `Luyện tập Part ${partsList[0]}` : "Luyện Part đã chọn"}</span>
              </button>
              <button type="button" class="cham-mode-tab ${this.detailState.modeTab === "exam" ? "is-active" : ""}" data-detail-mode="exam">
                <span>${partsList.length === 1 ? `Thi tính giờ (${meta.duration} phút)` : (partsList.some((p) => p <= 4) && partsList.some((p) => p >= 5) ? "Thi chuẩn IIG (Full / Nghe / Đọc)" : `Thi chuẩn IIG (${meta.duration} phút)`)}</span>
              </button>
            </div>

            ${this.detailState.modeTab === "practice" ? `
              <div class="v21-part-table-bar">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="v21-text-btn" id="cham-select-all-parts">Chọn tất cả</button>
                  <span style="color: var(--border-strong);">·</span>
                  <button type="button" class="v21-text-btn" id="cham-clear-all-parts" style="color: var(--text-muted);">Bỏ chọn</button>
                </div>
                <span class="v21-selected-summary tabular-nums">Đã chọn: <strong>${selectedValidParts.length} phần (${selectedQCount} câu)</strong></span>
              </div>

              <div class="v21-table-wrap">
                <table class="v21-parts-table">
                  <thead>
                    <tr>
                      <th style="width: 42px;">Chọn</th>
                      <th>Phần thi</th>
                      <th>Dạng câu hỏi</th>
                      <th style="text-align: right;">Số câu</th>
                      <th style="text-align: right;">CEFR</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${partsList.map((p) => {
                      const cnt = partCounts[`PART_${p}`] || PART_META[p].defaultCount;
                      const checked = this.detailState.selectedParts.has(p);
                      const pCefr = diff?.partDifficulty?.[String(p)] || cefrCode;
                      return `
                        <tr class="v21-part-row ${checked ? "is-checked" : ""}">
                          <td>
                            <input type="checkbox" class="cham-part-checkbox" value="${p}" ${checked ? "checked" : ""} aria-label="Chọn Part ${p}" />
                          </td>
                          <td><strong>Part ${p}</strong> <span class="v21-part-sec-tag">${p <= 4 ? "Nghe" : "Đọc"}</span></td>
                          <td class="v21-muted-cell">${PART_META[p].desc}</td>
                          <td style="text-align: right;" class="tabular-nums">${cnt} câu</td>
                          <td style="text-align: right;"><span class="cefr-badge cefr-sm ${getCefrBadgeToneClass(pCefr)}">${escHtml(pCefr)}</span></td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              </div>

              <div class="v21-detail-action-row">
                <label class="v21-inline-label">
                  <span>Thời gian:</span>
                  <select id="cham-practice-timer-select" class="v21-select v21-select-inline">
                    <option value="0" ${this.detailState.timeLimitMin === 0 ? "selected" : ""}>Không giới hạn</option>
                    <option value="15" ${this.detailState.timeLimitMin === 15 ? "selected" : ""}>15 phút</option>
                    <option value="30" ${this.detailState.timeLimitMin === 30 ? "selected" : ""}>30 phút</option>
                    <option value="45" ${this.detailState.timeLimitMin === 45 ? "selected" : ""}>45 phút</option>
                    <option value="60" ${this.detailState.timeLimitMin === 60 ? "selected" : ""}>60 phút</option>
                    <option value="90" ${this.detailState.timeLimitMin === 90 ? "selected" : ""}>90 phút</option>
                    <option value="120" ${this.detailState.timeLimitMin === 120 ? "selected" : ""}>120 phút</option>
                  </select>
                </label>

                <button type="button" class="cham-btn cham-btn-warm" id="cham-start-practice-btn" ${selectedValidParts.length === 0 ? "disabled" : ""} style="padding: 10px 20px;">
                  <span>Luyện Part đã chọn (${selectedQCount} câu)</span>
                  ${getIcon("arrowRight", 15)}
                </button>
              </div>
            ` : (() => {
              const isSinglePart = partsList.length === 1;
              const isMiniTest = meta.testType === "mini";
              const isSectionTest = meta.testType === "section";
              const hasDetailLC = partsList.some((p) => p <= 4);
              const hasDetailRC = partsList.some((p) => p >= 5);
              const canSplitScope = hasDetailLC && hasDetailRC;
              const activeScope = canSplitScope ? (this.detailState.examScope || "full") : "full";
              const dur = Number(meta.duration || 120);
              const lcMin = dur === 120 ? 45 : Math.max(5, Math.round((dur * 45) / 120));
              const rcMin = dur === 120 ? 75 : Math.max(5, dur - lcMin);
              const lcParts = partsList.filter((p) => p <= 4);
              const rcParts = partsList.filter((p) => p >= 5);
              const lcQCount = lcParts.reduce((acc, p) => acc + Number(meta.partCounts?.[`PART_${p}`] || 0), 0);
              const rcQCount = rcParts.reduce((acc, p) => acc + Number(meta.partCounts?.[`PART_${p}`] || 0), 0);

              const effectiveHasLC = activeScope === "reading" ? false : hasDetailLC;
              const effectiveHasRC = activeScope === "listening" ? false : hasDetailRC;
              const effectiveQCount = activeScope === "listening" ? lcQCount : (activeScope === "reading" ? rcQCount : meta.totalQuestions);
              const effectiveDur = activeScope === "listening" ? lcMin : (activeScope === "reading" ? rcMin : dur);
              const effectivePartLabel = activeScope === "listening"
                ? `Part ${lcParts[0]}–${lcParts[lcParts.length - 1]}`
                : activeScope === "reading"
                  ? `Part ${rcParts[0]}–${rcParts[rcParts.length - 1]}`
                  : (isSinglePart ? `Part ${partsList[0]}` : `${partsList.length} phần`);

              const examHeading = activeScope === "listening"
                ? `Thi lẻ Phần Nghe chuẩn IIG (${effectivePartLabel} · ${effectiveQCount} câu · ${effectiveDur} phút)`
                : activeScope === "reading"
                  ? `Thi lẻ Phần Đọc chuẩn IIG (${effectivePartLabel} · ${effectiveQCount} câu · ${effectiveDur} phút)`
                  : isSinglePart
                    ? `Thi tính giờ Part ${partsList[0]} (${meta.totalQuestions} câu · ${meta.duration} phút)`
                    : isMiniTest
                      ? `Thi Mini Test chuẩn IIG (${meta.totalQuestions} câu · ${meta.duration} phút)`
                      : isSectionTest
                        ? `Thi ${meta.focusSection === "reading" ? "Reading" : "Listening"} chuẩn IIG (${meta.totalQuestions} câu · ${meta.duration} phút)`
                        : `Thi Full chuẩn phòng thi IIG (${meta.totalQuestions} câu · ${meta.duration} phút)`;
              const scaleText = effectiveHasLC && effectiveHasRC
                ? "quy đổi thang điểm ETS /990"
                : (effectiveQCount >= 90 || isSectionTest ? "quy đổi thang điểm ETS /495" : "chấm điểm chính xác & ước lượng thang điểm ETS /495");
              const startBtnText = activeScope === "listening"
                ? `Bắt đầu Thi Nghe (${lcMin}p)`
                : activeScope === "reading"
                  ? `Bắt đầu Thi Đọc (${rcMin}p)`
                  : isSinglePart
                    ? `Bắt đầu Thi Part ${partsList[0]}`
                    : isMiniTest
                      ? "Bắt đầu Mini Test"
                      : isSectionTest
                        ? "Bắt đầu Thi Section"
                        : "Bắt đầu Thi Full";
              return `
              ${canSplitScope ? `
                <div class="v21-iig-scope-wrap">
                  <div class="v21-iig-scope-label">Chọn phạm vi thi chuẩn IIG:</div>
                  <div class="v21-iig-scope-grid" role="radiogroup" aria-label="Phạm vi thi chuẩn IIG">
                    <button type="button" role="radio" aria-checked="${activeScope === "full" ? "true" : "false"}" class="v21-iig-scope-card ${activeScope === "full" ? "is-active" : ""}" data-exam-scope="full">
                      <span class="v21-iig-scope-title">${getIcon("award", 15)} <span>Full Test</span></span>
                      <span class="v21-iig-scope-meta tabular-nums">${meta.totalQuestions} câu · ${dur} phút · /990</span>
                    </button>
                    <button type="button" role="radio" aria-checked="${activeScope === "listening" ? "true" : "false"}" class="v21-iig-scope-card ${activeScope === "listening" ? "is-active" : ""}" data-exam-scope="listening">
                      <span class="v21-iig-scope-title">${getIcon("headphones", 15)} <span>Chỉ phần Nghe</span></span>
                      <span class="v21-iig-scope-meta tabular-nums">P1–4 · ${lcQCount} câu · ${lcMin} phút · /495</span>
                    </button>
                    <button type="button" role="radio" aria-checked="${activeScope === "reading" ? "true" : "false"}" class="v21-iig-scope-card ${activeScope === "reading" ? "is-active" : ""}" data-exam-scope="reading">
                      <span class="v21-iig-scope-title">${getIcon("bookOpen", 15)} <span>Chỉ phần Đọc</span></span>
                      <span class="v21-iig-scope-meta tabular-nums">P5–7 · ${rcQCount} câu · ${rcMin} phút · /495</span>
                    </button>
                  </div>
                </div>
              ` : ""}

              <div class="cham-exam-notice">
                <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">
                  ${examHeading}
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 14px;">
                  <li>Làm trọn bộ <strong>${effectivePartLabel} (${effectiveQCount} câu)</strong> trong <strong>${effectiveDur} phút</strong>, tự động nộp bài và ${scaleText} khi hết giờ.</li>
                  <li>${effectiveHasLC
                    ? "Có khoảng nghỉ chọn đáp án chuẩn IIG giữa các câu Listening (mặc định 5 giây) và hỗ trợ gạch loại trừ ⊘."
                    : "Hỗ trợ tô vàng từ khóa trong bài đọc, gắn cờ rà soát (Review Screen) và gạch loại trừ đáp án nhiễu ⊘."}</li>
                </ul>
              </div>

              <div class="cham-exam-config-stack">
                ${effectiveHasLC ? `
                  <label class="cham-strict-toggle-row">
                    <input type="checkbox" id="cham-strict-iig-toggle" ${this.detailState.strictIigMode ? "checked" : ""} />
                    <span>
                      <strong>${effectiveHasRC ? "Chế độ Thi Chuẩn IIG Nghiêm Ngặt" : "Khóa tua Audio chuẩn IIG Nghiêm Ngặt"}</strong>
                      <small>${effectiveHasRC
                        ? `Tách ${lcMin} phút Listening (khóa tua audio) → Màn hình chuyển Phần II: Reading (${rcMin} phút &amp; Review Screen)`
                        : `Phát băng 1 lượt duy nhất trong ${lcMin} phút (khóa tua thanh audio giống phòng thi IIG thật)`}</small>
                    </span>
                  </label>
                ` : ""}

                <div class="v21-detail-action-row">
                  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    ${effectiveHasLC ? `
                      <label class="v21-inline-label">
                        <span>Nghỉ sau audio:</span>
                        <select id="cham-exam-pause-select" class="v21-select v21-select-inline">
                          <option value="5" ${this.detailState.examPauseSec === 5 ? "selected" : ""}>Chuẩn IIG (5s)</option>
                          <option value="8" ${this.detailState.examPauseSec === 8 ? "selected" : ""}>Thoải mái (8s)</option>
                          <option value="3" ${this.detailState.examPauseSec === 3 ? "selected" : ""}>Nhanh (3s)</option>
                          <option value="0" ${this.detailState.examPauseSec === 0 ? "selected" : ""}>Tự chuyển tay</option>
                        </select>
                      </label>

                      <button type="button" class="cham-btn" id="cham-sound-check-btn" title="Kiểm tra loa/tai nghe trước khi vào phòng thi">
                        ${CHAM_SVG.volume}
                        <span>Kiểm tra loa</span>
                      </button>
                    ` : `<span class="v21-neutral-pill">Phần Đọc hiểu · ${effectiveDur} phút chuẩn IIG · Không yêu cầu âm thanh</span>`}
                  </div>

                  <button type="button" class="cham-btn cham-btn-warm" id="cham-start-exam-btn" style="padding: 10px 22px;">
                    <span>${startBtnText}</span>
                    ${getIcon("arrowRight", 15)}
                  </button>
                </div>
              </div>
              `;
            })()}
          </div>

          <aside class="v21-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h2 class="v21-section-title" style="margin: 0;">Lịch sử làm đề</h2>
              <span class="v21-neutral-pill tabular-nums">${attempts.length} lần</span>
            </div>

            ${attempts.length === 0 ? `
              <div class="v21-empty-hint" style="margin-top: 0;">
                <span>Bạn chưa làm đề <strong>${escHtml(meta.title)}</strong> lần nào. Kết quả &amp; điểm quy đổi sẽ lưu tự động trên máy.</span>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto;">
                ${attempts.slice().reverse().map((att, idx) => {
                  const isFullScaled = Boolean(att.isFull990 || att.isFull200 || att.isFull495);
                  const denom = att.isFull495 ? "/495" : "/990";
                  return `
                    <div class="v21-history-row">
                      <div>
                        <div style="font-weight: 500; font-size: 14px; color: var(--text);">
                          ${att.mode === "exam" ? "Thi Full" : "Luyện tập"} ·
                          <strong style="color: var(--accent);">${isFullScaled ? `${att.scaledTotal}${denom}` : `${att.accuracy}%`}</strong>
                          <span style="font-size: 13px; color: var(--text-muted);">(${att.correct}/${att.total})</span>
                        </div>
                        <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                          ${escHtml(att.dateStr)} · ${fmtHMS(att.elapsedSec)}
                        </div>
                      </div>
                      <button type="button" class="cham-btn cham-open-attempt-btn" data-attempt-idx="${attempts.length - 1 - idx}" style="padding: 5px 10px; font-size: 13px;">
                        Xem kết quả
                      </button>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </aside>
        </div>

        ${diff ? `
          <div class="v21-card cham-detail-cefr-card" style="margin-top: 16px;">
            <div class="cham-detail-cefr-top">
              <div>
                <h2 class="v21-section-title" style="margin: 0 0 4px;">Phân tích độ khó CEFR</h2>
                <p style="margin: 0; font-size: 14px; color: var(--text-muted);">${escHtml(diff.summary || "")}</p>
              </div>
              <div class="cham-detail-cefr-score-pill">
                <span class="cefr-badge ${cefrCls}">${escHtml(cefrCode)}</span>
                <strong>${diffScore}/100</strong>
                <span>${escHtml(diff.toeicBand || "550–780")}đ</span>
              </div>
            </div>

            <div class="cham-detail-cefr-metrics">
              <div class="cham-metric-chip"><span>Listening CEFR:</span> <strong>${escHtml(diff.lcCefr || "—")}</strong></div>
              <div class="cham-metric-chip"><span>Reading CEFR:</span> <strong>${escHtml(diff.rcCefr || "—")}</strong></div>
              <div class="cham-metric-chip"><span>Từ học thuật C1+:</span> <strong>${diff.metrics?.lexicalPct ?? 0}%</strong></div>
              <div class="cham-metric-chip"><span>Câu suy luận:</span> <strong>${diff.metrics?.inferenceCount ?? 0} câu</strong></div>
              <div class="cham-metric-chip"><span>Bẫy P2 / NOT:</span> <strong>${(diff.metrics?.trapP2Count ?? 0) + (diff.metrics?.negativeCount ?? 0)} câu</strong></div>
              <div class="cham-metric-chip"><span>Đọc đa đoạn P7:</span> <strong>${diff.metrics?.crossDocCount ?? 0} nhóm</strong></div>
            </div>

            ${partDiffEntries.length ? `
              <div class="cham-part-cefr-row">
                ${partDiffEntries.map(([pNum, pLevel]) => `
                  <span class="cham-part-cefr-pill">
                    <span>Part ${escHtml(pNum)}</span>
                    <span class="cefr-badge cefr-sm ${getCefrBadgeToneClass(pLevel)}">${escHtml(pLevel)}</span>
                  </span>
                `).join("")}
              </div>
            ` : ""}

            ${recMaterials.length ? `
              <div class="cham-detail-materials-bar">
                <span style="font-size: 13px; font-weight: 500; color: var(--text-muted);">Tài liệu khuyến nghị:</span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${recMaterials.map((rm) => `
                    <button type="button" class="cham-btn" data-cham-open-material-tab="${escHtml(rm.tab)}">
                      ${CHAM_SVG.books}
                      <span>${escHtml(rm.label)}</span>
                    </button>
                  `).join("")}
                </div>
              </div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  /* ============================================================
     START SESSION (PRACTICE / EXAM / MISTAKE RETAKE)
     ============================================================ */
  async startSession({ slug, mode, parts, timeLimitMin, examPauseSec = 5, strictIigMode = false, filterQNums = null, resumeDraft = null }) {
    const seq = ++this._navSeq;
    this.stopTimersAndAudio();
    let testData;
    try {
      testData = await this.loadTestJson(slug);
    } catch (err) {
      if (seq !== this._navSeq || !this.isActive) return;
      const rootEmpty = !this.rootEl || !this.rootEl.innerHTML.trim();
      if (rootEmpty || this.view !== "detail" || this.detailState.slug !== slug) {
        const exists = (this.catalog.tests || []).some((t) => t.slug === slug);
        if (exists) this.openDetail(slug, true);
        else this.openLibrary(true);
      }
      showToast(`Không thể tải dữ liệu đề thi: ${err.message}`, "bad");
      return;
    }
    if (seq !== this._navSeq || !this.isActive) return;

    const partsSet = new Set(parts);
    const normalizedFilter = Array.isArray(filterQNums) && filterQNums.length > 0
      ? Array.from(new Set(filterQNums.map(Number).filter(Boolean)))
      : null;
    const qSet = normalizedFilter ? new Set(normalizedFilter) : null;

    let groups = [];
    for (const rawGroup of (testData.groups || [])) {
      if (!partsSet.has(rawGroup.part)) continue;
      if (qSet) {
        const matchingQs = (rawGroup.questions || []).filter((q) => qSet.has(q.num));
        if (!matchingQs.length) continue;
        const rng = matchingQs.length === 1
          ? String(matchingQs[0].num)
          : `${matchingQs[0].num}-${matchingQs[matchingQs.length - 1].num}`;
        groups.push({
          ...rawGroup,
          range: rng,
          questions: matchingQs
        });
      } else {
        groups.push(rawGroup);
      }
    }

    if (!groups.length) {
      showToast("Không có câu hỏi nào trong phần đã chọn!", "bad");
      return;
    }

    clearToasts();
    const activeParts = Array.from(new Set(groups.map((g) => g.part))).sort((a, b) => a - b);
    const hasListeningSection = activeParts.some((p) => p <= 4);
    const hasReadingSection = activeParts.some((p) => p >= 5);
    const isStrictDualSection = Boolean(mode === "exam" && strictIigMode && hasListeningSection && hasReadingSection);
    const isStrictListeningOnly = Boolean(mode === "exam" && strictIigMode && hasListeningSection && !hasReadingSection);
    const totalQ = groups.reduce((acc, g) => acc + (g.questions?.length || 0), 0);
    const totalDurMin = Math.max(10, Number(testData.duration || 120));
    const strictLcMin = totalDurMin === 120 ? 45 : Math.max(5, Math.round((totalDurMin * 45) / 120));
    const strictRcMin = totalDurMin === 120 ? 75 : Math.max(5, totalDurMin - strictLcMin);
    const strictLcSec = strictLcMin * 60;
    const strictRcSec = strictRcMin * 60;
    const examDurMin = timeLimitMin > 0 ? timeLimitMin : (testData.duration || 120);
    const totalSecLimit = mode === "exam" ? examDurMin * 60 : (timeLimitMin > 0 ? timeLimitMin * 60 : 0);
    const clampedGroupIdx = Math.max(0, Math.min(groups.length - 1, Number(resumeDraft?.groupIdx || 0)));

    this.showHelpModal = false;
    this.showReviewModal = false;
    this.showSectionGate = false;
    this.volumeMenuOpen = false;
    this.vocabSaveDraft = null;
    this.focusedQNum = null;
    this.paletteFilter = "ALL";

    this.session = {
      slug,
      title: testData.title,
      collection: testData.collection,
      mode, // 'practice' | 'exam'
      strictIigMode: isStrictDualSection,
      strictListeningOnly: isStrictListeningOnly,
      strictLcSec,
      strictRcSec,
      hasListeningSection,
      hasReadingSection,
      listeningLocked: Boolean(resumeDraft?.listeningLocked || false),
      listeningElapsedSec: resumeDraft?.listeningElapsedSec || 0,
      readingElapsedSec: resumeDraft?.readingElapsedSec || 0,
      parts: activeParts,
      filterQNums: normalizedFilter,
      groups,
      groupIdx: clampedGroupIdx,
      totalQ,
      totalSecLimit,
      elapsedSec: resumeDraft?.elapsedSec || 0,
      examPauseSec,
      answers: resumeDraft?.answers ? { ...resumeDraft.answers } : {},
      eliminations: resumeDraft?.eliminations ? { ...resumeDraft.eliminations } : {},
      flags: resumeDraft?.flags ? { ...resumeDraft.flags } : {},
      highlights: resumeDraft?.highlights ? { ...resumeDraft.highlights } : {},
      revealedGroups: {}, // { [groupIdx]: true } for instant check in Practice
      detailExplGroups: {}, // { [groupIdx]: true } for expanding detailed explanations in Practice
      peekGroups: {}, // { [groupIdx]: true } for Part 1/2 spoken text peek in Practice
      submittedResult: null
    };

    this.view = "runner";
    this.mobilePaletteOpen = false;
    this.listeningReviewTab = "transcript";
    this.dictationState = {};
    this.syncUrlHash(`#/tests/${slug}/run`);
    this.persistCurrentDraft();
    this.startSessionClock();
    this.render();
    this.preloadNextGroupAudio();
    this.autoPlayIfExam();
  }

  /**
   * v21.0: Launch a focused Practice-by-Part session (10 / 20 / 30 questions)
   * pulling real ETS questions for that Part across the 35-test bank.
   */
  async startCustomPartSession({ part = 5, count = 10, mode = "practice", timeLimitMin = 0, sourceSlug = "RANDOM" }) {
    const seq = ++this._navSeq;
    this.stopTimersAndAudio();

    const partNum = Number(part) || 5;
    const targetCount = Math.max(1, Math.min(60, Number(count) || 10));
    const candidates = (this.catalog.tests || []).filter(
      (t) => Number(t.partCounts?.[`PART_${partNum}`] || 0) > 0
    );
    if (!candidates.length) {
      showToast(`Không tìm thấy câu hỏi cho Part ${partNum}.`, "bad");
      return false;
    }

    const shuffleInPlace = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const isRandomSource = !sourceSlug || sourceSlug === "RANDOM";
    let orderedSlugs = [];
    if (!isRandomSource && candidates.some((t) => t.slug === sourceSlug)) {
      orderedSlugs.push(sourceSlug);
      candidates.forEach((t) => {
        if (t.slug !== sourceSlug) orderedSlugs.push(t.slug);
      });
    } else {
      orderedSlugs = shuffleInPlace(candidates.map((t) => t.slug));
    }

    // If explicitly offline, prioritize/restrict to slugs already in memory or CacheStorage to avoid failed fetches
    const filterToCachedSlugs = async (slugs) => {
      const kept = [];
      for (const sl of slugs) {
        if (this.testCache.has(sl)) {
          kept.push(sl);
          continue;
        }
        const meta = candidates.find((t) => t.slug === sl);
        const absUrl = new URL(meta?.dataFile || `data/cham_tests/${sl}.json`, window.location.href).href;
        const hit = await this.matchCachedTestJson(absUrl);
        if (hit) kept.push(sl);
      }
      return kept;
    };

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      orderedSlugs = await filterToCachedSlugs(orderedSlugs);
    }

    const collectedGroups = [];
    let collectedCount = 0;
    let displayNum = 1;
    let hitOfflineError = false;

    for (let sIdx = 0; sIdx < orderedSlugs.length; sIdx++) {
      const slug = orderedSlugs[sIdx];
      if (collectedCount >= targetCount) break;
      let testData;
      try {
        testData = await this.loadTestJson(slug);
      } catch (err) {
        if (err?.isOffline && !hitOfflineError) {
          hitOfflineError = true;
          const remainingCached = await filterToCachedSlugs(orderedSlugs.slice(sIdx + 1));
          orderedSlugs = orderedSlugs.slice(0, sIdx + 1).concat(remainingCached);
        }
        continue;
      }
      if (seq !== this._navSeq) return false;
      const partGroups = (testData.groups || []).filter((g) => Number(g.part) === partNum);
      const iterGroups = isRandomSource ? shuffleInPlace(partGroups.slice()) : partGroups;
      for (const rawGroup of iterGroups) {
        if (collectedCount >= targetCount) break;
        const rawQs = rawGroup.questions || [];
        if (!rawQs.length) continue;
        // Keep multi-question groups (Part 3, 4, 6, 7) intact unless single-question part (Part 1, 2, 5)
        const need = targetCount - collectedCount;
        const sliceQs = rawQs.length === 1 || rawQs.length <= need ? rawQs : (collectedGroups.length === 0 ? rawQs : null);
        if (!sliceQs) break;
        const clonedQs = sliceQs.map((q) => {
          const n = displayNum++;
          return { ...q, origSlug: slug, origNum: q.num, num: n };
        });
        const rng = clonedQs.length === 1
          ? String(clonedQs[0].num)
          : `${clonedQs[0].num}-${clonedQs[clonedQs.length - 1].num}`;
        collectedGroups.push({
          ...rawGroup,
          sourceTitle: testData.title,
          range: rng,
          questions: clonedQs
        });
        collectedCount += clonedQs.length;
      }
    }

    if (!collectedGroups.length) {
      showToast(
        hitOfflineError || (typeof navigator !== "undefined" && navigator.onLine === false)
          ? `Không thể tải câu hỏi Part ${partNum} khi ngoại tuyến (chưa có dữ liệu trong bộ nhớ đệm).`
          : `Không thể tải câu hỏi cho Part ${partNum}.`,
        "bad"
      );
      return false;
    }

    clearToasts();
    const isTimed = mode === "timed" || mode === "exam";
    const totalSecLimit = isTimed && timeLimitMin > 0 ? timeLimitMin * 60 : 0;
    const customSlug = `practice-part-${partNum}`;

    this.showHelpModal = false;
    this.showReviewModal = false;
    this.showSectionGate = false;
    this.volumeMenuOpen = false;
    this.vocabSaveDraft = null;
    this.focusedQNum = null;
    this.paletteFilter = "ALL";
    this.listeningReviewTab = "transcript";
    this.dictationState = {};

    this.session = {
      slug: customSlug,
      isCustomPartPractice: true,
      practicePartNum: partNum,
      title: `Luyện tập Part ${partNum} · ${PART_META[partNum]?.desc || ""} (${collectedCount} câu)`,
      collection: "Luyện theo Part",
      mode: isTimed ? "exam" : "practice",
      strictIigMode: false,
      strictLcSec: 0,
      strictRcSec: 0,
      hasListeningSection: partNum <= 4,
      hasReadingSection: partNum >= 5,
      listeningLocked: false,
      listeningElapsedSec: 0,
      readingElapsedSec: 0,
      parts: [partNum],
      filterQNums: null,
      groups: collectedGroups,
      groupIdx: 0,
      totalQ: collectedCount,
      totalSecLimit,
      elapsedSec: 0,
      examPauseSec: isTimed ? 5 : 0,
      answers: {},
      eliminations: {},
      flags: {},
      highlights: {},
      revealedGroups: {},
      detailExplGroups: {},
      peekGroups: {},
      submittedResult: null
    };

    this.view = "runner";
    this.mobilePaletteOpen = false;

    // Activate ChamCenter AFTER session & view are set so main.js highlights "Luyện tập" instead of "Thi thử"
    this.onOpen();
    if (!this.isActive) {
      this.isActive = true;
      document.body.classList.add("is-cham-hub-active");
      const root = this.rootEl;
      if (root) root.removeAttribute("hidden");
      window.removeEventListener("keydown", this._boundKeyDown);
      window.addEventListener("keydown", this._boundKeyDown);
      window.removeEventListener("mousedown", this._boundRightMouseDown, true);
      window.addEventListener("mousedown", this._boundRightMouseDown, true);
      window.removeEventListener("contextmenu", this._boundContextMenu, true);
      window.addEventListener("contextmenu", this._boundContextMenu, true);
      window.removeEventListener("mouseup", this._boundRightMouseUp, true);
      window.addEventListener("mouseup", this._boundRightMouseUp, true);
    }

    this.syncUrlHash(`#/practice/part/${partNum}/run`);
    this.startSessionClock();
    this.render();
    this.preloadNextGroupAudio();
    if (isTimed) this.autoPlayIfExam();
    return true;
  }

  startRetakeCustomMistakes(mistakeNums = []) {
    const prev = this.session;
    if (!prev || !Array.isArray(prev.groups) || !mistakeNums.length) return;
    this.stopTimersAndAudio();
    const qSet = new Set(mistakeNums.map(Number).filter(Boolean));
    const filteredGroups = [];
    for (const g of prev.groups) {
      const qs = (g.questions || []).filter((q) => qSet.has(q.num));
      if (!qs.length) continue;
      const rng = qs.length === 1 ? String(qs[0].num) : `${qs[0].num}-${qs[qs.length - 1].num}`;
      filteredGroups.push({ ...g, range: rng, questions: qs });
    }
    if (!filteredGroups.length) return;

    const totalQ = filteredGroups.reduce((acc, g) => acc + (g.questions?.length || 0), 0);
    const pNum = prev.practicePartNum || prev.parts?.[0] || 5;
    this.showHelpModal = false;
    this.showReviewModal = false;
    this.showSectionGate = false;
    this.volumeMenuOpen = false;
    this.vocabSaveDraft = null;
    this.focusedQNum = null;
    this.paletteFilter = "ALL";
    this.listeningReviewTab = "transcript";
    this.dictationState = {};

    this.session = {
      ...prev,
      title: `Ôn lại ${totalQ} câu sai · Part ${pNum}`,
      mode: "practice",
      strictIigMode: false,
      strictListeningOnly: false,
      filterQNums: Array.from(qSet),
      groups: filteredGroups,
      groupIdx: 0,
      totalQ,
      totalSecLimit: 0,
      elapsedSec: 0,
      examPauseSec: 0,
      answers: {},
      eliminations: {},
      flags: {},
      highlights: {},
      revealedGroups: {},
      detailExplGroups: {},
      peekGroups: {},
      submittedResult: null
    };
    this.view = "runner";
    this.mobilePaletteOpen = false;
    this.syncUrlHash(`#/practice/part/${pNum}/run`);
    this.startSessionClock();
    this.render();
    this.preloadNextGroupAudio();
    showToast(`Bắt đầu làm lại ${totalQ} câu sai / bỏ qua!`, "info");
  }

  getActiveClockDisplay() {
    const s = this.session;
    if (!s) return { text: "00:00", urgent: false, label: "" };
    if (s.strictIigMode) {
      if (!s.listeningLocked) {
        const lcLimit = s.strictLcSec || 45 * 60;
        const rem = Math.max(0, lcLimit - (s.listeningElapsedSec || 0));
        return { text: fmtHMS(rem), urgent: rem <= 180, label: "Section I · Listening" };
      }
      const rcLimit = s.strictRcSec || 75 * 60;
      const rem = Math.max(0, rcLimit - (s.readingElapsedSec || 0));
      return { text: fmtHMS(rem), urgent: rem <= 300, label: "Section II · Reading" };
    }
    if (s.totalSecLimit > 0) {
      const rem = Math.max(0, s.totalSecLimit - s.elapsedSec);
      const examLabel = s.mode === "exam"
        ? (s.hasListeningSection && !s.hasReadingSection ? "IIG Listening" : (!s.hasListeningSection && s.hasReadingSection ? "IIG Reading" : "IIG Exam"))
        : "Hẹn giờ";
      return { text: fmtHMS(rem), urgent: rem <= 300, label: examLabel };
    }
    return { text: fmtHMS(s.elapsedSec), urgent: false, label: "Luyện tập" };
  }

  persistCurrentDraft() {
    if (!this.session || this.session.submittedResult || this.session.isCustomPartPractice) return;
    saveDraftStore({
      slug: this.session.slug,
      title: this.session.title,
      mode: this.session.mode,
      strictIigMode: Boolean(this.session.strictIigMode || this.session.strictListeningOnly),
      listeningLocked: Boolean(this.session.listeningLocked),
      listeningElapsedSec: this.session.listeningElapsedSec || 0,
      readingElapsedSec: this.session.readingElapsedSec || 0,
      parts: this.session.parts,
      filterQNums: this.session.filterQNums || null,
      timeLimitMin: Math.round((this.session.totalSecLimit || 0) / 60),
      examPauseSec: this.session.examPauseSec,
      groupIdx: this.session.groupIdx,
      totalQ: this.session.totalQ,
      elapsedSec: this.session.elapsedSec,
      answers: this.session.answers,
      eliminations: this.session.eliminations,
      flags: this.session.flags,
      highlights: this.session.highlights || {}
    });
  }

  startSessionClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      if (!this.session || this.view !== "runner") return;
      this.session.elapsedSec++;
      if (this.session.strictIigMode) {
        const lcLimit = this.session.strictLcSec || 45 * 60;
        const rcLimit = this.session.strictRcSec || 75 * 60;
        if (!this.session.listeningLocked) {
          this.session.listeningElapsedSec = (this.session.listeningElapsedSec || 0) + 1;
          if (this.session.listeningElapsedSec >= lcLimit) {
            this.enterReadingSection(true);
            return;
          }
        } else {
          this.session.readingElapsedSec = (this.session.readingElapsedSec || 0) + 1;
          if (this.session.readingElapsedSec >= rcLimit) {
            showToast(`Đã hết ${Math.round(rcLimit / 60)} phút Phần II (Reading)! Hệ thống tự động nộp bài.`, "info");
            this.submitCurrentSession();
            return;
          }
        }
      }
      if (this.session.elapsedSec % 5 === 0) this.persistCurrentDraft();

      const timerEl = document.getElementById("cham-runner-clock");
      const clk = this.getActiveClockDisplay();
      if (timerEl && !this.hideTimer) {
        timerEl.textContent = clk.text;
        timerEl.classList.toggle("is-urgent", clk.urgent);
      }
      if (!this.session.strictIigMode && this.session.totalSecLimit > 0 && this.session.totalSecLimit - this.session.elapsedSec <= 0) {
        showToast("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.", "info");
        this.submitCurrentSession();
      }
    }, 1000);
  }

  enterReadingSection(autoTimeout = false) {
    if (!this.session) return;
    this.clearAutoAdvance();
    if (this.activeAudioEl) {
      try { this.activeAudioEl.pause(); } catch {}
      this.activeAudioEl = null;
    }
    this.session.listeningLocked = true;
    this.showSectionGate = false;
    const firstReadingIdx = this.session.groups.findIndex((g) => g.part >= 5);
    if (firstReadingIdx >= 0) {
      this.session.groupIdx = firstReadingIdx;
    }
    this.persistCurrentDraft();
    const lcM = Math.round((this.session.strictLcSec || 2700) / 60);
    const rcM = Math.round((this.session.strictRcSec || 4500) / 60);
    showToast(
      autoTimeout
        ? `Hết ${lcM} phút Listening! Đã chuyển sang Phần II: Reading (${rcM} phút).`
        : `Đã khóa Phần I (Listening). Chào mừng bạn đến Phần II: Reading (${rcM} phút tự do).`,
      "info"
    );
    this.render();
  }

  clearAutoAdvance() {
    if (this.autoAdvanceInterval) {
      clearInterval(this.autoAdvanceInterval);
      this.autoAdvanceInterval = null;
    }
    this.autoAdvanceRemaining = 0;
    const badge = document.getElementById("cham-pause-countdown-pill");
    if (badge) badge.style.display = "none";
  }

  triggerExamAudioPauseCountdown() {
    this.clearAutoAdvance();
    if (!this.session || this.view !== "runner" || this.session.mode !== "exam") return;
    const pauseSec = Number(this.session.examPauseSec || 0);
    if (pauseSec <= 0) return;
    if (this.session.groupIdx >= this.session.groups.length - 1) return;

    this.autoAdvanceRemaining = pauseSec;
    const badge = document.getElementById("cham-pause-countdown-pill");
    const numSpan = document.getElementById("cham-pause-sec-val");
    if (badge && numSpan) {
      badge.style.display = "inline-flex";
      numSpan.textContent = String(this.autoAdvanceRemaining);
    }

    this.autoAdvanceInterval = setInterval(() => {
      this.autoAdvanceRemaining--;
      const curSpan = document.getElementById("cham-pause-sec-val");
      if (curSpan) curSpan.textContent = String(Math.max(0, this.autoAdvanceRemaining));
      if (this.autoAdvanceRemaining <= 0) {
        this.clearAutoAdvance();
        this.goToGroup(this.session.groupIdx + 1);
      }
    }, 1000);
  }

  autoPlayIfExam() {
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (!this.session || this.view !== "runner" || this.session.mode !== "exam") return;
    const expectedGroupIdx = this.session.groupIdx;
    const curGroup = this.session.groups[expectedGroupIdx];
    if (curGroup && curGroup.audio && this.activeAudioEl) {
      const targetAudio = this.activeAudioEl;
      this.autoPlayTimer = setTimeout(() => {
        this.autoPlayTimer = null;
        if (
          this.isActive &&
          this.view === "runner" &&
          this.session?.groupIdx === expectedGroupIdx &&
          this.activeAudioEl === targetAudio
        ) {
          targetAudio.play().catch(() => {});
        }
      }, 300);
    }
  }

  doesQuestionMatchReviewFilter(q, filter = this.reviewFilter) {
    if (!this.session || filter === "ALL") return true;
    const uAns = this.session.answers[q.num];
    if (filter === "WRONG") return Boolean(uAns && uAns !== q.answer);
    if (filter === "SKIPPED") return !uAns;
    if (filter === "CORRECT") return uAns === q.answer;
    if (filter === "FLAGGED") return Boolean(this.session.flags[q.num]);
    return true;
  }

  getFilteredReviewGroupIndices(filter = this.reviewFilter) {
    if (!this.session) return [];
    const indices = [];
    this.session.groups.forEach((g, idx) => {
      if ((g.questions || []).some((q) => this.doesQuestionMatchReviewFilter(q, filter))) {
        indices.push(idx);
      }
    });
    return indices;
  }

  stepGroup(delta) {
    if (!this.session) return;
    if (this.view === "review" && this.reviewFilter !== "ALL") {
      const valid = this.getFilteredReviewGroupIndices();
      if (!valid.length) return;
      if (delta > 0) {
        const nextIdx = valid.find((i) => i > this.session.groupIdx);
        if (nextIdx !== undefined) this.goToGroup(nextIdx);
      } else {
        const prevList = valid.filter((i) => i < this.session.groupIdx);
        if (prevList.length) this.goToGroup(prevList[prevList.length - 1]);
      }
      return;
    }
    this.goToGroup(this.session.groupIdx + delta);
  }

  goToGroup(newIdx, scrollQNum = null) {
    if (!this.session) return;
    const clamped = Math.max(0, Math.min(this.session.groups.length - 1, newIdx));
    const targetGroup = this.session.groups[clamped];

    if (this.view === "runner" && this.session.strictIigMode && targetGroup) {
      if (!this.session.listeningLocked && targetGroup.part >= 5) {
        this.clearAutoAdvance();
        if (this.activeAudioEl) {
          try { this.activeAudioEl.pause(); } catch {}
        }
        this.showSectionGate = true;
        this.render();
        return;
      }
      if (this.session.listeningLocked && targetGroup.part <= 4) {
        showToast("Phần I (Listening) đã kết thúc và khóa lại theo chuẩn thi IIG.", "info");
        return;
      }
    }

    this.clearAutoAdvance();
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (this.activeAudioEl) {
      try { this.activeAudioEl.pause(); } catch (_) {}
      this.activeAudioEl = null;
    }
    try {
      if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    this.session.groupIdx = clamped;
    this.focusedQNum = scrollQNum || targetGroup?.questions?.[0]?.num || null;
    this.mobilePaletteOpen = false;
    this.volumeMenuOpen = false;
    this.vocabSaveDraft = null;
    this.persistCurrentDraft();
    this.render();
    this.preloadNextGroupAudio();

    if (this.view === "runner") {
      this.autoPlayIfExam();
    }

    if (scrollQNum) {
      requestAnimationFrame(() => {
        const card = document.querySelector(`.cham-q-card[data-qnum="${scrollQNum}"]`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("is-jump-highlight");
          setTimeout(() => card.classList.remove("is-jump-highlight"), 1400);
        }
      });
    }
  }

  preloadNextGroupAudio() {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      if (!this.session || !Array.isArray(this.session.groups)) return;
      const nextGrp = this.session.groups[this.session.groupIdx + 1];
      const nextAudioUrl = nextGrp?.audio;
      if (!nextAudioUrl) return;
      if (!this._preloadAudioEl) {
        this._preloadAudioEl = new Audio();
        this._preloadAudioEl.preload = "metadata";
      }
      if (this._preloadAudioEl.src !== new URL(nextAudioUrl, window.location.href).href) {
        this._preloadAudioEl.src = nextAudioUrl;
      }
    } catch (_) {}
  }

  lookupVocabBankEntry(word) {
    const clean = String(word || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!clean) return null;
    const bank = (typeof window !== "undefined" && Array.isArray(window.TOEIC_VOCAB_BANK)) ? window.TOEIC_VOCAB_BANK : [];
    if (!bank.length) return null;
    return bank.find((e) => e?.word?.trim().toLowerCase() === clean)
      || (clean.length >= 4 ? bank.find((e) => e?.word?.trim().toLowerCase().startsWith(clean)) : null)
      || null;
  }

  getActiveQuestionInGroup() {
    const curGroup = this.session?.groups?.[this.session.groupIdx];
    const qs = curGroup?.questions || [];
    if (!qs.length) return null;
    if (this.focusedQNum && qs.some((q) => q.num === this.focusedQNum)) {
      return qs.find((q) => q.num === this.focusedQNum);
    }
    const firstUnanswered = qs.find((q) => !this.session.answers[q.num]);
    const picked = firstUnanswered || qs[0];
    this.focusedQNum = picked.num;
    return picked;
  }

  setFocusedQuestionInPlace(qNum, root = this.rootEl) {
    if (!qNum) return;
    this.focusedQNum = Number(qNum);
    if (!root) return;
    root.querySelectorAll(".cham-q-card").forEach((card) => {
      card.classList.toggle("is-kb-focused", Number(card.dataset.qnum) === this.focusedQNum);
    });
  }

  openQuickVocabModal(prefillWord = "", prefillContext = "") {
    let word = String(prefillWord || "").replace(/\s+/g, " ").trim();
    let context = String(prefillContext || "").replace(/\s+/g, " ").trim();

    if (!word) {
      const sel = window.getSelection?.();
      const rawSel = String(sel?.toString() || "").replace(/\s+/g, " ").trim();
      if (rawSel && rawSel.length <= 80) {
        word = rawSel.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9']+$/g, "").trim();
        const anchor = sel?.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
        const parentEl = anchor?.nodeType === 3 ? anchor.parentElement : anchor;
        const block = parentEl?.closest?.("p, li, .v21-karaoke-line, .cham-q-stem, .cham-opt-text, .cham-transcript-box, .v21-expl-body");
        if (block && !context) {
          context = String(block.textContent || "").replace(/\s+/g, " ").trim().slice(0, 220);
        }
      }
    }

    let ipa = "";
    let type = "";
    let translation = "";
    const hit = this.lookupVocabBankEntry(word);
    if (hit) {
      ipa = hit.ipa || "";
      type = hit.type || "";
      translation = hit.translation || "";
      if (!context && hit.example) context = hit.example;
    }

    const curGroup = this.session?.groups?.[this.session.groupIdx];
    this.vocabSaveDraft = {
      word,
      ipa,
      type,
      translation,
      context: context || (curGroup ? `${this.session?.title || "TOEIC"} · Câu ${curGroup.range}` : "")
    };
    this.volumeMenuOpen = false;
    this.rerenderPreservingAudio();
    requestAnimationFrame(() => {
      const targetInp = document.getElementById(word ? "cham-vocab-trans-inp" : "cham-vocab-word-inp");
      targetInp?.focus();
    });
  }

  classifyChamSkillType(partNum, q = {}) {
    const p = Number(partNum) || 0;
    const tagStr = (q.tags || []).join(" ").toLowerCase();
    const stemStr = String(q.stem || "").toLowerCase();
    if (p === 5) return "Grammar & Vocabulary";
    if (p === 6) {
      if (tagStr.includes("điền câu") || tagStr.includes("chèn câu") || tagStr.includes("sentence")) {
        return "Cross-Doc / Chèn câu";
      }
      return "Grammar & Vocabulary";
    }
    if (tagStr.includes("biểu đồ") || tagStr.includes("bảng biểu") || tagStr.includes("graphic") || stemStr.includes("look at the graphic")) {
      return "Graphic Integration";
    }
    if (tagStr.includes("điền câu") || tagStr.includes("chèn câu") || tagStr.includes("liên kết") || stemStr.includes("in which of the positions")) {
      return "Cross-Doc / Chèn câu";
    }
    if (
      tagStr.includes("ý chính") ||
      tagStr.includes("mục đích") ||
      tagStr.includes("chủ đề") ||
      stemStr.includes("mainly") ||
      stemStr.includes("purpose") ||
      stemStr.includes("who most likely") ||
      stemStr.includes("where most likely")
    ) {
      return "Main Topic";
    }
    if (
      tagStr.includes("suy luận") ||
      tagStr.includes("ngụ ý") ||
      tagStr.includes("từ đồng nghĩa") ||
      stemStr.includes("implied") ||
      stemStr.includes("suggested") ||
      stemStr.includes("closest in meaning") ||
      stemStr.includes("why does the")
    ) {
      return "Inference / Meaning";
    }
    return "Specific Detail";
  }

  extractPlainTranscriptLines(html = "") {
    const withNewlines = String(html || "")
      .replace(/<(?:br\s*\/?|\/p|\/div|\/li|\/tr)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "");
    const text = decodeHtmlEntities(withNewlines).replace(/\ufeff/g, "");
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .map((l) => l.replace(/^(?:Transcript|Tapescript)\s*[:.-]?\s*$/i, "").replace(/^Question\s*:\s*/i, "").trim())
      .filter(Boolean);
    if (rawLines.length >= 2) return rawLines;
    // Fallback: split single paragraph into sentences
    const single = rawLines[0] || "";
    const sents = single.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    return sents.map((s) => s.trim()).filter(Boolean);
  }

  renderListeningStudioTabsHTML(curGroup, groupIdx) {
    const tab = this.listeningReviewTab || "transcript";
    const lines = this.extractPlainTranscriptLines(curGroup.transcriptHtml);

    let panelHTML = "";
    if (tab === "transcript") {
      panelHTML = `<div class="v21-listen-tab-body">${sanitizeChamRichHtml(curGroup.transcriptHtml)}</div>`;
    } else if (tab === "karaoke") {
      panelHTML = `
        <div class="v21-listen-tab-body">
          <div class="v21-studio-hint">Bấm vào từng câu để tua audio tới đoạn tương ứng hoặc nghe đọc lại.</div>
          <div class="v21-karaoke-list" id="v21-karaoke-list">
            ${lines.map((ln, idx) => `
              <button type="button" class="v21-karaoke-line" data-karaoke-idx="${idx}" data-karaoke-total="${lines.length}" data-karaoke-text="${escHtml(ln)}">
                <span class="v21-karaoke-idx tabular-nums">${idx + 1}</span>
                <span class="v21-karaoke-text">${escHtml(ln)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;
    } else if (tab === "dictation") {
      const fullPlain = lines.join(" ");
      const words = fullPlain.split(/\s+/).filter(Boolean);
      const stopWords = new Set(["about", "above", "after", "again", "could", "every", "first", "found", "great", "house", "large", "might", "never", "other", "place", "point", "right", "small", "sound", "still", "their", "there", "these", "thing", "think", "three", "under", "water", "where", "which", "while", "world", "would", "write", "woman", "people", "please", "thank", "thanks", "hello", "questions", "refer", "following"]);
      const dState = this.dictationState[groupIdx] || { checked: false, inputs: {}, revealed: false };
      const maxBlanks = Math.min(8, Math.max(3, Math.floor(words.length / 8)));
      const primaryRegex = /^([^A-Za-z]*)([A-Za-z]{5,})([^A-Za-z]*)$/;
      const fallbackRegex = /^([^\p{L}]*)([\p{L}]{4,})([^\p{L}]*)$/u;

      const primaryCandidates = [];
      words.forEach((tok, wi) => {
        const m = tok.match(primaryRegex);
        if (m && !stopWords.has(m[2].toLowerCase())) {
          primaryCandidates.push({ wi, m });
        }
      });
      let candidates = primaryCandidates;
      if (candidates.length < 2) {
        const seenWi = new Set(candidates.map((c) => c.wi));
        words.forEach((tok, wi) => {
          if (seenWi.has(wi)) return;
          const m = tok.match(fallbackRegex);
          if (m && !stopWords.has(m[2].toLowerCase())) {
            candidates.push({ wi, m });
            seenWi.add(wi);
          }
        });
        candidates.sort((a, b) => a.wi - b.wi);
      }

      const targetCount = Math.min(maxBlanks, candidates.length);
      const chosenMap = new Map();
      if (targetCount > 0) {
        if (candidates.length <= targetCount) {
          candidates.forEach((c) => chosenMap.set(c.wi, c.m));
        } else {
          const step = candidates.length / targetCount;
          for (let k = 0; k < targetCount; k++) {
            const pick = candidates[Math.min(candidates.length - 1, Math.floor(k * step + step * 0.4))];
            if (pick) chosenMap.set(pick.wi, pick.m);
          }
        }
      }

      let blankIdx = 0;
      let dictCorrectCnt = 0;
      const renderedTokens = words.map((tok, wi) => {
        const m = chosenMap.get(wi);
        if (m) {
          const id = blankIdx++;
          const ans = m[2];
          const val = dState.revealed ? ans : (dState.inputs[id] || "");
          const isOk = dState.checked && val.trim().toLowerCase() === ans.toLowerCase();
          const isBad = dState.checked && !isOk;
          if (isOk) dictCorrectCnt++;
          const ansHint = isBad ? `<span class="v21-dict-ans-hint">→ ${escHtml(ans)}</span>` : "";
          return `${escHtml(m[1])}<input type="text" class="v21-dict-inp ${isOk ? "is-ok" : ""} ${isBad ? "is-bad" : ""}" data-dict-id="${id}" data-dict-ans="${escHtml(ans)}" value="${escHtml(val)}" placeholder="${ans.length} chữ" style="width: ${Math.max(72, ans.length * 9 + 18)}px;" autocomplete="off" spellcheck="false" />${ansHint}${escHtml(m[3])}`;
        }
        return escHtml(tok);
      });
      const dictScoreBadge = dState.checked && blankIdx > 0
        ? `<span class="v21-dict-score-pill ${dictCorrectCnt === blankIdx ? "is-ok" : ""}">Đúng ${dictCorrectCnt}/${blankIdx} từ khóa</span>`
        : "";
      panelHTML = `
        <div class="v21-listen-tab-body">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
            <div class="v21-studio-hint" style="margin-bottom: 0;">Nghe băng và điền các từ khóa bị ẩn (bấm Enter hoặc Kiểm tra để chấm).</div>
            ${dictScoreBadge}
          </div>
          <p class="v21-dict-passage" style="margin-top: 10px;">${renderedTokens.join(" ")}</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            <button type="button" class="cham-btn cham-btn-primary" id="v21-dict-check-btn">Kiểm tra</button>
            <button type="button" class="cham-btn" id="v21-dict-reveal-btn">${dState.revealed ? "Làm lại" : "Hiện đáp án"}</button>
          </div>
        </div>
      `;
    } else if (tab === "shadowing") {
      const curSp = Number(this.audioSpeed || 1.0);
      panelHTML = `
        <div class="v21-listen-tab-body">
          <div class="v21-studio-hint">Kỹ thuật Shadowing: nghe từng câu tốc độ chậm (0.75×–0.9×), nhại theo sau loa 0.5 giây rồi ghi âm so sánh.</div>
          <div class="v21-shadow-controls">
            <div class="v21-shadow-row">
              <span>Tốc độ nghe:</span>
              <div style="display: flex; gap: 6px;">
                ${[0.75, 0.9, 1.0].map((sp) => `
                  <button type="button" class="cham-btn v21-shadow-speed-btn ${Math.abs(curSp - sp) < 0.02 ? "cham-btn-primary" : ""}" data-shadow-speed="${sp}" style="padding: 4px 10px; font-size: 13px;">${sp}×</button>
                `).join("")}
              </div>
            </div>
            <label class="v21-shadow-loop">
              <input type="checkbox" id="v21-shadow-loop-toggle" ${this.shadowingLoop ? "checked" : ""} />
              <span>Tự động lặp lại đoạn audio</span>
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
              <button type="button" class="cham-btn ${this._shadowRecording ? "cham-btn-warm" : "cham-btn-primary"}" id="v21-shadow-rec-btn">
                ${this._shadowRecording ? "Dừng ghi âm" : "Ghi âm giọng nhại"}
              </button>
              ${this._shadowAudioUrl ? `<audio controls src="${escHtml(this._shadowAudioUrl)}" style="height: 34px; max-width: 100%;"></audio>` : ""}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="cham-transcript-box v21-listen-studio-box">
        <div class="v21-listen-tabs" role="tablist" aria-label="Công cụ chữa bài nghe">
          ${[
            ["transcript", "Transcript"],
            ["karaoke", "Karaoke Script"],
            ["dictation", "Chép chính tả"],
            ["shadowing", "Shadowing"]
          ].map(([id, label]) => `
            <button type="button" role="tab" aria-selected="${tab === id ? "true" : "false"}" class="v21-listen-tab ${tab === id ? "is-active" : ""}" data-listen-tab="${id}">${label}</button>
          `).join("")}
        </div>
        ${panelHTML}
      </div>
    `;
  }

  /* ============================================================
     VIEW 3 & 5: SPLIT-SCREEN RUNNER & SPLIT-SCREEN REVIEW
     ============================================================ */
  renderRunnerOrReviewHTML(isReview = false) {
    const s = this.session;
    if (!s) return this.renderLibraryHTML();

    const curGroup = s.groups[s.groupIdx] || s.groups[0];
    const curPart = curGroup.part;
    const isGroupRevealed = isReview || Boolean(s.revealedGroups[s.groupIdx]);
    const isDetailExplOpen = isReview || Boolean(s.detailExplGroups?.[s.groupIdx]);
    const hasAnyGroupExpl = Boolean(curGroup.explanationHtml || (curGroup.questions || []).some((x) => Boolean(x.explanation)));
    const isGroupPeeked = !isReview && s.mode === "practice" && Boolean(s.peekGroups?.[s.groupIdx]);
    const isBlindListening = (curPart === 1 || curPart === 2) && !isGroupRevealed && !isGroupPeeked;

    const hasImages = Array.isArray(curGroup.images) && curGroup.images.length > 0;
    const hasPassageHtml = Boolean(curGroup.passageHtml);
    const hasReviewTranscript = isGroupRevealed && Boolean(curGroup.transcriptHtml);
    const useSplitStage = hasImages || hasPassageHtml || hasReviewTranscript || curPart === 3 || curPart === 4;

    const answeredCount = Object.keys(s.answers).length;
    const clockMeta = this.getActiveClockDisplay();
    const clockDisplay = clockMeta.text;
    const isStrictLockedScrub = Boolean(!isReview && (s.strictIigMode || s.strictListeningOnly) && !s.listeningLocked && curPart <= 4);

    // Group questions by Part for right palette
    const byPart = new Map();
    let reviewMatchedQuestionsCount = 0;
    s.groups.forEach((g, gIdx) => {
      if (!byPart.has(g.part)) byPart.set(g.part, []);
      (g.questions || []).forEach((q) => {
        if (isReview && !this.doesQuestionMatchReviewFilter(q)) return;
        if (!isReview) {
          const uAns = s.answers[q.num];
          const isFl = Boolean(s.flags[q.num]);
          if (this.paletteFilter === "TODO" && uAns) return;
          if (this.paletteFilter === "FLAGGED" && !isFl) return;
        }
        reviewMatchedQuestionsCount++;
        byPart.get(g.part).push({ q, gIdx });
      });
    });

    const filteredGroupIndices = isReview && this.reviewFilter !== "ALL"
      ? this.getFilteredReviewGroupIndices()
      : null;
    const prevGroupPart = s.groupIdx > 0 ? s.groups[s.groupIdx - 1]?.part : null;
    const prevLockedInStrict = Boolean(!isReview && s.strictIigMode && s.listeningLocked && prevGroupPart && prevGroupPart <= 4);
    const canGoPrev = filteredGroupIndices
      ? filteredGroupIndices.some((i) => i < s.groupIdx)
      : (s.groupIdx > 0 && !prevLockedInStrict);
    const canGoNext = filteredGroupIndices
      ? filteredGroupIndices.some((i) => i > s.groupIdx)
      : s.groupIdx < s.groups.length - 1;

    const parsedP12 = (curPart === 1 || curPart === 2) && curGroup.transcriptHtml
      ? parsePart12Transcript(curGroup.transcriptHtml)
      : { stem: "", options: {} };

    const curSpeed = Number(this.audioSpeed || 1.0);
    const isLoopOn = Boolean(!isStrictLockedScrub && (this.audioLoop || (this.shadowingLoop && this.listeningReviewTab === "shadowing")));
    const audioBarHTML = curGroup.audio ? `
      <div class="cham-audio-bar-wrap">
        <div class="cham-audio-bar">
          <button type="button" class="cham-audio-play-btn" id="cham-audio-play-btn" aria-label="Phát hoặc Tạm dừng" title="Phát / Tạm dừng (Phím Space)">
            ${getIcon("play", 16)}
          </button>
          ${!isStrictLockedScrub ? `
            <button type="button" class="cham-btn cham-audio-seek-btn" id="cham-audio-back5-btn" title="Tua lùi 5 giây (Phím J hoặc ←)" aria-label="Tua lùi 5 giây">-5s</button>
            <button type="button" class="cham-btn cham-audio-seek-btn" id="cham-audio-fwd5-btn" title="Tua tới 5 giây (Phím L hoặc →)" aria-label="Tua tới 5 giây">+5s</button>
          ` : ""}
          <input type="range" class="cham-audio-scrubber" id="cham-audio-scrubber" min="0" max="100" step="0.1" value="0" ${isStrictLockedScrub ? "disabled" : ""} aria-label="Thanh tua âm thanh" title="${isStrictLockedScrub ? "Chuẩn thi IIG: không tua lại băng Listening" : "Kéo để tua băng nghe"}" />
          <span id="cham-audio-time" style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); min-width: 88px; text-align: center;">00:00 / 00:00</span>
          ${!isStrictLockedScrub ? `
            <button type="button" class="cham-btn cham-audio-loop-btn ${isLoopOn ? "is-active" : ""}" id="cham-audio-loop-btn" aria-pressed="${isLoopOn ? "true" : "false"}" title="Lặp lại đoạn băng nghe này">
              ${CHAM_SVG.repeat}
            </button>
            <select id="cham-audio-speed" class="cham-btn" style="padding: 5px 9px; font-size: 0.78rem;" aria-label="Tốc độ phát">
              ${[0.75, 0.9, 1, 1.1, 1.25, 1.5].map((sp) => `<option value="${sp}" ${Math.abs(curSpeed - sp) < 0.02 ? "selected" : ""}>${sp === 1 ? "1.0" : sp}×</option>`).join("")}
            </select>
          ` : `<span class="cham-tag" title="Chuẩn phòng thi IIG">1.0× Chuẩn IIG</span>`}
          <audio id="cham-active-audio" src="${escHtml(curGroup.audio)}" preload="metadata"></audio>
        </div>
        <div id="cham-audio-fallback-bar" class="v21-audio-fallback" hidden>
          <span>Không tải được tệp âm thanh gốc (ngoại tuyến hoặc lỗi mạng).</span>
          <div style="display: inline-flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="cham-btn" id="cham-audio-retry-btn" style="padding: 3px 9px; font-size: 12px;">Thử tải lại</button>
            ${curGroup.transcriptHtml ? `<button type="button" class="cham-btn cham-btn-primary" id="cham-audio-tts-btn" style="padding: 3px 9px; font-size: 12px;">Nghe đọc AI (Offline)</button>` : ""}
          </div>
        </div>
      </div>
    ` : "";

    const activeHlList = Array.isArray(s.highlights?.[s.groupIdx]) ? s.highlights[s.groupIdx] : [];
    const leftPaneHeaderHTML = `
      <div class="cham-pane-header">
        <span class="cham-pane-header-title">
          ${curPart <= 4 ? getIcon("headphones", 14) : getIcon("fileText", 14)}
          <span>${curPart <= 4 ? "Băng nghe &amp; Tư liệu" : "Bài đọc &amp; Tài liệu"} · Câu ${escHtml(curGroup.range)}</span>
        </span>
        <div style="display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          ${hasImages && curPart >= 3 ? `
            <div style="display: inline-flex; align-items: center; gap: 4px;">
              ${[100, 120, 140].map((z) => `
                <button type="button" class="cham-btn cham-zoom-btn" data-zoom="${z}" style="padding: 3px 8px; font-size: 0.76rem; ${this.passageZoom === z ? "border-color: var(--accent); color: var(--accent); background: var(--accent-soft);" : ""}">${z}%</button>
              `).join("")}
            </div>
          ` : (hasImages ? `<span class="cham-pane-header-sub">Bấm vào ảnh để phóng to</span>` : `<span class="cham-pane-header-sub">${PART_META[curPart]?.desc || ""}</span>`)}
        </div>
      </div>
    `;

    const stimulusContentHTML = `
      ${leftPaneHeaderHTML}
      ${audioBarHTML}
      ${hasImages ? `
        <div class="cham-stimulus-images ${curPart === 1 ? "is-part1-photo" : ""}">
          ${curGroup.images.map((imgUrl, idx) => `
            <div class="cham-stimulus-img-card">
              <img src="${escHtml(imgUrl)}" alt="Hình minh họa câu ${escHtml(curGroup.range)} (${idx + 1})" class="cham-zoomable-img" style="${this.passageZoom !== 100 && curPart >= 3 ? `width: ${this.passageZoom}%; max-width: none;` : ""}" />
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${hasPassageHtml ? `
        <div class="cham-transcript-box cham-reading-passage-box" id="cham-reading-passage-box">${sanitizeChamRichHtml(curGroup.passageHtml)}</div>
      ` : ""}
      ${hasReviewTranscript ? (
        curPart <= 4
          ? this.renderListeningStudioTabsHTML(curGroup, s.groupIdx)
          : `
            <div class="cham-transcript-box">
              <div style="font-weight: 500; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                ${getIcon("headphones", 15)}
                <span>Transcript (Lời thoại băng nghe)</span>
              </div>
              ${sanitizeChamRichHtml(curGroup.transcriptHtml)}
            </div>
          `
      ) : ((curPart === 3 || curPart === 4) && !isGroupRevealed ? `
        <div class="cham-transcript-box" style="text-align: center; padding: 24px 20px;">
          <div style="width: 40px; height: 40px; margin: 0 auto 10px; border-radius: var(--radius-full); background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); display: inline-flex; align-items: center; justify-content: center;">
            ${getIcon("headphones", 18)}
          </div>
          <div style="font-weight: 600; font-size: 0.98rem; color: var(--text); margin-bottom: 6px;">
            Chế độ Nghe Thực Chiến Chuẩn Thi Thật (Part ${curPart})
          </div>
          <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-muted); max-width: 460px; margin: 0 auto ${s.mode === "practice" ? "14px" : "0"};">
            Hãy đọc đón đầu từ khóa trong 3 câu hỏi ở cột bên phải trước và trong khi nghe băng. Lời thoại chi tiết sẽ mở khóa ngay khi kiểm tra hoặc nộp bài.
          </p>
          ${s.mode === "practice" ? `
            <button type="button" class="cham-btn cham-btn-soft-primary cham-reveal-left-btn" style="font-size: 0.82rem;">
              ✓ Kiểm tra &amp; Mở Transcript câu này
            </button>
          ` : ""}
        </div>
      ` : "")}
    `;

    const directionsBannerHTML = this.showDirectionsBanner ? `
      <div class="cham-directions-banner" id="cham-directions-banner">
        <div>
          <strong>${PART_META[curPart]?.label || `PART ${curPart}`} DIRECTIONS (ETS OFFICIAL):</strong>
          <span>${escHtml(PART_META[curPart]?.directions || "")}</span>
        </div>
        <button type="button" class="cham-btn" id="cham-close-directions-btn" style="padding: 3px 9px; font-size: 0.74rem;">Thu gọn</button>
      </div>
    ` : "";

    let foldedGroupExplIntoCard = false;
    let extractedPerQCount = 0;
    const isSinglePart5Group = curPart === 5 && (curGroup.questions || []).length === 1;

    const questionsListHTML = `
      ${directionsBannerHTML}
      ${(curGroup.questions || []).map((q) => {
        const uAns = s.answers[q.num] || null;
        const elims = s.eliminations[q.num] || [];
        const isFlagged = Boolean(s.flags[q.num]);
        const rawStemDecoded = decodeHtmlEntities(q.stem || "").replace(/\ufeff/g, "").trim();
        const usableStem = rawStemDecoded && !/\{\{blank\}\}/i.test(rawStemDecoded) ? rawStemDecoded : "";
        const resolvedStem = usableStem || (curPart === 2 ? parsedP12.stem : "");
        const stemText = isBlindListening ? "" : resolvedStem;

        let statusBadge = "";
        if (isGroupRevealed) {
          if (!uAns) statusBadge = `<span class="cham-tag" style="color: var(--text-muted);">○ Bỏ qua · Đáp án: ${q.answer}</span>`;
          else if (uAns === q.answer) statusBadge = `<span class="cham-best-badge">✓ Chính xác (${q.answer})</span>`;
          else statusBadge = `<span class="cham-tag" style="background: var(--bad-soft); color: var(--bad); border-color: var(--bad-border);">✕ Sai (Chọn ${uAns} → Đúng: ${q.answer})</span>`;
        }

        const isKbFocused = !isReview && (curGroup.questions || []).length > 1 && this.focusedQNum === q.num;
        return `
          <div class="cham-q-card ${isKbFocused ? "is-kb-focused" : ""}" data-qnum="${q.num}">
            <div class="cham-q-head">
              <div style="display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0;">
                <span class="cham-q-num-badge">${q.num}</span>
                ${stemText
                  ? `<h3 class="cham-q-stem">${escHtml(stemText)}</h3>`
                  : `<span style="font-size: 0.94rem; color: var(--text-muted); font-weight: 500;">${curPart === 1 ? "Nghe 4 câu mô tả và chọn đáp án đúng với bức tranh" : (curPart === 2 ? "Nghe câu hỏi/câu nói và chọn lời hồi đáp đúng nhất" : `Câu hỏi ${q.num}`)}</span>`}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                ${!isReview && s.mode === "practice" && (curPart === 1 || curPart === 2) && !isGroupRevealed ? `
                  <button type="button" class="p12-peek-btn cham-p12-peek-btn ${isGroupPeeked ? "is-active" : ""}" title="Bật/Ẩn lời thoại tiếng Anh trên câu hỏi &amp; đáp án">
                    ${isGroupPeeked ? getIcon("eyeOff", 13) : getIcon("eye", 13)}
                    <span>${isGroupPeeked ? "Ẩn lời thoại" : "Hiện lời thoại"}</span>
                  </button>
                ` : ""}
                ${statusBadge}
                ${!isReview ? `
                  <button type="button" class="cham-flag-btn ${isFlagged ? "is-flagged" : ""}" data-flag-q="${q.num}" title="Đánh dấu xem lại câu ${q.num}">
                    ${isFlagged ? CHAM_SVG.flagFill : CHAM_SVG.flag}
                    <span>${isFlagged ? "Đã gắn cờ" : "Gắn cờ"}</span>
                  </button>
                ` : ""}
              </div>
            </div>

            ${isGroupRevealed && q.tags && q.tags.length ? `
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
                ${q.tags.map((tg) => `<span class="cham-tag">${escHtml(tg)}</span>`).join("")}
              </div>
            ` : ""}

            <div class="cham-opt-list">
              ${(q.options || []).map((opt) => {
                const selected = uAns === opt.choice;
                const isRight = isGroupRevealed && opt.choice === q.answer;
                const isWrong = isGroupRevealed && selected && opt.choice !== q.answer;
                const isElim = elims.includes(opt.choice);
                const rawOptText = cleanChamOptionText(opt.text || "", opt.choice) || parsedP12.options[opt.choice] || "";
                const dispText = isBlindListening
                  ? `Chọn phương án (${opt.choice})`
                  : rawOptText;

                return `
                  <div class="cham-opt-row ${selected && !isGroupRevealed ? "is-selected" : ""} ${isRight ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""} ${isElim ? "is-eliminated" : ""}"
                       data-cham-q="${q.num}" data-cham-choice="${opt.choice}" title="Chuột trái để chọn · Chuột phải hoặc bấm ⊘ để gạch loại trừ">
                    <input type="radio" name="cham_q_${q.num}" value="${opt.choice}" ${selected ? "checked" : ""} ${isReview ? "disabled" : ""} tabindex="-1" />
                    <span class="cham-opt-letter">${opt.choice}</span>
                    ${isBlindListening
                      ? `<span class="opt-blind-placeholder" style="flex: 1;">Chọn phương án (${opt.choice})</span><span class="cham-opt-text" style="display: none;"></span>`
                      : `<span class="cham-opt-text">${escHtml(dispText)}</span>`}
                    ${!isReview ? `
                      <button type="button" class="cham-elim-btn" data-elim-q="${q.num}" data-elim-choice="${opt.choice}" title="Gạch loại trừ đáp án ${opt.choice}" aria-label="Loại trừ đáp án ${opt.choice}">${CHAM_SVG.ban}</button>
                    ` : ""}
                  </div>
                `;
              }).join("")}
            </div>

            ${isGroupRevealed && isDetailExplOpen ? (() => {
              const isSingleFoldableGroup = (curPart === 1 || curPart === 2 || curPart === 5)
                && (curGroup.questions || []).length === 1;
              const trapInfo = (!q.explanation && !isSingleFoldableGroup)
                ? analyzeQuestionTrapsAndTips({
                    part: curPart,
                    q,
                    group: curGroup,
                    parsedP12,
                    userChoice: uAns
                  })
                : { perQuestionHtml: "", evidenceQuote: "", evidenceVi: "" };

              const shouldFoldGroupExpl = isSingleFoldableGroup && !q.explanation && Boolean(curGroup.explanationHtml);
              if (shouldFoldGroupExpl) foldedGroupExplIntoCard = true;
              if (trapInfo.perQuestionHtml) extractedPerQCount++;

              const bodyRichHtml = q.explanation
                ? sanitizeChamRichHtml(q.explanation)
                : (shouldFoldGroupExpl
                  ? sanitizeChamRichHtml(curGroup.explanationHtml)
                  : (trapInfo.perQuestionHtml ? sanitizeChamRichHtml(trapInfo.perQuestionHtml) : ""));

              const hasEvidence = !q.explanation && !shouldFoldGroupExpl && Boolean(trapInfo.evidenceQuote || trapInfo.evidenceVi);
              const evidenceBlock = hasEvidence ? `
                <div class="v21-expl-evidence">
                  ${trapInfo.evidenceQuote ? `<div><strong>Dẫn chứng gốc:</strong> “${escHtml(trapInfo.evidenceQuote)}”</div>` : ""}
                  ${trapInfo.evidenceVi ? `<div class="v21-expl-evidence-vi"><strong>Dịch dẫn chứng:</strong> “${escHtml(trapInfo.evidenceVi)}”</div>` : ""}
                </div>
              ` : "";

              if (!bodyRichHtml && !evidenceBlock) return "";

              return `
              <div class="cham-explanation-box v21-expl-card">
                <div class="v21-expl-head">
                  <span class="v21-expl-title">
                    ${getIcon("sparkles", 14)}
                    <span>Giải thích câu ${q.num}</span>
                  </span>
                </div>
                <div class="v21-expl-body">
                  ${evidenceBlock}
                  ${bodyRichHtml}
                </div>
              </div>
              `;
            })() : ""}
          </div>
        `;
      }).join("")}

      ${!isReview && s.mode === "practice" ? `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 13px 16px; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-xs);">
          <span style="font-size: 0.88rem; color: var(--text-muted); font-weight: 500;">
            ${!isGroupRevealed
              ? "Đang ở chế độ Luyện tập: bấm kiểm tra để xem Đúng / Sai ngay."
              : (isDetailExplOpen
                ? "Đang hiển thị bản dịch và giải thích chi tiết."
                : "Đã kiểm tra Đúng / Sai. Bấm Giải chi tiết nếu muốn xem bản dịch &amp; lời giải.")}
          </span>
          <div style="display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${isGroupRevealed && hasAnyGroupExpl ? `
              <button type="button" class="cham-btn ${isDetailExplOpen ? "" : "cham-btn-primary"}" id="cham-toggle-detail-expl-btn">
                ${getIcon("bookOpen", 14)}
                <span>${isDetailExplOpen ? "Ẩn giải chi tiết" : "Giải chi tiết"}</span>
              </button>
            ` : ""}
            <button type="button" class="cham-btn ${isGroupRevealed ? "" : "cham-btn-primary"}" id="cham-instant-check-btn">
              ${isGroupRevealed ? "Ẩn đáp án" : "✓ Kiểm tra đáp án"}
            </button>
          </div>
        </div>
      ` : ""}

      ${isGroupRevealed && isDetailExplOpen && curGroup.explanationHtml && !foldedGroupExplIntoCard ? (() => {
        const allUnpackedP6 = curPart === 6 && extractedPerQCount >= (curGroup.questions || []).length && extractedPerQCount > 0;
        const unpackedSome = extractedPerQCount > 0;
        if (allUnpackedP6) {
          return `
            <details class="cham-explanation-box v21-group-trans-details">
              <summary class="v21-group-trans-summary">
                ${getIcon("bookOpen", 14)}
                <span>Xem toàn bộ giải thích gộp (Câu ${escHtml(curGroup.range)})</span>
              </summary>
              <div style="margin-top: 10px;">${sanitizeChamRichHtml(curGroup.explanationHtml)}</div>
            </details>
          `;
        }
        return `
          <div class="cham-explanation-box">
            <div style="font-weight: 500; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              ${getIcon("bookOpen", 14)}
              <span>${unpackedSome ? `Bản dịch toàn bài &amp; Đối chiếu cụm (Câu ${escHtml(curGroup.range)})` : `Giải thích &amp; Bản dịch chi tiết (Câu ${escHtml(curGroup.range)})`}</span>
            </div>
            ${sanitizeChamRichHtml(curGroup.explanationHtml)}
          </div>
        `;
      })() : ""}
    `;

    const progressPct = s.totalQ > 0 ? Math.min(100, Math.round((answeredCount / s.totalQ) * 100)) : 0;
    const sectionTagText = isReview
      ? `XEM GIẢI · ${escHtml(s.title)}`
      : (s.strictIigMode
        ? (s.listeningLocked ? "II · READING" : "I · LISTENING")
        : (s.mode === "exam" ? "IIG CBT" : "LUYỆN TẬP"));
    const curGroupFlagged = (curGroup.questions || []).some((q) => Boolean(s.flags[q.num]));
    const firstQInGroup = curGroup.questions?.[0]?.num;
    const lastQInGroup = curGroup.questions?.[curGroup.questions.length - 1]?.num;
    let ordinalBefore = 0;
    for (let gi = 0; gi < s.groupIdx; gi++) {
      ordinalBefore += (s.groups[gi]?.questions?.length || 0);
    }
    const posStart = ordinalBefore + 1;
    const posEnd = ordinalBefore + (curGroup.questions?.length || 0);
    const posRangeLabel = posStart === posEnd ? String(posStart) : `${posStart}-${posEnd}`;
    const runnerQCounterText = (firstQInGroup === posStart && lastQInGroup === posEnd)
      ? `Câu ${curGroup.range}/${s.totalQ}`
      : `Câu ${curGroup.range} (${posRangeLabel}/${s.totalQ})`;
    const isLastListeningGroup = Boolean(
      !isReview &&
      s.strictIigMode &&
      !s.listeningLocked &&
      s.hasReadingSection &&
      curPart <= 4 &&
      s.groups[s.groupIdx + 1]?.part >= 5
    );

    const unansweredCount = s.totalQ - answeredCount;
    const flaggedCount = Object.values(s.flags || {}).filter(Boolean).length;

    const reviewModalHTML = (!isReview && this.showReviewModal) ? `
      <div class="cham-modal-backdrop" id="cham-review-screen-modal" role="dialog" aria-modal="true" aria-label="Màn hình Rà soát (Review Screen)">
        <div class="cham-modal-card cham-review-modal-card">
          <div class="cham-modal-head">
            <div>
              <h2 style="margin: 0; font-size: 1.15rem;">Màn hình Rà soát Bài thi (Official IIG Review)</h2>
              <p style="margin: 3px 0 0; font-size: 0.84rem; color: var(--text-muted);">
                Đã chọn <strong>${answeredCount}/${s.totalQ}</strong> · Còn trống <strong>${unansweredCount}</strong> · Đã gắn cờ <strong>${flaggedCount}</strong>
              </p>
            </div>
            <button type="button" class="cham-btn" id="cham-close-review-modal-btn">Đóng ✕</button>
          </div>
          <div class="cham-review-legend">
            <span class="cham-legend-dot is-answered"><i></i> Đã trả lời (${answeredCount})</span>
            <span class="cham-legend-dot is-todo"><i></i> Chưa trả lời (${unansweredCount})</span>
            <span class="cham-legend-dot is-flagged"><i></i> Đã gắn cờ (${flaggedCount})</span>
          </div>
          <div class="cham-review-modal-grid">
            ${s.groups.flatMap((g, gIdx) => (g.questions || []).map((q) => {
              const lockedInStrict = Boolean(s.strictIigMode && s.listeningLocked && g.part <= 4);
              const blockedReading = Boolean(s.strictIigMode && !s.listeningLocked && g.part >= 5);
              const uAns = s.answers[q.num];
              const isFlg = Boolean(s.flags[q.num]);
              const cls = [
                uAns ? "is-answered" : "is-todo",
                isFlg ? "is-flagged" : "",
                gIdx === s.groupIdx ? "is-current" : "",
                (lockedInStrict || blockedReading) ? "is-locked" : ""
              ].join(" ");
              return `
                <button type="button" class="cham-review-cell ${cls}" data-review-jump-gidx="${gIdx}" data-review-jump-qnum="${q.num}" ${(lockedInStrict || blockedReading) ? "disabled" : ""}>
                  <strong>Câu ${q.num}</strong>
                  <span>${uAns ? uAns : "—"}</span>
                  ${isFlg ? `<small>⚑ Cờ</small>` : `<small>Part ${g.part}</small>`}
                </button>
              `;
            })).join("")}
          </div>
          <div class="cham-modal-foot">
            <button type="button" class="cham-btn" id="cham-review-continue-btn">Tiếp tục làm bài</button>
            <button type="button" class="cham-btn cham-btn-primary" id="cham-review-submit-now-btn">NỘP BÀI CHÍNH THỨC (${answeredCount}/${s.totalQ})</button>
          </div>
        </div>
      </div>
    ` : "";

    const helpModalHTML = this.showHelpModal ? `
      <div class="cham-modal-backdrop" id="cham-directions-modal" role="dialog" aria-modal="true" aria-label="Hướng dẫn Phần thi &amp; Phím tắt IIG">
        <div class="cham-modal-card">
          <div class="cham-modal-head">
            <h2 style="margin: 0; font-size: 1.12rem;">Hướng dẫn Phòng thi Chuẩn IIG &amp; Phím tắt</h2>
            <button type="button" class="cham-btn" id="cham-close-help-modal-btn">Đóng ✕</button>
          </div>
          <div class="cham-help-body">
            <div class="cham-help-box">
              <strong>${PART_META[curPart]?.label || `PART ${curPart}`} — ${PART_META[curPart]?.desc || ""}</strong>
              <p>${escHtml(PART_META[curPart]?.directions || "")}</p>
            </div>
            <div class="cham-help-shortcuts">
              <div class="cham-shortcut-row"><kbd>A / B / C / D</kbd><span>Hoặc phím <kbd>1–4</kbd>: Chọn nhanh đáp án mọi Part 1–7 (tự nhảy câu tiếp trong nhóm)</span></div>
              <div class="cham-shortcut-row"><kbd>Chuột phải / ⊘</kbd><span>Gạch loại trừ phương án nhiễu (Strike-through elimination)</span></div>
              <div class="cham-shortcut-row"><kbd>Alt + ← / →</kbd><span>Chuyển sang cụm câu trước / câu tiếp theo</span></div>
              <div class="cham-shortcut-row"><kbd>Space</kbd> / <kbd>J</kbd> <kbd>L</kbd><span>Phát/Tạm dừng &amp; tua lùi/tới 5 giây (Luyện tập &amp; Chữa bài)</span></div>
              <div class="cham-shortcut-row"><kbd>K</kbd> / <kbd>G</kbd> / <kbd>F</kbd><span>Kiểm tra đáp án / Mở Giải chi tiết / Gắn cờ câu hiện tại</span></div>
              <div class="cham-shortcut-row"><kbd>V</kbd> / <kbd>+ Lưu từ</kbd><span>Bôi đen từ vựng bất kỳ để lưu nhanh vào Flashcard SM-2</span></div>
            </div>
          </div>
          <div class="cham-modal-foot">
            <button type="button" class="cham-btn cham-btn-primary" id="cham-help-ok-btn">Đã hiểu</button>
          </div>
        </div>
      </div>
    ` : "";

    const vocabModalHTML = this.vocabSaveDraft ? `
      <div class="cham-modal-backdrop" id="cham-vocab-modal" role="dialog" aria-modal="true" aria-label="Lưu từ vựng vào Flashcard SM-2">
        <div class="cham-modal-card cham-vocab-modal-card">
          <div class="cham-modal-head">
            <h2 style="margin: 0; font-size: 1.08rem;">Lưu từ vựng vào Flashcard SM-2</h2>
            <button type="button" class="cham-btn" id="cham-close-vocab-modal-btn">Đóng ✕</button>
          </div>
          <form id="cham-vocab-save-form" class="cham-vocab-form">
            <div class="cham-vocab-field">
              <label for="cham-vocab-word-inp">Từ / Cụm từ tiếng Anh</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" id="cham-vocab-word-inp" class="v21-input" value="${escHtml(this.vocabSaveDraft.word || "")}" placeholder="Ví dụ: reschedule, itinerary..." required autocomplete="off" />
                <button type="button" class="cham-btn" id="cham-vocab-speak-btn" title="Nghe phát âm chuẩn Mỹ" aria-label="Nghe phát âm">${CHAM_SVG.volume}</button>
              </div>
              ${this.vocabSaveDraft.ipa || this.vocabSaveDraft.type ? `
                <div class="cham-vocab-meta-hint">
                  ${this.vocabSaveDraft.ipa ? `<span style="font-family: var(--font-ipa);">${escHtml(this.vocabSaveDraft.ipa)}</span>` : ""}
                  ${this.vocabSaveDraft.type ? `<span class="cham-tag">${escHtml(this.vocabSaveDraft.type)}</span>` : ""}
                  <span>✓ Tự nhận diện từ kho ETS</span>
                </div>
              ` : ""}
            </div>
            <div class="cham-vocab-field">
              <label for="cham-vocab-trans-inp">Nghĩa tiếng Việt / Ghi chú nhớ nhanh</label>
              <input type="text" id="cham-vocab-trans-inp" class="v21-input" value="${escHtml(this.vocabSaveDraft.translation || "")}" placeholder="Ví dụ: sắp xếp lại lịch, lịch trình..." required autocomplete="off" />
            </div>
            <div class="cham-vocab-field">
              <label for="cham-vocab-ctx-inp">Câu ngữ cảnh (tự trích từ bài)</label>
              <textarea id="cham-vocab-ctx-inp" class="v21-input" rows="2" placeholder="Câu ví dụ trong bài đọc / transcript...">${escHtml(this.vocabSaveDraft.context || "")}</textarea>
            </div>
            <div class="cham-modal-foot" style="padding: 10px 0 0; border-top: 1px solid var(--border);">
              <button type="button" class="cham-btn" id="cham-vocab-cancel-btn">Hủy</button>
              <button type="submit" class="cham-btn cham-btn-primary" id="cham-vocab-submit-btn">Lưu vào Flashcard SM-2</button>
            </div>
          </form>
        </div>
      </div>
    ` : "";

    const gateRcMin = Math.round((s.strictRcSec || 4500) / 60);
    const gateRcMm = String(gateRcMin).padStart(2, "0");
    const sectionGateHTML = (!isReview && this.showSectionGate) ? `
      <div class="cham-modal-backdrop" id="cham-section-gate-overlay" role="dialog" aria-modal="true" aria-label="Chuyển sang Phần II: Reading">
        <div class="cham-modal-card">
          <div class="cham-modal-head">
            <h2 style="margin: 0; font-size: 1.15rem;">Hoàn tất Phần I (Listening) → Bắt đầu Phần II (Reading)</h2>
          </div>
          <div class="cham-help-body">
            <p style="margin: 0 0 10px; line-height: 1.6;">Theo quy chuẩn phòng thi <strong>TOEIC CBT IIG</strong>:</p>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.65; color: var(--text-muted);">
              <li>Sau khi xác nhận chuyển phần, <strong>Phần I: Listening (Part 1–4)</strong> sẽ được khóa lại và không thể quay lại sửa hoặc nghe lại.</li>
              <li><strong>Phần II: Reading (Part 5–7)</strong> có thời lượng <strong>${gateRcMin} phút đếm ngược độc lập</strong>, tự do di chuyển, tô vàng từ khóa và rà soát qua Review Screen.</li>
            </ul>
          </div>
          <div class="cham-modal-foot">
            <button type="button" class="cham-btn" id="cham-gate-stay-listening-btn">Ở lại kiểm tra Listening</button>
            <button type="button" class="cham-btn cham-btn-primary" id="cham-gate-enter-reading-btn">Bắt đầu Phần II: Reading (${gateRcMm}:00) →</button>
          </div>
        </div>
      </div>
    ` : "";

    return `
      <div class="cham-runner-shell">
        <div class="cham-runner-topbar">
          <div class="cham-runner-top-left">
            <button type="button" class="cham-btn cham-runner-exit-btn" id="cham-runner-exit-btn" aria-label="${isReview ? "Quay lại bảng điểm" : "Thoát phòng làm bài"}" title="${isReview ? "Quay lại trang tổng kết điểm" : "Tạm thoát khỏi phòng làm bài"}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
              <span>${isReview ? "Kết quả" : "Thoát"}</span>
            </button>
            <span class="cham-tag cham-tag-toeic cham-runner-section-tag">${sectionTagText}</span>
            ${!isReview ? `
              <div class="cham-timer-capsule">
                <span class="cham-runner-timer ${clockMeta.urgent ? "is-urgent" : ""}" id="cham-runner-clock" style="${this.hideTimer ? "display: none;" : ""}">${clockDisplay}</span>
                <button type="button" class="cham-btn cham-timer-eye-btn" id="cham-toggle-timer-btn" title="${this.hideTimer ? "Hiện đồng hồ đếm giờ" : "Ẩn đồng hồ"}" aria-label="Ẩn/Hiện đồng hồ">
                  ${this.hideTimer ? getIcon("eye", 13) : getIcon("eyeOff", 13)}
                </button>
              </div>
            ` : `
              <span class="cham-tag cham-tag-toeic cham-review-tag-title" style="font-size: 13px;">${getIcon("search", 13)} Chữa bài · ${escHtml(s.title)}</span>
            `}

            <span id="cham-pause-countdown-pill" style="display: none; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--radius-full); background: var(--ok-soft); color: var(--ok); border: 1px solid var(--ok-border); font-size: 13px; font-weight: 500;">
              Chọn đáp án: <span id="cham-pause-sec-val">5</span>s
              <button type="button" id="cham-skip-pause-btn" style="border: none; background: transparent; color: inherit; font-weight: 500; cursor: pointer; text-decoration: underline;">Qua ngay →</button>
            </span>
          </div>

          <div class="cham-runner-part-pills">
            <span class="v21-runner-q-counter tabular-nums" id="v21-runner-q-counter">${escHtml(runnerQCounterText)}</span>
            <button type="button" class="cham-btn" id="cham-prev-group-top" ${!canGoPrev ? "disabled" : ""} style="padding: 5px 10px;" title="Câu trước (Alt + ←)">‹</button>
            <button type="button" class="cham-btn" id="cham-next-group-top" ${!canGoNext ? "disabled" : ""} style="padding: 5px 10px;" title="Câu tiếp (Alt + →)">›</button>
            ${s.parts.length > 1 ? s.parts.map((p) => {
              const partDisabledInStrict = Boolean(
                !isReview &&
                s.strictIigMode &&
                ((s.listeningLocked && p <= 4) || (!s.listeningLocked && p >= 5))
              );
              return `
                <button type="button" class="cham-part-pill ${curPart === p ? "is-active" : ""} ${partDisabledInStrict ? "is-locked-part" : ""}" data-jump-part="${p}" title="${partDisabledInStrict ? "Bị khóa theo quy chế Listening/Reading tách phần IIG" : `Chuyển tới Part ${p}`}">
                  P${p}
                </button>
              `;
            }).join("") : ""}
          </div>

          <div class="cham-runner-top-right">
            <div class="cham-volume-wrap">
              <button type="button" class="cham-btn" id="cham-volume-btn" style="padding: 6px 9px;" title="Âm lượng (${Math.round((this.audioVolume ?? 1) * 100)}%)" aria-label="Âm lượng">
                ${CHAM_SVG.volume}
              </button>
              ${this.volumeMenuOpen ? `
                <div class="cham-volume-popover" id="cham-volume-popover">
                  <label for="cham-volume-slider">Âm lượng: <strong id="cham-volume-pct">${Math.round((this.audioVolume ?? 1) * 100)}%</strong></label>
                  <input type="range" id="cham-volume-slider" min="0" max="100" step="5" value="${Math.round((this.audioVolume ?? 1) * 100)}" />
                </div>
              ` : ""}
            </div>
            <button type="button" class="cham-btn" id="cham-help-btn" style="padding: 6px 9px;" title="Hướng dẫn &amp; Phím tắt" aria-label="Hướng dẫn">
              ${CHAM_SVG.help}
            </button>
            <button type="button" class="cham-btn v21-drawer-toggle-btn" id="cham-mobile-palette-toggle" title="Mở ngăn kéo danh sách câu hỏi (200 ô)" aria-expanded="${this.mobilePaletteOpen ? "true" : "false"}">
              ${getIcon("clipboardList", 14)}
              <span id="cham-mobile-palette-label" class="tabular-nums">${answeredCount}/${s.totalQ}</span>
            </button>
            ${!isReview ? `
              <button type="button" class="cham-btn" id="cham-open-review-screen-btn" title="Màn hình Rà soát bài làm (Review)">
                <span>Review</span>
              </button>
              <button type="button" class="cham-btn cham-btn-warm" id="cham-submit-btn">
                Nộp bài (${answeredCount}/${s.totalQ})
              </button>
            ` : `
              <button type="button" class="cham-btn cham-btn-primary" id="cham-back-result-btn">
                <span>Về kết quả</span>
              </button>
            `}
          </div>
        </div>

        <div class="cham-runner-body">
          ${useSplitStage ? `
            <div class="cham-runner-stage" id="cham-split-stage">
              <div class="cham-stimulus-pane" id="cham-left-pane" style="flex: 0 0 ${this.splitLeftPct}%;">
                ${stimulusContentHTML}
              </div>
              <div class="cham-stage-resizer" id="cham-stage-resizer" title="Kéo để chỉnh độ rộng 2 cột (Nhấp đúp để đặt lại)"></div>
              <div class="cham-questions-pane" id="cham-right-q-pane" style="flex: 1 1 ${100 - this.splitLeftPct}%;">
                <div class="cham-pane-header">
                  <span class="cham-pane-header-title">
                    ${getIcon("checkCircle", 14)}
                    <span>Phiếu Câu Hỏi · Part ${curPart} (Nhóm ${s.groupIdx + 1}/${s.groups.length})</span>
                  </span>
                  <div style="display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${!isReview && (hasPassageHtml || curPart >= 5) ? `
                      <button type="button" class="cham-btn" id="cham-highlight-selection-btn" style="padding: 4px 10px; font-size: 12px;" title="Bôi đen từ khóa trong bài đọc hoặc câu hỏi rồi bấm để tô vàng (Nhấp để xóa)">
                        ${CHAM_SVG.highlighter} <span>Tô vàng${activeHlList.length ? ` (${activeHlList.length})` : ""}</span>
                      </button>
                      <button type="button" class="cham-btn" id="cham-hl-clear-btn" style="padding: 4px 9px; font-size: 12px; ${activeHlList.length ? "" : "display: none;"}">Xóa tô</button>
                    ` : ""}
                    ${(isReview || s.mode === "practice") ? `
                      <button type="button" class="cham-btn" id="cham-save-vocab-btn" style="padding: 4px 10px; font-size: 12px;" title="Bôi đen từ vựng bất kỳ rồi bấm (hoặc nhấn phím V) để lưu vào Flashcard SM-2">
                        ${CHAM_SVG.vocabAdd} <span>Lưu từ</span>
                      </button>
                    ` : ""}
                    <button type="button" class="cham-btn" id="cham-toggle-directions-btn" style="padding: 4px 10px; font-size: 12px;">
                      ${this.showDirectionsBanner ? "Ẩn Directions" : "Xem Directions"}
                    </button>
                  </div>
                </div>
                ${questionsListHTML}
              </div>
            </div>
          ` : `
            <div class="cham-runner-stage is-single-col">
              <div class="cham-single-col-inner">
                ${audioBarHTML}
                <div style="display: flex; justify-content: flex-end; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
                  ${!isReview && curPart >= 5 ? `
                    <button type="button" class="cham-btn" id="cham-highlight-selection-btn" style="padding: 4px 10px; font-size: 12px;" title="Bôi đen từ khóa trong câu hỏi rồi bấm để tô vàng">
                      ${CHAM_SVG.highlighter} <span>Tô vàng${activeHlList.length ? ` (${activeHlList.length})` : ""}</span>
                    </button>
                    <button type="button" class="cham-btn" id="cham-hl-clear-btn" style="padding: 4px 9px; font-size: 12px; ${activeHlList.length ? "" : "display: none;"}">Xóa tô</button>
                  ` : ""}
                  ${(isReview || s.mode === "practice") ? `
                    <button type="button" class="cham-btn" id="cham-save-vocab-btn" style="padding: 4px 10px; font-size: 12px;" title="Bôi đen từ vựng bất kỳ rồi bấm (hoặc nhấn phím V) để lưu vào Flashcard SM-2">
                      ${CHAM_SVG.vocabAdd} <span>Lưu từ</span>
                    </button>
                  ` : ""}
                  <button type="button" class="cham-btn" id="cham-toggle-directions-btn" style="padding: 4px 10px; font-size: 12px;">
                    ${this.showDirectionsBanner ? "Ẩn Directions" : "Xem Directions Part " + curPart}
                  </button>
                </div>
                ${questionsListHTML}
              </div>
            </div>
          `}

          <div class="cham-mobile-palette-backdrop ${this.mobilePaletteOpen ? "is-mobile-open" : ""}" id="cham-mobile-palette-backdrop"></div>
          <aside class="cham-palette-aside v21-palette-drawer ${this.mobilePaletteOpen ? "is-mobile-open" : ""}" id="cham-palette-aside" aria-label="Bảng câu hỏi">
            <div style="padding-bottom: 10px; border-bottom: 1px solid var(--border);">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                ${!isReview ? `
                  <strong style="font-size: 14px;" id="cham-palette-answered-label">Đã chọn: ${answeredCount}/${s.totalQ}</strong>
                  <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-size: 13px; color: var(--accent); font-weight: 500;" id="cham-palette-pct-label">${progressPct}%</span>
                    <button type="button" class="cham-btn" id="cham-close-palette-drawer-btn" style="padding: 3px 8px; font-size: 13px;" aria-label="Đóng bảng câu hỏi">✕</button>
                  </div>
                ` : `
                  <strong style="font-size: 13px;">Đúng: ${s.submittedResult?.correct || 0} · Sai: ${s.submittedResult?.wrong || 0}</strong>
                  <button type="button" class="cham-btn" id="cham-close-palette-drawer-btn" style="padding: 3px 8px; font-size: 13px;" aria-label="Đóng bảng câu hỏi">✕</button>
                `}
              </div>
              ${!isReview ? `
                <div class="cham-palette-progress-track">
                  <div class="cham-palette-progress-fill" id="cham-palette-progress-fill" style="width: ${progressPct}%;"></div>
                </div>
                <div class="cham-palette-status-tabs">
                  <button type="button" class="cham-pal-tab ${this.paletteFilter === "ALL" ? "is-active" : ""}" data-pal-filter="ALL">Tất cả</button>
                  <button type="button" class="cham-pal-tab ${this.paletteFilter === "TODO" ? "is-active" : ""}" data-pal-filter="TODO">Chưa làm (${unansweredCount})</button>
                  <button type="button" class="cham-pal-tab ${this.paletteFilter === "FLAGGED" ? "is-active" : ""}" data-pal-filter="FLAGGED">Cờ (${flaggedCount})</button>
                </div>
              ` : ""}
            </div>

            ${isReview ? `
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                <button type="button" class="cham-btn" data-rev-filter="ALL" style="padding: 4px; font-size: 0.75rem; ${this.reviewFilter === "ALL" ? "border-color: var(--accent); color: var(--accent); background: var(--accent-soft);" : ""}">Tất cả</button>
                <button type="button" class="cham-btn" data-rev-filter="WRONG" style="padding: 4px; font-size: 0.75rem; ${this.reviewFilter === "WRONG" ? "border-color: var(--bad); color: var(--bad); background: var(--bad-soft);" : ""}">Sai</button>
                <button type="button" class="cham-btn" data-rev-filter="SKIPPED" style="padding: 4px; font-size: 0.75rem; ${this.reviewFilter === "SKIPPED" ? "border-color: var(--warn); color: var(--warn); background: var(--warn-soft);" : ""}">Bỏ qua</button>
                <button type="button" class="cham-btn" data-rev-filter="CORRECT" style="padding: 4px; font-size: 0.75rem; ${this.reviewFilter === "CORRECT" ? "border-color: var(--ok); color: var(--ok); background: var(--ok-soft);" : ""}">Đúng</button>
                <button type="button" class="cham-btn" data-rev-filter="FLAGGED" style="padding: 4px; font-size: 0.75rem; grid-column: span 2; ${this.reviewFilter === "FLAGGED" ? "border-color: var(--warn); color: var(--warn); background: var(--warn-soft);" : ""}">${CHAM_SVG.flagFill} Đánh dấu</button>
              </div>
              ${reviewMatchedQuestionsCount === 0 ? `
                <div style="padding: 12px 10px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px dashed var(--border); font-size: 0.78rem; color: var(--text-muted); text-align: center;">
                  Không có câu nào thuộc bộ lọc hiện tại.
                </div>
              ` : ""}
            ` : ""}

            ${(() => {
              const partEntries = Array.from(byPart.entries()).filter(([, items]) => items.length > 0);
              if (!isReview && s.strictIigMode && s.listeningLocked) {
                partEntries.sort((a, b) => {
                  const aRc = a[0] >= 5 ? 0 : 1;
                  const bRc = b[0] >= 5 ? 0 : 1;
                  return aRc !== bRc ? aRc - bRc : a[0] - b[0];
                });
              }
              return partEntries.map(([pNum, items]) => {
                const isPartLocked = Boolean(!isReview && s.strictIigMode && ((s.listeningLocked && pNum <= 4) || (!s.listeningLocked && pNum >= 5)));
                return `
                  <div class="${isPartLocked ? "cham-palette-part-locked" : ""}">
                    <div class="cham-palette-part-title">Part ${pNum}${isPartLocked ? ` · <span style="opacity:.75;">Đã khóa</span>` : ""}</div>
                    <div class="cham-palette-grid">
                      ${items.map(({ q, gIdx }) => {
                        const uAns = s.answers[q.num];
                        const isCurrent = gIdx === s.groupIdx;
                        const isFlagged = Boolean(s.flags[q.num]);
                        let pillCls = "";
                        if (isReview) {
                          if (uAns === q.answer) pillCls = "is-correct";
                          else if (uAns) pillCls = "is-wrong";
                        } else if (uAns) {
                          pillCls = "is-answered";
                        }
                        if (isCurrent) pillCls += " is-current";
                        if (isFlagged) pillCls += " is-flagged";
                        return `<button type="button" class="cham-q-pill ${pillCls}" data-jump-gidx="${gIdx}" data-jump-qnum="${q.num}" ${isPartLocked ? "disabled" : ""}>${q.num}</button>`;
                      }).join("")}
                    </div>
                  </div>
                `;
              }).join("");
            })()}
          </aside>
        </div>

        <footer class="cham-runner-footer-bar">
          <div class="cham-footer-left">
            <button type="button" class="cham-btn" id="cham-prev-group-bottom" ${!canGoPrev ? "disabled" : ""}>← Câu trước</button>
            <span class="cham-footer-group-info">Nhóm ${s.groupIdx + 1}/${s.groups.length} · Câu ${escHtml(curGroup.range)}</span>
          </div>
          <div class="cham-footer-right">
            ${!isReview && firstQInGroup ? `
              <button type="button" class="cham-btn ${curGroupFlagged ? "is-flagged-btn" : ""}" id="cham-bottom-flag-btn" data-footer-flag-q="${firstQInGroup}">
                ${curGroupFlagged ? CHAM_SVG.flagFill : CHAM_SVG.flag}
                <span>${curGroupFlagged ? "Bỏ cờ" : "Gắn cờ"}</span>
              </button>
            ` : ""}
            ${!isReview ? `
              <button type="button" class="cham-btn" id="cham-footer-review-btn">Rà soát (${unansweredCount} trống)</button>
            ` : ""}
            ${isLastListeningGroup ? `
              <button type="button" class="cham-btn cham-btn-primary" id="cham-next-group-bottom">Chuyển sang Phần II: Reading →</button>
            ` : `
              <button type="button" class="cham-btn cham-btn-primary" id="cham-next-group-bottom" ${!canGoNext ? "disabled" : ""}>Câu tiếp →</button>
            `}
          </div>
        </footer>

        ${reviewModalHTML}
        ${helpModalHTML}
        ${vocabModalHTML}
        ${sectionGateHTML}
      </div>
    `;
  }

  /* ============================================================
     SUBMIT & SCORE CALCULATION (ETS /990 + SKILL TAGS)
     ============================================================ */
  confirmAndSubmit() {
    if (!this.session) return;
    const answered = Object.keys(this.session.answers).length;
    const skipped = this.session.totalQ - answered;
    const msg = skipped > 0
      ? `Bạn đã chọn ${answered}/${this.session.totalQ} câu (còn ${skipped} câu chưa chọn).\n\nBạn có chắc chắn muốn nộp bài và xem điểm ngay không?`
      : `Bạn đã hoàn thành toàn bộ ${this.session.totalQ}/${this.session.totalQ} câu!\n\nXác nhận nộp bài và xem giải thích chi tiết?`;
    if (confirm(msg)) {
      this.submitCurrentSession();
    }
  }

  computeSessionResult(s, fixedId = null, fixedDateStr = null) {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let lcCorrect = 0;
    let lcTotal = 0;
    let rcCorrect = 0;
    let rcTotal = 0;

    const partStats = {};
    const questionRows = [];

    s.groups.forEach((g, gIdx) => {
      if (!partStats[g.part]) {
        partStats[g.part] = { part: g.part, total: 0, correct: 0, wrong: 0, skipped: 0, tags: {} };
      }
      const ps = partStats[g.part];

      (g.questions || []).forEach((q) => {
        const uAns = s.answers[q.num] || null;
        const isOk = uAns === q.answer;
        const isSkip = !uAns;

        ps.total++;
        if (isSkip) { skipped++; ps.skipped++; }
        else if (isOk) { correct++; ps.correct++; }
        else { wrong++; ps.wrong++; }

        if (g.part <= 4) {
          lcTotal++;
          if (isOk) lcCorrect++;
        } else {
          rcTotal++;
          if (isOk) rcCorrect++;
        }

        const qTags = (q.tags && q.tags.length) ? q.tags : [`[Part ${g.part}] Câu hỏi tổng hợp`];
        qTags.forEach((tg) => {
          if (!ps.tags[tg]) ps.tags[tg] = { name: tg, correct: 0, wrong: 0, skipped: 0, items: [] };
          if (isSkip) ps.tags[tg].skipped++;
          else if (isOk) ps.tags[tg].correct++;
          else ps.tags[tg].wrong++;
          ps.tags[tg].items.push({ num: q.num, gIdx, status: isSkip ? "skip" : (isOk ? "ok" : "bad") });
        });

        questionRows.push({
          num: q.num,
          part: g.part,
          gIdx,
          userAns: uAns,
          correctAns: q.answer,
          status: isSkip ? "skip" : (isOk ? "ok" : "bad"),
          flagged: Boolean(s.flags[q.num]),
          tags: qTags
        });
      });
    });

    const total = correct + wrong + skipped;
    const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
    const scaledLC = lcTotal > 0 ? estimateListeningScaledScore(lcCorrect, lcTotal) : 0;
    const scaledRC = rcTotal > 0 ? estimateReadingScaledScore(rcCorrect, rcTotal) : 0;
    const scaledTotal = lcTotal > 0 && rcTotal > 0 ? (scaledLC + scaledRC) : (lcTotal > 0 ? scaledLC : scaledRC);

    const isFilteredRetake = Boolean(s.filterQNums && s.filterQNums.length);
    const isFull990 = !isFilteredRetake && lcTotal >= 45 && rcTotal >= 45;
    const isFull495 = !isFilteredRetake && !isFull990 && ((lcTotal >= 90 && rcTotal === 0) || (rcTotal >= 90 && lcTotal === 0));
    const isFull200 = total >= 190;

    return {
      id: fixedId || `att_${Date.now()}`,
      dateStr: fixedDateStr || new Date().toLocaleString("vi-VN"),
      mode: s.mode,
      parts: s.parts,
      filterQNums: s.filterQNums || null,
      elapsedSec: s.elapsedSec,
      total,
      correct,
      wrong,
      skipped,
      accuracy,
      lcCorrect,
      lcTotal,
      rcCorrect,
      rcTotal,
      scaledLC,
      scaledRC,
      scaledTotal,
      isFull200,
      isFull990,
      isFull495,
      cefr: isFull990 ? mapTotalScoreToCEFR(scaledTotal) : null,
      partStats,
      questionRows,
      answers: { ...s.answers },
      flags: { ...s.flags }
    };
  }

  submitCurrentSession() {
    if (!this.session) return;
    this.stopTimersAndAudio();

    const s = this.session;
    const resultObj = this.computeSessionResult(s);
    s.submittedResult = resultObj;
    if (!s.isCustomPartPractice) {
      saveDraftStore(null);
    }

    const compactPartStats = {};
    Object.values(resultObj.partStats || {}).forEach((ps) => {
      compactPartStats[ps.part] = {
        part: ps.part,
        total: ps.total,
        correct: ps.correct,
        wrong: ps.wrong,
        skipped: ps.skipped
      };
    });

    if (!this.history.attemptsBySlug[s.slug]) {
      this.history.attemptsBySlug[s.slug] = [];
    }
    let sourceQKeys = null;
    if (s.isCustomPartPractice) {
      const skSet = new Set();
      (s.groups || []).forEach((g) => {
        (g.questions || []).forEach((q) => {
          if (s.answers[q.num] && q.origSlug && q.origNum) {
            skSet.add(`cham:${q.origSlug}:${q.origNum}`);
          }
        });
      });
      if (skSet.size > 0) sourceQKeys = Array.from(skSet);
    }
    const partQNums = {};
    const skillTypeStats = {};
    (s.groups || []).forEach((g) => {
      const pNum = Number(g.part);
      if (!pNum) return;
      (g.questions || []).forEach((q) => {
        const uAns = s.answers[q.num];
        if (uAns) {
          if (!partQNums[pNum]) partQNums[pNum] = [];
          partQNums[pNum].push(q.num);
          const skType = this.classifyChamSkillType(pNum, q);
          if (!skillTypeStats[skType]) skillTypeStats[skType] = { c: 0, a: 0 };
          skillTypeStats[skType].a++;
          if (uAns === q.answer) skillTypeStats[skType].c++;
        }
      });
    });

    recordActiveTime(Math.max(1, Number(resultObj.elapsedSec || 1)));
    this.history.attemptsBySlug[s.slug].push({
      id: resultObj.id,
      title: s.title,
      timestamp: Date.now(),
      dateStr: resultObj.dateStr,
      mode: resultObj.mode,
      parts: resultObj.parts,
      filterQNums: resultObj.filterQNums,
      elapsedSec: resultObj.elapsedSec,
      total: resultObj.total,
      correct: resultObj.correct,
      wrong: resultObj.wrong,
      skipped: resultObj.skipped,
      accuracy: resultObj.accuracy,
      scaledLC: resultObj.scaledLC,
      scaledRC: resultObj.scaledRC,
      scaledTotal: resultObj.scaledTotal,
      isFull200: resultObj.isFull200,
      isFull990: resultObj.isFull990,
      isFull495: resultObj.isFull495,
      partStats: compactPartStats,
      ...(Object.keys(skillTypeStats).length ? { skillTypeStats } : {}),
      ...(Object.keys(partQNums).length ? { partQNums } : {}),
      ...(sourceQKeys ? { sourceQKeys } : {}),
      answers: resultObj.answers,
      flags: resultObj.flags
    });
    if (this.history.attemptsBySlug[s.slug].length > 25) {
      this.history.attemptsBySlug[s.slug] = this.history.attemptsBySlug[s.slug].slice(-25);
    }
    saveHistoryStore(this.history);
    this.onHistoryUpdated();

    this.view = "result";
    this.resultTab = "list";
    this.syncUrlHash(`#/result/${s.slug}`);
    this.render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async openHistoricalAttempt(slug, attemptIdx) {
    if (String(slug || "").startsWith("practice-part-")) {
      const pNum = Number(String(slug).replace("practice-part-", "")) || 5;
      this.close({ keepHash: true, skipExitCallback: true });
      this.onOpenPracticePart(pNum);
      return;
    }
    if (!this.isActive) {
      this.activateShell();
    }
    const list = this.history.attemptsBySlug[slug] || [];
    const att = list[attemptIdx];
    if (!att) return;
    const seq = ++this._navSeq;
    this.stopTimersAndAudio();

    let testData;
    try {
      testData = await this.loadTestJson(slug);
    } catch (err) {
      if (seq !== this._navSeq || !this.isActive) return;
      const rootEmpty = !this.rootEl || !this.rootEl.innerHTML.trim();
      if (rootEmpty || this.view !== "detail" || this.detailState.slug !== slug) {
        const exists = (this.catalog.tests || []).some((t) => t.slug === slug);
        if (exists) this.openDetail(slug, true);
        else this.openLibrary(true);
      }
      showToast(`Không thể tải dữ liệu đề thi: ${err.message}`, "bad");
      return;
    }
    if (seq !== this._navSeq || !this.isActive) return;

    const parts = Array.isArray(att.parts) && att.parts.length ? att.parts : [1, 2, 3, 4, 5, 6, 7];
    const partsSet = new Set(parts);
    const normalizedFilter = Array.isArray(att.filterQNums) && att.filterQNums.length > 0
      ? Array.from(new Set(att.filterQNums.map(Number).filter(Boolean)))
      : null;
    const qSet = normalizedFilter ? new Set(normalizedFilter) : null;

    const groups = [];
    for (const rawGroup of (testData.groups || [])) {
      if (!partsSet.has(rawGroup.part)) continue;
      if (qSet) {
        const matchingQs = (rawGroup.questions || []).filter((q) => qSet.has(q.num));
        if (!matchingQs.length) continue;
        const rng = matchingQs.length === 1
          ? String(matchingQs[0].num)
          : `${matchingQs[0].num}-${matchingQs[matchingQs.length - 1].num}`;
        groups.push({ ...rawGroup, range: rng, questions: matchingQs });
      } else {
        groups.push(rawGroup);
      }
    }
    if (!groups.length) return;

    const activeParts = Array.from(new Set(groups.map((g) => g.part))).sort((a, b) => a - b);
    const totalQ = groups.reduce((acc, g) => acc + (g.questions?.length || 0), 0);

    this.showHelpModal = false;
    this.showReviewModal = false;
    this.showSectionGate = false;
    this.volumeMenuOpen = false;

    const histSession = {
      slug,
      title: testData.title,
      collection: testData.collection,
      mode: att.mode || "practice",
      strictIigMode: false,
      parts: activeParts,
      filterQNums: normalizedFilter,
      groups,
      groupIdx: 0,
      totalQ,
      totalSecLimit: 0,
      elapsedSec: att.elapsedSec || 0,
      examPauseSec: 5,
      answers: { ...(att.answers || {}) },
      eliminations: {},
      flags: { ...(att.flags || {}) },
      highlights: {},
      revealedGroups: {},
      detailExplGroups: {},
      peekGroups: {},
      submittedResult: null
    };
    histSession.submittedResult = this.computeSessionResult(histSession, att.id, att.dateStr);
    this.session = histSession;
    this.view = "result";
    this.resultTab = "list";
    this.syncUrlHash(`#/result/${slug}`);
    this.render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ============================================================
     VIEW 4: RESULT DASHBOARD & TAG ANALYTICS
     ============================================================ */
  renderResultHTML() {
    const s = this.session;
    const r = s?.submittedResult;
    if (!s || !r) return this.renderLibraryHTML();

    const filteredRows = r.questionRows.filter((row) => {
      if (this.resultListFilter === "WRONG") return row.status === "bad";
      if (this.resultListFilter === "SKIPPED") return row.status === "skip";
      if (this.resultListFilter === "CORRECT") return row.status === "ok";
      if (this.resultListFilter === "FLAGGED") return row.flagged;
      return true;
    });

    const mistakeNums = r.questionRows.filter((x) => x.status !== "ok").map((x) => x.num);
    const isPartialEstimate = !r.isFull990 && !r.isFull495;
    const diff = getChamDifficultyMeta(s.slug);
    const maxScale = r.lcTotal > 0 && r.rcTotal > 0 ? 990 : 495;
    const scorePctBar = Math.min(100, Math.max(4, Math.round((r.scaledTotal / maxScale) * 100)));

    // Find weakest Part to recommend exact Hackers TOEIC study material
    const partStatVals = Object.values(r.partStats || {});
    let weakestPart = null;
    let weakestAcc = 101;
    partStatVals.forEach((ps) => {
      if (ps.total > 0) {
        const acc = Math.round((ps.correct / ps.total) * 100);
        if (acc < weakestAcc) {
          weakestAcc = acc;
          weakestPart = ps.part;
        }
      }
    });
    const remediationMap = {
      1: { tab: "paraphrase", text: "Ôn Paraphrase Part 1 & Bẫy tranh (Hackers Start Ch.2)" },
      2: { tab: "paraphrase", text: "Ôn Câu trả lời gián tiếp & Bẫy đồng âm Part 2" },
      3: { tab: "books", text: "Ôn Chiến lược Đón đầu từ khóa Part 3–4 (Hackers Listening)" },
      4: { tab: "books", text: "Ôn Chu kỳ 8 giây & Biểu đồ Part 4 (Hackers Listening)" },
      5: { tab: "grammar", text: "Làm ngay Quiz 8 Chuyên đề Ngữ pháp Part 5–6" },
      6: { tab: "grammar", text: "Luyện Mạch văn & Câu điền ngữ cảnh Part 6" },
      7: { tab: "books", text: "Ôn Chiến lược Săn chứng cứ & Đa đoạn Part 7 (Hackers Reading)" }
    };
    const remedy = weakestPart && weakestAcc < 85 ? remediationMap[weakestPart] : null;

    const cefrText = r.cefr || mapTotalScoreToCEFR(r.lcTotal > 0 && r.rcTotal > 0 ? r.scaledTotal : r.scaledTotal * 2);
    const cefrShort = cefrText.split(" ")[0] || "B1";
    const sortedPartStats = Object.values(r.partStats || {}).sort((a, b) => a.part - b.part);

    return `
      <div class="v21-container">
        <div class="v21-breadcrumb-row">
          <button type="button" class="v21-back-btn" id="cham-res-back-detail">
            ${getIcon("arrowLeft", 15)}
            <span>${s.isCustomPartPractice ? "Quay lại Luyện tập" : "Về trang chi tiết đề"}</span>
          </button>
          <span class="v21-neutral-pill tabular-nums">${fmtHMS(r.elapsedSec)} · ${escHtml(r.dateStr)}</span>
        </div>

        <!-- 1. Clean Scoreboard Hero -->
        <section class="v21-card v21-result-hero">
          <div class="v21-result-hero-head">
            <div>
              <h1 class="v21-page-title" style="margin: 0 0 6px;">Kết quả: ${escHtml(s.title)}</h1>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="cefr-badge ${getCefrBadgeToneClass(cefrShort)}">${escHtml(cefrText)}</span>
                ${isPartialEstimate ? `<span class="v21-neutral-pill">Điểm ước lượng theo tỷ lệ đúng</span>` : ""}
              </div>
            </div>

            <div class="v21-result-actions">
              <button type="button" class="cham-btn cham-btn-warm" id="cham-open-split-review-btn">
                <span>Chữa bài chi tiết</span>
                ${getIcon("arrowRight", 15)}
              </button>
              ${mistakeNums.length > 0 ? `
                <button type="button" class="cham-btn" id="cham-retake-mistakes-btn">
                  ${getIcon("rotateCcw", 14)}
                  <span>${r.wrong > 0 && r.skipped > 0
                    ? `Làm lại ${mistakeNums.length} câu sai &amp; trống`
                    : (r.wrong > 0 ? `Làm lại ${mistakeNums.length} câu sai` : `Làm lại ${mistakeNums.length} câu bỏ qua`)}</span>
                </button>
              ` : ""}
            </div>
          </div>

          <div class="v21-result-scores-row">
            <div class="v21-score-card is-total">
              <span class="v21-score-card-lbl">Tổng điểm ETS</span>
              <div class="v21-score-card-val tabular-nums">
                <strong>${r.scaledTotal}</strong><span>/${maxScale}</span>
              </div>
              <span class="v21-score-card-sub tabular-nums">Đúng ${r.correct}/${r.total} câu (${r.accuracy}%)</span>
            </div>

            <div class="v21-score-card">
              <span class="v21-score-card-lbl">Listening (LC)</span>
              <div class="v21-score-card-val tabular-nums">
                <strong>${r.lcTotal > 0 ? r.scaledLC : "—"}</strong><span>/495</span>
              </div>
              <span class="v21-score-card-sub tabular-nums">${r.lcTotal > 0 ? `Đúng ${r.lcCorrect}/${r.lcTotal}` : "Không có phần Nghe"}</span>
            </div>

            <div class="v21-score-card">
              <span class="v21-score-card-lbl">Reading (RC)</span>
              <div class="v21-score-card-val tabular-nums">
                <strong>${r.rcTotal > 0 ? r.scaledRC : "—"}</strong><span>/495</span>
              </div>
              <span class="v21-score-card-sub tabular-nums">${r.rcTotal > 0 ? `Đúng ${r.rcCorrect}/${r.rcTotal}` : "Không có phần Đọc"}</span>
            </div>

            <div class="v21-score-card">
              <span class="v21-score-card-lbl">Chi tiết câu</span>
              <div class="v21-score-counts tabular-nums">
                <span style="color: var(--ok);"><strong>${r.correct}</strong> đúng</span>
                <span style="color: var(--bad);"><strong>${r.wrong}</strong> sai</span>
                <span style="color: var(--text-muted);"><strong>${r.skipped}</strong> trống</span>
              </div>
              <span class="v21-score-card-sub">Thời gian: ${fmtHMS(r.elapsedSec)}</span>
            </div>
          </div>
        </section>

        <!-- 2. Per-Part Accuracy Breakdown & Weak-Part Recommendation -->
        <section class="v21-card" style="margin-top: 16px;">
          <div class="v21-card-head">
            <div>
              <h2 class="v21-section-title">Độ chính xác theo từng Part</h2>
              <p class="v21-section-sub">Các Part dưới 70% được đánh dấu cam để ưu tiên ôn tập.</p>
            </div>
            ${weakestPart && weakestAcc < 75 ? `
              <button type="button" class="cham-btn" data-res-practice-part="${weakestPart}">
                <span>Nên luyện Part ${weakestPart} (${weakestAcc}%) →</span>
              </button>
            ` : ""}
          </div>

          <div class="v21-part-breakdown-list">
            ${sortedPartStats.map((ps) => {
              const pct = ps.total > 0 ? Math.round((ps.correct / ps.total) * 100) : 0;
              const isWeak = pct < 70;
              return `
                <div class="v21-part-break-row">
                  <div class="v21-part-break-name">
                    <strong>Part ${ps.part}</strong>
                    <span>${PART_META[ps.part]?.desc || ""}</span>
                  </div>
                  <div class="v21-part-break-bar-wrap">
                    <div class="v21-progress-track">
                      <div class="v21-progress-fill ${isWeak ? "is-weak" : ""}" style="width: ${Math.max(4, pct)}%;"></div>
                    </div>
                  </div>
                  <div class="v21-part-break-stat tabular-nums">
                    <strong style="color: ${isWeak ? "var(--warm)" : "var(--ok)"};">${pct}%</strong>
                    <span>(${ps.correct}/${ps.total})</span>
                  </div>
                  <div class="v21-part-break-act">
                    ${isWeak
                      ? `<button type="button" class="v21-text-btn" style="color: var(--warm);" data-res-practice-part="${ps.part}">Nên luyện Part ${ps.part} →</button>`
                      : `<button type="button" class="v21-text-btn" data-res-practice-part="${ps.part}">Luyện thêm</button>`}
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          ${remedy ? `
            <div class="v21-remedy-bar">
              <span><strong>Gợi ý tài liệu cho Part ${weakestPart}:</strong> ${escHtml(remedy.text)}</span>
              <button type="button" class="v21-text-btn" data-res-open-material="${escHtml(remedy.tab)}">
                Mở tài liệu →
              </button>
            </div>
          ` : ""}
        </section>

        <!-- 3. Review & Answer Explanation Panel -->
        <section class="v21-card" style="margin-top: 16px;">
          <div class="cham-mode-tabs" style="margin-top: 0;">
            <button type="button" class="cham-mode-tab ${this.resultTab === "list" ? "is-active" : ""}" data-res-tab="list">
              Chữa bài từng câu (${r.total})
            </button>
            <button type="button" class="cham-mode-tab ${this.resultTab === "overview" ? "is-active" : ""}" data-res-tab="overview">
              Phân loại dạng câu hỏi
            </button>
          </div>

          ${this.resultTab === "overview" ? `
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${sortedPartStats.map((ps) => `
                <div style="border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden;">
                  <div style="padding: 10px 14px; background: var(--surface-2); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 14px;">Part ${ps.part} — ${PART_META[ps.part]?.desc || ""}</strong>
                    <span class="v21-neutral-pill tabular-nums">Đúng ${ps.correct}/${ps.total}</span>
                  </div>
                  <div style="overflow-x: auto;">
                    <table class="cham-tag-table">
                      <thead>
                        <tr>
                          <th>Dạng câu hỏi</th>
                          <th>Đúng</th>
                          <th>Sai</th>
                          <th>Trống</th>
                          <th>Bấm số câu để xem giải thích</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${Object.values(ps.tags).map((tg) => `
                          <tr>
                            <td style="font-weight: 500;">${escHtml(tg.name)}</td>
                            <td style="color: var(--ok); font-weight: 600;">${tg.correct}</td>
                            <td style="color: var(--bad); font-weight: 600;">${tg.wrong}</td>
                            <td style="color: var(--text-muted); font-weight: 500;">${tg.skipped}</td>
                            <td>
                              <div class="cham-mini-q-pills">
                                ${tg.items.map((it) => `
                                  <button type="button" class="cham-q-pill ${it.status === "ok" ? "is-correct" : (it.status === "bad" ? "is-wrong" : "")}"
                                          style="width: 30px; height: 26px;" data-review-gidx="${it.gIdx}" data-review-qnum="${it.num}">
                                    ${it.num}
                                  </button>
                                `).join("")}
                              </div>
                            </td>
                          </tr>
                        `).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : `
            <div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
                ${[
                  ["ALL", `Tất cả (${r.total})`],
                  ["WRONG", `Sai (${r.wrong})`],
                  ["FLAGGED", `Đánh dấu (${r.questionRows.filter((x) => x.flagged).length})`],
                  ["SKIPPED", `Bỏ qua (${r.skipped})`],
                  ["CORRECT", `Đúng (${r.correct})`]
                ].map(([val, label]) => `
                  <button type="button" class="v21-filter-pill ${this.resultListFilter === val ? "is-active" : ""}" data-res-filter="${val}">${label}</button>
                `).join("")}
              </div>

              <div style="overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-sm);">
                <table class="cham-tag-table">
                  <thead>
                    <tr>
                      <th>Câu</th>
                      <th>Phần</th>
                      <th>Bạn chọn</th>
                      <th>Đáp án</th>
                      <th>Kết quả</th>
                      <th>Giải thích &amp; Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredRows.length === 0 ? `
                      <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Không có câu nào thuộc bộ lọc này.</td></tr>
                    ` : filteredRows.map((row) => `
                      <tr>
                        <td><strong>Câu ${row.num}</strong> ${row.flagged ? `<span style="color: var(--warn); display: inline-flex; vertical-align: middle; margin-left: 3px;" title="Đã đánh dấu">${getIcon("flag", 13)}</span>` : ""}</td>
                        <td>Part ${row.part}</td>
                        <td style="font-weight: 600;">${row.userAns || "—"}</td>
                        <td style="font-weight: 600; color: var(--ok);">${row.correctAns}</td>
                        <td>
                          ${row.status === "ok"
                            ? `<span style="color: var(--ok); font-weight: 600;">✓ Đúng</span>`
                            : (row.status === "bad"
                              ? `<span style="color: var(--bad); font-weight: 600;">✕ Sai</span>`
                              : `<span style="color: var(--text-muted); font-weight: 500;">○ Bỏ qua</span>`)}
                        </td>
                        <td>
                          <button type="button" class="cham-btn" style="padding: 4px 10px; font-size: 13px;" data-review-gidx="${row.gIdx}" data-review-qnum="${row.num}">
                            Chữa câu này →
                          </button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          `}
        </section>
      </div>
    `;
  }

  /* ============================================================
     DOWNLOAD TEST MEDIA FOR OFFLINE USE
     ============================================================ */
  async downloadTestOffline(slug) {
    if (this.offlineDownloads.get(slug)?.running) return;
    const syncDetailDom = (running, statusText, cachedAll = false) => {
      this.offlineDownloads.set(slug, { running, statusText, cachedAll });
      if (this.view === "detail" && this.detailState.slug === slug) {
        const statusEl = document.getElementById("cham-offline-status");
        const btn = document.getElementById("cham-offline-dl-btn");
        if (statusEl) statusEl.textContent = statusText;
        if (btn) {
          btn.disabled = running;
          btn.innerHTML = running
            ? `${getIcon("clock", 14)} <span>Đang tải Offline...</span>`
            : (cachedAll
              ? `${getIcon("checkCircle", 14)} <span>Đã lưu Offline</span>`
              : `${getIcon("download", 14)} <span>Tải Offline đề này</span>`);
        }
      }
    };

    if (!("caches" in window)) {
      syncDetailDom(false, "Trình duyệt không hỗ trợ Cache Offline.", false);
      showToast("Trình duyệt hiện tại không hỗ trợ lưu Cache Offline.", "bad");
      return;
    }

    syncDetailDom(true, "Đang chuẩn bị danh sách tệp...", false);
    try {
      const testData = await this.loadTestJson(slug);
      const list = this.collectTestAssetUrls(slug, testData);
      const cache = await caches.open(CHAM_MEDIA_CACHE);
      let savedCount = 0;
      let failedCount = 0;
      let processed = 0;
      let nextIdx = 0;
      const concurrency = Math.min(4, Math.max(1, list.length));

      const worker = async () => {
        while (nextIdx < list.length) {
          const u = list[nextIdx++];
          let ok = false;
          try {
            const existing = await cache.match(u);
            if (existing) {
              ok = true;
            } else {
              const parsedU = new URL(u, window.location.href);
              const isCrossOrigin = parsedU.origin !== window.location.origin;
              let resp = null;
              try {
                resp = await fetch(u, isCrossOrigin ? { mode: "cors" } : {});
              } catch (_) {
                resp = null;
              }
              if ((!resp || !resp.ok) && isCrossOrigin) {
                try {
                  resp = await fetch(u, { mode: "no-cors" });
                } catch (_) {
                  resp = null;
                }
              }
              if (resp && (resp.ok || resp.type === "opaque")) {
                await cache.put(u, resp);
                ok = true;
              }
            }
          } catch (_) {
            ok = false;
          }
          if (ok) savedCount++;
          else failedCount++;
          processed++;
          const failSuffix = failedCount > 0 ? ` · ${failedCount} lỗi` : "";
          syncDetailDom(
            true,
            `Đang lưu offline: ${savedCount}/${list.length} tệp (${Math.round((processed / list.length) * 100)}%)${failSuffix}...`,
            false
          );
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      if (failedCount === 0 && savedCount === list.length) {
        syncDetailDom(false, `✓ Đã lưu Offline trọn bộ ${savedCount}/${list.length} tệp âm thanh & hình ảnh!`, true);
        showToast(`Đã lưu Offline trọn bộ đề ${testData.title} (${savedCount}/${list.length} tệp)!`, "success");
      } else if (savedCount > 0) {
        syncDetailDom(false, `Đã lưu ${savedCount}/${list.length} tệp (${failedCount} tệp lỗi mạng — bấm để tải lại phần thiếu).`, false);
        showToast(`Đã lưu ${savedCount}/${list.length} tệp (${failedCount} tệp lỗi mạng). Kiểm tra kết nối rồi bấm tải lại!`, "info");
      } else {
        syncDetailDom(false, `Không thể tải Offline (0/${list.length} tệp — lỗi kết nối mạng).`, false);
        showToast(`Không thể tải Offline đề ${testData.title} do lỗi mạng (${failedCount} tệp lỗi).`, "bad");
      }
    } catch (err) {
      syncDetailDom(false, `Lỗi tải offline: ${err.message}`, false);
      showToast(`Lỗi tải offline: ${err.message}`, "bad");
    }
  }

  /* ============================================================
     INTERACTIONS, AUDIO BINDING, RESIZER & SHORTCUTS
     ============================================================ */
  handleKeyDown(e) {
    if (!this.isActive) return;

    if (e.key === "Escape") {
      if (this.vocabSaveDraft || this.showHelpModal || this.showReviewModal || this.showSectionGate || this.volumeMenuOpen || this.mobilePaletteOpen) {
        e.preventDefault();
        this.vocabSaveDraft = null;
        this.showHelpModal = false;
        this.showReviewModal = false;
        this.showSectionGate = false;
        this.volumeMenuOpen = false;
        this.mobilePaletteOpen = false;
        if (this.view === "runner" || this.view === "review") this.rerenderPreservingAudio();
        else this.render();
        return;
      }
      const lightbox = document.getElementById("cham-graphic-lightbox");
      if (lightbox) {
        e.preventDefault();
        lightbox.remove();
        return;
      }
    }

    if (e.target && (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable)) return;

    const openDialog = document.querySelector("dialog[open]");
    const hasChamOverlay = Boolean(
      this.vocabSaveDraft ||
      this.showHelpModal ||
      this.showReviewModal ||
      this.showSectionGate ||
      document.getElementById("cham-graphic-lightbox")
    );
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (openDialog && openDialog.id !== "shortcuts-dialog") return;
      if (hasChamOverlay) return;
      e.preventDefault();
      const shortcutsDlg = document.getElementById("shortcuts-dialog");
      if (shortcutsDlg?.open) shortcutsDlg.close();
      else if (typeof window.__app?.openShortcutsModal === "function") window.__app.openShortcutsModal();
      else shortcutsDlg?.showModal();
      return;
    }

    if (openDialog || hasChamOverlay) return;

    if (this.view === "runner" || this.view === "review") {
      const isReview = this.view === "review";
      const curGroup = this.session?.groups?.[this.session.groupIdx];
      const curPart = curGroup?.part || 0;
      const isStrictLockedScrub = Boolean(!isReview && (this.session?.strictIigMode || this.session?.strictListeningOnly) && !this.session?.listeningLocked && curPart <= 4);
      const lowerKey = String(e.key || "").toLowerCase();

      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        this.stepGroup(1);
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        this.stepGroup(-1);
      } else if (e.code === "Space" && this.activeAudioEl && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.clearAutoAdvance();
        if (this.autoPlayTimer) {
          clearTimeout(this.autoPlayTimer);
          this.autoPlayTimer = null;
        }
        if (this.activeAudioEl.paused) this.activeAudioEl.play().catch(() => {});
        else this.activeAudioEl.pause();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && this.activeAudioEl && !isStrictLockedScrub && (lowerKey === "j" || e.key === "ArrowLeft")) {
        e.preventDefault();
        this.activeAudioEl.currentTime = Math.max(0, (this.activeAudioEl.currentTime || 0) - 5);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && this.activeAudioEl && !isStrictLockedScrub && (lowerKey === "l" || e.key === "ArrowRight")) {
        e.preventDefault();
        const dur = Number.isFinite(this.activeAudioEl.duration) ? this.activeAudioEl.duration : (this.activeAudioEl.currentTime + 5);
        this.activeAudioEl.currentTime = Math.min(dur, (this.activeAudioEl.currentTime || 0) + 5);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && lowerKey === "v" && (isReview || this.session?.mode === "practice")) {
        e.preventDefault();
        this.openQuickVocabModal();
      } else if (!isReview && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (lowerKey === "k" && this.session?.mode === "practice") {
          const checkBtn = this.rootEl?.querySelector("#cham-instant-check-btn");
          if (checkBtn) {
            e.preventDefault();
            checkBtn.click();
          }
          return;
        }
        if (lowerKey === "g" && this.session?.mode === "practice") {
          const detailBtn = this.rootEl?.querySelector("#cham-toggle-detail-expl-btn");
          if (detailBtn) {
            e.preventDefault();
            detailBtn.click();
          }
          return;
        }
        if (lowerKey === "f") {
          const activeQ = this.getActiveQuestionInGroup();
          if (activeQ) {
            const flagBtn = this.rootEl?.querySelector(`[data-flag-q="${activeQ.num}"]`);
            if (flagBtn) {
              e.preventDefault();
              flagBtn.click();
            }
          }
          return;
        }
        if (curGroup && (curGroup.questions || []).length >= 1) {
          const keyMap = { "1": "A", "2": "B", "3": "C", "4": "D", a: "A", b: "B", c: "C", d: "D" };
          const ch = keyMap[lowerKey];
          if (ch) {
            const activeQ = this.getActiveQuestionInGroup();
            if (!activeQ) return;
            const row = this.rootEl?.querySelector(`.cham-opt-row[data-cham-q="${activeQ.num}"][data-cham-choice="${ch}"]`);
            if (row) {
              e.preventDefault();
              row.click();
              // In multi-question groups (Parts 3, 4, 6, 7), smoothly advance keyboard focus to next question
              const qs = curGroup.questions || [];
              if (qs.length > 1) {
                const curIdx = qs.findIndex((x) => x.num === activeQ.num);
                const nextUnans = qs.slice(curIdx + 1).find((x) => !this.session.answers[x.num])
                  || qs[(curIdx + 1) % qs.length];
                if (nextUnans) {
                  this.setFocusedQuestionInPlace(nextUnans.num);
                }
              }
            }
          }
        }
      }
    }
  }

  getTargetOptionRow(e) {
    if (!this.isActive || this.view !== "runner" || !this.session) return null;
    const el = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target;
    return el?.closest?.(".cham-opt-row") || null;
  }

  handleRightMouseDown(e) {
    if (e.button !== 2) return;
    const row = this.getTargetOptionRow(e);
    if (!row) {
      this._pendingRightClick = null;
      return;
    }
    this._pendingRightClick = {
      seq: ++this._rightClickSeq,
      row,
      qNum: Number(row.dataset.chamQ),
      choice: row.dataset.chamChoice,
      x: e.clientX,
      y: e.clientY,
      ts: Date.now(),
      handled: false,
      fallbackToggled: false
    };
  }

  handleRightClickEliminate(e) {
    const row = this.getTargetOptionRow(e);
    if (!row) return;
    e.preventDefault();
    e.stopPropagation();

    const qNum = Number(row.dataset.chamQ);
    const choice = row.dataset.chamChoice;
    const now = Date.now();

    if (
      this._pendingRightClick &&
      this._pendingRightClick.qNum === qNum &&
      this._pendingRightClick.choice === choice &&
      this._pendingRightClick.fallbackToggled &&
      now - this._pendingRightClick.ts < 450
    ) {
      this._pendingRightClick = null;
      return;
    }

    if (
      this._pendingRightClick &&
      this._pendingRightClick.qNum === qNum &&
      this._pendingRightClick.choice === choice
    ) {
      this._pendingRightClick.handled = true;
    } else {
      this._pendingRightClick = null;
    }
    this.toggleElimination(qNum, choice, row);
  }

  handleRightMouseUp(e) {
    if (e.button !== 2 || !this._pendingRightClick) return;
    const snap = this._pendingRightClick;
    if (snap.handled) return;

    const releaseRow = this.getTargetOptionRow(e);
    if (
      !releaseRow ||
      Number(releaseRow.dataset.chamQ) !== snap.qNum ||
      releaseRow.dataset.chamChoice !== snap.choice
    ) {
      return;
    }

    const moved = Math.hypot(e.clientX - snap.x, e.clientY - snap.y);
    if (moved > 12) return;

    setTimeout(() => {
      if (
        !this._pendingRightClick ||
        this._pendingRightClick.seq !== snap.seq ||
        this._pendingRightClick.handled ||
        !this.isActive ||
        this.view !== "runner" ||
        !this.session
      ) {
        return;
      }
      this._pendingRightClick.handled = true;
      this._pendingRightClick.fallbackToggled = true;
      const liveRow =
        this.rootEl?.querySelector(`.cham-opt-row[data-cham-q="${snap.qNum}"][data-cham-choice="${snap.choice}"]`) ||
        snap.row;
      this.toggleElimination(snap.qNum, snap.choice, liveRow);
    }, 80);
  }

  toggleElimination(qNum, choice, rowEl) {
    if (!this.session || !qNum || !choice) return;
    if (!this.session.eliminations[qNum]) this.session.eliminations[qNum] = [];
    const arr = this.session.eliminations[qNum];
    const idx = arr.indexOf(choice);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(choice);
    if (rowEl) rowEl.classList.toggle("is-eliminated", idx < 0);
    this.persistCurrentDraft();
  }

  render(preservedAudio = null) {
    const root = this.rootEl;
    if (!root) return false;

    const inRunner = this.view === "runner" || this.view === "review";
    document.body.classList.toggle("is-cham-runner-active", inRunner);

    if (this.view === "detail") {
      root.innerHTML = this.renderDetailHTML();
    } else if (this.view === "runner") {
      root.innerHTML = this.renderRunnerOrReviewHTML(false);
    } else if (this.view === "result") {
      root.innerHTML = this.renderResultHTML();
    } else if (this.view === "review") {
      root.innerHTML = this.renderRunnerOrReviewHTML(true);
    } else {
      root.innerHTML = this.renderLibraryHTML();
    }

    let keptAudio = false;
    if (preservedAudio && inRunner) {
      const placeholder = root.querySelector("#cham-active-audio");
      const prevSrc = preservedAudio.getAttribute("src") || "";
      const nextSrc = placeholder?.getAttribute("src") || "";
      if (placeholder && prevSrc && prevSrc === nextSrc) {
        placeholder.replaceWith(preservedAudio);
        keptAudio = true;
      }
    }

    this.bindDOMEvents(root);
    return keptAudio;
  }

  rerenderPreservingAudio() {
    const prevAudio = this.activeAudioEl;
    const prevFallback = document.getElementById("cham-audio-fallback-bar");
    const hadError = Boolean(prevAudio && (prevAudio.error || (prevFallback && !prevFallback.hidden)));
    const keptAudio = this.render(prevAudio);
    if (prevAudio && !keptAudio) {
      try { prevAudio.pause(); } catch (_) {}
    }
    if (keptAudio && hadError) {
      const nextFb = document.getElementById("cham-audio-fallback-bar");
      if (nextFb) nextFb.hidden = false;
    }
  }

  applyReadingHighlights(root) {
    if (!this.session || !root) return;
    const boxes = Array.from(root.querySelectorAll(".cham-reading-passage-box, .cham-q-stem"));
    if (!boxes.length) return;

    // Unwrap existing highlights cleanly so in-place re-runs never lose scroll or audio state
    boxes.forEach((box) => {
      const existingMarks = Array.from(box.querySelectorAll("mark.cham-user-hl"));
      existingMarks.forEach((m) => {
        const parent = m.parentNode;
        if (!parent) return;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        parent.normalize();
      });
    });

    const phrases = this.session.highlights?.[this.session.groupIdx];
    const cleanPhrases = Array.isArray(phrases)
      ? Array.from(new Set(phrases.map((x) => String(x || "").trim()).filter((x) => x.length >= 2)))
      : [];

    if (cleanPhrases.length > 0) {
      cleanPhrases.forEach((phrase) => {
        const phraseLow = phrase.toLowerCase();
        boxes.forEach((box) => {
          const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, null);
          const textNodes = [];
          let node;
          while ((node = walker.nextNode())) {
            if (!node.parentElement || node.parentElement.closest("mark.cham-user-hl")) continue;
            if (node.nodeValue && node.nodeValue.toLowerCase().includes(phraseLow)) {
              textNodes.push(node);
            }
          }
          textNodes.forEach((tNode) => {
            const rawVal = tNode.nodeValue || "";
            const lowVal = rawVal.toLowerCase();
            const hits = [];
            let pos = 0;
            while (pos < lowVal.length) {
              const idx = lowVal.indexOf(phraseLow, pos);
              if (idx < 0) break;
              hits.push({ idx, len: phrase.length });
              pos = idx + phrase.length;
            }
            // Wrap right-to-left on the text node so earlier offsets remain valid
            for (let i = hits.length - 1; i >= 0; i--) {
              const { idx, len } = hits[i];
              try {
                const range = document.createRange();
                range.setStart(tNode, idx);
                range.setEnd(tNode, idx + len);
                const mark = document.createElement("mark");
                mark.className = "cham-user-hl";
                mark.dataset.hlPhrase = phrase;
                mark.title = "Nhấp vào để xóa tô vàng";
                range.surroundContents(mark);
              } catch {}
            }
          });
        });
      });

      root.querySelectorAll("mark.cham-user-hl").forEach((m) => {
        m.addEventListener("click", () => {
          const p = m.dataset.hlPhrase;
          const list = this.session?.highlights?.[this.session.groupIdx];
          if (Array.isArray(list)) {
            this.session.highlights[this.session.groupIdx] = list.filter((x) => x !== p);
            this.persistCurrentDraft();
            this.syncHighlightControlsInPlace(root);
          }
        });
      });
    }
    this.syncHighlightBadgeInPlace(root);
  }

  syncHighlightBadgeInPlace(root) {
    const hlBtnSpan = root?.querySelector("#cham-highlight-selection-btn span");
    const clearBtn = root?.querySelector("#cham-hl-clear-btn");
    const cnt = (this.session?.highlights?.[this.session.groupIdx] || []).length;
    if (hlBtnSpan) hlBtnSpan.textContent = cnt > 0 ? `Tô vàng (${cnt})` : "Tô vàng";
    if (clearBtn) clearBtn.style.display = cnt > 0 ? "" : "none";
  }

  syncHighlightControlsInPlace(root) {
    this.applyReadingHighlights(root);
  }

  bindDOMEvents(root) {
    // Shared Header & Global Suite Tools
    root.querySelector("#cham-home-logo-btn")?.addEventListener("click", () => this.openLibrary());
    root.querySelector("#cham-suite-tests-btn")?.addEventListener("click", () => this.openLibrary());
    root.querySelector("#cham-back-to-studio-btn")?.addEventListener("click", () => this.close());
    root.querySelector("#cham-suite-materials-btn")?.addEventListener("click", () => {
      this.onOpenMaterials("books");
    });
    root.querySelector("#cham-theme-btn")?.addEventListener("click", () => this.cycleTheme());
    root.querySelector("#cham-vocab-btn")?.addEventListener("click", () => {
      document.getElementById("open-vocab-btn")?.click();
    });
    root.querySelector("#cham-strategy-btn")?.addEventListener("click", () => {
      document.getElementById("open-strategy-btn")?.click();
    });
    root.querySelector("#cham-analytics-btn")?.addEventListener("click", () => {
      document.getElementById("open-analytics-btn")?.click();
    });
    root.querySelector("#cham-reader-btn")?.addEventListener("click", () => {
      document.getElementById("reader-settings-btn")?.click();
    });
    root.querySelector("#cham-resume-draft-btn")?.addEventListener("click", () => {
      const draft = loadDraftStore();
      if (draft && draft.slug) {
        this.startSession({
          slug: draft.slug,
          mode: draft.mode || "practice",
          parts: draft.parts || [1, 2, 3, 4, 5, 6, 7],
          timeLimitMin: draft.timeLimitMin || 0,
          examPauseSec: draft.examPauseSec ?? 5,
          strictIigMode: Boolean(draft.strictIigMode),
          filterQNums: draft.filterQNums || null,
          resumeDraft: draft
        });
      }
    });

    if (this.view === "library") {
      const searchInput = root.querySelector("#cham-search-input");
      let isComposingSearch = false;
      const applySearchVal = (val) => {
        this.libState.query = val;
        this.libState.page = 1;
        this.render();
        const nextInp = this.rootEl?.querySelector("#cham-search-input");
        if (nextInp) {
          nextInp.focus();
          nextInp.setSelectionRange(nextInp.value.length, nextInp.value.length);
        }
      };
      searchInput?.addEventListener("compositionstart", () => { isComposingSearch = true; });
      searchInput?.addEventListener("compositionend", (e) => {
        isComposingSearch = false;
        applySearchVal(e.target.value);
      });
      searchInput?.addEventListener("input", (e) => {
        if (e.isComposing || isComposingSearch) return;
        applySearchVal(e.target.value);
      });

      root.querySelectorAll("[data-cham-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextType = btn.dataset.chamType || "ALL";
          this.libState.typeFilter = nextType;
          if (nextType !== "PART") this.libState.partFilter = "ALL";
          this.libState.collection = "ALL";
          this.libState.page = 1;
          this.render();
        });
      });

      root.querySelectorAll("[data-cham-part-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.libState.partFilter = btn.dataset.chamPartFilter || "ALL";
          this.libState.page = 1;
          this.render();
        });
      });

      root.querySelectorAll("[data-cham-col]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.libState.collection = btn.dataset.chamCol;
          this.libState.page = 1;
          this.render();
        });
      });

      root.querySelector("#cham-status-filter")?.addEventListener("change", (e) => {
        this.libState.statusFilter = e.target.value;
        this.libState.page = 1;
        this.render();
      });

      root.querySelector("#cham-sort-select")?.addEventListener("change", (e) => {
        this.libState.sortBy = e.target.value || "DEFAULT";
        this.libState.page = 1;
        this.render();
      });

      root.querySelectorAll("[data-cham-cefr]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.libState.cefrFilter = btn.dataset.chamCefr || "ALL";
          this.libState.page = 1;
          this.render();
        });
      });

      root.querySelector("#cham-cefr-exact-select")?.addEventListener("change", (e) => {
        this.libState.cefrFilter = e.target.value || "ALL";
        this.libState.page = 1;
        this.render();
      });

      root.querySelector("#cham-lib-placement-btn")?.addEventListener("click", () => {
        this.openDetail("test-au-vao-01");
      });

      const clearFiltersHandler = () => {
        this.libState.query = "";
        this.libState.typeFilter = "ALL";
        this.libState.partFilter = "ALL";
        this.libState.collection = "ALL";
        this.libState.statusFilter = "ALL";
        this.libState.cefrFilter = "ALL";
        this.libState.sortBy = "DEFAULT";
        this.libState.page = 1;
        this.render();
      };
      root.querySelector("#cham-clear-filters-btn")?.addEventListener("click", clearFiltersHandler);
      root.querySelector("#cham-clear-filters-empty-btn")?.addEventListener("click", clearFiltersHandler);

      root.querySelector("#v21-mobile-filter-toggle")?.addEventListener("click", () => {
        this.libState.mobileFiltersOpen = !this.libState.mobileFiltersOpen;
        this.render();
      });

      root.querySelectorAll(".cham-open-detail-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.openDetail(btn.dataset.slug);
        });
      });

      root.querySelectorAll(".v21-test-row").forEach((row) => {
        row.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          const slug = row.dataset.testSlug;
          if (slug) this.openDetail(slug);
        });
      });

      root.querySelector("#cham-toggle-showall-btn")?.addEventListener("click", () => {
        this.libState.showAll = !this.libState.showAll;
        this.libState.page = 1;
        this.render();
      });

      root.querySelectorAll("[data-cham-page]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.libState.page = Number(btn.dataset.chamPage) || 1;
          this.render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
      return;
    }

    if (this.view === "detail") {
      const meta = (this.catalog.tests || []).find((t) => t.slug === this.detailState.slug);
      const availableParts = this.getAvailablePartsForMeta(meta);

      root.querySelector("#cham-back-library-btn")?.addEventListener("click", () => this.openLibrary());
      root.querySelector("#cham-offline-dl-btn")?.addEventListener("click", (e) => {
        this.downloadTestOffline(e.currentTarget.dataset.slug);
      });

      root.querySelectorAll("[data-detail-mode]").forEach((tab) => {
        tab.addEventListener("click", () => {
          this.detailState.modeTab = tab.dataset.detailMode;
          this.render();
        });
      });

      root.querySelectorAll(".cham-part-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
          const p = Number(cb.value);
          if (cb.checked) this.detailState.selectedParts.add(p);
          else this.detailState.selectedParts.delete(p);
          this.render();
        });
      });

      root.querySelectorAll(".v21-part-row").forEach((row) => {
        row.addEventListener("click", (e) => {
          if (e.target.closest("input, button, a")) return;
          const cb = row.querySelector(".cham-part-checkbox");
          if (!cb) return;
          const p = Number(cb.value);
          if (this.detailState.selectedParts.has(p)) this.detailState.selectedParts.delete(p);
          else this.detailState.selectedParts.add(p);
          this.render();
        });
      });

      root.querySelector("#cham-select-all-parts")?.addEventListener("click", () => {
        this.detailState.selectedParts = new Set(availableParts);
        this.render();
      });

      root.querySelector("#cham-clear-all-parts")?.addEventListener("click", () => {
        this.detailState.selectedParts.clear();
        this.render();
      });

      root.querySelector("#cham-practice-timer-select")?.addEventListener("change", (e) => {
        this.detailState.timeLimitMin = Number(e.target.value) || 0;
      });

      root.querySelector("#cham-exam-pause-select")?.addEventListener("change", (e) => {
        this.detailState.examPauseSec = Number(e.target.value);
      });

      root.querySelector("#cham-strict-iig-toggle")?.addEventListener("change", (e) => {
        this.detailState.strictIigMode = Boolean(e.target.checked);
      });

      root.querySelector("#cham-sound-check-btn")?.addEventListener("click", () => {
        playChamSoundCheck();
        showToast("Đang phát âm thanh kiểm tra loa/tai nghe...", "info");
      });

      root.querySelectorAll("[data-cham-open-material-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.onOpenMaterials(btn.dataset.chamOpenMaterialTab || "books");
        });
      });

      root.querySelector("#cham-start-practice-btn")?.addEventListener("click", () => {
        const chosen = availableParts.filter((p) => this.detailState.selectedParts.has(p));
        this.startSession({
          slug: this.detailState.slug,
          mode: "practice",
          parts: chosen,
          timeLimitMin: this.detailState.timeLimitMin
        });
      });

      root.querySelectorAll("[data-exam-scope]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextScope = btn.dataset.examScope || "full";
          if (this.detailState.examScope !== nextScope) {
            this.detailState.examScope = nextScope;
            this.render();
          }
        });
      });

      root.querySelector("#cham-start-exam-btn")?.addEventListener("click", () => {
        const hasLC = availableParts.some((p) => p <= 4);
        const hasRC = availableParts.some((p) => p >= 5);
        const scope = hasLC && hasRC ? (this.detailState.examScope || "full") : "full";
        const dur = Number(meta?.duration || 120);
        const lcMin = dur === 120 ? 45 : Math.max(5, Math.round((dur * 45) / 120));
        const rcMin = dur === 120 ? 75 : Math.max(5, dur - lcMin);

        let examParts = availableParts;
        let examTimeLimitMin = 0;
        let examPause = this.detailState.examPauseSec;
        let examStrict = this.detailState.strictIigMode;

        if (scope === "listening") {
          examParts = availableParts.filter((p) => p <= 4);
          examTimeLimitMin = lcMin;
        } else if (scope === "reading") {
          examParts = availableParts.filter((p) => p >= 5);
          examTimeLimitMin = rcMin;
          examPause = 0;
          examStrict = false;
        }

        this.startSession({
          slug: this.detailState.slug,
          mode: "exam",
          parts: examParts,
          timeLimitMin: examTimeLimitMin,
          examPauseSec: examPause,
          strictIigMode: examStrict
        });
      });

      root.querySelectorAll(".cham-open-attempt-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.openHistoricalAttempt(this.detailState.slug, Number(btn.dataset.attemptIdx));
        });
      });
      return;
    }

    if (this.view === "result") {
      root.querySelector("#cham-res-back-detail")?.addEventListener("click", () => {
        if (this.session?.isCustomPartPractice) {
          const pNum = this.session.practicePartNum || 5;
          this.close({ keepHash: true, skipExitCallback: true });
          this.onOpenPracticePart(pNum);
        } else {
          this.openDetail(this.session.slug);
        }
      });
      root.querySelector("#cham-open-split-review-btn")?.addEventListener("click", () => {
        this.view = "review";
        this.reviewFilter = "ALL";
        this.listeningReviewTab = "transcript";
        this.session.groupIdx = 0;
        this.syncUrlHash(`#/tests/${this.session.slug}/review`);
        this.render();
      });

      root.querySelectorAll("[data-res-practice-part]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pNum = Number(btn.dataset.resPracticePart);
          if (pNum >= 1 && pNum <= 7) {
            this.close({ keepHash: true, skipExitCallback: true });
            this.onOpenPracticePart(pNum);
          }
        });
      });

      root.querySelector("#cham-retake-mistakes-btn")?.addEventListener("click", () => {
        const mistakeNums = (this.session.submittedResult?.questionRows || [])
          .filter((x) => x.status !== "ok")
          .map((x) => x.num);
        if (mistakeNums.length) {
          if (this.session.isCustomPartPractice) {
            this.startRetakeCustomMistakes(mistakeNums);
          } else {
            this.startSession({
              slug: this.session.slug,
              mode: "practice",
              parts: this.session.parts,
              timeLimitMin: 0,
              filterQNums: mistakeNums
            });
          }
        }
      });

      root.querySelectorAll("[data-res-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.resultTab = btn.dataset.resTab;
          this.render();
        });
      });

      root.querySelectorAll("[data-res-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.resultListFilter = btn.dataset.resFilter;
          this.render();
        });
      });

      root.querySelectorAll("[data-res-open-material]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.onOpenMaterials(btn.dataset.resOpenMaterial || "books");
        });
      });

      root.querySelectorAll("[data-review-gidx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const gIdx = Number(btn.dataset.reviewGidx);
          const qNum = Number(btn.dataset.reviewQnum);
          this.view = "review";
          this.reviewFilter = "ALL";
          this.syncUrlHash(`#/tests/${this.session.slug}/review`);
          this.goToGroup(gIdx, qNum);
        });
      });
      return;
    }

    if (this.view === "runner" || this.view === "review") {
      const isReview = this.view === "review";

      root.querySelector("#cham-runner-theme-btn")?.addEventListener("click", () => this.cycleTheme());
      root.querySelector("#cham-runner-reader-btn")?.addEventListener("click", () => {
        document.getElementById("reader-settings-btn")?.click();
      });
      root.querySelector("#cham-runner-exit-btn")?.addEventListener("click", () => {
        if (isReview) {
          this.stopTimersAndAudio();
          this.view = "result";
          this.syncUrlHash(`#/result/${this.session.slug}`);
          this.render();
        } else if (confirm("Bạn muốn tạm thoát khỏi phòng làm bài? (Tiến độ nháp của bạn vẫn được lưu tự động!)")) {
          if (this.session?.isCustomPartPractice) {
            const pNum = this.session.practicePartNum || 5;
            this.close({ keepHash: true, skipExitCallback: true });
            this.onOpenPracticePart(pNum);
          } else {
            this.openDetail(this.session.slug);
          }
        }
      });

      root.querySelector("#cham-back-result-btn")?.addEventListener("click", () => {
        this.stopTimersAndAudio();
        this.view = "result";
        this.syncUrlHash(`#/result/${this.session.slug}`);
        this.render();
      });

      root.querySelector("#cham-submit-btn")?.addEventListener("click", () => this.confirmAndSubmit());
      root.querySelector("#cham-skip-pause-btn")?.addEventListener("click", () => {
        this.clearAutoAdvance();
        this.goToGroup(this.session.groupIdx + 1);
      });

      // CBT Topbar & Official Exam Controls: Timer Toggle, Volume Slider, Directions Banner, Help Modal, Review Screen
      // Timer & Volume update DOM in-place so active Listening audio is NEVER interrupted or reset!
      root.querySelector("#cham-toggle-timer-btn")?.addEventListener("click", (e) => {
        this.hideTimer = !this.hideTimer;
        const clkEl = root.querySelector("#cham-runner-clock");
        if (clkEl) clkEl.style.display = this.hideTimer ? "none" : "";
        const btn = e.currentTarget;
        btn.title = this.hideTimer ? "Hiện đồng hồ đếm giờ" : "Ẩn đồng hồ";
        btn.innerHTML = this.hideTimer ? getIcon("eye", 13) : getIcon("eyeOff", 13);
      });

      const bindVolumeSlider = () => {
        root.querySelector("#cham-volume-slider")?.addEventListener("input", (e) => {
          const pct = Number(e.target.value);
          this.audioVolume = Math.max(0, Math.min(1, pct / 100));
          if (this.activeAudioEl) this.activeAudioEl.volume = this.audioVolume;
          const pctLbl = root.querySelector("#cham-volume-pct");
          if (pctLbl) pctLbl.textContent = `${pct}%`;
          const volBtn = root.querySelector("#cham-volume-btn");
          if (volBtn) volBtn.title = `Âm lượng (${pct}%)`;
        });
      };
      bindVolumeSlider();

      root.querySelector("#cham-volume-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.volumeMenuOpen = !this.volumeMenuOpen;
        const wrap = e.currentTarget.closest(".cham-volume-wrap");
        const existing = wrap?.querySelector("#cham-volume-popover");
        if (!this.volumeMenuOpen) {
          existing?.remove();
        } else if (wrap && !existing) {
          const pct = Math.round((this.audioVolume ?? 1) * 100);
          const pop = document.createElement("div");
          pop.className = "cham-volume-popover";
          pop.id = "cham-volume-popover";
          pop.innerHTML = `
            <label for="cham-volume-slider">Âm lượng: <strong id="cham-volume-pct">${pct}%</strong></label>
            <input type="range" id="cham-volume-slider" min="0" max="100" step="5" value="${pct}" />
          `;
          wrap.appendChild(pop);
          bindVolumeSlider();
        }
      });

      root.querySelector("#cham-toggle-directions-btn")?.addEventListener("click", () => {
        this.showDirectionsBanner = !this.showDirectionsBanner;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#cham-close-directions-btn")?.addEventListener("click", () => {
        this.showDirectionsBanner = false;
        this.rerenderPreservingAudio();
      });

      root.querySelector("#cham-help-btn")?.addEventListener("click", () => {
        this.showHelpModal = true;
        this.volumeMenuOpen = false;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#cham-close-help-modal-btn")?.addEventListener("click", () => {
        this.showHelpModal = false;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#cham-help-ok-btn")?.addEventListener("click", () => {
        this.showHelpModal = false;
        this.rerenderPreservingAudio();
      });

      const openReviewModal = () => {
        this.showReviewModal = true;
        this.volumeMenuOpen = false;
        this.rerenderPreservingAudio();
      };
      root.querySelector("#cham-open-review-screen-btn")?.addEventListener("click", openReviewModal);
      root.querySelector("#cham-footer-review-btn")?.addEventListener("click", openReviewModal);
      root.querySelector("#cham-close-review-modal-btn")?.addEventListener("click", () => {
        this.showReviewModal = false;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#cham-review-continue-btn")?.addEventListener("click", () => {
        this.showReviewModal = false;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#cham-review-submit-now-btn")?.addEventListener("click", () => {
        this.showReviewModal = false;
        this.submitCurrentSession();
      });
      root.querySelectorAll("[data-review-jump-gidx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.showReviewModal = false;
          this.goToGroup(Number(btn.dataset.reviewJumpGidx), Number(btn.dataset.reviewJumpQnum));
        });
      });

      // Quick Save Vocabulary to SM-2 Flashcard Modal (preserves active audio)
      root.querySelector("#cham-save-vocab-btn")?.addEventListener("click", () => {
        this.openQuickVocabModal();
      });
      const closeVocabModal = () => {
        this.vocabSaveDraft = null;
        this.rerenderPreservingAudio();
      };
      root.querySelector("#cham-close-vocab-modal-btn")?.addEventListener("click", closeVocabModal);
      root.querySelector("#cham-vocab-cancel-btn")?.addEventListener("click", closeVocabModal);
      root.querySelector("#cham-vocab-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeVocabModal();
      });
      root.querySelector("#cham-vocab-speak-btn")?.addEventListener("click", () => {
        const w = String(root.querySelector("#cham-vocab-word-inp")?.value || "").trim();
        if (!w) return;
        if (window.__app?.vocabSRS?.speakTTS) {
          window.__app.vocabSRS.speakTTS(w, 0.94);
        } else if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(w);
          u.lang = "en-US";
          u.rate = 0.94;
          window.speechSynthesis.speak(u);
        }
      });
      root.querySelector("#cham-vocab-word-inp")?.addEventListener("input", (e) => {
        const typed = String(e.target.value || "").trim();
        const hit = this.lookupVocabBankEntry(typed);
        const transInp = root.querySelector("#cham-vocab-trans-inp");
        if (hit && transInp && (!transInp.value.trim() || transInp.dataset.autoFilled === "1")) {
          transInp.value = hit.translation || "";
          transInp.dataset.autoFilled = "1";
        }
      });
      root.querySelector("#cham-vocab-trans-inp")?.addEventListener("input", (e) => {
        e.target.dataset.autoFilled = "0";
      });
      root.querySelector("#cham-vocab-save-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const word = String(root.querySelector("#cham-vocab-word-inp")?.value || "").trim();
        const translation = String(root.querySelector("#cham-vocab-trans-inp")?.value || "").trim();
        const context = String(root.querySelector("#cham-vocab-ctx-inp")?.value || "").trim();
        if (!word) {
          showToast("Hãy nhập từ hoặc cụm từ tiếng Anh cần lưu!", "info");
          return;
        }
        const samePrefill = word.toLowerCase() === String(this.vocabSaveDraft?.word || "").trim().toLowerCase();
        const freshHit = samePrefill ? null : this.lookupVocabBankEntry(word);
        const curGrp = this.session?.groups?.[this.session.groupIdx];
        const cardData = {
          word,
          translation: translation || freshHit?.translation || "Từ vựng TOEIC đã lưu",
          context: context || `${this.session?.title || "TOEIC"} · Câu ${curGrp?.range || ""}`,
          ipa: samePrefill ? (this.vocabSaveDraft?.ipa || "") : (freshHit?.ipa || ""),
          type: samePrefill ? (this.vocabSaveDraft?.type || "") : (freshHit?.type || ""),
          talkRange: curGrp ? `Part ${curGrp.part} · Q${curGrp.range}` : "TOEIC",
          category: curGrp && curGrp.part >= 5 ? "Part 7 Business Reading" : "HR & Office Operations"
        };
        try {
          if (window.__app?.vocabSRS?.addCard) {
            await window.__app.vocabSRS.addCard(cardData);
            showToast(`Đã lưu "${word}" vào kho Flashcard SM-2!`, "success");
          } else {
            showToast("Không tìm thấy mô-đun Flashcard SM-2.", "bad");
          }
        } catch (err) {
          showToast(`Lỗi lưu từ vựng: ${err.message}`, "bad");
        }
        this.vocabSaveDraft = null;
        this.rerenderPreservingAudio();
      });

      // Close volume popover when clicking anywhere outside volume wrap inside runner shell
      root.querySelector(".cham-runner-shell")?.addEventListener("click", (e) => {
        if (this.volumeMenuOpen && !e.target.closest(".cham-volume-wrap")) {
          this.volumeMenuOpen = false;
          root.querySelector("#cham-volume-popover")?.remove();
        }
      });

      // Modal backdrop dismissal (Review Screen, Directions/Help, Section Gate)
      root.querySelector("#cham-directions-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.showHelpModal = false;
          this.rerenderPreservingAudio();
        }
      });
      root.querySelector("#cham-review-screen-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.showReviewModal = false;
          this.rerenderPreservingAudio();
        }
      });
      root.querySelector("#cham-section-gate-overlay")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.showSectionGate = false;
          this.rerenderPreservingAudio();
        }
      });

      root.querySelector("#cham-gate-stay-listening-btn")?.addEventListener("click", () => {
        this.showSectionGate = false;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#cham-gate-enter-reading-btn")?.addEventListener("click", () => {
        this.enterReadingSection(false);
      });

      root.querySelectorAll("[data-pal-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.paletteFilter = btn.dataset.palFilter || "ALL";
          this.rerenderPreservingAudio();
        });
      });

      const toggleQuestionFlagInPlace = (qNum) => {
        if (!qNum || !this.session) return;
        const nextFlag = !this.session.flags[qNum];
        this.session.flags[qNum] = nextFlag;
        this.persistCurrentDraft();

        if (this.paletteFilter === "FLAGGED") {
          this.rerenderPreservingAudio();
          return;
        }

        // Update question card flag button in-place without interrupting audio
        const cardBtn = root.querySelector(`[data-flag-q="${qNum}"]`);
        if (cardBtn) {
          cardBtn.classList.toggle("is-flagged", nextFlag);
          cardBtn.innerHTML = `${nextFlag ? CHAM_SVG.flagFill : CHAM_SVG.flag}<span>${nextFlag ? "Đã gắn cờ" : "Gắn cờ"}</span>`;
        }
        // Update footer flag button for current group
        const curGrp = this.session.groups[this.session.groupIdx];
        const grpFlagged = Boolean((curGrp?.questions || []).some((q) => Boolean(this.session.flags[q.num])));
        const footFlagBtn = root.querySelector("#cham-bottom-flag-btn");
        if (footFlagBtn) {
          footFlagBtn.classList.toggle("is-flagged-btn", grpFlagged);
          footFlagBtn.innerHTML = `${grpFlagged ? CHAM_SVG.flagFill : CHAM_SVG.flag}<span>${grpFlagged ? "Bỏ cờ" : "Gắn cờ"}</span>`;
        }
        // Update palette pill & flagged counter tab
        const pill = root.querySelector(`.cham-q-pill[data-jump-qnum="${qNum}"]`);
        if (pill) pill.classList.toggle("is-flagged", nextFlag);
        const flaggedCnt = Object.values(this.session.flags || {}).filter(Boolean).length;
        const flgTab = root.querySelector('[data-pal-filter="FLAGGED"]');
        if (flgTab) flgTab.textContent = `Cờ (${flaggedCnt})`;
      };

      root.querySelector("#cham-bottom-flag-btn")?.addEventListener("click", (e) => {
        const qNum = Number(e.currentTarget.dataset.footerFlagQ);
        if (qNum) toggleQuestionFlagInPlace(qNum);
      });

      // Reading Text Highlighter (Part 5-7 stems & passages) — in-place update keeps scroll & audio intact
      this.applyReadingHighlights(root);
      root.querySelector("#cham-highlight-selection-btn")?.addEventListener("click", () => {
        const sel = window.getSelection?.();
        const phrase = String(sel?.toString() || "").replace(/\s+/g, " ").trim();
        const anchorEl = sel?.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
        const anchorNode = anchorEl?.nodeType === 3 ? anchorEl.parentElement : anchorEl;
        const inTarget = anchorNode && anchorNode.closest(".cham-reading-passage-box, .cham-q-stem");
        if (!phrase || phrase.length < 2 || !inTarget) {
          showToast("Hãy bôi đen từ khóa trong bài đọc hoặc câu hỏi trước khi bấm Tô vàng!", "info");
          return;
        }
        if (!this.session.highlights) this.session.highlights = {};
        const arr = Array.isArray(this.session.highlights[this.session.groupIdx]) ? this.session.highlights[this.session.groupIdx] : [];
        if (!arr.some((x) => x.toLowerCase() === phrase.toLowerCase())) arr.push(phrase);
        this.session.highlights[this.session.groupIdx] = arr;
        try { sel.removeAllRanges(); } catch {}
        this.persistCurrentDraft();
        this.applyReadingHighlights(root);
      });
      root.querySelector("#cham-hl-clear-btn")?.addEventListener("click", () => {
        if (this.session.highlights) {
          this.session.highlights[this.session.groupIdx] = [];
          this.persistCurrentDraft();
          this.applyReadingHighlights(root);
        }
      });

      const prevHandler = () => this.stepGroup(-1);
      const nextHandler = () => this.stepGroup(1);
      root.querySelector("#cham-prev-group-top")?.addEventListener("click", prevHandler);
      root.querySelector("#cham-next-group-top")?.addEventListener("click", nextHandler);
      root.querySelector("#cham-prev-group-bottom")?.addEventListener("click", prevHandler);
      root.querySelector("#cham-next-group-bottom")?.addEventListener("click", nextHandler);

      const syncMobilePalette = (open) => {
        this.mobilePaletteOpen = open;
        root.querySelector("#cham-palette-aside")?.classList.toggle("is-mobile-open", open);
        root.querySelector("#cham-mobile-palette-backdrop")?.classList.toggle("is-mobile-open", open);
        root.querySelector("#cham-mobile-palette-toggle")?.setAttribute("aria-expanded", String(open));
      };
      root.querySelector("#cham-mobile-palette-toggle")?.addEventListener("click", () => {
        syncMobilePalette(!this.mobilePaletteOpen);
      });
      root.querySelector("#cham-close-palette-drawer-btn")?.addEventListener("click", () => {
        syncMobilePalette(false);
      });
      root.querySelector("#cham-mobile-palette-backdrop")?.addEventListener("click", () => {
        syncMobilePalette(false);
      });

      // Listening Review Studio Tabs (Transcript | Karaoke | Dictation | Shadowing)
      root.querySelectorAll("[data-listen-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.listeningReviewTab = btn.dataset.listenTab || "transcript";
          this.rerenderPreservingAudio();
        });
      });

      root.querySelectorAll("[data-karaoke-idx]").forEach((lineBtn) => {
        lineBtn.addEventListener("click", () => {
          const idx = Number(lineBtn.dataset.karaokeIdx) || 0;
          const total = Math.max(1, Number(lineBtn.dataset.karaokeTotal) || 1);
          const audio = root.querySelector("#cham-active-audio");
          if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = (idx / total) * audio.duration;
            audio.play().catch(() => {});
          } else if ("speechSynthesis" in window && lineBtn.dataset.karaokeText) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(lineBtn.dataset.karaokeText);
            u.lang = "en-US";
            u.rate = 0.94;
            window.speechSynthesis.speak(u);
          }
          root.querySelectorAll(".v21-karaoke-line").forEach((el) => el.classList.toggle("is-active", el === lineBtn));
        });
      });

      const curGIdx = this.session.groupIdx;
      const collectDictInputs = () => {
        if (!this.dictationState[curGIdx]) this.dictationState[curGIdx] = { checked: false, inputs: {}, revealed: false };
        root.querySelectorAll(".v21-dict-inp").forEach((inp) => {
          this.dictationState[curGIdx].inputs[inp.dataset.dictId] = inp.value;
        });
      };
      root.querySelectorAll(".v21-dict-inp").forEach((inp) => {
        inp.addEventListener("input", () => {
          if (!this.dictationState[curGIdx]) this.dictationState[curGIdx] = { checked: false, inputs: {}, revealed: false };
          this.dictationState[curGIdx].inputs[inp.dataset.dictId] = inp.value;
        });
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            collectDictInputs();
            this.dictationState[curGIdx].checked = true;
            this.rerenderPreservingAudio();
          }
        });
      });
      root.querySelector("#v21-dict-check-btn")?.addEventListener("click", () => {
        collectDictInputs();
        this.dictationState[curGIdx].checked = true;
        this.rerenderPreservingAudio();
      });
      root.querySelector("#v21-dict-reveal-btn")?.addEventListener("click", () => {
        if (!this.dictationState[curGIdx]) this.dictationState[curGIdx] = { checked: false, inputs: {}, revealed: false };
        const nextRev = !this.dictationState[curGIdx].revealed;
        this.dictationState[curGIdx] = { checked: false, inputs: {}, revealed: nextRev };
        this.rerenderPreservingAudio();
      });

      root.querySelectorAll("[data-shadow-speed]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sp = Number(btn.dataset.shadowSpeed) || 1.0;
          this.audioSpeed = sp;
          const audio = root.querySelector("#cham-active-audio");
          const speedSel = root.querySelector("#cham-audio-speed");
          if (speedSel) speedSel.value = String(sp === 1.0 ? 1 : sp);
          root.querySelectorAll("[data-shadow-speed]").forEach((b) => {
            b.classList.toggle("cham-btn-primary", b === btn);
          });
          if (audio) {
            audio.playbackRate = sp;
            audio.play().catch(() => {});
          }
          showToast(`Tốc độ Shadowing: ${sp}×`);
        });
      });
      root.querySelector("#v21-shadow-loop-toggle")?.addEventListener("change", (e) => {
        this.shadowingLoop = Boolean(e.target.checked);
        this.audioLoop = this.shadowingLoop;
        const audio = root.querySelector("#cham-active-audio");
        if (audio) audio.loop = this.shadowingLoop;
        const loopBtn = root.querySelector("#cham-audio-loop-btn");
        if (loopBtn) {
          loopBtn.classList.toggle("is-active", this.audioLoop);
          loopBtn.setAttribute("aria-pressed", String(this.audioLoop));
        }
      });
      root.querySelector("#v21-shadow-rec-btn")?.addEventListener("click", async () => {
        if (this._shadowRecording && this._shadowRec) {
          try { this._shadowRec.stop(); } catch {}
          this._shadowRecording = false;
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
          showToast("Trình duyệt không hỗ trợ ghi âm trực tiếp.", "info");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this._shadowChunks = [];
          const rec = new MediaRecorder(stream);
          rec.ondataavailable = (ev) => { if (ev.data?.size) this._shadowChunks.push(ev.data); };
          rec.onstop = () => {
            stream.getTracks().forEach((tr) => tr.stop());
            if (this._shadowAudioUrl) URL.revokeObjectURL(this._shadowAudioUrl);
            this._shadowAudioUrl = URL.createObjectURL(new Blob(this._shadowChunks, { type: "audio/webm" }));
            this._shadowRecording = false;
            this.rerenderPreservingAudio();
          };
          this._shadowRec = rec;
          this._shadowRecording = true;
          rec.start();
          this.rerenderPreservingAudio();
        } catch {
          showToast("Không có quyền truy cập micro để ghi âm Shadowing.", "info");
        }
      });

      root.querySelectorAll("[data-jump-part]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetPart = Number(btn.dataset.jumpPart);
          const idx = this.session.groups.findIndex((g) => g.part === targetPart);
          if (idx >= 0) this.goToGroup(idx);
        });
      });

      root.querySelectorAll("[data-jump-gidx]").forEach((pill) => {
        pill.addEventListener("click", () => {
          this.goToGroup(Number(pill.dataset.jumpGidx), Number(pill.dataset.jumpQnum));
        });
      });

      root.querySelectorAll("[data-rev-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.reviewFilter = btn.dataset.revFilter;
          const valid = this.getFilteredReviewGroupIndices();
          if (valid.length > 0 && !valid.includes(this.session.groupIdx)) {
            this.goToGroup(valid[0]);
            return;
          }
          this.rerenderPreservingAudio();
        });
      });

      // Passage / Graphic Zoom (in-place update keeps Listening audio uninterrupted) & Lightbox
      root.querySelectorAll(".cham-zoom-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.passageZoom = Number(btn.dataset.zoom) || 100;
          root.querySelectorAll(".cham-zoom-btn").forEach((b) => {
            const active = Number(b.dataset.zoom) === this.passageZoom;
            b.style.borderColor = active ? "var(--accent)" : "";
            b.style.color = active ? "var(--accent)" : "";
            b.style.background = active ? "var(--accent-soft)" : "";
          });
          root.querySelectorAll(".cham-zoomable-img").forEach((img) => {
            if (this.passageZoom !== 100) {
              img.style.width = `${this.passageZoom}%`;
              img.style.maxWidth = "none";
            } else {
              img.style.width = "";
              img.style.maxWidth = "";
            }
          });
        });
      });

      root.querySelectorAll(".cham-zoomable-img").forEach((img) => {
        const showImgOfflineNote = () => {
          const card = img.closest(".cham-stimulus-img-card");
          if (card && !card.querySelector(".v21-img-offline-note")) {
            img.style.display = "none";
            const note = document.createElement("div");
            note.className = "v21-img-offline-note";
            note.textContent = "Không tải được hình minh họa (ngoại tuyến hoặc lỗi mạng). Hãy kết nối mạng hoặc bấm 'Tải Offline' ở trang chi tiết đề.";
            card.appendChild(note);
          }
        };
        img.addEventListener("click", () => {
          openGraphicLightbox(img.src, `${this.session.title} · Câu ${this.session.groups[this.session.groupIdx]?.range || ""}`);
        });
        img.addEventListener("error", showImgOfflineNote, { once: true });
        if (img.complete && img.naturalWidth === 0) {
          showImgOfflineNote();
        }
      });

      // Part 1 & Part 2 Practice Peek Spoken Text Toggle (preserves audio position/playback)
      root.querySelectorAll(".cham-p12-peek-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!this.session.peekGroups) this.session.peekGroups = {};
          const gIdx = this.session.groupIdx;
          this.session.peekGroups[gIdx] = !this.session.peekGroups[gIdx];
          this.rerenderPreservingAudio();
        });
      });

      // Instant Check in Practice (shows Right/Wrong only; preserves audio position/playback)
      const toggleInstantReveal = () => {
        const gIdx = this.session.groupIdx;
        const nextVal = !this.session.revealedGroups[gIdx];
        this.session.revealedGroups[gIdx] = nextVal;
        if (!nextVal && this.session.detailExplGroups) {
          this.session.detailExplGroups[gIdx] = false;
        }
        this.rerenderPreservingAudio();
      };
      root.querySelector("#cham-instant-check-btn")?.addEventListener("click", toggleInstantReveal);
      root.querySelector(".cham-reveal-left-btn")?.addEventListener("click", toggleInstantReveal);

      // Detailed Explanation Toggle in Practice (separate button after checking)
      root.querySelector("#cham-toggle-detail-expl-btn")?.addEventListener("click", () => {
        if (!this.session.detailExplGroups) this.session.detailExplGroups = {};
        const gIdx = this.session.groupIdx;
        this.session.detailExplGroups[gIdx] = !this.session.detailExplGroups[gIdx];
        this.rerenderPreservingAudio();
      });

      // Flag Question (in-place update keeps Listening audio uninterrupted)
      root.querySelectorAll("[data-flag-q]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const qNum = Number(btn.dataset.flagQ);
          toggleQuestionFlagInPlace(qNum);
        });
      });

      // Question card click tracks active keyboard focus in multi-question groups
      root.querySelectorAll(".cham-q-card[data-qnum]").forEach((card) => {
        card.addEventListener("click", () => {
          const qn = Number(card.dataset.qnum);
          if (qn) this.setFocusedQuestionInPlace(qn, root);
        });
      });

      // Option Selection & Elimination
      if (!isReview) {
        root.querySelectorAll(".cham-opt-row").forEach((row) => {
          row.addEventListener("click", (e) => {
            if (e.target.closest(".cham-elim-btn")) return;
            const qNum = Number(row.dataset.chamQ);
            const choice = row.dataset.chamChoice;
            this.session.answers[qNum] = choice;
            this.focusedQNum = qNum;
            this.persistCurrentDraft();

            if (this.session.revealedGroups[this.session.groupIdx]) {
              this.rerenderPreservingAudio();
              return;
            }

            // Fast DOM update without interrupting audio!
            const card = row.closest(".cham-q-card");
            card?.querySelectorAll(".cham-opt-row").forEach((r) => {
              const match = r === row;
              r.classList.toggle("is-selected", match);
              const inp = r.querySelector("input");
              if (inp) inp.checked = match;
            });

            const pill = root.querySelector(`.cham-q-pill[data-jump-qnum="${qNum}"]`);
            if (pill) pill.classList.add("is-answered");

            const cnt = Object.keys(this.session.answers).length;
            const unans = Math.max(0, this.session.totalQ - cnt);
            const pct = this.session.totalQ > 0 ? Math.min(100, Math.round((cnt / this.session.totalQ) * 100)) : 0;
            const subBtn = root.querySelector("#cham-submit-btn");
            if (subBtn) subBtn.textContent = `Nộp bài (${cnt}/${this.session.totalQ})`;
            const footRevBtn = root.querySelector("#cham-footer-review-btn");
            if (footRevBtn) footRevBtn.textContent = `Rà soát (${unans} trống)`;
            const todoTab = root.querySelector('[data-pal-filter="TODO"]');
            if (todoTab) todoTab.textContent = `Chưa làm (${unans})`;
            const mobLabel = root.querySelector("#cham-mobile-palette-label");
            if (mobLabel) mobLabel.textContent = `${cnt}/${this.session.totalQ}`;
            const palAnsLabel = root.querySelector("#cham-palette-answered-label");
            if (palAnsLabel) palAnsLabel.textContent = `Đã chọn: ${cnt}/${this.session.totalQ}`;
            const palPctLabel = root.querySelector("#cham-palette-pct-label");
            if (palPctLabel) palPctLabel.textContent = `${pct}%`;
            const palFill = root.querySelector("#cham-palette-progress-fill");
            if (palFill) palFill.style.width = `${pct}%`;
          });
        });

        root.querySelectorAll(".cham-elim-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const qNum = Number(btn.dataset.elimQ);
            const choice = btn.dataset.elimChoice;
            this.toggleElimination(qNum, choice, btn.closest(".cham-opt-row"));
          });
        });
      }

      // Wire Audio Player Bar
      const audioEl = root.querySelector("#cham-active-audio");
      if (!audioEl) {
        this.activeAudioEl = null;
      } else {
        if (audioEl._chamAc) {
          try { audioEl._chamAc.abort(); } catch (_) {}
        }
        const audioAc = new AbortController();
        audioEl._chamAc = audioAc;
        const audioSig = { signal: audioAc.signal };

        this.activeAudioEl = audioEl;
        const curGrpPart = this.session?.groups?.[this.session.groupIdx]?.part || 0;
        const strictNoScrub = Boolean(!isReview && (this.session?.strictIigMode || this.session?.strictListeningOnly) && !this.session?.listeningLocked && curGrpPart <= 4);
        audioEl.volume = typeof this.audioVolume === "number" ? this.audioVolume : 1.0;
        audioEl.playbackRate = strictNoScrub ? 1.0 : Number(this.audioSpeed || 1.0);
        audioEl.loop = Boolean(!strictNoScrub && (this.audioLoop || (this.shadowingLoop && this.listeningReviewTab === "shadowing")));
        const playBtn = root.querySelector("#cham-audio-play-btn");
        const back5Btn = root.querySelector("#cham-audio-back5-btn");
        const fwd5Btn = root.querySelector("#cham-audio-fwd5-btn");
        const loopBtn = root.querySelector("#cham-audio-loop-btn");
        const scrubber = root.querySelector("#cham-audio-scrubber");
        const timeEl = root.querySelector("#cham-audio-time");
        const speedSel = root.querySelector("#cham-audio-speed");
        const fallbackBar = root.querySelector("#cham-audio-fallback-bar");

        back5Btn?.addEventListener("click", () => {
          if (strictNoScrub) return;
          audioEl.currentTime = Math.max(0, (audioEl.currentTime || 0) - 5);
        });
        fwd5Btn?.addEventListener("click", () => {
          if (strictNoScrub) return;
          const dur = Number.isFinite(audioEl.duration) ? audioEl.duration : ((audioEl.currentTime || 0) + 5);
          audioEl.currentTime = Math.min(dur, (audioEl.currentTime || 0) + 5);
        });
        loopBtn?.addEventListener("click", () => {
          if (strictNoScrub) return;
          this.audioLoop = !this.audioLoop;
          this.shadowingLoop = this.audioLoop;
          audioEl.loop = this.audioLoop;
          loopBtn.classList.toggle("is-active", this.audioLoop);
          loopBtn.setAttribute("aria-pressed", String(this.audioLoop));
          const shLoopCb = root.querySelector("#v21-shadow-loop-toggle");
          if (shLoopCb) shLoopCb.checked = this.audioLoop;
          showToast(this.audioLoop ? "Đã bật lặp lại đoạn audio" : "Đã tắt lặp lại audio", "info");
        });

        const syncTimeUI = () => {
          const cur = audioEl.currentTime || 0;
          const dur = audioEl.duration || 0;
          if (timeEl) timeEl.textContent = `${fmtAudioClock(cur)} / ${fmtAudioClock(dur)}`;
          if (scrubber && dur > 0) scrubber.value = String((cur / dur) * 100);
          if (dur > 0 && this.listeningReviewTab === "karaoke") {
            const kLines = root.querySelectorAll(".v21-karaoke-line");
            if (kLines.length) {
              const activeIdx = Math.min(kLines.length - 1, Math.floor((cur / dur) * kLines.length));
              kLines.forEach((el, idx) => el.classList.toggle("is-active", idx === activeIdx));
            }
          }
        };

        // Immediately reflect live state if audioEl was preserved across rerenderPreservingAudio()
        if (playBtn) playBtn.innerHTML = getIcon(audioEl.paused ? "play" : "pause", 16);
        syncTimeUI();

        playBtn?.addEventListener("click", () => {
          this.clearAutoAdvance();
          if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
            this.autoPlayTimer = null;
          }
          if (audioEl.paused) {
            audioEl.play().catch(() => {
              if (fallbackBar) fallbackBar.hidden = false;
            });
          } else {
            audioEl.pause();
          }
        });

        audioEl.addEventListener("play", () => {
          if (fallbackBar) fallbackBar.hidden = true;
          if (playBtn) playBtn.innerHTML = getIcon("pause", 16);
        }, audioSig);
        audioEl.addEventListener("pause", () => {
          if (playBtn) playBtn.innerHTML = getIcon("play", 16);
        }, audioSig);
        audioEl.addEventListener("loadedmetadata", () => {
          if (fallbackBar) fallbackBar.hidden = true;
          syncTimeUI();
        }, audioSig);
        audioEl.addEventListener("error", () => {
          if (fallbackBar) fallbackBar.hidden = false;
        }, audioSig);
        if (audioEl.error && fallbackBar) {
          fallbackBar.hidden = false;
        }
        audioEl.addEventListener("timeupdate", syncTimeUI, audioSig);
        audioEl.addEventListener("ended", () => {
          if (playBtn) playBtn.innerHTML = getIcon("play", 16);
          if (!isReview && this.session.mode === "exam") {
            this.triggerExamAudioPauseCountdown();
          }
        }, audioSig);

        scrubber?.addEventListener("input", () => {
          const dur = audioEl.duration || 0;
          if (dur > 0) {
            audioEl.currentTime = (Number(scrubber.value) / 100) * dur;
          }
        });

        speedSel?.addEventListener("change", () => {
          const sp = Number(speedSel.value) || 1.0;
          this.audioSpeed = sp;
          audioEl.playbackRate = sp;
          root.querySelectorAll("[data-shadow-speed]").forEach((b) => {
            b.classList.toggle("cham-btn-primary", Math.abs(Number(b.dataset.shadowSpeed) - sp) < 0.02);
          });
        });

        root.querySelector("#cham-audio-retry-btn")?.addEventListener("click", () => {
          if (fallbackBar) fallbackBar.hidden = true;
          audioEl.load();
          audioEl.play().catch(() => {
            if (fallbackBar) fallbackBar.hidden = false;
          });
        });

        root.querySelector("#cham-audio-tts-btn")?.addEventListener("click", () => {
          const grp = this.session?.groups?.[this.session.groupIdx];
          if (!grp?.transcriptHtml || !("speechSynthesis" in window)) {
            showToast("Trình duyệt không hỗ trợ đọc giọng nói AI.", "info");
            return;
          }
          const rawSpoken = this.extractPlainTranscriptLines(grp.transcriptHtml).join(". ");
          const spoken = rawSpoken
            .replace(/[✓✔✅]/g, "")
            .replace(/\b[MW]-(?:Am|Au|Br|Cn|BR)\b:?\s*/gi, "")
            .replace(/(?:^|\s)\(\d{1,3}\)\s*/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (!spoken) return;
          const looksVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]{2,}|(?:\b(?:người|đang|không|chúng|của|những|trong)\b)/i.test(spoken);
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(spoken);
          u.lang = looksVietnamese ? "vi-VN" : "en-US";
          u.rate = Math.max(0.7, Math.min(1.4, Number(this.audioSpeed || 0.96)));
          window.speechSynthesis.speak(u);
          showToast("Đang đọc bài nghe bằng giọng AI (Offline)...", "info");
        });
      }

      // Wire Draggable Split Resizer
      const resizer = root.querySelector("#cham-stage-resizer");
      const stage = root.querySelector("#cham-split-stage");
      const leftPane = root.querySelector("#cham-left-pane");
      const rightPane = root.querySelector("#cham-right-q-pane");
      if (resizer && stage && leftPane && rightPane) {
        let dragging = false;
        resizer.addEventListener("pointerdown", (e) => {
          dragging = true;
          resizer.setPointerCapture(e.pointerId);
        });
        resizer.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          const rect = stage.getBoundingClientRect();
          const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
          if (pct >= 28 && pct <= 72) {
            this.splitLeftPct = pct;
            leftPane.style.flex = `0 0 ${pct}%`;
            rightPane.style.flex = `1 1 ${100 - pct}%`;
          }
        });
        const endDrag = () => { dragging = false; };
        resizer.addEventListener("pointerup", endDrag);
        resizer.addEventListener("pointercancel", endDrag);
        resizer.addEventListener("dblclick", () => {
          this.splitLeftPct = 52;
          leftPane.style.flex = "0 0 52%";
          rightPane.style.flex = "1 1 48%";
        });
      }
    }
  }
}

export function initChamTestCenter(options = {}) {
  const center = new ChamTestCenter(options);
  window.__chamCenter = center;

  const checkHashRoute = () => {
    if (center._suppressHashSync) return;
    const h = location.hash || "";
    if (h.startsWith("#/result/")) {
      const mRes = h.match(/^#\/result\/([^/]+)/);
      const slug = mRes && mRes[1] ? decodeURIComponent(mRes[1]) : null;
      if (slug) {
        if (!center.isActive) center.open(slug, "result", true);
        else center.routeToSlugSubView(slug, "result");
        return;
      }
    }
    if (
      h.startsWith("#/practice/part/") &&
      h.endsWith("/run") &&
      center.isActive &&
      center.session?.isCustomPartPractice &&
      center.view === "runner" &&
      !center.session.submittedResult
    ) {
      return;
    }
    if (h === "#tests" || h.startsWith("#/tests")) {
      const m = h.match(/^#\/tests(?:\/([^/]+))?(?:\/([^/]+))?/);
      const slug = m && m[1] ? decodeURIComponent(m[1]) : null;
      const subRoute = m && m[2] ? decodeURIComponent(m[2]) : null;
      if (!center.isActive) {
        center.open(slug, subRoute, true);
      } else if (!slug) {
        if (center.view !== "library") center.openLibrary(true);
      } else {
        center.routeToSlugSubView(slug, subRoute);
      }
    } else if (center.isActive) {
      center.close({ fromHashChange: true, keepHash: true });
    }
  };

  window.addEventListener("hashchange", checkHashRoute);
  checkHashRoute();

  return center;
}
