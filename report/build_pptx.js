/**
 * Slide generator, phan 1/2 (slide 1-16). Chay: xem build_pptx_part2.js.
 *
 * Cai dat:  npm install pptxgenjs
 * Chay:     node build_pptx_part2.js   (file nay tu require file nay)
 * Output:   Slide_Backprop_Initialization.pptx
 */
const pptxgen = require("pptxgenjs");
const path = require("path");

const FIG = (name) => path.join("..", "results", "figures", name);

// ---------------------------------------------------------------- palette
const NAVY = "16213E";
const INK = "1A2238";
const MUTED = "5B6478";
const PAPER = "FFFFFF";
const PANEL = "F1F4F9";
const BLUE = "285AB4";   // forward / primary accent
const RED = "BE3C32";    // backward / warning accent
const GOOD = "2E7D5B";
const LINE = "D9DEE8";
// Card shadow -- pptxgenjs mutates shadow option objects in place (converts
// to EMU on first use), so NEVER share one object literal across two
// addShape calls -- always call cardShadow() fresh for each shape.
const cardShadow = () => ({ type: "outer", color: "1A1A2E", opacity: 0.20, blur: 9, offset: 3, angle: 90 });
const GOLD = "C68A2E"; // warm accent, used sparingly for variety (key-insight beats)

// 4 "acts" of the talk, for the progress trail stamped on every content
// slide (slide numbers are 1-indexed, inclusive ranges).
const ACTS = [
  { label: "Toán học & Backprop", from: 2, to: 11 },
  { label: "Initialization", from: 12, to: 18 },
  { label: "Thực nghiệm", from: 19, to: 24 },
  { label: "Kết luận", from: 25, to: 29 },
];

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";

const W = 13.333, H = 7.5;
const MX = 0.7;

