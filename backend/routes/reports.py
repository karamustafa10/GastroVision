from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from backend.models.order import Order
import os
import datetime
import uuid

bp = Blueprint('reports', __name__)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']
orders_collection = db['orders']

@bp.route('/orders', methods=['POST'])
def add_order():
    """
    Add a new order to the database and update waiter performance.
    """
    data = request.json
    food_id = data.get('food_id')
    quantity = int(data.get('quantity', 1))
    table_id = data.get('table_id')
    waiter_id = data.get('waiter_id')
    # Get food info and price
    foods_collection = db['foods']
    food = foods_collection.find_one({'food_id': food_id})
    if not food:
        return jsonify({'error': 'Food not found'}), 400
    price = float(food.get('price', 0)) * quantity
    food_name = food.get('name')
    # Save the order
    order = Order(
        order_id=str(uuid.uuid4()),
        table_id=table_id,
        waiter_id=waiter_id,
        food_id=food_id,
        food_name=food_name,
        quantity=quantity,
        price=price,
        timestamp=datetime.datetime.now().isoformat()
    )
    orders_collection.insert_one(order.to_dict())
    # Increase waiter's performance
    waiters_collection = db['waiters']
    waiters_collection.update_one({'waiter_id': waiter_id}, {'$inc': {'performance': 1}})
    # (Interest level and delay infrastructure can be extended here)
    return jsonify({'message': 'Order saved'}), 201

@bp.route('/orders', methods=['GET'])
def list_orders():
    """
    List all orders, with optional filters for table, waiter, food, and date range.
    """
    query = {}
    table_id = request.args.get('table_id')
    waiter_id = request.args.get('waiter_id')
    food_name = request.args.get('food_name')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if table_id:
        query['table_id'] = table_id
    if waiter_id:
        query['waiter_id'] = waiter_id
    if food_name:
        query['food_name'] = food_name
    if start_date or end_date:
        query['timestamp'] = {}
        if start_date:
            query['timestamp']['$gte'] = start_date
        if end_date:
            query['timestamp']['$lte'] = end_date
        if not query['timestamp']:
            del query['timestamp']
    orders = list(orders_collection.find(query, {'_id': 0}))
    return jsonify(orders)

@bp.route('/api/reports/summary', methods=['GET'])
def report_summary():
    """
    Get summary statistics for orders, top foods, waiter performance, and table revenue.
    """
    # Total number of orders
    total_orders = orders_collection.count_documents({})
    # Top 5 most consumed foods
    pipeline_foods = [
        {"$group": {"_id": "$food_name", "count": {"$sum": "$quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_foods = list(orders_collection.aggregate(pipeline_foods))
    # Waiter performance (total orders per waiter)
    pipeline_waiters = [
        {"$group": {"_id": "$waiter_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    waiter_performance = list(orders_collection.aggregate(pipeline_waiters))
    # Table-based total revenue
    pipeline_tables = [
        {"$group": {"_id": "$table_id", "total": {"$sum": "$price"}}},
        {"$sort": {"_id": 1}}
    ]
    table_revenue = list(orders_collection.aggregate(pipeline_tables))
    return jsonify({
        "total_orders": total_orders,
        "top_foods": top_foods,
        "waiter_performance": waiter_performance,
        "table_revenue": table_revenue
    }) 