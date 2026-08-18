import uuid
import requests
import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, Tuple

logger = logging.getLogger(__name__)

@dataclass
class EngineConfig:
    mode: str = "ollama"
    llm_provider: str = "ollama"
    llm_api_key: str = None
    llm_model: str = "llama3.1"
    ollama_url: str = "http://localhost:11434/api/generate"

@dataclass
class EngineResponse:
    response_text: str
    mode_used: str
    phase: str

class ConversationEngine:
    def __init__(self, config: EngineConfig = None):
        self.config = config or EngineConfig()
        self.sessions: Dict[str, Dict[str, Any]] = {}
        logger.info(f"Initialized new Ollama Engine with model {self.config.llm_model}")

    def start_session(self) -> Tuple[str, str]:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "history": [],
            "testimony": {}
        }
        greeting = "I'm here to listen and help you record what happened. Before we begin, what name would you like me to use for you?"
        self.sessions[session_id]["history"].append({"role": "assistant", "content": greeting})
        return session_id, greeting

    def get_session(self, session_id: str) -> Any:
        return self.sessions.get(session_id)

    def process_message(self, session_id: str, message: str) -> EngineResponse:
        if session_id not in self.sessions:
            raise ValueError("Session not found")
            
        session = self.sessions[session_id]
        session["history"].append({"role": "user", "content": message})
        
        system_prompt = (
            "You are a trauma-informed legal documentation assistant named Sanctuary. "
            "Your primary purpose is to help a survivor record a factual account of an incident (Who, What, Where, When, and How) to build a structured testimony. "
            "CRITICAL RULES: "
            "1. Be empathetic but PRIORITIZE GATHERING FACTS. Do NOT ask the user to rate their comfort level or feelings on a scale. "
            "2. Ask exactly ONE gentle, specific question at a time to gather missing factual details for the testimony. "
            "3. NEVER output internal thoughts, meta-commentary, stage directions, or text inside parentheses/brackets (e.g., do not write '(Checking in...)'). "
            "4. Keep your responses concise and conversational. Do not write long paragraphs. "
            "5. Do not offer legal or medical advice. "
            "6. If the user shares a detail, briefly acknowledge it and immediately ask the next logical factual question to continue building the timeline. "
            "7. If the user expresses discomfort, shyness, or inability to answer, briefly comfort them in a warm, calming tone to make them feel safe, and then gently rephrase the question to help them answer. "
            "8. DO NOT overuse the user's name. It sounds robotic to start every message with their name. Speak naturally like a human and use their name very sparingly.\n\n"
        )
        
        prompt_text = system_prompt + "Conversation history:\n"
        for msg in session["history"]:
            prompt_text += f"{msg['role'].capitalize()}: {msg['content']}\n"
        prompt_text += "Assistant: "
        
        response_text = self._call_llm(prompt_text, timeout=120)
        
        if response_text:
            # Strip out any bracketed or parenthesized meta-commentary
            response_text = re.sub(r'[\(\[].*?[\)\]]', '', response_text).strip()
            
        if not response_text:
            response_text = "I am listening. Please take your time and tell me at your own pace."
            
        session["history"].append({"role": "assistant", "content": response_text})
        
        return EngineResponse(
            response_text=response_text,
            mode_used="ollama",
            phase="fact_gathering"
        )

    def get_testimony(self, session_id: str) -> dict:
        if session_id not in self.sessions:
            return {"error": "Session not found"}
            
        session = self.sessions[session_id]
        
        system_prompt = (
            "Analyze the following conversation between an assistant and a survivor. "
            "Create a beautifully formatted, structured, and empathetic summary report in Markdown format. "
            "Organize it clearly using headers (e.g., '## Incident Summary', '## Date & Time', '## Location', '## Parties Involved', '## Key Details'). "
            "Write in a clear, professional, yet compassionate tone. "
            "If any specific details are missing, gently note them as 'Not specified during the session'. "
            "Do NOT return JSON. Return only the Markdown report.\n\n"
        )
        
        prompt_text = system_prompt + "Conversation history:\n"
        for msg in session["history"]:
            prompt_text += f"{msg['role'].capitalize()}: {msg['content']}\n"
            
        report_text = self._call_llm(prompt_text, timeout=120)
        
        session["testimony"] = {"report": report_text}
        return session["testimony"]

    def _call_llm(self, prompt: str, format: str = None, timeout: int = 120) -> str:
        if self.config.llm_provider == "groq":
            return self._call_groq(prompt, format, timeout)
        else:
            return self._call_ollama(prompt, format, timeout)

    def _call_groq(self, prompt: str, format: str = None, timeout: int = 120) -> str:
        if not self.config.llm_api_key:
            logger.error("Groq API key not provided")
            return "ERROR: Groq API key is missing. Please restart the backend with the LLM_API_KEY environment variable set."
            
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.config.llm_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.config.llm_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
            }
            if format == "json":
                payload["response_format"] = {"type": "json_object"}
                
            response = requests.post(url, headers=headers, json=payload, timeout=timeout)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"].strip()
            else:
                logger.error(f"Groq error: {response.status_code} {response.text}")
                return f"ERROR: Groq API failed with status {response.status_code}"
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not connect to Groq: {e}")
            return "ERROR: Could not connect to Groq server."

    def _call_ollama(self, prompt: str, format: str = None, timeout: int = 60) -> str:
        try:
            payload = {
                "model": self.config.llm_model,
                "prompt": prompt,
                "stream": False
            }
            if format == "json":
                payload["format"] = "json"
                
            response = requests.post(self.config.ollama_url, json=payload, timeout=timeout)
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                logger.error(f"Ollama error: {response.status_code} {response.text}")
                return ""
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not connect to Ollama: {e}")
            return "*(Warning: Could not connect to local Ollama server. Please ensure Ollama is installed and running.)*"
