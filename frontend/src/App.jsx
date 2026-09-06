import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = "http://localhost:5000/api/chat";
const STORAGE_KEY = "local_ai_chat_sessions_v2";

function generateSessionId() {
  if (crypto.randomUUID) {
    return `session_${crypto.randomUUID()}`;
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createNewSession(mode = "chat") {
  const now = new Date().toISOString();

  return {
    id: generateSessionId(),
    title: "New Chat",
    mode,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function getTitleFromMessage(message) {
  const cleanMessage = message.replace(/\s+/g, " ").trim();

  if (!cleanMessage) {
    return "New Chat";
  }

  const maxLength = 36;

  if (cleanMessage.length <= maxLength) {
    return cleanMessage;
  }

  return `${cleanMessage.slice(0, maxLength)}...`;
}

function getInitialChatState() {
  const fallbackSession = createNewSession();

  const fallbackState = {
    activeSessionId: fallbackSession.id,
    sessions: [fallbackSession],
  };

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return fallbackState;
    }

    const parsedData = JSON.parse(savedData);

    if (
      !Array.isArray(parsedData.sessions) ||
      parsedData.sessions.length === 0
    ) {
      return fallbackState;
    }

    const normalizedSessions = parsedData.sessions.map((session) => ({
      id: session.id || generateSessionId(),
      title: session.title || "New Chat",
      mode: session.mode === "code" ? "code" : "chat",
      messages: Array.isArray(session.messages) ? session.messages : [],
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
    }));

    const activeSessionExists = normalizedSessions.some(
      (session) => session.id === parsedData.activeSessionId,
    );

    return {
      activeSessionId: activeSessionExists
        ? parsedData.activeSessionId
        : normalizedSessions[0].id,
      sessions: normalizedSessions,
    };
  } catch (error) {
    console.error("Failed to load saved chats:", error);
    return fallbackState;
  }
}

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
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
      onClick={handleCopy}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        padding: "4px 8px",
        border: "1px solid #64748b",
        borderRadius: 6,
        backgroundColor: copied ? "#16a34a" : "#334155",
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
  const [initialChatState] = useState(getInitialChatState);

  const [sessions, setSessions] = useState(initialChatState.sessions);
  const [activeSessionId, setActiveSessionId] = useState(
    initialChatState.activeSessionId,
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId],
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeSessionId,
        sessions,
      }),
    );
  }, [activeSessionId, sessions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeSession?.messages, loading]);

  const updateActiveSession = (updater) => {
    setSessions((previousSessions) =>
      previousSessions.map((session) => {
        if (session.id !== activeSessionId) {
          return session;
        }

        return updater(session);
      }),
    );
  };

  const handleNewChat = () => {
    if (loading) {
      return;
    }

    const newSession = createNewSession(activeSession?.mode || "chat");

    setSessions((previousSessions) => [newSession, ...previousSessions]);
    setActiveSessionId(newSession.id);
    setInput("");
  };

  const handleSelectSession = (sessionId) => {
    if (loading) {
      return;
    }

    setActiveSessionId(sessionId);
    setInput("");
  };

  const handleDeleteSession = (event, sessionId) => {
    event.stopPropagation();

    if (loading) {
      return;
    }

    const sessionToDelete = sessions.find(
      (session) => session.id === sessionId,
    );
    const shouldDelete = window.confirm(
      `Delete "${sessionToDelete?.title || "this chat"}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    const remainingSessions = sessions.filter(
      (session) => session.id !== sessionId,
    );

    if (remainingSessions.length === 0) {
      const newSession = createNewSession();

      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      setInput("");
      return;
    }

    setSessions(remainingSessions);

    if (sessionId === activeSessionId) {
      setActiveSessionId(remainingSessions[0].id);
      setInput("");
    }
  };

  const handleRenameSession = () => {
    if (loading || !activeSession) {
      return;
    }

    const newTitle = window.prompt(
      "Enter a new chat title:",
      activeSession.title,
    );
    const cleanedTitle = newTitle?.trim();

    if (!cleanedTitle) {
      return;
    }

    updateActiveSession((session) => ({
      ...session,
      title: cleanedTitle,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleModeChange = (event) => {
    const newMode = event.target.value;

    updateActiveSession((session) => ({
      ...session,
      mode: newMode,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSendMessage = async () => {
    const userText = input.trim();

    if (!userText || loading || !activeSession) {
      return;
    }

    const sessionId = activeSession.id;
    const userMessage = {
      role: "user",
      content: userText,
    };

    setInput("");
    setLoading(true);

    setSessions((previousSessions) =>
      previousSessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        return {
          ...session,
          title:
            session.messages.length === 0
              ? getTitleFromMessage(userText)
              : session.title,
          messages: [...session.messages, userMessage],
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    try {
      const response = await axios.post(API_URL, {
        sessionId,
        message: userText,
        mode: activeSession.mode,
      });

      const aiMessage = {
        role: "assistant",
        content:
          response.data.content || "No response was returned by the model.",
      };

      setSessions((previousSessions) =>
        previousSessions.map((session) => {
          if (session.id !== sessionId) {
            return session;
          }

          return {
            ...session,
            messages: [...session.messages, aiMessage],
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    } catch (error) {
      console.error("Chat request failed:", error);

      const errorMessage =
        error.response?.data?.error ||
        "Unable to connect to the backend or Ollama. Please check that both services are running.";

      setSessions((previousSessions) =>
        previousSessions.map((session) => {
          if (session.id !== sessionId) {
            return session;
          }

          return {
            ...session,
            messages: [
              ...session.messages,
              {
                role: "assistant",
                content: `**Error:** ${errorMessage}`,
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const pageTitle =
    activeSession?.mode === "code"
      ? "Local AI Programming Assistant"
      : "Local AI General Chat";

  const emptyMessage =
    activeSession?.mode === "code"
      ? "Ask a programming question to get started."
      : "Start a new conversation.";

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 1240,
          height: "calc(100vh - 48px)",
          minHeight: 620,
          margin: "0 auto",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          backgroundColor: "#ffffff",
          boxShadow: "0 12px 36px rgba(15, 23, 42, 0.1)",
        }}
      >
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            width: 270,
            flexShrink: 0,
            borderRight: "1px solid #cbd5e1",
            backgroundColor: "#f1f5f9",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 19,
              }}
            >
              Local AI Chat
            </h2>

            <button
              type="button"
              onClick={handleNewChat}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "10px 12px",
                border: "none",
                borderRadius: 8,
                backgroundColor: loading ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              + New Chat
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10,
            }}
          >
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSession(session.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleSelectSession(session.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                    padding: "10px 8px 10px 10px",
                    borderRadius: 8,
                    backgroundColor: isActive ? "#dbeafe" : "transparent",
                    color: "#0f172a",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  <span
                    title={session.title}
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {session.mode === "code" ? "💻 " : "💬 "}
                    {session.title}
                  </span>

                  <button
                    type="button"
                    aria-label={`Delete ${session.title}`}
                    title="Delete chat"
                    onClick={(event) => handleDeleteSession(event, session.id)}
                    disabled={loading}
                    style={{
                      border: "none",
                      borderRadius: 5,
                      padding: "3px 6px",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: 15,
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: 12,
              borderTop: "1px solid #cbd5e1",
              color: "#64748b",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {sessions.length} {sessions.length === 1 ? "chat" : "chats"} saved
            locally
          </div>
        </aside>

        <div
          style={{
            display: "flex",
            flex: 1,
            minWidth: 0,
            flexDirection: "column",
            backgroundColor: "#ffffff",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h1
                title={activeSession?.title}
                style={{
                  margin: 0,
                  overflow: "hidden",
                  color: "#0f172a",
                  fontSize: 20,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeSession?.title || "New Chat"}
              </h1>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                {pageTitle}
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
                  fontSize: 13,
                }}
              >
                Mode:
              </label>

              <select
                id="mode-select"
                value={activeSession?.mode || "chat"}
                onChange={handleModeChange}
                disabled={loading}
                style={{
                  padding: "7px 9px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 7,
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
                onClick={handleRenameSession}
                disabled={loading}
                style={{
                  padding: "7px 10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 7,
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Rename
              </button>
            </div>
          </header>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "18px 20px",
              backgroundColor: "#f8fafc",
            }}
          >
            {activeSession?.messages.length === 0 && (
              <div
                style={{
                  display: "grid",
                  height: "100%",
                  placeItems: "center",
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ marginBottom: 10, fontSize: 34 }}>
                    {activeSession?.mode === "code" ? "💻" : "💬"}
                  </div>
                  <div>{emptyMessage}</div>
                </div>
              </div>
            )}

            {activeSession?.messages.map((message, index) => {
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
                      maxWidth: "80%",
                      overflowWrap: "anywhere",
                      padding: "10px 13px",
                      borderRadius: isUser
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                      backgroundColor: isUser ? "#4f46e5" : "#ffffff",
                      boxShadow: isUser
                        ? "none"
                        : "0 1px 3px rgba(15, 23, 42, 0.1)",
                      color: isUser ? "#ffffff" : "#0f172a",
                      fontSize: 15,
                      lineHeight: 1.65,
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
                            <h1 style={{ margin: "8px 0", fontSize: 22 }}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 style={{ margin: "8px 0", fontSize: 19 }}>
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 style={{ margin: "8px 0", fontSize: 17 }}>
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
                            const codeText = String(children).replace(
                              /\n$/,
                              "",
                            );

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
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.1)",
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
              padding: "14px 20px 16px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeSession?.mode === "code"
                    ? "Ask a programming question…"
                    : "Type your message…"
                }
                disabled={loading}
                rows={2}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "11px 13px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  outline: "none",
                  backgroundColor: loading ? "#f8fafc" : "#ffffff",
                  fontFamily: "inherit",
                  fontSize: 15,
                  lineHeight: 1.45,
                  boxSizing: "border-box",
                }}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                style={{
                  minWidth: 92,
                  border: "none",
                  borderRadius: 10,
                  padding: "0 16px",
                  backgroundColor:
                    loading || !input.trim() ? "#94a3b8" : "#4f46e5",
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
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
