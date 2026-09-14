# PHASE 1 — Academic Structure Design

Dự án: **Đạo hàm & Khởi tạo trong Deep Learning: Backpropagation và Parameter
Initialization**

Tài liệu này là "nguồn sự thật" (source of truth) về cấu trúc, thuật ngữ và
ký hiệu toán học dùng chung cho cả ba sản phẩm (report LaTeX, slide PPTX,
project Python) để tránh lệch nhau giữa các phần.

---

## 1. Cấu trúc báo cáo LaTeX (13 phần, ~18–24 trang nội dung)

| # | Section (EN) | Tên tiếng Việt | Trang ước tính | Nội dung cốt lõi |
|---|---|---|---|---|
| 1 | Introduction | Giới thiệu | 1.5 | Bài toán huấn luyện mạng nơ-ron là bài toán tối ưu; hai câu hỏi trung tâm: (a) tính gradient thế nào (Backprop), (b) bắt đầu từ đâu (Initialization); vì sao hai câu hỏi này quyết định việc mạng có học được hay không |
| 2 | Mathematical Foundations | Nền tảng toán học | 3 | 2.1 Derivative, 2.2 Partial derivative, 2.3 Gradient, 2.4 Chain rule, 2.5 Computational graph |
| 3 | Forward Propagation | Lan truyền tiến | 1.5 | Định nghĩa forward pass cho MLP; ký hiệu $z^{(l)}, a^{(l)}, W^{(l)}, b^{(l)}$; ví dụ số nhỏ |
| 4 | Backpropagation | Lan truyền ngược | 5 | 4.1 Intuition, 4.2 Scalar derivation (toy graph $z=wx+b,\ a=\mathrm{ReLU}(z),\ L=\tfrac12(a-y)^2$), 4.3 Matrix form, 4.4 Computational complexity, 4.5 Backprop vs. Gradient Descent |
| 5 | Parameter Initialization | Khởi tạo tham số | 4.5 | 5.1 Vì sao initialization quan trọng (symmetry breaking), 5.2 Zero, 5.3 Random, 5.4 Xavier/Glorot, 5.5 He/Kaiming, 5.6 LeCun |
| 6 | Vanishing & Exploding Gradients | Vanishing/Exploding Gradient | 2 | Gradient là tích nhiều đạo hàm cục bộ; phân tích $\prod_l \|\partial a^{(l+1)}/\partial a^{(l)}\|$; ví dụ số theo độ sâu |
| 7 | Experimental Methodology | Phương pháp thực nghiệm | 1.5 | Dataset, kiến trúc, hyperparameter cố định, biến thực nghiệm, seed, metric |
| 8 | Implementation | Hiện thực | 1.5 | Kiến trúc phần mềm (`src/`), manual backprop vs. PyTorch autograd, gradient checking |
| 9 | Experimental Results | Kết quả thực nghiệm | 3 | Bảng + hình cho 8 experiment (loss/accuracy curves, gradient norm theo layer, activation/weight variance, so sánh initialization, so sánh activation) |
| 10 | Discussion | Thảo luận | 1.5 | Diễn giải kết quả theo lý thuyết Mục 5–6; khi nào giả định lý thuyết không khớp thực nghiệm |
| 11 | Limitations | Hạn chế | 0.5 | Quy mô mạng nhỏ, subset dữ liệu, 1 seed, CPU-only, không BatchNorm |
| 12 | Conclusion | Kết luận | 0.5 | Tóm tắt bằng chứng cho thấy Backprop = Chain Rule, Initialization quyết định symmetry breaking + ổn định gradient |
| 13 | References | Tài liệu tham khảo | — | 9–11 nguồn đã verify (Mục 4 tài liệu này) |

Tổng ước tính: **~20–22 trang nội dung** (không tính bìa/mục lục), nằm giữa
khoảng 15–25 trang yêu cầu.

**Quy ước trình bày mỗi mục con toán học** (bắt buộc, theo yêu cầu đề bài):
mỗi công thức đi kèm đoạn văn ngắn trả lời *nó là gì → tại sao xuất hiện →
từng thành phần nghĩa là gì → dùng để làm gì*, đặt trước hoặc ngay sau công
thức — không thả công thức trần trụi.

