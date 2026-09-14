/**
 * Slide generator, phan 2/2 (slide 17-29) + ghi file .pptx.
 * Chay:  npm install pptxgenjs && node build_pptx_part2.js
 * Output: Slide_Backprop_Initialization.pptx
 */
const {
  pres, W, H, MX, NAVY, INK, MUTED, PAPER, PANEL, BLUE, RED, GOOD, LINE,
  FONT_HEAD, FONT_BODY, kicker, title, bulletBlock, formulaBox, noteText, darkBg,
  statCallout, arrow, node, pageTag, FIG, cardShadow, GOLD, ACTS, stampFooter,
} = require("./build_pptx.js");

// ================================================================
// SLIDE 17 — Vanishing Gradient
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Vanishing / Exploding Gradient");
  title(s, "Vanishing Gradient");
  bulletBlock(s, [
    "Gradient = tích nhiều đạo hàm cục bộ qua L lớp  ≈  gᴸ",
    "g < 1  ⇒  suy giảm theo HÀM MŨ khi L tăng",
    "g=0,5, L=50  ⇒  hệ số ≈ 8,9×10⁻¹⁶ (gần bằng 0)",
    "Nguyên nhân kép: activation bão hoà (σ′≤0,25) + weight scale sai",
  ], { y: 2.1, w: 6.6, h: 3.9, fontSize: 16 });
  const bx = 7.7, by0 = 2.3, bw = 4.9, barH = 0.5, gap = 0.28;
  const labels = ["L=1", "L=5", "L=10", "L=20", "L=50"];
  const widths = [4.4, 2.4, 1.1, 0.4, 0.12];
  labels.forEach((lab, i) => {
    const y = by0 + i * (barH + gap);
    s.addShape(pres.ShapeType.roundRect, { x: bx, y, w: widths[i], h: barH, rectRadius: 0.04, fill: { color: RED } });
    s.addText(lab, { x: bx + widths[i] + 0.12, y, w: 1.0, h: barH, valign: "middle", fontSize: 11.5, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  });
  s.addText("g = 0,5 — độ lớn gradient co lại theo độ sâu", { x: bx, y: by0 - 0.42, w: bw, h: 0.35, fontSize: 12, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  pageTag(s, 17); stampFooter(s, 17);
  noteText(s, "Số liệu bảng 'hệ số g^L theo L' rất trực quan để trình bày — đọc thẳng từ báo cáo Mục 6. Thanh đỏ co lại minh hoạ trực quan độ lớn gradient.");
}

// ================================================================
// SLIDE 18 — Exploding Gradient
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Vanishing / Exploding Gradient");
  title(s, "Exploding Gradient");
  bulletBlock(s, [
    "g > 1  ⇒  tăng theo HÀM MŨ khi L tăng",
    "g=2, L=50  ⇒  hệ số ≈ 1,1×10¹⁵",
    "Hệ quả: loss dao động mạnh hoặc NaN, huấn luyện phân kỳ",
    "Cùng nguyên nhân với vanishing — chỉ khác dấu của (g−1)",
  ], { y: 2.1, w: 6.6, h: 3.9, fontSize: 16 });
  const bx = 7.7, by0 = 2.3, bw = 4.9, barH = 0.5, gap = 0.28;
  const labels = ["L=1", "L=5", "L=10", "L=20", "L=50"];
  const widths = [0.15, 0.5, 1.3, 2.6, 4.6];
  labels.forEach((lab, i) => {
    const y = by0 + i * (barH + gap);
    s.addShape(pres.ShapeType.roundRect, { x: bx, y, w: widths[i], h: barH, rectRadius: 0.04, fill: { color: BLUE } });
    s.addText(lab, { x: bx + widths[i] + 0.12, y, w: 1.0, h: barH, valign: "middle", fontSize: 11.5, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  });
  s.addText("g = 2 — độ lớn gradient tăng theo độ sâu", { x: bx, y: by0 - 0.42, w: bw, h: 0.35, fontSize: 12, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  pageTag(s, 18); stampFooter(s, 18);
  noteText(s, "Nhấn: đây là 'hai mặt của cùng một đồng xu' với slide trước — không phải hiện tượng riêng biệt, chỉ khác g<1 hay g>1.");
}

// ================================================================
// SLIDE 19 — Experimental Setup
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Thực nghiệm");
  title(s, "Thiết kế thực nghiệm");
  bulletBlock(s, [
    "MLP 784→128×6→10, KHÔNG BatchNorm/Dropout",
    "Fashion-MNIST subset: 5.000 train / 1.000 val / 2.000 test",
    "SGD thuần, lr=0,05, batch=128, 15 epoch, seed=42",
    "Lưới đầy đủ: 5 initialization × 4 activation = 20 cấu hình",
  ], { y: 2.1, w: 6.5, h: 3.9, fontSize: 16 });
  const cx = 7.6, cw = 5.0, cy = 2.1, ch = 4.1;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.08, fill: { color: NAVY } , shadow: cardShadow() });
  s.addText("“Fair experiment”", { x: cx + 0.3, y: cy + 0.3, w: cw - 0.6, h: 0.4, fontSize: 15, bold: true, color: "CADCFC", fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
  s.addText("Chỉ initialization và activation thay đổi — kiến trúc, optimizer, learning rate, batch size, epoch, seed, cách chia dữ liệu GIỐNG HỆT NHAU giữa 20 lần chạy.", {
    x: cx + 0.3, y: cy + 0.85, w: cw - 0.6, h: 2.1, fontSize: 13.5, italic: true, color: PAPER, fontFace: FONT_BODY, isTextBox: true, margin: 0, valign: "top",
  });
  s.addText("Tổng thời gian chạy: ≈1 phút CPU", { x: cx + 0.3, y: cy + ch - 0.55, w: cw - 0.6, h: 0.35, fontSize: 12, color: "8FA3C9", fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  pageTag(s, 19); stampFooter(s, 19);
  noteText(s, "Nhấn mạnh 'fair experiment' — chỉ đổi đúng 1-2 biến khi so sánh, mọi thứ khác giữ nguyên.");
}

// ================================================================
// SLIDE 20 — Manual Backpropagation
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Thực nghiệm — Implementation");
  title(s, "Part A: Manual Backpropagation");
  bulletBlock(s, [
    "Tự viết forward + backward bằng NumPy thuần — KHÔNG dùng autograd (src/manual_nn.py)",
    "Chạy đúng ví dụ 2 lớp ở Slide 9 (x=1,1 → L=0,25205)",
    "Đối chiếu PyTorch autograd: sai số tuyệt đối = 0,00e+00",
    "Chứng minh Backprop = Chain Rule bằng CODE THẬT, không chỉ lý thuyết",
  ], { y: 2.2, w: W - 2 * MX, h: 3.2, fontSize: 16.5 });
  statCallout(s, { x: MX, y: 5.3, w: 3.7, h: 1.3, value: "0,25205", label: "Loss — khớp tuyệt đối", color: BLUE });
  statCallout(s, { x: 4.9, y: 5.3, w: 3.7, h: 1.3, value: "0,00e+00", label: "sai số vs. PyTorch autograd", color: GOOD });
  statCallout(s, { x: 8.8, y: 5.3, w: 3.7, h: 1.3, value: "NumPy", label: "100% tự viết, không autograd", color: MUTED });
  pageTag(s, 20); stampFooter(s, 20);
  noteText(s, "Đây là Part A của project — chứng minh Backprop = Chain Rule bằng code thật, không chỉ lý thuyết suông.");
}

// ================================================================
// SLIDE 21 — Gradient Checking
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Thực nghiệm — Implementation");
  title(s, "Gradient Checking");
  formulaBox(s, "(f(w+h) − f(w−h)) / 2h        h = 10⁻⁶", { y: 2.05, h: 0.85, fontSize: 18 });
  bulletBlock(s, [
    "3 cách tính độc lập: manual (NumPy) · PyTorch autograd · finite-difference",
    "Sai số tối đa giữa 3 cách: ≈10⁻⁹ (mức làm tròn số thực, KHÔNG phải sai số thuật toán)",
    "Kết quả: PASS (ngưỡng chấp nhận 10⁻⁴)",
  ], { y: 3.2, w: W - 2 * MX, h: 2.0, fontSize: 16 });
  const cx = MX, cw = W - 2 * MX;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: 5.3, w: cw, h: 1.3, rectRadius: 0.08, fill: { color: "EAF6EF" }, line: { color: GOOD, width: 0.75 } , shadow: cardShadow() });
  s.addText("Gradient checking CÔ LẬP LỖI: nếu manual sai (sai chiều ma trận, quên chia batch, sai dấu…) trong khi autograd và finite-diff vẫn khớp nhau → biết ngay lỗi nằm ở khâu tính gradient thủ công.", {
    x: cx + 0.3, y: 5.3, w: cw - 0.6, h: 1.3, align: "center", valign: "middle", fontSize: 13.5, italic: true, color: NAVY, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 21); stampFooter(s, 21);
  noteText(s, "Nếu hỏi 'sao không dùng finite-diff luôn cho training' → vì nó cần O(P) forward pass, quá chậm cho mạng triệu tham số (xem Slide 10 / Mục 4.4 báo cáo).");
}

// ================================================================
// SLIDE 22 — Experimental Results
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Kết quả thực nghiệm");
  title(s, "Test Accuracy — toàn bộ lưới 20 cấu hình");
  const imgW = 7.6, imgH = imgW / 2.122;
  s.addImage({ path: FIG("initialization_comparison.png"), x: (W - imgW) / 2, y: 1.95, w: imgW, h: imgH });
  bulletBlock(s, [
    "Zero/Random: LUÔN ở mức ngẫu nhiên (10%), với MỌI activation",
    "Sigmoid: LUÔN ~10% dù initialization nào — kể cả He/Xavier",
    "LeCun/Xavier/He: 64–69% với Tanh/ReLU/Leaky ReLU",
  ], { y: 1.95 + imgH + 0.25, w: W - 2 * MX, h: 1.6, fontSize: 14.5, spaceAfter: 6 });
  pageTag(s, 22); stampFooter(s, 22);
  noteText(s, "Đọc bảng theo hàng rồi theo cột — hàng cho thấy Zero/Random luôn thất bại, cột Sigmoid cho thấy ngay cả initialization tốt cũng thất bại ở độ sâu này.");
}

// ================================================================
// SLIDE 23 — Gradient Norm Results
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Kết quả thực nghiệm");
  title(s, "Gradient Norm theo Layer (Sigmoid)");
  const imgH = 4.3, imgW = imgH * 1.358;
  s.addImage({ path: FIG("gradient_norm.png"), x: MX, y: 1.95, w: imgW, h: imgH });
  bulletBlock(s, [
    "Random (naive): suy giảm ≈9 bậc độ lớn, output → input",
    "LeCun/Xavier/He: suy giảm nhẹ hơn nhiều (2–3 bậc)…",
    "…nhưng VẪN suy giảm — vì σ′(z)≤0,25 bất kể weight scale",
    "Đây là bằng chứng thực nghiệm trực tiếp nhất cho lý thuyết vanishing gradient",
  ], { x: MX + imgW + 0.4, y: 2.1, w: W - MX - imgW - 0.4 - MX, h: 4.1, fontSize: 14.5 });
  pageTag(s, 23); stampFooter(s, 23);
  noteText(s, "Đây là bằng chứng thực nghiệm trực tiếp nhất cho lý thuyết vanishing gradient Mục 6 / Slide 17.");
}

// ================================================================
// SLIDE 24 — Initialization Comparison (tổng hợp)
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Kết quả thực nghiệm");
  title(s, "Bức tranh tổng thể");
  const headers = ["", "Sigmoid", "Tanh", "ReLU", "Leaky ReLU"];
  const rows = [
    ["Zero", "0,100", "0,100", "0,100", "0,100"],
    ["Random", "0,100", "0,100", "0,100", "0,100"],
    ["LeCun", "0,100", "0,689", "0,638", "0,648"],
    ["Xavier", "0,100", "0,692", "0,674", "0,682"],
    ["He", "0,100", "0,694", "0,667", "0,634"],
  ];
  const tRows = [headers.map((h) => ({ text: h, options: { bold: true, fill: { color: NAVY }, color: PAPER, fontSize: 13 } }))]
    .concat(rows.map((r, ri) => r.map((c, ci) => ({
      text: c,
      options: {
        fontSize: 13, color: INK, align: ci === 0 ? "left" : "center",
        fill: { color: ri % 2 === 0 ? PANEL : PAPER },
        bold: ci === 0,
      },
    }))));
  s.addTable(tRows, {
    x: MX, y: 2.0, w: W - 2 * MX, h: 2.7, border: { type: "solid", color: LINE, pt: 0.5 },
    autoPage: false, colW: [2.333, 2.4, 2.4, 2.4, 2.4],
  });
  bulletBlock(s, [
    "Zero/Random: luôn ở mức ngẫu nhiên, MỌI activation",
    "Tanh + init có scale: tốt nhất tổng thể (~69%)",
    "ReLU/Leaky ReLU: LeCun/Xavier/He tương đương nhau (64–68%)",
  ], { y: 5.0, w: W - 2 * MX, h: 1.9, fontSize: 15, spaceAfter: 8 });
  pageTag(s, 24); stampFooter(s, 24);
  noteText(s, "Đây là slide 'big picture' — dùng để tổng kết trước khi sang Discussion.");
}

// ================================================================
// SLIDE 25 — Discussion
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Thảo luận");
  title(s, "Vì sao Sigmoid thất bại dù He/Xavier “đúng lý thuyết”?");
  bulletBlock(s, [
    "σ′(z) ≤ 0,25 LUÔN LUÔN đúng — không liên quan tới weight scale",
    "6 lớp ⇒ hệ số suy giảm trần do riêng activation: 0,25⁶ ≈ 2,4×10⁻⁴",
    "Gradient lớp 1 (Sigmoid+He) ≈ 1,6×10⁻⁵ — khác 0 nhưng quá nhỏ để cập nhật đáng kể ở lr=0,05/15 epoch",
    "Kết luận: Initialization tốt là ĐIỀU KIỆN CẦN, không phải ĐIỀU KIỆN ĐỦ",
  ], { y: 2.15, w: W - 2 * MX, h: 3.9, fontSize: 16 });
  pageTag(s, 25); stampFooter(s, 25);
  noteText(s, "Đây là phần thể hiện tư duy phản biện — không chỉ báo cáo số mà GIẢI THÍCH cơ chế. He vs Xavier cho ReLU: chênh lệch nằm trong nhiễu 1-seed, không kết luận dứt khoát được.");
}

