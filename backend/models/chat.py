from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class SessionStatus(str, enum.Enum):
    AI_ONLY = "ai_only"
    PENDING = "pending"
    ACTIVE = "active"
    RESOLVED = "resolved"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True) # UUID string from frontend
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional if guest
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department = Column(String, nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.AI_ONLY, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    agent = relationship("User", foreign_keys=[agent_id])
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    sender = Column(String, nullable=False) # "student", "agent", "ai"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
