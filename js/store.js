/**
 * Neuro-TOEIC Part 4 Studio Pro — State Store v3
 * Auto-migrates from v2, provides reactive pub/sub and persistence
 */

const STORAGE_KEY_V3 = "neuro_toeic_part4_state_v3";
const STORAGE_KEY_V2 = "neuro_toeic_part4_state_v2";

const listeners = new Set();

function getInitialState() {
  return {
    activeTest: "ets2019_t6",
    mode: "practice", // 'practice' | 'study' | 'exam'
    theme: "light", // 'light' | 'dark'
    targetScore: 750, // User's TOEIC goal (/990), editable from Home Dashboard
    dailyTasksDone: {}, // { 'YYYY-MM-DD': { vocab: bool, part5: bool, part3: bool } }
    focusMode: false,
    focusDockMinimized: false,
    cbtPaletteOpen: false,
    showTranscript: true, // Right pane toggleable: false = comfortable centered, true = 2-column split
    showWaveform: true, // Toggle between full waveform vs compact scrubber
    showConfidence: false, // Minimalist mode: hide confidence chips by default
    viewAll: false,
    currentIndex: {
      ets2019_t6: 0,
      hackers3_t4: 0,
      ets2019_p2_t7: 0,
      ets2019_p1_t6: 0,
      ets2019_p1_t7: 0,
      part7_t1: 0,
      part5_t1: 0,
      part6_t1: 0,
      part56_t1: 0
    },
    showPassageVi: false, // Inline paragraph Vietnamese translation toggle in Part 7 (study/checked only)
    answers: {}, // { [qNum]: 'A'|'B'|'C'|'D' }
    checkedTalks: {}, // { [talkKey]: true }
    revealedScripts: {}, // { [talkKey]: true }
    bookmarks: {}, // { [talkKey]: true }
    notes: {}, // { [talkKey]: string }
    confidence: {}, // { [qNum]: 'sure' | 'doubt' | 'guess' }
    eliminations: {}, // { [qNum]: ['A', 'C'] }
    highlights: {}, // { [talkKey]: ['string', ...] }
    mastery: {}, // { [talkKey]: { test: bool, decode: bool, dictation: bool, shadowing: bool } }
    dictationProgress: {}, // { [talkKey]: { score: number, answers: {} } }
    inspectorTabs: {}, // { [talkKey]: 'script' | 'analysis' | 'dictation' | 'vocab' | 'shadowing' }
    scriptViewMode: "bilingual", // 'bilingual' | 'en' | 'blur'
    answerChanges: [], // [ { qNum, from, to, correct, timestamp } ]
    activityLog: {}, // { 'YYYY-MM-DD': { seconds: number, talksCompleted: number } }
    readerSettings: {
      fontSize: "md", // 'sm' | 'md' | 'lg' | 'xl'
      lineHeight: "normal", // 'compact' | 'normal' | 'relaxed'
      reducedMotion: false
    },
    audioSettings: {
      speed: 1.0,
      preListenSkim: false,
      playIntro: true, // Bật/Tắt đọc phần giới thiệu bài ("Questions 71 through 73 refer to...")
      playQuestions: true, // Bật/Tắt đọc câu hỏi sau bài nghe ("Number 71... Number 72...")
      ambientType: "rain", // 'rain' | 'white' | 'none'
      ambientVolume: 0.2
    }
  };
}

