/**
 * v21.0 — Learning-Centric Home Dashboard (#/) & Practice by Part (#/practice)
 * - Aggregates real progress across 35 ChamTOEIC tests (6,600 Qs) + 8 Studio packs (197 Qs)
 * - Home (#/): Target score card, single warm Continue/Placement CTA, 3 daily tasks, Part 1–7 bar chart
 * - Practice (#/practice & #/practice/part/:n): 7 Part cards (Listening 1–4 / Reading 5–7),
 *   10/20/30 question picker, Practice vs Timed mode, and integrated Studio AI Deep-Study packs.
 */

import {
  state,
  getAnswer,
  getTargetScore,
  setTargetScore,
  getLocalDateKey,
  getTodayKey,
  getStudyStreakDays,
  getTodayStudyMinutes,
  isDailyTaskDone,
  setDailyTaskDone
} from "./store.js";
import { getIcon } from "./uiIcons.js";
import {
  estimateListeningScaledScore,
  estimateReadingScaledScore,
  mapTotalScoreToCEFR
} from "./examSimulator.js";

const CHAM_STORAGE_KEY = "neuro_cham_toeic_history_v1";
const CHAM_DRAFT_KEY = "neuro_cham_toeic_draft_v1";

export const PART_DEFINITIONS = [
  {
    part: 1,
    section: "Listening",
    name: "Mô tả tranh",
    enName: "Photographs",
    format: "Nghe 4 câu mô tả và chọn câu khớp với bức tranh nhất.",
    secPerQ: 35
  },
  {
    part: 2,
    section: "Listening",
    name: "Hỏi - Đáp",
    enName: "Question-Response",
    format: "Nghe 1 câu hỏi/câu nói và chọn 1 trong 3 lời hồi đáp phù hợp.",
    secPerQ: 22
  },
  {
    part: 3,
    section: "Listening",
    name: "Đoạn hội thoại",
    enName: "Conversations",
    format: "Nghe hội thoại 2–3 người và trả lời 3 câu hỏi mỗi đoạn.",
    secPerQ: 28
  },
  {
    part: 4,
    section: "Listening",
    name: "Bài nói ngắn",
    enName: "Short Talks",
    format: "Nghe thông báo, tin nhắn thoại, bài phát biểu và trả lời 3 câu/bài.",
    secPerQ: 30
  },
  {
    part: 5,
    section: "Reading",
    name: "Hoàn thành câu",
    enName: "Incomplete Sentences",
    format: "Chọn từ loại, ngữ pháp hoặc từ vựng điền vào chỗ trống.",
    secPerQ: 30
  },
  {
    part: 6,
    section: "Reading",
    name: "Hoàn thành đoạn văn",
    enName: "Text Completion",
    format: "Điền từ, cụm từ hoặc cả câu phù hợp mạch văn email/thông báo.",
    secPerQ: 36
  },
  {
    part: 7,
    section: "Reading",
    name: "Đọc hiểu",
    enName: "Reading Comprehension",
    format: "Đọc hiểu văn bản đơn, kép, ba và suy luận thông tin chi tiết.",
    secPerQ: 60
  }
];

