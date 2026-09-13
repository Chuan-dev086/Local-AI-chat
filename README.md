# Local AI Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A local AI chatbot powered by Ollama with specialized models, featuring a Node.js + Express backend and a React + Vite frontend styled with Material-UI (MUI).

## ✨ Features

- 🧠 **Multi-turn Conversations** — Session-based memory keeps context coherent
- ⚡ **Local Inference** — Runs locally through Ollama with no external AI API calls
- 🎯 **Real-time Feedback** — Displays a "Thinking…" state while waiting for a response
- 💾 **Persistent Multi-session History** — All chat sessions are stored in browser localStorage and restored after refresh
- 🤖 **Chat Modes with Specialized Models** — Automatically routes to optimized models:
  - **General Chat** → `qwen3:4b` for balanced performance
  - **Programming Assistant** → `qwen2.5-coder:3b` for code-focused assistance
- 📝 **Markdown Rendering** — AI responses support headings, lists, links, inline code, and code blocks
- 📋 **Code Copying** — Copy code directly from rendered code blocks
- ⬇️ **Auto-scroll** — Automatically scrolls to the latest message
- 🔄 **Fresh Start** — Start a new empty conversation with one click
- 💬 **Multiple Chat Sessions** — Create, switch, rename, and delete separate conversations
- 🏷️ **Automatic Chat Titles** — The first user message becomes the conversation title
- 🌙 **Dark Mode** — Toggle between light and dark themes with persistent preference

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, Axios
- **Frontend:** Vite, React, Material-UI (MUI)
- **Models:** Ollama with specialized models per chat mode:
  - `qwen3:4b` for General Chat
  - `qwen2.5-coder:3b` for Programming Assistant

## 📁 Project Structure

```
src/
│
├── App.jsx
│
├── components/
│   ├── Sidebar.jsx
│   ├── ChatHeader.jsx
│   ├── MessageList.jsx
│   ├── MessageBubble.jsx
│   ├── ChatInput.jsx
│   └── CopyButton.jsx
│
└── theme/
    └── theme.js
```

