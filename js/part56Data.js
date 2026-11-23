/**
 * ETS Reading Part 5 & Part 6 Commercial Practice Pack (Questions 101–146)
 * - Part 5 (part5_t1): 30 Incomplete Sentences across 6 thematic ETS drills (Q101–130)
 * - Part 6 (part6_t1): 4 Authentic Business Passages × 4 Questions = 16 Questions including Sentence Insertion (Q131–146)
 * Exposes window.TOEIC_PART56_TESTS without mutating window.TOEIC_TESTS directly so topbar 6-tab & 151-q scopes stay intact.
 */
(function () {
  const PART5_TALKS = [
    // =========================================================================
    // PART 5 · SET 1: Q101–105 — Word Family & Parts of Speech (Từ loại)
    // =========================================================================
    {
      range: "101-105",
      type: "Part 5 · Từ loại (Word Family)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 101-105 refer to the following incomplete sentences (Part 5 · Word Family).",
      introPrompt: "Questions 101-105 refer to the following incomplete sentences (Part 5 · Word Family).",
      passages: [
        {
          docId: "doc1",
          docLabel: "Phiếu đề Part 5 · Câu 101–105",
          kind: "info",
          eyebrow: "ETS READING PART 5 · INCOMPLETE SENTENCES",
          title: "Chuyên đề 1: Từ loại & Cấu trúc cụm danh từ (Q101–105)",
          subtitle: "Chọn phương án đúng nhất để hoàn thành từng câu đơn theo chuẩn đề thi IIG.",
          paragraphs: [
            {
              text: "101. All regional branch managers must submit their annual budget _______ to the finance director by Friday afternoon.",
              vi: "101. Tất cả giám đốc chi nhánh khu vực phải nộp [bản đề xuất - proposals] ngân sách hằng năm của họ cho giám đốc tài chính trước chiều thứ Sáu."
            },
            {
              text: "102. The updated inventory software allows warehouse supervisors to track incoming shipments much more _______ than the previous system did.",
              vi: "102. Phần mềm kiểm kê cập nhật cho phép các giám sát viên kho hàng theo dõi các lô hàng nhập về một cách [chính xác - accurately] hơn nhiều so với hệ thống trước đây."
            },
            {
              text: "103. Ms. Takahashi received an award in recognition of her _______ contribution to the company's renewable energy initiative.",
              vi: "103. Bà Takahashi đã nhận được giải thưởng nhằm ghi nhận sự đóng góp [xuất sắc/vượt trội - exceptional] của bà cho sáng kiến năng lượng tái tạo của công ty."
            },
            {
              text: "104. Before signing the lease agreement, prospective tenants should _______ review every clause regarding maintenance fees.",
              vi: "104. Trước khi ký hợp đồng thuê mặt bằng, các khách thuê tiềm năng nên rà soát [kỹ lưỡng - thoroughly] mọi điều khoản liên quan đến phí bảo trì."
            },
            {
              text: "105. Attendance at tomorrow's cybersecurity orientation is strictly _______ for all newly hired administrative personnel.",
              vi: "105. Việc tham dự buổi định hướng an ninh mạng vào ngày mai là hoàn toàn [bắt buộc - mandatory] đối với tất cả nhân sự hành chính mới tuyển dụng."
            }
          ]
        }
      ],
      transcript: "101. All regional branch managers must submit their annual budget _______ to the finance director by Friday afternoon.\n102. The updated inventory software allows warehouse supervisors to track incoming shipments much more _______ than the previous system did.\n103. Ms. Takahashi received an award in recognition of her _______ contribution to the company's renewable energy initiative.\n104. Before signing the lease agreement, prospective tenants should _______ review every clause regarding maintenance fees.\n105. Attendance at tomorrow's cybersecurity orientation is strictly _______ for all newly hired administrative personnel.",
      translation: "101. Tất cả giám đốc chi nhánh khu vực phải nộp bản đề xuất ngân sách hằng năm cho giám đốc tài chính trước chiều thứ Sáu.<br/>102. Phần mềm kiểm kê mới giúp giám sát kho theo dõi lô hàng nhập về chính xác hơn nhiều so với hệ thống cũ.<br/>103. Bà Takahashi nhận giải thưởng ghi nhận đóng góp xuất sắc cho sáng kiến năng lượng tái tạo.<br/>104. Trước khi ký hợp đồng thuê, khách thuê tiềm năng nên rà soát kỹ lưỡng mọi điều khoản phí bảo trì.<br/>105. Tham dự buổi định hướng an ninh mạng ngày mai là hoàn toàn bắt buộc đối với nhân viên hành chính mới.",
      vocab: [
        "budget proposal (n): bản đề xuất ngân sách",
        "track shipments (v): theo dõi các lô hàng",
        "in recognition of (phr): để ghi nhận / vinh danh",
        "lease agreement (n): hợp đồng thuê mặt bằng",
        "prospective tenant (n): khách thuê tiềm năng",
        "review thoroughly (v): rà soát kỹ lưỡng",
        "strictly mandatory (phr): hoàn toàn bắt buộc"
      ],
      lexicalChunks: [
        { en: "budget proposal", vi: "bản đề xuất ngân sách", pos: "noun", ipa: "/ˈbʌdʒɪt prəˈpoʊzl/" },
        { en: "in recognition of", vi: "để ghi nhận, vinh danh", pos: "phrase", ipa: "/ɪn ˌrekəɡˈnɪʃn əv/" },
        { en: "prospective tenant", vi: "khách thuê tiềm năng", pos: "noun", ipa: "/prəˈspektɪv ˈtenənt/" },
        { en: "strictly mandatory", vi: "hoàn toàn bắt buộc", pos: "phrase", ipa: "/ˈstrɪktli ˈmændətɔːri/" }
      ],
      questions: [
        {
          num: 101,
          questionType: "detail",
          question: "All regional branch managers must submit their annual budget _______ to the finance director by Friday afternoon.",
          options: [
            { choice: "A", text: "propose" },
            { choice: "B", text: "proposals" },
            { choice: "C", text: "proposed" },
            { choice: "D", text: "proposing" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "submit their annual budget _______ to the finance director",
          evidence: "submit their annual budget _______ to the finance director",
          explanation: "Sau tính từ sở hữu 'their', tính từ 'annual' và danh từ phụ 'budget' cần một DANH TỪ chính làm tân ngữ cho động từ 'submit' -> (B) 'proposals' (danh từ số nhiều đếm được: các bản đề xuất ngân sách). Bẫy (A) động từ nguyên mẫu; Bẫy (C) động từ quá khứ/quá khứ phân từ; Bẫy (D) danh động từ/hiện tại phân từ không đứng làm danh từ đếm được sau cụm 'their annual budget'."
        },
        {
          num: 102,
          questionType: "detail",
          question: "The updated inventory software allows warehouse supervisors to track incoming shipments much more _______ than the previous system did.",
          options: [
            { choice: "A", text: "accurate" },
            { choice: "B", text: "accuracy" },
            { choice: "C", text: "accurately" },
            { choice: "D", text: "accurateness" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "track incoming shipments much more _______ than the previous system did",
          evidence: "track incoming shipments much more _______ than the previous system did",
          explanation: "Chỗ trống bổ nghĩa cho ngoại động từ thường 'track' (theo dõi lô hàng như thế nào?) trong cấu trúc so sánh hơn 'much more + ADV + than' -> cần TRẠNG TỪ (C) 'accurately' (một cách chính xác). Bẫy (A) tính từ chỉ đi với linking verb; Bẫy (B) & (D) là danh từ không thể bổ nghĩa cho động từ 'track'."
        },
        {
          num: 103,
          questionType: "detail",
          question: "Ms. Takahashi received an award in recognition of her _______ contribution to the company's renewable energy initiative.",
          options: [
            { choice: "A", text: "exception" },
            { choice: "B", text: "excepting" },
            { choice: "C", text: "exceptionally" },
            { choice: "D", text: "exceptional" }
          ],
          answer: "D",
          evidenceDoc: "doc1",
          evidenceQuote: "in recognition of her _______ contribution to the company's renewable energy initiative",
          evidence: "in recognition of her _______ contribution to the company's renewable energy initiative",
          explanation: "Đứng giữa tính từ sở hữu 'her' và danh từ 'contribution' bắt buộc là một TÍNH TỪ bổ nghĩa cho danh từ -> (D) 'exceptional' (xuất sắc, vượt trội). Bẫy (A) danh từ 'ngoại lệ'; Bẫy (B) giới từ/phân từ 'ngoại trừ'; Bẫy (C) trạng từ không đứng trực tiếp trước danh từ đơn."
        },
        {
          num: 104,
          questionType: "detail",
          question: "Before signing the lease agreement, prospective tenants should _______ review every clause regarding maintenance fees.",
          options: [
            { choice: "A", text: "thorough" },
            { choice: "B", text: "thoroughly" },
            { choice: "C", text: "thoroughness" },
            { choice: "D", text: "more thorough" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "prospective tenants should _______ review every clause",
          evidence: "prospective tenants should _______ review every clause",
          explanation: "Vị trí kẹp giữa động từ khuyết thiếu 'should' và động từ nguyên mẫu 'review' là vị trí vàng của TRẠNG TỪ bổ nghĩa cho động từ -> (B) 'thoroughly' (một cách kỹ lưỡng, thấu đáo). Bẫy (A) & (D) tính từ; Bẫy (C) danh từ."
        },
        {
          num: 105,
          questionType: "detail",
          question: "Attendance at tomorrow's cybersecurity orientation is strictly _______ for all newly hired administrative personnel.",
          options: [
            { choice: "A", text: "mandate" },
            { choice: "B", text: "mandated" },
            { choice: "C", text: "mandatory" },
            { choice: "D", text: "mandating" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "is strictly _______ for all newly hired administrative personnel",
          evidence: "is strictly _______ for all newly hired administrative personnel",
          explanation: "Sau động từ to-be 'is' và trạng từ chỉ mức độ 'strictly' cần một TÍNH TỪ làm bổ ngữ chủ ngữ ('Attendance... is strictly mandatory for...') -> (C) 'mandatory' (mang tính bắt buộc). Cụm collocation chuẩn ETS: 'be strictly mandatory for somebody'. Bẫy (A) danh từ/động từ nguyên thể; Bẫy (B) quá khứ phân từ thường đi với 'by + tác nhân' chứ không đi với 'strictly ... for' tự nhiên như tính từ 'mandatory'; Bẫy (D) chủ động V-ing sai nghĩa."
        }
      ]
    },

    // =========================================================================
    // PART 5 · SET 2: Q106–110 — Verb Tenses, Voice & Subjunctive (Chia động từ)
    // =========================================================================
    {
      range: "106-110",
      type: "Part 5 · Thì, Bị động & Giả định cách",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 106-110 refer to the following incomplete sentences (Part 5 · Verb System).",
      introPrompt: "Questions 106-110 refer to the following incomplete sentences (Part 5 · Verb System).",
      passages: [
        {
          docId: "doc1",
          docLabel: "Phiếu đề Part 5 · Câu 106–110",
          kind: "info",
          eyebrow: "ETS READING PART 5 · VERB TENSES & VOICE",
          title: "Chuyên đề 2: Thì động từ, Thể bị động & Giả định cách (Q106–110)",
          subtitle: "Nhận diện dấu hiệu thời gian, tân ngữ sau động từ và cấu trúc giả định thương mại.",
          paragraphs: [
            {
              text: "106. By the time the international trade delegation arrives next Tuesday, the main exhibition hall _______ completely.",
              vi: "106. Trước thời điểm phái đoàn thương mại quốc tế tới vào thứ Ba tuần sau, sảnh triển lãm chính [sẽ đã được tân trang - will have been renovated] hoàn toàn."
            },
            {
              text: "107. The board of directors recommended that the chief operating officer _______ negotiations with the overseas logistics partner immediately.",
              vi: "107. Hội đồng quản trị khuyến nghị rằng giám đốc vận hành (COO) [nên nối lại - resume] cuộc đàm phán với đối tác hậu cần nước ngoài ngay lập tức."
            },
            {
              text: "108. Since opening its flagship showroom in Osaka three years ago, Kestrel Audio _______ its market share across East Asia.",
              vi: "108. Kể từ khi khai trương phòng trưng bày chủ lực tại Osaka cách đây ba năm, Kestrel Audio [đã tăng gấp đôi - has doubled] thị phần trên khắp Đông Á."
            },
            {
              text: "109. Complimentary shuttle buses _______ every twenty minutes between the convention center and the downtown train terminal.",
              vi: "109. Xe buýt trung chuyển miễn phí [chạy/vận hành - depart] mỗi hai mươi phút giữa trung tâm hội nghị và ga tàu trung tâm."
            },
            {
              text: "110. All confidential client dossiers must _______ in locked fireproof cabinets before employees leave the premises each evening.",
              vi: "110. Toàn bộ hồ sơ mật của khách hàng phải [được cất giữ - be stored] trong tủ chống cháy có khóa trước khi nhân viên rời trụ sở mỗi tối."
            }
          ]
        }
      ],
      transcript: "106. By the time the international trade delegation arrives next Tuesday, the main exhibition hall _______ completely.\n107. The board of directors recommended that the chief operating officer _______ negotiations with the overseas logistics partner immediately.\n108. Since opening its flagship showroom in Osaka three years ago, Kestrel Audio _______ its market share across East Asia.\n109. Complimentary shuttle buses _______ every twenty minutes between the convention center and the downtown train terminal.\n110. All confidential client dossiers must _______ in locked fireproof cabinets before employees leave the premises each evening.",
      translation: "106. Trước khi phái đoàn thương mại quốc tế đến vào thứ Ba tới, sảnh triển lãm chính sẽ đã được tân trang hoàn toàn.<br/>107. Hội đồng quản trị khuyến nghị giám đốc vận hành nối lại đàm phán với đối tác hậu cần nước ngoài ngay lập tức.<br/>108. Kể từ khi mở showroom chủ lực ở Osaka 3 năm trước, Kestrel Audio đã tăng gấp đôi thị phần khắp Đông Á.<br/>109. Xe buýt trung chuyển miễn phí khởi hành mỗi 20 phút giữa trung tâm hội nghị và nhà ga.<br/>110. Mọi hồ sơ mật của khách hàng phải được cất giữ trong tủ chống cháy có khóa trước khi nhân viên ra về mỗi tối.",
      vocab: [
        "trade delegation (n): phái đoàn thương mại",
        "exhibition hall (n): sảnh triển lãm",
        "board of directors (n): hội đồng quản trị",
        "resume negotiations (v): nối lại các cuộc đàm phán",
        "flagship showroom (n): phòng trưng bày chủ lực",
        "market share (n): thị phần",
        "leave the premises (v): rời khỏi khu vực trụ sở/tòa nhà"
      ],
      lexicalChunks: [
        { en: "trade delegation", vi: "phái đoàn thương mại", pos: "noun", ipa: "/treɪd ˌdelɪˈɡeɪʃn/" },
        { en: "resume negotiations", vi: "nối lại cuộc đàm phán", pos: "verb", ipa: "/rɪˈzuːm nɪˌɡoʊʃiˈeɪʃnz/" },
        { en: "market share", vi: "thị phần", pos: "noun", ipa: "/ˈmɑːrkɪt ʃer/" },
        { en: "leave the premises", vi: "rời khỏi cơ sở/tòa nhà", pos: "verb", ipa: "/liːv ðə ˈpremɪsɪz/" }
      ],
      questions: [
        {
          num: 106,
          questionType: "detail",
          question: "By the time the international trade delegation arrives next Tuesday, the main exhibition hall _______ completely.",
          options: [
            { choice: "A", text: "renovated" },
            { choice: "B", text: "is renovating" },
            { choice: "C", text: "will have been renovated" },
            { choice: "D", text: "has renovated" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "By the time the international trade delegation arrives next Tuesday, the main exhibition hall _______ completely.",
          evidence: "By the time the international trade delegation arrives next Tuesday, the main exhibition hall _______ completely.",
          explanation: "Công thức vàng của ETS: 'By the time + S + V(hiện tại đơn chỉ tương lai: arrives next Tuesday), S + WILL HAVE V3/ED' (Tương lai hoàn thành). Đồng thời chủ ngữ 'the main exhibition hall' là vật chịu tác động và sau chỗ trống không có tân ngữ (chỉ có trạng từ 'completely') -> cần BỊ ĐỘNG tương lai hoàn thành (C) 'will have been renovated'. Bẫy (A) quá khứ đơn; Bẫy (B) chủ động tiếp diễn; Bẫy (D) chủ động hiện tại hoàn thành."
        },
        {
          num: 107,
          questionType: "detail",
          question: "The board of directors recommended that the chief operating officer _______ negotiations with the overseas logistics partner immediately.",
          options: [
            { choice: "A", text: "resumes" },
            { choice: "B", text: "resume" },
            { choice: "C", text: "resumed" },
            { choice: "D", text: "to resume" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "recommended that the chief operating officer _______ negotiations",
          evidence: "recommended that the chief operating officer _______ negotiations",
          explanation: "Cấu trúc GIẢ ĐỊNH CÁCH (Subjunctive Mood) cực hay gặp ở mốc 800+: 'recommend / suggest / request / insist / ask + THAT + S + (should) + V-nguyên mẫu không chia'! Dù chủ ngữ 'the chief operating officer' là số ít và 'recommended' ở quá khứ, động từ sau 'that' vẫn giữ nguyên mẫu -> (B) 'resume'. Bẫy (A) chia -s theo ngôi thứ 3 số ít; Bẫy (C) chia quá khứ theo 'recommended'; Bẫy (D) to-V không đứng làm vị ngữ sau 'that'."
        },
        {
          num: 108,
          questionType: "detail",
          question: "Since opening its flagship showroom in Osaka three years ago, Kestrel Audio _______ its market share across East Asia.",
          options: [
            { choice: "A", text: "has doubled" },
            { choice: "B", text: "doubled" },
            { choice: "C", text: "will double" },
            { choice: "D", text: "had been doubled" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "Since opening its flagship showroom in Osaka three years ago, Kestrel Audio _______ its market share",
          evidence: "Since opening its flagship showroom in Osaka three years ago, Kestrel Audio _______ its market share",
          explanation: "Mệnh đề trạng ngữ bắt đầu bằng 'Since + mốc quá khứ (three years ago)' -> mệnh đề chính bắt buộc chia thì HIỆN TẠI HOÀN THÀNH, và có tân ngữ 'its market share' phía sau -> thể chủ động (A) 'has doubled'. Bẫy kinh điển (B) 'doubled': thí sinh thấy 'three years ago' liền khoanh quá khứ đơn mà quên mất 'three years ago' nằm trong cụm 'Since ... three years ago'! Bẫy (C) tương lai đơn; Bẫy (D) quá khứ hoàn thành bị động."
        },
        {
          num: 109,
          questionType: "detail",
          question: "Complimentary shuttle buses _______ every twenty minutes between the convention center and the downtown train terminal.",
          options: [
            { choice: "A", text: "departs" },
            { choice: "B", text: "depart" },
            { choice: "C", text: "are departed" },
            { choice: "D", text: "departing" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "Complimentary shuttle buses _______ every twenty minutes",
          evidence: "Complimentary shuttle buses _______ every twenty minutes",
          explanation: "Cụm chỉ tần suất lịch trình cố định 'every twenty minutes' dùng thì hiện tại đơn; chủ ngữ số nhiều 'Complimentary shuttle buses' và nội động từ 'depart' (khởi hành — tuyệt đối KHÔNG chia bị động!) -> (B) 'depart'. Bẫy (A) chia số ít; Bẫy (C) chia bị động cho nội động từ 'depart'; Bẫy (D) V-ing thiếu trợ động từ nên câu mất động từ chính."
        },
        {
          num: 110,
          questionType: "detail",
          question: "All confidential client dossiers must _______ in locked fireproof cabinets before employees leave the premises each evening.",
          options: [
            { choice: "A", text: "store" },
            { choice: "B", text: "storing" },
            { choice: "C", text: "be stored" },
            { choice: "D", text: "have stored" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "All confidential client dossiers must _______ in locked fireproof cabinets",
          evidence: "All confidential client dossiers must _______ in locked fireproof cabinets",
          explanation: "Chủ ngữ là vật ('All confidential client dossiers' - hồ sơ mật), phía sau chỗ trống không có tân ngữ danh từ mà là cụm giới từ chỉ nơi chốn 'in locked fireproof cabinets' -> sau động từ khuyết thiếu 'must' phải dùng BỊ ĐỘNG 'must + be + V3/ed' -> (C) 'be stored'. Bẫy (A) & (D) chủ động; Bẫy (B) sau 'must' không đi trực tiếp với V-ing."
        }
      ]
    },

    // =========================================================================
    // PART 5 · SET 3: Q111–115 — Prepositions & Conjunctions (Liên từ & Giới từ)
    // =========================================================================
    {
      range: "111-115",
      type: "Part 5 · Liên từ & Giới từ (Linkers)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 111-115 refer to the following incomplete sentences (Part 5 · Linkers).",
      introPrompt: "Questions 111-115 refer to the following incomplete sentences (Part 5 · Linkers).",
      passages: [
        {
          docId: "doc1",
          docLabel: "Phiếu đề Part 5 · Câu 111–115",
          kind: "info",
          eyebrow: "ETS READING PART 5 · CONJUNCTIONS VS. PREPOSITIONS",
          title: "Chuyên đề 3: Phân biệt Liên từ (+ Mệnh đề) & Giới từ (+ Cụm danh từ) (Q111–115)",
          subtitle: "Kỹ thuật xét cấu trúc sau chỗ trống (Clause S+V hay Noun Phrase) kết hợp logic nghĩa.",
          paragraphs: [
            {
              text: "111. _______ the severe shortage of semiconductor components, Solis Electronics managed to fulfill all third-quarter orders on schedule.",
              vi: "111. [Mặc dù - Despite] tình trạng thiếu hụt nghiêm trọng linh kiện bán dẫn, Solis Electronics vẫn xoay xở hoàn thành đúng hạn toàn bộ đơn hàng quý ba."
            },
            {
              text: "112. Employees wishing to work remotely on Fridays may do so _______ they obtain written approval from their department supervisor.",
              vi: "112. Nhân viên muốn làm việc từ xa vào thứ Sáu có thể thực hiện điều đó [miễn là - provided that] họ nhận được sự chấp thuận bằng văn bản từ quản lý bộ phận."
            },
            {
              text: "113. Outdoor seating at the Harborfront Bistro will remain closed _______ the municipal boardwalk repairs are completed next month.",
              vi: "113. Khu vực bàn ngồi ngoài trời tại nhà hàng Harborfront Bistro sẽ tiếp tục đóng cửa [cho đến khi - until] công việc sửa chữa lối đi lát gỗ của thành phố hoàn tất vào tháng tới."
            },
            {
              text: "114. _______ expanding its distribution network in South America, Vance Pharmaceuticals plans to open a research laboratory in Bogotá.",
              vi: "114. [Bên cạnh việc - In addition to] mở rộng mạng lưới phân phối tại Nam Mỹ, Vance Pharmaceuticals còn có kế hoạch mở một phòng thí nghiệm nghiên cứu tại Bogotá."
            },
            {
              text: "115. Packaging technicians must wear protective goggles at all times _______ operating high-pressure bottling machinery.",
              vi: "115. Kỹ thuật viên đóng gói phải đeo kính bảo hộ mọi lúc [trong khi - while] vận hành máy đóng chai áp suất cao."
            }
          ]
        }
      ],
      transcript: "111. _______ the severe shortage of semiconductor components, Solis Electronics managed to fulfill all third-quarter orders on schedule.\n112. Employees wishing to work remotely on Fridays may do so _______ they obtain written approval from their department supervisor.\n113. Outdoor seating at the Harborfront Bistro will remain closed _______ the municipal boardwalk repairs are completed next month.\n114. _______ expanding its distribution network in South America, Vance Pharmaceuticals plans to open a research laboratory in Bogotá.\n115. Packaging technicians must wear protective goggles at all times _______ operating high-pressure bottling machinery.",
      translation: "111. Mặc dù thiếu hụt nghiêm trọng linh kiện bán dẫn, Solis Electronics vẫn hoàn thành đúng hạn toàn bộ đơn hàng quý 3.<br/>112. Nhân viên muốn làm việc từ xa vào thứ Sáu có thể làm vậy miễn là có chấp thuận bằng văn bản từ quản lý.<br/>113. Khu bàn ngoài trời tại Harborfront Bistro sẽ đóng cửa cho đến khi việc sửa chữa lối đi ven biển hoàn tất vào tháng tới.<br/>114. Bên cạnh việc mở rộng mạng lưới phân phối ở Nam Mỹ, Vance Pharmaceuticals dự định mở thêm phòng thí nghiệm tại Bogotá.<br/>115. Kỹ thuật viên đóng gói phải luôn đeo kính bảo hộ trong khi vận hành máy đóng chai áp suất cao.",
      vocab: [
        "severe shortage (n): sự thiếu hụt nghiêm trọng",
        "fulfill orders on schedule (v): hoàn thành đơn hàng đúng tiến độ",
        "provided that (phr): miễn là, với điều kiện là (= as long as)",
        "written approval (n): sự phê duyệt bằng văn bản",
        "in addition to + V-ing (phr): bên cạnh việc gì",
        "protective goggles (n): kính bảo hộ lao động"
      ],
      lexicalChunks: [
        { en: "severe shortage", vi: "sự thiếu hụt nghiêm trọng", pos: "noun", ipa: "/sɪˈvɪr ˈʃɔːrtɪdʒ/" },
        { en: "fulfill orders on schedule", vi: "hoàn thành đơn hàng đúng lịch", pos: "verb", ipa: "/fʊlˈfɪl ˈɔːrdərz ɑːn ˈskedʒuːl/" },
        { en: "provided that", vi: "miễn là, với điều kiện là", pos: "phrase", ipa: "/prəˈvaɪdɪd ðæt/" },
        { en: "written approval", vi: "sự chấp thuận bằng văn bản", pos: "noun", ipa: "/ˈrɪtn əˈpruːvl/" }
      ],
      questions: [
        {
          num: 111,
          questionType: "detail",
          question: "_______ the severe shortage of semiconductor components, Solis Electronics managed to fulfill all third-quarter orders on schedule.",
          options: [
            { choice: "A", text: "Although" },
            { choice: "B", text: "Despite" },
            { choice: "C", text: "Even" },
            { choice: "D", text: "Because of" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "_______ the severe shortage of semiconductor components, Solis Electronics managed to fulfill",
          evidence: "_______ the severe shortage of semiconductor components, Solis Electronics managed to fulfill",
          explanation: "Bước 1 (Xét cấu trúc): Cụm 'the severe shortage of semiconductor components' là một CỤM DANH TỪ (không có động từ chia thì) -> loại ngay liên từ (A) 'Although' (+ S+V) và trạng từ (C) 'Even'. Bước 2 (Xét nghĩa): 'thiếu hụt linh kiện nghiêm trọng' đối lập với 'vẫn hoàn thành đúng hạn mọi đơn hàng' -> cần giới từ chỉ sự nhượng bộ (B) 'Despite' (Mặc dù). Loại (D) 'Because of' (Bởi vì) do ngược nghĩa nhân quả."
        },
        {
          num: 112,
          questionType: "detail",
          question: "Employees wishing to work remotely on Fridays may do so _______ they obtain written approval from their department supervisor.",
          options: [
            { choice: "A", text: "provided that" },
            { choice: "B", text: "in case of" },
            { choice: "C", text: "regardless of" },
            { choice: "D", text: "otherwise" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "may do so _______ they obtain written approval",
          evidence: "may do so _______ they obtain written approval",
          explanation: "Phía sau chỗ trống là mệnh đề đầy đủ S+V ('they obtain written approval') nêu điều kiện để được làm việc từ xa -> cần liên từ điều kiện (A) 'provided that' (= if / as long as: miễn là, với điều kiện là). Bẫy (B) 'in case of' & (C) 'regardless of' là cụm giới từ chỉ cộng Noun/V-ing; Bẫy (D) 'otherwise' là trạng từ liên kết thường đi sau dấu chấm phẩy mang nghĩa 'nếu không thì'."
        },
        {
          num: 113,
          questionType: "detail",
          question: "Outdoor seating at the Harborfront Bistro will remain closed _______ the municipal boardwalk repairs are completed next month.",
          options: [
            { choice: "A", text: "during" },
            { choice: "B", text: "until" },
            { choice: "C", text: "prior" },
            { choice: "D", text: "following" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "will remain closed _______ the municipal boardwalk repairs are completed next month",
          evidence: "will remain closed _______ the municipal boardwalk repairs are completed next month",
          explanation: "Phía sau chỗ trống là mệnh đề S+V ('the municipal boardwalk repairs are completed next month'), phía trước là động từ kéo dài trạng thái 'will remain closed' -> cần liên từ chỉ mốc kết thúc (B) 'until' (cho đến khi). Bẫy (A) 'during' & (D) 'following' là giới từ (+ Noun); Bẫy (C) 'prior' phải đi với 'to + Noun'."
        },
        {
          num: 114,
          questionType: "detail",
          question: "_______ expanding its distribution network in South America, Vance Pharmaceuticals plans to open a research laboratory in Bogotá.",
          options: [
            { choice: "A", text: "Moreover" },
            { choice: "B", text: "As well" },
            { choice: "C", text: "In addition to" },
            { choice: "D", text: "Furthermore" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "_______ expanding its distribution network in South America, Vance Pharmaceuticals plans to open",
          evidence: "_______ expanding its distribution network in South America, Vance Pharmaceuticals plans to open",
          explanation: "Ngay sau chỗ trống là danh động từ V-ing ('expanding its distribution network...') ngăn cách với mệnh đề chính bằng dấu phẩy -> cần cụm giới từ kết thúc bằng 'to' cộng V-ing: (C) 'In addition to' (Bên cạnh việc...). Bẫy (A) 'Moreover' và (D) 'Furthermore' là trạng từ nối đứng trước dấu phẩy + mệnh đề S+V; Bẫy (B) thiếu 'as' ('As well as' mới đi với V-ing)."
        },
        {
          num: 115,
          questionType: "detail",
          question: "Packaging technicians must wear protective goggles at all times _______ operating high-pressure bottling machinery.",
          options: [
            { choice: "A", text: "while" },
            { choice: "B", text: "during" },
            { choice: "C", text: "throughout" },
            { choice: "D", text: "meanwhile" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "at all times _______ operating high-pressure bottling machinery",
          evidence: "at all times _______ operating high-pressure bottling machinery",
          explanation: "Quy tắc rút gọn mệnh đề trạng ngữ chỉ thời gian cùng chủ ngữ ('Packaging technicians'): liên từ 'while / when + V-ing' ('while operating' = 'while they are operating') -> (A) 'while'. Bẫy kinh điển nhất TOEIC là (B) 'during': 'during' là giới từ chỉ đi với DANH TỪ thuần túy (VD: 'during the operation'), TUYỆT ĐỐI không đi với 'V-ing + tân ngữ'! Bẫy (C) 'throughout' + danh từ; Bẫy (D) 'meanwhile' là trạng từ độc lập."
        }
      ]
    },

    // =========================================================================
    // PART 5 · SET 4: Q116–120 — Pronouns, Relatives & Participles
    // =========================================================================
    {
      range: "116-120",
      type: "Part 5 · Đại từ, MĐQH & Phân từ rút gọn",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 116-120 refer to the following incomplete sentences (Part 5 · Clauses & Pronouns).",
      introPrompt: "Questions 116-120 refer to the following incomplete sentences (Part 5 · Clauses & Pronouns).",
      passages: [
        {
          docId: "doc1",
          docLabel: "Phiếu đề Part 5 · Câu 116–120",
          kind: "info",
          eyebrow: "ETS READING PART 5 · PRONOUNS, RELATIVES & PARTICIPLES",
          title: "Chuyên đề 4: Đại từ phản thân, Mệnh đề quan hệ & Rút gọn phân từ (Q116–120)",
          subtitle: "Làm chủ 'whose', đại từ nhấn mạnh '-self' và rút gọn V-ing / V3-ed.",
          paragraphs: [
            {
              text: "116. Conference attendees _______ registration badges have been misplaced may request a temporary pass at the main lobby desk.",
              vi: "116. Những người tham dự hội nghị [mà thẻ đăng ký của họ - whose] bị thất lạc có thể yêu cầu cấp thẻ tạm tại quầy sảnh chính."
            },
            {
              text: "117. Rather than hiring an external catering firm, Ms. Delgado organized the client appreciation banquet _______.",
              vi: "117. Thay vì thuê một công ty tiệc lưu động bên ngoài, bà Delgado đã [đích thân tự mình - herself] tổ chức buổi tiệc tri ân khách hàng."
            },
            {
              text: "118. All laptops _______ to field sales representatives come preloaded with encrypted virtual private network software.",
              vi: "118. Tất cả máy tính xách tay [được cấp phát - issued] cho nhân viên kinh doanh thị trường đều được cài sẵn phần mềm mạng riêng ảo mã hóa."
            },
            {
              text: "119. Of the three architectural firms bidding on the museum expansion, Mercer Studio submitted the most detailed blueprint, whereas _______ provided only preliminary sketches.",
              vi: "119. Trong ba công ty kiến trúc đấu thầu dự án mở rộng bảo tàng, Mercer Studio đã nộp bản thiết kế chi tiết nhất, trong khi [hai công ty còn lại - the others] chỉ cung cấp các bản phác thảo sơ bộ."
            },
            {
              text: "120. Anyone _______ difficulties accessing the new payroll portal should contact the IT help desk at extension 408.",
              vi: "120. Bất kỳ ai [đang gặp phải - experiencing] khó khăn khi truy cập cổng thông tin bảng lương mới nên liên hệ bộ phận hỗ trợ CNTT ở số máy lẻ 408."
            }
          ]
        }
      ],
      transcript: "116. Conference attendees _______ registration badges have been misplaced may request a temporary pass at the main lobby desk.\n117. Rather than hiring an external catering firm, Ms. Delgado organized the client appreciation banquet _______.\n118. All laptops _______ to field sales representatives come preloaded with encrypted virtual private network software.\n119. Of the three architectural firms bidding on the museum expansion, Mercer Studio submitted the most detailed blueprint, whereas _______ provided only preliminary sketches.\n120. Anyone _______ difficulties accessing the new payroll portal should contact the IT help desk at extension 408.",
      translation: "116. Người tham dự hội nghị mà thẻ đăng ký bị thất lạc có thể xin thẻ tạm ở quầy sảnh chính.<br/>117. Thay vì thuê đơn vị tiệc bên ngoài, bà Delgado tự mình tổ chức buổi tiệc tri ân khách hàng.<br/>118. Tất cả laptop được cấp cho nhân viên kinh doanh thị trường đều cài sẵn phần mềm VPN mã hóa.<br/>119. Trong ba công ty kiến trúc đấu thầu mở rộng bảo tàng, Mercer Studio nộp bản vẽ chi tiết nhất, còn hai công ty còn lại chỉ đưa bản phác thảo sơ bộ.<br/>120. Bất kỳ ai gặp khó khăn khi truy cập cổng bảng lương mới nên liên hệ bàn hỗ trợ IT tại máy lẻ 408.",
      vocab: [
        "misplace a badge (v): làm thất lạc thẻ đeo",
        "client appreciation banquet (n): tiệc chiêu đãi tri ân khách hàng",
        "issue laptops to staff (v): cấp phát laptop cho nhân viên",
        "bid on a project (v): đấu thầu một dự án",
        "preliminary sketch (n): bản phác thảo sơ bộ",
        "payroll portal (n): cổng thông tin bảng lương"
      ],
      lexicalChunks: [
        { en: "client appreciation banquet", vi: "tiệc tri ân khách hàng", pos: "noun", ipa: "/ˈklaɪənt əˌpriːʃiˈeɪʃn ˈbæŋkwɪt/" },
        { en: "bid on", vi: "đấu thầu (dự án/hợp đồng)", pos: "verb", ipa: "/bɪd ɑːn/" },
        { en: "preliminary sketch", vi: "bản phác thảo sơ bộ", pos: "noun", ipa: "/prɪˈlɪmɪneri sketʃ/" },
        { en: "payroll portal", vi: "cổng thông tin bảng lương", pos: "noun", ipa: "/ˈpeɪroʊl ˈpɔːrtl/" }
      ],
      questions: [
        {
          num: 116,
          questionType: "detail",
          question: "Conference attendees _______ registration badges have been misplaced may request a temporary pass at the main lobby desk.",
          options: [
            { choice: "A", text: "who" },
            { choice: "B", text: "whom" },
            { choice: "C", text: "whose" },
            { choice: "D", text: "which" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "Conference attendees _______ registration badges have been misplaced",
          evidence: "Conference attendees _______ registration badges have been misplaced",
          explanation: "Đứng giữa danh từ chỉ người 'Conference attendees' và cụm danh từ không mạo từ 'registration badges' (thẻ đăng ký CỦA những người tham dự đó) + động từ 'have been misplaced' -> cần ĐẠI TỪ QUAN HỆ SỞ HỮU (C) 'whose'. Bẫy (A) 'who' theo sau phải là động từ hoặc đại từ chủ ngữ; Bẫy (B) 'whom' làm tân ngữ; Bẫy (D) 'which' thay cho vật và không biểu thị sở hữu trước danh từ."
        },
        {
          num: 117,
          questionType: "detail",
          question: "Rather than hiring an external catering firm, Ms. Delgado organized the client appreciation banquet _______.",
          options: [
            { choice: "A", text: "she" },
            { choice: "B", text: "her" },
            { choice: "C", text: "hers" },
            { choice: "D", text: "herself" }
          ],
          answer: "D",
          evidenceDoc: "doc1",
          evidenceQuote: "Ms. Delgado organized the client appreciation banquet _______.",
          evidence: "Ms. Delgado organized the client appreciation banquet _______.",
          explanation: "Câu đã đầy đủ hoàn chỉnh S + V + O ('Ms. Delgado organized the client appreciation banquet'), lại có ngữ cảnh đối lập 'Rather than hiring an external catering firm' (Thay vì thuê bên ngoài) -> chỗ trống cuối câu dùng ĐẠI TỪ PHẢN THÂN để nhấn mạnh 'đích thân/tự mình làm' -> (D) 'herself'. Bẫy (A) chủ ngữ; Bẫy (B) tân ngữ/tính từ sở hữu; Bẫy (C) đại từ sở hữu."
        },
        {
          num: 118,
          questionType: "detail",
          question: "All laptops _______ to field sales representatives come preloaded with encrypted virtual private network software.",
          options: [
            { choice: "A", text: "issue" },
            { choice: "B", text: "issued" },
            { choice: "C", text: "issuing" },
            { choice: "D", text: "are issued" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "All laptops _______ to field sales representatives come preloaded",
          evidence: "All laptops _______ to field sales representatives come preloaded",
          explanation: "Câu ĐÃ CÓ động từ chính chia thì là 'come' ('come preloaded with...')! Do đó chỗ trống phải là RÚT GỌN MỆNH ĐỀ QUAN HỆ bổ nghĩa cho 'All laptops' ('which are issued to...' -> rút gọn còn V3/ed bị động vì không có tân ngữ trực tiếp sau chỗ trống) -> (B) 'issued'. Bẫy cực nguy hiểm (D) 'are issued' khiến câu bị thừa 2 động từ chính không có đại từ quan hệ; Bẫy (A) nguyên mẫu; Bẫy (C) chủ động V-ing sai vì laptop được cấp phát chứ không tự cấp phát."
        },
        {
          num: 119,
          questionType: "detail",
          question: "Of the three architectural firms bidding on the museum expansion, Mercer Studio submitted the most detailed blueprint, whereas _______ provided only preliminary sketches.",
          options: [
            { choice: "A", text: "another" },
            { choice: "B", text: "other" },
            { choice: "C", text: "the others" },
            { choice: "D", text: "each other" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "Of the three architectural firms bidding on the museum expansion, Mercer Studio submitted the most detailed blueprint, whereas _______ provided",
          evidence: "Of the three architectural firms bidding on the museum expansion, Mercer Studio submitted the most detailed blueprint, whereas _______ provided",
          explanation: "Tổng tập hợp ĐÃ XÁC ĐỊNH rõ số lượng là 3 công ty ('Of the three architectural firms'): 1 công ty (Mercer Studio) đã nêu tên -> phần CÒN LẠI xác định gồm 2 công ty (số nhiều, đứng độc lập làm chủ ngữ cho 'provided') bắt buộc dùng (C) 'the others' (= the other two firms). Bẫy (A) 'another' chỉ 1 cái bất kỳ chưa xác định hết tập hợp; Bẫy (B) 'other' là tính từ phải có danh từ theo sau; Bẫy (D) 'each other' là đại từ tương hỗ 'lẫn nhau' không làm chủ ngữ."
        },
        {
          num: 120,
          questionType: "detail",
          question: "Anyone _______ difficulties accessing the new payroll portal should contact the IT help desk at extension 408.",
          options: [
            { choice: "A", text: "experiences" },
            { choice: "B", text: "experienced" },
            { choice: "C", text: "experiencing" },
            { choice: "D", text: "experience" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "Anyone _______ difficulties accessing the new payroll portal should contact",
          evidence: "Anyone _______ difficulties accessing the new payroll portal should contact",
          explanation: "Động từ chính của câu là 'should contact'. Cấu trúc kinh điển đầu thông báo TOEIC: 'Anyone / Those + V-ing + O ... should ...' (rút gọn của 'Anyone who is experiencing difficulties...') -> có tân ngữ 'difficulties' phía sau nên dùng phân từ CHỦ ĐỘNG (C) 'experiencing'. Bẫy (A) & (D) động từ chia thì làm câu thừa vị ngữ; Bẫy (B) quá khứ phân từ bị động (hoặc tính từ 'experienced' = giàu kinh nghiệm, không nhận tân ngữ 'difficulties')."
        }
      ]
    },

    // =========================================================================
    // PART 5 · SET 5: Q121–125 — Business Collocations (Cụm từ cố định ETS)
    // =========================================================================
    {
      range: "121-125",
      type: "Part 5 · Cụm từ cố định (Business Collocations)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 121-125 refer to the following incomplete sentences (Part 5 · Business Collocations).",
      introPrompt: "Questions 121-125 refer to the following incomplete sentences (Part 5 · Business Collocations).",
      passages: [
        {
          docId: "doc1",
          docLabel: "Phiếu đề Part 5 · Câu 121–125",
          kind: "info",
          eyebrow: "ETS READING PART 5 · HIGH-YIELD COLLOCATIONS",
          title: "Chuyên đề 5: Cụm từ cố định thương mại ăn điểm 3 giây (Q121–125)",
          subtitle: "Các tổ hợp từ đi kèm bất di bất dịch trong hợp đồng, bảo hành, nhân sự & tài chính.",
          paragraphs: [
            {
              text: "121. All replacement parts ordered through an authorized dealer are _______ for a full refund within thirty days of purchase.",
              vi: "121. Tất cả phụ tùng thay thế đặt qua đại lý ủy quyền đều [đủ điều kiện - eligible] được hoàn tiền toàn bộ trong vòng ba mươi ngày kể từ ngày mua."
            },
            {
              text: "122. Under the new municipal safety code, restaurants must _______ strictly with updated fire-inspection standards.",
              vi: "122. Theo bộ quy tắc an toàn mới của thành phố, các nhà hàng phải [tuân thủ - comply] nghiêm ngặt các tiêu chuẩn kiểm tra phòng cháy chữa cháy cập nhật."
            },
            {
              text: "123. Please _______ from using flash photography inside the rare manuscripts gallery, as intense light may damage delicate ink.",
              vi: "123. Vui lòng [kiềm chế/không - refrain] sử dụng đèn flash chụp ảnh bên trong phòng trưng bày bản thảo quý hiếm, vì ánh sáng mạnh có thể làm hỏng lớp mực mỏng manh."
            },
            {
              text: "124. Market research played a pivotal _______ in shaping the pricing strategy for our subscription platform.",
              vi: "124. Nghiên cứu thị trường đã đóng một [vai trò - role] then chốt trong việc định hình chiến lược giá cho nền tảng thuê bao của chúng tôi."
            },
            {
              text: "125. Customers who enroll in paperless billing will have their monthly service fee _______ for the first six months.",
              vi: "125. Khách hàng đăng ký nhận hóa đơn điện tử không giấy tờ sẽ được [miễn trừ - waived] phí dịch vụ hằng tháng trong sáu tháng đầu tiên."
            }
          ]
        }
      ],
      transcript: "121. All replacement parts ordered through an authorized dealer are _______ for a full refund within thirty days of purchase.\n122. Under the new municipal safety code, restaurants must _______ strictly with updated fire-inspection standards.\n123. Please _______ from using flash photography inside the rare manuscripts gallery, as intense light may damage delicate ink.\n124. Market research played a pivotal _______ in shaping the pricing strategy for our subscription platform.\n125. Customers who enroll in paperless billing will have their monthly service fee _______ for the first six months.",
      translation: "121. Mọi phụ tùng thay thế đặt qua đại lý ủy quyền đều đủ điều kiện hoàn tiền 100% trong vòng 30 ngày mua.<br/>122. Theo quy chuẩn an toàn mới của thành phố, các nhà hàng phải tuân thủ nghiêm ngặt tiêu chuẩn kiểm tra PCCC.<br/>123. Vui lòng hạn chế/không chụp ảnh có đèn flash trong phòng trưng bày bản thảo quý hiếm vì ánh sáng mạnh làm hỏng mực.<br/>124. Nghiên cứu thị trường đóng vai trò then chốt trong việc định hình chiến lược giá cho nền tảng thuê bao của chúng tôi.<br/>125. Khách hàng đăng ký hóa đơn điện tử sẽ được miễn phí dịch vụ hằng tháng trong 6 tháng đầu.",
      vocab: [
        "be eligible for (phr): đủ điều kiện nhận quyền lợi gì",
        "authorized dealer (n): đại lý được ủy quyền",
        "comply with standards (v): tuân thủ các tiêu chuẩn",
        "refrain from + V-ing (v): kiềm chế / tránh làm việc gì",
        "play a pivotal role in (phr): đóng vai trò then chốt trong",
        "waive a fee (v): miễn bỏ một khoản phí"
      ],
      lexicalChunks: [
        { en: "be eligible for", vi: "đủ điều kiện cho", pos: "phrase", ipa: "/bi ˈelɪdʒəbl fɔːr/" },
        { en: "comply with", vi: "tuân thủ (luật/quy định)", pos: "verb", ipa: "/kəmˈplaɪ wɪð/" },
        { en: "refrain from", vi: "kiềm chế, tránh làm gì", pos: "verb", ipa: "/rɪˈfreɪn frəm/" },
        { en: "waive a fee", vi: "miễn một khoản lệ phí", pos: "verb", ipa: "/weɪv ə fiː/" }
      ],
      questions: [
        {
          num: 121,
          questionType: "vocab_in_context",
          question: "All replacement parts ordered through an authorized dealer are _______ for a full refund within thirty days of purchase.",
          options: [
            { choice: "A", text: "capable" },
            { choice: "B", text: "eligible" },
            { choice: "C", text: "probable" },
            { choice: "D", text: "accessible" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "are _______ for a full refund within thirty days of purchase",
          evidence: "are _______ for a full refund within thirty days of purchase",
          explanation: "Collocation kinh điển của ETS về chính sách hoàn tiền/khuyến mãi: 'be ELIGIBLE FOR + quyền lợi/hoàn tiền' (đủ điều kiện được hưởng...) -> (B) 'eligible'. Bẫy (A) 'capable' đi với giới từ 'OF' ('capable of doing'); Bẫy (C) 'probable' (có khả năng xảy ra, không đi với 'parts are probable for'); Bẫy (D) 'accessible TO' (có thể tiếp cận đối với ai)."
        },
        {
          num: 122,
          questionType: "vocab_in_context",
          question: "Under the new municipal safety code, restaurants must _______ strictly with updated fire-inspection standards.",
          options: [
            { choice: "A", text: "abide" },
            { choice: "B", text: "observe" },
            { choice: "C", text: "comply" },
            { choice: "D", text: "adhere" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "must _______ strictly with updated fire-inspection standards",
          evidence: "must _______ strictly with updated fire-inspection standards",
          explanation: "Bốn động từ ĐỀU mang nghĩa 'tuân thủ', nhưng quyết định ăn điểm nằm ở GIỚI TỪ 'WITH' phía sau! Bộ tứ 'tuân thủ' bắt buộc thuộc lòng cho TOEIC: (C) 'comply WITH' (đúng!), còn (A) 'abide BY', (B) 'observe + tân ngữ trực tiếp (không có giới từ)', và (D) 'adhere TO'!"
        },
        {
          num: 123,
          questionType: "vocab_in_context",
          question: "Please _______ from using flash photography inside the rare manuscripts gallery, as intense light may damage delicate ink.",
          options: [
            { choice: "A", text: "avoid" },
            { choice: "B", text: "refrain" },
            { choice: "C", text: "prevent" },
            { choice: "D", text: "hesitate" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "Please _______ from using flash photography inside the rare manuscripts gallery",
          evidence: "Please _______ from using flash photography inside the rare manuscripts gallery",
          explanation: "Cấu trúc lịch sự yêu cầu khách không làm gì trên biển báo/nội quy TOEIC: 'Please REFRAIN FROM + V-ing' (Vui lòng kiềm chế/không làm gì) -> (B) 'refrain'. Bẫy cực gắt (A) 'avoid': 'avoid + V-ing' trực tiếp KHÔNG có 'from'; Bẫy (C) 'prevent + SOMEBODY + from V-ing' cần tân ngữ ở giữa; Bẫy (D) 'hesitate TO V' (ngần ngại làm gì)."
        },
        {
          num: 124,
          questionType: "vocab_in_context",
          question: "Market research played a pivotal _______ in shaping the pricing strategy for our subscription platform.",
          options: [
            { choice: "A", text: "role" },
            { choice: "B", text: "duty" },
            { choice: "C", text: "task" },
            { choice: "D", text: "charge" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "Market research played a pivotal _______ in shaping the pricing strategy",
          evidence: "Market research played a pivotal _______ in shaping the pricing strategy",
          explanation: "Cụm collocation cố định: 'play a pivotal / key / vital / crucial ROLE in + V-ing/Noun' (đóng vai trò then chốt trong việc gì) -> (A) 'role'. Bẫy (B) 'duty' (bổn phận), (C) 'task' (nhiệm vụ), (D) 'charge' (trách nhiệm — 'in charge of') đều không kết hợp với động từ 'play'."
        },
        {
          num: 125,
          questionType: "vocab_in_context",
          question: "Customers who enroll in paperless billing will have their monthly service fee _______ for the first six months.",
          options: [
            { choice: "A", text: "waived" },
            { choice: "B", text: "resigned" },
            { choice: "C", text: "relieved" },
            { choice: "D", text: "spared" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "will have their monthly service fee _______ for the first six months",
          evidence: "will have their monthly service fee _______ for the first six months",
          explanation: "Cấu trúc truyền khiến bị động 'have + vật (service fee) + V3/ed' kết hợp collocation tài chính – ngân hàng hạng C1 của ETS: 'waive a fee / penalty / requirement' (miễn trừ một khoản phí/điều kiện) -> (A) 'waived'. Bẫy (B) 'resign' (từ chức); Bẫy (C) 'relieve' (giảm đau/căng thẳng); Bẫy (D) 'spare' (dành ra thời gian/tha cho ai)."
        }
      ]
    },

    // =========================================================================
    // PART 5 · SET 6: Q126–130 — Advanced Vocabulary 850–990+
    // =========================================================================
    {
      range: "126-130",
      type: "Part 5 · Từ vựng nâng cao 850–990+",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 126-130 refer to the following incomplete sentences (Part 5 · Advanced Vocabulary).",
      introPrompt: "Questions 126-130 refer to the following incomplete sentences (Part 5 · Advanced Vocabulary).",
      passages: [
        {
          docId: "doc1",
          docLabel: "Phiếu đề Part 5 · Câu 126–130",
          kind: "info",
          eyebrow: "ETS READING PART 5 · 900+ EXECUTIVE VOCABULARY",
          title: "Chuyên đề 6: Từ vựng phân hóa 850–990+ & Cặp từ dễ nhầm lẫn (Q126–130)",
          subtitle: "Chinh phục 5 câu từ vựng thương mại sát thủ thường quyết định mốc 900+.",
          paragraphs: [
            {
              text: "126. The merger between Norstar Logistics and Crestline Freight remains _______ until federal regulators complete their antitrust review.",
              vi: "126. Thương vụ sáp nhập giữa Norstar Logistics và Crestline Freight vẫn mang tính [dự kiến/chưa chính thức - tentative] cho đến khi cơ quan quản lý liên bang hoàn tất cuộc rà soát chống độc quyền."
            },
            {
              text: "127. Any travel expenses _______ during out-of-town client consultations will be reimbursed within two pay periods upon submission of itemized receipts.",
              vi: "127. Bất kỳ chi phí đi lại nào [phát sinh - incurred] trong các buổi tư vấn khách hàng ngoại tỉnh sẽ được hoàn trả trong vòng hai kỳ lương sau khi nộp hóa đơn chi tiết từng khoản."
            },
            {
              text: "128. The newly appointed quality director implemented _______ testing protocols that reduced defective output by nearly forty percent.",
              vi: "128. Tân giám đốc chất lượng đã áp dụng các quy trình kiểm định [nghiêm ngặt/khắt khe - stringent] giúp giảm gần bốn mươi phần trăm sản phẩm lỗi."
            },
            {
              text: "129. Because the two candidates possessed _______ qualifications, the hiring committee invited both back for a final panel interview.",
              vi: "129. Vì hai ứng viên sở hữu trình độ năng lực [tương đương nhau - comparable], hội đồng tuyển dụng đã mời cả hai quay lại dự vòng phỏng vấn hội đồng cuối cùng."
            },
            {
              text: "130. Starting July 1, the human resources portal will _______ archive inactive job applications after ninety days.",
              vi: "130. Bắt đầu từ ngày 1 tháng 7, cổng thông tin nhân sự sẽ [tự động - automatically] lưu trữ các hồ sơ ứng tuyển không hoạt động sau chín mươi ngày."
            }
          ]
        }
      ],
      transcript: "126. The merger between Norstar Logistics and Crestline Freight remains _______ until federal regulators complete their antitrust review.\n127. Any travel expenses _______ during out-of-town client consultations will be reimbursed within two pay periods upon submission of itemized receipts.\n128. The newly appointed quality director implemented _______ testing protocols that reduced defective output by nearly forty percent.\n129. Because the two candidates possessed _______ qualifications, the hiring committee invited both back for a final panel interview.\n130. Starting July 1, the human resources portal will _______ archive inactive job applications after ninety days.",
      translation: "126. Thương vụ sáp nhập giữa Norstar Logistics và Crestline Freight vẫn chỉ mang tính dự kiến/chưa chốt cho đến khi cơ quan liên bang hoàn tất rà soát chống độc quyền.<br/>127. Mọi chi phí công tác phát sinh trong các chuyến tư vấn khách hàng ngoại tỉnh sẽ được bồi hoàn trong 2 kỳ lương khi nộp hóa đơn chi tiết.<br/>128. Tân giám đốc chất lượng áp dụng quy trình kiểm định nghiêm ngặt giúp giảm gần 40% hàng lỗi.<br/>129. Vì hai ứng viên có năng lực tương đương nhau, hội đồng tuyển dụng mời cả hai dự vòng phỏng vấn cuối.<br/>130. Từ 1/7, cổng thông tin nhân sự sẽ tự động lưu trữ hồ sơ ứng tuyển không hoạt động sau 90 ngày.",
      vocab: [
        "tentative (adj): dự kiến, tạm thời, chưa chốt chính thức",
        "incur expenses (v): phát sinh / gánh chịu chi phí",
        "itemized receipt (n): hóa đơn liệt kê chi tiết từng khoản",
        "stringent protocol (n): quy trình nghiêm ngặt / khắt khe",
        "defective output (n): sản lượng hàng bị lỗi",
        "comparable qualifications (n): trình độ tương đương nhau"
      ],
      lexicalChunks: [
        { en: "incur expenses", vi: "phát sinh chi phí", pos: "verb", ipa: "/ɪnˈkɜːr ɪkˈspensɪz/" },
        { en: "itemized receipt", vi: "hóa đơn kê chi tiết", pos: "noun", ipa: "/ˈaɪtəmaɪzd rɪˈsiːt/" },
        { en: "stringent protocol", vi: "quy trình khắt khe", pos: "noun", ipa: "/ˈstrɪndʒənt ˈproʊtəkɔːl/" },
        { en: "comparable qualifications", vi: "năng lực tương đương", pos: "noun", ipa: "/ˈkɑːmpərəbl ˌkwɑːlɪfɪˈkeɪʃnz/" }
      ],
      questions: [
        {
          num: 126,
          questionType: "vocab_in_context",
          question: "The merger between Norstar Logistics and Crestline Freight remains _______ until federal regulators complete their antitrust review.",
          options: [
            { choice: "A", text: "tentative" },
            { choice: "B", text: "consecutive" },
            { choice: "C", text: "affluent" },
            { choice: "D", text: "obsolete" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "remains _______ until federal regulators complete their antitrust review",
          evidence: "remains _______ until federal regulators complete their antitrust review",
          explanation: "Cơ quan quản lý chưa duyệt xong ('until federal regulators complete their antitrust review') nên thương vụ sáp nhập vẫn chưa chốt chính thức, chỉ ở mức tạm thời/dự kiến -> (A) 'tentative' (dự kiến, chưa chắc chắn). Bẫy (B) 'consecutive' (liên tiếp); Bẫy (C) 'affluent' (giàu có); Bẫy (D) 'obsolete' (lỗi thời)."
        },
        {
          num: 127,
          questionType: "vocab_in_context",
          question: "Any travel expenses _______ during out-of-town client consultations will be reimbursed within two pay periods upon submission of itemized receipts.",
          options: [
            { choice: "A", text: "incurred" },
            { choice: "B", text: "provoked" },
            { choice: "C", text: "convinced" },
            { choice: "D", text: "delegated" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "Any travel expenses _______ during out-of-town client consultations will be reimbursed",
          evidence: "Any travel expenses _______ during out-of-town client consultations will be reimbursed",
          explanation: "Cặp từ vựng kim cương trong chủ đề kế toán/công tác phí của ETS: 'incur expenses / costs / debts / losses' -> dạng rút gọn bị động bổ nghĩa cho 'travel expenses' là 'expenses INCURRED during...' (chi phí phát sinh trong suốt...) -> (A) 'incurred'. Bẫy (B) 'provoked' (khiêu khích); Bẫy (C) 'convinced' (thuyết phục); Bẫy (D) 'delegated' (ủy quyền nhiệm vụ)."
        },
        {
          num: 128,
          questionType: "vocab_in_context",
          question: "The newly appointed quality director implemented _______ testing protocols that reduced defective output by nearly forty percent.",
          options: [
            { choice: "A", text: "lenient" },
            { choice: "B", text: "stringent" },
            { choice: "C", text: "complacent" },
            { choice: "D", text: "ambiguous" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "implemented _______ testing protocols that reduced defective output by nearly forty percent",
          evidence: "implemented _______ testing protocols that reduced defective output by nearly forty percent",
          explanation: "Quy trình kiểm định chất lượng nào giúp giảm tới gần 40% sản phẩm lỗi ('reduced defective output')? Đó phải là các quy trình NGHIÊM NGẶT, KHẮT KHE -> (B) 'stringent' (= strict / rigorous). Bẫy (A) 'lenient' (lỏng lẻo, khoan dung — ngược nghĩa); Bẫy (C) 'complacent' (tự mãn); Bẫy (D) 'ambiguous' (mơ hồ)."
        },
        {
          num: 129,
          questionType: "vocab_in_context",
          question: "Because the two candidates possessed _______ qualifications, the hiring committee invited both back for a final panel interview.",
          options: [
            { choice: "A", text: "comparable" },
            { choice: "B", text: "comparative" },
            { choice: "C", text: "reluctant" },
            { choice: "D", text: "fragile" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "Because the two candidates possessed _______ qualifications, the hiring committee invited both back",
          evidence: "Because the two candidates possessed _______ qualifications, the hiring committee invited both back",
          explanation: "Cặp tính từ cực dễ nhầm ở band 900+: (A) 'comparable' = tương đương nhau, ngang sức ngang tài (tương xứng về chất lượng/trình độ -> lý do hội đồng mời CẢ HAI vào vòng cuối!); còn Bẫy (B) 'comparative' = mang tính so sánh / tương đối (VD: comparative study — nghiên cứu đối chiếu). Bẫy (C) 'reluctant' (miễn cưỡng); Bẫy (D) 'fragile' (dễ vỡ)."
        },
        {
          num: 130,
          questionType: "vocab_in_context",
          question: "Starting July 1, the human resources portal will _______ archive inactive job applications after ninety days.",
          options: [
            { choice: "A", text: "mutually" },
            { choice: "B", text: "narrowly" },
            { choice: "C", text: "automatically" },
            { choice: "D", text: "cordially" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "the human resources portal will _______ archive inactive job applications after ninety days",
          evidence: "the human resources portal will _______ archive inactive job applications after ninety days",
          explanation: "Chủ ngữ là hệ thống phần mềm ('the human resources portal') xử lý hồ sơ không hoạt động sau 90 ngày -> hành động diễn ra TỰ ĐỘNG trên hệ thống -> (C) 'automatically'. Bẫy (A) 'mutually' (lẫn nhau, đôi bên); Bẫy (B) 'narrowly' (sát nút); Bẫy (D) 'cordially' (thân mật — thường đi với 'cordially invited')."
        }
      ]
    }
  ];

  const PART6_TALKS = [
    // =========================================================================
    // PART 6 · PASSAGE 1: Q131–134 — E-mail (LedgerFlow Cloud Migration)
    // =========================================================================
    {
      range: "131-134",
      type: "Part 6 · E-mail (Nâng cấp hệ thống kế toán)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 131-134 refer to the following e-mail.",
      introPrompt: "Questions 131-134 refer to the following e-mail.",
      passages: [
        {
          docId: "doc1",
          docLabel: "Đoạn văn 1 · Thư điện tử (Part 6 E-mail)",
          kind: "email",
          meta: {
            To: "All Accounting & Procurement Staff",
            From: "Marcus Vance, Chief Information Officer",
            Subject: "Transition to LedgerFlow Cloud 4.0",
            Date: "October 14"
          },
          paragraphs: [
            { text: "Dear Colleagues,", vi: "Thân gửi các đồng nghiệp," },
            {
              text: "Next Monday, October 21, our company will officially transition from our legacy bookkeeping software to LedgerFlow Cloud 4.0. This upgrade __(131)__ faster invoice reconciliation and real-time expense tracking across all regional offices.",
              vi: "Vào Thứ Hai tuần tới, ngày 21 tháng 10, công ty chúng ta sẽ chính thức chuyển đổi từ phần mềm kế toán cũ sang LedgerFlow Cloud 4.0. Bản nâng cấp này [(131) sẽ mang lại - will enable] khả năng đối soát hóa đơn nhanh hơn và theo dõi chi phí theo thời gian thực trên toàn bộ văn phòng khu vực."
            },
            {
              text: "To prepare for the migration, the IT team will temporarily suspend access to the current platform from Friday at 7:00 P.M. until Sunday at noon. __(132)__, please save and export any draft purchase orders before leaving work on Friday afternoon.",
              vi: "Để chuẩn bị cho quá trình chuyển đổi dữ liệu, đội ngũ CNTT sẽ tạm ngừng quyền truy cập vào nền tảng hiện tại từ 7 giờ tối Thứ Sáu đến trưa Chủ Nhật. [(132) Do đó - Therefore], vui lòng lưu và xuất mọi đơn đặt hàng nháp trước khi tan làm vào chiều Thứ Sáu."
            },
            {
              text: "All staff members who process vendor payments are required to complete a 45-minute interactive tutorial prior to October 25. __(134)__ Moreover, department leads will host __(133)__ coaching sessions throughout the first week of November. If you encounter any login issues once the new portal launches, please submit a ticket to helpdesk@vancecorp.com.",
              vi: "Tất cả nhân viên xử lý thanh toán nhà cung cấp bắt buộc phải hoàn thành bài hướng dẫn tương tác dài 45 phút trước ngày 25 tháng 10. [(134) Đường dẫn truy cập khóa học này đã được gửi vào hộp thư của bạn sáng nay.] Hơn nữa, các trưởng bộ phận sẽ tổ chức các buổi kèm cặp [(133) bổ sung - supplemental] trong suốt tuần đầu tiên của tháng 11. Nếu gặp bất kỳ sự cố đăng nhập nào khi cổng thông tin mới đi vào hoạt động, vui lòng gửi yêu cầu tới helpdesk@vancecorp.com."
            },
            { text: "Best regards,\nMarcus Vance", vi: "Trân trọng,\nMarcus Vance" }
          ]
        }
      ],
      transcript: "To: All Accounting & Procurement Staff | From: Marcus Vance, CIO | Subject: Transition to LedgerFlow Cloud 4.0 | Date: October 14\nNext Monday, October 21, our company will officially transition from our legacy bookkeeping software to LedgerFlow Cloud 4.0. This upgrade __(131)__ faster invoice reconciliation and real-time expense tracking across all regional offices.\nTo prepare for the migration, the IT team will temporarily suspend access to the current platform from Friday at 7:00 P.M. until Sunday at noon. __(132)__, please save and export any draft purchase orders before leaving work on Friday afternoon.\nAll staff members who process vendor payments are required to complete a 45-minute interactive tutorial prior to October 25. __(134)__ Moreover, department leads will host __(133)__ coaching sessions throughout the first week of November. If you encounter any login issues once the new portal launches, please submit a ticket to helpdesk@vancecorp.com.",
      translation: "Gửi: Toàn bộ Nhân viên Kế toán & Mua hàng | Từ: Marcus Vance, Giám đốc CNTT | Ngày: 14/10<br/>Thứ Hai tuần tới (21/10), công ty sẽ chính thức chuyển sang LedgerFlow Cloud 4.0. Bản nâng cấp này (131) sẽ giúp đối soát hóa đơn nhanh hơn và theo dõi chi phí thời gian thực. Đội IT sẽ tạm khóa hệ thống hiện tại từ 19h Thứ Sáu đến trưa Chủ Nhật; (132) do đó, vui lòng lưu và xuất các đơn mua hàng nháp trước chiều Thứ Sáu. Mọi nhân viên thanh toán nhà cung cấp phải hoàn thành bài hướng dẫn 45 phút trước 25/10. (134) [Đường link đăng ký bài học đã được gửi vào email của bạn sáng nay.] Ngoài ra, các trưởng bộ phận sẽ tổ chức các buổi hướng dẫn (133) bổ sung trong tuần đầu tháng 11.",
      vocab: [
        "invoice reconciliation (n): việc đối soát hóa đơn",
        "suspend access (v): tạm ngừng quyền truy cập",
        "purchase order (n): đơn đặt hàng thu mua",
        "vendor payment (n): khoản thanh toán cho nhà cung cấp",
        "interactive tutorial (n): bài hướng dẫn tương tác",
        "supplemental session (n): buổi hướng dẫn bổ sung"
      ],
      lexicalChunks: [
        { en: "invoice reconciliation", vi: "việc đối soát hóa đơn", pos: "noun", ipa: "/ˈɪnvɔɪs ˌrekənsɪliˈeɪʃn/" },
        { en: "suspend access", vi: "tạm ngưng quyền truy cập", pos: "verb", ipa: "/səˈspend ˈækses/" },
        { en: "purchase order", vi: "đơn đặt mua hàng", pos: "noun", ipa: "/ˈpɜːrtʃəs ˈɔːrdər/" },
        { en: "supplemental coaching", vi: "hướng dẫn bổ trợ thêm", pos: "noun", ipa: "/ˌsʌplɪˈmentl ˈkoʊtʃɪŋ/" }
      ],
      questions: [
        {
          num: 131,
          questionType: "detail",
          question: "Choose the best word or phrase for blank (131).",
          options: [
            { choice: "A", text: "enabled" },
            { choice: "B", text: "will enable" },
            { choice: "C", text: "had enabled" },
            { choice: "D", text: "is enabled" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "Next Monday, October 21, our company will officially transition from our legacy bookkeeping software to LedgerFlow Cloud 4.0. This upgrade __(131)__ faster invoice reconciliation",
          evidence: "Next Monday, October 21, our company will officially transition from our legacy bookkeeping software to LedgerFlow Cloud 4.0. This upgrade __(131)__ faster invoice reconciliation",
          explanation: "Câu liền trước thiết lập mốc thời gian TƯƠNG LAI ('Next Monday, October 21, our company will officially transition...'). Bản nâng cấp chưa diễn ra, và theo sau chỗ trống có tân ngữ trực tiếp 'faster invoice reconciliation' -> chia tương lai đơn chủ động (B) 'will enable'. Bẫy (A) & (C) quá khứ; Bẫy (D) bị động sai vì có tân ngữ phía sau."
        },
        {
          num: 132,
          questionType: "inference",
          question: "Choose the best transition word for blank (132).",
          options: [
            { choice: "A", text: "Nevertheless" },
            { choice: "B", text: "Otherwise" },
            { choice: "C", text: "Therefore" },
            { choice: "D", text: "Meanwhile" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "suspend access to the current platform from Friday at 7:00 P.M. until Sunday at noon. __(132)__, please save and export any draft purchase orders",
          evidence: "suspend access to the current platform from Friday at 7:00 P.M. until Sunday at noon. __(132)__, please save and export any draft purchase orders",
          explanation: "Câu trước nêu NGUYÊN NHÂN (IT sẽ tạm khóa hệ thống từ tối thứ Sáu đến trưa Chủ Nhật), câu sau nêu HỆ QUẢ / HÀNH ĐỘNG CẦN LÀM (vui lòng lưu và xuất đơn hàng nháp trước chiều thứ Sáu) -> cần trạng từ liên kết chỉ kết quả (C) 'Therefore' (Do đó, vì vậy). Bẫy (A) 'Tuy nhiên' (tương phản); Bẫy (B) 'Nếu không thì'; Bẫy (D) 'Trong lúc đó'."
        },
        {
          num: 133,
          questionType: "vocab_in_context",
          question: "Choose the best adjective for blank (133).",
          options: [
            { choice: "A", text: "supplemental" },
            { choice: "B", text: "reluctant" },
            { choice: "C", text: "defective" },
            { choice: "D", text: "obsolete" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "Moreover, department leads will host __(133)__ coaching sessions throughout the first week of November.",
          evidence: "Moreover, department leads will host __(133)__ coaching sessions throughout the first week of November.",
          explanation: "Ở câu đầu đoạn 3, nhân viên đã học bài hướng dẫn bắt buộc 45 phút trước 25/10; sau đó từ nối 'Moreover' (Hơn nữa) giới thiệu các buổi kèm cặp BỔ SUNG / BỔ TRỢ do trưởng bộ phận tổ chức đầu tháng 11 -> (A) 'supplemental' (bổ sung, tăng cường). Bẫy (B) 'miễn cưỡng'; Bẫy (C) 'bị lỗi'; Bẫy (D) 'lỗi thời'."
        },
        {
          num: 134,
          questionType: "sentence_insertion",
          question: "Choose the sentence that best completes the text at (134).",
          options: [
            { choice: "A", text: "A link to access this training module was sent to your inbox earlier today." },
            { choice: "B", text: "Several regional offices have decided to retain the old software indefinitely." },
            { choice: "C", text: "Vendor invoices from last year have already been shredded by the archive team." },
            { choice: "D", text: "The weekend maintenance window has been canceled due to low turnout." }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "required to complete a 45-minute interactive tutorial prior to October 25. __(134)__ Moreover, department leads will host",
          evidence: "required to complete a 45-minute interactive tutorial prior to October 25. __(134)__ Moreover, department leads will host",
          explanation: "Kỹ thuật liên kết câu Part 6 (Cohesion & Reference): Câu ngay trước (134) vừa nhắc đến 'a 45-minute interactive tutorial' (bài hướng dẫn tương tác dài 45 phút). Trong (A), cụm chỉ định 'this training module' quy chiếu hoàn hảo về 'a 45-minute interactive tutorial' và hướng dẫn cách nhân viên mở bài học đó! Bẫy (B) mâu thuẫn với toàn bài chuyển đổi chính thức; Bẫy (C) lạc đề hủy tài liệu; Bẫy (D) mâu thuẫn đoạn 2."
        }
      ]
    },

    // =========================================================================
    // PART 6 · PASSAGE 2: Q135–138 — Notice (Westbridge Commuter Subsidy)
    // =========================================================================
    {
      range: "135-138",
      type: "Part 6 · Notice (Trợ cấp vé tàu đi làm)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 135-138 refer to the following notice.",
      introPrompt: "Questions 135-138 refer to the following notice.",
      passages: [
        {
          docId: "doc1",
          docLabel: "Đoạn văn 2 · Thông báo nhân sự (Part 6 Notice)",
          kind: "notice",
          title: "Employee Green Commuter Benefit Program",
          subtitle: "Human Resources Division · Halcyon BioLabs",
          paragraphs: [
            {
              text: "Beginning November 1, Halcyon BioLabs will expand its Green Commuter Benefit Program to encourage sustainable travel to our downtown campus. Full-time employees who commute via municipal rail, express bus, or ferry will receive a monthly __(135)__ covering up to 75 percent of their transit pass cost.",
              vi: "Bắt đầu từ ngày 1 tháng 11, Halcyon BioLabs sẽ mở rộng Chương trình Phúc lợi Đi lại Xanh nhằm khuyến khích di chuyển bền vững tới khuôn viên trung tâm. Nhân viên toàn thời gian đi làm bằng tàu đô thị, xe buýt nhanh hoặc phà sẽ nhận được [(135) khoản trợ cấp - subsidy] hằng tháng chi trả tới 75% chi phí thẻ đi lại."
            },
            {
              text: "__(136)__ In addition, bicycle commuters can now claim up to $180 per year toward helmet purchases and routine bike tune-ups at participating local shops.",
              vi: "[(136) Trước đây, công ty chỉ hỗ trợ một khoản hoàn tiền cố định 30 đô la mỗi tháng cho người đi phương tiện công cộng.] Ngoài ra, người đi làm bằng xe đạp nay có thể thanh toán tối đa $180 mỗi năm cho việc mua mũ bảo hiểm và bảo dưỡng xe định kỳ tại các cửa hàng địa phương liên kết."
            },
            {
              text: "To enroll in the updated program, employees must upload a digital copy of their monthly transit receipt __(137)__ the tenth day of each month. Reimbursements __(138)__ directly to employees' regular end-of-month paychecks.",
              vi: "Để đăng ký chương trình cập nhật, nhân viên phải tải lên bản sao kỹ thuật số biên lai vé tháng [(137) trước/muộn nhất vào - by] ngày mùng mười hằng tháng. Khoản tiền hoàn trả [(138) sẽ được cộng - will be added] trực tiếp vào kỳ lương cuối tháng thông thường của nhân viên."
            }
          ]
        }
      ],
      transcript: "Employee Green Commuter Benefit Program — Human Resources Division · Halcyon BioLabs\nBeginning November 1, Halcyon BioLabs will expand its Green Commuter Benefit Program to encourage sustainable travel to our downtown campus. Full-time employees who commute via municipal rail, express bus, or ferry will receive a monthly __(135)__ covering up to 75 percent of their transit pass cost.\n__(136)__ In addition, bicycle commuters can now claim up to $180 per year toward helmet purchases and routine bike tune-ups at participating local shops.\nTo enroll in the updated program, employees must upload a digital copy of their monthly transit receipt __(137)__ the tenth day of each month. Reimbursements __(138)__ directly to employees' regular end-of-month paychecks.",
      translation: "Chương trình Phúc lợi Đi lại Xanh — Phòng Nhân sự Halcyon BioLabs<br/>Từ 1/11, Halcyon BioLabs mở rộng chương trình Phúc lợi Đi lại Xanh. Nhân viên toàn thời gian đi tàu, xe buýt nhanh hoặc phà sẽ nhận khoản (135) trợ cấp hằng tháng lên tới 75% giá vé. (136) [Trước đây, công ty chỉ cấp mức hỗ trợ cố định $30 mỗi tháng cho người dùng giao thông công cộng.] Ngoài ra, người đi xe đạp được thanh toán tới $180/năm mua mũ bảo hiểm và bảo dưỡng xe. Nhân viên cần tải biên lai vé tháng lên hệ thống (137) trước ngày 10 mỗi tháng; tiền hoàn (138) sẽ được cộng thẳng vào bảng lương cuối tháng.",
      vocab: [
        "commuter subsidy (n): khoản trợ cấp đi lại cho nhân viên",
        "transit pass (n): thẻ vé phương tiện công cộng",
        "routine tune-up (n): bảo dưỡng / căn chỉnh định kỳ",
        "participating shop (n): cửa hàng có tham gia liên kết",
        "upload a receipt (v): tải biên lai lên hệ thống",
        "end-of-month paycheck (n): kỳ lương cuối tháng"
      ],
      lexicalChunks: [
        { en: "commuter subsidy", vi: "khoản trợ cấp đi lại", pos: "noun", ipa: "/kəˈmjuːtər ˈsʌbsədi/" },
        { en: "transit pass", vi: "thẻ đi tàu xe công cộng", pos: "noun", ipa: "/ˈtrænzɪt pæs/" },
        { en: "routine tune-up", vi: "bảo dưỡng định kỳ", pos: "noun", ipa: "/ruːˈtiːn ˈtuːn ʌp/" },
        { en: "participating local shops", vi: "các cửa hàng liên kết tại địa phương", pos: "noun", ipa: "/pɑːrˈtɪsɪpeɪtɪŋ ˈloʊkl ʃɑːps/" }
      ],
      questions: [
        {
          num: 135,
          questionType: "vocab_in_context",
          question: "Choose the best noun for blank (135).",
          options: [
            { choice: "A", text: "penalty" },
            { choice: "B", text: "subsidy" },
            { choice: "C", text: "vacancy" },
            { choice: "D", text: "itinerary" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "will receive a monthly __(135)__ covering up to 75 percent of their transit pass cost",
          evidence: "will receive a monthly __(135)__ covering up to 75 percent of their transit pass cost",
          explanation: "Khoản tiền hỗ trợ do công ty chi trả giúp trang trải tới 75% chi phí vé tàu xe công cộng của nhân viên được gọi chính xác là (B) 'subsidy' (khoản trợ cấp / hỗ trợ giá). Bẫy (A) 'penalty' (tiền phạt); Bẫy (C) 'vacancy' (vị trí trống); Bẫy (D) 'itinerary' (lịch trình chuyến đi)."
        },
        {
          num: 136,
          questionType: "sentence_insertion",
          question: "Choose the sentence that best completes the text at (136).",
          options: [
            { choice: "A", text: "Previously, the company offered only a flat $30 monthly allowance for public transit users." },
            { choice: "B", text: "All laboratory technicians must relocate to the suburban facility before November." },
            { choice: "C", text: "Parking permits for private SUVs have been reduced in price by fifty percent." },
            { choice: "D", text: "Ferry service across Westbridge Harbor was permanently discontinued five years ago." }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "__(136)__ In addition, bicycle commuters can now claim up to $180 per year",
          evidence: "__(136)__ In addition, bicycle commuters can now claim up to $180 per year",
          explanation: "Đoạn 1 vừa giới thiệu việc MỞ RỘNG chương trình ('expand its Green Commuter Benefit Program... covering up to 75 percent'). Câu (A) đối chiếu hoàn hảo mức cũ ('Previously, the company offered only a flat $30 monthly allowance...') để làm nổi bật quy mô mở rộng lên 75%, trước khi câu kế tiếp bổ sung thêm quyền lợi mới ('In addition, bicycle commuters can NOW claim...'). Bẫy (B) lạc đề chuyển cơ sở; Bẫy (C) đi ngược mục tiêu giao thông xanh; Bẫy (D) mâu thuẫn đoạn 1 có nhắc 'or ferry'."
        },
        {
          num: 137,
          questionType: "detail",
          question: "Choose the best preposition for blank (137).",
          options: [
            { choice: "A", text: "until" },
            { choice: "B", text: "by" },
            { choice: "C", text: "since" },
            { choice: "D", text: "among" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "must upload a digital copy of their monthly transit receipt __(137)__ the tenth day of each month",
          evidence: "must upload a digital copy of their monthly transit receipt __(137)__ the tenth day of each month",
          explanation: "Quy tắc phân biệt kinh điển 'BY' vs 'UNTIL' trong TOEIC: Động từ 'upload' (tải biên lai lên) là hành động hoàn tất tại một thời điểm trước hạn chót (deadline), KHÔNG phải trạng thái kéo dài liên tục -> bắt buộc dùng (B) 'by' (trước / muộn nhất là vào ngày 10). Bẫy (A) 'until' chỉ dùng cho hành động/trạng thái kéo dài liên tục (remain open until...); Bẫy (C) 'since' (kể từ khi); Bẫy (D) 'among' (trong số)."
        },
        {
          num: 138,
          questionType: "detail",
          question: "Choose the best verb form for blank (138).",
          options: [
            { choice: "A", text: "will add" },
            { choice: "B", text: "adding" },
            { choice: "C", text: "will be added" },
            { choice: "D", text: "have added" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "Reimbursements __(138)__ directly to employees' regular end-of-month paychecks.",
          evidence: "Reimbursements __(138)__ directly to employees' regular end-of-month paychecks.",
          explanation: "Chủ ngữ 'Reimbursements' (các khoản tiền bồi hoàn) là vật, phía sau không có tân ngữ trực tiếp mà là trạng từ 'directly' + giới từ 'to' -> câu thiếu động từ chính chia ở thể BỊ ĐỘNG thì tương lai áp dụng cho chính sách mới (C) 'will be added' (sẽ được cộng trực tiếp vào bảng lương). Bẫy (A) & (D) chủ động; Bẫy (B) V-ing không làm động từ chính."
        }
      ]
    },

    // =========================================================================
    // PART 6 · PASSAGE 3: Q139–142 — Letter (Brampton Ceramics Packaging Audit)
    // =========================================================================
    {
      range: "139-142",
      type: "Part 6 · Letter (Thư đối tác cung ứng bao bì)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 139-142 refer to the following letter.",
      introPrompt: "Questions 139-142 refer to the following letter.",
      passages: [
        {
          docId: "doc1",
          docLabel: "Đoạn văn 3 · Thư thương mại (Part 6 Letter)",
          kind: "letter",
          letterhead: [
            "Brampton Artisanal Ceramics",
            "840 Kiln Way · Portland, OR 97205"
          ],
          salutation: "Dear Ms. Kowalski,",
          paragraphs: [
            {
              text: "Thank you for sending sample cartons from EcoShield Packaging's new molded-pulp line last week. For the past decade, Brampton Ceramics has shipped handmade tableware to boutique hotels nationwide, and minimizing transit breakage has always been our top __(139)__.",
              vi: "Cảm ơn bà tuần trước đã gửi các thùng carton mẫu thuộc dòng bột giấy đúc khuôn mới của EcoShield Packaging. Suốt một thập kỷ qua, Brampton Ceramics đã vận chuyển đồ gốm bàn ăn thủ công tới các khách sạn boutique trên toàn quốc, và việc giảm thiểu nứt vỡ khi vận chuyển luôn là [(139) ưu tiên hàng đầu - priority] của chúng tôi."
            },
            {
              text: "Our quality assurance engineers subjected your biodegradable inserts to rigorous drop tests over the past three days. __(140)__ Not a single porcelain plate cracked, even when boxes were dropped from a height of four feet.",
              vi: "Các kỹ sư đảm bảo chất lượng của chúng tôi đã đưa lớp lót phân hủy sinh học của quý công ty vào các bài kiểm tra thả rơi nghiêm ngặt suốt ba ngày qua. [(140) Kết quả đã vượt xa kỳ vọng của chúng tôi.] Không một chiếc đĩa sứ nào bị nứt, ngay cả khi thùng hàng được thả rơi từ độ cao bốn feet."
            },
            {
              text: "Based on this performance, we would like to place an initial order for 5,000 standard shipping kits. Provided that your team can guarantee delivery to our Portland warehouse before December 5, we are prepared to sign a two-year __(141)__ supply contract. Please review the attached specification sheet and let me know __(142)__ the proposed volume discount applies to quarterly shipments.",
              vi: "Dựa trên hiệu quả này, chúng tôi muốn đặt đơn hàng đầu tiên gồm 5.000 bộ đóng gói tiêu chuẩn. Miễn là đội ngũ của bà có thể đảm bảo giao hàng tới kho Portland của chúng tôi trước ngày 5 tháng 12, chúng tôi sẵn sàng ký hợp đồng cung ứng [(141) độc quyền - exclusive] kéo dài hai năm. Vui lòng xem bảng thông số kỹ thuật đính kèm và cho tôi biết [(142) liệu rằng - whether] mức chiết khấu theo số lượng đề xuất có áp dụng cho các đợt giao hàng hằng quý hay không."
            }
          ],
          signature: "Sincerely,\nDerek Hollis\nDirector of Operations, Brampton Artisanal Ceramics"
        }
      ],
      transcript: "Brampton Artisanal Ceramics — Dear Ms. Kowalski,\nThank you for sending sample cartons from EcoShield Packaging's new molded-pulp line last week. For the past decade, Brampton Ceramics has shipped handmade tableware to boutique hotels nationwide, and minimizing transit breakage has always been our top __(139)__.\nOur quality assurance engineers subjected your biodegradable inserts to rigorous drop tests over the past three days. __(140)__ Not a single porcelain plate cracked, even when boxes were dropped from a height of four feet.\nBased on this performance, we would like to place an initial order for 5,000 standard shipping kits. Provided that your team can guarantee delivery to our Portland warehouse before December 5, we are prepared to sign a two-year __(141)__ supply contract. Please review the attached specification sheet and let me know __(142)__ the proposed volume discount applies to quarterly shipments.\nSincerely, Derek Hollis",
      translation: "Gốm Thủ công Brampton — Kính gửi bà Kowalski,<br/>Cảm ơn bà tuần trước đã gửi thùng mẫu dòng bột giấy đúc mới của EcoShield. Suốt 10 năm qua, giảm thiểu đổ vỡ khi vận chuyển luôn là (139) ưu tiên hàng đầu của chúng tôi. Kỹ sư QA đã thử nghiệm thả rơi lớp lót sinh học của bà suốt 3 ngày qua. (140) [Kết quả vượt xa kỳ vọng của chúng tôi.] Không một chiếc đĩa sứ nào nứt vỡ. Chúng tôi muốn đặt đơn đầu tiên 5.000 bộ, và nếu giao kịp trước 5/12, chúng tôi sẵn sàng ký hợp đồng cung ứng (141) độc quyền 2 năm. Xin cho biết (142) liệu mức chiết khấu số lượng có áp dụng cho các lô hàng theo quý không.",
      vocab: [
        "top priority (n): ưu tiên hàng đầu",
        "transit breakage (n): hư hại / đổ vỡ trong quá trình vận chuyển",
        "biodegradable insert (n): lớp lót chống sốc tự phân hủy sinh học",
        "exceed expectations (v): vượt xa kỳ vọng",
        "exclusive supply contract (n): hợp đồng cung ứng độc quyền",
        "volume discount (n): chiết khấu theo số lượng lớn"
      ],
      lexicalChunks: [
        { en: "top priority", vi: "ưu tiên hàng đầu", pos: "noun", ipa: "/tɑːp praɪˈɔːrəti/" },
        { en: "exceed expectations", vi: "vượt xa kỳ vọng", pos: "verb", ipa: "/ɪkˈsiːd ˌekspekˈteɪʃnz/" },
        { en: "exclusive contract", vi: "hợp đồng độc quyền", pos: "noun", ipa: "/ɪkˈskluːsɪv ˈkɑːntrækt/" },
        { en: "volume discount", vi: "chiết khấu theo số lượng lớn", pos: "noun", ipa: "/ˈvɑːljuːm ˈdɪskaʊnt/" }
      ],
      questions: [
        {
          num: 139,
          questionType: "vocab_in_context",
          question: "Choose the best noun for blank (139).",
          options: [
            { choice: "A", text: "priority" },
            { choice: "B", text: "appliance" },
            { choice: "C", text: "credential" },
            { choice: "D", text: "spectator" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "minimizing transit breakage has always been our top __(139)__",
          evidence: "minimizing transit breakage has always been our top __(139)__",
          explanation: "Collocation tần suất cực cao trong thư tín thương mại: 'be one's top PRIORITY' (là ưu tiên hàng đầu của ai) -> (A) 'priority'. Bẫy (B) 'appliance' (thiết bị gia dụng); Bẫy (C) 'credential' (chứng chỉ/bằng cấp); Bẫy (D) 'spectator' (khán giả)."
        },
        {
          num: 140,
          questionType: "sentence_insertion",
          question: "Choose the sentence that best completes the text at (140).",
          options: [
            { choice: "A", text: "Unfortunately, several fragile bowls shattered during the first trial." },
            { choice: "B", text: "The results exceeded our highest expectations." },
            { choice: "C", text: "Our Portland kiln will close for annual maintenance next week." },
            { choice: "D", text: "Plastic foam remains cheaper than molded paper pulp in most markets." }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "rigorous drop tests over the past three days. __(140)__ Not a single porcelain plate cracked",
          evidence: "rigorous drop tests over the past three days. __(140)__ Not a single porcelain plate cracked",
          explanation: "Câu trước (140) nói các kỹ sư tiến hành thử nghiệm thả rơi ('rigorous drop tests'), và câu ngay sau minh chứng kết quả tuyệt vời ('Not a single porcelain plate cracked...' - Không một chiếc đĩa sứ nào bị nứt) -> câu nối ở giữa (B) 'The results exceeded our highest expectations' (Kết quả đã vượt xa kỳ vọng cao nhất của chúng tôi) tạo mạch nhân quả hoàn hảo! Bẫy (A) trái ngược hoàn toàn với câu sau; Bẫy (C) & (D) lệch mạch."
        },
        {
          num: 141,
          questionType: "detail",
          question: "Choose the best word form for blank (141).",
          options: [
            { choice: "A", text: "exclude" },
            { choice: "B", text: "exclusion" },
            { choice: "C", text: "exclusive" },
            { choice: "D", text: "exclusively" }
          ],
          answer: "C",
          evidenceDoc: "doc1",
          evidenceQuote: "prepared to sign a two-year __(141)__ supply contract",
          evidence: "prepared to sign a two-year __(141)__ supply contract",
          explanation: "Đứng trước cụm danh từ ghép 'supply contract' (hợp đồng cung ứng) cần một TÍNH TỪ bổ nghĩa -> (C) 'exclusive' ('an exclusive supply contract': hợp đồng cung ứng độc quyền). Lưu ý đuôi '-ive' của tính từ trong TOEIC! Bẫy (A) động từ 'loại trừ'; Bẫy (B) danh từ; Bẫy (D) trạng từ không bổ nghĩa trực tiếp cho danh từ 'supply contract'."
        },
        {
          num: 142,
          questionType: "detail",
          question: "Choose the best conjunction for blank (142).",
          options: [
            { choice: "A", text: "whether" },
            { choice: "B", text: "unless" },
            { choice: "C", text: "despite" },
            { choice: "D", text: "whereas" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "let me know __(142)__ the proposed volume discount applies to quarterly shipments",
          evidence: "let me know __(142)__ the proposed volume discount applies to quarterly shipments",
          explanation: "Sau cụm động từ hỏi thông tin 'let me know / ask / confirm / check + _______ + S + V' cần liên từ dẫn mệnh đề danh ngữ nghi vấn mang nghĩa 'liệu rằng... có... hay không' -> (A) 'whether'. Bẫy (B) 'unless' (trừ khi - mệnh đề trạng ngữ); Bẫy (C) 'despite' (+ cụm danh từ); Bẫy (D) 'whereas' (trong khi - đối lập)."
        }
      ]
    },

    // =========================================================================
    // PART 6 · PASSAGE 4: Q143–146 — Memo (Apex Trade Expo Booth Staffing)
    // =========================================================================
    {
      range: "143-146",
      type: "Part 6 · Memo (Phân công trực gian hàng hội chợ)",
      isReading: true,
      passageCount: 1,
      introLine: "Questions 143-146 refer to the following memo.",
      introPrompt: "Questions 143-146 refer to the following memo.",
      passages: [
        {
          docId: "doc1",
          docLabel: "Đoạn văn 4 · Thông báo nội bộ (Part 6 Memo)",
          kind: "memo",
          badge: "MEMO",
          meta: {
            To: "Sales & Product Demonstration Teams",
            From: "Elena Rostova, VP of Marketing",
            Re: "Nordic CleanTech Expo Booth Schedule",
            Date: "March 4"
          },
          paragraphs: [
            {
              text: "With the Nordic CleanTech Expo less than three weeks away, our event committee has finalized the layout for Booth 412 at the Stockholm Exhibition Hall. Because foot traffic is expected to exceed 18,000 visitors this year, at least four representatives must be stationed at our booth __(143)__ operating hours.",
              vi: "Chỉ còn chưa đầy ba tuần nữa là tới Triển lãm Nordic CleanTech, ban tổ chức sự kiện của chúng ta đã chốt sơ đồ cho Gian hàng 412 tại Trung tâm Triển lãm Stockholm. Vì lưu lượng khách tham quan dự kiến vượt 18.000 lượt trong năm nay, ít nhất bốn đại diện phải túc trực tại gian hàng [(143) xuyên suốt - throughout] khung giờ mở cửa."
            },
            {
              text: "Each representative will work one four-hour shift per day so that everyone still has ample time to attend keynote lectures and meet prospective distributors. __(144)__ If a scheduling conflict arises, you may swap shifts with a colleague as long as you notify Ms. Lindholm at least 48 hours in advance.",
              vi: "Mỗi đại diện sẽ trực một ca bốn tiếng mỗi ngày để mọi người vẫn có dư thời gian dự các bài diễn thuyết chính và gặp gỡ nhà phân phối tiềm năng. [(144) Bảng phân ca tạm thời đã được đăng trên mạng nội bộ của phòng ban sáng nay.] Nếu phát sinh trùng lịch, bạn có thể đổi ca với đồng nghiệp miễn là báo cho cô Lindholm trước ít nhất 48 giờ."
            },
            {
              text: "In addition, employees working the closing shift on Sunday will receive an extra paid day off the following month in appreciation of __(145)__ dismantling the display panels. Thank you for helping us make a strong __(146)__ at our industry's premier event.",
              vi: "Ngoài ra, những nhân viên trực ca đóng cửa vào Chủ Nhật sẽ được nhận thêm một ngày nghỉ phép hưởng nguyên lương vào tháng kế tiếp nhằm ghi nhận sự hỗ trợ của [(145) họ - their] trong việc tháo dỡ các tấm bảng trưng bày. Cảm ơn các bạn đã giúp công ty tạo được [(146) ấn tượng - impression] mạnh mẽ tại sự kiện hàng đầu của ngành."
            }
          ]
        }
      ],
      transcript: "MEMO — To: Sales & Product Demonstration Teams | From: Elena Rostova, VP of Marketing | Re: Nordic CleanTech Expo Booth Schedule | Date: March 4\nWith the Nordic CleanTech Expo less than three weeks away, our event committee has finalized the layout for Booth 412 at the Stockholm Exhibition Hall. Because foot traffic is expected to exceed 18,000 visitors this year, at least four representatives must be stationed at our booth __(143)__ operating hours.\nEach representative will work one four-hour shift per day so that everyone still has ample time to attend keynote lectures and meet prospective distributors. __(144)__ If a scheduling conflict arises, you may swap shifts with a colleague as long as you notify Ms. Lindholm at least 48 hours in advance.\nIn addition, employees working the closing shift on Sunday will receive an extra paid day off the following month in appreciation of __(145)__ dismantling the display panels. Thank you for helping us make a strong __(146)__ at our industry's premier event.",
      translation: "THÔNG BÁO NỘI BỘ — Từ: Elena Rostova, Phó Chủ tịch Marketing<br/>Còn chưa đầy 3 tuần nữa là đến Triển lãm Nordic CleanTech, sơ đồ Gian hàng 412 đã hoàn tất. Do lượng khách dự kiến vượt 18.000 người, ít nhất 4 đại diện phải túc trực tại gian hàng (143) xuyên suốt giờ mở cửa. Mỗi người trực một ca 4 tiếng/ngày để vẫn có thời gian dự diễn thuyết và gặp đối tác phân phối. (144) [Lịch phân ca dự kiến đã được đăng trên trang nội bộ của bộ phận vào sáng nay.] Nếu kẹt lịch, bạn có thể đổi ca với đồng nghiệp miễn báo trước 48 giờ. Nhân viên trực ca cuối Chủ Nhật được tặng thêm 1 ngày nghỉ có lương để cảm ơn việc (145) họ tháo dỡ gian trưng bày. Cảm ơn mọi người đã giúp tạo (146) ấn tượng mạnh mẽ tại sự kiện hàng đầu này.",
      vocab: [
        "foot traffic (n): lưu lượng khách đi bộ ghé thăm",
        "be stationed at (v): được bố trí túc trực tại",
        "keynote lecture (n): bài diễn thuyết chủ đạo",
        "scheduling conflict (n): sự trùng lịch / xung đột lịch trình",
        "swap shifts (v): đổi ca trực",
        "dismantle display panels (v): tháo dỡ các tấm quầy trưng bày",
        "make a strong impression (phr): tạo ấn tượng mạnh mẽ"
      ],
      lexicalChunks: [
        { en: "foot traffic", vi: "lưu lượng khách ghé qua", pos: "noun", ipa: "/fʊt ˈtræfɪk/" },
        { en: "scheduling conflict", vi: "sự xung đột/trùng lịch trình", pos: "noun", ipa: "/ˈskedʒuːlɪŋ ˈkɑːnflɪkt/" },
        { en: "swap shifts", vi: "hoán đổi ca làm việc", pos: "verb", ipa: "/swɑːp ʃɪfts/" },
        { en: "make a strong impression", vi: "tạo ấn tượng mạnh mẽ", pos: "phrase", ipa: "/meɪk ə strɔːŋ ɪmˈpreʃn/" }
      ],
      questions: [
        {
          num: 143,
          questionType: "detail",
          question: "Choose the best preposition for blank (143).",
          options: [
            { choice: "A", text: "throughout" },
            { choice: "B", text: "among" },
            { choice: "C", text: "whereas" },
            { choice: "D", text: "aboard" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "at least four representatives must be stationed at our booth __(143)__ operating hours",
          evidence: "at least four representatives must be stationed at our booth __(143)__ operating hours",
          explanation: "Trước cụm danh từ chỉ khoảng thời gian 'operating hours' (giờ mở cửa hoạt động) cần giới từ mang nghĩa 'xuyên suốt từ đầu đến cuối' -> (A) 'throughout' ('throughout operating hours'). Bẫy (B) 'among' (giữa >=3 vật/người); Bẫy (C) 'whereas' là liên từ (+ S+V); Bẫy (D) 'aboard' (trên tàu/máy bay)."
        },
        {
          num: 144,
          questionType: "sentence_insertion",
          question: "Choose the sentence that best completes the text at (144).",
          options: [
            { choice: "A", text: "A tentative shift roster was posted on the department intranet this morning." },
            { choice: "B", text: "Stockholm's airport rail link is undergoing signal upgrades this weekend." },
            { choice: "C", text: "Booth 412 was unfortunately double-booked by another exhibitor." },
            { choice: "D", text: "Keynote speakers must submit their slide decks in PDF format." }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "Each representative will work one four-hour shift per day so that everyone still has ample time to attend keynote lectures and meet prospective distributors. __(144)__ If a scheduling conflict arises, you may swap shifts",
          evidence: "Each representative will work one four-hour shift per day so that everyone still has ample time to attend keynote lectures and meet prospective distributors. __(144)__ If a scheduling conflict arises, you may swap shifts",
          explanation: "Câu trước giải thích nguyên tắc mỗi người 1 ca 4 tiếng; câu ngay sau nói 'Nếu phát sinh trùng lịch (scheduling conflict), bạn có thể đổi ca (swap shifts)...' -> Nhân viên phải XEM BẢNG PHÂN CA ở đâu đó thì mới biết mình có bị trùng lịch hay không! Câu (A) 'Bảng phân ca dự kiến đã được đăng trên mạng nội bộ sáng nay' là mắt xích hoàn hảo nối hai ý này. Bẫy (B), (C), (D) lạc mạch."
        },
        {
          num: 145,
          questionType: "detail",
          question: "Choose the best pronoun for blank (145).",
          options: [
            { choice: "A", text: "they" },
            { choice: "B", text: "their" },
            { choice: "C", text: "theirs" },
            { choice: "D", text: "themselves" }
          ],
          answer: "B",
          evidenceDoc: "doc1",
          evidenceQuote: "in appreciation of __(145)__ dismantling the display panels",
          evidence: "in appreciation of __(145)__ dismantling the display panels",
          explanation: "Điểm ngữ pháp nâng cao band 900+ của ETS (Possessive before Gerund): Sau giới từ 'of' và đứng trước danh động từ (gerund) 'dismantling the display panels' cần TÍNH TỪ SỞ HỮU để chỉ chủ thể thực hiện hành động danh động từ đó -> (B) 'their' ('in appreciation of their dismantling...' = để cảm kích việc họ tháo dỡ...). Bẫy (A) đại từ chủ ngữ 'they' không bao giờ đứng sau giới từ 'of'; Bẫy (C) 'theirs' không đi trước gerund + tân ngữ; Bẫy (D) 'themselves' sai cấu trúc."
        },
        {
          num: 146,
          questionType: "vocab_in_context",
          question: "Choose the best noun for blank (146).",
          options: [
            { choice: "A", text: "impression" },
            { choice: "B", text: "permission" },
            { choice: "C", text: "admission" },
            { choice: "D", text: "submission" }
          ],
          answer: "A",
          evidenceDoc: "doc1",
          evidenceQuote: "helping us make a strong __(146)__ at our industry's premier event",
          evidence: "helping us make a strong __(146)__ at our industry's premier event",
          explanation: "Bốn danh từ cùng đuôi '-mission/-pression' nhưng collocation chuẩn xác là 'make a strong / lasting / favorable IMPRESSION (at/on...)' (tạo ấn tượng mạnh mẽ tại sự kiện hàng đầu của ngành) -> (A) 'impression'. Bẫy (B) 'grant/ask permission' (sự cho phép); Bẫy (C) 'free admission' (vé vào cửa); Bẫy (D) 'submission' (việc nộp bài/hồ sơ)."
        }
      ]
    }
  ];

  window.TOEIC_PART56_TESTS = [
    {
      id: "part5_t1",
      part: 5,
      isReading: true,
      title: "ETS Reading – Đề Part 5 (Q101–130)",
      shortLabel: "P5 · Ngữ pháp",
      subtitle: "Chuẩn ETS • 30 câu Hoàn thành câu · Từ loại, Thì, Liên từ & Collocations (Câu 101–130)",
      talks: PART5_TALKS
    },
    {
      id: "part6_t1",
      part: 6,
      isReading: true,
      title: "ETS Reading – Đề Part 6 (Q131–146)",
      shortLabel: "P6 · Điền đoạn",
      subtitle: "Chuẩn ETS • 4 đoạn văn Hoàn thành văn bản · 16 câu hỏi kèm Điền câu (Câu 131–146)",
      talks: PART6_TALKS
    }
  ];
})();
