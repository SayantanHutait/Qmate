from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from models.database import get_db
from models.chat import ChatSession, SessionStatus
from models.user import User, UserRole
from utils.dependencies import get_current_active_user, get_current_agent_or_admin
from services.websocket import manager

router = APIRouter(prefix="/api/queue", tags=["Chat Queue"])

@router.post("/escalate/{session_id}")
async def escalate_chat(session_id: str, department: str = None, db: Session = Depends(get_db)):
    """Student clicks 'Escalate to Human' -> Marks session as PENDING in DB"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        session = ChatSession(id=session_id, department=department, status=SessionStatus.PENDING)
        db.add(session)
    else:
        session.status = SessionStatus.PENDING
        
    db.commit()
    db.refresh(session)
    
    # Alert all logged-in agents
    await manager.broadcast_to_agents({
        "type": "QUEUE_UPDATE",
        "session_id": session_id,
        "department": department
    })
    
    return {"message": "Escalation requested", "session_id": session.id}

@router.get("/pending")
def get_pending_queue(db: Session = Depends(get_db), current_user: User = Depends(get_current_agent_or_admin)):
    """Agents call this to see the active live queue"""
    sessions = db.query(ChatSession).filter(ChatSession.status == SessionStatus.PENDING).all()
    return [{ "session_id": s.id, "department": s.department, "created_at": s.created_at } for s in sessions]

@router.post("/accept/{session_id}")
async def accept_chat(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_agent_or_admin)):
    """Agent accepts a ticket -> Moves to ACTIVE"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session or session.status != SessionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Session not available")
        
    session.status = SessionStatus.ACTIVE
    session.agent_id = current_user.id
    db.commit()
    
    # Tell the student their agent has joined!
    await manager.send_to_student(session_id, {
        "type": "AGENT_JOINED",
        "agent_name": current_user.full_name or "Support Agent",
        "message": "A human agent has joined the chat."
    })
    
    # Update queue view for other agents
    await manager.broadcast_to_agents({"type": "QUEUE_UPDATE"})
    return {"message": "Chat accepted"}

@router.post("/resolve/{session_id}")
async def resolve_chat(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_agent_or_admin)):
    """Agent resolves the ticket"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = SessionStatus.RESOLVED
    session.resolved_at = datetime.utcnow()
    db.commit()
    
    await manager.send_to_student(session_id, {
        "type": "CHAT_RESOLVED",
        "message": "The agent has resolved and closed this chat. Thank you!"
    })
    
    # In a full production app, you might auto-trigger the self-improvement loop here
    # by fetching the message history and sending it to ChromaDB.
    
    return {"message": "Chat resolved"}
