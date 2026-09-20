"""Multi-seed replication cho Xavier vs. He tren kien truc 10-hidden-layer cua
run_deep_demo.py -- 1 seed duy nhat KHONG du de ket luan "Xavier tot hon He"
hay nguoc lai (chenh lech nho co the chi la nhieu ngau nhien). Chay lai 5
seed doc lap, bao cao mean +/- std cho test accuracy VA gradient RMS lop 1
(khoi tao) -- dung de thay the moi phat bieu "X > Y" bang so lieu co do
bat dinh ro rang.

Chay: python experiments/run_multiseed.py (~5 x 2 x 3s =~ 30s CPU)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from src.training import load_fashion_mnist_subset, train_one_config  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"
TABLE_DIR = ROOT / "results" / "tables"
LOG_DIR.mkdir(parents=True, exist_ok=True)
TABLE_DIR.mkdir(parents=True, exist_ok=True)

SCHEMES = ["xavier", "he"]
SEEDS = [42, 43, 44, 45, 46]
ACTIVATION = "relu"
DEPTH = 10
EPOCHS = 15


def main() -> None:
    print("Dang tai Fashion-MNIST (subset)...")
    data = load_fashion_mnist_subset()  # tach seed cua data loading khoi seed cua init/training

    hidden_dims = [128] * DEPTH
    all_runs = {s: [] for s in SCHEMES}
    for scheme in SCHEMES:
        for seed in SEEDS:
            r = train_one_config(
                activation=ACTIVATION, scheme=scheme, data=data,
                epochs=EPOCHS, hidden_dims=hidden_dims, seed=seed,
            )
            g1 = r["initial_grad_norms"][0]["grad_rms"]
            print(f"  scheme={scheme:<8} seed={seed}  test_acc={r['test_acc']:.4f}  "
                  f"grad_rms_layer1={g1:.4e}")
            all_runs[scheme].append({"seed": seed, "test_acc": r["test_acc"], "grad_rms_layer1": g1})

    out_path = LOG_DIR / "multiseed_xavier_he.json"
    out_path.write_text(json.dumps(all_runs, indent=2), encoding="utf-8")
    print(f"\nDa luu: {out_path.relative_to(ROOT)}")

    rows = []
    for scheme in SCHEMES:
        accs = np.array([r["test_acc"] for r in all_runs[scheme]])
        grms = np.array([r["grad_rms_layer1"] for r in all_runs[scheme]])
        rows.append({
            "scheme": scheme, "n_seeds": len(SEEDS),
            "test_acc_mean": accs.mean(), "test_acc_std": accs.std(ddof=1),
            "grad_rms_layer1_mean": grms.mean(), "grad_rms_layer1_std": grms.std(ddof=1),
        })
    df = pd.DataFrame(rows)
    out_csv = TABLE_DIR / "multiseed_xavier_he_summary.csv"
    df.to_csv(out_csv, index=False)
    print(f"Da luu bang tong hop: {out_csv.relative_to(ROOT)}")
    print(df.to_string(index=False))


if __name__ == "__main__":
    main()
