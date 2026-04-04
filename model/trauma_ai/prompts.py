"""
System prompts and response templates for the Trauma-Informed AI Engine.

Contains:
- LLM system prompts
- Offline response templates (empathetic, phase-appropriate)
- Clarification question templates
- Synthesis templates
"""

# ---------------------------------------------------------------------------
# LLM System Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a Trauma-Informed Legal Documentation Assistant. \
Your goal is to help survivors of trauma (sexual violence, torture, trafficking, \
and domestic abuse) record their experiences in a way that respects their \
psychological well-being while producing a structured, reliable account for \
legal purposes.

Core Principles:

1. **Non-Linear Acceptance**: Understand that trauma causes fragmented memory. \
Accept scattered details, sensory fragments, and emotional reflections without \
demanding chronological order immediately.

2. **Empathetic Neutrality**: Maintain a supportive, non-judgmental tone. \
Validate that "not remembering" or "inconsistency" is normal — it is a \
physiological response to trauma, not unreliability.

3. **Dynamic Structuring**: As the survivor provides information, mentally \
organize it into sensory information, chronology, and involved parties.

4. **Gentle Probing**: Ask follow-up questions that are open-ended and \
sensory-based (e.g., "Do you remember any specific sounds or the lighting in \
the room?") rather than "why" questions, which can feel accusatory.

5. **Safety First**: If the user expresses intense distress, pause the process \
and offer a grounding exercise or suggest a break.

IMPORTANT RULES:
- NEVER use "why" questions.
- NEVER express doubt about the survivor's account.
- NEVER minimize their experience.
- ALWAYS validate their feelings and courage in sharing.
- Use warm, supportive language without being patronizing.
- Keep responses focused and not overly long.
- When synthesizing, use professional but accessible language.
"""

SYNTHESIS_PROMPT = """Based on the conversation so far, create a structured \
synthesis of the survivor's testimony. Organize it into:

1. **Sensory Details**: What they saw, heard, smelled, felt physically
2. **Timeline**: Any chronological markers or sequence of events
3. **Involved Parties**: People mentioned, their descriptions, roles
4. **Locations**: Places mentioned
5. **Emotional Context**: Feelings described
6. **Physical Impact**: Any injuries or physical effects mentioned

Present this as a clear summary, then identify 3-5 gaps a legal professional \
would need filled. Phrase these as gentle follow-up questions.

IMPORTANT: Be thorough but don't fabricate. Only include what was actually shared.
"""

CLARIFICATION_PROMPT_TEMPLATE = """The survivor has shared their experience. \
Here is the current testimony summary:

{testimony_summary}

The following gaps have been identified:
{gaps}

