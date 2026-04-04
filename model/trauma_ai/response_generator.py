"""
Offline response generator.

Generates empathetic, trauma-informed responses without requiring an
external LLM. Uses template-based responses enriched with context from
the extraction results.
"""

from __future__ import annotations

import random
import logging

from .models import (
    DistressLevel,
    Phase,
)
from .prompts import (
    GREETING,
    ACKNOWLEDGMENT_TEMPLATES,
    EXTRACTION_ACKNOWLEDGMENTS,
    SYNTHESIS_TRANSITION,
    SYNTHESIS_PRESENTATION,
    CLARIFICATION_INTRO,
    CLARIFICATION_ACK_TEMPLATES,
    CANT_REMEMBER_RESPONSE,
    UPDATE_CONFIRMATION,
    FINALIZATION,
    DISTRESS_RESPONSES,
    format_full_synthesis,
)

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """
    Generates context-appropriate, trauma-informed responses offline.

    Selects templates based on the current phase, extraction results,
    and distress level, then enriches them with specific details from
    the survivor's message.
    """

    def get_greeting(self) -> str:
        """Return the initial greeting message."""
        return GREETING

    # -----------------------------------------------------------------
    # Phase 1: Free Expression responses
    # -----------------------------------------------------------------

    def generate_free_expression_response(
        self,
        extraction_counts: dict[str, int],
        message_count: int,
        min_before_synthesis: int = 3,
    ) -> str:
        """
        Generate a response during the free expression phase.

        Parameters
        ----------
        extraction_counts : dict
            Counts of extracted items per category.
        message_count : int
            Total number of messages received so far.
        min_before_synthesis : int
            Minimum messages before offering synthesis.
        """
        parts: list[str] = []

        # Base acknowledgment
        parts.append(random.choice(ACKNOWLEDGMENT_TEMPLATES))

        # Enrichment based on what was extracted
        enrichment = self._build_extraction_enrichment(extraction_counts)
        if enrichment:
            parts.append(enrichment)

        # After enough messages, suggest moving to synthesis
        if message_count >= min_before_synthesis:
            parts.append(
                "\nWhenever you feel you've shared what you'd like for now, "
                "just let me know. I can organize everything into a clear "
                "summary, or you can continue sharing — there's no rush."
            )

        return "\n\n".join(parts)

    # -----------------------------------------------------------------
    # Phase 2: Synthesis responses
    # -----------------------------------------------------------------

    def generate_synthesis_offer(self) -> str:
        """Generate the transition message offering to synthesize."""
        return SYNTHESIS_TRANSITION

    def generate_synthesis_response(
        self, sections: dict[str, list[str]]
    ) -> str:
        """
        Generate a synthesis presentation.

        Parameters
        ----------
        sections : dict
            Section title → bullet points from TestimonyBuilder.
        """
        synthesis_text = format_full_synthesis(sections)
        if not synthesis_text:
            synthesis_text = (
                "I've been carefully listening to everything you've shared. "
                "Let me continue gathering your account before creating "
                "a structured summary."
            )
        return SYNTHESIS_PRESENTATION.format(synthesis=synthesis_text)

    # -----------------------------------------------------------------
    # Phase 3: Clarification responses
    # -----------------------------------------------------------------

    def generate_clarification_intro(self) -> str:
        """Generate the introduction to the clarification phase."""
        return CLARIFICATION_INTRO

    def generate_clarification_question(self, question: str) -> str:
        """Wrap a clarification question with supportive framing."""
        return (
            f"{question}\n\n"
            "Remember, it's completely fine if you don't have the answer, "
            "or if you'd prefer to skip this one."
        )

    def generate_clarification_ack(
        self,
        extraction_counts: dict[str, int],
        has_more_questions: bool,
    ) -> str:
        """
        Acknowledge a clarification answer.

        Parameters
        ----------
        extraction_counts : dict
            What was extracted from the answer.
        has_more_questions : bool
            Whether there are more clarification questions.
        """
        parts: list[str] = []
        parts.append(random.choice(CLARIFICATION_ACK_TEMPLATES))

        if has_more_questions:
            parts.append(
                "I have another question whenever you're ready. "
                "We can also take a break if you need one."
            )
        else:
            parts.append(
                "That was the last question I had for now. Let me update "
                "your testimony with all the new information."
            )

        return "\n\n".join(parts)

    def generate_cant_remember_response(
        self, has_more_questions: bool
    ) -> str:
        """Respond when the survivor can't remember something."""
        parts = [CANT_REMEMBER_RESPONSE]
        if has_more_questions:
            parts.append(
                "Let me ask about something else instead. You can always "
                "come back to this later."
            )
        return "\n\n".join(parts)

    # -----------------------------------------------------------------
    # Phase 4: Update responses
    # -----------------------------------------------------------------

    def generate_update_response(
        self, synthesis_text: str
    ) -> str:
        """Present the updated testimony."""
        return UPDATE_CONFIRMATION.format(testimony=synthesis_text)

    def generate_finalization_response(self) -> str:
        """Generate the final closing message."""
        return FINALIZATION

    # -----------------------------------------------------------------
    # Distress responses
    # -----------------------------------------------------------------

    def generate_distress_response(
        self, level: DistressLevel
    ) -> str | None:
        """
        Generate an appropriate distress response.

        Returns None for NONE and LOW levels (handled normally).
        """
        if level == DistressLevel.CRITICAL:
            return DISTRESS_RESPONSES["critical"]
        elif level == DistressLevel.HIGH:
            return DISTRESS_RESPONSES["high"]
        elif level == DistressLevel.MODERATE:
            return DISTRESS_RESPONSES["moderate"]
        return None

    # -----------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------

    def _build_extraction_enrichment(
        self, counts: dict[str, int]
    ) -> str:
        """Build an enrichment note based on what was extracted."""
        enrichments: list[str] = []

        if counts.get("sensory", 0) > 0:
            enrichments.append(
                EXTRACTION_ACKNOWLEDGMENTS["sensory"].format(
                    sense_type="experienced"
                )
            )

        if counts.get("persons", 0) > 0:
            enrichments.append(EXTRACTION_ACKNOWLEDGMENTS["person"])

        if counts.get("locations", 0) > 0:
            enrichments.append(EXTRACTION_ACKNOWLEDGMENTS["location"])

        if counts.get("chronology", 0) > 0:
            enrichments.append(EXTRACTION_ACKNOWLEDGMENTS["time"])

        if counts.get("emotions", 0) > 0:
            enrichments.append(EXTRACTION_ACKNOWLEDGMENTS["emotion"])

        if counts.get("physical", 0) > 0:
            enrichments.append(EXTRACTION_ACKNOWLEDGMENTS["physical"])

        if enrichments:
            # Don't overwhelm — pick the 1-2 most relevant
            selected = enrichments[:2]
            return "\n\n".join(selected)

        return ""
