from __future__ import annotations

import asyncio
import os
import sys
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from pymongo import MongoClient

# Make local model package importable: /model/trauma_ai
ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT_DIR / "model"
if MODEL_DIR.exists():
    sys.path.insert(0, str(MODEL_DIR))

ConversationEngine = None
EngineConfig = None
_engine_init_error = None

try:
    from trauma_engine import ConversationEngine, EngineConfig  # type: ignore
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

# Local In-Memory DB (Replaces MongoDB)
class MockCollection:
    def __init__(self):
        self.data = {}
        
    def find_one(self, query):
        return self.data.get(query.get("session_id"))
        
    def insert_one(self, doc):
        self.data[doc.get("session_id")] = doc
        
    def update_one(self, query, update):
        doc = self.data.get(query.get("session_id"))
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            if "$push" in update:
                for k, v in update["$push"].items():
                    doc.setdefault(k, []).append(v)

sessions_collection = MockCollection()


# =========================
# ENGINE SETUP
# =========================

engine = None
if ConversationEngine and EngineConfig:
    try:
        engine = ConversationEngine(
            EngineConfig(
                mode=os.environ.get("TRAUMA_ENGINE_MODE", "offline"),
                llm_provider=os.environ.get("LLM_PROVIDER", "ollama"),
                llm_api_key=os.environ.get("LLM_API_KEY"),
                llm_model=os.environ.get("LLM_MODEL", "llama3.1"),
                ollama_url=os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate"),
            )
        )
    except Exception as exc:  # pragma: no cover
        _engine_init_error = str(exc)


class StartSessionResponse(BaseModel):
    session_id: str


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


def process_text_with_engine(
    session_id: str,
    session: dict[str, Any],
    message: str,
) -> tuple[str, dict[str, Any], str, str | None, str | None]:
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

    return next_question, updated_json, mode_used, phase, engine_session_id