Generate the next gentle, sensory-based follow-up question to address the most \
important gap. The question should:
- Be open-ended
- Use sensory prompts when possible
- NOT use "why"
- Be supportive and validating
- Focus on one thing at a time
"""

# ---------------------------------------------------------------------------
# Offline Response Templates
# ---------------------------------------------------------------------------

GREETING = (
    "Hello. I'm here to help you document your experiences at your own pace, "
    "in a space that is safe and entirely yours.\n\n"
    "There is no right or wrong way to share. You can tell me things in any "
    "order — fragments, feelings, images, sounds — whatever comes to mind. "
    "Memories of difficult experiences often come in pieces, and that is "
    "completely normal.\n\n"
    "Everything you share stays with you. You are in control, and we can "
    "pause or stop at any time.\n\n"
    "Whenever you feel ready, you can begin by sharing whatever is on your "
    "mind right now."
)

# Templates for acknowledging different types of input
ACKNOWLEDGMENT_TEMPLATES = [
    "Thank you for sharing that with me. What you've described is important, "
    "and I want you to know that I hear you.",

    "I appreciate your courage in sharing this. Everything you're telling me "
    "matters, and I'm carefully noting what you share.",

    "Thank you. I can see this takes strength to talk about. Please know that "
    "however these memories come — in pieces, out of order, mixed with "
    "feelings — all of it is valid and useful.",

    "I hear you, and what you're sharing is being carefully recorded. "
    "Take all the time you need.",

    "Thank you for trusting me with this. I want you to know that "
    "fragmented memories are a completely normal response to what you've "
    "been through. Every detail you share helps build the full picture.",
]

# Templates for when extraction finds specific content
EXTRACTION_ACKNOWLEDGMENTS = {
    "sensory": (
        "I notice you've shared some sensory details — things you {sense_type}. "
        "These kinds of details are very valuable and help create a clear record. "
        "If any other sensory memories come to mind, please share them whenever "
        "they surface."
    ),
    "person": (
        "You've mentioned someone in your account. Any details about them — "
        "even small things like how they spoke or what they were wearing — "
        "can be helpful. But only share what feels safe."
    ),
    "location": (
        "The place you've described helps establish important context. "
        "If you remember any other details about the space — the lighting, "
        "temperature, any distinctive features — feel free to share those too."
    ),
    "time": (
        "The time reference you've given helps us start building a timeline. "
        "Even approximate timeframes are very useful."
    ),
    "emotion": (
        "Your feelings are an important part of this record. Thank you for "
        "sharing how this made you feel. There's no wrong way to feel about "
        "what happened."
    ),
    "physical": (
        "I want to acknowledge what you've shared about the physical impact. "
        "This information is important for documentation. If there was any "
        "medical attention involved, that can be noted too, whenever you're ready."
    ),
}

# Templates for transitioning to synthesis
SYNTHESIS_TRANSITION = (
    "Thank you for everything you've shared so far. You've shown incredible "
    "strength.\n\n"
    "I'd like to organize what you've told me into a structured summary. "
    "This helps create a clear record that can be useful if you ever need it "
    "for legal or advocacy purposes.\n\n"
    "After I share this summary, you'll have the chance to correct anything, "
    "add details, or tell me if something doesn't feel right.\n\n"
    "Would you like me to go ahead and create this summary?"
)

# Template for presenting synthesis
SYNTHESIS_PRESENTATION = (
    "Here is what I've gathered from everything you've shared:\n\n"
    "{synthesis}\n\n"
    "Please take your time reviewing this. You can tell me if anything needs "
    "to be changed, removed, or if I've misunderstood something. "
    "Your accuracy and comfort are what matter most."
)

# Templates for clarification questions
CLARIFICATION_INTRO = (
    "To help make this record as complete as possible, I have a few gentle "
    "follow-up questions. You don't have to answer any of them, and we can "
    "skip anything that feels too difficult right now.\n\n"
    "I'll ask one at a time."
)

# Gentle clarification question templates by category
CLARIFICATION_TEMPLATES = {
    "timeline": [
        "Do you have a sense of roughly when this happened? It could be a "
        "season, a time of day, or how long ago it was — even approximate "
        "answers are helpful.",
        "Can you recall what time of day it was? Sometimes details like "
        "whether it was light or dark outside can help.",
        "Do you remember if this happened on a particular day of the week, "
        "or around any event or occasion you can recall?",
    ],
    "location": [
        "Could you describe the space where this happened? Any details — "
        "the size, whether it was indoors or outdoors, any distinctive "
        "features — can help.",
        "Do you remember how you got to that place, or any landmarks or "
        "features nearby?",
        "Was there anything distinctive about the room or area — the "
        "flooring, walls, furniture, temperature?",
    ],
    "perpetrator_description": [
        "If you're comfortable, could you share any physical details about "
        "the person — their approximate height, build, hair, or anything "
        "you noticed about their appearance?",
        "Do you remember anything about how they spoke — their voice, "
        "accent, or specific words they used?",
        "Was there anything distinctive you noticed about them — clothing, "
        "a smell, jewelry, tattoos?",
    ],
    "witness": [
        "Was anyone else present or nearby when this happened? Even someone "
        "you heard but didn't see?",
        "Did anyone see you before or after the incident — someone who "
        "might have noticed something was wrong?",
    ],
    "physical_evidence": [
        "Were there any marks, injuries, or physical effects afterward? "
        "Anything you noticed on your body?",
        "Did you seek medical attention at any point? If so, do you "
        "remember where or when?",
        "Are there any physical items connected to what happened — "
        "clothing, messages, photos, documents?",
    ],
    "sequence": [
        "You've mentioned several things that happened. Do you have a sense "
        "of what happened first, or what order some of these events occurred in?",
        "Is there a moment that stands out as the beginning — the first "
        "thing that felt wrong?",
        "Do you remember what happened right after the incident? Where you "
        "went or what you did?",
    ],
    "frequency": [
        "Did something like this happen more than once, or was it a single "
        "event? Either answer is important to document.",
        "If this happened multiple times, do you recall if the pattern "
        "changed over time?",
    ],
}

# Templates for acknowledging clarification answers
CLARIFICATION_ACK_TEMPLATES = [
    "Thank you for that detail. It helps build a clearer picture.",
    "I appreciate you sharing that. This is very helpful for the record.",
    "Thank you. That additional context is valuable.",
    "I hear you. Thank you for adding that detail.",
]

# Template for when the user can't remember
CANT_REMEMBER_RESPONSE = (
    "That's completely okay. Not remembering is a normal response — our "
    "minds sometimes protect us by making certain details harder to access. "
    "If anything comes back to you later, you can always add it then."
)

# Template for update phase
UPDATE_CONFIRMATION = (
    "I've updated the record with the new information you've provided. "
    "Here is the current state of your testimony:\n\n"
    "{testimony}\n\n"
    "Does this look accurate? Is there anything else you'd like to add, "
    "change, or remove?"
)

# Template for finalization
FINALIZATION = (
    "Thank you for your incredible courage throughout this process. "
    "Your testimony has been carefully documented and is ready for you.\n\n"
    "You can export this record whenever you're ready. Remember, you remain "
    "in control of this information — it belongs to you.\n\n"
    "If you ever want to come back and add more details, you can do so "
    "at any time. Memories can surface days, weeks, or even months later, "
    "and that's perfectly normal.\n\n"
    "Please take care of yourself. You've done something very brave today."
)

# ---------------------------------------------------------------------------
# Distress / Grounding response templates
# ---------------------------------------------------------------------------

DISTRESS_RESPONSES = {
    "critical": (
        "I can hear that you're in a lot of pain right now. Your safety is "
        "the most important thing.\n\n"
        "If you are in immediate danger or having thoughts of harming "
        "yourself, please reach out:\n"
        "• **National Suicide Prevention Lifeline**: 988 (call or text)\n"
        "• **Crisis Text Line**: Text HOME to 741741\n"
        "• **Emergency Services**: 911\n\n"
        "We can pause here for as long as you need. I'll be here whenever "
        "you're ready to continue — or not. There is no pressure."
    ),
    "high": (
        "I can see this is becoming very overwhelming. That's completely "
        "understandable — what you're describing is deeply difficult.\n\n"
        "Let's take a moment. Would you like to try a brief grounding "
        "exercise to help you feel more present? Or would you prefer to "
        "take a break and come back later?\n\n"
        "There's no rush. Your well-being comes first."
    ),
    "moderate": (
        "I notice this is bringing up a lot of difficult feelings. That's "
        "a natural response, and it shows how much strength it takes to "
        "share this.\n\n"
        "Please remember: you can pause at any time. We can slow down, "
        "take a break, or try a grounding exercise. What feels right "
        "for you?"
    ),
}

# ---------------------------------------------------------------------------
# Synthesis formatting helpers
# ---------------------------------------------------------------------------

def format_synthesis_section(title: str, items: list[str]) -> str:
    """Format a section of the synthesis with a title and bullet points."""
    if not items:
        return ""
    bullets = "\n".join(f"  • {item}" for item in items)
    return f"**{title}:**\n{bullets}"


def format_full_synthesis(sections: dict[str, list[str]]) -> str:
    """Format the full synthesis from a dictionary of sections."""
    parts = []
    for title, items in sections.items():
        section = format_synthesis_section(title, items)
        if section:
            parts.append(section)
    return "\n\n".join(parts)
