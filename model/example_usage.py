"""
Example Usage — Trauma-Informed Legal Documentation AI Engine
=============================================================

This script demonstrates the complete workflow:
1. Starting a session
2. Processing survivor messages (fragmented, non-linear)
3. Automatic entity extraction
4. Phase transitions
5. Testimony export as JSON

Run: python example_usage.py
"""

import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from trauma_ai import ConversationEngine, EngineConfig


def print_separator():
    print("\n" + "=" * 70 + "\n")


def print_response(label: str, response):
    print(f"📎 Phase: {response.phase.value}")
    print(f"🔍 Distress: {response.distress_level.value}")
    if response.grounding_suggested:
        print("🌿 Grounding suggested: Yes")
    print(f"🤖 Mode: {response.mode_used}")
    print(f"\n💬 Assistant:\n{response.response_text}")
    print_separator()


def run_interactive():
    """Run an interactive session in the terminal."""
    print("\n" + "=" * 70)
    print("  Trauma-Informed Legal Documentation Assistant")
    print("  (Interactive Mode)")
    print("=" * 70)

    config = EngineConfig(mode="offline")
    engine = ConversationEngine(config)
    session_id, greeting = engine.start_session()

    print(f"\n💬 Assistant:\n{greeting}")
    print_separator()

    print("Commands:")
    print("  /export    — Export testimony as JSON")
    print("  /testimony — View current testimony")
    print("  /grounding — Get a grounding exercise")
    print("  /phase     — See current phase")
    print("  /quit      — End session")
    print_separator()

    while True:
        try:
            user_input = input("🗣️  You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nSession ended. Take care of yourself. 💙")
            break

        if not user_input:
            continue

        if user_input.lower() == "/quit":
            response = engine.finalize_session(session_id)
            print(f"\n💬 Assistant:\n{response.response_text}")
            print_separator()
            # Export final testimony
            testimony_json = engine.export_testimony(session_id)
            print("📄 Final Testimony JSON saved to: testimony_output.json")
            with open("testimony_output.json", "w", encoding="utf-8") as f:
                f.write(testimony_json)
            break

        elif user_input.lower() == "/export":
            testimony_json = engine.export_testimony(session_id)
            with open("testimony_output.json", "w", encoding="utf-8") as f:
                f.write(testimony_json)
            print("📄 Testimony exported to: testimony_output.json")
            print_separator()
            continue

        elif user_input.lower() == "/testimony":
            testimony = engine.get_testimony(session_id)
            print(json.dumps(testimony, indent=2))
            print_separator()
            continue

        elif user_input.lower() == "/grounding":
            exercise = engine.get_grounding_exercise()
            print(exercise["formatted"])
            print_separator()
            continue

        elif user_input.lower() == "/phase":
            session = engine.get_session(session_id)
            print(f"Current phase: {session.phase.value}")
            print(f"Messages: {session.message_count}")
            print_separator()
            continue

        # Process the message
        response = engine.process_message(session_id, user_input)
        print_response("Response", response)


def run_demo():
    """Run an automated demo showing the full workflow."""
    print("\n" + "=" * 70)
    print("  Trauma-Informed Legal Documentation AI Engine")
    print("  — Automated Demo —")
    print("=" * 70 + "\n")

    # Initialize engine in offline mode
    config = EngineConfig(mode="offline")
    engine = ConversationEngine(config)

    # Start session
    session_id, greeting = engine.start_session()
    print(f"💬 Assistant:\n{greeting}")
    print_separator()

    # Simulate survivor messages (fragmented, non-linear)
    messages = [
        # Fragment 1: Sensory memory
        "I remember the smell of cigarettes. It was so dark I could "
        "barely see. There were shadows on the wall.",

        # Fragment 2: Physical experience
        "He grabbed my arm really hard. I could feel his grip tightening. "
        "Later I noticed bruises on my wrists and arms.",

        # Fragment 3: Time and emotion
        "It was sometime last December, I think around midnight. "
        "I was terrified. I couldn't move. I felt completely frozen.",

        # Signal to synthesize
        "That's all I can remember right now.",

        # Affirmative for synthesis
        "Yes, please go ahead.",
    ]

    for i, msg in enumerate(messages, 1):
        print(f"🗣️  Survivor (Message {i}):\n{msg}")
        print()
        response = engine.process_message(session_id, msg)
        print_response(f"Response {i}", response)

    # Export testimony
    print("\n📄 FINAL TESTIMONY JSON:")
    print("=" * 70)
    testimony_json = engine.export_testimony(session_id)
    print(testimony_json)

    # Save to file
    with open("testimony_output.json", "w", encoding="utf-8") as f:
        f.write(testimony_json)
    print(f"\n✅ Testimony saved to: testimony_output.json")

    # Print summary stats
    testimony = engine.get_testimony(session_id)
    print(f"\n📊 Summary:")
    print(f"   Messages processed: {testimony['session_metadata']['total_messages']}")
    print(f"   Sensory details: {len(testimony['sensory_details']['visual']) + len(testimony['sensory_details']['auditory']) + len(testimony['sensory_details']['olfactory']) + len(testimony['sensory_details']['tactile'])}")
    print(f"   Chronology entries: {len(testimony['chronology'])}")
    print(f"   Involved parties: {len(testimony['involved_parties'])}")
    print(f"   Locations: {len(testimony['locations'])}")
    print(f"   Emotional context: {len(testimony['emotional_context'])}")
    print(f"   Physical impacts: {len(testimony['physical_impact'])}")
    print(f"   Identified gaps: {len(testimony['legal_analysis']['identified_gaps'])}")
    print(f"   Strength indicators: {len(testimony['legal_analysis']['strength_indicators'])}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        run_interactive()
    else:
        run_demo()
