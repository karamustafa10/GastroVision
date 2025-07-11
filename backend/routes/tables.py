from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from backend.models.table import Table
from backend.models.order import Order
import os
import datetime
import threading
import uuid
from backend.services.video_stream import predict_food_yolov8, FOOD_CLASSES
import numpy as np
import cv2
from flask_socketio import SocketIO
from backend.socketio_instance import socketio

bp = Blueprint('tables', __name__)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']
tables_collection = db['tables']

@bp.route('/tables', methods=['POST'])
def add_table():
    """
    Add a new table to the database.
    """
    data = request.json
    table = Table(
        table_id=data.get('table_id'),
        waiter_id=data.get('waiter_id'),
        status=data.get('status', 'empty')
    )
    tables_collection.insert_one(table.to_dict())
    return jsonify({'message': 'Table added'}), 201

@bp.route('/tables', methods=['GET'])
def list_tables():
    """
    List all tables in the database.
    """
    tables = list(tables_collection.find({}, {'_id': 0}))
    return jsonify(tables)

@bp.route('/tables/update_status', methods=['POST'])
def update_table_status():
    """
    Update the status of a table (e.g., occupied, served).
    Also handles waiter delay penalty and interest level updates.
    """
    data = request.json
    table_id = data.get('table_id')
    status = data.get('status')
    if not table_id or not status:
        return {'error': 'table_id and status are required'}, 400
    update_fields = {'status': status}
    if status == 'occupied':
        update_fields['last_customer_time'] = datetime.datetime.now().isoformat()
        # Start waiter delay penalty timer
        def waiter_delay_penalty():
            table = tables_collection.find_one({'table_id': table_id})
            if table and table.get('status') == 'occupied':
                waiter_id = table.get('waiter_id')
                if waiter_id:
                    waiters_collection = db['waiters']
                    waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'performance': -1, 'interest_level': -1}})
                    # Send delay warning to frontend
                    socketio.emit('waiter_delay_warning', {'table_id': table_id, 'waiter_id': waiter_id})
        timer = threading.Timer(60, waiter_delay_penalty)
        timer.start()
    elif status == 'served':
        update_fields['last_waiter_time'] = datetime.datetime.now().isoformat()
        # Increase waiter's interest level
        table = tables_collection.find_one({'table_id': table_id})
        waiter_id = table.get('waiter_id') if table else None
        if waiter_id:
            waiters_collection = db['waiters']
            waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'interest_level': 1}})
    tables_collection.update_one({'table_id': table_id}, {'$set': update_fields})
    return {'message': 'Table status updated.'}

@bp.route('/reset_table', methods=['POST'])
def reset_table():
    """
    Reset a table: delete all orders for the table and set its status to empty.
    """
    data = request.json
    table_id = data.get('table_id')
    if not table_id:
        return {'error': 'table_id is required'}, 400
    # Delete all orders for the table
    orders_collection = db['orders']
    result = orders_collection.delete_many({'table_id': table_id})
    # Reset table status and waiter assignment
    tables_collection.update_one({'table_id': table_id}, {'$set': {'status': 'empty', 'waiter_id': None}})
    return {'message': f'{result.deleted_count} orders deleted, table reset.'}

@bp.route('/tables/auto_assign', methods=['POST'])
def auto_assign_tables():
    """
    Automatically assign tables to waiters (requires at least 2 waiters and 4 tables).
    """
    tables = list(tables_collection.find().sort('table_id', 1))
    waiters = list(db['waiters'].find().sort('waiter_id', 1))
    if len(waiters) < 2 or len(tables) < 4:
        return {'error': 'At least 2 waiters and 4 tables are required'}, 400
    # Assign first two tables to first waiter, last two to second waiter
    updates = []
    for i, table in enumerate(tables):
        if i < 2:
            waiter_id = waiters[0]['waiter_id']
        else:
            waiter_id = waiters[1]['waiter_id']
        tables_collection.update_one({'table_id': table['table_id']}, {'$set': {'waiter_id': waiter_id}})
        updates.append({'table_id': table['table_id'], 'waiter_id': waiter_id})
    return {'message': 'Tables automatically assigned to waiters.', 'assignments': updates}, 200

@bp.route('/api/camera/food_detected', methods=['POST'])
def camera_food_detected():
    """
    Handle food detection from camera image or manual input.
    If image is provided, use YOLOv8 model to predict food.
    Otherwise, use provided food_id.
    """
    # If image file is provided (multipart/form-data)
    if 'image' in request.files:
        image_file = request.files['image']
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        food_name, _ = predict_food_yolov8(img)
        # Find food_id from foods collection
        foods_collection = db['foods']
        food_doc = foods_collection.find_one({'name': food_name})
        if not food_doc:
            return {'error': f'Food not found: {food_name}'}, 400
        food_id = food_doc.get('food_id')
        price = float(food_doc.get('price', 0))
    else:
        # Use manual JSON input (food_id provided)
        data = request.json
        table_id = data.get('table_id')
        food_id = data.get('food_id')
        quantity = int(data.get('quantity', 1))
        if not table_id or not food_id:
            return {'error': 'table_id and food_id are required'}, 400
        foods_collection = db['foods']
        food_doc = foods_collection.find_one({'food_id': food_id})
        if not food_doc:
            return {'error': 'Food not found'}, 400
        price = float(food_doc.get('price', 0)) * quantity
        food_name = food_doc.get('name')
    # Find waiter assigned to the table
    if 'table_id' in locals():
        t_id = table_id
    else:
        t_id = request.form.get('table_id')
    if not t_id:
        return {'error': 'table_id is required'}, 400
    table = tables_collection.find_one({'table_id': t_id})
    waiter_id = table.get('waiter_id') if table else None
    if not waiter_id:
        return {'error': 'No waiter assigned to table'}, 400
    # Save the order
    order = Order(
        order_id=str(uuid.uuid4()),
        table_id=t_id,
        waiter_id=waiter_id,
        food_id=food_id,
        food_name=food_name,
        quantity=1,
        price=price,
        timestamp=datetime.datetime.now().isoformat()
    )
    orders_collection = db['orders']
    orders_collection.insert_one(order.to_dict())
    # Increase waiter's performance
    waiters_collection = db['waiters']
    waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'performance': 1}})
    # Broadcast the new order to all clients
    socketio.emit('order_update', order.to_dict())
    return {'message': f'Order saved via camera: {food_name}'}, 200

@bp.route('/api/camera/waiter_detected', methods=['POST'])
def camera_waiter_detected():
    """
    Handle waiter detection from camera and update table status to 'served'.
    """
    data = request.json
    table_id = data.get('table_id')
    waiter_id = data.get('waiter_id')
    if not table_id or not waiter_id:
        return {'error': 'table_id and waiter_id are required'}, 400
    # Update table's waiter and status
    tables_collection.update_one({'table_id': table_id}, {'$set': {'waiter_id': waiter_id, 'status': 'served', 'last_waiter_time': datetime.datetime.now().isoformat()}})
    # Increase waiter's interest level
    waiters_collection = db['waiters']
    waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'interest_level': 1}})
    return {'message': 'Waiter detected by camera, service provided to table.'} 