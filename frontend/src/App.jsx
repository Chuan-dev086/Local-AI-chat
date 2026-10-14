import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { getThemeStyles } from "./theme/theme";

const API_BASE = "http://localhost:5000/api";
const API_URL = `${API_BASE}/chat`;
const MODELS_API_URL = `${API_BASE}/models`;
const STORAGE_KEY = "local_ai_chat_sessions_v2";
const THEME_KEY = "local_ai_chat_theme";

// 必须和后端 DEFAULT_MODELS 保持一致
const DEFAULT_MODELS = {
  chat: "llama3.2:3b",
  code: "qwen2.5-coder:3b",
};

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
    model: DEFAULT_MODELS[mode] || DEFAULT_MODELS.chat,
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

    const normalizedSessions = parsedData.sessions.map((session) => {
      const safeMode = session.mode === "code" ? "code" : "chat";

      return {
        id: session.id || generateSessionId(),
        title: session.title || "New Chat",
        mode: safeMode,
        // 老数据没有 model 字段时，自动补上默认模型
        model: session.model || DEFAULT_MODELS[safeMode],
        messages: Array.isArray(session.messages) ? session.messages : [],
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: session.updatedAt || new Date().toISOString(),
      };
    });

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

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch (error) {
    console.error("Failed to load theme:", error);
  }

  return "light";
}

