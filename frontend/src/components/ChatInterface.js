import React, { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import EscalationBanner from "./EscalationBanner";
import KnowledgePanel from "./KnowledgePanel";

export default function ChatInterface() {
  const { messages, isLoading, department, setDepartment, departments, canEscalate, escalate, isEscalated, isAgentJoined, send, clearChat } = useChat();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showKnowledge, setShowKnowledge] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🎓</div>
          <div>
            <div style={styles.logoTitle}>Student Support</div>
            <div style={styles.logoSub}>AI-Powered Assistant</div>
          </div>
        </div>

        <div style={styles.sideSection}>
          <label style={styles.label}>Department</label>
          <select
            style={styles.select}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={styles.sideSection}>
          <div style={styles.statusRow}>
            <span style={styles.statusDot} />
            <span style={styles.statusText}>AI Active</span>
          </div>
          <div style={styles.statusNote}>
            Answers sourced from verified<br />institute knowledge only
          </div>
        </div>

        <div style={styles.sideSection}>
          {user?.role === 'admin' && (
            <button style={styles.sideBtn} onClick={() => setShowKnowledge(!showKnowledge)}>
              📚 {showKnowledge ? "Hide" : "Manage"} Knowledge Base
            </button>
          )}
          <button style={{ ...styles.sideBtn, marginTop: 8, background: "#374151" }} onClick={clearChat}>
            🗑️ Clear Chat
          </button>
          <button style={{ ...styles.sideBtn, marginTop: 8, background: "#7f1d1d", color: "#fca5a5" }} onClick={() => { logout(); navigate('/'); }}>
            🚪 Logout ({user?.email})
          </button>
        </div>

        <div style={styles.agentHours}>
          <div style={styles.agentHoursTitle}>🕐 Human Agents</div>
          <div style={styles.agentHoursText}>Available: Mon–Fri<br />9:00 AM – 5:00 PM</div>
        </div>
      </aside>

      {/* Main Area */}
      <main style={styles.main}>
        {showKnowledge ? (
          <KnowledgePanel onClose={() => setShowKnowledge(false)} />
        ) : (
          <>
            {/* Chat Header */}
            <div style={styles.header}>
              <div>
                <div style={styles.headerTitle}>Student Support Chat</div>
                <div style={styles.headerSub}>{department} Department • AI-powered with human backup</div>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messages}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div style={styles.typingRow}>
                  <div style={styles.typingBubble}>
                    <span style={styles.dot} />
                    <span style={styles.dot} />
                    <span style={styles.dot} />
                  </div>
                </div>
              )}

              {canEscalate && !isEscalated && !isAgentJoined && (
                <EscalationBanner
                  department={department}
                  onEscalate={escalate}
                />
              )}

              {isEscalated && !isAgentJoined && (
                <div style={styles.escalatedMsg}>
                  ✅ Your request has been added to the <strong>{department}</strong> queue.
                  <br />
                  Please hold while we connect you to an agent...
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <ChatInput 
              onSend={send} 
              disabled={isLoading || (isEscalated && !isAgentJoined)}
              customPlaceholder={(isEscalated && !isAgentJoined) ? "Please hold, waiting for a live agent..." : null}
            />
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex", height: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "#0f172a", color: "#f1f5f9",
  },
  sidebar: {
    width: 260, background: "#1e293b", borderRight: "1px solid #334155",
    display: "flex", flexDirection: "column", padding: "24px 16px", gap: 0,
    flexShrink: 0,
  },
  logo: { display: "flex", alignItems: "center", gap: 12, marginBottom: 32 },
  logoIcon: { fontSize: 32 },
  logoTitle: { fontWeight: 700, fontSize: 16, color: "#f1f5f9" },
  logoSub: { fontSize: 11, color: "#94a3b8" },
  sideSection: { marginBottom: 28 },
  label: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 },
  select: {
    width: "100%", padding: "8px 10px", background: "#0f172a", color: "#f1f5f9",
    border: "1px solid #334155", borderRadius: 8, fontSize: 14, cursor: "pointer",
  },
  statusRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e" },
  statusText: { fontSize: 13, fontWeight: 600, color: "#22c55e" },
  statusNote: { fontSize: 11, color: "#64748b", lineHeight: 1.6 },
  sideBtn: {
    width: "100%", padding: "9px 12px", background: "#0f172a", color: "#cbd5e1",
    border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 13,
    textAlign: "left",
  },
  agentHours: { marginTop: "auto", padding: "16px", background: "#0f172a", borderRadius: 10, border: "1px solid #334155" },
  agentHoursTitle: { fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 },
  agentHoursText: { fontSize: 12, color: "#64748b", lineHeight: 1.7 },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  header: {
    padding: "18px 24px", borderBottom: "1px solid #334155", background: "#1e293b",
    display: "flex", alignItems: "center",
  },
  headerTitle: { fontWeight: 700, fontSize: 18 },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  messages: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 },
  typingRow: { display: "flex" },
  typingBubble: {
    background: "#1e293b", border: "1px solid #334155", borderRadius: "18px 18px 18px 4px",
    padding: "14px 18px", display: "flex", gap: 5, alignItems: "center",
  },
  dot: {
    display: "inline-block", width: 7, height: 7, borderRadius: "50%",
    background: "#64748b", animation: "bounce 1.2s infinite",
  },
  escalatedMsg: {
    background: "#14532d", border: "1px solid #22c55e", borderRadius: 12,
    padding: "14px 18px", fontSize: 14, color: "#86efac", lineHeight: 1.6,
  },
};