---

## 2. Cấu trúc slide PPTX (29 slide, ánh xạ 1–1 sang report)

Giữ đúng thứ tự người dùng yêu cầu; cột "Nguồn nội dung" chỉ mục report
tương ứng để đảm bảo nhất quán số liệu/công thức.

| Slide | Chủ đề | Nguồn nội dung (report) |
|---|---|---|
| 1 | Title | Bìa |
| 2 | Problem / Motivation | §1 |
| 3 | Learning objectives | §1 |
| 4 | Derivative intuition | §2.1–2.3 |
| 5 | Chain Rule | §2.4 |
| 6 | Computational Graph | §2.5, §4.3 (toy graph) |
| 7 | Forward Propagation | §3 |
| 8 | Backpropagation intuition | §4.1 |
| 9 | Backpropagation derivation | §4.2 |
| 10 | Matrix form | §4.3 |
| 11 | Backprop vs. Gradient Descent | §4.5 |
| 12 | Why Initialization Matters | §5.1 |
| 13 | Zero Initialization | §5.2 |
| 14 | Random Initialization | §5.3 |
| 15 | Xavier | §5.4 |
| 16 | He | §5.5 |
| 17 | Vanishing Gradient | §6 |
| 18 | Exploding Gradient | §6 |
| 19 | Experimental Setup | §7 |
| 20 | Manual Backpropagation | §8 (Part A) |
| 21 | Gradient Checking | §8 (gradient check) |
| 22 | Experimental Results (loss/accuracy) | §9 |
| 23 | Gradient Norm Results | §9 (Exp. 7) |
| 24 | Initialization Comparison | §9 (bảng so sánh) |
| 25 | Discussion | §10 |
| 26 | Practical Guidelines | §10 (tóm tắt "khi nào dùng gì") |
| 27 | Limitations | §11 |
| 28 | Conclusion | §12 |
| 29 | References | §13 |

Mỗi slide 20–30: 1 ý chính, ≤ 6 bullet, có speaker notes (Phase 8).

---

## 3. Ký hiệu toán học dùng chung (report ⇄ slide ⇄ code)

| Ký hiệu | Ý nghĩa | Biến trong code (`src/`) |
|---|---|---|
| $x \in \mathbb{R}^{n_0}$ | Vector đầu vào (1 mẫu) | `x` |
| $X \in \mathbb{R}^{N\times n_0}$ | Batch $N$ mẫu | `X` |
| $W^{(l)} \in \mathbb{R}^{n_{l-1}\times n_l}$ | Trọng số lớp $l$ (quy ước *hàng = mẫu*, nên $Z=XW+b$) | `W[l]` |
| $b^{(l)} \in \mathbb{R}^{n_l}$ | Bias lớp $l$ | `b[l]` |
| $z^{(l)} = a^{(l-1)}W^{(l)} + b^{(l)}$ | Pre-activation (tổng có trọng số) | `z[l]` |
| $a^{(l)} = f(z^{(l)})$ | Post-activation; $a^{(0)}=x$ | `a[l]` |
| $f(\cdot)$ | Hàm kích hoạt (Sigmoid/Tanh/ReLU/Leaky ReLU) | `activations.py` |
| $\hat{y} = a^{(L)}$ | Output của mạng $L$ lớp | `y_hat` |
| $L(\hat y, y)$ | Hàm mất mát (MSE cho hồi quy scalar demo; Cross-Entropy cho MNIST/Fashion-MNIST) | `loss` |
| $\delta^{(l)} = \partial L/\partial z^{(l)}$ | "Lỗi cục bộ" lan truyền ngược tại lớp $l$ | `delta[l]` |
| $n_{\text{in}}, n_{\text{out}}$ | fan-in, fan-out của một lớp | `fan_in, fan_out` |
| $\mathrm{Var}(W)$ | Phương sai phân phối khởi tạo trọng số | tham số của `initialization.py` |
| $\eta$ | Learning rate | `lr` |