def process_audio_with_engine(
    session_id: str,
    session: dict[str, Any],
    audio_file_path: str,
) -> tuple[str, dict[str, Any], str, str | None, str | None, str, bool, str]:
    next_question = "Thank you for sharing. Please continue when you are ready."
    updated_json: dict[str, Any] = session.get("memory", {})
    mode_used = "fallback"
    phase = None
    transcript_text = ""
    transcription_ok = False
    processing_note = ""

    engine_session_id, greeting_if_created = ensure_engine_session(session)
    if greeting_if_created and not session.get("current_question"):
        sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"current_question": normalize_question(greeting_if_created)}},
        )

    if engine and engine_session_id:
        try:
            # Stage 1: explicit transcription (more reliable for debugging than
            # inferring from conversation history mutations).
            audio_processor = getattr(engine, "_audio_processor", None)
            if audio_processor and getattr(audio_processor, "is_available", False):
                transcript_text = (audio_processor.process_audio(audio_file_path) or "").strip()
            else:
                transcript_text = ""
                processing_note = "Audio processor is unavailable inside engine."

            if transcript_text:
                transcription_ok = True
                # Stage 2: run the normal model pipeline with transcribed text.
                (
                    next_question,
                    updated_json,
                    mode_used,
                    phase,
                    _,
                ) = process_text_with_engine(session_id, session, transcript_text)
            else:
                transcription_ok = False
                if not processing_note:
                    processing_note = "Transcription returned empty text from audio."
                next_question = "I could not hear clear speech in the recording. Please try again."
        except Exception as exc:  # pragma: no cover
            print("Engine process_audio error:", exc)
            next_question = "I could not process the audio. Please try again."
            transcript_text = ""
            processing_note = f"Engine audio processing exception: {exc}"
    elif not engine:
        processing_note = "Engine is not initialized."
    else:
        processing_note = "Engine session unavailable for audio processing."

    return (
        next_question,
        updated_json,
        mode_used,
        phase,
        engine_session_id,
        transcript_text,
        transcription_ok,
        processing_note,
    )


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
async def submit_answer(session_id: str, request: Request):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found"}

    content_type = request.headers.get("content-type", "")
    message = ""
    transcript_text = ""

    next_question = "Thank you for sharing. Please continue when you are ready."
    updated_json: dict[str, Any] = session.get("memory", {})
    mode_used = "fallback"
    phase = None
    engine_session_id: str | None = None
    audio_debug: dict[str, Any] = {
        "frontend_audio_sent": False,
        "backend_received_file": False,
        "uploaded_filename": None,
        "uploaded_content_type": None,
        "uploaded_size_bytes": 0,
        "transcription_attempted": False,
        "transcription_ok": False,
        "transcript_length": 0,
        "model_processed": False,
        "note": "",
    }

    if content_type.startswith("application/json"):
        payload = await request.json()
        message = str(payload.get("message", "")).strip()
        if not message:
            return {"error": "Message cannot be empty"}

        (
            next_question,
            updated_json,
            mode_used,
            phase,
            engine_session_id,
        ) = process_text_with_engine(session_id, session, message)
        transcript_text = message
    elif content_type.startswith("multipart/form-data"):
        form = await request.form()
        form_message = str(form.get("message", "")).strip()
        audio = form.get("file")

        if form_message:
            message = form_message
            (
                next_question,
                updated_json,
                mode_used,
                phase,
                engine_session_id,
            ) = process_text_with_engine(session_id, session, message)
            transcript_text = message
        elif audio:
            audio_debug["frontend_audio_sent"] = True
            audio_debug["backend_received_file"] = True
            filename = getattr(audio, "filename", "") or "audio.webm"
            uploaded_content_type = getattr(audio, "content_type", None)
            audio_bytes = await audio.read()
            size_bytes = len(audio_bytes)
            audio_debug["uploaded_filename"] = filename
            audio_debug["uploaded_content_type"] = uploaded_content_type
            audio_debug["uploaded_size_bytes"] = size_bytes
            print(
                f"[AUDIO] session={session_id} filename={filename} "
                f"content_type={uploaded_content_type} size={size_bytes} bytes"
            )
            if size_bytes <= 0:
                audio_debug["note"] = "Uploaded audio file is empty."
                return {"error": "Uploaded audio is empty.", "audio_debug": audio_debug}

            suffix = Path(filename).suffix or ".webm"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_path = temp_audio.name

            try:
                audio_debug["transcription_attempted"] = True
                (
                    next_question,
                    updated_json,
                    mode_used,
                    phase,
                    engine_session_id,
                    transcript_text,
                    transcription_ok,
                    processing_note,
                ) = process_audio_with_engine(session_id, session, temp_path)
                audio_debug["transcription_ok"] = transcription_ok
                audio_debug["note"] = processing_note
            finally:
                try:
                    os.remove(temp_path)
                except OSError:
                    pass
        else:
            return {"error": "Provide text message or audio file."}
    else:
        return {"error": "Unsupported content type. Use JSON or multipart/form-data."}

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
                    "input_type": "audio" if audio_debug["frontend_audio_sent"] else "text",
                    "user_message": transcript_text or message,
                    "assistant_question": next_question,
                    "audio_debug": audio_debug if audio_debug["frontend_audio_sent"] else None,
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
    if transcript_text:
        audio_debug["transcript_length"] = len(transcript_text)
        audio_debug["model_processed"] = True
    elif not audio_debug["frontend_audio_sent"]:
        audio_debug["model_processed"] = True
    print(
        f"[PIPELINE] session={session_id} input_type="
        f"{'audio' if audio_debug['frontend_audio_sent'] else 'text'} "
        f"transcription_ok={audio_debug['transcription_ok']} "
        f"model_processed={audio_debug['model_processed']}"
    )

    return {
        "next_question": next_question,
        "mode_used": mode_used,
        "phase": phase,
        "status": "updated",
        "transcript_text": transcript_text or message,
        "audio_debug": audio_debug,
        "engine_available": bool(engine),
        "engine_init_error": _engine_init_error,
    }


@app.get("/history/{session_id}")
def get_history(session_id: str):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found"}
    return {
        "session_id": session_id,
        "history": session.get("history", []),
    }


@app.get("/testimony/{session_id}")
def get_testimony(session_id: str):
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        return {"error": "Session not found"}
        
    engine_session_id = session.get("engine_session_id")
    if not engine or not engine_session_id:
        return {"error": "Engine not available"}
        
    structured_data = engine.get_testimony(engine_session_id)
    return {"structured_data": structured_data}

# =========================
# RUN SERVER
# =========================
# Run using:
# uvicorn main:app --reload
