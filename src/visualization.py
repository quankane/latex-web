"""Sinh 8 loai bieu do bat buoc (xem README / de bai muc REQUIRED
VISUALIZATIONS) tu cac file log JSON trong `results/logs/`. Moi ham luu
truc tiep ra PNG trong `results/figures/`, dung chung cho ca report LaTeX
va slide PPTX (mot nguon hinh anh duy nhat).
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import matplotlib.pyplot as plt
import numpy as np

FIG_DIR = Path(__file__).resolve().parent.parent / "results" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

SCHEME_ORDER = ["zero", "random_normal", "lecun", "xavier", "he"]
SCHEME_LABEL = {
    "zero": "Zero", "random_normal": "Random (naive)", "lecun": "LeCun",
    "xavier": "Xavier/Glorot", "he": "He/Kaiming",
}
SCHEME_COLOR = {
    "zero": "#999999", "random_normal": "#e07b39", "lecun": "#4c72b0",
    "xavier": "#55a868", "he": "#c44e52",
}
ACT_ORDER = ["sigmoid", "tanh", "relu", "leaky_relu"]
ACT_LABEL = {
    "sigmoid": "Sigmoid", "tanh": "Tanh", "relu": "ReLU",
    "leaky_relu": "Leaky ReLU",
}

plt.rcParams.update({
    "font.size": 11,
    "axes.titlesize": 12,
    "axes.labelsize": 11,
    "legend.fontsize": 9,
    "figure.dpi": 150,
    "savefig.bbox": "tight",
})


def _by_key(runs: List[Dict]) -> Dict[tuple, Dict]:
    return {(r["scheme"], r["activation"]): r for r in runs}


def plot_loss_curves(runs: List[Dict], activation: str, out_name: str = "loss_comparison.png") -> Path:
    idx = _by_key(runs)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for scheme in SCHEME_ORDER:
        r = idx.get((scheme, activation))
        if r is None:
            continue
        epochs = [h["epoch"] for h in r["history"]]
        train_loss = [h["train_loss"] for h in r["history"]]
        val_loss = [h["val_loss"] for h in r["history"]]
        ax.plot(epochs, train_loss, color=SCHEME_COLOR[scheme],
                label=f"{SCHEME_LABEL[scheme]} (train)")
        ax.plot(epochs, val_loss, color=SCHEME_COLOR[scheme], linestyle="--",
                alpha=0.7)
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Cross-Entropy Loss")
    ax.set_title(f"Loss theo epoch — activation = {ACT_LABEL[activation]}\n"
                 f"(nét liền = train, nét đứt = validation)")
    ax.legend(loc="upper right", frameon=False)
    ax.grid(alpha=0.25)
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_accuracy_curves(runs: List[Dict], activation: str, out_name: str = "accuracy_comparison.png") -> Path:
    idx = _by_key(runs)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for scheme in SCHEME_ORDER:
        r = idx.get((scheme, activation))
        if r is None:
            continue
        epochs = [h["epoch"] for h in r["history"]]
        val_acc = [h["val_acc"] for h in r["history"]]
        ax.plot(epochs, val_acc, color=SCHEME_COLOR[scheme], marker="o",
                markersize=3, label=SCHEME_LABEL[scheme])
    ax.axhline(0.10, color="black", linestyle=":", linewidth=1,
               label="Mức ngẫu nhiên (10 lớp)")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Validation Accuracy")
    ax.set_title(f"Accuracy theo epoch — activation = {ACT_LABEL[activation]}")
    ax.legend(loc="lower right", frameon=False)
    ax.grid(alpha=0.25)
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_gradient_norm_by_layer(runs: List[Dict], activation: str, out_name: str = "gradient_norm.png") -> Path:
    idx = _by_key(runs)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for scheme in SCHEME_ORDER:
        r = idx.get((scheme, activation))
        if r is None:
            continue
        gn = r["initial_grad_norms"]
        layers = [g["layer"] for g in gn]
        rms = [g["grad_rms"] for g in gn]
        ax.plot(layers, rms, color=SCHEME_COLOR[scheme], marker="o",
                label=SCHEME_LABEL[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Lớp (1 = gần input nhất, 7 = output)")
    ax.set_ylabel(r"RMS$(\partial L/\partial W^{(l)})$  (thang log)")
    ax.set_title(f"Độ lớn gradient trung bình mỗi trọng số, theo layer\n"
                 f"(bước đầu tiên) — activation = {ACT_LABEL[activation]}")
    ax.legend(loc="best", frameon=False)
    ax.grid(alpha=0.25, which="both")
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_activation_variance_by_layer(runs: List[Dict], activation: str,
                                       out_name: str = "activation_variance.png") -> Path:
    idx = _by_key(runs)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for scheme in SCHEME_ORDER:
        r = idx.get((scheme, activation))
        if r is None:
            continue
        st = r["initial_activation_stats"]
        layers = [s["layer"] for s in st]
        var = [s["var"] for s in st]
        ax.plot(layers, var, color=SCHEME_COLOR[scheme], marker="o",
                label=SCHEME_LABEL[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Lớp (1 = gần input nhất)")
    ax.set_ylabel(r"$\mathrm{Var}(A^{(l)})$  (thang log)")
    ax.set_title(f"Phương sai activation theo layer, tại bước đầu tiên\n"
                 f"activation = {ACT_LABEL[activation]}")
    ax.legend(loc="best", frameon=False)
    ax.grid(alpha=0.25, which="both")
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_weight_variance_by_layer(runs: List[Dict], activation: str,
                                   out_name: str = "weight_variance.png") -> Path:
    idx = _by_key(runs)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for scheme in SCHEME_ORDER:
        r = idx.get((scheme, activation))
        if r is None:
            continue
        st = r["initial_weight_stats"]
        layers = [s["layer"] for s in st]
        var = [s["var"] for s in st]
        ax.plot(layers, var, color=SCHEME_COLOR[scheme], marker="o",
                label=SCHEME_LABEL[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Lớp (1 = gần input nhất)")
    ax.set_ylabel(r"$\mathrm{Var}(W^{(l)})$  (thang log)")
    ax.set_title(f"Phương sai trọng số theo layer (đo thực tế sau khởi tạo)\n"
                 f"activation = {ACT_LABEL[activation]}")
    ax.legend(loc="best", frameon=False)
    ax.grid(alpha=0.25, which="both")
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_initialization_comparison(runs: List[Dict], out_name: str = "initialization_comparison.png") -> Path:
    """Bieu do cot nhom: test accuracy cuoi cung, 5 scheme x 4 activation
    -- "buc tranh lon" tong hop toan bo luoi 20 cau hinh."""
    idx = _by_key(runs)
    fig, ax = plt.subplots(figsize=(8.5, 4.6))
    n_schemes = len(SCHEME_ORDER)
    width = 0.8 / n_schemes
    x = np.arange(len(ACT_ORDER))
    for i, scheme in enumerate(SCHEME_ORDER):
        accs = []
        for act in ACT_ORDER:
            r = idx.get((scheme, act))
            accs.append(r["test_acc"] if r else np.nan)
        ax.bar(x + i * width - 0.4 + width / 2, accs, width=width,
               color=SCHEME_COLOR[scheme], label=SCHEME_LABEL[scheme])
    ax.axhline(0.10, color="black", linestyle=":", linewidth=1)
    ax.set_xticks(x)
    ax.set_xticklabels([ACT_LABEL[a] for a in ACT_ORDER])
    ax.set_ylabel("Test Accuracy")
    ax.set_title("So sánh Initialization × Activation (test accuracy, 15 epoch)")
    ax.legend(loc="upper left", bbox_to_anchor=(1.01, 1.0), frameon=False)
    ax.grid(alpha=0.25, axis="y")
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_gradient_histogram(runs: List[Dict], activation: str,
                             out_name: str = "gradient_histogram.png") -> Path:
    idx = _by_key(runs)
    fig, axes = plt.subplots(1, len(SCHEME_ORDER), figsize=(16, 3.2), sharey=True)
    for ax, scheme in zip(axes, SCHEME_ORDER):
        r = idx.get((scheme, activation))
        if r is None:
            continue
        sample = r["mid_grad_sample"]
        ax.hist(sample, bins=40, color=SCHEME_COLOR[scheme])
        ax.set_title(SCHEME_LABEL[scheme], fontsize=10)
        ax.set_xlabel(f"$\\partial L/\\partial W^{{({r['mid_layer_index']})}}$")
    axes[0].set_ylabel("Số lượng")
    fig.suptitle(f"Phân phối gradient tại lớp giữa mạng — activation = {ACT_LABEL[activation]}")
    fig.tight_layout()
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_activation_histogram(runs: List[Dict], activation: str,
                               out_name: str = "activation_histogram.png") -> Path:
    idx = _by_key(runs)
    fig, axes = plt.subplots(1, len(SCHEME_ORDER), figsize=(16, 3.2), sharey=True)
    for ax, scheme in zip(axes, SCHEME_ORDER):
        r = idx.get((scheme, activation))
        if r is None:
            continue
        sample = r["mid_act_sample"]
        ax.hist(sample, bins=40, color=SCHEME_COLOR[scheme])
        ax.set_title(SCHEME_LABEL[scheme], fontsize=10)
        ax.set_xlabel(f"$A^{{({r['mid_layer_index']})}}$")
    axes[0].set_ylabel("Số lượng")
    fig.suptitle(f"Phân phối activation tại lớp giữa mạng — activation = {ACT_LABEL[activation]}")
    fig.tight_layout()
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


DEMO_SCHEME_ORDER = ["zero", "random_normal", "random_large", "xavier", "he"]
DEMO_SCHEME_LABEL = {
    "zero": "Zero", "random_normal": "Random\n(small, 0.01)",
    "random_large": "Random\n(large, 1.0)", "xavier": "Xavier", "he": "He",
}


def plot_gradient_heatmap(demo_runs: Dict[str, Dict], out_name: str = "gradient_heatmap.png") -> Path:
    """Heatmap |grad RMS| (log10) x (scheme, layer) -- dung du lieu that tu
    experiments/run_deep_demo.py (10 hidden layer, 5 scheme). `demo_runs`:
    dict scheme -> run dict (nhu tra ve tu train_one_config)."""
    schemes = [s for s in DEMO_SCHEME_ORDER if s in demo_runs]
    n_layers = len(demo_runs[schemes[0]]["initial_grad_norms"])
    mat = np.zeros((len(schemes), n_layers))
    for i, scheme in enumerate(schemes):
        gn = demo_runs[scheme]["initial_grad_norms"]
        for j, g in enumerate(gn):
            rms = g["grad_rms"]
            mat[i, j] = np.log10(rms) if rms > 0 else -20.0  # -20 lam san cho "dung 0" (Zero-init)

    fig, ax = plt.subplots(figsize=(9.5, 4.2))
    im = ax.imshow(mat, aspect="auto", cmap="RdYlBu_r", vmin=-14, vmax=2)
    ax.set_xticks(range(n_layers))
    ax.set_xticklabels([str(j + 1) for j in range(n_layers)])
    ax.set_yticks(range(len(schemes)))
    ax.set_yticklabels([DEMO_SCHEME_LABEL[s] for s in schemes])
    ax.set_xlabel("Lớp (1 = gần input nhất)")
    ax.set_title("log$_{10}$(RMS gradient) theo layer × scheme khởi tạo\n"
                  "(bước đầu tiên, 10 hidden layer, activation = ReLU)")
    cbar = fig.colorbar(im, ax=ax)
    cbar.set_label(r"$\log_{10}(\mathrm{RMS}\ \partial L/\partial W^{(l)})$")
    for i in range(len(schemes)):
        for j in range(n_layers):
            ax.text(j, i, f"{mat[i, j]:.1f}", ha="center", va="center", fontsize=7.5,
                     color="white" if mat[i, j] < -6 or mat[i, j] > -1 else "black")
    fig.tight_layout()
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def plot_depth_comparison_v2(rows: List[Dict], out_name: str = "depth_comparison_v2.png") -> Path:
    """Gradient RMS lop 1 (khoi tao) theo do sau, 3 scheme (random_normal,
    xavier, he), dung du lieu tu results/logs/depth_experiment_v2.json."""
    scheme_order = ["random_normal", "xavier", "he"]
    label = {"random_normal": "Random (naive)", "xavier": "Xavier/Glorot", "he": "He/Kaiming"}
    color = {"random_normal": "#e07b39", "xavier": "#55a868", "he": "#c44e52"}
    fig, ax = plt.subplots(figsize=(7.2, 4.6))
    for scheme in scheme_order:
        pts = [r for r in rows if r["scheme"] == scheme]
        pts.sort(key=lambda r: r["depth"])
        depths = [r["depth"] for r in pts]
        grms = [max(r["grad_rms_layer1_init"], 1e-20) for r in pts]
        ax.plot(depths, grms, color=color[scheme], marker="o", label=label[scheme])
    ax.set_yscale("log")
    ax.set_xlabel("Độ sâu mạng (số hidden layer)")
    ax.set_ylabel("RMS gradient lớp 1, tại khởi tạo (thang log)")
    ax.set_title("Gradient lớp đầu tiên co lại theo độ sâu — Random vs. Xavier vs. He\n"
                  "(activation = ReLU, đo tại bước khởi tạo, chưa train)")
    ax.legend(loc="best", frameon=False)
    ax.grid(alpha=0.25, which="both")
    fig.tight_layout()
    out = FIG_DIR / out_name
    fig.savefig(out)
    plt.close(fig)
    return out


def generate_all_figures(runs: List[Dict]) -> List[Path]:
    """Sinh toan bo hinh bat buoc. Lat cat chinh: activation='relu' (so
    initialization, khop Experiment 1-5/7/8); rieng initialization_comparison
    dung ca luoi 20 cau hinh."""
    paths = []
    paths.append(plot_loss_curves(runs, "relu"))
    paths.append(plot_accuracy_curves(runs, "relu"))
    paths.append(plot_gradient_norm_by_layer(runs, "sigmoid"))  # vanishing ro nhat
    paths.append(plot_activation_variance_by_layer(runs, "sigmoid"))
    paths.append(plot_weight_variance_by_layer(runs, "relu"))
    paths.append(plot_initialization_comparison(runs))
    paths.append(plot_gradient_histogram(runs, "sigmoid"))
    paths.append(plot_activation_histogram(runs, "sigmoid"))
    return paths
