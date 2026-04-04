"""
Distress detection module.

Monitors survivor messages for signs of distress and determines
appropriate intervention levels. Uses keyword matching with context
awareness to avoid false positives.
"""

from __future__ import annotations

import re
import logging
from typing import Optional

from .config import DISTRESS_SIGNALS
from .models import DistressLevel, LinguisticBaseline

logger = logging.getLogger(__name__)


class DistressDetector:
    """
    Detects distress signals in survivor messages.

    Uses a tiered keyword approach:
    - CRITICAL: Immediate safety concerns (suicidal ideation, self-harm)
    - HIGH: Acute distress (panic attacks, flashbacks, overwhelming)
    - MODERATE: Difficulty engaging (triggered, needing breaks)
    - LOW: Mild discomfort (nervousness, unease)
    """

    def __init__(self, keyword_threshold: int = 1):
        """
        Parameters
        ----------
        keyword_threshold : int
            Minimum number of keyword matches to trigger a detection
            at the moderate/low levels. Critical and high are always
            triggered on a single match.
        """
        self._threshold = keyword_threshold

    def detect_linguistic_shift(self, text: str, baseline: LinguisticBaseline) -> float:
        """
        Analyze linguistic features to detect stress-induced shifts (dissociation, panic).
        Returns a score from 0.0 (no shift) to 1.0 (severe shift).
        """
        # Very rough heuristics offline without loading a heavy ML model
        text_lower = text.lower().strip()
        words = text_lower.split()
        if not words:
            return 0.0
            
        sentence_length = len(words)
        
        # 1. Pronoun drop detection (common in trauma dissociation)
        first_person_pronouns = ["i", "me", "my", "mine", "myself"]
        pronoun_count = sum(1 for w in words if w in first_person_pronouns)
        pronoun_ratio = pronoun_count / sentence_length
        
        # If we have a baseline established
        shift_score = 0.0
        if baseline.message_count >= 2:
            # Detect sudden fragmentation (panic or shutdown)
            if sentence_length < (baseline.avg_sentence_length * 0.4) and baseline.avg_sentence_length > 10:
                shift_score += 0.4
                
            # Detect dissociation (sudden lack of first person)
            if pronoun_ratio < (baseline.avg_first_person_pronouns * 0.3) and baseline.avg_first_person_pronouns > 0.05:
                shift_score += 0.5
                
        # Update baseline
        n = baseline.message_count
        baseline.avg_sentence_length = (baseline.avg_sentence_length * n + sentence_length) / (n + 1)
        baseline.avg_first_person_pronouns = (baseline.avg_first_person_pronouns * n + pronoun_ratio) / (n + 1)
        baseline.message_count += 1
        
        return min(1.0, shift_score)

    def detect(self, text: str, baseline: LinguisticBaseline = None) -> DistressLevel:
        """
        Analyse text for distress signals.

        Parameters
        ----------
        text : str
            The survivor's message.

        Returns
        -------
        DistressLevel
            The detected distress level.
        """
        text_lower = text.lower().strip()

        if not text_lower:
            return DistressLevel.NONE
            
        # Detect Linguistic Shift
        linguistic_distress_level = DistressLevel.NONE
        if baseline:
            shift_score = self.detect_linguistic_shift(text, baseline)
            if shift_score >= 0.8:
                logger.info("High linguistic shift detected (score: %.2f) indicating potential dissociation.", shift_score)
                linguistic_distress_level = DistressLevel.HIGH
            elif shift_score >= 0.4:
                linguistic_distress_level = DistressLevel.MODERATE

        # ---- Critical (always trigger on single match) -----------------
        for phrase in DISTRESS_SIGNALS["crisis"]:
            if phrase in text_lower:
                logger.warning("CRITICAL distress signal detected.")
                return DistressLevel.CRITICAL

        # ---- High distress (single match triggers) ---------------------
        high_matches = 0
        for phrase in DISTRESS_SIGNALS["high_distress"]:
            if phrase in text_lower:
                high_matches += 1
        if high_matches >= 1:
            logger.info("HIGH distress detected (%d matches).", high_matches)
            return DistressLevel.HIGH

        # ---- Moderate distress (threshold-based) -----------------------
        mod_matches = 0
        for phrase in DISTRESS_SIGNALS["moderate_distress"]:
            if phrase in text_lower:
                mod_matches += 1
        if mod_matches >= self._threshold:
            return DistressLevel.MODERATE

        # ---- Low distress (threshold-based) ----------------------------
        low_matches = 0
        for phrase in DISTRESS_SIGNALS["low_distress"]:
            if phrase in text_lower:
                low_matches += 1
        if low_matches >= self._threshold:
            keyword_level = DistressLevel.LOW
        else:
            keyword_level = DistressLevel.NONE
            
        # Return the highest level detected between keyword and linguistic shift
        levels = [DistressLevel.NONE, DistressLevel.LOW, DistressLevel.MODERATE, DistressLevel.HIGH, DistressLevel.CRITICAL]
        k_idx = levels.index(keyword_level)
        l_idx = levels.index(linguistic_distress_level)
        
        return levels[max(k_idx, l_idx)]

    def should_pause(
        self,
        current_level: DistressLevel,
        history: list[DistressLevel],
        consecutive_limit: int = 2,
    ) -> bool:
        """
        Determine if the conversation should be paused.

        Rules:
        - Always pause on CRITICAL
        - Pause on HIGH
        - Pause on MODERATE if there have been `consecutive_limit`
          consecutive moderate-or-higher detections

        Parameters
        ----------
        current_level : DistressLevel
            The current message's distress level.
        history : list[DistressLevel]
            Recent distress level history.
        consecutive_limit : int
            Number of consecutive moderate+ before mandatory pause.

        Returns
        -------
        bool
            Whether to pause the conversation.
        """
        if current_level in (DistressLevel.CRITICAL, DistressLevel.HIGH):
            return True

        if current_level == DistressLevel.MODERATE:
            # Check consecutive moderate+
            recent = history[-(consecutive_limit - 1):]
            if recent and len(recent) == consecutive_limit - 1 and all(
                level
                in (DistressLevel.MODERATE, DistressLevel.HIGH, DistressLevel.CRITICAL)
                for level in recent
            ):
                return True

        return False

    def suggest_intervention(
        self, level: DistressLevel
    ) -> Optional[str]:
        """
        Return the type of intervention suggested for this distress level.

        Returns
        -------
        str or None
            "crisis_resources", "grounding", "break_suggestion", or None.
        """
        if level == DistressLevel.CRITICAL:
            return "crisis_resources"
        elif level == DistressLevel.HIGH:
            return "grounding"
        elif level == DistressLevel.MODERATE:
            return "break_suggestion"
        return None
