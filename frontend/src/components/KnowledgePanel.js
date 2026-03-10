import React, { useState, useEffect } from "react";
import { uploadPDF, addFAQ, getKnowledgeStats, addResolvedChat, getKnowledgeSources, deleteKnowledgeSource } from "../api/client";

const TABS = ["📄 Upload PDF", "✅ Add FAQ", "💬 Add Resolved Chat", "📊 Stats", "🗑️ Manage Content"];
const DEPARTMENTS = ["General", "Admissions", "Finance", "Academics", "IT Support", "Library"];

export default function KnowledgePanel({ onClose }) {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try { setStats(await getKnowledgeStats()); } catch {}
  };

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 5000);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>📚 Knowledge Base Manager</div>
          <div style={styles.sub}>Add documents, FAQs, and resolved chats to improve the AI</div>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>✕ Back to Chat</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={i} style={{ ...styles.tab, ...(tab === i ? styles.activeTab : {}) }} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {/* Status */}
      {status && (
        <div style={{ ...styles.status, background: status.type === "success" ? "#14532d" : "#3b1f1f", borderColor: status.type === "success" ? "#22c55e" : "#ef4444" }}>
          {status.type === "success" ? "✅" : "❌"} {status.msg}
        </div>
      )}

      <div style={styles.content}>
        {/* Tab 0: Upload PDF */}
        {tab === 0 && (
          <PDFUploadTab loading={loading} setLoading={setLoading} showStatus={showStatus} onSuccess={fetchStats} />
        )}

        {/* Tab 1: Add FAQ */}
        {tab === 1 && (
          <FAQTab loading={loading} setLoading={setLoading} showStatus={showStatus} onSuccess={fetchStats} />
        )}

        {/* Tab 2: Resolved Chat */}
        {tab === 2 && (
          <ResolvedChatTab loading={loading} setLoading={setLoading} showStatus={showStatus} onSuccess={fetchStats} />
        )}

        {/* Tab 3: Stats */}
        {tab === 3 && <StatsTab stats={stats} onRefresh={fetchStats} />}

        {/* Tab 4: Manage Content */}
        {tab === 4 && (
          <ManageContentTab showStatus={showStatus} onSuccess={fetchStats} />
        )}
      </div>
    </div>
  );
}

function PDFUploadTab({ loading, setLoading, showStatus, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dept, setDept] = useState("General");

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await uploadPDF(file, dept);
      showStatus("success", result.message);
      setFile(null);
      onSuccess();
    } catch (e) {
      showStatus("error", e?.response?.data?.detail || "Upload failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.form}>
      <p style={styles.desc}>Upload academic PDFs (handbooks, policies, calendars). Text will be extracted and chunked into the knowledge base immediately.</p>
      <label style={styles.label}>Department</label>
      <select style={styles.select} value={dept} onChange={e => setDept(e.target.value)}>
        {["General","Admissions","Finance","Academics","IT Support","Library"].map(d => <option key={d}>{d}</option>)}
      </select>
      <label style={styles.label}>PDF File</label>
      <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={styles.fileInput} />
      {file && <div style={styles.fileInfo}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</div>}
      <button style={{ ...styles.btn, opacity: (!file || loading) ? 0.5 : 1 }} disabled={!file || loading} onClick={submit}>
        {loading ? "Uploading & Processing..." : "Upload PDF to Knowledge Base"}
      </button>
    </div>
  );
}

function FAQTab({ loading, setLoading, showStatus, onSuccess }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [dept, setDept] = useState("General");

  const submit = async () => {
    if (!q.trim() || !a.trim()) return;
    setLoading(true);
    try {
      const result = await addFAQ({ question: q, answer: a, department: dept });
      showStatus("success", result.message);
      setQ(""); setA("");
      onSuccess();
    } catch (e) {
      showStatus("error", e?.response?.data?.detail || "Failed to add FAQ.");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.form}>
      <p style={styles.desc}>Add a verified Q&A pair. The AI will use this information immediately — no retraining needed. Only add approved, accurate information.</p>
      <label style={styles.label}>Department</label>
      <select style={styles.select} value={dept} onChange={e => setDept(e.target.value)}>
        {["General","Admissions","Finance","Academics","IT Support","Library"].map(d => <option key={d}>{d}</option>)}
      </select>
      <label style={styles.label}>Question</label>
      <input style={styles.input} value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. What is the deadline for fee payment this semester?" />
      <label style={styles.label}>Answer</label>
      <textarea style={{ ...styles.input, minHeight: 100, resize: "vertical" }} value={a} onChange={e => setA(e.target.value)} placeholder="Provide a clear, accurate, complete answer..." />
      <button style={{ ...styles.btn, opacity: (!q.trim() || !a.trim() || loading) ? 0.5 : 1 }} disabled={!q.trim() || !a.trim() || loading} onClick={submit}>
        {loading ? "Adding..." : "Add FAQ to Knowledge Base"}
      </button>
    </div>
  );
}

