/**
 * Neuro-TOEIC Part 4 Studio Pro — Commercial Analytics & Skill Matrix Engine
 * Features: ETS /990 Target Score Estimator (Listening + Reading), Per-Part & Question-Type
 * Accuracy Matrix, Confidence Calibration (Sure / Doubt / Guess), Smart Weakness Diagnosis,
 * 30-Day Deliberate Practice Heatmap & Smart Mix Drills Generator
 */

import { state, getAnswer, getConfidence } from "./store.js";
import { getIcon } from "./uiIcons.js";
import {
  estimateListeningScaledScore,
  estimateReadingScaledScore,
  mapTotalScoreToCEFR
} from "./examSimulator.js";

function detectQuestionPart(talk, testObj, qNum) {
  const explicitPart = Number(talk.part || testObj?.part || 0);
  const typeStr = String(talk.type || "");
  const isReading = Boolean(talk.isReading || testObj?.isReading || explicitPart >= 5);

  if (explicitPart === 1 || /Part\s*1\b/i.test(typeStr) || (!isReading && qNum >= 1 && qNum <= 6)) {
    return { part: 1, key: "Part 1", label: "Part 1 · Photographs", section: "Listening" };
  }
  if (explicitPart === 2 || /Part\s*2\b/i.test(typeStr) || (!isReading && qNum >= 7 && qNum <= 31)) {
    return { part: 2, key: "Part 2", label: "Part 2 · Hỏi - Đáp", section: "Listening" };
  }
  if (explicitPart === 3 || /Part\s*3\b/i.test(typeStr) || (!isReading && qNum >= 32 && qNum <= 70)) {
    return { part: 3, key: "Part 3", label: "Part 3 · Hội thoại", section: "Listening" };
  }
  if (explicitPart === 5 || /Part\s*5\b/i.test(typeStr) || (isReading && qNum >= 101 && qNum <= 130)) {
    return { part: 5, key: "Part 5", label: "Part 5 · Ngữ pháp & Từ loại", section: "Reading" };
  }
  if (explicitPart === 6 || /Part\s*6\b/i.test(typeStr) || (isReading && qNum >= 131 && qNum <= 146)) {
    return { part: 6, key: "Part 6", label: "Part 6 · Điền đoạn văn", section: "Reading" };
  }
  if (explicitPart === 7 || /Part\s*7\b/i.test(typeStr) || isReading || qNum >= 147) {
    return { part: 7, key: "Part 7", label: "Part 7 · Đọc hiểu", section: "Reading" };
  }
  return { part: 4, key: "Part 4", label: "Part 4 · Bài nói ngắn", section: "Listening" };
}

function detectQuestionType(q, talk, partNum) {
  const qt = String(q.questionType || "").toLowerCase();
  if (partNum === 5 || (partNum === 6 && qt !== "sentence_insertion") || qt === "grammar" || qt === "word_family" || qt === "collocation") {
    if (qt === "sentence_insertion") return "Cross-Doc / Chèn câu";
    if (partNum === 5 || qt === "grammar" || qt === "word_family" || qt === "collocation") {
      return "Grammar & Vocabulary";
    }
  }
  if (qt === "main_idea") return "Main Topic";
  if (qt === "inference" || qt === "vocab_in_context" || qt === "intent") return "Inference / Meaning";
  if (qt === "sentence_insertion" || qt === "cross_doc") return "Cross-Doc / Chèn câu";
  if (qt === "graphic") return "Graphic Integration";
  if (qt === "detail" || qt === "negative_fact") return "Specific Detail";

  const qText = String(q.question || "").toLowerCase();
  if (qText.includes("look at the graphic") || (q.num >= 95 && q.num <= 100 && talk.image)) {
    return "Graphic Integration";
  }
  if (
    qText.includes("mainly") ||
    qText.includes("purpose") ||
    qText.includes("who most likely") ||
    qText.includes("where most likely") ||
    qText.includes("what type of business")
  ) {
    return "Main Topic";
  }
  if (
    qText.includes("mean") ||
    qText.includes("why does the speaker say") ||
    qText.includes("why does the writer") ||
    qText.includes("implied") ||
    qText.includes("suggested") ||
    qText.includes("closest in meaning") ||
    qText.includes("most likely")
  ) {
    return "Inference / Meaning";
  }
  if (qText.includes("in which of the positions") || qText.includes("[1]")) {
    return "Cross-Doc / Chèn câu";
  }
  return "Specific Detail";
}

export class AnalyticsEngine {
  constructor(tests) {
    this.tests = tests;
  }

