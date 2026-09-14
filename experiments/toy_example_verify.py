"""Sinh số liệu chính xác cho các ví dụ minh hoạ trong report/slide (Muc 2-6).

Mục đích: MỌI con số xuất hiện trong report/slide cho ví dụ đồ chơi (toy
example) phải được tính bằng script này (NumPy, sau đó đối chiếu PyTorch
autograd + finite-difference), không được tính tay và chép vào LaTeX — tránh
sai số học khi soạn thảo thủ công.

Chạy: python experiments/toy_example_verify.py
"""
from __future__ import annotations

import numpy as np
import torch

SEED = 42


def relu(z: np.ndarray) -> np.ndarray:
    return np.maximum(0.0, z)


def relu_grad(z: np.ndarray) -> np.ndarray:
    return (z > 0).astype(z.dtype)


def example_scalar() -> None:
    """Đồ thị vô hướng: x -> z = wx+b -> a = ReLU(z) -> L = 1/2 (a-y)^2.

    Dùng cho report Muc 4.2 (Scalar Derivation) va Muc 4.3 (Computational
    Graph) va lam vi du dau tien trong Part A (manual backprop).
    """
    print("=" * 70)
    print("VI DU 1 (scalar):  x -> z=wx+b -> a=ReLU(z) -> L=1/2(a-y)^2")
    print("=" * 70)
    x, w, b, y = 2.0, 0.5, -0.3, 1.0

    # ---- forward ----
    z = w * x + b
    a = relu(z)
    L = 0.5 * (a - y) ** 2
    print(f"forward:  z = {z:.4f}, a = {a:.4f}, L = {L:.6f}")

    # ---- backward (thu cong, dung chain rule tung buoc) ----
    dL_da = a - y
    da_dz = relu_grad(np.array(z)).item()
    dL_dz = dL_da * da_dz
    dL_dw = dL_dz * x
    dL_db = dL_dz * 1.0
    dL_dx = dL_dz * w
    print(f"backward: dL/da={dL_da:.4f}  da/dz={da_dz:.4f}  dL/dz={dL_dz:.4f}")
    print(f"          dL/dw={dL_dw:.4f}  dL/db={dL_db:.4f}  dL/dx={dL_dx:.4f}")

    # ---- doi chieu PyTorch autograd ----
    xt = torch.tensor(x, requires_grad=True)
    wt = torch.tensor(w, requires_grad=True)
    bt = torch.tensor(b, requires_grad=True)
    zt = wt * xt + bt
    at = torch.relu(zt)
    Lt = 0.5 * (at - y) ** 2
    Lt.backward()
    print(f"autograd: dL/dw={wt.grad.item():.4f}  dL/db={bt.grad.item():.4f}  "
          f"dL/dx={xt.grad.item():.4f}")

    # ---- doi chieu finite difference (gradient checking) ----
    h = 1e-5

    def loss_of_w(w_):
        return 0.5 * (relu(w_ * x + b) - y) ** 2

    num_dw = (loss_of_w(w + h) - loss_of_w(w - h)) / (2 * h)
    print(f"finite-diff dL/dw = {num_dw:.4f}  (h={h})")
    print()


