"""
Tests for the Trauma-Informed Legal Documentation AI Engine.

Tests cover:
- Entity extraction (offline NLP)
- Distress detection
- Testimony building and gap analysis
- Conversation engine flow (full session lifecycle)
- Response generation
"""

import json
import pytest

from trauma_ai import (
    ConversationEngine,
    EngineConfig,
    Phase,
    DistressLevel,
)
from trauma_ai.extractors import EntityExtractor
from trauma_ai.distress_detector import DistressDetector
from trauma_ai.testimony_builder import TestimonyBuilder
from trauma_ai.response_generator import ResponseGenerator
from trauma_ai.models import Testimony


# =====================================================================
# Fixtures
# =====================================================================

@pytest.fixture
def engine():
    """Create an engine in offline-only mode (no API calls)."""
    config = EngineConfig(mode="offline")
    return ConversationEngine(config)


@pytest.fixture
def extractor():
    return EntityExtractor()


@pytest.fixture
def detector():
    return DistressDetector()


@pytest.fixture
def builder():
    return TestimonyBuilder()


@pytest.fixture
def responder():
    return ResponseGenerator()


# =====================================================================
# Extraction Tests
# =====================================================================

class TestExtraction:

    def test_sensory_visual(self, extractor):
        """Test visual sensory extraction."""
        text = "I saw a dark room with shadows on the wall."
        result = extractor.extract_all(text)
        sensory = result["sensory_details"]
        assert len(sensory) > 0
        visual = [s for s in sensory if s.type.value == "visual"]
        assert len(visual) > 0

    def test_sensory_auditory(self, extractor):
        """Test auditory sensory extraction."""
        text = "I heard loud screaming and banging on the door."
        result = extractor.extract_all(text)
        sensory = result["sensory_details"]
        auditory = [s for s in sensory if s.type.value == "auditory"]
        assert len(auditory) > 0

    def test_sensory_olfactory(self, extractor):
        """Test olfactory sensory extraction."""
        text = "The smell of cigarette smoke was overwhelming."
        result = extractor.extract_all(text)
        sensory = result["sensory_details"]
        olfactory = [s for s in sensory if s.type.value == "olfactory"]
        assert len(olfactory) > 0

    def test_sensory_tactile(self, extractor):
        """Test tactile sensory extraction."""
        text = "He grabbed my arm and pushed me against the cold wall."
        result = extractor.extract_all(text)
        sensory = result["sensory_details"]
        tactile = [s for s in sensory if s.type.value == "tactile"]
        assert len(tactile) > 0

    def test_emotion_extraction(self, extractor):
        """Test emotional context extraction."""
        text = "I was terrified and felt completely helpless."
        result = extractor.extract_all(text)
        emotions = result["emotions"]
        assert len(emotions) > 0
        emotion_types = {e.emotion for e in emotions}
        assert "fear" in emotion_types or "helplessness" in emotion_types

    def test_physical_impact(self, extractor):
        """Test physical impact extraction."""
        text = "I had bruises on my arms and a cut on my face."
        result = extractor.extract_all(text)
        physical = result["physical_impacts"]
        assert len(physical) > 0
        body_areas = {p.body_area for p in physical if p.body_area}
        assert len(body_areas) > 0

    def test_location_extraction(self, extractor):
        """Test location extraction."""
        text = "It happened in the basement of an old building."
        result = extractor.extract_all(text)
        locations = result["locations"]
        assert len(locations) > 0

    def test_chronology_extraction(self, extractor):
        """Test time reference extraction."""
        text = "It happened last winter, around midnight."
        result = extractor.extract_all(text)
        chrono = result["chronology_hints"]
        assert len(chrono) > 0

    def test_empty_text(self, extractor):
        """Test extraction with empty text."""
        result = extractor.extract_all("")
        assert result["entities"].persons == []
        assert result["sensory_details"] == []

    def test_entities_object(self, extractor):
        """Test that ExtractedEntities is populated."""
        text = "John hit me in the dark room last January."
        result = extractor.extract_all(text)
        entities = result["entities"]
        assert len(entities.sensory) > 0 or len(entities.emotions) > 0 or len(entities.physical) > 0


