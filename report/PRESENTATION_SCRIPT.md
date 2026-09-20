# Kịch bản thuyết trình — Backpropagation & Parameter Initialization

**Dùng cùng với:** `Slide_Backprop_Initialization.pptx` (29 slide)
**Thời lượng đề xuất:** 25–30 phút thuyết trình + 5–10 phút demo/Q&A
**Đối tượng:** Học phần Deep Learning bậc Thạc sĩ

> File này là kịch bản NÓI đầy đủ, độc lập với PPTX — dùng để tập trước, đọc khi luyện, hoặc đưa cho người khác thuyết trình hộ. Speaker notes trong PPTX là bản rút gọn của chính kịch bản này.

---

## 0. Trước khi bắt đầu — checklist 2 phút

- [ ] Mở `Slide_Backprop_Initialization.pptx`, chạy thử Present từ đầu 1 lượt (không nói) để chắc hình không vỡ trên máy chiếu thật.
- [ ] Mở sẵn 1 terminal tại thư mục gốc project (`deep-learning-backprop-init/`), đã activate đúng Python env có `torch`, `numpy`, `pandas`, `matplotlib`.
- [ ] Test nhanh: `python -c "import torch; print(torch.__version__)"` — tránh lỗi giữa buổi.
- [ ] Nếu phần Demo-sống (mục 5 bên dưới) không chạy được tại chỗ (wifi/điện/thời gian) → có **Kế hoạch B**: mở sẵn các file JSON/CSV/PNG trong `results/` để chỉ tay thay vì chạy code.
- [ ] Nhớ: KHÔNG cần chạy lại thực nghiệm trong buổi — mọi số liệu trên slide đã có sẵn trong `results/`. Chạy lại chỉ để "diễn" cho khán giả thấy pipeline hoạt động thật.

---

## Cấu trúc buổi nói (4 Act, khớp progress-dots trên slide)

| Act | Slide | Nội dung | Thời gian gợi ý |
|---|---|---|---|
| 1. Motivation & Math | 1–9 | Đặt vấn đề → Derivative → Gradient → GD → Forward → Chain Rule → Backprop | ~8 phút |
| 2. Vanishing/Exploding & Init | 10–17 | Vanishing/Exploding → Zero/Random/Xavier/He → Synthesis | ~8 phút |
| 3. Experiment | 18–26 | Thiết kế thực nghiệm → 5 experiment → Heatmap → Depth → Bảng tổng hợp | ~10 phút |
| 4. Conclusion | 27–29 | Kết luận → Mở rộng → References | ~3 phút |

---

## ACT 1 — Motivation & Math (Slide 1–9)

### Slide 1 — Title
**Nói:**
> "Chào thầy/cô và các bạn. Hôm nay em trình bày đề tài Backpropagation và Parameter Initialization trong mạng nơ-ron sâu. Câu hỏi xuyên suốt cả bài là: khởi tạo tham số ảnh hưởng thế nào đến việc gradient lan truyền và mạng có hội tụ được hay không? Đây không chỉ là một bài giảng lại lý thuyết — phần cuối em sẽ trình bày một thực nghiệm nhỏ để KIỂM CHỨNG những gì lý thuyết dự đoán, bằng số liệu thật."

### Slide 2 — Motivation
**Nói:**
> "Giả sử ta có một mạng 50 lớp. Input đi qua Layer 1, Layer 2, ..., Layer 50, ra Loss. Câu hỏi đầu tiên: Layer 1 — lớp xa Loss nhất — biết phải thay đổi thế nào? Câu trả lời là Backpropagation. Nhưng ngay khi có Backpropagation, một vấn đề mới xuất hiện: gradient khi đi ngược qua 50 lớp có thể tiến về 0, hoặc tiến về vô cùng. Đây chính là vanishing/exploding gradient — và nó dẫn thẳng tới câu hỏi thứ ba: khởi tạo tham số ban đầu (θ₀) như thế nào để tránh việc này."

