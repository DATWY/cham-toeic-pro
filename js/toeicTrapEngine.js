/**
 * TOEIC Deep Solution, Per-Option Elimination & Trap Coaching Engine (v24.0)
 * Zero-dependency ES module analyzing Parts 1–7 questions, stems, options,
 * bilingual explanations, speaker-attributed transcripts, morpho-syntactic grammar,
 * and user selections to produce concrete, non-generic explanations & trap coaching.
 */

const HTML_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—",
  hellip: "…", bull: "•", middot: "·",
  aacute: "á", agrave: "à", acirc: "â", atilde: "ã", auml: "ä",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
  iacute: "í", igrave: "ì", icirc: "î", iuml: "ï",
  oacute: "ó", ograve: "ò", ocirc: "ô", otilde: "õ", ouml: "ö",
  uacute: "ú", ugrave: "ù", ucirc: "û", uuml: "ü",
  yacute: "ý", yuml: "ÿ", ccedil: "ç", ntilde: "ñ",
  Aacute: "Á", Agrave: "À", Acirc: "Â", Atilde: "Ã",
  Eacute: "É", Egrave: "È", Ecirc: "Ê",
  Iacute: "Í", Igrave: "Ì", Icirc: "Î",
  Oacute: "Ó", Ograve: "Ò", Ocirc: "Ô", Otilde: "Õ",
  Uacute: "Ú", Ugrave: "Ù", Ucirc: "Û",
  Yacute: "Ý"
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "to", "of", "in", "on", "at",
  "by", "for", "with", "from", "up", "out", "as", "into", "over", "after",
  "this", "that", "these", "those", "it", "its", "he", "she", "they", "we",
  "you", "i", "me", "him", "her", "us", "them", "my", "your", "his", "our",
  "their", "is", "are", "was", "were", "be", "been", "being", "am", "do",
  "does", "did", "have", "has", "had", "will", "would", "can", "could",
  "should", "may", "might", "must", "shall", "not", "no", "yes", "very",
  "just", "so", "too", "also", "there", "here", "one", "some", "any", "all",
  "about", "what", "which", "who", "where", "when", "why", "how"
]);

/** Curated ETS TOEIC phonetic / near-homophone confusion pairs */
const CONFUSION_PAIRS = [
  ["work", "walk"], ["coat", "cart"], ["wear", "where"], ["plant", "plan"],
  ["glass", "grass"], ["shelf", "shell"], ["copy", "coffee"], ["ladder", "letter"],
  ["pack", "park"], ["row", "road"], ["rack", "track"], ["sink", "think"],
  ["dock", "dog"], ["pour", "pull"], ["sweep", "sleep"], ["pile", "file"],
  ["stair", "stare"], ["chair", "share"], ["shade", "shape"], ["bench", "branch"],
  ["expense", "expensive"], ["submit", "summit"], ["train", "rain"], ["board", "bored"],
  ["hire", "higher"], ["sale", "sail"], ["wait", "weight"], ["mail", "male"],
  ["meet", "meat"], ["week", "weak"], ["check", "desk"], ["flight", "light"],
  ["store", "floor"], ["price", "prize"], ["file", "mile"], ["order", "border"],
  ["staff", "stuff"], ["ship", "shop"], ["trip", "tip"], ["seat", "sheet"],
  ["sign", "line"], ["write", "right"], ["know", "no"], ["new", "knew"],
  ["buy", "by"], ["hour", "our"], ["course", "cause"], ["late", "wait"],
  ["charge", "change"], ["form", "from"], ["desk", "disk"], ["card", "car"],
  ["park", "part"], ["list", "lift"], ["post", "cost"], ["pay", "day"],
  ["tax", "task"], ["note", "vote"], ["phone", "loan"], ["bill", "build"],
  ["room", "broom"], ["menu", "venue"], ["report", "resort"], ["confirm", "conform"],
  ["career", "carrier"], ["branch", "brand"], ["travel", "trouble"], ["client", "quiet"],
  ["resume", "assume"], ["update", "upgrade"], ["present", "president"], ["supply", "surprise"],
  ["reserve", "review"], ["notice", "office"], ["contract", "contact"], ["project", "protect"],
  ["leave", "live"], ["live", "life"], ["suit", "suite"], ["read", "red"],
  ["pass", "past"], ["close", "clothes"], ["wear", "repair"], ["paint", "print"]
];

const CONFUSION_MAP = (() => {
  const m = new Map();
  for (const [a, b] of CONFUSION_PAIRS) {
    if (!m.has(a)) m.set(a, new Set());
    if (!m.has(b)) m.set(b, new Set());
    m.get(a).add(b);
    m.get(b).add(a);
  }
  return m;
})();

const PRONOUN_ROLES = {
  i: { role: "Đại từ chủ ngữ", rule: "Đứng đầu mệnh đề làm chủ ngữ trước động từ chia thì." },
  you: { role: "Đại từ chủ ngữ / Tân ngữ", rule: "Làm chủ ngữ trước V hoặc tân ngữ sau V/giới từ." },
  he: { role: "Đại từ chủ ngữ", rule: "Chỉ đứng trước động từ chia thì (S + V), không đứng trước danh từ." },
  she: { role: "Đại từ chủ ngữ", rule: "Chỉ đứng trước động từ chia thì (S + V), không đứng trước danh từ." },
  it: { role: "Đại từ chủ ngữ / Tân ngữ", rule: "Thay cho danh từ vật số ít, không đứng trực tiếp bổ nghĩa cho danh từ." },
  we: { role: "Đại từ chủ ngữ", rule: "Chỉ đứng trước động từ chia thì (S + V)." },
  they: { role: "Đại từ chủ ngữ", rule: "Chỉ đứng trước động từ chia thì (S + V), không đứng trước danh từ." },
  me: { role: "Đại từ tân ngữ", rule: "Đứng sau động từ hoặc giới từ; không làm chủ ngữ và không đứng trước danh từ." },
  him: { role: "Đại từ tân ngữ", rule: "Đứng sau động từ/giới từ; không đứng trực tiếp trước danh từ." },
  her: { role: "Tính từ sở hữu / Tân ngữ", rule: "Đứng trước danh từ (her + N) hoặc làm tân ngữ sau động từ/giới từ." },
  us: { role: "Đại từ tân ngữ", rule: "Đứng sau động từ/giới từ; không đứng trước danh từ." },
  them: { role: "Đại từ tân ngữ", rule: "Đứng sau động từ/giới từ; không đứng trước danh từ." },
  my: { role: "Tính từ sở hữu", rule: "Bắt buộc đi kèm Danh từ phía sau (my + N)." },
  your: { role: "Tính từ sở hữu", rule: "Bắt buộc đi kèm Danh từ phía sau (your + N)." },
  his: { role: "Tính từ sở hữu / Đại từ sở hữu", rule: "Đứng trước Danh từ (his + N) hoặc đứng độc lập thay cụm danh từ." },
  its: { role: "Tính từ sở hữu", rule: "Bắt buộc đi kèm Danh từ phía sau (its + N) — đừng nhầm với it's (= it is)." },
  our: { role: "Tính từ sở hữu", rule: "Bắt buộc đi kèm Danh từ phía sau (our + N)." },
  their: { role: "Tính từ sở hữu", rule: "Bắt buộc đi kèm Danh từ phía sau (their + N)." },
  mine: { role: "Đại từ sở hữu", rule: "Đứng độc lập (= my + N), tuyệt đối không có danh từ theo sau." },
  yours: { role: "Đại từ sở hữu", rule: "Đứng độc lập (= your + N), tuyệt đối không có danh từ theo sau." },
  hers: { role: "Đại từ sở hữu", rule: "Đứng độc lập (= her + N), nếu phía sau đã có danh từ thì loại ngay." },
  ours: { role: "Đại từ sở hữu", rule: "Đứng độc lập (= our + N), không có danh từ theo sau." },
  theirs: { role: "Đại từ sở hữu", rule: "Đứng độc lập (= their + N), không có danh từ theo sau." },
  myself: { role: "Đại từ phản thân", rule: "Dùng khi chủ ngữ = tân ngữ hoặc nhấn mạnh (by myself = tự mình)." },
  yourself: { role: "Đại từ phản thân", rule: "Dùng khi chủ ngữ là you hoặc đứng sau by (by yourself)." },
  himself: { role: "Đại từ phản thân", rule: "Chỉ dùng khi chủ ngữ là nam số ít hoặc nhấn mạnh; không bổ nghĩa trước N." },
  herself: { role: "Đại từ phản thân", rule: "Chỉ dùng khi chủ ngữ là nữ số ít hoặc nhấn mạnh; không bổ nghĩa trước N." },
  itself: { role: "Đại từ phản thân", rule: "Dùng nhấn mạnh chủ ngữ vật số ít hoặc sau by (by itself)." },
  ourselves: { role: "Đại từ phản thân", rule: "Dùng khi chủ ngữ là we hoặc nhấn mạnh." },
  themselves: { role: "Đại từ phản thân", rule: "Dùng khi chủ ngữ là they/danh từ số nhiều hoặc sau by." },
  who: { role: "Đại từ quan hệ (chỉ người)", rule: "Thay chủ ngữ người, theo sau là động từ chia thì." },
  whom: { role: "Đại từ quan hệ (tân ngữ người)", rule: "Theo sau là S + V hoặc đứng ngay sau giới từ (to/with whom)." },
  whose: { role: "Đại từ quan hệ sở hữu", rule: "Bắt buộc có Danh từ đi liền sau (whose + N)." },
  which: { role: "Đại từ quan hệ (chỉ vật)", rule: "Thay cho danh từ chỉ vật hoặc cả mệnh đề trước dấu phẩy." },
  that: { role: "Đại từ quan hệ / Liên từ", rule: "Không dùng sau dấu phẩy hoặc sau giới từ trực tiếp." },
  another: { role: "Từ hạn định (+ N số ít)", rule: "Đi với danh từ đếm được số ít hoặc đứng một mình." },
  other: { role: "Từ hạn định (+ N số nhiều/KĐĐ)", rule: "Đi với danh từ số nhiều hoặc không đếm được (other items)." },
  others: { role: "Đại từ (đứng độc lập)", rule: "Thay cho 'other + N số nhiều', không đứng trước danh từ." },
  each: { role: "Từ hạn định (+ N số ít)", rule: "Đi với danh từ đếm được số ít và chia động từ số ít." },
  every: { role: "Từ hạn định (+ N số ít)", rule: "Luôn đi trước danh từ số ít, không đứng độc lập." },
  either: { role: "Từ hạn định (1 trong 2)", rule: "Đi cặp either... or... hoặc đứng trước N số ít." },
  neither: { role: "Từ hạn định (không cái nào/2)", rule: "Đi cặp neither... nor... hoặc đứng trước N số ít." }
};

