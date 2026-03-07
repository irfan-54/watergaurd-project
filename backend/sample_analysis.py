import json
import random
from transformers import AutoTokenizer

# Load dataset
dataset_path = "datasets/final_dataset_production_ready.jsonl"

texts = []
labels = []

with open(dataset_path, 'r', encoding='utf-8-sig') as f:
    for line in f:
        record = json.loads(line.strip())
        texts.append(record['text'])
        labels.append(record['label'])

# Label mapping
label_map = {'leakage': 0, 'contamination': 1, 'blockage': 2, 'other': 3}
reverse_label_map = {0: 'leakage', 1: 'contamination', 2: 'blockage', 3: 'other'}

print("10 Random Samples from Dataset:")
print("-" * 50)

# Get 10 random indices
random_indices = random.sample(range(len(texts)), 10)

for i, idx in enumerate(random_indices):
    text = texts[idx]
    label_name = labels[idx]
    label_id = label_map[label_name]

    print(f"Sample {i+1}:")
    print(f"  Text: \"{text}\"")
    print(f"  Label ID: {label_id}")
    print(f"  Label Name: {label_name}")
    print()

# Tokenizer example
print("Tokenizer Example:")
print("-" * 20)

model_path = "models/xlmr_water_model"
tokenizer = AutoTokenizer.from_pretrained(model_path)

sentence = "I had my pipe broken"
tokens = tokenizer.tokenize(sentence)
input_ids = tokenizer.encode(sentence, add_special_tokens=True)
decoded = tokenizer.decode(input_ids)

print(f"Original: \"{sentence}\"")
print(f"Tokens: {tokens}")
print(f"Input IDs: {input_ids}")
print(f"Decoded: \"{decoded}\"")
print(f"Token count: {len(tokens)}")
