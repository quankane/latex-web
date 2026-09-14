"""Part A -- Manual Backpropagation: forward + backward tu viet bang NumPy,
KHONG dung autograd. Muc dich: chung minh Backpropagation chi la Chain Rule
ap dung co he thong (Phase 2 muc 4.6 - Matrix Form).

Quy uoc: hang cua X la 1 mau (batch-first), giong `docs/phase2_math_content.md`
muc 4.6 va giong PyTorch/NumPy thong thuong:
    Z^(l) = A^(l-1) W^(l) + b^(l)         (N, n_l)
    A^(l) = f(Z^(l))
Loss mac dinh: MSE trung binh theo batch, L = (1/N) sum_i 1/2||yhat_i-y_i||^2
-- don gian, phu hop demo hoi quy nho; cho phan classification that (Phase
5) dung PyTorch CrossEntropyLoss thay vi lop nay.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

import numpy as np

from .activations import get_activation
from .initialization import Scheme, init_bias_numpy, init_weight_numpy


@dataclass
class ManualMLP:
    """MLP nhieu lop, forward/backward tu viet tay.

    Attributes
    ----------
    layer_dims: [n0, n1, ..., nL] -- kich thuoc input, cac hidden, output.
    activation: ten activation dung cho MOI hidden layer (output luon
        linear, vi bai toan demo la hoi quy MSE -- xem docstring module).
    """

    layer_dims: List[int]
    activation: str = "relu"
    scheme: Scheme = "he"
    seed: int = 42

    W: List[np.ndarray] = field(default_factory=list, init=False)
    b: List[np.ndarray] = field(default_factory=list, init=False)
    _cache: dict = field(default_factory=dict, init=False, repr=False)

    def __post_init__(self) -> None:
        rng = np.random.default_rng(self.seed)
        self.f, self.f_grad = get_activation(self.activation)
        self.W, self.b = [], []
        for n_in, n_out in zip(self.layer_dims[:-1], self.layer_dims[1:]):
            self.W.append(init_weight_numpy(n_in, n_out, self.scheme, rng))
            self.b.append(init_bias_numpy(n_out))

    @property
    def n_layers(self) -> int:
        return len(self.W)

    # ------------------------------ forward -------------------------------
    def forward(self, X: np.ndarray) -> np.ndarray:
        """X: (N, n0). Tra ve Yhat: (N, nL). Lop cuoi (output) LUON linear
        (khong qua self.f) -- khop quy uoc dung trong models.py va Phase 2."""
        A = X
        Zs, As = [], [A]
        for l in range(self.n_layers):
            Z = A @ self.W[l] + self.b[l]
            is_last = l == self.n_layers - 1
            A = Z if is_last else self.f(Z)
            Zs.append(Z)
            As.append(A)
        self._cache = {"Zs": Zs, "As": As}
        return A

    # ------------------------------ backward ------------------------------
    def backward(self, Yhat: np.ndarray, Y: np.ndarray) -> dict:
        """Tinh dL/dW[l], dL/db[l] cho moi lop bang chain rule, dung dung
        cong thuc Phase 2 muc 4.6:
            dZ^(l) = dA^(l) o f'(Z^(l))          (o = Hadamard)
            dW^(l) = (A^(l-1))^T dZ^(l)
            db^(l) = 1^T dZ^(l)                   (tong theo truc batch)
            dA^(l-1) = dZ^(l) (W^(l))^T
        Loss: MSE trung binh batch -> dL/dYhat = (Yhat - Y) / N.
        """
        Zs, As = self._cache["Zs"], self._cache["As"]
        N = Y.shape[0]
        grads_W: List[np.ndarray] = [None] * self.n_layers  # type: ignore
        grads_b: List[np.ndarray] = [None] * self.n_layers  # type: ignore

        dA = (Yhat - Y) / N  # dL/dA^(L), L = output layer (linear)
        for l in reversed(range(self.n_layers)):
            is_last = l == self.n_layers - 1
            dZ = dA if is_last else dA * self.f_grad(Zs[l])
            A_prev = As[l]  # As[l] = A^(l-1) vi As[0]=X
            grads_W[l] = A_prev.T @ dZ
            grads_b[l] = dZ.sum(axis=0)
            dA = dZ @ self.W[l].T  # dL/dA^(l-1), dung cho vong lap ke tiep
        return {"dW": grads_W, "db": grads_b}

    def loss(self, Yhat: np.ndarray, Y: np.ndarray) -> float:
        N = Y.shape[0]
        return float(0.5 * np.sum((Yhat - Y) ** 2) / N)

    # ------------------------------ utility --------------------------------
    def flat_params(self):
        """Sinh (ten, mang, index) cho tung tham so -- dung cho gradient
        checking (`experiments/run_gradient_check.py`) duyet toan bo W,b."""
        for l in range(self.n_layers):
            yield f"W[{l}]", self.W[l]
            yield f"b[{l}]", self.b[l]

    def flat_grads(self, grads: dict):
        for l in range(self.n_layers):
            yield f"W[{l}]", grads["dW"][l]
            yield f"b[{l}]", grads["db"][l]
