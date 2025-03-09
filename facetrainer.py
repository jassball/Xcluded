import os
import numpy as np
import cv2
import zipfile
from keras_facenet import FaceNet
from mtcnn import MTCNN  # Face detection model

# Initialize FaceNet & MTCNN
embedder = FaceNet()
detector = MTCNN()

# Function to extract faces from images
def extract_face(image_path, size=(160, 160)):
    image = cv2.imread(image_path)
    if image is None:
        return None  # Skip invalid images
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    faces = detector.detect_faces(image_rgb)

    if faces:
        x, y, width, height = faces[0]['box']
        x, y = abs(x), abs(y)
        face = image_rgb[y:y + height, x:x + width]
        face = cv2.resize(face, size)
        return face
    return None  # No face detected

# Function to compute face embeddings using keras_facenet
def get_embedding(face_pixels):
    face_pixels = np.expand_dims(face_pixels, axis=0)  # Expand dimensions for batch
    embedding = embedder.embeddings(face_pixels)[0]  # Generate embedding
    return embedding

# Function to process a folder of images and return embeddings
def process_images(image_folder):
    embeddings = []
    for file in os.listdir(image_folder):
        if file.lower().endswith(('png', 'jpg', 'jpeg')):
            image_path = os.path.join(image_folder, file)
            face = extract_face(image_path)
            if face is not None:
                embedding = get_embedding(face)
                embeddings.append(embedding)
    return np.array(embeddings)

# Extract ZIP files
def extract_zip(zip_path, extract_to):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

# Paths
trump_zip = "trump.zip"
musk_zip = "musk.zip"
extract_folder = "faces/"

# Extract images
extract_zip(trump_zip, extract_folder + "trump")
extract_zip(musk_zip, extract_folder + "musk")

# Process images and generate embeddings
trump_embeddings = process_images(extract_folder + "trump")
musk_embeddings = process_images(extract_folder + "musk")

# Save embeddings
np.save("trump_embeddings.npy", trump_embeddings)
np.save("musk_embeddings.npy", musk_embeddings)

print("Embeddings saved successfully!")
