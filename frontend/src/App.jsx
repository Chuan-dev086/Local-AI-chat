import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { getThemeStyles } from "./theme/theme";

const API_URL = "http://localhost:5000/api/chat";
const STORAGE_KEY = "local_ai_chat_sessions_v2";
const THEME_KEY = "local_ai_chat_theme";

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

  const chatEndRef = useRef(null);

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

    updateActiveSession((session) => ({
      ...session,
      mode: newMode,
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
    messages,
    onChunk,
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
        messages,
      }),
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
        messages: conversationMessages,

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
    } finally {
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

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;

    const updatedMessages = activeSession.messages
      .slice(0, messageIndex)
      .concat({
        role: "user",
        content: editedText,
      });

    setLoading(true);

    // Replace old conversation with edited message
    // and prepare an empty assistant message
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
        messages: updatedMessages,

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
    } finally {
      setLoading(false);
    }
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
            onModeChange={handleModeChange}
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
          />
        </div>
      </section>
    </main>
  );
}

export default App;
