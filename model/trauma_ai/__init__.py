"""
Trauma-Informed Legal Documentation AI Engine
==============================================

A Python AI/ML package that helps survivors of trauma safely document
their experiences in a legally structured JSON format.

Quick Start
-----------
    from trauma_ai import ConversationEngine, EngineConfig

    engine = ConversationEngine()
    session_id, greeting = engine.start_session()
    response = engine.process_message(session_id, "I remember...")
    testimony_json = engine.export_testimony(session_id)
"""

from .config import EngineConfig
from .models import (
    Phase,
    DistressLevel,
    Testimony,
    EngineResponse,
    SessionState,
)
from .conversation_engine import ConversationEngine
from .testimony_builder import TestimonyBuilder
from .extractors import EntityExtractor
from .distress_detector import DistressDetector
from .response_generator import ResponseGenerator
from .llm_client import LLMClient
from .audio_processor import AudioProcessor
from .grounding import (
    get_random_exercise,
    get_exercise_by_type,
    format_exercise,
)

__version__ = "1.0.0"

__all__ = [
    # Primary API
    "ConversationEngine",
    "EngineConfig",
    # Models
    "Phase",
    "DistressLevel",
    "Testimony",
    "EngineResponse",
    "SessionState",
    # Components (for advanced use)
    "TestimonyBuilder",
    "EntityExtractor",
    "DistressDetector",
    "ResponseGenerator",
    "LLMClient",
    "AudioProcessor",
    # Utilities
    "get_random_exercise",
    "get_exercise_by_type",
    "format_exercise",
]
