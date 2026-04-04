"""
Pydantic data models for the Trauma-Informed Legal Documentation AI Engine.

Defines the complete JSON schema for the Master Testimony, including:
- Sensory details (visual, auditory, olfactory, tactile, gustatory)
- Chronological events
- Involved parties (perpetrators, witnesses, helpers)
- Locations
- Emotional and physical context
- Raw fragments with extraction metadata
- Legal analysis (gaps, clarifications, strength indicators)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class Phase(str, Enum):
    """Workflow phases for the documentation process."""
    FREE_EXPRESSION = "free_expression"
    SYNTHESIS = "synthesis"
    CLARIFICATION = "clarification"
    UPDATE = "update"
    FINALIZED = "finalized"


class DistressLevel(str, Enum):
    """Level of distress detected in a message."""
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class PartyRole(str, Enum):
    """Role of an involved party in the incident."""
    PERPETRATOR = "perpetrator"
    WITNESS = "witness"
    BYSTANDER = "bystander"
    HELPER = "helper"
    AUTHORITY = "authority"
    OTHER = "other"


class LocationType(str, Enum):
    """Type of location."""
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    VEHICLE = "vehicle"
    ONLINE = "online"
    OTHER = "other"


class TimeConfidence(str, Enum):
    """Confidence level for time references."""
    CERTAIN = "certain"
    APPROXIMATE = "approximate"
    UNCERTAIN = "uncertain"


class TemporalPhase(str, Enum):
    """Temporal classification of an event relative to the incident."""
    PRE_INCIDENT = "pre_incident"
    DURING_INCIDENT = "during_incident"
    POST_INCIDENT = "post_incident"
    UNKNOWN = "unknown"


class GapImportance(str, Enum):
    """Importance level for identified gaps."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SensoryType(str, Enum):
    """Types of sensory information."""
    VISUAL = "visual"
    AUDITORY = "auditory"
    OLFACTORY = "olfactory"
    TACTILE = "tactile"
    GUSTATORY = "gustatory"
    OTHER = "other"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class SensoryDetail(BaseModel):
    """A single sensory detail extracted from a fragment."""
    type: SensoryType
    description: str
    source_fragment_id: int
    confidence: str = "medium"


class SensoryDetails(BaseModel):
    """All sensory details organized by type."""
    visual: list[SensoryDetail] = Field(default_factory=list)
    auditory: list[SensoryDetail] = Field(default_factory=list)
    olfactory: list[SensoryDetail] = Field(default_factory=list)
    tactile: list[SensoryDetail] = Field(default_factory=list)
    gustatory: list[SensoryDetail] = Field(default_factory=list)
    other: list[SensoryDetail] = Field(default_factory=list)

    def add(self, detail: SensoryDetail) -> None:
        """Add a sensory detail to the appropriate category."""
        getattr(self, detail.type.value).append(detail)

    def all_details(self) -> list[SensoryDetail]:
        """Return all sensory details as a flat list."""
        return (
            self.visual + self.auditory + self.olfactory
            + self.tactile + self.gustatory + self.other
        )


class ChronologyEntry(BaseModel):
    """A single event in the timeline."""
    sequence_order: int
    description: str
    time_reference: Optional[str] = None
    time_confidence: TimeConfidence = TimeConfidence.UNCERTAIN
    temporal_phase: TemporalPhase = TemporalPhase.UNKNOWN
    source_fragment_ids: list[int] = Field(default_factory=list)


class InvolvedParty(BaseModel):
    """A person involved in the incident."""
    id: str = Field(default_factory=lambda: f"person_{uuid.uuid4().hex[:8]}")
    identifier: str  # how the survivor refers to them
    known_name: Optional[str] = None
    role: PartyRole = PartyRole.OTHER
    physical_description: Optional[str] = None
    relationship: Optional[str] = None
    additional_details: Optional[str] = None
    source_fragment_ids: list[int] = Field(default_factory=list)


class Location(BaseModel):
    """A location mentioned in the testimony."""
    id: str = Field(default_factory=lambda: f"loc_{uuid.uuid4().hex[:8]}")
    description: str
    type: LocationType = LocationType.OTHER
    address_or_area: Optional[str] = None
    details: Optional[str] = None
    source_fragment_ids: list[int] = Field(default_factory=list)


class EmotionalContext(BaseModel):
    """An emotional state described by the survivor."""
    emotion: str
    description: str
    associated_event: Optional[str] = None
    source_fragment_id: int


class PhysicalImpact(BaseModel):
    """Physical harm or impact described by the survivor."""
    description: str
    body_area: Optional[str] = None
    severity: Optional[str] = None
    medical_attention: Optional[str] = None
    source_fragment_id: int


