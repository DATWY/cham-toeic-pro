/**
 * Neuro-TOEIC Studio Pro — Commercial-Grade SM-2 Flashcard & Active Recall Studio
 * Modes:
 *   1. SM-2 Spaced Repetition 3D Flashcards (Again / Hard / Good / Easy)
 *   2. Quiz 4 Đáp Án (Speed Recall — EN->VI & VI->EN with Streak Telemetry)
 *   3. Curated 760+ ETS Vocabulary Library (IPA + Native US TTS + Category Filter)
 */

import { getAllFlashcards, saveFlashcard } from "./idb.js";
import { getIcon } from "./uiIcons.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(str) {
  return String(str ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class VocabSRS {
  constructor(tests = []) {
    this.tests = Array.isArray(tests) ? tests : [];
    this.audioEl = new Audio();
    this.cards = [];
    this.currentIndex = 0;
    this.isFlipped = false;

    // Studio UI State
    this.activeTab = "srs"; // 'srs' | 'quiz' | 'library'
    this.searchQuery = "";
    this.selectedCategory = "all";
    this.practiceAllWhenDone = false;
    this.libraryLimit = 60;

    // Speed Recall Quiz State
    this.quizDirection = "en2vi"; // 'en2vi' | 'vi2en'
    this.quizAutoSpeak = false;
    this.quizQuestion = null;
    this.quizStats = {
      answered: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0
    };
    this._recentQuizWords = [];

    // Internal observer/listener guards
    this._boundKeyHandler = null;
    this._dialogObserver = null;
    this._isUpgradingDom = false;
  }

  _buildVocabLookup() {
    const bank = (typeof window !== "undefined" && window.TOEIC_VOCAB_BANK) || [];
    const lookup = new Map();
    bank.forEach((entry) => {
      if (entry && entry.word) {
        lookup.set(entry.word.trim().toLowerCase(), entry);
      }
    });
    return lookup;
  }

  _inferTalkCategory(talk, isReadingTest = false) {
    if (talk?.isReading || isReadingTest) return "Part 7 Business Reading";
    const t = normalizeText(talk?.type || "");
    if (t.includes("contract") || t.includes("hợp đồng") || t.includes("policy")) {
      return "Contracts & Negotiations";
    }
    if (t.includes("ad") || t.includes("quảng cáo") || t.includes("promo") || t.includes("sale") || t.includes("tiếp thị")) {
      return "Marketing & Sales";
    }
    if (t.includes("budget") || t.includes("finance") || t.includes("ngân sách") || t.includes("bank")) {
      return "Finance & Budgeting";
    }
    if (t.includes("travel") || t.includes("tour") || t.includes("flight") || t.includes("train") || t.includes("giao thông") || t.includes("lịch trình")) {
      return "Travel & Logistics";
    }
    if (t.includes("factory") || t.includes("nhà máy") || t.includes("sản xuất") || t.includes("product")) {
      return "Manufacturing & QC";
    }
    return "HR & Office Operations";
  }

  _enrichCardMetadata(card, vocabLookup = null) {
    if (!card || !card.word) return card;
    const lookup = vocabLookup || this._buildVocabLookup();
    const match = lookup.get(card.word.trim().toLowerCase());
    if (match) {
      if (!card.ipa && match.ipa) card.ipa = match.ipa;
      if (!card.type && match.type) card.type = match.type;
      if (!card.category && match.category) card.category = match.category;
      if (!card.topic && match.topic) card.topic = match.topic;
      if ((!card.context || card.context === "Business Vocabulary") && match.example) {
        card.context = match.example;
      }
      if (!card.translation && match.translation) {
        card.translation = match.translation;
      }
    }
    if (!card.category) {
      card.category =
        card.talkRange === "Library" ? "Part 7 Business Reading" : "HR & Office Operations";
    }
    return card;
  }

  _buildDefaultCardsMap(vocabLookup, initialMap = null) {
    const map = initialMap || new Map();
    const extraTests =
      (typeof window !== "undefined" && Array.isArray(window.TOEIC_PART56_TESTS)
        ? window.TOEIC_PART56_TESTS
        : []);
    const allTests = [...this.tests, ...extraTests];

    allTests.forEach((t) => {
      const isReadingTest = Boolean(t?.isReading || t?.part === 7 || t?.part === 5 || t?.part === 6);
      (t?.talks || []).forEach((talk) => {
        (talk?.vocab || []).forEach((v) => {
          const idxColon = v.indexOf(":");
          const word = (idxColon >= 0 ? v.slice(0, idxColon) : v).trim();
          const translation = idxColon >= 0 ? v.slice(idxColon + 1).trim() : "";
          if (!word) return;
          const key = word.toLowerCase();

          if (!map.has(key)) {
            let context = "";
            let start = 0;
            let end = 0;

            if (Array.isArray(talk.segments)) {
              const seg = talk.segments.find((s) => {
                const segText = s.t || s.text || "";
                return segText.toLowerCase().includes(key);
              });
              if (seg) {
                context = seg.t || seg.text || "";
                start = seg.s || 0;
                end = seg.e || 0;
              }
            }
            if (!context && Array.isArray(talk.passages)) {
              for (const doc of talk.passages) {
                const hitPara = (doc.paragraphs || []).find((p) =>
                  p.text?.toLowerCase().includes(key)
                );
                if (hitPara) {
                  context = hitPara.text;
                  break;
                }
                const hitMsg = (doc.messages || []).find((m) =>
                  m.text?.toLowerCase().includes(key)
                );
                if (hitMsg) {
                  context = hitMsg.text;
                  break;
                }
              }
            }
            if (!context && talk.transcript) {
              context =
                talk.transcript
                  .replace(/<[^>]*>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 150) + "...";
            }

            const newCard = {
              id: `card_${word.replace(/\s+/g, "_")}`,
              word,
              translation,
              context: context || `Ngữ cảnh câu ${talk.range || "TOEIC"}`,
              audioUrl: talk.audio || null,
              start,
              end,
              talkRange: talk.range || "TOEIC",
              isTalkChunk: true,
              category: this._inferTalkCategory(talk, isReadingTest),
              repetitions: 0,
              interval: 1,
              easeFactor: 2.5,
              dueDate: Date.now()
            };
            this._enrichCardMetadata(newCard, vocabLookup);
            map.set(key, newCard);
          } else {
            const existing = map.get(key);
            if (talk.range && !existing.talkRange) existing.talkRange = talk.range;
            if (talk.range && existing.talkRange !== "Library") existing.isTalkChunk = true;
            this._enrichCardMetadata(existing, vocabLookup);
          }
        });
      });
    });

    return map;
  }

  init() {
    if (this._initPromise) return this._initPromise;

    const vocabLookup = this._buildVocabLookup();

    // Synchronous in-memory pre-seed so Studio & Flashcards are ready at 0ms without waiting on IndexedDB
    if (this.cards.length === 0) {
      const seedMap = this._buildDefaultCardsMap(vocabLookup);
      this.cards = Array.from(seedMap.values());
    }

    if (typeof document !== "undefined") {
      this._injectStudioStyles();
      this._installDialogBridge();
      this._installKeyboardShortcuts();
    }

    // Hydrate saved SM-2 review progress from IndexedDB asynchronously in background
    this._initPromise = (async () => {
      const saved = await getAllFlashcards();
      if (Array.isArray(saved) && saved.length > 0) {
        const currentByKey = new Map(
          this.cards.map((c) => [c.word.trim().toLowerCase(), c])
        );
        const mergedMap = new Map();

        const cardScore = (item) => {
          if (!item) return 0;
          return Number(item.updatedAt || item.lastReviewedAt || 0);
        };

        saved.forEach((c) => {
          if (c && c.word) {
            const k = c.word.trim().toLowerCase();
            if (!c.id) c.id = `card_${k.replace(/\s+/g, "_")}`;
            const inMem = currentByKey.get(k);
            const prevSaved = mergedMap.get(k);
            // Keep in-memory card if user already added/reviewed it before IDB finished hydrating
            if (inMem && cardScore(inMem) > 0 && cardScore(inMem) >= cardScore(c)) {
              mergedMap.set(k, inMem);
              return;
            }
            if (prevSaved) {
              const prevRevs = Number(prevSaved.totalReviews || prevSaved.repetitions || 0);
              const curRevs = Number(c.totalReviews || c.repetitions || 0);
              if (prevRevs > curRevs || (prevRevs === curRevs && cardScore(prevSaved) >= cardScore(c))) {
                return;
              }
            }
            this._enrichCardMetadata(c, vocabLookup);
            mergedMap.set(k, c);
          }
        });

        this.cards.forEach((c) => {
          const k = c.word.trim().toLowerCase();
          if (!mergedMap.has(k)) {
            mergedMap.set(k, c);
          } else {
            const existing = mergedMap.get(k);
            if (c.talkRange && !existing.talkRange) existing.talkRange = c.talkRange;
            if (c.isTalkChunk) existing.isTalkChunk = true;
            this._enrichCardMetadata(existing, vocabLookup);
          }
        });

        this.cards = Array.from(mergedMap.values());

        const dlg = typeof document !== "undefined" ? document.getElementById("vocab-dialog") : null;
        if (dlg && dlg.open && dlg.querySelector('[data-vsrs-studio="v2"]')) {
          this._refreshHeaderAndMastery(dlg);
          this._renderTabBody(dlg);
        }
      }
    })();

    return this._initPromise;
  }

  async addCard(card) {
    if (!card || !card.word) return;
    this._enrichCardMetadata(card);
    if (card.talkRange && card.talkRange !== "Library") {
      card.isTalkChunk = true;
    }

    const now = Date.now();
    const key = card.word.trim().toLowerCase();
    const fallbackId = `card_${key.replace(/\s+/g, "_")}`;
    const existing = this.cards.find((c) => c.word.trim().toLowerCase() === key);
    if (existing) {
      const keepId = existing.id || card.id || fallbackId;
      const keepReps = existing.repetitions || card.repetitions || 0;
      const keepInterval = (existing.repetitions || 0) > 0 ? existing.interval : (card.interval || existing.interval || 1);
      const keepEf = (existing.repetitions || 0) > 0 ? existing.easeFactor : (card.easeFactor || existing.easeFactor || 2.5);
      const keepLastRev = existing.lastReviewedAt || card.lastReviewedAt || undefined;
      const keepTotRev = existing.totalReviews || card.totalReviews || 0;
      Object.assign(existing, card, {
        id: keepId,
        repetitions: keepReps,
        interval: keepInterval,
        easeFactor: keepEf,
        totalReviews: keepTotRev,
        ...(keepLastRev ? { lastReviewedAt: keepLastRev } : {}),
        dueDate: now,
        updatedAt: now
      });
      this._enrichCardMetadata(existing);
      await saveFlashcard(existing);
    } else {
      const normalized = {
        id: card.id || fallbackId,
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        dueDate: now,
        updatedAt: now,
        ...card
      };
      if (!normalized.id) normalized.id = fallbackId;
      normalized.updatedAt = now;
      this.cards.unshift(normalized);
      await saveFlashcard(normalized);
    }

    // Live-refresh modal stats if open
    const dlg = typeof document !== "undefined" ? document.getElementById("vocab-dialog") : null;
    if (dlg && dlg.open && dlg.querySelector('[data-vsrs-studio="v2"]')) {
      this._refreshHeaderAndMastery(dlg);
    }
  }

  hasWord(word) {
    const key = String(word ?? "").trim().toLowerCase();
    return this.cards.some((c) => c.word.trim().toLowerCase() === key);
  }

  getDueCards() {
    const now = Date.now();
    return this.cards.filter((c) => (c.dueDate || 0) <= now);
  }

  _matchesFilter(item, queryNorm, category) {
    if (queryNorm) {
      const hay = normalizeText(
        `${item.word || ""} ${item.translation || ""} ${item.context || ""} ${item.example || ""} ${item.ipa || ""} ${item.category || ""} ${item.topic || ""}`
      );
      if (!hay.includes(queryNorm)) return false;
    }
    if (!category || category === "all") return true;
    if (category === "talk_chunks") {
      return Boolean(item.isTalkChunk || (item.talkRange && item.talkRange !== "Library"));
    }
    const catNorm = normalizeText(category);
    const itemCat = normalizeText(item.category || "");
    const itemTopic = normalizeText(item.topic || "");
    return itemCat.includes(catNorm) || itemTopic.includes(catNorm);
  }

  getFilteredCards() {
    const q = normalizeText(this.searchQuery);
    return this.cards.filter((c) => this._matchesFilter(c, q, this.selectedCategory));
  }

  getFilteredDueCards() {
    const now = Date.now();
    return this.getFilteredCards().filter((c) => (c.dueDate || 0) <= now);
  }

  getCurrentCard() {
    const hasFilter = Boolean(this.searchQuery.trim()) || this.selectedCategory !== "all";
    const due = hasFilter ? this.getFilteredDueCards() : this.getDueCards();
    if (due.length > 0) {
      return due[this.currentIndex % due.length];
    }
    const pool = hasFilter ? this.getFilteredCards() : this.cards;
    if (!pool.length) return null;
    if (this.practiceAllWhenDone || hasFilter || this.getDueCards().length === 0) {
      return pool[this.currentIndex % pool.length] || null;
    }
    return null;
  }

  getMasteryBreakdown() {
    const now = Date.now();
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let dueToday = 0;

    this.cards.forEach((c) => {
      const reps = c.repetitions || 0;
      const ivl = c.interval || 0;
      const reviewed = Boolean(c.lastReviewedAt) || reps > 0;

      if ((c.dueDate || 0) <= now) dueToday++;

      if (!reviewed && reps === 0) {
        newCount++;
      } else if (reps >= 2 && ivl >= 7) {
        masteredCount++;
      } else {
        learningCount++;
      }
    });

    const total = Math.max(1, this.cards.length);
    return {
      total: this.cards.length,
      newCount,
      learningCount,
      masteredCount,
      dueToday,
      newPct: Math.round((newCount / total) * 100),
      learningPct: Math.round((learningCount / total) * 100),
      masteredPct: Math.round((masteredCount / total) * 100)
    };
  }

  getPreviewIntervals(card) {
    if (!card) {
      return { 0: "< 10 phút", 1: "1 ngày", 2: "4 ngày", 3: "6 ngày" };
    }
    const reps = card.repetitions || 0;
    const ivl = card.interval || 1;
    const ef = card.easeFactor || 2.5;

    const fmtDays = (d) => {
      if (d < 1) return "< 10 phút";
      if (d === 1) return "1 ngày";
      if (d >= 30) return `${(d / 30).toFixed(1).replace(/\.0$/, "")} tháng`;
      return `${d} ngày`;
    };

    const calcDays = (q) => {
      if (q === 0) return 0.01;
      if (reps === 0) return q === 3 ? 3 : 1;
      if (reps === 1) return q === 3 ? 6 : q === 1 ? 2 : 4;
      const qEf = q === 1 ? Math.max(1.3, ef - 0.15) : q === 3 ? ef + 0.15 : ef;
      return Math.max(1, Math.round(ivl * qEf));
    };

    return {
      0: fmtDays(calcDays(0)),
      1: fmtDays(calcDays(1)),
      2: fmtDays(calcDays(2)),
      3: fmtDays(calcDays(3))
    };
  }

  /**
   * SM-2 Spaced Repetition Calculation
   * @param {object} card
   * @param {number} quality 0: Again, 1: Hard, 2: Good, 3: Easy
   */
  async reviewCard(card, quality) {
    if (!card) return;
    let { repetitions = 0, interval = 1, easeFactor = 2.5 } = card;

    if (quality === 0) {
      repetitions = 0;
      interval = 0.01; // ~15 mins
    } else {
      if (repetitions === 0) interval = quality === 3 ? 3 : 1;
      else if (repetitions === 1) interval = quality === 3 ? 6 : quality === 1 ? 2 : 4;
      else interval = Math.max(1, Math.round(interval * easeFactor));

      repetitions++;
      if (quality === 1) easeFactor = Math.max(1.3, easeFactor - 0.15);
      if (quality === 3) easeFactor += 0.15;
    }

    const now = Date.now();
    if (!card.id && card.word) {
      card.id = `card_${card.word.trim().toLowerCase().replace(/\s+/g, "_")}`;
    }
    card.repetitions = repetitions;
    card.interval = interval;
    card.easeFactor = easeFactor;
    card.lastReviewedAt = now;
    card.updatedAt = now;
    card.totalReviews = (card.totalReviews || 0) + 1;
    card.dueDate = now + Math.round(interval * 86400 * 1000);

    await saveFlashcard(card);
    this.currentIndex++;
    this.isFlipped = false;
  }

  /**
   * Speak English text via Web Speech API (en-US)
   */
  speakTTS(text, rate = 0.94) {
    const clean = String(text ?? "").trim();
    if (!clean || typeof window === "undefined") return false;
    try {
      if (!this.audioEl.paused) {
        this.audioEl.pause();
      }
      if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = "en-US";
        utter.rate = rate;
        const voices = window.speechSynthesis.getVoices?.() || [];
        const usVoice =
          voices.find((v) => /en[-_]US/i.test(v.lang) && /Google|Natural|Aria|Jenny|Guy|Samantha/i.test(v.name)) ||
          voices.find((v) => /en[-_]US/i.test(v.lang)) ||
          voices.find((v) => /^en/i.test(v.lang));
        if (usVoice) utter.voice = usVoice;
        window.speechSynthesis.speak(utter);
        return true;
      }
    } catch (_) {}
    return false;
  }

  playCardAudio(card) {
    if (!card) return;
    if (!card.audioUrl) {
      this.speakTTS(card.word);
      return;
    }
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}

    this.audioEl.src = card.audioUrl;
    this.audioEl.currentTime = Math.max(0, (card.start || 0) - 0.1);
    this.audioEl.play().catch(() => {
      this.speakTTS(card.word);
    });

    if (card.end && card.end > card.start) {
      const stopHandler = () => {
        if (this.audioEl.currentTime >= card.end + 0.2) {
          this.audioEl.pause();
          this.audioEl.removeEventListener("timeupdate", stopHandler);
        }
      };
      this.audioEl.addEventListener("timeupdate", stopHandler);
    }
  }

  /* ============================================================
     Speed Recall 4-Choice Quiz Generator
     ============================================================ */
  _getQuizPool() {
    const bank = (typeof window !== "undefined" && window.TOEIC_VOCAB_BANK) || [];
    const qNorm = normalizeText(this.searchQuery);
    const cat = this.selectedCategory;

    const mergedMap = new Map();

    // Include SRS cards first (so user's pinned/talk chunks are practiced)
    this.cards.forEach((c) => {
      if (c.word && c.translation) {
        const k = c.word.trim().toLowerCase();
        mergedMap.set(k, {
          word: c.word.trim(),
          translation: c.translation.trim(),
          ipa: c.ipa || "",
          type: c.type || "phrase",
          category: c.category || "HR & Office Operations",
          topic: c.topic || "",
          example: c.context || c.example || "",
          isTalkChunk: Boolean(c.isTalkChunk || (c.talkRange && c.talkRange !== "Library")),
          talkRange: c.talkRange || "",
          srsCard: c
        });
      }
    });

    // Include curated TOEIC_VOCAB_BANK
    bank.forEach((item) => {
      if (!item?.word || !item?.translation) return;
      const k = item.word.trim().toLowerCase();
      if (!mergedMap.has(k)) {
        mergedMap.set(k, {
          word: item.word.trim(),
          translation: item.translation.trim(),
          ipa: item.ipa || "",
          type: item.type || "vocab",
          category: item.category || "Part 7 Business Reading",
          topic: item.topic || "",
          example: item.example || "",
          isTalkChunk: false,
          talkRange: "",
          srsCard: null
        });
      } else {
        const existing = mergedMap.get(k);
        if (!existing.ipa && item.ipa) existing.ipa = item.ipa;
        if (!existing.type || existing.type === "phrase") existing.type = item.type || existing.type;
        if (!existing.example && item.example) existing.example = item.example;
      }
    });

    const allItems = Array.from(mergedMap.values());
    const filtered = allItems.filter((it) => this._matchesFilter(it, qNorm, cat));
    return { filtered, allItems };
  }

  generateQuizQuestion() {
    const { filtered, allItems } = this._getQuizPool();
    if (filtered.length === 0 || allItems.length < 4) {
      this.quizQuestion = null;
      return null;
    }

    // Prioritize items not asked in the last 8 questions & due SRS items
    const nonRecent = filtered.filter(
      (it) => !this._recentQuizWords.includes(it.word.toLowerCase())
    );
    const candidatePool = nonRecent.length > 0 ? nonRecent : filtered;

    // Weight due SRS cards slightly higher for Active Recall efficiency
    const dueCandidates = candidatePool.filter(
      (it) => it.srsCard && (it.srsCard.dueDate || 0) <= Date.now()
    );
    const targetPool =
      dueCandidates.length > 0 && Math.random() < 0.55 ? dueCandidates : candidatePool;

    const target = targetPool[Math.floor(Math.random() * targetPool.length)];
    this._recentQuizWords.push(target.word.toLowerCase());
    if (this._recentQuizWords.length > 10) this._recentQuizWords.shift();

    // Select 3 distinct distractors, preferring same POS & category
    const distractorCandidates = allItems.filter(
      (it) =>
        it.word.toLowerCase() !== target.word.toLowerCase() &&
        it.translation.toLowerCase() !== target.translation.toLowerCase()
    );

    const samePosCat = distractorCandidates.filter(
      (it) => it.type === target.type && it.category === target.category
    );
    const samePos = distractorCandidates.filter((it) => it.type === target.type);

    const pickPool =
      samePosCat.length >= 6
        ? samePosCat
        : samePos.length >= 6
          ? samePos
          : distractorCandidates;

    const shuffled = [...pickPool].sort(() => Math.random() - 0.5);
    const distractors = [];
    const usedMeanings = new Set([target.translation.toLowerCase()]);
    const usedWords = new Set([target.word.toLowerCase()]);

    for (const d of shuffled) {
      const mLow = d.translation.toLowerCase();
      const wLow = d.word.toLowerCase();
      if (!usedMeanings.has(mLow) && !usedWords.has(wLow)) {
        distractors.push(d);
        usedMeanings.add(mLow);
        usedWords.add(wLow);
      }
      if (distractors.length === 3) break;
    }

    // Fallback if pickPool was narrow
    if (distractors.length < 3) {
      for (const d of distractorCandidates) {
        const mLow = d.translation.toLowerCase();
        const wLow = d.word.toLowerCase();
        if (!usedMeanings.has(mLow) && !usedWords.has(wLow)) {
          distractors.push(d);
          usedMeanings.add(mLow);
          usedWords.add(wLow);
        }
        if (distractors.length === 3) break;
      }
    }

    const rawOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = rawOptions.findIndex(
      (o) => o.word.toLowerCase() === target.word.toLowerCase()
    );

    this.quizQuestion = {
      target,
      options: rawOptions,
      correctIndex,
      selectedIndex: null,
      answered: false
    };

    if (this.quizAutoSpeak && this.quizDirection === "en2vi") {
      this.speakTTS(target.word);
    }

    return this.quizQuestion;
  }

  async answerQuizQuestion(choiceIdx) {
    if (!this.quizQuestion || this.quizQuestion.answered) return;
    if (choiceIdx < 0 || choiceIdx >= this.quizQuestion.options.length) return;

    this.quizQuestion.selectedIndex = choiceIdx;
    this.quizQuestion.answered = true;
    this.quizStats.answered++;

    const isCorrect = choiceIdx === this.quizQuestion.correctIndex;
    if (isCorrect) {
      this.quizStats.correct++;
      this.quizStats.streak++;
      if (this.quizStats.streak > this.quizStats.bestStreak) {
        this.quizStats.bestStreak = this.quizStats.streak;
      }
    } else {
      this.quizStats.streak = 0;
    }

    // Sync active recall outcome with SM-2 if word is in SRS deck
    const srsCard =
      this.quizQuestion.target.srsCard ||
      this.cards.find(
        (c) => c.word.trim().toLowerCase() === this.quizQuestion.target.word.toLowerCase()
      );
    if (srsCard) {
      await this.reviewCard(srsCard, isCorrect ? 2 : 0);
    }
  }

  /* ============================================================
     Commercial-Grade Modal UI & Progressive DOM Bridge
     ============================================================ */
  _injectStudioStyles() {
    if (document.getElementById("vocab-srs-studio-styles")) return;
    const style = document.createElement("style");
    style.id = "vocab-srs-studio-styles";
    style.textContent = `
      #vocab-dialog .vsrs-studio-shell {
        width: min(880px, calc(100vw - 20px));
        max-width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        background: var(--surface);
        color: var(--text);
        box-sizing: border-box;
      }
      .vsrs-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border);
        background: var(--surface-2);
      }
      .vsrs-head-title {
        margin: 0;
        font-size: 1.12rem;
        font-weight: 600;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .vsrs-head-sub {
        font-size: 0.79rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .vsrs-mastery-strip {
        padding: 10px 20px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .vsrs-mastery-pills {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .vsrs-stat-pill {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 6px 10px;
        border-radius: var(--radius-sm);
        background: var(--surface-2);
        border: 1px solid var(--border);
        font-size: 0.76rem;
        color: var(--text-muted);
      }
      .vsrs-stat-pill strong {
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text);
      }
      .vsrs-stat-pill.is-due strong { color: var(--bad); }
      .vsrs-stat-pill.is-mastered strong { color: var(--ok); }
      .vsrs-stat-pill.is-learning strong { color: var(--warn); }
      .vsrs-stat-pill.is-new strong { color: var(--accent); }
      .vsrs-progress-bar {
        height: 7px;
        border-radius: var(--radius-full);
        background: var(--surface-3);
        overflow: hidden;
        display: flex;
        width: 100%;
      }
      .vsrs-prog-seg {
        height: 100%;
        transition: width 0.25s ease;
      }
      .vsrs-prog-mastered { background: var(--ok); }
      .vsrs-prog-learning { background: var(--warn); }
      .vsrs-prog-new { background: var(--accent); opacity: 0.55; }
      .vsrs-toolbar {
        padding: 10px 20px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid var(--border);
        background: var(--surface);
      }
      .vsrs-filter-row {
        padding: 10px 20px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .vsrs-input,
      .vsrs-select {
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-strong);
        background: var(--surface-2);
        color: var(--text);
        font-family: inherit;
        font-size: 0.85rem;
        outline: none;
      }
      .vsrs-input:focus,
      .vsrs-select:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-soft);
      }
      .vsrs-input {
        flex: 1 1 210px;
        min-width: 0;
      }
      .vsrs-select {
        flex: 0 1 260px;
        max-width: 100%;
      }
      .vsrs-body {
        padding: 14px 20px 20px;
        overflow-y: auto;
        flex: 1;
      }
      /* Responsive 3D Grid Flip Card (prevents fixed-height text clipping) */
      #vocab-dialog .flashcard-stage {
        margin-block: 10px 14px;
        min-height: 250px;
      }
      #vocab-dialog .flashcard-inner {
        display: grid;
        height: auto;
        min-height: 255px;
      }
      #vocab-dialog .flashcard-face {
        position: relative;
        inset: auto;
        grid-area: 1 / 1;
        padding: 20px 22px;
        background: var(--surface);
        color: var(--text);
        border: 2px solid var(--border-strong);
        box-sizing: border-box;
      }
      #vocab-dialog .flashcard-face.back {
        background: var(--surface-raised);
        border-color: var(--accent-border);
      }
      #vocab-dialog .flashcard-inner:not(.is-flipped) .flashcard-face.back {
        pointer-events: none;
        visibility: hidden;
      }
      #vocab-dialog .flashcard-inner.is-flipped .flashcard-face.front {
        pointer-events: none;
        visibility: hidden;
      }
      .vsrs-card-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
      }
      .vsrs-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: var(--radius-full);
        font-size: 0.72rem;
        font-weight: 500;
        background: var(--surface-2);
        color: var(--text-muted);
        border: 1px solid var(--border);
      }
      .vsrs-chip-accent {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: var(--accent-border);
      }
      .vsrs-ipa {
        font-family: var(--font-ipa);
        font-size: 0.85rem;
        font-weight: 500;
        letter-spacing: 0.01em;
        color: var(--text-muted);
      }
      .vsrs-kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 4px;
        font-family: var(--font-mono);
        font-size: 0.68rem;
        font-weight: 500;
        background: var(--surface);
        color: var(--text-muted);
        border: 1px solid var(--border-strong);
      }
      /* Quiz 4 Đáp Án */
      .vsrs-quiz-top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }
      .vsrs-quiz-card {
        background: var(--surface-2);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-lg);
        padding: 18px 20px;
      }
      .vsrs-quiz-prompt {
        font-size: 1.4rem;
        font-weight: 600;
        color: var(--accent);
        margin: 6px 0 4px;
        line-height: 1.35;
      }
      .vsrs-quiz-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .vsrs-quiz-opt {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        text-align: left;
        padding: 12px 14px;
        border-radius: var(--radius-md);
        border: 1.5px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.45;
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      .vsrs-quiz-opt:hover:not(:disabled) {
        border-color: var(--accent);
        background: var(--accent-soft);
      }
      .vsrs-quiz-opt.is-correct {
        background: var(--ok-soft) !important;
        border-color: var(--ok) !important;
        color: var(--ok) !important;
      }
      .vsrs-quiz-opt.is-wrong {
        background: var(--bad-soft) !important;
        border-color: var(--bad) !important;
        color: var(--bad) !important;
      }
      .vsrs-quiz-feedback {
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      /* Library Cards */
      .vsrs-lib-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 255px), 1fr));
        gap: 12px;
      }
      .vsrs-lib-card {
        background: var(--surface);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        padding: 13px 14px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      }
      .vsrs-lib-card:hover {
        border-color: var(--accent-border);
        box-shadow: var(--shadow-sm);
      }
      @media (max-width: 640px) {
        .vsrs-mastery-pills {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .vsrs-quiz-grid {
          grid-template-columns: 1fr;
        }
        #vocab-dialog .srs-buttons-row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .vsrs-head, .vsrs-mastery-strip, .vsrs-toolbar, .vsrs-filter-row, .vsrs-body {
          padding-inline: 14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  _installDialogBridge() {
    if (this._dialogObserver) return;
    const attach = () => {
      const dlg = document.getElementById("vocab-dialog");
      if (!dlg) return;

      if (!dlg._safeShowModalPatched && typeof dlg.showModal === "function") {
        const nativeShowModal = dlg.showModal.bind(dlg);
        dlg.showModal = () => {
          if (!dlg.open) nativeShowModal();
        };
        dlg._safeShowModalPatched = true;
      }

      this._dialogObserver = new MutationObserver(() => {
        if (this._isUpgradingDom) return;
        // If legacy openFlashcardModal rendered into #vocab-dialog without our v2 marker, upgrade seamlessly
        if (dlg.children.length > 0 && !dlg.querySelector('[data-vsrs-studio="v2"]')) {
          const wantsLibrary = Boolean(
            dlg.querySelector("#vocab-tab-library-btn.is-active")
          );
          this.renderStudioModal(wantsLibrary ? "library" : this.activeTab || "srs", dlg);
        }
      });
      this._dialogObserver.observe(dlg, { childList: true });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attach, { once: true });
    } else {
      attach();
    }
  }

  _installKeyboardShortcuts() {
    if (this._boundKeyHandler) return;
    this._boundKeyHandler = (e) => {
      const dlg = document.getElementById("vocab-dialog");
      if (!dlg || !dlg.open) return;

      const target = e.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (this.activeTab === "srs") {
        if (e.code === "Space" || e.key === " ") {
          const cardInner = dlg.querySelector("#srs-card-inner");
          if (cardInner) {
            e.preventDefault();
            this.isFlipped = !this.isFlipped;
            cardInner.classList.toggle("is-flipped", this.isFlipped);
          }
          return;
        }
        if (["1", "2", "3", "4"].includes(e.key)) {
          const card = this.getCurrentCard();
          if (card) {
            e.preventDefault();
            const quality = Number(e.key) - 1;
            this.reviewCard(card, quality).then(() => {
              this._refreshHeaderAndMastery(dlg);
              this._renderTabBody(dlg);
            });
          }
          return;
        }
      } else if (this.activeTab === "quiz") {
        if (!this.quizQuestion) return;
        if (!this.quizQuestion.answered && ["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          const idx = Number(e.key) - 1;
          this.answerQuizQuestion(idx).then(() => {
            this._refreshHeaderAndMastery(dlg);
            this._renderTabBody(dlg);
          });
          return;
        }
        if (
          this.quizQuestion.answered &&
          (e.code === "Space" || e.key === " " || e.key === "Enter")
        ) {
          e.preventDefault();
          this.generateQuizQuestion();
          this._renderTabBody(dlg);
        }
      }
    };
    document.addEventListener("keydown", this._boundKeyHandler);
  }

  _resolveModalArgs(arg1, arg2) {
    let dlg = null;
    let tab = this.activeTab || "srs";
    if (arg1 && typeof arg1 === "object" && arg1.nodeType === 1) {
      dlg = arg1;
      if (typeof arg2 === "string" && arg2) tab = arg2;
    } else if (typeof arg1 === "string" && arg1) {
      dlg = typeof document !== "undefined" ? document.getElementById("vocab-dialog") : null;
      tab = arg1;
    } else {
      dlg = typeof document !== "undefined" ? document.getElementById("vocab-dialog") : null;
    }
    if (dlg && !dlg._safeShowModalPatched && typeof dlg.showModal === "function") {
      const nativeShowModal = dlg.showModal.bind(dlg);
      dlg.showModal = () => {
        if (!dlg.open) nativeShowModal();
      };
      dlg._safeShowModalPatched = true;
    }
    return { dlg, tab };
  }

  openModal(arg1, arg2) {
    const { dlg, tab } = this._resolveModalArgs(arg1, arg2);
    if (!dlg) return false;
    this.renderStudioModal(tab, dlg);
    if (!dlg.open && typeof dlg.showModal === "function") {
      dlg.showModal();
    }
    return true;
  }

  renderDialog(arg1, arg2) {
    return this.openModal(arg1, arg2);
  }

  render(arg1, arg2) {
    return this.openModal(arg1, arg2);
  }

  _buildMasteryHtml() {
    const m = this.getMasteryBreakdown();
    return `
      <div class="vsrs-mastery-pills">
        <div class="vsrs-stat-pill is-new" title="Thẻ mới chưa ôn lần nào">
          <span style="display: inline-flex; align-items: center; gap: 5px;">${getIcon("sparkles", 13)} <span>Mới (New)</span></span>
          <strong>${m.newCount}</strong>
        </div>
        <div class="vsrs-stat-pill is-learning" title="Thẻ đang trong chu kỳ ghi nhớ ngắn hạn">
          <span style="display: inline-flex; align-items: center; gap: 5px;">${getIcon("layers", 13)} <span>Đang học (Learning)</span></span>
          <strong>${m.learningCount}</strong>
        </div>
        <div class="vsrs-stat-pill is-mastered" title="Thẻ đã nhớ bền vững (chu kỳ >= 7 ngày)">
          <span style="display: inline-flex; align-items: center; gap: 5px;">${getIcon("award", 13)} <span>Thành thạo (Mastered)</span></span>
          <strong>${m.masteredCount}</strong>
        </div>
        <div class="vsrs-stat-pill is-due" title="Thẻ đến hạn cần ôn tập ngay hôm nay">
          <span style="display: inline-flex; align-items: center; gap: 5px;">${getIcon("clock", 13)} <span>Cần ôn (Due Today)</span></span>
          <strong>${m.dueToday}</strong>
        </div>
      </div>
      <div class="vsrs-progress-bar" role="progressbar" aria-label="Tiến độ thành thạo từ vựng" aria-valuenow="${m.masteredPct}" aria-valuemin="0" aria-valuemax="100">
        <div class="vsrs-prog-seg vsrs-prog-mastered" style="width: ${m.masteredPct}%" title="Thành thạo: ${m.masteredPct}%"></div>
        <div class="vsrs-prog-seg vsrs-prog-learning" style="width: ${m.learningPct}%" title="Đang học: ${m.learningPct}%"></div>
        <div class="vsrs-prog-seg vsrs-prog-new" style="width: ${Math.max(0, 100 - m.masteredPct - m.learningPct)}%" title="Mới: ${m.newPct}%"></div>
      </div>
    `;
  }

  _refreshHeaderAndMastery(dlg) {
    const vocabBank = (typeof window !== "undefined" && window.TOEIC_VOCAB_BANK) || [];
    const dueCount = this.getDueCards().length;

    const sub = dlg.querySelector("#vsrs-head-sub");
    if (sub) {
      sub.textContent = `${vocabBank.length} từ vựng chuẩn ETS · ${this.cards.length} thẻ trong bộ ôn · ${dueCount} thẻ cần ôn hôm nay`;
    }
    const strip = dlg.querySelector("#vsrs-mastery-strip");
    if (strip) {
      strip.innerHTML = this._buildMasteryHtml();
    }
    const srsBtn = dlg.querySelector("#vocab-tab-srs-btn");
    if (srsBtn) {
      srsBtn.innerHTML = `${getIcon("layers", 14)} <span>Flashcard SM-2 (${dueCount})</span>`;
    }
  }

  renderStudioModal(tab = this.activeTab || "srs", customDlg = null) {
    const dlg = customDlg || document.getElementById("vocab-dialog");
    if (!dlg) return false;

    this.activeTab = tab;
    this.isFlipped = false;
    const vocabBank = (typeof window !== "undefined" && window.TOEIC_VOCAB_BANK) || [];
    const dueCount = this.getDueCards().length;
    const categories = (typeof window !== "undefined" && window.TOEIC_VOCAB_CATEGORIES) || [
      { id: "Contracts & Negotiations", label: "Hợp đồng & Đàm phán (Contracts & Negotiations)" },
      { id: "Marketing & Sales", label: "Tiếp thị & Kinh doanh (Marketing & Sales)" },
      { id: "Finance & Budgeting", label: "Tài chính & Ngân sách (Finance & Budgeting)" },
      { id: "Travel & Logistics", label: "Giao vận & Công tác (Travel & Logistics)" },
      { id: "Manufacturing & QC", label: "Sản xuất & Kiểm định QC (Manufacturing & QC)" },
      { id: "HR & Office Operations", label: "Nhân sự & Vận hành Văn phòng (HR & Office)" },
      { id: "Part 7 Business Reading", label: "Đọc hiểu Học thuật & Thương mại Part 7 (900+)" }
    ];

    this._isUpgradingDom = true;
    try {
      dlg.innerHTML = `
        <div class="dialog-box dialog-wide vsrs-studio-shell" data-vsrs-studio="v2">
          <div class="vsrs-head">
            <div>
              <h2 class="vsrs-head-title" id="vocab-dialog-title">Kho Từ Vựng &amp; Active Recall Studio SM-2</h2>
              <div class="vsrs-head-sub" id="vsrs-head-sub">${vocabBank.length} từ vựng chuẩn ETS · ${this.cards.length} thẻ trong bộ ôn · ${dueCount} thẻ cần ôn hôm nay</div>
            </div>
            <form method="dialog">
              <button type="submit" class="tool-btn icon-only dialog-close" data-action="close" aria-label="Đóng">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </form>
          </div>

          <div class="vsrs-mastery-strip" id="vsrs-mastery-strip">
            ${this._buildMasteryHtml()}
          </div>

          <div class="vsrs-toolbar">
            <div class="segmented" role="tablist" aria-label="Chế độ học từ vựng" style="flex-wrap: wrap;">
              <button type="button" class="seg-btn ${this.activeTab === "srs" ? "is-active" : ""}" id="vocab-tab-srs-btn" data-vocab-tab="srs">
                ${getIcon("layers", 14)} <span>Flashcard SM-2 (${dueCount})</span>
              </button>
              <button type="button" class="seg-btn ${this.activeTab === "quiz" ? "is-active" : ""}" id="vocab-tab-quiz-btn" data-vocab-tab="quiz">
                ${getIcon("zap", 14)} <span>Quiz 4 Đáp Án</span>
              </button>
              <button type="button" class="seg-btn ${this.activeTab === "library" ? "is-active" : ""}" id="vocab-tab-library-btn" data-vocab-tab="library">
                ${getIcon("bookOpen", 14)} <span>Thư Viện (${vocabBank.length})</span>
              </button>
            </div>
            <span style="font-size: 0.74rem; color: var(--text-muted);">
              Phím tắt: <span class="vsrs-kbd">Space</span> Lật/Tiếp · <span class="vsrs-kbd">1-4</span> Chọn
            </span>
          </div>

          <div class="vsrs-filter-row">
            <input
              type="text"
              id="lib-search-input"
              class="vocab-filter-input vsrs-input"
              placeholder="Tìm từ tiếng Anh, phiên âm IPA, nghĩa tiếng Việt hoặc câu ví dụ..."
              value="${escapeHtml(this.searchQuery)}"
              aria-label="Tìm kiếm từ vựng"
            />
            <select id="lib-topic-select" class="vsrs-select" aria-label="Lọc theo chủ đề TOEIC">
              <option value="all" ${this.selectedCategory === "all" ? "selected" : ""}>Tất cả chủ đề ETS TOEIC</option>
              <option value="talk_chunks" ${this.selectedCategory === "talk_chunks" ? "selected" : ""}>Cụm từ từ Đề Nghe &amp; Đọc đang luyện</option>
              ${categories
                .map(
                  (c) =>
                    `<option value="${escapeHtml(c.id)}" ${
                      this.selectedCategory === c.id ? "selected" : ""
                    }>${escapeHtml(c.label)}</option>`
                )
                .join("")}
            </select>
            <button type="button" class="tool-btn" id="vsrs-clear-filter-btn" style="font-size: 0.78rem; padding: 7px 10px;">
              Đặt lại lọc
            </button>
          </div>

          <div class="vsrs-body" id="vsrs-studio-body"></div>
        </div>
      `;

      // Wire Tab Switching (in-place without calling dlg.showModal() again!)
      dlg.querySelectorAll("[data-vocab-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextTab = btn.dataset.vocabTab;
          if (nextTab === "library" && this.selectedCategory === "talk_chunks") {
            this.selectedCategory = "all";
            const sel = dlg.querySelector("#lib-topic-select");
            if (sel) sel.value = "all";
          }
          this.activeTab = nextTab;
          this.isFlipped = false;
          dlg.querySelectorAll("[data-vocab-tab]").forEach((b) =>
            b.classList.toggle("is-active", b.dataset.vocabTab === nextTab)
          );
          if (nextTab === "quiz" && !this.quizQuestion) {
            this.generateQuizQuestion();
          }
          this._renderTabBody(dlg);
        });
      });

      // Wire Search & Category Filter (updates ONLY #vsrs-studio-body so Vietnamese IME never drops!)
      const searchInput = dlg.querySelector("#lib-search-input");
      const topicSelect = dlg.querySelector("#lib-topic-select");
      const clearBtn = dlg.querySelector("#vsrs-clear-filter-btn");

      searchInput?.addEventListener("input", () => {
        this.searchQuery = searchInput.value;
        this.currentIndex = 0;
        this.libraryLimit = 60;
        if (this.activeTab === "quiz") this.generateQuizQuestion();
        this._renderTabBody(dlg);
      });

      topicSelect?.addEventListener("change", () => {
        this.selectedCategory = topicSelect.value;
        this.currentIndex = 0;
        this.libraryLimit = 60;
        if (this.activeTab === "quiz") this.generateQuizQuestion();
        this._renderTabBody(dlg);
      });

      clearBtn?.addEventListener("click", () => {
        this.searchQuery = "";
        this.selectedCategory = "all";
        this.currentIndex = 0;
        this.libraryLimit = 60;
        if (searchInput) searchInput.value = "";
        if (topicSelect) topicSelect.value = "all";
        if (this.activeTab === "quiz") this.generateQuizQuestion();
        this._renderTabBody(dlg);
      });

      if (this.activeTab === "quiz" && !this.quizQuestion) {
        this.generateQuizQuestion();
      }
      this._renderTabBody(dlg);
    } finally {
      this._isUpgradingDom = false;
    }
  }

  _renderTabBody(dlg) {
    const body = dlg.querySelector("#vsrs-studio-body");
    if (!body) return;

    if (this.activeTab === "srs") {
      this._renderSrsTab(dlg, body);
    } else if (this.activeTab === "quiz") {
      this._renderQuizTab(dlg, body);
    } else {
      this._renderLibraryTab(dlg, body);
    }
  }

  _renderSrsTab(dlg, body) {
    const filteredPool = this.getFilteredCards();
    const filteredDue = this.getFilteredDueCards();
    const card = this.getCurrentCard();

    if (!card) {
      body.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: var(--surface-2); border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <div style="color: var(--ok); margin-bottom: 8px; display: inline-flex;">${getIcon("checkCircle", 28)}</div>
          <h3 style="margin: 0 0 6px; font-size: 1.05rem; color: var(--text);">
            ${
              filteredPool.length === 0
                ? "Không có thẻ Flashcard nào khớp với bộ lọc hiện tại"
                : "Tuyệt vời! Bạn đã hoàn thành toàn bộ thẻ cần ôn hôm nay!"
            }
          </h3>
          <p style="margin: 0 0 14px; font-size: 0.86rem; color: var(--text-muted);">
            ${
              filteredPool.length === 0
                ? "Hãy xóa bộ lọc hoặc sang tab Thư Viện để thêm từ vựng mới vào bộ ôn tập."
                : `Bộ thẻ hiện có ${filteredPool.length} thẻ. Bạn có thể ôn tập tự do hoặc chuyển sang Quiz 4 Đáp Án.`
            }
          </p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            ${
              filteredPool.length > 0
                ? `<button type="button" class="btn-primary" id="vsrs-practice-anyway-btn">${getIcon("rotateCcw", 14)} <span>Ôn tập tự do (${filteredPool.length} thẻ)</span></button>`
                : ""
            }
            <button type="button" class="tool-btn" id="vsrs-jump-quiz-btn">${getIcon("zap", 14)} <span>Mở Quiz 4 Đáp Án</span></button>
            <button type="button" class="tool-btn" id="vsrs-jump-lib-btn">${getIcon("bookOpen", 14)} <span>Thêm từ từ Thư Viện</span></button>
          </div>
        </div>
      `;
      body.querySelector("#vsrs-practice-anyway-btn")?.addEventListener("click", () => {
        this.practiceAllWhenDone = true;
        this._renderTabBody(dlg);
      });
      body.querySelector("#vsrs-jump-quiz-btn")?.addEventListener("click", () => {
        dlg.querySelector("#vocab-tab-quiz-btn")?.click();
      });
      body.querySelector("#vsrs-jump-lib-btn")?.addEventListener("click", () => {
        dlg.querySelector("#vocab-tab-library-btn")?.click();
      });
      return;
    }

    const activeDeck = filteredDue.length > 0 ? filteredDue : filteredPool;
    const deckPos = (this.currentIndex % activeDeck.length) + 1;
    const ivls = this.getPreviewIntervals(card);
    const sourceBadge =
      card.talkRange && card.talkRange !== "Library"
        ? `Câu ${card.talkRange}`
        : card.category || "ETS TOEIC";

    body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 0.8rem; color: var(--text-muted);">
        <span>
          ${
            filteredDue.length > 0
              ? `Đang ôn thẻ đến hạn: <strong>${deckPos} / ${filteredDue.length}</strong>`
              : `Chế độ ôn tự do: <strong>${deckPos} / ${activeDeck.length}</strong>`
          }
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="tool-btn" id="srs-prev-card-btn" style="padding: 4px 10px; font-size: 0.76rem;">${getIcon("arrowLeft", 13)} <span>Trước</span></button>
          <button type="button" class="tool-btn" id="srs-flip-btn" style="padding: 4px 10px; font-size: 0.76rem;">${getIcon("rotateCcw", 13)} <span>Lật thẻ [Space]</span></button>
          <button type="button" class="tool-btn" id="srs-next-card-btn" style="padding: 4px 10px; font-size: 0.76rem;"><span>Tiếp</span> ${getIcon("arrowRight", 13)}</button>
        </div>
      </div>

      <div class="flashcard-stage">
        <div class="flashcard-inner ${this.isFlipped ? "is-flipped" : ""}" id="srs-card-inner">
          <!-- Front Face -->
          <div class="flashcard-face front">
            <div>
              <div class="vsrs-card-meta">
                <span class="vsrs-chip vsrs-chip-accent">${escapeHtml(sourceBadge)}</span>
                ${card.type ? `<span class="vsrs-chip">${escapeHtml(card.type)}</span>` : ""}
                ${card.ipa ? `<span class="vsrs-ipa">${escapeHtml(card.ipa)}</span>` : ""}
              </div>
              <div class="flashcard-chunk">${escapeHtml(card.word)}</div>
              <div class="flashcard-context">"${escapeHtml(card.context || "Nhấn lật thẻ để xem nghĩa và ngữ cảnh chuẩn TOEIC.")}"</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 14px;">
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="tool-btn srs-tts-btn" title="Phát âm chuẩn giọng Mỹ (Web Speech API en-US)">
                  ${getIcon("volume2", 14)} <span>Phát âm US</span>
                </button>
                ${
                  card.audioUrl
                    ? `<button type="button" class="tool-btn srs-play-audio-btn" title="Nghe đoạn băng gốc trong bài thi">${getIcon("headphones", 14)} <span>Audio bài nghe</span></button>`
                    : `<button type="button" class="tool-btn srs-play-audio-btn" style="display:none;" aria-hidden="true"></button>`
                }
              </div>
              <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">
                Nhấn thẻ hoặc <span class="vsrs-kbd">Space</span> để xem nghĩa &rarr;
              </span>
            </div>
          </div>

          <!-- Back Face -->
          <div class="flashcard-face back">
            <div>
              <div class="vsrs-card-meta">
                <span class="vsrs-chip vsrs-chip-accent">${escapeHtml(card.word)}</span>
                ${card.ipa ? `<span class="vsrs-ipa">${escapeHtml(card.ipa)}</span>` : ""}
                <span class="vsrs-chip">Lặp: ${card.repetitions || 0} · EF: ${(card.easeFactor || 2.5).toFixed(2)}</span>
              </div>
              <div class="flashcard-chunk" style="color: var(--ok);">${escapeHtml(card.translation || card.word)}</div>
              <p style="font-size: 0.88rem; line-height: 1.55; color: var(--text-muted); margin: 6px 0 0; font-style: italic;">
                "${escapeHtml(card.context || "")}"
              </p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 14px;">
              <button type="button" class="tool-btn srs-tts-back-btn">
                ${getIcon("volume2", 14)} <span>Nghe lại phát âm</span>
              </button>
              <span style="font-size: 0.76rem; color: var(--text-muted);">
                Chọn mức độ nhớ bên dưới (Phím <span class="vsrs-kbd">1</span>&ndash;<span class="vsrs-kbd">4</span>):
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="srs-buttons-row">
        <button type="button" class="srs-btn srs-again" data-quality="0">
          <span><span class="vsrs-kbd">1</span> Quên (Again)</span>
          <span class="srs-interval">${escapeHtml(ivls[0])}</span>
        </button>
        <button type="button" class="srs-btn srs-hard" data-quality="1">
          <span><span class="vsrs-kbd">2</span> Khó / Mờ (Hard)</span>
          <span class="srs-interval">${escapeHtml(ivls[1])}</span>
        </button>
        <button type="button" class="srs-btn srs-good" data-quality="2">
          <span><span class="vsrs-kbd">3</span> Thuộc (Good)</span>
          <span class="srs-interval">${escapeHtml(ivls[2])}</span>
        </button>
        <button type="button" class="srs-btn srs-easy" data-quality="3">
          <span><span class="vsrs-kbd">4</span> Rất dễ (Easy)</span>
          <span class="srs-interval">${escapeHtml(ivls[3])}</span>
        </button>
      </div>
    `;

    const cardInner = body.querySelector("#srs-card-inner");
    const toggleFlip = () => {
      this.isFlipped = !this.isFlipped;
      cardInner?.classList.toggle("is-flipped", this.isFlipped);
    };

    cardInner?.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      toggleFlip();
    });

    body.querySelector("#srs-flip-btn")?.addEventListener("click", toggleFlip);
    body.querySelector("#srs-prev-card-btn")?.addEventListener("click", () => {
      this.currentIndex = (this.currentIndex - 1 + activeDeck.length) % activeDeck.length;
      this.isFlipped = false;
      this._renderTabBody(dlg);
    });
    body.querySelector("#srs-next-card-btn")?.addEventListener("click", () => {
      this.currentIndex = (this.currentIndex + 1) % activeDeck.length;
      this.isFlipped = false;
      this._renderTabBody(dlg);
    });

    body.querySelector(".srs-tts-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.speakTTS(card.word);
    });
    body.querySelector(".srs-tts-back-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.speakTTS(card.word);
    });
    body.querySelector(".srs-play-audio-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.playCardAudio(card);
    });

    body.querySelectorAll(".srs-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const q = parseInt(btn.dataset.quality, 10);
        await this.reviewCard(card, q);
        this._refreshHeaderAndMastery(dlg);
        this._renderTabBody(dlg);
      });
    });
  }

  _renderQuizTab(dlg, body) {
    if (!this.quizQuestion) {
      this.generateQuizQuestion();
    }
    const qObj = this.quizQuestion;
    const accPct =
      this.quizStats.answered > 0
        ? Math.round((this.quizStats.correct / this.quizStats.answered) * 100)
        : 0;

    if (!qObj) {
      body.innerHTML = `
        <div style="text-align: center; padding: 34px 16px; color: var(--text-muted);">
          Không tìm thấy đủ từ vựng khớp bộ lọc để tạo câu hỏi trắc nghiệm. Hãy nhấn <strong>Đặt lại lọc</strong> phía trên!
        </div>
      `;
      return;
    }

    const { target, options, correctIndex, selectedIndex, answered } = qObj;
    const isEn2Vi = this.quizDirection === "en2vi";
    const promptText = isEn2Vi ? target.word : target.translation;
    const letters = ["A", "B", "C", "D"];
    const alreadyInSrs = this.hasWord(target.word);

    body.innerHTML = `
      <div class="vsrs-quiz-top">
        <div class="segmented">
          <button type="button" class="seg-btn ${isEn2Vi ? "is-active" : ""}" data-quiz-dir="en2vi">Anh &rarr; Việt</button>
          <button type="button" class="seg-btn ${!isEn2Vi ? "is-active" : ""}" data-quiz-dir="vi2en">Việt &rarr; Anh</button>
        </div>

        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.8rem;">
          <span class="vsrs-chip vsrs-chip-accent">${getIcon("flame", 13)} <span>Chuỗi đúng: <strong>${this.quizStats.streak}</strong> (Kỷ lục: ${this.quizStats.bestStreak})</span></span>
          <span class="vsrs-chip">${getIcon("crosshair", 13)} <span>Đúng: <strong>${this.quizStats.correct}/${this.quizStats.answered}</strong> (${accPct}%)</span></span>
          <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer; color: var(--text-muted); user-select: none;">
            <input type="checkbox" id="vsrs-quiz-autospeak" ${this.quizAutoSpeak ? "checked" : ""} style="accent-color: var(--accent);" />
            <span>Tự phát âm</span>
          </label>
        </div>
      </div>

      <div class="vsrs-quiz-card" id="vsrs-quiz-card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div class="vsrs-card-meta" style="margin-bottom: 0;">
            <span class="vsrs-chip vsrs-chip-accent">${escapeHtml(target.category || "ETS TOEIC")}</span>
            ${target.type ? `<span class="vsrs-chip">${escapeHtml(target.type)}</span>` : ""}
            ${isEn2Vi && target.ipa ? `<span class="vsrs-ipa">${escapeHtml(target.ipa)}</span>` : ""}
          </div>
          <button type="button" class="tool-btn quiz-tts-btn" id="vsrs-quiz-tts-btn" title="Nghe phát âm chuẩn Mỹ">
            ${getIcon("volume2", 14)} <span>Phát âm US</span>
          </button>
        </div>

        <div class="vsrs-quiz-prompt">${escapeHtml(promptText)}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ${isEn2Vi ? "Chọn nghĩa tiếng Việt chuẩn xác nhất trong ngữ cảnh TOEIC:" : "Chọn từ/cụm từ tiếng Anh tương ứng chuẩn xác nhất:"}
        </div>

        <div class="vsrs-quiz-grid">
          ${options
            .map((opt, idx) => {
              let stateCls = "";
              if (answered) {
                if (idx === correctIndex) stateCls = "is-correct";
                else if (idx === selectedIndex) stateCls = "is-wrong";
              }
              const optLabel = isEn2Vi ? opt.translation : `${opt.word} ${opt.ipa ? `(${opt.ipa})` : ""}`;
              return `
                <button
                  type="button"
                  class="vsrs-quiz-opt ${stateCls}"
                  data-choice-idx="${idx}"
                  ${answered ? "disabled" : ""}
                >
                  <span class="vsrs-kbd">${idx + 1}</span>
                  <span><strong>${letters[idx]}.</strong> ${escapeHtml(optLabel)}</span>
                </button>
              `;
            })
            .join("")}
        </div>

        ${
          answered
            ? `
            <div class="vsrs-quiz-feedback">
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <strong style="color: ${selectedIndex === correctIndex ? "var(--ok)" : "var(--bad)"}; font-size: 0.92rem; display: inline-flex; align-items: center; gap: 6px;">
                  ${
                    selectedIndex === correctIndex
                      ? `${getIcon("checkCircle", 15)} <span>Chính xác! Phản xạ từ vựng rất tốt.</span>`
                      : `${getIcon("x", 15)} <span>Chưa chính xác! Đáp án đúng là ${letters[correctIndex]}: ${escapeHtml(target.word)} — ${escapeHtml(target.translation)}</span>`
                  }
                </strong>
                ${!isEn2Vi && target.ipa ? `<span class="vsrs-ipa">${escapeHtml(target.ipa)}</span>` : ""}
              </div>
              ${
                target.example
                  ? `<div style="font-size: 0.84rem; color: var(--text-muted); font-style: italic; line-height: 1.5;">Ví dụ ETS: "${escapeHtml(target.example)}"</div>`
                  : ""
              }
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                <button
                  type="button"
                  class="tool-btn"
                  id="vsrs-quiz-pin-srs-btn"
                  ${alreadyInSrs ? "disabled" : ""}
                  style="font-size: 0.78rem;"
                >
                  ${alreadyInSrs ? "✓ Đã đồng bộ chu kỳ SM-2" : "+ Ghim từ này vào Flashcard SM-2"}
                </button>
                <button
                  type="button"
                  class="btn-primary quiz-next-btn"
                  id="vsrs-quiz-next-btn"
                >
                  Câu tiếp theo [Space / Enter] &rarr;
                </button>
              </div>
            </div>
          `
            : ""
        }
      </div>
    `;

    body.querySelectorAll("[data-quiz-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.quizDirection = btn.dataset.quizDir;
        this.generateQuizQuestion();
        this._renderTabBody(dlg);
      });
    });

    body.querySelector("#vsrs-quiz-autospeak")?.addEventListener("change", (e) => {
      this.quizAutoSpeak = e.target.checked;
      if (this.quizAutoSpeak) this.speakTTS(target.word);
    });

    body.querySelector("#vsrs-quiz-tts-btn")?.addEventListener("click", () => {
      this.speakTTS(target.word);
    });

    body.querySelectorAll(".vsrs-quiz-opt").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.choiceIdx, 10);
        await this.answerQuizQuestion(idx);
        if (this.quizAutoSpeak) this.speakTTS(target.word);
        this._refreshHeaderAndMastery(dlg);
        this._renderTabBody(dlg);
      });
    });

    body.querySelector("#vsrs-quiz-next-btn")?.addEventListener("click", () => {
      this.generateQuizQuestion();
      this._renderTabBody(dlg);
    });

    body.querySelector("#vsrs-quiz-pin-srs-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      await this.addCard({
        id: `card_quiz_${Date.now()}_${target.word.replace(/\s+/g, "_")}`,
        word: target.word,
        translation: target.translation,
        ipa: target.ipa,
        type: target.type,
        category: target.category,
        context: target.example || "ETS Business Vocabulary",
        talkRange: "Library",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        dueDate: Date.now()
      });
      btn.disabled = true;
      btn.textContent = "✓ Đã thêm vào Flashcard SM-2";
      this._refreshHeaderAndMastery(dlg);
    });
  }

  _renderLibraryTab(dlg, body) {
    const vocabBank = (typeof window !== "undefined" && window.TOEIC_VOCAB_BANK) || [];
    const qNorm = normalizeText(this.searchQuery);

    let sourceItems = vocabBank;
    if (this.selectedCategory === "talk_chunks") {
      sourceItems = this.cards.filter(
        (c) => c.isTalkChunk || (c.talkRange && c.talkRange !== "Library")
      );
    }

    const filtered = sourceItems.filter((item) =>
      this._matchesFilter(item, qNorm, this.selectedCategory)
    );

    if (!filtered.length) {
      body.innerHTML = `
        <div id="lib-vocab-grid" style="text-align: center; color: var(--text-muted); padding: 34px 16px;">
          Không tìm thấy từ vựng phù hợp với từ khóa hoặc chủ đề đã chọn.
        </div>
      `;
      return;
    }

    const visible = filtered.slice(0, this.libraryLimit);

    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; font-size: 0.8rem; color: var(--text-muted);">
        <span>Đang hiển thị <strong>${visible.length}</strong> / <strong>${filtered.length}</strong> mục từ vựng chuẩn TOEIC</span>
      </div>

      <div id="lib-vocab-grid" class="vsrs-lib-grid">
        ${visible
          .map((v) => {
            const inDeck = this.hasWord(v.word);
            const exText = v.example || v.context || "";
            return `
              <div class="vsrs-lib-card">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 4px;">
                    <div>
                      <span style="font-weight: 600; font-size: 1.02rem; color: var(--accent);">${escapeHtml(v.word)}</span>
                      ${v.ipa ? `<div class="vsrs-ipa" style="margin-top: 1px;">${escapeHtml(v.ipa)}</div>` : ""}
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <span class="vsrs-chip">${escapeHtml(v.type || "vocab")}</span>
                      <button
                        type="button"
                        class="tool-btn icon-only lib-tts-btn"
                        data-tts-word="${escapeHtml(v.word)}"
                        title="Phát âm chuẩn giọng Mỹ"
                        aria-label="Phát âm ${escapeHtml(v.word)}"
                        style="padding: 4px 6px; font-size: 0.8rem;"
                      >${getIcon("volume2", 14)}</button>
                    </div>
                  </div>
                  ${
                    v.category
                      ? `<div style="margin-bottom: 6px;"><span class="vsrs-chip vsrs-chip-accent" style="font-size: 0.67rem;">${escapeHtml(v.category)}</span></div>`
                      : ""
                  }
                  <div style="font-size: 0.88rem; font-weight: 500; color: var(--ok); margin-bottom: 6px; line-height: 1.4;">
                    ${escapeHtml(v.translation)}
                  </div>
                  ${
                    exText
                      ? `<p style="font-size: 0.8rem; line-height: 1.48; color: var(--text-muted); margin: 0; font-style: italic;">"${escapeHtml(exText)}"</p>`
                      : ""
                  }
                </div>

                <button
                  type="button"
                  class="tool-btn add-lib-to-srs-btn"
                  data-word="${escapeHtml(v.word)}"
                  data-vn="${escapeHtml(v.translation)}"
                  data-ipa="${escapeHtml(v.ipa || "")}"
                  data-type="${escapeHtml(v.type || "vocab")}"
                  data-cat="${escapeHtml(v.category || "Part 7 Business Reading")}"
                  data-ex="${escapeHtml(exText)}"
                  ${inDeck ? "disabled" : ""}
                  style="width: 100%; justify-content: center; font-size: 0.78rem;"
                >
                  ${inDeck ? "✓ Đã có trong Flashcard" : "+ Thêm vào ôn tập Flashcard"}
                </button>
              </div>
            `;
          })
          .join("")}
      </div>

      ${
        filtered.length > visible.length
          ? `
          <div style="text-align: center; margin-top: 16px;">
            <button type="button" class="tool-btn" id="vsrs-lib-load-more-btn">
              Xem thêm ${Math.min(60, filtered.length - visible.length)} từ vựng (Còn ${filtered.length - visible.length} từ)
            </button>
          </div>
        `
          : ""
      }
    `;

    body.querySelectorAll(".lib-tts-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.speakTTS(btn.dataset.ttsWord);
      });
    });

    body.querySelectorAll(".add-lib-to-srs-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this.addCard({
          id: `card_lib_${Date.now()}_${btn.dataset.word.replace(/\s+/g, "_")}`,
          word: btn.dataset.word,
          translation: btn.dataset.vn,
          ipa: btn.dataset.ipa,
          type: btn.dataset.type,
          category: btn.dataset.cat,
          context: btn.dataset.ex || "ETS Business Vocabulary",
          talkRange: "Library",
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          dueDate: Date.now()
        });
        btn.disabled = true;
        btn.textContent = "✓ Đã thêm vào Flashcard";
        this._refreshHeaderAndMastery(dlg);
      });
    });

    body.querySelector("#vsrs-lib-load-more-btn")?.addEventListener("click", () => {
      this.libraryLimit += 60;
      this._renderTabBody(dlg);
    });
  }
}
