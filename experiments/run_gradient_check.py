"""Gradient checking: doi chieu 3 cach tinh gradient tren CUNG mot mang va
CUNG mot batch du lieu:
  1) manual  -- src/manual_nn.py (chain rule tu viet tay)
  2) autograd -- PyTorch, xay lai dung trong so tu manual de so sanh cong bang
  3) numerical -- finite-difference (f(w+h)-f(w-h))/(2h)

Bao cao absolute error va relative error giua tung cap. Neu manual sai (vi
du sai dau, sai chieu ma tran, quen chia batch...) thi (1) se lech xa (2) va
(3) trong khi (2),(3) van khop nhau -- day chinh la ly do gradient checking
huu ich khi tu code backprop: no cach ly loi RA KHOI thuat toan optimizer,
chi kiem tra dung mot khau "tinh gradient".

Chay: python experiments/run_gradient_check.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import torch  # noqa: E402
import torch.nn as nn  # noqa: E402

from src.manual_nn import ManualMLP  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def build_torch_twin(net: ManualMLP) -> nn.Module:
    """Xay mot nn.Sequential co CUNG trong so voi `net` (copy chinh xac),
    de autograd va manual xuat phat tu cung mot diem -- so sanh moi cong
    bang."""
    layers = []
    act_map = {"relu": nn.ReLU, "tanh": nn.Tanh, "sigmoid": nn.Sigmoid,
               "leaky_relu": lambda: nn.LeakyReLU(0.01)}
    for l in range(net.n_layers):
        lin = nn.Linear(*net.W[l].shape)
        with torch.no_grad():
            lin.weight.copy_(torch.tensor(net.W[l].T, dtype=torch.float64))
            lin.bias.copy_(torch.tensor(net.b[l], dtype=torch.float64))
        layers.append(lin)
        if l < net.n_layers - 1:
            layers.append(act_map[net.activation]())
    model = nn.Sequential(*layers).double()
    return model


def numerical_grad(net: ManualMLP, X: np.ndarray, Y: np.ndarray, param: np.ndarray,
                    n_samples: int, h: float, rng: np.random.Generator) -> np.ndarray:
    """Finite-difference gradient cho MOT SO phan tu dai dien (khong toan
    bo, de chay nhanh) cua mang tham so `param` (la net.W[l] hoac net.b[l],
    sua tai cho roi khoi phuc). Tra ve mang cung shape voi `param`, cac vi
    tri khong duoc chon = NaN (bo qua khi so sanh)."""
    flat = param.reshape(-1)
    idx_flat = rng.choice(flat.size, size=min(n_samples, flat.size), replace=False)
    grad = np.full_like(flat, np.nan)
    for i in idx_flat:
        orig = flat[i]
        flat[i] = orig + h
        Yhat_p = net.forward(X)
        Lp = net.loss(Yhat_p, Y)
        flat[i] = orig - h
        Yhat_m = net.forward(X)
        Lm = net.loss(Yhat_m, Y)
        flat[i] = orig
        grad[i] = (Lp - Lm) / (2 * h)
    return grad.reshape(param.shape)


def rel_error(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    denom = np.maximum(np.abs(a), np.abs(b))
    denom = np.where(denom < 1e-8, 1.0, denom)  # tranh chia 0 khi ca hai ~0
    return np.abs(a - b) / denom


def main() -> None:
    rng = np.random.default_rng(0)
    layer_dims = [6, 8, 5, 1]
    net = ManualMLP(layer_dims=layer_dims, activation="tanh", scheme="xavier", seed=7)

    N = 4
    X = rng.normal(size=(N, layer_dims[0]))
    Y = rng.normal(size=(N, layer_dims[-1]))

    Yhat = net.forward(X)
    grads = net.backward(Yhat, Y)

    # ---- (2) autograd tren ban sao dung trong so ----
    twin = build_torch_twin(net)
    Xt = torch.tensor(X, dtype=torch.float64, requires_grad=False)
    Yt = torch.tensor(Y, dtype=torch.float64)
    pred = twin(Xt)
    loss_fn = nn.MSELoss(reduction="sum")
    Lt = 0.5 * loss_fn(pred, Yt) / N  # khop dinh nghia loss trong manual_nn.py
    Lt.backward()

    linear_layers = [m for m in twin if isinstance(m, nn.Linear)]

    report = {"layer_dims": layer_dims, "activation": "tanh", "N": N, "params": []}
    print("=" * 78)
    print("GRADIENT CHECK: manual vs. autograd vs. finite-difference")
    print("=" * 78)
    print(f"{'Param':<8}{'shape':<12}{'max|manual-autograd|':<24}{'max rel.err (num)':<20}")

    h = 1e-6
    for l in range(net.n_layers):
        dW_manual, db_manual = grads["dW"][l], grads["db"][l]
        dW_autograd = linear_layers[l].weight.grad.detach().numpy().T
        db_autograd = linear_layers[l].bias.grad.detach().numpy()

        err_W_autograd = float(np.max(np.abs(dW_manual - dW_autograd)))
        err_b_autograd = float(np.max(np.abs(db_manual - db_autograd)))

        num_dW = numerical_grad(net, X, Y, net.W[l], n_samples=6, h=h, rng=rng)
        num_db = numerical_grad(net, X, Y, net.b[l], n_samples=3, h=h, rng=rng)
        mask_W = ~np.isnan(num_dW)
        mask_b = ~np.isnan(num_db)
        rel_W = rel_error(dW_manual[mask_W], num_dW[mask_W])
        rel_b = rel_error(db_manual[mask_b], num_db[mask_b])
        max_rel = float(np.max(np.concatenate([rel_W, rel_b])))

        print(f"W[{l}]   {str(net.W[l].shape):<12}{err_W_autograd:<24.3e}{max_rel:<20.3e}")
        report["params"].append({
            "layer": l,
            "max_abs_err_vs_autograd_W": err_W_autograd,
            "max_abs_err_vs_autograd_b": err_b_autograd,
            "max_rel_err_vs_finite_diff": max_rel,
            "finite_diff_h": h,
            "n_samples_checked_W": int(mask_W.sum()),
            "n_samples_checked_b": int(mask_b.sum()),
        })

    all_rel = [p["max_rel_err_vs_finite_diff"] for p in report["params"]]
    all_abs = [p["max_abs_err_vs_autograd_W"] for p in report["params"]]
    print()
    print(f"Max abs error (manual vs autograd) toan mang : {max(all_abs):.3e}")
    print(f"Max rel error (manual vs finite-diff) toan mang: {max(all_rel):.3e}")
    threshold = 1e-4
    verdict = "PASS" if max(all_rel) < threshold else "FAIL"
    print(f"Nguong chap nhan (chuan pham vi report): rel. error < {threshold:.0e} -> {verdict}")
    report["verdict"] = verdict
    report["threshold"] = threshold

    out_path = LOG_DIR / "gradient_check_report.json"
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nDa luu log: {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
