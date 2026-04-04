"""
Offline NLP extractors for the Trauma-Informed AI Engine.

Extracts structured information from free-text fragments:
- Named entities (persons, locations, dates/times) via spaCy
- Sensory details via keyword matching
- Emotional indicators via keyword + context matching
- Physical impact descriptions
- Chronological markers
"""

from __future__ import annotations

import re
import logging
from typing import Optional

from .config import (
    VISUAL_KEYWORDS,
    AUDITORY_KEYWORDS,
    OLFACTORY_KEYWORDS,
    TACTILE_KEYWORDS,
    EMOTION_KEYWORDS,
    PHYSICAL_IMPACT_KEYWORDS,
    BODY_AREAS,
    TIME_PATTERNS,
    LOCATION_INDICATORS,
    TEMPORAL_PHASE_INDICATORS,
)
from .models import (
    ExtractedEntities,
    SensoryDetail,
    SensoryType,
    EmotionalContext,
    PhysicalImpact,
    ChronologyEntry,
    InvolvedParty,
    Location,
    LocationType,
    TimeConfidence,
    PartyRole,
    TemporalPhase,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# spaCy loader (lazy)
# ---------------------------------------------------------------------------

_nlp = None


def _get_nlp(model_name: str = "en_core_web_sm"):
    """Lazily load the spaCy model."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load(model_name)
            logger.info("spaCy model '%s' loaded successfully.", model_name)
        except ImportError:
            logger.warning(
                "spaCy is not installed. Entity extraction will use "
                "regex fallback only."
            )
            _nlp = "unavailable"
        except OSError:
            logger.warning(
                "spaCy model '%s' not found. Run: "
                "python -m spacy download %s",
                model_name,
                model_name,
            )
            _nlp = "unavailable"
    return _nlp if _nlp != "unavailable" else None


# ---------------------------------------------------------------------------
# Core Extraction Class
# ---------------------------------------------------------------------------

class EntityExtractor:
    """Extracts structured entities and details from trauma narrative text."""

    def __init__(self, spacy_model: str = "en_core_web_sm"):
        self._spacy_model = spacy_model

    # -- Public API -------------------------------------------------------

    def extract_all(self, text: str, fragment_id: int = 0) -> dict:
        """
        Run all extractors on the given text and return a full result dict.

        Returns
        -------
        dict with keys:
            entities: ExtractedEntities
            sensory_details: list[SensoryDetail]
            emotions: list[EmotionalContext]
            physical_impacts: list[PhysicalImpact]
            chronology_hints: list[ChronologyEntry]
            persons: list[InvolvedParty]
            locations: list[Location]
        """
        text_lower = text.lower()
        nlp = _get_nlp(self._spacy_model)
        doc = nlp(text) if nlp else None

        entities = self._extract_entities(text, text_lower, doc)
        sensory = self._extract_sensory(text, text_lower, fragment_id)
        emotions = self._extract_emotions(text, text_lower, fragment_id)
        physical = self._extract_physical(text, text_lower, fragment_id)
        chrono = self._extract_chronology(text, text_lower, fragment_id, doc)
        persons = self._extract_persons(text, text_lower, fragment_id, doc)
        locations = self._extract_locations(text, text_lower, fragment_id, doc)

        return {
            "entities": entities,
            "sensory_details": sensory,
            "emotions": emotions,
            "physical_impacts": physical,
            "chronology_hints": chrono,
            "persons": persons,
            "locations": locations,
        }

    # -- Entity extraction ------------------------------------------------

    def _extract_entities(
        self, text: str, text_lower: str, doc
    ) -> ExtractedEntities:
        """Extract named entities and keyword matches."""
        entities = ExtractedEntities()

        # spaCy NER
        if doc:
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    entities.persons.append(ent.text)
                elif ent.label_ in ("GPE", "LOC", "FAC"):
                    entities.locations.append(ent.text)
                elif ent.label_ == "DATE":
                    entities.dates.append(ent.text)
                elif ent.label_ == "TIME":
                    entities.times.append(ent.text)

        # Keyword-based sensory extraction
        for kw in VISUAL_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                entities.sensory.append(kw)
                break  # one match per category is enough for entities
        for kw in AUDITORY_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                if kw not in entities.sensory:
                    entities.sensory.append(kw)
                break
        for kw in OLFACTORY_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                if kw not in entities.sensory:
                    entities.sensory.append(kw)
                break
        for kw in TACTILE_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                if kw not in entities.sensory:
                    entities.sensory.append(kw)
                break

        # Emotion keywords
        for emotion, keywords in EMOTION_KEYWORDS.items():
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                    entities.emotions.append(emotion)
                    break

        # Physical keywords
        for kw in PHYSICAL_IMPACT_KEYWORDS:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                entities.physical.append(kw)

        return entities

    # -- Sensory extraction -----------------------------------------------

    def _extract_sensory(
        self, text: str, text_lower: str, fragment_id: int
    ) -> list[SensoryDetail]:
        """Extract sensory details with surrounding context."""
        details: list[SensoryDetail] = []
        sentences = self._split_sentences(text)

        for sentence in sentences:
            sent_lower = sentence.lower()

            # Visual
            visual_matches = self._find_keyword_matches(
                sent_lower, VISUAL_KEYWORDS
            )
            if visual_matches:
                details.append(
                    SensoryDetail(
                        type=SensoryType.VISUAL,
                        description=sentence.strip(),
                        source_fragment_id=fragment_id,
                        confidence="medium",
                    )
                )

            # Auditory
            auditory_matches = self._find_keyword_matches(
                sent_lower, AUDITORY_KEYWORDS
            )
            if auditory_matches:
                details.append(
                    SensoryDetail(
                        type=SensoryType.AUDITORY,
                        description=sentence.strip(),
                        source_fragment_id=fragment_id,
                        confidence="medium",
                    )
                )

            # Olfactory
            olfactory_matches = self._find_keyword_matches(
                sent_lower, OLFACTORY_KEYWORDS
            )
            if olfactory_matches:
                details.append(
                    SensoryDetail(
                        type=SensoryType.OLFACTORY,
                        description=sentence.strip(),
                        source_fragment_id=fragment_id,
                        confidence="medium",
                    )
                )

            # Tactile
            tactile_matches = self._find_keyword_matches(
                sent_lower, TACTILE_KEYWORDS
            )
            if tactile_matches:
                details.append(
                    SensoryDetail(
                        type=SensoryType.TACTILE,
                        description=sentence.strip(),
                        source_fragment_id=fragment_id,
                        confidence="medium",
                    )
                )

        return details

    # -- Emotion extraction -----------------------------------------------

    def _extract_emotions(
        self, text: str, text_lower: str, fragment_id: int
    ) -> list[EmotionalContext]:
        """Extract emotional context from text."""
        emotions: list[EmotionalContext] = []
        sentences = self._split_sentences(text)

        for sentence in sentences:
            sent_lower = sentence.lower()
            for emotion, keywords in EMOTION_KEYWORDS.items():
                for kw in keywords:
                    if re.search(rf"\b{re.escape(kw)}\b", sent_lower):
                        emotions.append(
                            EmotionalContext(
                                emotion=emotion,
                                description=sentence.strip(),
                                source_fragment_id=fragment_id,
                            )
                        )
                        break  # one emotion per sentence per category

        return emotions

    # -- Physical impact extraction ---------------------------------------

    def _extract_physical(
        self, text: str, text_lower: str, fragment_id: int
    ) -> list[PhysicalImpact]:
        """Extract physical impact descriptions."""
        impacts: list[PhysicalImpact] = []
        sentences = self._split_sentences(text)

        for sentence in sentences:
            sent_lower = sentence.lower()
            matched_keywords = self._find_keyword_matches(
                sent_lower, PHYSICAL_IMPACT_KEYWORDS
            )
            if matched_keywords:
                body_area = self._detect_body_area(sent_lower)
                impacts.append(
                    PhysicalImpact(
                        description=sentence.strip(),
                        body_area=body_area,
                        source_fragment_id=fragment_id,
                    )
                )

        return impacts

    # -- Chronology extraction --------------------------------------------

    def _extract_chronology(
        self,
        text: str,
        text_lower: str,
        fragment_id: int,
        doc,
    ) -> list[ChronologyEntry]:
        """Extract chronological markers and time references."""
        entries: list[ChronologyEntry] = []
        sentences = self._split_sentences(text)

        for i, sentence in enumerate(sentences):
            sent_lower = sentence.lower()
            time_refs: list[str] = []
            confidence = TimeConfidence.UNCERTAIN

            # spaCy date/time entities
            if doc:
                for ent in doc.ents:
                    if ent.label_ in ("DATE", "TIME"):
                        if ent.text.lower() in sent_lower:
                            time_refs.append(ent.text)

            # Regex time patterns
            for pattern in TIME_PATTERNS:
                matches = re.findall(pattern, sent_lower)
                time_refs.extend(matches)

            if time_refs:
                # Determine confidence
                if any(
                    w in sent_lower
                    for w in ["exactly", "precisely", "i know", "definitely"]
                ):
                    confidence = TimeConfidence.CERTAIN
                elif any(
                    w in sent_lower
                    for w in [
                        "around", "about", "approximately", "roughly",
                        "maybe", "think", "probably", "not sure",
                    ]
                ):
                    confidence = TimeConfidence.APPROXIMATE

            # Deduce Temporal Phase
            temporal_phase = TemporalPhase.UNKNOWN
            for phase_key, indicators in TEMPORAL_PHASE_INDICATORS.items():
                if any(re.search(rf"\b{re.escape(ind)}\b", sent_lower) for ind in indicators):
                    temporal_phase = TemporalPhase(phase_key)
                    break
                    
            if time_refs or temporal_phase != TemporalPhase.UNKNOWN:
                entries.append(
                    ChronologyEntry(
                        sequence_order=i + 1,
                        description=sentence.strip(),
                        time_reference=", ".join(set(time_refs)),
                        time_confidence=confidence,
                        temporal_phase=temporal_phase,
                        source_fragment_ids=[fragment_id],
                    )
                )

        return entries

    # -- Person extraction ------------------------------------------------

    def _extract_persons(
        self,
        text: str,
        text_lower: str,
        fragment_id: int,
        doc,
    ) -> list[InvolvedParty]:
        """Extract involved parties from text."""
        persons: list[InvolvedParty] = []
        seen_names: set[str] = set()

        # spaCy PERSON entities
        if doc:
            for ent in doc.ents:
                if ent.label_ == "PERSON" and ent.text not in seen_names:
                    seen_names.add(ent.text)
                    role = self._infer_role(text_lower, ent.text.lower())
                    persons.append(
                        InvolvedParty(
                            identifier=ent.text,
                            role=role,
                            source_fragment_ids=[fragment_id],
                        )
                    )

        # Role-based references (he, she, the man, the woman, etc.)
        role_refs = {
            "perpetrator": [
                r"\bthe\s+(?:man|guy|person|attacker|abuser)\b",
                r"\bhe\b",
                r"\bmy\s+(?:husband|boyfriend|partner|ex|boss|uncle|father|stepfather|brother)\b",
            ],
            "helper": [
                r"\bthe\s+(?:doctor|nurse|officer|counselor|therapist|friend|neighbor|teacher)\b",
            ],
            "witness": [
                r"\bthe\s+(?:witness|bystander|passerby)\b",
                r"\bsomeone\s+(?:saw|heard|noticed)\b",
            ],
        }

        for role_name, patterns in role_refs.items():
            for pattern in patterns:
                matches = re.findall(pattern, text_lower)
                for match in matches:
                    if match not in seen_names:
                        seen_names.add(match)
                        persons.append(
                            InvolvedParty(
                                identifier=match.strip(),
                                role=PartyRole(role_name),
                                source_fragment_ids=[fragment_id],
                            )
                        )

        return persons

    # -- Location extraction ----------------------------------------------

    def _extract_locations(
        self,
        text: str,
        text_lower: str,
        fragment_id: int,
        doc,
    ) -> list[Location]:
        """Extract locations from text."""
        locations: list[Location] = []
        seen_locations: set[str] = set()

        # spaCy locations
        if doc:
            for ent in doc.ents:
                if (
                    ent.label_ in ("GPE", "LOC", "FAC")
                    and ent.text not in seen_locations
                ):
                    seen_locations.add(ent.text)
                    loc_type = self._infer_location_type(ent.text.lower())
                    locations.append(
                        Location(
                            description=ent.text,
                            type=loc_type,
                            source_fragment_ids=[fragment_id],
                        )
                    )

        # Keyword-based location detection
        sentences = self._split_sentences(text)
        for sentence in sentences:
            sent_lower = sentence.lower()
            for indicator in LOCATION_INDICATORS:
                if re.search(rf"\b{re.escape(indicator)}\b", sent_lower):
                    # Extract a meaningful phrase around the indicator
                    context = self._extract_location_context(
                        sentence, indicator
                    )
                    if context and context.lower() not in seen_locations:
                        seen_locations.add(context.lower())
                        loc_type = self._infer_location_type(indicator)
                        locations.append(
                            Location(
                                description=context,
                                type=loc_type,
                                source_fragment_ids=[fragment_id],
                            )
                        )
                    break  # one location per sentence

        return locations

    # -- Helper methods ---------------------------------------------------

    @staticmethod
    def _split_sentences(text: str) -> list[str]:
        """Split text into sentences, handling common edge cases."""
        # Simple sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+|(?<=\.\.\.)\s*|\n+', text)
        return [s.strip() for s in sentences if s.strip()]

    @staticmethod
    def _find_keyword_matches(
        text_lower: str, keywords: list[str]
    ) -> list[str]:
        """Find all matching keywords in the text."""
        matches = []
        for kw in keywords:
            if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                matches.append(kw)
        return matches

    @staticmethod
    def _detect_body_area(text_lower: str) -> Optional[str]:
        """Detect which body area is referenced in the text."""
        for area, keywords in BODY_AREAS.items():
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", text_lower):
                    return area
        return None

    @staticmethod
    def _infer_role(text_lower: str, person_lower: str) -> PartyRole:
        """Infer the role of a person based on context."""
        # Check if near perpetrator-indicating words
        perp_words = [
            "attack", "hit", "hurt", "abuse", "assault", "force",
            "threaten", "rape", "grab", "choke", "beat",
        ]
        helper_words = [
            "help", "save", "protect", "support", "treat", "examine",
            "counsel",
        ]

        for word in perp_words:
            if word in text_lower:
                return PartyRole.PERPETRATOR
        for word in helper_words:
            if word in text_lower:
                return PartyRole.HELPER

        return PartyRole.OTHER

    @staticmethod
    def _infer_location_type(indicator: str) -> LocationType:
        """Infer location type from the indicator word."""
        indoor = {
            "house", "home", "apartment", "flat", "room", "bedroom",
            "bathroom", "kitchen", "basement", "attic", "garage", "office",
            "hotel", "motel", "hostel", "bar", "club", "pub", "restaurant",
            "warehouse", "factory", "church", "temple", "mosque", "shelter",
            "prison", "jail", "cell", "school", "college", "university",
            "hospital", "clinic", "building", "upstairs", "downstairs",
            "inside",
        }
        outdoor = {
            "park", "street", "road", "alley", "alleyway", "field",
            "forest", "woods", "beach", "river", "bridge", "outside",
            "corner", "parking", "lot",
        }
        vehicle = {"car", "vehicle", "van", "truck", "bus", "train", "taxi", "uber"}

        if indicator in indoor:
            return LocationType.INDOOR
        elif indicator in outdoor:
            return LocationType.OUTDOOR
        elif indicator in vehicle:
            return LocationType.VEHICLE
        return LocationType.OTHER

    @staticmethod
    def _extract_location_context(
        sentence: str, indicator: str
    ) -> Optional[str]:
        """Extract a meaningful phrase around a location indicator."""
        # Try to get a few words around the indicator
        pattern = rf"(\b\w+\s+)?(\b\w+\s+)?\b{re.escape(indicator)}\b(\s+\w+)?(\s+\w+)?"
        match = re.search(pattern, sentence, re.IGNORECASE)
        if match:
            return match.group(0).strip()
        return indicator
