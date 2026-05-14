# 🎓 Student Support System — AI Chatbot + Live Agent Handoff

A production-ready hybrid AI–human student support system built with **FastAPI**, **React**, **Gemini**, **ChromaDB**, and **WebSockets**.

---

## 🏗️ Architecture

```
student-support/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point, CORS, routers
│   ├── config.py               # Settings from .env
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   ├── models/
│   │   ├── database.py         # SQLAlchemy DB connection
│   │   ├── user.py             # User models (Students, Agents, Admin)
│   │   ├── chat.py             # Chat History & Queue models
│   │   └── schemas.py          # Pydantic data validation models
│   ├── routers/
│   │   ├── auth.py             # Login & JWT authentication
│   │   ├── chat.py             # POST /api/chat — AI chat endpoint
│   │   ├── knowledge.py        # PDF upload, FAQ, stats endpoints
│   │   ├── queue.py            # Agent queue management
│   │   └── ws_chat.py          # WebSocket router for Live Chat
│   ├── services/
│   │   ├── ai_chat.py          # RAG pipeline (Gemini + ChromaDB)
│   │   ├── vector_db.py        # ChromaDB operations & embeddings
│   │   └── websocket.py        # WebSocket Connection Manager
│   └── utils/
│       └── security.py         # Password hashing & JWT utilities
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.js              # Routing & Protected Routes
│   │   ├── context/
│   │   │   └── AuthContext.js  # Global auth state
│   │   ├── hooks/
│   │   │   └── useChat.js      # Consolidated chat state & WebSockets
│   │   ├── pages/
│   │   │   ├── LoginPage.js        # JWT Login form
│   │   │   ├── AgentDashboard.js   # Agent Queue & Live Chat View
│   │   │   └── AdminDashboard.js   # Analytics & Knowledge Base Mgt
│   │   └── components/
│   │       ├── ChatInterface.js    # Main student chat UI
│   │       ├── MessageBubble.js    # Message rendering
│   │       ├── KnowledgePanel.js   # PDF/FAQ management
│   │       ├── UserManagementPanel.js # Admin User Creation 
│   │       └── AdminChatReviewPanel.js # Admin Chat Review Panel
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### 🐳 Option 1: Docker (Recommended - Easiest)

**Prerequisites:**
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop/))
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

**Steps:**

1. **Clone and navigate to the project:**
```bash
git clone <your-repo-url>
cd student-support
```

2. **Configure environment:**
```bash
# Edit .env file and add your Gemini API key
# Windows: notepad .env
# Mac/Linux: nano .env
```

3. **Start the application:**
```bash
# Windows
start.bat

# Mac/Linux
chmod +x start.sh
./start.sh

# Or manually
docker-compose up --build
```

4. **Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

📖 **Full Docker guide:** See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed instructions, troubleshooting, and production deployment.

---

### 💻 Option 2: Manual Setup (Traditional)

**Prerequisites:**
- Python 3.10+
- Node.js 18+
- A Google Gemini API key

**1. Set up the backend:**

```bash
cd backend
cp .env.example .env
# Edit .env — set GEMINI_API_KEY=your-key-here
```

**Installation:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**2. Start the frontend (in a new terminal):**

```bash
cd frontend
npm install
npm start
```

**3. Open the app:**

- **Web UI**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Default Accounts**: Check the database initialization script for default `student`, `agent` and `admin` credentials to test the authentication flow.

---

## 🧠 Smart Routing (AI to Human)

1. **AI First**: The student talks to the Gemini-powered AI first. The AI answers queries using the ChromaDB Knowledge Base (RAG).
2. **Escalation**: If the AI cannot find an answer in the approved PDFs/FAQs, or if the student clicks "Talk to Human", a support ticket is placed in the **Department Queue**.
3. **Live Chat**: An available Agent can pick up the ticket from their Dashboard (`/agent/dashboard`). This establishes a real-time **WebSocket connection** directly between the student and the agent.
4. **Resolution**: Once resolved, the agent closes the chat. Admin can review these resolved chats and automatically convert useful answers into new Knowledge Base FAQs.

---

## 🔌 Core Features

- **Role-Based Authentication**: Secure JWT login isolating Students, Agents, and Administrators.
- **RAG AI Chatbot**: Grounded QA system using `text-embedding-001` and `gemini-2.5-flash-lite`. No hallucinations.
- **WebSocket Live Agent Chat**: Real-time bi-directional messaging with connection lifecycle management.
- **Queue Management**: Department-wise ticket queues and agent allocation.
- **Self-Improving Knowledge Base**: Convert resolved human chats into vector embeddings to answer the next student instantly.
- **Admin Dashboard**: 
  - **User Management**: Add, view, and delete Student and Agent accounts, complete with required University IDs.
  - **Knowledge Base Management**: Upload PDFs, add FAQs, view uploaded sources, and delete specific knowledge items from ChromaDB.
  - **Chat Review**: Review full transcripts of resolved Student-Agent conversations and choose to keep or permanently delete them.

---

## 💡 Self-Improvement Loop

```
Resolved human chat
        ↓
Agent marks as resolved
        ↓
System extracts Q&A pair
        ↓
Stored in ChromaDB (vector DB)
        ↓
AI immediately uses new knowledge
        ↓
Next student with same question gets instant AI answer ✓
```

No retraining. No downtime. The system gets smarter with every resolved ticket.
