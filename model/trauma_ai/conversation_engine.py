"""
Conversation Engine — the main orchestration layer.

This is the primary API that your backend should call. It manages:
- Session lifecycle (create, process messages, export)
- Phase management (Free Expression → Synthesis → Clarification → Update)
- Dual-mode operation (offline NLP + LLM fallback)
- Distress detection and grounding interventions
- Testimony building and export

Usage
-----
    from trauma_ai import ConversationEngine, EngineConfig

    config = EngineConfig(mode="hybrid", llm_api_key="sk-...")
    engine = ConversationEngine(config)

    # Start a session
    session_id, greeting = engine.start_session()

    # Process messages
    response = engine.process_message(session_id, "I remember the smell...")

    # Get testimony JSON
    testimony = engine.get_testimony(session_id)

    # Export
    json_str = engine.export_testimony(session_id)
"""

from __future__ import annotations

import re
import logging
from typing import Optional

from .config import EngineConfig
from .models import (
    Phase,
    DistressLevel,
    EngineResponse,
    SessionState,
)
from .extractors import EntityExtractor
from .distress_detector import DistressDetector
from .testimony_builder import TestimonyBuilder
from .response_generator import ResponseGenerator
from .llm_client import LLMClient
from .audio_processor import AudioProcessor
from .grounding import get_random_exercise, format_exercise
from .prompts import format_full_synthesis

logger = logging.getLogger(__name__)


