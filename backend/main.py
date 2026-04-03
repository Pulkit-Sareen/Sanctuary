# =========================
# FASTAPI BACKEND (MVP)
# =========================
from routes.session import router as session_router

from fastapi import FastAPI, UploadFile, File # type: ignore
from pydantic import BaseModel # type: ignore
from typing import Dict, Any
from datetime import datetime
import uuid
import shutil
import os

from pymongo import MongoClient # type: ignore

app = FastAPI()
app.include_router(session_router)

# =========================
# DATABASE CONFIG
# =========================

MONGO_URI = "mongodb://localhost:27017"  # Replace with Atlas later
client = MongoClient(MONGO_URI)
db = client["testimony_db"]
sessions_collection = db["sessions"]

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

    return {
        "updated_json": updated_json,
        "confidence": {"location": 0.7},
        "completeness_score": 0.5,
        "next_question": "Can you describe it in more detail?"
    }


# =========================
# REQUEST MODELS
# =========================

class StartSessionResponse(BaseModel):
    session_id: str


# =========================
# ROUTES
# =========================

@app.post("/start-session", response_model=StartSessionResponse)
def start_session():
    session_id = str(uuid.uuid4())

    session_data = {
        "session_id": session_id,
        "created_at": datetime.utcnow(),
        "memory": {},  # structured JSON
        "history": [],
        "current_question": "Where did the incident occur?"
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
        "question": session.get("current_question")
    }

    llm_output = mock_llm_service(llm_input)

    updated_json = llm_output["updated_json"]
    next_question = llm_output["next_question"]

    # =========================
    # UPDATE DATABASE
    # =========================
    sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "memory": updated_json,
                "current_question": next_question
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

    return {
        "transcript": transcript,
        "emotion": emotion,
        "updated_memory": updated_json,
        "next_question": next_question
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