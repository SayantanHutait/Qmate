import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPendingQueue, acceptChat, resolveChat } from '../api/client';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchQueue = async () => {
    try {
      const data = await getPendingQueue();
      setQueue(data);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  // Initially fetch queue
  useEffect(() => { fetchQueue(); }, []);

  // Set up Agent WebSocket to listen to queue updates and route chat messages
  useEffect(() => {
    if (user?.id) {
      ws.current = new WebSocket(`ws://localhost:8000/api/ws/agent/${user.id}`);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "QUEUE_UPDATE") {
          fetchQueue();
        } else if (data.type === "NEW_MESSAGE") {
           // We only show messages if we are currently looking at that session
           setMessages(prev => [...prev, {
             id: Date.now().toString(),
             role: data.sender === "agent" ? "assistant" : "user",
             content: data.content,
           }]);
        }
      };
      
      return () => ws.current?.close();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAccept = async (sessionId) => {
    try {
      await acceptChat({ session_id: sessionId });
      setActiveSessionId(sessionId);
      setMessages([{
        id: 'sys',
        role: 'assistant',
        content: 'You have joined the chat. The student has been notified.'
      }]);
      fetchQueue();
    } catch (err) {
      alert("Could not accept test. Ensure no one else took it.");
    }
  };

  const handleResolve = async () => {
    if (!activeSessionId) return;
    try {
      await resolveChat({ session_id: activeSessionId });
      setActiveSessionId(null);
      setMessages([]);
    } catch (err) {
      alert("Failed to resolve chat.");
    }
  };

  const handleSendMessage = (text) => {
    if (!text.trim() || !activeSessionId || !ws.current) return;
    
    // Optimistic UI append
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: text
    }]);

    // Send through WebSocket
    ws.current.send(JSON.stringify({
      session_id: activeSessionId,
      content: text
    }));
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>👨‍💼 Agent Dashboard</h2>
        <div>
          <span>{user?.email} ({user?.role}) </span>
          <button onClick={handleLogout} style={styles.btn}>Logout</button>
        </div>
      </div>
      <div style={styles.content}>
        
        {/* Left Side: The Queue View */}
        <div style={styles.queueCard}>
          <h3>Active Support Queue ({queue.length})</h3>
          {queue.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No pending support tickets. Sit tight!</p>
          ) : (
            <ul style={styles.queueList}>
              {queue.map(ticket => (
                <li key={ticket.session_id} style={styles.ticket}>
                  <div>
                    <strong>{ticket.department}</strong> issue<br/>
                    <small>ID: {ticket.session_id.substring(0, 8)}...</small>
                  </div>
                  <button style={styles.acceptBtn} onClick={() => handleAccept(ticket.session_id)}>
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side: The Chat View */}
        <div style={styles.chatCard}>
          {activeSessionId ? (
            <>
              <div style={styles.chatHeader}>
                <h3>Chatting with Student (ID: {activeSessionId.substring(0,8)}...)</h3>
                <button onClick={handleResolve} style={styles.resolveBtn}>
                  ✅ Mark Resolved
                </button>
              </div>
              
              <div style={styles.messagesArea}>
                {messages.map((m, i) => (
                   <MessageBubble key={i} message={m} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: 20 }}>
                <ChatInput onSend={handleSendMessage} disabled={false} />
              </div>
            </>
          ) : (
             <div style={styles.emptyChat}>
               <h3 style={{ color: '#94a3b8' }}>Select a ticket from the queue to start chatting</h3>
             </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

const styles = {
  wrapper: { height: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 },
  btn: { padding: '8px 16px', marginLeft: 20, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  content: { padding: 40, flex: 1, display: 'flex', gap: 24, overflow: 'hidden' },
  queueCard: { background: '#1e293b', padding: 30, borderRadius: 10, border: '1px solid #334155', flex: 1, overflowY: 'auto' },
  chatCard: { background: '#1e293b', borderRadius: 10, border: '1px solid #334155', flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  queueList: { listStyle: 'none', padding: 0, margin: 0, marginTop: 16 },
  ticket: { background: '#334155', padding: 16, borderRadius: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  acceptBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  chatHeader: { padding: 20, borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', justifyContent: 'space-between' },
  resolveBtn: { background: '#22c55e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  messagesArea: { flex: 1, padding: 20, overflowY: 'auto', background: '#0f172a' },
  emptyChat: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};
