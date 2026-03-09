import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendMessage, escalateChat } from "../api/client";

const DEPARTMENTS = ["General", "Admissions", "Finance", "Academics", "IT Support", "Library"];

export function useChat() {
  const [sessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([
    {
      id: uuidv4(),
      role: "assistant",
      content:
        "👋 Hi! I'm your student support assistant. I only use verified institute information to answer your questions — so you can trust what I tell you.\n\nWhat can I help you with today?",
      timestamp: new Date().toISOString(),
      querySource: "ai",
      sources: [],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [department, setDepartment] = useState("General");
  const [canEscalate, setCanEscalate] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isAgentJoined, setIsAgentJoined] = useState(false);
  const [error, setError] = useState(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const ws = useRef(null);

  // Initialize WebSocket when escalated
  useEffect(() => {
    if (isEscalated && !ws.current) {
      ws.current = new WebSocket(`ws://localhost:8000/api/ws/student/${sessionId}`);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "AGENT_JOINED") {
          setIsAgentJoined(true);
          setMessages((prev) => [...prev, {
            id: uuidv4(),
            role: "assistant",
            content: `🧑‍💼 **${data.agent_name}** has joined the chat! They are ready to assist you.`,
            timestamp: new Date().toISOString(),
            querySource: "human",
            sources: []
          }]);
        } else if (data.type === "NEW_MESSAGE") {
          setMessages((prev) => [...prev, {
            id: uuidv4(),
            role: data.sender === "agent" ? "assistant" : "user",
            content: data.content,
            timestamp: new Date().toISOString(),
            querySource: "human",
            sources: []
          }]);
        } else if (data.type === "CHAT_RESOLVED") {
           setMessages((prev) => [...prev, {
            id: uuidv4(),
            role: "assistant",
            content: `✅ ${data.message}`,
            timestamp: new Date().toISOString(),
            querySource: "human",
            sources: []
          }]);
          setIsEscalated(false);
          setIsAgentJoined(false);
        }
      };

      return () => {
        if (ws.current) ws.current.close();
      };
    }
  }, [isEscalated, sessionId]);

  const escalate = useCallback(async () => {
    try {
      await escalateChat({ session_id: sessionId, department });
      setIsEscalated(true);
      setCanEscalate(false);
    } catch (err) {
      console.error(err);
      setError("Failed to escalate. Please try again later.");
    }
  }, [sessionId, department]);

  const send = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      const userMsg = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        if (isEscalated && isAgentJoined && ws.current) {
          // Send over WebSocket instead of RAG API
          ws.current.send(JSON.stringify({ 
             type: "NEW_MESSAGE", 
             content: text.trim() 
          }));
          setIsLoading(false); // Immediate since it's just WS send, the echo comes back natively
          return;
        }

        // Otherwise use normal RAG API
        const history = messagesRef.current
          .filter((m) => m.role !== "system" && m.querySource !== "human")
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendMessage({
          session_id: sessionId,
          message: text.trim(),
          department,
          history,
        });

        const assistantMsg = {
          id: uuidv4(),
          role: "assistant",
          content: response.answer,
          timestamp: new Date().toISOString(),
          querySource: response.query_source,
          sources: response.sources || [],
          confidence: response.confidence,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setCanEscalate(
          response.query_source === "not_found" || response.confidence < 0.5
        );
      } catch (err) {
        const errMsg =
          err?.response?.data?.detail ||
          "Sorry, I'm having trouble connecting right now. Please try again.";
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: `⚠️ ${errMsg}`,
            timestamp: new Date().toISOString(),
            querySource: "error",
            sources: [],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, department, isLoading, isEscalated, isAgentJoined]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content:
          "Chat cleared! I'm ready to help you with a new question. What would you like to know?",
        timestamp: new Date().toISOString(),
        querySource: "ai",
        sources: [],
      },
    ]);
    setCanEscalate(false);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    department,
    setDepartment,
    departments: DEPARTMENTS,
    canEscalate,
    isEscalated,
    isAgentJoined,
    error,
    send,
    escalate,
    clearChat,
    sessionId,
  };
}
