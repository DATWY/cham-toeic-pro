/**
 * Neuro-TOEIC Part 4 Studio Pro — Full CBT Mock Exam Engine
 * Features: Authentic ETS Listening & Reading Scaled Score Estimation (/495 & /990),
 * 8s Intermission Countdown, Per-Part Accuracy Breakdown, Unanswered Summary,
 * Time-per-Question Pacing Telemetry & Answer-Change Analytics
 */

import { state, saveState, notify, getAnswer } from "./store.js";
import { getIcon } from "./uiIcons.js";

const LISTENING_CURVE = [
  [0, 5],
  [7, 5],
  [15, 45],
  [25, 95],
  [35, 145],
  [45, 205],
  [55, 265],
  [65, 325],
  [75, 385],
  [82, 425],
  [88, 455],
  [93, 495],
  [100, 495]
];

const READING_CURVE = [
  [0, 5],
  [10, 5],
  [20, 45],
  [30, 95],
  [40, 150],
  [50, 210],
  [60, 270],
  [70, 330],
  [80, 385],
  [88, 435],
  [94, 470],
  [99, 495],
  [100, 495]
];

export function interpolateETSScaledScore(correct, total, curve) {
  if (!total || total <= 0 || !correct || correct <= 0) return 5;
  const raw100 = Math.max(0, Math.min(100, (correct / total) * 100));
  for (let i = 0; i < curve.length - 1; i++) {
    const [x0, y0] = curve[i];
    const [x1, y1] = curve[i + 1];
    if (raw100 >= x0 && raw100 <= x1) {
      if (x1 === x0) return y1;
      const t = (raw100 - x0) / (x1 - x0);
      const val = y0 + t * (y1 - y0);
      return Math.max(5, Math.min(495, Math.round(val / 5) * 5));
    }
  }
  return 495;
}

export function estimateListeningScaledScore(correct, total) {
  return interpolateETSScaledScore(correct, total, LISTENING_CURVE);
}

export function estimateReadingScaledScore(correct, total) {
  return interpolateETSScaledScore(correct, total, READING_CURVE);
}

export function mapTotalScoreToCEFR(effective990) {
  if (effective990 >= 945) return "C1 (Thành thạo cao cấp · 945–990)";
  if (effective990 >= 785) return "B2 (Độc lập chuyên nghiệp · 785–940)";
  if (effective990 >= 550) return "B1 (Trung cấp ứng dụng · 550–780)";
  if (effective990 >= 225) return "A2 (Sơ cấp giao tiếp · 225–545)";
  return "A1 (Căn bản khởi đầu · 10–220)";
}

function classifyTalkPart(talk, testObj, qNum) {
  const explicitPart = Number(talk.part || testObj?.part || 0);
  const typeStr = String(talk.type || "");
  const isReading = Boolean(talk.isReading || testObj?.isReading || explicitPart >= 5);

  if (explicitPart === 1 || /Part\s*1\b/i.test(typeStr) || (!isReading && qNum >= 1 && qNum <= 6)) {
    return { part: 1, key: "Part 1", label: "Part 1 · Mô tả tranh", section: "Listening" };
  }
  if (explicitPart === 2 || /Part\s*2\b/i.test(typeStr) || (!isReading && qNum >= 7 && qNum <= 31)) {
    return { part: 2, key: "Part 2", label: "Part 2 · Hỏi - Đáp", section: "Listening" };
  }
  if (explicitPart === 3 || /Part\s*3\b/i.test(typeStr) || (!isReading && qNum >= 32 && qNum <= 70)) {
    return { part: 3, key: "Part 3", label: "Part 3 · Hội thoại ngắn", section: "Listening" };
  }
  if (explicitPart === 5 || /Part\s*5\b/i.test(typeStr) || (isReading && qNum >= 101 && qNum <= 130)) {
    return { part: 5, key: "Part 5", label: "Part 5 · Điền câu ngắn", section: "Reading" };
  }
  if (explicitPart === 6 || /Part\s*6\b/i.test(typeStr) || (isReading && qNum >= 131 && qNum <= 146)) {
    return { part: 6, key: "Part 6", label: "Part 6 · Hoàn thành đoạn", section: "Reading" };
  }
  if (explicitPart === 7 || /Part\s*7\b/i.test(typeStr) || isReading || qNum >= 147) {
    return { part: 7, key: "Part 7", label: "Part 7 · Đọc hiểu", section: "Reading" };
  }
  return { part: 4, key: "Part 4", label: "Part 4 · Bài nói ngắn", section: "Listening" };
}