const CONJ_PREP_META = {
  although: { kind: "Liên từ (+ S + V)", meaning: "mặc dù" },
  though: { kind: "Liên từ (+ S + V)", meaning: "mặc dù" },
  "even though": { kind: "Liên từ (+ S + V)", meaning: "mặc dù" },
  while: { kind: "Liên từ (+ S + V)", meaning: "trong khi / trái lại" },
  whereas: { kind: "Liên từ (+ S + V)", meaning: "trong khi (đối lập)" },
  because: { kind: "Liên từ (+ S + V)", meaning: "bởi vì" },
  since: { kind: "Liên từ / Giới từ", meaning: "kể từ khi / bởi vì" },
  unless: { kind: "Liên từ (+ S + V)", meaning: "trừ khi (= if not)" },
  until: { kind: "Liên từ / Giới từ", meaning: "cho đến khi" },
  once: { kind: "Liên từ (+ S + V)", meaning: "ngay khi / một khi" },
  if: { kind: "Liên từ (+ S + V)", meaning: "nếu / liệu rằng" },
  whether: { kind: "Liên từ (+ S + V / to-V)", meaning: "liệu có... hay không" },
  after: { kind: "Liên từ / Giới từ", meaning: "sau khi" },
  before: { kind: "Liên từ / Giới từ", meaning: "trước khi" },
  when: { kind: "Liên từ (+ S + V)", meaning: "khi" },
  "now that": { kind: "Liên từ (+ S + V)", meaning: "bởi vì giờ đây" },
  "provided that": { kind: "Liên từ (+ S + V)", meaning: "miễn là" },
  "so that": { kind: "Liên từ (+ S + V)", meaning: "để mà" },
  despite: { kind: "Giới từ (+ Cụm N / V-ing)", meaning: "mặc dù" },
  "in spite of": { kind: "Giới từ (+ Cụm N / V-ing)", meaning: "mặc dù" },
  during: { kind: "Giới từ (+ Cụm N)", meaning: "trong suốt (không + S+V)" },
  "because of": { kind: "Giới từ (+ Cụm N / V-ing)", meaning: "bởi vì" },
  "due to": { kind: "Giới từ (+ Cụm N)", meaning: "do / bởi vì" },
  "owing to": { kind: "Giới từ (+ Cụm N)", meaning: "nhờ vào / do" },
  except: { kind: "Giới từ (+ Cụm N)", meaning: "ngoại trừ" },
  "except for": { kind: "Giới từ (+ Cụm N)", meaning: "ngoại trừ" },
  regarding: { kind: "Giới từ (+ Cụm N)", meaning: "liên quan đến" },
  concerning: { kind: "Giới từ (+ Cụm N)", meaning: "về vấn đề" },
  following: { kind: "Giới từ (+ Cụm N)", meaning: "ngay sau khi" },
  throughout: { kind: "Giới từ (+ Cụm N)", meaning: "xuyên suốt" },
  within: { kind: "Giới từ (+ Cụm N)", meaning: "trong vòng" },
  without: { kind: "Giới từ (+ Cụm N / V-ing)", meaning: "mà không có" },
  beyond: { kind: "Giới từ (+ Cụm N)", meaning: "vượt quá" },
  among: { kind: "Giới từ (+ N số nhiều >= 3)", meaning: "giữa (từ 3 trở lên)" },
  between: { kind: "Giới từ (+ 2 đối tượng)", meaning: "ở giữa (2 đối tượng)" },
  across: { kind: "Giới từ (+ Cụm N)", meaning: "khắp / băng qua" },
  besides: { kind: "Giới từ / Trạng từ nối", meaning: "ngoài ra / bên cạnh" },
  however: { kind: "Trạng từ nối (có dấu phẩy)", meaning: "tuy nhiên" },
  moreover: { kind: "Trạng từ nối (có dấu phẩy)", meaning: "hơn nữa" },
  therefore: { kind: "Trạng từ nối (có dấu phẩy)", meaning: "do đó" },
  otherwise: { kind: "Trạng từ nối", meaning: "nếu không thì" },
  meanwhile: { kind: "Trạng từ nối (có dấu phẩy)", meaning: "trong lúc đó" },
  instead: { kind: "Trạng từ nối", meaning: "thay vào đó" },
  likewise: { kind: "Trạng từ nối", meaning: "tương tự như vậy" },
  additionally: { kind: "Trạng từ nối", meaning: "thêm vào đó" }
};

export function decodeRichEntities(str = "") {
  if (!str) return "";
  return String(str)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&([a-zA-Z]+);/g, (m, k) => HTML_ENTITIES[k] ?? HTML_ENTITIES[k.toLowerCase()] ?? m);
}

