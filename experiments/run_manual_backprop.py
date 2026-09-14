"""Part A -- Manual Backpropagation demo tren mot mang nho (NumPy thuan,
khong autograd). Chung minh code `src/manual_nn.py` chay dung tren mot
kien truc tuy y (khong chi vi du toy 2-lop trong report).

Chay: python experiments/run_manual_backprop.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402

from src.manual_nn import ManualMLP  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    rng = np.random.default_rng(42)
    N = 8  # batch nho
    layer_dims = [4, 5, 3, 1]

    net = ManualMLP(layer_dims=layer_dims, activation="tanh", scheme="xavier", seed=42)
    X = rng.normal(size=(N, layer_dims[0]))
    Y = rng.normal(size=(N, layer_dims[-1]))

    Yhat = net.forward(X)
    L = net.loss(Yhat, Y)
    grads = net.backward(Yhat, Y)

    print("=" * 70)
    print(f"Manual Backpropagation demo -- kien truc {layer_dims}, "
          f"activation=tanh, init=xavier")
    print("=" * 70)
    print(f"Batch size N={N}, Loss (MSE trung binh batch) = {L:.6f}")
    print()
    print(f"{'Layer':<8}{'W shape':<14}{'||dW||_2':<14}{'||db||_2':<14}")
    log = {"layer_dims": layer_dims, "activation": "tanh", "scheme": "xavier",
           "N": N, "loss": L, "layers": []}
    for l in range(net.n_layers):
        dW, db = grads["dW"][l], grads["db"][l]
        norm_w, norm_b = float(np.linalg.norm(dW)), float(np.linalg.norm(db))
        print(f"{l:<8}{str(net.W[l].shape):<14}{norm_w:<14.6f}{norm_b:<14.6f}")
        log["layers"].append({
            "layer": l, "W_shape": list(net.W[l].shape),
            "grad_W_norm": norm_w, "grad_b_norm": norm_b,
        })

    out_path = LOG_DIR / "manual_backprop_demo.json"
    out_path.write_text(json.dumps(log, indent=2), encoding="utf-8")
    print(f"\nDa luu log: {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
