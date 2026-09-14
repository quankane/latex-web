"""Do luong dung cho Experiment 7 (gradient norm / activation / weight theo
layer) va Experiment 8 (training convergence). Tach rieng khoi training.py
de co the goi doc lap trong notebook phan tich (Phase 6).
"""
from __future__ import annotations

from typing import Dict, List

import numpy as np
import torch

from .models import MLP


@torch.no_grad()
def weight_stats(model: MLP) -> List[Dict[str, float]]:
    """Mean/var cua W tung hidden layer (khong tinh output layer) -- doi
    chieu voi Var(W) ly thuyet trong initialization.py."""
    stats = []
    for i, linear in enumerate(model.linears):
        w = linear.weight.detach().cpu().numpy()
        stats.append({
            "layer": i + 1,
            "mean": float(w.mean()),
            "var": float(w.var()),
            "std": float(w.std()),
        })
    return stats


def activation_stats(activations: List[torch.Tensor]) -> List[Dict[str, float]]:
    """Mean/var cua A^(l) tung hidden layer (bo A^(0)=X). `activations` la
    danh sach As tra ve tu `MLP.forward_with_intermediates` (phan tu 0 la
    input X, cac phan tu sau la A^(1)..A^(L))."""
    stats = []
    for i, a in enumerate(activations[1:], start=1):
        arr = a.detach().cpu().numpy()
        stats.append({
            "layer": i,
            "mean": float(arr.mean()),
            "var": float(arr.var()),
            "std": float(arr.std()),
            "frac_zero": float(np.mean(np.isclose(arr, 0.0))),
        })
    return stats


def grad_norms_per_layer(model: MLP) -> List[Dict[str, float]]:
    """Do lon gradient dL/dW tung hidden layer, sau khi da goi
    loss.backward(). Day la so lieu tao Hinh 'gradient_norm.png'
    (Experiment 7) -- theo Phase 2 muc 6, ky vong giam dan manh ve phia lop
    dau (vanishing) hoac tang dan (exploding) tuy scheme/activation.

    Bao ca 2 dai luong:
    - grad_norm: L2-norm (Frobenius) cua toan ma tran -- de doi chieu truc
      tiep voi ||.||_2 dung trong cong thuc Mục 4.
    - grad_rms: root-mean-square = grad_norm / sqrt(so phan tu) -- do lon
      "moi trong so" TRUNG BINH, khong bi lech boi kich thuoc ma tran khac
      nhau giua cac layer (layer 1: 784x128 ~100k phan tu, cac layer sau
      128x128 ~16k phan tu) -- dung day de SO SANH GIUA CAC LAYER cho cong
      bang; grad_norm chi nen dung khi so sanh CUNG mot layer giua cac
      scheme/activation.
    """
    norms = []
    for i, linear in enumerate(model.linears):
        if linear.weight.grad is None:
            raise RuntimeError(
                "weight.grad is None -- phai goi loss.backward() truoc."
            )
        g = linear.weight.grad.detach().cpu().numpy()
        n_elem = g.size
        norms.append({
            "layer": i + 1,
            "grad_norm": float(np.linalg.norm(g)),
            "grad_rms": float(np.linalg.norm(g) / np.sqrt(n_elem)),
            "n_elements": int(n_elem),
        })
    out_g = model.output.weight.grad
    if out_g is not None:
        g = out_g.detach().cpu().numpy()
        n_elem = g.size
        norms.append({
            "layer": len(model.linears) + 1,
            "grad_norm": float(np.linalg.norm(g)),
            "grad_rms": float(np.linalg.norm(g) / np.sqrt(n_elem)),
            "n_elements": int(n_elem),
        })
    return norms


def accuracy(logits: torch.Tensor, y: torch.Tensor) -> float:
    preds = logits.argmax(dim=1)
    return float((preds == y).float().mean().item())
