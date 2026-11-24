/**
 * TOEIC Trap & Fast-Solve Coaching Engine (v23.0)
 * Zero-dependency ES module analyzing Parts 1-7 questions, stems, options,
 * transcripts/passages, and user selections to surface concrete distractor traps
 * and actionable IIG fast-solve strategies across 100% of questions.
 */

const HTML_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—"
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "to", "of", "in", "on", "at",
  "by", "for", "with", "from", "up", "out", "as", "into", "over", "after",
  "this", "that", "these", "those", "it", "its", "he", "she", "they", "we",
  "you", "i", "me", "him", "her", "us", "them", "my", "your", "his", "our",
  "their", "is", "are", "was", "were", "be", "been", "being", "am", "do",
  "does", "did", "have", "has", "had", "will", "would", "can", "could",
  "should", "may", "might", "must", "shall", "not", "no", "yes", "very",
  "just", "so", "too", "also", "there", "here", "one", "some", "any", "all"
]);

/**
 * Curated ETS TOEIC phonetic / near-homophone / lookalike confusion pairs.
 */
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

function decodeEntities(str = "") {
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
    .replace(/&([a-z]+);/gi, (m, k) => HTML_ENTITIES[k.toLowerCase()] ?? m);
}

function stripHtmlToLines(html = "") {
  if (!html) return [];
  const raw = String(html)
    .replace(/<(?:br\s*\/?|\/p|\/div|\/li|\/tr|\/h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(raw)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function stripHtmlFlat(html = "") {
  return stripHtmlToLines(html).join(" ");
}

function cleanOptText(raw = "", choice = "") {
  const txt = decodeEntities(raw || "").replace(/\ufeff/g, "").trim();
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
        if (s.length >= 4 && w !== s && st !== stemWord(s)) {
          if (w.slice(0, 4) === s.slice(0, 4)) {
            similar.push(`${w} ↔ ${s}`);
            break;
          }
        }
      }
    }
  }
  return { repeated: repeated.slice(0, 2), similar: similar.slice(0, 2) };
}

function truncateQuote(s = "", max = 210) {
  const clean = String(s).replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

/* ============================================================
   PART 1 ANALYZER (603 Qs)
   ============================================================ */
function analyzePart1({ q, optMap }) {
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = optMap[ans] || "";
  const ansTokens = tokenizeContent(ansText);
  const distractors = Object.entries(optMap).filter(([ch, txt]) => ch !== ans && txt);

  const allTexts = Object.values(optMap).join(" ");
  const hasPeople = /\b(man|woman|men|women|people|person|worker|pedestrian|customer|passenger|someone|he|she|they)\b/i.test(allTexts);
  const isBeingPassive = /\b(is|are)\s+being\s+[a-z]+(?:ed|en|wn|pt|lt|nt|ht|un|id)\b/i;
  const hasStateActionPair = (txt) => (
    /\b(putting on|trying on|picking up|reaching for|taking off|getting into|leaning)\b/i.test(txt) &&
    /\b(wearing|holding|sitting|standing|carrying|leaning)\b/i.test(allTexts)
  );

  let isHardTrap = false;
  const distractorTraps = [];

  for (const [ch, txt] of distractors) {
    if (isBeingPassive.test(txt)) {
      isHardTrap = true;
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Bị động tiếp diễn",
        detail: "Dùng “is/are being + V3” — chỉ đúng khi thấy rõ bàn tay/người đang trực tiếp tác động lên vật trong ảnh; nếu ảnh tĩnh/vắng người thì loại ngay."
      });
      continue;
    }
    if (hasStateActionPair(txt)) {
      isHardTrap = true;
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Trạng thái vs Hành động",
        detail: "Phân biệt kỹ hành động đang diễn ra (putting on / picking up / reaching for) với trạng thái đã hoàn tất (wearing / holding)."
      });
      continue;
    }
    const { repeated, similar } = findRepeatedAndSimilarWords(ansTokens, tokenizeContent(txt));
    if (similar.length) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Âm gần giống",
        detail: `Dễ nghe nhầm cặp âm gần giống (${similar.join(", ")}), thực chất mô tả sai vật thể hoặc động tác trong tranh.`
      });
    } else if (repeated.length) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Lặp danh từ + Sai động từ",
        detail: `Giữ đúng danh từ trong tranh (${repeated.join(", ")}) nhưng gài sai động từ hành động hoặc giới từ vị trí.`
      });
    } else if (!hasPeople && /\b(has|have)\s+been\s+/i.test(txt) && /\bthere\b/i.test(ansText)) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Sai trạng thái vật",
        detail: "Mô tả sai trạng thái sắp xếp hoặc hành động từng xảy ra không thể suy ra trực tiếp từ bức ảnh."
      });
    }
  }

  if (!distractorTraps.length && distractors.length) {
    distractorTraps.push({
      choice: distractors[0][0],
      tag: "Bẫy Suy diễn ngoài ảnh",
      detail: "Nghe xuất hiện từ hợp ngữ cảnh nhưng có chi tiết hành động, vị trí hoặc đối tượng không xuất hiện trong khung hình."
    });
  }

  if (isBeingPassive.test(ansText)) isHardTrap = true;

  const qTypeBadge = hasPeople ? "Part 1 · Tranh có người" : "Part 1 · Tranh vật & phong cảnh";
  const quickTip = hasPeople
    ? "Soi trục [Chủ ngữ → Động từ V-ing → Tân ngữ]: nghe thật kỹ động từ chính xem tay/mắt nhân vật có khớp hành động đang nói không."
    : "Tranh tả vật/cảnh: ưu tiên cấu trúc tĩnh (There is/are, is + V3, is located/arranged); loại ngay câu có người hoặc “being + V3” trừ khi thấy rõ người đang làm.";
  const strategyNote = isBeingPassive.test(ansText) || isBeingPassive.test(allTexts)
    ? "Ghi nhớ: wearing (đang mặc) ≠ putting on (đang mặc vào); holding (đang cầm) ≠ picking up (đang nhặt lên)."
    : "Đừng cố nghe hết 100% câu dài — chỉ cần bắt đúng Động từ + Giới từ vị trí để loại trừ nhanh.";

  return {
    qTypeBadge,
    isHardTrap,
    evidenceQuote: "",
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip,
    strategyNote
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
    /\b(i don't know|not sure|haven't decided|haven't heard|let me check|ask\s+\w+|check with|it depends|i was out|actually|neither|nobody told|hard to say|i'd rather|why don't)\b/i.test(a)
  );
}

