# SafeType — AI-Powered Content Safety Detection for Children

An NLP system that detects hate speech, offensive language, and cyberbullying in real-time, designed to protect children in online chat environments.

## Project Structure

```
├── README.md               <- This file
├── requirements.txt        <- Python dependencies
├── setup.py                <- Runs full pipeline (data → features → models → experiments)
├── main.py                 <- Main entry point for inference (interactive / single / batch)
├── scripts/
│   ├── make_dataset.py     <- Loads and combines raw datasets into unified format
│   ├── build_features.py   <- Text cleaning, TF-IDF extraction, handcrafted features
│   ├── model.py            <- Trains and evaluates all three models
│   └── experiment.py       <- Training size sensitivity + noise robustness experiments
├── models/                 <- Trained model artifacts (see "Models" section below)
├── data/
│   ├── raw/                <- Raw datasets (not tracked in git)
│   ├── processed/          <- Cleaned and feature-engineered data
│   └── outputs/            <- Evaluation results, plots, confusion matrices
├── notebooks/              <- Exploration notebooks (not graded)
└── .gitignore
```

## Setup & Run

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the full pipeline (data → features → train → experiment)

```bash
python setup.py
```

This runs all four pipeline steps in order:
1. `make_dataset.py` — combines Davidson hate speech data + Jigsaw v1 + Jigsaw v2
2. `build_features.py` — text cleaning, TF-IDF vectorization, handcrafted features
3. `model.py` — trains Naive Baseline, Logistic Regression, and DistilBERT
4. `experiment.py` — runs training size sensitivity and noise robustness experiments

### 3. Run inference

```bash
# Interactive mode (default: logistic_regression)
python main.py

# Choose a specific model
python main.py --model distilbert

# Analyze a single message
python main.py --text "you are so stupid"

# Batch analysis from a file
python main.py --batch messages.txt
```

## Models

Three modeling approaches are implemented and evaluated, as required:

| # | Type | Model | File(s) in `models/` | Accuracy | F1 |
|---|------|-------|----------------------|----------|----|
| 1 | **Naive Baseline** | Keyword-matching + majority class | `naive_baseline.pkl` | 0.509 | 0.443 |
| 2 | **Classical ML** | TF-IDF + Logistic Regression | `logistic_regression.pkl` + `tfidf_vectorizer.pkl` | 0.744 | 0.740 |
| 3 | **Neural Network** | Fine-tuned DistilBERT | `distilbert-toxicity/` (directory) | 0.790 | 0.790 |

### Where to find each model in code

- **Naive Baseline** → `scripts/model.py`, class `NaiveBaseline`
- **Classical ML** → `scripts/model.py`, function `train_classical_model()`
- **Deep Learning** → `scripts/model.py`, function `train_distilbert()`

## Data Sources

- [Davidson et al. Hate Speech Dataset](https://github.com/t-davidson/hate-speech-and-offensive-language) — `labeled_data.csv` (24,783 tweets, 3 classes)
- [Jigsaw Toxic Comment Classification Challenge](https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge) — `train.csv.zip` (159,571 comments)
- [Jigsaw Unintended Bias in Toxicity](https://www.kaggle.com/c/jigsaw-unintended-bias-in-toxicity-classification) — `train.csv` (sampled 100,000 comments)
- [UC Berkeley D-Lab Measuring Hate Speech](https://huggingface.co/datasets/ucberkeley-dlab/measuring-hate-speech) — 39,565 comments with Rasch-scored hate speech measurements (auto-downloaded via HuggingFace)
- [EDOS — Explainable Detection of Online Sexism](https://github.com/rewire-online/edos) — 20,000 posts from Gab & Reddit (SemEval 2023 Task 10, Kirk et al.)
- [HateXplain](https://huggingface.co/datasets/Hate-speech-CNERG/hatexplain) — 20,148 posts with 3-class labels + rationale annotations (Mathew et al., AAAI 2021)
- [ImplicitHate](https://huggingface.co/datasets/SALT-NLP/ImplicitHate) — 6,346 implicit hate tweets from US extremist groups (ElSherief et al., EMNLP 2021)

Combined dataset: ~370k samples → balanced (equal per class).

## Experiments

1. **Training Set Size Sensitivity** — Logistic Regression F1 goes from 0.54 (1% data) to 0.74 (100%), with diminishing returns after ~60%.
2. **Noise Robustness** — F1 drops from 0.74 (clean) to 0.40 (30% character noise), showing vulnerability to typos and misspellings.

Results and plots are saved in `data/outputs/`.
