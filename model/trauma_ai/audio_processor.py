"""
Offline Multi-Modal Audio Processor.

Uses OpenAI's Whisper model completely locally to transcribe
survivor audio recordings into text. Designed to prioritize privacy.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Handles local offline audio transcription.
    Requires `openai-whisper` and `ffmpeg` installed.
    """

    def __init__(self, model_size: str = "base"):
        """
        Parameters
        ----------
        model_size : str
            The whisper model to load. 'tiny', 'base', 'small', 'medium', 'large'.
            'base' is a great balance of speed and size for offline systems.
        """
        self._model_size = model_size
        self._model = None
        self._available = False
        self._initialize()

    def _initialize(self) -> None:
        try:
            import whisper
            logger.info("Loading Whisper model '%s'. (This may take a moment on first run to download)", self._model_size)
            # whisper will automatically use CPU if no GPU
            self._model = whisper.load_model(self._model_size)
            self._available = True
            logger.info("Whisper model loaded successfully.")
        except ImportError:
            logger.warning(
                "openai-whisper package not installed. "
                "Install with: pip install openai-whisper"
            )
        except Exception as e:
            logger.error("Failed to initialize Whisper model: %s", e)

    @property
    def is_available(self) -> bool:
        """Check if completely offline audio transcription is ready."""
        return self._available

    def process_audio(self, file_path: str) -> Optional[str]:
        """
        Transcribe audio to text.
        
        Parameters
        ----------
        file_path : str
            Absolute or relative path to the audio file.
            
        Returns
        -------
        str or None
            The transcribed text, or None if failed.
        """
        if not self._available:
            logger.error("Whisper model is not available for transcription.")
            return None
            
        if not os.path.exists(file_path):
            logger.error("Audio file not found: %s", file_path)
            return None
            
        try:
            logger.info("Transcribing audio file: %s", file_path)
            # fp16=False prevents warnings to user on pure CPU execution
            result = self._model.transcribe(file_path, fp16=False)
            text = result.get("text", "").strip()
            
            if text:
                logger.info("Transcription successful.")
                return text
            else:
                logger.warning("Transcription resulted in empty text.")
                return None
                
        except Exception as e:
            logger.error("Error during offline transcription: %s", e)
            return None
