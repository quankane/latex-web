"""Ham kich hoat (activation function) va dao ham cua chung, thuan NumPy.

Dung cho phan Manual Backpropagation (Part A, xem `manual_nn.py`) va cac vi
du toy trong report/slide. Model PyTorch (`models.py`) dung `torch.nn`
built-in (nn.Sigmoid/Tanh/ReLU/LeakyReLU) truc tiep, KHONG dung module nay,
de tranh viet lai autograd thu cong.

Quy uoc: moi ham `f(z)` co ham `f_grad(z)` di kem, tra ve dao ham CUC BO
d f/d z (dung de nhan Hadamard voi upstream gradient trong backward pass,
xem Phase 2 muc 4.4 - 4.6).
"""
from __future__ import annotations

import numpy as np

ArrayLike = np.ndarray


def sigmoid(z: ArrayLike) -> ArrayLike:
    """Sigmoid: nen z ve khoang (0,1). On dinh so hoc bang cach tach dau."""
    out = np.empty_like(z, dtype=np.float64)
    pos = z >= 0
    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))
    exp_z = np.exp(z[~pos])
    out[~pos] = exp_z / (1.0 + exp_z)
    return out


def sigmoid_grad(z: ArrayLike) -> ArrayLike:
    """d/dz sigmoid(z) = sigmoid(z) * (1 - sigmoid(z)). Max tai z=0 la 0.25
    -- day la ly do sigmoid gay vanishing gradient manh khi xep nhieu lop
    (moi lop nhan them he so <= 0.25, xem Phase 2 muc 6)."""
    s = sigmoid(z)
    return s * (1.0 - s)


def tanh(z: ArrayLike) -> ArrayLike:
    return np.tanh(z)


def tanh_grad(z: ArrayLike) -> ArrayLike:
    """d/dz tanh(z) = 1 - tanh(z)^2. Max tai z=0 la 1.0 -- do doc lon hon
    sigmoid nen tanh thuong hoi tu on hon sigmoid trong mang sau vua phai."""
    t = np.tanh(z)
    return 1.0 - t ** 2


def relu(z: ArrayLike) -> ArrayLike:
    return np.maximum(0.0, z)


def relu_grad(z: ArrayLike) -> ArrayLike:
    """d/dz ReLU(z) = 1 neu z>0, 0 neu z<0 (khong kha vi tai z=0, quy uoc
    0 -- day chinh la nguyen nhan hien tuong "dead ReLU": mot khi z<=0,
    gradient qua neuron do bang 0 tuyet doi, xem vi du 2-lop Phase 2)."""
    return (z > 0).astype(z.dtype)


def leaky_relu(z: ArrayLike, slope: float = 0.01) -> ArrayLike:
    return np.where(z > 0, z, slope * z)


def leaky_relu_grad(z: ArrayLike, slope: float = 0.01) -> ArrayLike:
    """Khac ReLU o cho z<=0 khong triet tieu gradient hoan toan ma chi
    thu nho theo `slope` -- giai quyet dead-neuron nhung van giu tinh phi
    tuyen."""
    return np.where(z > 0, 1.0, slope).astype(z.dtype)


ACTIVATIONS = {
    "sigmoid": (sigmoid, sigmoid_grad),
    "tanh": (tanh, tanh_grad),
    "relu": (relu, relu_grad),
    "leaky_relu": (leaky_relu, leaky_relu_grad),
}


def get_activation(name: str):
    """Tra ve (f, f_grad) theo ten. Nem KeyError ro rang neu ten sai,
    tranh loi ngam."""
    try:
        return ACTIVATIONS[name]
    except KeyError as exc:
        raise KeyError(
            f"Khong biet activation '{name}'. Cac lua chon: "
            f"{list(ACTIVATIONS)}"
        ) from exc
