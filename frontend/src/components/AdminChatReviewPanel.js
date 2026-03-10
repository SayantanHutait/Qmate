import React, { useState, useEffect } from 'react';
import { getResolvedChats, getChatDetails, deleteChatSession } from '../api/client';

export default function AdminChatReviewPanel() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Detail view state
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getResolvedChats();
      setChats(data);
    } catch (err) {
      console.error("Failed to fetch resolved chats", err);
      setError('Failed to fetch chat sessions. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (sessionId) => {
    setSelectedChatId(sessionId);
    setDetailLoading(true);
    try {
      const data = await getChatDetails(sessionId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch chat details", err);
      alert("Failed to load chat transcript");
      setSelectedChatId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseChat = () => {
    setSelectedChatId(null);
    setMessages([]);
  };

  const handleDeleteChat = async (sessionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this conversation? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteChatSession(sessionId);
      if (selectedChatId === sessionId) {
        handleCloseChat();
      }
      fetchChats(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete chat", err);
      alert(err.response?.data?.detail || 'Failed to delete chat.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // ── Render Detail View ───────────────────────────────────────────────────
  if (selectedChatId) {
    const chatInfo = chats.find(c => c.session_id === selectedChatId);
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3>📄 Conversation Transcript</h3>
          <button onClick={handleCloseChat} style={styles.backBtn}>← Back to List</button>
        </div>
        
        <div style={styles.transcriptMeta}>
          <p><strong>Session ID:</strong> {selectedChatId}</p>
          <p><strong>Student:</strong> {chatInfo?.student_name} | <strong>Agent:</strong> {chatInfo?.agent_name}</p>
          <p><strong>Resolved At:</strong> {formatDate(chatInfo?.resolved_at)}</p>
        </div>

        <div style={styles.messagesContainer}>
          {detailLoading ? (
            <p>Loading transcript...</p>
          ) : messages.length === 0 ? (
            <p>No messages found in this session.</p>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'student';
              const isSystem = msg.sender === 'system';
              return (
                <div key={msg.id} style={{
                  ...styles.messageBox,
                  alignSelf: isSystem ? 'center' : (isUser ? 'flex-end' : 'flex-start'),
                  backgroundColor: isSystem ? '#334155' : (isUser ? '#3b82f6' : '#1e293b'),
                  border: isSystem ? 'none' : '1px solid #475569'
                }}>
                  <div style={styles.messageHeader}>
                    <strong>{msg.sender.toUpperCase()}</strong>
                    <span style={styles.messageTime}>{formatDate(msg.timestamp)}</span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              )
            })
          )}
        </div>

        <div style={styles.actionsFooter}>
          <button onClick={handleCloseChat} style={styles.keepBtn}>Keep Conversation (Close)</button>
          <button onClick={() => handleDeleteChat(selectedChatId)} style={styles.deletePermBtn}>Delete Permanently</button>
        </div>
      </div>
    );
  }

  // ── Render List View ─────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>✅ Resolved Human Chats</h3>
        <button onClick={fetchChats} style={styles.refreshBtn}>Refresh</button>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.errorBanner}>{error}</div>}
        
        {loading ? (
          <p>Loading resolved chats...</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date Resolved</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>Preview</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chats.map(c => (
                  <tr key={c.session_id}>
                    <td style={styles.td}>{formatDate(c.resolved_at)}</td>
                    <td style={styles.td}>{c.student_name}</td>
                    <td style={styles.td}>{c.agent_name}</td>
                    <td style={{...styles.td, fontStyle: 'italic', color: '#cbd5e1', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {c.preview}
                    </td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => handleOpenChat(c.session_id)}
                        style={styles.openBtn}
                      >
                        Read
                      </button>
                      <button 
                        onClick={() => handleDeleteChat(c.session_id)}
                        style={styles.deleteBtn}
                        title="Delete Permanently"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {chats.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{...styles.td, textAlign: 'center'}}>No resolved human chats found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: 20,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    borderRadius: 8,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #334155',
    paddingBottom: 10,
  },
  refreshBtn: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '6px 12px',
    backgroundColor: '#475569',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0, 
  },
  tableContainer: {
    overflowY: 'auto',
    flex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse', // prevents gaps
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #334155',
    color: '#94a3b8',
    position: 'sticky',
    top: 0,
    backgroundColor: '#1e293b',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #334155',
  },
  openBtn: {
    padding: '4px 8px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    marginRight: 8,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    opacity: 0.7,
  },
  errorBanner: {
    backgroundColor: '#ef444433',
    color: '#ef4444',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  // Details view styles
  transcriptMeta: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: '0.9rem',
    color: '#94a3b8'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '16px 0',
    backgroundColor: '#0f172a',
    borderRadius: 6,
    border: '1px solid #334155',
    padding: 16,
  },
  messageBox: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    opacity: 0.7,
    marginBottom: 4,
    gap: 16
  },
  messageTime: {
    fontWeight: 'normal',
  },
  actionsFooter: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    borderTop: '1px solid #334155',
    paddingTop: 16,
  },
  keepBtn: {
    padding: '8px 16px',
    backgroundColor: '#475569',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  deletePermBtn: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 'bold',
  }
};
