"""Mo rong experiments/run_depth_experiment.py: them scheme Xavier (ngoai
He, Random naive) va them 2 do sau L=20, L=50 (ngoai L=2..12 da co) -- phuc
vu slide "Depth experiment" trong PPTX (Random/Xavier/He tai nhieu do sau).

Ghi ra file RIENG (depth_experiment_v2.json), KHONG doi/ghi de
depth_experiment.json goc -- file goc duoc bao cao LaTeX (Muc 6.1, 10.3)
trich dan nguyen van (train loss 0.456, test loss 5.409 tai L=12), khong
duoc thay doi de tranh lech so lieu voi PDF da xuat ban.

Chay: python experiments/run_depth_experiment_v2.py (~5-10 phut CPU,
do co them do sau 50 lop)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import torch.nn as nn  # noqa: E402

from src.metrics import grad_norms_per_layer  # noqa: E402
from src.models import MLP  # noqa: E402
from src.training import load_fashion_mnist_subset, set_seed, train_one_config  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

DEPTHS = [2, 4, 6, 8, 10, 12, 20, 50]
SCHEMES = ["random_normal", "xavier", "he"]
ACTIVATION = "relu"
DEPTH_EPOCHS = 8  # khop run_depth_experiment.py goc (thi nghiem bo sung, khong phai 15)


def initial_grad_rms_layer1(depth: int, scheme: str, data) -> float:
    set_seed(42)
    model = MLP(activation=ACTIVATION, hidden_dims=[128] * depth)
    model.apply_initialization(scheme)
    criterion = nn.CrossEntropyLoss()
    xb, yb = data.X_train[:128], data.y_train[:128]
    logits = model(xb)
    loss = criterion(logits, yb)
    loss.backward()
    gn = grad_norms_per_layer(model)
    return gn[0]["grad_rms"]


def main() -> None:
    print("Dang tai Fashion-MNIST subset...")
    data = load_fashion_mnist_subset()

    results = []
    for scheme in SCHEMES:
        for depth in DEPTHS:
            grad_rms = initial_grad_rms_layer1(depth, scheme, data)
            r = train_one_config(
                activation=ACTIVATION, scheme=scheme, data=data,
                epochs=DEPTH_EPOCHS, hidden_dims=[128] * depth,
            )
            final_train_loss = r["history"][-1]["train_loss"]
            row = {
                "scheme": scheme, "depth": depth,
                "grad_rms_layer1_init": grad_rms,
                "test_acc": r["test_acc"], "test_loss": r["test_loss"],
                "final_train_loss": final_train_loss,
            }
            results.append(row)
            nan_flag = " [NaN/diverged]" if final_train_loss != final_train_loss else ""
            print(f"  scheme={scheme:<14} depth={depth:>2}  "
                  f"grad_rms_init={grad_rms:.3e}  test_acc={r['test_acc']:.3f}{nan_flag}")

    out_path = LOG_DIR / "depth_experiment_v2.json"
    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Da luu: {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