function App() {
  const [initialChatState] = useState(getInitialChatState);
  const [theme, setTheme] = useState(getInitialTheme());

  const [sessions, setSessions] = useState(initialChatState.sessions);
  const [activeSessionId, setActiveSessionId] = useState(
    initialChatState.activeSessionId,
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);

  const chatEndRef = useRef(null);
  const abortRef = useRef(null);

  const themeStyles = getThemeStyles(theme);

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId],
  );

  // =========================
  // Save Chat Sessions
  // =========================

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeSessionId,
        sessions,
      }),
    );
  }, [activeSessionId, sessions]);

  // =========================
  // Save Theme
  // =========================

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // =========================
  // Fetch Available Models
  // =========================

  useEffect(() => {
    let cancelled = false;

    const fetchModels = async () => {
      try {
        const response = await fetch(MODELS_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled && Array.isArray(data.models)) {
          setModels(data.models);
        }
      } catch (error) {
        console.error("Failed to fetch model list:", error);
        // 静默失败即可：用户仍可用默认模型
      }
    };

    fetchModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // Auto Scroll
  // =========================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeSession?.messages, loading]);

  // =========================
  // Theme
  // =========================

  const toggleTheme = () => {
    setTheme((previousTheme) => (previousTheme === "light" ? "dark" : "light"));
  };

  // =========================
  // Update Active Session
  // =========================

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

  // =========================
  // New Chat
  // =========================

  const handleNewChat = () => {
    if (loading) {
      return;
    }

    const newSession = createNewSession(activeSession?.mode || "chat");

    setSessions((previousSessions) => [newSession, ...previousSessions]);

    setActiveSessionId(newSession.id);

    setInput("");
  };

  // =========================
  // Select Chat
  // =========================

  const handleSelectSession = (sessionId) => {
    if (loading) {
      return;
    }

    setActiveSessionId(sessionId);
    setInput("");
  };

  // =========================
  // Delete Chat
  // =========================

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

  // =========================
  // Rename Chat
  // =========================

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

  // =========================
  // Change Chat Mode
  // =========================

  const handleModeChange = (event) => {
    const newMode = event.target.value;

    updateActiveSession((session) => {
      const oldDefault = DEFAULT_MODELS[session.mode];
      // 只有当用户没手动改过模型（还是旧默认值）时，才自动切到新默认
      const usingOldDefault = !session.model || session.model === oldDefault;

      return {
        ...session,
        mode: newMode,
        model: usingOldDefault ? DEFAULT_MODELS[newMode] : session.model,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // =========================
  // Change Model
  // =========================

  const handleModelChange = (event) => {
    const newModel = event.target.value;

    updateActiveSession((session) => ({
      ...session,
      model: newModel,
      updatedAt: new Date().toISOString(),
    }));
  };

  // ============================================================
  // Streaming Helper
  // ============================================================

  const streamChatResponse = async ({
    sessionId,
    message,
    mode,
    model,
    messages,
    onChunk,
    signal,
  }) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        message,
        mode,
        model,
        messages,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = "Unable to connect to the backend or Ollama.";

      try {
        const errorData = await response.json();

        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parsing error
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Streaming response is not supported by this browser.");
    }

    const reader = response.body.getReader();

    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let finished = false;

    while (!finished) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          continue;
        }

        try {
          const data = JSON.parse(trimmedLine);

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.content) {
            onChunk(data.content);
          }

          if (data.done) {
            finished = true;
            break;
          }
        } catch (error) {
          console.error("Failed to parse streaming chunk:", error);
        }
      }
    }

    // Process any remaining data
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.content) {
          onChunk(data.content);
        }
      } catch (error) {
        console.error("Failed to parse final streaming chunk:", error);
      }
    }
  };

  // =========================
  // Send Message
  // =========================

  const handleSendMessage = async () => {
    const userText = input.trim();

    if (!userText || loading || !activeSession) {
      return;
    }

    if (abortRef.current) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;

    const userMessage = {
      role: "user",
      content: userText,
    };

    const conversationMessages = [...activeSession.messages, userMessage];

    // Clear input immediately
    setInput("");

    // Start loading
    setLoading(true);

    // Add user message + empty assistant message
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

          messages: [
            ...session.messages,
            userMessage,
            {
              role: "assistant",
              content: "",
            },
          ],

          updatedAt: new Date().toISOString(),
        };
      }),
    );

    try {
      await streamChatResponse({
        sessionId,
        message: userText,
        mode: sessionMode,
        model: activeSession.model,
        messages: conversationMessages,
        signal: controller.signal,

        onChunk: (content) => {
          setSessions((previousSessions) =>
            previousSessions.map((session) => {
              if (session.id !== sessionId) {
                return session;
              }

              const messages = [...session.messages];

              const lastMessageIndex = messages.length - 1;

              const lastMessage = messages[lastMessageIndex];

              if (lastMessage?.role !== "assistant") {
                return session;
              }

              messages[lastMessageIndex] = {
                ...lastMessage,
                content: `${lastMessage.content}${content}`,
              };

              return {
                ...session,
                messages,
                updatedAt: new Date().toISOString(),
              };
            }),
          );
        },
      });
    } catch (error) {
      if (controller.signal.aborted) {
        setSessions((previousSessions) =>
          previousSessions.map((session) => {
            if (session.id !== sessionId) return session;

            const messages = [...session.messages];
            const last = messages[messages.length - 1];

            if (last?.role === "assistant" && !last.content) {
              messages.pop();
            }

            return {
              ...session,
              messages,
              updatedAt: new Date().toISOString(),
            };
          }),
        );
      } else {
        console.error("Chat request failed:", error);

        const errorMessage =
          error.message ||
          "Unable to connect to the backend or Ollama. Please check that both services are running.";

        setSessions((previousSessions) =>
          previousSessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            const messages = [...session.messages];
            const lastMessageIndex = messages.length - 1;
            const lastMessage = messages[lastMessageIndex];

            if (lastMessage?.role === "assistant") {
              messages[lastMessageIndex] = {
                ...lastMessage,
                content: `**Error:** ${errorMessage}`,
              };
            } else {
              messages.push({
                role: "assistant",
                content: `**Error:** ${errorMessage}`,
              });
            }

            return {
              ...session,
              messages,
              updatedAt: new Date().toISOString(),
            };
          }),
        );
      }
    } finally {
      abortRef.current = null; // ← 新增
      setLoading(false);
    }
  };

  // =========================
  // Edit Message
  // =========================

  const handleEditMessage = async (messageIndex, newContent) => {
    const editedText = newContent.trim();

    if (!editedText || loading || !activeSession) {
      return;
    }

    if (abortRef.current) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;

    const updatedMessages = activeSession.messages
      .slice(0, messageIndex)
      .concat({
        role: "user",
        content: editedText,
      });

    setLoading(true);

    setSessions((previousSessions) =>
      previousSessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        return {
          ...session,
          messages: [
            ...updatedMessages,
            {
              role: "assistant",
              content: "",
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    try {
      await streamChatResponse({
        sessionId,
        message: editedText,
        mode: sessionMode,
        model: activeSession.model,
        messages: updatedMessages,
        signal: controller.signal,

        onChunk: (content) => {
          setSessions((previousSessions) =>
            previousSessions.map((session) => {
              if (session.id !== sessionId) {
                return session;
              }

              const messages = [...session.messages];
              const lastMessageIndex = messages.length - 1;
              const lastMessage = messages[lastMessageIndex];

              if (lastMessage?.role !== "assistant") {
                return session;
              }

              messages[lastMessageIndex] = {
                ...lastMessage,
                content: `${lastMessage.content}${content}`,
              };

              return {
                ...session,
                messages,
                updatedAt: new Date().toISOString(),
              };
            }),
          );
        },
      });
    } catch (error) {
      if (controller.signal.aborted) {
        // ← 新增分支
        setSessions((previousSessions) =>
          previousSessions.map((session) => {
            if (session.id !== sessionId) return session;

            const messages = [...session.messages];
            const last = messages[messages.length - 1];

            if (last?.role === "assistant" && !last.content) {
              messages.pop();
            }

            return {
              ...session,
              messages,
              updatedAt: new Date().toISOString(),
            };
          }),
        );
      } else {
        console.error("Edit chat request failed:", error);

        const errorMessage =
          error.message ||
          "Unable to connect to the backend or Ollama. Please check that both services are running.";

        setSessions((previousSessions) =>
          previousSessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            const messages = [...session.messages];
            const lastMessageIndex = messages.length - 1;
            const lastMessage = messages[lastMessageIndex];

            if (lastMessage?.role === "assistant") {
              messages[lastMessageIndex] = {
                ...lastMessage,
                content: `**Error:** ${errorMessage}`,
              };
            }

            return {
              ...session,
              messages,
              updatedAt: new Date().toISOString(),
            };
          }),
        );
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  // =========================
  // Stop Generation
  // =========================

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // =========================
  // Keyboard
  // =========================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <main style={themeStyles.page}>
      <section style={themeStyles.container}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loading}
          theme={theme}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
        />

        <div style={themeStyles.mainContent}>
          <ChatHeader
            activeSession={activeSession}
            loading={loading}
            theme={theme}
            models={models}
            onModeChange={handleModeChange}
            onModelChange={handleModelChange}
            onRenameSession={handleRenameSession}
            onToggleTheme={toggleTheme}
          />

          <div style={themeStyles.messagesArea}>
            <MessageList
              activeSession={activeSession}
              loading={loading}
              chatEndRef={chatEndRef}
              theme={theme}
              onEditMessage={handleEditMessage}
            />
          </div>

          <ChatInput
            input={input}
            loading={loading}
            activeSession={activeSession}
            theme={theme}
            onInputChange={setInput}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            onStop={handleStop}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
