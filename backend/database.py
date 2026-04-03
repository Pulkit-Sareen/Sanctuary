import os

from pymongo import MongoClient

MONGO_URL = os.environ.get("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URL)

db = client["trauma_db"]
sessions_collection = db["sessions"]