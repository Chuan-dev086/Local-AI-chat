// frontend/src/App.jsx
import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/chat";

// 简单生成一个 sessionId（实际项目可以用更严谨的方式）
function generateSessionId() {
  return "session_" + Math.random().toString(36).slice(2, 10);
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => generateSessionId());

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // 先把用户消息加到界面
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await axios.post(API_URL, {
        sessionId,
        message: userText,
      });

      const aiText = res.data.content || "（没有返回内容）";
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "出错了，请稍后再试。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setMessages([]);
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "0 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>本地 AI 通用聊天</h2>
        <button onClick={startNewChat}>新建对话</button>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 12,
          height: 400,
          overflowY: "auto",
          marginBottom: 12,
          backgroundColor: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 160 }}>
            还没有消息，开始聊天吧～
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: "8px 0",
              textAlign: m.role === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 12,
                backgroundColor: m.role === "user" ? "#007bff" : "#e9ecef",
                color: m.role === "user" ? "#fff" : "#000",
                maxWidth: "70%",
                wordBreak: "break-word",
                textAlign: "left",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ color: "#666", marginTop: 8 }}>正在思考…</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="输入你的问题..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ padding: "8px 16px", borderRadius: 8 }}
        >
          发送
        </button>
      </div>
    </div>
  );
}

export default App;
