/**
 * Neuro-TOEIC Part 4 Studio Pro — DOM Renderers & UI Components
 * Renders: TalkCard, 4-Tab Inspector, Graphic Lightbox, Toast Stack & Question Highlighting
 */

import { icons, getIcon } from "./uiIcons.js";
import { state, saveState, updateMastery, getMasteryScore } from "./store.js?v=27.0";

/** Toast Notifications */
export function showToast(message, type = "info", duration = 2800) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }

  const normalizedMsg = String(message || "").trim();

  // Deduplicate identical consecutive message text
  const lastToast = container.lastElementChild;
  if (lastToast && lastToast.dataset.toastMsg === normalizedMsg) {
    if (lastToast._hideTimer) clearTimeout(lastToast._hideTimer);
    if (lastToast._removeTimer) clearTimeout(lastToast._removeTimer);
    lastToast.style.opacity = "1";
    lastToast.style.transform = "translateY(0)";
    lastToast._hideTimer = setTimeout(() => {
      lastToast.style.opacity = "0";
      lastToast.style.transform = "translateY(8px)";
      lastToast._removeTimer = setTimeout(() => lastToast.remove(), 220);
    }, duration);
    return;
  }

  // Prevent toast flooding: Keep at most 2 toasts visible simultaneously
  while (container.children.length >= 2) {
    const oldest = container.firstElementChild;
    if (oldest?._hideTimer) clearTimeout(oldest._hideTimer);
    if (oldest?._removeTimer) clearTimeout(oldest._removeTimer);
    oldest.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast is-${type}`;
  toast.dataset.toastMsg = normalizedMsg;
  toast.style.pointerEvents = "none";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast._removeTimer = setTimeout(() => toast.remove(), 220);
  }, duration);
}

/** Clear all active transient toast notifications (e.g. on route/view change) */
export function clearToasts() {
  const container = document.getElementById("toast-container");
  if (!container) return;
  Array.from(container.children).forEach((el) => {
    if (el?._hideTimer) clearTimeout(el._hideTimer);
    if (el?._removeTimer) clearTimeout(el._removeTimer);
    el.remove();
  });
}

/** Graphic Lightbox Modal */
export function openGraphicLightbox(imgSrc, title = "Bảng biểu sơ đồ") {
  let modal = document.querySelector(".lightbox-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "lightbox-modal";
    document.body.appendChild(modal);
  }

  let currentZoom = 1.0;

  modal.innerHTML = `
    <div class="lightbox-content">
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 12px; color: #fff;">
        <span style="font-weight: 500; font-size: 1rem;">${title}</span>
        <button type="button" class="tool-btn icon-only lightbox-close-btn" style="background: rgba(255,255,255,0.2); color: #fff; border: none;" aria-label="Đóng">
          ${getIcon("x", 16)}
        </button>
      </div>
      <img src="${imgSrc}" class="lightbox-img" alt="${title}" style="transform: scale(${currentZoom}); cursor: grab;" />
      <div class="lightbox-toolbar">
        <button type="button" class="tool-btn icon-only zoom-in-btn" title="Phóng to" style="background: transparent; color: #fff; border: none;">
          ${getIcon("zoomIn", 16)}
        </button>
        <button type="button" class="tool-btn icon-only zoom-out-btn" title="Thu nhỏ" style="background: transparent; color: #fff; border: none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button type="button" class="tool-btn icon-only zoom-reset-btn" title="Vừa màn hình" style="background: transparent; color: #fff; border: none;">
          ${getIcon("rotateCcw", 16)}
        </button>
      </div>
    </div>
  `;

  modal.style.display = "flex";

  const img = modal.querySelector(".lightbox-img");
  const updateZoom = (z) => {
    currentZoom = Math.max(0.8, Math.min(3.0, z));
    img.style.transform = `scale(${currentZoom})`;
  };

  modal.querySelector(".zoom-in-btn").addEventListener("click", () => updateZoom(currentZoom + 0.3));
  modal.querySelector(".zoom-out-btn").addEventListener("click", () => updateZoom(currentZoom - 0.3));
  modal.querySelector(".zoom-reset-btn").addEventListener("click", () => updateZoom(1.0));

  const closeLightbox = () => {
    modal.style.display = "none";
  };

  modal.querySelector(".lightbox-close-btn").addEventListener("click", closeLightbox);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLightbox();
  });
}

/** Render 4-Step Mastery SVG Ring */
export function renderMasteryRing(talkKey) {
  const score = getMasteryScore(talkKey);
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 4) * circumference;

  return `
    <div class="mastery-ring-wrap" title="Tiến độ làm chủ: ${score}/4 bước (Trắc nghiệm, Giải mã, Chính tả, Shadowing)">
      <svg width="22" height="22" viewBox="0 0 22 22">
        <circle class="mastery-ring-bg" cx="11" cy="11" r="${radius}" fill="none" stroke-width="2.5" />
        <circle class="mastery-ring-fill ${score === 4 ? 'is-complete' : ''}" cx="11" cy="11" r="${radius}" fill="none" stroke-width="2.5"
          stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" />
      </svg>
      <span class="mastery-step-count">${score}</span>
    </div>
  `;
}

/** Helper: Apply persistent text highlights, insertion slot badges, and optional active evidence highlight in a single clean pass */
export function formatPart7Text(plainText, { highlights = [], evidence = null } = {}) {
  const safeStr = String(plainText ?? "");
  const esc = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const ranges = [];
  const lower = safeStr.toLowerCase();

  // 1. User highlights (yellow)
  if (highlights && highlights.length) {
    const seen = new Set();
    const terms = [];
    for (const raw of highlights) {
      const t = String(raw || "").trim();
      if (t.length < 2) continue;
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        terms.push(t);
      }
    }
    terms.sort((a, b) => b.length - a.length);
    if (terms.length) {
      const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const rx = new RegExp(`(${pattern})`, "gi");
      let m;
      while ((m = rx.exec(safeStr)) !== null) {
        ranges.push({ start: m.index, end: m.index + m[0].length, kind: "hl", label: m[0] });
      }
    }
  }

  // 2. Active evidence quote highlight (green/amber pulse when clicking "Soi chứng cứ")
  if (evidence && evidence.quote) {
    const qLower = evidence.quote.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx !== -1) {
      ranges.push({ start: idx, end: idx + evidence.quote.length, kind: "ev", qNum: evidence.qNum });
    }
  }

  // 3. Insertion slot tokens "— [1] —" .. "— [4] —"
  const slotRx = /—\s*\[([1-4])\]\s*—/g;
  let sm;
  while ((sm = slotRx.exec(safeStr)) !== null) {
    ranges.push({ start: sm.index, end: sm.index + sm[0].length, kind: "slot", slotNum: sm[1] });
  }

  if (!ranges.length) return esc(safeStr).replace(/\n/g, "<br/>");

  // Merge without overlapping cleanly (priority: ev > slot > hl)
  const prio = { ev: 3, slot: 2, hl: 1 };
  ranges.sort((a, b) => a.start - b.start || prio[b.kind] - prio[a.kind]);

  const nonOverlapping = [];
  for (const r of ranges) {
    const last = nonOverlapping[nonOverlapping.length - 1];
    if (!last || r.start >= last.end) {
      nonOverlapping.push(r);
    } else if (prio[r.kind] > prio[last.kind]) {
      // Evidence or slot replaces overlapped yellow highlight slice cleanly
      nonOverlapping[nonOverlapping.length - 1] = r;
    }
  }

  let out = "";
  let cursor = 0;
  for (const r of nonOverlapping) {
    if (r.start > cursor) out += esc(safeStr.slice(cursor, r.start)).replace(/\n/g, "<br/>");
    const chunk = esc(safeStr.slice(r.start, r.end)).replace(/\n/g, "<br/>");
    if (r.kind === "ev") {
      out += `<mark class="p7-evidence-mark" data-evidence-q="${r.qNum}"><span class="p7-evidence-pill">Câu ${r.qNum}</span>${chunk}</mark>`;
    } else if (r.kind === "slot") {
      out += `<span class="p7-slot-badge">[${r.slotNum}]</span>`;
    } else {
      const matched = esc(safeStr.slice(r.start, r.end));
      out += `<mark class="highlight-mark" title="Nhấp đúp để xóa đánh dấu" data-highlight="${matched}">${chunk}</mark>`;
    }
    cursor = r.end;
  }
  if (cursor < safeStr.length) out += esc(safeStr.slice(cursor)).replace(/\n/g, "<br/>");
  return out;
}

/** Render Part 7 Authentic Passage Document Cards */
export function renderPart7Passages(talk, talkKey, options = {}) {
  const {
    highlights = [],
    isRevealed = false,
    showVi = false,
    activeDocTab = "all",
    activeEvidenceQ = null,
    isExamMode = false
  } = options;

  const docs = talk.passages || [];
  const evQObj = activeEvidenceQ ? (talk.questions || []).find((q) => q.num === Number(activeEvidenceQ)) : null;

  const renderDoc = (doc) => {
    const rawEvQuote = evQObj ? (evQObj.evidenceQuote || evQObj.evidence || "") : "";
    const docMatchesEv = evQObj && (!evQObj.evidenceDoc || evQObj.evidenceDoc === doc.docId || docs.length === 1);
    const docEvidence = (evQObj && rawEvQuote && docMatchesEv && !isExamMode && isRevealed)
      ? { qNum: evQObj.num, quote: rawEvQuote }
      : null;
    const fmt = (txt) => formatPart7Text(txt, { highlights, evidence: docEvidence });
    const allowVi = Boolean(!isExamMode && isRevealed && showVi);

    const renderParaList = (list = []) => list.map((p) => `
      <div class="p7-para-block">
        <div class="p7-para-en p7-hl-zone">${fmt(p.text)}</div>
        ${allowVi && p.vi ? `<div class="p7-vi-block">${p.vi.replace(/\n/g, "<br/>")}</div>` : ''}
      </div>
    `).join("");

    const renderMetaTable = (meta) => meta ? `
      <table class="p7-meta-table">
        <tbody>
          ${Object.entries(meta).map(([k, v]) => `
            <tr>
              <th>${k}:</th>
              <td class="p7-hl-zone">${fmt(v)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : '';

    const renderTable = (tbl) => tbl ? `
      <div class="p7-table-wrap">
        <table class="p7-table">
          <thead>
            <tr>${tbl.headers.map((h) => `<th class="p7-hl-zone">${fmt(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${tbl.rows.map((row) => `
              <tr>${row.map((cell) => `<td class="p7-hl-zone">${fmt(cell)}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : '';

    const renderBullets = (heading, bullets = []) => bullets.length ? `
      ${heading ? `<div class="p7-hl-zone" style="font-weight: 500; margin: 10px 0 6px;">${fmt(heading)}</div>` : ''}
      <ul class="p7-bullets">
        ${bullets.map((b) => `
          <li>
            <div class="p7-hl-zone">${fmt(b.text)}</div>
            ${allowVi && b.vi ? `<div class="p7-vi-block">${b.vi}</div>` : ''}
          </li>
        `).join("")}
      </ul>
    ` : '';

    let innerHTML = "";
    if (doc.kind === "memo") {
      innerHTML = `
        <div class="p7-memo-stamp">${doc.badge || "MEMO"}</div>
        ${renderMetaTable(doc.meta)}
        ${renderParaList(doc.paragraphs)}
      `;
    } else if (doc.kind === "email") {
      innerHTML = `
        ${renderMetaTable(doc.meta)}
        ${renderParaList(doc.paragraphs)}
      `;
    } else if (doc.kind === "letter") {
      innerHTML = `
        ${doc.letterhead ? `<div class="p7-letterhead p7-hl-zone">${doc.letterhead.map((l) => fmt(l)).join("<br/>")}</div>` : ''}
        ${doc.salutation ? `<p class="p7-hl-zone" style="font-weight: 600; margin: 0 0 10px 0;">${fmt(doc.salutation)}</p>` : ''}
        ${renderParaList(doc.paragraphs)}
        ${doc.signature ? `<p class="p7-hl-zone" style="margin: 12px 0 0 0; font-weight: 600;">${fmt(doc.signature)}</p>` : ''}
      `;
    } else if (doc.kind === "chat") {
      innerHTML = `
        ${doc.title ? `<h4 class="p7-doc-title p7-hl-zone">${fmt(doc.title)}</h4>` : ''}
        <div class="p7-chat-list">
          ${(doc.messages || []).map((m) => `
            <div class="p7-chat-bubble ${m.side === 'right' ? 'side-right' : 'side-left'}">
              <div class="p7-chat-meta">
                <span>${m.sender}</span>
                <span class="p7-chat-time">[${m.time}]</span>
              </div>
              <div class="p7-chat-text p7-hl-zone">${fmt(m.text)}</div>
              ${allowVi && m.vi ? `<div class="p7-vi-block">${m.vi}</div>` : ''}
            </div>
          `).join("")}
        </div>
      `;
    } else if (doc.kind === "review") {
      const filled = "★".repeat(doc.stars || 0);
      const empty = "☆".repeat(Math.max(0, 5 - (doc.stars || 0)));
      innerHTML = `
        ${doc.title ? `<h4 class="p7-doc-title" style="text-align: left; font-size: 1rem;">${doc.title}</h4>` : ''}
        <div class="p7-review-rating">
          <span>${doc.ratingTitle || ''}</span>
          <span style="color: #f59e0b; letter-spacing: 1px;">${filled}${empty}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">(${doc.stars}/5 stars)</span>
        </div>
        ${renderParaList(doc.paragraphs)}
        ${doc.author ? `<div style="text-align: right; font-style: italic; font-weight: 500; margin-top: 8px; font-size: 0.88rem;">— ${doc.author}</div>` : ''}
      `;
    } else if (doc.kind === "video_desc") {
      innerHTML = `
        <div class="p7-video-header">
          <div>
            <div class="p7-video-channel">${doc.channelName || ''}</div>
            <div class="p7-video-subs">${doc.subscribers || ''}</div>
          </div>
          <span class="badge" style="background: var(--surface-2); color: var(--accent); font-weight: 600; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem;">▶ ${doc.platform || 'Video'}</span>
        </div>
        ${renderParaList(doc.paragraphs)}
        <div class="p7-video-divider">*****************************</div>
        <div class="${doc.smallDisclosure ? 'p7-disclosure-small' : ''} p7-hl-zone">${fmt(doc.disclosure || '')}</div>
        ${allowVi && doc.disclosureVi ? `<div class="p7-vi-block">${doc.disclosureVi}</div>` : ''}
      `;
    } else {
      // notice, flyer, article, info, press_release, form, web_table
      innerHTML = `
        ${doc.eyebrow ? `<div class="p7-doc-eyebrow p7-hl-zone">${fmt(doc.eyebrow)}</div>` : ''}
        ${doc.title ? `<h4 class="p7-doc-title p7-hl-zone">${fmt(doc.title)}</h4>` : ''}
        <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          ${doc.subtitle ? `<div class="p7-doc-subtitle p7-hl-zone" style="flex: 1;">${fmt(doc.subtitle)}</div>` : ''}
          ${doc.unitNote ? `<span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">${doc.unitNote}</span>` : ''}
        </div>
        ${doc.formFields ? `<div class="p7-form-fields">${doc.formFields.map((f) => `<div class="p7-hl-zone">${fmt(f)}</div>`).join("")}</div>` : ''}
        ${renderParaList(doc.paragraphs)}
        ${doc.episodes && doc.episodes.length ? `
          <div class="p7-episode-list">
            ${doc.episodes.map((ep) => `
              <div>
                <div style="font-weight: 600; font-size: 0.88rem; color: var(--accent);" class="p7-hl-zone">${fmt(ep.num)}</div>
                <div style="padding-left: 10px;" class="p7-hl-zone">${fmt(ep.text)}</div>
                ${allowVi && ep.vi ? `<div class="p7-vi-block">${ep.vi}</div>` : ''}
              </div>
            `).join("")}
          </div>
        ` : ''}
        ${renderTable(doc.table)}
        ${renderBullets(doc.bulletsHeading, doc.bullets)}
        ${renderParaList(doc.paragraphsAfterBullets)}
        ${doc.footerNotes ? doc.footerNotes.map((n) => `<div class="p7-footnote p7-hl-zone">${fmt(n)}</div>`).join("") : ''}
      `;
    }

    return `
      <div class="p7-doc-card kind-${doc.kind || 'notice'}" data-doc-id="${doc.docId || 'doc1'}">
        <div class="p7-doc-labelbar">
          <span>${doc.docLabel || (doc.docId || 'DOC').toUpperCase()}</span>
          ${docEvidence ? `<span class="badge" style="background: var(--ok); color: var(--ok-contrast, #fff); padding: 1px 8px; border-radius: 999px; font-size: 0.68rem;">Đang soi chứng cứ Câu ${docEvidence.qNum}</span>` : ''}
        </div>
        ${doc.url ? `
          <div class="p7-browser-bar">
            <span>◀ ▶</span>
            <span class="p7-browser-url">${doc.url}</span>
          </div>
        ` : ''}
        <div class="p7-doc-body">
          ${innerHTML}
        </div>
      </div>
    `;
  };

  const visibleDocs = activeDocTab === "all" ? docs : docs.filter((d) => d.docId === activeDocTab);
  const introText = talk.introPrompt || `Questions ${talk.range} refer to the following passage.`;

  return `
    <div class="p7-passages-pane" data-talk-key="${talkKey}">
      <div class="p7-intro-banner">
        <span style="display: inline-flex; align-items: center; gap: 6px;">${getIcon("bookOpen", 14)} <span>${introText}</span></span>
        <span class="p7-intro-hint">Kéo bôi vàng từ khóa trong bài đọc</span>
      </div>
      <div class="p7-passage-toolbar">
        <div class="p7-doc-tabs">
          ${docs.length > 1 ? `
            <button type="button" class="mini-pill p7-doc-tab-btn ${activeDocTab === 'all' ? 'is-active' : ''}" data-doc-tab="all">Tất cả (${docs.length} văn bản)</button>
            ${docs.map((d, i) => `
              <button type="button" class="mini-pill p7-doc-tab-btn ${activeDocTab === d.docId ? 'is-active' : ''}" data-doc-tab="${d.docId}">Văn bản ${i + 1}</button>
            `).join("")}
          ` : `<span style="font-size: 0.78rem; font-weight: 500; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px;">${getIcon("bookOpen", 13)} <span>${Number(talk.part) === 5 ? "Bảng câu gốc &amp; Dịch nghĩa Part 5" : "Bài đọc đơn"}</span></span>`}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          ${activeEvidenceQ ? `
            <button type="button" class="mini-pill p7-clear-evidence-btn" style="border-color: var(--ok); color: var(--ok);">✕ Tắt khung soi Câu ${activeEvidenceQ}</button>
          ` : ''}
          ${!isExamMode ? (isRevealed ? `
            <button type="button" class="mini-pill p7-toggle-vi-btn ${showVi ? 'is-active' : ''}" title="Bật/tắt bản dịch tiếng Việt ngay dưới mỗi đoạn văn">
              ${showVi ? `${getIcon("check", 13)} <span>Đang hiện dịch song ngữ</span>` : `${getIcon("globe", 13)} <span>Dịch từng đoạn</span>`}
            </button>
          ` : `
            <span class="mini-pill" style="opacity: 0.65; cursor: not-allowed;" title="Hoàn thành & Kiểm tra bài để mở bản dịch từng đoạn">${getIcon("lock", 12)} <span>Dịch đoạn (Ẩn khi thi)</span></span>
          `) : ''}
        </div>
      </div>

      ${visibleDocs.map(renderDoc).join("")}
    </div>
  `;
}

/** Render Bilingual Passage Tab inside Reading Inspector */
export function renderReadingInspectorScript(talk) {
  const docs = talk.passages || [];
  if (!docs.length) return `<div class="muted-text">${talk.translation || ''}</div>`;

  return `
    <div class="p7-inspector-passage-list">
      <div style="font-size: 0.82rem; color: var(--text-muted); padding: 4px 2px;">
        <strong>Hướng dẫn:</strong> Bạn có thể đối chiếu bản dịch tiếng Việt đầy đủ từng văn bản bên dưới với bản gốc tiếng Anh ở cột bên trái.
      </div>
      ${docs.map((doc) => {
        const viChunks = [];
        (doc.paragraphs || []).forEach((p) => { if (p.vi) viChunks.push(p.vi); });
        (doc.messages || []).forEach((m) => { if (m.vi) viChunks.push(`<strong>${m.sender} [${m.time}]:</strong> ${m.vi}`); });
        (doc.episodes || []).forEach((e) => { if (e.vi) viChunks.push(e.vi); });
        (doc.bullets || []).forEach((b) => { if (b.vi) viChunks.push(`&bull; ${b.vi}`); });
        (doc.paragraphsAfterBullets || []).forEach((p) => { if (p.vi) viChunks.push(p.vi); });
        if (doc.disclosureVi) viChunks.push(`<em>${doc.disclosureVi}</em>`);

        return `
          <div class="p7-inspector-doc">
            <h4>${doc.docLabel || doc.docId}</h4>
            ${doc.title ? `<div style="font-weight: 500; margin-bottom: 6px;">${doc.title}</div>` : ''}
            <div style="font-size: 0.96rem; line-height: 1.65; display: flex; flex-direction: column; gap: 8px;">
              ${viChunks.length ? viChunks.map((c) => `<div>${c.replace(/\n/g, "<br/>")}</div>`).join("") : `<div>${talk.translation || ''}</div>`}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/** Helper: Apply persistent text highlights to plain text in a single safe pass */
export function applyHighlights(plainText, highlightsList = []) {
  const safeStr = String(plainText ?? "");
  const escapeHtml = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  if (!highlightsList || !highlightsList.length) return escapeHtml(safeStr);

  // Deduplicate case-insensitively and sort longest-first so longer phrases win
  const seen = new Set();
  const terms = [];
  for (const raw of highlightsList) {
    const t = String(raw || "").trim();
    if (t.length < 2) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      terms.push(t);
    }
  }
  if (!terms.length) return escapeHtml(safeStr);

  terms.sort((a, b) => b.length - a.length);
  const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");

  let out = "";
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(safeStr)) !== null) {
    if (match.index > lastIndex) {
      out += escapeHtml(safeStr.slice(lastIndex, match.index));
    }
    const matched = escapeHtml(match[0]);
    out += `<mark class="highlight-mark" title="Nhấp đúp để xóa đánh dấu" data-highlight="${matched}">${matched}</mark>`;
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < safeStr.length) {
    out += escapeHtml(safeStr.slice(lastIndex));
  }
  return out;
}

/** Render Evidence Deep Link Tab Body */
export function renderEvidenceAnalysis(talk) {
  if (!talk.questions) return "";

  return `
    <div class="evidence-analysis-list">
      ${talk.questions.map((q) => {
        const correctOpt = q.options.find((o) => o.choice === q.answer) || {};
        const evQuote = q.evidenceQuote || q.evidence || "";
        return `
          <div class="evidence-analysis-card" data-qnum="${q.num}">
            <div style="font-weight: 500; font-size: 1rem; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>Câu ${q.num}: ${q.question}</span>
              <span class="badge" style="background: var(--ok-soft); color: var(--ok); padding: 2px 8px; border-radius: 999px; font-weight: 600;">${q.answer}</span>
            </div>

            <!-- Paraphrase Matching -->
            <div class="paraphrase-match-box">
              <div>
                <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">${talk.isReading ? 'Chứng cứ / Cấu trúc:' : 'Nghe trong Audio:'}</span>
                <div style="font-weight: 600; color: var(--accent);">
                  ${talk.isReading && evQuote ? `"${evQuote}"` : ((q.explanation || '').split('->')[0] || 'Chứng cứ trọng tâm')}
                </div>
              </div>
              <div class="paraphrase-arrow">${getIcon("arrowRight", 14)}</div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Paraphrase Đáp Án:</span>
                <div style="font-weight: 500; color: var(--ok);">${correctOpt.text || ''}</div>
              </div>
            </div>

            <!-- Traps & Distractors -->
            <div class="trap-explanation-box">
              <strong>Giải mã bẫy:</strong> ${q.explanation || ''}
              ${talk.isReading && evQuote && (talk.passages && talk.passages.length > 0) ? `
                <div style="margin-top: 8px;">
                  <button type="button" class="mini-pill jump-evidence-btn" data-qnum="${q.num}" style="border-color: var(--ok); color: var(--ok); font-weight: 500;">
                    ${getIcon("mapPin", 13)} <span>Chỉ vị trí trong bài đọc</span>
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/** Render Chunks & Timestamp Notes Tab Body */
export function renderVocabAndNotes(talk, talkKey) {
  const savedNote = state.notes[talkKey] || "";
  const vocabList = talk.vocab || [];

  return `
    <div class="vocab-notes-tab">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent); margin: 0;">Cụm từ ăn điểm (${vocabList.length})</h4>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
        <input type="search" class="field-input vocab-filter-input" placeholder="Lọc nhanh từ vựng (EN / Tiếng Việt)..." aria-label="Lọc từ vựng trong bài" style="padding: 6px 10px; font-size: 0.82rem;" />
        <div class="tool-group vocab-pos-filters" style="gap: 4px; flex-wrap: wrap;">
          <button type="button" class="mini-pill is-active" data-pos="all">Tất cả (${vocabList.length})</button>
          <button type="button" class="mini-pill" data-pos="verb">Động từ / Cụm ĐT</button>
          <button type="button" class="mini-pill" data-pos="noun">Danh từ / Cụm DT</button>
          <button type="button" class="mini-pill" data-pos="phrase">Cụm từ &amp; Khác</button>
        </div>
      </div>
      <div class="vocab-chunks-list">
        ${vocabList.map((v) => {
          const colonIdx = v.indexOf(":");
          const phrase = (colonIdx >= 0 ? v.slice(0, colonIdx) : v).trim();
          const meaning = (colonIdx >= 0 ? v.slice(colonIdx + 1) : "").trim();
          const lowerP = phrase.toLowerCase();
          const posType = lowerP.includes("(v)") ? "verb"
            : lowerP.includes("(n)") ? "noun"
            : "phrase";
          return `
            <div class="vocab-chunk-item" data-phrase="${phrase.toLowerCase()}" data-meaning="${meaning.toLowerCase()}" data-pos="${posType}">
              <div>
                <strong>${phrase}</strong>
                <span style="color: var(--text-muted); margin-left: 6px;">${meaning}</span>
              </div>
              <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                <button type="button" class="mini-pill play-chunk-audio-btn" data-word="${phrase.replace(/\s*\([^)]*\)/g, "").trim()}" title="${talk.isReading ? 'Nghe phát âm tiếng Anh cụm từ này (TTS)' : 'Nghe đoạn câu thoại chứa cụm từ này'}">
                  ${getIcon(talk.isReading ? "volume2" : "play", 11)} <span>Nghe</span>
                </button>
                <button type="button" class="mini-pill add-chunk-srs-btn" data-word="${phrase.replace(/\s*\([^)]*\)/g, "").trim()}" data-meaning="${meaning}">+ Thẻ</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent); margin: 18px 0 6px;">${talk.isReading ? 'Ghi chú Paraphrase & Từ đồng nghĩa' : 'Ghi chú cá nhân (Hỗ trợ timestamp [m:ss])'}</h4>
      ${!talk.isReading ? `<p style="font-size: 0.76rem; color: var(--text-muted); margin: 0 0 8px;">Nhập thời gian như <code>[0:34]</code> để tạo liên kết bấm tua nhanh audio.</p>` : `<p style="font-size: 0.76rem; color: var(--text-muted); margin: 0 0 8px;">Ghi chú nhanh các cặp từ đồng nghĩa / cấu trúc bẫy trong bài đọc.</p>`}
      <textarea class="timestamp-note-area" placeholder="Nhập ghi chú học tập...">${savedNote}</textarea>
      <div class="parsed-note-links" style="margin-top: 8px; font-size: 0.84rem;"></div>
    </div>
  `;
}
