import React from "react";

export default function EscalationBanner({ department, onEscalate }) {
  return (
    <div style={styles.banner}>
      <div style={styles.icon}>🧑‍💼</div>
      <div style={styles.content}>
        <div style={styles.title}>Would you like to speak with a human agent?</div>
        <div style={styles.sub}>
          I couldn't find a verified answer for your question. A <strong>{department}</strong> support
          agent can help you directly. They're available Mon–Fri, 9 AM – 5 PM.
        </div>
        <button style={styles.btn} onClick={onEscalate}>
          Connect me with a human agent →
        </button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    background: "#1c1917", border: "1px solid #78350f", borderRadius: 12,
    padding: "16px", display: "flex", gap: 14, alignItems: "flex-start",
  },
  icon: { fontSize: 24, flexShrink: 0, marginTop: 2 },
  content: { flex: 1 },
  title: { fontWeight: 600, fontSize: 14, color: "#fbbf24", marginBottom: 6 },
  sub: { fontSize: 13, color: "#a16207", lineHeight: 1.6, marginBottom: 12 },
  btn: {
    background: "#92400e", color: "#fef3c7", border: "none", borderRadius: 8,
    padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
  },
};
