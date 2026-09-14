# PHASE 2 — Mathematical Content (nguồn sự thật cho report §2–§6 và code)

Mọi số liệu ví dụ trong tài liệu này đã được tính lại bằng
[`experiments/toy_example_verify.py`](../experiments/toy_example_verify.py)
và đối chiếu với PyTorch autograd + finite-difference (sai số `0.00e+00`
đến `1e-5`) — không có số nào được tính tay rồi chép thủ công.

---

## 2.1–2.3 Derivative, Partial Derivative, Gradient

**Derivative** trả lời câu hỏi: *nếu ta nhích $x$ một chút, $y=f(x)$ đổi bao
nhiêu?* — độ nhạy (sensitivity) tại một điểm.
$$\frac{dy}{dx} = \lim_{h\to 0}\frac{f(x+h)-f(x)}{h}.$$
Ví dụ $y=x^2 \Rightarrow dy/dx = 2x$: tại $x=3$, đạo hàm $=6$ nghĩa là quanh
$x=3$, nhích $x$ thêm $h$ nhỏ thì $y$ đổi khoảng $6h$.

**Trong Deep Learning**, "$x$" là một tham số ($w$ hay $b$) và "$y$" là hàm
mất mát $L$. Đạo hàm $\partial L/\partial w$ cho biết: *nếu tăng $w$ một
chút, loss tăng hay giảm, tăng/giảm nhanh cỡ nào?* — đây chính là "tín hiệu
học" mà mọi thuật toán tối ưu dùng để cập nhật tham số.

**Partial derivative**: khi $L$ phụ thuộc nhiều biến ($L(w_1,w_2,\ldots)$,
một mạng có hàng nghìn tham số), $\partial L/\partial w_i$ giữ mọi biến khác
cố định, chỉ đo độ nhạy theo riêng $w_i$.

**Gradient** $\nabla_\theta L = \big(\partial L/\partial \theta_1, \ldots,
\partial L/\partial \theta_n\big)$: gộp toàn bộ đạo hàm riêng thành một
vector — hướng làm $L$ tăng nhanh nhất tại điểm hiện tại; đi ngược hướng đó
($-\nabla_\theta L$) là hướng giảm loss nhanh nhất cục bộ, đó là nền tảng
của Gradient Descent (nhưng bản thân gradient chỉ là một *phép đo*, chưa
phải thuật toán cập nhật — xem 4.5).

---

## 2.4 Chain Rule

$$y = f(g(x)) \quad\Longrightarrow\quad \frac{dy}{dx} = \frac{dy}{dg}\cdot\frac{dg}{dx}.$$

Trực giác: $g$ biến đổi $x$ thành một đại lượng trung gian; $f$ biến đổi đại
lượng đó thành $y$. Độ nhạy tổng của $y$ theo $x$ = độ nhạy của $y$ theo đại
lượng trung gian × độ nhạy của đại lượng trung gian theo $x$ — "truyền độ
nhạy" qua từng bước trung gian.

Mạng nơ-ron là một chuỗi các phép biến đổi lồng nhau:
$$x \;\xrightarrow{\;z=wx+b\;}\; z \;\xrightarrow{\;a=\sigma(z)\;}\; a \;\xrightarrow{\;L=\mathrm{loss}(a,y)\;}\; L.$$
Áp dụng chain rule liên tiếp:
$$\frac{\partial L}{\partial w} = \frac{\partial L}{\partial a}\cdot\frac{\partial a}{\partial z}\cdot\frac{\partial z}{\partial w}, \qquad
\frac{\partial L}{\partial b} = \frac{\partial L}{\partial a}\cdot\frac{\partial a}{\partial z}\cdot\frac{\partial z}{\partial b}, \qquad
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial a}\cdot\frac{\partial a}{\partial z}\cdot\frac{\partial z}{\partial x}.$$

Với $L=\tfrac12(a-y)^2$: $\partial L/\partial a = a-y$; với $z=wx+b$:
$\partial z/\partial w = x,\ \partial z/\partial b = 1,\ \partial z/\partial
x = w$. $\partial a/\partial z = \sigma'(z)$ tuỳ activation.

