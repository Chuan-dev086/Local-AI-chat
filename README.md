# Local AI Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A local AI chatbot powered by Ollama + qwen2.5:7b, with a Node.js + Express backend and a React + Vite frontend.

## ✨ Features

- 🧠 **Multi-turn Conversations** — Session-based memory keeps context coherent
- ⚡ **Local Inference** — Completely offline, no external API calls
- 🎯 **Real-time Feedback** — Loading indicator shows processing status
- 🔄 **Fresh Start** — One-click "New Chat" button
- 📦 **Ready to Use** — Simple setup, get started in minutes

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, Axios
- **Frontend:** Vite, React, CSS3
- **Model:** Ollama + `qwen2.5:7b` (Local LLM)

## 📋 Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **Ollama** installed and running ([Download](https://ollama.com/))
- **Model pulled:** `ollama pull qwen2.5:7b`

**System Requirements:**

- RAM: Minimum 4GB (8GB+ recommended)
- Disk: ~4-5GB per model
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

### 2. Start Backend

```bash
cd backend
npm install
npm start
```

Backend will run at `http://localhost:5000`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open browser at `http://localhost:5173`

## 💬 Usage

1. Type your message in the chat box
2. Press **Enter** or click **Send**
3. Wait for the AI response
4. Click **New Chat** to start a fresh conversation

## 🔌 API

### POST `/api/chat`

Send a message to the AI.

**Request:**

```json
{
  "message": "What is the capital of France?",
  "sessionId": "user-session-123"
}
```

**Response:**

```json
{
  "content": "The capital of France is Paris..."
}
```

### Starting a New Chat

Click the **"New Chat"** button in the UI. The frontend generates a new `sessionId`, which starts a fresh conversation on the server.

## ⚙️ Configuration

### Change Model

Edit `backend/server.js`:

```javascript
const model = "qwen2.5:7b"; // Change to: qwen2:1.8b, mistral:7b, etc.
```

Pull a different model:

```bash
ollama pull mistral:7b
```

### System Prompt (Reserved for Future Use)

This version does not use a custom system prompt. Messages are sent directly to the model without additional system instructions.

To add a system prompt in the future, you can extend `backend/server.js` to include a `system` message in the `messages` array sent to Ollama, for example:

```javascript
session.messages = [
  {
    role: "system",
    content: "You are a helpful AI assistant. Answer clearly and concisely.",
  },
  ...session.messages,
];
```

This is left as an optional extension for future customization.

### Change Port

Backend port in `backend/server.js`:

```javascript
const PORT = 5000; // Change as needed
```

Frontend API in `frontend/src/App.jsx`:

```javascript
const API_URL = "http://localhost:5000/api/chat";
```

## 🐛 Troubleshooting

### Connection refused

```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check backend
curl http://localhost:5000/api/chat
```

### Model not found

```bash
ollama pull qwen2.5:7b
ollama list
```

### Slow responses

1. Check system resources (RAM, CPU)
2. Try a smaller model: `ollama pull qwen2:1.8b`
3. Close other applications
4. Enable GPU (see below)

### GPU Acceleration

Install NVIDIA CUDA toolkit, then:

```bash
export OLLAMA_GPU=1
ollama serve
```

### Frontend can't connect to backend

1. Verify backend is running: `curl http://localhost:5000/api/chat`
2. Check `API_URL` in `frontend/src/App.jsx`
3. Ensure port numbers match
4. Restart both services

## 📚 Advanced

### Custom System Prompts

```javascript
// Study Assistant
const systemPrompt =
  "You are a helpful study assistant. Explain concepts with examples.";

// Code Reviewer
const systemPrompt =
  "You are an expert code reviewer. Review code for quality and security.";
```

### Environment Variables

Create `.env` in backend:

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
PORT=5000
```

Then in `backend/server.js`:

```javascript
require("dotenv").config();
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const PORT = process.env.PORT || 5000;
```

## 📦 Dependencies

- Node.js v16+ (v18+ recommended)
- Express ^4.18.0
- React ^18.0.0
- Vite ^5.0.0
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

## ⭐ Support

If this helps you, please give it a star! ⭐

---

**Last Updated:** 2026  
**Maintainer:** Chuan-dev086  
**Status:** Actively Maintained ✅  
**Version:** 1.0.0
