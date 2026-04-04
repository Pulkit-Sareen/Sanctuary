from setuptools import setup, find_packages

setup(
    name="trauma-ai",
    version="1.0.0",
    description=(
        "Trauma-Informed Legal Documentation AI Engine — "
        "helps survivors document experiences safely in structured JSON"
    ),
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "pydantic>=2.0",
        "spacy>=3.5",
    ],
    extras_require={
        "openai": ["openai>=1.0"],
        "gemini": ["google-genai>=1.0"],
        "audio": ["openai-whisper", "soundfile"],
        "all": ["openai>=1.0", "google-genai>=1.0", "openai-whisper", "soundfile"],
    },
)
