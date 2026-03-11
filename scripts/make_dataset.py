"""
Dataset preparation script.
Loads and combines the hate speech / toxicity datasets into a unified format.

Data sources:
- labeled_data.csv: Davidson et al. hate speech dataset (3 classes)
- jigsaw-toxic-comment-classification-challenge: Kaggle Jigsaw toxic comments
- jigsaw-unintended-bias-in-toxicity-classification: Kaggle Jigsaw v2
"""

import os
import zipfile
import pandas as pd
import numpy as np
from pathlib import Path


RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")


def load_davidson_data() -> pd.DataFrame:
    """Load the Davidson hate speech dataset and map to unified labels."""
    path = RAW_DIR / "labeled_data.csv"
    df = pd.read_csv(path, index_col=0)
    label_map = {0: "hate_speech", 1: "offensive", 2: "clean"}
    df["label"] = df["class"].map(label_map)
    df = df.rename(columns={"tweet": "text"})
    df["source"] = "davidson"
    return df[["text", "label", "source"]]


def load_jigsaw_v1() -> pd.DataFrame:
    """Load Jigsaw toxic comment classification challenge data."""
    zip_path = RAW_DIR / "jigsaw-toxic-comment-classification-challenge" / "train.csv.zip"
    if not zip_path.exists():
        print(f"[WARN] Jigsaw v1 zip not found at {zip_path}, skipping.")
        return pd.DataFrame(columns=["text", "label", "source"])

    with zipfile.ZipFile(zip_path, "r") as z:
        with z.open("train.csv") as f:
            df = pd.read_csv(f)

    toxicity_cols = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
    df["toxicity_score"] = df[toxicity_cols].max(axis=1)

    conditions = [
        df["identity_hate"] == 1,
        df["toxicity_score"] == 1,
    ]
    choices = ["hate_speech", "offensive"]
    df["label"] = np.select(conditions, choices, default="clean")

    df = df.rename(columns={"comment_text": "text"})
    df["source"] = "jigsaw_v1"
    return df[["text", "label", "source"]]


def load_jigsaw_v2(sample_size: int = 100_000) -> pd.DataFrame:
    """
    Load Jigsaw unintended bias dataset.
    Uses sampling due to the large file size (~900MB).
    """
    path = RAW_DIR / "jigsaw-unintended-bias-in-toxicity-classification" / "train.csv"
    if not path.exists():
        print(f"[WARN] Jigsaw v2 not found at {path}, skipping.")
        return pd.DataFrame(columns=["text", "label", "source"])

    df = pd.read_csv(path, usecols=["comment_text", "target"], nrows=sample_size)
    df["label"] = df["target"].apply(
        lambda x: "hate_speech" if x >= 0.7 else ("offensive" if x >= 0.4 else "clean")
    )
    df = df.rename(columns={"comment_text": "text"})
    df["source"] = "jigsaw_v2"
    return df[["text", "label", "source"]]


def create_unified_dataset(max_per_source: int = 50_000) -> pd.DataFrame:
    """Combine all data sources into a single dataset with balanced sampling."""
    print("Loading Davidson dataset...")
    davidson = load_davidson_data()
    print(f"  -> {len(davidson)} samples")

    print("Loading Jigsaw v1...")
    jigsaw_v1 = load_jigsaw_v1()
    print(f"  -> {len(jigsaw_v1)} samples")

    print("Loading Jigsaw v2...")
    jigsaw_v2 = load_jigsaw_v2()
    print(f"  -> {len(jigsaw_v2)} samples")

    combined = pd.concat([davidson, jigsaw_v1, jigsaw_v2], ignore_index=True)
    combined = combined.dropna(subset=["text"])
    combined["text"] = combined["text"].astype(str).str.strip()
    combined = combined[combined["text"].str.len() > 5]

    print(f"\nCombined dataset: {len(combined)} samples")
    print(f"Label distribution:\n{combined['label'].value_counts()}")

    return combined


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    dataset = create_unified_dataset()

    output_path = PROCESSED_DIR / "unified_toxicity_data.csv"
    dataset.to_csv(output_path, index=False)
    print(f"\nSaved to {output_path}")

    label_counts = dataset["label"].value_counts()
    min_count = min(label_counts.values.min(), 30_000)
    balanced = dataset.groupby("label").apply(
        lambda x: x.sample(n=min(len(x), min_count), random_state=42)
    ).reset_index(drop=True)

    balanced_path = PROCESSED_DIR / "balanced_toxicity_data.csv"
    balanced.to_csv(balanced_path, index=False)
    print(f"Balanced dataset ({len(balanced)} samples) saved to {balanced_path}")


if __name__ == "__main__":
    main()
