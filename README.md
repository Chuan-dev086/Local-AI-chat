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
- [Keyboard Shortcuts](#️-keyboard-shortcuts)
- [Privacy](#-privacy--local-first)
- [Roadmap](#️-roadmap)
- [License](#-license)

---

## ✨ Features

### 💬 Chat & Generation

- **Real-time streaming**: Responses appear progressively as they are generated.
- **Stop generation**: Abort a response with the Stop button or `Esc`.
- **Regenerate & resend**: Re-run the last reply or resend any earlier message in one click.
- **Message editing**: Edit a previous message and get a fresh response.
- **Multi-turn context**: Keeps conversation history across the session (limit is configurable).

### 🤖 Local Model Management

- **Per-session model selection**: Pick any installed Ollama model for each chat, such as `llama3.2:3b`, `qwen2.5-coder:3b`, or `gemma2:2b`.
- **Custom system prompts**: Override the default persona with your own instructions for individual chats.

### 🎨 UI / UX

- **Minimal layout**: Collapsible sidebar, centered chat column, and floating action buttons.
- **Syntax highlighting**: Code blocks with high-contrast themes (Prism / Material Dark).
- **Math rendering**: LaTeX formulas and Big-O notation, e.g. \(O(n \log n)\).
- **Dark & light mode**: Switch themes at any time.
- **Message toolbars**: Hover to copy, edit, or regenerate. Each message shows a relative timestamp (e.g. "5m ago").

### 🗂️ Workspace

- **Session search**: Search chat titles and message content (`Ctrl/Cmd + K`).
- **Markdown export**: Download any conversation as a `.md` file.
- **Persistent storage**: Chats and theme preferences are saved in browser `localStorage`.

---

<a id="architecture"></a>

## 🏗️ Architecture

```text
┌──────────────────────────────────┐
│          React Frontend          │
│  • Chat UI & streaming           │
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
│  • Streaming proxy               │
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

# Lightweight fallback
ollama pull gemma2:2b
```

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

The server runs at **http://localhost:5000**.

### 4. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut               | Action          |
| ---------------------- | --------------- |
| `Ctrl + K` / `Cmd + K` | Focus search    |
| `Alt + N`              | New chat        |
| `Esc`                  | Stop generation |

---

## 🔐 Privacy & Local First

This project is built entirely around local inference.

- ❌ No OpenAI, Gemini, or Claude API keys required
- ❌ No external database
- ❌ No data sent to third parties
- ✅ Conversations are stored only in your browser's `localStorage`

---

## 🗺️ Roadmap

- [ ] **RAG**: Upload local documents (PDF / TXT) for the model to analyze
- [ ] **PWA support**: Install as a standalone desktop app
- [ ] **SQLite / IndexedDB**: Move chat history out of `localStorage` into a sturdier store
- [ ] **Voice I/O**: Speech input and text-to-speech output
- [ ] **Model parameter UI**: Adjust `temperature`, `num_ctx`, and `top_p` from the frontend

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