**Vì sao cần cụ thể ba đạo hàm này?** $\partial L/\partial w,\partial
L/\partial b$ dùng để *cập nhật tham số của chính lớp này*; $\partial
L/\partial x$ dùng để *tiếp tục lan truyền ngược sang lớp phía trước* (vì
$x$ chính là output của lớp trước đó) — đây là hạt giống của thuật toán
Backpropagation ở Mục 4.

---

## 2.5 Computational Graph + Ví dụ số (khớp report §4.2–4.3)

Đồ thị: $z=wx+b \to a=\mathrm{ReLU}(z) \to L=\tfrac12(a-y)^2$.

Forward xây đồ thị từ trái sang phải, backward đi ngược lại, tại mỗi nút chỉ
cần biết **đạo hàm cục bộ** (local derivative) của chính nút đó, rồi nhân
dồn theo chain rule — đây là lý do Backpropagation không cần suy ra công
thức đóng (closed-form) toàn cục, chỉ cần mỗi phép toán "biết" đạo hàm của
chính nó.

Đạo hàm cục bộ dùng trong ví dụ:
$$\frac{\partial L}{\partial a}=a-y,\qquad
\frac{\partial a}{\partial z}=\mathrm{ReLU}'(z)=\begin{cases}1,& z>0\\0,& z\le 0\end{cases},\qquad
\frac{\partial z}{\partial w}=x,\ \frac{\partial z}{\partial b}=1,\ \frac{\partial z}{\partial x}=w.$$

**Ví dụ số đã verify** ($x=2,\ w=0.5,\ b=-0.3,\ y=1$):

| Forward | Giá trị | | Backward | Giá trị |
|---|---|---|---|---|
| $z=wx+b$ | $0.7000$ | | $\partial L/\partial a = a-y$ | $-0.3000$ |
| $a=\mathrm{ReLU}(z)$ | $0.7000$ | | $\partial a/\partial z$ ($z>0$) | $1.0000$ |
| $L=\tfrac12(a-y)^2$ | $0.0450$ | | $\partial L/\partial z$ | $-0.3000$ |
| | | | $\partial L/\partial w = (\partial L/\partial z)\,x$ | $-0.6000$ |
| | | | $\partial L/\partial b$ | $-0.3000$ |
| | | | $\partial L/\partial x = (\partial L/\partial z)\,w$ | $-0.1500$ |

Đối chiếu PyTorch `autograd` và finite-difference: khớp tuyệt đối
($-0.6000$ cả ba cách).

---

## 4.4 Neural Network Backpropagation (2 lớp, $W_1,b_1,W_2,b_2$)

Kiến trúc: $x \to \text{Linear}(W_1,b_1) \to \text{ReLU} \to
\text{Linear}(W_2,b_2) \to \hat y \to L$.

Quy ước **vector cột cho một mẫu đơn** (khớp cách viết sách giáo trình,
dùng riêng ở mục này để công thức gọn — Mục 4.6 sẽ đổi sang quy ước
hàng-là-mẫu để khớp code):
$$z_1 = W_1^{\mathsf T}x + b_1,\quad a_1=\mathrm{ReLU}(z_1),\quad
z_2 = W_2^{\mathsf T}a_1+b_2,\quad \hat y = z_2,\quad L=\tfrac12\lVert \hat y-y\rVert^2.$$

**Backward — gradient đi ngược Loss → Output → Hidden → Input:**
$$\delta_2=\frac{\partial L}{\partial z_2}=\hat y-y \quad\text{(vì output activation = identity)}$$
$$\frac{\partial L}{\partial W_2}=a_1\,\delta_2^{\mathsf T},\qquad
\frac{\partial L}{\partial b_2}=\delta_2,\qquad
\frac{\partial L}{\partial a_1}=W_2\,\delta_2$$
$$\delta_1=\frac{\partial L}{\partial z_1}=\frac{\partial L}{\partial a_1}\odot \mathrm{ReLU}'(z_1)$$
$$\frac{\partial L}{\partial W_1}=x\,\delta_1^{\mathsf T},\qquad
\frac{\partial L}{\partial b_1}=\delta_1,\qquad
\frac{\partial L}{\partial x}=W_1\,\delta_1$$

