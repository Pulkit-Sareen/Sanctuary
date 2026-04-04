from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

from database import sessions_collection

router = APIRouter()

# =========================
# START SESSION
# =========================

@router.post("/start-session")
def start_session():
    session = {
        "createdAt": datetime.utcnow().isoformat(),
        "conversation": [],
        "status": "in_progress",
    }

    result = sessions_collection.insert_one(session)

    return {
        "session_id": str(result.inserted_id),
        "message": "Session started successfully",
    }

# =========================
# REQUEST MODEL
# =========================

class AddResponsePayload(BaseModel):
    session_id: str
    question: str
    answer_text: str
    emotion: str

# =========================
# ADD RESPONSE
# =========================

@router.post("/add-response")
def add_response(data: AddResponsePayload):
    session_id = data.session_id

    try:
        object_id = ObjectId(session_id)
    except Exception:
        return {"error": "Invalid session_id"}

    result = sessions_collection.update_one(
        {"_id": object_id},
        {
            "$push": {
                "conversation": {
                    "question": data.question,
                    "answer_text": data.answer_text,
                    "emotion": data.emotion,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            }
        }
    )

    if result.matched_count == 0:
        return {"error": "Session not found"}

    return {"message": "Response saved successfully"}

# =========================
# GET SESSION
# =========================

@router.get("/get-session/{session_id}")
def get_session(session_id: str):
    try:
        object_id = ObjectId(session_id)
    except Exception:
        return {"error": "Invalid session_id"}

    session = sessions_collection.find_one({"_id": object_id})

    if not session:
        return {"error": "Session not found"}

    session["_id"] = str(session["_id"])
    return session


# =========================
# END SESSION
# =========================

@router.post("/end-session/{session_id}")
def end_session(session_id: str):
    try:
        object_id = ObjectId(session_id)
    except Exception:
        return {"error": "Invalid session_id"}


    result = sessions_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": "completed",
                "endedAt": datetime.utcnow().isoformat(),
            }
        }
    )

    if result.matched_count == 0:
        return {"error": "Session not found"}

    return {"message": "Session ended successfully"}

