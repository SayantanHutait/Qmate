import React, { useState } from "react";

export default function ChatInput({ onSend, disabled, customPlaceholder }) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.inner}>
        <textarea
          style={styles.input}
          placeholder={customPlaceholder || (disabled ? "Chat ended — start a new chat to continue" : "Ask me anything about your studies, deadlines, fees, or campus services…")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled}
          rows={1}
        />
        <button
          style={{ ...styles.btn, opacity: (!value.trim() || disabled) ? 0.4 : 1 }}
          onClick={submit}
          disabled={!value.trim() || disabled}
        >
          ➤
        </button>
      </div>
      <div style={styles.hint}>Press Enter to send • Shift+Enter for new line</div>
    </div>
  );
}

const styles = {
  wrapper: { padding: "16px 24px 20px", borderTop: "1px solid #334155", background: "#0f172a" },
  inner: { display: "flex", gap: 10, alignItems: "flex-end" },
  input: {
    flex: 1, background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155",
    borderRadius: 12, padding: "12px 16px", fontSize: 14, resize: "none",
    fontFamily: "inherit", lineHeight: 1.5, outline: "none",
    minHeight: 48, maxHeight: 120,
  },
  btn: {
    width: 48, height: 48, borderRadius: 12, background: "#2563eb",
    color: "#fff", border: "none", fontSize: 18, cursor: "pointer",
    flexShrink: 0, transition: "opacity 0.2s",
  },
  hint: { fontSize: 11, color: "#334155", marginTop: 6 },
};
