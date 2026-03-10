from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    university_id: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT

class UserResponse(BaseModel):
    id: int
    university_id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

# ── Enums ────────────────────────────────────────────────────────────────────

class DocumentType(str, Enum):
    PDF = "pdf"
    FAQ = "faq"
    RESOLVED_CHAT = "resolved_chat"

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class QuerySource(str, Enum):
    AI = "ai"
    HUMAN = "human"
    NOT_FOUND = "not_found"


# ── Chat Models ───────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    session_id: str
    message: str
    department: Optional[str] = None
    history: List[ChatMessage] = []


class SourceChunk(BaseModel):
    content: str
    source: str
    doc_type: DocumentType
    relevance_score: float


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: List[SourceChunk] = []
    query_source: QuerySource
    can_escalate: bool = True
    confidence: float = 0.0


# ── Knowledge Base Models ─────────────────────────────────────────────────────

class FAQItem(BaseModel):
    question: str
    answer: str
    department: Optional[str] = None
    tags: List[str] = []


class FAQCreateRequest(BaseModel):
    question: str
    answer: str
    department: Optional[str] = None
    tags: List[str] = []
    approved: bool = False


class DocumentUploadResponse(BaseModel):
    filename: str
    doc_type: DocumentType
    chunks_added: int
    message: str


class KnowledgeSearchRequest(BaseModel):
    query: str
    n_results: int = 5
    department: Optional[str] = None
    doc_types: Optional[List[DocumentType]] = None


class KnowledgeSearchResult(BaseModel):
    chunks: List[SourceChunk]
    total_found: int


# ── Stats Models ──────────────────────────────────────────────────────────────

class KnowledgeBaseStats(BaseModel):
    total_chunks: int
    pdf_chunks: int
    faq_chunks: int
    resolved_chat_chunks: int
    collections: List[str]