($\odot$ = nhân từng phần tử — vì $a=f(z)$ tác động độc lập lên từng toạ
độ, Jacobian của nó là ma trận đường chéo nên nhân Jacobian-vector rút gọn
thành nhân từng phần tử với $f'(z)$.)

**Vì sao có $\delta_1,\delta_2$ (không nhân trực tiếp mọi thứ cùng lúc)?**
$\delta_l$ đóng vai trò "gộp sẵn" toàn bộ ảnh hưởng của các lớp phía sau —
nhờ vậy khi tính gradient cho $W_1,b_1$ ta chỉ cần nhân $\delta_1$ với input
cục bộ ($x$), không phải viết lại chain rule xuyên suốt từ $L$ mỗi lần. Đây
chính là điểm làm Backprop **hiệu quả** (Mục 4.6): mỗi $\delta_l$ tính một
lần, dùng lại cho mọi tham số của lớp $l$.

**Ví dụ số đã verify** ($x=(1,1)$, xem bảng tham số trong
`toy_example_verify.py`):

| Đại lượng | Giá trị |
|---|---|
| $z_1$ | $(0.60,\,-0.40,\,0.30)$ |
| $a_1=\mathrm{ReLU}(z_1)$ | $(0.60,\,0.00,\,0.30)$ — **neuron 2 "chết"** ($z_1[2]<0$) |
| $\hat y = z_2$ | $0.29$ |
| $L$ | $0.25205$ |
| $\delta_2$ | $-0.71$ |
| $\partial L/\partial W_2$ | $(-0.426,\ 0.000,\ -0.213)^{\mathsf T}$ |
| $\delta_1$ | $(-0.142,\ 0.000,\ -0.284)$ |
| $\partial L/\partial W_1$ | hàng 1 $=$ hàng 2 $=(-0.142,\ 0.000,\ -0.284)$ |
| $\partial L/\partial x$ | $(-0.071,\ -0.071)$ |

**Điểm sư phạm quan trọng:** cột thứ 2 của $\partial L/\partial W_1$ và
$\partial L/\partial W_2$ đều bằng $0$ — vì neuron 2 bị ReLU "khoá" ở
forward ($z_1[2]=-0.4<0$) nên $\mathrm{ReLU}'(z_1[2])=0$ chặn đứng toàn bộ
gradient chảy qua neuron đó, bất kể $\delta$ phía sau là bao nhiêu. Đây là
minh hoạ trực tiếp cho hiện tượng **"dead ReLU"** sẽ nhắc lại ở Mục 5.5/6.

Khớp `autograd` (sai số $0$) và finite-difference tại $W_1[0,0]$: manual
$=-0.142000$, finite-diff $=-0.142000$.

---

## 4.6 Matrix Form (batch, khớp code NumPy/PyTorch)

Đổi quy ước: **hàng của $X$ là một mẫu** — $X\in\mathbb R^{N\times n_0}$.
$$Z^{(l)} = A^{(l-1)}W^{(l)} + b^{(l)} \in \mathbb R^{N\times n_l},\qquad
A^{(l)} = f(Z^{(l)}),\qquad A^{(0)}=X.$$
($b^{(l)}\in\mathbb R^{1\times n_l}$ được **broadcast** — cộng vào mỗi
trong $N$ hàng như nhau; về mặt toán, tương đương nhân với vector cột toàn
số 1 $\mathbf 1_N b^{(l)}$.)

Backward (cho $L=\frac1N\sum_i \mathrm{loss}_i$ — trung bình theo batch,
khớp reduction mặc định của PyTorch):
$$\frac{\partial L}{\partial Z^{(l)}} = \frac{\partial L}{\partial A^{(l)}}\odot f'(Z^{(l)}) \in \mathbb R^{N\times n_l}$$
$$\frac{\partial L}{\partial W^{(l)}} = \big(A^{(l-1)}\big)^{\mathsf T}\frac{\partial L}{\partial Z^{(l)}} \in \mathbb R^{n_{l-1}\times n_l}$$
$$\frac{\partial L}{\partial b^{(l)}} = \mathbf 1_N^{\mathsf T}\frac{\partial L}{\partial Z^{(l)}} \in \mathbb R^{1\times n_l}\quad\text{(tổng theo trục batch — hệ quả của broadcasting)}$$
$$\frac{\partial L}{\partial A^{(l-1)}} = \frac{\partial L}{\partial Z^{(l)}}\big(W^{(l)}\big)^{\mathsf T} \in \mathbb R^{N\times n_{l-1}}$$

Kiểm tra kích thước (bắt buộc nêu trong report vì đây là lỗi hay gặp khi
code): $(n_{l-1}\times N)(N\times n_l)=n_{l-1}\times n_l$ ✓ khớp $W^{(l)}$;
$(N\times n_l)(n_l\times n_{l-1})=N\times n_{l-1}$ ✓ khớp $A^{(l-1)}$.

**Quan hệ với Mục 4.4**: cùng một phép tính, chỉ khác cách viết. Với 1 mẫu
($N=1$, bỏ batch), $Z_{\text{hàng}} = x^{\mathsf T}W+b \Leftrightarrow
z_{\text{cột}} = W^{\mathsf T}x+b^{\mathsf T}$ — chuyển vị của nhau.

---

## 4.7 Computational Complexity (ngắn gọn)

Một lượt forward qua $L$ lớp tốn $O\!\big(\sum_l n_{l-1}n_l\big)$ phép nhân
(chi phí các phép nhân ma trận $A^{(l-1)}W^{(l)}$). Backward tái dùng đúng
các số hạng đó (nhân với $(W^{(l)})^{\mathsf T}$ và $(A^{(l-1)})^{\mathsf
T}$) nên có **cùng bậc chi phí** với forward — tổng backprop $\approx$ 2–3
lần forward, KHÔNG phải $O(n^2)$ so với số tham số như tính gradient bằng
finite-difference từng tham số một (mà chi phí sẽ là $O(P)$ lượt forward
với $P$=tổng số tham số — với mạng vài triệu tham số thì không khả thi).
Đây là lý do Backprop là "phát minh" quan trọng: không phải vì nó đúng
(chain rule luôn đúng) mà vì nó **hiệu quả**.

---

## 4.8 Backpropagation vs. Gradient Descent — phân biệt bắt buộc

| | **Backpropagation** | **Gradient Descent (và các biến thể: SGD, Momentum, Adam...)** |
|---|---|---|
| Là gì | Thuật toán **tính** $\nabla_\theta L$ hiệu quả bằng chain rule + computational graph | Quy tắc **cập nhật** tham số dùng gradient đã có: $\theta \leftarrow \theta - \eta\nabla_\theta L$ |
| Đầu vào | Đồ thị tính toán + giá trị forward đã lưu | Gradient (từ bất kỳ nguồn nào — backprop, finite-difference, ...) |
| Đầu ra | Vector gradient $\nabla_\theta L$ | Tham số mới $\theta_{t+1}$ |
| Có thể thay bằng gì | Về nguyên tắc: finite-difference (chậm, $O(P)$ forward) — cùng kết quả, khác chi phí | Về nguyên tắc: Newton's method, RMSProp, Adam — cùng "nguyên liệu" gradient, khác cách dùng |

**Chốt lại (nhắc lại nguyên văn yêu cầu đề bài):** Backpropagation không
"huấn luyện" mạng — nó chỉ trả lời *"loss đang thay đổi thế nào theo từng
tham số?"*. Gradient Descent/optimizer mới là bước quyết định *"vậy nên
sửa tham số ra sao?"*. Nhầm hai khái niệm này là lỗi khái niệm phổ biến
nhất khi sinh viên mới học Deep Learning.

---

## 5. Parameter Initialization

### 5.1 Vì sao không thể $W=0$

Nếu **mọi** trọng số của một lớp giống hệt nhau (kể cả $=0$), thì với cùng
input $x$: mọi neuron trong lớp có cùng $z_j=w_j\cdot x+b_j$ (nếu bias cũng
khởi tạo giống nhau) $\Rightarrow$ cùng $a_j$. Ở backward, mọi neuron nhận
cùng $\delta_j$ và cùng input $\Rightarrow$ cùng gradient
$\Rightarrow$ sau khi cập nhật, trọng số của chúng **vẫn giống hệt nhau**.
Quy nạp theo từng bước huấn luyện: các neuron trong lớp mãi mãi tính cùng
một hàm — lớp có $n_l$ neuron chỉ có "sức biểu diễn" như 1 neuron. Đây gọi
là **mất khả năng phá vỡ đối xứng** (symmetry breaking) — lý do cốt lõi
(Goodfellow, Bengio, Courville, 2016, Ch. 8).

**Random initialization** phá đối xứng bằng cách cho mỗi $w_{ij}$ một giá
trị ngẫu nhiên độc lập (thường $\sim\mathcal N(0,\sigma^2)$ nhỏ) — nhưng nếu
$\sigma$ chọn tuỳ tiện (không theo $n_{\text{in}}$), mạng sâu vẫn có thể
vanish/explode (Mục 5.4–5.6, Mục 6 lý giải bằng công thức).

### 5.2 Trực giác $\mathrm{fan\_in}$, $\mathrm{fan\_out}$, $\mathrm{Var}(W)$

$\mathrm{fan\_in}=n_{l-1}$ (số input của 1 neuron), $\mathrm{fan\_out}=n_l$
(số neuron nhận input từ 1 neuron ở lớp trước, tức số cột $W$ ứng với 1
hàng). Với $z_j=\sum_{i=1}^{n_{\text{in}}} w_{ij}x_i$, nếu $w_{ij},x_i$ độc
lập, kỳ vọng $0$:
$$\mathrm{Var}(z_j) = \sum_{i=1}^{n_{\text{in}}}\mathrm{Var}(w_{ij})\,\mathrm{Var}(x_i) = n_{\text{in}}\cdot\mathrm{Var}(W)\cdot\mathrm{Var}(x).$$
**Đây là công thức trung tâm của mọi công thức initialization phía dưới**:
muốn giữ $\mathrm{Var}(z)\approx\mathrm{Var}(x)$ (không phóng đại/co hẹp
tín hiệu forward qua mỗi lớp) thì cần $\mathrm{Var}(W)=1/n_{\text{in}}$.
Phân tích tương tự cho backward (thay $n_{\text{in}}$ bằng
$n_{\text{out}}$) để giữ variance của gradient ổn định.

### 5.3–5.6 Bảng công thức (điền chi tiết prose ở Phase 7, số liệu đã chốt)

| Scheme | Công thức | Giả định / activation phù hợp | Nguồn |
|---|---|---|---|
| **Zero** | $W=0$ | Không dùng được (mất symmetry breaking) | — |
| **Random (naive)** | $W\sim\mathcal N(0,\sigma^2)$, $\sigma$ cố định nhỏ (vd. $0.01$) | Phá đối xứng nhưng không tính theo $n_{\text{in}}$ $\Rightarrow$ vẫn vanish/explode khi sâu | thực hành phổ biến trước 2010 |
| **LeCun** | $\mathrm{Var}(W)=1/n_{\text{in}}$ | Sigmoid/Tanh, input đã chuẩn hoá | LeCun et al. 1998/2012 |
| **Xavier/Glorot** | $\mathrm{Var}(W)=\dfrac{2}{n_{\text{in}}+n_{\text{out}}}$ (uniform: $U(\pm\sqrt{6/(n_{\text{in}}+n_{\text{out}})})$) | Tanh/Sigmoid (activation đối xứng quanh 0) | Glorot & Bengio 2010 |
| **He/Kaiming** | $\mathrm{Var}(W)=2/n_{\text{in}}$ | ReLU/Leaky ReLU (bù việc ReLU triệt tiêu ~một nửa variance) | He et al. 2015 |

**Vì sao He nhân đôi so với LeCun?** ReLU đặt khoảng một nửa output về $0$
(phần $z<0$), nên với $z$ đối xứng quanh $0$: $\mathrm{Var}(\mathrm{ReLU}(z))
\approx \tfrac12\mathrm{Var}(z)$ — để bù phần "mất" này, He et al. (2015)
nhân đôi variance của $W$ so với công thức forward-preserving thuần
($1/n_{\text{in}}$) để giữ $\mathrm{Var}(a)\approx\mathrm{Var}(x)$ qua mỗi
lớp ReLU.

**Bias**: cả 3 scheme trên đều khởi tạo $b=0$ — vì bias không gây ra vấn đề
đối xứng giữa các neuron THEO CÙNG MỘT CÁCH như $W$ (mỗi $b_j$ có thể khác
nhau về giá trị tuyệt đối miễn $W$ đã phá đối xứng; giữ $b=0$ đơn giản và
là điểm khởi đầu trung tính hợp lý), trừ trường hợp đặc biệt (vd. bias lớp
output cho bài toán mất cân bằng lớp — không nằm trong phạm vi báo cáo này.

### 5.7 Chuỗi ảnh hưởng (cầu nối sang Mục 6)

$$\text{Initialization (}\mathrm{Var}(W)\text{)} \;\Rightarrow\; \text{Activation variance qua mỗi lớp} \;\Rightarrow\; \text{Gradient variance khi lan truyền ngược} \;\Rightarrow\; \text{Ổn định huấn luyện (training stability)}.$$
Nếu mỗi lớp nhân variance tín hiệu với hệ số $r=n_{\text{in}}\mathrm{Var}(W)$
(bỏ qua hiệu chỉnh activation), sau $L$ lớp: $\mathrm{Var}(a^{(L)}) \approx
r^L\cdot\mathrm{Var}(x)$ — **tăng/giảm theo hàm mũ của độ sâu** nếu $r\ne1$.
Đây chính là cơ chế toán học của vanishing/exploding gradient (Mục 6).

---

## 6. Vanishing / Exploding Gradient

Theo chain rule, gradient tại lớp đầu là **tích** của nhiều đạo hàm cục bộ
dọc theo $L$ lớp:
$$\frac{\partial L}{\partial a^{(0)}} = \frac{\partial L}{\partial a^{(L)}}\prod_{l=1}^{L} \frac{\partial a^{(l)}}{\partial a^{(l-1)}}.$$
Nếu độ lớn trung bình mỗi nhân tử cục bộ $\approx g$:
- $g<1$: tích $\approx g^L \to 0$ theo hàm mũ khi $L$ tăng — **vanishing
  gradient**: lớp đầu gần như không nhận được tín hiệu học.
- $g>1$: tích $\approx g^L \to \infty$ — **exploding gradient**: bước cập
  nhật quá lớn, loss dao động hoặc `NaN`.
- $g=1$: tích ổn định ở mọi độ sâu — mục tiêu mà Xavier/He hướng tới.

**Ví dụ số đã verify** (script Mục "VÍ DỤ 3"): với $g=0.5$, sau $L=10$ lớp
hệ số còn $9.77\times10^{-4}$ ($\approx1/1024$); sau $L=50$ lớp còn
$8.88\times10^{-16}$ (thực chất bằng 0 dưới độ chính xác số thực). Với
$g=2$, sau $L=10$ lớp hệ số đã là $1024$; sau $L=50$ là $1.13\times10^{15}$.
Với $g=1$, hệ số giữ nguyên $=1$ ở mọi độ sâu — minh hoạ trực quan tại sao
"giữ $g\approx1$" (chính là mục tiêu của Xavier/He) quan trọng với mạng sâu.

Liên hệ trực tiếp: $g$ phụ thuộc **cả** activation (hệ số co từ đạo hàm
$f'$ — vd. $\sigma'(z)\le0.25$ luôn co lại) **và** weight scale (qua
$\mathrm{Var}(W)$, Mục 5.2) **và** độ sâu $L$ (số lần nhân) — ba yếu tố này
xuất hiện đúng như liệt kê trong đề bài.

Thực nghiệm minh chứng bằng số liệu thật: Experiment 7 (report §9) đo
gradient-norm theo từng lớp trên mạng 6 hidden layer thật, so sánh
Zero/Random/Xavier/He.
