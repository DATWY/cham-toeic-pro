/**
 * Neuro-TOEIC Part 4 Studio Pro — Main Application Bootstrap
 * Production-Grade Architecture: Native ES Modules, Zero Build Needed
 */

import { icons, getIcon } from "./uiIcons.js";
import { state, saveState, subscribe, updateMastery, recordActiveTime, getMasteryScore, getAnswer, setAnswer, deleteAnswer, getConfidence, setConfidence, deleteConfidence, getEliminations, toggleElimination, deleteEliminations } from "./store.js";
import { AudioEngine, ambientSoundscape } from "./audioEngine.js?v=19.5";
import { VoiceStudio } from "./voiceStudio.js";
import { TranscriptSync } from "./transcriptSync.js?v=19.4";
import { ExamSimulator } from "./examSimulator.js";
import { VocabSRS } from "./vocabSrs.js?v=19.4";
import { AnalyticsEngine } from "./analytics.js?v=22.1";
import { initChamTestCenter } from "./chamTestCenter.js?v=22.5";
import { initMaterialsCenter } from "./materialsCenter.js?v=22.1";
import { initDashboardAndPractice } from "./dashboardPractice.js?v=22.1";
import { showToast, clearToasts, openGraphicLightbox, renderMasteryRing, applyHighlights, renderEvidenceAnalysis, renderVocabAndNotes, renderPart7Passages, renderReadingInspectorScript } from "./renderers.js?v=19.4";

const CORE_TESTS = window.TOEIC_TESTS || [];
const EXTRA_PART56_TESTS = Array.isArray(window.TOEIC_PART56_TESTS)
  ? window.TOEIC_PART56_TESTS
      .filter((t) => t && t.id && !CORE_TESTS.some((c) => c.id === t.id))
      .map((t) => ({ ...t, isExtraPack: true }))
  : [];
const TESTS = [...CORE_TESTS, ...EXTRA_PART56_TESTS];

// Active Instances Map
const activeEngines = new Map(); // talkKey -> AudioEngine
const activeStudios = new Map(); // talkKey -> VoiceStudio
const activeSyncs = new Map();   // talkKey -> TranscriptSync
const p7ViewState = new Map();   // talkKey -> { docTab: 'all'|'doc1'..., evidenceQ: null|number }

function getP7State(talkKey) {
  if (!p7ViewState.has(talkKey)) {
    p7ViewState.set(talkKey, { docTab: "all", evidenceQ: null });
  }
  return p7ViewState.get(talkKey);
}

function isCurrentTestReading(testId = state.activeTest) {
  const t = TESTS.find((x) => x.id === testId);
  return Boolean(t && (t.isReading || t.part === 5 || t.part === 6 || t.part === 7));
}

function speakWordTTS(phrase) {
  try {
    if ("speechSynthesis" in window && phrase) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = "en-US";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
      return true;
    }
  } catch (_) {}
  return false;
}

let vocabSRS = null;
let analyticsEngine = null;
let examSimulator = null;
let chamCenter = null;
let materialsCenter = null;
let dashboardPractice = null;

/* ============================================================
   Minimalist Studio Outer Lobby & Pack Overview Router
   Symmetrical 3-Stage Flow: #/studio -> #/studio/<id> -> #/studio/<id>/run
   ============================================================ */
const studioLobbyState = {
  view: "lobby", // 'lobby' | 'detail' | 'workspace'
  detailTestId: null,
  detailModeTab: "practice", // 'practice' | 'study'
  query: "",
  partFilter: "ALL", // 'ALL' | 'LISTENING' | 'READING' | 'PART1' | 'PART2' | 'PART4' | 'PART5' | 'PART6' | 'PART7'
  cefrFilter: "ALL", // 'ALL' | 'A12' | 'B12' | 'C12' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  sortOrder: "DEFAULT", // 'DEFAULT' | 'DIFF_ASC' | 'DIFF_DESC'
};
let _suppressStudioHash = false;

function escStudioHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStudioPackMeta(test) {
  const talks = test.talks || [];
  let totalQ = 0;
  let answeredQ = 0;
  let checkedQ = 0;
  let correctQ = 0;

  talks.forEach((tk) => {
    const key = `${test.id}_${tk.range}`;
    const isChecked = Boolean(state.checkedTalks[key]);
    (tk.questions || []).forEach((q) => {
      totalQ++;
      const ans = getAnswer(test.id, q.num);
      if (ans) answeredQ++;
      if (isChecked) {
        checkedQ++;
        if (ans && ans === q.answer) correctQ++;
      }
    });
  });

  const isReading = Boolean(test.isReading || test.part >= 5);
  let partNum = test.part ? Number(test.part) : 4;
  if (!test.part) {
    if (test.id.includes("_p1_")) partNum = 1;
    else if (test.id.includes("_p2_")) partNum = 2;
    else if (test.id.startsWith("part7")) partNum = 7;
    else if (test.id.startsWith("part6")) partNum = 6;
    else if (test.id.startsWith("part5")) partNum = 5;
  }

  const descriptorMap = {
    ets2019_t6: {
      eyebrow: "ETS 2019 · PART 4",
      shortTitle: "ETS 2019 Test 6",
      cardTitle: "ETS 2019 Test 6 · Short Talks",
      estMinutes: 18,
      description: "Luyện nghe hiểu bài nói ngắn với Live Karaoke Script từng từ, chép chính tả & phân tích bẫy paraphrase.",
      tags: ["Live Script", "Chép chính tả", "Shadowing"],
    },
    hackers3_t4: {
      eyebrow: "HACKERS 3 · PART 4",
      shortTitle: "Hackers 3 Test 4",
      cardTitle: "Hackers 3 Test 4 · Short Talks",
      estMinutes: 18,
      description: "Bộ đề nâng cao với tốc độ đọc chuẩn phòng thi, graphic integration và cụm từ đồng nghĩa kinh điển.",
      tags: ["Live Script", "Chép chính tả", "Graphic Q95-100"],
    },
    ets2019_p2_t7: {
      eyebrow: "ETS 2019 · PART 2",
      shortTitle: "ETS 2019 Test 7",
      cardTitle: "ETS 2019 Test 7 · Question-Response",
      estMinutes: 12,
      description: "25 câu phản xạ hỏi-đáp nhanh, nhận diện bẫy đồng âm, câu hỏi Wh- & câu trả lời gián tiếp.",
      tags: ["Phản xạ nhanh", "Bẫy đồng âm", "Dictation"],
    },
    ets2019_p1_t6: {
      eyebrow: "ETS 2019 · PART 1",
      shortTitle: "ETS 2019 Test 6",
      cardTitle: "ETS 2019 Test 6 · Photographs",
      estMinutes: 6,
      description: "6 tranh gốc ETS 2019 với chế độ làm bài ẩn transcript chống lộ đáp án, chấm xong mới mở khóa giải mã.",
      tags: ["Ảnh gốc ETS", "Chế độ ẩn đáp án", "Nghe phân biệt"],
    },
    ets2019_p1_t7: {
      eyebrow: "ETS 2019 · PART 1",
      shortTitle: "ETS 2019 Test 7",
      cardTitle: "ETS 2019 Test 7 · Photographs",
      estMinutes: 6,
      description: "6 tranh gốc ETS 2019 Test 7 tập trung vào động từ chỉ hành động, trạng thái bị động & vị trí vật thể.",
      tags: ["Ảnh gốc ETS", "Chế độ ẩn đáp án", "Từ vựng hình ảnh"],
    },
    part5_t1: {
      eyebrow: "ETS PRO · PART 5",
      shortTitle: "ETS Pro · Part 5",
      cardTitle: "Part 5 · Từ loại & Ngữ pháp",
      estMinutes: 15,
      description: "30 câu hoàn thành câu chuẩn IIG chia theo 6 chuyên đề: từ loại, thì, giới từ, liên từ & từ vựng thương mại.",
      tags: ["Ngữ pháp IIG", "Gạch loại trừ", "Giải thích chi tiết"],
    },
    part6_t1: {
      eyebrow: "ETS PRO · PART 6",
      shortTitle: "ETS Pro · Part 6",
      cardTitle: "Part 6 · Điền đoạn văn bản",
      estMinutes: 10,
      description: "4 văn bản hoàn chỉnh bao gồm câu điền mệnh đề ngữ cảnh, mạch văn & collocations kinh doanh.",
      tags: ["Điền câu [1]-[4]", "Mạch văn", "Dịch song ngữ"],
    },
    part7_t1: {
      eyebrow: "ETS PRO · PART 7",
      shortTitle: "ETS Pro · Đọc hiểu",
      cardTitle: "Part 7 · Đọc hiểu Đơn / Kép / Ba",
      estMinutes: 50,
      description: "15 bài đọc đầy đủ dạng câu hỏi tìm chứng cứ, suy luận, NOT/TRUE & chèn câu [1]-[4] kèm tô vàng từ khóa.",
      tags: ["Soi chứng cứ", "Đoạn đôi & Ba", "Highlight văn bản"],
    },
  };

  const info = descriptorMap[test.id] || {
    eyebrow: `ETS · PART ${partNum}`,
    shortTitle: test.shortLabel || test.title.split(" (")[0],
    cardTitle: test.title,
    estMinutes: Math.max(8, Math.round(totalQ * 0.7)),
    description: test.description || "Bộ đề luyện sâu TOEIC chuẩn IIG kèm giải thích chi tiết từng câu.",
    tags: isReading ? ["Chứng cứ", "Dịch song ngữ"] : ["Live Script", "Chép chính tả"],
  };

  const diffMeta = window.TOEIC_DIFFICULTY_DATA?.studioTests?.[test.id] || null;
  const cefrCode = diffMeta?.cefr || (partNum <= 2 ? "A2" : partNum >= 7 ? "C1" : "B1");
  const cefrGroup = diffMeta?.cefrGroup || (["A1", "A2"].includes(cefrCode) ? "A12" : ["C1", "C2"].includes(cefrCode) ? "C12" : "B12");
  const cefrToneClass = cefrCode === "C2" ? "cefr-c2" : cefrCode === "C1" ? "cefr-c1" : cefrCode === "B2" ? "cefr-b2" : cefrCode === "B1" ? "cefr-b1" : "cefr-a12";

  return {
    id: test.id,
    partNum,
    partLabel: `Part ${partNum}`,
    skillTag: isReading ? "Reading" : "Listening",
    isReading,
    talkCount: talks.length,
    totalQ,
    answeredQ,
    checkedQ,
    correctQ,
    cefr: cefrCode,
    cefrGroup,
    cefrToneClass,
    cefrTitle: diffMeta?.cefrTitle || `${cefrCode} · TOEIC`,
    toeicBand: diffMeta?.toeicBand || "550–780",
    difficultyScore: diffMeta?.difficultyScore ?? 60,
    stars: diffMeta?.stars ?? 3.5,
    lcCefr: diffMeta?.lcCefr || "—",
    rcCefr: diffMeta?.rcCefr || "—",
    partDifficulty: diffMeta?.partDifficulty || {},
    diffMetrics: diffMeta?.metrics || {},
    cefrSummary: diffMeta?.summary || "",
    recommendedMaterials: diffMeta?.recommendedMaterials || [],
    ...info,
  };
}

function syncStudioHash(targetHash, replace = false) {
  if (location.hash === targetHash) return;
  _suppressStudioHash = true;
  try {
    if (replace) history.replaceState(null, "", targetHash);
    else history.pushState(null, "", targetHash);
  } finally {
    setTimeout(() => {
      _suppressStudioHash = false;
    }, 0);
  }
}