Quy ước: **hàng của $X$ là mẫu** (PyTorch/NumPy convention), khác với quy
ước cột-là-mẫu hay gặp trong sách giáo trình — báo cáo nêu rõ điều này một
lần ở §3 rồi dùng nhất quán, tránh gây nhầm khi đối chiếu với code.

Thuật ngữ song ngữ dùng nhất quán (in đậm English trong ngoặc khi xuất hiện lần đầu mỗi mục):
Đạo hàm (Derivative) · Gradient · Quy tắc chuỗi (Chain Rule) · Đồ thị tính
toán (Computational Graph) · Lan truyền tiến (Forward Propagation) · Lan
truyền ngược (Backpropagation) · Khởi tạo tham số (Parameter Initialization)
· Phá vỡ đối xứng (Symmetry Breaking) · Gradient biến mất/bùng nổ
(Vanishing/Exploding Gradient) · Tự động vi phân (Automatic Differentiation,
autograd).

---

## 4. Danh mục tài liệu tham khảo (đã verify qua tìm kiếm, không bịa)

1. **Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986).** Learning
   representations by back-propagating errors. *Nature*, 323, 533–536.
2. **Glorot, X., & Bengio, Y. (2010).** Understanding the difficulty of
   training deep feedforward neural networks. In *Proceedings of the 13th
   International Conference on Artificial Intelligence and Statistics
   (AISTATS)*, PMLR vol. 9, pp. 249–256.
3. **He, K., Zhang, X., Ren, S., & Sun, J. (2015).** Delving Deep into
   Rectifiers: Surpassing Human-Level Performance on ImageNet
   Classification. In *Proceedings of the IEEE International Conference on
   Computer Vision (ICCV)*. arXiv:1502.01852.
4. **LeCun, Y., Bottou, L., Orr, G. B., & Müller, K.-R. (1998 / 2012).**
   Efficient BackProp. In *Neural Networks: Tricks of the Trade*, Lecture
   Notes in Computer Science, vol. 1524 (1998) / vol. 7700, 2nd ed. (2012),
   Springer.
5. **Goodfellow, I., Bengio, Y., & Courville, A. (2016).** *Deep Learning*.
   MIT Press.
6. **Bishop, C. M. (2006).** *Pattern Recognition and Machine Learning*.
   Springer.
7. **Kingma, D. P., & Ba, J. (2015).** Adam: A Method for Stochastic
   Optimization. In *International Conference on Learning Representations
   (ICLR)*. arXiv:1412.6980.
8. **Xiao, H., Rasul, K., & Vollgraf, R. (2017).** Fashion-MNIST: a Novel
   Image Dataset for Benchmarking Machine Learning Algorithms.
   arXiv:1708.07747.
9. **Paszke, A., et al. (2019).** PyTorch: An Imperative Style,
   High-Performance Deep Learning Library. In *Advances in Neural
   Information Processing Systems (NeurIPS)*. arXiv:1912.01703.

(Nếu Mục 6 Discussion cần trích thêm về BatchNorm, sẽ bổ sung **Ioffe &
Szegedy (2015), arXiv:1502.03167** — chỉ thêm nếu thực sự được cite trong
văn bản, đúng quy tắc "không tạo reference không dùng".)

---

## 5. Ràng buộc kỹ thuật đã chốt cho Phase 3 (thực nghiệm)

Chốt sơ bộ (chi tiết đầy đủ ở `docs/phase3_experiment_design.md`):
- Dataset: **Fashion-MNIST** (qua `torchvision.datasets`), subset để chạy
  nhanh trên CPU.
- Model: MLP 6 hidden layer (không BatchNorm) để phân biệt rõ tác động của
  initialization.
- Optimizer cố định, learning rate/batch size/epoch/seed cố định giữa các
  experiment initialization; chỉ đổi initialization/activation khi so sánh
  đúng biến đó.
- Không bịa số liệu: mọi bảng/hình trong report chỉ được điền sau khi script
  thực nghiệm chạy thật và log được lưu vào `results/`.
