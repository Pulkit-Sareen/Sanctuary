from pydantic import BaseModel
from typing import List, Optional

class ConversationItem(BaseModel):
    question: str
    answer_text: str
    emotion: str
    timestamp: Optional[str]
    raw_convo: str

class Session(BaseModel):
    conversation: List[ConversationItem] = []
    status: str = "in_progress"