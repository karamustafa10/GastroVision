from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from backend.models.waiter import Waiter
import os

bp = Blueprint('waiters', __name__)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']
waiters_collection = db['waiters']

@bp.route('/waiters', methods=['POST'])
def add_waiter():
    """
    Add a new waiter to the database.
    """
    data = request.json
    waiter = Waiter(
        waiter_id=data.get('waiter_id'),
        name=data.get('name'),
        code=data.get('code'),
        performance=data.get('performance', 0),
        interest_level=data.get('interest_level', 0)
    )
    waiters_collection.insert_one(waiter.to_dict())
    return jsonify({'message': 'Waiter added'}), 201

@bp.route('/waiters', methods=['GET'])
def list_waiters():
    """
    List all waiters in the database.
    """
    waiters = list(waiters_collection.find({}, {'_id': 0}))
    return jsonify(waiters)

@bp.route('/waiters/update_interest', methods=['POST'])
def update_interest():
    """
    Update the interest level of a waiter.
    """
    data = request.json
    waiter_id = data.get('waiter_id')
    interest_level = data.get('interest_level')
    if not waiter_id or interest_level is None:
        return {'error': 'waiter_id and interest_level are required'}, 400
    waiters_collection.update_one({'waiter_id': waiter_id}, {'$set': {'interest_level': interest_level}})
    return {'message': 'Waiter interest level updated.'} 