function analyzePart2({ q, optMap, parsedP12 }) {
  const stem = decodeEntities(q?.stem || parsedP12?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = optMap[ans] || "";
  const cls = classifyPart2Stem(stem);
  const indirect = isPart2IndirectAnswer(ansText);

  const stemTokens = tokenizeContent(stem);
  const distractors = Object.entries(optMap).filter(([ch, txt]) => ch !== ans && txt);
  const distractorTraps = [];

  for (const [ch, txt] of distractors) {
    const trimmedTxt = txt.trim();
    const startsYesNo = /^(?:yes|no|sure|of course|certainly|yeah|nope|okay|ok)\b/i.test(trimmedTxt);
    const hasTimePhrase = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|o'clock|am|pm|tomorrow|yesterday|once a|every day|week|month|year|minutes|hours|ago|until|since|20\d{2})\b/i.test(trimmedTxt);
    const hasPlacePhrase = /\b(floor|room|lobby|office|building|street|wall|corner|table|shelf|desk|hall|warehouse|department|across|next to|down the hall|in front|on the)\b/i.test(trimmedTxt);
    const isBareNounPhrase = /^(?:a|an|the|my|our|your|some|several)\s+\w+(?:\s+\w+){0,3}[.?!]?$/i.test(trimmedTxt) && !hasTimePhrase && !hasPlacePhrase;
    const { repeated, similar } = findRepeatedAndSimilarWords(stemTokens, tokenizeContent(trimmedTxt));

    if ((cls.isWh || cls.isChoice) && startsYesNo) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Yes/No",
        detail: "Mở đầu bằng Yes/No/Sure nhưng câu hỏi là Wh- hoặc Lựa chọn (or) → loại thẳng theo quy tắc ETS."
      });
    } else if (similar.length) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Âm gần giống",
        detail: `Cài từ phát âm gần giống với câu hỏi (${similar.join(", ")}) để đánh lừa khi nghe lướt.`
      });
    } else if (repeated.length) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Lặp từ khóa",
        detail: `Lặp nguyên từ khóa “${repeated.join(", ")}” từ câu hỏi nhưng nội dung trả lời hoàn toàn lệch trọng tâm.`
      });
    } else if ((cls.code === "WHERE" || cls.code === "WHO") && hasTimePhrase && !hasPlacePhrase) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Sai loại câu hỏi",
        detail: `Hỏi ${cls.code === "WHERE" ? "địa điểm (Where)" : "người (Who)"} nhưng đáp án lại trả lời về thời gian.`
      });
    } else if ((cls.code === "WHEN" || cls.code === "HOW_OFTEN" || cls.code === "WHY") && hasPlacePhrase && !hasTimePhrase) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Sai loại câu hỏi",
        detail: "Trả lời chỉ vị trí/địa điểm trong khi câu hỏi không phải Where."
      });
    } else if (cls.code === "WHERE" && hasPlacePhrase) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Đúng giới từ nhưng Sai hành động",
        detail: `Có nhắc cụm vị trí (“${trimmedTxt}”) để bẫy người chỉ nghe lướt giới từ, nhưng sai hẳn hành động/ngữ cảnh câu hỏi.`
      });
    } else if ((cls.code === "WHERE" || cls.code === "WHEN" || cls.code === "WHY") && isBareNounPhrase) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Cụm danh từ trơ",
        detail: `Chỉ nêu cụm danh từ đơn lẻ (“${trimmedTxt}”) — không trả lời đúng địa điểm, thời gian hay lý do cần tìm.`
      });
    } else {
      const hasGenericAlready = distractorTraps.some((d) => d.tag === "Bẫy Lạc đề");
      distractorTraps.push({
        choice: ch,
        tag: hasGenericAlready ? "Bẫy Sai ngữ cảnh" : "Bẫy Lạc đề",
        detail: hasGenericAlready
          ? `Phương án “${trimmedTxt}” nói sang việc khác, không khớp hành động hay đối tượng trong câu hỏi.`
          : "Ngữ điệu tự nhiên nhưng không giải quyết trực tiếp nhu cầu thông tin hoặc ngữ cảnh câu dẫn."
      });
    }
  }

  const tipByCode = {
    WHO: "Bắt từ đầu câu “Who”: đáp án đúng là tên riêng, chức danh, phòng ban (Accounting, HR) hoặc câu hỏi ngược / I'm not sure.",
    WHERE: "Bắt “Where”: ưu tiên giới từ vị trí (on/in/at/down the hall/next to) hoặc câu chỉ cách tìm (Check the manual / Ask Sam).",
    WHEN: "Bắt “When / What time”: tìm mốc thời gian, ngày/giờ, mệnh đề Until/After/As soon as hoặc chưa xác định.",
    WHY: "Bắt “Why”: ngoài Because / To + V / For + N, ETS rất hay ra đáp án nêu thẳng lý do/sự cố mà KHÔNG dùng chữ “because”.",
    HOW_OFTEN: "Bắt “How often”: đáp án đúng thường chứa tần suất (Once a week, Every month, Twice a year, Usually, Rarely).",
    HOW_LONG: "Bắt “How long”: nghe khoảng thời gian (for two weeks, until Friday, about an hour) — tránh nhầm sang mốc giờ.",
    HOW_NUM: "Bắt “How many / much / far”: chú ý con số, đơn vị tiền/khoảng cách hoặc “at least / around / free of charge”.",
    HOW: "Bắt “How”: hỏi cách thức (by + V-ing/phương tiện) hoặc cảm nhận/đánh giá (It was useful / Very well).",
    WHAT: "Bắt danh từ ngay sau “What / Which” (what time, what floor, which model) để khóa đúng phạm vi câu trả lời.",
    CHOICE: "Câu hỏi “A or B”: loại ngay Yes/No; đáp án đúng chọn 1 trong 2, chọn cả hai (Both), không chọn (Neither), hoặc trả lời gián tiếp.",
    TAG: "Câu hỏi Đuôi: BỎ QUA phần đuôi phủ định/khẳng định — trả lời theo ý thật: đúng sự thật dùng Yes, sai sự thật dùng No.",
    NEG: "Câu hỏi Phủ định (Don't / Isn't / Haven't...): dịch như câu hỏi thường; Yes = có/vẫn vậy, No = không — đừng bị lừa bởi chữ “No” đầu câu hỏi.",
    YESNO: "Chú ý 30% đáp án đúng là câu trả lời gián tiếp (nêu điều kiện, lý do, hỏi lại) không mở đầu bằng Yes/No.",
    STATEMENT: "Câu trần thuật (không có từ để hỏi): tìm phản hồi đồng cảm, đề nghị giúp đỡ, câu hỏi nối tiếp hoặc cập nhật hành động tiếp theo."
  };

  const qTypeBadge = indirect ? `${cls.label} · Gián tiếp` : cls.label;
  const strategyNote = indirect
    ? "Chiến thuật ETS 750+: Khi không chắc 100%, giữ lại câu đáp “I don't know / Ask X / It hasn't been decided / câu hỏi ngược lại ?” — tỷ lệ đúng rất cao."
    : "Mẹo 3 giây đầu: Chỉ tập trung vào 1–2 chữ ĐẦU TIÊN của câu hỏi để loại sạch các bẫy Yes/No và bẫy lặp từ.";

  return {
    qTypeBadge,
    isHardTrap: indirect || cls.isStatement || cls.code === "NEG" || cls.code === "TAG",
    evidenceQuote: "",
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip: tipByCode[cls.code] || tipByCode.STATEMENT,
    strategyNote
  };
}

