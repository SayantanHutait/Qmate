"""
AI Chat Service (RAG-based) - Gemini Version
--------------------------------------------

The AI NEVER answers from memory.
Every response is grounded in the Vector Database.
"""

import logging
from typing import List

from google import genai

from config import settings
from models.schemas import (
    ChatMessage, ChatRequest, ChatResponse,
    MessageRole, QuerySource, SourceChunk
)
from services.vector_db import vector_db

logger = logging.getLogger(__name__)

RELEVANCE_THRESHOLD = 0.35

SYSTEM_PROMPT = """You are a helpful, friendly student support assistant for an academic institution.

STRICT RULES — follow these without exception:
1. Answer ONLY using the provided context below. Do not use any outside knowledge.
2. If the context does not contain enough information to answer, say clearly:
"I don't have verified information about this topic yet."
3. Be concise, warm, and student-friendly.
4. Do NOT explicitly mention the sources of your information (e.g., avoid sayings like "According to...", just state the answer naturally and directly).
5. Never guess or fabricate facts about the institution.
6. You can suggest the student speak to a human agent if the query seems complex or sensitive.

CONTEXT FROM KNOWLEDGE BASE:
{context}
"""


class AIChatService:

    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)

    def _build_context(self, chunks: List[SourceChunk]) -> str:
        """Format retrieved chunks into a readable context block."""
        if not chunks:
            return "No relevant information found in the knowledge base."

        parts = []
        for i, chunk in enumerate(chunks, 1):
            parts.append(
                f"[Source {i}: {chunk.source} | Relevance: {chunk.relevance_score:.0%}]\n"
                f"{chunk.content}"
            )

        return "\n\n---\n\n".join(parts)

    def _build_prompt(self, history, current_message, context):

        history_text = ""

        for msg in history[-6:]:
            role = "User" if msg.role.value == "user" else "Assistant"
            history_text += f"{role}: {msg.content}\n"

        prompt = f"""
{SYSTEM_PROMPT.format(context=context)}

Conversation History:
{history_text}

User Question:
{current_message}

Assistant:
"""
        return prompt

    async def chat(self, request: ChatRequest) -> ChatResponse:

        logger.info(
            f"Chat | session={request.session_id} | "
            f"dept={request.department} | msg='{request.message[:80]}...'"
        )

        # 1. Search vector DB
        chunks = vector_db.search(
            query=request.message,
            n_results=5,
            department=request.department,
        )

        # 2. Filter relevant chunks
        relevant_chunks = [c for c in chunks if c.relevance_score >= RELEVANCE_THRESHOLD]

        if not relevant_chunks:
            return ChatResponse(
                session_id=request.session_id,
                answer=(
                    "I don't have verified information about this topic in my knowledge base yet. "
                    "Would you like me to connect you with a human support agent?"
                ),
                sources=[],
                query_source=QuerySource.NOT_FOUND,
                can_escalate=True,
                confidence=0.0,
            )

        # 3. Build context
        context = self._build_context(relevant_chunks)

        # 4. Build Gemini prompt
        prompt = self._build_prompt(
            request.history,
            request.message,
            context
        )

        # 5. Call Gemini asynchronously
        response = await self.client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config={
                "temperature": 0.3,
                "max_output_tokens": 600
            }
        )

        answer = (response.text or "").strip()

        # If the context had hits but the AI couldn't answer from them, 
        # it will output our fallback phrase. We need to trigger escalation.
        is_unknown = "I don't have verified information" in answer
        
        avg_confidence = sum(c.relevance_score for c in relevant_chunks) / len(relevant_chunks) if relevant_chunks else 0.0

        if is_unknown:
            query_source = QuerySource.NOT_FOUND
            confidence = 0.0
        else:
            query_source = QuerySource.AI
            confidence = round(avg_confidence, 2)

        logger.info(
            f"AI answered | confidence={confidence:.2f} | "
            f"chunks_used={len(relevant_chunks)} | unknown={is_unknown}"
        )

        return ChatResponse(
            session_id=request.session_id,
            answer=answer,
            sources=relevant_chunks[:3] if not is_unknown else [],
            query_source=query_source,
            can_escalate=True,
            confidence=confidence,
        )


# Singleton
ai_chat_service = AIChatService()


if __name__ == "__main__":
    import asyncio
    from models.schemas import ChatRequest, ChatMessage, MessageRole

    async def test_chat():

        request = ChatRequest(
            session_id="test-session",
            message="When the midterm will start?",
            department=None,
            history=[
                ChatMessage(
                    role=MessageRole.USER,
                    content="Hello"
                )
            ]
        )

        response = await ai_chat_service.chat(request)

        print("\n--- AI RESPONSE ---")
        print("Answer:", response.answer)
        print("Confidence:", response.confidence)

        print("\nSources:")
        for s in response.sources:
            print(f"- {s.source} ({s.relevance_score})")

    asyncio.run(test_chat())