import tensorflow as tf
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt
import os

# Configuration
DATASET_PATH = r"H:\iste\my-react-app\data_set_dowloader"
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
VALIDATION_SPLIT = 0.2
MODEL_SAVE_PATH = "water_issue_classifier.h5"

def main():
    print("Loading dataset...")

    # Load dataset with automatic split
    train_dataset = image_dataset_from_directory(
        DATASET_PATH,
        validation_split=VALIDATION_SPLIT,
        subset="training",
        seed=123,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='int'
    )

    validation_dataset = image_dataset_from_directory(
        DATASET_PATH,
        validation_split=VALIDATION_SPLIT,
        subset="validation",
        seed=123,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='int'
    )

    # Print detected class names
    class_names = train_dataset.class_names
    print(f"\nDetected class names: {class_names}")

    # Ensure all images are RGB (3 channels)
    def ensure_rgb(image, label):
        image = tf.image.resize(image, (224, 224))
        image = tf.image.grayscale_to_rgb(image) if image.shape[-1] == 1 else image
        return image, label

    # Apply RGB conversion to datasets
    train_dataset = train_dataset.map(ensure_rgb)
    validation_dataset = validation_dataset.map(ensure_rgb)

    # Performance optimization
    AUTOTUNE = tf.data.AUTOTUNE
    train_dataset = train_dataset.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    validation_dataset = validation_dataset.cache().prefetch(buffer_size=AUTOTUNE)

    print("\nBuilding model...")

    # Load MobileNetV2 base model
    base_model = MobileNetV2(
        input_shape=IMAGE_SIZE + (3,),
        include_top=False,
        weights='imagenet'
    )

    # Freeze base model layers
    base_model.trainable = False

    # Add classifier head
    inputs = tf.keras.Input(shape=IMAGE_SIZE + (3,))
    x = base_model(inputs, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    outputs = Dense(len(class_names), activation='softmax')(x)

    model = Model(inputs, outputs)

    # Compile model
    model.compile(
        optimizer=Adam(),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    print("Model summary:")
    model.summary()

    print(f"\nTraining for {EPOCHS} epochs...")

    # Train model
    history = model.fit(
        train_dataset,
        validation_data=validation_dataset,
        epochs=EPOCHS,
        verbose=1
    )

    print("\nSaving model...")
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved as {MODEL_SAVE_PATH}")

    # Plot training history
    print("\nPlotting training results...")
    plt.figure(figsize=(12, 4))

    # Accuracy plot
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)

    # Loss plot
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)

    plt.tight_layout()
    plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
    plt.show()

    print("\nTraining completed successfully!")
    print(f"Final training accuracy: {history.history['accuracy'][-1]:.4f}")
    print(f"Final validation accuracy: {history.history['val_accuracy'][-1]:.4f}")

if __name__ == "__main__":
    main()