function setStudioView(view) {
  studioLobbyState.view = view;
  document.body.dataset.studioView = view;

  const homeRoot = document.getElementById("v21-home-root");
  const practiceRoot = document.getElementById("v21-practice-root");
  const lobbyRoot = document.getElementById("studio-lobby-root");

  if (homeRoot) {
    if (view === "home") homeRoot.removeAttribute("hidden");
    else homeRoot.setAttribute("hidden", "");
  }
  if (practiceRoot) {
    if (view === "practice") practiceRoot.removeAttribute("hidden");
    else practiceRoot.setAttribute("hidden", "");
  }
  if (lobbyRoot) {
    if (view === "detail") lobbyRoot.removeAttribute("hidden");
    else lobbyRoot.setAttribute("hidden", "");
  }

  if (view !== "materials" && materialsCenter?.isActive?.()) {
    materialsCenter.close();
  }
  if (view !== "cham" && chamCenter?.isActive) {
    chamCenter.close({ skipExitCallback: true, keepHash: true });
  }

  // Sync 4 primary navigation items (Trang chủ · Luyện tập · Thi thử · Tài liệu)
  const navHome = document.getElementById("nav-home-btn");
  const navPractice = document.getElementById("nav-practice-btn");
  const navTests = document.getElementById("nav-tests-btn");
  const navMaterials = document.getElementById("nav-materials-btn");

  const isPracticeRunner = Boolean(
    view === "cham" &&
    chamCenter?.session?.isCustomPartPractice &&
    ["runner", "review", "result"].includes(chamCenter?.view)
  );
  const activeKey = isPracticeRunner
    ? "practice"
    : view === "cham"
      ? "tests"
      : view === "materials"
        ? "materials"
        : (view === "practice" || view === "detail" || view === "workspace" || view === "lobby")
          ? "practice"
          : "home";

  [
    [navHome, "home"],
    [navPractice, "practice"],
    [navTests, "tests"],
    [navMaterials, "materials"]
  ].forEach(([el, key]) => {
    if (!el) return;
    const isAct = activeKey === key;
    el.classList.toggle("is-active", isAct);
    if (isAct) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}

function openHomeDashboard(opts = {}) {
  pauseActiveAudio();
  clearToasts();
  if (state.focusMode) toggleFocusMode();
  if (examSimulator?.isActive) examSimulator.exitEarly();
  setStudioView("home");
  if (!opts.skipHash) {
    syncStudioHash("#/", Boolean(opts.replaceHash));
  }
  dashboardPractice?.renderHome();
  if (opts.scrollTop !== false) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function openPracticeHub(partNum = null, opts = {}) {
  pauseActiveAudio();
  clearToasts();
  if (state.focusMode) toggleFocusMode();
  if (examSimulator?.isActive) examSimulator.exitEarly();
  const validPart = partNum && Number(partNum) >= 1 && Number(partNum) <= 7 ? Number(partNum) : null;
  dashboardPractice?.setSelectedPart(validPart);
  setStudioView("practice");
  if (!opts.skipHash) {
    const targetHash = validPart ? `#/practice/part/${validPart}` : "#/practice";
    syncStudioHash(targetHash, Boolean(opts.replaceHash));
  }
  dashboardPractice?.renderPractice(validPart);
  if (opts.scrollTop !== false) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function openMaterialsHub(tab = "books", opts = {}) {
  pauseActiveAudio();
  clearToasts();
  if (state.focusMode) toggleFocusMode();
  if (examSimulator?.isActive) examSimulator.exitEarly();
  if (tab === "matrix") {
    if (!document.body.dataset.studioView || document.body.dataset.studioView === "materials") {
      openHomeDashboard({ skipHash: true });
    }
    openAnalyticsModal("matrix");
    return;
  }
  setStudioView("materials");
  materialsCenter?.open(tab, Boolean(opts.fromHashChange));
}

function openChamHub(slug = null, subRoute = null) {
  pauseActiveAudio();
  clearToasts();
  if (state.focusMode) toggleFocusMode();
  if (examSimulator?.isActive) examSimulator.exitEarly();
  setStudioView("cham");
  chamCenter?.open(slug, subRoute);
}

function openStudioLobby(opts = {}) {
  // v21.0: Studio Lobby is merged into Practice by Part (#/practice)
  openPracticeHub(null, opts);
}

function openStudioDetail(testId, opts = {}) {
  const exists = TESTS.some((t) => t.id === testId);
  if (!exists) {
    openPracticeHub(null, opts);
    return;
  }
  pauseActiveAudio();
  clearToasts();
  if (state.focusMode) toggleFocusMode();
  studioLobbyState.detailTestId = testId;
  studioLobbyState.detailModeTab = state.mode === "study" ? "study" : "practice";
  setStudioView("detail");
  if (!opts.skipHash) {
    syncStudioHash(`#/studio/${encodeURIComponent(testId)}`, Boolean(opts.replaceHash));
  }
  renderStudioLobbyRoot();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function enterStudioWorkspace(testId, opts = {}) {
  const targetTest = TESTS.find((t) => t.id === testId) || TESTS[0];
  if (!targetTest) return;
  if (opts.mode && (opts.mode === "practice" || opts.mode === "study")) {
    state.mode = opts.mode;
    saveState();
    document.querySelectorAll(".topbar .seg-btn[data-mode]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.mode === state.mode);
    });
  }
  if (typeof opts.talkIndex === "number" && opts.talkIndex >= 0) {
    state.currentIndex[targetTest.id] = opts.talkIndex;
    saveState();
  }
  selectTab(targetTest.id, {
    enterWorkspace: true,
    skipHash: Boolean(opts.skipHash),
    replaceHash: Boolean(opts.replaceHash),
  });
  if (opts.scrollTop !== false) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function applyStudioHashRoute(fromHashChange = false) {
  if (_suppressStudioHash) return;
  const h = location.hash || "";
  if (h === "#tests" || h.startsWith("#/tests") || h.startsWith("#/result/")) {
    setStudioView("cham");
    return;
  }
  if (h === "#materials" || h.startsWith("#/materials")) {
    const mMat = h.match(/^#\/materials\/([a-z0-9_-]+)/i);
    const matTab = mMat ? mMat[1] : "books";
    if (matTab === "matrix") {
      openHomeDashboard({ skipHash: true, scrollTop: false });
      openAnalyticsModal("matrix");
      return;
    }
    openMaterialsHub(matTab, { fromHashChange: true });
    return;
  }
  if (h === "#/practice" || h === "#practice") {
    openPracticeHub(null, { skipHash: true, scrollTop: !fromHashChange });
    return;
  }
  const matchPracticeRun = h.match(/^#\/practice\/part\/([1-7])\/run(?:\/)?$/);
  if (matchPracticeRun) {
    if (
      chamCenter?.isActive &&
      chamCenter?.session?.isCustomPartPractice &&
      chamCenter?.view === "runner" &&
      !chamCenter?.session?.submittedResult
    ) {
      setStudioView("cham");
      return;
    }
    openPracticeHub(Number(matchPracticeRun[1]), { replaceHash: true, scrollTop: !fromHashChange });
    return;
  }
  const matchPracticePart = h.match(/^#\/practice\/part\/([1-7])(?:\/)?$/);
  if (matchPracticePart) {
    openPracticeHub(Number(matchPracticePart[1]), { skipHash: true, scrollTop: !fromHashChange });
    return;
  }
  const matchRun = h.match(/^#\/studio\/([^/]+)\/run(?:\/)?$/);
  if (matchRun) {
    const tid = decodeURIComponent(matchRun[1]);
    if (TESTS.some((t) => t.id === tid)) {
      enterStudioWorkspace(tid, { skipHash: true, scrollTop: !fromHashChange });
      return;
    }
  }
  const matchDetail = h.match(/^#\/studio\/([^/]+)(?:\/)?$/);
  if (matchDetail) {
    const tid = decodeURIComponent(matchDetail[1]);
    if (TESTS.some((t) => t.id === tid)) {
      openStudioDetail(tid, { skipHash: true });
      return;
    }
  }
  if (h === "#/studio" || h === "#studio") {
    openPracticeHub(null, { skipHash: true, scrollTop: !fromHashChange });
    return;
  }
  openHomeDashboard({ skipHash: true, scrollTop: !fromHashChange });
}

function renderStudioLobbyRoot() {
  const root = document.getElementById("studio-lobby-root");
  if (!root) return;
  if (studioLobbyState.view === "detail" && studioLobbyState.detailTestId) {
    root.innerHTML = renderStudioDetailHTML(studioLobbyState.detailTestId);
    bindStudioDetailEvents(root, studioLobbyState.detailTestId);
  } else {
    root.innerHTML = renderStudioLobbyHTML();
    bindStudioLobbyEvents(root);
  }
}

function renderStudioLobbyHTML() {
  const metas = TESTS.map(getStudioPackMeta);
  const totalQ = metas.reduce((sum, m) => sum + m.totalQ, 0);
  const totalAnswered = metas.reduce((sum, m) => sum + m.answeredQ, 0);
  const totalChecked = metas.reduce((sum, m) => sum + m.checkedQ, 0);
  const totalCorrect = metas.reduce((sum, m) => sum + m.correctQ, 0);
  const pctDone = totalQ > 0 ? Math.round((totalAnswered / totalQ) * 100) : 0;
  const accuracyText = totalChecked > 0 ? `${Math.round((totalCorrect / totalChecked) * 100)}%` : "Chưa chấm";

  const q = studioLobbyState.query.trim().toLowerCase();
  const pf = studioLobbyState.partFilter;
  const cf = studioLobbyState.cefrFilter || "ALL";
  const filtered = metas.filter((m) => {
    if (pf === "LISTENING" && m.isReading) return false;
    if (pf === "READING" && !m.isReading) return false;
    if (pf.startsWith("PART") && Number(pf.slice(4)) !== m.partNum) return false;
    if (cf !== "ALL") {
      if (["A12", "B12", "C12"].includes(cf)) {
        if (m.cefrGroup !== cf) return false;
      } else if (m.cefr !== cf) {
        return false;
      }
    }
    if (q) {
      const hay = `${m.eyebrow} ${m.cardTitle} ${m.shortTitle} ${m.description} ${m.cefr} ${m.toeicBand} ${m.tags.join(" ")} part ${m.partNum}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (studioLobbyState.sortOrder === "DIFF_ASC") {
    filtered.sort((a, b) => (a.difficultyScore || 0) - (b.difficultyScore || 0));
  } else if (studioLobbyState.sortOrder === "DIFF_DESC") {
    filtered.sort((a, b) => (b.difficultyScore || 0) - (a.difficultyScore || 0));
  }

  const filterChips = [
    { id: "ALL", label: "Tất cả" },
    { id: "PART1", label: "Part 1" },
    { id: "PART2", label: "Part 2" },
    { id: "PART4", label: "Part 4" },
    { id: "PART5", label: "Part 5" },
    { id: "PART6", label: "Part 6" },
    { id: "PART7", label: "Part 7" }
  ];

  const cefrChips = [
    { id: "ALL", label: "Tất cả" },
    { id: "A12", label: "A1–A2" },
    { id: "B12", label: "B1–B2" },
    { id: "C12", label: "C1–C2" }
  ];

  return `
    <div class="cham-container studio-lobby-shell">
      <div class="cham-overview-bar">
        <div class="cham-kpi-strip">
          <div class="cham-kpi-card">
            <span class="cham-kpi-icon">${getIcon("layers", 17)}</span>
            <div class="cham-kpi-body">
              <span class="cham-kpi-label">Bộ đề Luyện Sâu</span>
              <span class="cham-kpi-val">${metas.length} bộ</span>
            </div>
          </div>
          <div class="cham-kpi-card">
            <span class="cham-kpi-icon is-warm">${getIcon("clipboardList", 17)}</span>
            <div class="cham-kpi-body">
              <span class="cham-kpi-label">Ngân hàng câu</span>
              <span class="cham-kpi-val">${totalQ} câu</span>
            </div>
          </div>
          <div class="cham-kpi-card">
            <span class="cham-kpi-icon is-ok">${getIcon("checkCircle", 17)}</span>
            <div class="cham-kpi-body">
              <span class="cham-kpi-label">Tiến độ</span>
              <span class="cham-kpi-val">${totalAnswered}/${totalQ} (${pctDone}%)</span>
            </div>
          </div>
          <div class="cham-kpi-card">
            <span class="cham-kpi-icon ${totalChecked > 0 ? "is-ok" : "is-amber"}">${getIcon("award", 17)}</span>
            <div class="cham-kpi-body">
              <span class="cham-kpi-label">Chính xác</span>
              <span class="cham-kpi-val" style="color: ${totalChecked > 0 ? "var(--ok)" : "var(--warm)"};">${accuracyText}</span>
            </div>
          </div>
        </div>

        <div class="cham-overview-actions">
          <button type="button" class="cham-btn cham-btn-warm" id="studio-lobby-cbt-btn" title="Mở phòng thi CBT mô phỏng theo Part hoặc Full">
            ${getIcon("zap", 14)}
            <span>Thi thử CBT</span>
          </button>
        </div>
      </div>

      <div class="cham-filter-bar cham-filter-bar-enhanced studio-filter-bar-enhanced">
        <div class="cham-filter-top-row">
          <div class="cham-search-wrap">
            <span class="cham-search-icon">${getIcon("search", 16)}</span>
            <input type="search" class="cham-search-input" id="studio-lobby-search" placeholder="Tìm bộ đề (Part 1, ETS, B2...)" value="${escStudioHtml(studioLobbyState.query)}" />
          </div>

          <div class="cham-collection-pills" role="group" aria-label="Lọc theo Part">
            ${filterChips.map((chip) => `
              <button type="button" class="cham-col-pill ${pf === chip.id ? "is-active" : ""}" data-studio-filter="${chip.id}">
                ${chip.label}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="studio-cefr-filter-row cham-cefr-filter-row" role="group" aria-label="Lọc theo cấp độ CEFR">
          <div class="cham-cefr-pills-group">
            <span class="studio-cefr-filter-label">Trình độ:</span>
            ${cefrChips.map((c) => `
              <button type="button" class="cham-col-pill ${cf === c.id ? "is-active" : ""}" data-studio-cefr="${c.id}">
                ${c.label}
              </button>
            `).join("")}
          </div>

          <div class="cham-filter-selects">
            <select id="studio-cefr-exact-select" class="mat-select" aria-label="Chọn bậc CEFR chi tiết">
              <option value="ALL" ${["ALL", "A12", "B12", "C12"].includes(cf) ? "selected" : ""}>Mọi bậc</option>
              ${["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => `
                <option value="${lvl}" ${cf === lvl ? "selected" : ""}>Bậc ${lvl}</option>
              `).join("")}
            </select>
            <select id="studio-lobby-sort" class="mat-select" aria-label="Sắp xếp độ khó">
              <option value="DEFAULT" ${studioLobbyState.sortOrder === "DEFAULT" ? "selected" : ""}>Thứ tự mặc định</option>
              <option value="DIFF_ASC" ${studioLobbyState.sortOrder === "DIFF_ASC" ? "selected" : ""}>Độ khó: Dễ → Khó</option>
              <option value="DIFF_DESC" ${studioLobbyState.sortOrder === "DIFF_DESC" ? "selected" : ""}>Độ khó: Khó → Dễ</option>
            </select>
          </div>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="cham-card-panel" style="text-align: center; padding: 42px 20px;">
          <p style="font-size: 1rem; font-weight: 600; margin: 0 0 12px;">Không tìm thấy bộ đề nào khớp với bộ lọc hiện tại.</p>
          <button type="button" class="cham-btn cham-btn-primary" id="studio-clear-filter-btn">Xem tất cả ${metas.length} bộ đề</button>
        </div>
      ` : `
        <div class="cham-tests-grid">
          ${filtered.map((m) => {
            const pct = m.totalQ > 0 ? Math.round((m.answeredQ / m.totalQ) * 100) : 0;
            const statusText = m.answeredQ > 0 ? `${m.answeredQ}/${m.totalQ} câu (${pct}%)` : "Chưa làm";
            const diffScore = Math.round(m.difficultyScore || 60);
            return `
              <article class="cham-test-card studio-pack-card" data-pack-id="${escStudioHtml(m.id)}" data-cefr="${escStudioHtml(m.cefr)}">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <div class="cham-card-title-row">
                    <h3 class="cham-card-title">${escStudioHtml(m.cardTitle)}</h3>
                    <div class="cham-card-badges-right">
                      <span class="cefr-badge ${escStudioHtml(m.cefrToneClass)}" title="${escStudioHtml(m.cefrTitle)} · Mục tiêu ${escStudioHtml(m.toeicBand)}đ">${escStudioHtml(m.cefr)}</span>
                      ${m.checkedQ > 0 ? `
                        <span class="cham-best-badge">${getIcon("checkCircle", 12)} ${m.correctQ}/${m.checkedQ}</span>
                      ` : ''}
                    </div>
                  </div>

                  <div class="cham-card-meta">
                    <span class="cham-meta-time">${getIcon("clock", 13)} ~${m.estMinutes} phút</span>
                    <span class="cham-meta-sep" aria-hidden="true">·</span>
                    <span class="cham-meta-item">${getIcon("clipboardList", 13)} ${m.totalQ} câu</span>
                    <span class="cham-meta-sep" aria-hidden="true">·</span>
                    <span class="cham-meta-item">${getIcon("layers", 13)} ${m.talkCount} bài</span>
                  </div>

                  <div class="cham-diff-row">
                    <span class="cham-diff-label">Độ khó ${diffScore}/100</span>
                    <div class="cham-diff-bar"><span style="width: ${diffScore}%"></span></div>
                    <span class="cham-diff-band">${escStudioHtml(m.toeicBand)}đ</span>
                  </div>

                  <p class="studio-card-desc">${escStudioHtml(m.description)}</p>
                </div>

                <div class="cham-card-footer">
                  <span class="cham-card-subinfo" title="${escStudioHtml(m.eyebrow)} · ${escStudioHtml(m.tags.slice(0, 2).join(" · "))}">
                    <strong>${escStudioHtml(m.eyebrow)}</strong> · ${m.answeredQ > 0 ? `<span class="cham-subinfo-ok">${escStudioHtml(statusText)}</span>` : escStudioHtml(statusText)}
                  </span>
                  <button type="button" class="cham-btn cham-card-cta studio-open-detail-btn" data-pack-id="${escStudioHtml(m.id)}">
                    <span>Xem chi tiết</span>
                    ${getIcon("arrowRight", 14)}
                  </button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}

function bindStudioLobbyEvents(root) {
  const searchInp = root.querySelector("#studio-lobby-search");
  let isComposingStudio = false;
  const applyStudioQuery = (val) => {
    studioLobbyState.query = val;
    renderStudioLobbyRoot();
    const nextInp = document.getElementById("studio-lobby-search");
    if (nextInp) {
      nextInp.focus();
      nextInp.setSelectionRange(nextInp.value.length, nextInp.value.length);
    }
  };
  searchInp?.addEventListener("compositionstart", () => { isComposingStudio = true; });
  searchInp?.addEventListener("compositionend", (e) => {
    isComposingStudio = false;
    applyStudioQuery(e.target.value);
  });
  searchInp?.addEventListener("input", (e) => {
    if (e.isComposing || isComposingStudio) return;
    applyStudioQuery(e.target.value);
  });

  root.querySelectorAll("[data-studio-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      studioLobbyState.partFilter = btn.dataset.studioFilter || "ALL";
      renderStudioLobbyRoot();
    });
  });

  root.querySelectorAll("[data-studio-cefr]").forEach((btn) => {
    btn.addEventListener("click", () => {
      studioLobbyState.cefrFilter = btn.dataset.studioCefr || "ALL";
      renderStudioLobbyRoot();
    });
  });

  root.querySelector("#studio-cefr-exact-select")?.addEventListener("change", (e) => {
    studioLobbyState.cefrFilter = e.target.value || "ALL";
    renderStudioLobbyRoot();
  });

  root.querySelector("#studio-lobby-sort")?.addEventListener("change", (e) => {
    studioLobbyState.sortOrder = e.target.value || "DEFAULT";
    renderStudioLobbyRoot();
  });

  root.querySelector("#studio-lobby-cbt-btn")?.addEventListener("click", () => {
    openCbtExamDialog();
  });

  root.querySelector("#studio-clear-filter-btn")?.addEventListener("click", () => {
    studioLobbyState.query = "";
    studioLobbyState.partFilter = "ALL";
    studioLobbyState.cefrFilter = "ALL";
    studioLobbyState.sortOrder = "DEFAULT";
    renderStudioLobbyRoot();
  });

  root.querySelectorAll(".studio-open-detail-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = btn.dataset.packId;
      if (pid) openStudioDetail(pid);
    });
  });
}

function renderStudioDetailHTML(testId) {
  const test = TESTS.find((t) => t.id === testId) || TESTS[0];
  const meta = getStudioPackMeta(test);
  const talks = test.talks || [];
  const curTabIdx = state.currentIndex[test.id] || 0;
  const modeTab = studioLobbyState.detailModeTab;

  return `
    <div class="cham-container is-detail-container studio-detail-shell">
      <div class="cham-detail-header-card">
        <div class="studio-detail-breadcrumb">
          <button type="button" class="cham-btn" id="studio-detail-back-btn">
            ${getIcon("arrowLeft", 14)}
            <span>Quay lại Luyện tập</span>
          </button>
          <span class="cham-tag cham-tag-toeic">${escStudioHtml(meta.eyebrow)}</span>
          <span class="cefr-badge ${escStudioHtml(meta.cefrToneClass)}">${escStudioHtml(meta.cefrTitle)} · ${escStudioHtml(meta.toeicBand)}đ</span>
        </div>

        <h1 style="margin: 10px 0 6px; font-size: 1.38rem; font-weight: 600; letter-spacing: -0.01em; color: var(--text);">${escStudioHtml(meta.cardTitle)}</h1>
        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.55;">${escStudioHtml(meta.description)}</p>

        <div class="cham-card-meta" style="margin-top: 10px;">
          <span class="cham-meta-item">${getIcon("layers", 14)} ${meta.talkCount} bài luyện</span>
          <span class="cham-meta-item">${getIcon("clipboardList", 14)} ${meta.totalQ} câu hỏi</span>
          <span class="cham-meta-time">${getIcon("clock", 14)} Thời lượng ~${meta.estMinutes} phút</span>
          <span class="cham-meta-item">${getIcon("barChart3", 14)} Độ khó: <strong>${Math.round(meta.difficultyScore || 60)}/100</strong></span>
          <span class="cham-tag cham-tag-toeic">${meta.answeredQ > 0 ? `Tiến độ: ${meta.answeredQ}/${meta.totalQ} câu` : "Sẵn sàng luyện tập"}</span>
        </div>
      </div>

      ${meta.cefrSummary ? `
        <div class="cham-card-panel studio-cefr-insight-panel">
          <div class="studio-cefr-insight-head">
            <div>
              <strong>Phân tích Độ khó CEFR (${escStudioHtml(meta.cefr)} · Mục tiêu ${escStudioHtml(meta.toeicBand)}đ)</strong>
              <p>${escStudioHtml(meta.cefrSummary)}</p>
            </div>
            <button type="button" class="cham-btn" id="studio-detail-materials-btn">
              ${getIcon("bookOpen", 14)}
              <span>Ôn Hackers TOEIC liên quan</span>
            </button>
          </div>
        </div>
      ` : ""}

      <div class="cham-detail-grid">
        <div class="cham-card-panel">
          <div class="cham-mode-tabs" role="tablist" aria-label="Chọn chế độ luyện sâu">
            <button type="button" class="cham-mode-tab ${modeTab === "practice" ? "is-active" : ""}" data-studio-detail-mode="practice">
              ${getIcon("crosshair", 15)}
              <span>Chế độ Luyện tập</span>
            </button>
            <button type="button" class="cham-mode-tab ${modeTab === "study" ? "is-active" : ""}" data-studio-detail-mode="study">
              ${getIcon("sparkles", 15)}
              <span>Chế độ Giải mã AI</span>
            </button>
          </div>

          <div class="studio-detail-mode-desc">
            ${modeTab === "practice" ? `
              <h4>Tập trung làm bài chuẩn CBT</h4>
              <p>Ẩn giải thích &amp; phân tích bẫy khi đang chọn đáp án. Bạn có thể chuột phải để gạch đáp án nhiễu và bấm <strong>Chấm đề</strong> bất kỳ lúc nào.</p>
            ` : `
              <h4>Mở khóa toàn bộ giải thích &amp; Tapescript</h4>
              <p>Hiển thị trực tiếp Live Script đồng bộ từng câu, chép chính tả từ khóa, Shadowing và phân tích bẫy ETS cho từng câu hỏi.</p>
            `}
          </div>

          <ul class="studio-detail-checklist">
            ${meta.tags.map((tg) => `<li>${getIcon("checkCircle", 15)} <span>${escStudioHtml(tg)}</span></li>`).join("")}
          </ul>

          <div class="studio-detail-cta-row">
            <button type="button" class="cham-btn cham-btn-primary" id="studio-start-run-btn" style="flex: 1;">
              <span>Bắt đầu vào bài</span>
              ${getIcon("arrowRight", 15)}
            </button>
            <button type="button" class="cham-btn" id="studio-detail-cbt-btn" title="Thi mô phỏng CBT không giải thích">
              <span>Thi thử CBT</span>
            </button>
          </div>
        </div>

        <div class="cham-card-panel">
          <div class="studio-talks-panel-head">
            <h3>Danh sách ${talks.length} ${meta.isReading ? "bài đọc" : "bài nghe"} trong bộ đề</h3>
            <span class="muted-text" style="font-size: 0.82rem;">Chọn nhanh một bài để vào thẳng Studio</span>
          </div>

          <div class="studio-detail-talk-list">
            ${talks.map((tk, idx) => {
              const key = `${test.id}_${tk.range}`;
              const qs = tk.questions || [];
              const done = qs.filter((q) => Boolean(getAnswer(test.id, q.num))).length;
              const revealed = Boolean(state.checkedTalks[key] || modeTab === "study");
              const talkTitle = (!revealed && meta.partNum === 1)
                ? `Part 1 · Mô tả tranh ${tk.range}`
                : (tk.type || `Bài ${idx + 1}`).split(" (")[0];
              return `
                <button type="button" class="studio-detail-talk-row ${idx === curTabIdx ? "is-current" : ""}" data-run-talk-idx="${idx}">
                  <div class="studio-detail-talk-main">
                    <span class="studio-talk-badge">Câu ${escStudioHtml(tk.range)}</span>
                    <span class="studio-talk-name">${escStudioHtml(talkTitle)}</span>
                  </div>
                  <span class="studio-talk-progress ${done === qs.length && qs.length > 0 ? "is-complete" : ""}">
                    ${done}/${qs.length} câu
                  </span>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindStudioDetailEvents(root, testId) {
  root.querySelector("#studio-detail-back-btn")?.addEventListener("click", () => {
    openStudioLobby();
  });

  root.querySelectorAll("[data-studio-detail-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      studioLobbyState.detailModeTab = btn.dataset.studioDetailMode === "study" ? "study" : "practice";
      renderStudioLobbyRoot();
    });
  });

  root.querySelector("#studio-start-run-btn")?.addEventListener("click", () => {
    enterStudioWorkspace(testId, { mode: studioLobbyState.detailModeTab });
  });

  root.querySelector("#studio-detail-cbt-btn")?.addEventListener("click", () => {
    openCbtExamDialog();
  });

  root.querySelector("#studio-detail-materials-btn")?.addEventListener("click", () => {
    const testObj = TESTS.find((t) => t.id === testId) || TESTS[0];
    const meta = getStudioPackMeta(testObj);
    let targetTab = "books";
    if (meta?.partNum === 5 || meta?.partNum === 6) targetTab = "grammar";
    else if (meta?.partNum === 7 || meta?.partNum === 2) targetTab = "paraphrase";
    openMaterialsHub(targetTab);
  });

  root.querySelectorAll("[data-run-talk-idx]").forEach((row) => {
    row.addEventListener("click", () => {
      const idx = Number(row.dataset.runTalkIdx) || 0;
      enterStudioWorkspace(testId, {
        mode: studioLobbyState.detailModeTab,
        talkIndex: idx,
      });
    });
  });
}
let activeAudio = null;

export function pauseActiveAudio() {
  if (activeAudio && !activeAudio.paused) {
    try { activeAudio.pause(); } catch (_) {}
  }
  activeEngines.forEach((engine) => {
    try {
      if (engine.audio && !engine.audio.paused) engine.audio.pause();
    } catch (_) {}
  });
}

function syncActiveTestCache(testId) {
  if (!state.answers) state.answers = {};
  if (!state.confidence) state.confidence = {};
  if (!state.eliminations) state.eliminations = {};

  TESTS.forEach((t) => {
    if (t.id !== testId) {
      t.talks.forEach((talk) => {
        (talk.questions || []).forEach((q) => {
          delete state.answers[q.num];
          delete state.confidence[q.num];
          delete state.eliminations[q.num];
        });
      });
    }
  });

  const activeT = TESTS.find((t) => t.id === testId);
  if (activeT) {
    activeT.talks.forEach((talk) => {
      (talk.questions || []).forEach((q) => {
        const scopedKey = `${testId}_${q.num}`;
        if (state.answers[scopedKey] !== undefined) {
          state.answers[q.num] = state.answers[scopedKey];
        }
        if (state.confidence[scopedKey] !== undefined) {
          state.confidence[q.num] = state.confidence[scopedKey];
        }
        if (state.eliminations[scopedKey] !== undefined) {
          state.eliminations[q.num] = state.eliminations[scopedKey];
        }
      });
    });
  }
}

// Study & Focus Timers
let timerSeconds = 0;
let timerInterval = null;
let pomoSeconds = 25 * 60;
let pomoInterval = null;

// Skim Drill Active State
let skimCountdownTimer = null;

function ensureDynamicTestPanels() {
  const workspace = document.querySelector("main.workspace");
  if (!workspace) return;
  TESTS.forEach((t) => {
    if (state.currentIndex[t.id] === undefined) {
      state.currentIndex[t.id] = 0;
    }
    if (!document.getElementById(`panel-${t.id}`)) {
      const panel = document.createElement("div");
      panel.id = `panel-${t.id}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("hidden", "until-found");
      panel.innerHTML = `<div class="panel-inner" id="mount-${t.id}"></div>`;
      workspace.appendChild(panel);
    }
  });
  if (!TESTS.some((t) => t.id === state.activeTest) && TESTS[0]) {
    state.activeTest = TESTS[0].id;
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  ensureDynamicTestPanels();
  initThemeAndReader();
  const swApi = initServiceWorker();
  initTopBarControls();
  initGlobalShortcuts();
  initGlobalEliminationHandlers();
  initCommandPalette();

  window.addEventListener("beforeprint", () => {
    prepareWorksheetForPrint(false);
  });

  vocabSRS = new VocabSRS(TESTS);
  analyticsEngine = new AnalyticsEngine(TESTS);
  examSimulator = new ExamSimulator(TESTS, {
    onTalkChange: (talk, index) => {
      if (talk) {
        selectTab(talk.testId);
        state.currentIndex[talk.testId] = talk.talkIndex;
        saveState();
      }
      renderAll();
      // Auto play talk audio in CBT exam only for Listening talks
      if (!talk?.isReading) {
        setTimeout(() => {
          if (activeAudio) activeAudio.play().catch(() => {});
        }, 500);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    onFinish: (report) => {
      showExamReport(report);
    }
  });

  // Initialize v21 Home Dashboard & Practice by Part, Study Materials Hub & ChamTOEIC 35-Test Center
  dashboardPractice = initDashboardAndPractice({
    getStudioTests: () => TESTS,
    onOpenTests: () => openChamHub(),
    onOpenTestsFiltered: (filterOpts) => chamCenter?.openLibraryFiltered?.(filterOpts),
    onOpenTestDetail: (slug) => openChamHub(slug),
    onOpenPractice: () => openPracticeHub(null),
    onOpenPracticePart: (partNum) => openPracticeHub(partNum),
    onOpenMaterials: (tab = "books") => openMaterialsHub(tab),
    onOpenVocab: () => openFlashcardModal(),
    onOpenStudioPack: (packId) => openStudioDetail(packId),
    onResumeDraft: (draft) => {
      if (!draft?.slug) return;
      openChamHub(draft.slug, "run");
    },
    onStartPartPractice: async (cfg) => {
      return Boolean(await chamCenter?.startCustomPartSession(cfg));
    }
  });
  materialsCenter = initMaterialsCenter({
    onBackToStudio: () => openPracticeHub(null),
    onOpenChamHub: () => openChamHub(),
    onOpenChamSlug: (slug) => openChamHub(slug),
    onOpenStudioDetail: (testId) => openStudioDetail(testId),
    onOpenCefrMatrix: () => openAnalyticsModal("matrix")
  });
  chamCenter = initChamTestCenter({
    onOpen: () => {
      pauseActiveAudio();
      if (materialsCenter?.isActive?.()) materialsCenter.close();
      setStudioView("cham");
      if (examSimulator?.intermissionTimer) {
        clearInterval(examSimulator.intermissionTimer);
        examSimulator.intermissionTimer = null;
      }
    },
    onOpenMaterials: (tab = "books") => {
      openMaterialsHub(tab);
    },
    onOpenPractice: () => openPracticeHub(null),
    onOpenPracticePart: (partNum) => openPracticeHub(partNum),
    onHistoryUpdated: () => {
      if (studioLobbyState.view === "home") dashboardPractice?.renderHome();
      else if (studioLobbyState.view === "practice") dashboardPractice?.renderPractice();
    },
    onExitToStudio: (info = {}) => {
      if (info.fromHashChange) {
        applyStudioHashRoute(true);
      } else {
        openPracticeHub(null, { skipHash: true });
      }
    }
  });
  window.addEventListener("hashchange", () => applyStudioHashRoute(true));
  if (!chamCenter?.isActive) {
    applyStudioHashRoute(true);
  }
  window.__app = {
    state,
    renderAll,
    openHomeDashboard,
    openPracticeHub,
    openStudioLobby,
    openStudioDetail,
    enterStudioWorkspace,
    openChamHub,
    openMaterialsHub,
    dashboardPractice,
    materialsCenter,
    showToast,
    examSimulator,
    vocabSRS,
    analyticsEngine,
    chamCenter,
    activeEngines,
    getAnswer,
    setAnswer,
    openShortcutsModal,
    openFlashcardModal,
    openStrategyModal,
    openAnalyticsModal,
    openReaderSettingsModal,
    getAllMediaUrls: swApi.getAllMediaUrls,
    totalMediaCount: swApi.totalMediaCount
  };

  // Initialize VocabSRS IndexedDB hydration in background without blocking initial UI paint
  vocabSRS.init().catch((err) => {
    console.warn("VocabSRS background init warning:", err);
  });
});

/* ============================================================
   Theme & Reader Settings
   ============================================================ */
function syncAvatarMenuState() {
  const themeLbl = document.getElementById("menu-theme-label");
  if (themeLbl) themeLbl.textContent = state.theme === "dark" ? "Tối" : "Sáng";
  const goalLbl = document.getElementById("menu-target-score-val");
  if (goalLbl) goalLbl.textContent = String(state.targetScore || 750);
  document.querySelectorAll("[data-quick-fontsize]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.quickFontsize === (state.readerSettings?.fontSize || "md"));
  });
}

function closeAvatarMenu() {
  const pop = document.getElementById("user-menu-popover");
  const trg = document.getElementById("user-menu-trigger");
  if (pop) pop.hidden = true;
  if (trg) trg.setAttribute("aria-expanded", "false");
}

function cycleStudioTheme() {
  // Toggle: light (Light Blue) <-> dark
  state.theme = state.theme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", state.theme);
  saveState();
  syncAvatarMenuState();
  const themeNames = { light: "Xanh Sáng (Light Blue)", dark: "Tối Slate" };
  showToast(`Đã chuyển sang giao diện: ${themeNames[state.theme] || state.theme.toUpperCase()}`);
}

function initThemeAndReader() {
  document.documentElement.setAttribute("data-theme", state.theme);
  applyReaderSettings();
  syncAvatarMenuState();

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    cycleStudioTheme();
  });
  document.getElementById("theme-toggle-runner")?.addEventListener("click", cycleStudioTheme);

  // Quick font size buttons inside avatar menu
  document.querySelectorAll("[data-quick-fontsize]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.readerSettings.fontSize = btn.dataset.quickFontsize || "md";
      applyReaderSettings();
      saveState();
      syncAvatarMenuState();
    });
  });

  // Avatar Dropdown toggle + outside click / Esc dismissal
  const avatarTrigger = document.getElementById("user-menu-trigger");
  const avatarPopover = document.getElementById("user-menu-popover");
  avatarTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!avatarPopover) return;
    const willOpen = avatarPopover.hidden;
    avatarPopover.hidden = !willOpen;
    avatarTrigger.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) syncAvatarMenuState();
  });
  document.addEventListener("click", (e) => {
    if (avatarPopover && !avatarPopover.hidden && !e.target.closest("#user-menu-wrap")) {
      closeAvatarMenu();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && avatarPopover && !avatarPopover.hidden) {
      closeAvatarMenu();
    }
  });

  // Reader Settings Button (Avatar Menu + Focused Runner Header)
  document.getElementById("reader-settings-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openReaderSettingsModal();
  });
  document.getElementById("reader-settings-btn-runner")?.addEventListener("click", () => {
    openReaderSettingsModal();
  });
}

// Global Audio Playback Preference Helpers (Intro & Questions Reading)
export function setPlayIntroState(enabled) {
  state.audioSettings.playIntro = Boolean(enabled);
  saveState();
  activeEngines.forEach((eng) => eng.setPlayIntro(state.audioSettings.playIntro));
  document.querySelectorAll(".toggle-intro-btn").forEach((b) => {
    b.classList.toggle("is-active", state.audioSettings.playIntro);
    b.innerHTML = `<span>Intro: ${state.audioSettings.playIntro ? 'BẬT' : 'TẮT'}</span>`;
  });
  const focusIntroBtn = document.getElementById("focus-toggle-intro-btn");
  if (focusIntroBtn) {
    focusIntroBtn.classList.toggle("is-active", state.audioSettings.playIntro);
  }
  const focusIntroLabel = document.getElementById("focus-intro-label");
  if (focusIntroLabel) {
    focusIntroLabel.textContent = `Intro: ${state.audioSettings.playIntro ? 'BẬT' : 'TẮT'}`;
  }
  const introCheck = document.getElementById("toggle-intro-setting");
  if (introCheck) {
    introCheck.checked = state.audioSettings.playIntro;
  }
  const dockIntroBtn = document.getElementById("dock-toggle-intro");
  if (dockIntroBtn) {
    dockIntroBtn.classList.toggle("is-active", state.audioSettings.playIntro);
    dockIntroBtn.title = `Đọc intro bài: ${state.audioSettings.playIntro ? 'BẬT' : 'TẮT'}`;
  }
}

export function setPlayQuestionsState(enabled) {
  state.audioSettings.playQuestions = Boolean(enabled);
  saveState();
  activeEngines.forEach((eng) => eng.setPlayQuestions(state.audioSettings.playQuestions));
  document.querySelectorAll(".toggle-questions-btn").forEach((b) => {
    b.classList.toggle("is-active", state.audioSettings.playQuestions);
    b.innerHTML = `<span>Đọc câu hỏi: ${state.audioSettings.playQuestions ? 'BẬT' : 'TẮT'}</span>`;
  });
  const focusQBtn = document.getElementById("focus-toggle-questions-btn");
  if (focusQBtn) {
    focusQBtn.classList.toggle("is-active", state.audioSettings.playQuestions);
  }
  const focusQLabel = document.getElementById("focus-questions-label");
  if (focusQLabel) {
    focusQLabel.textContent = `Đọc câu hỏi: ${state.audioSettings.playQuestions ? 'BẬT' : 'TẮT'}`;
  }
  const qCheck = document.getElementById("toggle-questions-setting");
  if (qCheck) {
    qCheck.checked = state.audioSettings.playQuestions;
  }
  const dockQBtn = document.getElementById("dock-toggle-questions");
  if (dockQBtn) {
    dockQBtn.classList.toggle("is-active", state.audioSettings.playQuestions);
    dockQBtn.title = `Đọc câu hỏi: ${state.audioSettings.playQuestions ? 'BẬT' : 'TẮT'}`;
  }
}

if (typeof window !== "undefined") {
  window.setPlayIntroState = setPlayIntroState;
  window.setPlayQuestionsState = setPlayQuestionsState;
}

function applyReaderSettings() {
  const { fontSize, lineHeight, reducedMotion } = state.readerSettings;
  const targets = [document.documentElement, document.body];
  targets.forEach((el) => {
    el.className = el.className.replace(/font-size-\w+|line-height-\w+/g, "").trim();
    el.classList.add(`font-size-${fontSize}`, `line-height-${lineHeight}`);
    el.classList.toggle("reduced-motion", Boolean(reducedMotion));
  });
}

function openReaderSettingsModal() {
  const dlg = document.getElementById("reader-dialog");
  if (!dlg) return;

  const isChamActive = Boolean(chamCenter?.isActive || document.body.classList.contains("is-cham-hub-active"));
  const isMaterialsActive = Boolean(materialsCenter?.isActive?.() || document.body.classList.contains("is-materials-hub-active"));
  const inWorkspace = !isChamActive && !isMaterialsActive && studioLobbyState.view === "workspace";
  const studioOnlySec = document.getElementById("reader-studio-only-section");
  if (studioOnlySec) {
    studioOnlySec.style.display = inWorkspace ? "" : "none";
  }
  const printWorksheetBtn = document.getElementById("print-worksheet-btn");
  if (printWorksheetBtn) {
    printWorksheetBtn.style.display = inWorkspace ? "" : "none";
  }

  // Theme Group
  const themeGroup = document.getElementById("reader-theme-group");
  if (themeGroup) {
    themeGroup.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.themeVal === state.theme);
      btn.onclick = () => {
        state.theme = btn.dataset.themeVal === "dark" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", state.theme);
        saveState();
        syncAvatarMenuState();
        themeGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.themeVal === state.theme));
        const themeNames = { light: "Xanh Sáng (Light Blue)", dark: "Tối Slate" };
        showToast(`Đã áp dụng giao diện: ${themeNames[state.theme] || state.theme.toUpperCase()}`);
      };
    });
  }

  // Component Toggles
  const transcriptCheck = document.getElementById("toggle-transcript-setting");
  if (transcriptCheck) {
    transcriptCheck.checked = Boolean(state.showTranscript);
    transcriptCheck.onchange = (e) => {
      toggleTranscript(e.target.checked);
    };
  }

  const waveformCheck = document.getElementById("toggle-waveform-setting");
  if (waveformCheck) {
    waveformCheck.checked = Boolean(state.showWaveform);
    waveformCheck.onchange = (e) => {
      state.showWaveform = e.target.checked;
      saveState();
      document.querySelectorAll(".player-shell").forEach((shell) => {
        shell.classList.toggle("compact-audio", !state.showWaveform);
      });
      showToast(state.showWaveform ? "Đã bật dạng sóng âm Waveform" : "Đã bật thanh tua nhỏ gọn");
    };
  }

  const confidenceCheck = document.getElementById("toggle-confidence-setting");
  if (confidenceCheck) {
    confidenceCheck.checked = Boolean(state.showConfidence);
    confidenceCheck.onchange = (e) => {
      state.showConfidence = e.target.checked;
      saveState();
      document.querySelectorAll(".questions-container").forEach((q) => {
        q.classList.toggle("hide-confidence", !state.showConfidence);
      });
      showToast(state.showConfidence ? "Đã hiển thị thanh chọn độ tự tin" : "Đã ẩn thanh độ tự tin");
    };
  }

  // Audio Playback Preferences (Intro & Question Reading Toggles)
  const introCheck = document.getElementById("toggle-intro-setting");
  if (introCheck) {
    introCheck.checked = Boolean(state.audioSettings.playIntro);
    introCheck.onchange = (e) => {
      setPlayIntroState(e.target.checked);
      showToast(state.audioSettings.playIntro ? "Đã BẬT đọc phần giới thiệu bài nói!" : "Đã TẮT đọc phần giới thiệu (Bỏ qua 5s mở đầu)!");
    };
  }

  const questionsCheck = document.getElementById("toggle-questions-setting");
  if (questionsCheck) {
    questionsCheck.checked = Boolean(state.audioSettings.playQuestions);
    questionsCheck.onchange = (e) => {
      setPlayQuestionsState(e.target.checked);
      showToast(state.audioSettings.playQuestions ? "Đã BẬT đọc câu hỏi sau bài nghe!" : "Đã TẮT đọc câu hỏi (Dừng lại ngay sau bài nói)!");
    };
  }

  const sizeGroup = document.getElementById("reader-font-size-group");
  const lhGroup = document.getElementById("reader-line-height-group");
  const motionCheck = document.getElementById("reader-reduced-motion");

  if (sizeGroup) {
    sizeGroup.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.size === state.readerSettings.fontSize);
      btn.onclick = () => {
        state.readerSettings.fontSize = btn.dataset.size;
        applyReaderSettings();
        saveState();
        syncAvatarMenuState();
        sizeGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      };
    });
  }

  if (lhGroup) {
    lhGroup.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lh === state.readerSettings.lineHeight);
      btn.onclick = () => {
        state.readerSettings.lineHeight = btn.dataset.lh;
        applyReaderSettings();
        saveState();
        lhGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      };
    });
  }

  if (motionCheck) {
    motionCheck.checked = Boolean(state.readerSettings.reducedMotion);
    motionCheck.onchange = (e) => {
      state.readerSettings.reducedMotion = e.target.checked;
      applyReaderSettings();
      saveState();
    };
  }

  const openShortcutsBtn = document.getElementById("open-shortcuts-btn");
  if (openShortcutsBtn) {
    openShortcutsBtn.onclick = () => {
      dlg.close();
      openShortcutsModal();
    };
  }

  dlg.showModal();
}

export function openShortcutsModal() {
  const dlg = document.getElementById("shortcuts-dialog");
  if (!dlg) return;
  if (!dlg.open) dlg.showModal();
}

/* ============================================================
   Service Worker & Cache Offline
   ============================================================ */
function initServiceWorker() {
  const cacheBadge = document.getElementById("cache-badge");
  const swStatusText = document.getElementById("sw-status-text");
  const cacheSectionHeading = document.getElementById("cache-section-heading");
  const cacheProgressWrap = document.getElementById("cache-progress-wrap");
  const cacheProgressFill = document.getElementById("cache-progress-fill");
  const cacheDialog = document.getElementById("cache-dialog");

  function getAllMediaUrls() {
    const seen = new Set();
    const urls = [];
    TESTS.forEach((t) => {
      (t.talks || []).forEach((talk) => {
        if (talk.audio && !seen.has(talk.audio)) {
          seen.add(talk.audio);
          urls.push(talk.audio);
        }
        if (talk.image && !seen.has(talk.image)) {
          seen.add(talk.image);
          urls.push(talk.image);
        }
      });
    });
    return urls;
  }

  const allMediaUrls = getAllMediaUrls();
  const TOTAL_MEDIA = allMediaUrls.length;
  const audioCount = allMediaUrls.filter((u) => /\.mp3(\?|$)/i.test(u)).length;
  const imageCount = TOTAL_MEDIA - audioCount;

  if (cacheSectionHeading) {
    cacheSectionHeading.textContent = `1. Lưu Cache chạy Offline (${audioCount} MP3 Audio + ${imageCount} Ảnh minh họa — Tổng ${TOTAL_MEDIA} tệp)`;
  }

  function getSwTarget() {
    if (navigator.serviceWorker.controller) {
      return Promise.resolve(navigator.serviceWorker.controller);
    }
    return navigator.serviceWorker.ready.then((reg) => reg.active || reg.waiting || reg.installing);
  }

  function requestCacheStatus() {
    const urls = getAllMediaUrls();
    getSwTarget().then((sw) => {
      if (sw) sw.postMessage({ type: "GET_CACHE_STATUS", urls });
    });
  }

  if ("serviceWorker" in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController && sessionStorage.getItem("nt_sw_reloaded") !== "v22.0") {
        sessionStorage.setItem("nt_sw_reloaded", "v22.0");
        window.location.reload();
      }
    });
    const warmChamJsonBank = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      const tests = window.CHAM_TOEIC_CATALOG?.tests || [];
      // Prioritize core ETS Full Tests + Entry Test + top Mini Tests (fast offline readiness without flooding 300+ requests on first boot)
      const priority = [];
      const rest = [];
      tests.forEach((t) => {
        const u = t.dataFile || `data/cham_tests/${t.slug}.json`;
        if (!u) return;
        if (t.slug === "test-au-vao-01" || t.slug.startsWith("ets") || t.slug === "thi-thu-season-3") {
          priority.push(u);
        } else if (t.testType === "full" || t.testType === "mini") {
          rest.push(u);
        }
      });
      const jsonUrls = [...priority, ...rest.slice(0, 20)];
      if (!jsonUrls.length) return;
      getSwTarget().then((sw) => {
        if (sw) sw.postMessage({ type: "CACHE_CHAM_JSON_BANK", urls: jsonUrls });
      }).catch(() => {});
    };
    navigator.serviceWorker.register("sw.js?v=22.5", { updateViaCache: "none" }).then((reg) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            nw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
      reg.update().catch(() => {});
      navigator.serviceWorker.ready.then(() => {
        requestCacheStatus();
        // Gently warm all 35 local test JSON files into CHAM_JSON_CACHE after initial paint
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(() => warmChamJsonBank(), { timeout: 2500 });
        } else {
          setTimeout(warmChamJsonBank, 1500);
        }
      });
    }).catch(() => {
      if (swStatusText) swStatusText.textContent = "Không thể đăng ký Service Worker.";
    });

    window.addEventListener("offline", () => {
      showToast("Bạn đang ngoại tuyến — các đề & tài liệu đã lưu đệm vẫn hoạt động bình thường.", "info");
    });
    window.addEventListener("online", () => {
      showToast("Đã khôi phục kết nối mạng!", "success");
      warmChamJsonBank();
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      const msg = event.data || {};
      const dynTotal = getAllMediaUrls().length || TOTAL_MEDIA;
      if (msg.type === "CACHE_STATUS") {
        const cachedNum = Math.min(msg.mediaCached, dynTotal);
        if (cacheBadge) cacheBadge.textContent = `${cachedNum}/${dynTotal}`;
        if (swStatusText) {
          swStatusText.textContent = cachedNum >= dynTotal
            ? `Đã lưu Cache đầy đủ ${cachedNum}/${dynTotal} file media. Sẵn sàng học Offline 100%!`
            : `Đã lưu Cache ${cachedNum}/${dynTotal} file media.`;
        }
      } else if (msg.type === "CACHE_PROGRESS") {
        if (cacheProgressWrap) cacheProgressWrap.hidden = false;
        const pct = msg.total ? Math.round((msg.done / msg.total) * 100) : 0;
        if (cacheProgressFill) cacheProgressFill.style.width = `${pct}%`;
        if (swStatusText) swStatusText.textContent = `Đang tải Offline: ${msg.done}/${msg.total} file (${pct}%)...`;
      } else if (msg.type === "CACHE_COMPLETE") {
        const failedCnt = Number(msg.failed || 0);
        if (cacheProgressFill) cacheProgressFill.style.width = failedCnt > 0 && dynTotal > 0 ? `${Math.round((msg.total / dynTotal) * 100)}%` : "100%";
        if (cacheBadge) cacheBadge.textContent = `${msg.total}/${dynTotal}`;
        if (failedCnt > 0) {
          if (swStatusText) swStatusText.textContent = `Đã lưu ${msg.total}/${dynTotal} file media (${failedCnt} file lỗi mạng — bấm tải lại khi có kết nối).`;
          showToast(`Đã lưu ${msg.total}/${dynTotal} file (${failedCnt} lỗi mạng).`, "info");
        } else {
          if (swStatusText) swStatusText.textContent = `Hoàn tất! Đã lưu trọn vẹn ${msg.total}/${dynTotal} file media để học Offline!`;
          showToast("Đã lưu Offline 100% toàn bộ âm thanh và ảnh!", "success");
        }
      } else if (msg.type === "CACHE_CLEARED") {
        if (cacheProgressWrap) cacheProgressWrap.hidden = true;
        if (cacheProgressFill) cacheProgressFill.style.width = "0%";
        if (cacheBadge) cacheBadge.textContent = `0/${dynTotal}`;
        if (swStatusText) swStatusText.textContent = "Đã xóa toàn bộ bộ nhớ Cache.";
        showToast("Đã xóa bộ nhớ Cache");
      }
    });
  }

  document.getElementById("open-cache-btn")?.addEventListener("click", () => {
    const readerDlg = document.getElementById("reader-dialog");
    if (readerDlg?.open) readerDlg.close();
    requestCacheStatus();
    cacheDialog?.showModal();
  });

  document.getElementById("cache-all-btn")?.addEventListener("click", () => {
    const urls = getAllMediaUrls();
    getSwTarget().then((sw) => {
      if (sw) {
        if (cacheProgressWrap) cacheProgressWrap.hidden = false;
        if (cacheProgressFill) cacheProgressFill.style.width = "0%";
        sw.postMessage({ type: "CACHE_MEDIA_LIST", urls });
      }
    });
  });

  document.getElementById("clear-cache-btn")?.addEventListener("click", () => {
    getSwTarget().then((sw) => {
      if (sw) sw.postMessage({ type: "CLEAR_MEDIA_CACHE" });
    });
  });

  document.getElementById("export-state-btn")?.addEventListener("click", () => {
    let chamHistory = null;
    let chamDraft = null;
    let materialsGrammarQuiz = null;
    try { chamHistory = JSON.parse(localStorage.getItem("neuro_cham_toeic_history_v1") || "null"); } catch {}
    try { chamDraft = JSON.parse(localStorage.getItem("neuro_cham_toeic_draft_v1") || "null"); } catch {}
    try { materialsGrammarQuiz = JSON.parse(localStorage.getItem("neuro_toeic_materials_quiz_v1") || "null"); } catch {}
    const payload = {
      ...state,
      __backupVersion: 2,
      __exportedAt: new Date().toISOString(),
      __chamHistory: chamHistory,
      __chamDraft: chamDraft,
      __materialsGrammarQuiz: materialsGrammarQuiz
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cham-toeic-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    const totalBankForToast = (window.CHAM_TOEIC_CATALOG?.tests?.length || 302) + TESTS.length;
    showToast(`Đã xuất tệp sao lưu toàn bộ tiến độ (${totalBankForToast} đề + mục tiêu)!`, "success");
  });

  document.getElementById("import-state-input")?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Invalid backup object");
        }
        const {
          __backupVersion,
          __exportedAt,
          __chamHistory,
          __chamDraft,
          __materialsGrammarQuiz,
          ...studioState
        } = parsed;
        if (!["light", "dark"].includes(studioState.theme)) {
          studioState.theme = "light";
        }
        Object.assign(state, studioState);
        saveState();
        if (__chamHistory && typeof __chamHistory === "object" && typeof __chamHistory.attemptsBySlug === "object") {
          try { localStorage.setItem("neuro_cham_toeic_history_v1", JSON.stringify(__chamHistory)); } catch {}
          chamCenter?.reloadHistory?.();
        }
        if (__chamDraft && typeof __chamDraft === "object") {
          try { localStorage.setItem("neuro_cham_toeic_draft_v1", JSON.stringify(__chamDraft)); } catch {}
        }
        if (__materialsGrammarQuiz && typeof __materialsGrammarQuiz === "object") {
          try { localStorage.setItem("neuro_toeic_materials_quiz_v1", JSON.stringify(__materialsGrammarQuiz)); } catch {}
          materialsCenter?.reloadQuizAnswers?.();
        }
        document.documentElement.setAttribute("data-theme", state.theme || "light");
        applyReaderSettings();
        syncAvatarMenuState();
        renderAll();
        if (studioLobbyState.view === "home") dashboardPractice?.renderHome();
        else if (studioLobbyState.view === "practice") dashboardPractice?.renderPractice();
        showToast("Khôi phục toàn bộ tiến độ thành công!", "success");
      } catch {
        showToast("Tệp JSON không hợp lệ.", "bad");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  return { getAllMediaUrls, totalMediaCount: TOTAL_MEDIA };
}

/* ============================================================
   Top Bar Controls & Modes
   ============================================================ */
function initTopBarControls() {
  // Test Tab Buttons
  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      const testId = tab.dataset.test;
      selectTab(testId);
    });
  });

  // Mode Buttons (topbar segmented group only, never dialog segmented buttons!)
  document.querySelectorAll(".topbar .seg-btn[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      if (mode === "exam") {
        openCbtExamDialog();
        return;
      }
      if (examSimulator.isActive) {
        examSimulator.exitEarly();
      }
      state.mode = mode;
      saveState();
      document.querySelectorAll(".topbar .seg-btn[data-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
      renderAll();
      showToast(`Chế độ: ${mode === "practice" ? "Làm bài (CBT)" : "Giải mã & Phân tích"}`);
    });
  });

  // Print Worksheet Button (accessible inside #reader-dialog)
  document.getElementById("print-worksheet-btn")?.addEventListener("click", () => {
    const readerDlg = document.getElementById("reader-dialog");
    if (readerDlg?.open) readerDlg.close();
    prepareWorksheetForPrint();
  });

  // Timer
  const timerDisplay = document.getElementById("timer-display");
  const timerToggle = document.getElementById("timer-toggle");
  const timerReset = document.getElementById("timer-reset");

  function renderTimer() {
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
    const s = String(timerSeconds % 60).padStart(2, "0");
    if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
  }

  timerToggle?.addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerToggle.innerHTML = getIcon("play", 12);
    } else {
      timerInterval = setInterval(() => {
        timerSeconds++;
        renderTimer();
      }, 1000);
      timerToggle.innerHTML = getIcon("pause", 12);
    }
  });

  timerReset?.addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerSeconds = 0;
    if (timerToggle) timerToggle.innerHTML = getIcon("play", 12);
    renderTimer();
  });

  // Topbar Transcript Toggle Button
  document.getElementById("topbar-transcript-toggle")?.addEventListener("click", () => {
    toggleTranscript();
  });

  // Focus Mode Button
  document.getElementById("focus-toggle-btn")?.addEventListener("click", () => {
    toggleFocusMode();
  });

  initFocusTheaterBar();

  // v21.0 Primary 4-Item Navigation + Runner Back Button
  document.getElementById("nav-home-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openHomeDashboard();
  });
  document.getElementById("nav-practice-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openPracticeHub(null);
  });
  document.getElementById("nav-tests-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openChamHub();
  });
  document.getElementById("nav-materials-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openMaterialsHub("books");
  });
  document.getElementById("studio-brand-logo")?.addEventListener("click", () => {
    closeAvatarMenu();
    openHomeDashboard();
  });
  document.getElementById("studio-back-lobby-btn")?.addEventListener("click", () => {
    openPracticeHub(null);
  });
  document.getElementById("runner-grade-btn")?.addEventListener("click", () => {
    gradeCurrentTest();
  });

  // Avatar Menu Modals (Strategy, Vocab SRS, Analytics & CEFR Matrix)
  document.getElementById("open-strategy-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openStrategyModal();
  });

  document.getElementById("open-vocab-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openFlashcardModal();
  });

  document.getElementById("open-analytics-btn")?.addEventListener("click", () => {
    closeAvatarMenu();
    openAnalyticsModal("overview");
  });

  // CBT Exam Scope Group in dialog (dynamically inject Part 5 & 6 scopes if present while keeping data-scope="all" = 151 câu)
  const cbtDialog = document.getElementById("cbt-exam-dialog");
  const scopeGroup = document.getElementById("cbt-exam-scope-group");
  if (scopeGroup && EXTRA_PART56_TESTS.length > 0) {
    const allBtn = scopeGroup.querySelector('button[data-scope="all"]');
    EXTRA_PART56_TESTS.forEach((t) => {
      if (!scopeGroup.querySelector(`button[data-scope="${t.id}"]`)) {
        const qCnt = (t.talks || []).reduce((acc, tk) => acc + (tk.questions?.length || 0), 0);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "seg-btn";
        b.dataset.scope = t.id;
        b.textContent = `${t.shortLabel || t.shortTitle || t.title.split(" (")[0]} (${qCnt} câu)`;
        if (allBtn) scopeGroup.insertBefore(b, allBtn);
        else scopeGroup.appendChild(b);
      }
    });
    if (!scopeGroup.querySelector('button[data-scope="all_full"]')) {
      const totalAllQs = TESTS.reduce((sum, t) => sum + (t.talks || []).reduce((a, tk) => a + (tk.questions?.length || 0), 0), 0);
      const fullBtn = document.createElement("button");
      fullBtn.type = "button";
      fullBtn.className = "seg-btn";
      fullBtn.dataset.scope = "all_full";
      fullBtn.textContent = `Full Toàn Diện P1–P7 (${totalAllQs} câu)`;
      scopeGroup.appendChild(fullBtn);
    }
  }

  let chosenScope = "ets2019_t6";
  cbtDialog?.querySelectorAll("#cbt-exam-scope-group .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      cbtDialog.querySelectorAll("#cbt-exam-scope-group .seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      chosenScope = btn.dataset.scope;
    });
  });

  document.getElementById("start-cbt-exam-btn")?.addEventListener("click", () => {
    cbtDialog?.close();
    startCbtExam(chosenScope);
  });
}

function openCbtExamDialog() {
  const dlg = document.getElementById("cbt-exam-dialog");
  if (dlg) dlg.showModal();
}

function startCbtExam(scope = "ets2019_t6") {
  state.cbtPaletteOpen = false;
  examSimulator.startExam(scope);
  const firstTalk = examSimulator.getCurrentTalk();
  if (firstTalk) {
    selectTab(firstTalk.testId);
    state.currentIndex[firstTalk.testId] = firstTalk.talkIndex;
    saveState();
  }
  document.querySelectorAll(".topbar .seg-btn[data-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === "exam"));
  showToast("Đã bắt đầu phòng thi CBT! Chúc bạn làm bài đạt điểm cao!", "info");
  renderAll();

  // Auto-play the first talk only for Listening sections
  if (!firstTalk?.isReading) {
    setTimeout(() => {
      if (activeAudio) activeAudio.play().catch(() => {});
    }, 600);
  }
}

function selectTab(testId, opts = {}) {
  const { enterWorkspace = true, skipHash = false, replaceHash = false } = opts;
  pauseActiveAudio();
  state.activeTest = testId;
  syncActiveTestCache(testId);
  if (isCurrentTestReading(testId)) {
    state.showTranscript = Boolean(state.readingTranscript ?? false);
  } else {
    state.showTranscript = state.listeningTranscript !== undefined ? Boolean(state.listeningTranscript) : true;
  }
  saveState();

  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    const isSelected = tab.dataset.test === testId;
    tab.setAttribute("aria-selected", String(isSelected));
  });

  document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    const match = panel.id === `panel-${testId}`;
    if (match) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "until-found");
      const inactiveMount = panel.querySelector(".panel-inner");
      if (inactiveMount && inactiveMount.innerHTML) {
        inactiveMount.innerHTML = "";
      }
    }
  });

  const runnerTitleEl = document.getElementById("studio-runner-pack-title");
  const packObj = TESTS.find((t) => t.id === testId);
  if (runnerTitleEl && packObj) {
    const meta = getStudioPackMeta(packObj);
    runnerTitleEl.textContent = `${meta.partLabel} · ${meta.shortTitle} (${meta.totalQ} câu)`;
  }

  if (enterWorkspace) {
    setStudioView("workspace");
    if (!skipHash) {
      syncStudioHash(`#/studio/${encodeURIComponent(testId)}/run`, Boolean(replaceHash));
    }
  }

  renderAll();
  updateTranscriptVisibilityUI();
}

function toggleTranscript(forceState) {
  if (typeof forceState === "boolean") {
    state.showTranscript = forceState;
  } else {
    state.showTranscript = !state.showTranscript;
  }
  const isReading = isCurrentTestReading();
  if (isReading) {
    state.readingTranscript = state.showTranscript;
  } else {
    state.listeningTranscript = state.showTranscript;
  }
  saveState();
  updateTranscriptVisibilityUI();
  if (isReading) {
    showToast(state.showTranscript ? "Đã mở Bảng giải thích & Dịch (Phía bên phải)" : "Đã mở rộng không gian Đọc hiểu 2 cột (Bài đọc + Câu hỏi)!");
  } else {
    showToast(state.showTranscript ? "Đã mở Tapescript & Lời dịch (Phía bên phải)" : "Đã ẩn Tapescript. Màn hình câu hỏi mở rộng tối đa!");
  }
}

function updateTranscriptVisibilityUI() {
  const isShown = Boolean(state.showTranscript);
  const isExamMode = state.mode === "exam" && Boolean(examSimulator?.isActive);
  const effectiveShown = isShown && !isExamMode;
  const isReading = isCurrentTestReading();
  document.querySelectorAll(".talk-split-container").forEach((el) => {
    el.classList.toggle("transcript-visible", effectiveShown);
    el.classList.toggle("transcript-hidden", !effectiveShown);
  });
  document.querySelectorAll(".talk-right-pane").forEach((el) => {
    el.style.display = effectiveShown ? "" : "none";
  });
  document.querySelectorAll(".split-resizer").forEach((el) => {
    el.style.display = effectiveShown ? "" : "none";
  });

  const topbarBtnText = document.getElementById("topbar-transcript-label");
  if (topbarBtnText) {
    topbarBtnText.textContent = isReading
      ? (isShown ? "Ẩn Giải thích" : "Giải thích")
      : (isShown ? "Ẩn Script" : "Tapescript");
  }
  const topbarBtn = document.getElementById("topbar-transcript-toggle");
  if (topbarBtn) {
    topbarBtn.classList.toggle("is-active", isShown);
  }

  document.querySelectorAll(".toggle-transcript-btn").forEach((cardToggleBtn) => {
    const cardIsReading = Boolean(cardToggleBtn.closest(".talk-card")?.classList.contains("is-reading-card"));
    cardToggleBtn.innerHTML = cardIsReading
      ? (effectiveShown ? `${getIcon("x", 13)} <span>Ẩn Giải thích</span>` : `${getIcon("fileText", 13)} <span>Giải thích &amp; Từ vựng</span>`)
      : (effectiveShown ? `${getIcon("x", 13)} <span>Ẩn Tapescript</span>` : `${getIcon("fileText", 13)} <span>Xem Tapescript &amp; Dịch</span>`);
    cardToggleBtn.classList.toggle("is-active", effectiveShown);
  });

  const focusLabel = document.getElementById("focus-transcript-label");
  if (focusLabel) {
    focusLabel.textContent = isReading
      ? (isShown ? "✕ Ẩn Giải thích" : "Bật Giải thích (Bên phải)")
      : (isShown ? "✕ Ẩn Tapescript" : "Bật Tapescript (Bên phải)");
  }
  const focusBtn = document.getElementById("focus-toggle-transcript-btn");
  if (focusBtn) {
    focusBtn.classList.toggle("is-active", isShown);
  }

  if (state.focusMode) {
    document.body.classList.toggle("focus-transcript-on", isShown);
    document.body.classList.toggle("focus-transcript-off", !isShown);
  }
}

function initFocusTheaterBar() {
  const prevBtn = document.getElementById("focus-nav-prev");
  const nextBtn = document.getElementById("focus-nav-next");
  const toggleScriptBtn = document.getElementById("focus-toggle-transcript-btn");
  const fullscreenBtn = document.getElementById("focus-fullscreen-btn");
  const exitBtn = document.getElementById("focus-exit-btn");

  prevBtn?.addEventListener("click", () => {
    const curIdx = state.currentIndex[state.activeTest] || 0;
    if (curIdx > 0) {
      pauseActiveAudio();
      state.currentIndex[state.activeTest] = curIdx - 1;
      saveState();
      renderAll();
      updateFocusTheaterBar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  nextBtn?.addEventListener("click", () => {
    const talks = TESTS.find((t) => t.id === state.activeTest)?.talks || [];
    const curIdx = state.currentIndex[state.activeTest] || 0;
    if (curIdx < talks.length - 1) {
      pauseActiveAudio();
      state.currentIndex[state.activeTest] = curIdx + 1;
      saveState();
      renderAll();
      updateFocusTheaterBar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  toggleScriptBtn?.addEventListener("click", () => {
    toggleTranscript();
  });

  const focusResetBtn = document.getElementById("focus-reset-test-btn");
  focusResetBtn?.addEventListener("click", () => {
    resetCurrentTest();
  });

  fullscreenBtn?.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  exitBtn?.addEventListener("click", () => {
    toggleFocusMode();
  });

  const focusToggleIntroBtn = document.getElementById("focus-toggle-intro-btn");
  focusToggleIntroBtn?.addEventListener("click", () => {
    setPlayIntroState(!state.audioSettings.playIntro);
    showToast(state.audioSettings.playIntro ? "Đã BẬT đọc phần giới thiệu bài nói!" : "Đã TẮT đọc phần giới thiệu (Bỏ qua 5s mở đầu)!");
  });

  const focusToggleQuestionsBtn = document.getElementById("focus-toggle-questions-btn");
  focusToggleQuestionsBtn?.addEventListener("click", () => {
    setPlayQuestionsState(!state.audioSettings.playQuestions);
    showToast(state.audioSettings.playQuestions ? "Đã BẬT đọc câu hỏi sau bài nghe!" : "Đã TẮT đọc câu hỏi (Dừng lại ngay sau bài nói)!");
  });

  // Focus soundscape chips in topbar
  document.getElementById("focus-ambient-rain")?.addEventListener("click", () => {
    state.audioSettings.ambientType = "rain";
    ambientSoundscape.start("rain", state.audioSettings.ambientVolume);
    saveState();
    updateAmbientButtons();
  });
  document.getElementById("focus-ambient-pink")?.addEventListener("click", () => {
    state.audioSettings.ambientType = "white";
    ambientSoundscape.start("white", state.audioSettings.ambientVolume);
    saveState();
    updateAmbientButtons();
  });
  document.getElementById("focus-ambient-mute")?.addEventListener("click", () => {
    state.audioSettings.ambientType = "none";
    ambientSoundscape.stop();
    saveState();
    updateAmbientButtons();
  });
}

function updateAmbientButtons() {
  const { ambientType } = state.audioSettings;
  ["rain", "pink", "mute"].forEach((type) => {
    const match = (type === "rain" && ambientType === "rain") ||
                  (type === "pink" && ambientType === "white") ||
                  (type === "mute" && ambientType === "none");
    document.getElementById(`focus-ambient-${type}`)?.classList.toggle("is-active", match);
    document.getElementById(`dock-ambient-${type}`)?.classList.toggle("is-active", match);
  });
}

function updateFocusTheaterBar() {
  const currentTest = TESTS.find((t) => t.id === state.activeTest) || TESTS[0];
  const talks = currentTest.talks || [];
  const curIdx = state.currentIndex[state.activeTest] || 0;
  const talk = talks[curIdx] || talks[0];
  const isReading = Boolean(currentTest.isReading || currentTest.part === 7 || talk?.isReading);

  const badge = document.getElementById("focus-talk-badge");
  if (badge && talk) {
    badge.textContent = `Bài ${curIdx + 1}/${talks.length} (Câu ${talk.range})`;
  }

  const prevBtn = document.getElementById("focus-nav-prev");
  if (prevBtn) {
    prevBtn.disabled = curIdx === 0;
    prevBtn.style.opacity = curIdx === 0 ? "0.4" : "1";
    prevBtn.style.pointerEvents = curIdx === 0 ? "none" : "auto";
  }

  const nextBtn = document.getElementById("focus-nav-next");
  if (nextBtn) {
    nextBtn.disabled = curIdx === talks.length - 1;
    nextBtn.style.opacity = curIdx === talks.length - 1 ? "0.4" : "1";
    nextBtn.style.pointerEvents = curIdx === talks.length - 1 ? "none" : "auto";
  }

  const scriptLabel = document.getElementById("focus-transcript-label");
  if (scriptLabel) {
    scriptLabel.textContent = isReading
      ? (state.showTranscript ? "Ẩn Giải thích" : "Bật Giải thích (Bên phải)")
      : (state.showTranscript ? "Ẩn Tapescript" : "Bật Tapescript (Bên phải)");
  }
  const scriptBtn = document.getElementById("focus-toggle-transcript-btn");
  if (scriptBtn) {
    scriptBtn.classList.toggle("is-active", Boolean(state.showTranscript));
  }

  const focusIntroBtn = document.getElementById("focus-toggle-intro-btn");
  if (focusIntroBtn) {
    focusIntroBtn.style.display = isReading ? "none" : "";
    focusIntroBtn.classList.toggle("is-active", Boolean(state.audioSettings.playIntro));
  }
  const focusIntroLabel = document.getElementById("focus-intro-label");
  if (focusIntroLabel) {
    focusIntroLabel.textContent = `Intro: ${state.audioSettings.playIntro ? 'BẬT' : 'TẮT'}`;
  }

  const focusQBtn = document.getElementById("focus-toggle-questions-btn");
  if (focusQBtn) {
    focusQBtn.style.display = isReading ? "none" : "";
    focusQBtn.classList.toggle("is-active", Boolean(state.audioSettings.playQuestions));
  }
  const focusQLabel = document.getElementById("focus-questions-label");
  if (focusQLabel) {
    focusQLabel.textContent = `Đọc câu hỏi: ${state.audioSettings.playQuestions ? 'BẬT' : 'TẮT'}`;
  }
}

function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  document.body.classList.toggle("is-focus-mode", state.focusMode);
  if (state.focusMode) {
    document.body.classList.toggle("focus-transcript-on", Boolean(state.showTranscript));
    document.body.classList.toggle("focus-transcript-off", !state.showTranscript);
    window.scrollTo({ top: 0, behavior: "instant" });
  } else {
    document.body.classList.remove("focus-transcript-on", "focus-transcript-off");
  }
  saveState();

  const theaterBar = document.getElementById("focus-theater-bar");
  const dock = document.getElementById("focus-dock");

  if (state.focusMode) {
    state.focusDockMinimized = false;
    if (theaterBar) theaterBar.style.display = "flex";
    if (dock) {
      dock.style.display = "flex";
      renderFocusDock();
    }
    updateFocusTheaterBar();
    showToast("Đã bật Chế độ Focus Theater (Bấm Esc hoặc F để thoát)");
  } else {
    if (theaterBar) theaterBar.style.display = "none";
    if (dock) {
      dock.style.display = "none";
      dock.classList.remove("is-minimized");
    }
    ambientSoundscape.stop();
    if (pomoInterval) {
      clearInterval(pomoInterval);
      pomoInterval = null;
    }
  }
}

function renderFocusDock() {
  const dock = document.getElementById("focus-dock");
  if (!dock) return;

  dock.style.display = "flex";
  dock.classList.toggle("is-minimized", Boolean(state.focusDockMinimized));

  const isRunning = Boolean(pomoInterval);

  if (state.focusDockMinimized) {
    dock.setAttribute("aria-expanded", "false");
    dock.innerHTML = `
      <div class="dock-minimized-pill ${isRunning ? 'dock-pomo-running' : ''}" id="dock-minimized-trigger" role="button" tabindex="0" title="Mở rộng Focus Dock (Bấm hoặc nhấn Space để phóng to)" aria-label="Mở rộng Focus Dock">
        <span class="dock-pomo-icon" title="Pomodoro">${getIcon("clock", 13)}</span>
        <span id="focus-pomo-display" class="tabular-nums dock-pomo-time">${fmtPomo(pomoSeconds)}</span>
        ${state.audioSettings.ambientType !== 'none' ? `<span style="display: inline-flex; align-items: center; color: var(--accent);" title="Tạp âm: ${state.audioSettings.ambientType === 'rain' ? 'Mưa' : 'Pink'}">${getIcon(state.audioSettings.ambientType === 'rain' ? 'cloudRain' : 'waves', 12)}</span>` : ''}
        <button type="button" id="dock-expand-btn" class="dock-icon-btn" title="Mở rộng Focus Dock" aria-label="Mở rộng">
          ${getIcon("maximize2", 11)}
        </button>
      </div>
    `;

    const expandDock = (e) => {
      e.stopPropagation();
      state.focusDockMinimized = false;
      saveState();
      renderFocusDock();
    };

    const triggerEl = document.getElementById("dock-minimized-trigger");
    triggerEl?.addEventListener("click", expandDock);
    triggerEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        expandDock(e);
      }
    });

    document.getElementById("dock-expand-btn")?.addEventListener("click", expandDock);
    dock.onclick = (e) => {
      if (e.target.closest("#dock-expand-btn") || e.target.closest("#dock-minimized-trigger")) return;
      expandDock(e);
    };
    return;
  }

  // Clear dock click handler when expanded
  dock.onclick = null;
  dock.setAttribute("aria-expanded", "true");

  dock.innerHTML = `
    <div class="focus-dock-inner">
      <div class="dock-pomo-wrap ${isRunning ? 'dock-pomo-running' : ''}" id="dock-pomo-wrap">
        <span class="dock-pomo-icon" title="Pomodoro">${getIcon("clock", 13)}</span>
        <span id="focus-pomo-display" class="tabular-nums dock-pomo-time" title="Thời gian Pomodoro">${fmtPomo(pomoSeconds)}</span>
        <button type="button" id="focus-pomo-toggle" class="dock-icon-btn" title="${pomoInterval ? 'Tạm dừng Pomodoro' : 'Bắt đầu Pomodoro (25 phút)'}" aria-label="Pomodoro">
          ${getIcon(pomoInterval ? "pause" : "play", 11)}
        </button>
      </div>

      <div class="dock-divider"></div>

      <div class="dock-segmented" role="group" aria-label="Tạp âm tập trung">
        <button type="button" class="dock-seg-btn ${state.audioSettings.ambientType === 'rain' ? 'is-active' : ''}" id="dock-ambient-rain" title="Mưa (Rain ambient)" aria-label="Mưa">
          ${getIcon("cloudRain", 12)}
        </button>
        <button type="button" class="dock-seg-btn ${state.audioSettings.ambientType === 'white' ? 'is-active' : ''}" id="dock-ambient-pink" title="Pink Noise" aria-label="Pink Noise">
          ${getIcon("waves", 12)}
        </button>
        <button type="button" class="dock-seg-btn ${state.audioSettings.ambientType === 'none' ? 'is-active' : ''}" id="dock-ambient-mute" title="Tắt tạp âm" aria-label="Tắt">
          ${getIcon("volumeX", 12)}
        </button>
      </div>

      <input type="range" id="dock-ambient-slider" class="dock-volume-slider" min="0" max="1" step="0.05" value="${state.audioSettings.ambientVolume}" title="Âm lượng: ${Math.round(state.audioSettings.ambientVolume * 100)}%" aria-label="Âm lượng tạp âm" />

      ${!isCurrentTestReading() ? `
      <div class="dock-divider"></div>

      <div class="dock-segmented" role="group" aria-label="Tùy chọn đọc âm thanh">
        <button type="button" class="dock-seg-btn ${state.audioSettings.playIntro ? 'is-active' : ''}" id="dock-toggle-intro" title="Đọc intro: ${state.audioSettings.playIntro ? 'BẬT' : 'TẮT'}">
          <span style="font-size: 0.72rem; font-weight: 500;">Intro</span>
        </button>
        <button type="button" class="dock-seg-btn ${state.audioSettings.playQuestions ? 'is-active' : ''}" id="dock-toggle-questions" title="Đọc câu hỏi: ${state.audioSettings.playQuestions ? 'BẬT' : 'TẮT'}">
          <span style="font-size: 0.72rem; font-weight: 500;">Câu hỏi</span>
        </button>
      </div>` : ''}

      <div class="dock-divider"></div>

      <button type="button" id="dock-minimize-btn" class="dock-icon-btn" title="Thu nhỏ thanh điều khiển" aria-label="Thu nhỏ">
        ${getIcon("minimize2", 11)}
      </button>

      <button type="button" id="dock-exit-btn" class="dock-icon-btn dock-btn-exit" title="Thoát Focus Theater" aria-label="Thoát Focus">
        ${getIcon("x", 12)}
      </button>
    </div>
  `;

  const pomoDisplay = document.getElementById("focus-pomo-display");
  const pomoBtn = document.getElementById("focus-pomo-toggle");

  pomoBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (pomoInterval) {
      clearInterval(pomoInterval);
      pomoInterval = null;
      pomoBtn.innerHTML = getIcon("play", 11);
      pomoBtn.title = "Bắt đầu Pomodoro (25 phút)";
      document.getElementById("dock-pomo-wrap")?.classList.remove("dock-pomo-running");
    } else {
      pomoInterval = setInterval(() => {
        if (pomoSeconds > 0) {
          pomoSeconds--;
          const currDisp = document.getElementById("focus-pomo-display");
          if (currDisp) currDisp.textContent = fmtPomo(pomoSeconds);
        } else {
          clearInterval(pomoInterval);
          pomoInterval = null;
          pomoSeconds = 25 * 60;
          showToast("Hoàn thành phiên Pomodoro 25 phút!", "success");
          renderFocusDock();
        }
      }, 1000);
      pomoBtn.innerHTML = getIcon("pause", 11);
      pomoBtn.title = "Tạm dừng Pomodoro";
      document.getElementById("dock-pomo-wrap")?.classList.add("dock-pomo-running");
    }
  });

  document.getElementById("dock-ambient-rain")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.audioSettings.ambientType = "rain";
    ambientSoundscape.start("rain", state.audioSettings.ambientVolume);
    saveState();
    renderFocusDock();
  });

  document.getElementById("dock-ambient-pink")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.audioSettings.ambientType = "white";
    ambientSoundscape.start("white", state.audioSettings.ambientVolume);
    saveState();
    renderFocusDock();
  });

  document.getElementById("dock-ambient-mute")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.audioSettings.ambientType = "none";
    ambientSoundscape.stop();
    saveState();
    renderFocusDock();
  });

  document.getElementById("dock-ambient-slider")?.addEventListener("input", (e) => {
    const vol = parseFloat(e.target.value);
    state.audioSettings.ambientVolume = vol;
    ambientSoundscape.setVolume(vol);
    e.target.title = `Âm lượng: ${Math.round(vol * 100)}%`;
    saveState();
  });

  document.getElementById("dock-toggle-intro")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setPlayIntroState(!state.audioSettings.playIntro);
    showToast(state.audioSettings.playIntro ? "Đã BẬT đọc phần giới thiệu bài nói!" : "Đã TẮT đọc phần giới thiệu (Bỏ qua 5s mở đầu)!");
  });

  document.getElementById("dock-toggle-questions")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setPlayQuestionsState(!state.audioSettings.playQuestions);
    showToast(state.audioSettings.playQuestions ? "Đã BẬT đọc câu hỏi sau bài nghe!" : "Đã TẮT đọc câu hỏi (Dừng lại ngay sau bài nói)!");
  });

  document.getElementById("dock-minimize-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.focusDockMinimized = true;
    saveState();
    renderFocusDock();
  });

  document.getElementById("dock-exit-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFocusMode();
  });
}

