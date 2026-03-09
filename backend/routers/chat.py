"""
Chat Router
-----------
POST /api/chat          — Student sends a message, AI responds via RAG
GET  /api/chat/health   — Check if AI service is ready
"""

from fastapi import APIRouter, HTTPException
import logging

from models.schemas import ChatRequest, ChatResponse
from services.ai_chat import ai_chat_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    Student message → RAG search → GPT-4o response grounded in knowledge base.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    try:
        return await ai_chat_service.chat(request)
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/health")
async def health():
    """Quick liveness check for the AI chat service."""
    from services.vector_db import vector_db
    stats = vector_db.get_stats()
    return {
        "status": "ok",
        "knowledge_base_chunks": stats["total_chunks"],
        "ai_model": "gpt-4o",
        "embedding_model": "text-embedding-3-small",
    }
