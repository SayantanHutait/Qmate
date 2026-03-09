"""
Vector Database Service
-----------------------
Handles:
- Storing embeddings for PDFs, FAQs, resolved chats
- Semantic similarity search
"""

import uuid
import logging
from typing import Optional, List
from datetime import datetime

import numpy as np
import chromadb
from chromadb.config import Settings as ChromaSettings
from google import genai

from config import settings
from models.schemas import DocumentType, SourceChunk

logger = logging.getLogger(__name__)


class VectorDBService:

    def __init__(self):

        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        self.collection = self.client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )

        self.genai_client = genai.Client(api_key=settings.gemini_api_key)

        logger.info(
            f"VectorDB initialised | collection='{settings.chroma_collection_name}' "
            f"| existing chunks={self.collection.count()}"
        )

    # ───────────────── EMBEDDINGS ─────────────────

    def _embed(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings using Gemini"""

        embeddings = []

        for text in texts:
            response = self.genai_client.models.embed_content(
                model=settings.gemini_embedding_model,
                contents=text
            )
            if response and response.embeddings:
                embeddings.append(response.embeddings[0].values)
            else:
                logger.warning(f"Failed to generate embedding for text: {text[:50]}...")

        return embeddings

    # ───────────────── CHUNKING ─────────────────

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:

        words = text.split()

        chunks = []
        i = 0

        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap

        return [c for c in chunks if c.strip()]

    # ───────────────── ADD PDF ─────────────────

    def add_pdf_text(self, text: str, filename: str, department: Optional[str] = None) -> int:

        chunks = self._chunk_text(text)

        if not chunks:
            return 0

        embeddings = self._embed(chunks)

        ids = [str(uuid.uuid4()) for _ in chunks]

        metadatas = [
            {
                "source": filename,
                "doc_type": DocumentType.PDF.value,
                "chunk_index": idx,
                "department": department or "General",
                "added_at": datetime.utcnow().isoformat(),
            }
            for idx, _ in enumerate(chunks)
        ]

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )

        logger.info(f"PDF '{filename}' → {len(chunks)} chunks added")

        return len(chunks)

    # ───────────────── ADD FAQ ─────────────────

    def add_faq(self, question: str, answer: str, department: Optional[str] = None) -> int:

        text = f"Question: {question}\nAnswer: {answer}"

        embedding = self._embed([text])[0]

        doc_id = str(uuid.uuid4())

        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[
                {
                    "source": f"FAQ | {department or 'General'}",
                    "doc_type": DocumentType.FAQ.value,
                    "department": department or "General",
                    "question": question,
                    "added_at": datetime.utcnow().isoformat(),
                }
            ],
        )

        logger.info(f"FAQ added | department={department}")

        return 1

    # ───────────────── ADD RESOLVED CHAT ─────────────────

    def add_resolved_chat(
        self,
        student_query: str,
        agent_resolution: str,
        department: Optional[str] = None,
    ) -> int:

        text = f"Student Query: {student_query}\nResolution: {agent_resolution}"

        embedding = self._embed([text])[0]

        doc_id = str(uuid.uuid4())

        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[
                {
                    "source": f"Resolved Chat | {department or 'General'}",
                    "doc_type": DocumentType.RESOLVED_CHAT.value,
                    "department": department or "General",
                    "added_at": datetime.utcnow().isoformat(),
                }
            ],
        )

        logger.info("Resolved chat added to knowledge base")

        return 1

    # ───────────────── SEARCH ─────────────────

    def search(
        self,
        query: str,
        n_results: int = 5,
        department: Optional[str] = None,
        doc_types: Optional[List[DocumentType]] = None,
    ) -> List[SourceChunk]:

        if self.collection.count() == 0:
            return []

        query_embedding = self._embed([query])[0]

        where_filter = {}

        if doc_types:
            where_filter["doc_type"] = {"$in": [dt.value for dt in doc_types]}

        if department:
            where_filter["department"] = {"$in": [department, "General"]}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, self.collection.count()),
            include=["documents", "metadatas", "distances"],
            where=where_filter if where_filter else None,
        )

        chunks = []

        if not results["documents"] or not results["documents"][0]:
            return chunks

        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):

            score = round(1 - dist, 4)

            chunks.append(
                SourceChunk(
                    content=doc,
                    source=str(meta.get("source", "Unknown")),
                    doc_type=DocumentType(meta.get("doc_type", DocumentType.FAQ)),
                    relevance_score=score,
                )
            )

        chunks.sort(key=lambda c: c.relevance_score, reverse=True)

        return chunks

    # ───────────────── STATS ─────────────────

    def get_stats(self) -> dict:

        total = self.collection.count()

        if total == 0:
            return {
                "total_chunks": 0,
                "pdf_chunks": 0,
                "faq_chunks": 0,
                "resolved_chat_chunks": 0,
            }

        def _count(doc_type: str):

            try:
                results = self.collection.get(where={"doc_type": doc_type})
                return len(results["ids"])

            except Exception:
                return 0

        return {
            "total_chunks": total,
            "pdf_chunks": _count(DocumentType.PDF),
            "faq_chunks": _count(DocumentType.FAQ),
            "resolved_chat_chunks": _count(DocumentType.RESOLVED_CHAT),
        }


# Singleton
vector_db = VectorDBService()
