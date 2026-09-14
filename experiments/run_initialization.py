"""Chay luoi day du 5 initialization x 4 activation = 20 cau hinh tren
Fashion-MNIST (Phase 3 design -> Experiment 1-8). Moi cau hinh duoc log
rieng ra `results/logs/run_<scheme>_<activation>.json`; sau khi chay het,
tong hop bang `results/tables/*.csv` va sinh 8 hinh bat buoc.

Chay toan bo (lau, ~15-30 phut CPU): python experiments/run_initialization.py
Chay nhanh de test pipeline:          python experiments/run_initialization.py --quick
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from src.initialization import SCHEMES  # noqa: E402
from src.training import EPOCHS, load_fashion_mnist_subset, train_one_config  # noqa: E402
from src.visualization import ACT_ORDER, generate_all_figures  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"
TABLE_DIR = ROOT / "results" / "tables"
LOG_DIR.mkdir(parents=True, exist_ok=True)
TABLE_DIR.mkdir(parents=True, exist_ok=True)


def log_progress(activation, scheme, epoch, epochs, train_loss, train_acc, val_loss, val_acc):
    print(f"  [{scheme:<14}|{activation:<10}] epoch {epoch:>2}/{epochs}  "
          f"train_loss={train_loss:.4f} train_acc={train_acc:.3f}  "
          f"val_loss={val_loss:.4f} val_acc={val_acc:.3f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", action="store_true",
                         help="chi chay 2 epoch, 2 scheme x 2 activation -- test pipeline")
    args = parser.parse_args()

    print("Dang tai Fashion-MNIST (subset)...")
    data = load_fashion_mnist_subset()
    print(f"  train={data.X_train.shape}, val={data.X_val.shape}, "
          f"test={data.X_test.shape}, mean={data.mean:.4f}, std={data.std:.4f}")

    schemes = list(SCHEMES)
    activations = list(ACT_ORDER)
    epochs = EPOCHS
    if args.quick:
        schemes = ["zero", "he"]
        activations = ["relu", "sigmoid"]
        epochs = 2
        print("*** CHE DO --quick: chi chay mot phan luoi, epochs=2 ***")

    all_runs = []
    t_start = time.time()
    total = len(schemes) * len(activations)
    done = 0
    for scheme in schemes:
        for activation in activations:
            done += 1
            print(f"\n[{done}/{total}] scheme={scheme} activation={activation}")
            result = train_one_config(
                activation=activation, scheme=scheme, data=data,
                epochs=epochs, log_fn=log_progress,
            )
            out_path = LOG_DIR / f"run_{scheme}_{activation}.json"
            out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
            print(f"  -> test_acc={result['test_acc']:.3f}  "
                  f"test_loss={result['test_loss']:.4f}  "
                  f"({result['elapsed_sec']:.1f}s)  saved {out_path.name}")
            all_runs.append(result)

    elapsed = time.time() - t_start
    print(f"\nTong thoi gian: {elapsed/60:.1f} phut cho {total} cau hinh.")

    # ---- bang tong hop CSV (Phase 6 / report Muc 9) ----
    rows = []
    for r in all_runs:
        rows.append({
            "scheme": r["scheme"], "activation": r["activation"],
            "final_train_loss": r["history"][-1]["train_loss"],
            "final_val_loss": r["history"][-1]["val_loss"],
            "final_val_acc": r["history"][-1]["val_acc"],
            "test_loss": r["test_loss"], "test_acc": r["test_acc"],
            "initial_grad_rms_layer1": r["initial_grad_norms"][0]["grad_rms"],
            "initial_grad_rms_layer6": r["initial_grad_norms"][5]["grad_rms"],
        })
    df = pd.DataFrame(rows)
    df.to_csv(TABLE_DIR / "initialization_comparison.csv", index=False)
    print(f"Da luu bang: {TABLE_DIR / 'initialization_comparison.csv'}")

    if not args.quick:
        print("\nDang sinh 8 hinh bat buoc...")
        paths = generate_all_figures(all_runs)
        for p in paths:
            print(f"  {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
