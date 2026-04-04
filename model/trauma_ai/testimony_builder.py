"""
Testimony Builder — constructs and maintains the Master Testimony JSON.

Receives extraction results from individual message fragments and
integrates them into a single, coherent Testimony object. Handles
deduplication, gap analysis, and strength assessment.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from .models import (
    Testimony,
    RawFragment,
    ExtractedEntities,
    SensoryDetail,
    ChronologyEntry,
    InvolvedParty,
    Location,
    EmotionalContext,
    PhysicalImpact,
    IdentifiedGap,
    GapImportance,
    Phase,
    TemporalPhase,
)
from .prompts import CLARIFICATION_TEMPLATES

logger = logging.getLogger(__name__)


class TestimonyBuilder:
    """
    Builds and maintains the Master Testimony from message fragments.

    Usage
    -----
    builder = TestimonyBuilder()
    builder.integrate_extraction(text, extraction_results, fragment_id, phase)
    testimony = builder.get_testimony()
    gaps = builder.analyse_gaps()
    """

    def __init__(self, testimony: Optional[Testimony] = None):
        self._testimony = testimony or Testimony()

    @property
    def testimony(self) -> Testimony:
        return self._testimony

    # -----------------------------------------------------------------
    # Fragment integration
    # -----------------------------------------------------------------

    def add_raw_fragment(
        self,
        text: str,
        fragment_id: int,
        phase: Phase,
        extracted_entities: ExtractedEntities,
        assistant_prompt: Optional[str] = None
    ) -> RawFragment:
        """Add a raw fragment to the testimony record."""
        # Create and append the new fragment
        fragment = RawFragment(
            id=fragment_id,
            text=text,
            phase=phase,
            assistant_prompt=assistant_prompt,
            extracted_entities=extracted_entities,
        )
        self._testimony.raw_fragments.append(fragment)
        self._testimony.session_metadata.total_messages += 1
        self._testimony.session_metadata.last_updated = (
            datetime.utcnow().isoformat()
        )
        return fragment

    def integrate_extraction(
        self,
        text: str,
        extraction: dict,
        fragment_id: int,
        phase: Phase,
        assistant_prompt: Optional[str] = None
    ) -> dict[str, int]:
        """
        Integrate extraction results into the testimony.

        Parameters
        ----------
        text : str
            Original message text.
        extraction : dict
            Output from EntityExtractor.extract_all().
        fragment_id : int
            ID of the fragment.
        phase : Phase
            Current workflow phase.
        assistant_prompt : Optional[str]
            The prompt used to generate this fragment.

        Returns
        -------
        dict[str, int]
            Counts of new items added per category.
        """
        counts = {
            "sensory": 0,
            "emotions": 0,
            "physical": 0,
            "chronology": 0,
            "persons": 0,
            "locations": 0,
        }

        # Add raw fragment
        self.add_raw_fragment(text, fragment_id, phase, extraction["entities"], assistant_prompt)

        # Integrate sensory details (with dedup)
        for detail in extraction.get("sensory_details", []):
            if not self._is_duplicate_sensory(detail):
                self._testimony.sensory_details.add(detail)
                counts["sensory"] += 1

        # Integrate emotions
        for emotion in extraction.get("emotions", []):
            if not self._is_duplicate_emotion(emotion):
                self._testimony.emotional_context.append(emotion)
                counts["emotions"] += 1

        # Integrate physical impacts
        for impact in extraction.get("physical_impacts", []):
            if not self._is_duplicate_physical(impact):
                self._testimony.physical_impact.append(impact)
                counts["physical"] += 1

        # Integrate chronology hints
        for entry in extraction.get("chronology_hints", []):
            self._testimony.chronology.append(entry)
            counts["chronology"] += 1

        # Integrate persons (with merging)
        for person in extraction.get("persons", []):
            merged = self._merge_person(person)
            if not merged:
                self._testimony.involved_parties.append(person)
                counts["persons"] += 1

        # Integrate locations (with merging)
        for location in extraction.get("locations", []):
            merged = self._merge_location(location)
            if not merged:
                self._testimony.locations.append(location)
                counts["locations"] += 1

        # Update phase
        self._testimony.session_metadata.current_phase = phase

        return counts

    # -----------------------------------------------------------------
    # Gap Analysis
    # -----------------------------------------------------------------

    def analyse_gaps(self) -> list[IdentifiedGap]:
        """
        Analyse the testimony for gaps that a legal professional would need.

        Returns a list of IdentifiedGap objects with suggested clarification
        questions.
        """
        gaps: list[IdentifiedGap] = []
        t = self._testimony

        # 1. Timeline gaps
        if not t.chronology and not t.incident_details.estimated_date_range.description:
            gaps.append(
                IdentifiedGap(
                    category="timeline",
                    description="No time references have been provided.",
                    importance=GapImportance.HIGH,
                    clarification_question=CLARIFICATION_TEMPLATES["timeline"][0],
                )
            )
        elif len(t.chronology) < 2:
            gaps.append(
                IdentifiedGap(
                    category="timeline",
                    description=(
                        "Limited timeline information. More time markers "
                        "would help establish sequence of events."
                    ),
                    importance=GapImportance.MEDIUM,
                    clarification_question=CLARIFICATION_TEMPLATES["timeline"][1],
                )
            )

        # 2. Location gaps
        if not t.locations:
            gaps.append(
                IdentifiedGap(
                    category="location",
                    description="No specific location has been identified.",
                    importance=GapImportance.HIGH,
                    clarification_question=CLARIFICATION_TEMPLATES["location"][0],
                )
            )
        else:
            # Check if locations lack detail
            sparse_locations = [
                loc
                for loc in t.locations
                if not loc.address_or_area and not loc.details
            ]
            if sparse_locations:
                gaps.append(
                    IdentifiedGap(
                        category="location",
                        description=(
                            "Location(s) mentioned but lack detailed description."
                        ),
                        importance=GapImportance.MEDIUM,
                        clarification_question=CLARIFICATION_TEMPLATES["location"][2],
                    )
                )

        # 3. Perpetrator description gaps
        perpetrators = [
            p
            for p in t.involved_parties
            if p.role.value == "perpetrator"
        ]
        if not perpetrators:
            # Check if *any* person was mentioned
            if t.involved_parties:
                gaps.append(
                    IdentifiedGap(
                        category="perpetrator_description",
                        description=(
                            "People mentioned but perpetrator not clearly identified."
                        ),
                        importance=GapImportance.HIGH,
                        clarification_question=(
                            CLARIFICATION_TEMPLATES["perpetrator_description"][0]
                        ),
                    )
                )
            else:
                gaps.append(
                    IdentifiedGap(
                        category="perpetrator_description",
                        description="No description of the perpetrator(s) provided.",
                        importance=GapImportance.HIGH,
                        clarification_question=(
                            CLARIFICATION_TEMPLATES["perpetrator_description"][0]
                        ),
                    )
                )
        else:
            # Check if perpetrator description is sparse
            sparse_perps = [
                p for p in perpetrators if not p.physical_description
            ]
            if sparse_perps:
                gaps.append(
                    IdentifiedGap(
                        category="perpetrator_description",
                        description="Perpetrator mentioned but physical description is limited.",
                        importance=GapImportance.MEDIUM,
                        clarification_question=(
                            CLARIFICATION_TEMPLATES["perpetrator_description"][1]
                        ),
                    )
                )

        # 4. Witness gaps
        witnesses = [
            p
            for p in t.involved_parties
            if p.role.value == "witness"
        ]
        if not witnesses:
            gaps.append(
                IdentifiedGap(
                    category="witness",
                    description="No witnesses have been mentioned.",
                    importance=GapImportance.MEDIUM,
                    clarification_question=CLARIFICATION_TEMPLATES["witness"][0],
                )
            )

        # 5. Physical evidence gaps
        if not t.physical_impact:
            gaps.append(
                IdentifiedGap(
                    category="physical_evidence",
                    description="No physical injuries or evidence mentioned.",
                    importance=GapImportance.MEDIUM,
                    clarification_question=(
                        CLARIFICATION_TEMPLATES["physical_evidence"][0]
                    ),
                )
            )

        # 6. Sequence / event ordering gaps
        if len(t.raw_fragments) >= 3 and len(t.chronology) < 2:
            gaps.append(
                IdentifiedGap(
                    category="sequence",
                    description=(
                        "Multiple fragments shared but sequence of "
                        "events is unclear."
                    ),
                    importance=GapImportance.MEDIUM,
                    clarification_question=CLARIFICATION_TEMPLATES["sequence"][0],
                )
            )

        # 7. Frequency
        if not t.incident_details.frequency:
            gaps.append(
                IdentifiedGap(
                    category="frequency",
                    description="It's unclear if this was a single event or repeated.",
                    importance=GapImportance.MEDIUM,
                    clarification_question=CLARIFICATION_TEMPLATES["frequency"][0],
                )
            )

        # Store gaps in testimony
        self._testimony.legal_analysis.identified_gaps = gaps

        # Generate pending clarification questions (unaddressed only)
        self._testimony.legal_analysis.pending_clarifications = [
            gap.clarification_question
            for gap in gaps
            if not gap.addressed and gap.clarification_question
        ]

        return gaps

    # -----------------------------------------------------------------
    # Strength Analysis
    # -----------------------------------------------------------------

    def assess_strengths(self) -> list[str]:
        """Identify strengths of the testimony for legal purposes."""
        strengths: list[str] = []
        t = self._testimony

        # Consistent sensory details
        sensory_count = len(t.sensory_details.all_details())
        if sensory_count >= 3:
            strengths.append(
                f"Rich sensory detail provided ({sensory_count} details "
                f"across multiple senses)."
            )
        elif sensory_count >= 1:
            strengths.append("Sensory details provided to support the account.")

        # Multiple fragments (consistency)
        if len(t.raw_fragments) >= 3:
            strengths.append(
                "Account provided across multiple statements, allowing "
                "for consistency assessment."
            )

        # Timeline markers
        if t.chronology:
            strengths.append(
                f"Timeline markers identified ({len(t.chronology)} "
                f"chronological references)."
            )

        # Physical evidence
        if t.physical_impact:
            strengths.append(
                "Physical injuries/evidence documented, which can be "
                "corroborated with medical records."
            )

        # Emotional context
        if t.emotional_context:
            strengths.append(
                "Emotional responses documented, consistent with trauma "
                "responses described in clinical literature."
            )

        # Identified persons
        named_persons = [
            p for p in t.involved_parties if p.known_name or p.physical_description
        ]
        if named_persons:
            strengths.append(
                f"{len(named_persons)} involved person(s) identified "
                f"with descriptive details."
            )

        # Locations
        if t.locations:
            strengths.append(
                f"{len(t.locations)} location(s) identified in the account."
            )

        self._testimony.legal_analysis.strength_indicators = strengths
        return strengths

    # -----------------------------------------------------------------
    # Synthesis — human-readable summary
    # -----------------------------------------------------------------

    def generate_synthesis_sections(self) -> dict[str, list[str]]:
        """
        Generate sections for a human-readable synthesis.

        Returns dict mapping section title → list of bullet points.
        """
        t = self._testimony
        sections: dict[str, list[str]] = {}

        # Sensory
        sensory_items = []
        for detail in t.sensory_details.all_details():
            sensory_items.append(
                f"[{detail.type.value.upper()}] {detail.description}"
            )
        if sensory_items:
            sections["Sensory Details"] = sensory_items

        # Timeline, sorted by TemporalPhase
        timeline_items = []
        phase_order = {
            TemporalPhase.PRE_INCIDENT: 0,
            TemporalPhase.DURING_INCIDENT: 1,
            TemporalPhase.POST_INCIDENT: 2,
            TemporalPhase.UNKNOWN: 3
        }

        sorted_chronology = sorted(
            t.chronology,
            key=lambda e: (phase_order.get(e.temporal_phase, 3), e.sequence_order)
        )

        for entry in sorted_chronology:
            ref = f" ({entry.time_reference})" if entry.time_reference else ""
            conf = f" [{entry.time_confidence.value}]"
            phase_tag = f" [{entry.temporal_phase.value.replace('_', ' ').title()}]" if entry.temporal_phase != TemporalPhase.UNKNOWN else ""
            timeline_items.append(f"{entry.description}{ref}{conf}{phase_tag}")
        if timeline_items:
            sections["Timeline"] = timeline_items

        # Involved parties
        party_items = []
        for party in t.involved_parties:
            name = party.known_name or party.identifier
            desc = (
                f" — {party.physical_description}"
                if party.physical_description
                else ""
            )
            rel = f" (relationship: {party.relationship})" if party.relationship else ""
            party_items.append(
                f"{name} [{party.role.value}]{desc}{rel}"
            )
        if party_items:
            sections["Involved Parties"] = party_items

        # Locations
        location_items = []
        for loc in t.locations:
            detail = f" — {loc.details}" if loc.details else ""
            location_items.append(
                f"{loc.description} [{loc.type.value}]{detail}"
            )
        if location_items:
            sections["Locations"] = location_items

        # Emotional context
        emotion_items = []
        for emo in t.emotional_context:
            event = f" (related to: {emo.associated_event})" if emo.associated_event else ""
            emotion_items.append(f"{emo.emotion}: {emo.description}{event}")
        if emotion_items:
            sections["Emotional Context"] = emotion_items

        # Physical impact
        physical_items = []
        for impact in t.physical_impact:
            area = f" [{impact.body_area}]" if impact.body_area else ""
            physical_items.append(f"{impact.description}{area}")
        if physical_items:
            sections["Physical Impact"] = physical_items

        return sections

    # -----------------------------------------------------------------
    # Narrative summary generation (offline)
    # -----------------------------------------------------------------

    def generate_narrative_summary(self) -> str:
        """Generate a plain-text narrative summary of the testimony."""
        t = self._testimony
        parts: list[str] = []

        # Opening
        frag_count = len(t.raw_fragments)
        parts.append(
            f"This testimony was documented over {frag_count} message(s). "
            f"The following is a structured summary of the account provided."
        )

        # Sensory
        all_sensory = t.sensory_details.all_details()
        if all_sensory:
            sense_types = set(s.type.value for s in all_sensory)
            parts.append(
                f"The survivor described sensory details including "
                f"{', '.join(sense_types)} experiences."
            )

        # Timeline
        if t.chronology:
            parts.append(
                f"{len(t.chronology)} chronological marker(s) were identified "
                f"in the account."
            )

        # Persons
        if t.involved_parties:
            roles = set(p.role.value for p in t.involved_parties)
            parts.append(
                f"{len(t.involved_parties)} person(s) mentioned, "
                f"with roles including: {', '.join(roles)}."
            )

        # Locations
        if t.locations:
            loc_descs = [loc.description for loc in t.locations]
            parts.append(
                f"Location(s) referenced: {', '.join(loc_descs)}."
            )

        # Emotional
        if t.emotional_context:
            emotions = set(e.emotion for e in t.emotional_context)
            parts.append(
                f"Emotional responses documented include: "
                f"{', '.join(emotions)}."
            )

        # Physical
        if t.physical_impact:
            parts.append(
                f"{len(t.physical_impact)} physical impact(s) documented."
            )

        self._testimony.narrative_summary = " ".join(parts)
        return self._testimony.narrative_summary

    # -----------------------------------------------------------------
    # Export
    # -----------------------------------------------------------------

    def get_testimony_json(self, indent: int = 2) -> str:
        """Export the testimony as a JSON string."""
        # Ensure analysis is up-to-date
        self.analyse_gaps()
        self.assess_strengths()
        self.generate_narrative_summary()
        return self._testimony.to_json(indent=indent)

    def get_testimony_dict(self) -> dict:
        """Export the testimony as a dictionary."""
        self.analyse_gaps()
        self.assess_strengths()
        self.generate_narrative_summary()
        return self._testimony.to_dict()

    # -----------------------------------------------------------------
    # Deduplication helpers
    # -----------------------------------------------------------------

    def _is_duplicate_sensory(self, detail: SensoryDetail) -> bool:
        """Check if a similar sensory detail already exists."""
        existing = getattr(
            self._testimony.sensory_details, detail.type.value
        )
        for existing_detail in existing:
            if (
                existing_detail.description.lower().strip()
                == detail.description.lower().strip()
            ):
                return True
        return False

    def _is_duplicate_emotion(self, emotion: EmotionalContext) -> bool:
        for existing in self._testimony.emotional_context:
            if (
                existing.emotion == emotion.emotion
                and existing.description.lower().strip()
                == emotion.description.lower().strip()
            ):
                return True
        return False

    def _is_duplicate_physical(self, impact: PhysicalImpact) -> bool:
        for existing in self._testimony.physical_impact:
            if (
                existing.description.lower().strip()
                == impact.description.lower().strip()
            ):
                return True
        return False

    def _merge_person(self, person: InvolvedParty) -> bool:
        """Try to merge with an existing person. Returns True if merged."""
        for existing in self._testimony.involved_parties:
            if (
                existing.identifier.lower() == person.identifier.lower()
                or (
                    existing.known_name
                    and person.known_name
                    and existing.known_name.lower() == person.known_name.lower()
                )
            ):
                # Merge: add new fragment IDs and update missing fields
                existing.source_fragment_ids.extend(
                    person.source_fragment_ids
                )
                if person.physical_description and not existing.physical_description:
                    existing.physical_description = person.physical_description
                if person.known_name and not existing.known_name:
                    existing.known_name = person.known_name
                if person.relationship and not existing.relationship:
                    existing.relationship = person.relationship
                return True
        return False

    def _merge_location(self, location: Location) -> bool:
        """Try to merge with an existing location. Returns True if merged."""
        for existing in self._testimony.locations:
            if (
                existing.description.lower() == location.description.lower()
            ):
                existing.source_fragment_ids.extend(
                    location.source_fragment_ids
                )
                if location.details and not existing.details:
                    existing.details = location.details
                if location.address_or_area and not existing.address_or_area:
                    existing.address_or_area = location.address_or_area
                return True
        return False
