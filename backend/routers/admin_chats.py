from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from models.database import get_db
from models.user import User, UserRole
from models.chat import ChatSession, ChatMessage, SessionStatus
from utils.dependencies import get_current_admin_user

router = APIRouter(prefix="/api/admin/chats", tags=["Admin Chats"])

@router.get("/resolved", response_model=List[Dict[str, Any]])
def get_resolved_chats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get all resolved student-agent chats.
    A chat is considered a student-agent chat if agent_id is not null.
    """
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.status == SessionStatus.RESOLVED)
        .filter(ChatSession.agent_id.isnot(None))
        .order_by(ChatSession.resolved_at.desc())
        .all()
    )
    
    result = []
    for s in sessions:
        # Get preview of the first message or latest message
        first_msg = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).order_by(ChatMessage.timestamp.asc()).first()
        preview = first_msg.content[:100] + "..." if first_msg else "No messages"
        
        result.append({
            "session_id": s.id,
            "student_name": s.student.full_name if s.student else "Guest",
            "agent_name": s.agent.full_name if s.agent else "Unknown Agent",
            "department": s.department,
            "created_at": s.created_at,
            "resolved_at": s.resolved_at,
            "preview": preview
        })
        
    return result

@router.get("/{session_id}", response_model=List[Dict[str, Any]])
def get_chat_details(
    session_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get full message history for a specific resolved session.
    """
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.asc()).all()
    
    return [
        {
            "id": msg.id,
            "sender": msg.sender,
            "content": msg.content,
            "timestamp": msg.timestamp
        }
        for msg in messages
    ]

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    session_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Permanently delete a chat session and all its messages.
    """
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Delete related messages first
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    
    # Delete the session
    db.delete(session)
    db.commit()
    
    return None
