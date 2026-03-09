from fastapi import WebSocket
from typing import Dict, List
import logging
import json

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user/session ID to their active WebSocket
        self.student_connections: Dict[str, WebSocket] = {}
        # Maps agent ID to their active WebSocket
        self.agent_connections: Dict[str, WebSocket] = {}

    async def connect_student(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.student_connections[session_id] = websocket
        logger.info(f"Student connected: {session_id}")

    async def connect_agent(self, agent_id: str, websocket: WebSocket):
        await websocket.accept()
        self.agent_connections[agent_id] = websocket
        logger.info(f"Agent connected: {agent_id}")

    def disconnect_student(self, session_id: str):
        if session_id in self.student_connections:
            del self.student_connections[session_id]
            logger.info(f"Student disconnected: {session_id}")

    def disconnect_agent(self, agent_id: str):
        if agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
            logger.info(f"Agent disconnected: {agent_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def send_to_student(self, session_id: str, message: dict):
        if session_id in self.student_connections:
            await self.student_connections[session_id].send_json(message)

    async def broadcast_to_agents(self, message: dict):
        """Used to alert all agents when the queue updates."""
        for connection in self.agent_connections.values():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to agent: {e}")

manager = ConnectionManager()