# =====================================================================
# Distress Detection Tests
# =====================================================================

class TestDistressDetection:

    def test_critical_distress(self, detector):
        """Test detection of critical distress (suicidal ideation)."""
        text = "I want to die. I can't go on anymore."
        level = detector.detect(text)
        assert level == DistressLevel.CRITICAL

    def test_high_distress(self, detector):
        """Test detection of high distress."""
        text = "I'm having a flashback and I can't breathe."
        level = detector.detect(text)
        assert level == DistressLevel.HIGH

    def test_moderate_distress(self, detector):
        """Test detection of moderate distress."""
        text = "This is really hard to talk about, I need a break."
        level = detector.detect(text)
        assert level in (DistressLevel.MODERATE, DistressLevel.HIGH)

    def test_low_distress(self, detector):
        """Test detection of low distress."""
        text = "I'm a little nervous about sharing this."
        level = detector.detect(text)
        assert level in (DistressLevel.LOW, DistressLevel.MODERATE)

    def test_no_distress(self, detector):
        """Test no distress detection in neutral text."""
        text = "It happened in a building near the park."
        level = detector.detect(text)
        assert level == DistressLevel.NONE

    def test_should_pause_critical(self, detector):
        """Test that critical always triggers a pause."""
        assert detector.should_pause(DistressLevel.CRITICAL, []) is True

    def test_should_pause_high(self, detector):
        """Test that high always triggers a pause."""
        assert detector.should_pause(DistressLevel.HIGH, []) is True

    def test_should_pause_consecutive_moderate(self, detector):
        """Test consecutive moderate triggers a pause."""
        history = [DistressLevel.MODERATE]
        assert detector.should_pause(
            DistressLevel.MODERATE, history, consecutive_limit=2
        ) is True

    def test_no_pause_single_moderate(self, detector):
        """Test single moderate doesn't trigger pause."""
        assert detector.should_pause(
            DistressLevel.MODERATE, [], consecutive_limit=2
        ) is False


# =====================================================================
# Testimony Builder Tests
# =====================================================================

