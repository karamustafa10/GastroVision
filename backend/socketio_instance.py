# This file creates a global SocketIO instance for use across the backend
from flask_socketio import SocketIO
# Allow CORS for all origins (for development/demo purposes)
socketio = SocketIO(cors_allowed_origins="*") 