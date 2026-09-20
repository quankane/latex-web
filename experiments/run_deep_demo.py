"""Demo thuc nghiem cho slide "5 initialization experiments" (Zero, Random
nho, Random lon, Xavier, He) tren MOT kien truc SAU HON luoi chinh (10 hidden
layer thay vi 6) -- co y de lam vanishing/exploding gradient the hien ro hon,
phuc vu truc tiep cho PPTX (khong doi so lieu Muc 9 cua bao cao, day la thi
nghiem BO SUNG rieng).

Cung dataset/hyperparam voi luoi chinh (Fashion-MNIST subset, SGD thuan,
seed=42) -- chi khac kien truc (10 lop an x 128) va tap scheme (them
random_large). Activation = ReLU (khop kien truc "deep MLP" trong de xuat).

Chay: python experiments/run_deep_demo.py (~2-4 phut CPU)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from src.training import load_fashion_mnist_subset, train_one_config  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"
TABLE_DIR = ROOT / "results" / "tables"
LOG_DIR.mkdir(parents=True, exist_ok=True)
TABLE_DIR.mkdir(parents=True, exist_ok=True)

DEMO_SCHEMES = ["zero", "random_normal", "random_large", "xavier", "he"]
DEMO_SCHEME_LABEL = {
    "zero": "Zero", "random_normal": "Random (small, std=0.01)",
    "random_large": "Random (large, std=1.0)", "xavier": "Xavier/Glorot", "he": "He/Kaiming",
}
ACTIVATION = "relu"
DEPTH = 10  # "8-15 hidden layers" theo de xuat -- chon 10 de vanishing/exploding
            # the hien ro (Muc 6 report) ma van du nhanh de train that
EPOCHS = 15  # khop rigor luoi chinh (khong rut ngan)


def log_progress(activation, scheme, epoch, epochs, train_loss, train_acc, val_loss, val_acc):
    print(f"  [{scheme:<14}] epoch {epoch:>2}/{epochs}  "
          f"train_loss={train_loss:.4f} train_acc={train_acc:.3f}  "
          f"val_loss={val_loss:.4f} val_acc={val_acc:.3f}")


def _stability_label(row: dict) -> str:
    """Nhan dinh tinh "gradient stability" TU SO LIEU THAT (khong gan cung) --
    dua tren gradient RMS lop 1 (gan input nhat, noi vanishing/exploding the
    hien ro nhat) va train loss cuoi cung (phat hien NaN/exploding)."""
    g1 = row["initial_grad_norms"][0]["grad_rms"]
    train_loss_final = row["history"][-1]["train_loss"]
    if train_loss_final != train_loss_final:  # NaN check (NaN != NaN)
        return "Exploding (NaN)"
    if g1 < 1e-6:
        return "Vanishing"
    if g1 > 1.0:
        return "Exploding"
    return "Ổn định"


def main() -> None:
    print("Dang tai Fashion-MNIST (subset)...")
    data = load_fashion_mnist_subset()
    print(f"  train={data.X_train.shape}, val={data.X_val.shape}, test={data.X_test.shape}")

    hidden_dims = [128] * DEPTH
    all_runs = []
    for scheme in DEMO_SCHEMES:
        print(f"\n=== scheme={scheme} (depth={DEPTH}, activation={ACTIVATION}) ===")
        result = train_one_config(
            activation=ACTIVATION, scheme=scheme, data=data,
            epochs=EPOCHS, hidden_dims=hidden_dims, log_fn=log_progress,
        )
        out_path = LOG_DIR / f"deep_demo_{scheme}.json"
        out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"  -> test_acc={result['test_acc']:.3f}  test_loss={result['test_loss']:.4f}  "
              f"grad_rms_layer1={result['initial_grad_norms'][0]['grad_rms']:.3e}  "
              f"({result['elapsed_sec']:.1f}s)  saved {out_path.name}")
        all_runs.append(result)

    rows = []
    for r in all_runs:
        row = {
            "scheme": r["scheme"],
            "label": DEMO_SCHEME_LABEL[r["scheme"]],
            "final_train_loss": r["history"][-1]["train_loss"],
            "final_val_loss": r["history"][-1]["val_loss"],
            "test_loss": r["test_loss"],
            "test_acc": r["test_acc"],
            "grad_rms_layer1_init": r["initial_grad_norms"][0]["grad_rms"],
            "grad_rms_layer_last_init": r["initial_grad_norms"][-1]["grad_rms"],
        }
        row["gradient_stability"] = _stability_label(r)
        rows.append(row)

    df = pd.DataFrame(rows)
    out_csv = TABLE_DIR / "deep_demo_summary.csv"
    df.to_csv(out_csv, index=False)
    print(f"\nDa luu bang tong hop: {out_csv.relative_to(ROOT)}")
    print(df.to_string(index=False))


if __name__ == "__main__":
    main()