class ConversationEngine:
    """
    Main API for the Trauma-Informed Legal Documentation AI Engine.

    Manages sessions, processes survivor messages, builds testimony,
    and generates appropriate responses.
    """

    def __init__(self, config: Optional[EngineConfig] = None):
        """
        Parameters
        ----------
        config : EngineConfig, optional
            Engine configuration. Uses defaults if not provided.
        """
        self._config = config or EngineConfig()
        self._sessions: dict[str, SessionState] = {}
        self._builders: dict[str, TestimonyBuilder] = {}
        self._linguistic_baselines = {}

        # Initialize components
        self._extractor = EntityExtractor(self._config.spacy_model)
        self._distress_detector = DistressDetector(
            self._config.distress_keyword_threshold
        )
        self._response_gen = ResponseGenerator()
        self._llm_client = LLMClient(self._config)
        self._audio_processor = AudioProcessor(model_size="base")

        logger.info(
            "ConversationEngine initialized. Mode: %s, LLM available: %s, Audio available: %s",
            self._config.mode,
            self._llm_client.is_available,
            self._audio_processor.is_available,
        )

    # =================================================================
    # Session Management
    # =================================================================

    def start_session(self) -> tuple[str, str]:
        """
        Start a new documentation session.

        Returns
        -------
        tuple[str, str]
            (session_id, greeting_message)
        """
        state = SessionState()
        # Initialize linguistic tracking
        from .models import LinguisticBaseline
        self._linguistic_baselines[state.session_id] = LinguisticBaseline()
        
        session_id = state.session_id

        self._sessions[session_id] = state
        self._builders[session_id] = TestimonyBuilder(state.testimony)

        greeting = self._response_gen.get_greeting()

        # Add greeting to conversation history
        state.conversation_history.append({
            "role": "assistant",
            "content": greeting,
        })

        logger.info("Session started: %s", session_id)
        return session_id, greeting

    def get_session(self, session_id: str) -> Optional[SessionState]:
        """Get session state by ID."""
        return self._sessions.get(session_id)

    def list_sessions(self) -> list[str]:
        """List all active session IDs."""
        return list(self._sessions.keys())

    # =================================================================
    # Message Processing
    # =================================================================

    def process_message(
        self, session_id: str, message: str
    ) -> EngineResponse:
        """
        Process a survivor's message.

        This is the main entry point for each message. It:
        1. Detects distress level
        2. Extracts entities and details (offline NLP)
        3. Integrates into testimony
        4. Generates an appropriate response
        5. Checks for phase transitions

        Parameters
        ----------
        session_id : str
            The session ID.
        message : str
            The survivor's message.

        Returns
        -------
        EngineResponse
            Complete response with text, phase, distress info, and testimony.
        """
        state = self._sessions.get(session_id)
        if not state:
            raise ValueError(f"Session not found: {session_id}")

        builder = self._builders[session_id]
        message = message.strip()

        if not message:
            return EngineResponse(
                response_text="Take your time. I'm here whenever you're ready to share.",
                phase=state.phase,
            )

        # Add user message to conversation history
        state.conversation_history.append({
            "role": "user",
            "content": message,
        })
        state.message_count += 1

        # 1. Detect distress using keywords and linguistic shifts
        baseline = self._linguistic_baselines.get(session_id)
        distress = self._distress_detector.detect(message, baseline)
        state.distress_history.append(distress)

        # 2. Check if we need to pause for distress
        should_pause = self._distress_detector.should_pause(
            distress,
            state.distress_history,
            self._config.consecutive_distress_limit,
        )

        if should_pause:
            return self._handle_distress(state, distress)

        # 3. Check for special commands / phase signals
        phase_signal = self._detect_phase_signal(message)
        if phase_signal:
            return self._handle_phase_transition(
                state, builder, phase_signal
            )

        # 4. Process based on current phase
        if state.phase == Phase.FREE_EXPRESSION:
            return self._process_free_expression(
                state, builder, message, distress
            )
        elif state.phase == Phase.SYNTHESIS:
            return self._process_synthesis(state, builder, message, distress)
        elif state.phase == Phase.CLARIFICATION:
            return self._process_clarification(
                state, builder, message, distress
            )
        elif state.phase == Phase.UPDATE:
            return self._process_update(state, builder, message, distress)
        else:
            return self._process_free_expression(
                state, builder, message, distress
            )

    # =================================================================
    # Phase Processors
    # =================================================================

    def _process_free_expression(
        self,
        state: SessionState,
        builder: TestimonyBuilder,
        message: str,
        distress: DistressLevel,
    ) -> EngineResponse:
        """Process a message during the free expression phase."""
        # Extract and integrate
        fragment_id = self._next_fragment_id(state)
        extraction = self._extractor.extract_all(message, fragment_id)
        counts = builder.integrate_extraction(
            message, extraction, fragment_id, Phase.FREE_EXPRESSION, state.last_assistant_prompt
        )

        # Generate response
        mode_used = "offline"
        if self._should_use_llm():
            llm_response = self._llm_client.generate_response(
                state.conversation_history
            )
            if llm_response:
                response_text = llm_response
                mode_used = "llm"
            else:
                response_text = self._response_gen.generate_free_expression_response(
                    counts,
                    state.message_count,
                    self._config.min_messages_before_synthesis,
                )
        else:
            response_text = self._response_gen.generate_free_expression_response(
                counts,
                state.message_count,
                self._config.min_messages_before_synthesis,
            )

        # Inject a gentler clarification question every 2 messages
        if state.message_count % 2 == 1:
            gaps = builder.analyse_gaps()
            if gaps:
                from .models import GapImportance
                from .prompts import CLARIFICATION_TEMPLATES
                import random
                gaps.sort(key=lambda g: 0 if g.importance == GapImportance.CRITICAL else (1 if g.importance == GapImportance.HIGH else 2))
                category = gaps[0].category
                questions = CLARIFICATION_TEMPLATES.get(category, [])
                if questions:
                    response_text += "\n\n" + random.choice(questions)

        state.last_assistant_prompt = response_text

        # Add to history
        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            distress_level=distress,
            testimony_snapshot=(
                builder.get_testimony_dict()
                if self._config.include_testimony_in_response
                else None
            ),
            mode_used=mode_used,
        )

    def _process_synthesis(
        self,
        state: SessionState,
        builder: TestimonyBuilder,
        message: str,
        distress: DistressLevel,
    ) -> EngineResponse:
        """Process messages during synthesis phase."""
        # If user confirms wanting synthesis
        if self._is_affirmative(message):
            return self._generate_synthesis(state, builder, distress)

        # If user wants to continue sharing
        if self._is_negative(message) or len(message) > 30:
            state.phase = Phase.FREE_EXPRESSION
            return self._process_free_expression(
                state, builder, message, distress
            )

        # Ambiguous — offer choice
        response_text = (
            "I want to make sure I do what feels right for you. "
            "Would you like me to:\n\n"
            "1. **Organize** what you've shared so far into a summary\n"
            "2. **Continue listening** — you can keep sharing\n\n"
            "Either choice is perfectly fine."
        )
        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            distress_level=distress,
        )

    def _process_clarification(
        self,
        state: SessionState,
        builder: TestimonyBuilder,
        message: str,
        distress: DistressLevel,
    ) -> EngineResponse:
        """Process answers to clarification questions."""
        # Check if they can't remember or want to skip
        cant_remember_signals = [
            "don't remember", "can't remember", "not sure", "don't know",
            "can't recall", "no idea", "skip", "i forget", "don't recall",
            "next question", "pass",
        ]
        is_cant_remember = any(
            signal in message.lower() for signal in cant_remember_signals
        )

        has_more = (
            state.current_clarification_index
            < len(state.pending_clarifications) - 1
        )

        if is_cant_remember:
            response_text = self._response_gen.generate_cant_remember_response(
                has_more
            )
        else:
            # Extract from the answer and integrate
            extraction = self._extractor.extract_all(message, state.fragment_counter)
            counts = builder.integrate_extraction(
                message, extraction, state.fragment_counter, Phase.CLARIFICATION, state.last_assistant_prompt
            )

            if self._should_use_llm():
                llm_resp = self._llm_client.generate_response(
                    state.conversation_history
                )
                if llm_resp:
                    response_text = llm_resp
                else:
                    response_text = self._response_gen.generate_clarification_ack(
                        counts, has_more
                    )
            else:
                response_text = self._response_gen.generate_clarification_ack(
                    counts, has_more
                )

        # Advance to next question or move to update phase
        state.current_clarification_index += 1

        if state.current_clarification_index < len(state.pending_clarifications):
            next_q = state.pending_clarifications[
                state.current_clarification_index
            ]
            response_text += (
                "\n\n"
                + self._response_gen.generate_clarification_question(next_q)
            )
        else:
            # All questions asked — move to update
            state.phase = Phase.UPDATE
            if Phase.CLARIFICATION.value not in state.testimony.session_metadata.phases_completed:
                state.testimony.session_metadata.phases_completed.append(
                    Phase.CLARIFICATION.value
                )

            # Generate updated synthesis
            sections = builder.generate_synthesis_sections()
            synthesis_text = format_full_synthesis(sections)
            response_text += (
                "\n\n"
                + self._response_gen.generate_update_response(synthesis_text)
            )

        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            distress_level=distress,
            testimony_snapshot=(
                builder.get_testimony_dict()
                if self._config.include_testimony_in_response
                else None
            ),
        )

    def _process_update(
        self,
        state: SessionState,
        builder: TestimonyBuilder,
        message: str,
        distress: DistressLevel,
    ) -> EngineResponse:
        """Process messages during the update/review phase."""
        # Check if they're adding more info
        if len(message) > 20 and not self._is_affirmative(message):
            # Treat as additional info
            fragment_id = self._next_fragment_id(state)
            extraction = self._extractor.extract_all(message, fragment_id)
            builder.integrate_extraction(
                message, extraction, fragment_id, Phase.UPDATE
            )

            sections = builder.generate_synthesis_sections()
            synthesis_text = format_full_synthesis(sections)

            response_text = self._response_gen.generate_update_response(
                synthesis_text
            )
        elif self._is_affirmative(message):
            # Finalize
            state.phase = Phase.FINALIZED
            if Phase.UPDATE.value not in state.testimony.session_metadata.phases_completed:
                state.testimony.session_metadata.phases_completed.append(
                    Phase.UPDATE.value
                )
            builder.analyse_gaps()
            builder.assess_strengths()
            builder.generate_narrative_summary()
            response_text = self._response_gen.generate_finalization_response()
        else:
            response_text = (
                "Would you like to add anything else, or does the record "
                "look accurate? Just let me know and I'll finalize it for you."
            )

        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            distress_level=distress,
            testimony_snapshot=(
                builder.get_testimony_dict()
                if self._config.include_testimony_in_response
                else None
            ),
        )

    # =================================================================
    # Phase Transitions
    # =================================================================

    def _detect_phase_signal(self, message: str) -> Optional[str]:
        """Detect if the message signals a phase transition."""
        msg_lower = message.lower().strip()

        # Signals to move to synthesis
        synthesis_signals = [
            "that's all", "that's everything", "i'm done",
            "nothing else", "done sharing", "finished",
            "that's it", "summarize", "summary", "organize",
            "ready for summary", "synthesize", "compile",
        ]
        for signal in synthesis_signals:
            if signal in msg_lower:
                return "synthesis"

        # Signals to finalize
        finalize_signals = [
            "looks good", "looks correct", "that's accurate",
            "it's accurate", "finalize", "finish", "export",
            "download", "save it", "all done",
        ]
        for signal in finalize_signals:
            if signal in msg_lower:
                return "finalize"

        # Signal for grounding exercise
        grounding_signals = [
            "grounding", "need a break", "breathing",
            "exercise", "calm down", "help me relax",
        ]
        for signal in grounding_signals:
            if signal in msg_lower:
                return "grounding"

        return None

    def _handle_phase_transition(
        self,
        state: SessionState,
        builder: TestimonyBuilder,
        signal: str,
    ) -> EngineResponse:
        """Handle an explicit phase transition."""
        if signal == "synthesis":
            state.phase = Phase.SYNTHESIS
            if Phase.FREE_EXPRESSION.value not in state.testimony.session_metadata.phases_completed:
                state.testimony.session_metadata.phases_completed.append(
                    Phase.FREE_EXPRESSION.value
                )
            response_text = self._response_gen.generate_synthesis_offer()

            state.conversation_history.append({
                "role": "assistant",
                "content": response_text,
            })

            return EngineResponse(
                response_text=response_text,
                phase=state.phase,
            )

        elif signal == "finalize":
            return self._process_update(
                state, builder, "yes", DistressLevel.NONE
            )

        elif signal == "grounding":
            exercise = get_random_exercise(state.grounding_preferences)
            response_text = (
                "Of course. Let's take a moment.\n\n"
                + format_exercise(exercise)
                + "\n\nWhenever you're ready to continue — or if you'd "
                "like to stop for today — just let me know."
            )
            state.conversation_history.append({
                "role": "assistant",
                "content": response_text,
            })

            return EngineResponse(
                response_text=response_text,
                phase=state.phase,
                grounding_suggested=True,
                grounding_exercise=exercise["instruction"],
            )

        # Default
        return EngineResponse(
            response_text="I'm here. What would you like to do?",
            phase=state.phase,
        )

    def _generate_synthesis(
        self,
        state: SessionState,
        builder: TestimonyBuilder,
        distress: DistressLevel,
    ) -> EngineResponse:
        """Generate and present the synthesis."""
        mode_used = "offline"

        if Phase.SYNTHESIS.value not in state.testimony.session_metadata.phases_completed:
            state.testimony.session_metadata.phases_completed.append(
                Phase.SYNTHESIS.value
            )

        # Try LLM synthesis first
        if self._should_use_llm():
            sections = builder.generate_synthesis_sections()
            offline_summary = format_full_synthesis(sections)
            llm_synthesis = self._llm_client.generate_synthesis(
                state.conversation_history, offline_summary
            )
            if llm_synthesis:
                response_text = (
                    "Here is a structured summary of what you've shared:\n\n"
                    f"{llm_synthesis}\n\n"
                    "Please review this carefully. Does it accurately "
                    "reflect what you've told me? Is there anything that "
                    "needs to be changed or that I've missed?"
                )
                mode_used = "llm"
            else:
                sections = builder.generate_synthesis_sections()
                response_text = self._response_gen.generate_synthesis_response(
                    sections
                )
        else:
            sections = builder.generate_synthesis_sections()
            response_text = self._response_gen.generate_synthesis_response(
                sections
            )

        # Analyse gaps and prepare clarification questions
        gaps = builder.analyse_gaps()
        builder.assess_strengths()
        state.synthesis_done = True

        # Prepare clarification questions
        clarification_questions = [
            gap.clarification_question
            for gap in gaps
            if gap.clarification_question and not gap.addressed
        ]

        # Limit questions
        clarification_questions = clarification_questions[
            : self._config.max_clarification_questions
        ]
        state.pending_clarifications = clarification_questions

        # Append transition to clarification
        if clarification_questions:
            response_text += (
                "\n\n"
                + self._response_gen.generate_clarification_intro()
                + "\n\n"
                + self._response_gen.generate_clarification_question(
                    clarification_questions[0]
                )
            )
            state.phase = Phase.CLARIFICATION
            state.current_clarification_index = 0
        else:
            # No gaps — go straight to update
            state.phase = Phase.UPDATE
            response_text += (
                "\n\nYour account appears quite comprehensive. "
                "Does everything look accurate, or would you like to "
                "add or change anything?"
            )

        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            distress_level=distress,
            testimony_snapshot=(
                builder.get_testimony_dict()
                if self._config.include_testimony_in_response
                else None
            ),
            clarification_questions=clarification_questions,
            mode_used=mode_used,
        )

    # =================================================================
    # Distress Handling
    # =================================================================

    def _handle_distress(
        self, state: SessionState, level: DistressLevel
    ) -> EngineResponse:
        """Handle a distress detection."""
        response_text = (
            self._response_gen.generate_distress_response(level) or ""
        )

        # Add grounding exercise for high distress
        grounding_exercise = None
        if level in (DistressLevel.HIGH, DistressLevel.CRITICAL):
            exercise = get_random_exercise(state.grounding_preferences)
            grounding_exercise = exercise["instruction"]
            if level == DistressLevel.HIGH:
                response_text += "\n\n" + format_exercise(exercise)

        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            distress_level=level,
            grounding_suggested=True,
            grounding_exercise=grounding_exercise,
        )

    # =================================================================
    # Testimony Access & Export
    # =================================================================

    def get_testimony(self, session_id: str) -> dict:
        """
        Get the current testimony as a dictionary.

        Parameters
        ----------
        session_id : str
            The session ID.

        Returns
        -------
        dict
            The complete testimony.
        """
        builder = self._builders.get(session_id)
        if not builder:
            raise ValueError(f"Session not found: {session_id}")
        return builder.get_testimony_dict()

    def export_testimony(
        self, session_id: str, indent: int = 2
    ) -> str:
        """
        Export the testimony as a formatted JSON string.

        Parameters
        ----------
        session_id : str
            The session ID.
        indent : int
            JSON indentation level.

        Returns
        -------
        str
            JSON string of the complete testimony.
        """
        builder = self._builders.get(session_id)
        if not builder:
            raise ValueError(f"Session not found: {session_id}")
        return builder.get_testimony_json(indent=indent)

    def get_grounding_exercise(self, session_id: str = None) -> dict[str, str]:
        """Get a random or adaptive grounding exercise."""
        prefs = None
        if session_id and session_id in self._sessions:
            prefs = self._sessions[session_id].grounding_preferences
            
        exercise = get_random_exercise(prefs)
        return {
            "name": exercise["name"],
            "type": exercise["type"],
            "instruction": exercise["instruction"],
            "formatted": format_exercise(exercise),
        }
        
    def process_audio(self, session_id: str, audio_path: str) -> EngineResponse:
        """
        Process a survivor's voice recording completely offline.
        Requirements: 'openai-whisper' python package installed, and ffmpeg binary.
        """
        state = self._sessions.get(session_id)
        if not state:
            raise ValueError(f"Session not found: {session_id}")
            
        if not self._audio_processor.is_available:
            msg = "Audio processing is not available. Please install 'openai-whisper' and 'ffmpeg'."
            state.conversation_history.append({"role": "assistant", "content": msg})
            return EngineResponse(response_text=msg, phase=state.phase)
            
        text = self._audio_processor.process_audio(audio_path)
        if not text:
            msg = "I'm sorry, I couldn't quite hear the audio recording. Could you try sharing again?"
            state.conversation_history.append({"role": "assistant", "content": msg})
            return EngineResponse(response_text=msg, phase=state.phase)
            
        return self.process_message(session_id, text)

    # =================================================================
    # Manual Phase Control (for backend use)
    # =================================================================

    def advance_to_synthesis(self, session_id: str) -> EngineResponse:
        """Manually advance a session to the synthesis phase."""
        state = self._sessions.get(session_id)
        builder = self._builders.get(session_id)
        if not state or not builder:
            raise ValueError(f"Session not found: {session_id}")

        state.phase = Phase.SYNTHESIS
        return self._generate_synthesis(state, builder, DistressLevel.NONE)

    def advance_to_clarification(
        self, session_id: str
    ) -> EngineResponse:
        """Manually advance to clarification phase."""
        state = self._sessions.get(session_id)
        builder = self._builders.get(session_id)
        if not state or not builder:
            raise ValueError(f"Session not found: {session_id}")

        gaps = builder.analyse_gaps()
        questions = [
            g.clarification_question
            for g in gaps
            if g.clarification_question and not g.addressed
        ]
        state.pending_clarifications = questions
        state.current_clarification_index = 0
        state.phase = Phase.CLARIFICATION

        if questions:
            intro = self._response_gen.generate_clarification_intro()
            first_q = self._response_gen.generate_clarification_question(
                questions[0]
            )
            response_text = f"{intro}\n\n{first_q}"
        else:
            response_text = (
                "Your testimony appears quite complete. "
                "Is there anything else you'd like to add?"
            )
            state.phase = Phase.UPDATE

        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            clarification_questions=questions,
        )

    def finalize_session(self, session_id: str) -> EngineResponse:
        """Manually finalize a session."""
        state = self._sessions.get(session_id)
        builder = self._builders.get(session_id)
        if not state or not builder:
            raise ValueError(f"Session not found: {session_id}")

        state.phase = Phase.FINALIZED
        builder.analyse_gaps()
        builder.assess_strengths()
        builder.generate_narrative_summary()

        response_text = self._response_gen.generate_finalization_response()
        state.conversation_history.append({
            "role": "assistant",
            "content": response_text,
        })

        return EngineResponse(
            response_text=response_text,
            phase=state.phase,
            testimony_snapshot=builder.get_testimony_dict(),
        )

    # =================================================================
    # Helpers
    # =================================================================

    def _should_use_llm(self) -> bool:
        """Determine if LLM should be used based on config and availability."""
        if self._config.mode == "llm":
            return self._llm_client.is_available
        elif self._config.mode == "hybrid":
            return self._llm_client.is_available
        return False

    def _next_fragment_id(self, state: SessionState) -> int:
        """Get the next fragment ID for a session."""
        state.fragment_counter += 1
        return state.fragment_counter

    @staticmethod
    def _is_affirmative(text: str) -> bool:
        """Check if the message is an affirmative response."""
        affirm_patterns = [
            r"\byes\b", r"\byeah\b", r"\byep\b", r"\bsure\b",
            r"\bokay\b", r"\bok\b", r"\bgo ahead\b", r"\bplease\b",
            r"\bdo it\b", r"\bcorrect\b", r"\baccurate\b",
            r"\bthat's right\b", r"\blooks good\b", r"\blgtm\b",
            r"\bconfirm\b", r"\bagree\b",
        ]
        text_lower = text.lower().strip()
        # Short affirmatives
        if len(text_lower) < 30:
            return any(
                re.search(p, text_lower) for p in affirm_patterns
            )
        return False

    @staticmethod
    def _is_negative(text: str) -> bool:
        """Check if the message is a negative response."""
        negative_patterns = [
            r"\bno\b", r"\bnope\b", r"\bnah\b", r"\bnot yet\b",
            r"\bwait\b", r"\bhold on\b", r"\bnot now\b",
            r"\bi want to continue\b", r"\bkeep going\b",
            r"\bmore to share\b", r"\bmore to say\b",
        ]
        text_lower = text.lower().strip()
        if len(text_lower) < 50:
            return any(
                re.search(p, text_lower) for p in negative_patterns
            )
        return False
