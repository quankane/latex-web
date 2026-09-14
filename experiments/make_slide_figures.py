"""Sinh phien ban 'presentation-optimized' cua 2 hinh dung trong slide
(Slide 22, 23) -- font nhan truc >=16pt, linewidth >=2.5, de doc duoc tu xa
khi trinh chieu. Bao cao PDF van dung ban goc (kich thuoc phu hop trang in,
xem src/visualization.py); day la ban RIENG chi cho PPTX.

Chay: python experiments/make_slide_figures.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from src.visualization import (  # noqa: E402
    ACT_LABEL, ACT_ORDER, FIG_DIR, SCHEME_COLOR, SCHEME_LABEL, SCHEME_ORDER, _by_key,
)

LOG_DIR = ROOT / "results" / "logs"


def load_all_runs():
    return [json.loads((LOG_DIR / f"run_{s}_{a}.json").read_text(encoding="utf-8"))
            for s in SCHEME_ORDER for a in ACT_ORDER]


def make_gradient_norm_slide(idx, activation: str = "sigmoid") -> Path:
    fig, ax = plt.subplots(figsize=(9, 6.2))
    for scheme in SCHEME_ORDER:
        r = idx.get((scheme, activation))
        if r is None:
            continue
        gn = r["initial_grad_norms"]
        layers = [g["layer"] for g in gn]
        rms = [g["grad_rms"] for g in gn]
        ax.plot(layers, rms, color=SCHEME_COLOR[scheme], marker="o", markersize=9,
                linewidth=2.8, label=SCHEME_LABEL[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Lớp (1 = gần input, 7 = output)", fontsize=17)
    ax.set_ylabel("RMS gradient (thang log)", fontsize=17)
    ax.set_title(f"Gradient theo layer — activation = {ACT_LABEL[activation]}", fontsize=18)
    ax.tick_params(axis="both", labelsize=16)
    ax.legend(loc="best", frameon=False, fontsize=14)
    ax.grid(alpha=0.3, which="both", linewidth=1.1)
    for spine in ax.spines.values():
        spine.set_linewidth(1.3)
    fig.tight_layout()
    out = FIG_DIR / "gradient_norm_slide.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    return out


def make_initialization_comparison_slide(idx) -> Path:
    fig, ax = plt.subplots(figsize=(11, 6.2))
    n_schemes = len(SCHEME_ORDER)
    width = 0.8 / n_schemes
    x = np.arange(len(ACT_ORDER))
    for i, scheme in enumerate(SCHEME_ORDER):
        accs = [idx.get((scheme, act))["test_acc"] if idx.get((scheme, act)) else np.nan
                for act in ACT_ORDER]
        ax.bar(x + i * width - 0.4 + width / 2, accs, width=width, color=SCHEME_COLOR[scheme],
               label=SCHEME_LABEL[scheme], edgecolor="white", linewidth=1.2)
    ax.axhline(0.10, color="black", linestyle=":", linewidth=2)
    ax.set_xticks(x)
    ax.set_xticklabels([ACT_LABEL[a] for a in ACT_ORDER], fontsize=17)
    ax.set_ylabel("Test Accuracy", fontsize=17)
    ax.set_title("Initialization × Activation (test accuracy, 15 epoch)", fontsize=18)
    ax.tick_params(axis="y", labelsize=16)
    ax.legend(loc="upper left", bbox_to_anchor=(1.01, 1.0), frameon=False, fontsize=14)
    ax.grid(alpha=0.3, axis="y", linewidth=1.1)
    for spine in ax.spines.values():
        spine.set_linewidth(1.3)
    fig.tight_layout()
    out = FIG_DIR / "initialization_comparison_slide.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    return out


if __name__ == "__main__":
    runs = load_all_runs()
    idx = _by_key(runs)
    p1 = make_gradient_norm_slide(idx)
    p2 = make_initialization_comparison_slide(idx)
    print("saved", p1)
    print("saved", p2)