function fmtPomo(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startAmbientSoundscape() {
  const { ambientType, ambientVolume } = state.audioSettings;
  if (ambientType !== "none") {
    ambientSoundscape.start(ambientType, ambientVolume);
  }
}

/* ============================================================
   Global Keyboard Shortcuts & Pro Navigation
   ============================================================ */
function navigatePrevNextTalk(delta) {
  if (state.mode === "exam" && examSimulator?.isActive) {
    const nextExamIdx = examSimulator.currentTalkIndex + delta;
    if (nextExamIdx >= 0 && nextExamIdx < examSimulator.examTalks.length) {
      pauseActiveAudio();
      examSimulator.goToTalk(nextExamIdx);
    }
    return;
  }
  const talks = TESTS.find((t) => t.id === state.activeTest)?.talks || [];
  const curIdx = state.currentIndex[state.activeTest] || 0;
  const nextIdx = curIdx + delta;
  if (nextIdx >= 0 && nextIdx < talks.length) {
    pauseActiveAudio();
    state.currentIndex[state.activeTest] = nextIdx;
    saveState();
    renderAll();
    if (state.focusMode) updateFocusTheaterBar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function initGlobalShortcuts() {
  document.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    const activeTag = activeEl ? activeEl.tagName : "";
    const inTextField = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT" || activeEl?.isContentEditable;
    const inChamRunner = Boolean(chamCenter?.isActive && (chamCenter?.view === "runner" || chamCenter?.view === "review"));
    const inMaterialsHub = Boolean(materialsCenter?.isActive?.() || document.body.classList.contains("is-materials-hub-active"));

    // Allow Ctrl+K / Cmd+K globally outside Materials Hub, active CBT Exam Runner, and text inputs
    if (!inTextField && !inChamRunner && !inMaterialsHub && (e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      const openDialog = document.querySelector("dialog[open]");
      if (!openDialog) {
        e.preventDefault();
        openCommandPalette();
        return;
      }
    }

    if (
      chamCenter?.isActive ||
      materialsCenter?.isActive?.() ||
      document.body.classList.contains("is-cham-hub-active") ||
      document.body.classList.contains("is-materials-hub-active")
    ) {
      if (e.key === "Escape") {
        const pal = document.querySelector(".command-palette-backdrop");
        if (pal && pal.style.display !== "none") {
          e.preventDefault();
          pal.style.display = "none";
        }
      }
      return;
    }
    if (inTextField) return;

    const paletteBackdrop = document.querySelector(".command-palette-backdrop");
    const isPaletteOpen = Boolean(paletteBackdrop && paletteBackdrop.style.display !== "none");
    const openDialog = document.querySelector("dialog[open]");

    // '?' toggles Keyboard Shortcuts Cheat-Sheet
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (openDialog && openDialog.id !== "shortcuts-dialog") return;
      e.preventDefault();
      const shortcutsDlg = document.getElementById("shortcuts-dialog");
      if (shortcutsDlg?.open) shortcutsDlg.close();
      else openShortcutsModal();
      return;
    }

    if (e.key === "Escape") {
      if (isPaletteOpen) {
        e.preventDefault();
        paletteBackdrop.style.display = "none";
        return;
      }
      if (!openDialog && state.focusMode) {
        e.preventDefault();
        toggleFocusMode();
      }
      return;
    }

    // Do not hijack Space / F / / / Alt+Arrows while a modal dialog or command palette is open
    if (openDialog || isPaletteOpen) return;

    const inWorkspace = studioLobbyState.view === "workspace";

    if (inWorkspace && e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      navigatePrevNextTalk(e.key === "ArrowRight" ? 1 : -1);
    } else if (inWorkspace && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      toggleFocusMode();
    } else if (inWorkspace && e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (activeAudio) {
        e.preventDefault();
        if (activeAudio.paused) activeAudio.play().catch(() => {});
        else activeAudio.pause();
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      openCommandPalette();
    } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openCommandPalette();
    }
  });
}

/* ============================================================
   Command Palette (Ctrl+K / /)
   ============================================================ */
function initCommandPalette() {
  // Built dynamically in openCommandPalette()
}

function openCommandPalette() {
  let backdrop = document.querySelector(".command-palette-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "command-palette-backdrop";
    backdrop.innerHTML = `
      <div class="command-palette-box">
        <div class="palette-input-wrap">
          <span style="display: flex; align-items: center; color: var(--text-muted);">${getIcon("search", 16)}</span>
          <input type="search" class="palette-input" placeholder="Tìm câu (Q71, Q105, Q194), bài học, từ vựng, hoặc lệnh..." autofocus />
          <span class="kbd-badge">ESC</span>
        </div>
        <div class="palette-results-list"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.style.display = "none";
    });
  }

  backdrop.style.display = "flex";
  const input = backdrop.querySelector(".palette-input");
  const list = backdrop.querySelector(".palette-results-list");
  input.value = "";
  input.focus();

  const renderResults = (query = "") => {
    const q = query.trim().toLowerCase();
    const results = [];

    // Commands & Quick Navigation
    const chamList = window.CHAM_TOEIC_CATALOG?.tests || [];
    const totalAllBanks = chamList.length + TESTS.length;
    const commands = [
      { label: "Trang chủ: Lộ trình & Mục tiêu điểm TOEIC", action: () => openHomeDashboard() },
      { label: `Luyện tập theo Part 1–7 (Ngân hàng ${totalAllBanks} bộ đề)`, action: () => openPracticeHub(null) },
      { label: `Thi thử TOEIC: Kho ${chamList.length} Đề Full Test, Mini Test & Đề lẻ`, action: () => openChamHub() },
      { label: "Làm Test Đầu Vào (Định vị trình độ A1–C1)", action: () => openChamHub("test-au-vao-01") },
      { label: "Tài liệu Hackers & ETS (Giáo trình, Ngữ pháp, Paraphrase)", action: () => openMaterialsHub("books") },
      { label: `Thống kê năng lực & Ma trận độ khó CEFR (${totalAllBanks} đề)`, action: () => openAnalyticsModal("matrix") },
      { label: "Mở kho thẻ Flashcard SM-2", action: () => openFlashcardModal() },
      { label: "Chiến lược bứt phá TOEIC 900+", action: () => openStrategyModal() },
      { label: "Đổi giao diện (Light Blue / Tối Slate)", action: () => document.getElementById("theme-toggle")?.click() },
      { label: "Cài đặt hiển thị & Lưu Cache Offline", action: () => openReaderSettingsModal() },
      { label: "Bảng phím tắt thao tác nhanh (Keyboard Shortcuts - Phím ?)", action: () => openShortcutsModal() },
      { label: "Chấm điểm toàn bộ đề thi (Studio)", action: () => { if (studioLobbyState.view !== "workspace") enterStudioWorkspace(state.activeTest); gradeCurrentTest(); } },
      { label: "Làm lại đề thi hiện tại (Studio)", action: () => { if (studioLobbyState.view !== "workspace") enterStudioWorkspace(state.activeTest); resetCurrentTest(); } },
      ...EXTRA_PART56_TESTS.map((pt) => ({
        label: `Mở gói Studio ${pt.shortLabel || pt.title}: ${pt.title}`,
        action: () => enterStudioWorkspace(pt.id)
      })),
      { label: "Chế độ Focus Theater (Phím F)", action: () => { if (studioLobbyState.view !== "workspace") enterStudioWorkspace(state.activeTest); toggleFocusMode(); } },
      { label: "Phòng thi mô phỏng CBT liên hoàn (Studio)", action: () => openCbtExamDialog() },
      { label: "In phiếu học tập A4", action: () => prepareWorksheetForPrint() },
      {
        label: "Smart Mix: Ôn tập câu làm sai & câu đoán",
        action: () => {
          const mix = analyticsEngine.getSmartMixTalks("mistakes");
          if (mix.length > 0) {
            selectTab(mix[0].testId);
            state.currentIndex[mix[0].testId] = mix[0].talkIndex;
            saveState();
            renderAll();
            showToast(`Smart Mix: Bắt đầu bài ${mix[0].range} (${mix.length} bài có câu sai/đoán)!`, "info");
          } else {
            showToast("Chưa có câu sai hoặc câu đoán!");
          }
        }
      }
    ];

    commands.forEach((c) => {
      if (!q || c.label.toLowerCase().includes(q)) {
        results.push(c);
      }
    });

    // Full / Mini / Part Online Tests Search
    let chamMatched = 0;
    const maxChamMatches = q ? 35 : 15;
    for (const ct of chamList) {
      if (chamMatched >= maxChamMatches) break;
      const diff = window.TOEIC_DIFFICULTY_DATA?.chamTests?.[ct.slug];
      const cefrTag = diff?.cefr ? ` · ${diff.cefr}` : "";
      const hay = `${ct.title} ${ct.collection} ${ct.slug} ${ct.subLabel || ""} ${diff?.cefr || ""}`.toLowerCase();
      if (!q || hay.includes(q)) {
        chamMatched++;
        results.push({
          label: `Đề thi: ${ct.title} (${ct.collection}${cefrTag} · ${ct.totalQuestions} câu)`,
          action: () => openChamHub(ct.slug)
        });
      }
    }

    // Talks & Questions
    TESTS.forEach((t) => {
      t.talks.forEach((talk, idx) => {
        const title = `${t.title.split(" (")[0]} · Bài ${idx + 1} (Câu ${talk.range})`;
        const qMatch = (talk.questions || []).some(qn => `q${qn.num}`.includes(q) || `câu ${qn.num}`.includes(q) || `${qn.num}` === q);
        if (!q || title.toLowerCase().includes(q) || talk.type.toLowerCase().includes(q) || talk.range.includes(q) || qMatch) {
          results.push({
            label: `${title} - ${talk.type}`,
            action: () => {
              selectTab(t.id);
              state.currentIndex[t.id] = idx;
              saveState();
              renderAll();
            }
          });
        }
      });
    });

    // Vocabulary Search
    if (q) {
      TESTS.forEach((t) => {
        t.talks.forEach((talk, idx) => {
          (talk.vocab || []).forEach((v) => {
            if (v.toLowerCase().includes(q)) {
              results.push({
                label: `Từ vựng: ${v} · Câu ${talk.range}`,
                action: () => {
                  selectTab(t.id);
                  state.currentIndex[t.id] = idx;
                  state.inspectorTabs[`${t.id}_${talk.range}`] = "vocab";
                  saveState();
                  renderAll();
                }
              });
            }
          });
        });
      });
    }

    if (results.length === 0) {
      list.innerHTML = `<div class="muted-text" style="padding: 16px; text-align: center;">Không tìm thấy lệnh, bài nói, hoặc từ vựng nào khớp với &ldquo;${escStudioHtml(q)}&rdquo;.</div>`;
      return;
    }

    let selectedIdx = 0;
    list.innerHTML = results.map((r, i) => `
      <div class="palette-item ${i === 0 ? 'is-selected' : ''}" data-idx="${i}">
        <span>${escStudioHtml(r.label)}</span>
        <span class="kbd-badge">Enter</span>
      </div>
    `).join("");

    const syncSelected = (nextIdx) => {
      const items = list.querySelectorAll(".palette-item");
      if (!items.length) return;
      selectedIdx = (nextIdx + items.length) % items.length;
      items.forEach((el, idx) => el.classList.toggle("is-selected", idx === selectedIdx));
      items[selectedIdx]?.scrollIntoView({ block: "nearest" });
    };

    list.querySelectorAll(".palette-item").forEach((el, i) => {
      el.addEventListener("mouseenter", () => syncSelected(i));
      el.addEventListener("click", () => {
        backdrop.style.display = "none";
        results[i].action();
      });
    });

    input.onkeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        backdrop.style.display = "none";
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        syncSelected(selectedIdx + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        syncSelected(selectedIdx - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const items = list.querySelectorAll(".palette-item");
        const target = items[selectedIdx] || items[0];
        if (target) target.click();
      }
    };
  };

  renderResults("");
  input.oninput = (e) => renderResults(e.target.value);
}

/* ============================================================
   Test Actions: Grade All & Reset Test
   ============================================================ */
function gradeCurrentTest() {
  const currentTest = TESTS.find((t) => t.id === state.activeTest);
  if (!currentTest) return;

  let answeredCount = 0;
  let correctCount = 0;
  let totalQuestions = 0;

  currentTest.talks.forEach((t) => {
    const key = `${state.activeTest}_${t.range}`;
    state.checkedTalks[key] = true;
    (t.questions || []).forEach((q) => {
      totalQuestions++;
      const userAns = getAnswer(state.activeTest, q.num);
      if (userAns) answeredCount++;
      if (userAns === q.answer) correctCount++;
    });
  });

  saveState();
  renderAll();
  showToast(`Đã chấm điểm toàn đề: Đúng ${correctCount}/${totalQuestions} câu (Đã làm ${answeredCount}/${totalQuestions})!`, "success");
}

function resetCurrentTest() {
  const currentTest = TESTS.find((t) => t.id === state.activeTest);
  if (!currentTest) return;

  const testTitle = currentTest.title || currentTest.name || (state.activeTest === "ets2019_t6" ? "ETS 2019 · Test 6" : "Hackers 3 · Test 4");
  if (!confirm(`Bạn có chắc chắn muốn làm lại đề "${testTitle}"?\n\nToàn bộ đáp án đã chọn, độ tự tin và kết quả kiểm tra của đề này sẽ được đặt lại về ban đầu.`)) {
    return;
  }

  // Pause any active playback
  pauseActiveAudio();

  const startQNum = currentTest.talks?.[0]?.questions?.[0]?.num || 1;

  currentTest.talks.forEach((t) => {
    const key = `${state.activeTest}_${t.range}`;
    delete state.checkedTalks[key];
    delete state.revealedScripts[key];
    (t.questions || []).forEach((q) => {
      deleteAnswer(state.activeTest, q.num);
      deleteConfidence(state.activeTest, q.num);
      deleteEliminations(state.activeTest, q.num);
    });
  });

  state.currentIndex[state.activeTest] = 0;
  saveState();
  renderAll();
  showToast(`Đã làm mới toàn bộ đề "${testTitle}". Bạn có thể bắt đầu làm lại từ Câu ${startQNum}!`, "info");
}

/* ============================================================
   Interactive Question Palette / Answer Sheet Helpers
   ============================================================ */
function computeQuestionPillClass(testId, talkRange, q, isExamMode) {
  const userAns = getAnswer(testId, q.num);
  if (isExamMode) {
    return {
      cls: userAns ? "is-answered" : "is-unanswered",
      userAns,
      canReveal: false
    };
  }
  const talkKey = `${testId}_${talkRange}`;
  const isChecked = Boolean(state.checkedTalks[talkKey]);
  const canReveal = state.mode === "study" || (state.mode === "practice" && isChecked);
  if (canReveal) {
    if (userAns === q.answer) return { cls: "is-correct", userAns, canReveal: true };
    if (userAns) return { cls: "is-wrong", userAns, canReveal: true };
    return { cls: "is-unanswered-revealed", userAns: null, canReveal: true };
  }
  return {
    cls: userAns ? "is-answered" : "is-unanswered",
    userAns,
    canReveal: false
  };
}

function renderSidebarQuestionPaletteHTML(currentTest, currentIdx) {
  const talks = currentTest?.talks || [];
  let answered = 0;
  let total = 0;
  let anyRevealed = state.mode === "study";

  const pillsHtml = talks.map((t, talkIdx) => {
    const talkKey = `${currentTest.id}_${t.range}`;
    if (state.checkedTalks[talkKey]) anyRevealed = true;
    const isCurrentTalk = talkIdx === currentIdx;
    return (t.questions || []).map((q) => {
      total++;
      const info = computeQuestionPillClass(currentTest.id, t.range, q, false);
      if (info.userAns) answered++;
      const statusHint = info.canReveal
        ? (info.cls === "is-correct" ? ` · Đúng (${info.userAns})` : (info.cls === "is-wrong" ? ` · Sai (${info.userAns} → ${q.answer})` : " · Chưa làm"))
        : (info.userAns ? ` · Đã chọn ${info.userAns}` : " · Chưa chọn");
      return `<button type="button" class="q-palette-pill ${info.cls} ${isCurrentTalk ? 'is-current-talk' : ''}" data-qnum="${q.num}" data-testid="${currentTest.id}" data-talk-idx="${talkIdx}" data-talk-range="${t.range}" title="Câu ${q.num}${statusHint}">${q.num}</button>`;
    }).join("");
  }).join("");

  return `
    <div class="sidebar-section question-palette-section" id="sidebar-question-palette">
      <div class="sidebar-title-row" style="margin-bottom: 2px;">
        <span class="sidebar-title" style="display: inline-flex; align-items: center; gap: 5px;">${getIcon("clipboardList", 13)} <span>Bảng câu hỏi</span></span>
        <span class="tab-pill q-palette-summary" id="sidebar-palette-summary" title="Đã chọn ${answered}/${total} câu">${answered}/${total}</span>
      </div>
      <div class="q-palette-legend">
        <span class="q-palette-legend-item"><span class="q-legend-dot"></span>Chưa làm</span>
        <span class="q-palette-legend-item"><span class="q-legend-dot is-answered"></span>Đã chọn</span>
        ${anyRevealed ? `
          <span class="q-palette-legend-item"><span class="q-legend-dot is-correct"></span>Đúng</span>
          <span class="q-palette-legend-item"><span class="q-legend-dot is-wrong"></span>Sai</span>
        ` : ''}
      </div>
      <div class="q-palette-grid" role="navigation" aria-label="Bảng câu hỏi chuyển nhanh">
        ${pillsHtml}
      </div>
    </div>
  `;
}

function renderCbtQuestionPaletteDrawerHTML() {
  const examTalks = examSimulator?.examTalks || [];
  let answered = 0;
  let total = 0;

  const pillsHtml = examTalks.map((et, examTalkIdx) => {
    const isCurrent = examTalkIdx === examSimulator.currentTalkIndex;
    return (et.questions || []).map((q) => {
      total++;
      const userAns = getAnswer(et.testId, q.num);
      if (userAns) answered++;
      const cls = userAns ? "is-answered" : "is-unanswered";
      return `<button type="button" class="q-palette-pill ${cls} ${isCurrent ? 'is-current-talk' : ''}" data-qnum="${q.num}" data-testid="${et.testId}" data-exam-talk-idx="${examTalkIdx}" title="Câu ${q.num}${userAns ? ' · Đã chọn ' + userAns : ' · Chưa làm'}">${q.num}</button>`;
    }).join("");
  }).join("");

  return {
    answered,
    total,
    drawerHtml: `
      <div class="cbt-palette-drawer" id="cbt-question-palette" style="${state.cbtPaletteOpen ? '' : 'display: none;'}">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <strong style="font-size: 0.88rem; color: var(--text); display: inline-flex; align-items: center; gap: 6px;">${getIcon("clipboardList", 15)} <span>Phiếu trả lời phòng thi CBT</span></strong>
            <span class="tab-pill" id="cbt-palette-summary">${answered}/${total} đã chọn</span>
          </div>
          <div class="q-palette-legend">
            <span class="q-palette-legend-item"><span class="q-legend-dot"></span>Chưa chọn</span>
            <span class="q-palette-legend-item"><span class="q-legend-dot is-answered"></span>Đã chọn đáp án</span>
          </div>
        </div>
        <div class="q-palette-grid" role="navigation" aria-label="Phiếu trả lời phòng thi CBT">
          ${pillsHtml}
        </div>
      </div>
    `
  };
}

function updateQuestionPaletteStates() {
  const isExamMode = state.mode === "exam" && examSimulator?.isActive;

  if (isExamMode) {
    let answered = 0;
    let total = 0;
    (examSimulator.examTalks || []).forEach((et) => {
      (et.questions || []).forEach((q) => {
        total++;
        if (getAnswer(et.testId, q.num)) answered++;
      });
    });
    const toggleBtn = document.getElementById("cbt-palette-toggle-btn");
    if (toggleBtn) {
      toggleBtn.innerHTML = `${getIcon("clipboardList", 14)} <span>Phiếu trả lời (${answered}/${total})</span>`;
    }
    const cbtSum = document.getElementById("cbt-palette-summary");
    if (cbtSum) cbtSum.textContent = `${answered}/${total} đã chọn`;

    document.querySelectorAll("#cbt-question-palette .q-palette-pill").forEach((pill) => {
      const tId = pill.dataset.testid || state.activeTest;
      const qNum = Number(pill.dataset.qnum);
      const userAns = getAnswer(tId, qNum);
      pill.classList.remove("is-answered", "is-unanswered", "is-correct", "is-wrong", "is-unanswered-revealed");
      pill.classList.add(userAns ? "is-answered" : "is-unanswered");
      pill.title = `Câu ${qNum}${userAns ? " · Đã chọn " + userAns : " · Chưa làm"}`;
    });
    return;
  }

  const currentTest = TESTS.find((t) => t.id === state.activeTest);
  if (!currentTest) return;
  let answered = 0;
  let total = 0;
  const qMap = new Map();
  (currentTest.talks || []).forEach((tk) => {
    (tk.questions || []).forEach((q) => {
      total++;
      if (getAnswer(currentTest.id, q.num)) answered++;
      qMap.set(q.num, { talkRange: tk.range, q });
    });
  });

  const sideSum = document.querySelector(`#panel-${state.activeTest} #sidebar-palette-summary`);
  if (sideSum) {
    sideSum.textContent = `${answered}/${total}`;
    sideSum.title = `Đã chọn ${answered}/${total} câu`;
  }

  document.querySelectorAll(`#panel-${state.activeTest} #sidebar-question-palette .q-palette-pill`).forEach((pill) => {
    const qNum = Number(pill.dataset.qnum);
    const entry = qMap.get(qNum);
    if (!entry) return;
    const info = computeQuestionPillClass(currentTest.id, entry.talkRange, entry.q, false);
    pill.classList.remove("is-answered", "is-unanswered", "is-correct", "is-wrong", "is-unanswered-revealed");
    pill.classList.add(info.cls);
    const statusHint = info.canReveal
      ? (info.cls === "is-correct" ? ` · Đúng (${info.userAns})` : (info.cls === "is-wrong" ? ` · Sai (${info.userAns} → ${entry.q.answer})` : " · Chưa làm"))
      : (info.userAns ? ` · Đã chọn ${info.userAns}` : " · Chưa chọn");
    pill.title = `Câu ${qNum}${statusHint}`;
  });
}

function jumpToQuestionFromPalette(pillEl) {
  const qNum = Number(pillEl.dataset.qnum);
  if (!qNum) return;
  const isExamMode = state.mode === "exam" && examSimulator?.isActive;

  if (isExamMode && pillEl.dataset.examTalkIdx !== undefined) {
    const targetExamIdx = Number(pillEl.dataset.examTalkIdx);
    if (targetExamIdx !== examSimulator.currentTalkIndex) {
      pauseActiveAudio();
      examSimulator.goToTalk(targetExamIdx);
    }
  } else {
    const targetTestId = pillEl.dataset.testid || state.activeTest;
    const targetTalkIdx = Number(pillEl.dataset.talkIdx || 0);
    if (state.activeTest !== targetTestId) {
      selectTab(targetTestId);
    }
    if ((state.currentIndex[targetTestId] || 0) !== targetTalkIdx) {
      pauseActiveAudio();
      state.currentIndex[targetTestId] = targetTalkIdx;
      saveState();
      renderAll();
    }
  }

  requestAnimationFrame(() => {
    const activePanel = document.getElementById(`panel-${state.activeTest}`) || document;
    const qBlock = activePanel.querySelector(`.q-block[data-qnum="${qNum}"]`);
    if (qBlock) {
      qBlock.scrollIntoView({ behavior: "smooth", block: "center" });
      qBlock.classList.remove("is-jump-flash");
      void qBlock.offsetWidth;
      qBlock.classList.add("is-jump-flash");
      setTimeout(() => qBlock.classList.remove("is-jump-flash"), 1500);
    }
  });
}

/* ============================================================
   Render All (Workspace & Talk Cards)
   ============================================================ */
function renderAll() {
  updateScores();

  const currentTest = TESTS.find((t) => t.id === state.activeTest) || TESTS[0];
  const mountEl = document.getElementById(`mount-${state.activeTest}`);
  if (!mountEl) return;

  const runnerTitleEl = document.getElementById("studio-runner-pack-title");
  if (runnerTitleEl && currentTest) {
    const packMeta = getStudioPackMeta(currentTest);
    runnerTitleEl.textContent = `${packMeta.partLabel} · ${packMeta.shortTitle} (${packMeta.totalQ} câu)`;
  }
  document.querySelectorAll(".topbar .seg-btn[data-mode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.mode === state.mode);
  });

  const talks = currentTest.talks;
  const currentIdx = state.currentIndex[state.activeTest] || 0;
  const talk = talks[currentIdx] || talks[0];
  const talkKey = `${state.activeTest}_${talk.range}`;

  const isExamMode = state.mode === "exam" && Boolean(examSimulator?.isActive);
  const isReading = Boolean(talk.isReading || currentTest.isReading || currentTest.part >= 5);
  document.body.classList.toggle("is-cbt-mode", isExamMode);
  document.body.classList.toggle("is-reading-active", isReading);

  const cbtPaletteData = isExamMode ? renderCbtQuestionPaletteDrawerHTML() : null;

  // Render Sidebar + Talk Split Card
  mountEl.innerHTML = `
    ${isExamMode ? `
      <div class="cbt-exam-banner" style="background: var(--surface-raised); border-bottom: 2px solid var(--accent); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-radius: var(--radius-md); margin-bottom: ${state.cbtPaletteOpen ? '10px' : '20px'}; box-shadow: var(--shadow-sm); width: 100%;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span class="badge" style="background: var(--btn-primary-bg); color: var(--btn-primary-text); font-weight: 600; padding: 4px 10px; border-radius: 999px;">PHÒNG THI CBT IIG</span>
          <span style="font-weight: 600; font-size: 0.95rem;">Bài ${examSimulator.currentTalkIndex + 1}/${examSimulator.examTalks.length} · Câu ${talk.range}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="tool-btn cbt-palette-toggle-btn ${state.cbtPaletteOpen ? 'is-active' : ''}" id="cbt-palette-toggle-btn" aria-expanded="${Boolean(state.cbtPaletteOpen)}" title="Mở/Đóng Phiếu trả lời câu hỏi">
            ${getIcon("clipboardList", 14)} <span>Phiếu trả lời (${cbtPaletteData.answered}/${cbtPaletteData.total})</span>
          </button>
          ${isReading ? `
            <button type="button" class="tool-btn cbt-prev-talk-btn" ${examSimulator.currentTalkIndex === 0 ? 'disabled style="opacity:0.45;"' : ''}>
              ${getIcon("arrowLeft", 14)} <span>Bài trước</span>
            </button>
            <button type="button" class="tool-btn cbt-next-talk-btn" ${examSimulator.currentTalkIndex >= examSimulator.examTalks.length - 1 ? 'disabled style="opacity:0.45;"' : ''}>
              <span>Bài sau</span> ${getIcon("arrowRight", 14)}
            </button>
          ` : ''}
          <button type="button" class="tool-btn finish-exam-early-btn" style="background: var(--bad-solid, #dc2626); color: #fff; border-color: var(--bad-solid, #dc2626); font-weight: 500;">
            Nộp bài ${isReading ? 'ngay' : 'sớm'}
          </button>
        </div>
      </div>
      ${cbtPaletteData.drawerHtml}
    ` : ''}

    ${!isExamMode ? `
    <aside class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title-row">
          <span class="sidebar-title">${isReading ? 'Danh sách bài đọc' : 'Danh sách bài nghe'}</span>
          <span class="tab-pill">${talks.length} bài</span>
        </div>

        <!-- Test Quick Actions Grid -->
        <div class="sidebar-actions-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0 10px;">
          <button type="button" class="btn-primary side-grade-all-btn" style="padding: 8px 6px; font-size: 0.8rem; font-weight: 500; gap: 4px; justify-content: center; white-space: nowrap;" title="Chấm điểm toàn bộ ${talks.length} ${isReading ? 'bài đọc' : 'bài nghe'} của đề">
            ${getIcon("checkCircle", 13)} <span>Chấm đề</span>
          </button>
          <button type="button" class="tool-btn side-reset-test-btn" style="padding: 8px 6px; font-size: 0.8rem; font-weight: 600; gap: 4px; justify-content: center; color: var(--text-muted); white-space: nowrap;" title="Xóa toàn bộ đáp án của đề này để làm lại từ đầu">
            ${getIcon("rotateCcw", 13)} <span>Làm lại</span>
          </button>
        </div>

        <ul class="talk-nav-list">
          ${talks.map((t, idx) => {
            const key = `${state.activeTest}_${t.range}`;
            const isActive = idx === currentIdx;
            const isNavRevealed = state.mode === "study" || (state.mode === "practice" && Boolean(state.checkedTalks[key]));
            const navSubLabel = (!isNavRevealed && (Number(t.part) === 1 || /^ets2019_p1_/.test(state.activeTest)))
              ? `Part 1 · Tranh ${t.range}`
              : t.type.split(' (')[0];
            return `
              <li>
                <button type="button" class="talk-nav-item ${isActive ? 'is-active' : ''}" data-talk-idx="${idx}">
                  <div class="talk-nav-left">
                    <span class="talk-nav-range">Câu ${t.range}</span>
                    <span class="talk-nav-type">${navSubLabel}</span>
                  </div>
                  <div class="talk-nav-right">
                    ${renderMasteryRing(key)}
                  </div>
                </button>
              </li>
            `;
          }).join("")}
        </ul>
      </div>

      <!-- Interactive Question Palette / Answer Sheet -->
      ${renderSidebarQuestionPaletteHTML(currentTest, currentIdx)}
    </aside>
    ` : ''}

    <div class="talk-main-area" style="width: 100%;">
      ${renderTalkCard(talk, talkKey, currentIdx, talks.length, isExamMode)}
    </div>
  `;

  // Bind Exam Banner Navigation, Palette Toggle & Finish Early in CBT mode
  if (isExamMode) {
    mountEl.querySelector("#cbt-palette-toggle-btn")?.addEventListener("click", (e) => {
      state.cbtPaletteOpen = !state.cbtPaletteOpen;
      saveState();
      const drawer = mountEl.querySelector("#cbt-question-palette");
      const banner = mountEl.querySelector(".cbt-exam-banner");
      e.currentTarget.classList.toggle("is-active", state.cbtPaletteOpen);
      e.currentTarget.setAttribute("aria-expanded", String(state.cbtPaletteOpen));
      if (drawer) drawer.style.display = state.cbtPaletteOpen ? "" : "none";
      if (banner) banner.style.marginBottom = state.cbtPaletteOpen ? "10px" : "20px";
    });
    mountEl.querySelector(".cbt-prev-talk-btn")?.addEventListener("click", () => {
      examSimulator.goToTalk(examSimulator.currentTalkIndex - 1);
    });
    mountEl.querySelector(".cbt-next-talk-btn")?.addEventListener("click", () => {
      examSimulator.goToTalk(examSimulator.currentTalkIndex + 1);
    });
    mountEl.querySelector(".finish-exam-early-btn")?.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn nộp bài sớm và xem kết quả?")) {
        examSimulator.finishExam();
      }
    });
  }

  // Bind Question Palette Pills (both Sidebar & CBT Exam Drawer)
  mountEl.querySelectorAll(".q-palette-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      jumpToQuestionFromPalette(pill);
    });
  });

  // Bind Sidebar items
  mountEl.querySelectorAll(".talk-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      pauseActiveAudio();
      const idx = Number(btn.dataset.talkIdx);
      state.currentIndex[state.activeTest] = idx;
      saveState();
      renderAll();
    });
  });

  // Bind Sidebar Test Action buttons
  mountEl.querySelector(".side-grade-all-btn")?.addEventListener("click", () => {
    gradeCurrentTest();
  });
  mountEl.querySelector(".side-reset-test-btn")?.addEventListener("click", () => {
    resetCurrentTest();
  });

  // Wire Talk Card interactive components
  wireTalkCard(mountEl, talk, talkKey, isExamMode);
  updateTranscriptVisibilityUI();
  if (state.focusMode) {
    updateFocusTheaterBar();
  }
}