function fmtDurationMMSS(totalSec) {
  const sec = Math.max(0, Math.round(totalSec || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export class ExamSimulator {
  constructor(tests, options = {}) {
    this.tests = tests;
    this.options = options; // { onFinish: fn, onTalkChange: fn, onCountdownTick: fn }

    this.isActive = false;
    this.examScope = "ets2019_t6";
    this.examTalks = [];
    this.currentTalkIndex = 0;
    this.intermissionTimer = null;
    this.intermissionRemaining = 0;
    this.telemetryLogs = []; // { testId, qNum, from, to, correct, changeType, timestamp }

    this.examStartTime = 0;
    this.talkEnteredAt = 0;
    this.talkDwellMs = {}; // { [talkUniqueKey]: ms }
  }

  getAllRegisteredTests() {
    const base = Array.isArray(this.tests) && this.tests.length ? this.tests : (window.TOEIC_TESTS || []);
    const extra = Array.isArray(window.TOEIC_PART56_TESTS) ? window.TOEIC_PART56_TESTS : [];
    const seen = new Set();
    const merged = [];
    [...base, ...extra].forEach((t) => {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
    });
    return merged;
  }

  getTalkUniqueKey(talk) {
    if (!talk) return "";
    return `${talk.testId || state.activeTest}_${talk.range || talk.talkIndex || 0}`;
  }

  flushCurrentTalkDwell() {
    if (!this.talkEnteredAt) return;
    const now = Date.now();
    const curTalk = this.getCurrentTalk();
    if (curTalk) {
      const key = this.getTalkUniqueKey(curTalk);
      this.talkDwellMs[key] = (this.talkDwellMs[key] || 0) + Math.max(0, now - this.talkEnteredAt);
    }
    this.talkEnteredAt = now;
  }

  startExam(testScope = "ets2019_t6") {
    this.isActive = true;
    this.examScope = testScope;
    this.telemetryLogs = [];
    this.currentTalkIndex = 0;
    this.examStartTime = Date.now();
    this.talkEnteredAt = this.examStartTime;
    this.talkDwellMs = {};

    if (this.intermissionTimer) {
      clearInterval(this.intermissionTimer);
      this.intermissionTimer = null;
    }

    const allTests = this.getAllRegisteredTests();
    const coreTests = Array.isArray(this.tests) && this.tests.length ? this.tests : allTests;

    if (testScope === "all") {
      // Preserve 6 core tests (151 questions) if default scope 'all' is selected
      const scopeTests = coreTests.filter((t) => !t.isExtraPack);
      this.examTalks = scopeTests.flatMap((t) =>
        (t.talks || []).map((talk, idx) => ({
          ...talk,
          testId: t.id,
          testPart: t.part,
          isReading: Boolean(talk.isReading || t.isReading || t.part >= 5),
          talkIndex: idx
        }))
      );
    } else if (testScope === "all_full" || testScope === "full_200") {
      this.examTalks = allTests.flatMap((t) =>
        (t.talks || []).map((talk, idx) => ({
          ...talk,
          testId: t.id,
          testPart: t.part,
          isReading: Boolean(talk.isReading || t.isReading || t.part >= 5),
          talkIndex: idx
        }))
      );
    } else {
      const selectedTest = allTests.find((t) => t.id === testScope) || coreTests[0];
      this.examTalks = ((selectedTest && selectedTest.talks) || []).map((talk, idx) => ({
        ...talk,
        testId: selectedTest.id,
        testPart: selectedTest.part,
        isReading: Boolean(talk.isReading || selectedTest.isReading || selectedTest.part >= 5),
        talkIndex: idx
      }));
    }

    state.mode = "exam";
    saveState();
    notify("exam:started", { totalTalks: this.examTalks.length, scope: testScope });
  }

  getCurrentTalk() {
    return this.examTalks[this.currentTalkIndex] || null;
  }

  recordAnswerChange(testIdOrQNum, qNumOrFrom, fromOrTo, toOrCorrect, maybeCorrect) {
    if (!this.isActive) return;
    let testId = state.activeTest;
    let qNum = testIdOrQNum;
    let fromChoice = qNumOrFrom;
    let toChoice = fromOrTo;
    let correctChoice = toOrCorrect;

    // Handle 5-parameter call with explicit testId
    if (maybeCorrect !== undefined) {
      testId = testIdOrQNum;
      qNum = qNumOrFrom;
      fromChoice = fromOrTo;
      toChoice = toOrCorrect;
      correctChoice = maybeCorrect;
    }

    const wasCorrect = fromChoice === correctChoice;
    const isNowCorrect = toChoice === correctChoice;

    let changeType = "neutral";
    if (!wasCorrect && isNowCorrect) changeType = "gain"; // Sai -> Đúng (+1)
    else if (wasCorrect && !isNowCorrect) changeType = "loss"; // Đúng -> Sai (-1)

    this.telemetryLogs.push({
      testId,
      qNum,
      from: fromChoice,
      to: toChoice,
      correct: correctChoice,
      changeType,
      timestamp: Date.now()
    });

    state.answerChanges = this.telemetryLogs;
    saveState();
  }

  advanceToNextTalk(onCountdownTick) {
    if (this.currentTalkIndex < this.examTalks.length - 1) {
      if (this.intermissionTimer) {
        clearInterval(this.intermissionTimer);
        this.intermissionTimer = null;
      }
      this.intermissionRemaining = 8; // 8 seconds standard TOEIC intermission
      const tick = onCountdownTick || this.options.onCountdownTick;
      if (tick) tick(this.intermissionRemaining);

      this.intermissionTimer = setInterval(() => {
        this.intermissionRemaining--;
        if (tick) tick(this.intermissionRemaining);

        if (this.intermissionRemaining <= 0) {
          clearInterval(this.intermissionTimer);
          this.intermissionTimer = null;
          this.flushCurrentTalkDwell();
          this.currentTalkIndex++;
          this.talkEnteredAt = Date.now();
          if (this.options.onTalkChange) {
            this.options.onTalkChange(this.getCurrentTalk(), this.currentTalkIndex);
          }
        }
      }, 1000);
    } else {
      this.finishExam();
    }
  }

  skipIntermission() {
    if (this.intermissionTimer) {
      clearInterval(this.intermissionTimer);
      this.intermissionTimer = null;
      this.intermissionRemaining = 0;
      this.flushCurrentTalkDwell();
      this.currentTalkIndex++;
      this.talkEnteredAt = Date.now();
      if (this.options.onTalkChange) {
        this.options.onTalkChange(this.getCurrentTalk(), this.currentTalkIndex);
      }
    }
  }

  /** Direct navigation between items in Reading (or self-paced) CBT exam mode */
  goToTalk(targetIdx) {
    if (!this.isActive || targetIdx < 0 || targetIdx >= this.examTalks.length) return;
    if (this.intermissionTimer) {
      clearInterval(this.intermissionTimer);
      this.intermissionTimer = null;
      this.intermissionRemaining = 0;
    }
    this.flushCurrentTalkDwell();
    this.currentTalkIndex = targetIdx;
    this.talkEnteredAt = Date.now();
    if (this.options.onTalkChange) {
      this.options.onTalkChange(this.getCurrentTalk(), this.currentTalkIndex);
    }
  }

  finishExam() {
    this.flushCurrentTalkDwell();
    this.isActive = false;
    if (this.intermissionTimer) {
      clearInterval(this.intermissionTimer);
      this.intermissionTimer = null;
    }
    state.mode = "study";
    saveState();

    const report = this.generateTelemetryReport();
    if (this.options.onFinish) {
      this.options.onFinish(report);
    }
    if (typeof document !== "undefined") {
      queueMicrotask(() => this.enhanceExamReportDialog(report));
    }
    notify("exam:finished", report);
  }

  generateTelemetryReport() {
    let gains = 0;
    let losses = 0;
    let neutral = 0;

    this.telemetryLogs.forEach((log) => {
      if (log.changeType === "gain") gains++;
      else if (log.changeType === "loss") losses++;
      else neutral++;
    });

    const allTests = this.getAllRegisteredTests();
    const testMap = new Map(allTests.map((t) => [t.id, t]));
    const isSingleTestScope = this.examScope !== "all" && this.examScope !== "all_full" && this.examScope !== "full_200";

    let totalExamQuestions = 0;
    let totalExamCorrect = 0;
    let answeredCount = 0;
    const unansweredNums = [];

    let listeningTotal = 0;
    let listeningAnswered = 0;
    let listeningCorrect = 0;

    let readingTotal = 0;
    let readingAnswered = 0;
    let readingCorrect = 0;

    const partBuckets = new Map();

    this.examTalks.forEach((talk) => {
      const testObj = testMap.get(talk.testId);
      const talkKey = this.getTalkUniqueKey(talk);
      const dwellMs = this.talkDwellMs[talkKey] || 0;
      const questions = talk.questions || [];
      const perQuestionMs = questions.length > 0 ? dwellMs / questions.length : 0;

      questions.forEach((q) => {
        totalExamQuestions++;
        const scopedAns = getAnswer(talk.testId, q.num);
        const fallbackAns =
          scopedAns !== undefined
            ? scopedAns
            : (isSingleTestScope || talk.testId === state.activeTest ? state.answers?.[q.num] : undefined);

        const isAnswered = Boolean(fallbackAns);
        const isCorrect = isAnswered && fallbackAns === q.answer;

        if (isAnswered) {
          answeredCount++;
          if (isCorrect) totalExamCorrect++;
        } else {
          unansweredNums.push(q.num);
        }

        const pInfo = classifyTalkPart(talk, testObj, q.num);
        if (pInfo.section === "Reading") {
          readingTotal++;
          if (isAnswered) readingAnswered++;
          if (isCorrect) readingCorrect++;
        } else {
          listeningTotal++;
          if (isAnswered) listeningAnswered++;
          if (isCorrect) listeningCorrect++;
        }

        if (!partBuckets.has(pInfo.part)) {
          partBuckets.set(pInfo.part, {
            part: pInfo.part,
            key: pInfo.key,
            label: pInfo.label,
            section: pInfo.section,
            total: 0,
            answered: 0,
            unanswered: 0,
            correct: 0,
            dwellMs: 0
          });
        }
        const bucket = partBuckets.get(pInfo.part);
        bucket.total++;
        if (isAnswered) bucket.answered++;
        else bucket.unanswered++;
        if (isCorrect) bucket.correct++;
        bucket.dwellMs += perQuestionMs;
      });
    });

    const unansweredCount = Math.max(0, totalExamQuestions - answeredCount);
    const scorePct = totalExamQuestions ? Math.round((totalExamCorrect / totalExamQuestions) * 100) : 0;
    const accuracyOnAnsweredPct = answeredCount ? Math.round((totalExamCorrect / answeredCount) * 100) : 0;

    // Elapsed time & time-per-question telemetry
    const rawElapsedSec = this.examStartTime
      ? Math.max(1, Math.round((Date.now() - this.examStartTime) / 1000))
      : 1;
    const avgTimePerQuestion = +(rawElapsedSec / Math.max(1, answeredCount || totalExamQuestions)).toFixed(1);
    const avgTimePerTotalQuestion = +(rawElapsedSec / Math.max(1, totalExamQuestions)).toFixed(1);

    // Authentic ETS Listening & Reading Scaled Score Estimation (5–495 each, 10–990 total)
    const hasListening = listeningTotal > 0;
    const hasReading = readingTotal > 0;
    const listeningScaled = hasListening ? estimateListeningScaledScore(listeningCorrect, listeningTotal) : null;
    const readingScaled = hasReading ? estimateReadingScaledScore(readingCorrect, readingTotal) : null;

    let scaledScore = 5; // Section /495 score
    let totalScaled990 = 10;

    if (hasListening && hasReading) {
      totalScaled990 = listeningScaled + readingScaled;
      const weighted =
        (listeningScaled * listeningTotal + readingScaled * readingTotal) /
        Math.max(1, listeningTotal + readingTotal);
      scaledScore = Math.max(5, Math.min(495, Math.round(weighted / 5) * 5));
    } else if (hasReading) {
      scaledScore = readingScaled;
      totalScaled990 = readingScaled + estimateListeningScaledScore(readingCorrect, readingTotal);
    } else if (hasListening) {
      scaledScore = listeningScaled;
      totalScaled990 = listeningScaled + estimateReadingScaledScore(listeningCorrect, listeningTotal);
    }

    const cefrLevel = mapTotalScoreToCEFR(totalScaled990);

    // Finalize ordered per-part breakdown (both Object `byPart` and Array `partBreakdown`)
    const sortedParts = Array.from(partBuckets.values())
      .sort((a, b) => a.part - b.part)
      .map((b) => {
        const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
        const accuracyPct = b.answered > 0 ? Math.round((b.correct / b.answered) * 100) : 0;
        const avgSec =
          b.dwellMs > 0
            ? +(b.dwellMs / 1000 / Math.max(1, b.total)).toFixed(1)
            : avgTimePerTotalQuestion;
        return {
          part: b.part,
          key: b.key,
          label: b.label,
          section: b.section,
          correct: b.correct,
          answered: b.answered,
          unanswered: b.unanswered,
          total: b.total,
          pct,
          accuracyPct,
          avgTimePerQuestion: avgSec
        };
      });

    const byPart = {};
    sortedParts.forEach((item) => {
      byPart[item.label] = item;
    });

    return {
      totalChanges: this.telemetryLogs.length,
      gains,
      losses,
      neutral,
      netScoreDelta: gains - losses,
      totalExamQuestions,
      totalExamCorrect,
      answeredCount,
      answeredQuestions: answeredCount,
      unansweredCount,
      unansweredQuestions: unansweredCount,
      unansweredNums,
      scorePct,
      accuracyOnAnsweredPct,
      scaledScore,
      listeningScaled,
      readingScaled,
      totalScaled990,
      hasListening,
      hasReading,
      listeningCorrect,
      listeningTotal,
      readingCorrect,
      readingTotal,
      cefrLevel,
      elapsedSeconds: rawElapsedSec,
      elapsedFormatted: fmtDurationMMSS(rawElapsedSec),
      avgTimePerQuestion,
      avgTimePerTotalQuestion,
      avgTimeFormatted: `${avgTimePerQuestion}s/câu`,
      byPart,
      partBreakdown: sortedParts,
      logs: this.telemetryLogs
    };
  }

  /**
   * Renders rich commercial-grade CBT Telemetry HTML (Per-Part Accuracy,
   * Listening/Reading Scaled Breakdown, Unanswered Summary & Time-per-Question).
   */
  renderExamReportDetailsHTML(report) {
    if (!report) return "";
    const parts = Array.isArray(report.partBreakdown)
      ? report.partBreakdown
      : Object.values(report.byPart || {});

    const unansweredBadgeTone = report.unansweredCount > 0 ? "var(--warn)" : "var(--ok)";
    const unansweredSoftBg = report.unansweredCount > 0 ? "var(--warn-soft)" : "var(--ok-soft)";
    const skippedPreview =
      report.unansweredNums && report.unansweredNums.length
        ? `Câu bỏ trống: ${report.unansweredNums.slice(0, 10).map((n) => `Q${n}`).join(", ")}${
            report.unansweredNums.length > 10 ? ` (+${report.unansweredNums.length - 10} câu)` : ""
          }`
        : "Tuyệt vời! Bạn đã điền đầy đủ 100% số câu trong bài thi.";

    return `
      <div class="cbt-telemetry-breakdown" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(195px, 1fr)); gap: 12px;">
          <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px;">
            <div style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Tốc độ xử lý TB</div>
            <div class="tabular-nums" style="font-size: 1.45rem; font-weight: 800; color: var(--text); margin-top: 3px;">
              ${report.avgTimePerQuestion}s<span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">/câu</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Tổng thời gian: <strong>${report.elapsedFormatted}</strong></div>
          </div>

          <div style="background: ${unansweredSoftBg}; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px;">
            <div style="font-size: 0.74rem; text-transform: uppercase; color: ${unansweredBadgeTone}; font-weight: 800;">Câu chưa trả lời</div>
            <div class="tabular-nums" style="font-size: 1.45rem; font-weight: 800; color: ${unansweredBadgeTone}; margin-top: 3px;">
              ${report.unansweredCount}<span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">/${report.totalExamQuestions} câu</span>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">Đã hoàn thành: <strong>${report.answeredCount}/${report.totalExamQuestions}</strong></div>
          </div>

          <div style="background: var(--accent-soft); border: 1px solid var(--accent-border); border-radius: var(--radius-md); padding: 12px 14px;">
            <div style="font-size: 0.74rem; text-transform: uppercase; color: var(--accent); font-weight: 800;">Dự phóng Tổng TOEIC</div>
            <div class="tabular-nums" style="font-size: 1.45rem; font-weight: 800; color: var(--accent); margin-top: 3px;">
              ${report.totalScaled990}<span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">/990</span>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              ${report.hasListening ? `Nghe: <strong>${report.listeningScaled}/495</strong>` : ""}
              ${report.hasListening && report.hasReading ? " · " : ""}
              ${report.hasReading ? `Đọc: <strong>${report.readingScaled}/495</strong>` : ""}
            </div>
          </div>
        </div>

        <div style="font-size: 0.8rem; padding: 8px 12px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--border); color: var(--text-muted); display: flex; align-items: center; gap: 7px;">
          ${getIcon("clipboardList", 14)} <span>${skippedPreview}</span>
        </div>

        ${parts.length > 0 ? `
          <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; flex-wrap: wrap;">
              <h4 style="margin: 0; font-size: 0.84rem; text-transform: uppercase; color: var(--accent); letter-spacing: 0.03em;">Độ chính xác chi tiết theo từng Part</h4>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Chuẩn điểm quy đổi ETS</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${parts.map((p) => {
                const barColor = p.pct >= 80 ? "var(--ok)" : p.pct >= 55 ? "var(--accent)" : "var(--bad)";
                return `
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.83rem; gap: 8px; flex-wrap: wrap;">
                      <span style="font-weight: 700; color: var(--text);">${p.label}</span>
                      <span class="tabular-nums" style="font-family: var(--font-sans); font-size: 0.8rem; color: var(--text-muted);">
                        Đúng <strong style="color: ${barColor};">${p.correct}/${p.total}</strong> (${p.pct}%)${p.unanswered > 0 ? ` · Bỏ trống ${p.unanswered}` : ""} · ~${p.avgTimePerQuestion}s/câu
                      </span>
                    </div>
                    <div style="width: 100%; height: 7px; border-radius: 999px; background: var(--surface-3); overflow: hidden;">
                      <div style="width: ${p.pct}%; height: 100%; background: ${barColor}; border-radius: 999px;"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  /**
   * Automatically enriches #exam-report-dialog if main.js rendered the legacy 3-card view,
   * while cleanly skipping duplicate blocks if ui-shell already surfaced byPart & unansweredCount.
   */
  enhanceExamReportDialog(report) {
    const dlg = document.getElementById("exam-report-dialog");
    if (!dlg) return;

    const box = dlg.querySelector(".dialog-box");
    if (box) {
      box.style.maxHeight = "88vh";
      box.style.overflowY = "auto";
    }

    // Avoid duplicating if main.js already rendered per-part / unanswered telemetry
    if (dlg.querySelector(".cbt-telemetry-breakdown")) return;
    const existingText = dlg.textContent || "";
    if (existingText.includes("Câu chưa trả lời") || existingText.includes("Bỏ trống") || existingText.includes("s/câu")) {
      return;
    }

    const actions = dlg.querySelector(".dialog-actions");
    if (actions && actions.parentElement) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = this.renderExamReportDetailsHTML(report);
      if (wrapper.firstElementChild) {
        actions.parentElement.insertBefore(wrapper.firstElementChild, actions);
      }
    }
  }

  exitEarly() {
    this.flushCurrentTalkDwell();
    this.isActive = false;
    if (this.intermissionTimer) {
      clearInterval(this.intermissionTimer);
      this.intermissionTimer = null;
    }
    state.mode = "practice";
    saveState();
  }
}