class ExtractedEntities(BaseModel):
    """Entities extracted from a single fragment."""
    persons: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    times: list[str] = Field(default_factory=list)
    sensory: list[str] = Field(default_factory=list)
    emotions: list[str] = Field(default_factory=list)
    physical: list[str] = Field(default_factory=list)


class RawFragment(BaseModel):
    """A raw message fragment from the survivor."""
    id: int
    text: str
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat()
    )
    phase: Phase = Phase.FREE_EXPRESSION
    assistant_prompt: Optional[str] = None
    extracted_entities: ExtractedEntities = Field(
        default_factory=ExtractedEntities
    )


class IdentifiedGap(BaseModel):
    """A gap in the testimony that needs clarification."""
    category: str  # e.g. "timeline", "location", "perpetrator_description"
    description: str
    importance: GapImportance = GapImportance.MEDIUM
    addressed: bool = False
    clarification_question: Optional[str] = None


class LegalAnalysis(BaseModel):
    """Legal analysis of the testimony — gaps, pending questions, strengths."""
    identified_gaps: list[IdentifiedGap] = Field(default_factory=list)
    pending_clarifications: list[str] = Field(default_factory=list)
    strength_indicators: list[str] = Field(default_factory=list)


class DateRange(BaseModel):
    """Estimated date range for the incident."""
    earliest: Optional[str] = None
    latest: Optional[str] = None
    description: Optional[str] = None


class IncidentDetails(BaseModel):
    """High-level details about the incident."""
    type_of_trauma: Optional[str] = None
    estimated_date_range: DateRange = Field(default_factory=DateRange)
    duration: Optional[str] = None
    frequency: Optional[str] = None  # single_incident, repeated, ongoing


class SessionMetadata(BaseModel):
    """Metadata about the documentation session."""
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat()
    )
    last_updated: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat()
    )
    total_messages: int = 0
    current_phase: Phase = Phase.FREE_EXPRESSION
    phases_completed: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Master Testimony
# ---------------------------------------------------------------------------

class Testimony(BaseModel):
    """
    The Master Testimony — the complete structured record.

    This is the final JSON output that captures all information
    from the survivor's fragmented messages, organized for legal use.
    """
    testimony_id: str = Field(
        default_factory=lambda: str(uuid.uuid4())
    )
    session_metadata: SessionMetadata = Field(
        default_factory=SessionMetadata
    )
    incident_details: IncidentDetails = Field(
        default_factory=IncidentDetails
    )
    sensory_details: SensoryDetails = Field(
        default_factory=SensoryDetails
    )
    chronology: list[ChronologyEntry] = Field(default_factory=list)
    involved_parties: list[InvolvedParty] = Field(default_factory=list)
    locations: list[Location] = Field(default_factory=list)
    emotional_context: list[EmotionalContext] = Field(default_factory=list)
    physical_impact: list[PhysicalImpact] = Field(default_factory=list)
    raw_fragments: list[RawFragment] = Field(default_factory=list)
    legal_analysis: LegalAnalysis = Field(default_factory=LegalAnalysis)
    narrative_summary: Optional[str] = None

    def to_json(self, indent: int = 2) -> str:
        """Serialize the testimony to a JSON string."""
        return self.model_dump_json(indent=indent)

    def to_dict(self) -> dict:
        """Serialize the testimony to a dictionary."""
        return self.model_dump()


# ---------------------------------------------------------------------------
# Engine I/O models
# ---------------------------------------------------------------------------

class EngineResponse(BaseModel):
    """Response from the ConversationEngine after processing a message."""
    response_text: str
    phase: Phase
    distress_level: DistressLevel = DistressLevel.NONE
    grounding_suggested: bool = False
    grounding_exercise: Optional[str] = None
    testimony_snapshot: Optional[dict] = None
    clarification_questions: list[str] = Field(default_factory=list)
    mode_used: str = "offline"  # "offline" or "llm"


class SessionState(BaseModel):
    """Internal state of a conversation session."""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    testimony: Testimony = Field(default_factory=Testimony)
    phase: Phase = Phase.FREE_EXPRESSION
    message_count: int = 0
    distress_history: list[DistressLevel] = Field(default_factory=list)
    conversation_history: list[dict] = Field(default_factory=list)
    pending_clarifications: list[str] = Field(default_factory=list)
    current_clarification_index: int = 0
    synthesis_done: bool = False
    fragment_counter: int = 0
    last_assistant_prompt: str = ""
    # Grounding preferences: track which exercise types fail/succeed
    grounding_preferences: dict[str, int] = Field(default_factory=dict)


class LinguisticBaseline(BaseModel):
    """Tracks a user's linguistic features to detect stress-induced shifts."""
    message_count: int = 0
    avg_sentence_length: float = 0.0
    avg_first_person_pronouns: float = 0.0
    avg_past_tense_ratio: float = 0.0
    avg_present_tense_ratio: float = 0.0