  getAllTests() {
    const base = Array.isArray(this.tests) && this.tests.length ? this.tests : (window.TOEIC_TESTS || []);
    const extra = Array.isArray(window.TOEIC_PART56_TESTS) ? window.TOEIC_PART56_TESTS : [];
    const seen = new Set();
    const list = [];
    [...base, ...extra].forEach((t) => {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        list.push(t);
      }
    });
    return list;
  }

  calculateStats() {
    const allTests = this.getAllTests();

    let totalQuestions = 0;
    let totalAnswered = 0;
    let totalCorrect = 0;
    let luckyGuesses = 0;
    let overconfidentWrong = 0;

    let listeningTotal = 0;
    let listeningAnswered = 0;
    let listeningCorrect = 0;

    let readingTotal = 0;
    let readingAnswered = 0;
    let readingCorrect = 0;

    const byType = {
      "Main Topic": { label: "Ý chính & Mục đích (Main Idea)", correct: 0, answered: 0, total: 0 },
      "Specific Detail": { label: "Chi tiết cụ thể (Specific Detail)", correct: 0, answered: 0, total: 0 },
      "Inference / Meaning": { label: "Suy luận & Ngụ ý (Inference)", correct: 0, answered: 0, total: 0 },
      "Graphic Integration": { label: "Tích hợp Biểu đồ (Graphic)", correct: 0, answered: 0, total: 0 },
      "Cross-Doc / Chèn câu": { label: "Đa văn bản & Điền câu [1]-[4]", correct: 0, answered: 0, total: 0 }
    };

    const byContext = {
      "Cuộc họp": { correct: 0, answered: 0, total: 0 },
      "Tin nhắn thoại": { correct: 0, answered: 0, total: 0 },
      "Bản tin / Radio": { correct: 0, answered: 0, total: 0 },
      "Thông báo / Tham quan": { correct: 0, answered: 0, total: 0 },
      "Đọc hiểu (Part 7)": { correct: 0, answered: 0, total: 0 }
    };

    const partMap = new Map();

    const byConfidence = {
      sure: { key: "sure", label: "Chắc chắn", answered: 0, correct: 0, wrong: 0, accuracyPct: 0 },
      doubt: { key: "doubt", label: "Phân vân 50/50", answered: 0, correct: 0, wrong: 0, accuracyPct: 0 },
      guess: { key: "guess", label: "Đoán mò", answered: 0, correct: 0, wrong: 0, accuracyPct: 0 }
    };

    allTests.forEach((t) => {
      (t.talks || []).forEach((talk) => {
        const typeText = String(talk.type || "");
        let contextKey = "Thông báo / Tham quan";
        if (talk.isReading || t.isReading || (t.part && t.part >= 5)) contextKey = "Đọc hiểu (Part 7)";
        else if (typeText.includes("cuộc họp") || typeText.includes("meeting")) contextKey = "Cuộc họp";
        else if (typeText.includes("thoại") || typeText.includes("Telephone")) contextKey = "Tin nhắn thoại";
        else if (typeText.includes("tin") || typeText.includes("Broadcast") || typeText.includes("News")) contextKey = "Bản tin / Radio";

        (talk.questions || []).forEach((q) => {
          totalQuestions++;
          const userAns = getAnswer(t.id, q.num);
          const isAnswered = Boolean(userAns);
          const isCorrect = isAnswered && userAns === q.answer;
          const rawConf = getConfidence(t.id, q.num);
          const conf = byConfidence[rawConf] ? rawConf : "sure";

          const pInfo = detectQuestionPart(talk, t, q.num);
          if (!partMap.has(pInfo.part)) {
            partMap.set(pInfo.part, {
              part: pInfo.part,
              key: pInfo.key,
              label: pInfo.label,
              section: pInfo.section,
              correct: 0,
              answered: 0,
              total: 0,
              accuracyPct: 0,
              coveragePct: 0
            });
          }
          const partBucket = partMap.get(pInfo.part);
          partBucket.total++;

          if (pInfo.section === "Reading") {
            readingTotal++;
          } else {
            listeningTotal++;
          }

          const typeKey = detectQuestionType(q, talk, pInfo.part);
          if (!byType[typeKey]) {
            byType[typeKey] = {
              label: typeKey === "Grammar & Vocabulary" ? "Ngữ pháp & Từ loại (Part 5-6)" : typeKey,
              correct: 0,
              answered: 0,
              total: 0
            };
          }
          byType[typeKey].total++;
          byContext[contextKey].total++;

          if (isAnswered) {
            totalAnswered++;
            partBucket.answered++;
            byType[typeKey].answered++;
            byContext[contextKey].answered++;

            if (pInfo.section === "Reading") readingAnswered++;
            else listeningAnswered++;

            const confBucket = byConfidence[conf];
            confBucket.answered++;

            if (isCorrect) {
              totalCorrect++;
              partBucket.correct++;
              byType[typeKey].correct++;
              byContext[contextKey].correct++;
              confBucket.correct++;

              if (pInfo.section === "Reading") readingCorrect++;
              else listeningCorrect++;

              if (conf === "guess") luckyGuesses++;
            } else {
              confBucket.wrong++;
              if (conf === "sure") overconfidentWrong++;
            }
          }
        });
      });
    });

    Object.values(byConfidence).forEach((c) => {
      c.accuracyPct = c.answered > 0 ? Math.round((c.correct / c.answered) * 100) : 0;
    });

    const orderedParts = Array.from(partMap.values())
      .sort((a, b) => a.part - b.part)
      .map((p) => {
        p.accuracyPct = p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 0;
        p.coveragePct = p.total > 0 ? Math.round((p.answered / p.total) * 100) : 0;
        return p;
      });

    const byPart = {};
    orderedParts.forEach((p) => {
      byPart[p.label] = p;
    });

    Object.values(byType).forEach((item) => {
      item.accuracyPct = item.answered > 0 ? Math.round((item.correct / item.answered) * 100) : 0;
      item.masteryPct = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    });

    const accuracyPct = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const listeningAccuracyPct = listeningAnswered ? Math.round((listeningCorrect / listeningAnswered) * 100) : 0;
    const readingAccuracyPct = readingAnswered ? Math.round((readingCorrect / readingAnswered) * 100) : 0;

    // Target Score Estimator (/495 Listening + /495 Reading = /990 Total Projection)
    let projectedListening = 5;
    let projectedReading = 5;
    let listeningEstimatedFromTwin = false;
    let readingEstimatedFromTwin = false;

    if (listeningAnswered > 0 && readingAnswered > 0) {
      projectedListening = estimateListeningScaledScore(listeningCorrect, listeningAnswered);
      projectedReading = estimateReadingScaledScore(readingCorrect, readingAnswered);
    } else if (listeningAnswered > 0) {
      projectedListening = estimateListeningScaledScore(listeningCorrect, listeningAnswered);
      projectedReading = estimateReadingScaledScore(listeningCorrect, listeningAnswered);
      readingEstimatedFromTwin = true;
    } else if (readingAnswered > 0) {
      projectedReading = estimateReadingScaledScore(readingCorrect, readingAnswered);
      projectedListening = estimateListeningScaledScore(readingCorrect, readingAnswered);
      listeningEstimatedFromTwin = true;
    }

    const projectedTotal990 = totalAnswered > 0 ? projectedListening + projectedReading : 10;
    const projectedCEFR = totalAnswered > 0 ? mapTotalScoreToCEFR(projectedTotal990) : "Chưa đủ dữ liệu định vị CEFR";
    const gapTo900 = Math.max(0, 900 - projectedTotal990);

    // 30-day study time summary
    let totalStudySeconds30d = 0;
    let activeDays30d = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sec = state.activityLog?.[key]?.seconds || 0;
      if (sec > 0) {
        totalStudySeconds30d += sec;
        activeDays30d++;
      }
    }

    const diagnosis = this.buildSmartDiagnosis({
      totalQuestions,
      totalAnswered,
      accuracyPct,
      luckyGuesses,
      overconfidentWrong,
      byType,
      orderedParts,
      byConfidence,
      projectedTotal990,
      gapTo900
    });

    return {
      totalQuestions,
      totalAnswered,
      unansweredQuestions: Math.max(0, totalQuestions - totalAnswered),
      totalCorrect,
      luckyGuesses,
      overconfidentWrong,
      accuracyPct,
      listening: {
        total: listeningTotal,
        answered: listeningAnswered,
        correct: listeningCorrect,
        accuracyPct: listeningAccuracyPct,
        scaled495: projectedListening,
        isEstimated: listeningEstimatedFromTwin
      },
      reading: {
        total: readingTotal,
        answered: readingAnswered,
        correct: readingCorrect,
        accuracyPct: readingAccuracyPct,
        scaled495: projectedReading,
        isEstimated: readingEstimatedFromTwin
      },
      projectedTotal990,
      projectedCEFR,
      gapTo900,
      totalStudyMinutes30d: Math.round(totalStudySeconds30d / 60),
      activeDays30d,
      byPart,
      orderedParts,
      byType,
      byContext,
      byConfidence,
      diagnosis
    };
  }

  buildSmartDiagnosis(ctx) {
    const items = [];
    if (ctx.totalAnswered === 0) {
      items.push({
        tone: "info",
        title: "Bắt đầu bài kiểm tra chẩn đoán năng lực đầu tiên",
        detail: "Hoàn thành ít nhất 1 bài Nghe (Part 1/2/4) và 1 bài Đọc (Part 7) kèm gắn thẻ Độ tự tin để AI định vị chính xác điểm TOEIC /990 và lỗ hổng kỹ năng."
      });
      return items;
    }

    // 1. Weakest attempted Question Type
    const attemptedTypes = Object.entries(ctx.byType)
      .filter(([, v]) => v.answered >= 1)
      .sort((a, b) => a[1].accuracyPct - b[1].accuracyPct);

    if (attemptedTypes.length > 0) {
      const [weakKey, weakVal] = attemptedTypes[0];
      if (weakVal.accuracyPct < 75) {
        const prescriptionMap = {
          "Inference / Meaning": "Luyện kỹ năng bắt từ đồng nghĩa (Paraphrasing) và đọc ngữ cảnh câu trước/sau thay vì bắt từ khóa đơn lẻ.",
          "Graphic Integration": "Dùng 5s trước khi nghe đối chiếu tiêu đề cột/hàng trên biểu đồ với đáp án để không lỡ thông tin chéo.",
          "Cross-Doc / Chèn câu": "Đọc kỹ đại từ chỉ định (this, these, such, however) ở câu cần chèn và khớp thông tin giữa 2–3 văn bản.",
          "Main Topic": "Tập trung cao độ vào 2 câu mở đầu của bài nói hoặc tiêu đề/đoạn đầu email.",
          "Grammar & Vocabulary": "Rút ngắn phản xạ nhận diện từ loại (N/V/Adj/Adv) xuống dưới 15 giây/câu.",
          "Specific Detail": "Gạch chân từ khóa Who/When/Where trước khi nghe hoặc đọc quét (Scanning) để tránh bẫy thông tin nhiễu."
        };
        items.push({
          tone: "bad",
          title: `Điểm yếu ưu tiên #1: ${weakVal.label || weakKey} (Đúng ${weakVal.correct}/${weakVal.answered} · ${weakVal.accuracyPct}%)`,
          detail: prescriptionMap[weakKey] || "Mở tab Phân tích & Bẫy sau mỗi bài để đối chiếu từ khóa gây nhiễu của ETS."
        });
      }
    }

    // 2. Weakest attempted Part
    const attemptedParts = (ctx.orderedParts || [])
      .filter((p) => p.answered >= 1)
      .sort((a, b) => a.accuracyPct - b.accuracyPct);

    if (attemptedParts.length > 0 && attemptedParts[0].accuracyPct < 80) {
      const wp = attemptedParts[0];
      items.push({
        tone: "warn",
        title: `Khu vực cần gia cố: ${wp.label} (${wp.accuracyPct}% chính xác · đã làm ${wp.answered}/${wp.total} câu)`,
        detail: wp.section === "Reading"
          ? "Áp dụng chiến thuật Đọc câu hỏi trước + Soi chứng cứ (Evidence Highlight) để tăng tốc độ định vị thông tin chuẩn xác."
          : "Kết hợp Chép chính tả (Dictation) và Luyện Shadowing ở tốc độ 1.15x để xóa mù nối âm & nuốt âm."
      });
    }

    // 3. Overconfident Wrong (Blind-spot traps)
    if (ctx.overconfidentWrong > 0) {
      items.push({
        tone: "bad",
        title: `Cảnh báo bẫy ETS: ${ctx.overconfidentWrong} câu chọn "Chắc chắn" nhưng SAI`,
        detail: "Đây là vùng mù nguy hiểm nhất trong phòng thi thật (dính bẫy lặp âm hoặc bẫy thông tin nửa vời). Hãy bấm 'Câu sai & Đoán bừa' ở cột trái để mổ xẻ ngay!"
      });
    } else if (ctx.luckyGuesses > 0) {
      items.push({
        tone: "warn",
        title: `Kiến thức chưa vững: ${ctx.luckyGuesses} câu "Đoán mò" nhưng ăn may đúng`,
        detail: "Điểm số hiện tại có phần may mắn. Hãy ôn lại các câu gắn nhãn Đoán đúng và ghim cụm từ khóa vào Flashcard SM-2."
      });
    }

    if (items.length === 0) {
      items.push({
        tone: "ok",
        title: `Phong độ xuất sắc (${ctx.accuracyPct}% chính xác · Dự phóng ${ctx.projectedTotal990}/990)`,
        detail: ctx.gapTo900 > 0
          ? `Chỉ còn cách mốc 900+ khoảng ${ctx.gapTo900} điểm! Hãy duy trì thi thử CBT liên hoàn và đẩy tốc độ nghe lên 1.15x–1.25x.`
          : "Bạn đang đạt ngưỡng C1 (900+ TOEIC)! Hãy hoàn thành trọn vẹn các bộ đề còn lại dưới áp lực phòng thi CBT."
      });
    }

    return items;
  }

  /**
   * Render Pure Responsive SVG Horizontal Bar Chart for Question-Type Skill Matrix
   */
  renderSkillMatrixSVG(stats = this.calculateStats()) {
    const types = Object.entries(stats.byType || {});
    const rowH = 38;
    const svgH = types.length * rowH + 10;

    const rows = types.map(([key, data], idx) => {
      const answered = data.answered ?? 0;
      const pct = answered > 0
        ? Math.round((data.correct / answered) * 100)
        : (data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0);
      const y = idx * rowH + 8;
      const barFill = answered === 0
        ? "var(--border-strong)"
        : pct >= 80
        ? "var(--ok)"
        : pct >= 55
        ? "var(--accent)"
        : "var(--bad)";
      const shortName = key;
      const statLabel = answered > 0
        ? `${data.correct}/${answered} (${pct}%)`
        : `0/${data.total} (Chưa làm)`;

      return `
        <g transform="translate(0, ${y})">
          <text x="0" y="14" fill="var(--text)" font-size="12" font-weight="700">${shortName}</text>
          <rect x="148" y="4" width="164" height="12" rx="6" fill="var(--surface-3)" />
          <rect x="148" y="4" width="${Math.max(pct > 0 ? 6 : 0, (pct / 100) * 164)}" height="12" rx="6" fill="${barFill}" />
          <text x="322" y="14" fill="var(--text-muted)" font-size="11.5" font-weight="700" font-family="var(--font-sans)" style="font-variant-numeric: tabular-nums;">${statLabel}</text>
        </g>
      `;
    }).join("");

    return `
      <svg viewBox="0 0 445 ${svgH}" width="100%" height="${svgH}" style="max-width: 100%; height: auto; display: block;" role="img" aria-label="Ma trận kỹ năng theo dạng câu hỏi">
        ${rows}
      </svg>
    `;
  }

  /**
   * Render Theme-Adaptive 30-Day Activity Heatmap SVG
   */
  renderActivityHeatmapSVG() {
    const days = 30;
    const cellSize = 15;
    const gap = 4;
    const now = new Date();
    const cells = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const log = (state.activityLog && state.activityLog[dateStr]) || { seconds: 0 };
      const mins = Math.round((log.seconds || 0) / 60);

      let opacity = 0;
      if (mins > 0 && mins <= 10) opacity = 0.35;
      else if (mins > 10 && mins <= 25) opacity = 0.68;
      else if (mins > 25) opacity = 1;

      const x = (days - 1 - i) * (cellSize + gap);
      cells.push(`
        <g transform="translate(${x}, 6)">
          <rect x="0" y="0" width="${cellSize}" height="${cellSize}" rx="3.5" fill="var(--surface-3)" />
          ${opacity > 0 ? `<rect x="0" y="0" width="${cellSize}" height="${cellSize}" rx="3.5" fill="var(--accent)" fill-opacity="${opacity}" class="heatmap-cell" />` : ""}
          <title>${dateStr}: ${mins} phút luyện tập chủ động</title>
        </g>
      `);
    }

    const svgW = days * (cellSize + gap);
    return `
      <div style="overflow-x: auto; max-width: 100%;">
        <svg viewBox="0 0 ${svgW} 28" width="${svgW}" height="28" style="display: block;">
          ${cells.join("")}
        </svg>
      </div>
    `;
  }

  /**
   * Commercial EdTech Analytics Studio Renderer (used by openAnalyticsModal in main.js)
   * 100% Theme CSS Variables (Light / Dark / Sepia WCAG compliant) & Zero Mobile Overflow
   */
  renderAnalyticsDashboard(stats = this.calculateStats()) {
    // Aggregate 35-Test Online Center History (neuro_cham_toeic_history_v1) for Full Cross-Suite Synchronization
    let chamDoneTests = 0;
    let chamTotalAttempts = 0;
    let chamBest990 = 0;
    let chamBestAcc = -1;
    let latestFullAttempt = null;
    let latestFullTs = -1;
    let seqIdx = 0;
    const getAttemptTs = (att, fallbackIdx) => {
      if (Number.isFinite(Number(att?.timestamp)) && Number(att.timestamp) > 0) return Number(att.timestamp);
      const m = String(att?.id || "").match(/att_(\d+)/);
      if (m) return Number(m[1]) || fallbackIdx;
      return fallbackIdx;
    };
    const catalogTests = (typeof window !== "undefined" && window.CHAM_TOEIC_CATALOG?.tests) || [];
    const totalCatalogTests = catalogTests.length || 35;
    const catalogSlugSet = new Set(catalogTests.map((t) => t.slug));
    const chamPartTotals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    catalogTests.forEach((t) => {
      for (let p = 1; p <= 7; p++) chamPartTotals[p] += Number(t.partCounts?.[`PART_${p}`] || 0);
    });

    const chamPartAgg = {
      1: { part: 1, label: "Part 1 · Photographs", section: "Listening", answered: 0, correct: 0 },
      2: { part: 2, label: "Part 2 · Hỏi - Đáp", section: "Listening", answered: 0, correct: 0 },
      3: { part: 3, label: "Part 3 · Hội thoại", section: "Listening", answered: 0, correct: 0 },
      4: { part: 4, label: "Part 4 · Bài nói ngắn", section: "Listening", answered: 0, correct: 0 },
      5: { part: 5, label: "Part 5 · Ngữ pháp & Từ loại", section: "Reading", answered: 0, correct: 0 },
      6: { part: 6, label: "Part 6 · Điền đoạn văn", section: "Reading", answered: 0, correct: 0 },
      7: { part: 7, label: "Part 7 · Đọc hiểu", section: "Reading", answered: 0, correct: 0 }
    };

    try {
      const rawCham = typeof localStorage !== "undefined" ? localStorage.getItem("neuro_cham_toeic_history_v1") : null;
      const parsedCham = rawCham ? JSON.parse(rawCham) : null;
      const bySlug = parsedCham?.attemptsBySlug || {};
      Object.entries(bySlug).forEach(([slug, arr]) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        const isCustom = String(slug).startsWith("practice-part-");
        if (!isCustom && (catalogSlugSet.size === 0 || catalogSlugSet.has(slug))) {
          chamDoneTests++;
        }
        chamTotalAttempts += arr.length;
        arr.forEach((a) => {
          seqIdx++;
          if ((a.isFull990 || a.isFull200) && (a.scaledTotal || 0) > 0) {
            if (a.scaledTotal > chamBest990) chamBest990 = a.scaledTotal;
            const ts = getAttemptTs(a, seqIdx);
            if (ts >= latestFullTs) {
              latestFullTs = ts;
              latestFullAttempt = a;
            }
          }
          if (typeof a.accuracy === "number" && a.accuracy > chamBestAcc) {
            chamBestAcc = a.accuracy;
          }
          Object.values(a.partStats || {}).forEach((ps) => {
            const pNum = Number(ps.part);
            if (!chamPartAgg[pNum]) return;
            chamPartAgg[pNum].answered += Number(ps.correct || 0) + Number(ps.wrong || 0);
            chamPartAgg[pNum].correct += Number(ps.correct || 0);
          });
        });
      });
    } catch (_) {}

    // Merge Studio + ChamTOEIC per-Part accuracy across all 7 Parts
    const studioPartByNum = new Map((stats.orderedParts || []).map((p) => [p.part, p]));
    let combLcAns = 0;
    let combLcCor = 0;
    let combRcAns = 0;
    let combRcCor = 0;
    let combAnswered = 0;
    let combCorrect = 0;

    const mergedParts = [1, 2, 3, 4, 5, 6, 7].map((pNum) => {
      const sp = studioPartByNum.get(pNum);
      const cp = chamPartAgg[pNum];
      const answered = (sp?.answered || 0) + (cp?.answered || 0);
      const correct = (sp?.correct || 0) + (cp?.correct || 0);
      const total = (sp?.total || 0) + (chamPartTotals[pNum] || 0);
      const accuracyPct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      combAnswered += answered;
      combCorrect += correct;
      if (pNum <= 4) {
        combLcAns += answered;
        combLcCor += correct;
      } else {
        combRcAns += answered;
        combRcCor += correct;
      }
      return {
        part: pNum,
        label: sp?.label || cp.label,
        section: pNum <= 4 ? "Listening" : "Reading",
        answered,
        correct,
        total,
        accuracyPct
      };
    });

    let combLc495 = stats.listening.scaled495;
    let combRc495 = stats.reading.scaled495;
    let combLcEst = stats.listening.isEstimated;
    let combRcEst = stats.reading.isEstimated;
    if (latestFullAttempt && (latestFullAttempt.scaledTotal || 0) > 0 && stats.totalAnswered === 0) {
      combLc495 = Number(latestFullAttempt.scaledLC) || estimateListeningScaledScore(latestFullAttempt.lcCorrect, latestFullAttempt.lcTotal || 100);
      combRc495 = Number(latestFullAttempt.scaledRC) || estimateReadingScaledScore(latestFullAttempt.rcCorrect, latestFullAttempt.rcTotal || 100);
      combLcEst = false;
      combRcEst = false;
    } else if (combLcAns > 0 && combRcAns > 0) {
      combLc495 = estimateListeningScaledScore(combLcCor, combLcAns);
      combRc495 = estimateReadingScaledScore(combRcCor, combRcAns);
      combLcEst = false;
      combRcEst = false;
    } else if (combLcAns > 0) {
      combLc495 = estimateListeningScaledScore(combLcCor, combLcAns);
      combRc495 = estimateReadingScaledScore(combLcCor, combLcAns);
      combLcEst = false;
      combRcEst = true;
    } else if (combRcAns > 0) {
      combRc495 = estimateReadingScaledScore(combRcCor, combRcAns);
      combLc495 = estimateListeningScaledScore(combRcCor, combRcAns);
      combRcEst = false;
      combLcEst = true;
    }

    const combAccPct = combAnswered > 0 ? Math.round((combCorrect / combAnswered) * 100) : 0;
    const combLcAccPct = combLcAns > 0 ? Math.round((combLcCor / combLcAns) * 100) : 0;
    const combRcAccPct = combRcAns > 0 ? Math.round((combRcCor / combRcAns) * 100) : 0;

    const effectiveProjected990 = (latestFullAttempt && (latestFullAttempt.scaledTotal || 0) > 0 && stats.totalAnswered === 0)
      ? (combLc495 + combRc495)
      : (combAnswered > 0 ? combLc495 + combRc495 : stats.projectedTotal990);
    const effectiveCEFR = combAnswered > 0 || chamBest990 > 0
      ? mapTotalScoreToCEFR(effectiveProjected990)
      : stats.projectedCEFR;
    const userTarget = Number(state.targetScore) >= 300 && Number(state.targetScore) <= 990 ? Number(state.targetScore) : 900;
    const targetPct = Math.min(100, Math.max(2, Math.round((effectiveProjected990 / 990) * 100)));
    const targetGoalLinePct = Math.round((userTarget / 990) * 100);
    const parts = mergedParts;

    // Enhance diagnosis when ChamTOEIC data exists even if Studio answered is 0
    let diagnosisList = stats.diagnosis || [];
    if (stats.totalAnswered === 0 && combAnswered > 0) {
      const attemptedMerged = mergedParts.filter((p) => p.answered > 0).sort((a, b) => a.accuracyPct - b.accuracyPct);
      diagnosisList = [];
      if (attemptedMerged.length > 0 && attemptedMerged[0].accuracyPct < 75) {
        const wp = attemptedMerged[0];
        diagnosisList.push({
          tone: "bad",
          title: `Ưu tiên gia cố: ${wp.label} (${wp.accuracyPct}% đúng · ${wp.correct}/${wp.answered} câu)`,
          detail: wp.section === "Reading"
            ? "Hãy vào mục Luyện tập theo Part để rèn tốc độ đọc hiểu, nhận diện từ loại và đối chiếu chứng cứ ETS."
            : "Hãy luyện lại bằng các tab Karaoke Script, Chép chính tả và Shadowing ngay trong màn chữa bài Listening."
        });
      }
      const totalAllBankSets = (totalCatalogTests || 302) + ((this.tests || []).length || 8);
      diagnosisList.push({
        tone: effectiveProjected990 >= userTarget ? "ok" : "info",
        title: `Tổng hợp ${totalAllBankSets} bộ đề: ${combAccPct}% chính xác (${combCorrect}/${combAnswered} câu) · Ước lượng ${effectiveProjected990}/990`,
        detail: effectiveProjected990 < userTarget
          ? `Bạn còn cách mục tiêu ${userTarget}/990 khoảng +${userTarget - effectiveProjected990} điểm. Duy trì luyện Part yếu 10–20 câu/ngày và thi Full Test cuối tuần.`
          : `Bạn đã vượt mục tiêu ${userTarget}/990! Có thể nâng mục tiêu lên mốc cao hơn trên Trang chủ.`
      });
    }
    const confList = [
      {
        ...stats.byConfidence.sure,
        desc: stats.overconfidentWrong > 0
          ? `<span style="display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">${getIcon("alertTriangle", 12)} <span>${stats.overconfidentWrong} câu sập bẫy dù chọn Chắc chắn</span></span>`
          : "✓ Phản xạ kiến thức nền đáng tin cậy",
        accentColor: stats.overconfidentWrong > 0 ? "var(--bad)" : "var(--ok)",
        softBg: "var(--surface-2)"
      },
      {
        ...stats.byConfidence.doubt,
        desc: "Tỷ lệ ghi điểm khi dùng kỹ năng loại trừ đáp án ⊘",
        accentColor: "var(--accent)",
        softBg: "var(--surface-2)"
      },
      {
        ...stats.byConfidence.guess,
        desc: stats.luckyGuesses > 0
          ? `<span style="display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">${getIcon("crosshair", 12)} <span>${stats.luckyGuesses} câu đoán trúng may mắn cần học lại</span></span>`
          : "Không có câu đoán mò ăn may",
        accentColor: "var(--warn)",
        softBg: "var(--surface-2)"
      }
    ];

    const chamBestLabel = chamBest990 > 0 ? `${chamBest990}/990` : (chamBestAcc >= 0 ? `${chamBestAcc}% đúng` : "Chưa thi");

    return `
      <style>
        .analytics-studio-body, .analytics-studio-body * {
          box-sizing: border-box;
        }
      </style>
      <div class="analytics-studio-body" style="display: flex; flex-direction: column; gap: 16px; color: var(--text);">
        <!-- 1. Target Score Estimator (/990 Projection) -->
        <div style="background: var(--surface-2); border: 1px solid var(--accent-border); border-radius: var(--radius-lg); padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--accent);">
                Dự phóng Điểm TOEIC Chuẩn ETS (Mục tiêu ${userTarget}/990)
              </div>
              <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                <span class="tabular-nums" style="font-size: 2.35rem; font-weight: 600; line-height: 1; color: var(--accent);">
                  ${effectiveProjected990}
                </span>
                <span style="font-size: 1rem; font-weight: 500; color: var(--text-muted);">/ 990 điểm</span>
                <span class="badge" style="font-size: 0.74rem; padding: 3px 10px; border-radius: var(--radius-full); background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); font-weight: 500;">
                  ${effectiveCEFR}
                </span>
              </div>
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 12px; min-width: 124px;">
                <div style="font-size: 0.72rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase;">Kho ${totalCatalogTests} Đề Online</div>
                <div class="tabular-nums" style="font-size: 1.12rem; font-weight: 600; color: var(--accent);">
                  ${chamDoneTests}/${totalCatalogTests} đề
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  Kỷ lục: <strong>${chamBestLabel}</strong> (${chamTotalAttempts} lượt)
                </div>
              </div>

              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 12px; min-width: 124px;">
                <div style="font-size: 0.72rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase;">Listening</div>
                <div class="tabular-nums" style="font-size: 1.12rem; font-weight: 600; color: var(--text);">
                  ${combLc495}<span style="font-size: 0.78rem; color: var(--text-muted);">/495</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  ${combLcAns > 0 ? `Đúng ${combLcCor}/${combLcAns} (${combLcAccPct}%)` : (combLcEst ? "Ước tính đối xứng" : "Chưa làm bài")}
                </div>
              </div>

              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 12px; min-width: 124px;">
                <div style="font-size: 0.72rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase;">Reading</div>
                <div class="tabular-nums" style="font-size: 1.12rem; font-weight: 600; color: var(--text);">
                  ${combRc495}<span style="font-size: 0.78rem; color: var(--text-muted);">/495</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  ${combRcAns > 0 ? `Đúng ${combRcCor}/${combRcAns} (${combRcAccPct}%)` : (combRcEst ? "Ước tính đối xứng" : "Chưa làm bài")}
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Track with Goal Benchmark Marker -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="position: relative; width: 100%; height: 9px; border-radius: 999px; background: var(--surface-3); overflow: hidden;">
              <div style="width: ${targetPct}%; height: 100%; border-radius: 999px; background: ${effectiveProjected990 >= userTarget && combAnswered > 0 ? 'var(--ok)' : 'var(--accent)'}; transition: width 240ms ease;"></div>
              <div title="Mốc mục tiêu ${userTarget}/990" style="position: absolute; top: 0; bottom: 0; left: ${targetGoalLinePct}%; width: 2px; background: var(--warn);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap; gap: 6px;">
              <span>Đã luyện tổng hợp: <strong>${combAnswered.toLocaleString("vi-VN")} câu</strong> · Chính xác: <strong>${combAccPct}%</strong></span>
              <span style="color: ${(effectiveProjected990 >= userTarget && (combAnswered > 0 || chamBest990 > 0)) ? 'var(--ok)' : 'var(--warn)'}; font-weight: 500;">
                ${(combAnswered === 0 && chamBest990 === 0) ? `Làm đề để mở khóa định vị mục tiêu ${userTarget}+` : (effectiveProjected990 < userTarget ? `Còn +${userTarget - effectiveProjected990} điểm tới mục tiêu ${userTarget}` : `Đã chạm ngưỡng mục tiêu ${userTarget}!`)}
              </span>
            </div>
          </div>
        </div>

        <!-- 2. Per-Part Accuracy & Question-Type Skill Matrix -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 14px;">
          <!-- Left: Accuracy by Part -->
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 6px;">
              <h4 style="margin: 0; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent);">Độ chính xác theo từng Part</h4>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Tỷ lệ đúng / Đã làm</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${parts.map((p) => {
                const barColor = p.answered === 0 ? "var(--border-strong)" : p.accuracyPct >= 80 ? "var(--ok)" : p.accuracyPct >= 55 ? "var(--accent)" : "var(--bad)";
                return `
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.82rem; flex-wrap: wrap;">
                      <span style="font-weight: 500; color: var(--text);">${p.label}</span>
                      <span class="tabular-nums" style="font-family: var(--font-sans); font-size: 0.75rem; color: var(--text-muted);">
                        ${p.answered > 0 ? `<strong style="color: ${barColor};">${p.correct}/${p.answered}</strong> (${p.accuracyPct}%) · Kho ${p.total} câu` : `0/${p.total} (Chưa làm)`}
                      </span>
                    </div>
                    <div style="width: 100%; height: 7px; border-radius: 999px; background: var(--surface-3); overflow: hidden;">
                      <div style="width: ${p.answered > 0 ? Math.max(4, p.accuracyPct) : 0}%; height: 100%; background: ${barColor}; border-radius: 999px;"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Right: Question Type Matrix -->
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 6px;">
              <h4 style="margin: 0; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent);">Ma trận theo Dạng câu hỏi</h4>
              <span style="font-size: 0.72rem; color: var(--text-muted);">ETS Skill Matrix</span>
            </div>
            ${this.renderSkillMatrixSVG(stats)}
          </div>
        </div>

        <!-- 3. Confidence Calibration Analysis (Sure vs Doubt vs Guess) -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; flex-wrap: wrap;">
            <h4 style="margin: 0; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent);">
              Hiệu chuẩn Độ tự tin (Confidence Calibration)
            </h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Đo lường độ lệch giữa cảm nhận &amp; năng lực thực</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 10px;">
            ${confList.map((c) => `
              <div style="background: ${c.softBg}; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 11px 13px; display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.78rem; font-weight: 600; color: var(--text);">${c.label}</span>
                  <span class="tabular-nums" style="font-family: var(--font-sans); font-size: 0.74rem; color: var(--text-muted);">${c.answered} câu</span>
                </div>
                <div class="tabular-nums" style="font-size: 1.55rem; font-weight: 600; color: ${c.answered > 0 ? c.accentColor : 'var(--text-muted)'};">
                  ${c.answered > 0 ? `${c.accuracyPct}%` : "—"}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
                  ${c.answered > 0 ? `Đúng <strong>${c.correct}</strong> · Sai <strong>${c.wrong}</strong><br/>` : ""}${c.desc}
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 4. Smart Weakness Diagnosis -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
          <h4 style="margin: 0 0 10px; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent);">
            Chẩn đoán Điểm yếu &amp; Phác đồ Cải thiện Thông minh
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${diagnosisList.map((d) => {
              const borderCol = d.tone === "bad" ? "var(--bad)" : d.tone === "warn" ? "var(--warn)" : d.tone === "ok" ? "var(--ok)" : "var(--accent)";
              const bgCol = d.tone === "bad" ? "var(--bad-soft)" : d.tone === "warn" ? "var(--warn-soft)" : d.tone === "ok" ? "var(--ok-soft)" : "var(--surface-2)";
              return `
                <div style="background: ${bgCol}; border: 1px solid var(--border); border-left: 4px solid ${borderCol}; border-radius: var(--radius-sm); padding: 10px 13px;">
                  <div style="font-size: 0.85rem; font-weight: 600; color: var(--text); margin-bottom: 3px;">${d.title}</div>
                  <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-muted);">${d.detail}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- 5. 30-Day Activity Heatmap -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
            <h4 style="margin: 0; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--accent);">
              Nhịp độ Luyện tập 30 Ngày Gần Nhất
            </h4>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Tổng <strong>${stats.totalStudyMinutes30d} phút</strong> · Duy trì <strong>${stats.activeDays30d}/30 ngày</strong>
            </span>
          </div>
          ${this.renderActivityHeatmapSVG()}
        </div>
      </div>
    `;
  }

  /**
   * Smart Mix Practice Drills Generator
   */
  getSmartMixTalks(filterType = "mistakes") {
    const list = [];
    const allTests = this.getAllTests();

    allTests.forEach((t) => {
      (t.talks || []).forEach((talk, talkIndex) => {
        let match = false;

        if (filterType === "mistakes") {
          const hasWrong = (talk.questions || []).some((q) => {
            const userAns = getAnswer(t.id, q.num);
            const conf = getConfidence(t.id, q.num);
            return (userAns && userAns !== q.answer) || (userAns === q.answer && conf === "guess");
          });
          if (hasWrong) match = true;
        } else if (filterType === "graphic") {
          if (talk.image || (talk.questions || []).some((q) => q.questionType === "graphic")) match = true;
        } else if (filterType === "multi_doc") {
          if ((talk.passageCount || (talk.passages ? talk.passages.length : 1)) >= 2) match = true;
        } else if (filterType === "insertion") {
          if ((talk.questions || []).some((q) => q.questionType === "sentence_insertion" || q.questionType === "inference")) {
            match = true;
          }
        } else if (filterType === "grammar" || filterType === "part56") {
          if (t.part === 5 || t.part === 6 || /Part\s*[56]\b/i.test(String(talk.type || ""))) {
            match = true;
          }
        } else if (filterType === "high_speed") {
          if (!talk.isReading && !t.isReading) match = true;
        }

        if (match) {
          list.push({ ...talk, testId: t.id, testTitle: t.title, talkIndex });
        }
      });
    });

    return list;
  }
}
