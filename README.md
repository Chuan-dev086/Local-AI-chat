# Local AI Chat

A local AI chatbot built with **React + Vite**, **Node.js + Express**, and **Ollama**.

The project runs AI models locally through Ollama, allowing users to chat with an AI without relying on external AI APIs such as OpenAI, Gemini, or Claude.

---

## ✨ Features

### 💬 AI Chat

- Real-time AI response streaming
- Multi-turn conversations
- Conversation context management
- Context limit to prevent unnecessarily large prompts
- Automatic scrolling to the latest message
- Loading / thinking state while AI is generating
- Error handling for backend and Ollama connection failures

### 🗂️ Chat Sessions

- Create new chat sessions
- Switch between chat sessions
- Rename chat sessions
- Delete chat sessions
- Automatically generate a session title from the first user message
- Persist chat sessions using browser `localStorage`
- Restore previous conversations after refreshing the page

### 🤖 AI Modes

#### General Chat

Uses:

```text
llama3.2:3b
```

Designed for general conversations, questions, explanations, and everyday use.

#### Programming Assistant

Uses:

```text
qwen2.5-coder:3b
```

Designed for programming questions, debugging, code explanations, and development-related tasks.

### 🌍 Language Support

The AI is instructed to match the user's language.

Supported languages include:

- English
- Chinese
- Malay

Programming Assistant responses can also provide programming explanations in English or Chinese.

### 📝 Markdown & Code

- Markdown response rendering
- Code blocks
- Code copy functionality
- Better formatting for programming-related answers

### 🎨 User Interface

- React + MUI interface
- Dark mode
- Light mode
- Responsive chat layout
- Sidebar for chat session management
- Chat header with current session and mode
- Clean message bubbles
- Chat input with multiline support

### 💾 Local Storage

The frontend stores chat sessions locally in the browser.

Storage key:

```text
local_ai_chat_sessions_v2
```

Theme preference is stored separately:

```text
local_ai_chat_theme
```

No external database is required for the current version.

---

## ⚡ Streaming Response

The application uses Ollama's streaming API to display AI responses progressively instead of waiting for the entire response to finish.

### Without Streaming

```text
User
 ↓
Backend
 ↓
Ollama
 ↓
Wait for complete response
 ↓
Frontend displays response
```

### With Streaming

```text
User
 ↓
Backend
 ↓
Ollama
 ↓
Response chunks
 ↓
Frontend displays chunks progressively
```

This makes the chatbot feel more responsive while the model is generating an answer.

The backend converts the Ollama stream into newline-delimited JSON (NDJSON) for the React frontend.

---

## 🧠 Context Management

The application keeps conversation history so that the AI can understand previous messages in the same chat session.

To prevent the context from continuously growing, the backend limits the number of conversation messages sent to Ollama.

Current limit:

```text
10 messages
```

This helps reduce unnecessary prompt size and keeps response generation more manageable during longer conversations.

---

## 🔄 Conversation Synchronization

The frontend is the source of truth for the current conversation.

When sending a message, React sends the current conversation history to the backend.

The backend then:

1. Receives the current messages
2. Validates user and assistant messages
3. Takes the most recent messages within the context limit
4. Adds the appropriate system prompt
5. Sends the conversation to Ollama
6. Streams the response back to React

This also prevents edited messages from becoming inconsistent with an outdated backend conversation history.

---

## 🏗️ Tech Stack

### Frontend

- React
- Vite
- Material UI (MUI)
- JavaScript
- Browser `fetch()` API
- `localStorage`

### Backend

- Node.js
- Express.js
- Axios
- CORS

### AI

- Ollama
- Llama 3.2 3B
- Qwen 2.5 Coder 3B

---

## 📁 Project Structure

```text
Local-AI-chat/
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── CopyButton.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── MessageList.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── theme/
│   │   │   └── theme.js
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md
```

---

## 🔄 Application Architecture

```text
┌──────────────────────────────┐
│        React Frontend        │
│                              │
│  Chat UI                     │
│  Chat Sessions               │
│  Markdown / Code             │
│  Dark / Light Mode           │
│  localStorage                │
└──────────────┬───────────────┘
               │
               │ HTTP POST
               │ /api/chat
               ▼
┌──────────────────────────────┐
│       Node.js + Express      │
│                              │
│  Request Validation          │
│  Context Management          │
│  System Prompts              │
│  Model Selection             │
│  Streaming                   │
└──────────────┬───────────────┘
               │
               │ Ollama API
               ▼
┌──────────────────────────────┐
│            Ollama            │
│                              │
│       Local AI Models        │
│                              │
│  llama3.2:3b                 │
│  qwen2.5-coder:3b            │
└──────────────────────────────┘
```