/* ============================================================
   Talk Card Layout (Resizable Split Pane)
   ============================================================ */
function renderTalkCard(talk, talkKey, index, totalTalks, isExamMode = false) {
  const isBookmarked = Boolean(state.bookmarks[talkKey]);
  const activeTabRaw = state.inspectorTabs[talkKey] || "script";
  const isReading = Boolean(talk.isReading || !talk.audio);
  const activeTab = (isReading && activeTabRaw === "dictation") ? "script" : activeTabRaw;
  const userHighlights = state.highlights[talkKey] || [];
  const isChecked = Boolean(state.checkedTalks[talkKey]);
  const isRevealed = state.mode === "study" || (state.mode === "practice" && isChecked);
  const showType = isRevealed;
  const isTranscriptOpen = Boolean(state.showTranscript) && !isExamMode;
  const qTotal = (talk.questions || []).length || 3;
  const p7State = isReading ? getP7State(talkKey) : null;

  // Calculate score for this talk
  const testId = talk.testId || state.activeTest;
  const isPart1Card = !isReading && Boolean(talk.image) && (Number(talk.part) === 1 || /^ets2019_p1_/.test(testId));
  let correctCount = 0;
  (talk.questions || []).forEach((q) => {
    if (getAnswer(testId, q.num) === q.answer) correctCount++;
  });

  const questionsGridOnlyHTML = `
    <!-- Questions Grid -->
    <div class="questions-container ${state.showConfidence ? '' : 'hide-confidence'}">
      ${renderQuestionsHTML(talk, talkKey, isExamMode)}
    </div>
  `;

  const talkFooterControlsHTML = `
    <!-- Practice Mode: Check Talk Button -->
    ${state.mode === 'practice' && !isExamMode ? `
      <div class="check-talk-wrap">
        <div class="check-talk-feedback">
          ${isChecked ? `<span>Đã kiểm tra: <strong>${correctCount}/${qTotal} câu đúng</strong></span>` : `<span>Làm xong ${qTotal} câu? Kiểm tra để xem đáp án &amp; giải thích!</span>`}
        </div>
        <div class="check-talk-actions" style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="check-talk-btn ${isChecked ? 'is-checked' : ''}">
            ${isChecked ? `${getIcon("checkCircle", 15)} <span>Đã kiểm tra (${correctCount}/${qTotal})</span>` : `${getIcon("check", 15)} <span>Kiểm tra bài này</span>`}
          </button>
          ${isChecked ? `
            <button type="button" class="tool-btn reset-talk-btn" title="Xóa đáp án để làm lại ${qTotal} câu của bài này" style="color: var(--text-muted); border-color: var(--border);">
              ${getIcon("rotateCcw", 14)} <span>Làm lại bài này</span>
            </button>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Prev / Next Talk Navigation Footer -->
    ${!isExamMode ? `
      <div class="talk-nav-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: ${isPart1Card ? '14px' : '24px'}; padding-top: ${isPart1Card ? '12px' : '16px'}; border-top: 1px solid var(--border);">
        <button type="button" class="tool-btn prev-talk-btn" ${index === 0 ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}>
          ${getIcon("arrowLeft", 14)} <span>Bài trước</span>
        </button>
        <span class="muted-text" style="font-size: 0.88rem; font-weight: 600;">Bài ${index + 1} / ${totalTalks}</span>
        <button type="button" class="tool-btn next-talk-btn" ${index === totalTalks - 1 ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}>
          <span>Bài tiếp</span> ${getIcon("arrowRight", 14)}
        </button>
      </div>
    ` : ''}

    <!-- Mobile Sheet Trigger Button -->
    <div class="mobile-sheet-trigger-wrap" style="margin-top: 18px;">
      <button type="button" class="tool-btn mobile-sheet-trigger-btn" style="width: 100%; justify-content: center; font-weight: 500;">
        ${getIcon("fileText", 15)} <span>${isReading ? 'Xem Bài đọc &amp; Giải thích' : 'Xem Live Script &amp; Phân tích'}</span>
      </button>
    </div>
  `;

  const questionsColumnHTML = `
    ${questionsGridOnlyHTML}
    ${talkFooterControlsHTML}
  `;

  return `
    <article class="talk-card ${isReading ? 'is-reading-card' : ''} ${isPart1Card ? 'is-part1-card' : ''}" data-talk-key="${talkKey}">
      <div class="talk-head">
        <div class="talk-title-wrap">
          <span class="talk-range">Câu ${talk.range}</span>
          ${showType ? `<span class="talk-type">${talk.type}</span>` : ''}
          <span class="tabular-nums" style="font-size: 0.85rem; color: var(--text-muted);">Bài ${index + 1}/${totalTalks}</span>
        </div>
        <div class="talk-head-right" style="display: flex; align-items: center; gap: 8px;">
          ${userHighlights.length > 0 ? `
            <button type="button" class="tool-btn clear-highlights-btn" title="Xóa toàn bộ đánh dấu từ khóa">
              ${getIcon("x", 12)} <span>Xóa bôi (${userHighlights.length})</span>
            </button>
          ` : ''}

          ${!isExamMode ? `
            <button type="button" class="tool-btn toggle-transcript-btn" id="toggle-transcript-btn" title="${isReading ? 'Bật/Ẩn Giải thích, Dịch &amp; Từ vựng bên phải' : 'Bật/Ẩn Tapescript và phân tích bên phải'}">
              ${isReading
                ? (isTranscriptOpen ? `${getIcon("x", 13)} <span>Ẩn Giải thích</span>` : `${getIcon("fileText", 13)} <span>Giải thích &amp; Từ vựng</span>`)
                : (isTranscriptOpen ? `${getIcon("x", 13)} <span>Ẩn Tapescript</span>` : `${getIcon("fileText", 13)} <span>Xem Tapescript &amp; Dịch</span>`)
              }
            </button>
          ` : ''}

          <button type="button" class="bookmark-btn ${isBookmarked ? 'is-bookmarked' : ''}" data-action="bookmark">
            ${isBookmarked ? `${getIcon("bookmarkFilled", 13)} <span>Đã lưu</span>` : `${getIcon("bookmark", 13)} <span>Lưu</span>`}
          </button>
        </div>
      </div>

      <!-- Resizable Split Container -->
      <div class="talk-split-container ${isTranscriptOpen ? 'transcript-visible' : 'transcript-hidden'}">
        <!-- Left Pane: Passages or Audio Player + Questions -->
        <div class="talk-left-pane" style="position: relative;">
          ${isReading ? (Array.isArray(talk.passages) && talk.passages.length > 0 ? `
            <div class="p7-reader-shell">
              <div class="p7-reader-grid">
                ${renderPart7Passages(talk, talkKey, {
                  highlights: userHighlights,
                  isRevealed,
                  showVi: isRevealed && !isExamMode && p7State.showVi,
                  activeDocTab: p7State.activeDocTab,
                  activeEvidenceQ: isRevealed && !isExamMode ? p7State.activeEvidenceQ : null,
                  isExamMode
                })}
                <div class="p7-questions-pane">
                  <div class="p7-pane-head">
                    <span class="p7-pane-title">Câu hỏi ${talk.range}</span>
                    <span class="p7-pane-hint">Chuột phải hoặc bấm ⊘ để loại trừ</span>
                  </div>
                  ${questionsColumnHTML}
                </div>
              </div>
            </div>
          ` : `
            <div class="p5-reading-stage">
              <div class="p7-pane-head">
                <span class="p7-pane-title">Trắc nghiệm Đọc hiểu · Câu ${talk.range}</span>
                <span class="p7-pane-hint">Chuột phải hoặc bấm ⊘ để loại trừ</span>
              </div>
              ${questionsColumnHTML}
            </div>
          `) : `
            <!-- Audio Waveform Studio -->
            <div class="player-shell ${!state.showWaveform ? 'compact-audio' : ''}" ${isExamMode ? 'style="pointer-events: none;"' : ''}>
              <audio src="${talk.audio}" preload="metadata" class="talk-audio-el"></audio>

              <div class="waveform-wrap">
                <canvas class="waveform-canvas"></canvas>
                <div class="waveform-hover-tooltip">0:00</div>
              </div>

              <div class="player-main">
                <button type="button" class="play-btn" title="Phát / Dừng (Phím Space)">
                  ${getIcon("play", 16)}
                </button>
                <div class="time-readout">
                  <span class="time-current">0:00</span>
                  <span class="time-sep">/</span>
                  <span class="time-total">0:00</span>
                </div>

                <!-- Minimalist 1-Row Primary Controls -->
                <div class="tool-group">
                  <select class="studio-speed-select" aria-label="Tốc độ phát">
                    ${[0.75, 0.85, 1.0, 1.15, 1.25, 1.4].map((spd) => `
                      <option value="${spd}" ${Number(state.audioSettings.speed) === spd ? 'selected' : ''}>${spd.toFixed(spd === 1 || spd === 1.4 ? 1 : 2)}x</option>
                    `).join("")}
                  </select>
                  <button type="button" class="mini-pill toggle-intro-btn ${state.audioSettings.playIntro ? 'is-active' : ''}" title="Bật/Tắt đọc phần giới thiệu bài">
                    <span>Intro: ${state.audioSettings.playIntro ? 'BẬT' : 'TẮT'}</span>
                  </button>
                  ${(talk.questionsStart || 0) > 0 ? `
                  <button type="button" class="mini-pill toggle-questions-btn ${state.audioSettings.playQuestions ? 'is-active' : ''}" title="Bật/Tắt đọc câu hỏi sau bài nghe (Number 71... Number 72...)">
                    <span>Đọc câu hỏi: ${state.audioSettings.playQuestions ? 'BẬT' : 'TẮT'}</span>
                  </button>
                  ` : ''}
                  <button type="button" class="mini-pill toggle-audio-tools-btn" aria-expanded="false" title="Công cụ luyện nghe nâng cao (5s Skim, A-B Loop, Shadowing)">
                    ${getIcon("sliders", 12)} <span>Nâng cao</span>
                  </button>
                </div>
              </div>

              <!-- Collapsible Secondary Audio Tools Tray -->
              <div class="audio-advanced-tray" hidden>
                <button type="button" class="mini-pill skim-drill-btn ${state.audioSettings.preListenSkim ? 'is-active' : ''}" title="Đếm ngược 5 giây đọc lướt câu hỏi trước khi nghe">
                  ${getIcon("clock", 12)} <span>5s Skim</span>
                </button>
                <button type="button" class="mini-pill ab-loop-btn" title="Lặp đoạn A-B">${getIcon("repeat", 12)} <span>A-B Loop</span></button>
                ${!isExamMode ? `
                  <button type="button" class="mini-pill toggle-shadowing-drawer-btn" title="Bật/Thu gọn phòng luyện phát âm Shadowing">${getIcon("mic", 12)} <span>Luyện Shadowing</span></button>
                ` : ''}
              </div>

              <!-- Voice Shadowing Studio Collapsible Drawer -->
              <div class="shadowing-drawer" ${isExamMode ? 'style="display: none;"' : ''}>
                <div class="shadowing-drawer-content" id="shadowing-drawer-${talkKey}" style="display: none; margin-top: 10px;">
                  <div class="shadowing-panel">
                    <div class="shadowing-head">
                      <span class="shadowing-title" style="display: flex; align-items: center; gap: 6px;">
                        ${getIcon("mic", 14)} <span>Shadowing Studio (Ghi âm đối chiếu)</span>
                      </span>
                      <canvas class="mic-meter-canvas" width="90" height="20"></canvas>
                    </div>
                    <p class="muted-text" style="font-size: 0.82rem; margin: 0; line-height: 1.5;">
                      Ghi âm giọng nói nhại theo audio người bản xứ, sau đó bấm <strong>So sánh tuần tự</strong> để kiểm tra ngữ điệu:
                    </p>
                    <div class="shadowing-controls" style="margin-top: 4px;">
                      <button type="button" class="record-btn">Bắt đầu ghi âm</button>
                      <button type="button" class="mini-pill play-user-voice-btn" disabled>Nghe giọng bạn</button>
                      <button type="button" class="mini-pill play-dual-btn" disabled><span>So sánh tuần tự</span> ${getIcon("arrowRight", 11)}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Graphic & Questions Stage -->
            ${isPart1Card ? `
              <div class="p1-photo-q-grid">
                <div class="graphic-wrap p1-graphic-wrap" title="Bấm để phóng to bức ảnh">
                  <img src="${talk.image}" alt="Ảnh mô tả câu ${talk.range}" />
                  <div class="graphic-zoom-hint">${getIcon("zoomIn", 14)} <span>Phóng to</span></div>
                </div>
                <div class="p1-q-side">
                  ${questionsGridOnlyHTML}
                </div>
              </div>
              ${talkFooterControlsHTML}
            ` : `
              ${talk.image ? `
                <div class="graphic-wrap" title="Bấm để phóng to biểu đồ">
                  <img src="${talk.image}" alt="Graphic biểu đồ câu ${talk.range}" />
                  <div class="graphic-zoom-hint">${getIcon("zoomIn", 14)} <span>Phóng to</span></div>
                </div>
              ` : ''}

              ${questionsColumnHTML}
            `}
          `}
        </div>

        <!-- Resizer Handle -->
        <div class="split-resizer" title="Kéo để thay đổi kích thước cột (Click đúp để cân bằng 50/50)" ${isExamMode || !isTranscriptOpen ? 'style="display: none;"' : ''}>
          <div class="split-resizer-line"></div>
          <div class="split-resizer-handle"><svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="2.5" cy="2" r="1.5"/><circle cx="7.5" cy="2" r="1.5"/><circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/></svg></div>
        </div>

        <!-- Right Pane: Inspector -->
        <div class="talk-right-pane" ${isExamMode || !isTranscriptOpen ? 'style="display: none;"' : ''}>
          <div class="inspector-card">
            <div class="tab-nav-bar">
              <button type="button" class="tab-nav-btn ${activeTab === 'script' ? 'is-active' : ''}" data-tab="script">${isReading ? 'Bài đọc &amp; Dịch' : 'Live Script'}</button>
              <button type="button" class="tab-nav-btn ${activeTab === 'analysis' ? 'is-active' : ''}" data-tab="analysis">Phân tích &amp; Bẫy</button>
              ${!isReading ? `<button type="button" class="tab-nav-btn ${activeTab === 'dictation' ? 'is-active' : ''}" data-tab="dictation">Chép chính tả</button>` : ''}
              <button type="button" class="tab-nav-btn ${activeTab === 'vocab' ? 'is-active' : ''}" data-tab="vocab">Từ vựng</button>
            </div>

            <!-- Tab Body -->
            <div class="tab-panel-body" id="inspector-body-${talkKey}"></div>
          </div>
        </div>
      </div>
    </article>
  `;
}

/* ============================================================
   Wiring & Event Binding for Talk Card
   ============================================================ */
function wireTalkCard(mountEl, talk, talkKey, isExamMode = false) {
  const card = mountEl.querySelector(`.talk-card[data-talk-key="${talkKey}"]`);
  if (!card) return;

  const isReading = Boolean(talk.isReading || !talk.audio);
  const audioEl = isReading ? null : card.querySelector(".talk-audio-el");
  const canvasEl = isReading ? null : card.querySelector(".waveform-canvas");
  const playBtn = card.querySelector(".play-btn");
  const timeCur = card.querySelector(".time-current");
  const timeTot = card.querySelector(".time-total");
  const hoverTooltip = card.querySelector(".waveform-hover-tooltip");
  const inspectorBody = card.querySelector(`#inspector-body-${talkKey}`);

  // Clean up any previous engine for this talk
  const prevEngine = activeEngines.get(talkKey);
  if (prevEngine) prevEngine.destroy();

  let engine = null;
  let sync = null;

  if (!isReading && audioEl) {
    activeAudio = audioEl;

    // Initialize Audio Engine
    engine = new AudioEngine(audioEl, canvasEl, {
      segments: talk.segments || [],
      talkKey,
      talkBounds: {
        introEnd: talk.introEnd || 0,
        talkStart: talk.talkStart || 0,
        talkEnd: talk.talkEnd || 0,
        questionsStart: talk.questionsStart || 0,
        questionsEnd: talk.questionsEnd || 0
      },
      playIntro: state.audioSettings.playIntro,
      playQuestions: state.audioSettings.playQuestions,
      onMonologueEnd: () => {
        showToast("Đã xong bài nói! (Tự động dừng vì tắt đọc câu hỏi)", "info");
        if (isExamMode) {
          showIntermissionOverlay(card);
        }
      },
      onTimeUpdate: (cur, dur) => {
        if (timeCur) timeCur.textContent = fmtTime(cur);
        if (timeTot && dur > 0) timeTot.textContent = fmtTime(dur);
        if (sync) sync.syncTime(cur);
      },
      onPlayStateChange: (isPlaying) => {
        if (playBtn) playBtn.innerHTML = isPlaying ? getIcon("pause", 16) : getIcon("play", 16);
      },
      onWaveformHover: (info) => {
        if (!hoverTooltip) return;
        if (!info) {
          hoverTooltip.style.display = "none";
        } else {
          hoverTooltip.style.display = "block";
          hoverTooltip.style.left = `${info.x}px`;
          hoverTooltip.textContent = `${fmtTime(info.time)}${info.text ? ' · ' + info.text.slice(0, 32) + '...' : ''}`;
        }
      }
    });
    activeEngines.set(talkKey, engine);

    // Toggle Intro Button on Card
    const introBtn = card.querySelector(".toggle-intro-btn");
    introBtn?.addEventListener("click", () => {
      setPlayIntroState(!state.audioSettings.playIntro);
      showToast(state.audioSettings.playIntro ? "Đã BẬT đọc phần giới thiệu bài!" : "Đã TẮT đọc phần giới thiệu (Bỏ qua 5s mở đầu)!");
    });

    // Toggle Questions Button on Card
    const questionsBtn = card.querySelector(".toggle-questions-btn");
    questionsBtn?.addEventListener("click", () => {
      setPlayQuestionsState(!state.audioSettings.playQuestions);
      showToast(state.audioSettings.playQuestions ? "Đã BẬT đọc câu hỏi sau bài nghe!" : "Đã TẮT đọc câu hỏi (Dừng lại ngay sau bài nói)!");
    });

    // CBT Exam mode: listen for audio end to advance talk
    if (isExamMode) {
      audioEl.addEventListener("ended", () => {
        showIntermissionOverlay(card);
      }, { once: true });
    }

    // Play Button with 5s Pre-Listen Skim Drill check
    playBtn?.addEventListener("click", () => {
      if (audioEl.paused) {
        if (state.audioSettings.preListenSkim && Math.floor(audioEl.currentTime) === 0) {
          startSkimDrillCountdown(card, audioEl);
        } else {
          audioEl.play().catch(() => {});
        }
      } else {
        audioEl.pause();
      }
    });

    // 5s Skim Drill Toggle Button
    const skimBtn = card.querySelector(".skim-drill-btn");
    skimBtn?.addEventListener("click", () => {
      state.audioSettings.preListenSkim = !state.audioSettings.preListenSkim;
      saveState();
      skimBtn.classList.toggle("is-active", state.audioSettings.preListenSkim);
      showToast(state.audioSettings.preListenSkim ? "Đã BẬT đếm ngược 5s đọc lướt câu hỏi trước khi nghe!" : "Đã TẮT 5s Skim Drill.");
    });

    // Playback Speed Dropdown
    const speedSel = card.querySelector(".studio-speed-select");
    speedSel?.addEventListener("change", () => {
      const speed = parseFloat(speedSel.value) || 1.0;
      engine.setSpeed(speed);
      state.audioSettings.speed = speed;
      saveState();
    });

    // Collapsible Secondary Audio Tools Tray Toggle
    const advToolsBtn = card.querySelector(".toggle-audio-tools-btn");
    const advTray = card.querySelector(".audio-advanced-tray");
    advToolsBtn?.addEventListener("click", () => {
      if (!advTray) return;
      const willOpen = advTray.hidden;
      advTray.hidden = !willOpen;
      advToolsBtn.classList.toggle("is-active", willOpen);
      advToolsBtn.setAttribute("aria-expanded", String(willOpen));
    });

    // A-B Loop Button (also marks step 4 mastery)
    const abBtn = card.querySelector(".ab-loop-btn");
    abBtn?.addEventListener("click", () => {
      if (engine.isLooping) {
        engine.clearABLoop();
        abBtn.innerHTML = `${getIcon("repeat", 12)} <span>A-B Loop</span>`;
        abBtn.classList.remove("is-active");
      } else {
        const cur = audioEl.currentTime;
        engine.setABLoop(cur, cur + 5);
        abBtn.innerHTML = `${getIcon("repeat", 12)} <span>Hủy Loop</span>`;
        abBtn.classList.add("is-active");
        updateMastery(talkKey, "shadowing", true);
        showToast(`Đã bật A-B Loop từ ${fmtTime(cur)}. Hoàn thành Bước 4!`, "success");
      }
    });

    // Voice Shadowing Studio in Drawer
    const micCanvas = card.querySelector(".mic-meter-canvas");
    const studio = new VoiceStudio(talkKey, micCanvas, {
      onStateChange: ({ hasRecording, isRecording }) => {
        const recordBtn = card.querySelector(".record-btn");
        const userBtn = card.querySelector(".play-user-voice-btn");
        const dualBtn = card.querySelector(".play-dual-btn");

        if (recordBtn) {
          recordBtn.innerHTML = isRecording ? `<span class="recording-dot"></span> <span>Dừng ghi âm</span>` : `${getIcon("mic", 14)} <span>Bắt đầu ghi âm</span>`;
          recordBtn.classList.toggle("is-recording", isRecording);
        }
        if (userBtn) userBtn.disabled = !hasRecording;
        if (dualBtn) dualBtn.disabled = !hasRecording;
      }
    });
    activeStudios.set(talkKey, studio);

    // Toggle Shadowing Drawer Button
    card.querySelector(".toggle-shadowing-drawer-btn")?.addEventListener("click", (e) => {
      const drawer = card.querySelector(`#shadowing-drawer-${talkKey}`);
      if (drawer) {
        const isHidden = drawer.style.display === "none";
        drawer.style.display = isHidden ? "block" : "none";
        e.currentTarget.classList.toggle("is-active", isHidden);
      }
    });

    card.querySelector(".record-btn")?.addEventListener("click", () => {
      if (studio.isRecording) {
        studio.stopRecording();
        showToast("Đã lưu đoạn ghi âm của bạn! Hoàn thành Bước 4!", "success");
      } else {
        studio.startRecording();
      }
    });

    card.querySelector(".play-user-voice-btn")?.addEventListener("click", () => studio.playUserVoice());
    card.querySelector(".play-dual-btn")?.addEventListener("click", () => studio.playDualComparison(audioEl));
  } else {
    activeAudio = null;
    activeEngines.delete(talkKey);
    activeStudios.delete(talkKey);
  }

  // Toggle Transcript / Inspector Button on Card
  card.querySelector(".toggle-transcript-btn")?.addEventListener("click", () => {
    toggleTranscript();
  });

  // Check Talk Answers Button (Practice Mode)
  card.querySelector(".check-talk-btn")?.addEventListener("click", () => {
    state.checkedTalks[talkKey] = true;
    saveState();
    renderAll();
    showToast(isReading ? "Đã kiểm tra đáp án bài đọc này!" : "Đã kiểm tra đáp án bài nghe này!", "success");
  });

  // Reset Single Talk Answers Button
  card.querySelector(".reset-talk-btn")?.addEventListener("click", () => {
    const numQ = talk.questions?.length || 1;
    if (confirm(`Bạn có chắc muốn làm lại bài Câu ${talk.range} (${numQ} câu) không?\n\nĐáp án đã chọn của bài này sẽ được xóa để bạn làm lại.`)) {
      delete state.checkedTalks[talkKey];
      delete state.revealedScripts[talkKey];
      if (isReading) p7ViewState.delete(talkKey);
      const testId = talk.testId || state.activeTest;
      (talk.questions || []).forEach((q) => {
        deleteAnswer(testId, q.num);
        deleteConfidence(testId, q.num);
        deleteEliminations(testId, q.num);
      });
      saveState();
      renderAll();
      showToast(`Đã làm mới bài Câu ${talk.range}. Bạn có thể chọn lại đáp án!`, "info");
    }
  });

  // Part 7 Passages Pane Helpers
  const refreshPassagesPane = (resetScroll = false) => {
    if (!isReading) return;
    const pane = card.querySelector(".p7-passages-pane");
    if (!pane) return;
    const p7 = getP7State(talkKey);
    const isCheckedNow = Boolean(state.checkedTalks[talkKey]);
    const isRevealedNow = state.mode === "study" || (state.mode === "practice" && isCheckedNow);
    const tmp = document.createElement("div");
    tmp.innerHTML = renderPart7Passages(talk, talkKey, {
      highlights: state.highlights[talkKey] || [],
      isRevealed: isRevealedNow,
      showVi: isRevealedNow && !isExamMode && p7.showVi,
      activeDocTab: p7.activeDocTab,
      activeEvidenceQ: isRevealedNow && !isExamMode ? p7.activeEvidenceQ : null,
      isExamMode
    });
    if (tmp.firstElementChild) {
      const prevTop = resetScroll ? 0 : pane.scrollTop;
      pane.innerHTML = tmp.firstElementChild.innerHTML;
      pane.scrollTop = prevTop;
    }
  };

  const focusEvidenceQuestion = (qNum) => {
    if (!isReading) return;
    const p7 = getP7State(talkKey);
    const num = Number(qNum);
    const qObj = (talk.questions || []).find((q) => q.num === num);
    if (!qObj) return;
    p7.activeEvidenceQ = num;
    if (p7.activeDocTab !== "all" && qObj.evidenceDoc) {
      p7.activeDocTab = qObj.evidenceDoc;
    }
    refreshPassagesPane(false);
    const pane = card.querySelector(".p7-passages-pane");
    const evEl = pane?.querySelector(`.p7-evidence-mark[data-evidence-q="${num}"]`) ||
                 pane?.querySelector(`.p7-doc-card[data-doc-id="${qObj.evidenceDoc}"]`);
    if (evEl) {
      evEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Transcript Sync (Listening only)
  if (!isReading && audioEl) {
    sync = new TranscriptSync(talk, inspectorBody, audioEl, {
      onWordClick: (word, start, end, x, y) => {
        sync.showWordPopover(word, start, end, x, y);
      }
    });
    activeSyncs.set(talkKey, sync);
  } else {
    activeSyncs.delete(talkKey);
  }

  // Inspector Tab Switching
  const renderCurrentTab = (tabName) => {
    const resolvedTab = (isReading && tabName === "dictation") ? "script" : tabName;
    state.inspectorTabs[talkKey] = resolvedTab;
    saveState();

    card.querySelectorAll(".tab-nav-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === resolvedTab);
    });

    if (!inspectorBody) return;

    if (isReading) {
      const isCheckedNow = Boolean(state.checkedTalks[talkKey]);
      const isLockedPractice = state.mode === "practice" && !isCheckedNow;
      if ((resolvedTab === "script" || resolvedTab === "analysis") && isLockedPractice) {
        inspectorBody.innerHTML = `
          <div style="padding: 20px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border); text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center;">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--accent-soft); color: var(--accent); display: grid; place-items: center;">${getIcon("lock", 20)}</div>
            <div style="font-weight: 600; color: var(--text);">Bản dịch &amp; Giải thích đang ẩn trong chế độ Làm bài</div>
            <p class="muted-text" style="font-size: 0.84rem; margin: 0;">Hoàn thành các câu hỏi rồi bấm <strong>Kiểm tra bài này</strong> hoặc chuyển sang chế độ <strong>Giải mã</strong> để xem dịch từng đoạn và phân tích bẫy chi tiết.</p>
            <button type="button" class="btn-primary quick-check-talk-btn" style="margin-top: 4px; padding: 7px 14px; font-size: 0.82rem;">Kiểm tra bài này ngay</button>
          </div>
        `;
        inspectorBody.querySelector(".quick-check-talk-btn")?.addEventListener("click", () => {
          state.checkedTalks[talkKey] = true;
          saveState();
          renderAll();
        });
        return;
      }

      if (resolvedTab === "script") {
        inspectorBody.innerHTML = renderReadingInspectorScript(talk);
      } else if (resolvedTab === "analysis") {
        inspectorBody.innerHTML = renderEvidenceAnalysis(talk);
        updateMastery(talkKey, "decode", true);
        inspectorBody.querySelectorAll(".jump-evidence-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            focusEvidenceQuestion(btn.dataset.qnum);
          });
        });
      } else if (resolvedTab === "vocab") {
        inspectorBody.innerHTML = renderVocabAndNotes(talk, talkKey);
        wireNotesEvents(inspectorBody, talk, talkKey, null);
      }
      return;
    }

    const isPart1Or2Listening = !isReading && (Number(talk.part) === 1 || Number(talk.part) === 2 || /^ets2019_p[12]_/.test(state.activeTest));
    const isCheckedNowListening = Boolean(state.checkedTalks[talkKey]);
    const isLockedP12Script = isPart1Or2Listening && state.mode === "practice" && !isCheckedNowListening && !Boolean(state.revealedScripts[talkKey]);

    if ((resolvedTab === "script" || resolvedTab === "analysis") && isLockedP12Script) {
      inspectorBody.innerHTML = `
        <div style="padding: 20px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border); text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center;">
          <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--accent-soft); color: var(--accent); display: grid; place-items: center;">${getIcon("headphones", 20)}</div>
          <div style="font-weight: 600; color: var(--text);">Chế độ Nghe Thực Chiến Chuẩn Thi Thật (Part ${talk.part || 1})</div>
          <p class="muted-text" style="font-size: 0.84rem; margin: 0;">Trong đề thi TOEIC thật, câu thoại A–D của Part 1 &amp; Part 2 không in trên giấy. Hãy nghe và chọn đáp án trước, sau đó bấm <strong>Kiểm tra bài này</strong> (hoặc mở Tapescript bên dưới nếu muốn xem chữ ngay).</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 4px;">
            <button type="button" class="btn-primary quick-check-p12-btn" style="padding: 7px 14px; font-size: 0.82rem;">${getIcon("check", 14)} <span>Kiểm tra &amp; Xem giải thích</span></button>
            <button type="button" class="tool-btn unlock-p12-script-btn" style="padding: 7px 12px; font-size: 0.82rem;">${getIcon("eye", 14)} <span>Mở Tapescript ngay</span></button>
          </div>
        </div>
      `;
      inspectorBody.querySelector(".quick-check-p12-btn")?.addEventListener("click", () => {
        state.checkedTalks[talkKey] = true;
        saveState();
        renderAll();
      });
      inspectorBody.querySelector(".unlock-p12-script-btn")?.addEventListener("click", () => {
        state.revealedScripts[talkKey] = true;
        saveState();
        renderCurrentTab(resolvedTab);
      });
      return;
    }

    if (resolvedTab === "script") {
      inspectorBody.innerHTML = sync.renderLiveScript(state.scriptViewMode);
      wireLiveScriptEvents(inspectorBody, sync, engine, audioEl);
    } else if (resolvedTab === "analysis") {
      inspectorBody.innerHTML = renderEvidenceAnalysis(talk);
      updateMastery(talkKey, "decode", true);
    } else if (resolvedTab === "dictation") {
      const saved = (state.dictationProgress[talkKey] || {}).answers || {};
      const curLevel = (state.dictationProgress[talkKey] || {}).level || "basic";
      inspectorBody.innerHTML = sync.renderDictation(curLevel, saved);
      wireDictationEvents(inspectorBody, talkKey, sync, audioEl);
    } else if (resolvedTab === "vocab") {
      inspectorBody.innerHTML = renderVocabAndNotes(talk, talkKey);
      wireNotesEvents(inspectorBody, talk, talkKey, audioEl);
    }
  };

  card.querySelectorAll(".tab-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => renderCurrentTab(btn.dataset.tab));
  });
  renderCurrentTab(state.inspectorTabs[talkKey] || "script");

  // Wire Part 7 Passages Pane Interactions (Doc tabs, Bilingual toggle, Clear evidence, Drag highlight)
  if (isReading) {
    const passagesPane = card.querySelector(".p7-passages-pane");
    if (passagesPane && !passagesPane.dataset.p7Wired) {
      passagesPane.dataset.p7Wired = "1";
      passagesPane.addEventListener("click", (e) => {
        const docBtn = e.target.closest(".p7-doc-tab-btn");
        if (docBtn) {
          getP7State(talkKey).activeDocTab = docBtn.dataset.docTab || "all";
          refreshPassagesPane(true);
          return;
        }
        const viBtn = e.target.closest(".p7-toggle-vi-btn");
        if (viBtn) {
          const p7 = getP7State(talkKey);
          p7.showVi = !p7.showVi;
          refreshPassagesPane(false);
          return;
        }
        const clearEvBtn = e.target.closest(".p7-clear-evidence-btn");
        if (clearEvBtn) {
          getP7State(talkKey).activeEvidenceQ = null;
          refreshPassagesPane(false);
          return;
        }
      });

      passagesPane.addEventListener("mouseup", (e) => {
        if (e.detail >= 2 && e.target.closest(".highlight-mark")) return;
        if (e.target.closest("button")) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        const anchorEl = sel.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
        const focusEl = sel.focusNode?.nodeType === 3 ? sel.focusNode.parentElement : sel.focusNode;
        const startZone = anchorEl?.closest?.(".p7-hl-zone");
        const endZone = focusEl?.closest?.(".p7-hl-zone");
        if (!startZone || !endZone || anchorEl?.closest?.(".p7-vi-block") || focusEl?.closest?.(".p7-vi-block")) {
          return;
        }

        const text = sel.toString().replace(/\[[1-4]\]/g, " ").replace(/\s+/g, " ").trim();
        if (text.length >= 2 && text.length <= 120) {
          if (!state.highlights[talkKey]) state.highlights[talkKey] = [];
          const exists = state.highlights[talkKey].some((h) => h.toLowerCase() === text.toLowerCase());
          if (!exists) {
            state.highlights[talkKey].push(text);
            saveState();
            sel.removeAllRanges();
            card._syncAllHighlights?.();
            showToast(`Đã bôi vàng từ khóa: "${text}"`, "info");
          } else {
            sel.removeAllRanges();
          }
        }
      });
    }
  }

  // Expose Passage & Evidence helpers onto card for Questions panel & delegated highlight updates
  card._refreshPassagesPane = refreshPassagesPane;
  card._focusEvidenceQuestion = focusEvidenceQuestion;

  // Wire Questions Panel (Options, Confidence, Evidence Peek, Highlighter)
  wireQuestionsPanel(card, talk, talkKey, isExamMode, renderCurrentTab, inspectorBody);

  // Prev / Next Talk Footer Navigation
  const talks = TESTS.find((t) => t.id === state.activeTest)?.talks || [];
  const curIdx = state.currentIndex[state.activeTest] || 0;
  card.querySelector(".prev-talk-btn")?.addEventListener("click", () => {
    if (curIdx > 0) {
      pauseActiveAudio();
      state.currentIndex[state.activeTest] = curIdx - 1;
      saveState();
      renderAll();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  });
  card.querySelector(".next-talk-btn")?.addEventListener("click", () => {
    if (curIdx < talks.length - 1) {
      pauseActiveAudio();
      state.currentIndex[state.activeTest] = curIdx + 1;
      saveState();
      renderAll();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  });

  // Graphic Lightbox Click
  const graphicWrap = card.querySelector(".graphic-wrap");
  graphicWrap?.addEventListener("click", () => {
    if (talk.image) openGraphicLightbox(talk.image, `Sơ đồ câu ${talk.range}`);
  });

  // Bookmark Button
  card.querySelector('[data-action="bookmark"]')?.addEventListener("click", (e) => {
    state.bookmarks[talkKey] = !state.bookmarks[talkKey];
    saveState();
    const isBookmarked = state.bookmarks[talkKey];
    e.currentTarget.classList.toggle("is-bookmarked", isBookmarked);
    e.currentTarget.innerHTML = isBookmarked ? `${getIcon("bookmarkFilled", 13)} <span>Đã lưu</span>` : `${getIcon("bookmark", 13)} <span>Lưu</span>`;
    showToast(isBookmarked ? "Đã lưu vào danh sách Bookmark" : "Đã bỏ lưu");
  });

  // Mobile Bottom Sheet Trigger
  card.querySelector(".mobile-sheet-trigger-btn")?.addEventListener("click", () => {
    openMobileBottomSheet(talk, talkKey, sync, engine, audioEl);
  });

  // Resizable Split Pane Divider
  wireSplitResizer(card);
}

function renderQuestionsHTML(talk, talkKey, isExamMode) {
  const userHighlights = state.highlights[talkKey] || [];
  const isChecked = Boolean(state.checkedTalks[talkKey]);
  const isRevealed = state.mode === "study" || (state.mode === "practice" && isChecked);
  const testId = talk.testId || state.activeTest;
  const isPart1 = Number(talk.part) === 1 || /^ets2019_p1_/.test(testId);
  const isPart2 = Number(talk.part) === 2 || /^ets2019_p2_/.test(testId);
  const isPart1Or2 = isPart1 || isPart2;
  const peekSpoken = Boolean(state.peekBlindOptions?.[talkKey]);
  const hideSpokenText = isPart1Or2 && !isRevealed && !peekSpoken;

  return (talk.questions || []).map((q) => {
    const userAns = getAnswer(testId, q.num);
    const conf = getConfidence(testId, q.num);
    const isEliminated = getEliminations(testId, q.num);
    const isLucky = isRevealed && userAns === q.answer && conf === "guess";

    const displayStemRaw = hideSpokenText
      ? (isPart1 ? "Nghe 4 câu mô tả và chọn đáp án đúng nhất với bức ảnh." : "Nghe câu hỏi/phát biểu và chọn lời hồi đáp phù hợp nhất.")
      : q.question;
    const highlightedStem = applyHighlights(displayStemRaw, userHighlights);

    return `
      <div class="q-block" data-qnum="${q.num}">
        <div class="q-header-row">
          <h3 class="q-stem">Câu ${q.num}. <span class="q-stem-text">${highlightedStem}</span></h3>
          <div style="display: inline-flex; align-items: center; gap: 6px;">
            ${!isExamMode && isPart1Or2 && !isRevealed ? `
              <button type="button" class="p12-peek-btn ${peekSpoken ? 'is-active' : ''}" data-peek-talk="${talkKey}" title="Bật/Ẩn lời thoại tiếng Anh trên các đáp án">
                ${getIcon(peekSpoken ? "eyeOff" : "eye", 13)}
                <span>${peekSpoken ? "Ẩn lời thoại" : "Hiện lời thoại"}</span>
              </button>
            ` : ''}
            ${!isExamMode && isRevealed ? `<button type="button" class="evidence-peek-btn" data-qnum="${q.num}">Soi chứng cứ</button>` : ''}
          </div>
        </div>

        <div class="options-list">
          ${q.options.map((opt) => {
            const isCheckedOpt = userAns === opt.choice;
            const isRight = isRevealed && opt.choice === q.answer;
            const isWrong = isRevealed && isCheckedOpt && opt.choice !== q.answer;
            const eliminated = isEliminated.includes(opt.choice);

            const optDisplayHTML = hideSpokenText
              ? `<span class="opt-blind-placeholder">Chọn phương án (${opt.choice})</span>`
              : applyHighlights(opt.text, userHighlights);

            return `
              <label class="opt-label ${isRight ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''} ${eliminated ? 'is-eliminated' : ''}" data-testid="${testId}" data-q="${q.num}" data-choice="${opt.choice}" title="Chuột phải hoặc bấm nút bên phải để gạch loại trừ">
                <input type="radio" name="q_${q.num}" value="${opt.choice}" ${isCheckedOpt ? 'checked' : ''} />
                <span class="opt-key">${opt.choice}</span>
                <span class="opt-text">${optDisplayHTML}</span>
                <button type="button" class="opt-elim-btn" aria-pressed="${eliminated}" aria-label="Gạch loại trừ đáp án ${opt.choice}" title="Gạch loại trừ đáp án (hoặc chuột phải)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6 18.4 18.4"/></svg>
                </button>
              </label>
            `;
          }).join("")}
        </div>

        <!-- Confidence Tagging Bar -->
        <div class="confidence-bar">
          <span class="confidence-label">Độ tự tin:</span>
          <div class="confidence-options">
            <button type="button" class="conf-chip ${conf === 'sure' ? 'is-active' : ''}" data-conf="sure" data-qnum="${q.num}">Chắc chắn</button>
            <button type="button" class="conf-chip ${conf === 'doubt' ? 'is-active' : ''}" data-conf="doubt" data-qnum="${q.num}">Phân vân</button>
            <button type="button" class="conf-chip ${conf === 'guess' ? 'is-active' : ''}" data-conf="guess" data-qnum="${q.num}">Đoán</button>
          </div>
          ${isLucky ? `<span class="lucky-guess-badge">${getIcon("crosshair", 12)} <span>Đoán đúng</span></span>` : ''}
        </div>
      </div>
    `;
  }).join("");
}

let eliminationHandlersInitialized = false;
let pendingRightClick = null;
let rightClickSeq = 0;

function getElementTarget(target) {
  return target && target.nodeType === 3 ? target.parentElement : target;
}

function getVisibleOptionLabelFromEvent(e) {
  if (document.body.classList.contains("is-cham-hub-active")) return null;
  const el = getElementTarget(e.target);
  const label = el?.closest?.(".opt-label");
  if (!label) return null;
  const panel = label.closest('[role="tabpanel"]');
  if (panel && panel.hasAttribute("hidden")) return null;
  return label;
}

function toggleOptionEliminationUI(label) {
  const input = label.querySelector("input");
  const testId = label.dataset.testid || state.activeTest;
  const qNum = Number(label.dataset.q || input?.name?.replace("q_", "") || 0);
  const choice = label.dataset.choice || input?.value || "";
  if (!qNum || !choice) return;

  toggleElimination(testId, qNum, choice);
  const isElim = getEliminations(testId, qNum).includes(choice);
  label.classList.toggle("is-eliminated", isElim);
  const elimBtn = label.querySelector(".opt-elim-btn");
  if (elimBtn) {
    elimBtn.setAttribute("aria-pressed", String(isElim));
  }
  saveState();
  showToast(
    isElim
      ? `Đã gạch loại trừ đáp án ${choice} (Câu ${qNum})`
      : `Đã bỏ gạch loại trừ đáp án ${choice} (Câu ${qNum})`,
    "info"
  );
}

/**
 * Global capture-phase elimination handlers: resilient across DOM updates,
 * capture-phase right-click browser extensions, touchpads, and CBT/Focus views.
 */
function initGlobalEliminationHandlers() {
  if (eliminationHandlersInitialized) return;
  eliminationHandlersInitialized = true;

  window.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return;
    const label = getVisibleOptionLabelFromEvent(e);
    if (!label) {
      pendingRightClick = null;
      return;
    }
    pendingRightClick = {
      seq: ++rightClickSeq,
      label,
      x: e.clientX,
      y: e.clientY,
      ts: Date.now(),
      handled: false,
      fallbackToggled: false
    };
  }, true);

  window.addEventListener("contextmenu", (e) => {
    const label = getVisibleOptionLabelFromEvent(e);
    if (!label) return;

    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (
      pendingRightClick &&
      pendingRightClick.label === label &&
      pendingRightClick.fallbackToggled &&
      now - pendingRightClick.ts < 450
    ) {
      pendingRightClick = null;
      return;
    }

    if (pendingRightClick && pendingRightClick.label === label) {
      pendingRightClick.handled = true;
    } else {
      pendingRightClick = null;
    }
    toggleOptionEliminationUI(label);
  }, true);

  window.addEventListener("mouseup", (e) => {
    if (e.button !== 2 || !pendingRightClick) return;
    const snap = pendingRightClick;
    if (snap.handled) return;

    const releaseLabel = getVisibleOptionLabelFromEvent(e);
    if (releaseLabel !== snap.label) return;

    const moved = Math.hypot(e.clientX - snap.x, e.clientY - snap.y);
    if (moved > 12) return;

    setTimeout(() => {
      if (!pendingRightClick || pendingRightClick.seq !== snap.seq || pendingRightClick.handled) return;
      pendingRightClick.handled = true;
      pendingRightClick.fallbackToggled = true;
      toggleOptionEliminationUI(snap.label);
    }, 80);
  }, true);

  document.addEventListener("click", (e) => {
    const btn = getElementTarget(e.target)?.closest?.(".opt-elim-btn");
    if (!btn) return;
    const label = btn.closest(".opt-label");
    if (!label) return;
    e.preventDefault();
    e.stopPropagation();
    toggleOptionEliminationUI(label);
  }, true);
}

