import os

# MongoDB connection URI (can be set via environment variable)
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
# Name of the MongoDB database
DB_NAME = 'restaurant' 