import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen2.5:7b";

// system prompt 
const SYSTEM_PROMPTS = {
  chat: "You are a friendly general-purpose AI assistant. Answer clearly and concisely.",
  code: "You are a helpful programming assistant. Explain concepts with examples, write clean code, and help the user learn programming step by step. Use simple language and avoid unnecessary jargon.",
};

const sessions = new Map();

app.post("/api/chat", async (req, res) => {
  const { sessionId, message, mode = "chat" } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "缺少 sessionId 或 message" });
  }

  // 获取或创建会话
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      mode,
      messages: [],
    };
    sessions.set(sessionId, session);
  }

  // 如果模式变了，更新 session 的 mode（可选）
  session.mode = mode;

  // 构建发送给 Ollama 的消息列表
  const ollamaMessages = [];

  // 加上 system prompt
  const systemContent = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  ollamaMessages.push({
    role: "system",
    content: systemContent,
  });

  // 加上历史对话
  ollamaMessages.push(...session.messages);

  // 加上当前用户消息
  const userMessage = {
    role: "user",
    content: message,
  };

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: MODEL,
      messages: [...ollamaMessages, userMessage],
      stream: false,
    });

    const aiContent = response.data.message?.content || "";

    // 将用户消息和 AI 回复加入历史（不加 system）
    session.messages.push(userMessage);
    session.messages.push({
      role: "assistant",
      content: aiContent,
    });

    res.json({ content: aiContent });
  } catch (err) {
    console.error("Ollama 调用失败:", err.message);
    res.status(500).json({ error: "模型调用失败" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Node server running at http://localhost:${PORT}`);
});
