"""
Main Flask application for GastroVision backend.
Handles API routing, MongoDB connection, and SocketIO events.
"""
from flask import Flask, jsonify
from pymongo import MongoClient
import os
from flask_cors import CORS
from flask_socketio import SocketIO, emit

# Import blueprints for modular route management
from backend.routes.tables import bp as tables_bp
from backend.routes.waiters import bp as waiters_bp
from backend.routes.foods import bp as foods_bp
from backend.routes.video import bp as video_bp
from backend.routes.reports import bp as reports_bp
from backend.socketio_instance import socketio

app = Flask(__name__)
CORS(app)
socketio.init_app(app)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']

# Register API blueprints
app.register_blueprint(tables_bp)
app.register_blueprint(waiters_bp)
app.register_blueprint(foods_bp)
app.register_blueprint(video_bp)
app.register_blueprint(reports_bp)

@app.route('/')
def home():
    """Health check endpoint for backend status."""
    return jsonify({'message': 'GastroVision Backend is running'})

# --- SocketIO Events ---
@socketio.on('connect')
def handle_connect():
    """Handle new client connection event."""
    print('Client connected')
    emit('server_message', {'msg': 'Connection successful'})

@socketio.on('order_update')
def handle_order_update(data):
    """Broadcast order update event to all clients."""
    emit('order_update', data, broadcast=True)

if __name__ == '__main__':
    # Run the Flask app with SocketIO support
    socketio.run(app, debug=True) 