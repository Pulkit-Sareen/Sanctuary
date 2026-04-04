from __future__ import annotations

import asyncio
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient

# Make local model package importable: /model/trauma_ai
ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT_DIR / "model"
if MODEL_DIR.exists():
    sys.path.insert(0, str(MODEL_DIR))

ConversationEngine = None
EngineConfig = None
_engine_init_error = None

try:
    from trauma_ai import ConversationEngine, EngineConfig  # type: ignore
except Exception as exc:  # pragma: no cover
    _engine_init_error = str(exc)


app = FastAPI()

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

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["trauma_db"]
sessions_collection = db["sessions"]


# =========================
# ENGINE SETUP
# =========================

engine = None
if ConversationEngine and EngineConfig:
    try:
        engine = ConversationEngine(
            EngineConfig(
                mode=os.environ.get("TRAUMA_ENGINE_MODE", "offline"),
                llm_provider=os.environ.get("LLM_PROVIDER", "openai"),
                llm_api_key=os.environ.get("LLM_API_KEY"),
                llm_model=os.environ.get("LLM_MODEL", "gpt-4o"),
            )
        )
    except Exception as exc:  # pragma: no cover
        _engine_init_error = str(exc)


class StartSessionResponse(BaseModel):
    session_id: str


class SubmitTextRequest(BaseModel):
    message: str


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)

    async def send_update(self, session_id: str, data: dict[str, Any]):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)


manager = ConnectionManager()


def normalize_question(text: Any) -> str:
    if isinstance(text, str) and text.strip():
        return text.strip()
    return "Please continue."


def ensure_engine_session(session: dict[str, Any]) -> tuple[str | None, str | None]:
    """
    Returns (engine_session_id, greeting_if_new_session).
    """
    if not engine:
        return None, None

    existing = session.get("engine_session_id")
    if isinstance(existing, str) and existing and engine.get_session(existing):
        return existing, None

    engine_session_id, greeting = engine.start_session()
    return engine_session_id, greeting


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    try:
        manager.active_connections[session_id] = websocket
        session = sessions_collection.find_one({"session_id": session_id})

        if session:
            await websocket.send_json(
                {
                    "type": "question_update",
                    "question": normalize_question(session.get("current_question")),
                }
            )
        else:
            await websocket.send_json({"type": "error", "message": "Session not found"})

        while True:
            await asyncio.sleep(1)

    except Exception as exc:  # pragma: no cover
        print("WebSocket error:", exc)

    finally:
        manager.disconnect(session_id)


@app.post("/start-session", response_model=StartSessionResponse)
def start_session():
    session_id = str(uuid.uuid4())

    current_question = "Please share what happened, in your own words."
    engine_session_id = None

    if engine:
        try:
            engine_session_id, greeting = engine.start_session()
            current_question = normalize_question(greeting)
        except Exception as exc:  # pragma: no cover
            print("Engine start_session error:", exc)

    session_data = {
        "session_id": session_id,
        "engine_session_id": engine_session_id,
        "created_at": datetime.utcnow(),
        "memory": {},
        "history": [],
        "current_question": current_question,
    }

    sessions_collection.insert_one(session_data)
    return {"session_id": session_id}


@app.get("/next-question/{session_id}")
def get_next_question(session_id: str):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found"}

    return {"question": normalize_question(session.get("current_question"))}


@app.post("/submit-answer/{session_id}")
async def submit_answer(session_id: str, payload: SubmitTextRequest):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found"}

    message = payload.message.strip()
    if not message:
        return {"error": "Message cannot be empty"}

    next_question = "Thank you for sharing. Please continue when you are ready."
    updated_json: dict[str, Any] = session.get("memory", {})
    mode_used = "fallback"
    phase = None

    engine_session_id, greeting_if_created = ensure_engine_session(session)
    if greeting_if_created and not session.get("current_question"):
        sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"current_question": normalize_question(greeting_if_created)}},
        )

    if engine and engine_session_id:
        try:
            engine_response = engine.process_message(engine_session_id, message)
            next_question = normalize_question(engine_response.response_text)
            updated_json = engine.get_testimony(engine_session_id)
            mode_used = engine_response.mode_used or "offline"
            phase_value = engine_response.phase
            phase = getattr(phase_value, "value", str(phase_value))
        except Exception as exc:  # pragma: no cover
            print("Engine process_message error:", exc)
            next_question = (
                "I heard you. Could you share a little more detail about what happened next?"
            )

    sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "engine_session_id": engine_session_id,
                "memory": updated_json,
                "current_question": next_question,
                "last_updated": datetime.utcnow(),
            },
            "$push": {
                "history": {
                    "user_message": message,
                    "assistant_question": next_question,
                    "mode_used": mode_used,
                    "phase": phase,
                    "timestamp": datetime.utcnow(),
                }
            },
        },
    )

    await manager.send_update(
        session_id,
        {
            "type": "question_update",
            "question": next_question,
        },
    )

    return {
        "next_question": next_question,
        "mode_used": mode_used,
        "phase": phase,
        "status": "updated",
        "engine_available": bool(engine),
        "engine_init_error": _engine_init_error,
    }


@app.get("/final-testimony/{session_id}")
def get_final_testimony(session_id: str):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found"}

    structured_data = session.get("memory", {})
    final_text = (
        structured_data.get("narrative_summary")
        if isinstance(structured_data, dict)
        else None
    ) or f"The incident details are as follows: {structured_data}"

    return {
        "structured_data": structured_data,
        "final_testimony": final_text,
    }