**Điểm nhấn:** đây là 3 câu hỏi con sẽ được trả lời tuần tự: (1) Backprop tính gradient thế nào, (2) vì sao mạng sâu dễ vanishing/exploding, (3) Zero/Random/Xavier/He ảnh hưởng thế nào.

### Slide 3 — Derivative
**Nói:**
> "Nhắc lại nhanh 1 slide duy nhất: đạo hàm đo mức thay đổi của output khi input thay đổi một lượng nhỏ. f(x)=x² thì f'(x)=2x. Đây là viên gạch nền tảng duy nhất — mọi khái niệm sau (gradient, chain rule, backprop) chỉ là áp dụng có hệ thống của khái niệm này. Em sẽ không dừng lâu ở calculus cơ bản."

### Slide 4 — Partial Derivative & Gradient
**Nói:**
> "Trong Deep Learning, Loss là hàm của hàng triệu tham số L(w₁,...,wₙ). Gradient ∇L là vector gồm tất cả đạo hàm riêng. **Điểm quan trọng cần nói chính xác**: ∇L chỉ HƯỚNG TĂNG nhanh nhất của Loss trong không gian tham số — không phải hướng giảm. Vì vậy Gradient Descent phải đi theo hướng NGƯỢC lại, −∇L, mới là hướng giảm nhanh nhất cục bộ."

**Lưu ý khi nói:** đây là chỗ dễ bị hỏi ngược ("sao không phải gradient trỏ về hướng giảm luôn cho tiện?") — trả lời: định nghĩa toán học của gradient là hướng đạo hàm dương lớn nhất, dấu trừ trong công thức update mới là phần "đi tìm minimum".

### Slide 5 — Gradient Descent
**Nói:**
> "Công thức: w_new = w_old − η·∂L/∂w, hoặc viết dạng vector cho toàn bộ tham số: θ_new = θ_old − η∇_θL. η là learning rate — bước nhảy. Dấu trừ là bắt buộc, như vừa nói ở slide trước. Trực giác: một quả bóng lăn xuống loss landscape theo hướng ngược gradient."

### Slide 6 — Forward Propagation
**Nói:**
> "Forward pass: z = w₁x₁+w₂x₂+b, a=f(z), L=L(a,y). **Diễn đạt chính xác**: forward pass CHƯA tính gradient — nhưng nó tính output VÀ lưu lại các giá trị trung gian (z, a) và computational graph mà backward pass sẽ cần dùng lại. Đây chính xác là điều PyTorch autograd làm ngầm phía sau mỗi lần gọi forward()."

### Slide 7 — Chain Rule
**Nói:**
> "Muốn biết w ảnh hưởng Loss thế nào, ta nhân các đạo hàm cục bộ dọc theo đường đi w→z→a→L: ∂L/∂w = (∂L/∂a)(∂a/∂z)(∂z/∂w). Đây là core ý tưởng của Backpropagation — đi ngược đồ thị tính toán, nhân dồn đạo hàm cục bộ. Một lưu ý nhỏ nhưng quan trọng: đây là ví dụ scalar cho dễ hình dung. Trong mạng thực tế, activation và tham số là vector/ma trận, nên phép nhân tổng quát hoá thành vector-Jacobian product — và đây chính là thứ PyTorch autograd tự động hoá, không cần mình tự viết tay."

### Slide 8 — Backpropagation Example
**Nói:**
> "Ví dụ chạy tay: x=2, w=3, z=wx=6, y=z²=36. Backward: ∂y/∂z=2z=12, ∂z/∂w=x=2, vậy ∂y/∂w=12×2=24. Đây là bản chất Chain Rule ở quy mô nhỏ nhất có thể — cùng logic này, khi lặp lại hàng triệu lần qua hàng chục lớp, chính là Backpropagation trong một mạng thật."

