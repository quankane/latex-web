"""Sinh cac hinh presentation-optimized (font to, linewidth day) cho slide
PPTX moi (deep-demo 5 scheme + depth-experiment v2) -- doc doc lap voi
report/make_slide_figures.py (kich thuoc in) de khong lam anh huong hinh
report da xuat ban.

Chay: python experiments/make_deep_demo_figures.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from src.visualization import FIG_DIR  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"

DEMO_SCHEMES = ["zero", "random_normal", "random_large", "xavier", "he"]
DEMO_LABEL = {
    "zero": "Zero", "random_normal": "Random (small)",
    "random_large": "Random (large)", "xavier": "Xavier", "he": "He",
}
DEMO_COLOR = {
    "zero": "#999999", "random_normal": "#e07b39", "random_large": "#8e44ad",
    "xavier": "#55a868", "he": "#c44e52",
}


def load_demo_runs() -> dict:
    runs = {}
    for scheme in DEMO_SCHEMES:
        p = LOG_DIR / f"deep_demo_{scheme}.json"
        runs[scheme] = json.loads(p.read_text(encoding="utf-8"))
    return runs


def make_gradient_heatmap_slide(runs: dict) -> Path:
    schemes = DEMO_SCHEMES
    n_layers = len(runs[schemes[0]]["initial_grad_norms"])
    mat = np.zeros((len(schemes), n_layers))
    for i, scheme in enumerate(schemes):
        for j, g in enumerate(runs[scheme]["initial_grad_norms"]):
            rms = g["grad_rms"]
            mat[i, j] = np.log10(rms) if rms > 0 else -20.0

    fig, ax = plt.subplots(figsize=(11, 5.2))
    im = ax.imshow(mat, aspect="auto", cmap="RdYlBu_r", vmin=-14, vmax=2)
    ax.set_xticks(range(n_layers))
    ax.set_xticklabels([str(j + 1) for j in range(n_layers)], fontsize=15)
    ax.set_yticks(range(len(schemes)))
    ax.set_yticklabels([DEMO_LABEL[s] for s in schemes], fontsize=16)
    ax.set_xlabel("Layer (1 = gần input nhất, 11 = output)", fontsize=16)
    ax.set_title("log$_{10}$(RMS gradient) theo layer × scheme — 10 hidden layer, ReLU",
                 fontsize=17)
    cbar = fig.colorbar(im, ax=ax)
    cbar.ax.tick_params(labelsize=13)
    cbar.set_label(r"$\log_{10}$(RMS gradient)", fontsize=14)
    for i in range(len(schemes)):
        for j in range(n_layers):
            ax.text(j, i, f"{mat[i, j]:.1f}", ha="center", va="center", fontsize=10,
                     color="white" if mat[i, j] < -6 or mat[i, j] > -1 else "black")
    fig.tight_layout()
    out = FIG_DIR / "gradient_heatmap_slide.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    return out


def make_deep_demo_accuracy_slide(runs: dict) -> Path:
    fig, ax = plt.subplots(figsize=(9, 6.2))
    for scheme in DEMO_SCHEMES:
        r = runs[scheme]
        epochs = [h["epoch"] for h in r["history"]]
        val_acc = [h["val_acc"] for h in r["history"]]
        ax.plot(epochs, val_acc, color=DEMO_COLOR[scheme], marker="o", markersize=7,
                linewidth=2.8, label=DEMO_LABEL[scheme])
    ax.axhline(0.10, color="black", linestyle=":", linewidth=2, label="Mức ngẫu nhiên")
    ax.set_xlabel("Epoch", fontsize=17)
    ax.set_ylabel("Validation Accuracy", fontsize=17)
    ax.set_title("Cùng kiến trúc (10 hidden layer, ReLU) — chỉ đổi cách khởi tạo", fontsize=17)
    ax.tick_params(axis="both", labelsize=15)
    ax.legend(loc="center right", frameon=False, fontsize=13)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    out = FIG_DIR / "deep_demo_accuracy_slide.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    return out


def make_activation_variance_slide(runs: dict) -> Path:
    """Var(A^(l)) theo layer, tai buoc khoi tao -- bang chung THEO FORWARD PASS
    cho cung cau chuyen initialization dang duoc ke bang gradient (backward).
    Bo qua 'zero' (moi activation dung bang 0, khong ve duoc tren thang log)."""
    schemes = ["random_normal", "random_large", "xavier", "he"]
    fig, ax = plt.subplots(figsize=(9, 6.2))
    for scheme in schemes:
        stats = runs[scheme]["initial_activation_stats"]
        layers = [s["layer"] for s in stats]
        var = [max(s["var"], 1e-20) for s in stats]
        ax.plot(layers, var, color=DEMO_COLOR[scheme], marker="o", markersize=8,
                linewidth=2.8, label=DEMO_LABEL[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Layer (1 = gần input nhất, 10 = lớp ẩn cuối)", fontsize=17)
    ax.set_ylabel("Var(A⁽ˡ⁾), tại khởi tạo (log)", fontsize=17)
    ax.set_title("Activation variance theo layer — bằng chứng phía FORWARD PASS", fontsize=16.5)
    ax.tick_params(axis="both", labelsize=15)
    ax.legend(loc="best", frameon=False, fontsize=14)
    ax.grid(alpha=0.3, which="both")
    fig.tight_layout()
    out = FIG_DIR / "activation_variance_slide.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    return out


def make_depth_v2_slide() -> Path:
    rows = json.loads((LOG_DIR / "depth_experiment_v2.json").read_text(encoding="utf-8"))
    scheme_order = ["random_normal", "xavier", "he"]
    label = {"random_normal": "Random (naive)", "xavier": "Xavier/Glorot", "he": "He/Kaiming"}
    color = {"random_normal": "#e07b39", "xavier": "#55a868", "he": "#c44e52"}
    fig, ax = plt.subplots(figsize=(9, 6.2))
    for scheme in scheme_order:
        pts = sorted([r for r in rows if r["scheme"] == scheme], key=lambda r: r["depth"])
        depths = [r["depth"] for r in pts]
        grms = [max(r["grad_rms_layer1_init"], 1e-20) for r in pts]
        ax.plot(depths, grms, color=color[scheme], marker="o", markersize=8,
                linewidth=2.8, label=label[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Độ sâu mạng (số hidden layer)", fontsize=17)
    ax.set_ylabel("RMS gradient lớp 1, tại khởi tạo (log)", fontsize=17)
    ax.set_title("Random vs. Xavier vs. He — gradient co lại theo độ sâu", fontsize=17)
    ax.tick_params(axis="both", labelsize=15)
    ax.legend(loc="best", frameon=False, fontsize=14)
    ax.grid(alpha=0.3, which="both")
    fig.tight_layout()
    out = FIG_DIR / "depth_comparison_v2_slide.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    return out


if __name__ == "__main__":
    runs = load_demo_runs()
    p1 = make_gradient_heatmap_slide(runs)
    p2 = make_deep_demo_accuracy_slide(runs)
    p3 = make_depth_v2_slide()
    p4 = make_activation_variance_slide(runs)
    for p in (p1, p2, p3, p4):
        print("saved", p)
