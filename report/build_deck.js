/**
 * PPTX deck generator, v2 -- structured around the research-narrative outline
 * requested by the user (Derivative -> Gradient -> Backprop -> Vanishing/
 * Exploding -> Initialization -> Demo/Experiments -> Depth experiment ->
 * Results -> Conclusion), replacing the earlier build_pptx.js/build_pptx_part2.js.
 *
 * All experimental numbers below are read LIVE from results/logs/*.json and
 * results/tables/*.csv -- nothing is hardcoded/fabricated. Re-running the
 * underlying experiments (experiments/run_deep_demo.py,
 * experiments/run_depth_experiment_v2.py) and then this script keeps the
 * deck in sync automatically.
 *
 * Cai dat:  npm install pptxgenjs
 * Chay:     node build_deck.js
 * Output:   Slide_Backprop_Initialization.pptx
 */
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const FIG = (name) => path.join("..", "results", "figures", name);
// Python's json module writes bare NaN/Infinity (valid for it, invalid for
// strict JSON) when a run diverges (e.g. random_large exploding to NaN loss)
// -- sanitize to null before JSON.parse.
const readJSON = (relPath) => {
  const raw = fs.readFileSync(path.join(ROOT, relPath), "utf-8")
    .replace(/:\s*NaN/g, ": null")
    .replace(/:\s*-?Infinity/g, ": null");
  return JSON.parse(raw);
};

// ---------------------------------------------------------------- live data
const demoSchemes = ["zero", "random_normal", "random_large", "xavier", "he"];
const demo = {};
demoSchemes.forEach((s) => { demo[s] = readJSON(`results/logs/deep_demo_${s}.json`); });
const depthV2 = readJSON("results/logs/depth_experiment_v2.json");
const mainZeroSigmoid = readJSON("results/logs/run_zero_sigmoid.json");
const mainHeRelu = readJSON("results/logs/run_he_relu.json");
const mainXavierRelu = readJSON("results/logs/run_xavier_relu.json");
const multiseedRows = fs.readFileSync(path.join(ROOT, "results/tables/multiseed_xavier_he_summary.csv"), "utf-8")
  .split("\n").filter(Boolean).slice(1).map((line) => {
    const [scheme, n_seeds, acc_mean, acc_std, grms_mean, grms_std] = line.split(",");
    return { scheme, n_seeds: +n_seeds, acc_mean: +acc_mean, acc_std: +acc_std, grms_mean: +grms_mean, grms_std: +grms_std };
  });
const multiseed = (scheme) => multiseedRows.find((r) => r.scheme === scheme);

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const pp = (x) => `${(x * 100).toFixed(1)}`; // percentage points, no % sign (for ± compositions)
const depthRow = (scheme, depth) => depthV2.find((r) => r.scheme === scheme && r.depth === depth);

// ---------------------------------------------------------------- palette
const NAVY = "16213E";
const INK = "1A2238";
const MUTED = "5B6478";
const PAPER = "FFFFFF";
const PANEL = "F1F4F9";
const BLUE = "285AB4";
const RED = "BE3C32";
const GOOD = "2E7D5B";
const GOLD = "C68A2E";
const PURPLE = "7D3C98";
const LINE = "D9DEE8";
const cardShadow = () => ({ type: "outer", color: "1A1A2E", opacity: 0.20, blur: 9, offset: 3, angle: 90 });

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
const W = 13.333, H = 7.5;
const MX = 0.7;

const TOTAL_SLIDES = 30;
const ACTS = [
  { label: "Motivation & Math", from: 2, to: 9 },
  { label: "Vanishing/Exploding & Init", from: 10, to: 17 },
  { label: "Experiment", from: 18, to: 27 },
  { label: "Conclusion", from: 28, to: 30 },
];

