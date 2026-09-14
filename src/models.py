"""MLP cau hinh duoc (do sau, activation, initialization) bang PyTorch.

Kien truc co dinh cho toan bo luoi thi nghiem (Phase 3):
    784 -> 128 -> 128 -> 128 -> 128 -> 128 -> 128 -> 10
6 hidden layer, KHONG BatchNorm, KHONG Dropout, khong pretrained -- de
initialization la yeu to duy nhat tao khac biet giua cac lan chay.
"""
from __future__ import annotations

from typing import List

import torch
import torch.nn as nn

from .initialization import Scheme, init_linear_

ACTIVATION_MODULES = {
    "sigmoid": nn.Sigmoid,
    "tanh": nn.Tanh,
    "relu": nn.ReLU,
    "leaky_relu": lambda: nn.LeakyReLU(negative_slope=0.01),
}


class MLP(nn.Module):
    """Multilayer perceptron voi so hidden layer/kich thuoc tuy chinh.

    Moi `nn.Linear` duoc luu rieng (khong goi chung trong `nn.Sequential`)
    de `metrics.py` co the mac hook/doc gradient theo TUNG layer rieng biet
    (Experiment 7 - gradient norm theo layer).
    """

    def __init__(
        self,
        input_dim: int = 784,
        hidden_dims: List[int] | None = None,
        output_dim: int = 10,
        activation: str = "relu",
    ) -> None:
        super().__init__()
        hidden_dims = hidden_dims or [128] * 6
        if activation not in ACTIVATION_MODULES:
            raise KeyError(
                f"Khong biet activation '{activation}'. "
                f"Cac lua chon: {list(ACTIVATION_MODULES)}"
            )
        self.activation_name = activation
        dims = [input_dim] + list(hidden_dims)
        self.linears = nn.ModuleList(
            [nn.Linear(dims[i], dims[i + 1]) for i in range(len(dims) - 1)]
        )
        self.output = nn.Linear(dims[-1], output_dim)
        act_factory = ACTIVATION_MODULES[activation]
        self.activations = nn.ModuleList(
            [act_factory() for _ in range(len(self.linears))]
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        a = x
        for linear, act in zip(self.linears, self.activations):
            z = linear(a)
            a = act(z)
        logits = self.output(a)  # output layer luon linear (logits)
        return logits

    def forward_with_intermediates(self, x: torch.Tensor):
        """Nhu forward(), nhung tra them list z^(l), a^(l) tung lop --
        dung cho metrics.py do activation variance/gradient norm theo layer
        (Experiment 7) ma khong phai mac forward hook."""
        zs, as_ = [], [x]
        a = x
        for linear, act in zip(self.linears, self.activations):
            z = linear(a)
            a = act(z)
            zs.append(z)
            as_.append(a)
        logits = self.output(a)
        return logits, zs, as_

    def apply_initialization(self, scheme: Scheme) -> None:
        """Khoi tao lai TOAN BO linear layer (hidden + output) theo scheme.

        Lop output cung duoc khoi tao theo cung scheme de nhat quan; vi lop
        output khong co activation phi tuyen phia sau, lua chon nay khong
        anh huong lon toi ket luan (thao luan them o report Limitations).
        """
        for linear in self.linears:
            init_linear_(linear, scheme)
        init_linear_(self.output, scheme)


def build_model(activation: str = "relu", hidden_dims: List[int] | None = None) -> MLP:
    return MLP(activation=activation, hidden_dims=hidden_dims)
