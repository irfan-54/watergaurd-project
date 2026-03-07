import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import numpy as np
import time

# Verify GPU availability
if not torch.cuda.is_available():
    raise RuntimeError("GPU not detected. CUDA required.")

print(f"GPU Available: True")
print(f"GPU Name: {torch.cuda.get_device_name(0)}")
print(f"CUDA Version: {torch.version.cuda}")

# Set device
device = torch.device("cuda")
print(f"Using device: {device}")

# Load and prepare dataset
print("\nLoading dataset...")
dataset_path = "datasets/final_dataset_production_ready.jsonl"

# Load JSONL file
texts = []
labels = []

with open(dataset_path, 'r', encoding='utf-8-sig') as f:
    for line in f:
        record = json.loads(line.strip())
        texts.append(record['text'])
        labels.append(record['label'])

print(f"Loaded {len(texts)} samples")

# Label mapping
label_map = {'leakage': 0, 'contamination': 1, 'blockage': 2, 'other': 3}
reverse_label_map = {0: 'leakage', 1: 'contamination', 2: 'blockage', 3: 'other'}

# Convert labels to numbers
numeric_labels = [label_map[label] for label in labels]

# Split dataset
train_texts, val_texts, train_labels, val_labels = train_test_split(
    texts, numeric_labels, test_size=0.2, random_state=42, stratify=numeric_labels
)

print(f"Training samples: {len(train_texts)}")
print(f"Validation samples: {len(val_texts)}")

# Create datasets
train_dataset = Dataset.from_dict({'text': train_texts, 'label': train_labels})
val_dataset = Dataset.from_dict({'text': val_texts, 'label': val_labels})

# Load tokenizer and model
print("\nLoading XLM-RoBERTa model...")
model_name = 'xlm-roberta-base'
tokenizer = AutoTokenizer.from_pretrained(model_name)
# Define label mappings
id2label = {
    0: "leakage",
    1: "contamination",
    2: "blockage",
    3: "other"
}

label2id = {
    "leakage": 0,
    "contamination": 1,
    "blockage": 2,
    "other": 3
}

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=4,
    id2label=id2label,
    label2id=label2id
)

# Move model to GPU
model.to(device)
print("Model moved to GPU")

# Tokenization function
def tokenize_function(examples):
    return tokenizer(
        examples['text'],
        padding='max_length',
        truncation=True,
        max_length=128
    )

# Tokenize datasets
print("Tokenizing datasets...")
train_dataset = train_dataset.map(tokenize_function, batched=True)
val_dataset = val_dataset.map(tokenize_function, batched=True)

# Remove text column and format
train_dataset = train_dataset.remove_columns(['text'])
val_dataset = val_dataset.remove_columns(['text'])
train_dataset = train_dataset.rename_column('label', 'labels')
val_dataset = val_dataset.rename_column('label', 'labels')
train_dataset.set_format('torch')
val_dataset.set_format('torch')

# Training arguments
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=4,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    learning_rate=2e-5,
    gradient_accumulation_steps=2,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=100,
    eval_strategy="epoch",
    save_strategy="epoch",
    save_total_limit=2,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    fp16=True,  # Mixed precision
    dataloader_pin_memory=True,
)

# Metrics computation
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=1)
    return {
        'accuracy': accuracy_score(labels, predictions)
    }

# Create trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics,
)

# Start training
print(f"\nStarting training...")
print(f"Batch size: {training_args.per_device_train_batch_size}")
print(f"Epochs: {training_args.num_train_epochs}")
print(f"Learning rate: {training_args.learning_rate}")
print("-" * 50)

start_time = time.time()
trainer.train()
training_time = time.time() - start_time

# Save the final best model directly
trainer.save_model("models/xlmr_water_model")
tokenizer.save_pretrained("models/xlmr_water_model")

# Final evaluation
print("\nEvaluating model...")
eval_results = None
predictions = None
labels = None
final_accuracy = None

try:
    eval_results = trainer.evaluate()
    predictions = eval_results['predictions']
    labels = eval_results['labels']
    final_accuracy = eval_results['eval_accuracy']
    print("Evaluation completed successfully")
except Exception as e:
    print(f"Warning: Evaluation failed with error: {e}")
    print("Continuing with model saving...")

# Print metrics
print("\n" + "=" * 50)
print("TRAINING COMPLETED")
print("=" * 50)
print(f"Training time: {training_time:.2f} seconds")

if final_accuracy is not None:
    print(f"Final validation accuracy: {final_accuracy:.4f}")
else:
    print("Final validation accuracy: Not available (evaluation failed)")

# Classification report
if predictions is not None and labels is not None:
    try:
        print("\nClassification Report:")
        class_report = classification_report(
            labels, 
            predictions, 
            target_names=['leakage', 'contamination', 'blockage', 'other'],
            digits=4
        )
        print(class_report)
    except Exception as e:
        print(f"Warning: Classification report failed: {e}")
else:
    print("Classification Report: Not available (evaluation failed)")

# Save model - This will always execute
model_save_path = 'models/xlmr_water_model/'
print(f"\nSaving model to: {model_save_path}")

try:
    model.save_pretrained(model_save_path)
    tokenizer.save_pretrained(model_save_path)
    
    # Save label mapping
    with open(f'{model_save_path}/labels.json', 'w', encoding='utf-8') as f:
        json.dump(reverse_label_map, f, indent=2)
    
    print(f"Model saved successfully!")
    print(f"Files saved: {model_save_path}")
    model_saved = True
except Exception as e:
    print(f"Error saving model: {e}")
    model_saved = False

print("\n" + "=" * 50)
print("MULTILINGUAL XLM-RoBERTa TRAINING COMPLETE")
print("=" * 50)
print(f"✅ GPU Used: {torch.cuda.get_device_name(0)}")
if final_accuracy is not None:
    print(f"✅ Final Validation Accuracy: {final_accuracy:.4f}")
else:
    print("⚠️ Final Validation Accuracy: Not available")
print(f"✅ Training Time: {training_time:.2f} seconds")
if model_saved:
    print(f"✅ Model Saved: {model_save_path}")
else:
    print("❌ Model Saving Failed")
print("✅ Ready for production deployment!" if model_saved else "⚠️ Check model saving before deployment")
