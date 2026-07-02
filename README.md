# Multi-Agent Codebase Assistant

An AI-powered developer tool that lets you chat with any GitHub repository. Load a repo, then ask questions — the system automatically routes your request to the right specialized agent using a multi-agent RAG architecture.

---

## Features

- **Load any GitHub repo** — clones and indexes it into a vector store automatically
- **Explain code** — understand files, functions, classes, and execution flows
- **Analyze** — architecture review, security issues, code quality, dead code detection
- **Search** — find where specific logic or functionality lives
- **Document** — generate README, API docs, onboarding guides
- **Suggest changes** — get refactoring suggestions and best practice improvements
- **General Q&A** — ask any programming question without needing a repo

---

## Project Structure

```
Multi_Agent_Codebase_Assistant/
├── backend/
│   ├── agents/
│   │   ├── planner.py          # Classifies intent and routes requests
│   │   ├── explain_agent.py    # Explains code, files, architecture
│   │   ├── analyze_agent.py    # Reviews code quality, security, performance
│   │   ├── document_agent.py   # Generates documentation
│   │   ├── Modify_agent.py     # Suggests code improvements
│   │   └── general_agent.py    # Answers general programming questions
│   ├── helper/
│   │   ├── utils.py            # Git cloning, vector store, RAG retrieval
│   │   └── Session.py          # Tracks the active loaded repository
│   ├── repos/                  # Cloned repositories stored here
│   ├── chroma_db/              # Persisted vector embeddings per repo
│   ├── server.py               # FastAPI server — exposes POST /chat
│   ├── orchestrator.py         # Routes plan to the correct agent
│   ├── main.py                 # CLI entry point
│   └── .env                    # API keys (not committed)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Message.jsx       # Chat bubble with Markdown rendering
    │   │   ├── Sidebar.jsx       # Active repo display + quick actions
    │   │   └── TypingIndicator.jsx
    │   ├── App.jsx               # Main chat UI and API integration
    │   └── main.jsx
    ├── index.html
    └── vite.config.js            # Proxies /api → localhost:8000
```

---

## Agentic Flow Architecture

```
User Message
     │
     ▼
┌─────────────────────────────────────────┐
│              Planner Agent              │
│                                         │
│  Reads the user message and returns     │
│  a JSON intent classification:          │
│                                         │
│  { "intent": "explain",                 │
│    "repo_url": null }                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│             Orchestrator                │
│                                         │
│  Reads the intent and decides:          │
│  1. Which agent to call                 │
│  2. What context to retrieve            │
└──────┬──────────────────────────────────┘
       │
       ├── repo_load ──────────────────────► Clone repo → Chunk files →
       │                                     Build ChromaDB vector store
       │
       ├── explain / suggest_changes ──────► MMR Search (diverse files)
       │                                     → Build context → Agent
       │
       ├── analyze / document ────────────► All indexed files
       │                                     → Build context → Agent
       │
       ├── search ─────────────────────────► MMR Search → Return file list
       │
       └── general ─────────────────────── ► No retrieval → Agent directly
                   │
                   ▼
        ┌──────────────────────┐
        │   Specialized Agent  │
        │  (LLM via OpenRouter)│
        └──────────┬───────────┘
                   │
                   ▼
            Markdown Response
                   │
                   ▼
         FastAPI POST /chat
                   │
                   ▼
          React Chat Frontend
```

### RAG Pipeline (for repo-based intents)

```
GitHub URL
    │
    ▼
git clone → repos/{repo_name}/
    │
    ▼
Walk all files (ignore node_modules, .git, dist, build)
    │
    ▼
RecursiveCharacterTextSplitter
  chunk_size=1500, chunk_overlap=300
    │
    ▼
HuggingFace Embeddings (BAAI/bge-small-en-v1.5)
    │
    ▼
ChromaDB (persisted at chroma_db/{repo_name}/)
    │
    ▼
At query time:
  - Targeted queries  → MMR search (k=5, fetch_k=60, diversity enforced)
  - Broad queries     → get_all_repo_files() (full context)
    │
    ▼
build_context() → concatenated file contents
    │
    ▼
Passed to specialized LLM agent
```

### Intent Classification

| Intent | Trigger Examples | Agent Used | Context Strategy |
|---|---|---|---|
| `repo_load` | "Load https://github.com/..." | — | Clone + index |
| `explain` | "Explain index.ts", "What does X do?" | explain_agent | MMR search |
| `analyze` | "Analyze this repo", "Find security issues" | analyze_agent | All files |
| `document` | "Generate README", "Document the API" | document_agent | All files |
| `suggest_changes` | "Improve this code", "Refactor X" | modify_agent | MMR search |
| `search` | "Find create_table", "Where is auth?" | — | MMR search → file list |
| `general` | "What is Redis?", "Hello" | general_agent | No retrieval |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (free tier works)

### 1. Clone the project

```bash
git clone https://github.com/your-username/Multi_Agent_Codebase_Assistant.git
cd Multi_Agent_Codebase_Assistant
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv env
source env/bin/activate        # Windows: env\Scripts\activate

# Install dependencies
pip install fastapi uvicorn langchain langchain-core langchain-openrouter \
    langchain-chroma langchain-huggingface langchain-text-splitters \
    chromadb gitpython python-dotenv sentence-transformers
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Get your free API key at [https://openrouter.ai/keys](https://openrouter.ai/keys).

### 4. Frontend setup

```bash
cd frontend
npm install
```

---

## Running the Project

### Terminal 1 — Start the backend

```bash
cd backend
source env/bin/activate
uvicorn server:app --reload --port 8000
```

### Terminal 2 — Start the frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

### Load a repository

Type a GitHub URL in the chat:

```
Load https://github.com/username/repo-name
```

The assistant will clone the repo, chunk all files, generate embeddings, and store them in ChromaDB. This only happens once per repo — subsequent loads reuse the existing vector store.

### Ask questions

Once a repo is loaded, you can ask:

```
Explain the main entry point
Analyze this repository for security issues
Find where authentication is implemented
Generate a README for this project
Suggest improvements to the database layer
```

For general questions (no repo needed):

```
What is a REST API?
Explain dependency injection
What is RAG?
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM Provider | OpenRouter (free tier) |
| Agent Framework | LangChain + LangGraph (`create_agent`) |
| Embeddings | HuggingFace `BAAI/bge-small-en-v1.5` |
| Vector Store | ChromaDB (local, persisted) |
| Backend API | FastAPI + Uvicorn |
| Frontend | React + Vite + Tailwind CSS v4 |
| Markdown Rendering | react-markdown + remark-gfm |

---

## Notes

- The first time you load a repo, embedding generation may take 30–60 seconds depending on repo size.
- ChromaDB persists embeddings locally — reloading the same repo is instant.
- Free OpenRouter models may occasionally be rate-limited. Wait a few seconds and retry.
- The CLI (`main.py`) also works independently of the frontend if you prefer terminal usage.
