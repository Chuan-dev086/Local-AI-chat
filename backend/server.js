// backend/server.js
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen2.5:7b";

// 简单内存存储会话（重启后端会清空）
const sessions = new Map();

app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "缺少 sessionId 或 message" });
  }

  // 获取或创建会话
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      messages: [],
    };
    sessions.set(sessionId, session);
  }

  // 将用户消息加入历史
  session.messages.push({
    role: "user",
    content: message,
  });

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: MODEL,
      messages: session.messages,
      stream: false,
    });

    const aiContent = response.data.message?.content || "";

    // 将 AI 回复也加入历史
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
