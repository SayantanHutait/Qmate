import React, { useState } from "react";

const SOURCE_COLORS = {
  pdf: { bg: "#1e3a5f", border: "#3b82f6", label: "📄 PDF" },
  faq: { bg: "#14532d", border: "#22c55e", label: "✅ FAQ" },
  resolved_chat: { bg: "#3b0764", border: "#a855f7", label: "💬 Resolved Chat" },
};

const BADGE_COLORS = {
  ai: { bg: "#1e3a5f", color: "#93c5fd", label: "🤖 AI" },
  not_found: { bg: "#3b1f1f", color: "#fca5a5", label: "❓ Not Found" },
  human: { bg: "#14532d", color: "#86efac", label: "👤 Human" },
  error: { bg: "#3b1f1f", color: "#fca5a5", label: "⚠️ Error" },
};

export default function MessageBubble({ message }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  const badge = BADGE_COLORS[message.querySource];
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble) }}>
        {/* Message text */}
        <div style={styles.text}>{message.content}</div>

        {/* Footer row */}
        {!isUser && (
          <div style={styles.footer}>
            <span style={styles.time}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {badge && (
              <span style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            )}
            {message.confidence !== undefined && message.confidence > 0 && (
              <span style={styles.confidence}>
                {Math.round(message.confidence * 100)}% match
              </span>
            )}
            {hasSources && (
              <button style={styles.sourcesBtn} onClick={() => setShowSources(!showSources)}>
                {showSources ? "Hide" : "View"} sources ({message.sources.length})
              </button>
            )}
          </div>
        )}

        {isUser && (
          <div style={{ ...styles.footer, justifyContent: "flex-end" }}>
            <span style={styles.time}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>

      {/* Sources panel */}
      {showSources && hasSources && (
        <div style={styles.sourcesPanel}>
          <div style={styles.sourcesTitle}>Sources used by AI:</div>
          {message.sources.map((src, i) => {
            const color = SOURCE_COLORS[src.doc_type] || SOURCE_COLORS.faq;
            return (
              <div key={i} style={{ ...styles.sourceCard, background: color.bg, borderColor: color.border }}>
                <div style={styles.sourceHeader}>
                  <span style={{ color: color.border }}>{color.label}</span>
                  <span style={styles.sourceScore}>{Math.round(src.relevance_score * 100)}% relevant</span>
                </div>
                <div style={styles.sourceFrom}>{src.source}</div>
                <div style={styles.sourceContent}>{src.content.slice(0, 220)}...</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  bubble: {
    maxWidth: "70%", borderRadius: 16, padding: "12px 16px",
    lineHeight: 1.6, fontSize: 14,
  },
  userBubble: {
    background: "#2563eb", color: "#fff",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    background: "#1e293b", color: "#e2e8f0",
    border: "1px solid #334155", borderBottomLeftRadius: 4,
  },
  text: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  footer: { display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  time: { fontSize: 11, color: "#64748b" },
  badge: { fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600 },
  confidence: { fontSize: 10, color: "#64748b" },
  sourcesBtn: {
    background: "transparent", border: "1px solid #334155", color: "#94a3b8",
    fontSize: 10, padding: "2px 8px", borderRadius: 8, cursor: "pointer",
  },
  sourcesPanel: {
    maxWidth: "70%", marginTop: 8, display: "flex", flexDirection: "column", gap: 8,
  },
  sourcesTitle: { fontSize: 11, color: "#64748b", marginBottom: 2 },
  sourceCard: {
    border: "1px solid", borderRadius: 10, padding: "10px 12px",
  },
  sourceHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  sourceScore: { fontSize: 11, color: "#94a3b8" },
  sourceFrom: { fontSize: 11, color: "#94a3b8", marginBottom: 6, fontStyle: "italic" },
  sourceContent: { fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 },
};
