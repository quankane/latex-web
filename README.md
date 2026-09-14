# Đạo hàm & Khởi tạo trong Deep Learning: Backpropagation và Parameter Initialization

## Overview

Dự án minh hoạ bằng toán học + thực nghiệm hai câu hỏi nền tảng khi huấn
luyện mạng nơ-ron: **(1)** làm sao tính được gradient của hàm mất mát theo
hàng nghìn tham số một cách hiệu quả (**Backpropagation**, xây trên
**Chain Rule**), và **(2)** nên bắt đầu từ giá trị tham số nào
(**Parameter Initialization**) để mạng thực sự học được. Ba sản phẩm —
report LaTeX, slide PPTX, code Python — dùng chung một bộ ký hiệu, một bộ
số liệu thực nghiệm (không có số liệu bịa).

## Learning Objectives

- Giải thích Backpropagation là ứng dụng có hệ thống của Chain Rule trên
  một computational graph, **không phải** là Gradient Descent.
- Suy ra công thức gradient (dạng vô hướng và dạng ma trận) cho một MLP.
- Giải thích vì sao `W=0` phá vỡ khả năng học (mất symmetry breaking), và
  Xavier/He/LeCun giải quyết vấn đề "chọn variance khởi tạo" thế nào.
- Giải thích cơ chế toán học của vanishing/exploding gradient và liên hệ
  trực tiếp với initialization + activation + độ sâu mạng.
- Chứng minh bằng thực nghiệm thật (không phải minh hoạ lý thuyết suông)
  trên Fashion-MNIST.

## Mathematical Background

Xem [`docs/phase2_math_content.md`](docs/phase2_math_content.md) — tài
liệu "nguồn sự thật" cho mọi công thức/số liệu ví dụ xuất hiện trong
`report/` và `notebooks/`. Mọi số liệu ví dụ đã được đối chiếu chéo giữa
tính tay, NumPy, PyTorch autograd và finite-difference
(`experiments/toy_example_verify.py`, `experiments/run_gradient_check.py`).

## Project Structure

```
deep-learning-backprop-init/
├── README.md, requirements.txt, pyproject.toml
├── docs/                     # Phase 1-3 design docs (nguồn sự thật)
├── data/                     # Fashion-MNIST (tự động tải về)
├── notebooks/                # 01-05, chạy thật, có output
├── src/                      # activations, initialization, models,
│                             # manual_nn, training, metrics, visualization
├── experiments/              # run_manual_backprop.py, run_gradient_check.py,
│                             # run_initialization.py, toy_example_verify.py
├── results/
│   ├── figures/               # 8 hình bắt buộc (PNG)
│   ├── tables/                # initialization_comparison.csv
│   └── logs/                  # 20 log JSON (1/cấu hình) + gradient check
└── report/                   # main.tex, references.bib, figures/
```

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Yêu cầu Python ≥ 3.11. Chạy hoàn toàn trên **CPU**, không cần GPU/CUDA.

## Running the Project

```bash
# Part A — Manual backprop (NumPy, không autograd) trên 1 mạng nhỏ
python experiments/run_manual_backprop.py

# Gradient checking: manual vs. PyTorch autograd vs. finite-difference
python experiments/run_gradient_check.py

# Ví dụ số dùng trong report (tái tạo mọi con số ở Mục 4 report)
python experiments/toy_example_verify.py

# Lưới thực nghiệm chính: 5 initialization x 4 activation = 20 cấu hình
# trên Fashion-MNIST (~1 phút CPU) + sinh 8 hình bắt buộc
python experiments/run_initialization.py
# Kiểm tra nhanh pipeline (2 epoch, 4 cấu hình): thêm --quick

# Thí nghiệm bổ sung: ảnh hưởng của ĐỘ SÂU mạng tới initialization
# (He vs. Random-naive, 6 độ sâu, ~1-2 phút CPU) -- report Mục 6.1
python experiments/run_depth_experiment.py

# Sinh 2 hình bổ sung cho report (small-multiples 20 cấu hình + mẫu Fashion-MNIST)
python experiments/make_extra_figures.py
```

Notebook (`notebooks/01`–`05`) đọc lại kết quả đã có trong `results/` —
không cần chạy lại `run_initialization.py` để mở notebook 04/05.

## Experiments

Thiết kế đầy đủ: [`docs/phase3_experiment_design.md`](docs/phase3_experiment_design.md).
Tóm tắt: MLP `784→128×6→10`, không BatchNorm/Dropout, SGD thuần
(`lr=0.05`, `batch_size=128`, `epochs=15`, `seed=42`), Fashion-MNIST subset
5000 train / 1000 val / 2000 test — **cố định cho toàn bộ 20 cấu hình**,
chỉ đổi initialization × activation (fair experiment).

## Results

| | Sigmoid | Tanh | ReLU | Leaky ReLU |
|---|---|---|---|---|
| Zero | 0.100 | 0.100 | 0.100 | 0.100 |
| Random (naive) | 0.100 | 0.100 | 0.100 | 0.100 |
| LeCun | 0.100 | 0.689 | 0.638 | 0.648 |
| Xavier/Glorot | 0.100 | 0.692 | 0.674 | 0.682 |
| He/Kaiming | 0.100 | 0.694 | 0.667 | 0.634 |

(Test accuracy sau 15 epoch — bảng đầy đủ + 8 hình:
`results/tables/initialization_comparison.csv`,
`results/figures/*.png`; phân tích chi tiết: `notebooks/05_analysis.ipynb`
và report Mục 9–10.) Gradient checking: sai số tối đa so với autograd và
finite-difference ở mức $10^{-9}$ (`results/logs/gradient_check_report.json`).

## Reproducibility

`SEED=42` cố định cho Python (`random`), NumPy, PyTorch trong mọi script
(`src/training.py:set_seed`). Không dùng GPU nên không có vấn đề
non-determinism từ cuDNN. Chuẩn hoá dữ liệu tính trực tiếp từ chính subset
train đang dùng (không dùng số liệu tra cứu ngoài).

## References

Xem `report/references.bib` và mục 4 của
[`docs/phase1_structure.md`](docs/phase1_structure.md) — toàn bộ đã verify
qua tìm kiếm thực tế, không có nguồn bịa.

## Limitations

- Subset nhỏ (5000/1000/2000 mẫu) và chỉ 15 epoch để chạy nhanh trên CPU —
  không phản ánh kết quả ở quy mô full-dataset/nhiều epoch hơn.
- Một seed duy nhất mỗi cấu hình (không lặp lại nhiều seed để đo variance
  giữa các lần chạy).
- SGD thuần, không tinh chỉnh learning rate riêng cho từng cấu hình
  (cố ý, để giữ "fair experiment" — nhưng nghĩa là một số cấu hình có thể
  học nhanh/chậm hơn tiềm năng thực của nó nếu được tinh chỉnh riêng).
- Không dùng BatchNorm/Dropout/LR schedule — cố ý loại bỏ để initialization
  là biến duy nhất, nhưng vì vậy kết quả không đại diện cho thiết lập huấn
  luyện hiện đại (nơi BatchNorm thường làm giảm đáng kể độ nhạy với
  initialization).
- Val accuracy dao động khá mạnh giữa các epoch (tập validation chỉ 1000
  mẫu) — xem report Mục 11 (Limitations) để thảo luận đầy đủ.