### Slide 9 — Multi-layer Backpropagation
**Nói:**
> "Mở rộng lên mạng nhiều lớp: x→W₁→h₁→W₂→h₂→W₃→ŷ→Loss. Khi đi backward, ta có Loss→∇W₃→∇W₂→∇W₁. **Điểm mấu chốt**: gradient của lớp càng gần input phụ thuộc vào TÍCH của càng nhiều đạo hàm cục bộ. Đây là cầu nối trực tiếp sang câu hỏi tiếp theo: điều gì xảy ra khi tích đó có rất nhiều số hạng?"

**Ghi chú:** đây cũng là chỗ nên nói rõ phân biệt Gradient Descent vs Backpropagation nếu có câu hỏi: Backprop là thuật toán TÍNH gradient hiệu quả bằng chain rule; Gradient Descent là quy tắc CẬP NHẬT dùng gradient đã có. Hai khái niệm độc lập, hay bị nhầm là một.

---

## ACT 2 — Vanishing/Exploding & Initialization (Slide 10–17)

### Slide 10 — Vanishing Gradient
**Nói:**
> "Minh hoạ đơn giản hoá: nếu mỗi bước co norm gradient theo hệ số khoảng 0.5, qua 20 lớp: 0.5²⁰ ≈ 9.54×10⁻⁷ — gần như 0. **Cách nói chính xác hơn 'đạo hàm nhỏ hơn 1'**: gradient trong mạng sâu là tích của nhiều local Jacobian và weight matrix; nếu các phép biến đổi này liên tục CO NORM của gradient, gradient sẽ vanish. Hậu quả: các lớp gần input gần như không nhận được tín hiệu học, weight ở đó gần như đứng yên suốt quá trình huấn luyện."

### Slide 11 — Exploding Gradient
**Nói:**
> "Ngược lại: nếu hệ số khuếch đại ≈1.5, qua 20 lớp: 1.5²⁰≈3325. Cùng cơ chế tích luỹ qua nhiều lớp như vanishing, chỉ khác việc norm gradient bị co lại hay khuếch đại — **không đơn giản chỉ là 'khác dấu của (đạo hàm−1)'**, vì đây là hành vi của TÍCH nhiều ma trận/Jacobian, không phải một số vô hướng duy nhất. Hậu quả: loss dao động mạnh hoặc NaN, weight tăng vọt. Lát nữa Experiment 3 sẽ tái hiện đúng hiện tượng này bằng số liệu thật, không phải minh hoạ."

### Slide 12 — Why Initialization Matters (Zero-init)
**Nói:**
> "Tại sao không đặt tất cả weight = 0? Vì mọi hidden unit trong 1 lớp khi đó nhận cùng input, cùng weight ⇒ cùng z, cùng a, cùng gradient — giữ symmetry mãi mãi. **Phân biệt quan trọng**: đây là vấn đề của WEIGHT, không phải bias — bias vẫn có thể khởi tạo 0 an toàn vì nó không gây đối xứng GIỮA các hidden unit. Trong kiến trúc đang khảo sát ở đây, zero-init khiến hidden-layer gradient đo được đúng bằng 0.0 — không phải xấp xỉ, số liệu thật lấy từ thực nghiệm Zero+Sigmoid."

### Slide 13 — Random Initialization
**Nói:**
> "Random giải quyết được symmetry. Nhưng chọn sai variance vẫn thất bại: std quá nhỏ → activation nhỏ dần → có xu hướng vanishing. Std quá lớn, với mạng ReLU → gradient có xu hướng tăng vọt → exploding. Nhưng — điểm cần làm rõ — đây là hành vi quan sát được của mạng ReLU trong thực nghiệm này. Với activation bão hoà như sigmoid/tanh, std lớn còn có thể đẩy pre-activation vào vùng bão hoà, khiến derivative gần 0 — tức cũng gây vanishing, chứ không chỉ exploding. Hai cơ chế thất bại khác nhau tùy activation."

