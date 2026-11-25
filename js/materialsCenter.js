/**
 * TOEIC Study Materials & CEFR Analysis Hub (#/materials)
 * - Hackers TOEIC Series & ETS Official Guide (expandable chapters + recommended tests)
 * - Interactive Part 5-6 Grammar Handbook & Instant Quiz
 * - Paraphrase & ETS Trap Dictionary with TTS Pronunciation
 * - Hackers 30-Day Thematic Vocabulary with 1-Click SM-2 Flashcard Pinning
 * - Full 43-Test CEFR Difficulty Matrix (A1, A2, B1, B2, C1, C2) & Study Pathways
 */

import { getIcon } from "./uiIcons.js";
import { clearToasts } from "./renderers.js?v=27.1";

const MAT_SVG = {
  grid: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  headphones: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  books: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  vocab: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/></svg>`,
  typeAa: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  volume: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  pin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  chevron: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`,
  arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  layers: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  target: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCefrToneClass(cefrText = "") {
  const s = String(cefrText).toUpperCase();
  if (s.includes("C2")) return "cefr-c2";
  if (s.includes("C1")) return "cefr-c1";
  if (s.includes("B2")) return "cefr-b2";
  if (s.includes("B1")) return "cefr-b1";
  return "cefr-a12";
}

function speakEnglish(text) {
  const clean = String(text ?? "").trim();
  if (!clean) return;
  try {
    if (window.__app?.vocabSRS?.speakTTS) {
      window.__app.vocabSRS.speakTTS(clean, 0.94);
      return;
    }
    if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "en-US";
      u.rate = 0.94;
      window.speechSynthesis.speak(u);
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

const MAT_QUIZ_STORAGE_KEY = "neuro_toeic_materials_quiz_v1";

function loadPersistedGrammarQuiz() {
  try {
    const raw = localStorage.getItem(MAT_QUIZ_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePersistedGrammarQuiz(answers) {
  try {
    localStorage.setItem(MAT_QUIZ_STORAGE_KEY, JSON.stringify(answers || {}));
  } catch {}
}

export function initMaterialsCenter(options = {}) {
  const root = document.getElementById("materials-hub-root");
  if (!root) return null;

  const state = {
    isOpen: false,
    activeTab: "books", // 'books' | 'grammar' | 'paraphrase' | 'vocab'
    bookCefrFilter: "ALL",
    selectedBookId: null,
    expandedChapters: {},
    quizAnswers: loadPersistedGrammarQuiz(), // { `${topicId}:${qIdx}`: 'A'|'B'|'C'|'D' }
    paraSearch: "",
    paraPart: "ALL",
    paraCefr: "ALL",
    pathwayGroup: "B12",
    matrixSearch: "",
    matrixSource: "ALL",
    matrixCefr: "ALL",
    matrixSort: "DIFF_ASC",
    matrixShowAll: false
  };

  function getData() {
    return window.TOEIC_MATERIALS_DATA || {
      books: [],
      grammarTopics: [],
      paraphraseBank: [],
      vocabModules: [],
      cefrPathways: []
    };
  }

  function getDifficultyData() {
    return window.TOEIC_DIFFICULTY_DATA || {
      cefrMeta: {},
      distribution: {},
      chamTests: {},
      studioTests: {}
    };
  }

  function launchTestRef(type, idOrSlug) {
    if (!idOrSlug) return;
    if (type === "studio") {
      close();
      if (typeof options.onOpenStudioDetail === "function") {
        options.onOpenStudioDetail(idOrSlug);
      } else if (typeof window.__app?.openStudioDetail === "function") {
        window.__app.openStudioDetail(idOrSlug);
      }
      return;
    }
    close();
    if (typeof options.onOpenChamSlug === "function") {
      options.onOpenChamSlug(idOrSlug);
    } else if (typeof window.__app?.openChamHub === "function") {
      window.__app.openChamHub(idOrSlug);
    } else if (window.__chamCenter?.open) {
      window.__chamCenter.open(idOrSlug);
    } else {
      window.location.hash = `#/tests/${idOrSlug}`;
    }
  }

  function open(initialTab = null, fromHashChange = false) {
    clearToasts();
    if (initialTab === "matrix") {
      if (typeof options.onOpenCefrMatrix === "function") {
        options.onOpenCefrMatrix();
        return;
      }
      state.activeTab = "books";
    } else if (initialTab && ["books", "grammar", "paraphrase", "vocab"].includes(initialTab)) {
      state.activeTab = initialTab;
    }
    state.selectedBookId = null;
    state.isOpen = true;
    root.hidden = false;
    document.body.classList.add("is-materials-hub-active");
    if (!fromHashChange) {
      const targetHash = state.activeTab === "books" ? "#/materials" : `#/materials/${state.activeTab}`;
      if (window.location.hash !== targetHash) {
        try {
          history.pushState(null, "", targetHash);
        } catch {
          window.location.hash = targetHash;
        }
      }
    }
    render({ scrollTop: true });
    window.scrollTo(0, 0);
  }

  function close() {
    state.isOpen = false;
    root.hidden = true;
    document.body.classList.remove("is-materials-hub-active");
  }

  function setTab(tab) {
    if (tab === "matrix") {
      if (typeof options.onOpenCefrMatrix === "function") {
        options.onOpenCefrMatrix();
        return;
      }
      return;
    }
    if (!["books", "grammar", "paraphrase", "vocab"].includes(tab)) return;
    clearToasts();
    state.activeTab = tab;
    state.selectedBookId = null;
    const targetHash = tab === "books" ? "#/materials" : `#/materials/${tab}`;
    if (window.location.hash !== targetHash) {
      try {
        history.pushState(null, "", targetHash);
      } catch {
        window.location.hash = targetHash;
      }
    }
    render({ scrollTop: true });
  }

  function renderHeaderHTML() {
    // v21.0: Single unified global header lives in index.html (.topbar-global-bar).
    return "";
  }

  function renderHeroAndKpisHTML() {
    return `
      <div class="v21-page-head">
        <div>
          <h1 class="v21-page-title">Tài liệu ôn thi TOEIC</h1>
          <p class="v21-page-sub">Giáo trình Hackers &amp; ETS, ngữ pháp Part 5–6 có quiz chấm tức thì, từ điển Paraphrase và từ vựng 30 ngày.</p>
        </div>
      </div>
    `;
  }

  function renderTabsHTML() {
    const tabs = [
      { id: "books", label: "Giáo trình", icon: MAT_SVG.books },
      { id: "grammar", label: "Ngữ pháp Part 5–6", icon: MAT_SVG.check },
      { id: "paraphrase", label: "Paraphrase ETS", icon: MAT_SVG.search },
      { id: "vocab", label: "Từ vựng 30 ngày", icon: MAT_SVG.vocab }
    ];
    return `
      <div class="mat-tabs-bar v21-subtabs-bar" role="tablist" aria-label="Danh mục tài liệu ôn thi TOEIC">
        ${tabs
          .map(
            (t) => `
          <button
            type="button"
            role="tab"
            id="mat-tab-${t.id}"
            aria-selected="${state.activeTab === t.id ? "true" : "false"}"
            class="mat-tab-btn ${state.activeTab === t.id ? "is-active" : ""}"
            data-mat-tab="${t.id}"
          >
            ${t.icon}
            <span>${esc(t.label)}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  function bookMatchesGroup(book, filterKey) {
    if (!filterKey || filterKey === "ALL") return true;
    const ranks = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const groupRanges = { A12: [0, 1], B12: [2, 3], C12: [4, 5] };
    const target = groupRanges[filterKey];
    if (!target) return book.cefrGroup === filterKey;
    const found = String(book.cefr || "").toUpperCase().match(/[ABC][12]/g) || [];
    if (found.length >= 2) {
      const lo = ranks.indexOf(found[0]);
      const hi = ranks.indexOf(found[found.length - 1]);
      if (lo >= 0 && hi >= lo) return lo <= target[1] && hi >= target[0];
    } else if (found.length === 1) {
      const idx = ranks.indexOf(found[0]);
      if (idx >= 0) return idx >= target[0] && idx <= target[1];
    }
    return book.cefrGroup === filterKey || String(book.cefr).includes(filterKey);
  }

  function getBookCoverStyle(book) {
    const id = String(book.id || "");
    if (id.includes("start")) return { cls: "is-emerald", short: "START", tag: "Nền tảng" };
    if (id.includes("reading")) return { cls: "is-ocean", short: "READING", tag: "Part 5–7" };
    if (id.includes("listening")) return { cls: "is-indigo", short: "LISTENING", tag: "Part 1–4" };
    if (id.includes("1000")) return { cls: "is-navy", short: "1000 RC/LC", tag: "Thực chiến" };
    if (id.includes("vocab")) return { cls: "is-teal", short: "VOCAB 30D", tag: "Từ vựng" };
    return { cls: "is-slate", short: "ETS GUIDE", tag: "Chính thức" };
  }

  function renderBookReaderHTML(book) {
    const cefrCls = getCefrToneClass(book.cefr);
    const cov = getBookCoverStyle(book);
    return `
      <div class="mat-section v21-book-reader">
        <div class="v21-breadcrumb-row">
          <button type="button" class="v21-back-btn" id="mat-book-back-btn">
            ${MAT_SVG.back}
            <span>Danh sách giáo trình</span>
          </button>
          <span class="v21-neutral-pill">${esc(book.series)}</span>
        </div>

        <article class="v21-card v21-book-reader-card" data-book-id="${esc(book.id)}">
          <div class="v21-book-reader-head">
            <div class="v21-book-cover is-compact ${cov.cls}" aria-hidden="true">
              <span class="v21-cover-series">${esc(book.series)}</span>
              <span class="v21-cover-big">${esc(cov.short)}</span>
              <span class="v21-cover-foot">${esc(cov.tag)}</span>
            </div>
            <div class="v21-book-reader-info">
              <div class="mat-book-meta">
                <span class="cefr-badge ${cefrCls}">${esc(book.cefr)}</span>
                <span class="mat-target-pill">Mục tiêu: ${esc(book.toeicTarget)}</span>
                <span class="mat-target-pill">${esc(book.estHours)} · ${(book.chapters || []).length} chương</span>
              </div>
              <h2 class="mat-book-title" style="margin-top: 6px;">${esc(book.title)}</h2>
              <p class="mat-book-desc" style="margin-top: 6px;">${esc(book.description)}</p>
            </div>
          </div>

          <h3 class="v21-section-title" style="margin: 18px 0 10px;">Mục lục giáo trình (${(book.chapters || []).length} chương)</h3>
          <div class="mat-chapters-list">
            ${(book.chapters || [])
              .map((ch, idx) => {
                const chKey = `${book.id}:${idx}`;
                const isOpen = Boolean(state.expandedChapters[chKey]);
                return `
                <div class="mat-chapter-item ${isOpen ? "is-open" : ""}">
                  <button type="button" class="mat-chapter-toggle" data-toggle-chapter="${esc(chKey)}" aria-expanded="${isOpen ? "true" : "false"}">
                    <span class="mat-chapter-toggle-left">
                      <span class="cefr-badge cefr-sm ${getCefrToneClass(ch.cefr)}">${esc(ch.cefr)}</span>
                      <span class="mat-chapter-name">${esc(ch.title)}</span>
                    </span>
                    <span class="mat-chapter-chevron">${MAT_SVG.chevron}</span>
                  </button>
                  ${
                    isOpen
                      ? `
                    <div class="mat-chapter-body">
                      <p class="mat-chapter-summary">${esc(ch.summary)}</p>
                      <ul class="mat-key-points">
                        ${(ch.keyPoints || []).map((kp) => `<li>${esc(kp)}</li>`).join("")}
                      </ul>
                      ${
                        ch.trapAlert
                          ? `<div class="mat-trap-box">${MAT_SVG.alert} <div><strong>Bẫy cần tránh:</strong> ${esc(ch.trapAlert)}</div></div>`
                          : ""
                      }
                    </div>
                  `
                      : ""
                  }
                </div>
              `;
              })
              .join("")}
          </div>

          ${
            Array.isArray(book.recommendedTests) && book.recommendedTests.length
              ? `
            <div class="mat-book-footer" style="margin-top: 16px;">
              <span class="mat-rec-label">Đề thực hành khớp trình độ:</span>
              <div class="mat-rec-actions">
                ${book.recommendedTests
                  .map(
                    (rt) => `
                  <button
                    type="button"
                    class="cham-btn mat-rec-btn"
                    data-launch-type="${esc(rt.type)}"
                    data-launch-id="${esc(rt.type === "studio" ? rt.id : rt.slug)}"
                  >
                    <span>${esc(rt.label)}</span>
                    ${MAT_SVG.arrowRight}
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </article>
      </div>
    `;
  }

  function renderBooksTabHTML() {
    const data = getData();
    const allBooks = data.books || [];

    if (state.selectedBookId) {
      const picked = allBooks.find((b) => b.id === state.selectedBookId);
      if (picked) return renderBookReaderHTML(picked);
      state.selectedBookId = null;
    }

    const books = allBooks.filter((b) => bookMatchesGroup(b, state.bookCefrFilter));

    const filterBtns = [
      { key: "ALL", label: `Tất cả (${allBooks.length})` },
      { key: "A12", label: "A1–A2" },
      { key: "B12", label: "B1–B2" },
      { key: "C12", label: "C1–C2" }
    ];

    return `
      <div class="mat-section">
        <div class="v21-books-filter-row">
          <div class="cham-chips">
            ${filterBtns
              .map(
                (f) => `
              <button type="button" class="v21-filter-pill ${state.bookCefrFilter === f.key ? "is-active" : ""}" data-book-cefr="${f.key}">
                ${esc(f.label)}
              </button>
            `
              )
              .join("")}
          </div>
          <span style="font-size: 13px; color: var(--text-muted);">Bấm vào giáo trình để xem mục lục và đề luyện đi kèm</span>
        </div>

        <div class="v21-books-grid">
          ${books
            .map((book) => {
              const cefrCls = getCefrToneClass(book.cefr);
              const cov = getBookCoverStyle(book);
              return `
              <article class="v21-card v21-book-card" data-book-id="${esc(book.id)}">
                <div class="v21-book-cover ${cov.cls}" aria-hidden="true">
                  <span class="v21-cover-series">${esc(book.series)}</span>
                  <span class="v21-cover-big">${esc(cov.short)}</span>
                  <span class="v21-cover-foot">${esc(cov.tag)} · ${(book.chapters || []).length} chương</span>
                </div>
                <div class="v21-book-card-body">
                  <div class="v21-book-card-meta">
                    <span class="cefr-badge cefr-sm ${cefrCls}">${esc(book.cefr)}</span>
                    <span class="v21-book-target tabular-nums">${esc(book.toeicTarget)}</span>
                  </div>
                  <h2 class="v21-book-name">${esc(book.title)}</h2>
                  <button type="button" class="cham-btn v21-book-read-btn" data-open-book="${esc(book.id)}">
                    <span>Đọc mục lục</span>
                    ${MAT_SVG.arrowRight}
                  </button>
                </div>
              </article>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderGrammarTabHTML() {
    const data = getData();
    const topics = data.grammarTopics || [];
    let totalQ = 0;
    let answeredQ = 0;
    let correctQ = 0;
    topics.forEach((topic) => {
      (topic.quiz || []).forEach((q, qIdx) => {
        totalQ++;
        const k = `${topic.id}:${qIdx}`;
        const picked = state.quizAnswers[k];
        if (picked) {
          answeredQ++;
          if (picked === q.answer) correctQ++;
        }
      });
    });

    return `
      <div class="mat-section">
        <div class="mat-grammar-summary-bar">
          <div>
            <h2 class="mat-section-h2">8 Chuyên đề Ngữ pháp Trọng tâm Part 5–6 (Chuẩn Hackers Reading)</h2>
            <p class="mat-section-desc">Nắm công thức nhận diện trong 3 giây đầu và làm trực tiếp câu hỏi kiểm tra ngay bên dưới mỗi chuyên đề.</p>
          </div>
          <div class="mat-quiz-score-pill">
            <span>Điểm Quiz hiện tại:</span>
            <strong>${correctQ} / ${totalQ} câu đúng</strong>
            <span class="mat-quiz-answered">(${answeredQ}/${totalQ} đã chọn)</span>
            ${
              answeredQ > 0
                ? `<button type="button" class="cham-btn" id="mat-reset-grammar-quiz">Làm lại Quiz</button>`
                : ""
            }
          </div>
        </div>

        <div class="mat-grammar-grid">
          ${topics
            .map((topic) => {
              const cefrCls = getCefrToneClass(topic.cefr);
              return `
              <article class="mat-grammar-card" id="mat-grammar-${esc(topic.id)}">
                <div class="mat-grammar-head">
                  <div class="mat-book-meta">
                    <span class="mat-series-tag">Chuyên đề ${topic.num}</span>
                    <span class="cefr-badge ${cefrCls}">${esc(topic.cefr)}</span>
                    <span class="mat-target-pill">${esc(topic.source)} · Tỷ trọng ${esc(topic.freqPct)}</span>
                  </div>
                  <h3>${esc(topic.title)}</h3>
                </div>

                <div class="mat-formula-box">
                  <span class="mat-formula-label">Công thức 3 giây:</span>
                  <code>${esc(topic.formula)}</code>
                </div>

                <p class="mat-quick-rule"><strong>Quy tắc giải nhanh:</strong> ${esc(topic.quickRule)}</p>
                <div class="mat-trap-box">${MAT_SVG.alert} <div><strong>Bẫy thường gặp:</strong> ${esc(topic.trapNote)}</div></div>

                <div class="mat-examples-box">
                  ${(topic.examples || [])
                    .map(
                      (ex) => `
                    <div class="mat-ex-row">
                      <div class="mat-ex-en">${esc(ex.en)}</div>
                      <div class="mat-ex-vi">${esc(ex.vi)}</div>
                    </div>
                  `
                    )
                    .join("")}
                </div>

                <div class="mat-quiz-block">
                  ${(topic.quiz || [])
                    .map((q, qIdx) => {
                      const qKey = `${topic.id}:${qIdx}`;
                      const picked = state.quizAnswers[qKey] || "";
                      const isDone = Boolean(picked);
                      const isCorrect = picked === q.answer;
                      return `
                      <div class="mat-quiz-item" data-quiz-key="${esc(qKey)}">
                        <div class="mat-quiz-stem">
                          <span class="mat-quiz-badge">Quiz ${topic.num}.${qIdx + 1}</span>
                          <span>${esc(q.stem)}</span>
                        </div>
                        <div class="mat-quiz-options">
                          ${(q.options || [])
                            .map((opt) => {
                              let cls = "";
                              if (isDone) {
                                if (opt.choice === q.answer) cls = "is-correct";
                                else if (opt.choice === picked) cls = "is-wrong";
                              }
                              return `
                              <button
                                type="button"
                                class="mat-quiz-opt ${cls}"
                                data-quiz-answer-key="${esc(qKey)}"
                                data-quiz-choice="${esc(opt.choice)}"
                              >
                                <span class="mat-opt-badge">${esc(opt.choice)}</span>
                                <span>${esc(opt.text)}</span>
                              </button>
                            `;
                            })
                            .join("")}
                        </div>
                        ${
                          isDone
                            ? `
                          <div class="mat-quiz-feedback ${isCorrect ? "is-ok" : "is-bad"}">
                            <strong>${isCorrect ? "Chính xác!" : `Chưa đúng (Đáp án chuẩn: ${q.answer}).`}</strong>
                            <span>${esc(q.explanation)}</span>
                          </div>
                        `
                            : ""
                        }
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </article>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderParaphraseTabHTML() {
    const data = getData();
    const qNorm = state.paraSearch.trim().toLowerCase();
    const items = (data.paraphraseBank || []).filter((item) => {
      if (state.paraPart !== "ALL" && item.part !== state.paraPart) return false;
      if (state.paraCefr !== "ALL" && !String(item.cefr).includes(state.paraCefr)) return false;
      if (qNorm) {
        const hay = `${item.audioOrText} ${item.optionText} ${item.note} ${item.part}`.toLowerCase();
        if (!hay.includes(qNorm)) return false;
      }
      return true;
    });

    const partOptions = ["ALL", "Part 1", "Part 2", "Part 3–4", "Part 7"];
    const cefrOptions = [
      { key: "ALL", label: "Mọi trình độ" },
      { key: "A2", label: "A2" },
      { key: "B1", label: "B1" },
      { key: "B2", label: "B2" },
      { key: "C1", label: "C1–C2" }
    ];

    return `
      <div class="mat-section">
        <div class="mat-filter-strip">
          <div class="mat-search-wrap">
            ${MAT_SVG.search}
            <input
              type="search"
              id="mat-para-search"
              class="mat-search-input"
              placeholder="Tìm cụm từ gốc, đáp án paraphrase hoặc ghi chú bẫy (vd: renovate, pedestrian, budget)..."
              value="${esc(state.paraSearch)}"
            />
          </div>
          <div class="cham-chips">
            ${partOptions
              .map(
                (p) => `
              <button type="button" class="cham-chip ${state.paraPart === p ? "is-active" : ""}" data-para-part="${esc(p)}">
                ${p === "ALL" ? "Tất cả Part" : esc(p)}
              </button>
            `
              )
              .join("")}
          </div>
          <div class="cham-chips">
            ${cefrOptions
              .map(
                (c) => `
              <button type="button" class="cham-chip ${state.paraCefr === c.key ? "is-active" : ""}" data-para-cefr="${esc(c.key)}">
                ${esc(c.label)}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="mat-para-table-wrap">
          <table class="mat-para-table">
            <thead>
              <tr>
                <th>Phần &amp; CEFR</th>
                <th>Nghe thấy trong Audio / Đọc trong bài gốc</th>
                <th>Đáp án Paraphrase trên đề ETS</th>
                <th>Chiến lược &amp; Ghi chú bẫy</th>
                <th>Phát âm</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length
                  ? items
                      .map(
                        (item, idx) => `
                <tr>
                  <td>
                    <div class="mat-para-tags">
                      <span class="mat-part-pill">${esc(item.part)}</span>
                      <span class="cefr-badge cefr-sm ${getCefrToneClass(item.cefr)}">${esc(item.cefr)}</span>
                    </div>
                  </td>
                  <td class="mat-para-src">${esc(item.audioOrText)}</td>
                  <td class="mat-para-dst">${esc(item.optionText)}</td>
                  <td class="mat-para-note">${esc(item.note)}</td>
                  <td>
                    <button type="button" class="cham-btn mat-tts-btn" data-speak-text="${esc(`${item.audioOrText}. ${item.optionText}`)}" title="Nghe phát âm cặp Paraphrase #${idx + 1}">
                      ${MAT_SVG.volume} <span>Nghe</span>
                    </button>
                  </td>
                </tr>
              `
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="5" class="mat-empty-row">Không tìm thấy cặp paraphrase phù hợp với từ khóa hoặc bộ lọc hiện tại.</td>
                </tr>
              `
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderVocabTabHTML() {
    const data = getData();
    const srs = window.__app?.vocabSRS;
    const modules = data.vocabModules || [];

    return `
      <div class="mat-section">
        <div class="mat-grammar-summary-bar">
          <div>
            <h2 class="mat-section-h2">Từ vựng Trọng điểm Hackers 30 Ngày · Ghim thẳng vào SM-2</h2>
            <p class="mat-section-desc">Nghe phát âm chuẩn Anh-Mỹ và nhấn "+ Ghim SM-2" để đưa từ vựng kèm ngữ cảnh thi thực tế vào hệ thống ôn tập ngắt quãng 760+ từ của bạn.</p>
          </div>
          <button type="button" class="cham-btn cham-btn-primary" id="mat-open-srs-modal-btn">
            ${MAT_SVG.vocab} Mở bộ Flashcard SM-2
          </button>
        </div>

        <div class="mat-vocab-modules-grid">
          ${modules
            .map((mod, mIdx) => {
              const words = mod.words || [];
              return `
              <section class="mat-vocab-module-card">
                <div class="mat-vocab-module-head">
                  <div>
                    <span class="cefr-badge cefr-sm ${getCefrToneClass(mod.cefr)}">${esc(mod.cefr)}</span>
                    <h3>${esc(mod.topic)}</h3>
                  </div>
                  <button type="button" class="cham-btn" data-pin-module="${mIdx}">
                    ${MAT_SVG.pin} Ghim cả nhóm (${words.length})
                  </button>
                </div>

                <div class="mat-vocab-list">
                  ${words
                    .map((w, wIdx) => {
                      const isPinned = Boolean(srs?.hasWord && srs.hasWord(w.word));
                      return `
                      <div class="mat-vocab-row">
                        <div class="mat-vocab-main">
                          <div class="mat-vocab-title-line">
                            <strong class="mat-vocab-word">${esc(w.word)}</strong>
                            <span class="mat-vocab-pos">${esc(w.pos)}</span>
                            <span class="mat-vocab-ipa">${esc(w.ipa)}</span>
                          </div>
                          <div class="mat-vocab-vi">${esc(w.vi)}</div>
                          <div class="mat-vocab-ex">${esc(w.example)}</div>
                        </div>
                        <div class="mat-vocab-actions">
                          <button type="button" class="cham-btn mat-tts-btn" data-speak-text="${esc(`${w.word}. ${w.example}`)}" title="Nghe từ và câu ví dụ">
                            ${MAT_SVG.volume}
                          </button>
                          <button
                            type="button"
                            class="cham-btn ${isPinned ? "is-pinned-sm2" : "cham-btn-primary"}"
                            data-pin-vocab="${mIdx}:${wIdx}"
                          >
                            ${isPinned ? `${MAT_SVG.check} Đã trong SM-2` : `${MAT_SVG.pin} Ghim SM-2`}
                          </button>
                        </div>
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </section>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderMatrixTabHTML() {
    const data = getData();
    const diff = getDifficultyData();
    const pathways = data.cefrPathways || [];
    const activePathway = pathways.find((p) => p.group === state.pathwayGroup) || pathways[0];

    const allTests = [];
    Object.values(diff.chamTests || {}).forEach((item) => {
      allTests.push({ ...item, type: "cham", refId: item.id, sourceLabel: item.collection || "Kho Đề Thi" });
    });
    Object.values(diff.studioTests || {}).forEach((item) => {
      allTests.push({ ...item, type: "studio", refId: item.id, sourceLabel: "Luyện Sâu Studio" });
    });

    const fullCnt = allTests.filter((t) => t.type === "cham" && (t.testType === "full" || Number(t.totalQ) >= 190)).length;
    const miniCnt = allTests.filter((t) => t.type === "cham" && t.testType === "mini").length;
    const partCnt = allTests.filter((t) => t.type === "cham" && (t.testType === "part" || t.testType === "section")).length;
    const studioCnt = allTests.filter((t) => t.type === "studio").length;

    const qNorm = state.matrixSearch.trim().toLowerCase();
    const filtered = allTests.filter((t) => {
      if (state.matrixSource === "CHAM" && t.type !== "cham") return false;
      if (state.matrixSource === "FULL" && !(t.type === "cham" && (t.testType === "full" || Number(t.totalQ) >= 190))) return false;
      if (state.matrixSource === "MINI" && !(t.type === "cham" && t.testType === "mini")) return false;
      if (state.matrixSource === "PART" && !(t.type === "cham" && (t.testType === "part" || t.testType === "section"))) return false;
      if (state.matrixSource === "STUDIO" && t.type !== "studio") return false;
      if (state.matrixCefr !== "ALL") {
        if (["A12", "B12", "C12"].includes(state.matrixCefr)) {
          if (t.cefrGroup !== state.matrixCefr) return false;
        } else if (t.cefr !== state.matrixCefr) {
          return false;
        }
      }
      if (qNorm) {
        const hay = `${t.title} ${t.sourceLabel} ${t.cefr} ${t.summary || ""}`.toLowerCase();
        if (!hay.includes(qNorm)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (state.matrixSort === "DIFF_ASC") return (a.difficultyScore || 0) - (b.difficultyScore || 0);
      if (state.matrixSort === "DIFF_DESC") return (b.difficultyScore || 0) - (a.difficultyScore || 0);
      return String(a.title).localeCompare(String(b.title));
    });

    const dist = diff.distribution || {};
    const cefrChips = [
      { key: "ALL", label: `Tất cả (${allTests.length})` },
      { key: "A12", label: `A1–A2 (${(dist.A1 || 0) + (dist.A2 || 0)})` },
      { key: "B12", label: `B1–B2 (${(dist.B1 || 0) + (dist.B2 || 0)})` },
      { key: "C12", label: `C1–C2 (${(dist.C1 || 0) + (dist.C2 || 0)})` },
      { key: "A1", label: `A1 (${dist.A1 || 0})` },
      { key: "A2", label: `A2 (${dist.A2 || 0})` },
      { key: "B1", label: `B1 (${dist.B1 || 0})` },
      { key: "B2", label: `B2 (${dist.B2 || 0})` },
      { key: "C1", label: `C1 (${dist.C1 || 0})` },
      { key: "C2", label: `C2 (${dist.C2 || 0})` }
    ];

    return `
      <div class="mat-section">
        ${
          activePathway
            ? `
          <div class="mat-pathway-panel">
            <div class="mat-pathway-head">
              <div>
                <h2 class="mat-section-h2">Lộ trình Học &amp; Luyện Đề theo Trình độ CEFR</h2>
                <p class="mat-section-desc">Chọn nhóm trình độ hiện tại để xem sách Hackers phù hợp và bộ đề nên làm theo đúng thứ tự từ dễ đến khó.</p>
              </div>
              <div class="cham-chips">
                ${pathways
                  .map(
                    (pw) => `
                  <button type="button" class="cham-chip ${pw.group === activePathway.group ? "is-active" : ""}" data-pathway-group="${esc(pw.group)}">
                    ${esc(pw.badge)}
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>

            <div class="mat-pathway-body">
              <div class="mat-pathway-info">
                <div class="mat-pathway-goal">Mục tiêu: <strong>${esc(activePathway.goal)}</strong></div>
                <p class="mat-pathway-profile">${esc(activePathway.profile)}</p>
                <ul class="mat-pathway-steps" style="list-style: none; padding-left: 0;">
                  ${(activePathway.studyPlan || []).map((st) => `<li>${esc(st)}</li>`).join("")}
                </ul>
              </div>
              <div class="mat-pathway-targets">
                <div class="mat-rec-label">Đề ưu tiên làm trước trong nhóm này:</div>
                <div class="mat-pathway-test-btns">
                  ${(activePathway.targetTests || [])
                    .map((slug) => {
                      const meta = diff.chamTests?.[slug];
                      return `
                      <button type="button" class="cham-btn cham-btn-primary" data-launch-type="cham" data-launch-id="${esc(slug)}">
                        <span>${esc(meta?.title || slug)}</span>
                        ${meta?.cefr ? `<span class="cefr-badge cefr-sm ${getCefrToneClass(meta.cefr)}">${esc(meta.cefr)}</span>` : ""}
                        ${MAT_SVG.arrowRight}
                      </button>
                    `;
                    })
                    .join("")}
                </div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <div class="mat-filter-strip">
          <div class="mat-search-wrap">
            ${MAT_SVG.search}
            <input
              type="search"
              id="mat-matrix-search"
              class="mat-search-input"
              placeholder="Lọc nhanh tên bộ đề (vd: ETS 2026, Hackers, Part 7, TEST ĐẦU VÀO)..."
              value="${esc(state.matrixSearch)}"
            />
          </div>
          <div class="cham-chips">
            <button type="button" class="cham-chip ${state.matrixSource === "ALL" ? "is-active" : ""}" data-matrix-source="ALL">Tất cả (${allTests.length})</button>
            <button type="button" class="cham-chip ${state.matrixSource === "FULL" ? "is-active" : ""}" data-matrix-source="FULL">Full Test (${fullCnt})</button>
            <button type="button" class="cham-chip ${state.matrixSource === "MINI" ? "is-active" : ""}" data-matrix-source="MINI">Mini Test (${miniCnt})</button>
            <button type="button" class="cham-chip ${state.matrixSource === "PART" ? "is-active" : ""}" data-matrix-source="PART">Đề lẻ (${partCnt})</button>
            <button type="button" class="cham-chip ${state.matrixSource === "STUDIO" ? "is-active" : ""}" data-matrix-source="STUDIO">Studio (${studioCnt})</button>
          </div>
          <select id="mat-matrix-sort" class="mat-select" aria-label="Sắp xếp độ khó">
            <option value="DIFF_ASC" ${state.matrixSort === "DIFF_ASC" ? "selected" : ""}>Sắp xếp: Dễ → Khó</option>
            <option value="DIFF_DESC" ${state.matrixSort === "DIFF_DESC" ? "selected" : ""}>Sắp xếp: Khó → Dễ</option>
            <option value="TITLE_ASC" ${state.matrixSort === "TITLE_ASC" ? "selected" : ""}>Tên đề A → Z</option>
          </select>
        </div>

        <div class="mat-cefr-pills-row">
          ${cefrChips
            .map(
              (c) => `
            <button type="button" class="cham-chip ${state.matrixCefr === c.key ? "is-active" : ""}" data-matrix-cefr="${esc(c.key)}">
              ${esc(c.label)}
            </button>
          `
            )
            .join("")}
        </div>

        <div class="mat-para-table-wrap">
          <table class="mat-para-table mat-matrix-table">
            <thead>
              <tr>
                <th>Bộ đề &amp; Nguồn</th>
                <th>Thang CEFR</th>
                <th>Điểm khó (/100)</th>
                <th>Nghe · Đọc</th>
                <th>Chỉ số Suy luận &amp; Từ học thuật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? (state.matrixShowAll ? filtered : filtered.slice(0, 40))
                      .map((item) => {
                        const m = item.metrics || {};
                        const score = Math.round(item.difficultyScore || 50);
                        return `
                  <tr>
                    <td>
                      <div class="mat-matrix-title">${esc(item.title)}</div>
                      <div class="mat-matrix-sub">${esc(item.sourceLabel)} · ${item.totalQ} câu</div>
                    </td>
                    <td>
                      <div class="mat-para-tags">
                        <span class="cefr-badge ${getCefrToneClass(item.cefr)}">${esc(item.cefr)}</span>
                        <span class="mat-band-label">${esc(item.toeicBand)}đ</span>
                      </div>
                    </td>
                    <td>
                      <div class="mat-diff-meter">
                        <div class="mat-diff-bar"><span style="width: ${score}%"></span></div>
                        <strong>${score}/100</strong>
                      </div>
                    </td>
                    <td class="mat-lcrc-cell">
                      <span>LC: <strong>${esc(item.lcCefr || "—")}</strong></span>
                      <span>RC: <strong>${esc(item.rcCefr || "—")}</strong></span>
                    </td>
                    <td class="mat-metrics-cell">
                      <span>Từ vựng C1+: ${m.lexicalPct ?? 0}%</span>
                      <span>Suy luận: ${m.inferenceCount ?? 0}</span>
                      <span>Bẫy P2/NOT: ${(m.trapP2Count ?? 0) + (m.negativeCount ?? 0)}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="cham-btn cham-btn-primary"
                        data-launch-type="${esc(item.type)}"
                        data-launch-id="${esc(item.refId)}"
                      >
                        Mở đề ${MAT_SVG.arrowRight}
                      </button>
                    </td>
                  </tr>
                `;
                      })
                      .join("")
                  : `
                <tr>
                  <td colspan="6" class="mat-empty-row">Không có bộ đề nào khớp bộ lọc CEFR hiện tại.</td>
                </tr>
              `
              }
            </tbody>
          </table>
          ${filtered.length > 40 ? `
            <div style="display: flex; justify-content: center; padding: 12px; border-top: 1px solid var(--border);">
              <button type="button" class="cham-btn" id="mat-matrix-showall-btn">
                ${state.matrixShowAll ? "Thu gọn (hiển thị 40 đề đầu)" : `Xem toàn bộ ${filtered.length} đề thi`}
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  function render(opts = {}) {
    if (!state.isOpen) return;
    const prevY = window.scrollY;
    let bodyHTML = "";
    if (state.activeTab === "books") bodyHTML = renderBooksTabHTML();
    else if (state.activeTab === "grammar") bodyHTML = renderGrammarTabHTML();
    else if (state.activeTab === "paraphrase") bodyHTML = renderParaphraseTabHTML();
    else if (state.activeTab === "vocab") bodyHTML = renderVocabTabHTML();
    else if (state.activeTab === "matrix") bodyHTML = renderMatrixTabHTML();

    root.innerHTML = `
      <div class="v21-container">
        ${renderHeroAndKpisHTML()}
        ${renderTabsHTML()}
        ${bodyHTML}
      </div>
    `;
    bindEvents();
    if (opts.scrollTop) {
      window.scrollTo({ top: 0, behavior: "instant" });
    } else if (prevY > 0) {
      window.scrollTo({ top: prevY, behavior: "instant" });
    }
  }

  function bindEvents() {
    root.querySelector("#mat-brand-logo")?.addEventListener("click", () => {
      close();
      options.onBackToStudio?.();
    });
    root.querySelector("#mat-nav-cham-btn")?.addEventListener("click", () => {
      close();
      options.onOpenChamHub?.();
    });
    root.querySelector("#mat-nav-studio-btn")?.addEventListener("click", () => {
      close();
      options.onBackToStudio?.();
    });
    root.querySelector("#mat-back-studio-btn")?.addEventListener("click", () => {
      close();
      options.onBackToStudio?.();
    });

    root.querySelector("#mat-vocab-btn")?.addEventListener("click", () => document.getElementById("open-vocab-btn")?.click());
    root.querySelector("#mat-analytics-btn")?.addEventListener("click", () => document.getElementById("open-analytics-btn")?.click());
    root.querySelector("#mat-strategy-btn")?.addEventListener("click", () => document.getElementById("open-strategy-btn")?.click());
    root.querySelector("#mat-reader-btn")?.addEventListener("click", () => document.getElementById("reader-settings-btn")?.click());
    root.querySelector("#mat-theme-toggle")?.addEventListener("click", () => document.getElementById("theme-toggle")?.click());
    root.querySelector("#mat-open-srs-modal-btn")?.addEventListener("click", () => document.getElementById("open-vocab-btn")?.click());

    root.querySelectorAll("[data-mat-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-mat-tab")));
    });
    root.querySelectorAll("[data-mat-switch-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-mat-switch-tab")));
    });
    root.querySelectorAll("[data-mat-jump-test]").forEach((btn) => {
      btn.addEventListener("click", () => launchTestRef("cham", btn.getAttribute("data-mat-jump-test")));
    });

    // Books
    root.querySelectorAll("[data-book-cefr]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.bookCefrFilter = btn.getAttribute("data-book-cefr");
        render();
      });
    });
    root.querySelectorAll("[data-open-book]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bid = btn.getAttribute("data-open-book");
        if (bid) {
          state.selectedBookId = bid;
          state.expandedChapters[`${bid}:0`] = true;
          render({ scrollTop: true });
        }
      });
    });
    root.querySelectorAll(".v21-book-card[data-book-id]").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button, a")) return;
        const bid = card.getAttribute("data-book-id");
        if (bid) {
          state.selectedBookId = bid;
          state.expandedChapters[`${bid}:0`] = true;
          render({ scrollTop: true });
        }
      });
    });
    root.querySelector("#mat-book-back-btn")?.addEventListener("click", () => {
      state.selectedBookId = null;
      render({ scrollTop: true });
    });
    root.querySelectorAll("[data-toggle-chapter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-toggle-chapter");
        state.expandedChapters[key] = !state.expandedChapters[key];
        render();
      });
    });
    root.querySelectorAll("[data-launch-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        launchTestRef(btn.getAttribute("data-launch-type"), btn.getAttribute("data-launch-id"));
      });
    });

    // Grammar interactive quiz
    root.querySelectorAll("[data-quiz-answer-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-quiz-answer-key");
        const choice = btn.getAttribute("data-quiz-choice");
        state.quizAnswers[key] = choice;
        savePersistedGrammarQuiz(state.quizAnswers);
        render();
      });
    });
    root.querySelector("#mat-reset-grammar-quiz")?.addEventListener("click", () => {
      state.quizAnswers = {};
      savePersistedGrammarQuiz(state.quizAnswers);
      render();
    });

    // Paraphrase filters & search
    const paraInput = root.querySelector("#mat-para-search");
    if (paraInput) {
      let paraComposing = false;
      const applyParaSearch = () => {
        const caret = paraInput.selectionStart;
        state.paraSearch = paraInput.value;
        render();
        const fresh = root.querySelector("#mat-para-search");
        if (fresh) {
          fresh.focus();
          try {
            fresh.setSelectionRange(caret, caret);
          } catch {}
        }
      };
      paraInput.addEventListener("compositionstart", () => { paraComposing = true; });
      paraInput.addEventListener("compositionend", () => { paraComposing = false; applyParaSearch(); });
      paraInput.addEventListener("input", (e) => {
        if (e.isComposing || paraComposing) return;
        applyParaSearch();
      });
    }
    root.querySelectorAll("[data-para-part]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.paraPart = btn.getAttribute("data-para-part");
        render();
      });
    });
    root.querySelectorAll("[data-para-cefr]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.paraCefr = btn.getAttribute("data-para-cefr");
        render();
      });
    });

    // TTS buttons
    root.querySelectorAll("[data-speak-text]").forEach((btn) => {
      btn.addEventListener("click", () => speakEnglish(btn.getAttribute("data-speak-text")));
    });

    // Vocab SM-2 pinning
    const data = getData();
    const srs = window.__app?.vocabSRS;
    root.querySelectorAll("[data-pin-vocab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!srs?.addCard) return;
        const [mIdx, wIdx] = btn.getAttribute("data-pin-vocab").split(":").map(Number);
        const mod = data.vocabModules?.[mIdx];
        const w = mod?.words?.[wIdx];
        if (!w) return;
        await srs.addCard({
          word: w.word,
          translation: w.vi,
          ipa: w.ipa,
          type: w.pos,
          pos: w.pos,
          example: w.example,
          context: w.example,
          category: mod.topic,
          talkRange: "Hackers 30 Days"
        });
        window.__app?.showToast?.(`Đã ghim "${w.word}" vào bộ Flashcard SM-2`, "success");
        render();
      });
    });

    root.querySelectorAll("[data-pin-module]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!srs?.addCard) return;
        const mIdx = Number(btn.getAttribute("data-pin-module"));
        const mod = data.vocabModules?.[mIdx];
        if (!mod?.words) return;
        for (const w of mod.words) {
          await srs.addCard({
            word: w.word,
            translation: w.vi,
            ipa: w.ipa,
            type: w.pos,
            pos: w.pos,
            example: w.example,
            context: w.example,
            category: mod.topic,
            talkRange: "Hackers 30 Days"
          });
        }
        window.__app?.showToast?.(`Đã ghim ${mod.words.length} từ chủ đề "${mod.topic}" vào SM-2`, "success");
        render();
      });
    });

    // Matrix & Pathways
    root.querySelectorAll("[data-pathway-group]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.pathwayGroup = btn.getAttribute("data-pathway-group");
        render();
      });
    });
    const matrixInput = root.querySelector("#mat-matrix-search");
    if (matrixInput) {
      let matrixComposing = false;
      const applyMatrixSearch = () => {
        const caret = matrixInput.selectionStart;
        state.matrixSearch = matrixInput.value;
        render();
        const fresh = root.querySelector("#mat-matrix-search");
        if (fresh) {
          fresh.focus();
          try {
            fresh.setSelectionRange(caret, caret);
          } catch {}
        }
      };
      matrixInput.addEventListener("compositionstart", () => { matrixComposing = true; });
      matrixInput.addEventListener("compositionend", () => { matrixComposing = false; applyMatrixSearch(); });
      matrixInput.addEventListener("input", (e) => {
        if (e.isComposing || matrixComposing) return;
        applyMatrixSearch();
      });
    }
    root.querySelectorAll("[data-matrix-source]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.matrixSource = btn.getAttribute("data-matrix-source");
        render();
      });
    });
    root.querySelectorAll("[data-matrix-cefr]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.matrixCefr = btn.getAttribute("data-matrix-cefr");
        render();
      });
    });
    root.querySelector("#mat-matrix-sort")?.addEventListener("change", (e) => {
      state.matrixSort = e.target.value;
      render();
    });
    root.querySelector("#mat-matrix-showall-btn")?.addEventListener("click", () => {
      state.matrixShowAll = !state.matrixShowAll;
      render();
    });
  }

  function mountMatrixInto(containerEl, onLaunchCb) {
    if (!containerEl) return;
    const renderInside = () => {
      containerEl.innerHTML = renderMatrixTabHTML();
      containerEl.querySelectorAll("[data-pathway-group]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.pathwayGroup = btn.getAttribute("data-pathway-group");
          renderInside();
        });
      });
      const mInput = containerEl.querySelector("#mat-matrix-search");
      if (mInput) {
        let composing = false;
        const applyM = () => {
          const caret = mInput.selectionStart;
          state.matrixSearch = mInput.value;
          renderInside();
          const fresh = containerEl.querySelector("#mat-matrix-search");
          if (fresh) {
            fresh.focus();
            try { fresh.setSelectionRange(caret, caret); } catch {}
          }
        };
        mInput.addEventListener("compositionstart", () => { composing = true; });
        mInput.addEventListener("compositionend", () => { composing = false; applyM(); });
        mInput.addEventListener("input", (e) => {
          if (e.isComposing || composing) return;
          applyM();
        });
      }
      containerEl.querySelectorAll("[data-matrix-source]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.matrixSource = btn.getAttribute("data-matrix-source");
          renderInside();
        });
      });
      containerEl.querySelectorAll("[data-matrix-cefr]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.matrixCefr = btn.getAttribute("data-matrix-cefr");
          renderInside();
        });
      });
      containerEl.querySelector("#mat-matrix-sort")?.addEventListener("change", (e) => {
        state.matrixSort = e.target.value;
        renderInside();
      });
      containerEl.querySelector("#mat-matrix-showall-btn")?.addEventListener("click", () => {
        state.matrixShowAll = !state.matrixShowAll;
        renderInside();
      });
      containerEl.querySelectorAll("[data-launch-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
          onLaunchCb?.();
          launchTestRef(btn.getAttribute("data-launch-type"), btn.getAttribute("data-launch-id"));
        });
      });
    };
    renderInside();
  }

  return {
    open,
    close,
    setTab,
    render,
    mountMatrixInto,
    reloadQuizAnswers() {
      state.quizAnswers = loadPersistedGrammarQuiz();
      if (state.isOpen && state.activeTab === "grammar") render();
    },
    isActive: () => state.isOpen
  };
}
