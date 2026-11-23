/**
 * Neuro-TOEIC Studio Pro — Executive TOEIC 900+ Strategy Playbook
 * Covers 5 Core Tabs:
 *   - roadmap   : Lộ trình 90 ngày (450 -> 900+ Deliberate Practice & Raw Score Matrix)
 *   - timestack : Time-Stacking 3h/ngày (Nhịp sinh học & Quy tắc Giải phẫu 1:3)
 *   - part2     : Giải mã 11 Bẫy ETS Part 2 & Câu trả lời gián tiếp
 *   - part4     : Chu kỳ 8 giây Đọc đón đầu, Paraphrasing & Biểu đồ Part 3 & 4
 *   - part7     : Kiểm soát 75 phút Reading (Part 5-6-7) & Liên kết Đa đoạn (Double/Triple)
 */

window.TOEIC_STRATEGY_DATA = `# CHIẾN LƯỢC TỔNG LỰC: CON ĐƯỜNG ĐỘT PHÁ TOEIC 450 -> 900+ TRONG 90 NGÀY

> **NGUYÊN TẮC CỐT LÕI CHUẨN ETS:**
> Điểm số 900+ không đến từ mẹo vặt đoán mò mà là kết quả tất yếu của 3 trụ cột:
> \`Tốc độ giải mã âm vị nối âm (Listening)\` + \`Kho cụm từ thương mại Lexical Chunks\` + \`Kỷ luật phân bổ 75 phút Đọc hiểu\`.

## 1. BÀI TOÁN ĐỊNH LƯỢNG 90 NGÀY (350 - 420 GIỜ DELIBERATE PRACTICE)
- Để tăng mỗi 100 điểm TOEIC bền vững cần trung bình 80 - 95 giờ luyện tập có chủ đích (Deliberate Practice).
- Mốc điểm mục tiêu cho 900+ (Tổng >= 905/990):
  - **Listening (465 - 485/495):** Đúng tối thiểu **89 - 93/100 câu** (Part 1: 6/6, Part 2: 23/25, Part 3: 35/39, Part 4: 27/30).
  - **Reading (440 - 465/495):** Đúng tối thiểu **86 - 91/100 câu** (Part 5: 27/30, Part 6: 15/16, Part 7: 46/54).

## 2. HỆ THỐNG TIME-STACKING 3 GIỜ/NGÀY
- **Sáng (30 phút):** Nghe lặp chủ động 1.15x các bài đã giải mã để nạp biến âm (Linking, Elision, Flap-T).
- **Trưa (25 phút):** Quét sạch thẻ Flashcard SM-2 đến hạn + Quiz 4 đáp án phản xạ nhanh.
- **Chiều (20 phút):** Bấm giờ 15 câu Part 5 trong 5 phút (System 1 Grammar).
- **Tối (90 phút Deep Work):** Luân phiên Giải phẫu Part 3-4 (Dictation + Shadowing) và Part 7 (Soi chứng cứ đa đoạn).

## 3. KIỂM SOÁT 75 PHÚT READING (PART 5 - 6 - 7)
- **Part 5 (30 câu):** Tối đa **10 phút** (Đồng hồ đếm ngược còn 65:00).
- **Part 6 (16 câu):** Tối đa **8 phút** (Đồng hồ còn 57:00).
- **Part 7 Đoạn đơn (29 câu):** **24 phút** (Đồng hồ còn 33:00).
- **Part 7 Đoạn kép (10 câu):** **10 phút** (Đồng hồ còn 23:00).
- **Part 7 Đoạn ba (15 câu):** **18 phút** (Đồng hồ còn 05:00 — dành 5 phút cuối rà soát câu phân vân).
`;

