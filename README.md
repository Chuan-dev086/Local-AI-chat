# 💬 Local AI Chat

A fully local, private AI chatbot. Built with **React 19 + Vite**, **Node.js + Express 5**, **MongoDB**, **Qdrant**, and **Ollama**. Your conversations, embeddings, and model inference never leave your machine.

<p>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vector_DB-Qdrant-red?logo=qdrant&logoColor=white" alt="Qdrant">
  <img src="https://img.shields.io/badge/Inference-Ollama-black" alt="Ollama">
</p>

No OpenAI, Gemini, or Claude API keys. No external cloud database. Everything runs on your local hardware.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#️-configuration)
- [Keyboard Shortcuts](#️-keyboard-shortcuts)
- [Troubleshooting](#-troubleshooting)
- [Known Limitations](#️-known-limitations)
- [Privacy](#-privacy--local-first)
- [Roadmap](#️-roadmap)
- [License](#-license)

---

## ✨ Features

### 💬 Chat & Generation

- **Real-time streaming**: Responses appear progressively as they are generated. Streamed text is parsed line by line from NDJSON, so long or multi-byte (e.g. Chinese) output is handled correctly.
- **Smart Context Truncation**: Automatically calculates character limits to prevent exceeding the model's context window. It uses a sliding window approach (~8000 characters) and strictly enforces user/assistant role alternation to prevent backend errors.
- **Stop generation**: Abort a response with the Stop button or `Esc`. Text generated so far is kept.
- **Regenerate & resend**: Re-run the last reply or resend any earlier message in one click.
- **Message editing**: Edit a previous message and get a fresh response. Attached files are kept when editing.
- **Clear error reporting**: Model not found, Ollama not running, or a connection interrupted mid-response are shown in the chat instead of failing silently.
- **Auto-Generate Chat Titles**: First message provides an instant 12-character fallback title; upon completion of the first turn, backend `/api/generate-title` summarizes a concise 3-5 word title via LLM.

### 📚 Knowledge Base & RAG (Early Preview)

- **PDF Ingestion**: Upload PDF documents via the sidebar. Text is automatically extracted (`pdf-parse`), divided into semantic overlapping chunks (1500 chars / 200 overlap), converted into 768-dimensional vectors with `nomic-embed-text`, and indexed into Qdrant.
- **RAG-Augmented Q&A**: Toggle `useRag` in the chat input to automatically switch to the designated RAG model (`qwen3:4b-instruct-2507-q4_K_M`), retrieve the top 10 relevant document chunks from Qdrant, and ground model responses directly in document context.

### ⭐ Custom Prompt Management

- **Global Templates**: Create, edit, and delete personalized System Prompt templates directly from the UI.
- **Strict Deduplication**: Prevents saving templates with duplicate names or identical content.
- **Inline UX**: Save a newly written system prompt as a template with one click right from the chat config dialog.

### 🤖 Local Model Management & Vision

- **Per-session model selection**: Pick any installed Ollama model for each chat. The list is read from your local Ollama instance.
- **Automatic fallback**: If a chat's model is no longer installed, it switches to the default model for that mode and notifies you.
- **Image Routing (Vision)**: Drag and drop or upload images (PNG/JPEG) with base64 previews. The backend automatically detects image data and routes requests away from text-only models to vision models (`qwen2.5vl:3b` or `llava`).
- **Two modes**: _General Chat_ and _Programming Assistant_, each with its own default model.

### 🎨 UI / UX

- **Minimal layout**: Collapsible sidebar, centered chat column, and floating action buttons.
- **Syntax highlighting**: Code blocks with high-contrast themes (Night Owl) and one-click copy.
- **Math rendering**: LaTeX formulas and Big-O notation, e.g. `$O(n \log n)$`.
- **Dark & light mode**: Switch themes at any time.
- **Smart auto-scroll & Jump to bottom**: Follows new output while near the bottom; shows a floating scroll-to-bottom button when scrolled up (>300px).

### 🗂️ Workspace & Storage

- **MongoDB Persistence**: Chats and messages are securely stored in a local MongoDB database (`sessions` and `messages` collections), resolving browser storage capacity limits.
- **Session Pinning**: Pin frequently used or critical chats to the top of the sidebar with one click.
- **Session search**: Fast global search across chat titles (`Ctrl/Cmd + K`).
- **Markdown export**: Download any conversation as a `.md` file.

---

<a id="architecture"></a>

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│                     React Frontend                     │
│  • Chat UI & NDJSON streaming (src/App.jsx)            │
│  • API Client (src/api/chatApi.js)                     │
│  • Custom Prompt Hooks & LocalStorage                  │
│  • Markdown, KaTeX & Syntax Highlighting               │
└───────────────────────────┬────────────────────────────┘
                            │  HTTP REST / NDJSON stream
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Node.js + Express 5                  │
│  • Request validation & context truncation             │
│  • Vision model auto-routing                           │
│  • RAG PDF pipeline & Multer uploads                   │
│  • Mongoose ODM models (Session, Message)              │
└──────────────┬────────────────────┬────────────────────┘
               │                    │
        Mongoose ODM         Axios REST / Stream
               ▼                    ▼
     ┌──────────────────┐  ┌──────────────────┐
     │     MongoDB      │  │      Ollama      │
     │  (Port 27017)    │  │   (Port 11434)   │
     │  • sessions      │  │  • Chat (/api/chat)│
     │  • messages      │  │  • Embedding     │
     └──────────────────┘  └────────┬─────────┘
                                    │
                       Vector query │ Embeddings
                                    ▼
                           ┌──────────────────┐
                           │      Qdrant      │
                           │   (Port 6333)    │
                           │  Vector DB (RAG) │
                           └──────────────────┘
```

---

<a id="tech-stack"></a>

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Material UI (MUI), react-markdown, remark-gfm, remark-math, rehype-katex, react-syntax-highlighter |
| **Backend** | Node.js, Express.js (v5), MongoDB, Mongoose, Multer, `pdf-parse`, `@qdrant/js-client-rest`, Axios, CORS |
| **Vector DB** | Qdrant (local vector database via Docker Compose) |
| **Inference** | Ollama (local LLM inference & embeddings) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port `27017` by default)
- [Ollama](https://ollama.com/)
- [Docker & Docker Compose](https://www.docker.com/) (for running Qdrant vector database)

### 1. Install Ollama & MongoDB

Download Ollama from [ollama.com](https://ollama.com/), and ensure your local MongoDB service is running.

### 2. Pull local models

```bash
# General chat model
ollama pull llama3.2:3b

# Programming assistant & RAG Q&A model
ollama pull qwen3:4b-instruct-2507-q4_K_M

# Embedding model for RAG knowledge base
ollama pull nomic-embed-text

# (Optional) Vision model for image attachments
ollama pull qwen2.5vl:3b
```

### 3. Start Qdrant Vector Database

Start the local Qdrant vector database service using Docker Compose:

```bash
docker compose up -d qdrant
```

Verify that Qdrant is running by visiting `http://localhost:6333/dashboard` in your browser.

### 4. Configure & Start the backend

```bash
cd backend
npm install
npm run dev
```

The server runs at **http://localhost:5000** and connects to MongoDB.

### 5. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## ⚙️ Configuration

### Backend (`backend/.env`)

| Variable | Default (Code) | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port the backend listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/local_ai_chat` | Connection URI for the MongoDB database |
| `OLLAMA_URL` | `http://localhost:11434` | Base URL of your local Ollama server |
| `DEFAULT_CHAT_MODEL` | `llama3.2:3b` | Default model used in General Chat mode |
| `DEFAULT_CODE_MODEL` | `qwen3:4b-instruct-2507-q4_K_M` | Default model used in Programming Assistant mode |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins allowed to access the API |
| `MAX_CONTEXT_MESSAGES` | `10` | Maximum history messages sent to Ollama (*Note: `.env.example` pre-fills `6`, but code fallback is `10`*) |
| `MAX_OUTPUT_TOKENS` | `1024` | Maximum generation tokens (*Note: `.env.example` pre-fills `2048`, but code fallback is `1024`*) |
| `NUM_CTX` | `8192` | Maximum context window tokens configured for Ollama |
| `NUM_BATCH` | `128` | Token batch size for Ollama inference |
| `MAX_SYSTEM_PROMPT_LENGTH` | `8000` | Maximum character length allowed for custom system prompts |
| `OLLAMA_TIMEOUT_MS` | `300000` | Timeout in milliseconds for an Ollama generation stream (5 minutes) |

---

## 🩺 Troubleshooting

| Symptom | Likely cause and fix |
| :--- | :--- |
| "无法连接到后端服务" | The backend is not running. Start it with `npm run dev` in `backend/`. |
| "Failed to connect to MongoDB" | MongoDB is not running. Start your local MongoDB service (port 27017). |
| "Failed to communicate with Ollama" | Ollama is not running. Start the Ollama app or run `ollama serve`. |
| "Failed to communicate with Qdrant" | Qdrant container is not running. Run `docker compose up -d qdrant`. |
| `model "..." not found` | The model is not installed. Run `ollama pull <model>`. |

---

## ⚠️ Known Limitations

*(For detailed architectural analysis and code-verified defect items, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#51-确认的缺陷与风险))*

- **Single User & Local Trust**: The server listens on all network interfaces (`0.0.0.0`) by default without authentication or authorization. Designed strictly for trusted local usage.
- **Upload Restrictions**: The PDF upload endpoint (`/api/rag/upload`) currently lacks file size limits and MIME-type validation.
- **Large Image Attachments**: Images uploaded as raw base64 are directly stored in `Message.imageBase64`, which risks hitting MongoDB's 16MiB document limit for high-resolution images.
- **RAG Silent Fallback**: If vector generation or Qdrant retrieval fails, the backend silently falls back to standard chat without alerting the user.
- **Context Window**: Handled by frontend sliding-window truncation (~8000 characters), but extremely long prompts will drop older messages.

---

## 🔐 Privacy & Local First

This project is built entirely around local inference and local storage.

- ❌ No OpenAI, Gemini, or Claude API keys required
- ❌ No external cloud database
- ❌ No telemetry or data sent to third parties
- ✅ Conversations and vectors are stored securely on your local hardware (MongoDB + Qdrant + Ollama)

---

## 🗺️ Roadmap

- [x] **RAG (Basic)**: PDF upload, text extraction, chunking, embedding (`nomic-embed-text`), Qdrant vector storage, and `useRag` context injection
- [ ] **RAG (Advanced)**: Knowledge base management UI (view, delete, re-index documents), visual citations (`[1]`), multi-collection / per-session isolation, and multi-format support (DOCX, Markdown, CSV)
- [x] **Session Pinning**: Pin important chats to the top of the sidebar
- [ ] **Session Tags & Folders**: Organize chats with custom tags and category folders
- [ ] **Auto-retry**: Automatically retry requests if the Ollama stream unexpectedly disconnects
- [ ] **PWA support**: Install as a standalone desktop app
- [ ] **Voice I/O**: Speech input and text-to-speech output

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