function wireQuestionsPanel(card, talk, talkKey, isExamMode, renderCurrentTab, inspectorBody) {
  initGlobalEliminationHandlers();

  // Options: Click & Drag-to-Highlight Guard
  card.querySelectorAll(".opt-label").forEach((label) => {
    const input = label.querySelector("input");
    const qNum = Number(input.name.replace("q_", ""));
    const choice = input.value;

    label.addEventListener("click", (e) => {
      if (e.target.closest(".opt-elim-btn")) {
        e.preventDefault();
        return;
      }
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length >= 2) {
        e.preventDefault();
      }
    });

    input.addEventListener("change", () => {
      const testId = talk.testId || state.activeTest;
      const oldChoice = getAnswer(testId, qNum);
      setAnswer(testId, qNum, choice);

      // Telemetry answer-change tracking
      const qObj = talk.questions.find((q) => q.num === qNum);
      if (oldChoice && oldChoice !== choice && qObj) {
        examSimulator.recordAnswerChange(testId, qNum, oldChoice, choice, qObj.answer);
      }

      updateMastery(talkKey, "test", true);
      saveState();
      updateScores();
    });
  });

  // Confidence Tagging
  card.querySelectorAll(".conf-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const qNum = Number(chip.dataset.qnum);
      const conf = chip.dataset.conf;
      const testId = talk.testId || state.activeTest;
      setConfidence(testId, qNum, conf);
      saveState();

      chip.parentElement.querySelectorAll(".conf-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      showToast(`Độ tự tin câu ${qNum}: ${conf === "sure" ? "Chắc chắn" : (conf === "doubt" ? "Phân vân" : "Đoán")}`);
    });
  });

  // Part 1 & Part 2 Spoken Text Peek Toggle
  card.querySelectorAll(".p12-peek-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.peekBlindOptions) state.peekBlindOptions = {};
      state.peekBlindOptions[talkKey] = !state.peekBlindOptions[talkKey];
      const qContainer = card.querySelector(".questions-container");
      if (qContainer) {
        qContainer.innerHTML = renderQuestionsHTML(talk, talkKey, isExamMode);
        wireQuestionsPanel(card, talk, talkKey, isExamMode, renderCurrentTab, inspectorBody);
      }
    });
  });

  // Evidence Peek Button
  card.querySelectorAll(".evidence-peek-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qNum = btn.dataset.qnum;
      if (talk.isReading || !talk.audio) {
        card._focusEvidenceQuestion?.(qNum);
        if (state.showTranscript && renderCurrentTab) {
          renderCurrentTab("analysis");
        }
      } else if (renderCurrentTab) {
        renderCurrentTab("analysis");
      }
      const targetCard = inspectorBody?.querySelector(`.evidence-analysis-card[data-qnum="${qNum}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        targetCard.style.outline = "2px solid var(--accent)";
        setTimeout(() => { targetCard.style.outline = ""; }, 1800);
      }
    });
  });

  // In-place UI update for Highlights across Passages & Questions (never stops or resets audio)
  const updateHighlightsInPlace = () => {
    const qPane = card.querySelector(".p7-questions-pane");
    const prevQTop = qPane ? qPane.scrollTop : 0;
    const qContainer = card.querySelector(".questions-container");
    if (qContainer) {
      qContainer.innerHTML = renderQuestionsHTML(talk, talkKey, isExamMode);
      if (qPane) qPane.scrollTop = prevQTop;
    }
    card._refreshPassagesPane?.(false);
    const userHighlights = state.highlights[talkKey] || [];
    const headRight = card.querySelector(".talk-head-right");
    let clearBtn = card.querySelector(".clear-highlights-btn");
    if (userHighlights.length > 0) {
      if (!clearBtn && headRight) {
        clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "tool-btn clear-highlights-btn";
        clearBtn.title = "Xóa toàn bộ đánh dấu từ khóa";
        headRight.insertBefore(clearBtn, headRight.firstChild);
      }
      if (clearBtn) {
        clearBtn.innerHTML = `${getIcon("x", 12)} <span>Xóa bôi (${userHighlights.length})</span>`;
      }
    } else if (clearBtn) {
      clearBtn.remove();
    }
    wireQuestionsPanel(card, talk, talkKey, isExamMode, renderCurrentTab, inspectorBody);
  };
  card._syncAllHighlights = updateHighlightsInPlace;

  // Question Text Highlighter Selection (attach once per questionsContainer)
  const questionsContainer = card.querySelector(".questions-container");
  if (questionsContainer && !questionsContainer.dataset.hlWired) {
    questionsContainer.dataset.hlWired = "1";
    questionsContainer.addEventListener("mouseup", (e) => {
      // Ignore if double-clicking an existing highlight mark to delete it
      if (e.detail >= 2 && e.target.closest(".highlight-mark")) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;

      const anchorEl = sel.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
      const focusEl = sel.focusNode?.nodeType === 3 ? sel.focusNode.parentElement : sel.focusNode;
      const startZone = anchorEl?.closest?.(".q-stem-text, .q-stem, .opt-text");
      const endZone = focusEl?.closest?.(".q-stem-text, .q-stem, .opt-text");
      if (!startZone || !endZone || startZone.closest(".q-block") !== endZone.closest(".q-block")) {
        return;
      }

      let text = sel.toString().replace(/\s+/g, " ").trim().replace(/^Câu\s+\d+\.\s*/i, "").trim();
      if (text.length >= 2 && text.length <= 80) {
        if (!state.highlights[talkKey]) state.highlights[talkKey] = [];
        const exists = state.highlights[talkKey].some((h) => h.toLowerCase() === text.toLowerCase());
        if (!exists) {
          state.highlights[talkKey].push(text);
          saveState();
          sel.removeAllRanges();
          card._syncAllHighlights?.();
          showToast(`Đã bôi vàng từ khóa: "${text}"`, "info");
        } else {
          sel.removeAllRanges();
        }
      }
    });
  }

  // Delegated double-click on any highlight mark (passages OR questions) to remove it
  if (!card.dataset.hlDblWired) {
    card.dataset.hlDblWired = "1";
    card.addEventListener("dblclick", (e) => {
      const mark = e.target.closest(".highlight-mark");
      if (!mark) return;
      e.preventDefault();
      e.stopPropagation();
      window.getSelection()?.removeAllRanges();
      const hlText = (mark.dataset.highlight || mark.textContent || "").trim().toLowerCase();
      if (state.highlights[talkKey]) {
        state.highlights[talkKey] = state.highlights[talkKey].filter((h) => h.toLowerCase() !== hlText);
        saveState();
        card._syncAllHighlights?.();
        showToast(`Đã xóa đánh dấu: "${mark.textContent.trim()}"`);
      }
    });
  }

  // Clear Highlights Button (delegated once on card so it never duplicates)
  if (!card.dataset.clearHlWired) {
    card.dataset.clearHlWired = "1";
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".clear-highlights-btn")) return;
      state.highlights[talkKey] = [];
      saveState();
      card._syncAllHighlights?.();
      showToast("Đã xóa toàn bộ đánh dấu từ khóa.");
    });
  }
}

/* ============================================================
   5s Pre-Listen Skim Drill Countdown Overlay
   ============================================================ */
function startSkimDrillCountdown(card, audioEl) {
  const leftPane = card.querySelector(".talk-left-pane");
  if (!leftPane) {
    audioEl.play().catch(() => {});
    return;
  }

  let remaining = 5;
  const overlay = document.createElement("div");
  overlay.className = "skim-drill-overlay";
  overlay.innerHTML = `
    <div style="font-size: 0.82rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: #93c5fd;">5s Pre-Listen Skim Drill</div>
    <div style="font-size: 0.95rem; margin-top: 4px; color: #fff;">Đọc lướt nhanh từ khóa 3 câu hỏi trước khi nghe!</div>
    <div class="skim-drill-count" id="skim-count-display">${remaining}</div>
    <button type="button" class="tool-btn skip-skim-btn" style="margin-top: 10px; background: rgba(255,255,255,0.15); color: #fff; border: none;">
      ${getIcon("arrowRight", 13)} <span>Bỏ qua &amp; Nghe ngay</span>
    </button>
  `;
  leftPane.appendChild(overlay);

  const cleanup = () => {
    if (skimCountdownTimer) {
      clearInterval(skimCountdownTimer);
      skimCountdownTimer = null;
    }
    overlay.remove();
  };

  overlay.querySelector(".skip-skim-btn")?.addEventListener("click", () => {
    cleanup();
    audioEl.play().catch(() => {});
  });

  skimCountdownTimer = setInterval(() => {
    remaining--;
    const display = overlay.querySelector("#skim-count-display");
    if (display) display.textContent = String(remaining);

    if (remaining <= 0) {
      cleanup();
      audioEl.play().catch(() => {});
    }
  }, 1000);
}

/* ============================================================
   CBT Non-Blocking Intermission Countdown Bar
   (Allows user to select Part 1/2/3/4 answer freely during countdown!)
   ============================================================ */
function showIntermissionOverlay(card) {
  card.querySelector(".cbt-intermission-bar")?.remove();
  const qContainer = card.querySelector(".questions-container") || card.querySelector(".talk-left-pane") || card;

  const bar = document.createElement("div");
  bar.className = "cbt-intermission-bar";
  bar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; font-size: 0.88rem; font-weight: 500;">
      <span style="color: var(--ok); font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">${getIcon("clock", 14)} <span>Nghỉ chọn đáp án: <span id="intermission-display">8</span>s</span></span>
      <span style="color: var(--text-muted); font-weight: 600;">Bạn vẫn có thể khoanh đáp án trước khi tự chuyển câu tiếp theo.</span>
    </div>
    <button type="button" class="tool-btn skip-intermission-btn" style="background: var(--ok); color: var(--ok-contrast, #fff); border-color: var(--ok); font-weight: 500;">
      ${getIcon("arrowRight", 13)} <span>Câu tiếp ngay</span>
    </button>
  `;
  qContainer.prepend(bar);

  examSimulator.advanceToNextTalk((remaining) => {
    const disp = bar.querySelector("#intermission-display");
    if (disp) disp.textContent = String(remaining);
    if (remaining <= 0) {
      bar.remove();
    }
  });

  bar.querySelector(".skip-intermission-btn")?.addEventListener("click", () => {
    bar.remove();
    examSimulator.skipIntermission();
  });
}

/* ============================================================
   Mobile Bottom Sheet Drawer
   ============================================================ */
function openMobileBottomSheet(talk, talkKey, sync, engine, audioEl) {
  const backdrop = document.getElementById("mobile-sheet-backdrop");
  const drawer = document.getElementById("mobile-sheet-drawer");
  if (!backdrop || !drawer) return;

  const isReading = Boolean(talk.isReading || !talk.audio);
  const rawTab = state.inspectorTabs[talkKey] || "script";
  const activeTab = (isReading && rawTab === "dictation") ? "script" : rawTab;

  drawer.innerHTML = `
    <div class="mobile-sheet-bar"></div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border);">
      <h3 style="margin: 0; font-size: 0.95rem;">${isReading ? 'Bài đọc &amp; Giải thích' : 'Tapescript &amp; Công Cụ'} · Câu ${talk.range}</h3>
      <button type="button" class="tool-btn icon-only mobile-sheet-close-btn" style="width: 28px; height: 28px;">
        ${getIcon("x", 14)}
      </button>
    </div>
    <div class="tab-nav-bar" style="padding: 8px 14px;">
      <button type="button" class="tab-nav-btn ${activeTab === 'script' ? 'is-active' : ''}" data-mob-tab="script">${isReading ? 'Bài đọc &amp; Dịch' : 'Live Script'}</button>
      <button type="button" class="tab-nav-btn ${activeTab === 'analysis' ? 'is-active' : ''}" data-mob-tab="analysis">Phân tích</button>
      ${!isReading ? `<button type="button" class="tab-nav-btn ${activeTab === 'dictation' ? 'is-active' : ''}" data-mob-tab="dictation">Chính tả</button>` : ''}
      <button type="button" class="tab-nav-btn ${activeTab === 'vocab' ? 'is-active' : ''}" data-mob-tab="vocab">Từ vựng</button>
    </div>
    <div class="tab-panel-body" id="mobile-sheet-body" style="padding: 14px; overflow-y: auto; max-height: calc(85vh - 120px);"></div>
  `;

  const sheetBody = drawer.querySelector("#mobile-sheet-body");

  const closeSheet = () => {
    backdrop.classList.remove("is-open");
    drawer.classList.remove("is-open");
  };

  const renderMobileTab = (tabName) => {
    const resolved = (isReading && tabName === "dictation") ? "script" : tabName;
    drawer.querySelectorAll("[data-mob-tab]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mobTab === resolved);
    });

    if (isReading) {
      const isLockedPractice = state.mode === "practice" && !state.checkedTalks[talkKey];
      if ((resolved === "script" || resolved === "analysis") && isLockedPractice) {
        sheetBody.innerHTML = `
          <div style="padding: 18px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border); text-align: center; display: flex; flex-direction: column; gap: 8px; align-items: center;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--accent-soft); color: var(--accent); display: grid; place-items: center;">${getIcon("lock", 18)}</div>
            <div style="font-weight: 600;">Bản dịch &amp; Giải thích đang ẩn trong chế độ Làm bài</div>
            <p class="muted-text" style="font-size: 0.84rem; margin: 0;">Kiểm tra bài này hoặc chuyển sang Giải mã để mở khóa.</p>
          </div>
        `;
        return;
      }
      if (resolved === "script") {
        sheetBody.innerHTML = renderReadingInspectorScript(talk);
      } else if (resolved === "analysis") {
        sheetBody.innerHTML = renderEvidenceAnalysis(talk);
        sheetBody.querySelectorAll(".jump-evidence-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            closeSheet();
            const cardEl = document.querySelector(`.talk-card[data-talk-key="${talkKey}"]`);
            cardEl?._focusEvidenceQuestion?.(btn.dataset.qnum);
          });
        });
      } else if (resolved === "vocab") {
        sheetBody.innerHTML = renderVocabAndNotes(talk, talkKey);
        wireNotesEvents(sheetBody, talk, talkKey, null);
      }
      return;
    }

    const isPart1Or2Listening = !isReading && (Number(talk.part) === 1 || Number(talk.part) === 2 || /^ets2019_p[12]_/.test(state.activeTest));
    const isCheckedNowListening = Boolean(state.checkedTalks[talkKey]);
    const isLockedP12Script = isPart1Or2Listening && state.mode === "practice" && !isCheckedNowListening && !Boolean(state.revealedScripts[talkKey]);

    if ((resolved === "script" || resolved === "analysis") && isLockedP12Script) {
      sheetBody.innerHTML = `
        <div style="padding: 18px; border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--border); text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center;">
          <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--accent-soft); color: var(--accent); display: grid; place-items: center;">${getIcon("headphones", 18)}</div>
          <div style="font-weight: 600; color: var(--text);">Chế độ Nghe Thực Chiến Chuẩn Thi Thật (Part ${talk.part || 1})</div>
          <p class="muted-text" style="font-size: 0.84rem; margin: 0;">Trong đề thi TOEIC thật, câu thoại A–D của Part 1 &amp; Part 2 không in trên giấy. Hãy nghe và chọn đáp án trước, sau đó kiểm tra hoặc mở Tapescript bên dưới.</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 4px;">
            <button type="button" class="btn-primary mob-quick-check-p12-btn" style="padding: 7px 14px; font-size: 0.82rem;">${getIcon("check", 14)} <span>Kiểm tra &amp; Xem giải thích</span></button>
            <button type="button" class="tool-btn mob-unlock-p12-script-btn" style="padding: 7px 12px; font-size: 0.82rem;">${getIcon("eye", 14)} <span>Mở Tapescript ngay</span></button>
          </div>
        </div>
      `;
      sheetBody.querySelector(".mob-quick-check-p12-btn")?.addEventListener("click", () => {
        state.checkedTalks[talkKey] = true;
        saveState();
        closeSheet();
        renderAll();
      });
      sheetBody.querySelector(".mob-unlock-p12-script-btn")?.addEventListener("click", () => {
        state.revealedScripts[talkKey] = true;
        saveState();
        renderMobileTab(resolved);
      });
      return;
    }

    if (resolved === "script") {
      sheetBody.innerHTML = sync.renderLiveScript(state.scriptViewMode);
      wireLiveScriptEvents(sheetBody, sync, engine, audioEl);
    } else if (resolved === "analysis") {
      sheetBody.innerHTML = renderEvidenceAnalysis(talk);
    } else if (resolved === "dictation") {
      const saved = (state.dictationProgress[talkKey] || {}).answers || {};
      const curLevel = (state.dictationProgress[talkKey] || {}).level || "basic";
      sheetBody.innerHTML = sync.renderDictation(curLevel, saved);
      wireDictationEvents(sheetBody, talkKey, sync, audioEl);
    } else if (resolved === "vocab") {
      sheetBody.innerHTML = renderVocabAndNotes(talk, talkKey);
      wireNotesEvents(sheetBody, talk, talkKey, audioEl);
    }
  };

  drawer.querySelectorAll("[data-mob-tab]").forEach((btn) => {
    btn.addEventListener("click", () => renderMobileTab(btn.dataset.mobTab));
  });

  renderMobileTab(activeTab);

  backdrop.classList.add("is-open");
  drawer.classList.add("is-open");

  backdrop.onclick = closeSheet;
  drawer.querySelector(".mobile-sheet-close-btn")?.addEventListener("click", closeSheet);
}