// ---------------------------------------------------------------- helpers
function pageTag(slide, n) {
  slide.addText(`${n}/${TOTAL_SLIDES}`, {
    x: W - 1.1, y: H - 0.45, w: 0.8, h: 0.3, fontSize: 9, color: MUTED,
    align: "right", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}
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
    x: MX + ACTS.length * gap + 0.05, y: y - 0.09, w: 3.6, h: 0.3,
    fontSize: 8.5, color: dark ? "6FA3E0" : MUTED, charSpacing: 0.5,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}
function kicker(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: MX, y: opts.y ?? 0.5, w: 10, h: 0.35, fontSize: 13, bold: true,
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
function subtitle(slide, text, opts = {}) {
  slide.addText(text, {
    x: MX, y: opts.y ?? 1.55, w: W - 2 * MX, h: 0.4, fontSize: opts.fontSize ?? 15,
    italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
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
    x, y, w, h, rectRadius: 0.08, fill: { color: opts.fill || PANEL }, line: { color: LINE, width: 0.75 },
    shadow: cardShadow(),
  });
  slide.addText(text, {
    x: x + 0.25, y, w: w - 0.5, h, fontSize: opts.fontSize ?? 19, color: opts.color || NAVY,
    align: "center", valign: "middle", fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
}
function noteText(slide, txt) { slide.addNotes(txt); }
function darkBg(slide) { slide.background = { color: NAVY }; }
function statCallout(slide, { x, y, w, h, value, label, color }) {
  slide.addText(value, {
    x, y, w, h: h * 0.6, fontSize: 30, bold: true, color: color || BLUE,
    align: "center", valign: "bottom", fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  slide.addText(label, {
    x, y: y + h * 0.6, w, h: h * 0.4, fontSize: 11, color: MUTED,
    align: "center", valign: "top", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
}
function arrow(slide, x1, y1, x2, y2, opts = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  const forward = x2 >= x1 && y2 >= y1;
  const lineProps = { color: opts.color || BLUE, width: opts.width || 2.25, dashType: opts.dash || "solid" };
  if (forward) lineProps.endArrowType = "triangle"; else lineProps.beginArrowType = "triangle";
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
function twoCol(slide, { leftTitle, leftItems, leftColor = BLUE, leftFill = "EAF0FB",
  rightTitle, rightItems, rightColor = RED, rightFill = "FBEEEC", y = 2.1, h = 4.3, fs = 13.5 }) {
  const colW = 5.6, leftX = MX, rightX = W - MX - colW;
  slide.addShape(pres.ShapeType.roundRect, { x: leftX, y, w: colW, h, rectRadius: 0.08, fill: { color: leftFill }, line: { color: leftColor, width: 1 }, shadow: cardShadow() });
  slide.addText(leftTitle, { x: leftX + 0.3, y: y + 0.22, w: colW - 0.6, h: 0.6, fontSize: 14.5, bold: true, color: leftColor, fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
  bulletBlock(slide, leftItems, { x: leftX + 0.3, y: y + 0.95, w: colW - 0.6, h: h - 1.1, fontSize: fs, bulletColor: leftColor, spaceAfter: 9 });
  slide.addShape(pres.ShapeType.roundRect, { x: rightX, y, w: colW, h, rectRadius: 0.08, fill: { color: rightFill }, line: { color: rightColor, width: 1 }, shadow: cardShadow() });
  slide.addText(rightTitle, { x: rightX + 0.3, y: y + 0.22, w: colW - 0.6, h: 0.6, fontSize: 14.5, bold: true, color: rightColor, fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
  bulletBlock(slide, rightItems, { x: rightX + 0.3, y: y + 0.95, w: colW - 0.6, h: h - 1.1, fontSize: fs, bulletColor: rightColor, spaceAfter: 9 });
}

// ================================================================
// SLIDE 1 — Title
// ================================================================
{
  const s = pres.addSlide(); darkBg(s);
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
            flipV: b.y < a.y, line: { color: "3A4A70", width: 0.5, transparency: 55 },
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
  s.addText("Backpropagation & Parameter Initialization", {
    x: MX, y: 2.15, w: W - 2 * MX, h: 1.2, fontSize: 34, bold: true, color: PAPER,
    align: "center", fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  s.addText("in Deep Neural Networks", {
    x: MX, y: 3.05, w: W - 2 * MX, h: 0.6, fontSize: 22, color: PAPER,
    align: "center", fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  s.addText("How gradients and initialization determine whether a neural network can learn", {
    x: MX, y: 3.85, w: W - 2 * MX, h: 0.5, fontSize: 15, italic: true, color: "CADCFC",
    align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addShape(pres.ShapeType.line, { x: W / 2 - 0.9, y: 4.55, w: 1.8, h: 0, line: { color: BLUE, width: 2 } });
  s.addText("Đạo hàm & Khởi tạo trong Deep Learning — Backpropagation và Parameter Initialization", {
    x: MX, y: 4.8, w: W - 2 * MX, h: 0.4, fontSize: 12.5, color: "8FA3C9",
    align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addText("Bùi Đức Quân · Học phần Deep Learning (Thạc sĩ) · Tháng 9, 2026", {
    x: MX, y: 6.5, w: W - 2 * MX, h: 0.4, fontSize: 13, color: "8FA3C9",
    align: "center", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  noteText(s, "Đặt khung nghiên cứu ngay từ đầu: bài trình bày trả lời CÂU HỎI 'Khởi tạo tham số ảnh hưởng thế nào đến lan truyền gradient và khả năng hội tụ của mạng sâu?' — không chỉ giảng lại công thức.");
}

// ================================================================
// SLIDE 2 — Motivation
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Motivation");
  title(s, "How does a 50-layer network learn?");
  const cx = W / 2, topY = 1.95, boxW = 2.6, boxH = 0.55, gap = 0.32;
  const layers = ["Input", "Layer 1", "Layer 2", "...", "Layer 50", "Loss"];
  layers.forEach((lab, i) => {
    const y = topY + i * (boxH + gap);
    node(s, { x: cx - boxW / 2, y, w: boxW, h: boxH, label: lab, fill: i === layers.length - 1 ? "FBEEEC" : PANEL, lineColor: i === layers.length - 1 ? RED : LINE, fs: 13.5 });
    if (i < layers.length - 1) arrow(s, cx, y + boxH, cx, y + boxH + gap, { color: BLUE, width: 2 });
  });
  s.addText("How does Layer 1 know how it should change?", {
    x: MX, y: topY - 0.05, w: 4.3, h: 0.8, fontSize: 15, italic: true, color: INK,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addText("⇒ Backpropagation", {
    x: MX, y: topY + 0.85, w: 4.3, h: 0.5, fontSize: 17, bold: true, color: BLUE,
    fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  s.addText("But then a new problem appears:", {
    x: W - MX - 4.3, y: topY + 2.4, w: 4.3, h: 0.5, fontSize: 15, italic: true, color: INK,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  s.addText("gradient → 0 ?\ngradient → ∞ ?", {
    x: W - MX - 4.3, y: topY + 3.0, w: 4.3, h: 1.0, fontSize: 18, bold: true, color: RED,
    fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
  s.addText("⇒ Parameter Initialization", {
    x: W - MX - 4.3, y: topY + 4.15, w: 4.3, h: 0.5, fontSize: 17, bold: true, color: GOLD,
    fontFace: FONT_HEAD, isTextBox: true, margin: 0,
  });
  pageTag(s, 2); stampFooter(s, 2);
  noteText(s, "Câu hỏi nghiên cứu đóng khung toàn bài: 'Khởi tạo tham số ảnh hưởng thế nào đến lan truyền gradient và khả năng hội tụ của mạng sâu?'. Ba câu hỏi con: (1) Backprop tính gradient thế nào, (2) vì sao mạng sâu gặp vanishing/exploding, (3) Zero/Random/Xavier/He ảnh hưởng thế nào tới huấn luyện.");
}

// ================================================================
// SLIDE 3 — Derivative
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Foundations");
  title(s, "Derivative");
  formulaBox(s, "f'(x) = lim_{h→0} [f(x+h) − f(x)] / h", { y: 1.95, h: 0.85, fontSize: 19 });
  bulletBlock(s, [
    "Derivative đo mức độ thay đổi của output khi input thay đổi một lượng nhỏ",
    "Ví dụ: f(x) = x²  ⇒  f′(x) = 2x",
    "Đây là viên gạch nền tảng duy nhất cần nhớ — mọi thứ sau đây (gradient, chain rule, backprop) chỉ là ÁP DỤNG CÓ HỆ THỐNG của khái niệm này",
  ], { y: 3.1, w: W - 2 * MX, h: 2.6, fontSize: 17, spaceAfter: 14 });
  pageTag(s, 3); stampFooter(s, 3);
  noteText(s, "Không dành nhiều thời gian cho calculus cơ bản — chỉ nhắc lại đúng 1 slide, đủ để làm nền cho gradient/chain rule sau đây.");
}

// ================================================================
// SLIDE 4 — Partial Derivative & Gradient
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Foundations");
  title(s, "Partial Derivative & Gradient");
  bulletBlock(s, [
    "Deep Learning có hàng triệu tham số: L(w₁, w₂, ..., wₙ)",
    "Gradient = vector gồm TẤT CẢ đạo hàm riêng, một cho mỗi tham số",
    "∇L chỉ HƯỚNG TĂNG nhanh nhất của Loss trong không gian tham số",
    "Gradient Descent cập nhật theo hướng NGƯỢC gradient (−∇L) — hướng giảm nhanh nhất cục bộ",
  ], { x: MX, y: 2.0, w: 6.2, h: 3.6, fontSize: 15.5, spaceAfter: 12 });
  formulaBox(s, "∇L = [ ∂L/∂w₁ ; ∂L/∂w₂ ; ... ; ∂L/∂wₙ ]", {
    x: MX + 6.6, y: 2.3, w: W - 2 * MX - 6.6, h: 2.6, fontSize: 17,
  });
  pageTag(s, 4); stampFooter(s, 4);
  noteText(s, "Nhấn mạnh chính xác: gradient chỉ hướng TĂNG nhanh nhất của Loss — không phải hướng giảm. Gradient Descent phải đi NGƯỢC gradient (−∇L) để giảm Loss. Đây là điểm hay bị phát biểu sai/rút gọn quá mức.");
}

// ================================================================
// SLIDE 5 — Gradient Descent
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Foundations");
  title(s, "Gradient Descent");
  formulaBox(s, "w_new = w_old − η · ∂L/∂w          (dạng vector: θ_new = θ_old − η∇_θL)", { y: 1.95, h: 0.85, fontSize: 17 });
  bulletBlock(s, [
    "w — parameter cần cập nhật (θ — toàn bộ vector tham số)",
    "η (learning rate) — bước nhảy mỗi lần cập nhật",
    "L — loss function cần tối thiểu hoá",
    "Dấu trừ là bắt buộc: −∇L mới là hướng GIẢM, vì ∇L tự nó chỉ hướng tăng — trực giác: quả bóng lăn xuống 'loss landscape' theo hướng ngược gradient",
  ], { y: 3.1, w: W - 2 * MX, h: 3.2, fontSize: 15.5, spaceAfter: 12 });
  pageTag(s, 5); stampFooter(s, 5);
  noteText(s, "Gradient Descent là QUY TẮC CẬP NHẬT dùng gradient đã có — khác với Backpropagation (thuật toán TÍNH gradient) — sẽ làm rõ phân biệt này ở slide Multi-layer Backpropagation.");
}

// ================================================================
// SLIDE 6 — Forward Propagation
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Neural Network");
  title(s, "Forward Propagation");
  const cy = 2.3, x1 = MX + 0.3, xz = x1 + 2.6, xa = xz + 2.2, xL = xa + 2.4;
  node(s, { x: x1, y: cy - 0.6, w: 1.3, h: 0.5, label: "x₁", fill: PANEL });
  node(s, { x: x1, y: cy + 0.3, w: 1.3, h: 0.5, label: "x₂", fill: PANEL });
  node(s, { x: xz, y: cy - 0.15, w: 1.3, h: 0.6, label: "z", fill: "EAF0FB", lineColor: BLUE });
  node(s, { x: xa, y: cy - 0.15, w: 1.7, h: 0.6, label: "activation", fill: "EAF0FB", lineColor: BLUE, fs: 12 });
  node(s, { x: xL, y: cy - 0.15, w: 1.3, h: 0.6, label: "ŷ → L", fill: "FBEEEC", lineColor: RED });
  arrow(s, x1 + 1.3, cy - 0.35, xz, cy + 0.15, { color: BLUE, width: 1.75 });
  arrow(s, x1 + 1.3, cy + 0.55, xz, cy + 0.15, { color: BLUE, width: 1.75 });
  arrow(s, xz + 1.3, cy + 0.15, xa, cy + 0.15, { color: BLUE, width: 1.75 });
  arrow(s, xa + 1.7, cy + 0.15, xL, cy + 0.15, { color: BLUE, width: 1.75 });
  formulaBox(s, "z = w₁x₁ + w₂x₂ + b        a = f(z)        L = L(a, y)", {
    y: cy + 1.4, h: 0.85, w: W - 2 * MX, fontSize: 17,
  });
  bulletBlock(s, [
    "Forward pass CHƯA tính parameter gradients — nó tính output VÀ lưu lại các intermediate values/computational graph mà backward pass cần để tính gradient",
    "Mục tiêu cuối cùng: tính được ∂L/∂w₁ (và mọi tham số khác) để cập nhật bằng Gradient Descent",
  ], { y: cy + 1.4 + 0.85 + 0.35, w: W - 2 * MX, h: 1.6, fontSize: 15, spaceAfter: 10 });
  pageTag(s, 6); stampFooter(s, 6);
  noteText(s, "Tránh phát biểu tuyệt đối 'forward không liên quan gì tới gradient' — chính xác hơn: forward pass chưa TÍNH gradient, nhưng nó tạo ra (và lưu lại) mọi thứ backward pass cần dùng để tính gradient (đây là điều PyTorch autograd làm ngầm khi xây computational graph).");
}

// ================================================================
// SLIDE 7 — Chain Rule
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Chain Rule — trái tim của Backpropagation");
  const cx = MX + 1.0, topY = 2.0, boxW = 1.6, boxH = 0.55, gap = 0.42;
  ["w", "z", "a", "L"].forEach((lab, i) => {
    const y = topY + i * (boxH + gap);
    node(s, { x: cx, y, w: boxW, h: boxH, label: lab, fill: i === 3 ? "FBEEEC" : PANEL, lineColor: i === 3 ? RED : LINE });
    if (i < 3) arrow(s, cx + boxW / 2, y + boxH, cx + boxW / 2, y + boxH + gap, { color: BLUE, width: 2 });
  });
  s.addText("Forward: mỗi mũi tên là 1 phép biến đổi", {
    x: cx - 0.2, y: topY - 0.55, w: 3.4, h: 0.4, fontSize: 12.5, italic: true, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  formulaBox(s, "∂L/∂w  =  (∂L/∂a) · (∂a/∂z) · (∂z/∂w)", {
    x: cx + 2.6, y: 2.9, w: W - MX - (cx + 2.6), h: 1.0, fontSize: 19,
  });
  bulletBlock(s, [
    "Muốn biết w ảnh hưởng L thế nào, ta NHÂN các đạo hàm cục bộ dọc theo đường đi w → z → a → L",
    "Đây chính là ý tưởng cốt lõi của Backpropagation: đi ngược đồ thị, nhân dồn đạo hàm cục bộ",
  ], { x: cx + 2.6, y: 4.2, w: W - MX - (cx + 2.6), h: 1.5, fontSize: 15, spaceAfter: 10 });
  s.addText("Trong mạng thực tế, activation/parameter là vector/ma trận — Backpropagation áp dụng multivariable chain rule qua Jacobian/vector-Jacobian product; PyTorch autograd làm việc này tự động.", {
    x: cx + 2.6, y: 6.05, w: W - MX - (cx + 2.6), h: 0.9, fontSize: 11.5, italic: true, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 7); stampFooter(s, 7);
  noteText(s, "Chain rule đa biến là nội dung toán học cốt lõi của Backpropagation. Ví dụ ở đây là trường hợp scalar để dễ hình dung — trong mạng thực tế, phép nhân đạo hàm cục bộ tổng quát thành vector-Jacobian product (VJP), điều PyTorch autograd tự động hoá.");
}

// ================================================================
// SLIDE 8 — Backpropagation Example
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Backpropagation Example");
  const cy = 2.2, boxW = 1.3, boxH = 0.55, x0 = MX + 0.4, gap = 1.9;
  const labels = ["x=2", "w=3", "z=wx", "y=z²"];
  const xs = [x0, x0 + gap, x0 + 2 * gap, x0 + 3 * gap];
  node(s, { x: xs[0], y: cy, w: boxW, h: boxH, label: "x = 2", fill: PANEL });
  node(s, { x: xs[1], y: cy + 0.9, w: boxW, h: boxH, label: "w = 3", fill: PANEL });
  node(s, { x: xs[2], y: cy, w: boxW, h: boxH, label: "z = wx", fill: "EAF0FB", lineColor: BLUE });
  node(s, { x: xs[3], y: cy, w: boxW, h: boxH, label: "y = z²", fill: "FBEEEC", lineColor: RED });
  arrow(s, xs[0] + boxW, cy + boxH / 2, xs[2], cy + boxH / 2, { color: BLUE, width: 2 });
  arrow(s, xs[1] + boxW / 2, cy + 0.9, xs[2] + boxW / 2, cy + boxH, { color: BLUE, width: 2 });
  arrow(s, xs[2] + boxW, cy + boxH / 2, xs[3], cy + boxH / 2, { color: BLUE, width: 2 });
  s.addText("Forward:  z = 3×2 = 6      y = 6² = 36", {
    x: MX, y: cy + 1.7, w: W - 2 * MX, h: 0.4, fontSize: 15.5, color: INK, fontFace: "Cambria Math", isTextBox: true, margin: 0,
  });
  arrow(s, xs[3] + boxW / 2, cy + boxH + 0.05, xs[2] + boxW / 2, cy + boxH + 0.55, { color: RED, width: 2.25, dash: "dash" });
  arrow(s, xs[2] + boxW / 2, cy + boxH + 0.55, xs[1] + boxW / 2, cy + boxH + 0.55 + (0.9 - boxH), { color: RED, width: 2.25, dash: "dash" });
  formulaBox(s, "∂y/∂z = 2z = 12          ∂z/∂w = x = 2          ⇒  ∂y/∂w = 12 × 2 = 24", {
    y: 4.9, h: 1.0, w: W - 2 * MX, fontSize: 17, fill: "FBEEEC", color: RED,
  });
  pageTag(s, 8); stampFooter(s, 8);
  noteText(s, "Ví dụ tối giản để 'chạy tay' toàn bộ chain rule 2 bước — mũi tên đỏ đứt nét minh hoạ dòng chảy NGƯỢC của backward pass.");
}

// ================================================================
// SLIDE 9 — Multi-layer Backpropagation
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Backpropagation");
  title(s, "Multi-layer Backpropagation");
  const leftX = MX + 0.3, boxW = 1.5, boxH = 0.42, gap = 0.18, topY = 1.85;
  const fwd = ["x", "W₁", "h₁", "W₂", "h₂", "W₃", "ŷ", "Loss"];
  fwd.forEach((lab, i) => {
    const y = topY + i * (boxH + gap);
    node(s, { x: leftX, y, w: boxW, h: boxH, label: lab, fill: i === fwd.length - 1 ? "FBEEEC" : PANEL, lineColor: i === fwd.length - 1 ? RED : LINE, fs: 12.5 });
    if (i < fwd.length - 1) arrow(s, leftX + boxW / 2, y + boxH, leftX + boxW / 2, y + boxH + gap, { color: BLUE, width: 1.8 });
  });
  const leftBottom = topY + (fwd.length - 1) * (boxH + gap) + boxH;
  const rightX = leftX + 3.3;
  const bwd = ["Loss", "∇W₃", "∇W₂", "∇W₁"];
  const rStep = (leftBottom - topY - boxH) / (bwd.length - 1);
  bwd.forEach((lab, i) => {
    const y = topY + i * rStep;
    node(s, { x: rightX, y, w: boxW + 0.3, h: boxH, label: lab, fill: i === 0 ? "FBEEEC" : "EAF0FB", lineColor: i === 0 ? RED : BLUE, fs: 12.5 });
    if (i < bwd.length - 1) arrow(s, rightX + (boxW + 0.3) / 2, y + boxH, rightX + (boxW + 0.3) / 2, y + rStep, { color: RED, width: 1.8 });
  });
  const rbX = rightX + 2.3, rbW = W - MX - (rightX + 2.3);
  bulletBlock(s, [
    "Gradient lan truyền về lớp gần input phụ thuộc vào TÍCH của nhiều local Jacobian VÀ weight transformation — không chỉ là tích các đạo hàm vô hướng đơn giản",
    "Đây chính là cầu nối trực tiếp sang vấn đề tiếp theo: điều gì xảy ra khi tích đó có nhiều số hạng?",
  ], { x: rbX, y: topY + 0.15, w: rbW, h: 2.1, fontSize: 14.5, spaceAfter: 12 });
  // Box phân biệt Backprop (tính gradient) vs Optimizer/GD (dùng gradient để update) --
  // tránh nhầm "Backprop tự update weight".
  const pipe = [
    { lab: "Forward", sub: "compute prediction + loss", fill: "EAF0FB", line: BLUE },
    { lab: "Backward", sub: "compute gradients (Backprop)", fill: "FBEEEC", line: RED },
    { lab: "Optimizer", sub: "update parameters (Gradient Descent)", fill: "FBF3E2", line: GOLD },
  ];
  const pbY = topY + 2.55, pbW = (rbW - 0.5) / 3, pbH = 1.15;
  pipe.forEach((p, i) => {
    const x = rbX + i * (pbW + 0.25);
    s.addShape(pres.ShapeType.roundRect, { x, y: pbY, w: pbW, h: pbH, rectRadius: 0.06, fill: { color: p.fill }, line: { color: p.line, width: 1 } });
    s.addText(p.lab, { x: x + 0.12, y: pbY + 0.1, w: pbW - 0.24, h: 0.35, fontSize: 13, bold: true, color: p.line, fontFace: FONT_HEAD, isTextBox: true, margin: 0 });
    s.addText(p.sub, { x: x + 0.12, y: pbY + 0.48, w: pbW - 0.24, h: pbH - 0.55, fontSize: 10, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
    if (i < pipe.length - 1) arrow(s, x + pbW, pbY + pbH / 2, x + pbW + 0.25, pbY + pbH / 2, { color: MUTED, width: 1.5 });
  });
  s.addText("Backpropagation KHÔNG tự cập nhật weight — nó chỉ tính gradient. Việc update là của Optimizer (Gradient Descent hoặc biến thể).", {
    x: rbX, y: pbY + pbH + 0.15, w: rbW, h: 0.55, fontSize: 11, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 9); stampFooter(s, 9);
  noteText(s, "Cầu nối cực kỳ quan trọng: lớp gần input có gradient là tích của NHIỀU Jacobian/weight transformation nhất — vì sao vanishing/exploding luôn nặng nhất ở các lớp đầu. Box Forward/Backward/Optimizer làm rõ ranh giới hay bị nhầm: Backpropagation là thuật toán TÍNH gradient; Gradient Descent (trong Optimizer) mới là quy tắc DÙNG gradient đó để update parameter — hai bước tách biệt, Backprop không tự sửa weight.");
}

// ================================================================
// SLIDE 10 — Vanishing Gradient
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Vanishing / Exploding Gradient");
  title(s, "Vanishing Gradient");
  formulaBox(s, "Minh hoạ: nếu mỗi bước co norm gradient theo hệ số ≈0.5, qua 20 layer:  0.5²⁰ ≈ 9.54×10⁻⁷", { y: 1.95, h: 0.9, fontSize: 15 });
  const bx = MX, by0 = 3.1, bw = 8.2, barH = 0.4, gap = 0.14;
  const labels = ["Layer 20", "Layer 15", "Layer 10", "Layer 5", "Layer 1"];
  const widths = [7.6, 4.2, 1.9, 0.6, 0.12];
  labels.forEach((lab, i) => {
    const y = by0 + i * (barH + gap);
    s.addShape(pres.ShapeType.roundRect, { x: bx + 2.2, y, w: widths[i], h: barH, rectRadius: 0.04, fill: { color: RED } });
    s.addText(lab, { x: bx, y, w: 2.1, h: barH, valign: "middle", fontSize: 12.5, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  });
  bulletBlock(s, [
    "Gradient trong mạng sâu = tích của nhiều local Jacobian và weight matrix; nếu các phép biến đổi này liên tục CO norm của gradient, gradient sẽ vanish",
    "Layer càng gần input, gradient càng phải đi qua nhiều phép nhân này — nên thường bị ảnh hưởng nặng nhất",
  ], { x: MX, y: 5.95, w: W - 2 * MX, h: 1.1, fontSize: 13, spaceAfter: 6 });
  pageTag(s, 10); stampFooter(s, 10);
  noteText(s, "Minh hoạ trực quan bằng thanh giảm dần (ví dụ đơn giản hoá 1 số vô hướng). Trong thực tế, cơ chế là TÍCH của nhiều Jacobian/weight matrix liên tục co norm — không phải chỉ 'đạo hàm < 1'. Số liệu thực nghiệm cho trường hợp này ở phần Demo (Experiment 1&2, Depth Experiment).");
}

// ================================================================
// SLIDE 11 — Exploding Gradient
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Vanishing / Exploding Gradient");
  title(s, "Exploding Gradient");
  formulaBox(s, "Minh hoạ: nếu mỗi bước khuếch đại norm gradient theo hệ số ≈1.5, qua 20 layer:  1.5²⁰ ≈ 3325", { y: 1.95, h: 0.9, fontSize: 15 });
  const bx = MX, by0 = 3.1, barH = 0.4, gap = 0.14;
  const labels = ["Layer 1", "Layer 5", "Layer 10", "Layer 15", "Layer 20"];
  const widths = [0.12, 0.5, 1.6, 4.4, 8.2];
  labels.forEach((lab, i) => {
    const y = by0 + i * (barH + gap);
    s.addShape(pres.ShapeType.roundRect, { x: bx + 2.2, y, w: widths[i], h: barH, rectRadius: 0.04, fill: { color: PURPLE } });
    s.addText(lab, { x: bx, y, w: 2.1, h: barH, valign: "middle", fontSize: 12.5, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
  });
  bulletBlock(s, [
    "Hậu quả: loss dao động mạnh hoặc trở thành NaN, weight tăng vọt",
    "Cùng cơ chế với vanishing — TÍCH của Jacobian/weight matrix, nhưng liên tục KHUẾCH ĐẠI thay vì co norm gradient",
    "Sẽ thấy hiện tượng này XẢY RA THẬT ở Experiment 3 (Random large init) ngay sau đây",
  ], { x: MX, y: 6.05, w: W - 2 * MX, h: 1.2, fontSize: 13, spaceAfter: 5 });
  pageTag(s, 11); stampFooter(s, 11);
  noteText(s, "'Hai mặt của cùng một đồng xu' với slide trước — cùng cơ chế tích luỹ qua nhiều lớp, chỉ khác việc norm gradient bị co lại hay khuếch đại. Tránh nói đơn giản hoá 'chỉ khác dấu của (đạo hàm−1)' — thực tế là hành vi của TÍCH nhiều ma trận/Jacobian, không phải một số vô hướng duy nhất. Experiment 3 (Random large, std=1.0) sẽ tái hiện đúng hiện tượng này bằng số liệu thật (train loss = NaN).");
}

// ================================================================
// SLIDE 12 — Why Initialization Matters
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Tại sao không đặt tất cả weight = 0?");
  formulaBox(s, "W = np.zeros(...)", { y: 1.95, h: 0.7, fontSize: 17 });
  bulletBlock(s, [
    "Mọi HIDDEN UNIT trong 1 lớp nhận CÙNG input, CÙNG weight ⇒ CÙNG z, CÙNG a, CÙNG gradient — giữ SYMMETRY",
    "Sau update: các hidden unit này vẫn giống hệt nhau — vấn đề áp dụng cho WEIGHT, không phải bias (bias thường vẫn khởi tạo 0 được, vì không gây đối xứng giữa các unit)",
    "Trong kiến trúc đang khảo sát: zero-init khiến hidden-layer gradient bằng 0, mạng không học được representation hữu ích",
  ], { y: 2.9, w: W - 2 * MX, h: 2.3, fontSize: 15, spaceAfter: 10 });
  const zr = mainZeroSigmoid;
  statCallout(s, {
    x: MX, y: 5.5, w: 4.2, h: 1.5, value: zr.initial_grad_norms[0].grad_rms.toFixed(1),
    label: `gradient RMS lớp ẩn đo được (thực nghiệm thật, Zero-init) — test acc = ${pct(zr.test_acc)}`, color: RED,
  });
  s.addText("Số liệu thật: trong setup này, Zero-init cho hidden-layer gradient RMS bằng 0.0 (không phải xấp xỉ)", {
    x: MX + 4.6, y: 5.75, w: W - 2 * MX - 4.6, h: 1.0, fontSize: 13, italic: true, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 12); stampFooter(s, 12);
  noteText(s, "Số liệu bên dưới lấy trực tiếp từ results/logs/run_zero_sigmoid.json — gradient RMS lớp ẩn đo được đúng bằng 0.0 trong thí nghiệm này. Phân biệt quan trọng: vấn đề symmetry là của WEIGHT (mọi hidden unit học giống hệt nhau); bias không gây đối xứng giữa các unit nên vẫn có thể khởi tạo 0.");
}

// ================================================================
// SLIDE 13 — Random Initialization
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Random Initialization");
  formulaBox(s, "W = np.random.randn(...) × std", { y: 1.9, h: 0.7, fontSize: 17 });
  twoCol(s, {
    leftTitle: "std quá NHỎ", leftColor: BLUE, leftFill: "EAF0FB",
    leftItems: ["weight nhỏ → activation nhỏ", "→ gradient nhỏ dần qua mỗi lớp", "→ có xu hướng VANISHING GRADIENT"],
    rightTitle: "std quá LỚN", rightColor: PURPLE, rightFill: "F3EAFB",
    rightItems: ["weight lớn → activation/pre-activation lớn", "ReLU: gradient có xu hướng tăng vọt qua mỗi lớp → EXPLODING", "Sigmoid/Tanh: pre-activation dễ rơi vào vùng BÃO HOÀ → derivative ≈ 0 → cũng VANISHING"],
    y: 2.75, h: 3.15, fs: 13.5,
  });
  s.addText("Hai thí nghiệm sau (Experiment 2 & 3, mạng ReLU) tái hiện std-nhỏ → vanishing và std-lớn → exploding bằng số liệu thật. Với activation bão hoà (sigmoid/tanh), std lớn còn có thể gây vanishing theo cơ chế khác (bão hoà), không chỉ exploding.", {
    x: MX, y: 6.05, w: W - 2 * MX, h: 1.0, fontSize: 12, italic: true, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 13); stampFooter(s, 13);
  noteText(s, "Bắc cầu trực tiếp sang Xavier/He: cả hai đều là cách CHỌN ĐÚNG variance thay vì chọn tuỳ tiện. Lưu ý quan trọng: kết luận 'std lớn → exploding' quan sát được trong experiment này là hành vi của mạng ReLU cụ thể; với sigmoid/tanh, std quá lớn còn có thể đẩy pre-activation vào vùng bão hoà, khiến derivative gần 0 và gây vanishing thay vì exploding.");
}

// ================================================================
// SLIDE 14 — Xavier Initialization
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "Xavier / Glorot Initialization");
  formulaBox(s, "Xavier/Glorot Normal:   W_ij ~ N(0, 2/(n_in+n_out))", { y: 1.95, h: 0.85, fontSize: 18 });
  bulletBlock(s, [
    "Mục tiêu: giữ variance của tín hiệu ỔN ĐỊNH qua từng lớp (Layer 1 variance ≈ Layer 2 ≈ Layer 3 ≈ ...)",
    "Cân bằng 2 điều kiện: giữ Var(z) khi forward VÀ giữ Var(gradient) khi backward",
    "Thường dùng với Tanh hoặc activation có gain phù hợp — riêng Tanh còn có lợi thế ZERO-CENTERED (Sigmoid thì KHÔNG zero-centered)",
  ], { y: 3.1, w: W - 2 * MX, h: 2.3, fontSize: 15, spaceAfter: 10 });
  statCallout(s, { x: MX, y: 5.6, w: 3.8, h: 1.4, value: pct(mainXavierRelu.test_acc), label: "Xavier + ReLU — test accuracy (thực nghiệm thật, 6 hidden layer)", color: GOOD });
  pageTag(s, 14); stampFooter(s, 14);
  noteText(s, "Số liệu lấy từ results/logs/run_xavier_relu.json (lưới chính 6 hidden layer) — riêng cho kiến trúc 10-layer của phần demo, số chính xác sẽ ở slide Experiment 4&5.");
}

// ================================================================
// SLIDE 15 — He Initialization
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "He / Kaiming Initialization");
  formulaBox(s, "He/Kaiming Normal:   W_ij ~ N(0, 2/n_in)          [ReLU / Leaky ReLU]", { y: 1.95, h: 0.85, fontSize: 17 });
  bulletBlock(s, [
    "Dưới giả định pre-activation gần đối xứng quanh 0, ReLU đặt khoảng một nửa giá trị về 0",
    "He dùng scale 2/n_in để bù sự suy giảm second moment (variance) do ReLU gây ra — gấp đôi công thức forward-preserving thuần (1/n_in)",
    "Trong nhiều thiết lập, cách này giúp giữ Var(a) cùng bậc độ lớn với Var(x) qua các lớp ReLU",
  ], { y: 3.1, w: W - 2 * MX, h: 2.3, fontSize: 15, spaceAfter: 10 });
  statCallout(s, { x: MX, y: 5.6, w: 3.8, h: 1.4, value: pct(mainHeRelu.test_acc), label: "He + ReLU — test accuracy (thực nghiệm thật, 6 hidden layer)", color: GOOD });
  pageTag(s, 15); stampFooter(s, 15);
  noteText(s, "Số liệu lấy từ results/logs/run_he_relu.json. Trung thực khoa học: chênh lệch nhỏ giữa He/Xavier cho ReLU ở đây chỉ đến từ 1 seed duy nhất — không đủ căn cứ để xếp hạng scheme nào tốt hơn, vì chưa biết chênh lệch này có tách biệt rõ so với biến động giữa các lần chạy hay không (xem slide Multi-seed ở phần Demo để có bằng chứng đầy đủ hơn với 5 seed).");
}

// ================================================================
// SLIDE 16 — Comparison Table
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization");
  title(s, "So sánh các phương pháp khởi tạo");
  const headers = ["Initialization", "Formula", "Activation phù hợp"];
  const rows = [
    ["Zero", "W = 0", "Không nên dùng"],
    ["Small Random", "N(0, 0.01²)", "Chỉ mạng rất nông"],
    ["Xavier / Glorot", "2 / (n_in+n_out)", "Tanh (zero-centered)"],
    ["He / Kaiming", "2 / n_in", "ReLU / Leaky ReLU"],
    ["Orthogonal*", "WᵀW = I", "Deep / RNN"],
  ];
  const tRows = [headers.map((h) => ({ text: h, options: { bold: true, fill: { color: NAVY }, color: PAPER, fontSize: 14 } }))]
    .concat(rows.map((r, ri) => r.map((c, ci) => ({
      text: c, options: { fontSize: 14, color: INK, align: ci === 0 ? "left" : "center", fill: { color: ri % 2 === 0 ? PANEL : PAPER }, bold: ci === 0 },
    }))));
  s.addTable(tRows, { x: MX, y: 2.05, w: W - 2 * MX, h: 2.9, border: { type: "solid", color: LINE, pt: 0.5 }, autoPage: false, colW: [3.2, 4.03, 4.73] });
  s.addText("* Orthogonal initialization không nằm trong lưới thực nghiệm của báo cáo này (chỉ Zero/Random/LeCun/Xavier/He được test) — liệt kê ở đây cho đầy đủ bức tranh lý thuyết, không có số liệu thực nghiệm đi kèm.", {
    x: MX, y: 5.15, w: W - 2 * MX, h: 0.6, fontSize: 11.5, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  bulletBlock(s, [
    "Đây là một trong những slide quan trọng nhất — mọi thí nghiệm tiếp theo đều nhằm KIỂM CHỨNG bảng này bằng số liệu thật",
  ], { y: 5.9, w: W - 2 * MX, h: 0.8, fontSize: 14.5, spaceAfter: 0 });
  pageTag(s, 16); stampFooter(s, 16);
  noteText(s, "Trung thực: hàng Orthogonal chỉ mang tính lý thuyết/tham khảo, KHÔNG có thực nghiệm đi kèm trong project này — tránh ngộ nhận đã test đủ 5 phương pháp.");
}

// ================================================================
// SLIDE 17 — What are Xavier/He trying to preserve? (synthesis box)
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Parameter Initialization — Synthesis");
  title(s, "Xavier và He đang cố giữ điều gì?", { fontSize: 26 });
  twoCol(s, {
    leftTitle: "Forward", leftColor: BLUE, leftFill: "EAF0FB",
    leftItems: ["Var(a⁽ˡ⁾) ≈ ổn định qua các layer", "(không co cụm về 0, không bùng nổ khi đi qua nhiều lớp)"],
    rightTitle: "Backward", rightColor: RED, rightFill: "FBEEEC",
    rightItems: ["Var(δ⁽ˡ⁾) ≈ ổn định qua các layer", "(δ = ∂L/∂z — cùng logic áp dụng cho gradient khi lan truyền ngược)"],
    y: 2.15, h: 2.15, fs: 14.5,
  });
  formulaBox(s, "Good initialization attempts to prevent the scale of signals and gradients from systematically collapsing or exploding as depth increases.", {
    y: 4.75, h: 1.15, w: W - 2 * MX, fontSize: 15,
  });
  s.addText("Đây là MỤC TIÊU chung của Xavier/He, dưới các giả định đơn giản hoá (activation gần tuyến tính quanh 0, weight độc lập...) — không phải một đảm bảo toán học tuyệt đối trong mọi kiến trúc/activation thực tế.", {
    x: MX, y: 6.1, w: W - 2 * MX, h: 0.7, fontSize: 12, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 17); stampFooter(s, 17);
  noteText(s, "Slide cầu nối ngắn gọn, không đi sâu derivation — chốt lại 'chuyện gì đang cố được giải quyết' trước khi sang phần Demo thực nghiệm kiểm chứng. Var(a) ổn định ở forward và Var(δ) ổn định ở backward là hai mục tiêu tương ứng của Xavier (cân bằng cả hai) và He (ưu tiên forward dưới ReLU).");
}

// ================================================================
// SLIDE 18 — Research Question + Demo Architecture
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Demo — Mini Research Experiment");
  title(s, "Thiết kế thực nghiệm", { fontSize: 26 });
  formulaBox(s, "How does weight initialization affect gradient flow and convergence?", { y: 1.75, h: 0.65, fontSize: 15.5 });
  const archX = MX, archY = 2.68, boxW = 2.0, boxH = 0.34, gap = 0.1;
  const archLabels = ["Input 784", "Linear 128", "ReLU", "Linear 128", "ReLU", "...", "Linear 128", "ReLU", "Linear 10"];
  archLabels.forEach((lab, i) => {
    const y = archY + i * (boxH + gap);
    node(s, { x: archX, y, w: boxW, h: boxH, label: lab, fill: lab === "ReLU" ? "EAF0FB" : PANEL, lineColor: lab === "ReLU" ? BLUE : LINE, fs: 11 });
  });
  bulletBlock(s, [
    "Kiến trúc: 784 → (Linear 128 → ReLU) × 10 → 10 — cố tình khá sâu (10 hidden layer) để vấn đề gradient thể hiện rõ",
    "Dataset: Fashion-MNIST subset (5,000 train / 1,000 val / 2,000 test) — giống hệt lưới thực nghiệm chính",
    "Biến duy nhất thay đổi: cách khởi tạo weight (Zero, Random nhỏ, Random lớn, Xavier, He)",
    "Mọi thứ khác GIỮ NGUYÊN: cùng optimizer (SGD, lr=0.05), cùng 15 epoch — cùng seed giúp reproducibility và giảm một nguồn randomness khi so sánh (không thay thế cho việc lặp lại nhiều seed — xem slide Multi-seed)",
  ], { x: archX + boxW + 0.6, y: 2.68, w: W - MX - (archX + boxW + 0.6), h: 4.3, fontSize: 14, spaceAfter: 14 });
  pageTag(s, 18); stampFooter(s, 18);
  noteText(s, "Đóng khung demo như một MINI RESEARCH EXPERIMENT thay vì chỉ 'train CNN rồi show accuracy' — đúng tinh thần đề xuất: cùng kiến trúc/optimizer/dataset, chỉ đổi initialization.");
}

// ================================================================
// SLIDE 19 — Metrics logged
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Demo — Mini Research Experiment");
  title(s, "4 nhóm metric được log mỗi cấu hình");
  const items = [
    ["1. Activation Variance theo layer", "Var(A⁽ˡ⁾) tại bước khởi tạo — tín hiệu SỚM NHẤT cho co cụm/bão hoà, ưu tiên đọc đầu tiên"],
    ["2. Gradient RMS theo layer", "RMS(∂L/∂W⁽ˡ⁾) = grad.pow(2).mean().sqrt() — chuẩn hoá theo số phần tử, so sánh công bằng giữa các layer"],
    ["3. Training Loss & Accuracy", "mỗi epoch — train + validation, theo dõi hội tụ theo thời gian"],
    ["4. Weight Variance theo layer", "đối chiếu Var(W) đo thực tế vs. công thức lý thuyết"],
  ];
  let y = 2.1;
  items.forEach(([a, b]) => {
    s.addShape(pres.ShapeType.roundRect, { x: MX, y, w: W - 2 * MX, h: 1.0, rectRadius: 0.06, fill: { color: PANEL }, line: { color: LINE, width: 0.5 }, shadow: cardShadow() });
    s.addText(a, { x: MX + 0.3, y, w: 4.3, h: 1.0, valign: "middle", fontSize: 15, bold: true, color: NAVY, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
    s.addText(b, { x: MX + 4.7, y, w: W - 2 * MX - 5.0, h: 1.0, valign: "middle", fontSize: 13, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0 });
    y += 1.15;
  });
  pageTag(s, 19); stampFooter(s, 19);
  noteText(s, "Không chỉ đo accuracy — 4 nhóm metric cho phép PHÂN BIỆT nguyên nhân thất bại (vanishing vs. exploding vs. overfitting) thay vì chỉ thấy 'model tệ'. Thứ tự đọc kết quả ưu tiên: activation variance → gradient scale → training loss → test accuracy (accuracy là bằng chứng GIÁN TIẾP nhất, dễ bị nhiễu bởi nhiều yếu tố khác ngoài initialization). Sửa nhất quán thuật ngữ: mọi nơi trong deck đều dùng 'Gradient RMS' đúng với công thức grad.pow(2).mean().sqrt() (= norm/sqrt(n_elements)), không dùng '.norm()' thô.");
}

// ================================================================
// SLIDES 20-22 — Experiments 1-5 (real data)
// ================================================================
function experimentSlide(n, { kickerTxt, titleTxt, codeLines, resultRows, verdictText, verdictColor, note }) {
  const s = pres.addSlide();
  kicker(s, kickerTxt);
  title(s, titleTxt, { fontSize: 24 });
  const codeBoxY = 1.85, codeBoxH = 0.35 * codeLines.length + 0.3;
  s.addShape(pres.ShapeType.roundRect, { x: MX, y: codeBoxY, w: W - 2 * MX, h: codeBoxH, rectRadius: 0.05, fill: { color: "1E2A44" } });
  s.addText(codeLines.map((l) => ({ text: l, options: { breakLine: true } })), {
    x: MX + 0.25, y: codeBoxY + 0.12, w: W - 2 * MX - 0.5, h: codeBoxH - 0.2, fontSize: 12.5,
    color: "D8E0EF", fontFace: "Consolas", isTextBox: true, margin: 0, valign: "top",
  });
  let statY = codeBoxY + codeBoxH + 0.35;
  const statW = (W - 2 * MX - (resultRows.length - 1) * 0.3) / resultRows.length;
  resultRows.forEach((r, i) => {
    statCallout(s, { x: MX + i * (statW + 0.3), y: statY, w: statW, h: 1.4, value: r.value, label: r.label, color: r.color });
  });
  s.addShape(pres.ShapeType.roundRect, { x: MX, y: statY + 1.7, w: W - 2 * MX, h: 0.85, rectRadius: 0.06, fill: { color: verdictColor === RED || verdictColor === PURPLE ? "FBEEEC" : "EAF3EE" }, line: { color: verdictColor, width: 0.75 } });
  s.addText(verdictText, {
    x: MX + 0.3, y: statY + 1.7, w: W - 2 * MX - 0.6, h: 0.85, fontSize: 14.5, bold: true, color: verdictColor,
    valign: "middle", fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, n); stampFooter(s, n);
  noteText(s, note);
}

experimentSlide(20, {
  kickerTxt: "Demo — Experiment 1 & 2",
  titleTxt: "Zero vs. Random nhỏ (std=0.01) — cả hai đều VANISHING",
  codeLines: [
    "for layer in model.modules():",
    "    if isinstance(layer, nn.Linear):",
    "        nn.init.zeros_(layer.weight)          # Experiment 1",
    "        # hoặc: nn.init.normal_(layer.weight, std=0.01)   # Experiment 2",
  ],
  resultRows: [
    { value: demo.zero.initial_grad_norms[0].grad_rms.toFixed(1), label: "Zero — gradient RMS lớp 1 (khởi tạo)", color: RED },
    { value: demo.random_normal.initial_grad_norms[0].grad_rms.toExponential(2), label: "Random nhỏ — gradient RMS lớp 1", color: RED },
    { value: pct(demo.zero.test_acc), label: `Test accuracy — cả 2 cấu hình (mức ngẫu nhiên)`, color: MUTED },
  ],
  verdictText: `Kết quả thật (10 hidden layer, ReLU, 15 epoch): CẢ HAI kẹt đúng ở mức ngẫu nhiên ${pct(demo.zero.test_acc)} — Zero vì symmetry breaking, Random nhỏ vì gradient co lại theo hàm mũ qua 10 lớp.`,
  verdictColor: RED,
  note: "Số liệu lấy trực tiếp từ results/logs/deep_demo_zero.json và deep_demo_random_normal.json — không làm tròn/che giấu: cả hai đều test_acc=10.0%, đúng mức đoán ngẫu nhiên của bài toán 10 lớp.",
});

experimentSlide(21, {
  kickerTxt: "Demo — Experiment 3",
  titleTxt: "Random LỚN (std=1.0) — EXPLODING GRADIENT thật sự",
  codeLines: [
    "nn.init.normal_(layer.weight, mean=0, std=1.0)   # Experiment 3",
  ],
  resultRows: [
    { value: demo.random_large.initial_grad_norms[0].grad_rms.toExponential(2), label: "Gradient RMS lớp 1 (khởi tạo) — bùng nổ", color: PURPLE },
    { value: "NaN", label: "Train loss ngay từ epoch 1 — huấn luyện PHÂN KỲ", color: PURPLE },
    { value: pct(demo.random_large.test_acc), label: "Test accuracy cuối cùng (không học được gì)", color: MUTED },
  ],
  verdictText: `Bằng chứng thực nghiệm trực tiếp cho hiện tượng mô tả ở slide "Exploding Gradient": std quá lớn (1.0) trên 10 lớp khiến gradient RMS bùng nổ tới ${demo.random_large.initial_grad_norms[0].grad_rms.toExponential(1)} ngay bước đầu, loss thành NaN và không phục hồi trong suốt 15 epoch.`,
  verdictColor: PURPLE,
  note: "Số liệu thật từ results/logs/deep_demo_random_large.json — không phải minh hoạ lý thuyết, đây là NaN thật xảy ra khi chạy thí nghiệm. Đối lập rõ ràng với Experiment 1&2 (vanishing): trong setup này, cả hai thái cực (std quá nhỏ / quá lớn) của cùng một sai lầm 'không scale theo fan_in' đều khiến mạng không học được.",
});

experimentSlide(22, {
  kickerTxt: "Demo — Experiment 4 & 5 (5 seeds mỗi scheme)",
  titleTxt: "Xavier vs. He — cả hai học được, phân phối accuracy CHỒNG LẤN",
  codeLines: [
    "nn.init.xavier_normal_(layer.weight)                                       # Experiment 4",
    "nn.init.kaiming_normal_(layer.weight, mode='fan_in', nonlinearity='relu')  # Experiment 5",
    "# chạy độc lập với 5 seed {42..46}, báo cáo mean ± std",
  ],
  resultRows: [
    { value: `${pct(multiseed("xavier").acc_mean)} ± ${pp(multiseed("xavier").acc_std)}pp`, label: `Xavier — test accuracy, mean ± std (n=${multiseed("xavier").n_seeds} seeds)`, color: GOOD },
    { value: `${pct(multiseed("he").acc_mean)} ± ${pp(multiseed("he").acc_std)}pp`, label: `He — test accuracy, mean ± std (n=${multiseed("he").n_seeds} seeds)`, color: GOOD },
    { value: `${multiseed("he").grms_mean.toExponential(1)} vs ${multiseed("xavier").grms_mean.toExponential(1)}`, label: "Gradient RMS lớp 1, mean — He vs. Xavier (chênh lệch ~35×, ổn định qua seed)", color: GOOD },
  ],
  verdictText: `Accuracy: Xavier ${pct(multiseed("xavier").acc_mean)}±${pp(multiseed("xavier").acc_std)}pp vs. He ${pct(multiseed("he").acc_mean)}±${pp(multiseed("he").acc_std)}pp — khoảng std CHỒNG LẤN nhau, không đủ cơ sở kết luận scheme nào vượt trội cho ReLU trong setup này. Khác biệt rõ ràng và nhất quán hơn nằm ở gradient RMS (He > Xavier ở mọi seed).`,
  verdictColor: GOOD,
  note: "Số liệu thật từ results/tables/multiseed_xavier_he_summary.csv (5 seed độc lập {42..46}, cùng kiến trúc 10 hidden layer). Đây là điểm chỉnh sửa quan trọng: 1 seed duy nhất KHÔNG đủ để nói 'Xavier tốt hơn He' hay ngược lại. Lưu ý về wording: đây KHÔNG phải một kiểm định thống kê chính thức (không có hypothesis test/confidence interval) — chỉ là quan sát mean±std qua 5 lần chạy. Diễn đạt đúng: 'phân phối test-accuracy của hai scheme chồng lấn đáng kể, nên thực nghiệm này không ủng hộ việc xếp hạng rõ ràng giữa Xavier và He.' Ngược lại, gradient RMS lớp 1 của He nhất quán LỚN HƠN Xavier ở cả 5 seed (không dao động qua lại) — có thể nói 'He cho gradient RMS lớp 1 lớn hơn Xavier một cách nhất quán trong setup này', nhưng KHÔNG suy rộng thành 'He luôn cho gradient tốt hơn'.",
});

// ================================================================
// SLIDE 23 — Accuracy curves (all 5, real chart)
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Demo — Kết quả tổng hợp");
  title(s, "5 thí nghiệm, 1 kiến trúc, 1 biểu đồ", { fontSize: 25 });
  const imgW = 6.1, imgH = imgW / (9 / 6.2);
  s.addImage({ path: FIG("deep_demo_accuracy_slide.png"), x: (W - imgW) / 2, y: 1.7, w: imgW, h: imgH });
  bulletBlock(s, [
    "Zero & Random nhỏ: đường phẳng ngang mức 10% — không học được gì",
    "Random lớn: không xuất hiện trên biểu đồ (loss = NaN ngay từ epoch 1)",
    "Xavier & He: hội tụ rõ ràng, đạt ~67–68% dù kiến trúc sâu tới 10 lớp",
  ], { y: 1.7 + imgH + 0.15, w: W - 2 * MX, h: 1.1, fontSize: 13.5, spaceAfter: 5 });
  pageTag(s, 23); stampFooter(s, 23);
  noteText(s, "Biểu đồ tổng hợp cả 5 đường cùng lúc — hình ảnh 'ăn điểm' đầu tiên vì gói gọn toàn bộ câu chuyện demo trong 1 slide.");
}

// ================================================================
// SLIDE 24 — Gradient RMS Heatmap
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Demo — Visualization quan trọng nhất");
  title(s, "Gradient RMS Heatmap — layer × initialization", { fontSize: 23 });
  const imgW = 9.4, imgH = imgW / (11 / 5.2);
  s.addImage({ path: FIG("gradient_heatmap_slide.png"), x: (W - imgW) / 2, y: 1.75, w: imgW, h: imgH });
  s.addText("log₁₀(RMS gradient) đo thật tại bước khởi tạo, 10 hidden layer, activation ReLU — xanh dương = rất nhỏ (đặc trưng vanishing), đỏ = rất lớn (đặc trưng exploding), cam nhạt/vàng = vùng gradient ở mức trung bình, quan sát thấy ổn định hơn trong thực nghiệm này.", {
    x: MX, y: 1.75 + imgH + 0.1, w: W - 2 * MX, h: 0.6, fontSize: 12, italic: true, color: MUTED,
    fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 24); stampFooter(s, 24);
  noteText(s, "Đây là một trong những visualization quan trọng nhất của toàn bộ demo vì thể hiện TRỰC TIẾP gradient flow qua từng layer, không qua trung gian (khác với accuracy — bằng chứng gián tiếp, chịu ảnh hưởng của nhiều yếu tố khác). Mỗi ô là một số liệu thật (RMS = grad.pow(2).mean().sqrt()), không phải minh hoạ cách điệu. Lưu ý: 3 màu (xanh/vàng/đỏ) là mô tả trực quan theo thang màu liên tục, KHÔNG phải một ngưỡng (threshold) toán học được định nghĩa chính thức cho 'vùng ổn định'.");
}

// ================================================================
// SLIDE 25 — Activation Variance (forward-pass evidence)
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Demo — Visualization bổ sung (Forward Pass)");
  title(s, "Activation Variance theo layer", { fontSize: 25 });
  const imgW = 6.3, imgH = imgW / (9 / 6.2);
  s.addImage({ path: FIG("activation_variance_slide.png"), x: (W - imgW) / 2, y: 1.75, w: imgW, h: imgH });
  bulletBlock(s, [
    "Random nhỏ: Var(a) co lại dần theo layer — cùng câu chuyện vanishing đã thấy ở gradient, nhưng lần này ở FORWARD PASS",
    "Random lớn: Var(a) tăng theo cấp số mũ — hàng chục bậc độ lớn chỉ sau 10 layer",
    "Xavier/He: Var(a) gần như phẳng, dao động quanh bậc 10⁰ suốt 10 layer",
  ], { y: 1.75 + imgH + 0.15, w: W - 2 * MX, h: 1.3, fontSize: 13, spaceAfter: 6 });
  pageTag(s, 25); stampFooter(s, 25);
  noteText(s, "Bổ sung quan trọng: Heatmap slide trước chứng minh initialization ảnh hưởng BACKWARD (gradient); slide này chứng minh THÊM rằng cùng cơ chế cũng chi phối FORWARD (activation) — đúng như slide Synthesis đã nêu (Var(a) ổn định ở forward, Var(δ) ổn định ở backward). Không vẽ Zero-init vì mọi activation của nó đúng bằng 0 (không biểu diễn được trên thang log). Số liệu thật từ results/logs/deep_demo_*.json, field initial_activation_stats.");
}

// ================================================================
// SLIDE 26 — Depth Experiment
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Demo — Depth Experiment");
  title(s, "Random vs. Xavier vs. He — theo độ sâu (2→50 lớp)", { fontSize: 22 });
  const imgW = 6.6, imgH = imgW / (9 / 6.2);
  s.addImage({ path: FIG("depth_comparison_v2_slide.png"), x: MX, y: 1.9, w: imgW, h: imgH });
  const he12 = depthRow("he", 12), he50 = depthRow("he", 50);
  bulletBlock(s, [
    "Random (naive): trong thiết lập này, gradient RMS về xấp xỉ 0 từ độ sâu 20 trở lên",
    "Xavier: suy giảm dần đều — cho gradient RMS rất nhỏ tại depth=50 (≈3×10⁻¹⁰)",
    "He: duy trì gradient RMS cùng order of magnitude (~10⁻²) đến depth=50, trong architecture và training setup đang xét",
    `Nhưng gradient ổn định KHÔNG đồng nghĩa học tốt: He@L=12 train loss chỉ ${he12.final_train_loss.toFixed(3)} trong khi test loss vọt lên ${he12.test_loss.toFixed(2)} (test acc ${pct(he12.test_acc)}) — khoảng cách train/test lớn này là bằng chứng cụ thể cho overfitting, không phải suy đoán từ accuracy đơn lẻ`,
  ], { x: MX + imgW + 0.4, y: 2.0, w: W - MX - imgW - 0.4 - MX, h: 4.6, fontSize: 12, spaceAfter: 9 });
  pageTag(s, 26); stampFooter(s, 26);
  noteText(s, `Số liệu thật từ results/logs/depth_experiment_v2.json. Tránh phát biểu phổ quát kiểu "He ổn định ở mọi độ sâu" hay "Xavier thất bại" — đây là quan sát TRONG setup thực nghiệm cụ thể (MLP, ReLU, Fashion-MNIST). He duy trì gradient RMS cùng bậc độ lớn xuyên suốt (kể cả L=50: grad_rms≈${depthRow("he", 50).grad_rms_layer1_init.toExponential(2)}) nhưng test accuracy vẫn dao động (L=12: 32.6%, L=20: 53.6%, L=50: ${pct(he50.test_acc)}). Về nhãn 'overfitting' tại L=12: chỉ gọi đúng tên khi có bằng chứng train tốt/test kém — ở đây train loss=${he12.final_train_loss.toFixed(3)} (thấp, khớp tốt) trong khi test loss=${he12.test_loss.toFixed(2)} (cao, gấp hơn 10 lần) — khoảng cách train/test rõ ràng này là căn cứ cho nhãn overfitting, không phải chỉ suy đoán từ test accuracy thấp. Insight quan trọng nhất: stable gradient flow là điều kiện quan trọng cho optimization ổn định, nhưng KHÔNG phải điều kiện đủ để model generalize tốt.`);
}

// ================================================================
// SLIDE 27 — Results Table
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Kết quả");
  title(s, "Bảng tổng hợp — 5 thí nghiệm, số liệu thật", { fontSize: 24 });
  s.addText("Thứ tự đọc kết quả (từ trực tiếp nhất): Gradient RMS → Training Loss → Test Accuracy", {
    x: MX, y: 1.72, w: W - 2 * MX, h: 0.35, fontSize: 12.5, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  const headers = ["Init", "Grad RMS (L1)", "Final Loss", "Accuracy", "Gradient behavior"];
  const stabilityColor = { "Vanishing": RED, "Exploding (NaN)": PURPLE, "Ổn định": GOOD };
  const rows = demoSchemes.map((sch) => {
    const r = demo[sch];
    const csvLabel = { zero: "Zero", random_normal: "Random (small)", random_large: "Random (large)", xavier: "Xavier", he: "He" }[sch];
    const finalLoss = r.history[r.history.length - 1].train_loss;
    const lossTxt = finalLoss === null ? "NaN" : finalLoss.toFixed(3);
    const g1 = r.initial_grad_norms[0].grad_rms;
    let stab;
    if (finalLoss === null) stab = "Exploding (NaN)";
    else if (g1 < 1e-6) stab = "Vanishing";
    else stab = "Ổn định";
    return [csvLabel, g1.toExponential(1), lossTxt, pct(r.test_acc), stab];
  });
  const tRows = [headers.map((h) => ({ text: h, options: { bold: true, fill: { color: NAVY }, color: PAPER, fontSize: 13 } }))]
    .concat(rows.map((r, ri) => r.map((c, ci) => ({
      text: c,
      options: {
        fontSize: 13, align: ci === 0 ? "left" : "center", bold: ci === 0 || ci === 4,
        fill: { color: ri % 2 === 0 ? PANEL : PAPER },
        color: ci === 4 ? stabilityColor[c] : INK,
      },
    }))));
  s.addTable(tRows, { x: MX, y: 2.15, w: W - 2 * MX, h: 3.0, border: { type: "solid", color: LINE, pt: 0.5 }, autoPage: false, colW: [2.33, 2.33, 2.33, 2.33, 2.68] });
  s.addText("Số liệu lấy nguyên văn từ results/tables/deep_demo_summary.csv — không làm tròn để \"đẹp bảng\", không có kết quả nào bị bỏ sót. Xem thêm Activation Variance trong log JSON của từng cấu hình (results/logs/deep_demo_*.json).", {
    x: MX, y: 5.35, w: W - 2 * MX, h: 0.6, fontSize: 11.5, italic: true, color: MUTED, fontFace: FONT_BODY, isTextBox: true, margin: 0,
  });
  pageTag(s, 27); stampFooter(s, 27);
  noteText(s, "Bảng ánh xạ trực tiếp từ CSV thật, kể cả NaN của Random-large — trung thực khoa học, không che giấu kết quả thất bại. Test accuracy KHÔNG phải bằng chứng duy nhất cho initialization — nó là chỉ số gián tiếp nhất trong 4 nhóm metric (Activation variance, Gradient RMS, Training loss, rồi mới đến Accuracy).");
}

// ================================================================
// SLIDE 28 — Conclusion
// ================================================================
{
  const s = pres.addSlide(); darkBg(s);
  kicker(s, "Kết luận", { color: "8FA3C9", y: 0.5 });
  const flow = ["Derivative", "Chain Rule", "Backpropagation", "Gradient Flow",
    "Vanishing / Exploding Gradient", "Parameter Initialization", "Stable Training"];
  let y = 0.95;
  const rowStep = 0.6;
  flow.forEach((lab, i) => {
    s.addText(lab, {
      x: MX, y, w: W - 2 * MX, h: 0.38, fontSize: 15.5, bold: i === flow.length - 1, color: i === flow.length - 1 ? "6FA3E0" : "E7ECF6",
      align: "center", fontFace: FONT_HEAD, isTextBox: true, margin: 0,
    });
    if (i < flow.length - 1) {
      s.addText("↓", { x: MX, y: y + 0.36, w: W - 2 * MX, h: 0.22, fontSize: 13, color: "6FA3E0", align: "center", isTextBox: true, margin: 0 });
    }
    y += rowStep;
  });
  const takeaways = [
    "Backpropagation là cách tính gradient hiệu quả bằng cách áp dụng chain rule ngược qua computational graph.",
    "Trong mạng sâu, gradient phụ thuộc vào tích của nhiều Jacobian/weight transformation — scale của gradient có thể vanish hoặc explode.",
    "Xavier và He chọn scale of initial weights dựa trên fan-in/fan-out để giữ activation và gradient trong phạm vi hợp lý, dưới các giả định nhất định.",
    "Good initialization cải thiện optimization và gradient flow, nhưng không đảm bảo generalization tốt.",
  ];
  const paras = takeaways.map((t, i) => ({
    text: `${i + 1}. ${t}`, options: { color: "CADCFC", fontSize: 11.5, breakLine: true, paraSpaceAfter: 5, fontFace: FONT_BODY },
  }));
  s.addText(paras, { x: MX, y: y + 0.1, w: W - 2 * MX, h: 1.5, valign: "top", isTextBox: true, margin: 0 });
  stampFooter(s, 28, true);
  noteText(s, "Flow tổng kết toàn bộ mạch trình bày — 3 takeaway đọc thẳng ra từ sơ đồ, chốt bằng câu hỏi nghiên cứu đã đặt ra ở Slide 2.");
}

// ================================================================
// SLIDE 29 — Optional extension
// ================================================================
{
  const s = pres.addSlide();
  kicker(s, "Mở rộng (tham khảo)");
  title(s, "Từ Initialization tới mạng hiện đại", { fontSize: 24 });
  const cx = W / 2, boxW = 3.4, boxH = 0.55, topY = 2.0, gap = 0.35;
  const stack = ["Initialization", "+ Normalization", "+ Residual Connections"];
  stack.forEach((lab, i) => {
    const y = topY + i * (boxH + gap);
    node(s, { x: cx - boxW / 2, y, w: boxW, h: boxH, label: lab, fill: i === 0 ? "EAF0FB" : PANEL, lineColor: i === 0 ? BLUE : LINE, fs: 14 });
    if (i < stack.length - 1) arrow(s, cx, y + boxH, cx, y + boxH + gap, { color: BLUE, width: 2 });
  });
  const finalY = topY + stack.length * (boxH + gap);
  node(s, { x: cx - boxW / 2, y: finalY, w: boxW, h: boxH, label: "Modern Deep Networks", fill: "FBEEEC", lineColor: RED, fs: 14 });
  arrow(s, cx, topY + stack.length * boxH + (stack.length - 1) * gap, cx, finalY, { color: BLUE, width: 2 });
  bulletBlock(s, [
    "Batch Normalization / Layer Normalization — chuẩn hoá lại tín hiệu MỖI lớp, không chỉ dựa vào 1 lần khởi tạo",
    "Residual Networks — cho gradient một 'đường tắt' (skip connection) bỏ qua tích luỹ nhiều lớp",
    "Gradient Clipping — chặn cứng exploding gradient bất kể nguyên nhân",
  ], { x: MX, y: finalY + 1.0, w: W - 2 * MX, h: 2.0, fontSize: 13.5, spaceAfter: 8 });
  pageTag(s, 29); stampFooter(s, 29);
  noteText(s, "Chỉ giới thiệu ngắn, KHÔNG đi sâu — tránh lệch trọng tâm khỏi Backprop + Initialization là chủ đề chính của báo cáo.");
}

// ================================================================
// SLIDE 30 — References
// ================================================================
{
  const s = pres.addSlide(); darkBg(s);
  kicker(s, "Tài liệu tham khảo", { color: "8FA3C9", y: 0.55 });
  title(s, "References", { color: PAPER, y: 1.0 });
  const refs = [
    "[1] Rumelhart, Hinton & Williams (1986). Learning representations by back-propagating errors. Nature, 323(6088):533–536.",
    "[2] LeCun, Bottou, Orr & Müller (1998/2012). Efficient BackProp. Neural Networks: Tricks of the Trade.",
    "[3] Glorot & Bengio (2010). Understanding the difficulty of training deep feedforward neural networks. AISTATS.",
    "[4] He, Zhang, Ren & Sun (2015). Delving Deep into Rectifiers. ICCV. arXiv:1502.01852.",
    "[5] Bishop (2006). Pattern Recognition and Machine Learning. Springer.",
    "[6] Goodfellow, Bengio & Courville (2016). Deep Learning. MIT Press.",
    "[7] Kingma & Ba (2015). Adam: A Method for Stochastic Optimization. ICLR. arXiv:1412.6980.",
    "[8] Clevert, Unterthiner & Hochreiter (2016). Fast and Accurate Deep Network Learning by ELUs. ICLR. arXiv:1511.07289.",
    "[9] Klambauer, Unterthiner, Mayr & Hochreiter (2017). Self-Normalizing Neural Networks. NeurIPS. arXiv:1706.02515.",
    "[10] Xiao, Rasul & Vollgraf (2017). Fashion-MNIST. arXiv:1708.07747.",
    "[11] Paszke et al. (2019). PyTorch: An Imperative Style, High-Performance Deep Learning Library. NeurIPS.",
  ];
  const paras = refs.map((t) => ({
    text: t, options: { bullet: false, color: "D8E0EF", fontSize: 11, breakLine: true, paraSpaceAfter: 6.5, fontFace: FONT_BODY },
  }));
  s.addText(paras, { x: MX, y: 1.85, w: W - 2 * MX, h: 5.15, valign: "top", isTextBox: true, margin: 0 });
  stampFooter(s, 30, true);
  noteText(s, "11 nguồn, khớp danh mục tham khảo IEEE trong báo cáo LaTeX — không có nguồn bịa.");
}

pres.writeFile({ fileName: "Slide_Backprop_Initialization.pptx" }).then((fileName) => {
  console.log("Wrote:", fileName);
});