### Slide 14 — Xavier/Glorot Initialization
**Nói:**
> "Xavier/Glorot Normal: W_ij ~ N(0, 2/(fan_in+fan_out)). Mục tiêu: giữ variance tín hiệu ổn định qua từng lớp, cân bằng 2 điều kiện — giữ Var(z) khi forward VÀ giữ Var(gradient) khi backward. Thường dùng với Tanh hoặc activation có gain phù hợp; Tanh còn có lợi thế zero-centered — **Sigmoid thì KHÔNG zero-centered**, đây là điểm hay bị phát biểu nhầm. Số liệu thật trên lưới chính (6 hidden layer): Xavier+ReLU đạt 67.4% test accuracy."

### Slide 15 — He/Kaiming Initialization
**Nói:**
> "He/Kaiming Normal: W_ij ~ N(0, 2/fan_in), dùng cho ReLU/Leaky ReLU. Dưới giả định pre-activation gần đối xứng quanh 0, ReLU đặt khoảng một nửa giá trị về 0. He dùng scale 2/fan_in để bù sự suy giảm variance do ReLU gây ra — gấp đôi công thức forward-preserving thuần. Trong nhiều thiết lập, cách này giúp giữ Var(a) cùng bậc với Var(x) qua các lớp ReLU. Số liệu thật: He+ReLU đạt 66.7% trên cùng lưới 6 hidden layer."

**Nếu bị hỏi "vậy Xavier hay He tốt hơn cho ReLU?"** → đừng trả lời ngay ở đây, nói: "Chênh lệch 67.4% vs 66.7% chỉ từ 1 seed — chưa đủ ý nghĩa thống kê, em sẽ quay lại câu hỏi này với 5-seed replication ở phần Experiment."

### Slide 16 — Comparison Table
**Nói:**
> "Tổng hợp: Zero (không nên dùng), Small Random N(0,0.01²) (chỉ mạng rất nông), Xavier/Glorot (Tanh), He/Kaiming (ReLU/Leaky ReLU), và Orthogonal — em liệt kê Orthogonal cho đầy đủ bức tranh lý thuyết nhưng **không có thực nghiệm đi kèm trong project này**, tránh gây hiểu nhầm đã test đủ. Mọi thí nghiệm tiếp theo nhằm kiểm chứng đúng bảng này bằng số liệu thật."

### Slide 17 — What are Xavier/He trying to preserve? (Synthesis)
**Nói:**
> "Trước khi sang phần thực nghiệm, chốt lại: Xavier và He, dù công thức khác nhau, đều đang cố giữ 2 điều — Forward: Var(a⁽ˡ⁾) ổn định qua các layer; Backward: Var(δ⁽ˡ⁾) — tức đạo hàm ∂L/∂z — cũng ổn định qua các layer. Nói ngắn gọn: **good initialization cố ngăn scale của signal và gradient collapse hoặc explode một cách hệ thống khi độ sâu tăng lên**. Đây là mục tiêu chung, dưới các giả định đơn giản hoá — không phải một đảm bảo toán học tuyệt đối cho mọi kiến trúc/activation thực tế."

---

## ACT 3 — Experiment (Slide 18–26)

**Chuyển ý:** "Đến đây là lý thuyết. Phần còn lại em thiết kế một thực nghiệm nhỏ để kiểm chứng trực tiếp — không chỉ 'train rồi xem accuracy', mà đo đúng những đại lượng lý thuyết vừa nói tới: variance, gradient."

