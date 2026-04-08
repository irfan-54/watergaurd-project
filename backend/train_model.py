#!/usr/bin/env python3
import json
import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np
import os

def train_water_classifier():
    """Train XLM-R model on water issue classification dataset"""
    
    print("TRAINING WATER ISSUE CLASSIFIER")
    print("=" * 50)
    
    # Configuration
    DATASET_PATH = "datasets/final_training.jsonl"
    MODEL_OUTPUT_DIR = "models/xlmr_water_model"
    MODEL_NAME = "xlm-roberta-base"
    
    # Training parameters
    EPOCHS = 3
    BATCH_SIZE = 16
    LEARNING_RATE = 2e-5
    MAX_LENGTH = 128
    TEST_SIZE = 0.1  # 10% for validation
    
    print(f"Dataset: {DATASET_PATH}")
    print(f"Model: {MODEL_NAME}")
    print(f"Output: {MODEL_OUTPUT_DIR}")
    print(f"Epochs: {EPOCHS}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Learning rate: {LEARNING_RATE}")
    print("=" * 50)
    
    # Create output directory if it doesn't exist
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
    
    # Load dataset
    print("Loading dataset...")
    data = []
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line.strip()))
    
    print(f"Loaded {len(data)} samples")
    
    # Extract texts and labels
    texts = [item["text"] for item in data]
    labels_str = [item["label"] for item in data]
    
    # Label mapping
    label_map = {"contamination": 0, "leakage": 1, "blockage": 2, "other": 3}
    labels = [label_map[label] for label in labels_str]
    
    # Print label distribution
    print("Label distribution:")
    for label, idx in label_map.items():
        count = labels_str.count(label)
        print(f"  {label} ({idx}): {count}")
    
    # Split dataset
    print(f"\nSplitting dataset (90% train, 10% validation)...")
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=TEST_SIZE, random_state=42, stratify=labels
    )
    
    print(f"Training samples: {len(train_texts)}")
    print(f"Validation samples: {len(val_texts)}")
    
    # Create datasets
    train_dataset = Dataset.from_dict({
        "text": train_texts,
        "label": train_labels
    })
    
    val_dataset = Dataset.from_dict({
        "text": val_texts,
        "label": val_labels
    })
    
    # Load tokenizer
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    
    # Tokenization function
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            padding="max_length",
            truncation=True,
            max_length=MAX_LENGTH
        )
    
    # Tokenize datasets
    print("Tokenizing datasets...")
    train_dataset = train_dataset.map(tokenize_function, batched=True)
    val_dataset = val_dataset.map(tokenize_function, batched=True)
    
    # Load model
    print("Loading model...")
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(label_map)
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=MODEL_OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
        push_to_hub=False,
        logging_steps=50,  # More frequent logging
        save_total_limit=2,
        fp16=torch.cuda.is_available(),
        dataloader_pin_memory=True,
        report_to="none"
    )
    
    # Metrics function
    def compute_metrics(eval_pred):
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)
        
        accuracy = accuracy_score(labels, predictions)
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, predictions, average='weighted'
        )
        
        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1
        }
    
    # Create trainer
    print("Creating trainer...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        tokenizer=tokenizer
    )
    
    # Train model
    print("Starting training...")
    print("=" * 50)
    trainer.train()
    
    # Evaluate model
    print("Evaluating model...")
    eval_results = trainer.evaluate()
    
    print("Training completed!")
    print("Final results:")
    for metric, value in eval_results.items():
        print(f"  {metric}: {value:.4f}")
    
    # Save model and tokenizer
    print(f"Saving model to {MODEL_OUTPUT_DIR}...")
    trainer.save_model()
    tokenizer.save_pretrained(MODEL_OUTPUT_DIR)
    
    # Save label mapping
    config_path = os.path.join(MODEL_OUTPUT_DIR, "label_map.json")
    with open(config_path, 'w') as f:
        json.dump(label_map, f, indent=2)
    
    print(f"✅ Model saved successfully to {MODEL_OUTPUT_DIR}")
    print(f"✅ Label mapping saved to {config_path}")
    
    # Test with sample inputs
    print("\nTesting model with sample inputs:")
    test_samples = [
        "water smells bad",
        "pipe is leaking", 
        "no water supply",
        "low water pressure"
    ]
    
    model.eval()
    for test_text in test_samples:
        inputs = tokenizer(
            test_text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=MAX_LENGTH
        )
        
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = torch.argmax(predictions, dim=-1).item()
            confidence = predictions[0][predicted_class].item()
            
        # Convert back to label name
        reverse_label_map = {v: k for k, v in label_map.items()}
        predicted_label = reverse_label_map[predicted_class]
        
        print(f"  '{test_text}' → {predicted_label} ({confidence:.2f})")
    
    print("\n✅ Training pipeline completed successfully!")

if __name__ == "__main__":
    train_water_classifier()
