import cv2
from pyzbar import pyzbar
import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image
import datetime
from pymongo import MongoClient
import os
import uuid

# Global state variables for camera and prediction
last_qr_data = None  # Last scanned QR code or number
last_food_pred = None  # Last predicted food
pending_order = None  # Last detected and pending order
CONFIDENCE_THRESHOLD = 0.5  # Confidence threshold for predictions

# Load Food-101 class names
FOOD_CLASSES = [
    'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare', 'beet_salad', 'beignets',
    'bibimbap', 'bread_pudding', 'breakfast_burrito', 'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad',
    'carrot_cake', 'ceviche', 'cheesecake', 'cheese_plate', 'chicken_curry', 'chicken_quesadilla', 'chicken_wings',
    'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder', 'club_sandwich', 'crab_cakes', 'creme_brulee',
    'croque_madame', 'cup_cakes', 'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict', 'escargots',
    'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras', 'french_fries', 'french_onion_soup', 'french_toast',
    'fried_calamari', 'fried_rice', 'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
    'grilled_salmon', 'guacamole', 'gyoza', 'hamburger', 'hot_and_sour_soup', 'hot_dog', 'huevos_rancheros', 'hummus',
    'ice_cream', 'lasagna', 'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons', 'miso_soup',
    'mussels', 'nachos', 'omelette', 'onion_rings', 'oysters', 'pad_thai', 'paella', 'pancakes', 'panna_cotta',
    'peking_duck', 'pho', 'pizza', 'pork_chop', 'poutine', 'prime_rib', 'pulled_pork_sandwich', 'ramen', 'ravioli',
    'red_velvet_cake', 'risotto', 'samosa', 'sashimi', 'scallops', 'seaweed_salad', 'shrimp_and_grits', 'spaghetti_bolognese',
    'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake', 'sushi', 'tacos', 'takoyaki', 'tiramisu',
    'tuna_tartare', 'waffles'
]

MODEL_PATH = 'food101_mobilenetv2_small.pt'
model = None
try:
    # Load MobileNetV2 model for food classification
    model = torch.hub.load('pytorch/vision:v0.13.0', 'mobilenet_v2', weights=None)
    model.classifier[1] = torch.nn.Linear(model.last_channel, len(FOOD_CLASSES))
    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.eval()
except FileNotFoundError:
    print(f"WARNING: Model file not found, prediction function is disabled.")
    model = None

# Image transformation pipeline for model input
transform = T.Compose([
    T.ToPILImage(),
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def predict_food(frame):
    """
    Predict the food class using MobileNetV2 model.
    Returns the predicted class name or 'unknown' if model is unavailable.
    """
    if model is None:
        return 'unknown'
    img = transform(frame)
    img = img.unsqueeze(0)
    with torch.no_grad():
        outputs = model(img)
        _, predicted = torch.max(outputs, 1)
        class_idx = predicted.item()
    return FOOD_CLASSES[class_idx]

# YOLOv8-based Food101 classifier (ultralytics)
try:
    from ultralytics import YOLO
    YOLOV8_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'food101_yolov8_cls.pt')
    yolov8_model = YOLO(YOLOV8_MODEL_PATH)
except Exception as e:
    print(f"WARNING: YOLOv8 model could not be loaded: {e}")
    yolov8_model = None

def predict_food_yolov8(image):
    """
    Predict the food class using YOLOv8 model.
    Args:
        image: numpy array (BGR, OpenCV)
    Returns:
        predicted class name (str), confidence (float)
    """
    if yolov8_model is None:
        print('YOLOv8 model not loaded!')
        return 'unknown', 0.0
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    results = yolov8_model(pil_img)
    result = results[0] if isinstance(results, (list, tuple)) else results
    class_idx = None
    confidence = 0.0
    if hasattr(result, 'probs') and result.probs is not None:
        class_idx = int(result.probs.top1)
        confidence = float(result.probs.data[class_idx])
    if class_idx is not None and 0 <= class_idx < len(FOOD_CLASSES):
        return FOOD_CLASSES[class_idx], confidence
    return 'unknown', 0.0

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']
waiters_collection = db['waiters']
foods_collection = db['foods']
orders_collection = db['orders']

def create_order(table_id, waiter_id, food_name, price):
    """
    Create and save a new order in the database, update waiter performance, and handle delay penalty.
    """
    order_doc = {
        'order_id': str(uuid.uuid4()),
        'table_id': table_id,
        'waiter_id': waiter_id,
        'food_name': food_name,
        'price': price,
        'timestamp': datetime.datetime.now().isoformat()
    }
    orders_collection.insert_one(order_doc)
    waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'performance': 1}})
    # Handle waiter delay penalty if applicable
    if table_id:
        tables_collection = db['tables']
        table_doc = tables_collection.find_one({'table_id': table_id})
        now = datetime.datetime.now()
        last_customer_time = table_doc.get('last_customer_time')
        last_waiter_time = table_doc.get('last_waiter_time')
        if last_customer_time and (not last_waiter_time or last_waiter_time < last_customer_time):
            t_customer = datetime.datetime.fromisoformat(last_customer_time)
            delay = (now - t_customer).total_seconds()
            if delay > 120:
                waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'performance': -1}})
            tables_collection.update_one({'table_id': table_id}, {'$set': {'last_waiter_time': now.isoformat()}})

