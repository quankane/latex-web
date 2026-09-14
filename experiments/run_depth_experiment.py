"""Experiment bo sung: anh huong cua DO SAU mang toi initialization
(khong co trong luoi 20 cau hinh chinh, von co dinh do sau = 6 lop).

So sanh He vs. Random (naive), activation ReLU, tai cac do sau
L in {2,4,6,8,10,12} lop an (rong co dinh 128): do (a) gradient RMS lop 1
ngay tai buoc khoi tao (khong can train) va (b) test accuracy sau it epoch
huan luyen that -- de thay ro "cang sau, initialization sai cang tra gia
dat" (Muc 5.6 report) khong chi ve mat gradient ma ca ve mat hoc duoc.

Chay: python experiments/run_depth_experiment.py (~1-2 phut CPU)
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

DEPTHS = [2, 4, 6, 8, 10, 12]
SCHEMES = ["he", "random_normal"]
ACTIVATION = "relu"
DEPTH_EPOCHS = 8  # it hon 15 (luoi chinh) de tong thoi gian chay hop ly


def initial_grad_rms_layer1(depth: int, scheme: str, data) -> float:
    """Gradient RMS lop 1 (gan input nhat) ngay tai buoc khoi tao dau tien,
    KHONG can huan luyen -- do nhanh, tach bach khoi hieu ung optimizer."""
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
            row = {
                "scheme": scheme, "depth": depth,
                "grad_rms_layer1_init": grad_rms,
                "test_acc": r["test_acc"], "test_loss": r["test_loss"],
                "final_train_loss": r["history"][-1]["train_loss"],
            }
            results.append(row)
            print(f"  scheme={scheme:<14} depth={depth:>2}  "
                  f"grad_rms_init={grad_rms:.3e}  test_acc={r['test_acc']:.3f}")

    out_path = LOG_DIR / "depth_experiment.json"
    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Da luu: {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
