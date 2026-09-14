"""Reproducibility, data loading (Fashion-MNIST subset) va training loop
dung chung cho toan bo luoi 20 cau hinh (Phase 3 - Phase 5).
"""
from __future__ import annotations

import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from torchvision import datasets, transforms

from .metrics import accuracy, activation_stats, grad_norms_per_layer, weight_stats
from .models import MLP

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Sieu tham so co dinh cho MOI trong 20 cau hinh (Phase 3) -- khong duoc
# tinh chinh rieng cho tung cau hinh, dung yeu cau "fair experiment".
SEED = 42
N_TRAIN = 5000
N_VAL = 1000
N_TEST = 2000
BATCH_SIZE = 128
EPOCHS = 15
LR = 0.05


def set_seed(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.use_deterministic_algorithms(True, warn_only=True)


def _stratified_indices(labels: np.ndarray, n_per_class: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    idx = []
    for c in np.unique(labels):
        cls_idx = np.where(labels == c)[0]
        chosen = rng.choice(cls_idx, size=n_per_class, replace=False)
        idx.append(chosen)
    idx = np.concatenate(idx)
    rng.shuffle(idx)
    return idx


@dataclass
class FashionMNISTSubset:
    X_train: torch.Tensor
    y_train: torch.Tensor
    X_val: torch.Tensor
    y_val: torch.Tensor
    X_test: torch.Tensor
    y_test: torch.Tensor
    mean: float
    std: float


def load_fashion_mnist_subset(seed: int = SEED) -> FashionMNISTSubset:
    """Tai Fashion-MNIST (torchvision, tu dong download vao data/), lay
    subset can bang lop (stratified), CHUAN HOA bang mean/std tinh TRUC
    TIEP tu chinh subset train (khong dung so lieu tra cuu tu nguon khac
    -- tranh moi rui ro trich dan sai, dong thoi dung thuc hanh chuan:
    thong ke chuan hoa phai den tu du lieu train).

    Tra ve: 5000 train / 1000 val / 2000 test, moi mau flatten (784,),
    khoang 500-600 mau/lop tuy tap con.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    to_tensor = transforms.ToTensor()
    train_full = datasets.FashionMNIST(DATA_DIR, train=True, download=True, transform=to_tensor)
    test_full = datasets.FashionMNIST(DATA_DIR, train=False, download=True, transform=to_tensor)

    train_labels = train_full.targets.numpy()
    test_labels = test_full.targets.numpy()

    # 6000 train (600/lop) -> 5000 train + 1000 val; 2000 test (200/lop)
    train_idx = _stratified_indices(train_labels, n_per_class=600, seed=seed)
    test_idx = _stratified_indices(test_labels, n_per_class=200, seed=seed)

    train_imgs = train_full.data[train_idx].float() / 255.0  # (6000,28,28)
    train_y = train_full.targets[train_idx]
    test_imgs = test_full.data[test_idx].float() / 255.0
    test_y = test_full.targets[test_idx]

    rng = np.random.default_rng(seed)
    perm = rng.permutation(len(train_idx))
    val_pos, train_pos = perm[:N_VAL], perm[N_VAL:N_VAL + N_TRAIN]

    X_train_raw = train_imgs[train_pos].reshape(len(train_pos), -1)
    X_val_raw = train_imgs[val_pos].reshape(len(val_pos), -1)
    X_test_raw = test_imgs.reshape(len(test_imgs), -1)

    mean = float(X_train_raw.mean())
    std = float(X_train_raw.std())

    def norm(x: torch.Tensor) -> torch.Tensor:
        return (x - mean) / std

    return FashionMNISTSubset(
        X_train=norm(X_train_raw), y_train=train_y[train_pos],
        X_val=norm(X_val_raw), y_val=train_y[val_pos],
        X_test=norm(X_test_raw), y_test=test_y,
        mean=mean, std=std,
    )


FASHION_MNIST_CLASSES = [
    "T-shirt/top", "Trouser", "Pullover", "Dress", "Coat",
    "Sandal", "Shirt", "Sneaker", "Bag", "Ankle boot",
]


def _make_loader(X: torch.Tensor, y: torch.Tensor, batch_size: int, shuffle: bool,
                  seed: int) -> DataLoader:
    ds = TensorDataset(X, y)
    g = torch.Generator()
    g.manual_seed(seed)
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle, generator=g)


@torch.no_grad()
def evaluate(model: MLP, loader: DataLoader, criterion: nn.Module) -> Tuple[float, float]:
    model.eval()
    total_loss, total_acc, n = 0.0, 0.0, 0
    for xb, yb in loader:
        logits = model(xb)
        loss = criterion(logits, yb)
        bs = xb.shape[0]
        total_loss += loss.item() * bs
        total_acc += accuracy(logits, yb) * bs
        n += bs
    return total_loss / n, total_acc / n


def train_one_config(
    activation: str,
    scheme: str,
    data: FashionMNISTSubset,
    epochs: int = EPOCHS,
    lr: float = LR,
    batch_size: int = BATCH_SIZE,
    seed: int = SEED,
    log_fn=None,
    hidden_dims=None,
) -> Dict:
    """Huan luyen 1 cau hinh (activation, initialization) tren cung 1 bo
    du lieu/sieu tham so. Tra ve dict log day du (epoch-by-epoch + so lieu
    layer-wise tai buoc dau tien) -- ghi thang ra JSON o experiments/.

    `hidden_dims`: None = kien truc mac dinh (6 lop an x 128, Muc 7.2 report);
    truyen list khac de dung cho thi nghiem do sau (experiments/run_depth_experiment.py).
    """
    set_seed(seed)
    model = MLP(activation=activation, hidden_dims=hidden_dims)
    model.apply_initialization(scheme)  # ghi de init mac dinh cua PyTorch

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(model.parameters(), lr=lr)

    train_loader = _make_loader(data.X_train, data.y_train, batch_size, True, seed)
    val_loader = _make_loader(data.X_val, data.y_val, batch_size, False, seed)

    history: List[Dict] = []

    # --- do layer-wise metric tai buoc dau tien (TRUOC khi update nao) ---
    first_xb, first_yb = next(iter(train_loader))
    model.train()
    logits0, zs0, as0 = model.forward_with_intermediates(first_xb)
    loss0 = criterion(logits0, first_yb)
    optimizer.zero_grad()
    loss0.backward()
    initial_grad_norms = grad_norms_per_layer(model)
    initial_activation_stats = activation_stats(as0)
    initial_weight_stats = weight_stats(model)

    # Mau tho (raw sample) cua 1 layer giua mang, dung ve histogram
    # (Experiment 7: "Histogram cua gradient", "Histogram cua activation").
    mid = len(model.linears) // 2
    mid_grad_sample = model.linears[mid].weight.grad.detach().flatten().numpy()
    mid_act_sample = as0[mid + 1].detach().flatten().numpy()
    rng_sample = np.random.default_rng(seed)
    if mid_grad_sample.size > 2000:
        mid_grad_sample = rng_sample.choice(mid_grad_sample, size=2000, replace=False)
    if mid_act_sample.size > 2000:
        mid_act_sample = rng_sample.choice(mid_act_sample, size=2000, replace=False)

    optimizer.zero_grad()  # khong ap dung buoc update "do" nay vao training that

    t0 = time.time()
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss, running_acc, n = 0.0, 0.0, 0
        for xb, yb in train_loader:
            optimizer.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()
            bs = xb.shape[0]
            running_loss += loss.item() * bs
            running_acc += accuracy(logits, yb) * bs
            n += bs
        train_loss, train_acc = running_loss / n, running_acc / n
        val_loss, val_acc = evaluate(model, val_loader, criterion)
        history.append({
            "epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
            "val_loss": val_loss, "val_acc": val_acc,
        })
        if log_fn:
            log_fn(activation, scheme, epoch, epochs, train_loss, train_acc, val_loss, val_acc)

    test_loader = _make_loader(data.X_test, data.y_test, batch_size, False, seed)
    test_loss, test_acc = evaluate(model, test_loader, criterion)
    elapsed = time.time() - t0

    return {
        "activation": activation,
        "scheme": scheme,
        "hyperparams": {"epochs": epochs, "lr": lr, "batch_size": batch_size, "seed": seed},
        "history": history,
        "test_loss": test_loss,
        "test_acc": test_acc,
        "initial_grad_norms": initial_grad_norms,
        "initial_activation_stats": initial_activation_stats,
        "initial_weight_stats": initial_weight_stats,
        "mid_layer_index": mid + 1,
        "mid_grad_sample": mid_grad_sample.tolist(),
        "mid_act_sample": mid_act_sample.tolist(),
        "elapsed_sec": elapsed,
    }
