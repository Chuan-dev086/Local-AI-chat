# Local AI Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A local AI chatbot powered by Ollama with specialized models, featuring a Node.js + Express backend and a React + Vite frontend styled with Material-UI (MUI).

## ✨ Features

- 🧠 **Multi-turn Conversations** — Session-based memory keeps context coherent
- ⚡ **Local Inference** — Runs locally through Ollama with no external AI API calls
- 🎯 **Real-time Feedback** — Displays a "Thinking…" state while waiting for a response
- 💾 **Persistent Multi-session History** — All chat sessions are stored in browser localStorage and restored after refresh
- 🤖 **Chat Modes with Specialized Models** — Automatically routes to optimized models:
  - **General Chat** → `llama3.2:3b` for natural conversations
  - **Programming Assistant** → `qwen2.5-coder:3b` for code-focused assistance
- 🌍 **Multilingual Support** — Automatic language detection (English, Chinese, Malay) with strict language matching in responses
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
  - `llama3.2:3b` for General Chat (natural conversations)
  - `qwen2.5-coder:3b` for Programming Assistant (code assistance)

## 📁 Project Structure

```
.
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── CopyButton.jsx
│   │   ├── theme/
│   │   │   └── theme.js
│   │   ├── main.jsx
│   │   └── ...
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── node_modules/
│
└── README.md
```

## 📋 Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **Ollama** installed and running
  - Windows: Install the [Ollama desktop app](https://ollama.com/download/windows) or run `ollama serve` in PowerShell
  - macOS / Linux: Run `ollama serve` in terminal
- **Models pulled:**
  - `ollama pull llama3.2:3b` (General Chat)
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
ollama pull llama3.2:3b
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
# or: nodemon server.js
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

Send a message to the AI and retrieve a response.

**Language Detection:**

- The AI automatically detects the language of your message (English, Chinese, or Malay)
- It responds **strictly in the same language** for consistency
- This applies across all conversation turns in a session

**Example Requests:**

Chat mode (natural conversation):

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "user123",
    "message": "How are you?",
    "mode": "chat"
  }'
```

Code mode (programming help):

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "user123",
    "message": "Write a Python function to calculate factorial",
    "mode": "code"
  }'
```

Chinese language example:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "user456",
    "message": "请解释什么是JavaScript",
    "mode": "chat"
  }'
```

## ⚙️ Configuration

### Model Routing

The backend automatically routes requests to specialized models based on chat mode:

**Edit `backend/server.js`:**

```javascript
const MODELS = {
  chat: "llama3.2:3b",
  code: "qwen2.5-coder:3b",
};
```

### Chat Modes and System Prompts

The backend supports two chat modes:

- **Chat Mode** (`"chat"`) — A friendly, empathetic virtual AI companion with natural conversation style
- **Code Mode** (`"code"`) — A professional, efficient coding assistant for programming tasks

Both modes include:

- **Strict Language Detection:** Automatically detects input language and responds in the same language
- **Supported Languages:** English, Chinese (中文), Malay (Bahasa Melayu)
- **Custom System Prompts:** Each mode has tailored instructions for optimal responses

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

### Environment Variables

Create `.env` in backend (optional):

```env
OLLAMA_URL=http://localhost:11434
PORT=5000
```

## 🐛 Troubleshooting

### "Model invocation failed"

```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check backend
curl http://localhost:5000/api/chat
```

- Ensure Ollama is running: `ollama serve`
- Verify models are downloaded: `ollama list`
- Check Ollama is accessible at `http://localhost:11434`

### Models not found

```bash
ollama pull llama3.2:3b
ollama pull qwen2.5-coder:3b
ollama list
```

### Port Already in Use

If you get "address already in use" error:

```bash
# Change PORT in backend/server.js
# Or kill the process using the port:
# Windows: netstat -ano | findstr :5000 and taskkill /PID <PID> /F
# macOS/Linux: lsof -i :5000 and kill -9 <PID>
```

### Frontend can't connect to backend

1. Verify backend is running: `curl http://localhost:5000/api/chat`
2. Check `API_URL` in `frontend/src/App.jsx`
3. Ensure port numbers match (backend: 5000, frontend: 5173)
4. Clear browser cache and try again
5. Restart both services

### CORS Issues

If you see CORS errors in the browser console:

1. Ensure backend is running on `http://localhost:5000`
2. Check that the frontend API URL points to the correct backend URL
3. Verify backend has proper CORS headers configured
4. Try accessing backend directly: `curl http://localhost:5000/api/chat`

### Slow responses

1. Check system resources (RAM, CPU)
2. Verify which model is being used (check backend logs)
3. Close other applications
4. Check GPU status (see below)

### GPU Acceleration

Ollama automatically uses your NVIDIA GPU if CUDA is available.  
You can verify GPU usage in the `ollama serve` logs:

```text
library=CUDA ... description="NVIDIA GeForce RTX 3050 Laptop GPU"
```

No extra configuration is usually required. For advanced control, see the [Ollama documentation](https://ollama.com/) on GPU configuration.

### Language not detected correctly

- The AI uses strict language detection based on your input
- If it responds in the wrong language, check:
  1. Your message language is clearly English, Chinese, or Malay
  2. Backend is using the correct system prompt (check logs)
  3. Try rephrasing your message more clearly

## 📚 Advanced

### Custom System Prompts

Both chat modes use detailed system prompts for optimal behavior:

**Chat Mode System Prompt** (excerpt):

```
You are a friendly, natural, and empathetic virtual AI companion.
Detect the language of the user's latest message and reply STRICTLY in that same language.
Speak like a natural friend with a casual and warm tone.
```

**Code Mode System Prompt** (excerpt):

```
You are a professional, efficient, and reliable coding assistant.
Detect the language of the user's message and reply strictly in the same language.
Read and explain code, generate clean code, find bugs, and improve code structure.
```

For full prompts and customization, see `backend/server.js`.

### Input Validation

The backend implements strict input validation:

```javascript
if (
  typeof sessionId !== "string" ||
  typeof message !== "string" ||
  !sessionId.trim() ||
  !message.trim()
) {
  return res.status(400).json({
    error: "Invalid sessionId or message",
  });
}
```

- All parameters are type-checked
- Session IDs and messages must be non-empty strings (after trimming)
- Clear error messages guide users to correct input

### Error Handling & Timeout

- **Request Timeout:** 300 seconds per request
- **Detailed Logging:** All requests log model, session, and error information
- **User-friendly Errors:** Error messages explain the issue clearly

## 📦 Dependencies

- Node.js v16+ (v18+ recommended)
- Express ^4.18.0
- React ^18.0.0
- Vite ^5.0.0
- Material-UI (MUI)
- Axios
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

**Last Updated:** September 2026  
**Maintainer:** Chuan-dev086  
**Status:** Actively Maintained ✅  
**Version:** 2.2.0

## 🎯 Recent Changes (v2.2.0)

- **Model Update:** Chat mode now uses `llama3.2:3b` for improved natural conversation (previously `qwen3:4b`)
- **Enhanced Multilingual Support:** Added strict language detection rules for English, Chinese, and Malay
- **Improved API Documentation:** Clarified `sessionId` parameter for session management and conversation context
- **Better Error Handling:** Enhanced input validation with type checking and 300s timeout protection
- **Enhanced Logging:** Detailed error messages and model selection logging for debugging
