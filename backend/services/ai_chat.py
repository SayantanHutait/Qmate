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
1. For queries related to the institution, courses, policies, or student information, answer ONLY using the provided context below. Do not use outside knowledge.
2. If the user asks an institutional question and the context does not contain enough information, you MUST start your response exactly with "[UNKNOWN]" and then state clearly that you don't have verified information about this topic yet (translated into the user's language).
3. You MAY answer general conversational queries (e.g., greetings, asking about your language capabilities or identity) normally without using the context or the "[UNKNOWN]" prefix.
4. Be concise, warm, and student-friendly.
5. Do NOT explicitly mention the sources of your information (e.g., avoid sayings like "According to...", just state the answer naturally and directly).
6. Never guess or fabricate facts about the institution.
7. You can suggest the student speak to a human agent if the query seems complex or sensitive.
8. CRITICAL: You MUST detect the exact language the user is using (including Hinglish, English, Hindi, etc.) and reply in that EXACT same language and script. If the user writes in Hinglish (Hindi written in English alphabet), you MUST reply in Hinglish. Never reply in pure English if the user asks in Hinglish.

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

    async def chat(self, request: ChatRequest, university_id: str) -> ChatResponse:

        logger.info(
            f"Chat | session={request.session_id} | uid={university_id} | "
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

        # 3. Build context
        context = self._build_context(relevant_chunks)
        
        # 3.5 Inject Personalized Documents directly into context
        from models.database import SessionLocal
        from models.user import StudentDocument
        try:
            db = SessionLocal()
            user_docs = db.query(StudentDocument).filter_by(university_id=university_id.upper()).all()
            db.close()
            if user_docs:
                context += "\n\n*** URGENT SYSTEM OVERRIDE: PERSONALIZED DOCUMENTS AVAILABLE ***\n"
                for d in user_docs:
                    context += f"The user requesting chat has their official '{d.doc_type}' available. If they ask for this document (e.g. asking for their {d.doc_type}), you MUST give them exactly this link to download it: [Download {d.doc_type.title()}](http://localhost:8000/student-files/{d.filename})\n"
        except Exception as e:
            logger.error(f"Failed to inject student docs: {e}")

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
        is_unknown = answer.startswith("[UNKNOWN]")
        if is_unknown:
            answer = answer.replace("[UNKNOWN]", "").strip()
        
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