export function loadState() {
  try {
    let saved = null;
    const v3Raw = localStorage.getItem(STORAGE_KEY_V3);
    if (v3Raw) {
      saved = JSON.parse(v3Raw);
    } else {
      // Auto-migrate from v2
      const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
      if (v2Raw) {
        const v2 = JSON.parse(v2Raw);
        saved = { ...getInitialState(), ...v2 };
        // Reset theme to light if migrated from older sepia default
        saved.theme = "light";
        console.info("Successfully migrated state from v2 to v3!");
      }
    }

    const state = { ...getInitialState(), ...(saved || {}) };
    state.focusMode = false; // Always start with clean focus state on page load to prevent UI desync
    if (typeof state.showTranscript !== "boolean") state.showTranscript = true;
    if (typeof state.showWaveform !== "boolean") state.showWaveform = true;
    if (typeof state.showConfidence !== "boolean") state.showConfidence = false;
    const hadInvalidTheme = !["light", "dark"].includes(state.theme);
    if (hadInvalidTheme) {
      state.theme = "light";
      try {
        localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
      } catch {
        // Ignore storage quota / privacy mode errors
      }
    }
    if (!state.minimalLightMigratedV19) {
      state.theme = "light";
      state.showConfidence = false;
      state.minimalLightMigratedV19 = true;
      try {
        localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
      } catch {
        // Ignore storage quota / privacy mode errors
      }
    }
    // Ensure nested objects exist
    state.currentIndex = { ...getInitialState().currentIndex, ...(state.currentIndex || {}) };
    state.readerSettings = { ...getInitialState().readerSettings, ...(state.readerSettings || {}) };
    state.audioSettings = { ...getInitialState().audioSettings, ...(state.audioSettings || {}) };
    if (typeof state.audioSettings.playIntro !== "boolean") state.audioSettings.playIntro = true;
    if (typeof state.audioSettings.playQuestions !== "boolean") state.audioSettings.playQuestions = true;
    state.activityLog = state.activityLog || {};
    state.dailyTasksDone = state.dailyTasksDone || {};
    const parsedTarget = Number(state.targetScore);
    state.targetScore = Number.isFinite(parsedTarget) && parsedTarget >= 300 && parsedTarget <= 990 ? Math.round(parsedTarget / 5) * 5 : 750;
    state.checkedTalks = state.checkedTalks || {};
    state.answers = state.answers || {};
    state.confidence = state.confidence || {};
    state.eliminations = state.eliminations || {};

    // Auto-migrate legacy answers without test prefix to default owner
    Object.keys(state.answers).forEach((k) => {
      if (!k.includes("_") && !isNaN(Number(k))) {
        const qNum = Number(k);
        const defaultOwner = qNum >= 147
          ? "part7_t1"
          : qNum >= 131
            ? "part6_t1"
            : qNum >= 101
              ? "part5_t1"
              : qNum >= 71
                ? "ets2019_t6"
                : qNum >= 7
                  ? "ets2019_p2_t7"
                  : "ets2019_p1_t6";
        const scopedKey = `${defaultOwner}_${qNum}`;
        if (state.answers[scopedKey] === undefined) {
          state.answers[scopedKey] = state.answers[k];
        }
      }
    });

    return state;
  } catch (err) {
    console.warn("Failed to load state, using defaults:", err);
    return getInitialState();
  }
}

export const state = loadState();

let saveTimer = null;
export function saveStateNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
  } catch (e) {
    console.warn("Error saving state:", e);
  }
}

export function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveStateNow, 100);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    saveStateNow();
  });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(event, payload) {
  listeners.forEach((fn) => {
    try {
      fn(event, payload, state);
    } catch (err) {
      console.error("Store listener error:", err);
    }
  });
}

/** Local YYYY-MM-DD date key (prevents UTC midnight offset bugs in UTC+7) */
export function getLocalDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Update Activity Heatmap Log */
export function recordActiveTime(seconds = 1, options = {}) {
  const sec = Number(seconds);
  if (!Number.isFinite(sec) || sec <= 0) return;
  const today = getLocalDateKey();
  if (!state.activityLog[today]) {
    state.activityLog[today] = { seconds: 0, talksCompleted: 0 };
  }
  state.activityLog[today].seconds = (state.activityLog[today].seconds || 0) + sec;
  if (options && options.immediate) {
    saveStateNow();
  } else {
    saveState();
  }
}

