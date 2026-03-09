import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email); // OAuth2 expects 'username'
  form.append('password', password);
  
  const { data } = await api.post("/api/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return data;
};


// ── Chat ─────────────────────────────────────────────────────────────────────

export const sendMessage = async ({ session_id, message, department, history }) => {
  const { data } = await api.post("/api/chat", {
    session_id,
    message,
    department: department || null,
    history: history.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date().toISOString(),
    })),
  });
  return data;
};

// ── Knowledge Base ────────────────────────────────────────────────────────────

export const uploadPDF = async (file, department) => {
  const form = new FormData();
  form.append("file", file);
  if (department) form.append("department", department);
  const { data } = await api.post("/api/knowledge/upload-pdf", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const addFAQ = async ({ question, answer, department, tags }) => {
  const { data } = await api.post("/api/knowledge/faq", {
    question,
    answer,
    department: department || null,
    tags: tags || [],
    approved: true,
  });
  return data;
};

export const addResolvedChat = async ({ student_query, agent_resolution, department }) => {
  const form = new FormData();
  form.append("student_query", student_query);
  form.append("agent_resolution", agent_resolution);
  if (department) form.append("department", department);
  const { data } = await api.post("/api/knowledge/resolved-chat", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getKnowledgeStats = async () => {
  const { data } = await api.get("/api/knowledge/stats");
  return data;
};

export const searchKnowledge = async ({ query, n_results = 5, department }) => {
  const { data } = await api.post("/api/knowledge/search", {
    query,
    n_results,
    department: department || null,
  });
  return data;
};

export const getChatHealth = async () => {
  const { data } = await api.get("/api/chat/health");
  return data;
};

// ── Queue (Phase 2) ─────────────────────────────────────────────────────────

export const escalateChat = async ({ session_id, department }) => {
  const { data } = await api.post(`/api/queue/escalate/${session_id}?department=${department}`);
  return data;
};

export const getPendingQueue = async () => {
  const { data } = await api.get("/api/queue/pending");
  return data;
};

export const acceptChat = async ({ session_id }) => {
  const { data } = await api.post(`/api/queue/accept/${session_id}`);
  return data;
};

export const resolveChat = async ({ session_id }) => {
  const { data } = await api.post(`/api/queue/resolve/${session_id}`);
  return data;
};

export default api;