### Slide 18 — Thiết kế thực nghiệm
**Nói:**
> "Câu hỏi nghiên cứu: khởi tạo weight ảnh hưởng thế nào đến gradient flow và convergence? Kiến trúc: 784 → (Linear 128 → ReLU) × 10 → 10 — cố tình khá sâu, 10 hidden layer, để vấn đề gradient thể hiện rõ. Dataset: Fashion-MNIST subset 5.000 train / 1.000 val / 2.000 test — giống hệt lưới thực nghiệm chính của báo cáo. Biến duy nhất thay đổi là cách khởi tạo weight: Zero, Random nhỏ, Random lớn, Xavier, He. Mọi thứ khác giữ nguyên — cùng optimizer SGD lr=0.05, cùng 15 epoch. **Lưu ý về seed**: cùng seed giúp reproducibility và giảm một nguồn randomness khi so sánh — nhưng không thay thế cho việc lặp lại nhiều seed, em sẽ quay lại điểm này."

### Slide 19 — 4 nhóm metric
**Nói:**
> "Em log 4 nhóm metric, theo đúng thứ tự ưu tiên khi đọc kết quả: (1) Activation Variance theo layer — tín hiệu sớm nhất cho co cụm hoặc bão hoà; (2) Gradient RMS theo layer — RMS(∂L/∂W) = grad.pow(2).mean().sqrt(), chuẩn hoá theo số phần tử để so sánh công bằng giữa các layer có kích thước khác nhau; (3) Training Loss & Accuracy theo epoch; (4) Weight Variance theo layer, đối chiếu với công thức lý thuyết. Không chỉ đo accuracy — 4 nhóm metric này giúp phân biệt NGUYÊN NHÂN thất bại (vanishing vs exploding vs overfitting) thay vì chỉ thấy 'model tệ'."

### Slide 20 — Experiment 1 & 2: Zero vs Random nhỏ
**Nói:**
> "Chạy thật: `nn.init.zeros_` cho Experiment 1, `nn.init.normal_(std=0.01)` cho Experiment 2. Kết quả thật trên 10-hidden-layer: Zero cho gradient RMS lớp 1 đúng bằng 0.0; Random nhỏ cho gradient RMS ≈1.13×10⁻¹³ — về mặt số học khác 0 nhưng nhỏ tới mức vô dụng. Cả hai đều kẹt đúng ở mức ngẫu nhiên 10.0% test accuracy. Nguyên nhân khác nhau: Zero vì symmetry breaking, Random nhỏ vì gradient co lại theo hàm mũ qua 10 lớp — nhưng hậu quả cuối cùng giống hệt nhau."

### Slide 21 — Experiment 3: Random LỚN
**Nói:**
> "`nn.init.normal_(std=1.0)`. Đây là slide 'kịch tính' nhất: gradient RMS lớp 1 bùng nổ tới 1.87×10⁷ ngay bước đầu tiên, train loss thành NaN ngay từ epoch 1 và không phục hồi suốt cả 15 epoch. Đây là bằng chứng thực nghiệm trực tiếp cho hiện tượng Exploding Gradient đã nói ở slide lý thuyết — không phải minh hoạ, đây là NaN thật xảy ra khi em chạy thí nghiệm này."

### Slide 22 — Experiment 4 & 5: Xavier vs He (5-seed)
**Nói:**
> "Đây là phần em đặc biệt cẩn thận về mặt khoa học. Chạy Xavier và He, mỗi scheme lặp lại độc lập 5 seed khác nhau {42,...,46}, báo cáo mean ± std thay vì tin vào 1 lần chạy. Kết quả: Xavier đạt 69.1% ± 4.7 điểm phần trăm, He đạt 70.5% ± 5.7 điểm phần trăm. **Khoảng std của hai scheme chồng lấn nhau** — nghĩa là không đủ cơ sở để kết luận scheme nào vượt trội hơn cho ReLU trong setup này. Khác biệt rõ ràng và nhất quán hơn nhiều nằm ở gradient RMS: He cao hơn Xavier khoảng 35 lần, ở MỌI seed, không dao động."

**Đây là câu trả lời chuẩn nếu ai hỏi "vậy Xavier hay He tốt hơn?":** *"Về accuracy, trong thực nghiệm 5-seed này, khác biệt không có ý nghĩa thống kê. Về gradient scale, He nhất quán cao hơn — nhưng gradient cao hơn không tự động nghĩa là tốt hơn, chỉ là 'gần với thiết kế lý thuyết cho ReLU' hơn."*