/* ============================================================
   PART 3 & 4 ANALYZER (6,045 Qs)
   ============================================================ */
function extractPart34Evidence(transcriptHtml = "", qNum, qStem = "", ansText = "") {
  if (!transcriptHtml) return "";
  const raw = decodeEntities(String(transcriptHtml));

  // Match inline ETS highlight tags: [32] ... (until next [33] or </strong> or newline)
  const tagRe = new RegExp(`\\[(?:Câu\\s*)?${qNum}(?:\\s*[-–]\\s*\\d+)?\\]([\\s\\S]{6,260}?)(?=\\[\\d{2,3}|<\\/strong>|<\\/p>|<br|$)`, "i");
  const m = raw.match(tagRe);
  if (m && m[1]) {
    const clean = stripHtmlFlat(m[1]).replace(/^(?:M-Cn|M-Au|W-Am|W-Br|Man|Woman|Speaker\s*\d*)\s*:\s*/i, "");
    if (clean.length >= 10) return truncateQuote(clean, 210);
  }

  // Fallback: score transcript sentences by content-word overlap with question stem + correct option
  const lines = stripHtmlToLines(transcriptHtml);
  if (!lines.length) return "";
  const queryTokens = new Set([...tokenizeContent(qStem), ...tokenizeContent(ansText)].map(stemWord));
  if (!queryTokens.size) return "";

  let bestLine = "";
  let bestScore = 0;
  for (const ln of lines) {
    if (/^(?:M|W)-(?:Cn|Au|Am|Br)|^Transcript\b/i.test(ln) && ln.length < 18) continue;
    const lnTokens = tokenizeContent(ln).map(stemWord);
    let hits = 0;
    for (const st of lnTokens) {
      if (queryTokens.has(st)) hits++;
    }
    if (hits > bestScore) {
      bestScore = hits;
      bestLine = ln;
    }
  }
  return bestScore >= 2 ? truncateQuote(bestLine, 210) : "";
}