def example_two_layer() -> dict:
    """Mang 2 lop: x(2,) -> Linear(W1,b1) -> ReLU -> Linear(W2,b2) -> L=MSE.

    Dung cho report Muc 4.4 (Neural Network Backpropagation) - the hien
    gradient di nguoc Loss -> Output -> Hidden -> Input; W1,b1,W2,b2.
    """
    print("=" * 70)
    print("VI DU 2 (2-layer MLP):  x(2) -> W1,b1 -> ReLU -> W2,b2 -> L=MSE")
    print("=" * 70)
    # Chon gia tri sao cho dung 1 trong 3 neuron ReLU "chet" (z1_2 < 0),
    # de minh hoa ro rang: (a) gradient chay binh thuong qua neuron song,
    # (b) gradient = 0 qua neuron chet -- vi day la diem hay bi hieu sai.
    x = np.array([1.0, 1.0])
    W1 = np.array([[0.30, -0.30, 0.10], [0.20, 0.10, 0.15]])  # (2,3)
    b1 = np.array([0.10, -0.20, 0.05])                         # (3,)
    W2 = np.array([[0.20], [-0.30], [0.40]])                   # (3,1)
    b2 = np.array([0.05])                                      # (1,)
    y = np.array([1.0])

    # forward (vector cot cho 1 mau, dung ky hieu report Muc 4.4)
    z1 = W1.T @ x + b1          # (3,)
    a1 = relu(z1)                # (3,)
    z2 = W2.T @ a1 + b2          # (1,)
    yhat = z2                    # output activation = identity (hoi quy)
    L = 0.5 * np.sum((yhat - y) ** 2)
    print(f"z1={np.round(z1,4)}  a1={np.round(a1,4)}")
    print(f"z2={np.round(z2,4)}  yhat={np.round(yhat,4)}  L={L:.6f}")

    # backward thu cong
    dL_dyhat = (yhat - y)                       # (1,)
    dL_dz2 = dL_dyhat * 1.0                      # output activation = identity
    dL_dW2 = np.outer(a1, dL_dz2)                # (3,1)
    dL_db2 = dL_dz2                              # (1,)
    dL_da1 = W2 @ dL_dz2                         # (3,)
    dL_dz1 = dL_da1 * relu_grad(z1)              # (3,)
    dL_dW1 = np.outer(x, dL_dz1)                 # (2,3)
    dL_db1 = dL_dz1                              # (3,)
    dL_dx = W1 @ dL_dz1                          # (2,)

    print("gradients (manual):")
    print(f"  dL/dW2=\n{np.round(dL_dW2,4)}")
    print(f"  dL/db2={np.round(dL_db2,4)}")
    print(f"  dL/dW1=\n{np.round(dL_dW1,4)}")
    print(f"  dL/db1={np.round(dL_db1,4)}")
    print(f"  dL/dx ={np.round(dL_dx,4)}")

    # doi chieu PyTorch autograd
    xt = torch.tensor(x, requires_grad=True)
    W1t = torch.tensor(W1, requires_grad=True)
    b1t = torch.tensor(b1, requires_grad=True)
    W2t = torch.tensor(W2, requires_grad=True)
    b2t = torch.tensor(b2, requires_grad=True)
    z1t = W1t.T @ xt + b1t
    a1t = torch.relu(z1t)
    z2t = W2t.T @ a1t + b2t
    Lt = 0.5 * torch.sum((z2t - torch.tensor(y)) ** 2)
    Lt.backward()

    def maxabs(a, b):
        return float(np.max(np.abs(np.asarray(a) - b.detach().numpy())))

    print("max|manual - autograd| :",
          f"W2={maxabs(dL_dW2, W2t.grad):.2e}",
          f"b2={maxabs(dL_db2, b2t.grad):.2e}",
          f"W1={maxabs(dL_dW1, W1t.grad):.2e}",
          f"b1={maxabs(dL_db1, b1t.grad):.2e}",
          f"x={maxabs(dL_dx, xt.grad):.2e}")

    # doi chieu finite-difference cho mot phan tu dai dien: W1[0,0]
    h = 1e-6

    def loss_of_W1_00(delta: float) -> float:
        W1p = W1.copy()
        W1p[0, 0] += delta
        z1p = W1p.T @ x + b1
        a1p = relu(z1p)
        z2p = W2.T @ a1p + b2
        return float(0.5 * np.sum((z2p - y) ** 2))

    num_dW1_00 = (loss_of_W1_00(h) - loss_of_W1_00(-h)) / (2 * h)
    print(f"finite-diff dL/dW1[0,0] = {num_dW1_00:.6f}  "
          f"(manual = {dL_dW1[0,0]:.6f})")
    print()

    return dict(x=x, W1=W1, b1=b1, W2=W2, b2=b2, y=y, L=L,
                dL_dW1=dL_dW1, dL_db1=dL_db1, dL_dW2=dL_dW2, dL_db2=dL_db2,
                dL_dx=dL_dx)