### Slide 23 — Biểu đồ tổng hợp 5 thí nghiệm
**Nói:**
> "Một biểu đồ duy nhất tóm tắt toàn bộ 5 thí nghiệm: Zero và Random nhỏ là đường phẳng ngang mức 10%; Random lớn không xuất hiện trên biểu đồ vì loss là NaN ngay từ epoch 1; Xavier và He hội tụ rõ ràng, đạt khoảng 67–68% dù kiến trúc sâu tới 10 lớp."

### Slide 24 — Gradient RMS Heatmap
**Nói:**
> "Đây là một trong những visualization quan trọng nhất của toàn bộ demo, vì nó thể hiện TRỰC TIẾP gradient flow qua từng layer — không qua trung gian, khác với accuracy vốn là bằng chứng gián tiếp, chịu ảnh hưởng bởi nhiều yếu tố khác ngoài initialization. Trục dọc là 5 scheme, trục ngang là 11 layer (10 hidden + output), màu thể hiện log₁₀ của gradient RMS. Nhìn là thấy ngay: hàng Zero toàn -20 (làm tròn cho 'đúng 0'), Random nhỏ toàn khoảng -12 đến -13, Random lớn toàn khoảng +7 đến +9, còn Xavier và He nằm ở vùng giữa ổn định, khoảng -1 đến -3.4."

### Slide 25 — Depth Experiment
**Nói:**
> "Mở rộng: so sánh Random, Xavier, He tại nhiều độ sâu, từ 2 đến 50 hidden layer. Trong thiết lập này: Random (naive) có gradient RMS về xấp xỉ 0 từ độ sâu 20 trở lên. Xavier suy giảm dần đều, cho gradient RMS rất nhỏ tại depth=50, khoảng 3×10⁻¹⁰. He duy trì gradient RMS cùng order of magnitude — khoảng 10⁻² — đến tận depth=50, trong architecture và training setup đang xét. **Nhưng đây là insight quan trọng nhất của cả bài**: gradient ổn định không đồng nghĩa học tốt. He tại L=12 chỉ đạt 32.6% test accuracy — không phải vì vanishing gradient, mà vì overfitting trên tập train nhỏ không regularization. Nói cách khác: stable gradient flow là điều kiện quan trọng cho optimization ổn định, nhưng KHÔNG phải điều kiện đủ để model generalize tốt."

### Slide 26 — Bảng tổng hợp kết quả
**Nói:**
> "Tổng hợp tất cả: thứ tự đọc bảng này là Gradient RMS → Training Loss → Test Accuracy, đúng thứ tự ưu tiên đã nói ở slide Metrics. Zero và Random nhỏ: vanishing. Random lớn: exploding, NaN. Xavier và He: ổn định. Số liệu lấy nguyên văn từ CSV, kể cả dòng NaN của Random lớn — không làm tròn để đẹp bảng, không giấu kết quả thất bại."

---

## ACT 4 — Conclusion (Slide 27–29)

### Slide 27 — Conclusion
**Nói:**
> "Tổng kết bằng đúng mạch đã đi qua: Derivative → Chain Rule → Backpropagation → Gradient Flow → Vanishing/Exploding → Initialization → Stable Training. Bốn takeaway:
> 1. Backpropagation là cách tính gradient hiệu quả bằng cách áp dụng chain rule ngược qua computational graph.
> 2. Trong mạng sâu, gradient phụ thuộc vào tích của nhiều Jacobian/weight transformation — nên scale của gradient có thể vanish hoặc explode.
> 3. Xavier và He chọn scale của initial weight dựa trên fan-in/fan-out để giữ activation và gradient trong phạm vi hợp lý, dưới các giả định nhất định.
> 4. Good initialization cải thiện optimization và gradient flow, nhưng không đảm bảo generalization tốt — đây chính là điều Depth Experiment vừa chứng minh bằng số liệu thật."

