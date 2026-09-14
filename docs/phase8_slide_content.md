# PHASE 8 — Nội dung 29 slide (kèm speaker notes)

Nguồn nội dung: `docs/phase2_math_content.md` (công thức), `report/main.tex`
(văn bản đầy đủ), `results/` (số liệu thật). Mỗi slide: 1 ý chính, ≤6
bullet, speaker notes trả lời "nói gì / công thức nghĩa gì / nếu bị hỏi
'tại sao?' thì trả lời sao / ví dụ trực quan nào".

---

**Slide 1 — Title**
- Đạo hàm & Khởi tạo trong Deep Learning: Backpropagation và Parameter Initialization
- Derivatives & Initialization in Deep Learning
- Nhóm sinh viên · Học phần Deep Learning · 2026
- Notes: Giới thiệu tên, chủ đề, và nói 1 câu định hướng: "Báo cáo trả lời 2 câu hỏi: tính gradient thế nào (Backprop) và bắt đầu từ đâu (Initialization)."

**Slide 2 — Problem / Motivation**
- Huấn luyện mạng = bài toán tối ưu tìm $\theta$ minh loss
- 2 câu hỏi bắt buộc: tính gradient hiệu quả? bắt đầu từ đâu?
- Sai 1 trong 2 → mạng không học được, bất kể kiến trúc "hay" đến đâu
- Notes: Nhấn mạnh đây không phải 2 chủ đề tách rời — cả 2 đều nói về việc "tín hiệu học" (gradient) di chuyển trong mạng.

**Slide 3 — Learning Objectives**
- Giải thích Backprop = Chain Rule có hệ thống, KHÁC Gradient Descent
- Suy ra gradient dạng vô hướng + ma trận cho MLP
- Giải thích vì sao W=0 hỏng, Xavier/He giải quyết gì
- Giải thích cơ chế vanishing/exploding gradient
- Kiểm chứng bằng thực nghiệm thật trên Fashion-MNIST
- Notes: Đọc nhanh mục tiêu, đây cũng là dàn ý bài trình bày.

**Slide 4 — Derivative intuition**
- Đạo hàm = độ nhạy: nhích $x$, $y$ đổi bao nhiêu?
- $y=x^2 \Rightarrow dy/dx=2x$ — hình tiếp tuyến
- Trong DL: $\partial L/\partial w$ = "nên chỉnh $w$ hướng nào?"
- Notes: Dùng hình tiếp tuyến. Nếu bị hỏi "đạo hàm âm nghĩa là gì" → tăng w thì loss giảm, nên optimizer sẽ TĂNG w (đi ngược dấu gradient).

**Slide 5 — Chain Rule**
- $y=f(g(x)) \Rightarrow dy/dx = (dy/dg)(dg/dx)$
- Ví dụ: $x\to z=wx+b\to a=\sigma(z)\to L$
- $\partial L/\partial w = (\partial L/\partial a)(\partial a/\partial z)(\partial z/\partial w)$
- Notes: Ẩn dụ dây chuyền/truyền tin đồn. Đây là viên gạch nền tảng của toàn bộ Backprop.

**Slide 6 — Computational Graph**
- Đồ thị: mỗi nút = 1 phép toán, forward tính giá trị, backward nhân đạo hàm cục bộ
- Ví dụ: $z=wx+b\to a=\mathrm{ReLU}(z)\to L=\tfrac12(a-y)^2$
- Số liệu: $x=2,w=0.5,b=-0.3,y=1 \Rightarrow L=0.045$, $\partial L/\partial w=-0.6$
- Notes: Vẽ hình graph trên bảng nếu được hỏi thêm. Nhấn: mỗi nút chỉ cần biết đạo hàm CỦA CHÍNH NÓ.

**Slide 7 — Forward Propagation**
- $z^{(l)}=W^{(l)}a^{(l-1)}+b^{(l)}$, $a^{(l)}=f(z^{(l)})$
- Lặp qua từng lớp; lớp cuối thường linear (logits) cho classification
- Forward KHÔNG liên quan gradient — chỉ tính + lưu giá trị trung gian
- Notes: Forward pass là bước "đi xuôi", cần cho cả training lẫn inference; backward chỉ cần khi training.

**Slide 8 — Backpropagation intuition**
- KHÔNG phải thuật toán thần kỳ — là Chain Rule áp dụng có hệ thống
- Đi ngược từ Loss, hỏi "bước này khuếch đại/giảm lỗi bao nhiêu?"
- Tận dụng giá trị forward đã lưu (cache) — không tính lại từ đầu
- Notes: Ẩn dụ dây chuyền sản xuất bị lỗi, truy ngược công đoạn nào gây lỗi nhiều nhất.

