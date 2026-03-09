from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from models.database import SessionLocal
from services.websocket import manager
from models.chat import ChatMessage, ChatSession, SessionStatus
import json

router = APIRouter(prefix="/api/ws", tags=["WebSockets"])

@router.websocket("/student/{session_id}")
async def websocket_student(websocket: WebSocket, session_id: str):
    await manager.connect_student(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            db = SessionLocal()
            try:
                session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
                if session and session.status == SessionStatus.ACTIVE and session.agent_id:
                    agent_id_str = str(session.agent_id)
                    if agent_id_str in manager.agent_connections:
                        msg = ChatMessage(session_id=session_id, sender="student", content=data.get("content"))
                        db.add(msg)
                        db.commit()
                        
                        await manager.agent_connections[agent_id_str].send_json({
                            "type": "NEW_MESSAGE",
                            "sender": "student",
                            "content": data.get("content"),
                            "session_id": session_id
                        })
            finally:
                db.close()
                pass
    except WebSocketDisconnect:
        manager.disconnect_student(session_id)
    except Exception as e:
        print(f"WS Student Error: {e}")
        manager.disconnect_student(session_id)

@router.websocket("/agent/{agent_id}")
async def websocket_agent(websocket: WebSocket, agent_id: str):
    await manager.connect_agent(agent_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            session_id = data.get("session_id")
            content = data.get("content")
            
            if session_id and content:
                db = SessionLocal()
                try:
                    msg = ChatMessage(session_id=session_id, sender="agent", content=content)
                    db.add(msg)
                    db.commit()
                    
                    await manager.send_to_student(session_id, {
                        "type": "NEW_MESSAGE",
                        "sender": "agent",
                        "content": content
                    })
                finally:
                    db.close()
                    pass
    except WebSocketDisconnect:
        manager.disconnect_agent(agent_id)
    except Exception as e:
        print(f"WS Agent Error: {e}")
        manager.disconnect_agent(agent_id)