class TestTestimonyBuilder:

    def test_add_fragment(self, builder):
        """Test adding a raw fragment."""
        from trauma_ai.models import ExtractedEntities
        entities = ExtractedEntities()
        builder.add_raw_fragment("test text", 1, Phase.FREE_EXPRESSION, entities)
        assert len(builder.testimony.raw_fragments) == 1
        assert builder.testimony.session_metadata.total_messages == 1

    def test_integrate_extraction(self, builder, extractor):
        """Test full integration of extraction results."""
        text = "I was in a dark room. He grabbed my arm. I was terrified."
        extraction = extractor.extract_all(text, fragment_id=1)
        counts = builder.integrate_extraction(
            text, extraction, 1, Phase.FREE_EXPRESSION
        )
        # Should have extracted something
        total = sum(counts.values())
        assert total > 0

    def test_gap_analysis(self, builder, extractor):
        """Test gap analysis identifies missing information."""
        text = "Something terrible happened to me."
        extraction = extractor.extract_all(text, fragment_id=1)
        builder.integrate_extraction(
            text, extraction, 1, Phase.FREE_EXPRESSION
        )
        gaps = builder.analyse_gaps()
        assert len(gaps) > 0
        # Should identify missing timeline, location, etc.
        categories = {g.category for g in gaps}
        assert "timeline" in categories or "location" in categories

    def test_strength_assessment(self, builder, extractor):
        """Test strength assessment with rich testimony."""
        texts = [
            "I saw him in the dark room around midnight last January.",
            "I heard screaming and smelled cigarette smoke.",
            "He grabbed my arm and I had bruises afterward.",
            "I was terrified and felt completely helpless.",
        ]
        for i, text in enumerate(texts, 1):
            extraction = extractor.extract_all(text, fragment_id=i)
            builder.integrate_extraction(
                text, extraction, i, Phase.FREE_EXPRESSION
            )

        strengths = builder.assess_strengths()
        assert len(strengths) > 0

    def test_deduplication(self, builder, extractor):
        """Test that duplicate details are not added."""
        text = "I saw a dark room."
        extraction = extractor.extract_all(text, fragment_id=1)
        builder.integrate_extraction(
            text, extraction, 1, Phase.FREE_EXPRESSION
        )

        # Add same text again
        extraction2 = extractor.extract_all(text, fragment_id=2)
        counts = builder.integrate_extraction(
            text, extraction2, 2, Phase.FREE_EXPRESSION
        )

        # Sensory details should be deduplicated
        all_sensory = builder.testimony.sensory_details.all_details()
        descriptions = [s.description for s in all_sensory]
        # No exact duplicate descriptions
        assert len(descriptions) == len(set(d.lower().strip() for d in descriptions))

    def test_json_export(self, builder, extractor):
        """Test JSON export is valid."""
        text = "I remember a dark room and loud noises."
        extraction = extractor.extract_all(text, fragment_id=1)
        builder.integrate_extraction(
            text, extraction, 1, Phase.FREE_EXPRESSION
        )

        json_str = builder.get_testimony_json()
        parsed = json.loads(json_str)
        assert "testimony_id" in parsed
        assert "sensory_details" in parsed
        assert "raw_fragments" in parsed
        assert "legal_analysis" in parsed

    def test_narrative_summary(self, builder, extractor):
        """Test narrative summary generation."""
        text = "He hit me in the dark room. I was scared."
        extraction = extractor.extract_all(text, fragment_id=1)
        builder.integrate_extraction(
            text, extraction, 1, Phase.FREE_EXPRESSION
        )

        summary = builder.generate_narrative_summary()
        assert isinstance(summary, str)
        assert len(summary) > 0


# =====================================================================
# Response Generator Tests
# =====================================================================

class TestResponseGenerator:

    def test_greeting(self, responder):
        """Test greeting message."""
        greeting = responder.get_greeting()
        assert "safe" in greeting.lower()
        assert len(greeting) > 50

    def test_free_expression_response(self, responder):
        """Test free expression response generation."""
        counts = {"sensory": 2, "persons": 1, "locations": 0}
        response = responder.generate_free_expression_response(counts, 1)
        assert len(response) > 20

    def test_distress_response_critical(self, responder):
        """Test critical distress response includes crisis resources."""
        response = responder.generate_distress_response(DistressLevel.CRITICAL)
        assert response is not None
        assert "988" in response  # Suicide hotline
        assert "741741" in response  # Crisis text line

    def test_distress_response_high(self, responder):
        """Test high distress response."""
        response = responder.generate_distress_response(DistressLevel.HIGH)
        assert response is not None
        assert "grounding" in response.lower() or "break" in response.lower()

    def test_cant_remember_response(self, responder):
        """Test response when survivor can't remember."""
        response = responder.generate_cant_remember_response(True)
        assert "okay" in response.lower() or "normal" in response.lower()

    def test_synthesis_offer(self, responder):
        """Test synthesis transition message."""
        response = responder.generate_synthesis_offer()
        assert "summary" in response.lower() or "organize" in response.lower()


# =====================================================================
# Conversation Engine Integration Tests
# =====================================================================