## 📋 Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **Ollama** installed and running  
  - Windows: Install the [Ollama desktop app](https://ollama.com/download/windows) or run `ollama serve` in PowerShell  
  - macOS / Linux: Run `ollama serve` in terminal
- **Models pulled:**
  - `ollama pull qwen3:4b` (General Chat)
  - `ollama pull qwen2.5-coder:3b` (Programming Assistant)

**System Requirements:**

- RAM: Minimum 4GB (8GB+ recommended)
- Disk: ~2-3GB per model (total ~4-6GB)
- GPU: Optional (NVIDIA CUDA supported)

## 🚀 Quick Start

### 1. Start Ollama

**macOS / Linux:**

```bash
ollama serve
```

**Windows:**

- Download and install [Ollama for Windows](https://ollama.com/download/windows)
- Launch the Ollama app

**Verify it's running:**

```bash
curl http://localhost:11434/api/tags
```

### 2. Pull Required Models

```bash
ollama pull qwen3:4b
ollama pull qwen2.5-coder:3b
```

Verify models are installed:

```bash
ollama list
```

### 3. Start Backend

```bash
cd backend
npm install
npm start
```

Backend will run at `http://localhost:5000`

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open browser at `http://localhost:5173`

## 💬 Usage

1. Start Ollama, the backend, and the frontend.
2. Select **General Chat** or **Programming Assistant** from the mode selector.
   - The backend automatically routes to the appropriate model for your selected mode
3. Type a message and press **Enter** or click **Send**.
4. Use **Shift + Enter** to add a new line without sending the message.
5. AI replies support Markdown formatting and code blocks.
6. Click **Copy** on a code block to copy its code.
7. All conversations are automatically saved in browser localStorage.
8. Refreshing the page restores all chat sessions.
9. Click **New Chat** to create a fresh conversation.
10. Use the sidebar to switch between different chat sessions.
11. Click the pencil icon to rename a chat, or the × button to delete it.
12. Click the **dark mode toggle button** in the header to switch between light and dark themes.

## 🔌 API

### POST `/api/chat`

Send a message to the AI with the selected chat mode.

**Request:**

```json
{
  "message": "What is the capital of France?",
  "mode": "general"
}
```

**Response:**

```json
{
  "content": "The capital of France is Paris..."
}
```

> Note: The backend automatically routes to the specialized model based on the selected mode. Multi-session management is handled on the frontend using browser localStorage. The backend processes each request independently while preserving session-based conversation history.

### Starting a New Chat

Click the **"New Chat"** button in the UI. The frontend generates a new `sessionId`, which starts a fresh conversation on the server.

## ⚙️ Configuration

### Model Routing

The backend automatically routes requests to specialized models based on chat mode:

**Edit `backend/server.js`:**

```javascript
const MODELS = {
  general: "qwen3:4b",
  programming: "qwen2.5-coder:3b"
};
```

Each request logs the selected model for debugging:

```
[INFO] Processing mode: general → using model: qwen3:4b
[INFO] Processing mode: programming → using model: qwen2.5-coder:3b
```

### Chat Modes and System Prompts

The backend supports two chat modes:

- **General Chat** — A general-purpose assistant for everyday questions and conversations.
- **Programming Assistant** — A learning-focused assistant that explains programming concepts, provides examples, and helps users understand code step by step.

The selected mode is sent from the frontend to the backend. The backend routes to the appropriate model and applies the matching system prompt before sending messages to Ollama.

To customize these behaviors, edit the `SYSTEM_PROMPTS` object in `backend/server.js`.

### Change Port

Backend port in `backend/server.js`:

```javascript
const PORT = 5000; // Change as needed
```

Frontend API in `frontend/src/App.jsx`:

```javascript
const API_URL = "http://localhost:5000/api/chat";
```

### Theme Configuration

The theme system is defined in `src/theme/theme.js`:

- **Light Mode:** Default theme with light backgrounds and dark text
- **Dark Mode:** Dark backgrounds with light text for reduced eye strain
- **Persistence:** Theme preference is saved in localStorage and restored on page reload

To customize colors, edit the `lightColors` and `darkColors` objects in `theme.js`.

## 🐛 Troubleshooting

### Connection refused

```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check backend
curl http://localhost:5000/api/chat
```

### Models not found

```bash
ollama pull qwen3:4b
ollama pull qwen2.5-coder:3b
ollama list
```

### Model mismatch error

If you see an error like "model not found", ensure both specialized models are pulled:

```bash
ollama pull qwen3:4b
ollama pull qwen2.5-coder:3b
```

Check backend logs for which model was being requested.

### Slow responses

1. Check system resources (RAM, CPU)
2. Verify which model is being used (check backend logs)
3. Close other applications
4. Enable GPU (see below)

### GPU Acceleration

Ollama automatically uses your NVIDIA GPU if CUDA is available.  
You can verify GPU usage in the `ollama serve` logs:

```text
library=CUDA ... description="NVIDIA GeForce RTX 3050 Laptop GPU"
```

No extra configuration is usually required.

For advanced control, see the [Ollama documentation](https://ollama.com/) on GPU configuration.

### Frontend can't connect to backend

1. Verify backend is running: `curl http://localhost:5000/api/chat`
2. Check `API_URL` in `frontend/src/App.jsx`
3. Ensure port numbers match
4. Restart both services

## 📚 Advanced

### Custom System Prompts

```javascript
// General Chat
const systemPrompt =
  "You are a helpful and friendly AI assistant. Answer questions clearly and concisely.";

// Programming Assistant
const systemPrompt =
  "You are an expert programming tutor. Explain concepts with examples, help users understand code step by step, and provide learning-focused explanations.";
```

### Environment Variables

Create `.env` in backend:

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL_GENERAL=qwen3:4b
OLLAMA_MODEL_PROGRAMMING=qwen2.5-coder:3b
PORT=5000
```

Then in `backend/server.js`:

```javascript
require("dotenv").config();
const MODELS = {
  general: process.env.OLLAMA_MODEL_GENERAL || "qwen3:4b",
  programming: process.env.OLLAMA_MODEL_PROGRAMMING || "qwen2.5-coder:3b"
};
const PORT = process.env.PORT || 5000;
```

## 📦 Dependencies

- Node.js v16+ (v18+ recommended)
- Express ^4.18.0
- React ^18.0.0
- Vite ^5.0.0
- Material-UI (MUI)
- Ollama (Latest)

Install:

```bash
cd backend && npm install
cd frontend && npm install
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push: `git push origin feature/YourFeature`
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

## 🔗 Resources

- [Ollama](https://ollama.com/)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Material-UI (MUI)](https://mui.com/)

## ⭐ Support

If this helps you, please give it a star! ⭐

---

**Last Updated:** 2026  
**Maintainer:** Chuan-dev086  
**Status:** Actively Maintained ✅  
**Version:** 2.1.0

## 🎯 Recent Changes (v2.1.0)

- **Model Specialization:** Routes chat modes to specialized Ollama models
  - General Chat uses `qwen3:4b` for balanced conversational performance
  - Programming Assistant uses `qwen2.5-coder:3b` for code-focused assistance
- **Enhanced Logging:** Each request logs the selected model for easier debugging
- **Preserved Session History:** Multi-session conversation history maintained across mode switches