function analyzePart34({ part, q, group, optMap }) {
  const stem = decodeEntities(q?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = optMap[ans] || "";
  const transcriptText = stripHtmlFlat(group?.transcriptHtml || "");
  const evidenceQuote = !q?.explanation
    ? extractPart34Evidence(group?.transcriptHtml || "", q?.num, stem, ansText)
    : "";

  const isGraphic = /\b(look at the graphic|chart|map|schedule|table|floor|list|receipt|coupon|menu|directory|invoice|itinerary|sign)\b/i.test(stem)
    || (Array.isArray(group?.images) && group.images.length > 0 && /how much|which|where|what\s+(?:fee|date|time|room|platform|discount|item|option)/i.test(stem));
  const isImplied = /\b(mean when|imply|why does the (?:man|woman|speaker) say,?\s*["“])/i.test(stem) || /["“][^"”]{4,}["”]/.test(stem);
  const isMain = /\b(who (?:most likely|are the speakers|is the speaker)|where (?:are|does|most likely)|what is the (?:main )?(?:purpose|topic)|what kind of business|what are the speakers discussing)\b/i.test(stem);
  const isNext = /\b(do next|asked to do|remind|what will the .+ do|suggested|recommend)\b/i.test(stem);

  let qTypeBadge = `Part ${part} · Chi tiết & Paraphrase`;
  let quickTip = "Câu hỏi Part 3/4 chạy đúng thứ tự băng (Câu 1 → đầu, Câu 2 → giữa, Câu 3 → cuối). Luôn tìm cách diễn đạt đồng nghĩa (Paraphrase) thay vì bắt từ giống hệt.";
  let isHardTrap = false;

  if (isGraphic) {
    qTypeBadge = `Part ${part} · Đối chiếu Biểu đồ / Bảng`;
    isHardTrap = true;
    quickTip = "TUYỆT ĐỐI không chỉ nghe con số hay đáp án: ETS luôn đọc phần cột/mục LIÊN KẾT (giờ, ngày, hạng mục) chứ không đọc thẳng đáp án trên biểu đồ.";
  } else if (isImplied) {
    qTypeBadge = `Part ${part} · Câu hỏi Hàm ý (Implied)`;
    isHardTrap = true;
    quickTip = "Với câu trích nguyên văn trong ngoặc kép “...”, hãy nghe thật kỹ câu NGAY TRƯỚC và NGAY SAU câu trích + ngữ điệu đồng ý/từ chối của người nói.";
  } else if (isMain) {
    qTypeBadge = `Part ${part} · Tổng quát / Ngữ cảnh`;
    quickTip = "Nghe 2–3 câu đầu tiên ngay khi băng bắt đầu: bắt các danh từ chuyên ngành đặc trưng để suy ra nghề nghiệp, địa điểm hoặc mục đích.";
  } else if (isNext) {
    qTypeBadge = `Part ${part} · Hành động tiếp theo`;
    quickTip = "Tập trung vào 1–2 câu cuối cùng trước khi kết thúc băng + cụm gợi ý (I'll, Why don't you, Please make sure, Let me).";
  }

  const distractorTraps = [];
  if (part === 3 && /\b(the man|the woman)\b/i.test(stem)) {
    const targetSpeaker = /\bthe man\b/i.test(stem) ? "Nam (Man)" : "Nữ (Woman)";
    distractorTraps.push({
      choice: "",
      tag: "Bẫy Nhầm người nói",
      detail: `Câu hỏi chỉ đích danh người ${targetSpeaker} — đáp án nhiễu thường lấy đúng hành động nhưng của người còn lại nói.`
    });
  }

  const hasPivot = /\b(actually|however|unfortunately|instead|originally|used to|changed|postponed|canceled|rather than)\b/i.test(transcriptText);
  if (hasPivot) {
    isHardTrap = true;
    distractorTraps.push({
      choice: "",
      tag: "Bẫy Bẻ lái thông tin",
      detail: "Băng có tín hiệu đổi ý (actually / however / instead / originally) — thông tin nêu ra lúc đầu thường bị phủ định để làm bẫy."
    });
  }

  // Detect word-match trap on distractors vs transcript
  const transTokens = tokenizeContent(transcriptText);
  const distractors = Object.entries(optMap).filter(([ch, txt]) => ch !== ans && txt);
  for (const [ch, txt] of distractors) {
    const { repeated } = findRepeatedAndSimilarWords(transTokens, tokenizeContent(txt));
    if (repeated.length) {
      distractorTraps.push({
        choice: ch,
        tag: "Bẫy Nghe từ y hệt",
        detail: `Phương án (${ch}) lặp lại từ khóa xuất hiện trong băng (“${repeated.join(", ")}”) nhưng sai chủ thể hoặc sai ngữ cảnh câu hỏi.`
      });
      break;
    }
  }

  if (!distractorTraps.length) {
    distractorTraps.push({
      choice: "",
      tag: "Bẫy Paraphrase",
      detail: "ETS ít khi đọc nguyên văn đáp án đúng; phương án sai hay mượn từ ở câu khác ghép vào để đánh lừa."
    });
  }

  return {
    qTypeBadge,
    isHardTrap,
    evidenceQuote,
    distractorTraps: distractorTraps.slice(0, 3),
    quickTip,
    strategyNote: "Mẹo đọc đón đầu: Khi băng đang đọc Directions hoặc vừa chuyển câu, đọc lướt trước 3 câu hỏi kế tiếp và gạch dưới từ để hỏi."
  };
}

/* ============================================================
   PART 5 & 6 ANALYZER (3,960 Qs)
   ============================================================ */
function longestCommonPrefixLen(arr = []) {
  if (arr.length < 2) return 0;
  let prefix = arr[0].toLowerCase();
  for (let i = 1; i < arr.length; i++) {
    const w = arr[i].toLowerCase();
    while (prefix && !w.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix.length;
}

function getBlankNeighbors(stem = "", passageHtml = "", qNum = 0) {
  let text = decodeEntities(stem || "");
  let match = text.match(/([^\n]{0,45})[_-]{3,}([^\n]{0,45})/);
  if (!match && passageHtml) {
    const pFlat = stripHtmlFlat(passageHtml);
    match = pFlat.match(new RegExp(`([^\\n]{0,45})(?:\\(${qNum}\\)|\\[${qNum}\\]|[_-]{3,})([^\\n]{0,45})`));
  }
  if (!match) return { beforeWord: "", afterWord: "", fullCtx: "" };
  const beforeWords = (match[1] || "").trim().split(/\s+/).filter(Boolean);
  const afterWords = (match[2] || "").trim().split(/\s+/).filter(Boolean);
  return {
    beforeWord: (beforeWords[beforeWords.length - 1] || "").replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, ""),
    afterWord: (afterWords[0] || "").replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, ""),
    beforeTwo: beforeWords.slice(-2).join(" "),
    afterTwo: afterWords.slice(0, 2).join(" ")
  };
}

function analyzePart56({ part, q, group, optMap }) {
  const stem = decodeEntities(q?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const ansText = (optMap[ans] || "").trim();
  const optEntries = Object.entries(optMap).filter(([, t]) => Boolean(t));
  const optTexts = optEntries.map(([, t]) => t.trim());
  const avgLen = optTexts.reduce((a, b) => a + b.length, 0) / Math.max(1, optTexts.length);

  // 1. Part 6 Sentence Insertion
  if (part === 6 && avgLen >= 25) {
    return {
      qTypeBadge: "Part 6 · Điền cả câu (Sentence Insertion)",
      isHardTrap: true,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Tham chiếu & Mạch logic",
          detail: "Đáp án nhiễu thường đúng chủ đề chung của đoạn văn nhưng bị đứt gãy đại từ thay thế (it / they / this / such) hoặc sai thì so với câu liền sau."
        }
      ],
      quickTip: "Đọc kỹ 1 câu TRƯỚC + 1 câu SAU chỗ trống; tìm từ nối (However, Therefore, Also) và đại từ chỉ định để ghép khớp mạch ý 2 chiều.",
      strategyNote: "Đáp án đúng phải làm cầu nối mượt giữa câu trước và câu sau — không chỉ hợp nghĩa với riêng câu đứng trước."
    };
  }

  const singleWordOpts = optTexts.filter((t) => /^[a-z-]+$/i.test(t));
  const prefixLen = singleWordOpts.length >= 3 ? longestCommonPrefixLen(singleWordOpts) : 0;
  const ctx = getBlankNeighbors(stem, group?.passageHtml || "", q?.num);
  const ctxLabel = (ctx.beforeTwo || ctx.afterTwo)
    ? `Ngữ cảnh sát chỗ trống: “… ${ctx.beforeTwo || "…"} [___] ${ctx.afterTwo || "…"} …”`
    : "";

  // 2. Pronoun / Relative / Determiner
  const pronounSet = new Set(["he", "him", "his", "himself", "she", "her", "hers", "herself", "they", "them", "their", "theirs", "themselves", "it", "its", "itself", "we", "us", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "who", "whom", "whose", "which", "that", "anyone", "someone", "everyone", "each", "every", "either", "neither", "another", "other", "others"]);
  const pronounHits = optTexts.filter((t) => pronounSet.has(t.toLowerCase())).length;
  if (pronounHits >= 3) {
    return {
      qTypeBadge: `Part ${part} · Đại từ & Từ hạn định`,
      isHardTrap: false,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Sở hữu vs Phản thân",
          detail: "Dễ nhầm giữa Tính từ sở hữu (my/his/their + Noun), Đại từ sở hữu (mine/his/theirs — đứng một mình) và Đại từ phản thân (-self nhấn mạnh hoặc tự tác động)."
        }
      ],
      quickTip: "Nhìn ngay sau chỗ trống: nếu có Danh từ → chọn Tính từ sở hữu (his/her/their); đứng sau Giới từ/Động từ không có N → chọn Tân ngữ (him/her/them); nhấn mạnh chủ ngữ → -self.",
      strategyNote: ctxLabel || "Xác định nhanh ngôi/số của chủ ngữ (số ít hay số nhiều) để loại ngay 2 phương án lệch số."
    };
  }

  // 3. Conjunction vs Preposition
  const conjPrepSet = new Set(["although", "though", "even though", "while", "whereas", "because", "since", "unless", "until", "once", "despite", "in spite of", "during", "because of", "due to", "owing to", "except", "except for", "regarding", "concerning", "throughout", "beyond", "without", "among", "between", "across", "moreover", "however", "therefore", "otherwise", "meanwhile", "besides"]);
  const conjPrepHits = optTexts.filter((t) => conjPrepSet.has(t.toLowerCase())).length;
  if (conjPrepHits >= 2) {
    return {
      qTypeBadge: `Part ${part} · Liên từ vs Giới từ`,
      isHardTrap: true,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Nghĩa giống nhau nhưng Khác ngữ pháp",
          detail: "Although ≈ Despite (nhưng Although + S + V, còn Despite + Cụm N/V-ing); tương tự Because ≠ Because of; While ≠ During."
        }
      ],
      quickTip: "Quy tắc vàng 3 giây: Sau chỗ trống có đủ [Chủ ngữ + Động từ chia thì] → chọn LIÊN TỪ; chỉ có [Cụm danh từ / V-ing] → chọn GIỚI TỪ.",
      strategyNote: ctxLabel || "Nếu thấy 2 đáp án cùng cấu trúc ngữ pháp giống nhau → lúc đó mới dịch nghĩa đối lập (although) hay nguyên nhân (because)."
    };
  }

  // 4. Verb Tense / Voice / Verb Form
  const isVerbFormSet = optTexts.some((t) => /^(?:to |is |are |was |were |will |has |have |had |be |being |having )/i.test(t))
    || (prefixLen >= 4 && optTexts.some((t) => /(?:ed|ing)$/i.test(t)) && !optTexts.some((t) => /(?:ly|tion|ment|ness)$/i.test(t)));
  if (isVerbFormSet) {
    return {
      qTypeBadge: `Part ${part} · Thì & Dạng động từ`,
      isHardTrap: false,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Chủ động vs Bị động",
          detail: "Động từ có tân ngữ trực tiếp (Cụm N) phía sau → thường là Chủ động; ngay sau chỗ trống là Giới từ (by/in/for/to) hoặc dấu chấm → ưu tiên Bị động (be + V3)."
        }
      ],
      quickTip: "Bước 1: Kiểm tra mệnh đề đã có Động từ chính chia thì chưa (chưa có → chọn V chia thì; đã có → chọn To-V / V-ing / V3). Bước 2: Chốt Chủ động/Bị động + Số ít/nhiều.",
      strategyNote: ctxLabel || "Chú ý trạng từ chỉ thời gian (since + QKĐ, by next year → TLHT, currently → HTĐ/HTTD)."
    };
  }

  // 5. Word Family (POS)
  if (prefixLen >= 4) {
    let posRule = "Xét 1 từ trước và 1 từ sau chỗ trống để chốt từ loại (N / V / Adj / Adv) chỉ trong 5 giây mà không cần dịch cả câu dài.";
    if (/ly$/i.test(ansText)) {
      posRule = `Chỗ trống cần TRẠNG TỪ (${ansText}) để bổ nghĩa cho Động từ, Tính từ hoặc cả mệnh đề.`;
    } else if (/^(?:a|an|the|this|that|these|those|my|your|his|her|its|our|their)$/i.test(ctx.beforeWord)) {
      posRule = `Sau mạo từ/từ hạn định “${ctx.beforeWord}”: nếu liền sau là Danh từ → điền TÍNH TỪ; nếu hết cụm danh từ (gặp giới từ/động từ) → điền DANH TỪ.`;
    }
    return {
      qTypeBadge: `Part ${part} · Bẫy Từ loại (Word Family)`,
      isHardTrap: false,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Đuôi từ cùng gốc",
          detail: "4 đáp án cùng gốc từ dễ làm chọn nhầm nếu bỏ sót từ loại đứng liền sau chỗ trống (ví dụ: Adv + Adj + N)."
        }
      ],
      quickTip: posRule,
      strategyNote: ctxLabel || "Ghi nhớ chuỗi chuẩn: [Mạo từ/Sở hữu] + (Adv) + (Adj) + Danh từ."
    };
  }

  // 6. Vocabulary & Collocation
  return {
    qTypeBadge: `Part ${part} · Từ vựng & Collocation`,
    isHardTrap: false,
    evidenceQuote: "",
    distractorTraps: [
      {
        choice: "",
        tag: "Bẫy Nghĩa gần & Giới từ đi kèm",
        detail: "Các phương án có thể na ná nghĩa tiếng Việt nhưng sai ngữ cảnh thương mại (register) hoặc không khớp giới từ liền sau chỗ trống."
      }
    ],
    quickTip: "Đọc cụm 3–4 từ quanh chỗ trống để bắt Collocation cố định và giới từ đi kèm (như eligible for, comply with, prior to); dịch nhanh câu để chốt nghĩa logic nhất.",
    strategyNote: ctxLabel || (part === 6 ? "Trong Part 6 câu từ vựng, luôn kiểm tra ngữ cảnh câu trước đó để chọn đúng sắc thái trang trọng." : "")
  };
}