// ================================================================
// SLIDE 26 — Practical Guidelines
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Thảo luận");
  title(s, "Khuyến nghị thực dụng");
  const items = [
    ["ReLU / Leaky ReLU", "→  He/Kaiming initialization"],
    ["Tanh / Sigmoid", "→  Xavier/Glorot initialization"],
    ["Không bao giờ", "→  Zero-init cho WEIGHT (chỉ dùng 0 cho bias)"],
    ["Mạng rất sâu + activation bão hoà", "→  cân nhắc Batch/Layer Normalization"],
  ];
  let y = 2.2;
  items.forEach(([a, b]) => {
    s.addShape(pres.ShapeType.roundRect, { x: MX, y, w: W - 2 * MX, h: 0.9, rectRadius: 0.06, fill: { color: PANEL }, line: { color: LINE, width: 0.5 } , shadow: cardShadow() });
    s.addText(a, { x: MX + 0.3, y, w: 4.6, h: 0.9, valign: "middle", fontSize: 15, bold: true, color: NAVY, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
    s.addText(b, { x: MX + 5.0, y, w: W - 2 * MX - 5.3, h: 0.9, valign: "middle", fontSize: 15, color: BLUE, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
    y += 1.05;
  });
  pageTag(s, 26); stampFooter(s, 26);
  noteText(s, "Đây là slide 'cheat sheet' thực dụng — hữu ích khi làm project khác. Có thể đọc nhanh 4 dòng này khi được hỏi 'vậy nên dùng gì?'.");
}

// ================================================================
// SLIDE 27 — Limitations
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Hạn chế");
  title(s, "Hạn chế của thực nghiệm");
  bulletBlock(s, [
    "Subset nhỏ (5.000/1.000/2.000), 15 epoch, 1 seed duy nhất — không đại diện quy mô lớn",
    "SGD thuần, không tinh chỉnh learning rate riêng cho từng cấu hình",
    "Không BatchNorm/Dropout/LR schedule (cố ý, để cô lập biến initialization)",
    "Validation dao động mạnh do tập val chỉ 1.000 mẫu",
  ], { y: 2.2, w: W - 2 * MX, h: 3.9, fontSize: 16.5 });
  pageTag(s, 27); stampFooter(s, 27);
  noteText(s, "Trung thực về giới hạn — không giấu, đây là điểm cộng học thuật khi trả lời câu hỏi phản biện.");
}

// ================================================================
// SLIDE 28 — Conclusion
// ================================================================
{
  const s = pres.addSlide(); darkBg(s);
  kicker(s, "Kết luận", { color: "8FA3C9", y: 0.55 });
  s.addText("Hai câu hỏi, một cơ chế chung", {
    x: MX, y: 1.0, w: W - 2 * MX, h: 0.8, fontSize: 30, bold: true, color: PAPER, fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  const items = [
    "Backpropagation = Chain Rule có hệ thống, KHÁC Gradient Descent",
    "Initialization quyết định gradient có “sống sót” qua nhiều lớp hay không",
    "Cả hai cùng trả lời một câu hỏi: tín hiệu học di chuyển thế nào trong mạng sâu",
  ];
  const paras = items.map((t) => ({
    text: t, options: { bullet: { code: "25AA", color: "6FA3E0", indent: 18 }, color: "E7ECF6", fontSize: 18, breakLine: true, paraSpaceAfter: 18, fontFace: FONT_BODY },
  }));
  s.addText(paras, { x: MX, y: 2.2, w: W - 2 * MX, h: 2.6, valign: "top", isTextBox: true, margin: 0 });
  s.addShape(pres.ShapeType.line, { x: MX, y: 5.2, w: W - 2 * MX, h: 0, line: { color: "3A4A70", width: 1 } });
  s.addText("Backpropagation tính dòng chảy gradient. Initialization quyết định dòng chảy đó có sống sót qua nhiều lớp hay không.", {
    x: MX, y: 5.45, w: W - 2 * MX, h: 1.0, fontSize: 16, italic: true, color: "CADCFC", align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  stampFooter(s, 28, true);
  noteText(s, "Tóm tắt bằng câu chốt ở cuối slide, chuẩn bị cho phần Q&A.");
}

// ================================================================
// SLIDE 29 — References
// ================================================================
{
  const s = pres.addSlide(); darkBg(s);
  kicker(s, "Tài liệu tham khảo", { color: "8FA3C9", y: 0.55 });
  title(s, "References", { color: PAPER, y: 1.0 });
  const refs = [
    "Rumelhart, Hinton & Williams (1986). Learning representations by back-propagating errors. Nature, 323:533–536.",
    "Glorot & Bengio (2010). Understanding the difficulty of training deep feedforward neural networks. AISTATS.",
    "He, Zhang, Ren & Sun (2015). Delving Deep into Rectifiers. ICCV. arXiv:1502.01852.",
    "LeCun, Bottou, Orr & Müller (1998/2012). Efficient BackProp. Neural Networks: Tricks of the Trade.",
    "Goodfellow, Bengio & Courville (2016). Deep Learning. MIT Press.",
    "Bishop (2006). Pattern Recognition and Machine Learning. Springer.",
    "Kingma & Ba (2015). Adam: A Method for Stochastic Optimization. ICLR. arXiv:1412.6980.",
    "Xiao, Rasul & Vollgraf (2017). Fashion-MNIST. arXiv:1708.07747.",
    "Paszke et al. (2019). PyTorch: An Imperative Style, High-Performance Deep Learning Library. NeurIPS.",
  ];
  const paras = refs.map((t) => ({
    text: t, options: { bullet: { code: "2022", color: "6FA3E0", indent: 16 }, color: "D8E0EF", fontSize: 12.5, breakLine: true, paraSpaceAfter: 8, fontFace: FONT_BODY },
  }));
  s.addText(paras, { x: MX, y: 1.9, w: W - 2 * MX, h: 5.0, valign: "top", isTextBox: true, margin: 0 });
  stampFooter(s, 29, true);
  noteText(s, "Sẵn sàng nêu nguồn cụ thể nếu giảng viên hỏi 'câu này lấy từ đâu' — 9 nguồn, đều đã verify qua tìm kiếm thực tế, không có nguồn bịa.");
}

pres.writeFile({ fileName: "Slide_Backprop_Initialization.pptx" }).then((fileName) => {
  console.log("Wrote:", fileName);
});
