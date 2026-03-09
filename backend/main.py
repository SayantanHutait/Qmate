"""
Student Support System — FastAPI Backend
=========================================
Main entry point. Registers all routers, middleware, and startup events.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth, chat, knowledge
from models.database import engine, Base
from models import user, chat as chat_models

# Create all tables (in production use Alembic migrations)
Base.metadata.create_all(bind=engine)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  Student Support System — Backend Starting")
    logger.info("=" * 60)
    logger.info(f"  Environment : {settings.app_env}")
    logger.info(f"  AI Model    : {settings.gemini_model}")
    logger.info(f"  Embed Model : {settings.gemini_embedding_model}")
    logger.info(f"  ChromaDB    : {settings.chroma_persist_dir}")
    logger.info(f"  CORS        : {settings.cors_origins}")
    logger.info("=" * 60)

    from services.vector_db import vector_db
    stats = vector_db.get_stats()

    logger.info(f"  Knowledge Base: {stats['total_chunks']} chunks loaded")
    logger.info("  Ready ✓")

    yield

    logger.info("Backend shutting down...")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Student Support System API",
    description=(
        "Hybrid AI–Human student support with RAG-based AI, "
        "self-improving knowledge base, and fair queue-based human escalation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(knowledge.router)
from routers import queue, ws_chat
app.include_router(queue.router)
app.include_router(ws_chat.router)

# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Student Support System",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/chat/health",
    }

from services.vector_db import vector_db


from services.vector_db import vector_db


@app.delete("/admin/delete-doc-type")
async def delete_doc_type(doc_type: str):

    try:
        vector_db.collection.delete(
            where={"doc_type": doc_type}
        )

        return {
            "status": "success",
            "message": f"Deleted all documents with type: {doc_type}"
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}