/* ============================================================
   Wire Live Script & Karaoke Events
   ============================================================ */
function wireLiveScriptEvents(container, sync, engine, audioEl) {
  // Sentence click to seek
  container.querySelectorAll(".lt-seg").forEach((segEl) => {
    segEl.addEventListener("click", (e) => {
      if (e.target.closest(".seg-loop-btn")) return;
      const start = parseFloat(segEl.dataset.start);
      audioEl.currentTime = start;
      audioEl.play().catch(() => {});
    });
  });

  // Sentence Loop Button
  container.querySelectorAll(".seg-loop-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const start = parseFloat(btn.dataset.start);
      const end = parseFloat(btn.dataset.end);
      const looping = engine.setSentenceLoop(start, end);
      btn.innerHTML = looping ? `${getIcon("repeat1", 13)} <span>Hủy Loop</span>` : `${getIcon("repeat1", 13)} <span>Lặp</span>`;
      showToast(looping ? "Đang lặp câu này" : "Đã hủy lặp");
    });
  });

  // Word double-click popover
  container.querySelectorAll(".lt-word").forEach((wEl) => {
    wEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const word = wEl.dataset.word;
      const start = parseFloat(wEl.dataset.start);
      const end = parseFloat(wEl.dataset.end);
      const rect = wEl.getBoundingClientRect();
      sync.showWordPopover(word, start, end, rect.left, rect.bottom);
    });
  });

  // Follow Audio Floating Button
  container.querySelector(".floating-follow-btn")?.addEventListener("click", () => {
    sync.resumeAutoScroll();
  });

  // View Mode Switcher
  container.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.scriptViewMode = btn.dataset.view;
      saveState();
      container.innerHTML = sync.renderLiveScript(state.scriptViewMode);
      wireLiveScriptEvents(container, sync, engine, audioEl);
    });
  });
}

