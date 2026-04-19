import os
import cv2
import numpy as np
from deepface import DeepFace
from scipy.spatial.distance import cosine

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class FaceRecognitionService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaceRecognitionService, cls).__new__(cls)
            cls._instance.initialize_models()
        return cls._instance

    def initialize_models(self):
        print("FaceRecognitionService: Using DeepFace.")
        # Optional: Trigger model download/load on startup
        # try:
        #     DeepFace.build_model("FaceNet")
        #     print("DeepFace (FaceNet) initialized.")
        # except Exception as e:
        #     print(f"DeepFace init warning: {e}")
        pass

    def preprocess_image(self, image_np):
        """
        Detect face using DeepFace (wraps MTCNN/RetinaFace/etc)
        Returns: list of {"face_img": raw_crop_or_aligned, "box": (x,y,w,h)}
        """
        if image_np is None:
            return []
            
        try:
            # Use 'opencv' for fast, CPU-friendly detection.
            # enforce_detection=False so frames without clear faces don't crash.
            faces = DeepFace.extract_faces(
                img_path=image_np, 
                detector_backend='opencv', 
                enforce_detection=False, 
                align=True
            )
        except Exception as e:
            print(f"DeepFace extraction error: {e}")
            return []
            
        processed_faces = []
        for face_obj in faces:
            area = face_obj.get('facial_area', {})
            x = area.get('x', 0)
            y = area.get('y', 0)
            w = area.get('w', 0)
            h = area.get('h', 0)
            face_img = face_obj.get('face')
            confidence = face_obj.get('confidence', 0)

            # Skip low-confidence or invalid detections
            if confidence is not None and confidence < 0.5:
                continue
            if w < 20 or h < 20:
                continue
            if face_img is None:
                continue

            processed_faces.append({
                "face_img": face_img,
                "box": (x, y, w, h)
            })
            
        return processed_faces

    def generate_embedding(self, face_img):
        # face_img is the cropped face from preprocess_image
        try:
            # represent returns list of embedding objects.
            # We enforce_detection=False because we are passing a cropped face.
            # We disable alignment because likely already aligned or crop is small.
            embeddings = DeepFace.represent(
                img_path=face_img, 
                model_name="Facenet", 
                enforce_detection=False, 
                detector_backend="skip",
                align=False
            )
            if not embeddings:
                return None
            return embeddings[0]["embedding"]
        except Exception as e:
            print(f"Embedding generation error: {e}")
            return None

    def compute_similarity(self, embed1, embed2):
        # DeepFace embeddings are lists usually, convert to numpy for cosine
        if embed1 is None or embed2 is None:
            return 0.0
        e1 = np.array(embed1)
        e2 = np.array(embed2)
        if e1.size == 0 or e2.size == 0:
            return 0.0
        return 1 - cosine(e1, e2)

face_service = FaceRecognitionService()