/* ============================================================
   PART 7 ANALYZER (4,681 Qs)
   ============================================================ */
function analyzePart7({ q, group, optMap }) {
  const stem = decodeEntities(q?.stem || "").trim();
  const ans = String(q?.answer || "").toUpperCase();
  const multiDoc = Array.isArray(group?.images) && group.images.length >= 2;
  const imgCount = Array.isArray(group?.images) ? group.images.length : 0;
  const docTag = imgCount >= 3 ? "Đọc 3 đoạn (Triple)" : (imgCount === 2 ? "Đọc 2 đoạn (Double)" : "Đọc đoạn đơn");

  if (/\b(?:NOT|EXCEPT)\b|least likely/i.test(stem)) {
    return {
      qTypeBadge: `Part 7 · Bẫy Phủ định (NOT / EXCEPT)`,
      isHardTrap: true,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Quên chữ NOT",
          detail: "3 đáp án sai lại là 3 thông tin ĐÚNG có thật trong bài; thí sinh hay chọn nhầm đáp án đầu tiên mình tìm thấy."
        }
      ],
      quickTip: "Dùng phương pháp Loại trừ ngược: đánh dấu ⊘ (chuột phải) lần lượt 3 phương án ĐÚNG được nhắc trong bài — phương án còn lại chính là đáp án.",
      strategyNote: `${docTag}: Đừng vội chọn ngay khi thấy từ khóa trùng trong bài — câu có chữ NOT yêu cầu tìm chi tiết SAI hoặc KHÔNG ĐƯỢC NHẮC.`
    };
  }

  if (/\bbest belong\b|\bpositions marked\b|\[1\]|\[2\]|\[3\]|\[4\]/i.test(stem)) {
    return {
      qTypeBadge: "Part 7 · Chèn câu [1]–[4]",
      isHardTrap: true,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Lạc đại từ nối",
          detail: "Câu chèn chứa từ chỉ định (this, these, such, it, they) hoặc liên từ (however, in addition) nếu đặt sai vị trí sẽ mất đối tượng tham chiếu."
        }
      ],
      quickTip: "Gạch chân ngay từ nối & đại từ trong câu in đậm cần chèn → kiểm tra kỹ câu ĐỨNG TRƯỚC và ĐỨNG SAU mỗi dấu [1]–[4] để khớp 2 đầu.",
      strategyNote: "Mẹo tiết kiệm thời gian: Thường vị trí [1] hiếm khi chứa từ nối phản ý (However/Therefore), còn vị trí [4] hay tổng kết."
    };
  }

  if (/\bclosest in meaning\b|\bmeaning to\b/i.test(stem)) {
    return {
      qTypeBadge: "Part 7 · Từ đồng nghĩa theo ngữ cảnh",
      isHardTrap: false,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Nghĩa phổ biến nhất",
          detail: "ETS thường gài nghĩa đen quen thuộc nhất của từ làm bẫy, trong khi bài đọc dùng từ đó với nghĩa thứ cấp theo ngữ cảnh."
        }
      ],
      quickTip: "Đừng dịch nghĩa từ đứng một mình! Hãy đọc trọn câu chứa từ được hỏi và THAY TỪNG ĐÁP ÁN vào chỗ trống để xem câu nào giữ nguyên logic tự nhiên nhất.",
      strategyNote: `${docTag}: Đọc thêm 1 câu trước đó để nắm đúng chủ thể đang nói đến vật, thời gian hay quy định.`
    };
  }

  if (/\b(?:inferred|implied|suggested|most likely|indicated)\b/i.test(stem) || multiDoc) {
    return {
      qTypeBadge: `Part 7 · Suy luận & ${docTag}`,
      isHardTrap: true,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: multiDoc ? "Bẫy Bỏ sót văn bản liên kết" : "Bẫy Suy diễn quá đà",
          detail: multiDoc
            ? "Nếu chỉ đọc 1 văn bản rất dễ chọn sai; câu hỏi ETS bắt phải kết hợp chi tiết ở Văn bản 1 với điều kiện/cập nhật ở Văn bản 2–3."
            : "Đáp án nhiễu suy diễn thêm chi tiết không hề có bằng chứng gián tiếp rõ ràng trong bài."
        }
      ],
      quickTip: multiDoc
        ? "Tìm điểm cầu nối giữa các văn bản (tên người, mã đơn, ngày, bảng giá/lịch trình) để ghép đủ 2 mảnh thông tin trước khi chốt."
        : "Câu Suy luận (Inferred/Suggested) KHÔNG được đoán mò: đáp án đúng luôn là Paraphrase sát của một dữ kiện hoặc phép cộng/trừ logic từ bài.",
      strategyNote: "Cẩn thận các ghi chú *dấu sao*, footnotes hoặc dòng đính chính ở cuối bài — đây là vị trí chứa bẫy phổ biến nhất của ETS."
    };
  }

  if (/\b(?:purpose|mainly about|intended for|who most likely wrote|why (?:did|was|is))\b/i.test(stem)) {
    return {
      qTypeBadge: `Part 7 · Mục đích & Tổng quan (${docTag})`,
      isHardTrap: false,
      evidenceQuote: "",
      distractorTraps: [
        {
          choice: "",
          tag: "Bẫy Chi tiết phụ",
          detail: "Phương án sai thường chỉ đúng với 1 câu ví dụ nhỏ ở đoạn giữa chứ không bao quát mục đích chính của cả văn bản."
        }
      ],
      quickTip: "Đọc ngay dòng Tiêu đề (Subject / Title / Headline) + 2 câu đầu tiên của đoạn 1; câu mục đích chính nằm trong 25% đầu bài đọc.",
      strategyNote: "Chú ý động từ đầu đáp án (To announce, To apologize, To explain a change, To invite) sao cho khớp vai trò người gửi – người nhận."
    };
  }

  const distractors = Object.entries(optMap).filter(([ch, txt]) => ch !== ans && txt);
  const ansWords = tokenizeContent(optMap[ans] || "");
  return {
    qTypeBadge: `Part 7 · Tìm chi tiết (${docTag})`,
    isHardTrap: false,
    evidenceQuote: "",
    distractorTraps: [
      {
        choice: "",
        tag: "Bẫy Paraphrase & Điều kiện kèm theo",
        detail: "ETS viết lại thông tin bằng từ đồng nghĩa (ví dụ: complimentary = free, prior to = before) và hay gài bẫy đảo ngày giờ, số lượng hoặc điều kiện ngoại lệ."
      }
    ],
    quickTip: "Định vị nhanh bằng tên riêng, con số, ngày tháng hoặc từ khóa hiếm trong câu hỏi → đọc kỹ cả câu trước và sau dòng chứa từ khóa rồi đối chiếu Paraphrase.",
    strategyNote: ansWords.length
      ? `So khớp đúng thông tin cốt lõi của (${ans}) thay vì các từ xuất hiện rải rác ở đoạn không liên quan.`
      : (distractors.length ? "Loại trừ nhanh các phương án sai rõ rệt về con số hoặc thời gian." : "")
  };
}