function ResolvedChatTab({ loading, setLoading, showStatus, onSuccess }) {
  const [query, setQuery] = useState("");
  const [resolution, setResolution] = useState("");
  const [dept, setDept] = useState("General");

  const submit = async () => {
    if (!query.trim() || !resolution.trim()) return;
    setLoading(true);
    try {
      const result = await addResolvedChat({ student_query: query, agent_resolution: resolution, department: dept });
      showStatus("success", result.message);
      setQuery(""); setResolution("");
      onSuccess();
    } catch (e) {
      showStatus("error", e?.response?.data?.detail || "Failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.form}>
      <p style={styles.desc}>Convert a resolved human agent conversation into AI knowledge. This is the self-improvement loop — human expertise directly trains the AI.</p>
      <label style={styles.label}>Department</label>
      <select style={styles.select} value={dept} onChange={e => setDept(e.target.value)}>
        {["General","Admissions","Finance","Academics","IT Support","Library"].map(d => <option key={d}>{d}</option>)}
      </select>
      <label style={styles.label}>Student's Original Query</label>
      <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={query} onChange={e => setQuery(e.target.value)} placeholder="What did the student ask?" />
      <label style={styles.label}>Agent's Resolution</label>
      <textarea style={{ ...styles.input, minHeight: 100, resize: "vertical" }} value={resolution} onChange={e => setResolution(e.target.value)} placeholder="How was the issue resolved? Include any relevant details, links, or steps." />
      <button style={{ ...styles.btn, opacity: (!query.trim() || !resolution.trim() || loading) ? 0.5 : 1 }} disabled={!query.trim() || !resolution.trim() || loading} onClick={submit}>
        {loading ? "Adding..." : "Add to Knowledge Base"}
      </button>
    </div>
  );
}

function StatsTab({ stats, onRefresh }) {
  if (!stats) return <div style={styles.desc}>Loading stats...</div>;
  const items = [
    { label: "Total Knowledge Chunks", value: stats.total_chunks, color: "#60a5fa", icon: "🧠" },
    { label: "PDF Chunks", value: stats.pdf_chunks, color: "#f97316", icon: "📄" },
    { label: "FAQ Chunks", value: stats.faq_chunks, color: "#22c55e", icon: "✅" },
    { label: "Resolved Chat Chunks", value: stats.resolved_chat_chunks, color: "#a855f7", icon: "💬" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {items.map(item => (
          <div key={item.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "20px 16px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <button style={styles.btn} onClick={onRefresh}>🔄 Refresh Stats</button>
    </div>
  );
}

function ManageContentTab({ showStatus, onSuccess }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await getKnowledgeSources();
      setSources(data);
    } catch (e) {
      showStatus("error", "Failed to load knowledge sources.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sourceUrl) => {
    if (!window.confirm(`Are you sure you want to permanently delete knowledge derived from:\n\n${sourceUrl}\n\nThis will remove all associated AI context chunks.`)) return;

    try {
      const res = await deleteKnowledgeSource(sourceUrl);
      showStatus("success", res.message);
      fetchSources();
      onSuccess(); // Refresh stats
    } catch (e) {
      showStatus("error", e?.response?.data?.detail || "Deletion failed.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div style={styles.desc}>Loading content list...</div>;

  return (
    <div>
      <p style={styles.desc}>View and delete currently embedded knowledge sources. Deleting a source removes all of its chunks from the AI's actively searchable context.</p>
      
      <div style={{...styles.tableContainer, marginTop: 16}}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Source / Title</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Dept.</th>
              <th style={styles.th}>Chunks</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan="5" style={{...styles.td, textAlign: 'center'}}>No sources found in ChromaDB.</td>
              </tr>
            ) : (
              sources.map((s, idx) => (
                <tr key={idx}>
                  <td style={{...styles.td, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={s.source}>
                    <strong>{s.source}</strong><br/>
                    <span style={{fontSize: 10, color: '#64748b'}}>{formatDate(s.added_at)}</span>
                  </td>
                  <td style={styles.td}>
                    {s.doc_type === 'pdf' ? '📄 PDF' : s.doc_type === 'faq' ? '✅ FAQ' : '💬 Chat'}
                  </td>
                  <td style={styles.td}>{s.department}</td>
                  <td style={styles.td}>{s.chunk_count}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(s.source)} style={styles.deleteBtn}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "20px 24px", borderBottom: "1px solid #334155", background: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: 700, fontSize: 18 },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  closeBtn: { background: "#334155", color: "#94a3b8", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 },
  tabs: { display: "flex", background: "#0f172a", borderBottom: "1px solid #334155", padding: "0 24px" },
  tab: { background: "transparent", color: "#64748b", border: "none", padding: "14px 16px", cursor: "pointer", fontSize: 13, borderBottom: "2px solid transparent" },
  activeTab: { color: "#60a5fa", borderBottomColor: "#2563eb" },
  status: { margin: "16px 24px 0", padding: "12px 16px", borderRadius: 10, border: "1px solid", fontSize: 13 },
  content: { flex: 1, overflowY: "auto", padding: "24px" },
  form: { maxWidth: 600, display: "flex", flexDirection: "column", gap: 14 },
  desc: { fontSize: 13, color: "#64748b", lineHeight: 1.7, margin: 0 },
  label: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: -8 },
  select: { padding: "10px 12px", background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", borderRadius: 8, fontSize: 14 },
  input: { padding: "10px 12px", background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", borderRadius: 8, fontSize: 14, fontFamily: "inherit" },
  fileInput: { color: "#94a3b8", fontSize: 13 },
  fileInfo: { fontSize: 12, color: "#64748b", background: "#1e293b", padding: "8px 12px", borderRadius: 8, border: "1px solid #334155" },
  btn: { padding: "12px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 8 },
  tableContainer: { overflowY: 'auto', flex: 1, maxHeight: 400, border: '1px solid #334155', borderRadius: 8, background: '#0f172a' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #334155', color: '#94a3b8', position: 'sticky', top: 0, backgroundColor: '#1e293b', fontSize: 12, textTransform: 'uppercase' },
  td: { padding: '12px', borderBottom: '1px solid #334155', fontSize: 13, color: '#e2e8f0' },
  deleteBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }
};
