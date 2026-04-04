# =========================
# FASTAPI BACKEND (MVP)
# =========================
from fastapi import FastAPI, UploadFile, File # type: ignore
from pydantic import BaseModel # type: ignore
from typing import Dict, Any
from datetime import datetime
import uuid
import shutil
import os
from fastapi import WebSocket
from pymongo import MongoClient # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from routes.session import router as session_router


app = FastAPI()
app.include_router(session_router, prefix="/session")

_cors = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
_cors_origins = [o.strip() for o in _cors if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DATABASE CONFIG
# =========================

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://host.docker.internal:27017")
client = MongoClient(MONGO_URI)
db = client["trauma_db"]
sessions_collection = db["sessions"]
try:
    client.admin.command('ping')
    print("✅ MongoDB connected successfully")
except Exception as e:
    print("❌ MongoDB connection failed:", e)

SAMPLE_QUESTIONS = [
    "Where did the incident occur?",
    "When did this happen?",
    "Who else was present there?",
    "What happened right after this?",
]

# =========================
# MOCK SERVICES (REPLACE LATER)
# =========================

def mock_speech_to_text(file_path: str) -> str:
    """
    Replace with Whisper API later
    """
    return "car"  # dummy output


def mock_emotion_detection(file_path: str) -> str:
    """
    Replace with real emotion model later
    """
    return "neutral"


def mock_llm_service(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Replace with OpenAI / LLM API later
    """
    prev_json = data.get("previous_json", {})

    # Simple demo logic
    updated_json = prev_json.copy()

    if "location" not in updated_json:
        updated_json["location"] = {
            "type": data["transcript"],
            "details": {}
        }
    else:
        # Add dummy detail
        updated_json["location"]["details"]["color"] = "red"

    question_index = data.get("question_index", 0)
    next_index = min(question_index + 1, len(SAMPLE_QUESTIONS) - 1)

    return {
        "updated_json": updated_json,
        "confidence": {"location": 0.7},
        "completeness_score": 0.5,
        "next_question": SAMPLE_QUESTIONS[next_index],
        "next_question_index": next_index,
    }


# =========================
# REQUEST MODELS
# =========================

class StartSessionResponse(BaseModel):
    session_id: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)

    async def send_update(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)

manager = ConnectionManager()

# =========================
# ROUTES
# =========================

import asyncio

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()  # ✅ accept FIRST (important)

    try:
        manager.active_connections[session_id] = websocket

        # ✅ SAFELY fetch session
        session = sessions_collection.find_one({"session_id": session_id})

        if session:
            await websocket.send_json({
                "type": "question_update",
                "question": session.get("current_question", "Please continue.")
            })
        else:
            await websocket.send_json({
                "type": "error",
                "message": "Session not found"
            })

        # ✅ keep connection alive
        while True:
            await asyncio.sleep(1)

    except Exception as e:
        print("WebSocket error:", e)

    finally:
        manager.disconnect(session_id)

@app.post("/start-session", response_model=StartSessionResponse)
def start_session():
    session_id = str(uuid.uuid4())

    session_data = {
        "session_id": session_id,
        "created_at": datetime.utcnow(),
        "memory": {},  # structured JSON
        "history": [],
        "question_index": 0,
        "current_question": SAMPLE_QUESTIONS[0],
    }

    sessions_collection.insert_one(session_data)

    return {"session_id": session_id}


@app.get("/next-question/{session_id}")
def get_next_question(session_id: str):
    session = sessions_collection.find_one({"session_id": session_id})

    if not session:
        return {"error": "Session not found"}

    return {
        "question": session.get("current_question", "Please continue.")
    }


@app.post("/submit-answer/{session_id}")
async def submit_answer(session_id: str, file: UploadFile = File(...)):
    session = sessions_collection.find_one({"session_id": session_id})

    if not session:
        return {"error": "Session not found"}

    # =========================
    # SAVE AUDIO FILE
    # =========================
    file_location = f"temp_{uuid.uuid4()}.wav"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # =========================
    # PARALLEL LOGIC (SIMULATED)
    # =========================
    transcript = mock_speech_to_text(file_location)
    emotion = mock_emotion_detection(file_location)

    # =========================
    # CALL LLM (MOCK)
    # =========================
    llm_input = {
        "transcript": transcript,
        "emotion": emotion,
        "previous_json": session.get("memory", {}),
        "question": session.get("current_question"),
        "question_index": session.get("question_index", 0),
    }

    llm_output = mock_llm_service(llm_input)

    updated_json = llm_output["updated_json"]
    next_question = llm_output["next_question"]
    next_question_index = llm_output["next_question_index"]

    # =========================
    # UPDATE DATABASE
    # =========================
    sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "memory": updated_json,
                "current_question": next_question,
                "question_index": next_question_index,
            },
            "$push": {
                "history": {
                    "transcript": transcript,
                    "emotion": emotion,
                    "timestamp": datetime.utcnow()
                }
            }
        }
    )

    # delete temp file
    os.remove(file_location)

    await manager.send_update(session_id, {
    "type": "question_update",
    "question": next_question
})
    return {
        "transcript": transcript,
        "emotion": emotion,
        "updated_memory": updated_json,
        "next_question": next_question,
        "status": "updated"
    }


@app.get("/final-testimony/{session_id}")
def get_final_testimony(session_id: str):
    session = sessions_collection.find_one({"session_id": session_id})

    if not session:
        return {"error": "Session not found"}

    structured_data = session.get("memory", {})

    # =========================
    # MOCK FINAL GENERATION
    # =========================
    final_text = f"The incident details are as follows: {structured_data}"

    return {
        "structured_data": structured_data,
        "final_testimony": final_text
    }


# =========================
# RUN SERVER
# =========================
# Run using:
# uvicorn main:app --reload
