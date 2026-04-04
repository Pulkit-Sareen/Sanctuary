"""
Grounding exercises for trauma-informed support.

Provides a library of evidence-based grounding techniques that can be
offered when distress is detected or when the user requests a break.
"""

from __future__ import annotations

import random

GROUNDING_EXERCISES: list[dict[str, str]] = [
    {
        "name": "5-4-3-2-1 Senses",
        "type": "sensory",
        "instruction": (
            "Let's try a grounding exercise together. Take a slow breath, "
            "and then:\n\n"
            "  🖐 **5** — Name 5 things you can SEE right now.\n"
            "  ✋ **4** — Name 4 things you can TOUCH or feel.\n"
            "  👂 **3** — Name 3 things you can HEAR.\n"
            "  👃 **2** — Name 2 things you can SMELL.\n"
            "  👅 **1** — Name 1 thing you can TASTE.\n\n"
            "Take your time. There's no rush."
        ),
    },
    {
        "name": "Box Breathing",
        "type": "breathing",
        "instruction": (
            "Let's do some box breathing together. This can help calm "
            "your nervous system:\n\n"
            "  1. **Breathe IN** slowly for 4 seconds\n"
            "  2. **HOLD** your breath for 4 seconds\n"
            "  3. **Breathe OUT** slowly for 4 seconds\n"
            "  4. **HOLD** for 4 seconds\n\n"
            "Repeat this 3-4 times, or as many times as feels comfortable. "
            "Focus on the counting."
        ),
    },
    {
        "name": "Grounding Touch",
        "type": "physical",
        "instruction": (
            "If you'd like, try this gentle grounding exercise:\n\n"
            "  • Press your feet firmly into the floor. Feel the ground "
            "beneath you.\n"
            "  • Place your hands on a solid surface — a table, a wall, "
            "your own knees.\n"
            "  • Notice the temperature and texture under your hands.\n"
            "  • Take three slow breaths, focusing on the physical "
            "sensations.\n\n"
            "You are here. You are safe right now."
        ),
    },
    {
        "name": "Safe Place Visualization",
        "type": "visualization",
        "instruction": (
            "Close your eyes if that feels comfortable, or soften your gaze.\n\n"
            "Think of a place where you feel safe and calm. It can be real "
            "or imagined — a favorite room, a place in nature, anywhere "
            "that feels peaceful.\n\n"
            "  • What do you see there?\n"
            "  • What sounds do you hear?\n"
            "  • What does the air feel like?\n"
            "  • Is there a particular smell or warmth?\n\n"
            "Stay in that place for a moment. Breathe slowly. "
            "When you're ready, you can gently open your eyes."
        ),
    },
    {
        "name": "Cold Water Reset",
        "type": "physical",
        "instruction": (
            "If you have access to water, try this:\n\n"
            "  • Hold something cold — an ice cube, a cold drink, "
            "or run cold water over your wrists.\n"
            "  • Focus entirely on the sensation of cold.\n"
            "  • Notice how it feels against your skin.\n\n"
            "This can help bring you back to the present moment. "
            "Take your time."
        ),
    },
    {
        "name": "Naming Exercise",
        "type": "cognitive",
        "instruction": (
            "Let's try a quick mental exercise to help you feel grounded:\n\n"
            "  • Name 5 colors you can see in the room.\n"
            "  • Name 4 objects within arm's reach.\n"
            "  • Name 3 sounds you can hear right now.\n"
            "  • Say today's date and where you are.\n\n"
            "This helps reconnect you to the present. "
            "You're doing great."
        ),
    },
    {
        "name": "Butterfly Hug",
        "type": "physical",
        "instruction": (
            "This is a self-soothing technique used in trauma therapy:\n\n"
            "  1. Cross your arms over your chest, placing each hand "
            "on the opposite shoulder.\n"
            "  2. Gently tap your left hand, then your right hand, "
            "alternating slowly.\n"
            "  3. Continue this gentle alternating tap for about "
            "30 seconds.\n"
            "  4. Breathe slowly as you do this.\n\n"
            "You can do this for as long as it feels comforting."
        ),
    },
]


def get_random_exercise(preferences: dict[str, int] = None) -> dict[str, str]:
    """
    Return a random grounding exercise, optionally adapting based on preferences.
    preferences is a dict mapping exercise types to a score (e.g. {"physical": -1})
    """
    if preferences:
        # Filter out heavily disliked types
        available = [ex for ex in GROUNDING_EXERCISES if preferences.get(ex["type"], 0) >= 0]
        if available:
            # Maybe boost types with positive preference
            weights = [1.0 + (0.5 * preferences.get(ex["type"], 0)) for ex in available]
            return random.choices(available, weights=weights, k=1)[0]
            
    return random.choice(GROUNDING_EXERCISES)


def get_exercise_by_type(exercise_type: str) -> dict[str, str]:
    """Return a grounding exercise of the specified type.

    Falls back to a random exercise if the type is not found.
    """
    matching = [
        ex for ex in GROUNDING_EXERCISES if ex["type"] == exercise_type
    ]
    if matching:
        return random.choice(matching)
    return get_random_exercise()


def get_exercise_by_name(name: str) -> dict[str, str] | None:
    """Return a specific grounding exercise by name."""
    for ex in GROUNDING_EXERCISES:
        if ex["name"].lower() == name.lower():
            return ex
    return None


def format_exercise(exercise: dict[str, str]) -> str:
    """Format a grounding exercise for display."""
    return f"🌿 **{exercise['name']}**\n\n{exercise['instruction']}"