---

## 🔀 Model Selection

The backend automatically selects the model according to the current chat mode.

| Mode                  | Model              | Purpose                |
| --------------------- | ------------------ | ---------------------- |
| General Chat          | `llama3.2:3b`      | General conversation   |
| Programming Assistant | `qwen2.5-coder:3b` | Programming and coding |

---

## 🔌 API

The frontend communicates with the backend through:

```text
POST http://localhost:5000/api/chat
```

Example request:

```json
{
  "sessionId": "example-session-id",
  "message": "Explain React useEffect",
  "mode": "chat",
  "messages": [
    {
      "role": "user",
      "content": "What is React?"
    },
    {
      "role": "assistant",
      "content": "React is a JavaScript library..."
    }
  ]
}
```

The backend sends the conversation to Ollama and streams the generated response back to the frontend.

---

## 🛠️ Getting Started

### 1. Install Ollama

Download and install Ollama from the official website.

After installation, verify that Ollama is running:

```bash
ollama --version
```

---

### 2. Pull the AI Models

For General Chat:

```bash
ollama pull llama3.2:3b
```

For Programming Assistant:

```bash
ollama pull qwen2.5-coder:3b
```

You can check installed models with:

```bash
ollama list
```

---

### 3. Start the Backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

### 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will provide a local development URL, normally:

```text
http://localhost:5173
```

Open the URL in your browser.

---

## ⚙️ Configuration

### Ollama

The backend currently connects to:

```text
http://localhost:11434
```

### Backend Port

The Express server runs on:

```text
5000
```

### Frontend API

The frontend sends requests to:

```text
http://localhost:5000/api/chat
```

---

## ⌨️ Chat Input

The chat input supports:

- `Enter` → Send message
- `Shift + Enter` → Create a new line

---

## 🔐 Privacy

This project is designed around local AI inference.

Your messages are sent to your local Express backend and then to your local Ollama instance.

The project does **not** require:

- OpenAI API key
- Gemini API key
- Claude API key
- External AI API services
- External database

Chat sessions are currently stored in the browser's `localStorage`.

---

## 🚧 Current Limitations

The current version intentionally keeps the architecture simple.

- Chat history is stored in browser `localStorage`
- No user authentication
- No cloud synchronization
- No database
- No file upload / document processing
- No RAG / vector database
- No external web search
- No AI tool calling / agents
- Generation cannot currently be manually stopped once started

---

## 🗺️ Future Improvements

Possible future features include:

- Stop AI generation
- Improved request cancellation
- Persistent database storage
- User authentication
- File and document upload
- PDF / document summarization
- RAG / vector database
- Web search integration
- AI tools / agents
- Todo and task management
- Personal finance features
- Response statistics
- Better model management
- More Ollama model options

---

## 🎯 Project Goals

This project was created to learn and practice:

- React development
- React component architecture
- State management
- React Hooks
- REST API communication
- Express.js backend development
- HTTP streaming
- AI model integration
- Ollama
- Local AI inference
- Conversation context management
- Browser localStorage
- Markdown rendering
- MUI UI development
- Frontend / backend architecture

The main goal is to understand how a modern AI chatbot works from the frontend all the way to a locally running language model.

---

## 📌 Project Status

**Current Status: Active Development**

The core local AI chat functionality is working, including:

- ✅ Local Ollama AI
- ✅ General Chat
- ✅ Programming Assistant
- ✅ Multi-turn conversations
- ✅ Multiple chat sessions
- ✅ Session rename / delete
- ✅ Automatic session titles
- ✅ localStorage persistence
- ✅ Streaming responses
- ✅ Context limiting
- ✅ Frontend / backend conversation synchronization
- ✅ Markdown rendering
- ✅ Code copying
- ✅ Dark / Light mode
- ✅ Multilingual responses
- ✅ Error handling

More advanced AI workspace features will be added progressively.

---

## 📄 License

This project is licensed under the MIT License.
