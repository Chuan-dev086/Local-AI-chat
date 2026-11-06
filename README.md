# 💬 Local AI Chat

A fully local, private AI chatbot. Built with **React + Vite**, **Node.js + Express**, **MongoDB**, and **Ollama**. Your conversations and model inference never leave your machine.

<p>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
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
- **Smart Context Truncation**: Automatically calculates character limits to prevent exceeding the model's context window. It uses a sliding window approach and strictly enforces user/assistant role alternation to prevent backend errors.
- **Stop generation**: Abort a response with the Stop button or `Esc`. Text generated so far is kept.
- **Regenerate & resend**: Re-run the last reply or resend any earlier message in one click.
- **Message editing**: Edit a previous message and get a fresh response. Attached files are kept when editing.
- **Clear error reporting**: Model not found, Ollama not running, or a connection interrupted mid-response are shown in the chat instead of failing silently.

### ⭐ Custom Prompt Management

- **Global Templates**: Create, edit, and delete personalized System Prompt templates directly from the UI.
- **Strict Deduplication**: Prevents saving templates with duplicate names or identical content.
- **Inline UX**: Save a newly written system prompt as a template with one click right from the chat config dialog.

### 🤖 Local Model Management

- **Per-session model selection**: Pick any installed Ollama model for each chat. The list is read from your local Ollama instance.
- **Automatic fallback**: If a chat's model is no longer installed, it switches to the default model for that mode and tells you.
- **Image Routing**: Automatically detects image attachments and routes to a vision model (like `llava`) if the currently selected model is text-only.
- **Two modes**: _General Chat_ and _Programming Assistant_, each with its own default model.

### 🎨 UI / UX

- **Minimal layout**: Collapsible sidebar, centered chat column, and floating action buttons.
- **Syntax highlighting**: Code blocks with high-contrast themes (Night Owl) and one-click copy.
- **Math rendering**: LaTeX formulas and Big-O notation, e.g. `$O(n \log n)$`.
- **Dark & light mode**: Switch themes at any time.
- **Smart auto-scroll**: The view follows new output only while you are near the bottom.

### 🗂️ Workspace & Storage

- **MongoDB Persistence**: Chats and messages are securely stored in a local MongoDB database, resolving browser storage capacity limits.
- **Reference Data Model**: Messages are separated into an independent collection from Sessions, linked via a custom string ID, and assembled via MongoDB `$lookup` aggregation.
- **Session search**: Search chat titles and message content (`Ctrl/Cmd + K`).
- **Markdown export**: Download any conversation as a `.md` file.

---

<a id="architecture"></a>

## 🏗️ Architecture

```text
┌──────────────────────────────────┐
│          React Frontend          │
│  • Chat UI & streaming           │
│  • API layer (src/api)           │
│  • Custom Prompt Hooks           │
│  • Markdown & LaTeX rendering    │
└────────────────┬─────────────────┘
                 │  HTTP POST  (NDJSON stream)
                 │  /api/chat, /api/sessions
                 ▼
┌──────────────────────────────────┐
│        Node.js + Express         │
│  • Request validation            │
│  • Context management            │
│  • NDJSON parsing & streaming    │
└───────┬──────────────────┬───────┘
        │                  │
        │ Mongoose         │ Ollama API
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│    MongoDB    │  │    Ollama     │
│  (Sessions &  │  │  Local AI     │
│   Messages)   │  │  Inference    │
└───────────────┘  └───────────────┘
```

---

<a id="tech-stack"></a>

## 🛠️ Tech Stack

| Layer     | Technologies                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend  | React 18, Vite, Material UI (MUI), react-markdown, remark-gfm, remark-math, rehype-katex, react-syntax-highlighter |
| Backend   | Node.js, Express.js, MongoDB, Mongoose, Axios, CORS                                                                |
| Inference | Ollama (local)                                                                                                     |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port `27017` by default)
- [Ollama](https://ollama.com/)

### 1. Install Ollama & MongoDB

Download Ollama from [ollama.com](https://ollama.com/), and ensure your local MongoDB service is running.

### 2. Pull local models

```bash
# General chat
ollama pull llama3.2:3b

# Programming assistant
ollama pull qwen2.5-coder:3b
```

### 3. Configure the backend

```bash
cd backend
npm install
# Optional: Create a .env file if you need to change the default ports or URIs.
```

### 4. Start the backend

```bash
cd backend
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

| Variable             | Default                                       | Description                                                  |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `PORT`               | `5000`                                        | Port the backend listens on                                  |
| `MONGODB_URI`        | `mongodb://localhost:27017/local_ai_chat`     | URI for connecting to your local MongoDB database            |
| `OLLAMA_URL`         | `http://localhost:11434`                      | Base URL of your Ollama server                               |
| `DEFAULT_CHAT_MODEL` | `llama3.2:3b`                                 | Model used in General Chat when none is selected             |
| `DEFAULT_CODE_MODEL` | `qwen2.5-coder:3b`                            | Model used in Programming Assistant when none is selected    |
| `CORS_ORIGINS`       | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins allowed to call the backend |

---

## 🩺 Troubleshooting

| Symptom                             | Likely cause and fix                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| "无法连接到后端服务"                | The backend is not running. Start it with `npm run dev` in `backend/`. |
| "Failed to connect to MongoDB"      | MongoDB is not running. Start your local MongoDB service.              |
| "Failed to communicate with Ollama" | Ollama is not running. Start the Ollama app or run `ollama serve`.     |
| `model "..." not found`             | The model is not installed. Run `ollama pull <model>`.                 |

---

## ⚠️ Known Limitations

- **Single User**: Currently, there is no account system (JWT/Auth). The app is designed for local, single-user deployment.
- **Attachment size**: File content is truncated to 8000 characters. Very large files should be split first.
- **Context window**: Handled gracefully by the frontend sliding-window truncation, but extremely long prompts might still lose the oldest context.

---

## 🔐 Privacy & Local First

This project is built entirely around local inference and local storage.

- ❌ No OpenAI, Gemini, or Claude API keys required
- ❌ No external cloud database
- ❌ No data sent to third parties
- ✅ Conversations are stored securely on your local machine (MongoDB + Ollama)

---

## 🗺️ Roadmap

- [ ] **RAG**: Upload local documents (PDF / TXT) for the model to analyze, with fully local retrieval
- [ ] **Session Tags & Pinning**: Organize chats with custom tags and pin important sessions to the top
- [ ] **Auto-retry**: Automatically retry the request if the Ollama stream unexpectedly disconnects
- [ ] **PWA support**: Install as a standalone desktop app
- [ ] **Voice I/O**: Speech input and text-to-speech output

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