### Slide 28 — Mở rộng (tham khảo)
**Nói:**
> "Nếu còn thời gian: Initialization chỉ là bước khởi đầu. Các mạng hiện đại còn dùng Batch/Layer Normalization để chuẩn hoá lại tín hiệu mỗi lớp thay vì chỉ dựa vào 1 lần khởi tạo; Residual Connections cho gradient một đường tắt bỏ qua tích luỹ nhiều lớp; Gradient Clipping chặn cứng exploding bất kể nguyên nhân. Em chỉ giới thiệu ngắn, không đi sâu vì đây không phải trọng tâm bài."

### Slide 29 — References
**Nói:**
> "11 nguồn tham khảo, từ Rumelhart 1986 (backprop gốc) tới He 2015, Glorot & Bengio 2010, và cả PyTorch paper — đều đã verify, khớp với danh mục IEEE trong báo cáo LaTeX đi kèm, không có nguồn bịa."

**Kết bài:**
> "Em xin dừng phần trình bày tại đây. Cảm ơn thầy/cô và các bạn đã lắng nghe, em sẵn sàng trả lời câu hỏi."

---

## 5. Demo sống project (nếu được yêu cầu / còn thời gian)

### 5.1. Giới thiệu cấu trúc project (30 giây)
Mở terminal, gõ (hoặc đã mở sẵn file explorer):
```bash
cd deep-learning-backprop-init
ls src/ experiments/ results/
```
**Nói:** "Project chia 3 phần: `src/` — code lõi (model, initialization, metrics, training loop); `experiments/` — script chạy từng thí nghiệm cụ thể; `results/` — log JSON, bảng CSV, hình PNG, tất cả đã có sẵn từ các lần chạy trước, không cần chạy lại khi demo."

### 5.2. Chỉ code — nơi các con số trên slide đến từ đâu
Mở `src/initialization.py`, chỉ vào hàm `weight_variance`:
```python
if scheme == "he":
    return 2.0 / fan_in
if scheme == "xavier":
    return 2.0 / (fan_in + fan_out)
```
**Nói:** "Đây chính là công thức Var(W) đã trình bày ở slide Xavier/He — không phải lý thuyết suông, đây là code thật tạo ra mọi con số trên slide."

Mở `src/metrics.py`, chỉ vào `grad_norms_per_layer`:
```python
"grad_norm": float(np.linalg.norm(g)),
"grad_rms": float(np.linalg.norm(g) / np.sqrt(n_elem)),
```
**Nói:** "Và đây là công thức Gradient RMS — chuẩn hoá theo số phần tử để so sánh công bằng giữa các layer có kích thước khác nhau, đúng công thức đã sửa và thống nhất trên toàn bộ slide."

### 5.3. Chạy lại 1 thí nghiệm nhỏ trực tiếp (nếu chắc chắn máy/thời gian ổn, ~30–60 giây)
Chạy thí nghiệm nhẹ nhất — chỉ 2 scheme để tiết kiệm thời gian:
```bash
python experiments/run_initialization.py --quick
```
**Nói trong lúc chạy:** "Lệnh này chạy nhanh 2 scheme × 2 activation, 2 epoch, chỉ để chứng minh pipeline chạy thật — bản đầy đủ (5 scheme × 4 activation × 15 epoch) đã chạy trước và log sẵn trong `results/logs/`."

Nếu muốn tái hiện đúng slide Exploding (Experiment 3), có thể chạy (mất khoảng 5–10 giây):
```bash
python experiments/run_deep_demo.py
```
**Nói:** "Script này train cả 5 cấu hình trên kiến trúc 10 lớp — nếu để ý terminal, dòng Random large sẽ hiện `train_loss=nan` ngay từ epoch đầu tiên, đúng như slide vừa trình bày."