/* ============================================================
   Wire Cloze Dictation Events
   ============================================================ */
function wireDictationEvents(container, talkKey, sync, audioEl) {
  // Difficulty Level Switcher
  container.querySelectorAll("[data-dict-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLevel = btn.dataset.dictLevel;
      if (!state.dictationProgress[talkKey]) state.dictationProgress[talkKey] = {};
      state.dictationProgress[talkKey].level = newLevel;
      saveState();
      const saved = state.dictationProgress[talkKey].answers || {};
      if (sync) {
        container.innerHTML = sync.renderDictation(newLevel, saved);
        wireDictationEvents(container, talkKey, sync, audioEl);
      }
      showToast(`Đã chuyển độ khó: ${btn.textContent.trim()}`);
    });
  });

  // Check Dictation Button
  container.querySelector(".check-dictation-btn")?.addEventListener("click", () => {
    const inputs = container.querySelectorAll(".cloze-input");
    let correct = 0;
    const answers = {};

    inputs.forEach((input) => {
      const idx = input.dataset.blankIdx;
      const val = input.value.trim().toLowerCase();
      const target = input.dataset.target.toLowerCase();
      answers[idx] = input.value;

      const isRight = val === target;
      input.classList.toggle("is-correct", isRight);
      input.classList.toggle("is-wrong", !isRight);
      if (isRight) correct++;
    });

    const pct = inputs.length ? Math.round((correct / inputs.length) * 100) : 0;
    const scoreWrap = container.querySelector("#dictation-score-wrap");
    if (scoreWrap) {
      scoreWrap.style.display = "block";
      scoreWrap.textContent = `Kết quả: ${correct}/${inputs.length} từ chính xác (${pct}%)`;
    }

    if (!state.dictationProgress[talkKey]) state.dictationProgress[talkKey] = {};
    state.dictationProgress[talkKey].score = pct;
    state.dictationProgress[talkKey].answers = answers;
    if (pct >= 80) {
      updateMastery(talkKey, "dictation", true);
      showToast(`Xuất sắc! Đạt ${pct}% chính tả. Hoàn thành Bước 3!`, "success");
    } else {
      showToast(`Đạt ${pct}%. Cố gắng thêm để đạt 80%+ nhé!`);
    }
    saveState();
  });

  // Reset Dictation Button
  container.querySelector(".reset-dictation-btn")?.addEventListener("click", () => {
    container.querySelectorAll(".cloze-input").forEach((inp) => {
      inp.value = "";
      inp.classList.remove("is-correct", "is-wrong");
    });
    if (state.dictationProgress[talkKey]) {
      state.dictationProgress[talkKey].answers = {};
      saveState();
    }
    const scoreWrap = container.querySelector("#dictation-score-wrap");
    if (scoreWrap) scoreWrap.style.display = "none";
  });

  // Enter Key on Cloze Input (Check word immediately & jump to next)
  const inputs = container.querySelectorAll(".cloze-input");
  inputs.forEach((inp, idx) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = inp.value.trim().toLowerCase();
        const target = inp.dataset.target.toLowerCase();
        const isRight = val === target;
        inp.classList.toggle("is-correct", isRight);
        inp.classList.toggle("is-wrong", !isRight);
        if (isRight) {
          showToast(`Chính xác: "${inp.dataset.target}"!`, "success", 1200);
        } else {
          showToast(`Chưa đúng: hãy nghe lại câu này nhé!`, "bad", 1200);
        }
        if (inputs[idx + 1]) {
          inputs[idx + 1].focus();
        }
      }
    });
  });

  // Click on sentence timestamp or play button to listen
  container.querySelectorAll(".dict-play-time, .dict-play-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!audioEl) return;
      const start = parseFloat(btn.dataset.start);
      const end = parseFloat(btn.dataset.end || (start + 6));
      audioEl.currentTime = Math.max(0, start - 0.05);
      audioEl.play().catch(() => {});
      const timeHandler = () => {
        if (audioEl.currentTime >= end + 0.15) {
          audioEl.pause();
          audioEl.removeEventListener("timeupdate", timeHandler);
        }
      };
      audioEl.addEventListener("timeupdate", timeHandler);
    });
  });
}

/* ============================================================
   Wire Notes & Timestamp Links & Lexical Chunks
   ============================================================ */
function wireNotesEvents(container, talk, talkKey, audioEl) {
  const textarea = container.querySelector(".timestamp-note-area");
  const linksWrap = container.querySelector(".parsed-note-links");

  const parseLinks = (text) => {
    const regex = /\[(\d{1,2}):(\d{2})\]/g;
    const matches = Array.from(text.matchAll(regex));
    if (!linksWrap) return;
    if (!matches.length) {
      linksWrap.innerHTML = "";
      return;
    }
    linksWrap.innerHTML = `<strong>Tua nhanh:</strong> ` + matches.map((m) => {
      const sec = parseInt(m[1]) * 60 + parseInt(m[2]);
      return `<button type="button" class="mini-pill time-link-btn" data-time="${sec}">${getIcon("play", 10)} <span>${m[0]}</span></button>`;
    }).join(" ");

    linksWrap.querySelectorAll(".time-link-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!audioEl) return;
        audioEl.currentTime = parseFloat(btn.dataset.time);
        audioEl.play().catch(() => {});
      });
    });
  };

  if (textarea) {
    parseLinks(textarea.value);
    textarea.addEventListener("input", (e) => {
      state.notes[talkKey] = e.target.value;
      saveState();
      parseLinks(e.target.value);
    });
  }

  // Lexical Chunks: Real-time Search & POS Filtering
  const vocabFilterInput = container.querySelector(".vocab-filter-input");
  const posBtns = container.querySelectorAll(".vocab-pos-filters .mini-pill");
  let activePos = "all";

  const applyVocabFilter = () => {
    const q = (vocabFilterInput?.value || "").trim().toLowerCase();
    container.querySelectorAll(".vocab-chunk-item").forEach((item) => {
      const p = item.dataset.phrase || "";
      const m = item.dataset.meaning || "";
      const pos = item.dataset.pos || "phrase";
      const matchText = !q || p.includes(q) || m.includes(q);
      const matchPos = activePos === "all" || pos === activePos;
      item.style.display = matchText && matchPos ? "" : "none";
    });
  };

  vocabFilterInput?.addEventListener("input", applyVocabFilter);
  posBtns.forEach((pb) => {
    pb.addEventListener("click", () => {
      posBtns.forEach((b) => b.classList.remove("is-active"));
      pb.classList.add("is-active");
      activePos = pb.dataset.pos || "all";
      applyVocabFilter();
    });
  });

  // Lexical Chunks: Native Audio Snippet Playback (or Web Speech TTS for Reading)
  container.querySelectorAll(".play-chunk-audio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rawWord = btn.dataset.word || "";
      if (talk.isReading || !audioEl) {
        if (speakWordTTS(rawWord)) {
          showToast(`Đang đọc phát âm: "${rawWord}"`, "info");
        } else {
          showToast("Trình duyệt không hỗ trợ phát âm TTS.", "info");
        }
        return;
      }

      const word = rawWord.toLowerCase();
      let foundSeg = null;

      if (talk.segments) {
        foundSeg = talk.segments.find((s) => s.t.toLowerCase().includes(word));
      }

      if (foundSeg && audioEl) {
        audioEl.currentTime = Math.max(0, foundSeg.s - 0.05);
        audioEl.play().catch(() => {});
        showToast(`Đang phát đoạn chứa cụm từ: "${rawWord}"`, "info");

        const stopAt = foundSeg.e + 0.15;
        const timeHandler = () => {
          if (audioEl.currentTime >= stopAt) {
            audioEl.pause();
            audioEl.removeEventListener("timeupdate", timeHandler);
          }
        };
        audioEl.addEventListener("timeupdate", timeHandler);
        setTimeout(() => {
          audioEl.removeEventListener("timeupdate", timeHandler);
          if (!audioEl.paused && audioEl.currentTime >= foundSeg.e) audioEl.pause();
        }, Math.max(800, (foundSeg.e - foundSeg.s + 0.5) * 1000));
      } else {
        showToast("Không tìm thấy vị trí âm thanh của cụm từ này trong audio.", "bad");
      }
    });
  });

  // Lexical Chunks: + Thẻ Flashcard
  container.querySelectorAll(".add-chunk-srs-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const word = btn.dataset.word;
      const meaning = btn.dataset.meaning;
      let start = 0, end = 0, context = (talk.transcript || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      if (talk.segments) {
        const seg = talk.segments.find((s) => s.t.toLowerCase().includes(word.toLowerCase()));
        if (seg) {
          start = seg.s;
          end = seg.e;
          context = seg.t;
        }
      } else if (!context && Array.isArray(talk.passages)) {
        const wLow = word.toLowerCase();
        for (const doc of talk.passages) {
          const hitPara = (doc.paragraphs || []).find((p) => p.text?.toLowerCase().includes(wLow));
          if (hitPara) { context = hitPara.text; break; }
          const hitMsg = (doc.messages || []).find((m) => m.text?.toLowerCase().includes(wLow));
          if (hitMsg) { context = hitMsg.text; break; }
        }
        if (!context) {
          context = (talk.passages[0]?.paragraphs?.[0]?.text || `Câu ${talk.range}`).slice(0, 180);
        }
      }

      const cardData = {
        id: `card_${Date.now()}_${word}`,
        word,
        translation: meaning,
        context,
        audioUrl: talk.audio || null,
        start,
        end,
        talkRange: talk.range,
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        dueDate: Date.now()
      };

      if (vocabSRS) {
        await vocabSRS.addCard(cardData);
      } else {
        await saveFlashcard(cardData);
      }

      btn.innerHTML = `${getIcon("check", 12)} <span>Đã ghim</span>`;
      showToast(`Đã thêm cụm "${word}" vào Flashcard!`, "success");
    });
  });
}

/* ============================================================
   Resizable Split Pane Divider Handle
   ============================================================ */
function wireSplitResizer(card) {
  const resizer = card.querySelector(".split-resizer");
  const leftPane = card.querySelector(".talk-left-pane");
  const rightPane = card.querySelector(".talk-right-pane");
  if (!resizer || !leftPane || !rightPane) return;

  let isDragging = false;

  resizer.addEventListener("pointerdown", (e) => {
    isDragging = true;
    resizer.classList.add("is-dragging");
    resizer.setPointerCapture(e.pointerId);
  });

  resizer.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const cardRect = card.getBoundingClientRect();
    const offsetX = e.clientX - cardRect.left;
    const totalW = cardRect.width;

    const minW = 280;
    if (offsetX >= minW && totalW - offsetX >= minW) {
      const leftPct = (offsetX / totalW) * 100;
      leftPane.style.flex = `0 0 ${leftPct}%`;
      rightPane.style.flex = `0 0 ${100 - leftPct}%`;
    }
  });

  const stopDrag = () => {
    if (isDragging) {
      isDragging = false;
      resizer.classList.remove("is-dragging");
      const cardRect = card.getBoundingClientRect();
      const leftRect = leftPane.getBoundingClientRect();
      const pct = Math.round((leftRect.width / cardRect.width) * 100);
      if (pct >= 25 && pct <= 75) {
        state.splitRatio = pct;
        saveState();
      }
    }
  };

  resizer.addEventListener("pointerup", stopDrag);
  resizer.addEventListener("pointercancel", stopDrag);

  // Double click resets to 50/50 balance
  resizer.addEventListener("dblclick", () => {
    leftPane.style.flex = "0 0 50%";
    rightPane.style.flex = "0 0 50%";
    state.splitRatio = 50;
    saveState();
    showToast("Đã cân bằng hai cột 50 / 50");
  });
}

/* ============================================================
   Modals: SM-2 Flashcards, Vocabulary Library, Strategy Guide, Analytics, Exam Report
   ============================================================ */
function openFlashcardModal(activeTab = "srs") {
  const dlg = document.getElementById("vocab-dialog");
  if (!dlg) return;

  // Delegate to upgraded VocabSRS Studio if exposed by js/vocabSrs.js
  if (typeof vocabSRS?.openModal === "function") {
    vocabSRS.openModal(dlg, activeTab);
    return;
  }
  if (typeof vocabSRS?.renderDialog === "function") {
    vocabSRS.renderDialog(dlg, activeTab);
    if (!dlg.open) dlg.showModal();
    return;
  }
  if (typeof vocabSRS?.render === "function") {
    vocabSRS.render(dlg, activeTab);
    if (!dlg.open) dlg.showModal();
    return;
  }

  const card = vocabSRS.getCurrentCard();
  const dueCount = vocabSRS.getDueCards().length;
  const vocabBank = window.TOEIC_VOCAB_BANK || [];

  dlg.innerHTML = `
    <div class="dialog-box dialog-wide" style="max-height: 88vh; display: flex; flex-direction: column;">
      <div class="dialog-head">
        <div>
          <h2 style="margin: 0; font-size: 1.15rem;">Kho Từ Vựng &amp; Flashcard SM-2</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${vocabBank.length} từ vựng chuẩn thi thật · ${dueCount} thẻ cần ôn</span>
        </div>
        <form method="dialog"><button type="submit" class="tool-btn icon-only">${getIcon("x", 16)}</button></form>
      </div>

      <!-- Tab Switcher -->
      <div class="segmented" style="margin: 12px 18px 0; align-self: flex-start;">
        <button type="button" class="seg-btn ${activeTab === 'srs' ? 'is-active' : ''}" id="vocab-tab-srs-btn">
          <span>Ôn Thẻ Flashcard (${dueCount})</span>
        </button>
        <button type="button" class="seg-btn ${activeTab === 'library' ? 'is-active' : ''}" id="vocab-tab-library-btn">
          <span>Thư Viện 600+ Từ Vựng TOEIC</span>
        </button>
      </div>

      <div style="padding: 16px 20px; overflow-y: auto; flex: 1;">
        ${activeTab === 'srs' ? `
          ${card ? `
            <div class="flashcard-stage">
              <div class="flashcard-inner" id="srs-card-inner">
                <!-- Front Face -->
                <div class="flashcard-face front">
                  <div>
                    <span class="badge" style="font-size: 0.72rem; background: var(--accent-soft); color: var(--accent);">Câu ${card.talkRange || 'Part 4'}</span>
                    <div class="flashcard-chunk">${card.word}</div>
                    <div class="flashcard-context">"${card.context}"</div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button type="button" class="tool-btn srs-play-audio-btn">
                      ${card.audioUrl ? `${getIcon("headphones", 14)} <span>Nghe Audio gốc</span>` : `${getIcon("volume2", 14)} <span>Phát âm từ vựng</span>`}
                    </button>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                      <span>Lật xem nghĩa</span> ${getIcon("arrowRight", 13)}
                    </span>
                  </div>
                </div>

                <!-- Back Face -->
                <div class="flashcard-face back">
                  <div>
                    <div class="flashcard-chunk" style="color: var(--ok);">${card.translation || card.word}</div>
                    <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted);">${card.context}</p>
                  </div>
                  <div style="font-size: 0.76rem; color: var(--text-muted);">Chọn mức độ nhớ bên dưới:</div>
                </div>
              </div>
            </div>

            <div class="srs-buttons-row">
              <button type="button" class="srs-btn srs-again" data-quality="0">
                <span>Quên</span>
                <span class="srs-interval">&lt; 10 phút</span>
              </button>
              <button type="button" class="srs-btn srs-hard" data-quality="1">
                <span>Mờ</span>
                <span class="srs-interval">1 ngày</span>
              </button>
              <button type="button" class="srs-btn srs-good" data-quality="2">
                <span>Thuộc</span>
                <span class="srs-interval">4 ngày</span>
              </button>
              <button type="button" class="srs-btn srs-easy" data-quality="3">
                <span>Dễ</span>
                <span class="srs-interval">7 ngày</span>
              </button>
            </div>
          ` : `<div class="muted-text" style="text-align: center; padding: 40px 0; display: flex; align-items: center; justify-content: center; gap: 8px;"><span style="color: var(--ok); display: inline-flex;">${getIcon("checkCircle", 18)}</span> <span>Tuyệt vời! Bạn đã hoàn thành toàn bộ thẻ cần ôn tập hôm nay!</span></div>`}
        ` : `
          <!-- Search & Topic Filter -->
          <div style="display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; align-items: center;">
            <input type="text" id="lib-search-input" placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt..." class="vocab-filter-input" style="flex: 1; min-width: 220px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface-1); color: var(--text);" />
            <select id="lib-topic-select" style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface-1); color: var(--text);">
              <option value="all">Tất cả chủ đề</option>
              <option value="Contracts">Hợp đồng (Contracts)</option>
              <option value="Marketing">Tiếp thị &amp; Quảng cáo (Marketing)</option>
              <option value="Warranties">Bảo hành (Warranties)</option>
              <option value="Business Planning">Kế hoạch kinh doanh</option>
              <option value="Conferences">Hội thảo &amp; Sự kiện</option>
              <option value="Computers">Máy tính &amp; Công nghệ</option>
              <option value="Office Technology">Thiết bị văn phòng</option>
              <option value="Personnel">Nhân sự &amp; Tuyển dụng</option>
              <option value="Salaries & Benefits">Lương &amp; Chế độ đãi ngộ</option>
              <option value="Banking">Ngân hàng &amp; Tài chính</option>
            </select>
          </div>

          <div id="lib-vocab-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;"></div>
        `}
      </div>
    </div>
  `;

  dlg.showModal();

  dlg.querySelector("#vocab-tab-srs-btn")?.addEventListener("click", () => openFlashcardModal("srs"));
  dlg.querySelector("#vocab-tab-library-btn")?.addEventListener("click", () => openFlashcardModal("library"));

  if (activeTab === "srs") {
    const cardInner = dlg.querySelector("#srs-card-inner");
    cardInner?.addEventListener("click", (e) => {
      if (e.target.closest(".srs-play-audio-btn")) return;
      cardInner.classList.toggle("is-flipped");
    });

    dlg.querySelector(".srs-play-audio-btn")?.addEventListener("click", () => {
      vocabSRS.playCardAudio(card);
    });

    dlg.querySelectorAll(".srs-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const q = parseInt(btn.dataset.quality);
        await vocabSRS.reviewCard(card, q);
        openFlashcardModal("srs"); // Load next
      });
    });
  } else {
    // Render library items
    const searchInput = dlg.querySelector("#lib-search-input");
    const topicSelect = dlg.querySelector("#lib-topic-select");
    const grid = dlg.querySelector("#lib-vocab-grid");

    const renderGrid = () => {
      if (!grid) return;
      const q = (searchInput?.value || "").toLowerCase().trim();
      const topic = topicSelect?.value || "all";

      const filtered = vocabBank.filter((item) => {
        const matchQ = !q || item.word.toLowerCase().includes(q) || (item.translation || "").toLowerCase().includes(q);
        const matchTopic = topic === "all" || (item.topic && item.topic.toLowerCase().includes(topic.toLowerCase()));
        return matchQ && matchTopic;
      });

      if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 30px;">Không tìm thấy từ vựng phù hợp.</div>`;
        return;
      }

      grid.innerHTML = filtered.slice(0, 100).map((v) => `
        <div style="background: var(--surface-1); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 1.05rem; color: var(--accent);">${v.word}</span>
              <span class="badge" style="font-size: 0.68rem; background: var(--surface-2); color: var(--text-muted);">${v.type || 'vocal'}</span>
            </div>
            ${v.ipa ? `<div style="font-size: 0.8rem; font-family: var(--font-ipa); color: var(--text-muted); margin-bottom: 6px;">${v.ipa}</div>` : ''}
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--ok); margin-bottom: 6px;">${v.translation}</div>
            ${v.example ? `<p style="font-size: 0.8rem; line-height: 1.45; color: var(--text-muted); margin: 0 0 10px 0; font-style: italic;">"${v.example}"</p>` : ''}
          </div>
          <button type="button" class="tool-btn add-lib-to-srs-btn" data-word="${v.word}" data-vn="${v.translation}" data-ex="${v.example || ''}" style="width: 100%; justify-content: center; font-size: 0.78rem;">
            + Thêm vào ôn tập Flashcard
          </button>
        </div>
      `).join("");

      grid.querySelectorAll(".add-lib-to-srs-btn").forEach((b) => {
        b.onclick = async () => {
          await vocabSRS.addCard({
            id: `card_lib_${Date.now()}_${b.dataset.word}`,
            word: b.dataset.word,
            translation: b.dataset.vn,
            context: b.dataset.ex || "Business Vocabulary",
            talkRange: "Library",
            repetitions: 0,
            interval: 1,
            easeFactor: 2.5,
            dueDate: Date.now()
          });
          showToast(`Đã thêm "${b.dataset.word}" vào thẻ ôn tập Flashcard!`, "success");
          b.disabled = true;
          b.textContent = "✓ Đã thêm vào Flashcard";
        };
      });
    };

    renderGrid();
    searchInput?.addEventListener("input", renderGrid);
    topicSelect?.addEventListener("change", renderGrid);
  }
}

