# 💬 Local AI Chat

A fully local, private AI chatbot. Built with **React + Vite**, **Node.js + Express**, and **Ollama**. Your conversations and model inference never leave your machine.

<p>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Inference-Ollama-black" alt="Ollama">
</p>

No OpenAI, Gemini, or Claude API keys. No cloud database. Everything runs on your hardware.

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
- **Stop generation**: Abort a response with the Stop button or `Esc`. Text generated so far is kept.
- **Regenerate & resend**: Re-run the last reply or resend any earlier message in one click.
- **Message editing**: Edit a previous message and get a fresh response. Attached files are kept when editing.
- **Multi-turn context**: Keeps conversation history across the session (the window size is configurable).
- **Clear error reporting**: Model not found, Ollama not running, or a connection interrupted mid-response are shown in the chat instead of failing silently.

### 📎 Attachments

- **File analysis**: Attach a `.txt`, `.md`, `.csv`, `.json`, or source code file and ask questions about it.
- **Follow-up questions**: The file stays in context for later messages in the same chat.
- **Size limit**: File content is truncated to 8000 characters; the chip shows `(已截断)` when this happens.

### 🤖 Local Model Management

- **Per-session model selection**: Pick any installed Ollama model for each chat. The list is read from your local Ollama instance.
- **Automatic fallback**: If a chat's model is no longer installed, it switches to the default model for that mode and tells you.
- **Custom system prompts**: Override the default persona with your own instructions for individual chats.
- **Two modes**: _General Chat_ and _Programming Assistant_, each with its own default model.

### 🎨 UI / UX

- **Minimal layout**: Collapsible sidebar, centered chat column, and floating action buttons.
- **Syntax highlighting**: Code blocks with high-contrast themes (Night Owl) and one-click copy.
- **Math rendering**: LaTeX formulas and Big-O notation, e.g. `$O(n \log n)$`.
- **Dark & light mode**: Switch themes at any time.
- **Message toolbars**: Hover to copy, edit, or regenerate. Each message shows a relative timestamp (e.g. "5m ago").
- **Smart auto-scroll**: The view follows new output only while you are near the bottom, so you can read earlier messages without being pulled down.

### 🗂️ Workspace

- **Session search**: Search chat titles and message content (`Ctrl/Cmd + K`).
- **Markdown export**: Download any conversation as a `.md` file.
- **Persistent storage**: Chats and theme preferences are saved in browser `localStorage`.
- **Corrupted-data protection**: If saved chat data cannot be read, it is backed up before the app starts fresh, so nothing is silently overwritten.

---

<a id="architecture"></a>

## 🏗️ Architecture

```text
┌──────────────────────────────────┐
│          React Frontend          │
│  • Chat UI & streaming           │
│  • API layer (src/api)           │
│  • Session management            │
│  • Markdown & LaTeX rendering    │
│  • Syntax highlighting           │
└────────────────┬─────────────────┘
                 │  HTTP POST  (NDJSON stream)
                 │  /api/chat
                 ▼
┌──────────────────────────────────┐
│        Node.js + Express         │
│  • Request validation            │
│  • Context management            │
│  • System prompt injection       │
│  • NDJSON parsing & streaming    │
│  • Abort on client disconnect    │
└────────────────┬─────────────────┘
                 │  Ollama API
                 ▼
┌──────────────────────────────────┐
│             Ollama               │
│        Local AI inference        │
└──────────────────────────────────┘
```

---

<a id="tech-stack"></a>

## 🛠️ Tech Stack