### 5.4. Mở kết quả thật
```bash
cat results/tables/deep_demo_summary.csv
cat results/tables/multiseed_xavier_he_summary.csv
```
**Nói:** "Đây chính là 2 bảng CSV nguồn cho slide Bảng tổng hợp và slide 5-seed Xavier vs He — số liệu trên slide lấy trực tiếp, không chỉnh sửa."

Mở file hình bằng ứng dụng xem ảnh mặc định (hoặc đã mở sẵn tab trình duyệt):
```
results/figures/gradient_heatmap_slide.png
results/figures/depth_comparison_v2_slide.png
```

### 5.5. Nếu bị hỏi "làm sao build lại slide từ số liệu mới?"
```bash
node report/build_deck.js
```
**Nói:** "Toàn bộ số liệu trên slide được đọc TRỰC TIẾP từ file JSON/CSV trong `results/` tại thời điểm build — không hardcode. Nếu chạy lại thí nghiệm với số liệu mới, chỉ cần chạy lại lệnh này, PPTX tự cập nhật theo đúng số liệu mới."

### Kế hoạch B — nếu không demo sống được
Chỉ cần nói:
> "Toàn bộ pipeline này đã chạy thật trên máy em trước buổi hôm nay — mọi số liệu trên slide đều đọc trực tiếp từ file kết quả này, em có thể mở file JSON/CSV gốc ngay bây giờ nếu thầy/cô muốn kiểm tra." — rồi mở 1-2 file JSON trong `results/logs/` để chỉ tay.

---

## 6. Câu hỏi phản biện thường gặp — chuẩn bị sẵn câu trả lời

| Câu hỏi | Trả lời ngắn |
|---|---|
| Vì sao chỉ 1 seed cho phần lý thuyết Xavier/He mà không phải multi-seed hết? | Slide lý thuyết dùng 1 seed từ lưới chính (6-layer, tiết kiệm thời gian trình bày); phần Experiment 4&5 mới là nơi em chủ động chạy 5-seed để kiểm chứng nghiêm túc trước khi kết luận. |
| Sao không test Orthogonal initialization thật? | Ngoài phạm vi thời gian của đồ án này — em liệt kê trong bảng so sánh cho đầy đủ lý thuyết nhưng nói rõ không có thực nghiệm đi kèm, tránh nhận vơ. |
| Gradient RMS khác Gradient Norm thế nào? | Norm là L2-norm (Frobenius) của toàn ma trận; RMS = norm/√(số phần tử) — chuẩn hoá để so sánh công bằng giữa các layer có kích thước khác nhau (layer 1: 784×128 ≈ 100k phần tử, các layer sau chỉ 128×128 ≈ 16k). |
| Tại sao He@L=12 accuracy sụt xuống 32.6% nếu gradient vẫn ổn định? | Đã đo train loss vẫn thấp (~0.46) trong khi test loss vọt lên (~5.4) — dấu hiệu overfitting trên tập train nhỏ (5.000 mẫu) không regularization, không phải vanishing gradient. |
| Kết quả có tái lập được không? | Có — cùng seed, cùng code sẽ ra đúng số liệu này (đã set `torch.manual_seed` + `deterministic_algorithms`). Toàn bộ code, log, và hướng dẫn chạy nằm trong project đính kèm. |
| Vì sao dùng Fashion-MNIST thay vì MNIST? | Bài toán khó hơn MNIST một chút (dễ thấy khác biệt giữa các scheme hơn) nhưng vẫn train rất nhanh trên CPU, không cần GPU. |

---

*Kịch bản này khớp 100% với nội dung và số liệu trong `Slide_Backprop_Initialization.pptx` (29 slide) tại thời điểm soạn. Nếu slide được build lại với số liệu mới (`node build_deck.js`), hãy đối chiếu lại các con số cụ thể trong file này trước khi thuyết trình.*