function esc(str = "") {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readChamHistory() {
  try {
    const raw = localStorage.getItem(CHAM_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.attemptsBySlug === "object" ? parsed : { attemptsBySlug: {} };
  } catch {
    return { attemptsBySlug: {} };
  }
}

function readChamDraft() {
  try {
    const raw = localStorage.getItem(CHAM_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function detectStudioTestPart(test) {
  if (test.part) return Number(test.part);
  const id = String(test.id || "");
  if (id.includes("_p1_")) return 1;
  if (id.includes("_p2_")) return 2;
  if (id.includes("_p3_")) return 3;
  if (id.startsWith("part5")) return 5;
  if (id.startsWith("part6")) return 6;
  if (id.startsWith("part7")) return 7;
  return 4;
}

export function computeCombinedLearningSummary(studioTests = []) {
  const catalog = window.CHAM_TOEIC_CATALOG || { tests: [] };
  const history = readChamHistory();
  const draft = readChamDraft();

  const partMap = new Map();
  PART_DEFINITIONS.forEach((def) => {
    partMap.set(def.part, {
      ...def,
      totalInBank: 0,
      answered: 0,
      uniqueAnswered: 0,
      correct: 0,
      accuracyPct: null
    });
  });

  // 1. Catalog question totals across 35 ChamTOEIC tests
  const catalogSlugSet = new Set();
  (catalog.tests || []).forEach((t) => {
    if (t?.slug) catalogSlugSet.add(t.slug);
    const pc = t.partCounts || {};
    for (let p = 1; p <= 7; p++) {
      const cnt = Number(pc[`PART_${p}`] || 0);
      if (cnt > 0) partMap.get(p).totalInBank += cnt;
    }
  });

  // 2. Studio packs question totals + user answers
  const studioPacksByPart = new Map();
  const uniqueQSetsByPart = new Map();
  const unkeyedSlugMaxByPart = new Map(); // part -> Map<slug, maxAnsweredInAttempt>
  const legacyCustomAnsweredByPart = new Map();
  for (let p = 1; p <= 7; p++) {
    studioPacksByPart.set(p, []);
    uniqueQSetsByPart.set(p, new Set());
    unkeyedSlugMaxByPart.set(p, new Map());
    legacyCustomAnsweredByPart.set(p, 0);
  }

  (studioTests || []).forEach((t) => {
    const pNum = detectStudioTestPart(t);
    const bucket = partMap.get(pNum);
    const uSet = uniqueQSetsByPart.get(pNum);
    let packTotal = 0;
    let packAnswered = 0;
    let packCorrect = 0;

    (t.talks || []).forEach((tk) => {
      (tk.questions || []).forEach((q) => {
        packTotal++;
        if (bucket) bucket.totalInBank++;
        const ans = getAnswer(t.id, q.num);
        if (ans) {
          packAnswered++;
          if (bucket) bucket.answered++;
          if (uSet) uSet.add(`studio:${t.id}:${q.num}`);
          if (ans === q.answer) {
            packCorrect++;
            if (bucket) bucket.correct++;
          }
        }
      });
    });

    if (studioPacksByPart.has(pNum)) {
      studioPacksByPart.get(pNum).push({
        id: t.id,
        title: t.title,
        shortTitle: t.shortLabel || t.title.split(" (")[0],
        part: pNum,
        totalQ: packTotal,
        answeredQ: packAnswered,
        correctQ: packCorrect,
        talkCount: (t.talks || []).length
      });
    }
  });

  // 3. ChamTOEIC attempt history per Part + best/chronologically-latest full score
  const getAttemptTs = (att, fallbackIdx) => {
    if (Number.isFinite(Number(att?.timestamp)) && Number(att.timestamp) > 0) return Number(att.timestamp);
    const m = String(att?.id || "").match(/att_(\d+)/);
    if (m) return Number(m[1]) || fallbackIdx;
    return fallbackIdx;
  };
  const mapToeicQNumToPart = (qNum) => {
    const n = Number(qNum);
    if (n >= 1 && n <= 6) return 1;
    if (n >= 7 && n <= 31) return 2;
    if (n >= 32 && n <= 70) return 3;
    if (n >= 71 && n <= 100) return 4;
    if (n >= 101 && n <= 130) return 5;
    if (n >= 131 && n <= 146) return 6;
    if (n >= 147 && n <= 200) return 7;
    return null;
  };

  let completedTestCount = 0;
  let totalAttempts = 0;
  let latestFullAttempt = null;
  let latestFullTs = -1;
  let bestFullScore = 0;
  let seqIdx = 0;
  const recentAttemptsAll = [];
  const catalogTitleBySlug = new Map((catalog.tests || []).map((t) => [t.slug, t.title]));

  Object.entries(history.attemptsBySlug || {}).forEach(([slug, attempts]) => {
    if (!Array.isArray(attempts) || attempts.length === 0) return;
    const isCustomPracticeSlug = String(slug).startsWith("practice-part-");
    if (!isCustomPracticeSlug && (catalogSlugSet.size === 0 || catalogSlugSet.has(slug))) {
      completedTestCount++;
    }
    attempts.forEach((att, attIdx) => {
      seqIdx++;
      totalAttempts++;
      const ts = getAttemptTs(att, seqIdx);
      const isFull = Boolean(att.isFull990 || att.isFull200);
      const isScaled = Boolean(att.isFull990 || att.isFull200 || att.isFull495);
      recentAttemptsAll.push({
        slug,
        attemptIdx: attIdx,
        isCustom: isCustomPracticeSlug,
        partNum: isCustomPracticeSlug ? (Number(String(slug).replace("practice-part-", "")) || att.parts?.[0] || 5) : null,
        title: att.title || catalogTitleBySlug.get(slug) || (isCustomPracticeSlug ? `Luyện tập Part ${att.parts?.[0] || 5}` : slug),
        dateStr: att.dateStr || "",
        ts,
        accuracy: Number(att.accuracy || 0),
        correct: Number(att.correct || 0),
        wrong: Number(att.wrong || 0),
        skipped: Number(att.skipped || 0),
        total: Number(att.total || 0),
        scaledTotal: Number(att.scaledTotal || 0),
        isFull495: Boolean(att.isFull495),
        isScaled,
        mode: att.mode || "practice"
      });
      if (isFull && (att.scaledTotal || 0) > 0) {
        if ((att.scaledTotal || 0) > bestFullScore) bestFullScore = att.scaledTotal;
        if (ts >= latestFullTs) {
          latestFullTs = ts;
          latestFullAttempt = { slug, ...att };
        }
      }
      const pStats = att.partStats || {};
      const answerKeys = att.answers && typeof att.answers === "object" ? Object.keys(att.answers) : [];
      const hasAnswerKeys = answerKeys.length > 0;
      const hasSourceQKeys = Array.isArray(att.sourceQKeys) && att.sourceQKeys.length > 0;
      const hasPartQNums = att.partQNums && typeof att.partQNums === "object" && Object.keys(att.partQNums).length > 0;
      const attParts = Array.isArray(att.parts) ? att.parts.map(Number).filter((x) => x >= 1 && x <= 7) : [];
      const isSinglePartAttempt = attParts.length === 1;
      const maxAnsKeyNum = hasAnswerKeys ? Math.max(...answerKeys.map((k) => Number(k) || 0)) : 0;
      const hasReadingInStats = [5, 6, 7].some((p) => Number(pStats[p]?.total || 0) > 0);
      const isCompactNumberedMultiPart = !isSinglePartAttempt && hasReadingInStats && maxAnsKeyNum > 0 && maxAnsKeyNum <= 105;

      Object.values(pStats).forEach((ps) => {
        const pNum = Number(ps.part);
        const bucket = partMap.get(pNum);
        if (!bucket) return;
        const attAnswered = Number(ps.correct || 0) + Number(ps.wrong || 0);
        bucket.answered += attAnswered;
        bucket.correct += Number(ps.correct || 0);

        if (isCustomPracticeSlug) {
          if (!hasSourceQKeys && attAnswered > 0) {
            legacyCustomAnsweredByPart.set(pNum, (legacyCustomAnsweredByPart.get(pNum) || 0) + attAnswered);
          }
        } else if ((!hasAnswerKeys || (!hasPartQNums && isCompactNumberedMultiPart)) && attAnswered > 0) {
          const slugMap = unkeyedSlugMaxByPart.get(pNum);
          const capped = ps.total > 0 ? Math.min(Number(ps.total), attAnswered) : attAnswered;
          if (capped > (slugMap.get(slug) || 0)) {
            slugMap.set(slug, capped);
          }
        }
      });

      if (hasSourceQKeys) {
        att.sourceQKeys.forEach((sk) => {
          const segs = String(sk).split(":");
          const pNum = mapToeicQNumToPart(segs[2]) || Number(att.parts?.[0]);
          if (pNum && uniqueQSetsByPart.has(pNum)) {
            uniqueQSetsByPart.get(pNum).add(String(sk));
          }
        });
      } else if (!isCustomPracticeSlug && hasPartQNums) {
        Object.entries(att.partQNums).forEach(([pKey, qList]) => {
          const pNum = Number(pKey);
          if (pNum && uniqueQSetsByPart.has(pNum) && Array.isArray(qList)) {
            qList.forEach((qn) => uniqueQSetsByPart.get(pNum).add(`cham:${slug}:p${pNum}:${qn}`));
          }
        });
      } else if (!isCustomPracticeSlug && hasAnswerKeys && !isCompactNumberedMultiPart) {
        answerKeys.forEach((qKey) => {
          const pNum = isSinglePartAttempt ? attParts[0] : mapToeicQNumToPart(qKey);
          if (pNum && uniqueQSetsByPart.has(pNum)) {
            uniqueQSetsByPart.get(pNum).add(`cham:${slug}:p${pNum}:${qKey}`);
          }
        });
      }
    });
  });

  // Finalize per-Part accuracy + unique progress + LC/RC estimation
  let lcAns = 0;
  let lcCor = 0;
  let rcAns = 0;
  let rcCor = 0;
  let totalAnswered = 0;
  let totalCorrect = 0;

  const parts = Array.from(partMap.values()).map((b) => {
    b.accuracyPct = b.answered > 0 ? Math.round((b.correct / b.answered) * 100) : null;
    const uniqKeys = uniqueQSetsByPart.get(b.part)?.size || 0;
    let unkeyedSlugSum = 0;
    const slugMap = unkeyedSlugMaxByPart.get(b.part);
    if (slugMap) {
      slugMap.forEach((cnt) => { unkeyedSlugSum += cnt; });
    }
    const legacyCustom = legacyCustomAnsweredByPart.get(b.part) || 0;
    b.uniqueAnswered = Math.min(b.totalInBank, uniqKeys + unkeyedSlugSum + legacyCustom);
    totalAnswered += b.answered;
    totalCorrect += b.correct;
    if (b.part <= 4) {
      lcAns += b.answered;
      lcCor += b.correct;
    } else {
      rcAns += b.answered;
      rcCor += b.correct;
    }
    return b;
  });

  const hasData = totalAnswered > 0 || totalAttempts > 0;
  let estimatedLC = null;
  let estimatedRC = null;
  let estimatedTotal = null;
  let cefrFull = null;
  let cefrCode = null;

  if (latestFullAttempt && (latestFullAttempt.scaledTotal || 0) > 0) {
    estimatedLC = latestFullAttempt.scaledLC || estimateListeningScaledScore(latestFullAttempt.lcCorrect, latestFullAttempt.lcTotal || 100);
    estimatedRC = latestFullAttempt.scaledRC || estimateReadingScaledScore(latestFullAttempt.rcCorrect, latestFullAttempt.rcTotal || 100);
    estimatedTotal = latestFullAttempt.scaledTotal;
    cefrFull = mapTotalScoreToCEFR(estimatedTotal);
    cefrCode = cefrFull.split(" ")[0];
  } else if (hasData && totalAnswered > 0) {
    if (lcAns > 0 && rcAns > 0) {
      estimatedLC = estimateListeningScaledScore(lcCor, lcAns);
      estimatedRC = estimateReadingScaledScore(rcCor, rcAns);
    } else if (lcAns > 0) {
      estimatedLC = estimateListeningScaledScore(lcCor, lcAns);
      estimatedRC = estimateReadingScaledScore(lcCor, lcAns);
    } else {
      estimatedRC = estimateReadingScaledScore(rcCor, rcAns);
      estimatedLC = estimateListeningScaledScore(rcCor, rcAns);
    }
    estimatedTotal = estimatedLC + estimatedRC;
    cefrFull = mapTotalScoreToCEFR(estimatedTotal);
    cefrCode = cefrFull.split(" ")[0];
  }

  // Identify weakest attempted Part (< 75% or lowest accuracy)
  const attemptedParts = parts.filter((p) => p.answered > 0);
  const weakParts = attemptedParts
    .filter((p) => p.accuracyPct !== null && p.accuracyPct < 70)
    .sort((a, b) => a.accuracyPct - b.accuracyPct);
  const weakestPart = weakParts[0] || attemptedParts.slice().sort((a, b) => (a.accuracyPct ?? 100) - (b.accuracyPct ?? 100))[0] || null;

  // Count active days in last 30 days (local timezone + UTC backward compatibility)
  let activeDays = 0;
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const localK = getLocalDateKey(d);
    const utcK = d.toISOString().slice(0, 10);
    if ((state.activityLog?.[localK]?.seconds || 0) > 0 || (state.activityLog?.[utcK]?.seconds || 0) > 0) {
      activeDays++;
    }
  }

  const recentAttempts = recentAttemptsAll
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 4);

  return {
    parts,
    studioPacksByPart,
    hasData,
    totalAnswered,
    totalCorrect,
    completedTestCount,
    totalCatalogTests: (catalog.tests || []).length || 35,
    totalAttempts,
    estimatedLC,
    estimatedRC,
    estimatedTotal,
    cefrFull,
    cefrCode,
    weakParts,
    weakestPart,
    draft: draft && draft.slug ? draft : null,
    activeDays,
    streakDays: getStudyStreakDays(),
    todayMinutes: getTodayStudyMinutes(),
    recentAttempts
  };
}

function getCefrToneClass(cefr = "") {
  const s = String(cefr).toUpperCase();
  if (s.includes("C2")) return "cefr-c2";
  if (s.includes("C1")) return "cefr-c1";
  if (s.includes("B2")) return "cefr-b2";
  if (s.includes("B1")) return "cefr-b1";
  return "cefr-a12";
}

export function initDashboardAndPractice(options = {}) {
  const homeRoot = document.getElementById("v21-home-root");
  const practiceRoot = document.getElementById("v21-practice-root");

  const uiState = {
    editingGoal: false,
    selectedPart: null, // null -> 7-Part grid; 1..7 -> part config view
    questionCount: 10, // 10 | 20 | 30
    practiceMode: "practice", // 'practice' | 'timed'
    sourceSlug: "RANDOM"
  };

  function getTests() {
    return typeof options.getStudioTests === "function" ? options.getStudioTests() : (window.TOEIC_TESTS || []);
  }

  function syncMenuGoalBadge() {
    const el = document.getElementById("menu-target-score-val");
    if (el) el.textContent = String(getTargetScore());
  }

  /* ============================================================
     VIEW A: HOME DASHBOARD (#/)
     ============================================================ */
  function renderHome() {
    if (!homeRoot) return;
    const summary = computeCombinedLearningSummary(getTests());
    const targetScore = getTargetScore();
    syncMenuGoalBadge();

    const progressPct = summary.estimatedTotal !== null
      ? Math.min(100, Math.max(4, Math.round((summary.estimatedTotal / targetScore) * 100)))
      : 0;

    // Single primary warm CTA decision
    let ctaLabel = "Làm Test Đầu Vào";
    let ctaSub = "Định vị trình độ A1–C1 trong 60 phút · 100 câu";
    let ctaAction = "placement";
    if (summary.draft) {
      const doneCnt = Object.keys(summary.draft.answers || {}).length;
      ctaLabel = `Tiếp tục: ${summary.draft.title}`;
      ctaSub = `Đang làm dở ${doneCnt}/${summary.draft.totalQ || 200} câu`;
      ctaAction = "resume_draft";
    } else if (summary.hasData && summary.weakestPart) {
      ctaLabel = `Tiếp tục học · Part ${summary.weakestPart.part}`;
      ctaSub = summary.weakestPart.accuracyPct !== null && summary.weakestPart.accuracyPct < 70
        ? `Part yếu nhất hiện tại (${summary.weakestPart.accuracyPct}% đúng) — ưu tiên cải thiện`
        : `Luyện tập 10 câu ${summary.weakestPart.name} để nâng điểm`;
      ctaAction = `practice_part_${summary.weakestPart.part}`;
    } else if (summary.hasData) {
      ctaLabel = "Tiếp tục học · Part 5";
      ctaSub = "Luyện nhanh 10 câu ngữ pháp & từ loại";
      ctaAction = "practice_part_5";
    }

    const todayKey = getTodayKey();
    const tasks = [
      {
        id: "vocab",
        title: "Ôn 20 từ vựng SRS",
        sub: "Flashcard ngắt quãng SM-2 · Ghi nhớ dài hạn",
        btnLabel: "Ôn ngay",
        done: isDailyTaskDone("vocab", todayKey)
      },
      {
        id: "part5",
        title: "Làm 1 bài Part 5 (10 câu)",
        sub: "Hoàn thành câu · Ngữ pháp & Từ loại",
        btnLabel: "Luyện ngay",
        done: isDailyTaskDone("part5", todayKey)
      },
      {
        id: "part3",
        title: "Nghe 1 đoạn Part 3",
        sub: "Đoạn hội thoại · Luyện bắt từ khóa",
        btnLabel: "Luyện ngay",
        done: isDailyTaskDone("part3", todayKey)
      }
    ];
    const doneTaskCount = tasks.filter((t) => t.done).length;

    const goalPresets = [500, 600, 650, 700, 750, 800, 850, 900, 950];

    homeRoot.innerHTML = `
      <div class="v21-container">
        <!-- 1. Goal & Primary Continue Hero -->
        <section class="v21-card v21-goal-card" aria-label="Mục tiêu điểm TOEIC">
          <div class="v21-goal-main">
            <div class="v21-goal-eyebrow-row">
              <span class="v21-eyebrow">Lộ trình học TOEIC</span>
              ${summary.cefrCode
                ? `<span class="cefr-badge ${getCefrToneClass(summary.cefrCode)}">${esc(summary.cefrCode)}</span>`
                : `<span class="v21-neutral-pill">Chưa định vị CEFR</span>`}
              ${(summary.streakDays > 0 || summary.todayMinutes > 0) ? `
                <span class="v21-streak-pill tabular-nums" title="Chuỗi ngày học liên tiếp và thời lượng luyện tập hôm nay">
                  ${summary.streakDays > 0 ? `Chuỗi ${summary.streakDays} ngày` : "Học hôm nay"}${summary.todayMinutes > 0 ? ` · ${summary.todayMinutes} phút` : ""}
                </span>
              ` : ""}
            </div>

            <div class="v21-goal-score-row">
              <div class="v21-score-pair">
                <span class="v21-score-big tabular-nums">${summary.estimatedTotal !== null ? summary.estimatedTotal : "---"}</span>
                <span class="v21-score-denom">/ 990</span>
              </div>
              <span class="v21-score-arrow" aria-hidden="true">→</span>
              <div class="v21-target-inline">
                <span class="v21-target-label">Mục tiêu</span>
                <strong class="v21-target-num tabular-nums">${targetScore}</strong>
                <button type="button" class="v21-text-btn" id="v21-edit-goal-btn" aria-expanded="${uiState.editingGoal ? "true" : "false"}">
                  ${uiState.editingGoal ? "Đóng" : "Đổi mục tiêu"}
                </button>
              </div>
            </div>

            ${uiState.editingGoal ? `
              <div class="v21-goal-editor" id="v21-goal-editor">
                <div class="v21-goal-presets">
                  ${goalPresets.map((val) => `
                    <button type="button" class="v21-goal-chip ${val === targetScore ? "is-active" : ""}" data-goal-preset="${val}">${val}</button>
                  `).join("")}
                </div>
                <div class="v21-goal-custom">
                  <label for="v21-goal-custom-input">Hoặc nhập điểm (300–990):</label>
                  <input type="number" id="v21-goal-custom-input" min="300" max="990" step="5" value="${targetScore}" />
                  <button type="button" class="cham-btn cham-btn-primary" id="v21-goal-save-btn">Lưu</button>
                </div>
              </div>
            ` : ""}

            <div class="v21-goal-progress-wrap">
              <div class="v21-progress-track" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100">
                <div class="v21-progress-fill" style="width: ${progressPct}%;"></div>
              </div>
              <div class="v21-goal-meta">
                <span>
                  ${summary.estimatedTotal !== null
                    ? `Listening <strong>${summary.estimatedLC}/495</strong> · Reading <strong>${summary.estimatedRC}/495</strong>`
                    : "Làm bài kiểm tra đầu vào để hệ thống ước lượng điểm LC / RC chính xác."}
                </span>
                <span class="tabular-nums">${summary.estimatedTotal !== null ? `${progressPct}% mục tiêu` : `Mốc ${targetScore} điểm`}</span>
              </div>
            </div>
          </div>

          <div class="v21-goal-cta-col">
            <button type="button" class="cham-btn cham-btn-warm v21-primary-cta" id="v21-continue-cta" data-cta-action="${esc(ctaAction)}">
              <span>${esc(ctaLabel)}</span>
              ${getIcon("arrowRight", 16)}
            </button>
            <p class="v21-cta-sub">${esc(ctaSub)}</p>
            <button type="button" class="v21-link-btn" id="v21-home-goto-tests">
              Hoặc xem danh sách ${summary.totalCatalogTests} đề thi thử →
            </button>
          </div>
        </section>

        <!-- 2. Main 2-Column Content: Per-Part Accuracy Chart + Today's 3 Tasks -->
        <div class="v21-home-grid">
          <section class="v21-card v21-chart-card" aria-label="Độ chính xác theo Part 1 đến 7">
            <div class="v21-card-head">
              <div>
                <h2 class="v21-section-title">Độ chính xác theo Part 1–7</h2>
                <p class="v21-section-sub">Nhấn vào bất kỳ Part nào để luyện ngay. Các Part dưới 70% được đánh dấu cam.</p>
              </div>
              <div class="v21-chart-legend">
                <span class="v21-legend-item"><i class="is-ok"></i> Ổn định</span>
                <span class="v21-legend-item"><i class="is-weak"></i> Cần luyện</span>
              </div>
            </div>

            <div class="v21-part-bars" role="list">
              ${summary.parts.map((p) => {
                const hasAns = p.answered > 0;
                const pct = hasAns ? p.accuracyPct : 0;
                const isWeak = hasAns && pct < 70;
                const barH = hasAns ? Math.max(10, pct) : 6;
                return `
                  <button type="button" class="v21-bar-col ${isWeak ? "is-weak" : (hasAns ? "is-good" : "is-empty")}" data-home-part="${p.part}" role="listitem" title="Part ${p.part} (${p.name}): ${hasAns ? `${p.correct}/${p.answered} câu đúng (${pct}%)` : "Chưa có dữ liệu"} — Bấm để luyện">
                    <span class="v21-bar-val tabular-nums">${hasAns ? `${pct}%` : "—"}</span>
                    <div class="v21-bar-track">
                      <span class="v21-bar-fill" style="height: ${barH}%;"></span>
                    </div>
                    <span class="v21-bar-label">P${p.part}</span>
                    <span class="v21-bar-name">${esc(p.section === "Listening" ? "Nghe" : "Đọc")}</span>
                  </button>
                `;
              }).join("")}
            </div>

            ${summary.weakParts.length > 0 ? `
              <div class="v21-weak-banner">
                <span class="v21-weak-dot" aria-hidden="true"></span>
                <span>Ưu tiên cải thiện: <strong>${summary.weakParts.slice(0, 2).map((w) => `Part ${w.part} (${w.accuracyPct}%)`).join(", ")}</strong></span>
                <button type="button" class="v21-text-btn" data-home-part="${summary.weakParts[0].part}">Luyện Part ${summary.weakParts[0].part} →</button>
              </div>
            ` : (!summary.hasData ? `
              <div class="v21-empty-hint">
                <span>Chưa có dữ liệu làm bài. Hãy bắt đầu bằng Test Đầu Vào hoặc luyện 10 câu ở một Part bất kỳ.</span>
              </div>
            ` : `
              <div class="v21-good-hint">
                <span>Tất cả Part đã luyện đều đạt từ 70% trở lên. Hãy làm thêm đề Full Test để tăng sức bền 120 phút.</span>
              </div>
            `)}
          </section>

          <section class="v21-card v21-tasks-card" aria-label="Nhiệm vụ hôm nay">
            <div class="v21-card-head">
              <div>
                <h2 class="v21-section-title">Nhiệm vụ hôm nay</h2>
                <p class="v21-section-sub">Duy trì đều 30–45 phút mỗi ngày</p>
              </div>
              <span class="v21-task-counter tabular-nums">${doneTaskCount}/3</span>
            </div>

            <div class="v21-task-list">
              ${tasks.map((t) => `
                <div class="v21-task-row ${t.done ? "is-done" : ""}">
                  <label class="v21-task-check-wrap">
                    <input type="checkbox" class="v21-task-checkbox" data-task-toggle="${esc(t.id)}" ${t.done ? "checked" : ""} aria-label="Đánh dấu hoàn thành: ${esc(t.title)}" />
                    <span class="v21-task-text">
                      <span class="v21-task-title">${esc(t.title)}</span>
                      <span class="v21-task-sub">${esc(t.sub)}</span>
                    </span>
                  </label>
                  <button type="button" class="v21-task-go-btn" data-task-go="${esc(t.id)}">${esc(t.btnLabel)}</button>
                </div>
              `).join("")}
            </div>
          </section>
        </div>

        <!-- 3. Quiet Quick-Summary Strip (No Heavy KPI Cards) -->
        <section class="v21-quick-strip" aria-label="Lối tắt nhanh">
          <button type="button" class="v21-quick-item" id="v21-quick-tests">
            <span class="v21-quick-label">Đề thi thử</span>
            <span class="v21-quick-val tabular-nums">${summary.completedTestCount}/${summary.totalCatalogTests} đề đã làm</span>
          </button>
          <button type="button" class="v21-quick-item" id="v21-quick-practice">
            <span class="v21-quick-label">Câu đã luyện</span>
            <span class="v21-quick-val tabular-nums">${summary.totalAnswered.toLocaleString("vi-VN")} câu</span>
          </button>
          <button type="button" class="v21-quick-item" id="v21-quick-materials">
            <span class="v21-quick-label">Tài liệu Hackers &amp; ETS</span>
            <span class="v21-quick-val">6 giáo trình · 8 chuyên đề ngữ pháp</span>
          </button>
        </section>

        ${summary.recentAttempts.length > 0 ? `
          <!-- 4. Recent Attempts & Quick Review -->
          <section class="v21-card v21-recent-card" id="v21-recent-attempts" aria-label="Lịch sử làm bài gần đây">
            <div class="v21-card-head">
              <div>
                <h2 class="v21-section-title">Lịch sử làm bài gần đây</h2>
                <p class="v21-section-sub">Mở lại kết quả hoặc vào thẳng màn hình chữa bài các đề bạn vừa làm.</p>
              </div>
              <button type="button" class="v21-text-btn" id="v21-recent-open-analytics">Xem thống kê đầy đủ →</button>
            </div>
            <div class="v21-recent-list">
              ${summary.recentAttempts.map((att) => {
                const denom = att.isFull495 ? "/495" : "/990";
                const scoreText = att.isScaled ? `${att.scaledTotal}${denom}` : `${att.accuracy}%`;
                const isWeakAcc = att.accuracy < 70;
                return `
                  <div class="v21-recent-row">
                    <div class="v21-recent-main">
                      <strong class="v21-recent-title">${esc(att.title)}</strong>
                      <span class="v21-recent-meta tabular-nums">
                        ${att.mode === "exam" ? "Thi chuẩn IIG" : "Luyện tập"} · Đúng ${att.correct}/${att.total}${att.wrong > 0 ? ` · Sai ${att.wrong}` : ""}${att.dateStr ? ` · ${esc(att.dateStr)}` : ""}
                      </span>
                    </div>
                    <div class="v21-recent-right">
                      <span class="v21-recent-score tabular-nums ${isWeakAcc ? "is-weak" : "is-good"}">${esc(scoreText)}</span>
                      <button type="button" class="cham-btn v21-row-btn" data-home-open-attempt-slug="${esc(att.slug)}" data-home-open-attempt-idx="${att.attemptIdx}" data-home-open-attempt-custom="${att.isCustom ? "1" : "0"}" data-home-open-attempt-part="${att.partNum || 5}">
                        ${att.isCustom ? "Luyện lại →" : "Xem & Chữa bài"}
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </section>
        ` : ""}
      </div>
    `;

    bindHomeEvents(summary);
  }

  function bindHomeEvents(summary) {
    if (!homeRoot) return;

    homeRoot.querySelector("#v21-edit-goal-btn")?.addEventListener("click", () => {
      uiState.editingGoal = !uiState.editingGoal;
      renderHome();
    });

    homeRoot.querySelectorAll("[data-goal-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTargetScore(Number(btn.dataset.goalPreset));
        uiState.editingGoal = false;
        renderHome();
      });
    });

    homeRoot.querySelector("#v21-goal-save-btn")?.addEventListener("click", () => {
      const inp = homeRoot.querySelector("#v21-goal-custom-input");
      if (inp) {
        setTargetScore(Number(inp.value) || 750);
        uiState.editingGoal = false;
        renderHome();
      }
    });

    homeRoot.querySelector("#v21-continue-cta")?.addEventListener("click", (e) => {
      const action = e.currentTarget.dataset.ctaAction || "placement";
      if (action === "resume_draft" && summary.draft) {
        options.onResumeDraft?.(summary.draft);
      } else if (action === "placement") {
        options.onOpenTestDetail?.("test-au-vao-01");
      } else if (action.startsWith("practice_part_")) {
        const pNum = Number(action.replace("practice_part_", "")) || 5;
        options.onOpenPracticePart?.(pNum);
      } else {
        options.onOpenPractice?.();
      }
    });

    homeRoot.querySelector("#v21-home-goto-tests")?.addEventListener("click", () => options.onOpenTests?.());
    homeRoot.querySelector("#v21-quick-tests")?.addEventListener("click", () => options.onOpenTests?.());
    homeRoot.querySelector("#v21-quick-practice")?.addEventListener("click", () => options.onOpenPractice?.());
    homeRoot.querySelector("#v21-quick-materials")?.addEventListener("click", () => options.onOpenMaterials?.("books"));
    homeRoot.querySelector("#v21-recent-open-analytics")?.addEventListener("click", () => options.onOpenAnalytics?.());

    homeRoot.querySelectorAll("[data-home-open-attempt-slug]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = btn.dataset.homeOpenAttemptSlug;
        const idx = Number(btn.dataset.homeOpenAttemptIdx) || 0;
        const isCustom = btn.dataset.homeOpenAttemptCustom === "1";
        const pNum = Number(btn.dataset.homeOpenAttemptPart) || 5;
        if (isCustom) {
          options.onOpenPracticePart?.(pNum);
        } else if (options.onOpenHistoricalAttempt) {
          options.onOpenHistoricalAttempt(slug, idx);
        } else {
          options.onOpenTestDetail?.(slug);
        }
      });
    });

    homeRoot.querySelectorAll("[data-home-part]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pNum = Number(btn.dataset.homePart);
        if (pNum >= 1 && pNum <= 7) options.onOpenPracticePart?.(pNum);
      });
    });

    homeRoot.querySelectorAll("[data-task-toggle]").forEach((cb) => {
      cb.addEventListener("change", () => {
        setDailyTaskDone(cb.dataset.taskToggle, cb.checked);
        renderHome();
      });
    });

    homeRoot.querySelectorAll("[data-task-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tid = btn.dataset.taskGo;
        if (tid === "vocab") {
          setDailyTaskDone("vocab", true);
          options.onOpenVocab?.();
        } else if (tid === "part5") {
          options.onOpenPracticePart?.(5);
        } else if (tid === "part3") {
          options.onOpenPracticePart?.(3);
        }
      });
    });
  }

  /* ============================================================
     VIEW B: PRACTICE BY PART (#/practice & #/practice/part/:n)
     ============================================================ */
  function renderPractice(selectedPart = uiState.selectedPart) {
    if (!practiceRoot) return;
    uiState.selectedPart = selectedPart ? Number(selectedPart) : null;
    const summary = computeCombinedLearningSummary(getTests());

    if (uiState.selectedPart && uiState.selectedPart >= 1 && uiState.selectedPart <= 7) {
      renderPracticePartConfig(summary, uiState.selectedPart);
      return;
    }

    const listeningParts = summary.parts.filter((p) => p.section === "Listening");
    const readingParts = summary.parts.filter((p) => p.section === "Reading");

    const renderPartCard = (p) => {
      const hasAns = p.answered > 0;
      const isWeak = hasAns && p.accuracyPct < 70;
      const shownDone = Number.isFinite(p.uniqueAnswered) ? p.uniqueAnswered : Math.min(p.totalInBank, p.answered);
      const donePct = p.totalInBank > 0 ? Math.min(100, Math.round((shownDone / p.totalInBank) * 100)) : 0;
      return `
        <button type="button" class="v21-card v21-part-card ${isWeak ? "is-weak-part" : ""}" data-practice-part="${p.part}">
          <div class="v21-part-card-top">
            <span class="v21-part-num">Part ${p.part}</span>
            ${isWeak
              ? `<span class="v21-weak-pill">Cần luyện · ${p.accuracyPct}%</span>`
              : (hasAns ? `<span class="v21-acc-pill">${p.accuracyPct}% đúng</span>` : `<span class="v21-muted-pill">Chưa luyện</span>`)}
          </div>
          <h3 class="v21-part-title">${esc(p.name)}</h3>
          <p class="v21-part-desc">${esc(p.format)}</p>
          <div class="v21-part-footer">
            <div class="v21-part-progress">
              <div class="v21-mini-track"><span style="width: ${donePct}%;"></span></div>
              <span class="v21-part-count tabular-nums">Đã làm ${shownDone.toLocaleString("vi-VN")} / ${p.totalInBank.toLocaleString("vi-VN")} câu</span>
            </div>
            <span class="v21-part-cta">Luyện →</span>
          </div>
        </button>
      `;
    };

    const totalBankTests = (window.CHAM_TOEIC_CATALOG?.tests || []).length + (getTests() || []).length;
    const totalBankQs = summary.parts.reduce((acc, p) => acc + (p.totalInBank || 0), 0);

    practiceRoot.innerHTML = `
      <div class="v21-container">
        <div class="v21-page-head">
          <div>
            <h1 class="v21-page-title">Luyện tập theo Part</h1>
            <p class="v21-page-sub">Chọn kỹ năng cần cải thiện từ tổng ngân hàng <strong>${totalBankTests} bộ đề</strong> (${totalBankQs.toLocaleString("vi-VN")} câu hỏi) gồm Full Test, Mini Test &amp; Đề thi lẻ từng Part.</p>
          </div>
        </div>

        <section class="v21-part-section" aria-label="Phần Nghe Listening Part 1 đến 4">
          <div class="v21-group-label">
            <span>Listening · Part 1 – 4</span>
            <span class="v21-group-hint">Nghe hiểu hình ảnh, hỏi đáp, hội thoại &amp; bài nói ngắn</span>
          </div>
          <div class="v21-parts-grid-4">
            ${listeningParts.map(renderPartCard).join("")}
          </div>
        </section>

        <section class="v21-part-section" aria-label="Phần Đọc Reading Part 5 đến 7">
          <div class="v21-group-label">
            <span>Reading · Part 5 – 7</span>
            <span class="v21-group-hint">Ngữ pháp, điền đoạn văn &amp; đọc hiểu đa văn bản</span>
          </div>
          <div class="v21-parts-grid-3">
            ${readingParts.map(renderPartCard).join("")}
          </div>
        </section>
      </div>
    `;

    practiceRoot.querySelectorAll("[data-practice-part]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pNum = Number(btn.dataset.practicePart);
        options.onOpenPracticePart?.(pNum);
      });
    });
  }

  function renderPracticePartConfig(summary, partNum) {
    const partInfo = summary.parts.find((p) => p.part === partNum) || summary.parts[0];
    const studioPacks = summary.studioPacksByPart.get(partNum) || [];
    const catalogTests = (window.CHAM_TOEIC_CATALOG?.tests || []).filter(
      (t) => Number(t.partCounts?.[`PART_${partNum}`] || 0) > 0
    );
    const singlePartTests = catalogTests.filter(
      (t) => t.testType === "part" && Number(t.focusPart) === partNum
    );
    const historyMap = readChamHistory().attemptsBySlug || {};
    const estMinutes = Math.max(3, Math.round((uiState.questionCount * partInfo.secPerQ) / 60));

    practiceRoot.innerHTML = `
      <div class="v21-container">
        <div class="v21-breadcrumb-row">
          <button type="button" class="v21-back-btn" id="v21-practice-back-btn">
            ${getIcon("arrowLeft", 15)}
            <span>Tất cả 7 Part</span>
          </button>
          <span class="v21-neutral-pill">${esc(partInfo.section)}</span>
        </div>

        <div class="v21-practice-config-grid">
          <section class="v21-card v21-config-main">
            <h1 class="v21-page-title">Part ${partInfo.part} · ${esc(partInfo.name)}</h1>
            <p class="v21-page-sub" style="margin-bottom: 20px;">${esc(partInfo.format)}</p>

            <div class="v21-config-stats-row">
              <span>Kho câu hỏi: <strong>${partInfo.totalInBank.toLocaleString("vi-VN")} câu</strong></span>
              <span>·</span>
              <span>Đã làm: <strong>${partInfo.uniqueAnswered.toLocaleString("vi-VN")} câu</strong></span>
              ${partInfo.accuracyPct !== null ? `<span>·</span><span>Chính xác: <strong style="color: ${partInfo.accuracyPct < 70 ? "var(--warm)" : "var(--ok)"};">${partInfo.accuracyPct}%</strong></span>` : ""}
            </div>

            <div class="v21-config-group">
              <label class="v21-config-label">1. Số lượng câu muốn luyện</label>
              <div class="v21-seg-row" role="group" aria-label="Chọn số lượng câu">
                ${[10, 20, 30].map((cnt) => `
                  <button type="button" class="v21-seg-pill ${uiState.questionCount === cnt ? "is-active" : ""}" data-practice-count="${cnt}">
                    ${cnt} câu
                  </button>
                `).join("")}
              </div>
            </div>

            <div class="v21-config-group">
              <label class="v21-config-label">2. Chế độ làm bài</label>
              <div class="v21-mode-grid">
                <button type="button" class="v21-mode-card ${uiState.practiceMode === "practice" ? "is-active" : ""}" data-practice-mode="practice">
                  <strong>Luyện có giải thích</strong>
                  <span>Xem đáp án, giải thích, transcript${partNum <= 4 ? ", Karaoke & Chép chính tả" : ""} ngay sau từng câu.</span>
                </button>
                <button type="button" class="v21-mode-card ${uiState.practiceMode === "timed" ? "is-active" : ""}" data-practice-mode="timed">
                  <strong>Tính giờ chuẩn thi (~${estMinutes} phút)</strong>
                  <span>Giới hạn thời gian theo nhịp độ thi thật ETS, nộp bài xong mới chấm điểm.</span>
                </button>
              </div>
            </div>

            <div class="v21-config-group">
              <label class="v21-config-label" for="v21-practice-source-select">3. Nguồn đề thi</label>
              <select id="v21-practice-source-select" class="v21-select">
                <option value="RANDOM" ${uiState.sourceSlug === "RANDOM" ? "selected" : ""}>Tổng hợp ngẫu nhiên từ kho ${catalogTests.length} đề ETS</option>
                ${catalogTests.map((t) => `
                  <option value="${esc(t.slug)}" ${uiState.sourceSlug === t.slug ? "selected" : ""}>${esc(t.title)} (${t.partCounts[`PART_${partNum}`]} câu Part ${partNum})</option>
                `).join("")}
              </select>
            </div>

            <div class="v21-config-actions">
              <button type="button" class="cham-btn cham-btn-warm v21-primary-cta" id="v21-start-part-btn">
                <span>Bắt đầu luyện Part ${partInfo.part} (${uiState.questionCount} câu)</span>
                ${getIcon("arrowRight", 16)}
              </button>
            </div>
          </section>

          <aside class="v21-card v21-config-aside">
            ${singlePartTests.length > 0 ? `
              <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
                <h2 class="v21-section-title" style="margin: 0;">Đề thi lẻ Part ${partNum} (${singlePartTests.length} đề)</h2>
                <button type="button" class="v21-text-btn" id="v21-view-all-part-tests-btn" data-part="${partNum}" style="font-size: 12.5px;">Xem tất cả →</button>
              </div>
              <p class="v21-section-sub" style="margin-bottom: 12px;">
                Mở trực tiếp bộ đề chuẩn theo từng bài thi lẻ Part ${partNum} có đầy đủ giải thích chi tiết.
              </p>
              <div class="v21-part-tests-list">
                ${singlePartTests.slice(0, 6).map((pt) => {
                  const diff = window.TOEIC_DIFFICULTY_DATA?.chamTests?.[pt.slug];
                  const cefr = diff?.cefr || "B1";
                  const atts = historyMap[pt.slug] || [];
                  const bestAcc = atts.reduce((m, a) => Math.max(m, Number(a.accuracy || 0)), 0);
                  return `
                    <div class="v21-studio-pack-row">
                      <div class="v21-studio-pack-info">
                        <strong>${esc(pt.title)}</strong>
                        <span>${pt.totalQuestions} câu · ${pt.duration}p · ${esc(cefr)}${atts.length ? ` · Tốt nhất ${bestAcc}%` : ""}</span>
                      </div>
                      <button type="button" class="cham-btn" data-open-part-test="${esc(pt.slug)}">
                        Làm bài →
                      </button>
                    </div>
                  `;
                }).join("")}
              </div>
              <hr style="border: 0; border-top: 1px solid var(--border); margin: 16px 0;" />
            ` : ""}

            <h2 class="v21-section-title" style="margin-bottom: 6px;">Gói luyện sâu Studio</h2>
            <p class="v21-section-sub" style="margin-bottom: 14px;">
              ${partNum <= 4
                ? "Các bộ luyện nghe có sẵn Live Karaoke Script đồng bộ từng từ, Chép chính tả và Shadowing."
                : "Các bộ luyện đọc có phân tích chứng cứ trực tiếp và dịch song ngữ từng đoạn."}
            </p>

            ${studioPacks.length > 0 ? `
              <div class="v21-studio-pack-list">
                ${studioPacks.map((pk) => `
                  <div class="v21-studio-pack-row">
                    <div class="v21-studio-pack-info">
                      <strong>${esc(pk.shortTitle)}</strong>
                      <span>${pk.totalQ} câu · ${pk.talkCount} bài${pk.answeredQ > 0 ? ` · Đã làm ${pk.answeredQ}/${pk.totalQ}` : ""}</span>
                    </div>
                    <button type="button" class="cham-btn" data-open-studio-pack="${esc(pk.id)}">
                      Mở bài →
                    </button>
                  </div>
                `).join("")}
              </div>
            ` : `
              <div class="v21-empty-hint" style="margin-top: 0;">
                <span>Part ${partNum} luyện trực tiếp trên kho ${catalogTests.length} đề với đầy đủ giải thích${partNum <= 4 ? ", Transcript, Karaoke, Chép chính tả & Shadowing" : " và tô vàng từ khóa"}.</span>
              </div>
            `}
          </aside>
        </div>
      </div>
    `;

    practiceRoot.querySelector("#v21-practice-back-btn")?.addEventListener("click", () => {
      options.onOpenPractice?.();
    });

    practiceRoot.querySelectorAll("[data-practice-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.questionCount = Number(btn.dataset.practiceCount) || 10;
        renderPractice(partNum);
      });
    });

    practiceRoot.querySelectorAll("[data-practice-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.practiceMode = btn.dataset.practiceMode === "timed" ? "timed" : "practice";
        renderPractice(partNum);
      });
    });

    practiceRoot.querySelector("#v21-practice-source-select")?.addEventListener("change", (e) => {
      uiState.sourceSlug = e.target.value || "RANDOM";
    });

    practiceRoot.querySelector("#v21-start-part-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      const origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span>Đang tải câu hỏi Part ${partNum}...</span>`;
      try {
        const started = await options.onStartPartPractice?.({
          part: partNum,
          count: uiState.questionCount,
          mode: uiState.practiceMode,
          timeLimitMin: uiState.practiceMode === "timed" ? estMinutes : 0,
          sourceSlug: uiState.sourceSlug
        });
        if (started !== false) {
          if (partNum === 5) setDailyTaskDone("part5", true);
          if (partNum === 3) setDailyTaskDone("part3", true);
        }
      } finally {
        if (btn && btn.isConnected) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    });

    practiceRoot.querySelectorAll("[data-open-studio-pack]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.openStudioPack;
        if (pid) options.onOpenStudioPack?.(pid);
      });
    });

    practiceRoot.querySelectorAll("[data-open-part-test]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = btn.dataset.openPartTest;
        if (slug) options.onOpenTestDetail?.(slug);
      });
    });

    practiceRoot.querySelector("#v21-view-all-part-tests-btn")?.addEventListener("click", (e) => {
      const pNum = Number(e.currentTarget.dataset.part) || partNum;
      if (options.onOpenTestsFiltered) {
        options.onOpenTestsFiltered({ typeFilter: "PART", partFilter: String(pNum) });
      } else {
        options.onOpenTests?.();
      }
    });
  }

  return {
    renderHome,
    renderPractice,
    setSelectedPart(p) {
      uiState.selectedPart = p ? Number(p) : null;
      uiState.sourceSlug = "RANDOM";
    }
  };
}