| Layer     | Technologies                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend  | React 18, Vite, Material UI (MUI), react-markdown, remark-gfm, remark-math, rehype-katex, react-syntax-highlighter |
| Backend   | Node.js, Express.js, Axios, CORS                                                                                   |
| Inference | Ollama (local)                                                                                                     |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Ollama](https://ollama.com/)

### 1. Install Ollama

Download Ollama from [ollama.com](https://ollama.com/), then confirm it is installed:

```bash
ollama --version
```

### 2. Pull local models

Pull the recommended models, or any model you prefer:

```bash
# General chat
ollama pull llama3.2:3b

# Programming assistant
ollama pull qwen2.5-coder:3b
```

Check the installed models with `ollama list`. Model names are case-sensitive; use the exact name shown there.

### 3. Configure the backend (optional)

The backend works without a `.env` file, using the defaults listed in [Configuration](#️-configuration). To customise it:

```powershell
cd backend
copy .env.example .env
```

On macOS / Linux, use `cp .env.example .env`.

### 4. Start the backend

```bash
cd backend
npm install
npm run dev
```

The server runs at **http://localhost:5000**.

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

| Variable                   | Default                                       | Description                                                         |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `PORT`                     | `5000`                                        | Port the backend listens on                                         |
| `OLLAMA_URL`               | `http://localhost:11434`                      | Base URL of your Ollama server                                      |
| `DEFAULT_CHAT_MODEL`       | `llama3.2:3b`                                 | Model used in General Chat when none is selected                    |
| `DEFAULT_CODE_MODEL`       | `qwen2.5-coder:3b`                            | Model used in Programming Assistant when none is selected           |
| `MAX_CONTEXT_MESSAGES`     | `10`                                          | Number of previous messages sent to the model                       |
| `MAX_OUTPUT_TOKENS`        | `1024`                                        | Maximum tokens generated per reply                                  |
| `NUM_CTX`                  | `8192`                                        | Context window passed to Ollama (prompt + history + reply must fit) |
| `MAX_SYSTEM_PROMPT_LENGTH` | `8000`                                        | Maximum length of a custom system prompt                            |
| `OLLAMA_TIMEOUT_MS`        | `300000`                                      | Timeout for a single generation, in milliseconds                    |
| `CORS_ORIGINS`             | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins allowed to call the backend        |

### Frontend (optional, `frontend/.env.local`)

| Variable        | Default                     | Description          |
| --------------- | --------------------------- | -------------------- |
| `VITE_API_BASE` | `http://localhost:5000/api` | Backend API base URL |

If you run the frontend on a different port, add it to `CORS_ORIGINS`, for example `CORS_ORIGINS=http://localhost:5174`.

---

## ⌨️ Keyboard Shortcuts

| Shortcut               | Action          |
| ---------------------- | --------------- |
| `Ctrl + K` / `Cmd + K` | Focus search    |
| `Alt + N`              | New chat        |
| `Esc`                  | Stop generation |

---

## 🩺 Troubleshooting

| Symptom                                                  | Likely cause and fix                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "无法连接到后端服务"                                     | The backend is not running. Start it with `npm run dev` in `backend/`.                                                      |
| "Failed to communicate with Ollama" / connection refused | Ollama is not running. Start the Ollama app or run `ollama serve`.                                                          |
| `model "..." not found` (HTTP 404)                       | The model is not installed. Run `ollama pull <model>` or pick another model from the header menu.                           |
| Models missing from the dropdown                         | Ollama is unreachable or has no models installed. Check `ollama list` and `OLLAMA_URL`.                                     |
| Browser shows a CORS error                               | Your frontend origin is not in `CORS_ORIGINS`. Add it and restart the backend.                                              |
| "聊天记录无法保存到浏览器存储"                           | Browser storage is full. Export or delete some chats (see [Known Limitations](#️-known-limitations)).                        |
| "检测到损坏的聊天数据"                                   | Saved chat data could not be read. The original is kept under `local_ai_chat_sessions_v2_corrupt_backup` in `localStorage`. |

---

## ⚠️ Known Limitations

- **Browser storage capacity**: Chats are stored in `localStorage`, which typically allows about 5 MB per site. Long conversations or many large attachments can exceed this. The app warns you when saving fails.
- **Attachment size**: File content is truncated to 8000 characters. Very large files should be split first.
- **Context window**: Only the most recent `MAX_CONTEXT_MESSAGES` messages are sent to the model. The combined prompt must fit within `NUM_CTX`; if it does not, Ollama drops the oldest tokens, which can include the system prompt.
- **Generation in progress**: Chats are saved when a reply finishes. If the tab is closed mid-reply, that partial reply is not kept.
- **Single user, single machine**: There is no account system and no sync between browsers or devices.

---

## 🔐 Privacy & Local First

This project is built entirely around local inference.

- ❌ No OpenAI, Gemini, or Claude API keys required
- ❌ No external database
- ❌ No data sent to third parties
- ✅ Conversations are stored only in your browser's `localStorage`

---

## 🗺️ Roadmap

- [ ] **RAG**: Upload local documents (PDF / TXT) for the model to analyze, with fully local retrieval
- [ ] **PWA support**: Install as a standalone desktop app
- [ ] **SQLite / IndexedDB**: Move chat history out of `localStorage` into a sturdier store, with a data migration
- [ ] **Voice I/O**: Speech input and text-to-speech output
- [ ] **Model parameter UI**: Adjust `temperature`, `num_ctx`, and `top_p` from the frontend

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
