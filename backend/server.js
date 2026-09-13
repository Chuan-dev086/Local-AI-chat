import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434";

const MODELS = {
  chat: "qwen3:4b",
  code: "qwen2.5-coder:3b",
};

// System prompts
const SYSTEM_PROMPTS = {
  chat: "You are a friendly general-purpose AI assistant. Answer clearly and concisely.",
  code: "You are a helpful programming assistant. Explain concepts with examples, write clean code, and help the user learn programming step by step. Use simple language and avoid unnecessary jargon.",
};

// Store conversation history in memory
const sessions = new Map();

app.post("/api/chat", async (req, res) => {
  const { sessionId, message, mode = "chat" } = req.body;

  if (!sessionId || !message || !message.trim()) {
    return res.status(400).json({
      error: "缺少 sessionId 或 message",
    });
  }

  const normalizedMode = mode === "code" ? "code" : "chat";
  const selectedModel = MODELS[normalizedMode];

  // Get or create a session
  let session = sessions.get(sessionId);

  if (!session) {
    session = {
      mode: normalizedMode,
      messages: [],
    };

    sessions.set(sessionId, session);
  }

  // Update mode if the user changes it
  session.mode = normalizedMode;

  // Build messages for Ollama
  const systemMessage = {
    role: "system",
    content: SYSTEM_PROMPTS[normalizedMode],
  };

  const userMessage = {
    role: "user",
    content: message.trim(),
  };

  const ollamaMessages = [systemMessage, ...session.messages, userMessage];

  console.log(
    `[Chat] session=${sessionId} mode=${normalizedMode} model=${selectedModel}`,
  );

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: selectedModel,
      messages: ollamaMessages,
      stream: false,
    });

    const aiContent =
      response.data?.message?.content ||
      "No response was returned by the model.";

    // Save only user and assistant messages.
    // The system prompt is added again for every request.
    session.messages.push(userMessage);
    session.messages.push({
      role: "assistant",
      content: aiContent,
    });

    res.json({
      content: aiContent,
      model: selectedModel,
    });
  } catch (error) {
    console.error("Ollama 调用失败:", error.response?.data || error.message);

    res.status(500).json({
      error: "模型调用失败，请确认 Ollama 正在运行并且模型已经下载。",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Node server running at http://localhost:${PORT}`);
  console.log(`General Chat model: ${MODELS.chat}`);
  console.log(`Programming Assistant model: ${MODELS.code}`);
});
