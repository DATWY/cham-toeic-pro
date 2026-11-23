/**
 * TOEIC Study Materials Bank — Hackers TOEIC Series, ETS Official Guide,
 * Part 5–6 Interactive Grammar Handbook, Paraphrase Bible & CEFR A1–C2 Pathways
 */

window.TOEIC_MATERIALS_DATA = {
  books: [
    {
      id: "hackers_start",
      series: "HACKERS TOEIC",
      title: "Hackers TOEIC Start (Reading & Listening)",
      subtitle: "Nền tảng xóa mất gốc · Lộ trình 4 tuần đạt 450–550+",
      cefr: "A1–A2",
      cefrGroup: "A12",
      toeicTarget: "120 – 545 điểm",
      totalLessons: 4,
      estHours: "24 giờ",
      description:
        "Giáo trình nhập môn kinh điển của Hackers dành cho người mới bắt đầu hoặc mất gốc: nắm chắc cấu trúc câu đơn S-V-O, phân biệt phát âm Anh-Mỹ, xử lý trọn vẹn Part 1 và câu hỏi Wh- cơ bản trong Part 2.",
      recommendedTests: [
        { type: "cham", slug: "test-au-vao-01", label: "TEST ĐẦU VÀO 01 (A2 · 100 câu)" },
        { type: "studio", id: "ets2019_p1_t6", label: "Studio Part 1 · ETS T6 (A1–A2)" },
        { type: "studio", id: "ets2019_p1_t7", label: "Studio Part 1 · ETS T7 (A2)" }
      ],
      chapters: [
        {
          title: "Chương 1: Cấu trúc câu đơn 5 thành phần & Từ loại cơ bản (Part 5)",
          cefr: "A1–A2",
          summary: "Nhận diện vị trí Danh từ (N), Động từ (V), Tính từ (Adj), Trạng từ (Adv) để giải nhanh 12–14 câu Part 5 mỗi đề.",
          keyPoints: [
            "Mạo từ (a/an/the) hoặc Tính từ sở hữu (my/your/their/its) + (Adj) + Danh từ chính.",
            "Trạng từ (-ly) bổ nghĩa cho Động từ thường, Tính từ hoặc đứng đầu câu bổ nghĩa cho cả mệnh đề.",
            "Động từ nối (be, become, remain, seem, look) theo sau là Tính từ, không dùng Trạng từ."
          ],
          trapAlert: "Bẫy đuôi danh từ ghép (N + N): budget proposal, safety regulation, customer satisfaction — nhìn thấy danh từ phía sau đừng vội điền tính từ nếu đó là cụm danh từ cố định!"
        },
        {
          title: "Chương 2: Kỹ thuật nhìn tranh 3 giây & Bẫy thì tiếp diễn Part 1",
          cefr: "A1–A2",
          summary: "Quét nhanh 3 yếu tố trong tranh: Chủ thể (Người/Vật) → Hành động tay/mắt → Bối cảnh xung quanh trước khi băng đọc (A).",
          keyPoints: [
            "Tranh có người: chú ý thì Hiện tại tiếp diễn (is/are + V-ing) mô tả hành động đang diễn ra.",
            "Phân biệt động từ mặc trang phục: 'is wearing' (trạng thái đang mặc trên người) vs 'is putting on' (hành động đang xỏ vào).",
            "Tranh chỉ có vật/phong cảnh: loại ngay phương án chứa 'being + V3/ed' (không có người thì không ai đang tác động!)."
          ],
          trapAlert: "Nghe danh từ đúng nhưng động từ sai: nhìn thấy 'laptop' trên bàn nhưng băng nói 'A woman is typing on a laptop' trong khi cô ấy đang cầm cốc cà phê!"
        },
        {
          title: "Chương 3: Phản xạ 0.5 giây đầu câu hỏi Wh- & Câu hỏi Yes/No (Part 2)",
          cefr: "A2",
          summary: "Bắt dính từ để hỏi đầu tiên (Who, When, Where, Why, What, How) trong 0.5 giây mở đầu để loại ngay đáp án sai phạm trù.",
          keyPoints: [
            "Who → tên người / chức vụ / phòng ban; Where → giới từ chỉ nơi chốn (in/on/at/next to).",
            "When → mốc thời gian / mệnh đề thời gian (until/after/soon); How long → khoảng thời gian (for 2 weeks).",
            "Câu hỏi Wh- KHÔNG BAO GIỜ trả lời bằng Yes hoặc No."
          ],
          trapAlert: "Bẫy lặp âm (Same-sound distractor): Câu hỏi có 'copy' → phương án sai chứa 'coffee' hoặc lặp nguyên chữ 'copy' nhưng sai nghĩa."
        },
        {
          title: "Chương 4: Làm quen 100 câu Listening tốc độ chuẩn (ETS 2022 Foundation)",
          cefr: "A2",
          summary: "Luyện tập nghe liền mạch không bị ngợp, kết hợp đọc lướt câu hỏi và chép chính tả từ khóa trọng tâm.",
          keyPoints: [
            "Đọc câu hỏi Part 3–4 bằng cụm từ (Chunking): Who + Where + What next.",
            "Tận dụng chức năng Dictation trong Luyện Sâu Studio để phát hiện những âm bị nuốt (/t/, /d/, nối âm)."
          ],
          trapAlert: "Không dừng lại suy nghĩ quá 3 giây về câu đã trôi qua — bỏ qua ngay để bảo toàn 3 câu kế tiếp!"
        }
      ]
    },
    {
      id: "hackers_reading",
      series: "HACKERS TOEIC",
      title: "Hackers TOEIC Reading (Ngữ pháp & Đọc hiểu Chuyên sâu)",
      subtitle: "Hệ thống hóa toàn bộ bẫy Part 5–6 & 8 dạng văn bản Part 7",
      cefr: "B1–B2",
      cefrGroup: "B12",
      toeicTarget: "550 – 900 điểm",
      totalLessons: 4,
      estHours: "36 giờ",
      description:
        "Cuốn sách gối đầu giường của mọi thí sinh mục tiêu 750–900+: tổng hợp 100% quy tắc ngữ pháp xuất hiện trong Part 5–6, chiến lược điền câu mạch văn Part 6 và phương pháp đọc ngược săn chứng cứ Part 7.",
      recommendedTests: [
        { type: "studio", id: "part5_t1", label: "Studio Part 5 · 6 Chuyên đề (B1–B2)" },
        { type: "studio", id: "part6_t1", label: "Studio Part 6 · Điền đoạn văn (B2)" },
        { type: "cham", slug: "ets-2024-test-6", label: "ETS 2024 TEST 6 (B2 · 200 câu)" }
      ],
      chapters: [
        {
          title: "Chương 1: Ma trận Động từ — Thì, Thể Bị động & Giả định cách (Part 5)",
          cefr: "B1–B2",
          summary: "Xử lý chính xác 100% câu chia động từ dựa trên 3 bước: (1) Xét có V chính chưa, (2) Xét Tân ngữ (Chủ/Bị động), (3) Mốc thời gian.",
          keyPoints: [
            "By the time + S + V(hiện tại đơn chỉ tương lai) → Mệnh đề chính chia Tương lai hoàn thành (will have V3).",
            "Since + mốc quá khứ / Over the past few years → Hiện tại hoàn thành (have/has V3).",
            "Giả định cách: recommend / suggest / insist / ask / vital / imperative + that + S + V(nguyên mẫu)."
          ],
          trapAlert: "Nội động từ (arrive, depart, occur, happen, consist of, expire) KHÔNG BAO GIỜ chia thể bị động (be + V3)!"
        },
        {
          title: "Chương 2: Phân biệt Liên từ vs Giới từ vs Trạng từ liên kết trong 3 giây",
          cefr: "B1–B2",
          summary: "Nhìn phía sau chỗ trống có Động từ chia thì (Clause) hay chỉ có Cụm danh từ / V-ing (Phrase) để loại ngay 2/4 đáp án.",
          keyPoints: [
            "Liên từ (+ S + V): although/even though, because/since, while, whereas, unless, provided that.",
            "Giới từ (+ Noun / V-ing): despite / in spite of, because of / due to / owing to, during, prior to, regarding.",
            "Trạng từ liên kết (đứng sau dấu chấm/chấm phẩy + dấu phẩy): however, therefore, moreover, nevertheless."
          ],
          trapAlert: "'While' và 'Although' cần mệnh đề S+V, nhưng trong văn phong rút gọn chủ ngữ giống nhau vẫn gặp 'While + V-ing / Adj'!"
        },
        {
          title: "Chương 3: Chiến thuật Part 6 — Mạch văn & Câu điền vị trí [1]–[4]",
          cefr: "B2",
          summary: "Khống chế Part 6 trong 8 phút (tối đa 30s/câu) nhờ kỹ thuật khóa Đại từ quy chiếu và Liên từ chuyển ý.",
          keyPoints: [
            "Câu điền mệnh đề hoàn chỉnh: đọc 1 câu TRƯỚC và 1 câu SAU chỗ trống; chú ý các từ móc xích 'This + N', 'Such + N', 'However', 'In addition'.",
            "Kiểm tra thì động từ đồng bộ với toàn bộ thông báo/email (quá khứ tường thuật vs tương lai thông báo)."
          ],
          trapAlert: "Thí sinh hay sa vào dịch từng chữ cả đoạn khiến tốn 14 phút cho Part 6 và thiếu giờ cho Part 7."
        },
        {
          title: "Chương 4: Chiến thuật Đảo ngược Part 7 & Tam giác hóa Đa đoạn (Q176–200)",
          cefr: "B2–C1",
          summary: "Phân bổ 54 phút hợp lý cho 54 câu Part 7; luôn để câu NOT/TRUE làm sau cùng trong mỗi bài đọc.",
          keyPoints: [
            "Đọc tiêu đề văn bản (From/To/Subject/Title) → Đọc câu hỏi → Quét từ khóa riêng (Tên, Số tiền, Ngày) để khoanh vùng 2–3 dòng chứng cứ.",
            "Đoạn Kép & Đoạn Ba: tìm cầu nối chung (Mã đơn hàng, Tên gói dịch vụ, Ngày giao hàng) giữa Văn bản 1, 2 và 3."
          ],
          trapAlert: "Chú thích hoa thị (*) chữ nhỏ ở cuối hóa đơn / bảng giá là nơi ETS giấu điều kiện ngoại lệ nhiều nhất!"
        }
      ]
    },
    {
      id: "hackers_listening",
      series: "HACKERS TOEIC",
      title: "Hackers TOEIC Listening (Giải mã Âm vị & Bẫy Đa giọng)",
      subtitle: "Làm chủ biến âm US/UK/AU/CA & Chu kỳ 8 giây Part 3–4",
      cefr: "B1–C1",
      cefrGroup: "B12",
      toeicTarget: "600 – 950 điểm",
      totalLessons: 4,
      estHours: "30 giờ",
      description:
        "Phương pháp luyện nghe chủ động của Hackers: xóa mù biến âm (Flap-T, Elision, British R-dropping), nắm quy luật câu trả lời gián tiếp Part 2 và kỹ thuật đọc đón đầu 3 câu hỏi trước khi băng chạy.",
      recommendedTests: [
        { type: "studio", id: "ets2019_p2_t7", label: "Studio Part 2 · ETS T7 (B1 · 25 câu)" },
        { type: "studio", id: "ets2019_t6", label: "Studio Part 4 · ETS T6 (B2 · 30 câu)" },
        { type: "cham", slug: "ets-2026-test-1", label: "ETS 2026 TEST 1 (C1 · 200 câu)" }
      ],
      chapters: [
        {
          title: "Chương 1: Biến âm 4 giọng ETS (Mỹ, Anh, Úc, Canada)",
          cefr: "B1–B2",
          summary: "Nhận diện các quy luật phát âm khiến thí sinh biết mặt chữ nhưng nghe không ra trong phòng thi.",
          keyPoints: [
            "Flap-T (Giọng Mỹ/Canada): water, better, meeting, letter âm /t/ giữa 2 nguyên âm đọc nhẹ thành /d/.",
            "Nuốt âm & Nối âm: 'pick it up' → /pɪ-kɪ-tʌp/, 'next Tuesday' → /neks-tjuːzdeɪ/.",
            "Giọng Anh/Úc: bỏ âm /r/ cuối (car, order, schedule đọc /ˈʃedjuːl/ thay vì /ˈskedʒuːl/)."
          ],
          trapAlert: "Nghe tốc độ 1.15x trên Luyện Sâu Studio với các bài đã hiểu nghĩa để ép não xử lý âm vị nhanh hơn 15%."
        },
        {
          title: "Chương 2: 5 Khuôn mẫu Câu trả lời Gián tiếp Part 2 (Indirect Responses)",
          cefr: "B1–B2",
          summary: "Khoảng 35% câu Part 2 hiện đại không trả lời thẳng mà chuyển trách nhiệm, nêu điều kiện hoặc từ chối khéo.",
          keyPoints: [
            "Mẫu 1 — Chuyển người/nguồn kiểm tra: 'Ask Ms. Lin', 'Check the schedule', 'It's on the website'.",
            "Mẫu 2 — Chưa biết / Chưa nhận thông tin: 'I haven't checked my e-mail yet', 'They haven't decided'.",
            "Mẫu 3 — Hỏi ngược điều kiện: 'Should I reserve a room?' → 'Isn't the conference canceled?'."
          ],
          trapAlert: "Khi cả (A) và (B) đều có từ đồng âm hoặc lệch chủ ngữ/thì, tự tin chọn (C) ngay bằng kỹ thuật gạch loại trừ!"
        },
        {
          title: "Chương 3: Chu kỳ 8 giây Đọc Đón Đầu Part 3 & 4 (Zero-Lag Preview)",
          cefr: "B2–C1",
          summary: "Thí sinh 900+ luôn đọc xong 3 câu hỏi của nhóm tiếp theo trước khi đoạn băng đó bắt đầu phát.",
          keyPoints: [
            "Lướt nhanh câu hỏi (không đọc hết 12 đáp án dài) để khóa: (1) Chủ đề/Người nói, (2) Vấn đề/Chi tiết, (3) Hành động tiếp theo.",
            "Câu hỏi trích dẫn ý đồ ('Why does the speaker say...'): nghe kỹ 1 câu TRƯỚC và 1 câu SAU câu trích dẫn để bắt hàm ý thực."
          ],
          trapAlert: "Bẫy đổi ý (Self-correction): Người nói nêu phương án A rồi nói 'Actually / Wait / Unfortunately...' để chuyển sang B!"
        },
        {
          title: "Chương 4: Chiến thuật Tích hợp Bảng biểu / Bản đồ (Graphic Q62–70 & Q95–100)",
          cefr: "B2–C1",
          summary: "Khóa mắt vào cột thông tin KHÔNG được in trong đáp án để biến câu khó thành câu cho điểm.",
          keyPoints: [
            "Nếu 4 đáp án A/B/C/D in 'Giá tiền' hoặc 'Tên phòng', băng nghe sẽ đọc 'Tên dịch vụ / Giờ / Tầng' tương ứng — nhìn thẳng vào cột còn lại trên bảng!",
            "Chú ý từ chỉ thay đổi vị trí bản đồ: across from, adjacent to, newly relocated, corner."
          ],
          trapAlert: "Loa thường nhắc 2–3 hạng mục nhiễu trên bảng trước khi chốt hạng mục đúng kèm điều kiện ngoại lệ."
        }
      ]
    },
    {
      id: "hackers_1000",
      series: "HACKERS TOEIC",
      title: "Hackers TOEIC 1000 RC & LC (Chiến Thuật Cán Mốc 900–990)",
      subtitle: "Bộ luyện đề nâng cao bẫy sâu hơn đề ETS chuẩn · Mục tiêu C1–C2",
      cefr: "C1–C2",
      cefrGroup: "C12",
      toeicTarget: "850 – 990 điểm",
      totalLessons: 3,
      estHours: "40 giờ",
      description:
        "Bộ đề luyện thực chiến nổi tiếng của Hackers với mật độ paraphrase cao, từ vựng học thuật C1–C2 và tốc độ âm thanh dồn dập — giúp bạn vào phòng thi ETS thật cảm thấy nhẹ nhàng và chủ động.",
      recommendedTests: [
        { type: "studio", id: "hackers3_t4", label: "Studio Hackers 3 · Test 4 (C2 · 30 câu)" },
        { type: "studio", id: "part7_t1", label: "Studio Part 7 · 15 Bài đọc (C1 · 54 câu)" },
        { type: "cham", slug: "ets-2026-test-5", label: "ETS 2026 TEST 5 (C1 · 200 câu)" },
        { type: "cham", slug: "ets-2026-test-9", label: "ETS 2026 TEST 9 (C2 · 200 câu)" }
      ],
      chapters: [
        {
          title: "Chương 1: Xử lý Part 5 tốc độ 15 giây/câu & Bẫy từ đa nghĩa C1",
          cefr: "C1",
          summary: "Làm chủ các từ vựng đa nghĩa trong ngữ cảnh thương mại mà học viên khá vẫn hay nhầm: address, cover, engage, observe, reflect.",
          keyPoints: [
            "address (v) = giải quyết vấn đề / phát biểu trước hội nghị; opening (n) = vị trí tuyển dụng trống.",
            "outstanding (adj) = xuất sắc / (khoản nợ/hóa đơn) chưa thanh toán; subject to = phải chịu / phụ thuộc vào.",
            "Cắt gọn thời gian Part 5 xuống <= 9 phút để dồn trọn năng lượng cho Part 7 đoạn kép & đoạn ba."
          ],
          trapAlert: "Đừng chọn nghĩa tiếng Việt phổ biến nhất của từ — luôn kiểm tra giới từ và tân ngữ đi ngay phía sau chỗ trống!"
        },
        {
          title: "Chương 2: Giải mã Paraphrase Đa tầng trong Hackers Listening & Part 7",
          cefr: "C1–C2",
          summary: "Hackers 1000 hiếm khi lặp lại từ khóa nguyên văn; đáp án đúng luôn được diễn đạt lại bằng khái niệm bao quát hơn (Hypernym).",
          keyPoints: [
            "Ví dụ Hackers: 'red and yellow stripes on the pavement' → 'colored lines'; 'parking lot 4D' + 'hospital east exit' → 'a hospital employee'.",
            "Ví dụ Part 7: 'no interruption to regular operating schedule' giữa Chủ Nhật và Thứ Ba → 'closed on Mondays'."
          ],
          trapAlert: "Phương án chứa y nguyên cụm từ nghe được trong băng hoặc đọc được trong bài tới 75% là bẫy ghép sai ngữ cảnh!"
        },
        {
          title: "Chương 3: Chiến thuật Cán đích 20 Câu Cuối (Q181–200) Không Mất Điểm",
          cefr: "C2",
          summary: "Kỷ luật phân bổ 75 phút Reading và kỹ thuật đối chiếu chéo 3 văn bản dưới áp lực mệt mỏi cuối giờ.",
          keyPoints: [
            "Đồng hồ Reading còn 57:00 phải xong Part 5–6; còn 33:00 phải xong Đoạn đơn (Q147–175).",
            "Gắn cờ (Mark for Review) câu suy luận khó quá 90 giây và kiểm tra lại tại Màn hình Rà soát (Review Screen)."
          ],
          trapAlert: "Bẫy ghép râu ông nọ cắm cằm bà kia (Wrong Attribution): lấy điều kiện của Gói A gán cho khách hàng mua Gói B ở văn bản thứ hai."
        }
      ]
    },
    {
      id: "vocab_30days",
      series: "HACKERS VOCABULARY",
      title: "Hackers TOEIC Vocabulary — 30 Ngày Từ Vựng Trọng Tâm",
      subtitle: "Phân loại từ vựng theo 8 lĩnh vực kinh doanh · Tích hợp Flashcard SM-2",
      cefr: "A2–C1",
      cefrGroup: "B12",
      toeicTarget: "450 – 950 điểm",
      totalLessons: 3,
      estHours: "20 giờ",
      description:
        "Hệ thống từ vựng Hackers chuẩn hóa theo chủ đề ra thi thực tế (Nhân sự, Hợp đồng, Tài chính, Marketing, Logistics, Sản xuất), học theo cụm từ (Lexical Chunks) thay vì từ đơn lẻ.",
      recommendedTests: [
        { type: "cham", slug: "ets-2023-test-8", label: "ETS 2023 TEST 8 (16 câu Từ vựng P5)" },
        { type: "cham", slug: "ets2024-test-10", label: "ETS 2024 TEST 10 (C2 · Từ vựng cao)" }
      ],
      chapters: [
        {
          title: "Phần 1: Cụm từ Hợp đồng, Pháp lý & Đàm phán (Contracts & Compliance)",
          cefr: "B1–C1",
          summary: "Nhóm từ vựng xuất hiện dày đặc trong Part 5, Part 6 và thư thương mại Part 7.",
          keyPoints: [
            "abide by = comply with = adhere to (tuân thủ quy định/hợp đồng).",
            "terminate / renew / amend an agreement (chấm dứt / gia hạn / sửa đổi hợp đồng).",
            "binding contract (hợp đồng ràng buộc pháp lý), stipulation / clause (điều khoản)."
          ],
          trapAlert: "Nhầm lẫn giữa 'complementary' (bổ sung cho nhau) và 'complimentary' (miễn phí / khen ngợi) — bẫy kinh điển của Hackers & ETS!"
        },
        {
          title: "Phần 2: Tài chính, Ngân sách & Hóa đơn (Finance & Procurement)",
          cefr: "B1–B2",
          summary: "Từ vựng phục vụ các bài đọc bảng giá, hóa đơn, báo cáo quý và hoàn chi phí công tác.",
          keyPoints: [
            "reimburse expenses (hoàn trả chi phí), outstanding balance (số dư còn nợ/chưa thanh toán).",
            "allocate funds (phân bổ ngân sách), fiscal year (năm tài chính), waive a fee (miễn phí).",
            "expedite shipping (đẩy nhanh giao hàng), itemized receipt (hóa đơn liệt kê chi tiết)."
          ],
          trapAlert: "'Waive' (miễn trừ) vs 'Wave' (vẫy/làn sóng) và 'Principal' (vốn gốc/hiệu trưởng) vs 'Principle' (nguyên tắc)."
        },
        {
          title: "Phần 3: Nhân sự, Hội thảo & Vận hành Doanh nghiệp (HR & Operations)",
          cefr: "A2–B2",
          summary: "Từ vựng nền tảng cho Part 1–4 và email nội bộ doanh nghiệp.",
          keyPoints: [
            "prospective candidate / applicant (ứng viên tiềm năng), mandatory orientation (buổi định hướng bắt buộc).",
            "delegate tasks (phân công nhiệm vụ), oversee operations (giám sát vận hành), vacancy / opening (vị trí trống).",
            "outage / malfunction (sự cố mất điện/hỏng hóc), undergo maintenance (trải qua bảo trì)."
          ],
          trapAlert: "'Personnel' (nhân sự — luôn đi với số nhiều hoặc danh từ tập hợp) vs 'Personal' (cá nhân)."
        }
      ]
    },
    {
      id: "ets_official_guide",
      series: "ETS OFFICIAL & CEFR",
      title: "ETS Official Guide & Khung Tham Chiếu Trình Độ CEFR (A1–C2)",
      subtitle: "Quy chuẩn phòng thi IIG 200 câu & Bảng quy đổi điểm TOEIC ↔ CEFR",
      cefr: "A1–C2",
      cefrGroup: "A12",
      toeicTarget: "10 – 990 điểm",
      totalLessons: 3,
      estHours: "12 giờ",
      description:
        "Tài liệu quy chuẩn chính thức về cấu trúc đề thi TOEIC Listening & Reading (100 câu Nghe 45 phút + 100 câu Đọc 75 phút), quy trình thi máy CBT tại IIG và ý nghĩa từng bậc CEFR A1, A2, B1, B2, C1, C2.",
      recommendedTests: [
        { type: "cham", slug: "test-au-vao-01", label: "TEST ĐẦU VÀO 01 (Định vị A1–C1)" },
        { type: "cham", slug: "ets-2026-test-2", label: "ETS 2026 TEST 2 (Full CBT Chuẩn)" }
      ],
      chapters: [
        {
          title: "Cấu trúc chuẩn 7 Part & Thời gian Phòng thi CBT IIG",
          cefr: "A1–C2",
          summary: "Nắm rõ ranh giới thời gian giữa Phần I: Listening (45 phút) và Phần II: Reading (75 phút).",
          keyPoints: [
            "Listening (100 câu · ~45 phút): Part 1 (6), Part 2 (25), Part 3 (39), Part 4 (30). Audio tự chạy liên tục, nghỉ 5s sau mỗi nhóm câu.",
            "Reading (100 câu · 75 phút): Part 5 (30), Part 6 (16), Part 7 (54: 29 đơn + 25 kép/ba). Thí sinh tự do di chuyển và rà soát (Review Screen)."
          ],
          trapAlert: "Trong phòng thi CBT thật, bạn KHÔNG thể tua lại audio ở Phần Listening; hãy bật chế độ 'Chuẩn IIG Nghiêm Ngặt' khi thi thử để rèn tâm lý thật!"
        },
        {
          title: "Bảng đối chiếu Điểm TOEIC ↔ Khung năng lực Châu Âu CEFR (A1–C2)",
          cefr: "A1–C2",
          summary: "Hiểu đúng điểm số quy đổi của bản thân đang đứng ở đâu theo chuẩn ETS & doanh nghiệp.",
          keyPoints: [
            "A1 (120–220đ) & A2 (225–545đ): Giao tiếp văn phòng cơ bản, đọc được thông báo ngắn và câu hỏi trực tiếp.",
            "B1 (550–780đ): Chuẩn đầu ra đại học phổ biến; hiểu ý chính cuộc họp/email và xử lý tốt Part 1–5.",
            "B2 (785–940đ): Chuẩn làm việc chuyên nghiệp tại tập đoàn đa quốc gia; đọc nhanh đa đoạn & hiểu hàm ý.",
            "C1 (945–970đ) & C2 (975–990đ): Thành thạo cao cấp, làm chủ bẫy paraphrase đa tầng & ngữ cảnh kinh doanh phức tạp."
          ],
          trapAlert: "Điểm TOEIC tính theo thang Scaled Score cong (5–495 mỗi kỹ năng), không nhân tuyến tính — 92/100 Listening vẫn có thể đạt 495/495 tối đa!"
        },
        {
          title: "Hướng dẫn thao tác Tối ưu trên Phần mềm Thi CBT",
          cefr: "A1–C2",
          summary: "Tận dụng tối đa các công cụ có sẵn trên màn hình thi để tiết kiệm 5–7 phút quý giá.",
          keyPoints: [
            "Chuột phải (hoặc nút ⊘) gạch loại trừ ngay đáp án sai giúp mắt không đọc lại phương án nhiễu.",
            "Nút Gắn cờ (Mark for Review) đánh dấu câu phân vân để nhảy thẳng về kiểm tra trên Review Screen.",
            "Kéo bôi vàng từ khóa trong bài đọc Part 7 và chỉnh tỷ lệ chia đôi màn hình phù hợp mắt đọc."
          ],
          trapAlert: "Không để trống bất kỳ câu nào khi đồng hồ còn 60 giây cuối — TOEIC không trừ điểm câu trả lời sai!"
        }
      ]
    }
  ],

  grammarTopics: [
    {
      id: "grammar_word_family",
      num: 1,
      title: "Từ loại & Cụm danh từ (Word Family & Noun Phrases)",
      cefr: "A2–B1",
      source: "Hackers Reading Ch.1",
      freqPct: "20–25% đề Part 5",
      formula: "Det (a/an/the/my/this) + [Adv] + [Adj] + NOUN  |  Be / Linking V + [Adv] + ADJ",
      quickRule: "Nhìn ngay 1 từ TRƯỚC và 1 từ SAU chỗ trống: nếu 4 đáp án chung gốc từ, 90% không cần dịch nghĩa cả câu!",
      trapNote: "Cẩn thận cấu trúc Danh từ ghép (Noun + Noun như 'customer satisfaction', 'safety inspection') và động từ gây cảm xúc (-ing cho vật gây ra, -ed cho người cảm nhận).",
      examples: [
        { en: "All managers must submit their annual budget proposals by Friday.", vi: "Tính từ sở hữu + tính từ + danh từ phụ + DANH TỪ chính (proposals)." },
        { en: "The updated software tracks incoming shipments much more accurately.", vi: "Bổ nghĩa cho ngoại động từ 'tracks' → TRẠNG TỪ (accurately)." }
      ],
      quiz: [
        {
          stem: "Ms. Rivera was praised for her _______ handling of the merger negotiations.",
          options: [
            { choice: "A", text: "profession" },
            { choice: "B", text: "professional" },
            { choice: "C", text: "professionally" },
            { choice: "D", text: "professionalism" }
          ],
          answer: "B",
          explanation: "Giữa tính từ sở hữu 'her' và danh động từ/danh từ 'handling' cần TÍNH TỪ bổ nghĩa → (B) professional."
        },
        {
          stem: "The new warehouse conveyor system operates far more _______ than the older model.",
          options: [
            { choice: "A", text: "efficient" },
            { choice: "B", text: "efficiency" },
            { choice: "C", text: "efficiently" },
            { choice: "D", text: "efficiencies" }
          ],
          answer: "C",
          explanation: "Chỗ trống bổ nghĩa cho động từ thường 'operates' trong cấu trúc so sánh hơn 'more + ADV + than' → (C) efficiently."
        }
      ]
    },
    {
      id: "grammar_sv_agreement",
      num: 2,
      title: "Hòa hợp Chủ ngữ – Động từ (Subject-Verb Agreement)",
      cefr: "A2–B1",
      source: "Hackers Reading Ch.2",
      freqPct: "10% đề Part 5",
      formula: "Chủ ngữ chính (trước 'of / in / for / with') ↔ Động từ chính  |  Each / Every + N(ít) → V(ít)",
      quickRule: "Gạch bỏ toàn bộ cụm giới từ ở giữa Chủ ngữ và Động từ để nhìn ra danh từ gốc quyết định chia số ít hay số nhiều.",
      trapNote: "'The number of + N(nhiều)' chia SỐ ÍT; còn 'A number of + N(nhiều)' (= nhiều) chia SỐ NHIỀU! 'Staff / Equipment / Furniture / Information' là danh từ không đếm được (số ít).",
      examples: [
        { en: "The cost of repairing the aging machinery exceeds our quarterly budget.", vi: "Chủ ngữ gốc là 'The cost' (số ít) → 'exceeds', không chia theo 'machinery'." },
        { en: "A number of regional directors have requested an earlier briefing.", vi: "'A number of + N(số nhiều)' → chia động từ số nhiều 'have requested'." }
      ],
      quiz: [
        {
          stem: "A detailed report on customer complaints across all branches _______ been distributed to department heads.",
          options: [
            { choice: "A", text: "have" },
            { choice: "B", text: "has" },
            { choice: "C", text: "are" },
            { choice: "D", text: "were" }
          ],
          answer: "B",
          explanation: "Chủ ngữ chính là 'A detailed report' (số ít; cụm 'on customer complaints across all branches' chỉ là cụm giới từ bổ nghĩa) → (B) has."
        }
      ]
    },
    {
      id: "grammar_tenses",
      num: 3,
      title: "Thì Động từ & Dấu hiệu Thời gian Chuẩn ETS",
      cefr: "B1",
      source: "Hackers Reading Ch.3",
      freqPct: "10–12% đề Part 5–6",
      formula: "Since + quá khứ → Hiện tại HT  |  By the time + S + V(HTĐ) → Tương lai HT (will have V3)",
      quickRule: "Quét tìm các cụm chỉ mốc thời gian: since, over the past decade, by next month, prior to + quá khứ, every quarter.",
      trapNote: "Bẫy kinh điển: 'Since opening in Osaka three years ago...' — thấy 'three years ago' liền chọn quá khứ đơn là SAI vì đứng sau 'Since' → mệnh đề chính phải chia Hiện tại hoàn thành (has doubled)!",
      examples: [
        { en: "By the time the delegation arrives Tuesday, the hall will have been renovated.", vi: "'By the time + arrives (tương lai)' → 'will have been renovated'." },
        { en: "Over the last five years, solar panel demand has risen steadily.", vi: "'Over the last + khoảng thời gian' luôn đi với Hiện tại hoàn thành." }
      ],
      quiz: [
        {
          stem: "Since relocating its headquarters to Frankfurt last spring, the firm _______ three regional awards.",
          options: [
            { choice: "A", text: "wins" },
            { choice: "B", text: "won" },
            { choice: "C", text: "has won" },
            { choice: "D", text: "will win" }
          ],
          answer: "C",
          explanation: "Mệnh đề trạng ngữ bắt đầu bằng 'Since ... last spring' → mệnh đề chính bắt buộc chia Hiện tại hoàn thành → (C) has won."
        }
      ]
    },
    {
      id: "grammar_voice",
      num: 4,
      title: "Thể Chủ động vs Bị động & Nội động từ",
      cefr: "B1",
      source: "Hackers Reading Ch.4",
      freqPct: "10% đề Part 5",
      formula: "Chủ động: S + V + O (có danh từ tân ngữ)  |  Bị động: S + be V3 + (giới từ / trạng từ / Ø)",
      quickRule: "Nhìn NGAY SAU chỗ trống: nếu có Cụm danh từ làm tân ngữ → Chủ động; nếu là Giới từ (in, by, for, to) hoặc Trạng từ → Bị động.",
      trapNote: "Nhóm nội động từ KHÔNG BAO GIỜ dùng bị động: arrive, depart, emerge, occur, happen, remain, deteriorate, rise, fall, expire.",
      examples: [
        { en: "All confidential dossiers must be stored in locked cabinets.", vi: "Sau chỗ trống là giới từ 'in' (không có tân ngữ) → bị động 'be stored'." },
        { en: "Complimentary shuttle buses depart every twenty minutes.", vi: "'depart' là nội động từ → tuyệt đối không chọn 'are departed'." }
      ],
      quiz: [
        {
          stem: "All reimbursement forms must _______ to the accounting office before 5:00 P.M. on Fridays.",
          options: [
            { choice: "A", text: "submit" },
            { choice: "B", text: "submitting" },
            { choice: "C", text: "be submitted" },
            { choice: "D", text: "have submitted" }
          ],
          answer: "C",
          explanation: "Chủ ngữ 'All reimbursement forms' là vật và phía sau là giới từ 'to' (không có tân ngữ) → cần bị động sau 'must': (C) be submitted."
        }
      ]
    },
    {
      id: "grammar_nonfinite",
      num: 5,
      title: "To-V, Danh động từ (V-ing) & Phân từ Rút gọn",
      cefr: "B2",
      source: "Hackers Reading Ch.5–6",
      freqPct: "12% đề Part 5",
      formula: "Giới từ + V-ing  |  afford/agree/decide/plan + to-V  |  avoid/consider/postpone/recommend + V-ing",
      quickRule: "Cẩn thận 'to' là GIỚI TỪ trong cụm: look forward to, be committed to, be dedicated to, prior to, object to → theo sau là V-ing / Danh từ!",
      trapNote: "Mệnh đề quan hệ rút gọn: Chủ động dùng V-ing ('applicants seeking jobs'), Bị động dùng V3/ed ('policies approved by the board').",
      examples: [
        { en: "We are committed to providing reliable technical support.", vi: "'committed to' có 'to' là giới từ → dùng V-ing 'providing'." },
        { en: "Documents submitted after the deadline will not be evaluated.", vi: "Rút gọn bị động: '(which are) submitted after the deadline'." }
      ],
      quiz: [
        {
          stem: "Kestrel Logistics is dedicated to _______ carbon emissions across its entire delivery fleet.",
          options: [
            { choice: "A", text: "reduce" },
            { choice: "B", text: "reduces" },
            { choice: "C", text: "reducing" },
            { choice: "D", text: "reduced" }
          ],
          answer: "C",
          explanation: "Cấu trúc 'be dedicated to + V-ing / Noun' ('to' ở đây là giới từ) → (C) reducing."
        }
      ]
    },
    {
      id: "grammar_clauses",
      num: 6,
      title: "Liên từ, Giới từ & Đại từ Quan hệ (Clause Connectors)",
      cefr: "B1–B2",
      source: "Hackers Reading Ch.7–8",
      freqPct: "15% đề Part 5–6",
      formula: "Liên từ + S + V  |  Giới từ + Noun/V-ing  |  N(vật) + which/that  |  N(sở hữu) + whose + N",
      quickRule: "Đứng giữa 2 Danh từ mà danh từ sau thuộc sở hữu danh từ trước → chọn ngay 'whose'! Sau dấu phẩy (MĐQH không xác định) tuyệt đối KHÔNG dùng 'that'.",
      trapNote: "Phân biệt cặp kinh điển: although/even though (+ S+V) vs despite/in spite of (+ N); because (+ S+V) vs due to/owing to/because of (+ N); while (+ S+V) vs during (+ N).",
      examples: [
        { en: "Despite the severe weather, all domestic flights departed on schedule.", vi: "'the severe weather' là cụm danh từ → chọn giới từ 'Despite'." },
        { en: "The vendor whose proposal scored highest will be awarded the contract.", vi: "'proposal' thuộc về 'The vendor' → đại từ quan hệ sở hữu 'whose'." }
      ],
      quiz: [
        {
          stem: "_______ the unexpected surge in raw material prices, the factory maintained its profit margin.",
          options: [
            { choice: "A", text: "Although" },
            { choice: "B", text: "Even though" },
            { choice: "C", text: "Despite" },
            { choice: "D", text: "Whereas" }
          ],
          answer: "C",
          explanation: "Phía sau là cụm danh từ 'the unexpected surge in raw material prices' (không có động từ chia thì) → cần giới từ (C) Despite."
        }
      ]
    },
    {
      id: "grammar_pronouns_comp",
      num: 7,
      title: "Đại từ Phản thân, Bất định & Cấu trúc So sánh",
      cefr: "B2",
      source: "Hackers Reading Ch.9–10",
      freqPct: "8–10% đề Part 5",
      formula: "Sở hữu (my/your/their) + N  |  Đại từ sở hữu (mine/theirs) đứng một mình  |  much / far / even / significantly + So sánh hơn",
      quickRule: "Chủ ngữ = Tân ngữ (hoặc nhấn mạnh 'tự mình làm') → dùng Đại từ phản thân (-self/-selves). Trước so sánh hơn chỉ được dùng 'much / far / even / slightly', KHÔNG dùng 'very'!",
      trapNote: "'Another + N(số ít)' vs 'Other + N(số nhiều/không đếm được)' vs 'Others' (đại từ đứng một mình = other ones).",
      examples: [
        { en: "Employees may reserve conference rooms themselves via the intranet.", vi: "Nhấn mạnh chính nhân viên tự thực hiện → đại từ phản thân 'themselves'." },
        { en: "Our proposal is far more cost-effective than the competitor's.", vi: "Nhấn mạnh so sánh hơn dùng 'far / much / considerably'." }
      ],
      quiz: [
        {
          stem: "Because our lead technician was away, the branch manager installed the new router _______.",
          options: [
            { choice: "A", text: "her" },
            { choice: "B", text: "hers" },
            { choice: "C", text: "herself" },
            { choice: "D", text: "she" }
          ],
          answer: "C",
          explanation: "Nhấn mạnh người quản lý tự tay thực hiện công việc (by herself) → đại từ phản thân (C) herself."
        }
      ]
    },
    {
      id: "grammar_advanced",
      num: 8,
      title: "Giả định cách (Subjunctive), Điều kiện & Đảo ngữ C1–C2",
      cefr: "C1–C2",
      source: "Hackers 1000 & Reading Ch.11–12",
      freqPct: "5–8% câu phân loại 850–990+",
      formula: "recommend/insist/essential + that + S + (should) + V0  |  Should + S + V0 (Đảo ngữ ĐK1)  |  Were + S + to-V (ĐK2)  |  Had + S + V3 (ĐK3)",
      quickRule: "Đầu câu có động từ khuyết thiếu/trợ động từ đứng trước chủ ngữ mà cuối câu là dấu chấm (không phải dấu hỏi!) → 100% là CÂU ĐẢO NGỮ!",
      trapNote: "Trong giả định cách (Subjunctive), dù chủ ngữ là 'the director' (số ít) và động từ chính là 'recommended' (quá khứ), động từ sau 'that' vẫn là NGUYÊN MẪU KHÔNG CHIA ('resume', 'be inspected')!",
      examples: [
        { en: "The board recommended that the COO resume negotiations immediately.", vi: "Subjunctive: 'recommended that + S + resume' (không thêm -s hay -ed)." },
        { en: "Should you require further assistance, please contact customer care.", vi: "Đảo ngữ điều kiện loại 1 = 'If you should require...'." }
      ],
      quiz: [
        {
          stem: "_______ any technical irregularities occur during the trial, notify the engineering supervisor immediately.",
          options: [
            { choice: "A", text: "If" },
            { choice: "B", text: "Should" },
            { choice: "C", text: "Were" },
            { choice: "D", text: "Had" }
          ],
          answer: "B",
          explanation: "Động từ trong mệnh đề chính là câu mệnh lệnh ('notify...') và động từ ở vế đầu là nguyên mẫu ('occur') → đảo ngữ Điều kiện loại 1: (B) Should (= If any technical irregularities should occur...)."
        }
      ]
    }
  ],

  paraphraseBank: [
    { part: "Part 1", cefr: "A2", audioOrText: "wearing a jacket / holding a mug", optionText: "dressed in outerwear / grasping a cup", note: "Thay danh từ/động từ miêu tả trang phục và hành động tay" },
    { part: "Part 1", cefr: "A2", audioOrText: "looking at a monitor / examining a chart", optionText: "viewing a screen / reviewing a document", note: "Paraphrase hành động văn phòng hay gặp nhất" },
    { part: "Part 1", cefr: "B1", audioOrText: "merchandise is displayed on shelves", optionText: "items are arranged on racks", note: "Tranh tả vật bị động (không có người)" },
    { part: "Part 1", cefr: "B1", audioOrText: "pedestrians are crossing a street", optionText: "people are walking at a crosswalk", note: "Chủ thể 'pedestrians' chuyển thành 'people'" },
    { part: "Part 2", cefr: "B1", audioOrText: "When is the board meeting?", optionText: "I haven't seen the updated calendar yet.", note: "Câu trả lời gián tiếp: Chưa kiểm tra lịch" },
    { part: "Part 2", cefr: "B1", audioOrText: "Who is in charge of the catering?", optionText: "Ms. Sato handled all the arrangements.", note: "Nhận diện tên riêng + động từ đồng nghĩa 'handled'" },
    { part: "Part 2", cefr: "B2", audioOrText: "Should we print 200 or 300 flyers?", optionText: "Let's ask how many guests registered.", note: "Câu hỏi lựa chọn trả lời bằng tiêu chí quyết định" },
    { part: "Part 2", cefr: "B2", audioOrText: "The printer on the third floor is jammed again.", optionText: "There's a spare one near the lobby.", note: "Câu trần thuật (Statement) → Đáp án đưa giải pháp thay thế" },
    { part: "Part 3–4", cefr: "B1", audioOrText: "painting and remodeling parts of our office", optionText: "A building will be renovated", note: "Hackers 3 Test 4 · Q77" },
    { part: "Part 3–4", cefr: "B2", audioOrText: "look for red and yellow stripes on the pavement", optionText: "Colored lines", note: "Hackers 3 Test 4 · Q73" },
    { part: "Part 3–4", cefr: "B2", audioOrText: "work computers won't be relocated until final week", optionText: "Equipment will be moved", note: "Hackers 3 Test 4 · Q79" },
    { part: "Part 3–4", cefr: "B2", audioOrText: "traveling on a budget / make vacationing cheaper", optionText: "affordable travel tips", note: "ETS 2019 Test 6 · Q71–73" },
    { part: "Part 3–4", cefr: "C1", audioOrText: "send me the names of the apps you find by end of day", optionText: "submit a list of recommendations", note: "Tổng hợp hành động sang danh từ trừu tượng" },
    { part: "Part 3–4", cefr: "C1–C2", audioOrText: "a steep rise in raw material costs forced us to adjust rates", optionText: "increase product pricing due to supplier expenses", note: "Paraphrase nguyên nhân – kết quả đa tầng" },
    { part: "Part 7", cefr: "B1", audioOrText: "taking over 430 Foster Street, the former site", optionText: "a relocation", note: "ETS Part 7 · Q147 (Thông báo chuyển địa điểm)" },
    { part: "Part 7", cefr: "B2", audioOrText: "let two weeks pass before following up on a request", optionText: "wait longer before raising an issue", note: "ETS Part 7 · Q150" },
    { part: "Part 7", cefr: "B2", audioOrText: "she was on vacation and is catching up on her work", optionText: "A manager has not completed a task", note: "ETS Part 7 · Q149" },
    { part: "Part 7", cefr: "C1", audioOrText: "final day Sunday Nov 11, open Tuesday Nov 13, no interruption", optionText: "It is closed on Mondays", note: "Suy luận logic lịch mở cửa (ETS Part 7 · Q148)" },
    { part: "Part 7", cefr: "C1–C2", audioOrText: "*Discount excludes clearance items and bulk orders", optionText: "An exception applies to certain purchases", note: "Chú thích hoa thị cuối bảng giá" },
    { part: "Part 7", cefr: "C1–C2", audioOrText: "complementary consultation / complimentary refreshments", optionText: "free snacks vs matching services", note: "Bẫy chính tả & từ đồng âm cao cấp trong email" }
  ],

  vocabModules: [
    {
      topic: "Hợp đồng & Tuân thủ (Contracts)",
      cefr: "B2–C1",
      words: [
        { word: "Abide by", ipa: "/əˈbaɪd baɪ/", pos: "verb", vi: "Tuân thủ (quy định, điều khoản)", example: "All contractors must abide by strict workplace safety guidelines." },
        { word: "Stipulation", ipa: "/ˌstɪpjəˈleɪʃn/", pos: "noun", vi: "Điều khoản quy định trong hợp đồng", example: "One stipulation of the lease prohibits subletting without written consent." },
        { word: "Terminate", ipa: "/ˈtɜːrmɪneɪt/", pos: "verb", vi: "Chấm dứt, kết thúc (hợp đồng/dịch vụ)", example: "Either party may terminate the agreement with 30 days' prior notice." },
        { word: "Obligation", ipa: "/ˌɑːblɪˈɡeɪʃn/", pos: "noun", vi: "Nghĩa vụ pháp lý / trách nhiệm", example: "The vendor fulfilled all contractual obligations ahead of schedule." }
      ]
    },
    {
      topic: "Tài chính & Ngân sách (Finance)",
      cefr: "B1–B2",
      words: [
        { word: "Reimburse", ipa: "/ˌriːɪmˈbɜːrs/", pos: "verb", vi: "Hoàn trả chi phí (công tác)", example: "Travel expenses will be reimbursed upon submission of original receipts." },
        { word: "Allocate", ipa: "/ˈæləkeɪt/", pos: "verb", vi: "Phân bổ (ngân sách, nguồn lực)", example: "The board voted to allocate additional funds to research and development." },
        { word: "Fiscal", ipa: "/ˈfɪskl/", pos: "adjective", vi: "Thuộc về tài chính / ngân khố", example: "Revenue climbed by 14 percent during the third fiscal quarter." },
        { word: "Waive", ipa: "/weɪv/", pos: "verb", vi: "Miễn trừ (phí, điều kiện)", example: "Delivery fees are waived on commercial orders exceeding $250." }
      ]
    },
    {
      topic: "Vận hành, Bảo trì & Sự cố (Operations)",
      cefr: "A2–B2",
      words: [
        { word: "Renovate", ipa: "/ˈrenəveɪt/", pos: "verb", vi: "Cải tạo, nâng cấp (tòa nhà/phòng)", example: "The third-floor lobby will be renovated over the summer." },
        { word: "Relocate", ipa: "/ˌriːloʊˈkeɪt/", pos: "verb", vi: "Di dời địa điểm", example: "Workstations will be relocated before construction begins next Monday." },
        { word: "Malfunction", ipa: "/ˌmælˈfʌŋkʃn/", pos: "noun/verb", vi: "Sự cố trục trặc kỹ thuật", example: "A server malfunction briefly disrupted online order tracking." },
        { word: "Mandatory", ipa: "/ˈmændətɔːri/", pos: "adjective", vi: "Bắt buộc (theo quy định)", example: "Attendance at the cybersecurity briefing is strictly mandatory." }
      ]
    },
    {
      topic: "Chiến lược Kinh doanh & Tuyển dụng (HR & Strategy)",
      cefr: "B2–C2",
      words: [
        { word: "Prospective", ipa: "/prəˈspektɪv/", pos: "adjective", vi: "Tiềm năng, có triển vọng", example: "Prospective tenants should review every clause of the lease." },
        { word: "Lucrative", ipa: "/ˈluːkrətɪv/", pos: "adjective", vi: "Sinh lời cao, béo bở", example: "The merger secured a lucrative distribution partnership across East Asia." },
        { word: "Unanimous", ipa: "/juːˈnænɪməs/", pos: "adjective", vi: "Nhất trí hoàn toàn (100%)", example: "The executive committee reached a unanimous decision on the acquisition." },
        { word: "Discrepancy", ipa: "/dɪˈskrepənsi/", pos: "noun", vi: "Sự sai lệch, chênh lệch (số liệu)", example: "Auditors discovered a minor discrepancy between the invoice and shipping manifest." }
      ]
    }
  ],

  cefrPathways: [
    {
      group: "A12",
      badge: "A1–A2 · Nền tảng (120–545đ)",
      goal: "Đạt 550+ TOEIC trong 30–45 ngày",
      profile: "Nghe chưa bắt được âm cuối, chưa quen tốc độ loa ETS, ngữ pháp còn dịch từng chữ và hay lụi Part 7.",
      studyPlan: [
        "1. Làm ngay TEST ĐẦU VÀO 01 (100 câu · 60 phút) để đo chính xác điểm nền Listening & Reading.",
        "2. Học trọn vẹn Hackers TOEIC Start (Chương 1–3): Từ loại, 6 tranh Part 1 & Phản xạ Wh- Part 2.",
        "3. Luyện bộ ETS 2019 Part 1 (T6 & T7) trong Luyện Sâu Studio với chế độ ẩn lời thoại và chép chính tả cơ bản.",
        "4. Hoàn thành 3 đề Listening Foundation ETS 2022 (Test 8, 9, 10) trước khi bước lên đề 200 câu."
      ],
      targetTests: ["test-au-vao-01", "ets-2022-test-9", "ets-2022-test-8"]
    },
    {
      group: "B12",
      badge: "B1–B2 · Bứt phá (550–940đ)",
      goal: "Vượt mốc 785–900+ (B2 Độc lập)",
      profile: "Đã nghe được ý chính nhưng dễ mất điểm ở bẫy câu gián tiếp Part 2, câu suy luận Part 3–4 và thiếu thời gian 25 câu cuối Part 7.",
      studyPlan: [
        "1. Học Hackers TOEIC Reading (12 chuyên đề Part 5–6) & Hackers TOEIC Listening (Chu kỳ 8 giây + Bẫy đồng âm).",
        "2. Luyện sâu Part 4 ETS 2019 Test 6, Part 5 & Part 6 trong Studio; bật tốc độ nghe 1.15x khi chữa bài.",
        "3. Bắt đầu từ nhóm đề Full B1 (ETS 2023 Test 4, 5, 6, 7) rồi nâng dần lên nhóm B2 (ETS 2024 Test 6, ETS 2026 Test 7, 8, 10)."
      ],
      targetTests: ["ets-2023-test-5", "ets-2024-test-6", "ets-2026-test-7"]
    },
    {
      group: "C12",
      badge: "C1–C2 · Chinh phục Đỉnh cao (945–990đ)",
      goal: "Chạm ngưỡng 945–990/990",
      profile: "Kiến thức ngữ pháp vững, cần tối ưu tốc độ Part 5 dưới 9 phút, triệt tiêu bẫy NOT/TRUE, câu chèn [1]–[4] và làm chủ đề khó.",
      studyPlan: [
        "1. Ôn kỹ Hackers TOEIC 1000 & Chuyên đề Ngữ pháp C1–C2 (Giả định cách, Đảo ngữ, Từ đa nghĩa thương mại).",
        "2. Giải phẫu Hackers 3 Test 4 (Part 4 nâng cao) & Full 54 câu Part 7 trong Luyện Sâu Studio bằng chế độ Soi chứng cứ.",
        "3. Thi thử chế độ 'Chuẩn IIG Nghiêm Ngặt' (45p Listening khóa tua + 75p Reading) trên các đề C1–C2: ETS 2026 Test 5, Test 9, ETS 2024 Test 10."
      ],
      targetTests: ["ets-2026-test-1", "ets2024-test-10", "ets-2026-test-5", "ets-2026-test-9"]
    }
  ]
};