def gen_frames():
    """
    Generator function for real-time video streaming with QR and food detection overlays.
    Yields JPEG frames for HTTP streaming.
    """
    global last_qr_data, last_food_pred, pending_order
    cap = cv2.VideoCapture(0)
    while True:
        success, frame = cap.read()
        if not success:
            break
        # Decode QR codes in the frame
        decoded_objs = pyzbar.decode(frame)
        for obj in decoded_objs:
            qr_data = obj.data.decode('utf-8')
            if last_qr_data != qr_data:
                last_qr_data = qr_data
            points = obj.polygon
            if len(points) > 4: points = points[:4]
            pts = [(pt.x, pt.y) for pt in points]
            cv2.polylines(frame, [np.array(pts, np.int32)], True, (0,255,0), 2)
            cv2.putText(frame, qr_data, (pts[0][0], pts[0][1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        try:
            # Predict food in the frame
            food_pred, confidence = predict_food_yolov8(frame)
            last_food_pred = food_pred
            cv2.putText(frame, f'Food: {food_pred} ({confidence:.2f})', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,0,0), 2)
            # Only create pending_order if none exists and confidence is high
            if pending_order is None and last_qr_data and last_food_pred and confidence >= CONFIDENCE_THRESHOLD:
                # QR code must be in 'table_id|waiter_id' format
                if '|' in last_qr_data:
                    parts = last_qr_data.split('|')
                    if len(parts) == 2 and parts[0] and parts[1]:
                        table_id, waiter_id = parts[0], parts[1]
                        food_doc = foods_collection.find_one({'name': last_food_pred})
                        price = food_doc['price'] if food_doc and 'price' in food_doc else None
                        pending_order = {
                            'table_id': table_id,
                            'waiter_id': waiter_id,
                            'food_name': last_food_pred,
                            'price': price,
                            'confidence': confidence,
                            'timestamp': datetime.datetime.now().isoformat()
                        }
                        print("pending_order created:", last_food_pred, confidence, last_qr_data)
                # Otherwise, do not create pending_order
        except Exception as e:
            cv2.putText(frame, 'Food: ?', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    cap.release()

from flask import jsonify

def get_pending_order():
    """
    Return the current pending order as a JSON response.
    """
    global pending_order
    return jsonify({'pending_order': pending_order})

from flask import request

def confirm_pending_order():
    """
    Confirm and save the pending order, then clear it.
    """
    global pending_order
    if not pending_order or not pending_order.get('table_id') or not pending_order.get('waiter_id'):
        return jsonify({'error': 'No pending order or missing table/waiter info'}), 400
    create_order(
        pending_order['table_id'],
        pending_order['waiter_id'],
        pending_order['food_name'],
        pending_order['price']
    )
    pending_order = None
    return jsonify({'message': 'Order added'})

def reject_pending_order():
    """
    Reject and clear the current pending order.
    """
    global pending_order
    pending_order = None
    return jsonify({'message': 'Pending order cancelled'})

def get_last_qr_data():
    """
    Return the last scanned QR code data.
    """
    return last_qr_data

def get_last_food_pred():
    """
    Return the last predicted food name.
    """
    return last_food_pred 