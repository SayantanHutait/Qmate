"""
Knowledge Base Router
---------------------
POST /api/knowledge/upload-pdf          — Upload & ingest a PDF into vector DB
POST /api/knowledge/faq                 — Add an approved FAQ (self-improvement)
POST /api/knowledge/resolved-chat       — Convert resolved chat into knowledge
POST /api/knowledge/search              — Semantic search (admin/debug)
GET  /api/knowledge/stats               — Knowledge base statistics
"""

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from models.schemas import (
    FAQCreateRequest, DocumentUploadResponse,
    KnowledgeSearchRequest, KnowledgeSearchResult, KnowledgeBaseStats,
    DocumentType,
)
from services.vector_db import vector_db
from utils.pdf_utils import extract_text_from_pdf, clean_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base"])


@router.post("/upload-pdf", response_model=DocumentUploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    department: Optional[str] = Form(None),
):
    """
    Upload a PDF (e.g., academic calendar, exam guidelines, policies).
    Text is extracted, chunked, embedded, and stored in ChromaDB immediately.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    if file.size and file.size > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 20 MB.")

    try:
        pdf_bytes = await file.read()
        raw_text = extract_text_from_pdf(pdf_bytes)
        clean = clean_text(raw_text)

        if len(clean) < 50:
            raise HTTPException(
                status_code=422,
                detail="PDF appears to be empty or contains no extractable text (it may be a scanned image PDF)."
            )

        chunks_added = vector_db.add_pdf_text(clean, filename=file.filename, department=department)

        logger.info(f"PDF uploaded | file='{file.filename}' | chunks={chunks_added}")
        return DocumentUploadResponse(
            filename=file.filename,
            doc_type=DocumentType.PDF,
            chunks_added=chunks_added,
            message=f"Successfully ingested '{file.filename}' — {chunks_added} knowledge chunks added to the AI.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faq")
async def add_faq(faq: FAQCreateRequest):
    """
    Add a verified FAQ pair to the knowledge base.
    This is the self-improvement loop: human-approved Q&A immediately improves the AI.
    In production, set approved=True only after admin review.
    """
    if not faq.question.strip() or not faq.answer.strip():
        raise HTTPException(status_code=400, detail="Question and answer cannot be empty.")

    chunks_added = vector_db.add_faq(
        question=faq.question,
        answer=faq.answer,
        department=faq.department,
    )
    return {
        "success": True,
        "chunks_added": chunks_added,
        "message": f"FAQ added to knowledge base. AI will now use this information immediately.",
    }


@router.post("/resolved-chat")
async def add_resolved_chat(
    student_query: str = Form(...),
    agent_resolution: str = Form(...),
    department: Optional[str] = Form(None),
):
    """
    Convert a resolved human agent chat into AI knowledge (self-improvement loop).
    Agent marks a chat as resolved → system extracts the Q&A → stored in vector DB.
    """
    if not student_query.strip() or not agent_resolution.strip():
        raise HTTPException(status_code=400, detail="Query and resolution cannot be empty.")

    chunks_added = vector_db.add_resolved_chat(
        student_query=student_query,
        agent_resolution=agent_resolution,
        department=department,
    )
    return {
        "success": True,
        "chunks_added": chunks_added,
        "message": "Resolved chat stored. AI knowledge base updated — no retraining needed.",
    }


@router.post("/search", response_model=KnowledgeSearchResult)
async def search_knowledge(request: KnowledgeSearchRequest):
    """
    Semantic search over the knowledge base.
    Useful for admins to inspect what the AI will find for a given query.
    """
    chunks = vector_db.search(
        query=request.query,
        n_results=request.n_results,
        department=request.department,
        doc_types=request.doc_types,
    )
    return KnowledgeSearchResult(chunks=chunks, total_found=len(chunks))


@router.get("/stats", response_model=KnowledgeBaseStats)
async def get_stats():
    """Return knowledge base statistics."""
    stats = vector_db.get_stats()
    return KnowledgeBaseStats(
        total_chunks=stats["total_chunks"],
        pdf_chunks=stats["pdf_chunks"],
        faq_chunks=stats["faq_chunks"],
        resolved_chat_chunks=stats["resolved_chat_chunks"],
        collections=[vector_db.collection.name],
    )

@router.get("/sources")
async def get_knowledge_sources():
    """Return all distinct document sources in the knowledge base."""
    sources = vector_db.get_all_sources()
    return sources

@router.delete("/sources/{source}")
async def delete_knowledge_source(source: str):
    """Delete a specific document or FAQ from the knowledge base."""
    deleted_count = vector_db.delete_by_source(source)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Source not found or no chunks deleted.")
        
    return {"message": f"Successfully deleted source '{source}'. Removed {deleted_count} chunks."}
