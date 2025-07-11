from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from backend.models.food import Food
import os

bp = Blueprint('foods', __name__)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']
foods_collection = db['foods']

@bp.route('/foods', methods=['POST'])
def add_food():
    """
    Add a new food item to the database.
    """
    data = request.json
    food = Food(
        food_id=data.get('food_id'),
        name=data.get('name'),
        category=data.get('category'),
        price=data.get('price')
    )
    foods_collection.insert_one(food.to_dict())
    return jsonify({'message': 'Food added'}), 201

@bp.route('/foods', methods=['GET'])
def list_foods():
    """
    List all food items in the database.
    """
    foods = list(foods_collection.find({}, {'_id': 0}))
    return jsonify(foods) 