/* ============================================================
   TOEIC 900+ Strategy Guide Modal
   ============================================================ */
function openStrategyModal(activeTab = "roadmap") {
  const dlg = document.getElementById("strategy-dialog");
  if (!dlg) return;

  const mount = document.getElementById("strategy-dialog-mount");
  const navBtns = dlg.querySelectorAll("#strategy-nav-group .seg-btn");

  navBtns.forEach((b) => {
    b.classList.toggle("is-active", b.dataset.stratTab === activeTab);
    b.onclick = () => openStrategyModal(b.dataset.stratTab);
  });

  if (mount) {
    if (typeof window.renderToeicStrategyTab === "function") {
      window.renderToeicStrategyTab(activeTab, mount);
      if (!dlg.open) dlg.showModal();
      return;
    }
    const customTabs = window.TOEIC_STRATEGY_TABS || window.TOEIC_STRATEGY_SECTIONS || (typeof window.TOEIC_STRATEGY_DATA === "object" && window.TOEIC_STRATEGY_DATA ? window.TOEIC_STRATEGY_DATA : null);
    if (customTabs && customTabs[activeTab]) {
      mount.innerHTML = typeof customTabs[activeTab] === "string"
        ? customTabs[activeTab]
        : (customTabs[activeTab].html || customTabs[activeTab].content || "");
      if (!dlg.open) dlg.showModal();
      return;
    }

    if (activeTab === "roadmap") {
      mount.innerHTML = `
        <div class="strategy-section">
          <div style="background: var(--surface-2); padding: 16px; border-radius: 8px; border-left: 4px solid var(--accent); margin-bottom: 18px;">
            <h3 style="margin: 0 0 6px 0; color: var(--accent); font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">${getIcon("crosshair", 17)} <span>Mục Tiêu: Nhảy vọt 450 &rarr; 900+ (Gap +450 Điểm)</span></h3>
            <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted);">
              Theo dữ liệu chuẩn ETS: Tăng 450 điểm đòi hỏi tối thiểu <strong>350 &ndash; 450 giờ nạp dữ liệu có chủ đích (Deliberate Practice)</strong>. Không có mẹo vặt qua mặt được bài thi 200 câu.
            </p>
          </div>

          <h4 style="margin: 16px 0 8px 0; font-size: 1rem;">Lộ Trình Tác Chiến 3 Giai Đoạn (90 Ngày)</h4>
          <div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
            <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <span class="badge" style="background: var(--accent-soft); color: var(--accent); font-weight: 500;">Giai đoạn 1 (Ngày 1 - 30)</span>
              <h5 style="margin: 8px 0 4px 0; font-size: 0.95rem;">Phá Vỡ Giới Hạn 650+</h5>
              <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                <li>Triệt tiêu Part 1 &amp; 2 (Ăn chắc 350+ Listening).</li>
                <li>8 Chủ điểm ngữ pháp cốt lõi Part 5.</li>
                <li>Diệt hoàn toàn phản xạ "dịch nhẩm sang tiếng Việt".</li>
              </ul>
            </div>
            <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <span class="badge" style="background: var(--ok-soft); color: var(--ok); font-weight: 500;">Giai đoạn 2 (Ngày 31 - 60)</span>
              <h5 style="margin: 8px 0 4px 0; font-size: 0.95rem;">Đột Phá 800+</h5>
              <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                <li>Xử lý Part 3 &amp; 4 bằng Kỹ thuật Đọc đón đầu (Skimming).</li>
                <li>Tăng tốc độ đọc Part 7 (Đoạn đơn &amp; Email).</li>
                <li>Thu hẹp số câu lụi Part 7 từ 40 xuống còn dưới 10 câu.</li>
              </ul>
            </div>
            <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <span class="badge" style="background: var(--warn-soft); color: var(--warn); font-weight: 500;">Giai đoạn 3 (Ngày 61 - 90)</span>
              <h5 style="margin: 8px 0 4px 0; font-size: 0.95rem;">Chinh Phục 900+</h5>
              <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                <li>Càn quét Part 7 đoạn kép &amp; đoạn ba.</li>
                <li>Luyện phản xạ System 1 Part 5: 15 giây/câu.</li>
                <li>Thi thử full 120 phút liên tục chịu áp lực cao.</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === "timestack") {
      mount.innerHTML = `
        <div class="strategy-section">
          <h3 style="margin-top: 0; color: var(--accent);">Nguyên Tắc Time-Stacking: 3 Giờ/Ngày Mà Không Mệt Mỏi</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Cộng dồn thời gian chết trong ngày để nạp tiếng Anh liên tục mà chỉ tốn 1 - 1.5 giờ ngồi tại bàn học:
          </p>
          <div style="overflow-x: auto; margin-block: 14px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
              <thead>
                <tr style="background: var(--surface-2); text-align: left;">
                  <th style="padding: 10px; border: 1px solid var(--border);">Khung giờ</th>
                  <th style="padding: 10px; border: 1px solid var(--border);">Thời lượng</th>
                  <th style="padding: 10px; border: 1px solid var(--border);">Bản chất hoạt động</th>
                  <th style="padding: 10px; border: 1px solid var(--border);">Mục tiêu não bộ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border: 1px solid var(--border); font-weight: 600;">Sáng (Đi lại, ăn sáng)</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">30 phút</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">Passive &amp; Active Listening</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">Tắm ngôn ngữ, làm quen nối âm &amp; ngữ điệu loa ETS</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid var(--border); font-weight: 600;">Trưa (Nghỉ trưa, rảnh)</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">20 - 30 phút</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">SRS Flashcard (Anki / SM-2)</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">Nạp 30 Lexical Chunks (cụm từ Part 5/6/7)</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid var(--border); font-weight: 600;">Tối (BẮT BUỘC - Deep Work)</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">60 - 90 phút</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">Deliberate Practice</td>
                  <td style="padding: 10px; border: 1px solid var(--border);">Mổ xẻ đề, Shadowing, Luyện phản xạ đọc Part 7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (activeTab === "part2") {
      mount.innerHTML = `
        <div class="strategy-section">
          <h3 style="margin-top: 0; color: var(--accent);">Tuyệt Chiêu Giải Mã 11 Bẫy ETS Part 2</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            <div style="background: var(--surface-1); padding: 12px 16px; border-radius: 8px; border-left: 3px solid var(--bad);">
              <strong style="color: var(--bad);">1. Bẫy Đồng Âm / Nhại Âm (Sound Distractor):</strong>
              <p style="margin: 4px 0 0 0; font-size: 0.88rem; color: var(--text-muted);">
                Đề nói <code>arrange</code> &rarr; Đáp án sai nhại âm: <code>a range</code>. Đề nói <code>repair</code> &rarr; Đáp án sai: <code>a pair of scissors</code>.
                <br/><span style="color: var(--accent); display: inline-flex; vertical-align: middle;">${getIcon("arrowRight", 13)}</span> <strong>Luật sắt:</strong> 95% đáp án phát âm giống hoặc lặp lại y hệt từ trên câu hỏi đều là <strong>ĐÁP ÁN SAI</strong>!
              </p>
            </div>
            <div style="background: var(--surface-1); padding: 12px 16px; border-radius: 8px; border-left: 3px solid var(--accent);">
              <strong style="color: var(--accent);">2. Bẫy Trả Lời Gián Tiếp (Indirect Answers) - Não bộ 450 dễ chết nhất:</strong>
              <p style="margin: 4px 0 0 0; font-size: 0.88rem; color: var(--text-muted);">
                - Khi hỏi thời gian (<em>When does it start?</em>) &rarr; Đáp án đúng: <em>"I didn't receive an invitation"</em> (Tôi không có vé mời sao biết!).
                <br/>- Khi hỏi lựa chọn &rarr; Đáp án đúng: <em>"Maria was firm about the deadline"</em> (Maria rất gắt về deadline đấy).
                <br/>- Khi hỏi phần mềm &rarr; Đáp án đúng: <em>"Here's a copy of her resume"</em> (Xem CV cô ấy đi).
              </p>
            </div>
            <div style="background: var(--surface-1); padding: 12px 16px; border-radius: 8px; border-left: 3px solid var(--ok);">
              <strong style="color: var(--ok);">3. Bẫy Hỏi Ngược (Counter-question):</strong>
              <p style="margin: 4px 0 0 0; font-size: 0.88rem; color: var(--text-muted);">
                - <em>"Do you mind if I leave early today?"</em> &rarr; Đáp án đúng: <em>"Has your report been submitted?"</em> (Nộp báo cáo chưa mà đòi về?).
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === "part4") {
      mount.innerHTML = `
        <div class="strategy-section">
          <h3 style="margin-top: 0; color: var(--accent);">Kỹ Thuật Đọc Đón Đầu (Skimming) &amp; Shadowing Cho Part 3 &amp; 4</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Trong Part 3 &amp; 4, người đạt 900+ <strong>không bao giờ vừa nghe vừa đọc câu hỏi</strong>. Họ đọc đón đầu trước khi loa phát!
          </p>
          <div style="background: var(--surface-2); padding: 14px; border-radius: 8px; margin-block: 12px;">
            <h4 style="margin: 0 0 6px 0;">Quy Trình 3 Bước Tác Chiến:</h4>
            <ol style="margin: 0; padding-left: 20px; font-size: 0.88rem; line-height: 1.7; color: var(--text-muted);">
              <li><strong>Tận dụng 8s chuyển bài / thời gian đọc câu hỏi:</strong> Lướt nhanh từ khóa trong 3 câu hỏi (Who, What, Where, When, Graphic).</li>
              <li><strong>Nghe bắt Paraphrasing:</strong> Khớp nối ý nghĩa tương đương giữa âm thanh và đáp án trên màn hình, đánh dấu ngay khi loa đang nói.</li>
              <li><strong>Phương pháp Shadowing 3 bước:</strong> Nghe mù &rarr; Soi Tapescript &rarr; Nhại giọng theo sau loa 0.5s để làm chủ biến âm (nối âm, nuốt âm, giảm âm).</li>
            </ol>
          </div>
        </div>
      `;
    } else if (activeTab === "part7") {
      mount.innerHTML = `
        <div class="strategy-section">
          <h3 style="margin-top: 0; color: var(--accent);">Chiến Thuật Phân Bổ Thời Gian Part 5 &ndash; 7</h3>
          <div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 14px;">
            <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <h4 style="margin: 0 0 4px 0; color: var(--accent);">Part 5: 10 &ndash; 12 phút</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">30 câu. Luyện phản xạ System 1 nhận diện dạng từ trong 5-10s/câu không cần dịch.</p>
            </div>
            <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <h4 style="margin: 0 0 4px 0; color: var(--accent);">Part 6: 8 &ndash; 10 phút</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">16 câu. Đọc lướt bắt mạch ngữ cảnh câu liền trước và liền sau.</p>
            </div>
            <div style="background: var(--surface-1); padding: 14px; border-radius: 8px; border: 1px solid var(--ok);">
              <h4 style="margin: 0 0 4px 0; color: var(--ok);">Part 7: Trọn vẹn 54 phút!</h4>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">54 câu (1 phút/câu). Dùng Chiến thuật Đảo ngược (Reverse Strategy) đọc câu hỏi trước để bắt vị trí thông tin.</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  dlg.showModal();
}

function openAnalyticsModal(activeTab = "overview") {
  let dlg = document.getElementById("analytics-dialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "analytics-dialog";
    document.body.appendChild(dlg);
  }

  const renderTab = (tabKey) => {
    const isMatrix = tabKey === "matrix";
    const stats = analyticsEngine.calculateStats();
    const dashboardBody = typeof analyticsEngine.renderAnalyticsDashboard === "function"
      ? analyticsEngine.renderAnalyticsDashboard(stats)
      : `
        <div class="analytics-grid">
          <div class="analytics-card">
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 500;">Độ chính xác tổng quan</span>
            <div style="font-size: 2.2rem; font-weight: 600; color: var(--accent); margin-top: 4px;">${stats.accuracyPct}%</div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Đúng ${stats.totalCorrect}/${stats.totalAnswered} câu đã làm</p>
          </div>
        </div>
      `;

    dlg.innerHTML = `
      <div class="dialog-box dialog-wide" style="max-width: 1020px; max-height: 88vh; display: flex; flex-direction: column;">
        <div class="dialog-head">
          <h2 style="display: inline-flex; align-items: center; gap: 8px;"><span style="color: var(--accent); display: inline-flex;">${getIcon("barChart3", 18)}</span> <span>Thống Kê Năng Lực &amp; Ma Trận CEFR (A1–C2)</span></h2>
          <form method="dialog"><button type="submit" class="tool-btn icon-only" aria-label="Đóng">${getIcon("x", 16)}</button></form>
        </div>
        <div class="cham-mode-tabs" style="padding: 0 20px; margin-bottom: 0; flex-shrink: 0;">
          <button type="button" class="cham-mode-tab ${!isMatrix ? "is-active" : ""}" data-analytics-tab="overview">
            Tổng quan năng lực
          </button>
          <button type="button" class="cham-mode-tab ${isMatrix ? "is-active" : ""}" data-analytics-tab="matrix">
            Ma trận Độ khó ${(window.CHAM_TOEIC_CATALOG?.tests?.length || 302) + TESTS.length} Đề (CEFR A1–C2)
          </button>
        </div>
        <div id="analytics-modal-body" style="padding: 18px 20px; overflow-y: auto; flex: 1;">
          ${!isMatrix ? dashboardBody : `<div id="analytics-cefr-matrix-mount"></div>`}
        </div>
      </div>
    `;

    dlg.querySelectorAll("[data-analytics-tab]").forEach((btn) => {
      btn.addEventListener("click", () => renderTab(btn.dataset.analyticsTab));
    });

    if (isMatrix) {
      const mount = dlg.querySelector("#analytics-cefr-matrix-mount");
      if (mount && typeof materialsCenter?.mountMatrixInto === "function") {
        materialsCenter.mountMatrixInto(mount, () => {
          if (dlg.open) dlg.close();
        });
      }
    }
  };

  renderTab(activeTab === "matrix" ? "matrix" : "overview");
  if (!dlg.open) dlg.showModal();
}

function showExamReport(report) {
  let dlg = document.getElementById("exam-report-dialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "exam-report-dialog";
    document.body.appendChild(dlg);
  }

  const telemetryDetailsHTML = typeof examSimulator?.renderExamReportDetailsHTML === "function"
    ? examSimulator.renderExamReportDetailsHTML(report)
    : "";

  dlg.innerHTML = `
    <div class="dialog-box dialog-wide" style="max-width: 880px; max-height: 88vh; display: flex; flex-direction: column;">
      <div class="dialog-head">
        <h2>Kết Quả Thi CBT &amp; Báo Cáo Telemetry</h2>
        <form method="dialog"><button type="submit" class="tool-btn icon-only" aria-label="Đóng">${getIcon("x", 16)}</button></form>
      </div>

      <div style="padding: 18px 20px; overflow-y: auto; flex: 1;">
        <div class="analytics-grid exam-summary-grid" style="margin-top: 0; margin-bottom: 16px;">
          <div class="analytics-card">
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 500;">Điểm số Raw</span>
            <div style="font-size: 2rem; font-weight: 600; color: var(--accent); margin-top: 4px;">
              ${report.totalExamCorrect}/${report.totalExamQuestions}
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Đúng ${report.scorePct}% số câu${report.unansweredCount ? ` · Bỏ trống ${report.unansweredCount} câu` : ''}</p>
          </div>

          <div class="analytics-card" style="background: var(--accent-soft); border-color: var(--accent-border);">
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--accent); font-weight: 600;">Quy đổi ETS TOEIC</span>
            <div style="font-size: 2rem; font-weight: 600; color: var(--accent); margin-top: 4px;">
              ${report.scaledScore || 5}<span style="font-size: 1.1rem; color: var(--text-muted);">/495</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--ok); margin: 0; font-weight: 500;">${report.cefrLevel || 'Chuẩn ETS'}</p>
          </div>

          <div class="analytics-card">
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 500;">Điểm Ròng Đổi Đáp Án</span>
            <div style="font-size: 2rem; font-weight: 600; color: ${report.netScoreDelta >= 0 ? 'var(--ok)' : 'var(--bad)'}; margin-top: 4px;">
              ${report.netScoreDelta > 0 ? '+' : ''}${report.netScoreDelta} điểm
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Đã đổi đáp án ${report.totalChanges} lần</p>
          </div>
        </div>

        ${telemetryDetailsHTML}

        <div style="background: var(--surface-2); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; font-size: 0.88rem; text-transform: uppercase; color: var(--accent);">Chi tiết hành vi đổi đáp án:</h4>
          <ul style="font-size: 0.9rem; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li style="color: var(--ok);">Đổi từ <strong>Sai &rarr; Đúng</strong>: <strong>+${report.gains} câu</strong> (Gỡ điểm thành công!)</li>
            <li style="color: var(--bad);">Đổi từ <strong>Đúng &rarr; Sai</strong>: <strong>-${report.losses} câu</strong> (Mất điểm đáng tiếc!)</li>
            <li style="color: var(--text-muted);">Đổi giữa các phương án sai: <strong>${report.neutral} câu</strong></li>
          </ul>
        </div>

        <div class="dialog-actions">
          <button type="button" id="review-exam-btn" class="btn-primary" style="font-weight: 500;">
            Chuyển sang "Giải Mã" để xem giải thích &amp; phân tích bẫy
          </button>
        </div>
      </div>
    </div>
  `;

  if (!dlg.open) dlg.showModal();

  dlg.querySelector("#review-exam-btn")?.addEventListener("click", () => {
    dlg.close();
    state.mode = "study";
    saveState();
    document.querySelectorAll(".topbar .seg-btn[data-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === "study"));
    renderAll();
    showToast("Đã chuyển sang chế độ Giải mã để xem giải thích, lời dịch và đối chiếu bẫy!", "info");
  });
}

/* ============================================================
   Helper Functions
   ============================================================ */
function updateScores() {
  TESTS.forEach((t) => {
    let correct = 0;
    let total = 0;
    t.talks.forEach((talk) => {
      (talk.questions || []).forEach((q) => {
        total++;
        const ans = getAnswer(t.id, q.num);
        if (ans === q.answer) correct++;
      });
    });
    const pill = document.getElementById(`score-${t.id}`);
    if (pill) pill.textContent = `${correct}/${total}`;
  });
  updateQuestionPaletteStates();
}

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function prepareWorksheetForPrint(triggerPrint = true) {
  const currentTest = TESTS.find((t) => t.id === state.activeTest) || TESTS[0];
  if (!currentTest) return;
  const currentIdx = state.currentIndex[state.activeTest] || 0;
  const talk = currentTest.talks[currentIdx] || currentTest.talks[0];
  if (!talk) return;
  const talkKey = `${state.activeTest}_${talk.range}`;
  const savedNote = state.notes[talkKey] || "";
  const isReading = Boolean(talk.isReading || currentTest.isReading || currentTest.part >= 5);
  const partNum = currentTest.part || (isReading ? 7 : 4);
  const isExamMode = state.mode === "exam" && examSimulator?.isActive;

  let scriptEnHtml = `<p>${(talk.transcript || "").replace(/<[^>]*>/g, "")}</p>`;
  let scriptViHtml = `<p>${talk.translation || ""}</p>`;

  if (isReading && Array.isArray(talk.passages) && talk.passages.length) {
    scriptEnHtml = talk.passages.map((doc) => {
      const parts = [];
      if (doc.docLabel) parts.push(`<strong>${doc.docLabel}</strong>`);
      if (doc.title) parts.push(`<div><strong>${doc.title}</strong></div>`);
      if (doc.meta) {
        parts.push(`<div>${Object.entries(doc.meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>`);
      }
      if (doc.eyebrow) parts.push(`<div><em>${doc.eyebrow}</em></div>`);
      if (doc.letterhead && doc.letterhead.length) {
        parts.push(`<div>${doc.letterhead.join("<br/>")}</div>`);
      }
      if (doc.salutation) parts.push(`<p><strong>${doc.salutation}</strong></p>`);
      if (doc.formFields && doc.formFields.length) {
        parts.push(`<div>${doc.formFields.join(" &bull; ")}</div>`);
      }
      (doc.paragraphs || []).forEach((p) => parts.push(`<p>${p.text}</p>`));
      if (doc.table && Array.isArray(doc.table.headers)) {
        const ths = doc.table.headers.map((h) => `<th>${h}</th>`).join("");
        const trs = (doc.table.rows || []).map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
        parts.push(`<table class="print-doc-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
      }
      (doc.messages || []).forEach((m) => parts.push(`<p><strong>${m.sender} [${m.time}]:</strong> ${m.text}</p>`));
      (doc.episodes || []).forEach((e) => parts.push(`<p><strong>${e.num}:</strong> ${e.text}</p>`));
      if (doc.bulletsHeading) parts.push(`<div><strong>${doc.bulletsHeading}</strong></div>`);
      (doc.bullets || []).forEach((b) => parts.push(`<p>&bull; ${b.text}</p>`));
      (doc.paragraphsAfterBullets || []).forEach((p) => parts.push(`<p>${p.text}</p>`));
      if (doc.signature) parts.push(`<p><strong>${doc.signature}</strong></p>`);
      if (doc.footerNotes && doc.footerNotes.length) {
        doc.footerNotes.forEach((fn) => parts.push(`<p><em>${fn}</em></p>`));
      }
      if (doc.disclosure) parts.push(`<p><em>${doc.disclosure}</em></p>`);
      return `<div class="print-doc-card">${parts.join("")}</div>`;
    }).join("");

    scriptViHtml = talk.passages.map((doc) => {
      const parts = [];
      if (doc.docLabel) parts.push(`<strong>${doc.docLabel}</strong>`);
      (doc.paragraphs || []).forEach((p) => { if (p.vi) parts.push(`<p>${p.vi}</p>`); });
      (doc.messages || []).forEach((m) => { if (m.vi) parts.push(`<p><strong>${m.sender} [${m.time}]:</strong> ${m.vi}</p>`); });
      (doc.episodes || []).forEach((e) => { if (e.vi) parts.push(`<p>${e.vi}</p>`); });
      (doc.bullets || []).forEach((b) => { if (b.vi) parts.push(`<p>&bull; ${b.vi}</p>`); });
      (doc.paragraphsAfterBullets || []).forEach((p) => { if (p.vi) parts.push(`<p>${p.vi}</p>`); });
      if (doc.disclosureVi) parts.push(`<p><em>${doc.disclosureVi}</em></p>`);
      return `<div style="margin-bottom: 12px;">${parts.join("")}</div>`;
    }).join("");
  }

  let printSec = document.getElementById("print-worksheet-section");
  if (!printSec) {
    printSec = document.createElement("section");
    printSec.id = "print-worksheet-section";
    document.body.appendChild(printSec);
  }

  printSec.innerHTML = `
    <div class="print-worksheet-wrapper">
      <div class="print-header">
        <h1>NEURO-TOEIC PART ${partNum} STUDY WORKSHEET</h1>
        <div class="print-meta">
          <span><strong>Bộ đề:</strong> ${currentTest.title}</span> &bull;
          <span><strong>${isReading ? 'Bài đọc' : 'Bài nói'}:</strong> Câu ${talk.range} (${talk.type})</span> &bull;
          <span><strong>Ngày in:</strong> ${new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div class="print-section">
        <h2 class="print-section-title">I. BẢNG CÂU HỎI TRẮC NGHIỆM</h2>
        <div class="print-questions">
          ${(talk.questions || []).map((q) => `
            <div class="print-q-block">
              <p class="print-q-stem"><strong>Câu ${q.num}.</strong> ${q.question}</p>
              <div class="print-q-options">
                ${q.options.map((opt) => `
                  <div class="print-opt">
                    <span class="print-opt-box">[ &nbsp; ]</span>
                    <strong>${opt.choice}.</strong> ${opt.text}
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      ${!isExamMode ? `
      <div class="print-section">
        <h2 class="print-section-title">II. ${isReading ? 'BÀI ĐỌC &amp; BẢN DỊCH SONG NGỮ' : 'TAPESCRIPT &amp; BẢN DỊCH SONG NGỮ'}</h2>
        <div class="print-transcript-box">
          <div class="print-script-en">
            <h4>Bản Gốc Tiếng Anh:</h4>
            ${scriptEnHtml}
          </div>
          <div class="print-script-vi">
            <h4>Bản Dịch Tiếng Việt:</h4>
            ${scriptViHtml}
          </div>
        </div>
      </div>
      ` : (isReading ? `
      <div class="print-section">
        <h2 class="print-section-title">II. NỘI DUNG BÀI ĐỌC (EXAM MODE)</h2>
        <div class="print-transcript-box is-single-col">
          <div class="print-script-en">${scriptEnHtml}</div>
        </div>
      </div>
      ` : '')}

      ${!isExamMode && (talk.vocab || []).length ? `
      <div class="print-section">
        <h2 class="print-section-title">III. TỪ VỰNG ĂN ĐIỂM (LEXICAL CHUNKS)</h2>
        <table class="print-vocab-table">
          <thead><tr><th>Cụm từ tiếng Anh</th><th>Ý nghĩa &amp; Ngữ cảnh</th></tr></thead>
          <tbody>
            ${(talk.vocab || []).map((v) => {
              const p = v.split(":");
              return `<tr><td><strong>${p[0].trim()}</strong></td><td>${p.slice(1).join(":").trim()}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${savedNote ? `
        <div class="print-section">
          <h2 class="print-section-title">IV. GHI CHÚ CÁ NHÂN</h2>
          <div class="print-notes-box">${savedNote.replace(/\n/g, '<br/>')}</div>
        </div>
      ` : ''}
    </div>
  `;

  if (triggerPrint !== false) {
    window.print();
  }
}
