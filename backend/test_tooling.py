import asyncio
from models.schemas import ChatRequest
from services.ai_chat import ai_chat_service

async def run():
    request = ChatRequest(
        session_id="test-session-123",
        message="Give me my bonafide certificate",
        department=None,
        history=[]
    )
    # The user said they uploaded a file. We will use the university_id that is in the DB.
    # We will pass a dummy uid "STU123" for now, or whatever is in the DB.
    response = await ai_chat_service.chat(request, university_id="STU123")
    print("AI Answer:", response.answer)

if __name__ == "__main__":
    asyncio.run(run())