function stripHtmlToLines(html = "") {
  if (!html) return [];
  const raw = String(html)
    .replace(/<(?:br\s*\/?|\/p|\/div|\/li|\/tr|\/h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeRichEntities(raw)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function stripHtmlFlat(html = "") {
  return stripHtmlToLines(html).join(" ");
}

function cleanOptText(raw = "", choice = "") {
  const txt = decodeRichEntities(raw || "").replace(/\ufeff/g, "").trim();
  if (!txt || /\{\{blank\}\}/i.test(txt)) return "";
  if (!choice) return txt;
  const esc = String(choice).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = txt.match(new RegExp(`^\\s*(?:\\(${esc}\\)|${esc}[.)])\\s+(.+)$`, "i"));
  return m ? m[1].trim() : txt;
}

function getOptionsMap(q, parsedP12) {
  const out = {};
  for (const opt of q?.options || []) {
    const ch = String(opt.choice || "").toUpperCase();
    const txt = cleanOptText(opt.text || "", ch) || cleanOptText(parsedP12?.options?.[ch] || "", ch);
    if (ch) out[ch] = txt;
  }
  if (parsedP12?.options) {
    for (const [k, v] of Object.entries(parsedP12.options)) {
      const ch = k.toUpperCase();
      if (!out[ch] && v) out[ch] = cleanOptText(v, ch);
    }
  }
  return out;
}

function tokenizeContent(text = "") {
  return (String(text).toLowerCase().match(/[a-z]{3,}/g) || [])
    .filter((w) => !STOPWORDS.has(w));
}

function stemWord(w = "") {
  const s = w.toLowerCase();
  if (s.length <= 4) return s;
  if (s.endsWith("ies") && s.length > 5) return `${s.slice(0, -3)}y`;
  if (s.endsWith("ing") && s.length > 5) return s.slice(0, -3);
  if (s.endsWith("ied") && s.length > 5) return `${s.slice(0, -3)}y`;
  if (s.endsWith("ed") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("ly") && s.length > 5) return s.slice(0, -2);
  if (s.endsWith("es") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("s") && !s.endsWith("ss") && s.length > 4) return s.slice(0, -1);
  return s;
}

function findRepeatedAndSimilarWords(sourceTokens, targetTokens) {
  const srcSet = new Set(sourceTokens);
  const srcStems = new Map(sourceTokens.map((w) => [stemWord(w), w]));
  const repeated = [];
  const similar = [];

  for (const w of targetTokens) {
    const st = stemWord(w);
    if (srcSet.has(w) || (st.length >= 4 && srcStems.has(st))) {
      const matched = srcSet.has(w) ? w : srcStems.get(st);
      if (!repeated.includes(matched)) repeated.push(matched);
      continue;
    }
    const conf = CONFUSION_MAP.get(w) || CONFUSION_MAP.get(st);
    if (conf) {
      for (const s of sourceTokens) {
        if (conf.has(s) || conf.has(stemWord(s))) {
          similar.push(`${w} ↔ ${s}`);
          break;
        }
      }
      continue;
    }
    if (w.length >= 4) {
      for (const s of sourceTokens) {
        if (s.length >= 4 && w !== s && st !== stemWord(s) && w.slice(0, 4) === s.slice(0, 4)) {
          similar.push(`${w} ↔ ${s}`);
          break;
        }
      }
    }
  }
  return { repeated: repeated.slice(0, 2), similar: similar.slice(0, 2) };
}

function truncateQuote(s = "", max = 230) {
  const clean = String(s).replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

/* ============================================================
   GROUP EXPLANATION PARSERS (P1/P2 Vi, P3/P4 Vi Evidence, P6/P7 Split)
   ============================================================ */

/**
 * Parses Vietnamese translations of stem + options (A/B/C/D) from Part 1 & Part 2 group.explanationHtml.
 * Detects whether group.explanationHtml is purely a simple translation block (foldable into card)
 * versus a rich structured #json-mode / IPA table block (kept below).
 */
function parsePart12ViTranslation(explanationHtml = "") {
  if (!explanationHtml) return { viStem: "", viOptions: {}, isPureTranslation: false };
  const isRichStructured = /cham-jm-sec|<table\b|Từ Vựng Cần Nhớ|Chiến Thuật/i.test(explanationHtml);
  const fullText = stripHtmlToLines(explanationHtml).join("\n");
  if (!fullText) return { viStem: "", viOptions: {}, isPureTranslation: false };

  const pattern = /(?:(?<=^|\n|\s)[✓✔✅ \t]*\(([A-D])\)|(?<=^|\n)[✓✔✅ \t]*([A-D])[.)])[ \t]*/g;
  const matches = Array.from(fullText.matchAll(pattern));
  if (matches.length < 3) return { viStem: "", viOptions: {}, isPureTranslation: false };

  const viStem = fullText
    .slice(0, matches[0].index)
    .replace(/^(?:Bản dịch và giải thích|Bản dịch|Dịch nghĩa|Câu hỏi)\s*[:.-]?\s*/i, "")
    .replace(/^(?:Câu hỏi)\s*[:.-]?\s*/i, "")
    .replace(/\s*[✓✔✅]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const viOptions = {};
  for (let i = 0; i < matches.length; i++) {
    const letter = (matches[i][1] || matches[i][2] || "").toUpperCase();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : fullText.length;
    let val = fullText.slice(start, end);
    // Stop before trailing extra notes on the last option
    if (i === matches.length - 1) {
      val = val.split(/\n(?:Giải thích|Từ vựng|Lưu ý|Chiến thuật)/i)[0];
    }
    val = val
      .replace(/\s*[✓✔✅]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (letter && !viOptions[letter] && val) {
      viOptions[letter] = val;
    }
  }

  const extraAfter = /Giải thích|Từ vựng|Lưu ý|Chiến thuật/i.test(fullText);
  const isPureTranslation = !isRichStructured && !extraAfter && Object.keys(viOptions).length >= 3 && fullText.length < 750;
  return { viStem, viOptions, isPureTranslation };
}

/**
 * Extracts per-question HTML block `[qNum] ...` from Part 6 / Part 7 / Part 3 / Part 4 group.explanationHtml
 * so ETS tests display each question's exact translation & reasoning right inside that question's own card!
 */
export function extractPerQuestionGroupHtml(explanationHtml = "", qNum = 0, allQNums = []) {
  if (!explanationHtml || !qNum) return { qHtml: "", hasSplit: false };
  const html = String(explanationHtml);
  const nums = (allQNums || []).map(Number).filter(Boolean).sort((a, b) => a - b);
  const qIdx = nums.indexOf(Number(qNum));
  const nextNums = qIdx >= 0 ? nums.slice(qIdx + 1) : [Number(qNum) + 1];

  // Match <p>[131]</p> or <p>[147] Điều gì...</p> or <p><strong>[131]</strong>...
  const startRe = new RegExp(`<(?:p|div|h[3-6]|li)[^>]*>(?:\\s*<(?:strong|b|span)[^>]*>)*\\s*\\[${qNum}\\](?!\\s*[a-z])`, "i");
  const startMatch = html.match(startRe);
  if (!startMatch) return { qHtml: "", hasSplit: false };

  const startPos = startMatch.index;
  // Make sure this isn't an inline highlighted sentence inside a dialogue/passage (e.g. "Nam: ... [32] ...")
  const beforeSnippet = html.slice(Math.max(0, startPos - 6), startPos + 45);
  if (/^(?:<p[^>]*>)?\s*(?:Nam|Nữ|Người|M-|W-)/i.test(beforeSnippet)) {
    return { qHtml: "", hasSplit: false };
  }

  const tail = html.slice(startPos + startMatch[0].length);
  let endOffset = tail.length;

  // End at the next question block [nextNum]
  for (const nn of nextNums) {
    const nextRe = new RegExp(`<(?:p|div|h[3-6]|li)[^>]*>(?:\\s*<(?:strong|b|span)[^>]*>)*\\s*\\[${nn}\\]`, "i");
    const nm = tail.match(nextRe);
    if (nm && nm.index < endOffset) {
      endOffset = nm.index;
    }
  }

  // On the last question in Part 7, stop before full Vietnamese passage translation if present
  const passageMarkers = [
    /<p[^>]*>\s*<strong>\s*(?:PHIẾU|EMAIL|THƯ|THÔNG BÁO|BÀI BÁO|QUẢNG CÁO|TIN NHẮN|LỊCH TRÌNH|HÓA ĐƠN|DỊCH ĐOẠN|BẢN DỊCH|ĐOẠN VĂN|TẠM DỊCH)/i,
    /<p[^>]*>\s*(?:Bản dịch bài đọc|Dịch bài đọc|Dịch đoạn văn)\s*[:.-]?/i,
    /<hr\s*\/?>/i
  ];
  for (const pm of passageMarkers) {
    const m = tail.match(pm);
    if (m && m.index > 30 && m.index < endOffset) {
      endOffset = m.index;
    }
  }

  // Also check if after </ul> there is a brand-new bold ALL-CAPS document title (Part 7 ETS 2026 pattern: </ul><p><strong>PHIẾU GIẢM GIÁ</strong>...)
  const ulEnd = tail.indexOf("</ul>");
  if (ulEnd > 0 && ulEnd + 5 < endOffset) {
    const afterUl = tail.slice(ulEnd + 5);
    const docStart = afterUl.match(/^\s*<p[^>]*>\s*<strong>[^<]{4,90}<\/strong>/i);
    if (docStart) {
      // Check it's not an explanation note like "Giải thích:" / "Đáp án:" / "Lưu ý:"
      const titleTxt = stripHtmlFlat(docStart[0]);
      if (!/^(?:Giải thích|Đáp án|Lưu ý|Từ vựng|Dịch|Phân tích|Chọn)/i.test(titleTxt)) {
        endOffset = ulEnd + 5;
      }
    }
  }

  const chunk = html.slice(startPos, startPos + startMatch[0].length + endOffset).trim();
  const plain = stripHtmlFlat(chunk);
  if (plain.length < 18) return { qHtml: "", hasSplit: false };
  return { qHtml: chunk, hasSplit: true };
}

/**
 * Extracts inline `[qNum]` or `(qNum)` highlighted quote from HTML (works for both EN transcript & VI translation!).
 */
function extractBracketEvidence(html = "", qNum = 0) {
  if (!html || !qNum) return "";
  const raw = decodeRichEntities(String(html));
  // Prefer [qNum] or (qNum) inside dialogue/passage text
  const patterns = [
    new RegExp(`\\[${qNum}\\]([\\s\\S]{8,280}?)(?=\\[\\d{2,3}\\]|<\\/strong>|<\\/p>|<br|$)`, "i"),
    new RegExp(`\\(${qNum}\\)([\\s\\S]{8,280}?)(?=\\(\\d{2,3}\\)|<\\/strong>|<\\/p>|<br|$)`, "i")
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m && m[1]) {
      const clean = stripHtmlFlat(m[1])
        .replace(/^(?:M-Cn|M-Au|W-Am|W-Br|Man|Woman|Nam|Nữ|Speaker\s*\d*)\s*:\s*/i, "")
        .trim();
      // Skip if this match is actually the translated question stem itself (ends with ?)
      if (clean.length >= 12 && !/^(?:Người đàn ông|Người phụ nữ|Điều gì|Tại sao|Ai |Ở đâu|Khi nào)/.test(clean)) {
        return truncateQuote(clean, 225);
      }
    }
  }
  return "";
}

/* ============================================================
   PART 1 ANALYZER (603 Qs)
   ============================================================ */
function analyzePart1({ q, group, optMap }) {
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = optMap[ans] || "";
  const ansTokens = tokenizeContent(ansText);
  const { viOptions, isPureTranslation } = parsePart12ViTranslation(group?.explanationHtml || "");

  const allTexts = Object.values(optMap).join(" ");
  const hasPeople = /\b(man|woman|men|women|people|person|worker|pedestrian|customer|passenger|someone|he|she|they)\b/i.test(allTexts);
  const isBeingPassive = /\b(is|are)\s+being\s+[a-z]+(?:ed|en|wn|pt|lt|nt|ht|un|id)\b/i;
  const stateActionRe = /\b(putting on|trying on|picking up|reaching for|taking off|getting into)\b/i;

  let isHardTrap = isBeingPassive.test(allTexts);
  const distractorTraps = [];
  const optionBreakdown = [];

  for (const ch of ["A", "B", "C", "D"]) {
    const txt = optMap[ch] || "";
    const vi = viOptions[ch] || "";
    if (!txt && !vi) continue;

    if (ch === ans) {
      let whyRight = "Mô tả khớp trực tiếp chủ thể, hành động/trạng thái và vị trí hiển thị rõ trong ảnh.";
      if (isBeingPassive.test(txt)) {
        whyRight = "Cấu trúc bị động tiếp diễn (is/are being + V3) đúng vì ảnh cho thấy rõ người đang tác động trực tiếp lên vật.";
      } else if (/\b(?:is|are)\s+(?:located|arranged|stacked|lined up|parked|displayed|placed|positioned|hanging|attached)\b/i.test(txt) || /\bthere\s+(?:is|are)\b/i.test(txt)) {
        whyRight = "Dùng cấu trúc mô tả trạng thái tĩnh chuẩn ETS khớp với bố cục vật thể trong ảnh.";
      } else if (/\b(?:wearing|holding|looking at|carrying|sitting|standing|pointing)\b/i.test(txt)) {
        const mVerb = txt.match(/\b(wearing|holding|looking at|carrying|sitting|standing|pointing|reading|walking|typing|writing)\b/i);
        whyRight = `Động từ trọng tâm “${mVerb ? mVerb[1] : "V-ing"}” khớp chính xác với tư thế/hành động của nhân vật trong khung hình.`;
      }
      optionBreakdown.push({
        choice: ch, text: txt, viText: vi, isCorrect: true,
        roleBadge: "Đáp án đúng", reason: whyRight
      });
      continue;
    }

    let tag = "Bẫy Sai chi tiết";
    let detail = "Mô tả động tác, vật thể hoặc vị trí không xuất hiện trong khung hình.";

    if (isBeingPassive.test(txt)) {
      isHardTrap = true;
      tag = "Bẫy Bị động tiếp diễn";
      detail = "Cấu trúc “is/are being + V3” chỉ đúng khi thấy rõ người đang trực tiếp thao tác; ảnh tĩnh không có tác động → loại ngay.";
    } else if (stateActionRe.test(txt)) {
      isHardTrap = true;
      tag = "Bẫy Trạng thái vs Hành động";
      detail = "Phân biệt hành động đang thực hiện (putting on / reaching for / picking up) với trạng thái đã có sẵn (wearing / holding).";
    } else {
      const { repeated, similar } = findRepeatedAndSimilarWords(ansTokens, tokenizeContent(txt));
      if (similar.length) {
        tag = "Bẫy Âm gần giống";
        detail = `Dễ nghe nhầm cặp âm (${similar.join(", ")}), thực tế tả sai vật thể hoặc hành động.`;
      } else if (repeated.length) {
        tag = "Bẫy Lặp danh từ + Sai động từ";
        detail = `Giữ nguyên từ khóa quen thuộc (${repeated.join(", ")}) nhưng gài sai động từ hành động hoặc giới từ vị trí.`;
      } else if (!hasPeople && /\b(has|have)\s+been\s+/i.test(txt)) {
        tag = "Bẫy Sai trạng thái vật";
        detail = "Dùng thì hiện tại hoàn thành bị động cho chi tiết không thể suy ra trực tiếp từ bức ảnh.";
      }
    }

    distractorTraps.push({ choice: ch, tag, detail });
    optionBreakdown.push({
      choice: ch, text: txt, viText: vi, isCorrect: false,
      roleBadge: tag, reason: detail
    });
  }

  return {
    qTypeBadge: hasPeople ? "Part 1 · Tranh có người" : "Part 1 · Tranh vật & phong cảnh",
    trapCategory: isHardTrap ? "Part 1 · Bẫy Bị động / Trạng thái" : "Part 1 · Bẫy Động từ & Âm gần giống",
    isHardTrap,
    formulaBox: "",
    evidenceQuote: "",
    evidenceVi: "",
    viStem: "",
    perQuestionHtml: "",
    foldGroupExpl: isPureTranslation,
    optionBreakdown,
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip: hasPeople
      ? "Soi trục [Chủ ngữ → Động từ V-ing → Tân ngữ]: nghe thật kỹ động từ chính xem tay/mắt nhân vật có khớp hành động đang nói không."
      : "Tranh không người: ưu tiên cấu trúc tĩnh (There is/are, is + V3, is arranged/lined up); loại ngay “being + V3” khi không có người thao tác.",
    strategyNote: "Đừng cố dịch hết cả câu — chỉ cần chốt đúng Động từ hành động + Giới từ vị trí để loại nhanh 3 phương án nhiễu."
  };
}

/* ============================================================
   PART 2 ANALYZER (2,314 Qs)
   ============================================================ */
function classifyPart2Stem(stem = "") {
  const s = stem.trim();
  const low = s.toLowerCase();
  if (/^who\b/i.test(low)) return { code: "WHO", label: "Part 2 · Câu hỏi WHO (Người / Bộ phận)", isWh: true };
  if (/^where\b/i.test(low)) return { code: "WHERE", label: "Part 2 · Câu hỏi WHERE (Địa điểm)", isWh: true };
  if (/^(when|what time)\b/i.test(low)) return { code: "WHEN", label: "Part 2 · Câu hỏi WHEN (Thời gian)", isWh: true };
  if (/^why\b/i.test(low)) return { code: "WHY", label: "Part 2 · Câu hỏi WHY (Lý do)", isWh: true };
  if (/^how often\b/i.test(low)) return { code: "HOW_OFTEN", label: "Part 2 · Câu hỏi HOW OFTEN (Tần suất)", isWh: true };
  if (/^how long\b/i.test(low)) return { code: "HOW_LONG", label: "Part 2 · Câu hỏi HOW LONG (Thời lượng)", isWh: true };
  if (/^how (?:many|much|far)\b/i.test(low)) return { code: "HOW_NUM", label: "Part 2 · Hỏi Số lượng / Giá / Khoảng cách", isWh: true };
  if (/^how\b/i.test(low)) return { code: "HOW", label: "Part 2 · Câu hỏi HOW (Cách thức / Đánh giá)", isWh: true };
  if (/^(what|which|whose)\b/i.test(low)) return { code: "WHAT", label: "Part 2 · Câu hỏi WHAT / WHICH", isWh: true };
  if (/\bor\b.+\?$/i.test(low) && !/^(who|where|when|why|how|what|which)\b/i.test(low)) {
    return { code: "CHOICE", label: "Part 2 · Câu hỏi Lựa chọn (A or B)", isWh: false, isChoice: true };
  }
  if (/,\s*(?:isn't|aren't|wasn't|weren't|don't|doesn't|didn't|haven't|hasn't|won't|can't|couldn't|shouldn't|wouldn't|is|are|do|does|did|will|can)\s+(?:it|he|she|they|we|you|there)\??$/i.test(low)) {
    return { code: "TAG", label: "Part 2 · Câu hỏi Đuôi (Tag Question)", isWh: false, isYesNo: true };
  }
  if (/^(?:don't|doesn't|didn't|isn't|aren't|wasn't|weren't|haven't|hasn't|won't|can't|couldn't|shouldn't|wouldn't)\b/i.test(low)) {
    return { code: "NEG", label: "Part 2 · Câu hỏi Phủ định (Negative)", isWh: false, isYesNo: true };
  }
  if (/^(?:do|does|did|is|are|was|were|have|has|had|will|would|can|could|should|may|might)\b/i.test(low) && /\?$/.test(s)) {
    return { code: "YESNO", label: "Part 2 · Câu hỏi Yes / No", isWh: false, isYesNo: true };
  }
  return { code: "STATEMENT", label: "Part 2 · Câu Trần thuật / Đề nghị", isWh: false, isStatement: true };
}

function isPart2IndirectAnswer(ansText = "") {
  const a = ansText.trim();
  if (!a) return false;
  return (
    /\?$/.test(a) ||
    /\b(i don't know|not sure|haven't decided|haven't heard|let me check|ask\s+\w+|check with|it depends|i was out|actually|neither|nobody told|hard to say|i'd rather|why don't|check the)\b/i.test(a)
  );
}

function analyzePart2({ q, group, optMap, parsedP12 }) {
  const stem = decodeRichEntities(q?.stem || parsedP12?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = optMap[ans] || "";
  const cls = classifyPart2Stem(stem);
  const indirect = isPart2IndirectAnswer(ansText);
  const { viStem, viOptions, isPureTranslation } = parsePart12ViTranslation(group?.explanationHtml || "");

  const stemTokens = tokenizeContent(stem);
  const distractorTraps = [];
  const optionBreakdown = [];

  for (const ch of ["A", "B", "C"]) {
    const txt = (optMap[ch] || "").trim();
    const vi = viOptions[ch] || "";
    if (!txt && !vi) continue;

    if (ch === ans) {
      let whyRight = "Phản hồi trực tiếp và tự nhiên đúng trọng tâm câu hỏi.";
      if (indirect) {
        whyRight = "Câu trả lời gián tiếp chuẩn ETS (né trả lời thẳng nhưng hợp ngữ cảnh giao tiếp công sở).";
      } else if (cls.code === "WHERE") {
        whyRight = "Chỉ rõ vị trí / địa điểm trả lời trực tiếp cho câu hỏi Where.";
      } else if (cls.code === "WHEN" || cls.code === "HOW_OFTEN" || cls.code === "HOW_LONG") {
        whyRight = "Cung cấp đúng mốc thời gian / tần suất / thời lượng được hỏi.";
      } else if (cls.code === "WHO") {
        whyRight = "Chỉ rõ người phụ trách, chức danh hoặc phòng ban trả lời cho Who.";
      } else if (cls.code === "WHY") {
        whyRight = "Nêu trực tiếp nguyên nhân / mục đích hợp logic cho câu hỏi Why.";
      } else if (cls.code === "CHOICE") {
        whyRight = "Chọn rõ 1 phương án / cả hai / không chọn đúng cấu trúc câu hỏi lựa chọn (or).";
      }
      optionBreakdown.push({
        choice: ch, text: txt, viText: vi, isCorrect: true,
        roleBadge: indirect ? "Đáp án gián tiếp" : "Đáp án đúng",
        reason: whyRight
      });
      continue;
    }

    const startsYesNo = /^(?:yes|no|sure|of course|certainly|yeah|nope|okay|ok)\b/i.test(txt);
    const hasTimePhrase = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|o'clock|am|pm|tomorrow|yesterday|once a|every day|week|month|year|minutes|hours|ago|until|since|20\d{2})\b/i.test(txt);
    const hasPlacePhrase = /\b(floor|room|lobby|office|building|street|wall|corner|table|shelf|desk|hall|warehouse|department|across|next to|down the hall|in front|on the)\b/i.test(txt);
    const isBareNounPhrase = /^(?:a|an|the|my|our|your|some|several)\s+\w+(?:\s+\w+){0,3}[.?!]?$/i.test(txt) && !hasTimePhrase && !hasPlacePhrase;
    const { repeated, similar } = findRepeatedAndSimilarWords(stemTokens, tokenizeContent(txt));

    let tag = "Bẫy Lạc đề";
    let detail = "Ngữ điệu tự nhiên nhưng không giải quyết trực tiếp nhu cầu thông tin của câu hỏi.";

    if ((cls.isWh || cls.isChoice) && startsYesNo) {
      tag = "Bẫy Yes/No";
      detail = "Mở đầu bằng Yes/No/Sure nhưng câu hỏi là Wh- hoặc Lựa chọn (or) → loại thẳng theo quy tắc ETS.";
    } else if (similar.length) {
      tag = "Bẫy Âm gần giống";
      detail = `Cài từ phát âm gần giống với câu hỏi (${similar.join(", ")}) để đánh lừa khi nghe lướt.`;
    } else if (repeated.length) {
      tag = "Bẫy Lặp từ khóa";
      detail = `Lặp nguyên từ khóa “${repeated.join(", ")}” từ câu hỏi nhưng nội dung trả lời hoàn toàn lệch trọng tâm.`;
    } else if ((cls.code === "WHERE" || cls.code === "WHO") && hasTimePhrase && !hasPlacePhrase) {
      tag = "Bẫy Sai loại câu hỏi";
      detail = `Hỏi ${cls.code === "WHERE" ? "địa điểm (Where)" : "người (Who)"} nhưng đáp án lại trả lời về thời gian.`;
    } else if ((cls.code === "WHEN" || cls.code === "HOW_OFTEN" || cls.code === "WHY") && hasPlacePhrase && !hasTimePhrase) {
      tag = "Bẫy Sai loại câu hỏi";
      detail = "Trả lời chỉ vị trí/địa điểm trong khi câu hỏi không phải Where.";
    } else if (cls.code === "WHERE" && hasPlacePhrase) {
      tag = "Bẫy Đúng giới từ nhưng Sai hành động";
      detail = `Gài cụm vị trí (“${txt}”) đánh lừa người chỉ nghe lướt giới từ, nhưng sai hoàn toàn hành động được hỏi.`;
    } else if ((cls.code === "WHERE" || cls.code === "WHEN" || cls.code === "WHY") && isBareNounPhrase) {
      tag = "Bẫy Cụm danh từ trơ";
      detail = `Chỉ nêu cụm danh từ đơn lẻ (“${txt}”) — thiếu giới từ/thông tin trả lời cho câu hỏi.`;
    } else if (distractorTraps.some((d) => d.tag === "Bẫy Lạc đề")) {
      tag = "Bẫy Sai ngữ cảnh";
      detail = `Phương án “${txt}” chuyển sang việc khác, không khớp hành động hoặc đối tượng đang hỏi.`;
    }

    distractorTraps.push({ choice: ch, tag, detail });
    optionBreakdown.push({
      choice: ch, text: txt, viText: vi, isCorrect: false,
      roleBadge: tag, reason: detail
    });
  }

  const tipByCode = {
    WHO: "Bắt chữ đầu “Who”: đáp án đúng là tên riêng, chức danh, phòng ban (HR, Accounting) hoặc câu gián tiếp (Ask X / I'm not sure).",
    WHERE: "Bắt “Where”: ưu tiên cụm giới từ vị trí (on/in/at/down the hall/next to) hoặc chỉ dẫn nơi tìm (Check the manual / Ask Sam).",
    WHEN: "Bắt “When / What time”: tìm mốc giờ/ngày, mệnh đề Until/After/As soon as hoặc câu báo chưa chốt lịch.",
    WHY: "Bắt “Why”: ngoài Because / To + V / For + N, ETS rất hay nêu thẳng sự cố/nguyên nhân mà KHÔNG dùng chữ “because”.",
    HOW_OFTEN: "Bắt “How often”: đáp án đúng thường chứa tần suất (Once a week, Every month, Twice a year, Usually, Rarely).",
    HOW_LONG: "Bắt “How long”: nghe khoảng thời gian (for two weeks, until Friday, about an hour) — tránh nhầm sang mốc giờ.",
    HOW_NUM: "Bắt “How many / much / far”: chú ý con số, đơn vị tiền/khoảng cách hoặc “at least / around / free of charge”.",
    HOW: "Bắt “How”: hỏi cách thức (by + V-ing / phương tiện) hoặc đánh giá cảm nhận (It was useful / Very well).",
    WHAT: "Bắt danh từ ngay sau “What / Which” (what time, what floor, which model) để khóa đúng phạm vi trả lời.",
    CHOICE: "Câu hỏi “A or B”: loại ngay Yes/No; đáp án đúng chọn 1 trong 2, chọn cả hai (Both), không chọn (Neither), hoặc trả lời gián tiếp.",
    TAG: "Câu hỏi Đuôi: BỎ QUA phần đuôi phủ định/khẳng định — đúng sự thật chọn Yes, sai sự thật chọn No.",
    NEG: "Câu hỏi Phủ định (Don't / Isn't / Haven't...): dịch như câu hỏi thường; Yes = có/vẫn vậy, No = không.",
    YESNO: "Chú ý ~30% đáp án đúng là câu trả lời gián tiếp (nêu điều kiện, lý do, hỏi lại) không mở đầu bằng Yes/No.",
    STATEMENT: "Câu trần thuật (không có từ để hỏi): chọn phản hồi đồng cảm, đề nghị giúp đỡ, câu hỏi nối tiếp hoặc cập nhật hành động."
  };

  return {
    qTypeBadge: indirect ? `${cls.label} · Gián tiếp` : cls.label,
    trapCategory: indirect ? "Part 2 · Câu trả lời gián tiếp" : `Part 2 · ${cls.code === "STATEMENT" ? "Câu trần thuật" : "Hỏi-Đáp & Bẫy âm"}`,
    isHardTrap: indirect || cls.isStatement || cls.code === "NEG" || cls.code === "TAG",
    formulaBox: "",
    evidenceQuote: "",
    evidenceVi: "",
    viStem,
    perQuestionHtml: "",
    foldGroupExpl: isPureTranslation,
    optionBreakdown,
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip: tipByCode[cls.code] || tipByCode.STATEMENT,
    strategyNote: indirect
      ? "Chiến thuật ETS 750+: Khi phân vân, ưu tiên giữ câu trả lời gián tiếp (I don't know / Ask X / It hasn't been decided / câu hỏi ngược ?)."
      : "Mẹo 3 giây đầu: Khóa chặt 1–2 chữ ĐẦU TIÊN của câu hỏi để loại ngay bẫy Yes/No và bẫy lặp từ."
  };
}

/* ============================================================
   PART 3 & 4 ANALYZER (6,045 Qs)
   ============================================================ */
function parseSpeakerTurns(transcriptHtml = "") {
  const lines = stripHtmlToLines(transcriptHtml);
  const manLines = [];
  const womanLines = [];
  for (const ln of lines) {
    if (/^(?:M-(?:Cn|Au|Am|Br)|Man|Male)\s*:/i.test(ln)) manLines.push(ln);
    else if (/^(?:W-(?:Cn|Au|Am|Br)|Woman|Female)\s*:/i.test(ln)) womanLines.push(ln);
  }
  return {
    manTokens: tokenizeContent(manLines.join(" ")),
    womanTokens: tokenizeContent(womanLines.join(" "))
  };
}

function detectExtremeOrNumericTrap(txt = "") {
  const ext = txt.match(/\b(only|exclusively|always|never|solely|entirely|every|all of the|no longer|must be)\b/i);
  if (ext) {
    return {
      tag: "Bẫy Từ cực đoan",
      detail: `Chứa từ tuyệt đối hóa “${ext[1]}” — dạng bẫy phổ biến của ETS khi bài gốc chỉ nói một phần hoặc có ngoại lệ.`
    };
  }
  const num = txt.match(/(\$[\d,.]+|\d+%|\b(?:more than|less than|twice|half|at least)\s+[\w$., ]{1,24})/i);
  if (num) {
    return {
      tag: "Bẫy Con số / So sánh",
      detail: `Đưa con số/so sánh cụ thể (“${num[1].trim()}”) — rất hay bị tráo đơn vị, giá gốc vs giá giảm hoặc mốc thời gian.`
    };
  }
  return null;
}

function analyzePart34({ part, q, group, optMap }) {
  const stem = decodeRichEntities(q?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = optMap[ans] || "";
  const transcriptHtml = group?.transcriptHtml || "";
  const explanationHtml = group?.explanationHtml || "";
  const transcriptText = stripHtmlFlat(transcriptHtml);

  // Extract bilingual evidence (EN from transcript + VI from group.explanationHtml)
  let evidenceQuote = extractBracketEvidence(transcriptHtml, q?.num);
  if (!evidenceQuote && transcriptHtml) {
    const lines = stripHtmlToLines(transcriptHtml);
    const queryTokens = new Set([...tokenizeContent(stem), ...tokenizeContent(ansText)].map(stemWord));
    let bestLine = "";
    let bestScore = 0;
    for (const ln of lines) {
      if (ln.length < 18) continue;
      let hits = 0;
      for (const st of tokenizeContent(ln).map(stemWord)) {
        if (queryTokens.has(st)) hits++;
      }
      if (hits > bestScore) { bestScore = hits; bestLine = ln; }
    }
    if (bestScore >= 2) evidenceQuote = truncateQuote(bestLine, 220);
  }
  const evidenceVi = extractBracketEvidence(explanationHtml, q?.num);
  const allQNums = (group?.questions || []).map((x) => x.num);
  const { qHtml: perQuestionHtml } = !q?.explanation
    ? extractPerQuestionGroupHtml(explanationHtml, q?.num, allQNums)
    : { qHtml: "" };

  const isGraphic = /\b(look at the graphic|chart|map|schedule|table|floor|list|receipt|coupon|menu|directory|invoice|itinerary|sign)\b/i.test(stem)
    || (Array.isArray(group?.images) && group.images.length > 0 && /how much|which|where|what\s+(?:fee|date|time|room|platform|discount|item|option)/i.test(stem));
  const isImplied = /\b(mean when|imply|why does the (?:man|woman|speaker) say,?\s*["“])/i.test(stem) || /["“][^"”]{4,}["”]/.test(stem);
  const isMain = /\b(who (?:most likely|are the speakers|is the speaker)|where (?:are|does|most likely)|what is the (?:main )?(?:purpose|topic)|what kind of business|what are the speakers discussing)\b/i.test(stem);
  const isNext = /\b(do next|asked to do|remind|what will the .+ do|suggested|recommend)\b/i.test(stem);

  let qTypeBadge = `Part ${part} · Chi tiết & Paraphrase`;
  let trapCategory = `Part ${part} · Paraphrase & Chi tiết`;
  let quickTip = "Câu hỏi Part 3/4 chạy đúng thứ tự băng (Câu 1 → đầu, Câu 2 → giữa, Câu 3 → cuối). Luôn săn cụm đồng nghĩa (Paraphrase) thay vì bắt từ y hệt.";
  let isHardTrap = false;

  if (isGraphic) {
    qTypeBadge = `Part ${part} · Đối chiếu Biểu đồ / Bảng`;
    trapCategory = `Part ${part} · Đối chiếu Biểu đồ`;
    isHardTrap = true;
    quickTip = "KHÔNG chờ nghe đáp án đọc thẳng: ETS luôn đọc phần cột/mục LIÊN KẾT (tên mục, giờ, tầng, mã) rồi bắt bạn gióng sang cột đáp án trên biểu đồ.";
  } else if (isImplied) {
    qTypeBadge = `Part ${part} · Câu hỏi Hàm ý (Implied)`;
    trapCategory = `Part ${part} · Câu hỏi Hàm ý`;
    isHardTrap = true;
    quickTip = "Với câu trích trong ngoặc kép “...”, nghe thật kỹ 1 câu TRƯỚC và 1 câu SAU câu trích + ngữ điệu (đồng ý / từ chối khéo / nhắc nhở).";
  } else if (isMain) {
    qTypeBadge = `Part ${part} · Tổng quát / Ngữ cảnh`;
    quickTip = "Chốt ngay trong 2–3 câu đầu băng: bắt các danh từ chuyên ngành đặc trưng để suy ra nghề nghiệp, địa điểm hoặc chủ đề.";
  } else if (isNext) {
    qTypeBadge = `Part ${part} · Hành động tiếp theo`;
    quickTip = "Khóa 1–2 câu CUỐI băng + cụm gợi ý hành động (I'll, Why don't you, Please make sure, Let me).";
  }

  const distractorTraps = [];
  const transTokens = tokenizeContent(transcriptText);
  const { manTokens, womanTokens } = part === 3 ? parseSpeakerTurns(transcriptHtml) : { manTokens: [], womanTokens: [] };
  const asksMan = part === 3 && /\bthe man\b/i.test(stem) && !/\bthe woman\b/i.test(stem);
  const asksWoman = part === 3 && /\bthe woman\b/i.test(stem) && !/\bthe man\b/i.test(stem);

  const distractors = Object.entries(optMap).filter(([ch, txt]) => ch !== ans && txt);
  for (const [ch, txt] of distractors) {
    const optTokens = tokenizeContent(txt);
    // 1. Real Speaker-Swap detection in Part 3
    if (asksMan && womanTokens.length) {
      const wMatch = findRepeatedAndSimilarWords(womanTokens, optTokens);
      const mMatch = findRepeatedAndSimilarWords(manTokens, optTokens);
      if (wMatch.repeated.length && !mMatch.repeated.length) {
        isHardTrap = true;
        distractorTraps.push({
          choice: ch,
          tag: "Bẫy Nhầm người nói",
          detail: `Câu hỏi về người Nam (Man), nhưng từ khóa “${wMatch.repeated.join(", ")}” trong (${ch}) thực chất do người Nữ nói.`
        });
        continue;
      }
    } else if (asksWoman && manTokens.length) {
      const mMatch = findRepeatedAndSimilarWords(manTokens, optTokens);
      const wMatch = findRepeatedAndSimilarWords(womanTokens, optTokens);
      if (mMatch.repeated.length && !wMatch.repeated.length) {
        isHardTrap = true;
        distractorTraps.push({
          choice: ch,
          tag: "Bẫy Nhầm người nói",
          detail: `Câu hỏi về người Nữ (Woman), nhưng từ khóa “${mMatch.repeated.join(", ")}” trong (${ch}) thực chất do người Nam nói.`
        });
        continue;
      }
    }

    // 2. Extreme/Numeric trap
    const extTrap = detectExtremeOrNumericTrap(txt);
    if (extTrap) {
      distractorTraps.push({ choice: ch, ...extTrap });
      continue;
    }

    // 3. Word-Match Trap vs transcript
    const { repeated } = findRepeatedAndSimilarWords(transTokens, optTokens);
    if (repeated.length) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Nghe từ y hệt",
        detail: `Mượn từ khóa “${repeated.join(", ")}” xuất hiện trong băng nhưng ghép sai ngữ cảnh hoặc sai đối tượng câu hỏi.`
      });
    }
  }

  // Pivot / Correction cue in transcript
  const pivotMatch = transcriptText.match(/\b(actually|however|unfortunately|instead|originally|used to|postponed|canceled|rather than)\b/i);
  if (pivotMatch) {
    isHardTrap = true;
    distractorTraps.push({
      choice: "",
      tag: "Bẫy Bẻ lái thông tin",
      detail: `Băng có từ bẻ lái “${pivotMatch[1]}” — chi tiết nêu trước đó thường bị đổi/hủy để làm phương án nhiễu.`
    });
  }

  if (!distractorTraps.length) {
    distractorTraps.push({
      choice: "",
      tag: "Bẫy Paraphrase",
      detail: "Đáp án đúng dùng cách diễn đạt đồng nghĩa với dẫn chứng trong băng; các phương án sai suy diễn hoặc đổi đối tượng."
    });
  }

  return {
    qTypeBadge,
    trapCategory,
    isHardTrap,
    formulaBox: "",
    evidenceQuote: q?.explanation ? "" : evidenceQuote,
    evidenceVi: q?.explanation ? "" : evidenceVi,
    viStem: "",
    perQuestionHtml,
    foldGroupExpl: false,
    optionBreakdown: [],
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip,
    strategyNote: "Mẹo đọc đón đầu: Khi băng đang đọc câu hỏi trước, đọc lướt ngay 3 câu hỏi kế tiếp và gạch chân từ để hỏi (Who / Why / What next)."
  };
}

/* ============================================================
   PART 5 & 6 ANALYZER (3,960 Qs — Morpho-Syntactic & Option Breakdown)
   ============================================================ */
function longestCommonPrefixLen(arr = []) {
  if (arr.length < 2) return 0;
  let prefix = arr[0].toLowerCase();
  for (let i = 1; i < arr.length; i++) {
    const w = arr[i].toLowerCase();
    while (prefix && !w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix.length;
}

function getBlankNeighbors(stem = "", passageHtml = "", qNum = 0) {
  let text = decodeRichEntities(stem || "");
  let match = text.match(/([^\n]*?)[_-]{3,}([^\n]*)/);
  if (!match && passageHtml) {
    const pFlat = stripHtmlFlat(passageHtml);
    match = pFlat.match(new RegExp(`([^\\n]*?)(?:\\(${qNum}\\)|\\[${qNum}\\]|[_-]{3,})([^\\n]*)`));
  }
  if (!match) return { beforeWord: "", afterWord: "", beforeTwo: "", afterTwo: "", afterRaw: "" };
  const beforeWords = (match[1] || "").trim().split(/\s+/).filter((w) => w && !/^[_-]+$/.test(w));
  const afterWords = (match[2] || "").trim().split(/\s+/).filter((w) => w && !/^[_-]+$/.test(w));
  return {
    beforeWord: (beforeWords[beforeWords.length - 1] || "").replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, ""),
    afterWord: (afterWords[0] || "").replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, ""),
    beforeTwo: beforeWords.slice(-2).join(" "),
    afterTwo: afterWords.slice(0, 2).join(" "),
    afterRaw: (match[2] || "").trim()
  };
}

function classifyWordSuffixPOS(word = "") {
  const w = word.toLowerCase().trim();
  if (/ly$/i.test(w) && !/^(?:only|early|daily|weekly|monthly|yearly|friendly|costly|timely|likely|orderly)$/i.test(w)) {
    return { pos: "Trạng từ (Adv)", hint: "Bổ nghĩa cho Động từ, Tính từ, Trạng từ khác hoặc cả mệnh đề." };
  }
  if (/(?:tion|sion|ment|ness|ity|ance|ence|ship|age|ism|ist|ery|ory|er|or|ee|eer|ant|ent)s?$/i.test(w)) {
    if (/(?:ant|ent)$/i.test(w) && !/(?:assistant|applicant|accountant|consultant|participant|client|resident|president|department|agreement|management|document|equipment)$/i.test(w)) {
      return { pos: "Tính từ / Danh từ", hint: "Thường làm tính từ đứng trước danh từ hoặc sau be/linking verb." };
    }
    return { pos: "Danh từ (N)", hint: "Làm chủ ngữ, tân ngữ, đứng sau mạo từ (a/an/the), tính từ sở hữu hoặc giới từ." };
  }
  if (/(?:ive|al|ous|ful|less|able|ible|ic|ical|ary|ory|ish|worthy)$/i.test(w)) {
    return { pos: "Tính từ (Adj)", hint: "Đứng trước Danh từ để bổ nghĩa hoặc đứng sau be/seem/become/remain." };
  }
  if (/(?:ize|ise|ify|ate)$/i.test(w)) {
    return { pos: "Động từ (V)", hint: "Làm động từ chính chia thì hoặc đi sau modal verb / to." };
  }
  if (/ing$/i.test(w)) {
    return { pos: "V-ing / Tính từ chủ động", hint: "Làm danh động từ (sau giới từ), thì tiếp diễn hoặc tính từ mô tả bản chất." };
  }
  if (/ed$/i.test(w)) {
    return { pos: "V-ed / Phân từ V3", hint: "Động từ quá khứ, dạng bị động (be + V3) hoặc tính từ mô tả trạng thái bị tác động." };
  }
  return { pos: "Từ gốc (V / N)", hint: "Đóng vai trò động từ nguyên mẫu hoặc danh từ gốc tùy ngữ cảnh câu." };
}

function classifyVerbForm(opt = "") {
  const t = opt.toLowerCase().trim();
  if (/^to\s+be\s+\w+(?:ed|en|wn|pt|lt|nt|ht|un|id)\b/.test(t)) return { tag: "To be + V3 (Bị động nguyên mẫu)", detail: "Chỉ mục đích bị động hoặc đi sau động từ yêu cầu to-V." };
  if (/^to\s+/.test(t)) return { tag: "To-V (Nguyên mẫu có to)", detail: "Dùng chỉ mục đích hoặc sau V/Adj yêu cầu to-V — KHÔNG làm động từ chia thì chính." };
  if (/^having\s+/.test(t)) return { tag: "Having + V3 (Phân từ hoàn thành)", detail: "Nhấn mạnh hành động xảy ra trước mệnh đề chính — không làm V chính." };
  if (/^(?:will|would|should|can|could|may|might|must)\s+be\s+\w+(?:ed|en|wn|pt|lt|nt|ht|un|id)\b/.test(t)) return { tag: "Modal + be + V3 (Bị động)", detail: "Động từ chia thì bị động (tương lai / khiếm khuyết), sau nó không cần tân ngữ trực tiếp." };
  if (/^(?:will|would|should|can|could|may|might|must)\s+/.test(t)) return { tag: "Modal + V0 (Chủ động)", detail: "Động từ chia thì tương lai / khiếm khuyết chủ động." };
  if (/^(?:has|have)\s+been\s+\w+(?:ed|en|wn|pt|lt|nt|ht|un|id)\b/.test(t)) return { tag: "HTHT Bị động (has/have been V3)", detail: "Thì hiện tại hoàn thành bị động (thường đi với since / for / recently / already)." };
  if (/^had\s+been\s+\w+(?:ed|en|wn|pt|lt|nt|ht|un|id)\b/.test(t)) return { tag: "QKHT Bị động (had been V3)", detail: "Quá khứ hoàn thành bị động — dùng khi xảy ra TRƯỚC một mốc quá khứ khác." };
  if (/^(?:is|are|am)\s+being\s+/.test(t)) return { tag: "HTTD Bị động (is/are being V3)", detail: "Hành động đang chịu tác động ngay tại thời điểm nói." };
  if (/^(?:is|are|am)\s+\w+ing\b/.test(t)) return { tag: "HTTD Chủ động (is/are + V-ing)", detail: "Thì hiện tại tiếp diễn chủ động (đang diễn ra / kế hoạch gần)." };
  if (/^(?:is|are|am)\s+\w+/.test(t)) return { tag: "HTĐ Bị động (is/are + V3)", detail: "Thì hiện tại đơn bị động (lịch trình, sự thật, quy định định kỳ)." };
  if (/^(?:was|were)\s+\w+ing\b/.test(t)) return { tag: "QKTD (was/were + V-ing)", detail: "Đang diễn ra tại một thời điểm xác định trong quá khứ." };
  if (/^(?:was|were)\s+\w+/.test(t)) return { tag: "QKĐ Bị động (was/were + V3)", detail: "Thì quá khứ đơn bị động (có mốc thời gian quá khứ rõ ràng)." };
  if (/^(?:has|have)\s+/.test(t)) return { tag: "HTHT Chủ động (has/have + V3)", detail: "Hành động bắt đầu từ quá khứ kéo dài đến hiện tại (since / for / so far)." };
  if (/^had\s+/.test(t)) return { tag: "QKHT Chủ động (had + V3)", detail: "Xảy ra trước một hành động quá khứ khác." };
  if (/ing$/.test(t)) return { tag: "V-ing (Danh động từ / Phân từ)", detail: "Dùng sau giới từ hoặc rút gọn mệnh đề chủ động — không làm động từ chính chia thì." };
  if (/ed$/.test(t)) return { tag: "V-ed / V3 (Quá khứ / Phân từ bị động)", detail: "Chia thì quá khứ đơn hoặc rút gọn mệnh đề bị động." };
  if (/s$/.test(t) && !/ss$/.test(t)) return { tag: "V-s/es (HTĐ chủ ngữ số ít)", detail: "Động từ chia hiện tại đơn cho chủ ngữ ngôi 3 số ít." };
  return { tag: "V0 (Nguyên mẫu / HTĐ số nhiều)", detail: "Dùng sau modal verb / to hoặc chia HTĐ cho chủ ngữ số nhiều." };
}

function analyzePart56({ part, q, group, optMap }) {
  const stem = decodeRichEntities(q?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = (optMap[ans] || "").trim();
  const optEntries = Object.entries(optMap).filter(([, t]) => Boolean(t));
  const optTexts = optEntries.map(([, t]) => t.trim());
  const avgLen = optTexts.reduce((a, b) => a + b.length, 0) / Math.max(1, optTexts.length);
  const allQNums = (group?.questions || []).map((x) => x.num);

  // Extract per-question explanation block for Part 6 (ETS 2026 / Thi Thử)
  const { qHtml: perQuestionHtml } = (part === 6 && !q?.explanation)
    ? extractPerQuestionGroupHtml(group?.explanationHtml || "", q?.num, allQNums)
    : { qHtml: "" };

  // 1. Part 6 Sentence Insertion
  if (part === 6 && avgLen >= 25) {
    const cohesiveMatch = ansText.match(/\b(However|Therefore|Also|Instead|In addition|For example|Unfortunately|Additionally|Furthermore|Otherwise|This|These|Such|They|It|Or)\b/i);
    const formulaBox = cohesiveMatch
      ? `Tín hiệu liên kết trong (${ans}): “${cohesiveMatch[1]}” → khớp trực tiếp mạch ý giữa câu TRƯỚC và câu SAU chỗ trống.`
      : `Quy tắc 2 chiều: Đọc câu TRƯỚC + câu SAU chỗ trống (${q?.num}) → chọn câu nối mượt chủ thể và thì thời gian.`;
    return {
      qTypeBadge: "Part 6 · Điền cả câu (Sentence Insertion)",
      trapCategory: "Part 6 · Điền cả câu (Mạch văn)",
      isHardTrap: true,
      formulaBox,
      evidenceQuote: "",
      evidenceVi: "",
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown: [],
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Đứt mạch tham chiếu",
          detail: "Đáp án nhiễu thường nhắc đúng chủ đề chung của đoạn văn nhưng lệch đại từ thay thế (this/these/it/they) hoặc mâu thuẫn ý câu đứng ngay sau chỗ trống."
        }
      ],
      quickTip: "Bắt buộc đọc 1 câu TRƯỚC + 1 câu SAU chỗ trống; kiểm tra từ nối (However, Also, Or, Therefore) và đại từ chỉ định để chốt câu nối khớp 2 đầu.",
      strategyNote: "Đừng chọn câu chỉ hợp với câu đứng trước — ~60% câu điền câu ETS được quyết định bởi câu đứng NGAY SAU chỗ trống."
    };
  }

  const singleWordOpts = optTexts.filter((t) => /^[a-z-]+$/i.test(t));
  const prefixLen = singleWordOpts.length >= 3 ? longestCommonPrefixLen(singleWordOpts) : 0;
  const ctx = getBlankNeighbors(stem, group?.passageHtml || "", q?.num);
  const ctxSlot = (ctx.beforeTwo || ctx.afterTwo)
    ? `… ${ctx.beforeTwo || ""} [ ___ ] ${ctx.afterTwo || ""} …`
    : "";

  // 2. Pronoun / Relative / Determiner
  const pronounHits = optTexts.filter((t) => PRONOUN_ROLES[t.toLowerCase()]).length;
  if (pronounHits >= 3) {
    const ansRole = PRONOUN_ROLES[ansText.toLowerCase()];
    const formulaBox = ctxSlot
      ? `Công thức 3 giây: ${ctxSlot} → cần ${ansRole ? ansRole.role : "đúng dạng đại từ"} → chọn (${ans}) ${ansText}.`
      : `Cấu trúc: chọn đúng chức năng ${ansRole ? ansRole.role : "đại từ"} (${ans}) ${ansText}.`;

    const optionBreakdown = optEntries.map(([ch, txt]) => {
      const info = PRONOUN_ROLES[txt.toLowerCase()] || { role: "Đại từ", rule: "Không phù hợp vị trí ngữ pháp quanh chỗ trống." };
      return {
        choice: ch, text: txt, viText: "",
        isCorrect: ch === ans,
        roleBadge: info.role,
        reason: ch === ans ? `Khớp chính xác vị trí chỗ trống: ${info.rule}` : info.rule
      };
    });

    return {
      qTypeBadge: `Part ${part} · Đại từ & Từ hạn định`,
      trapCategory: `Part ${part} · Đại từ & Sở hữu`,
      isHardTrap: false,
      formulaBox,
      evidenceQuote: "",
      evidenceVi: "",
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown,
      distractorTraps: optionBreakdown.filter((o) => !o.isCorrect).slice(0, 2).map((o) => ({
        choice: o.choice, tag: `Loại ${o.roleBadge}`, detail: o.reason
      })),
      quickTip: "Soi ngay 1 từ phía sau chỗ trống: có Danh từ → Tính từ sở hữu (his/her/their); đứng sau V/giới từ không có N → Tân ngữ (him/her/them); đứng độc lập thay cụm N → Đại từ sở hữu (hers/theirs).",
      strategyNote: "Mẹo cực nhanh: Câu đại từ gần như KHÔNG cần dịch nghĩa cả câu — xác định vị trí ngữ pháp là chốt trong 5 giây."
    };
  }

  // 3. Conjunction vs Preposition vs Conjunctive Adverb
  const conjHits = optTexts.filter((t) => CONJ_PREP_META[t.toLowerCase()]).length;
  if (conjHits >= 2) {
    const ansMeta = CONJ_PREP_META[ansText.toLowerCase()];
    const hasClauseAfter = /\b(?:is|are|was|were|will|has|have|had|can|could|should|do|does|did|\w+ed)\b/i.test(ctx.afterRaw || "");
    const formulaBox = ctxSlot
      ? `Công thức 3 giây: ${ctxSlot} → phía sau là ${hasClauseAfter ? "Mệnh đề (S + V)" : "Cụm danh từ / V-ing"} → chọn (${ans}) ${ansText}${ansMeta ? ` [${ansMeta.kind}]` : ""}.`
      : `Quy tắc: Sau chỗ trống có S + V → Liên từ; chỉ có Cụm N/V-ing → Giới từ.`;

    const optionBreakdown = optEntries.map(([ch, txt]) => {
      const m = CONJ_PREP_META[txt.toLowerCase()];
      const role = m ? m.kind : "Từ nối / Khác";
      const mean = m ? `Nghĩa: “${m.meaning}”. ` : "";
      return {
        choice: ch, text: txt, viText: "",
        isCorrect: ch === ans,
        roleBadge: role,
        reason: ch === ans
          ? `${mean}Khớp cả cấu trúc ngữ pháp lẫn quan hệ logic của câu.`
          : `${mean}Sai cấu trúc theo sau (Liên từ ≠ Giới từ) hoặc sai quan hệ nghĩa.`
      };
    });

    return {
      qTypeBadge: `Part ${part} · Liên từ vs Giới từ`,
      trapCategory: `Part ${part} · Liên từ vs Giới từ`,
      isHardTrap: true,
      formulaBox,
      evidenceQuote: "",
      evidenceVi: "",
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown,
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Nghĩa giống nhưng Khác cấu trúc",
          detail: "Although/Though (+ S + V) ≠ Despite/In spite of (+ Cụm N/V-ing); Because (+ S + V) ≠ Because of/Due to (+ Cụm N); While ≠ During."
        }
      ],
      quickTip: "Bước 1 (3 giây): Nhìn sau chỗ trống xem có Động từ chia thì (S + V) hay chỉ có Cụm N/V-ing để loại 2 đáp án sai loại. Bước 2: Dịch quan hệ đối lập / nguyên nhân / thời gian để chốt.",
      strategyNote: "Đừng quên: Trạng từ nối (However, Therefore, Moreover) phải đi kèm dấu chấm phẩy/dấu chấm và dấu phẩy — không dùng để nối trực tiếp 2 mệnh đề thiếu dấu câu."
    };
  }

  // 4. Verb Tense / Voice / Verb Form
  const isVerbFormSet = optTexts.some((t) => /^(?:to |is |are |was |were |will |has |have |had |be |being |having )/i.test(t))
    || (prefixLen >= 4 && optTexts.some((t) => /(?:ed|ing)$/i.test(t)) && !optTexts.some((t) => /(?:ly|tion|ment|ness|ity)$/i.test(t)));
  if (isVerbFormSet) {
    const ansV = classifyVerbForm(ansText);
    const timeCue = stem.match(/\b(yesterday|last \w+|ago|next \w+|tomorrow|by next \w+|since \d{4}|since \w+|currently|now|every \w+|annually|already|yet|recently|so far)\b/i);
    const formulaBox = `${ctxSlot ? `${ctxSlot} · ` : ""}${timeCue ? `Dấu hiệu thời gian “${timeCue[1]}” → ` : ""}Chọn (${ans}) ${ansText} [${ansV.tag}].`;

    const optionBreakdown = optEntries.map(([ch, txt]) => {
      const vf = classifyVerbForm(txt);
      return {
        choice: ch, text: txt, viText: "",
        isCorrect: ch === ans,
        roleBadge: vf.tag,
        reason: ch === ans ? `Đúng cấu trúc yêu cầu: ${vf.detail}` : vf.detail
      };
    });

    return {
      qTypeBadge: `Part ${part} · Thì & Dạng động từ`,
      trapCategory: `Part ${part} · Thì & Chủ động/Bị động`,
      isHardTrap: false,
      formulaBox,
      evidenceQuote: "",
      evidenceVi: "",
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown,
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Chủ động vs Bị động & V chính",
          detail: "Kiểm tra mệnh đề đã có Động từ chia thì chưa; nếu phía sau chỗ trống có tân ngữ (Cụm N) → ưu tiên Chủ động; nếu gặp giới từ (by/in/for/to) hoặc hết câu → ưu tiên Bị động (be + V3)."
        }
      ],
      quickTip: "Quy trình 3 bước: (1) Mệnh đề thiếu V chính hay đã đủ V chính? → (2) Hòa hợp Chủ ngữ số ít/nhiều → (3) Mốc thời gian + Chủ động/Bị động.",
      strategyNote: timeCue
        ? `Bắt trúng dấu hiệu thời gian “${timeCue[1]}” giúp loại ngay các thì sai mốc.`
        : "Nhớ kỹ: V-ing và To-V đứng một mình KHÔNG BAO GIỜ làm động từ chia thì chính của câu."
    };
  }

  // 5. Word Family (POS)
  if (prefixLen >= 4) {
    const ansPos = classifyWordSuffixPOS(ansText);
    const formulaBox = ctxSlot
      ? `Công thức 3 giây: ${ctxSlot} → vị trí cần ${ansPos.pos} → chọn (${ans}) ${ansText}.`
      : `Vị trí chỗ trống cần ${ansPos.pos} → chọn (${ans}) ${ansText}.`;

    const optionBreakdown = optEntries.map(([ch, txt]) => {
      const p = classifyWordSuffixPOS(txt);
      return {
        choice: ch, text: txt, viText: "",
        isCorrect: ch === ans,
        roleBadge: p.pos,
        reason: ch === ans ? `Khớp đúng vị trí ngữ pháp: ${p.hint}` : p.hint
      };
    });

    let quickTip = "Xét 1 từ trước và 1 từ sau chỗ trống để chốt từ loại (N / V / Adj / Adv) theo công thức cụm danh từ — không cần dịch cả câu dài.";
    if (/Trạng từ/.test(ansPos.pos)) {
      quickTip = `Chỗ trống nằm ở vị trí bổ nghĩa cho Động từ / Tính từ / cả câu → điền ngay Trạng từ đuôi -ly (${ansText}).`;
    } else if (/^(?:a|an|the|this|that|these|those|my|your|his|her|its|our|their)$/i.test(ctx.beforeWord)) {
      quickTip = `Sau “${ctx.beforeWord}”: nếu ngay sau chỗ trống đã có Danh từ (“${ctx.afterWord || "N"}”) → điền TÍNH TỪ; nếu gặp giới từ/động từ → điền DANH TỪ.`;
    }

    return {
      qTypeBadge: `Part ${part} · Bẫy Từ loại (Word Family)`,
      trapCategory: `Part ${part} · Từ loại (Word Family)`,
      isHardTrap: false,
      formulaBox,
      evidenceQuote: "",
      evidenceVi: "",
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown,
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Đuôi từ cùng gốc",
          detail: "Rất dễ chọn nhầm Tính từ ↔ Danh từ nếu quên nhìn sang từ đứng LIỀN SAU chỗ trống (chuỗi chuẩn: [Mạo từ] + Adv + Adj + Noun)."
        }
      ],
      quickTip,
      strategyNote: "Mẹo tăng tốc Part 5: Gặp 4 đáp án cùng gốc từ là phải làm xong trong ≤ 10 giây để dành thời gian cho Part 7."
    };
  }

  // 6. Vocabulary & Collocation
  const prepAfter = /^(?:to|for|with|in|on|at|of|from|by|about|into|over)$/i.test(ctx.afterWord) ? ctx.afterWord : "";
  const formulaBox = prepAfter
    ? `Tín hiệu Collocation: “… ${ctx.beforeWord} [ ${ansText} ] ${prepAfter} …” — chú ý cụm từ đi cố định với giới từ “${prepAfter}”.`
    : (ctxSlot ? `Cụm từ khóa quanh chỗ trống: ${ctxSlot}` : "");

  return {
    qTypeBadge: `Part ${part} · Từ vựng & Collocation`,
    trapCategory: `Part ${part} · Từ vựng & Collocation`,
    isHardTrap: false,
    formulaBox,
    evidenceQuote: "",
    evidenceVi: "",
    viStem: "",
    perQuestionHtml,
    foldGroupExpl: false,
    optionBreakdown: [],
    distractorTraps: [
      {
        choice: "",
        tag: prepAfter ? `Bẫy Giới từ đi kèm “${prepAfter}”` : "Bẫy Nghĩa gần & Ngữ cảnh thương mại",
        detail: prepAfter
          ? `Các đáp án sai có thể dịch na ná tiếng Việt nhưng không kết hợp tự nhiên với giới từ “${prepAfter}” phía sau.`
          : "ETS thường gài 2 từ gần nghĩa tiếng Việt nhưng chỉ có 1 từ đúng collocation / văn phong công sở (TOEIC Business)."
      }
    ],
    quickTip: prepAfter
      ? `Khóa ngay giới từ “${prepAfter}” đứng sau chỗ trống để loại các từ sai kết hợp (ví dụ: eligible for, comply with, prior to, responsible for).`
      : "Đọc cụm 3–4 từ xung quanh chỗ trống để bắt Collocation cố định và xác định chủ thể là Người hay Vật trước khi dịch.",
    strategyNote: part === 6 ? "Trong Part 6 câu từ vựng, luôn liếc thêm 1 câu trước để giữ đúng ngữ cảnh văn bản." : ""
  };
}

