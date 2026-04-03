from fastapi import APIRouter
from database import sessions_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/start-session")
def start_session():
    session = {
        "createdAt": datetime.utcnow(),
        "conversation": [],
        "status": "in_progress"
    }

    result = sessions_collection.insert_one(session)
    return {"session_id": str(result.inserted_id)}


from pydantic import BaseModel

class AddResponsePayload(BaseModel):
    session_id: str
    question: str
    answer_text: str
    emotion: str

@router.post("/add-response")
def add_response(data: AddResponsePayload):
    session_id = data.session_id

    sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {
                "conversation": {
                    "question": data.question,
                    "answer_text": data.answer_text,
                    "emotion": data.emotion,
                    "timestamp": datetime.utcnow()
                }
            }
        }
    )

    return {"message": "Saved"}