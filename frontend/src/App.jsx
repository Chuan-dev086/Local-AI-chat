import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

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
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeSession?.messages, loading]);

  const toggleTheme = () => {
    setTheme((previousTheme) => (previousTheme === "light" ? "dark" : "light"));
  };

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

          <MessageList
            activeSession={activeSession}
            loading={loading}
            chatEndRef={chatEndRef}
            theme={theme}
          />

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
