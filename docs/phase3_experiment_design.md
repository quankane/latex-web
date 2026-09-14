# PHASE 3 — Experimental Design

## Dataset

**Fashion-MNIST** (Xiao, Rasul & Vollgraf, 2017) qua `torchvision.datasets`.
28×28 grayscale, 10 lớp, cân bằng lớp. Lý do chọn thay vì MNIST thuần: MNIST
quá dễ (MLP nông cũng đạt >97%), làm mờ tác động của initialization; Fashion
-MNIST khó hơn vừa đủ để 5 initialization tạo ra khác biệt rõ mà vẫn nhẹ,
chạy tốt trên CPU, không cần augmentation phức tạp.

- Input dimension: $784$ ($28\times28$, flatten, chuẩn hoá về $[0,1]$ rồi
  chuẩn hoá thêm $(\text{mean}=0.2860,\ \text{std}=0.3530$, thống kê chuẩn
  của Fashion-MNIST train set$)$.
- Output: 10 lớp (áo thun, quần, áo len, váy, áo khoác, sandal, sơ mi,
  sneaker, túi, bốt).
- **Subset để chạy nhanh trên CPU** (khai báo minh bạch, không giấu):
  6.000 mẫu train / 2.000 mẫu test, lấy ngẫu nhiên có seed cố định, giữ tỉ
  lệ lớp gần đều (stratify).
- Train/val split nội bộ: 5.000/1.000 từ 6.000 mẫu train (val dùng để theo
  dõi overfitting, không dùng để chọn siêu tham số riêng cho từng
  initialization — mọi cấu hình dùng chung 1 bộ siêu tham số, đúng yêu cầu
  "fair experiment").

## Kiến trúc (cố định cho mọi experiment initialization/activation)

MLP 6 hidden layer, không BatchNorm, không Dropout, không pretrained:
$$784 \to 128 \to 128 \to 128 \to 128 \to 128 \to 128 \to 10.$$
Output layer luôn là linear (logits), dùng `CrossEntropyLoss` (softmax nằm
trong hàm loss của PyTorch — tránh tính softmax hai lần).

## Biến thực nghiệm (fair experiment — chỉ đổi đúng 1 biến mỗi lần so sánh)

**Lưới đầy đủ 5 × 4 = 20 cấu hình**, dùng chung cho toàn bộ Experiment 1–8
(một thiết kế, nhiều góc phân tích — tránh chạy rời rạc 8 lần với setup có
thể lệch nhau):

| | Sigmoid | Tanh | ReLU | Leaky ReLU (slope 0.01) |
|---|---|---|---|---|
| Zero | ✓ | ✓ | ✓ | ✓ |
| Random Normal ($\sigma=0.01$, naive) | ✓ | ✓ | ✓ | ✓ |
| LeCun ($\mathrm{Var}=1/n_{\text{in}}$) | ✓ | ✓ | ✓ | ✓ |
| Xavier/Glorot ($\mathrm{Var}=2/(n_{\text{in}}+n_{\text{out}})$) | ✓ | ✓ | ✓ | ✓ |
| He/Kaiming ($\mathrm{Var}=2/n_{\text{in}}$) | ✓ | ✓ | ✓ | ✓ |

Ánh xạ sang 8 experiment yêu cầu:
- **Exp 1–5** (Zero/Random/Xavier/He/LeCun): cột **ReLU** của lưới trên (vì
  ReLU là activation "trung tính" phổ biến nhất để so initialization) —
  bảng chính report §9.
- **Exp 6** (so sánh activation): hàng **He** và hàng **Xavier** của lưới
  (mỗi hàng cố định 1 initialization, đổi activation) — vì đây là
  initialization "đúng lý thuyết" cho ReLU và cho Tanh/Sigmoid tương ứng.
- **Exp 7** (gradient norm theo layer): đo tại **bước đầu tiên** (trước khi
  update) cho toàn bộ 20 cấu hình, trực quan hoá 1 lát cắt tiêu biểu
  (Sigmoid, 5 initialization) — nơi vanishing rõ nhất theo lý thuyết Mục 6.
- **Exp 8** (training convergence): loss/accuracy theo epoch, lấy từ chính
  20 lần train — trực quan hoá lát cắt ReLU (5 initialization) và lát cắt
  He (4 activation).

## Siêu tham số cố định (giống nhau cho mọi trong 20 cấu hình)

| Siêu tham số | Giá trị | Ghi chú |
|---|---|---|
| Optimizer | SGD thuần (không momentum) | Cố ý — Adam có adaptive per-parameter LR có thể che bớt hiệu ứng initialization; dùng SGD để quan sát đúng lý thuyết Mục 5–6 (nêu rõ trong Limitations) |
| Learning rate $\eta$ | $0.05$ | Chọn qua 1 lượt pilot-run (không tinh chỉnh riêng cho từng cấu hình) |
| Batch size | $128$ | |
| Epochs | $15$ | |
| Seed | $42$ | cố định cho Python/NumPy/PyTorch |
| Bias init | $0$ | mọi scheme (Mục 5.6 tài liệu Phase 2) |
| Loss | CrossEntropyLoss | |

## Metric thu thập (mỗi epoch, mỗi 1 trong 20 cấu hình)

`train_loss, val_loss, train_acc, val_acc` mỗi epoch; tại **bước đầu tiên**
(trước update đầu tiên) đo thêm: `grad_norm` theo từng layer, `activation
mean/var` theo từng layer, `weight mean/var` theo từng layer — ghi vào
`results/logs/*.json` để Phase 6 tổng hợp bảng/hình mà không phải chạy lại.

## Gradient checking (độc lập với lưới trên)

Chạy trên mạng nhỏ NumPy tự viết (`src/manual_nn.py`, cùng kiến trúc/ số
liệu với `experiments/toy_example_verify.py`), so `manual gradient` vs.
`PyTorch autograd` vs. `finite-difference` — báo cáo sai số tuyệt đối/tương
đối (Mục 8 report).

## Không bịa số liệu

Mọi con số trong `report/` và `slides/` chỉ được điền **sau khi** script
Phase 4–5 chạy thật và log JSON tồn tại trong `results/logs/`. Nếu một hình
chưa chạy được, Phase 7 sẽ ghi rõ "TODO: run experiment" thay vì số liệu
minh hoạ.