/* ============================================================
   PERSONALIZED MISTAKE FEEDBACK & PUBLIC ENTRY POINT
   ============================================================ */
function buildUserMistakeCallout({ part, q, optMap, userChoice, base }) {
  const u = String(userChoice || "").toUpperCase();
  const ans = String(q?.answer || "").toUpperCase();
  if (!u || !ans || u === ans) return "";

  const matchedTrap = (base.distractorTraps || []).find((t) => t.choice && t.choice.toUpperCase() === u);
  if (matchedTrap) {
    return `Bạn vừa chọn (${u}) — vướng ${matchedTrap.tag}: ${matchedTrap.detail}`;
  }

  const uTxt = optMap[u] || "";
  const uShort = uTxt ? ` (“${uTxt.length > 48 ? `${uTxt.slice(0, 47)}…` : uTxt}”)` : "";
  if (part <= 2) {
    return `Bạn đã chọn (${u})${uShort}, nhưng đáp án đúng là (${ans}). Hãy đối chiếu lại phần nghe xem vì sao (${u}) bị lệch trọng tâm hoặc bẫy âm.`;
  }
  if (part === 5 || part === 6) {
    return `Bạn đã chọn (${u})${uShort} thay vì (${ans}). Hãy soi lại chức năng ngữ pháp (từ loại/thì/giới từ) hoặc sắc thái collocation ngay quanh chỗ trống.`;
  }
  return `Bạn đã chọn (${u})${uShort} — phương án nhiễu này không khớp hoàn toàn dẫn chứng của câu hỏi; đối chiếu lại chi tiết then chốt cho (${ans}).`;
}

/**
 * Generates unified Trap & Tip Coaching metadata for any TOEIC question (Parts 1–7).
 */
export function analyzeQuestionTrapsAndTips({ part, q, group, parsedP12 = null, userChoice = "" }) {
  const pNum = Number(part || group?.part || 5);
  const optMap = getOptionsMap(q, parsedP12);

  let base;
  if (pNum === 1) base = analyzePart1({ q, optMap });
  else if (pNum === 2) base = analyzePart2({ q, optMap, parsedP12 });
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

  return {
    qTypeBadge: base.qTypeBadge,
    isHardTrap: Boolean(base.isHardTrap),
    evidenceQuote: base.evidenceQuote || "",
    userMistakeCallout,
    distractorTraps: base.distractorTraps || [],
    quickTip: base.quickTip,
    strategyNote: base.strategyNote || ""
  };
}