// ---------------------------------------------------------------- helpers
function pageTag(slide, n) {
  slide.addText(`${n}/29`, {
    x: W - 1.1, y: H - 0.45, w: 0.8, h: 0.3, fontSize: 9, color: MUTED,
    align: "right", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}

// Small 4-dot "act" progress trail, bottom-left of every content slide --
// a running visual thread tying the 29 slides into one story instead of
// 29 independent decks. `dark` picks a palette readable on a navy background.
function stampFooter(slide, slideNum, dark = false) {
  const actIdx = ACTS.findIndex((a) => slideNum >= a.from && slideNum <= a.to);
  if (actIdx === -1) return;
  const dotR = 0.065, gap = 0.24, y = H - 0.42;
  const offColor = dark ? "3A4A70" : "D9DEE8";
  const onColor = dark ? "6FA3E0" : BLUE;
  ACTS.forEach((a, i) => {
    const x = MX + i * gap;
    const active = i === actIdx;
    const r = active ? dotR * 1.5 : dotR;
    slide.addShape(pres.ShapeType.ellipse, {
      x: x - r / 2, y: y + (dotR - r) / 2, w: r, h: r,
      fill: { color: active ? onColor : offColor }, line: { type: "none" },
    });
  });
  slide.addText(ACTS[actIdx].label.toUpperCase(), {
    x: MX + ACTS.length * gap + 0.05, y: y - 0.09, w: 3.2, h: 0.3,
    fontSize: 8.5, color: dark ? "6FA3E0" : MUTED, charSpacing: 0.5,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}
function kicker(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: MX, y: opts.y ?? 0.5, w: 9, h: 0.35, fontSize: 13, bold: true,
    color: opts.color || BLUE, charSpacing: 1, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}
function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: MX, y: opts.y ?? 0.82, w: opts.w ?? W - 2 * MX, h: opts.h ?? 0.9,
    fontSize: opts.fontSize ?? 29, bold: true, color: opts.color ?? INK,
    fontFace: FONT_HEAD, isTextBox: true, margin: 0, valign: "top",
  });
}
function bulletBlock(slide, items, opts = {}) {
  const x = opts.x ?? MX, y = opts.y ?? 2.0, w = opts.w ?? 6.4, h = opts.h ?? 4.4;
  const fs = opts.fontSize ?? 16;
  const paras = items.map((it) => ({
    text: it,
    options: {
      bullet: { code: "25AA", color: opts.bulletColor || BLUE, indent: 18 },
      color: INK, fontSize: fs, breakLine: true,
      paraSpaceAfter: opts.spaceAfter ?? 12, fontFace: FONT_BODY,
    },
  }));
  slide.addText(paras, { x, y, w, h, valign: "top", isTextBox: true, margin: 0 });
}
function formulaBox(slide, text, opts = {}) {
  const x = opts.x ?? MX, y = opts.y ?? 2.0, w = opts.w ?? W - 2 * MX, h = opts.h ?? 0.95;
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08, fill: { color: PANEL }, line: { color: LINE, width: 0.75 },
    shadow: cardShadow(),
  });
  slide.addText(text, {
    x: x + 0.25, y, w: w - 0.5, h, fontSize: opts.fontSize ?? 19, color: NAVY,
    align: "center", valign: "middle", fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
}
function noteText(slide, txt) { slide.addNotes(txt); }
function darkBg(slide) { slide.background = { color: NAVY }; }

function statCallout(slide, { x, y, w, h, value, label, color }) {
  slide.addText(value, {
    x, y, w, h: h * 0.6, fontSize: 32, bold: true, color: color || BLUE,
    align: "center", valign: "bottom", fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  slide.addText(label, {
    x, y: y + h * 0.6, w, h: h * 0.4, fontSize: 11, color: MUTED,
    align: "center", valign: "top", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}

// OOXML requires non-negative shape extents (cx/cy) -- a "line" from x1,y1
// to x2,y2 where x2<x1 or y2<y1 would otherwise write a negative w/h, which
// PowerPoint's strict parser rejects outright (even though python-pptx and
// most other readers silently tolerate it). Always build the bounding box
// with non-negative w/h, and put the arrowhead at whichever geometric end
// (begin or end of the box) corresponds to the intended destination.
function arrow(slide, x1, y1, x2, y2, opts = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  const forward = x2 >= x1 && y2 >= y1; // destination is the box's bottom-right corner
  const lineProps = {
    color: opts.color || BLUE, width: opts.width || 2.25, dashType: opts.dash || "solid",
  };
  if (forward) lineProps.endArrowType = "triangle";
  else lineProps.beginArrowType = "triangle";
  slide.addShape(pres.ShapeType.line, { x, y, w, h, line: lineProps });
}

function node(slide, { x, y, w, h, label, fill = PAPER, lineColor = INK, textColor = INK, fs = 13 }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: lineColor, width: 1.25 },
  });
  slide.addText(label, {
    x, y, w, h, align: "center", valign: "middle", fontSize: fs, color: textColor,
    fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
}

// ================================================================
// SLIDE 1 — Title
// ================================================================
{
  const s = pres.addSlide(); darkBg(s);

  // ---- decorative background: a faint 4-6-6-3 node network, watermark-like,
  // tucked in the lower-right so it never competes with the title text ----
  (function drawNetworkDecoration() {
    const layers = [4, 6, 6, 3];
    const originX = 8.6, originY = 0.9, layerGap = 1.35, nodeGap = 0.62, r = 0.075;
    const positions = layers.map((n, li) => {
      const colH = (n - 1) * nodeGap;
      const startY = originY + (5.6 - colH) / 2;
      return Array.from({ length: n }, (_, i) => ({ x: originX + li * layerGap, y: startY + i * nodeGap }));
    });
    for (let li = 0; li < positions.length - 1; li++) {
      positions[li].forEach((a) => {
        positions[li + 1].forEach((b) => {
          s.addShape(pres.ShapeType.line, {
            x: a.x, y: Math.min(a.y, b.y), w: layerGap, h: Math.abs(b.y - a.y),
            flipV: b.y < a.y,
            line: { color: "3A4A70", width: 0.5, transparency: 55 },
          });
        });
      });
    }
    positions.flat().forEach((p) => {
      s.addShape(pres.ShapeType.ellipse, {
        x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r,
        fill: { color: "6FA3E0", transparency: 35 }, line: { color: "8FA3C9", width: 0.75, transparency: 40 },
      });
    });
  })();

  s.addText("ĐẠO HÀM & KHỞI TẠO TRONG DEEP LEARNING", {
    x: MX, y: 2.25, w: W - 2 * MX, h: 1.5, fontSize: 36, bold: true, color: PAPER,
    align: "center", fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  s.addText("Backpropagation và Parameter Initialization", {
    x: MX, y: 3.5, w: W - 2 * MX, h: 0.6, fontSize: 20, color: "CADCFC",
    align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addText("Derivatives & Initialization in Deep Learning: Backpropagation and Parameter Initialization", {
    x: MX, y: 4.1, w: W - 2 * MX, h: 0.45, fontSize: 13, italic: true, color: "8FA3C9",
    align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addShape(pres.ShapeType.line, { x: W / 2 - 0.9, y: 4.8, w: 1.8, h: 0, line: { color: BLUE, width: 2 } });
  s.addText("Nhóm sinh viên · Học phần Deep Learning · 2026", {
    x: MX, y: 6.5, w: W - 2 * MX, h: 0.4, fontSize: 13, color: "8FA3C9",
    align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  noteText(s, "Giới thiệu tên nhóm, chủ đề, và nói 1 câu định hướng: báo cáo trả lời 2 câu hỏi — tính gradient thế nào (Backpropagation) và bắt đầu từ đâu (Initialization).");
}

// ================================================================
// SLIDE 2 — Problem / Motivation
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Giới thiệu");
  title(s, "Huấn luyện mạng nơ-ron = một bài toán tối ưu");
  bulletBlock(s, [
    "Mục tiêu: tìm bộ tham số θ (W, b) để hàm mất mát L(θ) nhỏ nhất",
    "Câu hỏi 1 — TÍNH gradient hiệu quả thế nào? (Backpropagation)",
    "Câu hỏi 2 — BẮT ĐẦU từ giá trị tham số nào? (Initialization)",
    "Sai một trong hai → mạng không học được, bất kể kiến trúc “hay” đến đâu",
  ], { y: 2.1, w: 7.3, h: 4.0 });
  const cx = 8.5, cw = 4.1;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: 2.1, w: cw, h: 4.1, rectRadius: 0.08, fill: { color: PANEL }, line: { color: LINE, width: 0.75 } , shadow: cardShadow() });
  s.addText("Hai mặt của một câu hỏi", {
    x: cx + 0.3, y: 2.35, w: cw - 0.6, h: 0.4, fontSize: 14, bold: true, color: NAVY, fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  s.addText("Làm sao tín hiệu học (gradient) đi xuyên suốt một mạng nhiều lớp mà không biến mất hay bùng nổ?", {
    x: cx + 0.3, y: 2.9, w: cw - 0.6, h: 1.9, fontSize: 14.5, italic: true, color: INK,
    fontFace: FONT_BODY, isTextBox: true, margin: 0, valign: "top",
  });
  s.addText("Backprop tính dòng chảy đó · Initialization quyết định dòng chảy đó có sống sót qua nhiều lớp", {
    x: cx + 0.3, y: 5.0, w: cw - 0.6, h: 1.0, fontSize: 12, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0, valign: "top",
  });
  pageTag(s, 2); stampFooter(s, 2);
  noteText(s, "Nhấn mạnh đây không phải 2 chủ đề tách rời — cả hai đều nói về việc tín hiệu học (gradient) di chuyển trong mạng.");
}

// ================================================================
// SLIDE 3 — Learning Objectives
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Mục tiêu bài trình bày");
  title(s, "5 điều nhóm sẽ chứng minh được");
  const items = [
    "Backpropagation = Chain Rule có hệ thống, KHÁC Gradient Descent",
    "Suy ra công thức gradient — dạng vô hướng và dạng ma trận — cho một MLP",
    "Vì sao W=0 khiến mạng không học được; Xavier/He giải quyết vấn đề gì",
    "Cơ chế toán học của vanishing / exploding gradient",
    "Kiểm chứng toàn bộ bằng thực nghiệm thật trên Fashion-MNIST",
  ];
  const rowH = 0.8, y0 = 2.1;
  items.forEach((t, i) => {
    const y = y0 + i * rowH;
    s.addShape(pres.ShapeType.ellipse, { x: MX, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: BLUE }, line: { type: "none" } });
    s.addText(String(i + 1), {
      x: MX, y: y + 0.05, w: 0.5, h: 0.5, align: "center", valign: "middle",
      fontSize: 16, bold: true, color: PAPER, fontFace: FONT_HEAD, isTextBox: true, margin: 0,
    });
    s.addText(t, {
      x: MX + 0.75, y, w: W - 2 * MX - 0.75, h: rowH, valign: "middle",
      fontSize: 16, color: INK, fontFace: FONT_BODY, isTextBox: true, margin: 0,
    });
  });
  pageTag(s, 3); stampFooter(s, 3);
  noteText(s, "Đọc nhanh 5 mục tiêu — đây cũng chính là dàn ý của toàn bộ bài trình bày.");
}

// ================================================================
// SLIDE 4 — Derivative intuition
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Nền tảng toán học");
  title(s, "Đạo hàm = độ nhạy cục bộ");
  bulletBlock(s, [
    "Đạo hàm trả lời: nhích x một chút, y=f(x) đổi bao nhiêu?",
    "Ví dụ: y = x²  ⇒  dy/dx = 2x",
    "Trong Deep Learning: ∂L/∂w = “nên chỉnh w theo hướng nào?”",
    "Không có đạo hàm → optimizer không biết hướng nào để đi",
  ], { y: 2.15, w: 6.4, h: 3.8 });
  const gx = 7.5, gy = 2.15, gw = 5.1, gh = 4.0;
  s.addShape(pres.ShapeType.roundRect, { x: gx, y: gy, w: gw, h: gh, rectRadius: 0.06, fill: { color: PANEL }, line: { color: LINE, width: 0.75 } , shadow: cardShadow() });
  s.addShape(pres.ShapeType.line, { x: gx + 0.4, y: gy + gh - 0.55, w: gw - 0.8, h: 0, line: { color: MUTED, width: 1 } });
  s.addShape(pres.ShapeType.line, { x: gx + gw / 2, y: gy + 0.3, w: 0, h: gh - 0.85, line: { color: MUTED, width: 1 } });
  const cx0 = gx + gw / 2, baseY = gy + gh - 0.55;
  const pts = [];
  for (let i = -20; i <= 20; i++) {
    const xv = i / 10;
    pts.push({ x: cx0 + xv * (gw * 0.21), y: baseY - (xv * xv) * (gh * 0.19) });
  }
  for (let i = 0; i < pts.length - 1; i++) {
    // Non-negative w/h always (PowerPoint rejects a negative extent, even
    // though other readers tolerate it -- see the arrow() helper above for
    // the same fix). A plain (unflipped) line shape draws its diagonal from
    // the bounding box's top-left to bottom-right; when dx and dy have
    // OPPOSITE signs the true segment is the anti-diagonal, so flipV is
    // needed or the segment renders mirrored (this is what produced the
    // "dashed" look on the right half of the parabola before this fix).
    const xA = pts[i].x, yA = pts[i].y, xB = pts[i + 1].x, yB = pts[i + 1].y;
    const dx = xB - xA, dy = yB - yA;
    s.addShape(pres.ShapeType.line, {
      x: Math.min(xA, xB), y: Math.min(yA, yB), w: Math.abs(dx), h: Math.abs(dy),
      flipV: (dx > 0) !== (dy > 0),
      line: { color: BLUE, width: 2.5 },
    });
  }
  s.addShape(pres.ShapeType.ellipse, { x: pts[35].x - 0.06, y: pts[35].y - 0.06, w: 0.12, h: 0.12, fill: { color: RED }, line: { type: "none" } });
  s.addText("y = x²", { x: gx + gw - 1.6, y: gy + 0.25, w: 1.4, h: 0.35, fontSize: 13, color: BLUE, bold: true, fontFace: "Cambria Math", isTextBox: true, margin: 0 });
  s.addText("tại x=1.5: dy/dx = 3", { x: gx + 0.35, y: gy + gh - 0.45, w: gw - 0.7, h: 0.32, fontSize: 11.5, color: RED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  pageTag(s, 4); stampFooter(s, 4);
  noteText(s, "Dùng hình tiếp tuyến để minh hoạ. Nếu bị hỏi 'đạo hàm âm nghĩa là gì' — tăng w thì loss giảm, nên optimizer sẽ TĂNG w (đi ngược dấu gradient).");
}

// ================================================================
// SLIDE 5 — Chain Rule
// ================================================================
function nodeChainRow(slide, y, labels) {
  const nodeW = 1.7, nodeH = 0.65, gap = 0.7;
  const totalW = labels.length * nodeW + (labels.length - 1) * gap;
  let x = (W - totalW) / 2;
  const centers = [];
  labels.forEach((label) => {
    node(slide, { x, y, w: nodeW, h: nodeH, label, fs: 14 });
    centers.push(x + nodeW / 2);
    x += nodeW + gap;
  });
  for (let i = 0; i < centers.length - 1; i++) {
    arrow(slide, centers[i] + nodeW / 2, y + nodeH / 2, centers[i + 1] - nodeW / 2, y + nodeH / 2, { color: BLUE });
  }
  return centers;
}
{
  const s = pres.addSlide();
  kicker(s, "Nền tảng toán học");
  title(s, "Quy tắc chuỗi (Chain Rule)");
  formulaBox(s, "y = f(g(x))      ⇒      dy/dx = (dy/dg)·(dg/dx)", { y: 2.0, h: 0.85, fontSize: 20 });
  bulletBlock(s, [
    "g biến x → đại lượng trung gian; f biến đại lượng đó → y",
    "Độ nhạy tổng = tích độ nhạy từng bước (nhân dồn)",
    "Ẩn dụ: tin đồn qua nhiều người — sai lệch cuối phụ thuộc MỖI khâu",
  ], { y: 3.1, w: 7.0, h: 2.0 });
  nodeChainRow(s, 5.4, ["x", "z=wx+b", "a=σ(z)", "L"]);
  formulaBox(s, "∂L/∂w = (∂L/∂a)·(∂a/∂z)·(∂z/∂w)", { x: MX, y: 6.3, w: W - 2 * MX, h: 0.7, fontSize: 17 });
  pageTag(s, 5); stampFooter(s, 5);
  noteText(s, "Đây là viên gạch nền tảng của toàn bộ Backpropagation. Ẩn dụ dây chuyền/truyền tin đồn giúp sinh viên nhớ trực giác chain rule.");
}

// ================================================================
// SLIDE 6 — Computational Graph
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Nền tảng toán học");
  title(s, "Computational Graph");
  bulletBlock(s, [
    "Mỗi nút = 1 phép toán; forward tính giá trị, backward nhân đạo hàm cục bộ",
    "Ví dụ: z=wx+b → a=ReLU(z) → L=½(a−y)²",
    "x=2, w=0.5, b=−0.3, y=1  ⇒  L=0.045",
    "∂L/∂w = −0.6  (khớp PyTorch autograd & finite-difference tuyệt đối)",
  ], { y: 2.05, w: W - 2 * MX, h: 1.9, fontSize: 15 });
  const y = 4.1, nodeW = 1.35, nodeH = 0.7, gap = 0.85;
  const labels = ["x", "z", "a", "L"];
  const totalW = labels.length * nodeW + (labels.length - 1) * gap;
  let x0 = (W - totalW) / 2;
  const centers = [];
  labels.forEach((label) => {
    node(s, { x: x0, y, w: nodeW, h: nodeH, label, fs: 15 });
    centers.push(x0 + nodeW / 2);
    x0 += nodeW + gap;
  });
  const opLabels = ["z=wx+b", "a=ReLU(z)", "L=½(a−y)²"];
  for (let i = 0; i < centers.length - 1; i++) {
    arrow(s, centers[i] + nodeW / 2, y + nodeH / 2, centers[i + 1] - nodeW / 2, y + nodeH / 2, { color: BLUE });
    s.addText(opLabels[i], {
      x: centers[i], y: y - 0.42, w: centers[i + 1] - centers[i], h: 0.35, align: "center",
      fontSize: 11, color: MUTED, fontFace: "Cambria Math", isTextBox: true, margin: 0,
    });
  }
  const by = y + nodeH + 0.55;
  const backLabels = ["∂L/∂z", "∂L/∂a", "∂L/∂L=1"];
  for (let i = centers.length - 2; i >= 0; i--) {
    arrow(s, centers[i + 1] - nodeW / 2, by, centers[i] + nodeW / 2, by, { color: RED, dash: "dash" });
  }
  for (let i = 0; i < centers.length - 1; i++) {
    s.addText(backLabels[i], {
      x: centers[i], y: by + 0.1, w: centers[i + 1] - centers[i], h: 0.3, align: "center",
      fontSize: 11, color: RED, fontFace: "Cambria Math", isTextBox: true, margin: 0,
    });
  }
  s.addText("mũi tên xanh = forward   ·   mũi tên đỏ đứt = backward", {
    x: MX, y: 6.55, w: W - 2 * MX, h: 0.35, align: "center", fontSize: 11, italic: true, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 6); stampFooter(s, 6);
  noteText(s, "Vẽ lại hình này trên bảng nếu được hỏi thêm. Nhấn: mỗi nút chỉ cần biết đạo hàm CỦA CHÍNH NÓ — đó là điều làm computational graph mạnh mẽ.");
}

// ================================================================
// SLIDE 7 — Forward Propagation
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Nền tảng toán học");
  title(s, "Lan truyền tiến (Forward Propagation)");
  formulaBox(s, "z⁽ˡ⁾ = W⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾        a⁽ˡ⁾ = f(z⁽ˡ⁾)", { y: 2.05, h: 0.85 });
  bulletBlock(s, [
    "Lặp lại “nhân ma trận → cộng bias → activation” qua từng lớp",
    "Lớp cuối (classification) thường KHÔNG qua activation phi tuyến — giữ logits thô để Cross-Entropy tự áp dụng softmax bên trong",
    "Forward KHÔNG liên quan gradient — chỉ tính và LƯU LẠI giá trị trung gian",
    "PyTorch autograd giữ đúng các giá trị này trong một computational graph ngầm suốt forward pass",
  ], { y: 3.1, w: W - 2 * MX, h: 3.3, fontSize: 15.5 });
  pageTag(s, 7); stampFooter(s, 7);
  noteText(s, "Forward pass là bước 'đi xuôi', cần cho cả training lẫn inference; backward chỉ cần khi training.");
}

// ================================================================
// SLIDE 8 — Backpropagation intuition
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Trực giác: không phải thuật toán thần kỳ");
  bulletBlock(s, [
    "Backprop = Chain Rule áp dụng CÓ HỆ THỐNG trên computational graph",
    "Đi ngược từ Loss: mỗi bước hỏi “khuếch đại/giảm lỗi bao nhiêu?”",
    "Tận dụng giá trị forward đã lưu (cache) — không tính lại từ đầu",
    "Phổ biến bởi Rumelhart, Hinton & Williams (1986)",
  ], { y: 2.1, w: W - 2 * MX, h: 1.9, fontSize: 16.5 });

  // Assembly-line block diagram: forward = production, backward = "who's
  // responsible for the defect?" -- replaces the old narrative paragraph.
  const stW = 1.7, stH = 0.75, stGap = 0.55, stY = 4.55;
  const stages = ["Công đoạn 1", "Công đoạn 2", "Công đoạn 3", "Sản phẩm\n(lỗi)"];
  const totalW = stages.length * stW + (stages.length - 1) * stGap;
  let sx = (W - totalW) / 2;
  const cxs = [];
  stages.forEach((label, i) => {
    node(s, { x: sx, y: stY, w: stW, h: stH, label: label.replace("\n", " "), fs: 12,
              fill: i === stages.length - 1 ? "FBEEEC" : PAPER, lineColor: i === stages.length - 1 ? RED : INK });
    cxs.push(sx + stW / 2);
    sx += stW + stGap;
  });
  for (let i = 0; i < cxs.length - 1; i++) arrow(s, cxs[i] + stW / 2, stY + stH / 2, cxs[i + 1] - stW / 2, stY + stH / 2, { color: BLUE });
  const by = stY + stH + 0.5;
  for (let i = cxs.length - 2; i >= 0; i--) arrow(s, cxs[i + 1] - stW / 2, by, cxs[i] + stW / 2, by, { color: RED, dash: "dash" });
  s.addText("“Công đoạn nào gây lỗi nhiều nhất?” — đi ngược, hỏi từng bước", {
    x: MX, y: by + 0.12, w: W - 2 * MX, h: 0.35, align: "center", fontSize: 12, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addText("mũi tên xanh = forward (sản xuất)   ·   mũi tên đỏ đứt = backward (truy lỗi)", {
    x: MX, y: by + 0.55, w: W - 2 * MX, h: 0.3, align: "center", fontSize: 10.5, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 8); stampFooter(s, 8);
  noteText(s, "Ẩn dụ dây chuyền sản xuất bị lỗi, truy ngược công đoạn nào gây lỗi nhiều nhất — tương ứng với việc backprop hỏi từng lớp 'anh khuếch đại lỗi bao nhiêu?'.");
}

// ================================================================
// SLIDE 9 — Backpropagation derivation (2-layer)
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Suy ra gradient: mạng 2 lớp", { fontSize: 27 });
  const y = 2.1, nodeH = 0.62;
  const labels = ["x", "Linear\nW₁,b₁", "ReLU", "Linear\nW₂,b₂", "ŷ", "L"];
  const nodeWs = [0.9, 1.55, 1.15, 1.55, 0.9, 0.9];
  const gap = 0.35;
  let x0 = MX;
  const centers = [], rights = [];
  labels.forEach((label, i) => {
    node(s, { x: x0, y, w: nodeWs[i], h: nodeH, label: label.replace("\n", " "), fs: 12 });
    centers.push(x0 + nodeWs[i] / 2);
    rights.push(x0 + nodeWs[i]);
    x0 += nodeWs[i] + gap;
  });
  for (let i = 0; i < labels.length - 1; i++) arrow(s, rights[i], y + nodeH / 2, centers[i + 1] - nodeWs[i + 1] / 2, y + nodeH / 2, { color: BLUE, width: 2 });
  const by = y + nodeH + 0.55;
  arrow(s, centers[5], by, centers[3], by, { color: RED, dash: "dash" });
  arrow(s, centers[3], by, centers[1], by, { color: RED, dash: "dash" });
  s.addText("δ₂ = ∂L/∂z₂  (cập nhật W₂,b₂)", { x: centers[3] - 1.1, y: by + 0.08, w: 2.2, h: 0.3, align: "center", fontSize: 10.5, color: RED, fontFace: "Cambria Math", isTextBox: true, margin: 0 });
  s.addText("δ₁ = ∂L/∂z₁  (cập nhật W₁,b₁)", { x: centers[1] - 1.1, y: by + 0.08, w: 2.2, h: 0.3, align: "center", fontSize: 10.5, color: RED, fontFace: "Cambria Math", isTextBox: true, margin: 0 });

  bulletBlock(s, [
    "δ₂ = ŷ − y  (output activation = identity)",
    "∂L/∂W₂ = a₁δ₂ᵀ ,  ∂L/∂a₁ = W₂δ₂",
    "δ₁ = (∂L/∂a₁) ⊙ ReLU′(z₁)  →  ∂L/∂W₁ = xδ₁ᵀ",
    "Số liệu: neuron 2 “chết” (z₁[2]<0) → cột 2 của CẢ HAI gradient = 0 — minh hoạ dead ReLU",
  ], { y: 4.35, w: W - 2 * MX, h: 2.7, fontSize: 14.5, spaceAfter: 9 });
  pageTag(s, 9); stampFooter(s, 9);
  noteText(s, "Đây là ví dụ CHỦ ĐẠO xuyên suốt bài — nhắc lại số liệu ở slide 20 (manual backprop) và slide 21 (gradient check) dùng ĐÚNG ví dụ này.");
}

// ================================================================
// SLIDE 10 — Matrix form
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Dạng ma trận (khớp code NumPy/PyTorch)");
  formulaBox(s, "Z⁽ˡ⁾ = A⁽ˡ⁻¹⁾W⁽ˡ⁾ + b⁽ˡ⁾          (hàng = 1 mẫu, khớp batch code)", { y: 2.05, h: 0.85, fontSize: 17 });
  bulletBlock(s, [
    "∂L/∂W⁽ˡ⁾ = (A⁽ˡ⁻¹⁾)ᵀ · (∂L/∂Z⁽ˡ⁾)",
    "∂L/∂b⁽ˡ⁾ = tổng theo trục batch (hệ quả của broadcasting bias)",
    "∂L/∂A⁽ˡ⁻¹⁾ = (∂L/∂Z⁽ˡ⁾) · (W⁽ˡ⁾)ᵀ   — tiếp tục lan truyền ngược",
  ], { y: 3.2, w: W - 2 * MX, h: 2.0, fontSize: 16 });
  const cx = MX, cw = W - 2 * MX;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: 5.35, w: cw, h: 1.35, rectRadius: 0.06, fill: { color: PANEL }, line: { color: LINE, width: 0.75 } , shadow: cardShadow() });
  s.addText("Kiểm tra kích thước (cách tự-debug khi code):  (nₗ₋₁×N)(N×nₗ) = nₗ₋₁×nₗ  khớp W⁽ˡ⁾", {
    x: cx + 0.3, y: 5.5, w: cw - 0.6, h: 0.45, fontSize: 13.5, color: INK, fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
  s.addText("(N×nₗ)(nₗ×nₗ₋₁) = N×nₗ₋₁  khớp A⁽ˡ⁻¹⁾", {
    x: cx + 0.3, y: 5.95, w: cw - 0.6, h: 0.45, fontSize: 13.5, color: INK, fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
  pageTag(s, 10); stampFooter(s, 10);
  noteText(s, "Nếu bị hỏi 'vì sao chuyển vị ở đây' → kiểm tra kích thước ma trận là cách tự-debug đáng tin cậy nhất khi tự viết code backprop.");
}

// ================================================================
// SLIDE 11 — Backprop vs Gradient Descent
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Backpropagation ≠ Gradient Descent", { fontSize: 27 });
  const colW = 5.6, y = 2.15, h = 3.9;
  const leftX = MX, rightX = W - MX - colW;
  s.addShape(pres.ShapeType.roundRect, { x: leftX, y, w: colW, h, rectRadius: 0.08, fill: { color: "EAF0FB" }, line: { color: BLUE, width: 1 } , shadow: cardShadow() });
  s.addText("Backpropagation", { x: leftX + 0.3, y: y + 0.25, w: colW - 0.6, h: 0.4, fontSize: 17, bold: true, color: BLUE, fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
  bulletBlock(s, [
    "Thuật toán TÍNH ∇θL hiệu quả",
    "Dùng Chain Rule + computational graph",
    "Đầu ra: vector gradient",
    "Có thể thay bằng finite-difference (chậm, O(P) forward)",
  ], { x: leftX + 0.3, y: y + 0.8, w: colW - 0.6, h: h - 1.0, fontSize: 14, bulletColor: BLUE });
  s.addShape(pres.ShapeType.roundRect, { x: rightX, y, w: colW, h, rectRadius: 0.08, fill: { color: "FBEEEC" }, line: { color: RED, width: 1 } , shadow: cardShadow() });
  s.addText("Gradient Descent / Optimizer", { x: rightX + 0.3, y: y + 0.25, w: colW - 0.6, h: 0.4, fontSize: 17, bold: true, color: RED, fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
  bulletBlock(s, [
    "Quy tắc CẬP NHẬT tham số: θ ← θ − η∇θL",
    "Dùng gradient đã có (từ bất kỳ nguồn nào)",
    "Đầu ra: tham số mới",
    "Biến thể: SGD, Momentum, Adam, Newton's method…",
  ], { x: rightX + 0.3, y: y + 0.8, w: colW - 0.6, h: h - 1.0, fontSize: 14, bulletColor: RED });
  pageTag(s, 11); stampFooter(s, 11);
  noteText(s, "Đây là câu hỏi hay bị hỏi phản biện nhất — trả lời dứt khoát: Backprop trả lời CÁI GÌ (gradient), Gradient Descent trả lời NÊN LÀM GÌ với cái đó (cập nhật).");
}

// ================================================================
// SLIDE 12 — Why Initialization Matters
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Vì sao Initialization quan trọng");
  bulletBlock(s, [
    "Gradient Descent chỉ di chuyển CỤC BỘ quanh điểm xuất phát θ₀",
    "Chọn θ₀ sai → mạng đứng yên mãi mãi (Zero-init), hoặc gradient nổ / biến mất trước khi kịp học",
    "…bất kể optimizer tốt đến đâu",
  ], { y: 2.2, w: 7.2, h: 3.0, fontSize: 17 });
  const cx = 8.5, cw = 4.1, cy = 2.2, ch = 4.2;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.08, fill: { color: NAVY } , shadow: cardShadow() });
  s.addText("θ₀ quyết định điều gì?", { x: cx + 0.3, y: cy + 0.3, w: cw - 0.6, h: 0.4, fontSize: 14, bold: true, color: "CADCFC", fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
  s.addText("Gradient có “sống sót” đủ lớn để đi xuyên suốt một mạng nhiều lớp hay không — chủ đề của toàn bộ phần này.", {
    x: cx + 0.3, y: cy + 0.85, w: cw - 0.6, h: 2.0, fontSize: 14, italic: true, color: PAPER, fontFace: FONT_BODY, isTextBox: true, margin: 0, valign: "top",
  });
  pageTag(s, 12); stampFooter(s, 12);
  noteText(s, "Cầu nối sang phần 2 của báo cáo — từ 'cách tính gradient' sang 'điểm khởi đầu để gradient đó có ích'.");
}

// ================================================================
// SLIDE 13 — Zero Initialization
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Zero Initialization");
  bulletBlock(s, [
    "W giống nhau (kể cả 0) → mọi neuron cùng z, cùng a, cùng gradient — MÃI MÃI",
    "“Mất khả năng phá vỡ đối xứng” (symmetry breaking) — lớp n neuron chỉ có sức mạnh như 1",
    "Với W=0 ở MỌI lớp: gradient lớp ẩn = ĐÚNG BẰNG 0, không chỉ “rất nhỏ”",
  ], { y: 2.1, w: 7.0, h: 3.2, fontSize: 16 });
  statCallout(s, { x: 8.3, y: 2.6, w: 4.3, h: 1.8, value: "0.0", label: "gradient đo được tại MỌI lớp ẩn (thực nghiệm, Mục 9)", color: RED });
  s.addText("Zero-init không phải “rất nhỏ” — mà là CHẶN ĐỨNG tuyệt đối", {
    x: 8.3, y: 4.6, w: 4.3, h: 0.9, fontSize: 12.5, italic: true, color: MUTED, align: "center",
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 13); stampFooter(s, 13);
  noteText(s, "Nhấn mạnh '0 tuyệt đối' không phải 'rất nhỏ' — đây là điểm khác Random init, và được xác nhận đúng bằng số liệu thực nghiệm thật ở Mục 9 của báo cáo.");
}

// ================================================================
// SLIDE 14 — Random Initialization
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Random Initialization");
  bulletBlock(s, [
    "Phá đối xứng: mỗi neuron xuất phát khác nhau → học đặc trưng khác nhau",
    "Nhưng nếu σ không scale theo n_in → mạng SÂU vẫn có thể vanish/explode",
    "Thực nghiệm: gradient lớp 1 (Sigmoid, 6 lớp) chỉ ≈ 3×10⁻¹¹ — gần như 0",
  ], { y: 2.15, w: W - 2 * MX, h: 2.6, fontSize: 16.5 });
  const cx = MX, cw = W - 2 * MX;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: 5.0, w: cw, h: 1.2, rectRadius: 0.08, fill: { color: PANEL }, line: { color: LINE, width: 0.75 } , shadow: cardShadow() });
  s.addText("Phá đối xứng là ĐIỀU KIỆN CẦN — chưa ĐỦ để đảm bảo gradient chảy tốt qua mạng sâu", {
    x: cx + 0.3, y: 5.0, w: cw - 0.6, h: 1.2, align: "center", valign: "middle", fontSize: 15.5, italic: true, bold: true, color: NAVY, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 14); stampFooter(s, 14);
  noteText(s, "Cầu nối: phá đối xứng chỉ là bước đầu. Điều này dẫn tới các scheme 'khoa học' hơn ở các slide tiếp theo.");
}

// ================================================================
// SLIDE 15 — Xavier/Glorot
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Xavier / Glorot Initialization");
  formulaBox(s, "Var(W) = 2 / (n_in + n_out)", { y: 2.05, h: 0.85, fontSize: 20 });
  bulletBlock(s, [
    "Dung hoà 2 điều kiện: giữ Var(z) khi forward VÀ giữ Var(gradient) khi backward",
    "Phù hợp Tanh/Sigmoid — activation đối xứng quanh 0",
    "Thực nghiệm: Tanh + Xavier đạt 69.2% test accuracy (cao nhất trong lưới 20 cấu hình)",
  ], { y: 3.2, w: W - 2 * MX, h: 2.2, fontSize: 16 });
  statCallout(s, { x: MX, y: 5.4, w: 3.6, h: 1.3, value: "69.2%", label: "Tanh + Xavier — test accuracy", color: BLUE });
  statCallout(s, { x: 4.9, y: 5.4, w: 3.6, h: 1.3, value: "n_in ≠ n_out", label: "2 điều kiện chỉ trùng khi bằng nhau", color: MUTED });
  statCallout(s, { x: 9.1, y: 5.4, w: 3.6, h: 1.3, value: "2010", label: "Glorot & Bengio, AISTATS", color: MUTED });
  pageTag(s, 15); stampFooter(s, 15);
  noteText(s, "Nếu hỏi 'vì sao trung bình n_in, n_out' → 2 điều kiện (giữ Var(z) và Var(gradient)) chỉ khớp khi n_in=n_out; Glorot chọn điểm dung hoà 2/(n_in+n_out).");
}

// ================================================================
// SLIDE 16 — He/Kaiming
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "He / Kaiming Initialization");
  formulaBox(s, "Var(W) = 2 / n_in", { y: 2.05, h: 0.85, fontSize: 20 });
  bulletBlock(s, [
    "Gấp đôi Xavier — bù ReLU triệt tiêu ~một nửa variance (z<0 → 0)",
    "Phù hợp ReLU / Leaky ReLU",
    "Hệ quả bậc-1 chưa xử lý: ReLU còn LỆCH TÂM DƯƠNG (E[a]≈0.4σ>0) — động lực cho ELU/SELU tự chuẩn hoá",
    "Thực nghiệm: ReLU+Xavier 67.4% vs. ReLU+He 66.7% (n=1 seed)",
  ], { y: 3.05, w: W - 2 * MX, h: 2.5, fontSize: 15, spaceAfter: 8 });
  const cx = MX, cw = W - 2 * MX;
  s.addShape(pres.ShapeType.roundRect, { x: cx, y: 5.5, w: cw, h: 1.15, rectRadius: 0.08, fill: { color: "FBEEEC" }, line: { color: RED, width: 0.75 } , shadow: cardShadow() });
  s.addText("Trung thực khoa học: chênh lệch He/Xavier trên KHÔNG có ý nghĩa thống kê (statistically insignificant, n=1) — KHÔNG kết luận Xavier vượt trội He cho ReLU", {
    x: cx + 0.3, y: 5.5, w: cw - 0.6, h: 1.15, align: "center", valign: "middle", fontSize: 13, italic: true, color: NAVY, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 16); stampFooter(s, 16);
  noteText(s, "Cơ hội thể hiện tư duy phản biện nếu bị hỏi: không phải mọi dự đoán lý thuyết đều được xác nhận rõ ràng ở thực nghiệm nhỏ — đây là điểm trung thực, không phải điểm yếu.");
}

console.log("Slides 1-16 built.");

module.exports = { pres, W, H, MX, NAVY, INK, MUTED, PAPER, PANEL, BLUE, RED, GOOD, LINE,
  FONT_HEAD, FONT_BODY, kicker, title, bulletBlock, formulaBox, noteText, darkBg, statCallout,
  arrow, node, pageTag, FIG, nodeChainRow, cardShadow, GOLD, ACTS, stampFooter };
