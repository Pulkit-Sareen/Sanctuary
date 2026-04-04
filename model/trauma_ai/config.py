"""
Configuration constants for the Trauma-Informed Legal Documentation AI Engine.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class EngineConfig:
    """Configuration for the ConversationEngine."""

    # --- Mode -----------------------------------------------------------
    # "offline"  → NLP-only (no external API calls)
    # "llm"     → LLM-only (requires API key)
    # "hybrid"  → Offline first, LLM as enhancement/fallback
    mode: str = "hybrid"

    # --- LLM Settings ---------------------------------------------------
    llm_provider: str = "openai"        # "openai" | "gemini"
    llm_api_key: Optional[str] = None
    llm_model: str = "gpt-4o"           # or "gemini-2.0-flash"
    llm_temperature: float = 0.4
    llm_max_tokens: int = 1024
 
    # --- NLP Settings ---------------------------------------------------
    spacy_model: str = "en_core_web_sm"

    # --- Phase Thresholds -----------------------------------------------
    # Minimum messages before the system offers to synthesize
    min_messages_before_synthesis: int = 3
    # Maximum clarification questions per round
    max_clarification_questions: int = 8

    # --- Distress Detection ---------------------------------------------
    distress_keyword_threshold: int = 2
    # Number of consecutive high-distress messages before mandatory pause
    consecutive_distress_limit: int = 2

    # --- Response Behavior ----------------------------------------------
    include_testimony_in_response: bool = True
    auto_advance_phases: bool = False  # if True, engine advances phases automatically


# -----------------------------------------------------------------------
# Sensory keyword dictionaries for offline extraction
# -----------------------------------------------------------------------

VISUAL_KEYWORDS: list[str] = [
    "saw", "see", "seeing", "seen", "looked", "looking", "watch", "watched",
    "dark", "darkness", "light", "bright", "dim", "shadow", "color", "colour",
    "red", "blue", "black", "white", "flash", "flashing", "blurry", "blur",
    "face", "eyes", "hands", "blood", "mirror", "window", "door", "wall",
    "room", "ceiling", "floor", "night", "daylight", "sunlight", "moonlight",
    "glare", "pale", "bruise", "mark", "stain",
]

AUDITORY_KEYWORDS: list[str] = [
    "heard", "hear", "hearing", "sound", "sounds", "noise", "noises",
    "voice", "voices", "shout", "shouted", "shouting", "scream", "screamed",
    "screaming", "whisper", "whispered", "whispering", "bang", "banging",
    "knock", "knocking", "crash", "silence", "silent", "quiet", "loud",
    "music", "crying", "sobbing", "laughing", "laughter", "yell", "yelling",
    "footsteps", "breathing", "siren", "phone", "ringing", "slam", "slamming",
    "thud", "click", "creak",
]

OLFACTORY_KEYWORDS: list[str] = [
    "smell", "smelled", "smelling", "smells", "odor", "odour", "stench",
    "stink", "scent", "fragrance", "perfume", "cologne", "cigarette",
    "cigarettes", "smoke", "smoking", "alcohol", "beer", "liquor", "sweat",
    "blood", "gas", "gasoline", "chemical", "bleach", "burnt", "burning",
    "food", "cooking", "musty", "damp", "mold", "mould",
]

TACTILE_KEYWORDS: list[str] = [
    "felt", "feel", "feeling", "touch", "touched", "touching", "grab",
    "grabbed", "grabbing", "grip", "gripped", "hold", "held", "holding",
    "push", "pushed", "pushing", "pull", "pulled", "pulling", "hit",
    "hitting", "slap", "slapped", "punch", "punched", "kick", "kicked",
    "choke", "choked", "choking", "squeeze", "squeezed", "burn", "burned",
    "burning", "cold", "hot", "warm", "wet", "rough", "sharp", "pain",
    "painful", "sting", "stinging", "numb", "numbness", "pressure",
    "weight", "heavy", "tight", "tie", "tied", "restrain", "restrained",
    "scratch", "scratched", "bite", "bitten", "shove", "shoved",
]

EMOTION_KEYWORDS: dict[str, list[str]] = {
    "fear": [
        "afraid", "scared", "terrified", "terror", "fear", "fearful",
        "frightened", "panic", "panicked", "panicking", "dread", "dreading",
        "anxious", "anxiety", "nervous", "petrified", "frozen", "froze",
        "paralyzed", "paralysed",
    ],
    "anger": [
        "angry", "anger", "rage", "furious", "mad", "frustrated",
        "frustration", "hate", "hatred", "resentment", "resent",
    ],
    "sadness": [
        "sad", "sadness", "cry", "cried", "crying", "tears", "grief",
        "grieving", "depressed", "depression", "hopeless", "hopelessness",
        "despair", "heartbroken", "devastated", "empty", "emptiness",
        "lonely", "loneliness", "miserable",
    ],
    "shame": [
        "shame", "ashamed", "embarrassed", "embarrassment", "humiliated",
        "humiliation", "guilt", "guilty", "blame", "blamed", "dirty",
        "worthless", "disgusting",
    ],
    "helplessness": [
        "helpless", "powerless", "trapped", "stuck", "hopeless", "alone",
        "isolated", "vulnerable", "weak", "small", "invisible", "silenced",
        "voiceless", "ignored",
    ],
    "dissociation": [
        "numb", "numbness", "disconnected", "unreal", "floating",
        "outside my body", "watching myself", "blank", "foggy", "hazy",
        "detached", "autopilot", "zoned out", "checked out",
    ],
    "confusion": [
        "confused", "confusion", "disoriented", "lost", "blur", "blurry",
        "hazy", "don't understand", "didn't understand", "can't remember",
        "memory", "forget", "forgot", "forgotten", "unclear",
    ],
}

PHYSICAL_IMPACT_KEYWORDS: list[str] = [
    "bruise", "bruises", "bruised", "cut", "cuts", "bleeding", "bled",
    "blood", "scar", "scars", "swollen", "swelling", "broken", "fracture",
    "fractured", "sprain", "strained", "burn", "burns", "wound", "wounds",
    "injury", "injuries", "injured", "hurt", "hurting", "pain", "painful",
    "sore", "ache", "aching", "limp", "limping", "concussion", "dizzy",
    "dizziness", "vomit", "vomiting", "nausea", "faint", "fainting",
    "unconscious", "hospital", "doctor", "emergency", "ambulance",
    "stitches", "bandage", "medication", "pregnant", "pregnancy",
    "infection", "std", "sti",
]

# Body area keywords for mapping physical impacts
BODY_AREAS: dict[str, list[str]] = {
    "head": ["head", "skull", "forehead", "temple", "scalp"],
    "face": ["face", "cheek", "cheeks", "jaw", "chin", "lip", "lips", "nose", "eye", "eyes", "ear", "ears", "mouth"],
    "neck": ["neck", "throat"],
    "chest": ["chest", "breast", "breasts", "ribs", "rib"],
    "abdomen": ["stomach", "abdomen", "belly", "gut"],
    "back": ["back", "spine", "lower back", "upper back"],
    "arms": ["arm", "arms", "wrist", "wrists", "elbow", "elbows", "forearm", "shoulder", "shoulders"],
    "hands": ["hand", "hands", "finger", "fingers", "knuckle", "knuckles"],
    "legs": ["leg", "legs", "thigh", "thighs", "knee", "knees", "shin", "shins", "ankle", "ankles", "calf"],
    "feet": ["foot", "feet", "toe", "toes"],
    "genitals": ["genitals", "genital", "groin", "pelvic", "pelvis", "vagina", "vaginal", "penis"],
    "whole body": ["body", "everywhere", "all over"],
}

# -----------------------------------------------------------------------
# Distress signal keywords
# -----------------------------------------------------------------------

DISTRESS_SIGNALS: dict[str, list[str]] = {
    "crisis": [
        "want to die", "kill myself", "end it all", "can't go on",
        "no point", "suicide", "suicidal", "self-harm", "self harm",
        "hurt myself", "cutting myself", "nothing matters",
        "better off dead", "don't want to live", "end my life",
    ],
    "high_distress": [
        "can't breathe", "can't stop crying", "shaking", "trembling",
        "flashback", "having a flashback", "panic attack", "hyperventilating",
        "can't take it", "too much", "overwhelmed", "breaking down",
        "falling apart", "losing my mind", "going crazy", "can't handle",
        "spiraling", "drowning", "suffocating",
    ],
    "moderate_distress": [
        "this is hard", "struggling", "difficult", "painful to remember",
        "hard to talk about", "don't want to talk", "need a break",
        "need to stop", "uncomfortable", "triggered", "triggering",
        "can't remember", "mind went blank", "scared to say",
    ],
    "low_distress": [
        "nervous", "anxious", "worried", "uneasy", "tense",
        "a little scared", "hard to say", "embarrassing",
    ],
}

# -----------------------------------------------------------------------
# Time-related patterns for chronology extraction
# -----------------------------------------------------------------------

TIME_PATTERNS: list[str] = [
    r"\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b",
    r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b",
    r"\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\b(?:morning|afternoon|evening|night|midnight|dawn|dusk|noon|sunrise|sunset)\b",
    r"\b(?:last\s+(?:week|month|year|night|summer|winter|spring|fall|autumn))\b",
    r"\b(?:yesterday|today|tonight|tomorrow)\b",
    r"\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b",  # dates like 12/03/2023
    r"\b\d{4}\b",  # years
    r"\b(?:around|about|approximately|roughly|maybe)\s+\d{1,2}\s*(?:am|pm|o'clock)\b",
    r"\b\d{1,2}\s*(?:am|pm|o'clock)\b",
    r"\b(?:a\s+(?:few|couple)\s+(?:days|weeks|months|years)\s+ago)\b",
    r"\b(?:when\s+i\s+was\s+\d{1,2})\b",
    r"\b(?:ago|before|after|during|while|since|until)\b",
]

# -----------------------------------------------------------------------
# Location indicators
# -----------------------------------------------------------------------

LOCATION_INDICATORS: list[str] = [
    "house", "home", "apartment", "flat", "room", "bedroom", "bathroom",
    "kitchen", "basement", "attic", "garage", "car", "vehicle", "van",
    "truck", "bus", "train", "taxi", "uber", "hotel", "motel", "hostel",
    "office", "workplace", "work", "school", "college", "university",
    "hospital", "clinic", "bar", "club", "pub", "restaurant", "park",
    "street", "road", "alley", "alleyway", "parking", "lot", "building",
    "warehouse", "factory", "church", "temple", "mosque", "shelter",
    "camp", "forest", "woods", "field", "beach", "river", "bridge",
    "station", "airport", "border", "prison", "jail", "cell",
    "upstairs", "downstairs", "inside", "outside", "behind", "corner",
]

# -----------------------------------------------------------------------
# Temporal Phase Indicators
# -----------------------------------------------------------------------

TEMPORAL_PHASE_INDICATORS: dict[str, list[str]] = {
    "pre_incident": [
        "before", "leading up to", "earlier", "on my way", "we were just",
        "started out", "initially", "at first", "heading to", "went to",
    ],
    "during_incident": [
        "suddenly", "then he", "when it happened", "started to", "began to",
        "grabbed", "hit", "attacked", "forced", "tried to stop", "couldn't",
    ],
    "post_incident": [
        "after", "afterwards", "later", "next day", "hospital", "police",
        "ran away", "got out", "left", "woke up", "finally",
    ]
}
