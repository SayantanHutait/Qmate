import React, { useState } from "react";

export default function EscalationBanner({ departments, onEscalate }) {
  const [selectedDept, setSelectedDept] = useState("");

  return (
    <div style={styles.banner}>
      <div style={styles.icon}>🧑‍💼</div>
      <div style={styles.content}>
        <div style={styles.title}>Would you like to speak with a human agent?</div>
        <div style={styles.sub}>
          I couldn't find a verified answer for your question. A support agent can help you directly. Please select the relevant department before connecting. 
        </div>
        <div style={{ marginBottom: 16 }}>
          <select 
            style={styles.select} 
            value={selectedDept} 
            onChange={e => setSelectedDept(e.target.value)}
          >
            <option value="" disabled>Select Department</option>
            {departments && departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button 
          style={{ ...styles.btn, opacity: selectedDept ? 1 : 0.5, cursor: selectedDept ? "pointer" : "not-allowed" }} 
          disabled={!selectedDept}
          onClick={() => onEscalate(selectedDept)}
        >
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
  select: {
    padding: "8px 12px", background: "#292524", color: "#fef3c7",
    border: "1px solid #78350f", borderRadius: 6, fontSize: 13, width: "100%", maxWidth: 250,
  },
  btn: {
    background: "#92400e", color: "#fef3c7", border: "none", borderRadius: 8,
    padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
  },
};