(function initToeicStrategyStudio() {
  const CHECKLIST_STORAGE_KEY = "nt_strategy_checklists_v2";

  function loadCheckState() {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveCheckState(obj) {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  function injectStrategyStyles() {
    if (typeof document === "undefined" || document.getElementById("toeic-strategy-studio-styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "toeic-strategy-studio-styles";
    style.textContent = `
      .strat-studio {
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: var(--text);
      }
      .strat-hero {
        background: var(--surface-2);
        border: 1px solid var(--border-strong);
        border-left: 4px solid var(--accent);
        border-radius: var(--radius-md);
        padding: 14px 16px;
      }
      .strat-hero h3 {
        margin: 0 0 6px;
        font-size: 1.04rem;
        color: var(--accent);
      }
      .strat-hero p {
        margin: 0;
        font-size: 0.88rem;
        color: var(--text-muted);
        line-height: 1.6;
      }
      .strat-sec-title {
        margin: 4px 0 8px;
        font-size: 0.96rem;
        font-weight: 600;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .strat-grid-3 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
        gap: 12px;
      }
      .strat-grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 12px;
      }
      .strat-card {
        background: var(--surface);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        padding: 14px;
      }
      .strat-card h4, .strat-card h5 {
        margin: 6px 0;
        font-size: 0.93rem;
        color: var(--text);
      }
      .strat-card ul, .strat-card ol {
        margin: 6px 0 0;
        padding-left: 18px;
        font-size: 0.84rem;
        color: var(--text-muted);
        line-height: 1.6;
      }
      .strat-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        font-size: 0.72rem;
        font-weight: 500;
      }
      .strat-pill-accent { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); }
      .strat-pill-ok { background: var(--ok-soft); color: var(--ok); border: 1px solid var(--ok-border); }
      .strat-pill-warn { background: var(--warn-soft); color: var(--warn); border: 1px solid var(--warn-border); }
      .strat-pill-bad { background: var(--bad-soft); color: var(--bad); border: 1px solid var(--bad-border); }
      .strat-pill-info { background: var(--info-soft); color: var(--info); border: 1px solid var(--info-border); }
      .strat-table-wrap {
        width: 100%;
        overflow-x: auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-strong);
      }
      .strat-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.84rem;
        background: var(--surface);
      }
      .strat-table th {
        background: var(--surface-2);
        color: var(--text);
        font-weight: 500;
        text-align: left;
        padding: 9px 11px;
        border-bottom: 1px solid var(--border-strong);
      }
      .strat-table td {
        padding: 9px 11px;
        border-bottom: 1px solid var(--border);
        color: var(--text-muted);
        vertical-align: top;
        line-height: 1.5;
      }
      .strat-table tr:last-child td {
        border-bottom: none;
      }
      .strat-table td strong {
        color: var(--text);
      }
      .strat-trap-card {
        background: var(--surface);
        border: 1px solid var(--border-strong);
        border-left: 3.5px solid var(--bad);
        border-radius: var(--radius-md);
        padding: 12px 14px;
      }
      .strat-trap-card.is-tactic {
        border-left-color: var(--ok);
      }
      .strat-trap-card strong {
        color: var(--text);
        font-size: 0.89rem;
      }
      .strat-trap-card p {
        margin: 5px 0 0;
        font-size: 0.84rem;
        color: var(--text-muted);
        line-height: 1.55;
      }
      .strat-code {
        font-family: var(--font-sans);
        font-weight: 600;
        font-size: 0.8rem;
        padding: 2px 7px;
        border-radius: 5px;
        background: var(--surface-2);
        color: var(--accent);
        border: 1px solid var(--border);
      }
      .strat-checklist-box {
        background: var(--surface-2);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        padding: 14px 16px;
      }
      .strat-checklist-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .strat-check-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 7px 8px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.85rem;
        color: var(--text);
        line-height: 1.5;
        transition: background var(--transition-fast);
      }
      .strat-check-item:hover {
        background: var(--surface);
      }
      .strat-check-item input[type="checkbox"] {
        margin-top: 3px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        accent-color: var(--ok);
        cursor: pointer;
      }
      .strat-check-item.is-done span {
        text-decoration: line-through;
        color: var(--text-muted);
      }
      .strat-ico {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: -3px;
        margin-right: 4px;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
  }

  const S_ICO = {
    check: `<span class="strat-ico" style="color: var(--ok);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>`,
    target: `<span class="strat-ico" style="color: var(--accent);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>`,
    chart: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>`,
    rocket: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></span>`,
    warn: `<span class="strat-ico" style="color: var(--bad);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>`,
    clock: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>`,
    calendar: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>`,
    award: `<span class="strat-ico" style="color: var(--ok);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span>`,
    ban: `<span class="strat-ico" style="color: var(--bad);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></span>`,
    headphones: `<span class="strat-ico" style="color: var(--accent);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg></span>`,
    zap: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>`,
    shield: `<span class="strat-ico" style="color: var(--bad);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>`,
    arrow: `<span class="strat-ico" style="color: var(--accent);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>`,
    refresh: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg></span>`,
    repeat: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></span>`,
    chat: `<span class="strat-ico" style="color: var(--ok);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>`,
    book: `<span class="strat-ico" style="color: var(--accent);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>`,
    search: `<span class="strat-ico" style="color: var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>`
  };

  const CHECKLIST_ITEMS = {
    roadmap: [
      { id: "rm_1", text: "Xác định điểm khởi đầu bằng 1 đề Full CBT 120 phút để biết chính xác độ lệch Listening vs Reading." },
      { id: "rm_2", text: "Khóa mục tiêu sai số tối đa của Giai đoạn 1: Part 1 sai 0 câu, Part 2 sai không quá 3 câu." },
      { id: "rm_3", text: "Lập sổ nhật ký lỗi sai (Error Log) phân loại rõ 4 nguyên nhân: Biến âm / Từ vựng / Ngữ pháp / Đọc sót ý." },
      { id: "rm_4", text: "Loại bỏ hoàn toàn thói quen dịch nhẩm từng từ sang tiếng Việt (Subvocalization) khi làm Part 5 & Part 7." },
      { id: "rm_5", text: "Nạp tối thiểu 25 cụm từ thương mại (Lexical Chunks) mỗi ngày vào hệ thống SM-2 Flashcard." },
      { id: "rm_6", text: "Thực hiện tối thiểu 6 đề Full 200 câu chịu áp lực thời gian thật trong 30 ngày cuối trước ngày thi." }
    ],
    timestack: [
      { id: "ts_1", text: "Khung Sáng (30p): Nghe lặp lại ở tốc độ 1.15x các bài Part 2, 3, 4 đã giải mã tối hôm trước." },
      { id: "ts_2", text: "Khung Trưa (25p): Duyệt sạch 100% thẻ Cần ôn hôm nay (Due Today) và làm 15 câu Speed Quiz 4 đáp án." },
      { id: "ts_3", text: "Khung Chiều (20p): Luyện phản xạ bấm giờ 15 câu Part 5 trong đúng 5 phút (20 giây/câu)." },
      { id: "ts_4", text: "Khung Tối Deep Work (90p): Bật Focus Theater (Phím F), ngắt thông báo điện thoại, giải đề & chữa chi tiết tỷ lệ 1:3." },
      { id: "ts_5", text: "Tuyệt đối không nghe thụ động bài mới chưa hiểu nghĩa; chỉ tắm ngôn ngữ trên bài đã nắm rõ Tapescript." },
      { id: "ts_6", text: "Sáng Thứ Bảy hoặc Chủ Nhật (09:00 - 11:00): Thi mô phỏng liên hoàn không tạm dừng audio, không tra từ điển." }
    ],
    part2: [
      { id: "p2_1", text: "Bắt dính từ để hỏi đầu tiên (Who/When/Where/Why/How/Auxiliary) trong 0.5 giây đầu của băng." },
      { id: "p2_2", text: "Áp dụng Luật Sắt Wh-: Loại bỏ ngay lập tức 100% đáp án bắt đầu bằng Yes / No / Sure / Of course." },
      { id: "p2_3", text: "Cảnh giác tối đa với đáp án lặp lại nguyên xi từ khóa hoặc có từ đồng âm/cận âm với câu hỏi (95% là bẫy)." },
      { id: "p2_4", text: "Thuộc nằm lòng nhóm câu trả lời gián tiếp: 'Chưa biết / Để tôi kiểm tra / Hỏi người phụ trách'." },
      { id: "p2_5", text: "Sử dụng thao tác Chuột phải hoặc nút loại trừ (⊘) ngay khi vừa nghe từng phương án A, B, C." },
      { id: "p2_6", text: "Với câu trần thuật (Statement), tập trung tìm câu phản hồi giải pháp hoặc cập nhật tiến độ thực tế." }
    ],
    part4: [
      { id: "p4_1", text: "Tận dụng trọn vẹn 30 giây đọc Directions đầu phần để đọc đón đầu trước bộ câu hỏi đầu tiên." },
      { id: "p4_2", text: "Chỉ gạch chân/nhớ Từ khóa cốt lõi (Chủ thể + Hành động) của 3 câu hỏi, không cố nhớ toàn bộ 12 đáp án dài." },
      { id: "p4_3", text: "Chọn đáp án ngay trong lúc băng đang phát; hoàn tất cả 3 câu trước khi loa đọc hết câu hỏi thứ nhất." },
      { id: "p4_4", text: "Dùng ngay 16-20 giây thời gian đọc câu hỏi dư ra để đọc đón đầu tiếp bộ 3 câu kế tiếp (giữ vững nhịp 8 giây)." },
      { id: "p4_5", text: "Với câu Biểu đồ/Bảng giá (Graphic), khóa mắt vào cột thông tin KHÔNG xuất hiện trong đáp án để bắt tín hiệu từ loa." },
      { id: "p4_6", text: "Sau khi chấm bài, thực hiện đủ 3 bước: Nghe chép chính tả (Dictation) -> Soi bẫy -> Nhại giọng (Shadowing 0.5s)." }
    ],
    part7: [
      { id: "p7_1", text: "Chốt cứng mốc đồng hồ Part 5 + Part 6 tối đa 18 phút (đồng hồ đếm ngược phải còn >= 57:00 cho Part 7)." },
      { id: "p7_2", text: "Áp dụng Chiến thuật Đảo ngược: Đọc tiêu đề văn bản + Câu hỏi trước, quét từ khóa riêng (Tên, Ngày, Số tiền) để định vị." },
      { id: "p7_3", text: "Với câu NOT / TRUE tốn thời gian, để lại xử lý sau các câu hỏi chi tiết trong cùng bài đọc đó." },
      { id: "p7_4", text: "Với câu điền câu [1] [2] [3] [4], bắt buộc kiểm tra đại từ chỉ định (this, such, those) và liên từ chuyển ý câu liền kề." },
      { id: "p7_5", text: "Luôn quét mắt kiểm tra dòng chú thích nhỏ cuối bảng/hóa đơn (* Footnote) trước khi chốt câu hỏi điều kiện." },
      { id: "p7_6", text: "Với Đoạn kép & Đoạn ba (Q176-200), tìm từ khóa cầu nối chung (Mã đơn, Ngày giao, Tên gói) giữa 2-3 văn bản." },
      { id: "p7_7", text: "Giữ lại đúng 5 phút cuối cùng để rà các câu gắn nhãn Phân vân (Doubt) và đảm bảo không bỏ trống câu nào." }
    ]
  };

  function renderChecklistHtml(tabId, titleText) {
    const items = CHECKLIST_ITEMS[tabId] || [];
    const stateMap = loadCheckState();
    const doneCount = items.filter((it) => Boolean(stateMap[it.id])).length;

    return `
      <div class="strat-checklist-box" data-checklist-tab="${tabId}">
        <div class="strat-checklist-head">
          <strong style="font-size: 0.9rem; color: var(--accent);">${S_ICO.check}${titleText}</strong>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="strat-pill ${doneCount === items.length ? "strat-pill-ok" : "strat-pill-accent"}" data-check-counter="${tabId}">
              Hoàn thành: ${doneCount}/${items.length}
            </span>
            <button type="button" class="tool-btn strat-reset-check-btn" data-reset-tab="${tabId}" style="padding: 3px 8px; font-size: 0.74rem;">
              Đặt lại
            </button>
          </div>
        </div>
        <div>
          ${items
            .map((it) => {
              const checked = Boolean(stateMap[it.id]);
              return `
                <label class="strat-check-item ${checked ? "is-done" : ""}">
                  <input type="checkbox" data-check-id="${it.id}" ${checked ? "checked" : ""} />
                  <span>${it.text}</span>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  const SECTION_BUILDERS = {
    roadmap: () => `
      <div class="strat-studio" data-strat-v2="1">
        <div class="strat-hero">
          <h3>${S_ICO.target}Bản Đồ Định Lượng 90 Ngày: Từ 450 &rarr; 900+ (Tích Lũy 360 Giờ Thực Chiến)</h3>
          <p>
            Theo chuẩn đo lường của Viện Khảo thí Giáo dục Hoa Kỳ (ETS), bước nhảy <strong>+450 điểm</strong> đòi hỏi chuyển hóa từ mức <em>B1 thụ động</em> lên <em>C1 phản xạ tự động</em>. Không một mẹo loại trừ mò mẫm nào qua mặt được 200 câu trong 120 phút — bạn cần chiến lược kiểm soát sai số chính xác từng Part.
          </p>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.chart}1. Bảng Chỉ Tiêu Điểm Số &amp; Hạn Mức Câu Sai Cho Phép (ETS Target Matrix)</h4>
          <div class="strat-table-wrap">
            <table class="strat-table">
              <thead>
                <tr>
                  <th>Mốc Mục Tiêu</th>
                  <th>Listening Raw / Scaled</th>
                  <th>Reading Raw / Scaled</th>
                  <th>Chỉ Tiêu Từng Phần (Số câu đúng tối thiểu)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="strat-pill strat-pill-info">Chặng 1: 650+</span></td>
                  <td><strong>68&ndash;72/100</strong> (~360&ndash;380đ)</td>
                  <td><strong>56&ndash;62/100</strong> (~285&ndash;310đ)</td>
                  <td>P1: 5/6 · P2: 19/25 · P3-4: 45/69 · P5-6: 31/46 · P7: 28/54</td>
                </tr>
                <tr>
                  <td><span class="strat-pill strat-pill-warn">Chặng 2: 800+</span></td>
                  <td><strong>81&ndash;85/100</strong> (~425&ndash;445đ)</td>
                  <td><strong>76&ndash;80/100</strong> (~380&ndash;405đ)</td>
                  <td>P1: 6/6 · P2: 21/25 · P3-4: 56/69 · P5-6: 38/46 · P7: 40/54</td>
                </tr>
                <tr>
                  <td><span class="strat-pill strat-pill-ok">Đích: 900&ndash;950+</span></td>
                  <td><strong>89&ndash;94/100</strong> (~465&ndash;490đ)</td>
                  <td><strong>86&ndash;92/100</strong> (~440&ndash;470đ)</td>
                  <td><strong>P1: 6/6 · P2: 23/25 · P3-4: 61/69 · P5: 27/30 · P6: 15/16 · P7: 46/54</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.rocket}2. Lộ Trình Tác Chiến 3 Giai Đoạn (90 Ngày Khép Kín)</h4>
          <div class="strat-grid-3">
            <div class="strat-card">
              <span class="strat-pill strat-pill-accent">Giai đoạn 1 · Ngày 1 &ndash; 30</span>
              <h5>Xây Nền Âm Vị &amp; Khung Ngữ Pháp 650+</h5>
              <ul>
                <li><strong>Listening:</strong> Xóa mù nối âm, nuốt âm cuối <span class="strat-code">/t/ /d/ /k/</span>, phân biệt giọng Anh-Úc với Mỹ-Canada. Ăn chắc Part 1 &amp; Part 2.</li>
                <li><strong>Grammar System 1:</strong> Làm chủ 6 chuyên đề ăn điểm 5 giây Part 5 (Từ loại, Chia thì, Bị động, Rút gọn MĐQH, Liên từ/Giới từ, Đại từ).</li>
                <li><strong>Từ vựng:</strong> Nạp 400 từ cốt lõi chủ đề Hợp đồng, Văn phòng, Nhân sự, Mua sắm.</li>
              </ul>
            </div>

            <div class="strat-card">
              <span class="strat-pill strat-pill-ok">Giai đoạn 2 · Ngày 31 &ndash; 60</span>
              <h5>Tăng Tốc Đọc Đón Đầu &amp; Paraphrase 800+</h5>
              <ul>
                <li><strong>Part 3 &amp; 4:</strong> Thành thạo chu kỳ 8 giây đọc trước câu hỏi; bắt từ đồng nghĩa thay vì chờ nghe từ giống hệt.</li>
                <li><strong>Part 7 Đoạn đơn:</strong> Đẩy tốc độ đọc lướt lên 200 từ/phút; giảm số câu không kịp làm cuối giờ từ 35 câu xuống dưới 8 câu.</li>
                <li><strong>Chữa sâu:</strong> Áp dụng Dictation + Soi chứng cứ (<span class="strat-code">Evidence Highlight</span>) trên từng câu sai.</li>
              </ul>
            </div>

            <div class="strat-card">
              <span class="strat-pill strat-pill-warn">Giai đoạn 3 · Ngày 61 &ndash; 90</span>
              <h5>Càn Quét Đa Đoạn &amp; Sức Bền Phòng Thi 900+</h5>
              <ul>
                <li><strong>Part 7 Đoạn Kép/Ba (Q176&ndash;200):</strong> Luyện kỹ năng tam giác hóa thông tin (Cross-referencing) giữa Email + Hóa đơn + Lịch trình.</li>
                <li><strong>Listening 1.15x:</strong> Luyện nghe ở tốc độ 1.15x để khi vào phòng thi thật (1.0x) cảm giác băng đọc chậm và cực kỳ rõ nét.</li>
                <li><strong>Full CBT:</strong> Thi thử 2 đề Full 120 phút/tuần để tối ưu thể lực não bộ ở phút thứ 105&ndash;120.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="strat-trap-card">
          <strong>${S_ICO.warn}3 Bẫy Tư Duy Khiến 85% Người Học Mắc Kẹt Mãi Ở Mức 600 Điểm:</strong>
          <p>
            <strong>1. Giải đề tràn lan không giải phẫu:</strong> Bấm chấm điểm xong bỏ đó sang đề mới = lặp lại y nguyên lỗi cũ.<br/>
            <strong>2. Học từ đơn lẻ rời rạc:</strong> Học <span class="strat-code">abide = tuân thủ</span> sẽ lúng túng khi chọn giới từ; phải học nguyên cụm <span class="strat-code">abide by = comply with = adhere to</span>.<br/>
            <strong>3. Sợ câu dài Part 7 nên ngốn 25 phút cho Part 5-6:</strong> Khiến 25 câu cuối Part 7 (nơi nhiều câu tìm chi tiết rất dễ lấy điểm) bị khoanh bừa toàn bộ.
          </p>
        </div>

        ${renderChecklistHtml("roadmap", "Checklist Thực Thi Lộ Trình 90 Ngày")}
      </div>
    `,

    timestack: () => `
      <div class="strat-studio" data-strat-v2="1">
        <div class="strat-hero">
          <h3>${S_ICO.clock}Hệ Thống Time-Stacking: Nạp 3 Giờ Tiếng Anh/Ngày Mà Không Kiệt Sức</h3>
          <p>
            Não bộ ghi nhớ ngôn ngữ hiệu quả gấp <strong>2.4 lần</strong> khi chia thành 4 phiên tiếp xúc phân tán (Spaced Exposure) so với ngồi nhồi nhét 3 tiếng liên tục lúc nửa đêm. Tận dụng mọi khoảng thời gian chuyển tiếp trong ngày theo đúng chức năng thần kinh.
          </p>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.calendar}1. Ma Trận Phân Bổ 180 Phút/Ngày (Dành Cho Người Bận Đi Học / Đi Làm)</h4>
          <div class="strat-table-wrap">
            <table class="strat-table">
              <thead>
                <tr>
                  <th>Khung Giờ</th>
                  <th>Thời Lượng</th>
                  <th>Phương Pháp Thực Hành Cụ Thể</th>
                  <th>Cơ Chế Não Bộ &amp; Đầu Ra</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>06:45 &ndash; 07:15</strong><br/><span class="strat-pill strat-pill-info">Vệ sinh / Di chuyển</span></td>
                  <td><strong>30 phút</strong></td>
                  <td><strong>Acoustic Priming (Nghe lặp 1.15x):</strong> Nghe lại 5&ndash;8 đoạn Part 3/4 đã học kỹ tối hôm trước, nhẩm đuổi theo ngữ điệu loa.</td>
                  <td>Khởi động vùng thính giác, khắc sâu nối âm &amp; cụm từ vào trí nhớ dài hạn.</td>
                </tr>
                <tr>
                  <td><strong>12:15 &ndash; 12:40</strong><br/><span class="strat-pill strat-pill-accent">Nghỉ trưa</span></td>
                  <td><strong>25 phút</strong></td>
                  <td><strong>SM-2 Flashcard + Quiz 4 Đáp Án:</strong> Mở hộp thoại Flashcards ôn hết thẻ <em>Due Today</em> và chạy 20 câu Speed Recall.</td>
                  <td>Chặn đứng đường cong quên lãng Ebbinghaus đúng thời điểm vàng.</td>
                </tr>
                <tr>
                  <td><strong>17:30 &ndash; 17:50</strong><br/><span class="strat-pill strat-pill-warn">Chuyển giao chiều</span></td>
                  <td><strong>20 phút</strong></td>
                  <td><strong>Sprint Part 5 &amp; 6:</strong> Bấm đồng hồ 6 phút xử lý 20 câu ngữ pháp/từ loại; đọc giải thích các bẫy đuôi từ ngay lập tức.</td>
                  <td>Rèn phản xạ nhận diện cấu trúc câu tốc độ cao dưới 15 giây/câu.</td>
                </tr>
                <tr>
                  <td><strong>20:30 &ndash; 22:00</strong><br/><span class="strat-pill strat-pill-ok">Tối · Deep Work</span></td>
                  <td><strong>90 phút</strong></td>
                  <td>
                    <strong>Thứ 2-4-6 (Listening Studio):</strong> Làm 1 test Part 2/4 &rarr; Chép chính tả (Dictation) đoạn nghe hụt &rarr; Shadowing.<br/>
                    <strong>Thứ 3-5-7 (Reading Studio):</strong> Giải 8&ndash;10 bài Part 7 bấm giờ &rarr; Bật <em>Soi chứng cứ</em> &amp; ghim từ mới vào SRS.
                  </td>
                  <td>Xây dựng năng lực xử lý đề phức tạp, mổ xẻ tận gốc từng bẫy nhiễu của ETS.</td>
                </tr>
                <tr>
                  <td><strong>Chủ Nhật</strong><br/><span class="strat-pill strat-pill-bad">09:00 &ndash; 11:00</span></td>
                  <td><strong>120 phút + 60p chữa</strong></td>
                  <td><strong>Phòng Thi CBT Liên Hoàn:</strong> Làm 1 đề Full liên tục đúng 2 tiếng, sau đó xem Báo cáo Telemetry &amp; câu Đoán đúng (Lucky Guess).</td>
                  <td>Rèn sức bền nhận thức suốt 120 phút, triệt tiêu tâm lý hoảng loạn cuối giờ.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="strat-grid-2">
          <div class="strat-trap-card is-tactic">
            <strong>${S_ICO.award}Quy Tắc Tỷ Lệ Vàng "1 Giờ Làm Bài : 3 Giờ Giải Phẫu"</strong>
            <p>
              Làm 1 bộ 30 câu Part 4 chỉ mất 15 phút, nhưng quá trình tăng điểm thực sự nằm ở <strong>45 phút giải phẫu sau đó</strong>: nghe lại không nhìn chữ câu sai &rarr; bật Tapescript tìm từ biến âm làm bạn điếc tạm thời &rarr; đối chiếu cặp từ Paraphrase &rarr; ghim cụm từ vào Flashcard.
            </p>
          </div>
          <div class="strat-trap-card">
            <strong>${S_ICO.ban}Bẫy Ảo Giác "Tắm Ngôn Ngữ Thụ Động" Sai Cách</strong>
            <p>
              Bật audio tiếng Anh mới tinh vừa nghe vừa lướt mạng xã hội hoặc làm việc khác sẽ bị vỏ não lọc bỏ như <strong>tiếng ồn nền (White Noise) = 0% tiến bộ</strong>. Chỉ nghe lặp bán thụ động trên những bài bạn <em>đã hiểu 100% nghĩa và mặt chữ</em>!
            </p>
          </div>
        </div>

        ${renderChecklistHtml("timestack", "Checklist Kỷ Luật Time-Stacking Mỗi Ngày")}
      </div>
    `,

    part2: () => `
      <div class="strat-studio" data-strat-v2="1">
        <div class="strat-hero">
          <h3>${S_ICO.headphones}Phác Đồ Xử Lý Trọn Vẹn Part 2: Giải Mã 11 Bẫy Âm Thanh &amp; Câu Trả Lời Gián Tiếp</h3>
          <p>
            Part 2 (25 câu, không in câu hỏi và đáp án trên đề) là "mỏ điểm vàng" quyết định mốc 450+/495 Listening. Trong đề ETS hiện đại, <strong>35% câu hỏi có đáp án trả lời vòng vo gián tiếp</strong> — do đó chiến thuật tối thượng là kết hợp <em>Bắt từ đầu câu</em> + <em>Loại trừ 2 phương án bẫy chắc chắn sai</em>.
          </p>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.zap}1. Bảng Phản Xạ 0.5 Giây Đầu Tiên Theo Từ Để Hỏi</h4>
          <div class="strat-table-wrap">
            <table class="strat-table">
              <thead>
                <tr>
                  <th>Từ Đầu Câu Hỏi</th>
                  <th>Tín Hiệu Đáp Án Đúng Điển Hình</th>
                  <th>Loại Trừ Tức Thì (Bẫy Chết Người)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="strat-code">Who / Whose</span></td>
                  <td>Tên riêng (Ms. Lin), chức danh (The technician), phòng ban (Accounting), đại từ nhân xưng.</td>
                  <td>Yes/No; nơi chốn không gắn với người; từ nhại âm với động từ trong câu hỏi.</td>
                </tr>
                <tr>
                  <td><span class="strat-code">When / What time</span></td>
                  <td>Mốc giờ, thứ/ngày/tháng, liên từ thời gian (<em>As soon as..., Right after..., Not until Friday</em>).</td>
                  <td>Yes/No; khoảng thời gian trả lời cho <em>How long</em> (vd: <em>For three years</em> khi hỏi <em>When will...</em>).</td>
                </tr>
                <tr>
                  <td><span class="strat-code">Where</span></td>
                  <td>Giới từ vị trí (<em>In Room B, Next to..., On the bottom shelf</em>), hoặc nguồn thông tin (<em>In the manual</em>).</td>
                  <td>Yes/No; mốc thời gian; lặp lại danh từ địa điểm trên câu hỏi nhưng sai ngữ cảnh.</td>
                </tr>
                <tr>
                  <td><span class="strat-code">Why / How come</span></td>
                  <td><em>Because / Since / Due to...</em>, <em>To + V</em> (chỉ mục đích), hoặc nêu trực tiếp nguyên nhân không cần <em>because</em>!</td>
                  <td>Yes/No; nhầm lẫn giữa <span class="strat-code">Why don't we/you...</span> (Câu gợi ý &rarr; <em>Sounds great / Sorry, I'm busy</em>!).</td>
                </tr>
                <tr>
                  <td><span class="strat-code">Choice (A or B?)</span></td>
                  <td>Chọn A, chọn B, chọn cả hai/sao cũng được (<em>Either works</em>), hoặc bác bỏ cả hai để chọn C.</td>
                  <td><strong>Loại ngay Yes / No!</strong> Câu hỏi lựa chọn không bao giờ trả lời bằng Yes/No.</td>
                </tr>
                <tr>
                  <td><span class="strat-code">Statement (Câu trần thuật)</span></td>
                  <td>Đưa giải pháp hỗ trợ (<em>I'll get more paper</em>), hỏi thêm chi tiết, hoặc đồng tình/cập nhật trạng thái.</td>
                  <td>Đáp án lặp nguyên danh từ câu trần thuật hoặc lệch chủ ngữ/thời gian.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.shield}2. Giải Phẫu 6 Bẫy Kinh Điển Nhất Của ETS Part 2</h4>
          <div class="strat-grid-2">
            <div class="strat-trap-card">
              <strong>1. Bẫy Đồng Âm &amp; Cận Âm (Homophone / Similar-Sound Trap)</strong>
              <p>
                Câu hỏi: <em>"Did you <u>arrange</u> the client luncheon?"</em> &rarr; Bẫy: <em>"Yes, a wide <u>range</u> of prices."</em><br/>
                Câu hỏi: <em>"When will Mr. Kim <u>retire</u>?"</em> &rarr; Bẫy: <em>"We replaced the front <u>tire</u>."</em><br/>
                ${S_ICO.arrow}<strong>Quy tắc 95%:</strong> Hễ nghe phương án có âm na ná từ trên câu hỏi mà nghĩa rẽ sang hướng khác &rarr; Gạch bỏ ngay!
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>2. Bẫy Trả Lời Gián Tiếp ("Tôi không biết" trá hình)</strong>
              <p>
                Hỏi: <em>"How much did the catering cost?"</em><br/>
                Đáp án đúng: <em>"Ms. Gomez handled all the invoices."</em> / <em>"I haven't seen the final statement yet."</em><br/>
                ${S_ICO.arrow}Mọi câu mang nghĩa <strong>chuyển trách nhiệm / chưa chốt / bảo xem lịch trình</strong> đều là ứng viên vàng cho đáp án đúng!
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>3. Bẫy Hỏi Ngược Kèm Điều Kiện (Counter-Question)</strong>
              <p>
                Hỏi: <em>"Could you cover my shift on Saturday?"</em><br/>
                Đáp án đúng: <em>"What hours are you scheduled to work?"</em> hoặc <em>"Didn't Manager Lee approve your leave?"</em>
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>4. Bẫy Câu Hỏi Phủ Định &amp; Câu Hỏi Đuôi (Negative / Tag)</strong>
              <p>
                Hỏi: <em>"Isn't the shipment arriving today?"</em> &rarr; Trong tiếng Anh, dù mở đầu bằng <em>Yes</em> hay <em>No</em>, hãy <strong>nghe vế giải thích phía sau</strong>: <em>"No, it was delayed by customs"</em> (= Chưa đến).
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>5. Bẫy Lệch Thì &amp; Lệch Đại Từ (Tense / Pronoun Trap)</strong>
              <p>
                Hỏi tương lai: <em>"Where <u>will</u> the seminar be held?"</em> &rarr; Bẫy quá khứ: <em>"It <u>was</u> very informative."</em><br/>
                Hỏi về <em>Ms. Tanaka</em> &rarr; Bẫy dùng <em>He left at noon</em>.
              </p>
            </div>

            <div class="strat-trap-card is-tactic">
              <strong>6. Kỹ Thuật Loại Trừ Vật Lý Bằng Chuột Phải / Nút (⊘)</strong>
              <p>
                Trên nền tảng này, hãy nhấn <strong>Chuột phải</strong> hoặc nút <strong>⊘</strong> gạch ngay đáp án sai lúc loa vừa đọc xong từng câu A, B, C. Khi A và B đều sai bẫy âm, hãy tự tin chọn thẳng C dù chưa nghe rõ hết câu C!
              </p>
            </div>
          </div>
        </div>

        ${renderChecklistHtml("part2", "Checklist Thực Chiến Làm Chủ Part 2")}
      </div>
    `,

    part4: () => `
      <div class="strat-studio" data-strat-v2="1">
        <div class="strat-hero">
          <h3>${S_ICO.zap}Kỹ Thuật "Chu Kỳ Đọc Đón Đầu 8 Giây" &amp; Săn Paraphrase Part 3 &amp; 4</h3>
          <p>
            Thí sinh 450&ndash;600 điểm luôn bị băng dẫn dắt (nghe xong mới cuống cuồng đọc câu hỏi). Thí sinh 900+ <strong>luôn chạy trước loa đúng 1 bài</strong>: họ biết chính xác cần săn thông tin gì trước khi chữ đầu tiên của đoạn hội thoại vang lên!
          </p>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.refresh}1. Vận Hành Dây Chuyền Thời Gian "Zero-Lag" Trong Phòng Thi</h4>
          <div class="strat-table-wrap">
            <table class="strat-table">
              <thead>
                <tr>
                  <th>Giai Đoạn Audio</th>
                  <th>Thời Lượng</th>
                  <th>Hành Động Bắt Buộc Của Mắt &amp; Tay</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Đọc hướng dẫn đầu phần</strong><br/>(Directions Part 3 / Part 4)</td>
                  <td>~30 giây</td>
                  <td>Bỏ qua hoàn toàn giọng đọc Directions! Quét ngay 3 câu hỏi + từ khóa đáp án của đoạn đầu tiên (<span class="strat-code">Q32&ndash;34</span> hoặc <span class="strat-code">Q71&ndash;73</span>).</td>
                </tr>
                <tr>
                  <td><strong>Đoạn hội thoại / Bài nói phát</strong><br/>(30 &ndash; 45 giây)</td>
                  <td>~40 giây</td>
                  <td>
                    • <strong>10 giây đầu:</strong> Chốt câu hỏi 1 (Chủ đề / Người nói / Địa điểm).<br/>
                    • <strong>20 giây giữa:</strong> Chốt câu hỏi 2 (Chi tiết / Vấn đề / Biểu đồ).<br/>
                    • <strong>10 giây cuối:</strong> Chốt câu hỏi 3 (Hành động tiếp theo <em>next / offer / suggest</em>).
                  </td>
                </tr>
                <tr>
                  <td><strong>Loa đọc 3 câu hỏi + 3 quãng nghỉ</strong><br/>(3 câu &times; 8 giây)</td>
                  <td>~24 giây</td>
                  <td>
                    • <strong>4 giây đầu:</strong> Rà chốt dứt khoát đáp án bài vừa nghe (nếu phân vân: chọn ngay trong 2 giây rồi buông bỏ!).<br/>
                    • <strong>20 giây còn lại:</strong> Chuyển mắt sang đọc đón đầu trọn vẹn 3 câu hỏi của bài kế tiếp!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.repeat}2. Từ Điển Chuyển Đổi Paraphrase Tần Suất Cao Nhất Của ETS</h4>
          <div class="strat-table-wrap">
            <table class="strat-table">
              <thead>
                <tr>
                  <th> Cụm Từ Nghe Được Trong Loa (Audio)</th>
                  <th>Đáp Án Đúng Viết Trên Màn Hình (Written Option)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><em>"We're short-handed / understaffed this month"</em></td>
                  <td><strong>Hire additional employees / Recruit temporary staff</strong></td>
                </tr>
                <tr>
                  <td><em>"That model is currently on back order / out of stock"</em></td>
                  <td><strong>A product is temporarily unavailable</strong></td>
                </tr>
                <tr>
                  <td><em>"Admission is complimentary / We'll waive the delivery fee"</em></td>
                  <td><strong>There is no charge / Obtain a service for free</strong></td>
                </tr>
                <tr>
                  <td><em>"Let's push the launch back / hold off until Tuesday"</em></td>
                  <td><strong>Postpone / Reschedule an upcoming event</strong></td>
                </tr>
                <tr>
                  <td><em>"The estimate is way over our allocated funds"</em></td>
                  <td><strong>A project exceeds the budget / Too expensive</strong></td>
                </tr>
                <tr>
                  <td><em>"Every other Monday / Twice a month"</em></td>
                  <td><strong>On a biweekly basis</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="strat-grid-2">
          <div class="strat-trap-card is-tactic">
            <strong>${S_ICO.chart}Bí Quyết Bắt Gọn 100% Câu Hỏi Biểu Đồ / Hóa Đơn (Graphic Questions)</strong>
            <p>
              Nếu 4 đáp án A, B, C, D là tên 4 phòng họp (<em> Maple, Oak, Pine, Cedar</em>), <strong>băng sẽ KHÔNG BAO GIỜ đọc tên phòng đúng</strong>! Loa sẽ đọc cột bên cạnh (vd: <em>"chúng ta có 45 khách tham dự"</em>) &rarr; Mắt bạn phải khóa sẵn vào cột <strong>Sức chứa (Capacity: 50)</strong> để dóng ngang sang tên phòng tương ứng!
            </p>
          </div>
          <div class="strat-trap-card is-tactic">
            <strong>${S_ICO.chat}Giải Mã Câu Hỏi Ngụ Ý ("What does the speaker mean when...?")</strong>
            <p>
              Tuyệt đối không chọn đáp án dịch nghĩa đen! Ví dụ: <em>"Have you seen the line at the café?"</em> sau lời rủ đi mua cà phê &rarr; Ngụ ý thật sự là <strong>từ chối khéo vì quá đông sẽ trễ giờ họp</strong>. Luôn nghe câu đứng ngay trước câu trích dẫn!
            </p>
          </div>
        </div>

        ${renderChecklistHtml("part4", "Checklist Đọc Đón Đầu & Chữa Sâu Part 3 & 4")}
      </div>
    `,

    part7: () => `
      <div class="strat-studio" data-strat-v2="1">
        <div class="strat-hero">
          <h3>${S_ICO.book}Chiến Thuật Kiểm Soát 75 Phút Reading (Part 5&ndash;6&ndash;7) &amp; Phá Đảo Đa Đoạn</h3>
          <p>
            Thất bại lớn nhất ở phần Reading không phải không biết từ vựng, mà là <strong>vỡ trận thời gian ở phút 50</strong>. Để chạm mốc 450+/495 Reading, bạn bắt buộc tuân thủ kỷ luật đồng hồ thép và kỹ thuật kết nối chứng cứ xuyên văn bản (Cross-passage Triangulation).
          </p>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.clock}1. Bảng Phân Bổ 75 Phút Reading Chuẩn Phòng Thi CBT / IIG</h4>
          <div class="strat-table-wrap">
            <table class="strat-table">
              <thead>
                <tr>
                  <th>Phần Thi &amp; Phạm Vi Câu</th>
                  <th>Quỹ Thời Gian</th>
                  <th>Mốc Đồng Hồ Đếm Ngược</th>
                  <th>Chiến Thuật Tốc Độ Thực Chiến</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Part 5 · Điền câu ngắn</strong><br/>(Q101 &ndash; Q130 · 30 câu)</td>
                  <td><strong>10 phút</strong><br/>(~20s/câu)</td>
                  <td><span class="strat-pill strat-pill-accent">75:00 &rarr; 65:00</span></td>
                  <td>Nhìn 4 đáp án trước! Nếu cùng gốc từ (Từ loại) &rarr; nhìn từ liền trước &amp; liền sau chỗ trống, chốt trong <strong>5&ndash;8 giây</strong> không dịch cả câu. Quá 30s chưa ra &rarr; khoanh tạm rồi đi tiếp!</td>
                </tr>
                <tr>
                  <td><strong>Part 6 · Điền đoạn văn</strong><br/>(Q131 &ndash; Q146 · 16 câu)</td>
                  <td><strong>8 phút</strong><br/>(2 phút/bài)</td>
                  <td><span class="strat-pill strat-pill-info">65:00 &rarr; 57:00</span></td>
                  <td>Đọc theo mạch từ đầu đoạn; câu điền cả câu văn phải khớp <strong>đại từ thay thế</strong> (<em>They, This, Such</em>) và quan hệ nhân quả/tương phản với câu sát trước &amp; sát sau.</td>
                </tr>
                <tr>
                  <td><strong>Part 7 · Đoạn Đơn</strong><br/>(Q147 &ndash; Q175 · 29 câu)</td>
                  <td><strong>24 phút</strong><br/>(~50s/câu)</td>
                  <td><span class="strat-pill strat-pill-ok">57:00 &rarr; 33:00</span></td>
                  <td>Bài tin nhắn (Chat chain), thông báo ngắn, hóa đơn giải cực nhanh để tích lũy thời gian cho bài báo (Article) dài ở Q168&ndash;175.</td>
                </tr>
                <tr>
                  <td><strong>Part 7 · Đoạn Kép</strong><br/>(Q176 &ndash; Q185 · 10 câu)</td>
                  <td><strong>10 phút</strong><br/>(5 phút/bộ)</td>
                  <td><span class="strat-pill strat-pill-warn">33:00 &rarr; 23:00</span></td>
                  <td>Đọc tiêu đề 2 văn bản để hiểu mối quan hệ (vd: Quảng cáo tuyển dụng + Email ứng tuyển). Giải câu thuộc Doc 1 trước, câu giao thoa đọc đối chiếu ngay.</td>
                </tr>
                <tr>
                  <td><strong>Part 7 · Đoạn Ba</strong><br/>(Q186 &ndash; Q200 · 15 câu)</td>
                  <td><strong>18 phút</strong><br/>(6 phút/bộ)</td>
                  <td><span class="strat-pill strat-pill-bad">23:00 &rarr; 05:00</span></td>
                  <td>Độ khó từ vựng Đoạn ba thường <em>dễ hơn</em> bài báo Đoạn đơn! Chỉ cần tìm <strong>Điểm neo chung (Anchor Key)</strong> bắc cầu từ Email sang Bảng biểu rồi sang Biên lai.</td>
                </tr>
                <tr>
                  <td><strong>Rà soát &amp; Kiểm phiếu</strong><br/>(Toàn bộ Q101 &ndash; Q200)</td>
                  <td><strong>5 phút cuối</strong></td>
                  <td><span class="strat-pill strat-pill-ok">05:00 &rarr; 00:00</span></td>
                  <td>Quay lại 3&ndash;4 câu gắn cờ <em>Phân vân (Doubt)</em> và kiểm tra 100% câu hỏi đã được chọn đáp án.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="strat-sec-title">${S_ICO.search}2. Giải Mã 6 Bẫy Đánh Lừa Tinh Vi Nhất Trong ETS Part 7</h4>
          <div class="strat-grid-2">
            <div class="strat-trap-card">
              <strong>1. Bẫy Lượng Từ Tuyệt Đối (Over-generalization Trap)</strong>
              <p>
                Bài đọc nêu: <em>"<u>Most</u> workshop participants received a certificate."</em><br/>
                Đáp án bẫy: <em>"<u>Every</u> attendee was given a certificate."</em><br/>
                ${S_ICO.arrow}Cảnh giác cao độ với đáp án chứa: <span class="strat-code">all, every, always, only, never, completely, exclusively</span>!
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>2. Bẫy Ghép Râu Ông Nọ Cắm Cằm Bà Kia (Wrong Attribution)</strong>
              <p>
                Ở Đoạn kép/Đoạn ba: Văn bản 1 nêu gói <em>Deluxe ($120)</em> được miễn phí giao hàng, Văn bản 2 khách đặt mã hàng trị giá <em>$85 (Gói Standard)</em> &rarr; Đáp án nói khách được miễn phí giao hàng là <strong>BẪY SAI</strong>!
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>3. Bẫy Chú Thích Hoa Thị Chữ Nhỏ (* Small-Print Disclosure)</strong>
              <p>
                Đề ETS cực kỳ ưa chuộng giấu điều kiện ngoại lệ ở dòng chữ nhỏ cuối bảng giá hoặc phiếu giảm giá (vd: <em>"*Offer not valid on weekends or bulk orders"</em>). Luôn liếc dòng cuối cùng của bảng!
              </p>
            </div>

            <div class="strat-trap-card">
              <strong>4. Bẫy Từ Đa Nghĩa Trong Ngữ Cảnh Thương Mại (Polysemy)</strong>
              <p>
                • <span class="strat-code">address</span> = giải quyết vấn đề (<em>deal with</em>), không phải địa chỉ nhà.<br/>
                • <span class="strat-code">opening</span> = vị trí tuyển dụng trống (<em>vacancy</em>), không phải lễ khai trương.<br/>
                • <span class="strat-code">cover</span> = chi trả chi phí / thay ca / đưa tin báo chí.
              </p>
            </div>

            <div class="strat-trap-card is-tactic">
              <strong>5. Công Thức Chốt Hạ Câu Chèn Vị Trí [1] [2] [3] [4]</strong>
              <p>
                Đọc kỹ câu đề cho sẵn, tìm <strong>từ khóa móc xích</strong>: <span class="strat-code">This requirement</span> (câu trước phải nêu 1 yêu cầu), <span class="strat-code">However</span> (câu trước mang sắc thái ngược lại), <span class="strat-code">For example</span> (câu trước nêu nhận định khái quát).
              </p>
            </div>

            <div class="strat-trap-card is-tactic">
              <strong>6. Thứ Tự Ưu Tiên Xử Lý Câu Hỏi NOT / TRUE</strong>
              <p>
                Đừng làm câu <em>"What is NOT indicated about..."</em> đầu tiên! Hãy giải 3&ndash;4 câu chi tiết cụ thể trong bài trước; quá trình tìm câu chi tiết đã giúp bạn loại được 2&ndash;3 phương án của câu NOT mà không tốn thêm thời gian đọc lại từ đầu!
              </p>
            </div>
          </div>
        </div>

        ${renderChecklistHtml("part7", "Checklist Kỷ Luật 75 Phút Reading & Săn Chứng Cứ Part 7")}
      </div>
    `
  };

  function wireChecklistInteractions(container) {
    if (!container) return;
    container.querySelectorAll('input[type="checkbox"][data-check-id]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.checkId;
        const stateMap = loadCheckState();
        stateMap[id] = cb.checked;
        saveCheckState(stateMap);

        const row = cb.closest(".strat-check-item");
        if (row) row.classList.toggle("is-done", cb.checked);

        const box = cb.closest("[data-checklist-tab]");
        if (box) {
          const tabId = box.dataset.checklistTab;
          const items = CHECKLIST_ITEMS[tabId] || [];
          const done = items.filter((it) => Boolean(stateMap[it.id])).length;
          const badge = box.querySelector(`[data-check-counter="${tabId}"]`);
          if (badge) {
            badge.textContent = `Hoàn thành: ${done}/${items.length}`;
            badge.className = `strat-pill ${done === items.length ? "strat-pill-ok" : "strat-pill-accent"}`;
          }
        }
      });
    });

    container.querySelectorAll(".strat-reset-check-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.resetTab;
        const items = CHECKLIST_ITEMS[tabId] || [];
        const stateMap = loadCheckState();
        items.forEach((it) => {
          delete stateMap[it.id];
        });
        saveCheckState(stateMap);
        window.renderToeicStrategyTab(tabId);
      });
    });
  }

  let isUpdatingStrategyDom = false;

  const strategyTabsAccessor = {};
  Object.keys(SECTION_BUILDERS).forEach((key) => {
    Object.defineProperty(strategyTabsAccessor, key, {
      enumerable: true,
      get() {
        injectStrategyStyles();
        return SECTION_BUILDERS[key]();
      }
    });
  });

  window.TOEIC_STRATEGY_TABS = strategyTabsAccessor;
  window.TOEIC_STRATEGY_SECTIONS = strategyTabsAccessor;

  window.renderToeicStrategyTab = function renderToeicStrategyTab(tabId = "roadmap", customMount = null) {
    injectStrategyStyles();
    const dlg = typeof document !== "undefined" ? document.getElementById("strategy-dialog") : null;
    const mount = customMount || (typeof document !== "undefined" ? document.getElementById("strategy-dialog-mount") : null);
    if (!mount) return false;

    const validTab = SECTION_BUILDERS[tabId] ? tabId : "roadmap";
    const builder = SECTION_BUILDERS[validTab];

    isUpdatingStrategyDom = true;
    try {
      if (dlg) {
        if (!dlg._safeShowModalPatched && typeof dlg.showModal === "function") {
          const nativeShowModal = dlg.showModal.bind(dlg);
          dlg.showModal = () => {
            if (!dlg.open) nativeShowModal();
          };
          dlg._safeShowModalPatched = true;
        }
        dlg.querySelectorAll("#strategy-nav-group .seg-btn").forEach((b) => {
          b.classList.toggle("is-active", b.dataset.stratTab === validTab);
          b.onclick = (ev) => {
            ev.preventDefault();
            window.renderToeicStrategyTab(b.dataset.stratTab);
          };
        });
      }

      mount.innerHTML = builder();
      const studioEl = mount.querySelector('[data-strat-v2="1"]');
      if (studioEl) studioEl.setAttribute("data-strat-wired", "1");
      mount.scrollTop = 0;
      wireChecklistInteractions(mount);
      return true;
    } finally {
      isUpdatingStrategyDom = false;
    }
  };

  function installStrategyDialogBridge() {
    if (typeof document === "undefined") return;
    injectStrategyStyles();

    const attach = () => {
      const mount = document.getElementById("strategy-dialog-mount");
      const dlg = document.getElementById("strategy-dialog");
      if (!mount || !dlg) return;

      if (!dlg._safeShowModalPatched && typeof dlg.showModal === "function") {
        const nativeShowModal = dlg.showModal.bind(dlg);
        dlg.showModal = () => {
          if (!dlg.open) nativeShowModal();
        };
        dlg._safeShowModalPatched = true;
      }

      const observer = new MutationObserver(() => {
        if (isUpdatingStrategyDom) return;
        const v2Root = mount.querySelector('[data-strat-v2="1"]');
        if (v2Root) {
          if (!v2Root.hasAttribute("data-strat-wired")) {
            v2Root.setAttribute("data-strat-wired", "1");
            wireChecklistInteractions(mount);
          }
          return;
        }
        if (mount.children.length > 0) {
          const activeBtn = dlg.querySelector("#strategy-nav-group .seg-btn.is-active");
          const tabId = activeBtn?.dataset?.stratTab || "roadmap";
          window.renderToeicStrategyTab(tabId, mount);
        }
      });

      observer.observe(mount, { childList: true });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attach, { once: true });
    } else {
      attach();
    }
  }

  installStrategyDialogBridge();
})();