class TestConversationEngine:

    def test_start_session(self, engine):
        """Test session creation."""
        session_id, greeting = engine.start_session()
        assert session_id is not None
        assert len(greeting) > 50
        assert "safe" in greeting.lower()

    def test_process_message(self, engine):
        """Test processing a single message."""
        session_id, _ = engine.start_session()
        response = engine.process_message(
            session_id, "I remember being in a dark room."
        )
        assert response.response_text
        assert response.phase == Phase.FREE_EXPRESSION
        assert response.distress_level == DistressLevel.NONE

    def test_multiple_messages(self, engine):
        """Test processing multiple messages."""
        session_id, _ = engine.start_session()

        messages = [
            "I remember it was dark and cold.",
            "He grabbed my arm. I could smell cigarettes.",
            "I remember it was sometime last winter, I think around midnight.",
        ]

        for msg in messages:
            response = engine.process_message(session_id, msg)
            assert response.response_text

        # Testimony should have fragments
        testimony = engine.get_testimony(session_id)
        assert testimony["session_metadata"]["total_messages"] == 3

    def test_distress_handling(self, engine):
        """Test that distress triggers appropriate response."""
        session_id, _ = engine.start_session()
        response = engine.process_message(
            session_id,
            "I can't breathe, I'm having a flashback.",
        )
        assert response.distress_level == DistressLevel.HIGH
        assert response.grounding_suggested is True

    def test_critical_distress(self, engine):
        """Test critical distress handling."""
        session_id, _ = engine.start_session()
        response = engine.process_message(
            session_id, "I want to die."
        )
        assert response.distress_level == DistressLevel.CRITICAL
        assert "988" in response.response_text

    def test_phase_transition_to_synthesis(self, engine):
        """Test transitioning to synthesis phase."""
        session_id, _ = engine.start_session()

        # Add some messages first
        engine.process_message(session_id, "It was dark and cold.")
        engine.process_message(session_id, "He grabbed me.")
        engine.process_message(session_id, "I was terrified.")

        # Signal synthesis
        response = engine.process_message(session_id, "That's all I remember.")
        assert response.phase in (Phase.SYNTHESIS, Phase.CLARIFICATION, Phase.UPDATE)

    def test_grounding_request(self, engine):
        """Test requesting a grounding exercise."""
        session_id, _ = engine.start_session()
        response = engine.process_message(
            session_id, "I need a grounding exercise."
        )
        assert response.grounding_suggested is True
        assert response.grounding_exercise is not None

    def test_export_testimony(self, engine):
        """Test exporting testimony as JSON."""
        session_id, _ = engine.start_session()
        engine.process_message(
            session_id, "I was in a dark basement. He hurt me."
        )

        json_str = engine.export_testimony(session_id)
        parsed = json.loads(json_str)
        assert "testimony_id" in parsed
        assert "raw_fragments" in parsed
        assert len(parsed["raw_fragments"]) > 0

    def test_get_testimony_dict(self, engine):
        """Test getting testimony as dict."""
        session_id, _ = engine.start_session()
        engine.process_message(session_id, "Something happened.")

        testimony = engine.get_testimony(session_id)
        assert isinstance(testimony, dict)
        assert "testimony_id" in testimony

    def test_empty_message(self, engine):
        """Test handling empty message."""
        session_id, _ = engine.start_session()
        response = engine.process_message(session_id, "")
        assert "ready" in response.response_text.lower() or "time" in response.response_text.lower()

    def test_invalid_session(self, engine):
        """Test accessing invalid session raises error."""
        with pytest.raises(ValueError):
            engine.process_message("invalid-id", "test")

    def test_manual_advance_to_synthesis(self, engine):
        """Test manual phase advancement."""
        session_id, _ = engine.start_session()
        engine.process_message(session_id, "I was in a dark room.")
        engine.process_message(session_id, "He grabbed me.")

        response = engine.advance_to_synthesis(session_id)
        assert response.phase in (Phase.CLARIFICATION, Phase.UPDATE)

    def test_finalize_session(self, engine):
        """Test finalizing a session."""
        session_id, _ = engine.start_session()
        engine.process_message(session_id, "I remember being hurt.")

        response = engine.finalize_session(session_id)
        assert response.phase == Phase.FINALIZED
        assert response.testimony_snapshot is not None

    def test_full_workflow(self, engine):
        """Test a complete workflow from start to finish."""
        session_id, greeting = engine.start_session()
        assert greeting

        # Phase 1: Free expression
        engine.process_message(
            session_id,
            "It happened in a small room. It was dark and cold. "
            "I could smell cigarettes."
        )
        engine.process_message(
            session_id,
            "He was tall with dark hair. He grabbed my arm and "
            "pushed me. I had bruises afterward."
        )
        engine.process_message(
            session_id,
            "It was around midnight, sometime last December. "
            "I was terrified. I felt completely helpless."
        )

        # Phase transition forced
        response = engine.advance_to_synthesis(session_id)

        # Should have moved past free expression
        assert response.phase != Phase.FREE_EXPRESSION

        # Get testimony
        testimony = engine.get_testimony(session_id)
        assert testimony["session_metadata"]["total_messages"] >= 3

        # JSON should have content
        json_str = engine.export_testimony(session_id)
        parsed = json.loads(json_str)
        assert len(parsed["raw_fragments"]) >= 3

        # Should have extracted some sensory details
        all_sensory = (
            parsed["sensory_details"]["visual"]
            + parsed["sensory_details"]["auditory"]
            + parsed["sensory_details"]["olfactory"]
            + parsed["sensory_details"]["tactile"]
        )
        assert len(all_sensory) > 0

    def test_grounding_exercise_utility(self, engine):
        """Test the standalone grounding exercise getter."""
        exercise = engine.get_grounding_exercise()
        assert "name" in exercise
        assert "instruction" in exercise
        assert "formatted" in exercise


