"""Sinh them 2 hinh moi cho ban bao cao mo rong (~50 trang), dung du lieu
THAT da co san (khong chay lai thi nghiem):

1. small_multiples_loss.png -- luoi 5x4 loss curve (train+val) cho toan bo
   20 cau hinh, dung file JSON da luu trong results/logs/run_*.json.
2. fashion_mnist_samples.png -- luoi anh mau that tu Fashion-MNIST (dataset
   da tai ve trong data/), 1 hang/lop, kem ten lop.

Chay: python experiments/make_extra_figures.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from src.visualization import ACT_ORDER, ACT_LABEL, SCHEME_ORDER, SCHEME_LABEL, SCHEME_COLOR, FIG_DIR  # noqa: E402
from src.training import FASHION_MNIST_CLASSES  # noqa: E402

LOG_DIR = ROOT / "results" / "logs"


def load_all_runs():
    runs = {}
    for scheme in SCHEME_ORDER:
        for act in ACT_ORDER:
            p = LOG_DIR / f"run_{scheme}_{act}.json"
            runs[(scheme, act)] = json.loads(p.read_text(encoding="utf-8"))
    return runs


def make_small_multiples(runs):
    fig, axes = plt.subplots(len(SCHEME_ORDER), len(ACT_ORDER), figsize=(14, 14), sharex=True)
    for i, scheme in enumerate(SCHEME_ORDER):
        for j, act in enumerate(ACT_ORDER):
            ax = axes[i, j]
            r = runs[(scheme, act)]
            epochs = [h["epoch"] for h in r["history"]]
            train_loss = [h["train_loss"] for h in r["history"]]
            val_loss = [h["val_loss"] for h in r["history"]]
            ax.plot(epochs, train_loss, color=SCHEME_COLOR[scheme], linewidth=1.3, label="train")
            ax.plot(epochs, val_loss, color=SCHEME_COLOR[scheme], linewidth=1.0, linestyle="--", alpha=0.7, label="val")
            ax.set_ylim(0, 2.5)
            ax.tick_params(labelsize=7)
            if i == 0:
                ax.set_title(ACT_LABEL[act], fontsize=11)
            if j == 0:
                ax.set_ylabel(SCHEME_LABEL[scheme], fontsize=10)
            ax.grid(alpha=0.2)
    fig.suptitle("Loss theo epoch — toàn bộ 20 cấu hình (nét liền = train, nét đứt = validation)", fontsize=13)
    fig.tight_layout(rect=[0, 0, 1, 0.97])
    out = FIG_DIR / "small_multiples_loss.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("saved", out)


def make_fashion_mnist_samples():
    from torchvision import datasets, transforms
    ds = datasets.FashionMNIST(ROOT / "data", train=True, download=False, transform=transforms.ToTensor())
    labels = ds.targets.numpy()
    rng = np.random.default_rng(0)
    n_cols = 8
    fig, axes = plt.subplots(10, n_cols, figsize=(n_cols * 1.1, 10 * 1.25))
    for c in range(10):
        idx = rng.choice(np.where(labels == c)[0], size=n_cols, replace=False)
        for k, ii in enumerate(idx):
            ax = axes[c, k]
            img = ds.data[ii].numpy()
            ax.imshow(img, cmap="gray")
            ax.axis("off")
        axes[c, 0].set_ylabel(FASHION_MNIST_CLASSES[c], fontsize=9, rotation=0, ha="right", va="center")
        axes[c, 0].axis("on")
        axes[c, 0].set_xticks([]); axes[c, 0].set_yticks([])
        for spine in axes[c, 0].spines.values():
            spine.set_visible(False)
    fig.suptitle("Fashion-MNIST — mẫu ảnh thật theo từng lớp (8 mẫu/lớp)", fontsize=13)
    fig.tight_layout(rect=[0, 0, 1, 0.97])
    out = FIG_DIR / "fashion_mnist_samples.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("saved", out)


if __name__ == "__main__":
    runs = load_all_runs()
    make_small_multiples(runs)
    make_fashion_mnist_samples()