/* ============================================================
   PART 7 ANALYZER (4,681 Qs)
   ============================================================ */
function analyzePart7({ q, group, optMap }) {
  const stem = decodeRichEntities(q?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const imgCount = Array.isArray(group?.images) ? group.images.length : 0;
  const multiDoc = imgCount >= 2;
  const docTag = imgCount >= 3 ? "Đọc 3 đoạn (Triple)" : (imgCount === 2 ? "Đọc 2 đoạn (Double)" : "Đọc đoạn đơn");
  const allQNums = (group?.questions || []).map((x) => x.num);

  // Extract per-question block [147] from ETS 2026 / Thi Thử OR inline evidence [147] from ETS 2023
  const { qHtml: perQuestionHtml } = !q?.explanation
    ? extractPerQuestionGroupHtml(group?.explanationHtml || "", q?.num, allQNums)
    : { qHtml: "" };
  const evidenceVi = (!q?.explanation && !perQuestionHtml)
    ? extractBracketEvidence(group?.explanationHtml || "", q?.num)
    : "";

  // Scan wrong options for REAL ETS Part 7 traps (Extreme words, Numbers/Prices/Dates, Comparisons)
  const distractorTraps = [];
  const distractors = Object.entries(optMap).filter(([ch, txt]) => ch !== ans && txt);
  for (const [ch, txt] of distractors) {
    const extTrap = detectExtremeOrNumericTrap(txt);
    if (extTrap) {
      distractorTraps.push({ choice: ch, ...extTrap });
    }
  }

  if (/\b(?:NOT|EXCEPT)\b|least likely/i.test(stem)) {
    distractorTraps.unshift({
      choice: "",
      tag: "Bẫy Quên chữ NOT / EXCEPT",
      detail: "3 phương án SAI lại là 3 thông tin CÓ THẬT trong bài — thí sinh vội chọn ngay chi tiết đầu tiên tìm thấy sẽ mắc bẫy."
    });
    return {
      qTypeBadge: "Part 7 · Bẫy Phủ định (NOT / EXCEPT)",
      trapCategory: "Part 7 · Bẫy Phủ định (NOT/EXCEPT)",
      isHardTrap: true,
      formulaBox: "Chiến thuật Loại trừ ngược: Bấm chuột phải (⊘) gạch bỏ lần lượt 3 phương án ĐÚNG có trong bài → còn lại là đáp án.",
      evidenceQuote: "",
      evidenceVi,
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown: [],
      distractorTraps: distractorTraps.slice(0, 3),
      quickTip: "Với câu NOT/EXCEPT, tìm nhanh danh sách liệt kê (dấu phẩy, gạch đầu dòng, bảng biểu) trong bài để gạch loại trừ 3 đáp án xuất hiện chỉ trong 15 giây.",
      strategyNote: `${docTag}: Đừng vội chọn khi thấy từ khóa giống bài đọc — câu NOT yêu cầu tìm chi tiết SAI hoặc KHÔNG ĐƯỢC NHẮC.`
    };
  }

  if (/\bbest belong\b|\bpositions marked\b|\[1\]|\[2\]|\[3\]|\[4\]/i.test(stem)) {
    distractorTraps.unshift({
      choice: "",
      tag: "Bẫy Đứt đại từ nối",
      detail: "Câu cần chèn chứa từ nối/đại từ (this, these, such, it, they, however) nếu đặt nhầm chỗ sẽ mất đối tượng tham chiếu ở câu liền trước."
    });
    return {
      qTypeBadge: "Part 7 · Chèn câu [1]–[4]",
      trapCategory: "Part 7 · Chèn câu [1]–[4]",
      isHardTrap: true,
      formulaBox: "Quy tắc ghép 2 đầu: Khớp [Câu trước dấu ngoặc] ↔ [Từ nối/Đại từ trong câu chèn] ↔ [Câu sau dấu ngoặc].",
      evidenceQuote: "",
      evidenceVi,
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown: [],
      distractorTraps: distractorTraps.slice(0, 3),
      quickTip: "Khoanh tròn từ nối (However, Therefore, Also, Instead) và đại từ (This/These/Such/They) trong câu in đậm → thử khớp từng vị trí [1]–[4].",
      strategyNote: "Mẹo nhanh: Vị trí [1] đầu đoạn hiếm khi nhận câu phản ý (However/Therefore), còn vị trí [4] thường là câu chốt/hành động tiếp theo."
    };
  }

  if (/\bclosest in meaning\b|\bmeaning to\b/i.test(stem)) {
    const targetWordMatch = stem.match(/["“]([^"”]{2,30})["”]/);
    const targetW = targetWordMatch ? targetWordMatch[1] : "";
    distractorTraps.unshift({
      choice: "",
      tag: "Bẫy Nghĩa quen thuộc nhất",
      detail: `ETS hay đặt nghĩa phổ biến nhất của từ${targetW ? ` “${targetW}”` : ""} làm bẫy, trong khi bài đọc dùng nghĩa thứ cấp theo văn phong thương mại.`
    });
    return {
      qTypeBadge: `Part 7 · Đồng nghĩa theo ngữ cảnh${targetW ? ` (“${targetW}”)` : ""}`,
      trapCategory: "Part 7 · Từ đồng nghĩa ngữ cảnh",
      isHardTrap: false,
      formulaBox: targetW
        ? `Thay trực tiếp từng đáp án vào chỗ chữ “${targetW}” trong câu gốc → giữ phương án bảo toàn nguyên vẹn logic câu.`
        : "Thay ngược từng đáp án vào câu gốc trong bài để kiểm tra sắc thái ngữ cảnh.",
      evidenceQuote: "",
      evidenceVi,
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown: [],
      distractorTraps: distractorTraps.slice(0, 3),
      quickTip: "Tuyệt đối KHÔNG dịch nghĩa từ đứng rời! Đọc trọn câu chứa từ được hỏi (kèm 1 câu trước nếu cần) rồi thay thử 4 đáp án vào.",
      strategyNote: `${docTag}: Để ý chủ ngữ đi cùng động từ/tính từ được hỏi là Người, Sản phẩm hay Quy định.`
    };
  }

  if (/\b(?:inferred|implied|suggested|most likely|indicated)\b/i.test(stem) || multiDoc) {
    if (!distractorTraps.length) {
      distractorTraps.push({
        choice: "",
        tag: multiDoc ? "Bẫy Bỏ sót văn bản liên kết" : "Bẫy Suy diễn quá đà",
        detail: multiDoc
          ? "Câu hỏi ETS bắt ghép 2 dữ kiện nằm ở 2 văn bản khác nhau (ví dụ: tên/ngày ở Email 1 + bảng giá/quy định ở Văn bản 2–3)."
          : "Phương án sai suy diễn thêm thông tin không có chứng cứ trực tiếp hoặc đảo ngược đối tượng."
      });
    }
    return {
      qTypeBadge: `Part 7 · Suy luận (${docTag})`,
      trapCategory: multiDoc ? "Part 7 · Liên kết đa đoạn (Double/Triple)" : "Part 7 · Suy luận (Inferred/Indicated)",
      isHardTrap: true,
      formulaBox: multiDoc
        ? "Săn từ cầu nối giữa các văn bản (Tên riêng / Mã đơn / Ngày / Giá tiền) → ghép đủ 2 mảnh dữ kiện mới chốt đáp án."
        : "Câu Suy luận ETS = Paraphrase sát của 1 dữ kiện có thật trong bài (KHÔNG đoán mò ngoài văn bản).",
      evidenceQuote: "",
      evidenceVi,
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown: [],
      distractorTraps: distractorTraps.slice(0, 3),
      quickTip: multiDoc
        ? "Đọc chéo giữa Văn bản 1 và Văn bản 2–3 tại đúng điểm giao nhau (ngày đặt, tên sản phẩm, mã giảm giá) để không bỏ sót điều kiện cập nhật."
        : "Tìm câu chứa chủ thể được hỏi trong bài, đối chiếu Paraphrase từng vế và loại ngay các đáp án chứa từ cực đoan (only/exclusively/never) hoặc sai con số.",
      strategyNote: "Chú ý đặc biệt các dòng ghi chú dấu sao (*), điều kiện áp dụng hoặc dòng P.S. cuối văn bản — đây là nơi ETS hay giấu bẫy."
    };
  }

  if (/\b(?:purpose|mainly about|intended for|who most likely wrote|why (?:did|was|is))\b/i.test(stem)) {
    distractorTraps.unshift({
      choice: "",
      tag: "Bẫy Chi tiết phụ",
      detail: "Đáp án nhiễu chỉ đúng với 1 câu ví dụ nhỏ ở giữa bài, không phản ánh mục đích chính của toàn văn bản."
    });
    return {
      qTypeBadge: `Part 7 · Mục đích & Tổng quan (${docTag})`,
      trapCategory: "Part 7 · Mục đích & Tổng quan",
      isHardTrap: false,
      formulaBox: "Đọc Tiêu đề (Subject / Title) + 2 câu đầu tiên của đoạn 1 → chốt đúng động từ mục đích (To announce / To remind / To request...).",
      evidenceQuote: "",
      evidenceVi,
      viStem: "",
      perQuestionHtml,
      foldGroupExpl: false,
      optionBreakdown: [],
      distractorTraps: distractorTraps.slice(0, 3),
      quickTip: "Khóa ngay tiêu đề + 25% đầu văn bản; kiểm tra vai trò Người gửi – Người nhận (From / To) để loại nhanh các đáp án lệch đối tượng.",
      strategyNote: "Cẩn thận các động từ mở đầu giống nhau (To inform / To complain / To invite) — chỉ cần sai sắc thái hành động là loại ngay."
    };
  }

  if (!distractorTraps.length) {
    distractorTraps.push({
      choice: "",
      tag: "Bẫy Paraphrase & Điều kiện kèm theo",
      detail: "ETS viết lại thông tin bằng từ đồng nghĩa (complimentary = free, prior to = before) và hay cài bẫy đổi ngày giờ hoặc điều kiện ngoại lệ."
    });
  }

  return {
    qTypeBadge: `Part 7 · Tìm chi tiết (${docTag})`,
    trapCategory: "Part 7 · Chi tiết & Paraphrase",
    isHardTrap: false,
    formulaBox: "Scan Tên riêng / Con số / Từ khóa hiếm trong câu hỏi → đọc kỹ 1 câu trước & sau dòng chứa từ khóa để đối chiếu Paraphrase.",
    evidenceQuote: "",
    evidenceVi,
    viStem: "",
    perQuestionHtml,
    foldGroupExpl: false,
    optionBreakdown: [],
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip: "Dùng kỹ thuật Scanning định vị chính xác dòng chứa từ khóa, sau đó kiểm tra cuối văn bản xem có đính chính/thay đổi lịch hay điều kiện áp dụng không.",
    strategyNote: "Luôn cảnh giác với các đáp án chép nguyên xi 1–2 từ trong bài nhưng tráo chủ ngữ hoặc đổi mốc thời gian."
  };
}

/* ============================================================
   PERSONALIZED MISTAKE CALLOUT & ATTEMPT TRAP SUMMARY
   ============================================================ */
function buildUserMistakeCallout({ part, q, optMap, userChoice, base }) {
  const u = String(userChoice || "").toUpperCase();
  const ans = String(q?.answer || "").toUpperCase();
  if (!u || !ans || u === ans) return "";

  const matchedOpt = (base.optionBreakdown || []).find((o) => o.choice === u);
  if (matchedOpt) {
    const viSuffix = matchedOpt.viText ? ` (“${matchedOpt.viText}”)` : "";
    return `Bạn đã chọn (${u})${viSuffix} — vướng ${matchedOpt.roleBadge}: ${matchedOpt.reason}`;
  }

  const matchedTrap = (base.distractorTraps || []).find((t) => t.choice && t.choice.toUpperCase() === u);
  if (matchedTrap) {
    return `Bạn đã chọn (${u}) — vướng ${matchedTrap.tag}: ${matchedTrap.detail}`;
  }

  const uTxt = optMap[u] || "";
  const uShort = uTxt ? ` (“${uTxt.length > 52 ? `${uTxt.slice(0, 51)}…` : uTxt}”)` : "";
  if (part <= 2) {
    return `Bạn đã chọn (${u})${uShort}, nhưng đáp án đúng là (${ans}). Đối chiếu bản dịch và bẫy loại trừ từng phương án bên dưới.`;
  }
  if (part === 5 || part === 6) {
    return `Bạn đã chọn (${u})${uShort} thay vì (${ans}). Đối chiếu công thức ngữ pháp 3 giây và phân tích 4 lựa chọn bên dưới.`;
  }
  return `Bạn đã chọn (${u})${uShort} — phương án này không khớp hoàn toàn dẫn chứng cho (${ans}). Xem phần dẫn chứng và bẫy loại trừ bên dưới.`;
}

/**
 * Generates comprehensive Solution + Per-Option Elimination + Trap Coaching metadata for any question (Parts 1–7).
 */
export function analyzeQuestionTrapsAndTips({ part, q, group, parsedP12 = null, userChoice = "" }) {
  const pNum = Number(part || group?.part || 5);
  const optMap = getOptionsMap(q, parsedP12);

  let base;
  if (pNum === 1) base = analyzePart1({ q, group, optMap });
  else if (pNum === 2) base = analyzePart2({ q, group, optMap, parsedP12 });
  else if (pNum === 3 || pNum === 4) base = analyzePart34({ part: pNum, q, group, optMap });
  else if (pNum === 5 || pNum === 6) base = analyzePart56({ part: pNum, q, group, optMap });
  else base = analyzePart7({ q, group, optMap });

  const userMistakeCallout = buildUserMistakeCallout({
    part: pNum,
    q,
    optMap,
    userChoice,
    base
  });

  // Mark userChoice inside optionBreakdown for UI highlighting
  const u = String(userChoice || "").toUpperCase();
  const optionBreakdown = (base.optionBreakdown || []).map((o) => ({
    ...o,
    isUserChoice: Boolean(u && o.choice === u)
  }));

  return {
    qTypeBadge: base.qTypeBadge,
    trapCategory: base.trapCategory || base.qTypeBadge,
    isHardTrap: Boolean(base.isHardTrap),
    formulaBox: base.formulaBox || "",
    evidenceQuote: base.evidenceQuote || "",
    evidenceVi: base.evidenceVi || "",
    viStem: base.viStem || "",
    perQuestionHtml: base.perQuestionHtml || "",
    foldGroupExpl: Boolean(base.foldGroupExpl),
    optionBreakdown,
    userMistakeCallout,
    distractorTraps: base.distractorTraps || [],
    quickTip: base.quickTip,
    strategyNote: base.strategyNote || ""
  };
}

/**
 * Aggregates recurring trap patterns across all wrong questions in a submitted attempt
 * for the End-of-Test Result Screen ("Bản đồ Bẫy hay mắc trong bài thi này").
 */
export function summarizeAttemptTraps(groups = [], answers = {}, parseP12Fn = null) {
  const buckets = new Map();
  let totalWrong = 0;

  groups.forEach((g, gIdx) => {
    const parsedP12 = (g.part === 1 || g.part === 2) && g.transcriptHtml && typeof parseP12Fn === "function"
      ? parseP12Fn(g.transcriptHtml)
      : { stem: "", options: {} };

    for (const q of g.questions || []) {
      const uAns = answers?.[q.num];
      if (!uAns || uAns === q.answer) continue;
      totalWrong++;
      const info = analyzeQuestionTrapsAndTips({
        part: g.part, q, group: g, parsedP12, userChoice: uAns
      });
      const key = info.trapCategory || info.qTypeBadge;
      if (!buckets.has(key)) {
        buckets.set(key, {
          category: key,
          part: g.part,
          count: 0,
          tip: info.quickTip,
          items: []
        });
      }
      const b = buckets.get(key);
      b.count++;
      b.items.push({ num: q.num, gIdx, userAns: uAns, correctAns: q.answer });
    }
  });

  const topTraps = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count || a.part - b.part)
    .slice(0, 6);

  return { totalWrong, topTraps };
}