**Slide 9 — Backpropagation derivation (mạng 2 lớp)**
- $x\to$ Linear($W_1,b_1$) $\to$ ReLU $\to$ Linear($W_2,b_2$)$\to\hat y\to L$
- $\delta_2=\hat y-y$; $\partial L/\partial W_2=a_1\delta_2^T$
- $\delta_1=(W_2\delta_2)\odot\mathrm{ReLU}'(z_1)$; $\partial L/\partial W_1=x\delta_1^T$
- Số liệu: neuron 2 "chết" → cột 2 của cả 2 gradient = 0 (dead ReLU)
- Notes: Đây là ví dụ CHỦ ĐẠO xuyên suốt bài — nhắc lại số liệu ở slide 20 (manual backprop) và slide 21 (gradient check) dùng ĐÚNG ví dụ này.

**Slide 10 — Matrix form**
- $Z^{(l)}=A^{(l-1)}W^{(l)}+b^{(l)}$ (hàng = mẫu, khớp code)
- $\partial L/\partial W^{(l)}=(A^{(l-1)})^T (\partial L/\partial Z^{(l)})$
- $\partial L/\partial b^{(l)}$ = tổng theo batch (từ broadcasting)
- Notes: Nếu bị hỏi "vì sao chuyển vị ở đây" → kiểm tra kích thước ma trận, đây là cách tự-debug khi code.

**Slide 11 — Backprop vs Gradient Descent**
- Backprop = TÍNH gradient (thuật toán, dùng Chain Rule)
- Gradient Descent = DÙNG gradient để cập nhật $\theta\leftarrow\theta-\eta\nabla L$
- Backprop không đổi dù optimizer là SGD/Adam/Momentum
- Notes: Đây là câu hỏi hay bị hỏi phản biện nhất — trả lời dứt khoát: "Backprop trả lời CÁI GÌ, GD trả lời NÊN LÀM GÌ với cái đó."

**Slide 12 — Why Initialization Matters**
- Gradient Descent chỉ di chuyển CỤC BỘ quanh điểm xuất phát $\theta_0$
- Chọn sai $\theta_0$ → mạng đứng yên (Zero) hoặc gradient nổ/biến mất
- Notes: Cầu nối sang phần 2 của báo cáo.

**Slide 13 — Zero Initialization**
- W giống nhau → mọi neuron cùng z, cùng a, cùng gradient mãi mãi
- "Mất khả năng phá vỡ đối xứng" — layer n neuron chỉ có sức mạnh như 1
- Thực nghiệm: gradient lớp ẩn đo được = 0,0 tuyệt đối
- Notes: Nhấn mạnh "0 tuyệt đối" không phải "rất nhỏ" — đây là điểm khác Random.

**Slide 14 — Random Initialization**
- Phá đối xứng: mỗi neuron khởi đầu khác nhau
- Nhưng nếu $\sigma$ không scale theo $n_{in}$ → vẫn vanish/explode ở mạng sâu
- Thực nghiệm: gradient lớp 1 chỉ $\approx3\times10^{-11}$ (Sigmoid, 6 lớp)
- Notes: Cầu nối: "phá đối xứng là ĐIỀU KIỆN CẦN, chưa ĐỦ."

**Slide 15 — Xavier/Glorot**
- $\mathrm{Var}(W)=2/(n_{in}+n_{out})$ — dung hoà forward + backward
- Phù hợp Tanh/Sigmoid (activation đối xứng quanh 0)
- Thực nghiệm: Tanh+Xavier đạt 69,2% test accuracy
- Notes: Nếu hỏi "vì sao trung bình n_in, n_out" → 2 điều kiện (giữ Var(z) và Var(gradient)) chỉ khớp khi n_in=n_out, Glorot chọn điểm dung hoà.

**Slide 16 — He/Kaiming**
- $\mathrm{Var}(W)=2/n_{in}$ — gấp đôi Xavier để bù ReLU triệt tiêu nửa variance
- Phù hợp ReLU/Leaky ReLU
- Thực nghiệm: ReLU+Xavier 67,4%, ReLU+He 66,7% (chênh lệch trong biên độ nhiễu 1 seed)
- Notes: Trung thực: dự đoán lý thuyết He>Xavier cho ReLU KHÔNG rõ ràng ở thực nghiệm nhỏ này — cơ hội thể hiện tư duy phản biện nếu bị hỏi.

