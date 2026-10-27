import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import SystemPromptDialog from "./components/SystemPromptDialog";
import RenameDialog from "./components/RenameDialog";
import { getThemeStyles } from "./theme/theme";

const API_BASE = "http://localhost:5000/api";
const API_URL = `${API_BASE}/chat`;
const MODELS_API_URL = `${API_BASE}/models`;
const STORAGE_KEY = "local_ai_chat_sessions_v2";
const THEME_KEY = "local_ai_chat_theme";
const SIDEBAR_KEY = "local_ai_chat_sidebar_collapsed";

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
    systemPrompt: "",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function getTitleFromMessage(message) {
  const cleanMessage = message.replace(/\s+/g, " ").trim();
  if (!cleanMessage) return "New Chat";
  const maxLength = 36;
  if (cleanMessage.length <= maxLength) return cleanMessage;
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
    if (!savedData) return fallbackState;

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
        model: session.model || DEFAULT_MODELS[safeMode],
        systemPrompt:
          typeof session.systemPrompt === "string" ? session.systemPrompt : "",
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
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
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
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });

  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const searchInputRef = useRef(null);

  const themeStyles = getThemeStyles(theme);

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId],
  );

  // =========================
  // Effects
  // =========================

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeSessionId, sessions }),
    );
  }, [activeSessionId, sessions]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
    } catch {
      // 忽略写入错误（例如隐私模式禁止 localStorage）
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    let cancelled = false;
    const fetchModels = async () => {
      try {
        const response = await fetch(MODELS_API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data.models)) setModels(data.models);
      } catch (error) {
        console.error("Failed to fetch model list:", error);
      }
    };
    fetchModels();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeSession?.messages, loading]);

  // =========================
  // Handlers
  // =========================

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const updateActiveSession = (updater) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id !== activeSessionId) return session;
        return updater(session);
      }),
    );
  };

  const handleNewChat = () => {
    if (loading) return;
    const newSession = createNewSession(activeSession?.mode || "chat");
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput("");
  };

  const handleSelectSession = (sessionId) => {
    if (loading) return;
    setActiveSessionId(sessionId);
    setInput("");
  };

  const handleDeleteSession = (event, sessionId) => {
    event.stopPropagation();
    if (loading) return;

    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    if (!window.confirm(`Delete "${sessionToDelete?.title || "this chat"}"?`))
      return;

    const remainingSessions = sessions.filter((s) => s.id !== sessionId);
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

  const handleOpenRename = () => {
    if (loading || !activeSession) return;
    setIsRenameOpen(true);
  };

  const handleSaveRename = (newTitle) => {
    updateActiveSession((session) => ({
      ...session,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleModeChange = (event) => {
    const newMode = event.target.value;
    updateActiveSession((session) => {
      const oldDefault = DEFAULT_MODELS[session.mode];
      const usingOldDefault = !session.model || session.model === oldDefault;
      return {
        ...session,
        mode: newMode,
        model: usingOldDefault ? DEFAULT_MODELS[newMode] : session.model,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleModelChange = (event) => {
    const newModel = event.target.value;
    updateActiveSession((session) => ({
      ...session,
      model: newModel,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleOpenSystemPrompt = () => {
    if (loading) return;
    setIsSystemPromptOpen(true);
  };

  const handleCloseSystemPrompt = () => setIsSystemPromptOpen(false);

  const handleSaveSystemPrompt = (text) => {
    updateActiveSession((session) => ({
      ...session,
      systemPrompt: text,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // =========================
  // Streaming Helper
  // =========================

  const streamChatResponse = async ({
    sessionId,
    message,
    mode,
    model,
    systemPrompt,
    messages,
    onChunk,
    signal,
  }) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message,
        mode,
        model,
        systemPrompt,
        messages,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = "Unable to connect to the backend or Ollama.";
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage = errorData.error;
      } catch {
        // 如果解析 JSON 失败，就保留默认的 errorMessage
      }
      throw new Error(errorMessage);
    }

    if (!response.body)
      throw new Error("Streaming response is not supported by this browser.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finished = false;

    while (!finished) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        try {
          const data = JSON.parse(trimmedLine);
          if (data.error) throw new Error(data.error);
          if (data.content) onChunk(data.content);
          if (data.done) {
            finished = true;
            break;
          }
        } catch (error) {
          console.error("Failed to parse streaming chunk:", error);
        }
      }
    }

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());
        if (data.error) throw new Error(data.error);
        if (data.content) onChunk(data.content);
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
    if ((!userText && !attachedFile) || loading || !activeSession) return;
    if (abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;

    // 构造 UI 显示的消息对象
    const userMessage = {
      role: "user",
      content: userText || "请帮我分析这个文件。",
      file: attachedFile?.name,
      createdAt: new Date().toISOString(),
    };

    // 清理历史消息中的 file 标识，只保留纯文本发给 AI
    const cleanHistory = activeSession.messages.map((msg) => {
      if (msg.role === "user") return { role: "user", content: msg.content };
      return msg;
    });

    // 构造发给后端的强提示（如果有附件）
    let textToSend = userText;
    if (attachedFile) {
      textToSend = `[SYSTEM NOTE: The user has uploaded a file named "${attachedFile.name}". Here is the file content:]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n[User Question]:\n${userText || "Please analyze this file."}`;
    }

    const conversationMessages = [
      ...cleanHistory,
      { role: "user", content: textToSend },
    ];

    setInput("");
    setAttachedFile(null);
    setLoading(true);

    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          title:
            session.messages.length === 0
              ? getTitleFromMessage(userMessage.content)
              : session.title,
          messages: [
            ...session.messages,
            userMessage,
            {
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    try {
      await streamChatResponse({
        sessionId,
        message: textToSend,
        mode: sessionMode,
        model: activeSession.model,
        systemPrompt: activeSession.systemPrompt,
        messages: conversationMessages,
        signal: controller.signal,
        onChunk: (content) => {
          setSessions((prevSessions) =>
            prevSessions.map((session) => {
              if (session.id !== sessionId) return session;
              const messages = [...session.messages];
              const lastMessageIndex = messages.length - 1;
              const lastMessage = messages[lastMessageIndex];
              if (lastMessage?.role !== "assistant") return session;
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
        setSessions((prevSessions) =>
          prevSessions.map((session) => {
            if (session.id !== sessionId) return session;
            const messages = [...session.messages];
            const last = messages[messages.length - 1];
            if (last?.role === "assistant" && !last.content) messages.pop();
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
          error.message || "Unable to connect to the backend or Ollama.";
        setSessions((prevSessions) =>
          prevSessions.map((session) => {
            if (session.id !== sessionId) return session;
            const messages = [...session.messages];
            const lastIdx = messages.length - 1;
            if (messages[lastIdx]?.role === "assistant") {
              messages[lastIdx] = {
                ...messages[lastIdx],
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
      abortRef.current = null;
      setLoading(false);
    }
  };

  // =========================
  // Edit & Regenerate
  // =========================

  const handleEditMessage = async (messageIndex, newContent) => {
    const editedText = newContent.trim();
    if (!editedText || loading || !activeSession) return;
    if (abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;

    const updatedMessages = activeSession.messages
      .slice(0, messageIndex)
      .concat({
        role: "user",
        content: editedText,
        createdAt: new Date().toISOString(),
      });

    setLoading(true);

    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          messages: [
            ...updatedMessages,
            {
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString(),
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
        systemPrompt: activeSession.systemPrompt,
        messages: updatedMessages,
        signal: controller.signal,
        onChunk: (content) => {
          setSessions((prevSessions) =>
            prevSessions.map((session) => {
              if (session.id !== sessionId) return session;
              const messages = [...session.messages];
              const lastIdx = messages.length - 1;
              const last = messages[lastIdx];
              if (last?.role !== "assistant") return session;
              messages[lastIdx] = {
                ...last,
                content: `${last.content}${content}`,
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
        setSessions((prevSessions) =>
          prevSessions.map((session) => {
            if (session.id !== sessionId) return session;
            const messages = [...session.messages];
            const last = messages[messages.length - 1];
            if (last?.role === "assistant" && !last.content) messages.pop();
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
          error.message || "Unable to connect to the backend or Ollama.";
        setSessions((prevSessions) =>
          prevSessions.map((session) => {
            if (session.id !== sessionId) return session;
            const messages = [...session.messages];
            const lastIdx = messages.length - 1;
            if (messages[lastIdx]?.role === "assistant") {
              messages[lastIdx] = {
                ...messages[lastIdx],
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

  const handleRegenerate = (assistantIndex) => {
    if (loading || !activeSession || abortRef.current) return;
    const messages = activeSession.messages;
    const userIndex = assistantIndex - 1;
    if (userIndex < 0) return;

    let targetUserIndex = userIndex;
    if (messages[assistantIndex]?.role === "user")
      targetUserIndex = assistantIndex;

    const userMessage = messages[targetUserIndex];
    if (!userMessage || userMessage.role !== "user") return;

    const isLastMessage = targetUserIndex === messages.length - 2;
    if (!isLastMessage) {
      if (
        !window.confirm(
          "Regenerating this will remove all messages after it. Continue?",
        )
      )
        return;
    }
    handleEditMessage(targetUserIndex, userMessage.content);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // =========================
  // Global Shortcuts
  // =========================

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        if (sidebarCollapsed) {
          setSidebarCollapsed(false);
          setTimeout(() => searchInputRef.current?.focus(), 260);
        } else {
          searchInputRef.current?.focus();
        }
        return;
      }

      const isTyping = ["INPUT", "TEXTAREA"].includes(
        document.activeElement.tagName,
      );
      if (isTyping && e.key !== "Escape") return;

      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewChat();
      }

      if (e.key === "Escape") {
        if (loading) handleStop();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleGlobalKeyDown, {
        capture: true,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sidebarCollapsed]);

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
          collapsed={sidebarCollapsed}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleOpenRename}
          searchInputRef={searchInputRef}
        />

        <div style={themeStyles.mainContent}>
          <ChatHeader
            activeSession={activeSession}
            loading={loading}
            theme={theme}
            models={models}
            onToggleSidebar={toggleSidebar}
            onModeChange={handleModeChange}
            onModelChange={handleModelChange}
            onRenameSession={handleOpenRename}
            onToggleTheme={toggleTheme}
            onOpenSystemPrompt={handleOpenSystemPrompt}
          />

          <div
            style={themeStyles.messagesArea}
            id="chat-scroll-container"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.target;
              setShowScrollBottom(
                scrollHeight - scrollTop - clientHeight > 300,
              );
            }}
          >
            <div style={themeStyles.messagesInner}>
              <MessageList
                activeSession={activeSession}
                loading={loading}
                chatEndRef={chatEndRef}
                theme={theme}
                onEditMessage={handleEditMessage}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>

          {showScrollBottom && (
            <button
              onClick={() => {
                const container = document.getElementById(
                  "chat-scroll-container",
                );
                if (container)
                  container.scrollTo({
                    top: container.scrollHeight,
                    behavior: "smooth",
                  });
              }}
              style={{
                position: "absolute",
                bottom: "120px",
                right: "calc(50% - 410px)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: themeStyles.colors?.containerBg || "#fff",
                border: `1px solid ${themeStyles.colors?.border || "#cbd5e1"}`,
                color: themeStyles.colors?.text || "#000",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                transition: "all 0.2s ease",
              }}
              title="Scroll to bottom"
            >
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>↓</span>
            </button>
          )}

          <div style={themeStyles.inputArea}>
            <div style={themeStyles.inputInner}>
              <ChatInput
                input={input}
                loading={loading}
                activeSession={activeSession}
                theme={theme}
                attachedFile={attachedFile}
                onAttachFile={setAttachedFile}
                onRemoveFile={() => setAttachedFile(null)}
                onInputChange={setInput}
                onKeyDown={handleKeyDown}
                onSendMessage={handleSendMessage}
                onStop={handleStop}
              />
            </div>
          </div>
        </div>

        <SystemPromptDialog
          key={`${activeSession?.id}-${isSystemPromptOpen ? "open" : "closed"}`}
          open={isSystemPromptOpen}
          initialValue={activeSession?.systemPrompt || ""}
          mode={activeSession?.mode || "chat"}
          theme={theme}
          onClose={handleCloseSystemPrompt}
          onSave={handleSaveSystemPrompt}
        />

        <RenameDialog
          key={`${activeSession?.id}-${isRenameOpen ? "open" : "closed"}`}
          open={isRenameOpen}
          initialTitle={activeSession?.title || ""}
          theme={theme}
          onClose={() => setIsRenameOpen(false)}
          onSave={handleSaveRename}
        />
      </section>
    </main>
  );
}

export default App;