/** Current consecutive study streak in days (counts today or continuing from yesterday) */
export function getStudyStreakDays() {
  const log = state.activityLog || {};
  const hasActivity = (dateObj) => {
    const localKey = getLocalDateKey(dateObj);
    return (log[localKey]?.seconds || 0) > 0;
  };
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!hasActivity(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!hasActivity(cursor)) return 0;
  }
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (!hasActivity(cursor)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Minutes studied today (local date) */
export function getTodayStudyMinutes() {
  const todayKey = getLocalDateKey();
  const sec = Number(state.activityLog?.[todayKey]?.seconds || 0);
  return Math.round(sec / 60);
}

/** 4-Step Mastery Tracker */
export function updateMastery(talkKey, step, value = true) {
  if (!state.mastery[talkKey]) {
    state.mastery[talkKey] = { test: false, decode: false, dictation: false, shadowing: false };
  }
  state.mastery[talkKey][step] = value;
  saveState();
  notify("mastery:updated", { talkKey, step, value });
}

export function getMasteryScore(talkKey) {
  const m = state.mastery[talkKey] || {};
  let count = 0;
  if (m.test) count++;
  if (m.decode) count++;
  if (m.dictation) count++;
  if (m.shadowing) count++;
  return count;
}

/**
 * Scoped Multi-Test Answer & State Helpers
 * Completely eliminates cross-contamination between tests with overlapping question numbers
 */
export function getQuestionKey(testId, qNum) {
  return `${testId}_${qNum}`;
}

export function getAnswer(testId, qNum) {
  if (!state.answers) return undefined;
  const key = `${testId}_${qNum}`;
  if (state.answers[key] !== undefined) return state.answers[key];
  if (state.activeTest === testId && state.answers[qNum] !== undefined) {
    return state.answers[qNum];
  }
  return undefined;
}

export function setAnswer(testId, qNum, choice) {
  if (!state.answers) state.answers = {};
  const key = `${testId}_${qNum}`;
  state.answers[key] = choice;
  if (state.activeTest === testId) {
    state.answers[qNum] = choice;
  }
}

export function deleteAnswer(testId, qNum) {
  if (!state.answers) return;
  delete state.answers[`${testId}_${qNum}`];
  if (state.activeTest === testId) {
    delete state.answers[qNum];
  }
}

export function getConfidence(testId, qNum) {
  if (!state.confidence) return "sure";
  const key = `${testId}_${qNum}`;
  return state.confidence[key] || (state.activeTest === testId ? state.confidence[qNum] : null) || "sure";
}

export function setConfidence(testId, qNum, conf) {
  if (!state.confidence) state.confidence = {};
  const key = `${testId}_${qNum}`;
  state.confidence[key] = conf;
  if (state.activeTest === testId) {
    state.confidence[qNum] = conf;
  }
}

export function deleteConfidence(testId, qNum) {
  if (!state.confidence) return;
  delete state.confidence[`${testId}_${qNum}`];
  if (state.activeTest === testId) {
    delete state.confidence[qNum];
  }
}

export function getEliminations(testId, qNum) {
  if (!state.eliminations) return [];
  const key = `${testId}_${qNum}`;
  return state.eliminations[key] || (state.activeTest === testId ? state.eliminations[qNum] : null) || [];
}

export function toggleElimination(testId, qNum, choice) {
  if (!state.eliminations) state.eliminations = {};
  const key = `${testId}_${qNum}`;
  if (!state.eliminations[key]) {
    state.eliminations[key] =
      state.activeTest === testId && Array.isArray(state.eliminations[qNum])
        ? [...state.eliminations[qNum]]
        : [];
  }
  const list = state.eliminations[key];
  const idx = list.indexOf(choice);
  if (idx > -1) list.splice(idx, 1);
  else list.push(choice);

  if (state.activeTest === testId) {
    state.eliminations[qNum] = [...list];
  }
}

export function deleteEliminations(testId, qNum) {
  if (!state.eliminations) return;
  delete state.eliminations[`${testId}_${qNum}`];
  if (state.activeTest === testId) {
    delete state.eliminations[qNum];
  }
}

export function getTodayKey() {
  return getLocalDateKey();
}

export function getTargetScore() {
  const n = Number(state.targetScore);
  return Number.isFinite(n) && n >= 300 && n <= 990 ? n : 750;
}

export function setTargetScore(score) {
  const clamped = Math.max(300, Math.min(990, Math.round(Number(score || 750) / 5) * 5));
  state.targetScore = clamped;
  saveState();
  notify("goal:updated", { targetScore: clamped });
  return clamped;
}

export function isDailyTaskDone(taskId, dateKey = getTodayKey()) {
  return Boolean(state.dailyTasksDone?.[dateKey]?.[taskId]);
}

export function setDailyTaskDone(taskId, done = true, dateKey = getTodayKey()) {
  if (!state.dailyTasksDone) state.dailyTasksDone = {};
  if (!state.dailyTasksDone[dateKey]) state.dailyTasksDone[dateKey] = {};
  state.dailyTasksDone[dateKey][taskId] = Boolean(done);
  saveState();
  notify("dailyTask:updated", { taskId, done: Boolean(done), dateKey });
}