# =====================================================================
# Testimony Model Tests
# =====================================================================

class TestTestimonyModel:

    def test_testimony_creation(self):
        """Test creating a blank testimony."""
        t = Testimony()
        assert t.testimony_id is not None
        assert t.session_metadata.current_phase == Phase.FREE_EXPRESSION

    def test_to_json(self):
        """Test JSON serialization."""
        t = Testimony()
        json_str = t.to_json()
        parsed = json.loads(json_str)
        assert parsed["testimony_id"] == t.testimony_id

    def test_to_dict(self):
        """Test dict serialization."""
        t = Testimony()
        d = t.to_dict()
        assert isinstance(d, dict)
        assert d["testimony_id"] == t.testimony_id


# =====================================================================
# Validation Tests for Advanced Enhancements
# =====================================================================

class TestAdvancedEnhancements:

    def test_linguistic_shift_detection(self, detector):
        from trauma_ai.models import LinguisticBaseline
        # Synthesize a baseline
        baseline = LinguisticBaseline(
            message_count=3,
            avg_sentence_length=15.0,
            avg_first_person_pronouns=0.2, # 20%
            avg_past_tense_ratio=0.5,
            avg_present_tense_ratio=0.1
        )
        # Shift: sudden short sentences, almost zero pronouns -> dissociation
        fractured_text = "dark. cold. quiet. wall. floor."
        score = detector.detect_linguistic_shift(fractured_text, baseline)
        assert score > 0.3  # Should have detected dissociation/fragmentation penalty

    def test_temporal_sorting(self, builder, extractor):
        from trauma_ai.models import TemporalPhase
        # Give messages explicitly mapping pre, during, post
        messages = [
            "Afterwards I ran out the door to the hospital.", # POST
            "We were just heading to the park before it rained.", # PRE
            "Suddenly he attacked me.", # DURING
        ]
        
        for i, text in enumerate(messages, 1):
            extraction = extractor.extract_all(text, fragment_id=i)
            builder.integrate_extraction(text, extraction, i, Phase.FREE_EXPRESSION)
            
        # Manually force temporal sorts
        sections = builder.generate_synthesis_sections()
        timeline = sections.get("Timeline", [])
        assert len(timeline) == 3
        # Should be PRE, DURING, POST order:
        assert "Pre Incident" in timeline[0]
        assert "During Incident" in timeline[1]
        assert "Post Incident" in timeline[2]

    def test_audio_processor_uninitialized(self):
        from trauma_ai.audio_processor import AudioProcessor
        processor = AudioProcessor(model_size="base")
        # Should gracefully return None if file missing
        result = processor.process_audio("non_existent_file.wav")
        assert result is None

