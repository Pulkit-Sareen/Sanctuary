"""
LLM client for external API integration.

Supports OpenAI and Google Gemini as LLM providers for enhanced
response generation, synthesis, and structured extraction.
Falls back gracefully if APIs are unavailable.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from .config import EngineConfig
from .prompts import SYSTEM_PROMPT, SYNTHESIS_PROMPT, CLARIFICATION_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Client for interacting with external LLM APIs.

    Supports:
    - OpenAI (GPT-4o, GPT-4, GPT-3.5-turbo)
    - Google Gemini (gemini-2.0-flash, gemini-1.5-pro)
    """

    def __init__(self, config: EngineConfig):
        self._config = config
        self._client = None
        self._available = False
        self._initialize()

    def _initialize(self) -> None:
        """Initialize the appropriate API client."""
        if not self._config.llm_api_key:
            logger.info("No LLM API key provided. LLM mode unavailable.")
            return

        provider = self._config.llm_provider.lower()

        if provider == "openai":
            self._init_openai()
        elif provider == "gemini":
            self._init_gemini()
        else:
            logger.warning("Unknown LLM provider: %s", provider)

    def _init_openai(self) -> None:
        """Initialize OpenAI client."""
        try:
            from openai import OpenAI

            self._client = OpenAI(api_key=self._config.llm_api_key)
            self._available = True
            logger.info("OpenAI client initialized successfully.")
        except ImportError:
            logger.warning(
                "openai package not installed. "
                "Install with: pip install openai"
            )
        except Exception as e:
            logger.error("Failed to initialize OpenAI client: %s", e)

    def _init_gemini(self) -> None:
        """Initialize Google Gemini client."""
        try:
            from google import genai

            self._client = genai.Client(api_key=self._config.llm_api_key)
            self._available = True
            logger.info("Gemini client initialized successfully.")
        except ImportError:
            logger.warning(
                "google-genai package not installed. "
                "Install with: pip install google-genai"
            )
        except Exception as e:
            logger.error("Failed to initialize Gemini client: %s", e)

    @property
    def is_available(self) -> bool:
        """Check if the LLM client is available."""
        return self._available

    # -----------------------------------------------------------------
    # Core generation
    # -----------------------------------------------------------------

    def generate_response(
        self,
        conversation_history: list[dict],
        additional_system_prompt: str = "",
    ) -> Optional[str]:
        """
        Generate a response using the LLM.

        Parameters
        ----------
        conversation_history : list[dict]
            List of {'role': 'user'|'assistant', 'content': str} messages.
        additional_system_prompt : str
            Extra context to append to the system prompt.

        Returns
        -------
        str or None
            Generated response, or None if unavailable.
        """
        if not self._available:
            return None

        system = SYSTEM_PROMPT
        if additional_system_prompt:
            system += "\n\n" + additional_system_prompt

        try:
            provider = self._config.llm_provider.lower()

            if provider == "openai":
                return self._generate_openai(system, conversation_history)
            elif provider == "gemini":
                return self._generate_gemini(system, conversation_history)

        except Exception as e:
            logger.error("LLM generation failed: %s", e)
            return None

    def _generate_openai(
        self, system: str, history: list[dict]
    ) -> Optional[str]:
        """Generate response via OpenAI."""
        messages = [{"role": "system", "content": system}]
        messages.extend(history)

        response = self._client.chat.completions.create(
            model=self._config.llm_model,
            messages=messages,
            temperature=self._config.llm_temperature,
            max_tokens=self._config.llm_max_tokens,
        )
        return response.choices[0].message.content

    def _generate_gemini(
        self, system: str, history: list[dict]
    ) -> Optional[str]:
        """Generate response via Google Gemini."""
        from google.genai import types

        # Build contents for Gemini
        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])],
                )
            )

        response = self._client.models.generate_content(
            model=self._config.llm_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=self._config.llm_temperature,
                max_output_tokens=self._config.llm_max_tokens,
            ),
        )
        return response.text

    # -----------------------------------------------------------------
    # Specialized generation methods
    # -----------------------------------------------------------------

    def generate_synthesis(
        self,
        conversation_history: list[dict],
        testimony_summary: str,
    ) -> Optional[str]:
        """
        Generate a synthesis of the testimony.

        Parameters
        ----------
        conversation_history : list[dict]
            Full conversation history.
        testimony_summary : str
            Current testimony summary from the builder.
        """
        extra_prompt = (
            f"{SYNTHESIS_PROMPT}\n\n"
            f"Current testimony state:\n{testimony_summary}"
        )
        return self.generate_response(conversation_history, extra_prompt)

    def generate_clarification_question(
        self,
        conversation_history: list[dict],
        testimony_summary: str,
        gaps: list[str],
    ) -> Optional[str]:
        """
        Generate a gentle clarification question.

        Parameters
        ----------
        conversation_history : list[dict]
            Full conversation history.
        testimony_summary : str
            Current testimony summary.
        gaps : list[str]
            List of identified gaps.
        """
        prompt = CLARIFICATION_PROMPT_TEMPLATE.format(
            testimony_summary=testimony_summary,
            gaps="\n".join(f"- {g}" for g in gaps),
        )
        return self.generate_response(conversation_history, prompt)

    def extract_structured_info(
        self,
        text: str,
        conversation_history: list[dict],
    ) -> Optional[dict]:
        """
        Use LLM to extract structured information from text.

        Returns a dict with keys matching the extraction format,
        or None if unavailable/failed.
        """
        extraction_prompt = """Extract structured information from the survivor's latest message. 
Return a JSON object with the following keys:
{
  "persons": [{"name": "...", "description": "...", "role": "perpetrator|witness|bystander|helper|other", "relationship": "..."}],
  "locations": [{"description": "...", "type": "indoor|outdoor|vehicle|other", "details": "..."}],
  "dates_times": [{"reference": "...", "confidence": "certain|approximate|uncertain"}],
  "sensory_details": [{"type": "visual|auditory|olfactory|tactile|gustatory", "description": "..."}],
  "emotions": [{"emotion": "...", "description": "...", "associated_event": "..."}],
  "physical_impacts": [{"description": "...", "body_area": "...", "severity": "..."}],
  "incident_frequency": "single_incident|repeated|ongoing|unknown"
}

Only include information that was EXPLICITLY mentioned. Do not infer or fabricate.
Return ONLY valid JSON, no other text."""

        history = conversation_history.copy()
        history.append({
            "role": "user",
            "content": f"Extract from this message: \"{text}\"",
        })

        result = self.generate_response(history, extraction_prompt)
        if result:
            try:
                # Try to parse JSON from the response
                # Handle potential markdown code blocks
                cleaned = result.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    cleaned = "\n".join(lines[1:-1])
                return json.loads(cleaned)
            except json.JSONDecodeError:
                logger.warning("Failed to parse LLM extraction as JSON.")
                return None
        return None