def example_shared_weight() -> None:
    """Vi du so cho Muc 2.6 (bao cao): mot trong so w dung chung cho hai
    input (weight sharing) -- gradient phai CONG DON tu ca hai nhanh
    (multivariable chain rule), khong duoc chi lay 1 nhanh.

    z = w*x1 + w*x2,  a = z,  L = 0.5*(a-y)^2
    Doi chieu 2 cach: (1) dao ham thuong tren L(w) da rut gon, va
    (2) PyTorch autograd tren do thi co nhanh that su.
    """
    print("=" * 70)
    print("VI DU (Muc 2.6): trong so dung chung cho hai nhanh (fan-out)")
    print("=" * 70)
    x1, x2, w, y = 2.0, 3.0, 0.4, 1.0

    z = w * x1 + w * x2
    a = z
    L = 0.5 * (a - y) ** 2
    dL_dw_manual = (a - y) * (x1 + x2)  # cong don tu 2 nhanh p=w*x1, q=w*x2

    wt = torch.tensor(w, requires_grad=True, dtype=torch.float64)
    x1t, x2t, yt = (torch.tensor(v, dtype=torch.float64) for v in (x1, x2, y))
    p = wt * x1t
    q = wt * x2t
    at = p + q
    Lt = 0.5 * (at - yt) ** 2
    Lt.backward()
    dL_dw_autograd = wt.grad.item()

    print(f"z={z:.4f}  a={a:.4f}  L={L:.4f}")
    print(f"dL/dw (cong don 2 nhanh, tay)  = {dL_dw_manual:.6f}")
    print(f"dL/dw (PyTorch autograd)       = {dL_dw_autograd:.6f}")
    print(f"sai lech tuyet doi              = {abs(dL_dw_manual - dL_dw_autograd):.2e}")
    print()


def example_matrix_batch() -> None:
    """Vi du day du dang MA TRAN (batch N=2 mau) cho Muc 4.3 bao cao --
    dung DUNG quy uoc hang-la-mau. Doi chieu PyTorch autograd."""
    print("=" * 70)
    print("VI DU MA TRAN (Muc 4.3): batch N=2, kien truc 3->2->1, ReLU")
    print("=" * 70)
    X = np.array([[1.0, 0.5, -1.0], [0.0, 1.0, 2.0]])
    W1 = np.array([[0.2, -0.1], [0.4, 0.3], [-0.5, 0.2]])
    b1 = np.array([0.1, -0.2])
    W2 = np.array([[0.6], [-0.3]])
    b2 = np.array([0.05])
    Y = np.array([[1.0], [0.0]])
    N = X.shape[0]

    Z1 = X @ W1 + b1
    A1 = relu(Z1)
    Yhat = A1 @ W2 + b2
    L = 0.5 * np.sum((Yhat - Y) ** 2) / N

    dZ2 = (Yhat - Y) / N
    dW2 = A1.T @ dZ2
    db2 = dZ2.sum(axis=0)
    dA1 = dZ2 @ W2.T
    dZ1 = dA1 * relu_grad(Z1)
    dW1 = X.T @ dZ1
    db1 = dZ1.sum(axis=0)

    for name, val in [("Z1", Z1), ("A1", A1), ("Yhat", Yhat)]:
        print(f"{name} =\n{val}")
    print(f"L = {L:.6f}")
    for name, val in [("dW1", dW1), ("db1", db1), ("dW2", dW2), ("db2", db2)]:
        print(f"{name} =\n{val}")

    Xt = torch.tensor(X)
    W1t, b1t = (torch.tensor(v, requires_grad=True) for v in (W1, b1))
    W2t, b2t = (torch.tensor(v, requires_grad=True) for v in (W2, b2))
    Yt = torch.tensor(Y)
    Z1t = Xt @ W1t + b1t
    A1t = torch.relu(Z1t)
    Z2t = A1t @ W2t + b2t
    Lt = 0.5 * ((Z2t - Yt) ** 2).sum() / N
    Lt.backward()
    ok = all(np.allclose(a, b.detach().numpy()) for a, b in
             [(dW1, W1t.grad), (db1, b1t.grad), (dW2, W2t.grad), (db2, b2t.grad)])
    print(f"Khop PyTorch autograd tuyet doi: {ok}")
    print()


def example_vanishing_exploding() -> None:
    """Vi du so cho Muc 6: gradient la tich cua nhieu local derivative."""
    print("=" * 70)
    print("VI DU 3: tich nhieu local-derivative theo do sau (vanishing/exploding)")
    print("=" * 70)
    for g in (0.5, 1.0, 2.0):
        vals = [g ** L for L in (1, 5, 10, 20, 50)]
        print(f"g={g:>4}: " + "  ".join(f"L={L}: {v:.3e}"
              for L, v in zip((1, 5, 10, 20, 50), vals)))
    print()


if __name__ == "__main__":
    np.set_printoptions(suppress=True)
    example_scalar()
    example_two_layer()
    example_shared_weight()
    example_matrix_batch()
    example_vanishing_exploding()
