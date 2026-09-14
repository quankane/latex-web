"""Cac scheme khoi tao tham so (parameter initialization).

Cong thuc Var(W) cho tung scheme duoc dan truc tiep tu
`docs/phase2_math_content.md` muc 5.3-5.6 -- KHONG duoc doi cong thuc o day
ma khong cap nhat lai tai lieu do (va nguoc lai), de dam bao report/code
luon khop nhau.

Ho tro ca NumPy (dung cho `manual_nn.py`, Part A) va PyTorch (dung cho
`models.py`, thi nghiem chinh Phase 5).
"""
from __future__ import annotations

from typing import Literal

import numpy as np
import torch
import torch.nn as nn

Scheme = Literal["zero", "random_normal", "lecun", "xavier", "he"]

SCHEMES = ("zero", "random_normal", "lecun", "xavier", "he")


def weight_variance(scheme: Scheme, fan_in: int, fan_out: int) -> float:
    """Var(W) theo tung scheme -- cong thuc trung tam Phase 2 muc 5.2.

    - zero: Var=0 (W=0 het, minh hoa mat symmetry breaking).
    - random_normal: std co dinh nho (0.01), KHONG scale theo fan_in --
      day la "random ngay tho" dung de doi chieu voi cac scheme co scale.
    - lecun: Var = 1/fan_in.
    - xavier: Var = 2/(fan_in+fan_out).
    - he: Var = 2/fan_in.
    """
    if scheme == "zero":
        return 0.0
    if scheme == "random_normal":
        return 0.01 ** 2
    if scheme == "lecun":
        return 1.0 / fan_in
    if scheme == "xavier":
        return 2.0 / (fan_in + fan_out)
    if scheme == "he":
        return 2.0 / fan_in
    raise KeyError(f"Khong biet scheme '{scheme}'. Cac lua chon: {SCHEMES}")


# ----------------------------- NumPy (Part A) -----------------------------

def init_weight_numpy(
    fan_in: int, fan_out: int, scheme: Scheme, rng: np.random.Generator
) -> np.ndarray:
    """Sinh ma tran trong so W (fan_in, fan_out) bang NumPy.

    Dung phan phoi Gaussian N(0, Var(W)) cho moi scheme khac 'zero' (thay
    vi Uniform) de nhat quan mot phan phoi duy nhat xuyen suot du an --
    Var(W) la dai luong quyet dinh hanh vi ly thuyet (Phase 2 muc 5.2), dang
    phan phoi (uniform/Gaussian) khong anh huong lap luan chinh.
    """
    var = weight_variance(scheme, fan_in, fan_out)
    if var == 0.0:
        return np.zeros((fan_in, fan_out), dtype=np.float64)
    std = float(np.sqrt(var))
    return rng.normal(loc=0.0, scale=std, size=(fan_in, fan_out))


def init_bias_numpy(fan_out: int) -> np.ndarray:
    """Bias luon khoi tao 0 (Phase 2 muc 5.6)."""
    return np.zeros(fan_out, dtype=np.float64)


# ----------------------------- PyTorch (Phase 5) ---------------------------

@torch.no_grad()
def init_linear_(layer: nn.Linear, scheme: Scheme) -> None:
    """Khoi tao tai cho (in-place) mot `nn.Linear` theo `scheme`.

    Quy uoc PyTorch: `layer.weight` co shape (out_features, in_features)
    (nguoc voi quy uoc (fan_in, fan_out) dung trong NumPy o tren) -- ham
    nay tu quy doi dung, khong can nguoi goi lo.
    """
    fan_out, fan_in = layer.weight.shape
    var = weight_variance(scheme, fan_in, fan_out)
    if var == 0.0:
        layer.weight.zero_()
    else:
        std = float(var ** 0.5)
        layer.weight.normal_(mean=0.0, std=std)
    if layer.bias is not None:
        layer.bias.zero_()
