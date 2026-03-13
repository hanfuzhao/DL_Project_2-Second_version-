# SafeType — AI-Powered Content Safety Detection for Children

An NLP system that detects **10 categories** of harmful or sensitive content in real-time (clean, racism, sexism, profanity, cyberbullying, toxicity, hate speech, implicit hate, threat, sarcasm), designed to protect children in online chat environments.

## Project Structure

```
├── README.md               <- This file
├── requirements.txt        <- Python dependencies
├── setup.py                <- Runs full pipeline (data → features → models → experiments)
├── main.py                 <- Main entry point for inference (interactive / single / batch)
├── scripts/
│   ├── make_dataset.py     <- Loads and combines raw datasets into unified 10-class format
│   ├── build_features.py   <- Text cleaning, TF-IDF extraction, handcrafted features
│   ├── model.py            <- Trains and evaluates all three models
│   └── experiment.py       <- Training size sensitivity + noise robustness experiments
├── models/                 <- Trained model artifacts (see "Models" section below)
├── data/
│   ├── raw/                <- Raw datasets (not tracked in git)
│   ├── processed/          <- Cleaned and feature-engineered data (LFS for large CSV)
│   └── outputs/            <- Evaluation results, plots, confusion matrices
├── notebooks/              <- EDA and exploration (eda.ipynb — 10-class analysis)
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
1. `make_dataset.py` — combines 8 data sources into a unified **10-class** dataset
2. `build_features.py` — text cleaning, TF-IDF vectorization, handcrafted features
3. `model.py` — trains Naive Baseline, Logistic Regression, and DistilBERT (10-way classification)
4. `experiment.py` — training size sensitivity and noise robustness experiments

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

Output: predicted **label** (one of 10 categories) and **confidence** plus top-3 class probabilities.

## Models

Three modeling approaches are implemented and evaluated (all **10-class**):

| # | Type | Model | File(s) in `models/` | Accuracy | Weighted F1 |
|---|------|-------|----------------------|----------|-------------|
| 1 | **Naive Baseline** | Keyword-matching + majority class | `naive_baseline.pkl` | ~0.21 | ~0.17 |
| 2 | **Classical ML** | TF-IDF + Logistic Regression | `logistic_regression.pkl` + `tfidf_vectorizer.pkl` | ~0.63 | ~0.62 |
| 3 | **Neural Network** | Fine-tuned DistilBERT | `distilbert-toxicity/` (directory) | ~0.72 | ~0.72 |

### Where to find each model in code

- **Naive Baseline** → `scripts/model.py`, class `NaiveBaseline`
- **Classical ML** → `scripts/model.py`, function `train_classical_model()`
- **Deep Learning** → `scripts/model.py`, function `train_distilbert()`

## Label Taxonomy (10 classes)

| Label | Description |
|-------|-------------|
| `clean` | Safe, non-harmful content |
| `racism` | Racial hate or discrimination |
| `sexism` | Sexist or misogynistic content |
| `profanity` | Obscene or swear words |
| `cyberbullying` | Insults, personal attacks |
| `toxicity` | Generally toxic language |
| `hate_speech` | Generic hate speech |
| `implicit_hate` | Implicit or indirect hate |
| `threat` | Threats, aggression |
| `sarcasm` | Sarcastic or ironic (often context-dependent) |

## Data Sources

- **Davidson et al.** — `labeled_data.csv` (24,783 tweets)
- **Jigsaw Toxic Comment (v1)** — `train.csv.zip` (159,571 comments, multi-label)
- **Jigsaw Unintended Bias (v2)** — `train.csv` (sampled 100,000)
- **UC Berkeley D-Lab Measuring Hate Speech** — 39,565 comments (HuggingFace)
- **EDOS** — Explainable Detection of Online Sexism, 20,000 posts (Gab & Reddit)
- **HateXplain** — 20,148 posts with target-community annotations (GitHub/HuggingFace)
- **ImplicitHate** — 6,346 implicit hate tweets (HuggingFace)
- **TweetEval irony** — ~4,601 tweets for sarcasm/irony (HuggingFace)

Combined: ~375k samples → balanced to 50,000 (5,000 per class).

## Experiments

1. **Training Set Size Sensitivity** — Logistic Regression F1 grows from ~0.36 (1% data) to ~0.62 (100%).
2. **Noise Robustness** — F1 drops from ~0.62 (clean) to ~0.22 (30% character noise).

Results and plots are saved in `data/outputs/`.