**Slide 17 — Vanishing Gradient**
- Gradient = tích nhiều đạo hàm cục bộ qua L lớp: $\approx g^L$
- $g<1$: suy giảm hàm mũ — $g=0,5, L=50 \Rightarrow 8,9\times10^{-16}$
- Nguyên nhân kép: activation bão hoà ($\sigma'\le0,25$) + weight scale sai
- Notes: Số liệu bảng "hệ số g^L theo L" rất trực quan để trình bày — đọc thẳng từ báo cáo Mục 6.

**Slide 18 — Exploding Gradient**
- $g>1$: tăng hàm mũ — $g=2, L=50 \Rightarrow 1,1\times10^{15}$
- Hệ quả: loss dao động mạnh hoặc NaN
- Cùng nguyên nhân với vanishing, chỉ khác dấu của $(g-1)$
- Notes: Nhấn: đây là "hai mặt của cùng một đồng xu" — không phải 2 hiện tượng riêng biệt.

**Slide 19 — Experimental Setup**
- MLP 784→128×6→10, không BatchNorm/Dropout
- Fashion-MNIST subset 5000/1000/2000, SGD thuần, lr=0,05, 15 epoch, seed=42
- Lưới 5 initialization × 4 activation = 20 cấu hình, MỌI thứ khác giữ nguyên
- Notes: "Fair experiment" — nhấn mạnh chỉ đổi đúng 1 biến khi so sánh.

**Slide 20 — Manual Backpropagation**
- Tự viết forward+backward bằng NumPy (không autograd) — `src/manual_nn.py`
- Chạy đúng ví dụ 2 lớp ở Slide 9: khớp PyTorch autograd, sai số = 0
- Notes: Đây là Part A của project — chứng minh Backprop = Chain Rule bằng code thật, không chỉ lý thuyết.

**Slide 21 — Gradient Checking**
- 3 cách tính: manual / autograd / finite-difference $(f(w+h)-f(w-h))/2h$
- Kết quả: sai số tối đa $\approx10^{-9}$ (mức làm tròn số) → PASS
- Notes: Nếu hỏi "sao không dùng finite-diff luôn cho training" → vì nó cần O(P) forward pass, quá chậm cho mạng triệu tham số (Slide 10/Mục 4.4 báo cáo).

**Slide 22 — Experimental Results**
- Bảng test accuracy 5×4: Zero/Random luôn 10%; Sigmoid luôn ~10% dù init nào; LeCun/Xavier/He đạt 64-69% với Tanh/ReLU/Leaky ReLU
- [Hình initialization_comparison.png]
- Notes: Đọc bảng theo hàng rồi theo cột — hàng cho thấy Zero/Random luôn thất bại, cột Sigmoid cho thấy ngay cả init tốt cũng thất bại.

**Slide 23 — Gradient Norm Results**
- [Hình gradient_norm.png] — RMS gradient theo layer, Sigmoid
- Random: suy giảm 9 bậc độ lớn từ output về input
- LeCun/Xavier/He: suy giảm nhẹ hơn nhiều nhưng vẫn suy giảm (do chính Sigmoid)
- Notes: Đây là bằng chứng thực nghiệm trực tiếp nhất cho lý thuyết vanishing gradient Mục 6/Slide 17.

**Slide 24 — Initialization Comparison (tổng hợp)**
- Zero/Random: luôn ở mức ngẫu nhiên (10%), MỌI activation
- Tanh tốt nhất tổng thể với init có scale (~69%), Sigmoid luôn thất bại
- ReLU/Leaky ReLU: LeCun/Xavier/He tương đương nhau (64-68%)
- Notes: Đây là slide "big picture" — dùng để tổng kết trước khi sang Discussion.

**Slide 25 — Discussion**
- Vì sao Sigmoid thất bại dù He/Xavier "đúng lý thuyết"? $\sigma'\le0,25$ luôn co tín hiệu, không liên quan weight scale
- Initialization tốt = điều kiện CẦN, không phải ĐỦ
- He vs Xavier cho ReLU: chênh lệch nằm trong nhiễu 1-seed, không kết luận dứt khoát được
- Notes: Đây là phần thể hiện tư duy phản biện — không chỉ báo cáo số mà GIẢI THÍCH cơ chế.

**Slide 26 — Practical Guidelines**
- ReLU/Leaky ReLU → He/Kaiming; Tanh/Sigmoid → Xavier/LeCun
- KHÔNG BAO GIỜ dùng Zero-init cho weight (chỉ dùng 0 cho bias)
- Mạng rất sâu + activation bão hoà → cân nhắc BatchNorm thay vì chỉ dựa initialization
- Notes: Đây là slide "cheat sheet" thực dụng — hữu ích khi làm project khác.

**Slide 27 — Limitations**
- Subset nhỏ, 1 seed, 15 epoch, CPU-only — không đại diện quy mô lớn
- SGD thuần không tinh chỉnh LR riêng từng cấu hình
- Không BatchNorm/Dropout (cố ý, để cô lập biến initialization)
- Notes: Trung thực về giới hạn — không giấu, đây là điểm cộng học thuật.

**Slide 28 — Conclusion**
- Backprop = Chain Rule có hệ thống, KHÁC Gradient Descent
- Initialization quyết định gradient có "sống sót" qua nhiều lớp hay không
- Cả 2 chủ đề cùng trả lời 1 câu hỏi: tín hiệu học di chuyển thế nào trong mạng sâu
- Notes: Tóm tắt bằng 1 câu chốt, chuẩn bị cho Q&A.

**Slide 29 — References**
- 9 nguồn: Rumelhart 1986, Glorot & Bengio 2010, He et al. 2015, LeCun et al. 1998/2012, Goodfellow et al. 2016, Bishop 2006, Kingma & Ba 2015, Xiao et al. 2017, Paszke et al. 2019
- Notes: Sẵn sàng nêu nguồn cụ thể nếu giảng viên hỏi "câu này lấy từ đâu".
