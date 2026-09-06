import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = "http://localhost:5000/api/chat";
const STORAGE_KEY = "ai_chat_current_session";

function generateSessionId() {
  return `session_${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 12)}`;
}

function getInitialSession() {
  const fallbackSession = {
    sessionId: generateSessionId(),
    messages: [],
    mode: "chat",
  };

  try {
    const savedSession = localStorage.getItem(STORAGE_KEY);

    if (!savedSession) {
      return fallbackSession;
    }

    const parsedSession = JSON.parse(savedSession);

    return {
      sessionId: parsedSession.sessionId || fallbackSession.sessionId,
      messages: Array.isArray(parsedSession.messages)
        ? parsedSession.messages
        : [],
      mode: parsedSession.mode === "code" ? "code" : "chat",
    };
  } catch (error) {
    console.error("Failed to load saved chat:", error);
    return fallbackSession;
  }
}

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={copyCode}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        border: "1px solid #64748b",
        borderRadius: 6,
        padding: "4px 8px",
        background: copied ? "#16a34a" : "#334155",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function App() {
  const [initialSession] = useState(getInitialSession);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialSession.messages);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(initialSession.sessionId);
  const [mode, setMode] = useState(initialSession.mode);

  const chatEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Save the active conversation whenever it changes.
  useEffect(() => {
    const chatData = {
      sessionId,
      messages,
      mode,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatData));
  }, [sessionId, messages, mode]);

  // Scroll to the newest message after messages change.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    const userText = input.trim();

    if (!userText || loading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: userText,
    };

    setInput("");
    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post(API_URL, {
        sessionId,
        message: userText,
        mode,
      });

      const aiMessage = {
        role: "assistant",
        content:
          response.data.content || "No response was returned by the model.",
      };

      setMessages((previousMessages) => [...previousMessages, aiMessage]);
    } catch (error) {
      console.error("Chat request failed:", error);

      const serverMessage =
        error.response?.data?.error ||
        "Unable to connect to the backend or Ollama. Please check that both services are running.";

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: `**Error:** ${serverMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    if (loading) {
      return;
    }

    setSessionId(generateSessionId());
    setMessages([]);
    setInput("");
  };

  const pageTitle =
    mode === "code"
      ? "Local AI Programming Assistant"
      : "Local AI General Chat";

  const emptyMessage =
    mode === "code"
      ? "Ask a programming question to get started."
      : "Start a new conversation.";

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "32px 16px",
        boxSizing: "border-box",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 28,
              }}
            >
              {pageTitle}
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Powered locally by Ollama and qwen2.5:7b
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <label
              htmlFor="mode-select"
              style={{
                color: "#475569",
                fontSize: 14,
              }}
            >
              Mode:
            </label>

            <select
              id="mode-select"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              disabled={loading}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 10px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <option value="chat">General Chat</option>
              <option value="code">Programming Assistant</option>
            </select>

            <button
              type="button"
              onClick={startNewChat}
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "9px 12px",
                backgroundColor: loading ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              New Chat
            </button>
          </div>
        </header>

        <div
          ref={messageContainerRef}
          style={{
            height: 520,
            overflowY: "auto",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            backgroundColor: "#ffffff",
            padding: 16,
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
            boxSizing: "border-box",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>
                <div>{emptyMessage}</div>
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={`${message.role}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  margin: "12px 0",
                }}
              >
                <article
                  style={{
                    maxWidth: "78%",
                    padding: "10px 13px",
                    borderRadius: isUser
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    backgroundColor: isUser ? "#4f46e5" : "#f1f5f9",
                    color: isUser ? "#ffffff" : "#0f172a",
                    overflowWrap: "anywhere",
                    lineHeight: 1.65,
                    fontSize: 15,
                  }}
                >
                  {isUser ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 style={{ fontSize: 22, margin: "8px 0" }}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ fontSize: 19, margin: "8px 0" }}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{ fontSize: 17, margin: "8px 0" }}>
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p style={{ margin: "8px 0" }}>{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ margin: "8px 0", paddingLeft: 22 }}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ margin: "8px 0", paddingLeft: 22 }}>
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ margin: "3px 0" }}>{children}</li>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#2563eb" }}
                          >
                            {children}
                          </a>
                        ),
                        code: ({ inline, className, children, ...props }) => {
                          const codeText = String(children).replace(/\n$/, "");

                          if (inline) {
                            return (
                              <code
                                {...props}
                                style={{
                                  padding: "2px 5px",
                                  borderRadius: 4,
                                  backgroundColor: "#dbeafe",
                                  color: "#1e3a8a",
                                  fontFamily:
                                    'Consolas, "Courier New", monospace',
                                  fontSize: "0.9em",
                                }}
                              >
                                {children}
                              </code>
                            );
                          }

                          return (
                            <div
                              style={{
                                position: "relative",
                                margin: "10px 0",
                              }}
                            >
                              <CopyButton code={codeText} />
                              <pre
                                style={{
                                  margin: 0,
                                  overflowX: "auto",
                                  padding: "14px 48px 14px 14px",
                                  borderRadius: 8,
                                  backgroundColor: "#0f172a",
                                  color: "#e2e8f0",
                                  fontFamily:
                                    'Consolas, "Courier New", monospace',
                                  fontSize: 13,
                                  lineHeight: 1.55,
                                }}
                              >
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </article>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                margin: "12px 0",
              }}
            >
              <div
                style={{
                  padding: "10px 13px",
                  borderRadius: "14px 14px 14px 4px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  fontSize: 14,
                }}
              >
                Thinking…
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 14,
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "code"
                ? "Ask a programming question…"
                : "Type your message…"
            }
            disabled={loading}
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              padding: "12px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              outline: "none",
              fontFamily: "inherit",
              fontSize: 15,
              lineHeight: 1.45,
              boxSizing: "border-box",
              backgroundColor: loading ? "#f8fafc" : "#ffffff",
            }}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              minWidth: 92,
              border: "none",
              borderRadius: 10,
              padding: "0 16px",
              backgroundColor: loading || !input.trim() ? "#94a3b8" : "#4f46e5",
              color: "#ffffff",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>

        <p
          style={{
            margin: "8px 0 0",
            color: "#94a3b8",
            fontSize: 12,
          }}
        >
          Press Enter to send. Use Shift + Enter for a new line.
        </p>
      </section>
    </main>
  );
}

export default App;
