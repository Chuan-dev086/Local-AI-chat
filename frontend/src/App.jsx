// src/App.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ThemeProvider, createTheme } from "@mui/material";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import SystemPromptDialog from "./components/SystemPromptDialog";
import PromptManagerDialog from "./components/PromptManagerDialog";
import { getThemeStyles } from "./theme/theme";
import {
  API_BASE,
  ChatApiError,
  clearChat,
  fetchModels,
  isAbortError,
  streamChat,
  syncSessionMessages,
} from "./api/chatApi";
import { useCustomPrompts } from "./hooks/useCustomPrompts";

const THEME_KEY = "local_ai_chat_theme";
const SIDEBAR_KEY = "local_ai_chat_sidebar_collapsed";

const DEFAULT_FILE_PROMPT = "请帮我分析这个文件。";
const NEAR_BOTTOM_PX = 150;
const SHOW_SCROLL_BUTTON_PX = 300;

const DEFAULT_MODELS = {
  chat: "llama3.2:3b",
  code: "qwen3:4b-instruct-2507-q4_K_M",
};

function randomSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createMessageId() {
  return `msg_${globalThis.crypto?.randomUUID?.() ?? randomSuffix()}`;
}

function generateSessionId() {
  return `session_${globalThis.crypto?.randomUUID?.() ?? randomSuffix()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function sortSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return [...sessions].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return b.isPinned ? 1 : -1;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function createNewSession(mode = "chat") {
  const now = nowIso();
  return {
    id: generateSessionId(),
    title: "New Chat",
    mode,
    model: DEFAULT_MODELS[mode] || DEFAULT_MODELS.chat,
    systemPrompt: "",
    messages: [],
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

function getTitleFromMessage(message) {
  const title = message.slice(0, 12).trim();
  return title || "New Chat";
}

function toApiMessage(message) {
  if (message.role === "user" && message.imageBase64) {
    return {
      role: "user",
      content: message.content,
      images: [message.imageBase64],
    };
  }
  if (message.role !== "user" || !message.file || !message.fileContent) {
    return { role: message.role, content: message.content };
  }

  return {
    role: "user",
    content:
      `[SYSTEM NOTE: The user has uploaded a file named "${message.file}". Here is the file content:]\n` +
      `\`\`\`\n${message.fileContent}\n\`\`\`\n\n` +
      `[User Question]:\n${message.content}`,
  };
}

function resolveSessionModel(sessionModel, mode, availableModels) {
  if (availableModels.length === 0 || availableModels.includes(sessionModel)) {
    return { model: sessionModel || DEFAULT_MODELS[mode], changed: false };
  }

  const preferred = DEFAULT_MODELS[mode];
  const model = availableModels.includes(preferred)
    ? preferred
    : availableModels[0];

  return { model, changed: true };
}

function normalizeMessage(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.role !== "user" && raw.role !== "assistant") return null;

  const content = typeof raw.content === "string" ? raw.content : "";
  if (raw.role === "assistant" && !content) return null;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createMessageId(),
    role: raw.role,
    content,
    file: typeof raw.file === "string" ? raw.file : undefined,
    fileContent:
      typeof raw.fileContent === "string" ? raw.fileContent : undefined,
    imageBase64:
      typeof raw.imageBase64 === "string" ? raw.imageBase64 : undefined,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

function normalizeSession(raw) {
  if (!raw || typeof raw !== "object") return null;

  const mode = raw.mode === "code" ? "code" : "chat";
  const messages = Array.isArray(raw.messages)
    ? raw.messages.map(normalizeMessage).filter(Boolean)
    : [];

  const now = nowIso();

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : generateSessionId(),
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title
        : "New Chat",
    mode,
    model:
      typeof raw.model === "string" && raw.model
        ? raw.model
        : DEFAULT_MODELS[mode],
    systemPrompt: typeof raw.systemPrompt === "string" ? raw.systemPrompt : "",
    isPinned: Boolean(raw.isPinned),
    messages,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
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

function getInitialSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  } catch {
    return false;
  }
}

function App() {
  const [chatStorageReady, setChatStorageReady] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [notice, setNotice] = useState(null);

  const {
    prompts: customPrompts,
    addPrompt,
    updatePrompt,
    deletePrompt,
  } = useCustomPrompts();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/sessions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sessions from server.");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = (data.sessions || [])
          .map(normalizeSession)
          .filter(Boolean);
        if (normalized.length > 0) {
          const sorted = sortSessions(normalized);
          setSessions(sorted);
          setActiveSessionId(sorted[0].id);
        } else {
          const defaultSession = createNewSession();
          setSessions([defaultSession]);
          setActiveSessionId(defaultSession.id);
          fetch(`${API_BASE}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(defaultSession),
          }).catch(console.error);
        }
        setChatStorageReady(true);
      })
      .catch((error) => {
        console.warn("Could not load sessions from backend:", error);
        if (!cancelled) {
          setNotice({
            severity: "error",
            message: "无法连接到后端数据库，请确认后端已启动。",
          });
          const fallback = createNewSession();
          setSessions([fallback]);
          setActiveSessionId(fallback.id);
          setChatStorageReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const chatEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const abortRef = useRef(null);
  const searchInputRef = useRef(null);

  const themeStyles = getThemeStyles(theme);

  // 👈 全局生成 MUI 主题
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme === "dark" ? "dark" : "light",
          primary: { main: "#4f46e5" },
        },
      }),
    [theme],
  );

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId],
  );

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!loading) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

  useEffect(() => {
    const controller = new AbortController();

    fetchModels({ signal: controller.signal })
      .then((list) => {
        setModels(list);
      })
      .catch((error) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        console.error("Failed to fetch model list:", error);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    isNearBottomRef.current = true;
  }, [activeSessionId]);

  useEffect(() => {
    if (!isNearBottomRef.current) return;
    chatEndRef.current?.scrollIntoView({
      behavior: loading ? "auto" : "smooth",
      block: "end",
    });
  }, [activeSession?.messages, loading]);

  const patchSession = (sessionId, updater) => {
    setSessions((prevSessions) =>
      sortSessions(
        prevSessions.map((session) =>
          session.id === sessionId ? updater(session) : session,
        ),
      ),
    );
  };

  const patchMessage = (sessionId, messageId, updater) => {
    patchSession(sessionId, (session) => ({
      ...session,
      messages: session.messages.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    }));
  };

  const updateActiveSession = (updater) => {
    patchSession(activeSessionId, updater);
  };

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const handleNewChat = async () => {
    if (loading) return;
    const newSession = createNewSession(activeSession?.mode || "chat");

    try {
      await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
    } catch (error) {
      console.error("Failed to create session on backend:", error);
    }

    setSessions((prev) => sortSessions([newSession, ...prev]));
    setActiveSessionId(newSession.id);
    setInput("");
  };

  const handleSelectSession = (sessionId) => {
    if (loading) return;
    setActiveSessionId(sessionId);
    setInput("");
  };

  const handleRenameSession = async (sessionId, title) => {
    if (loading) return;
    try {
      await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    } catch (error) {
      console.error("Failed to rename session on backend:", error);
    }

    patchSession(sessionId, (session) => ({
      ...session,
      title,
      updatedAt: nowIso(),
    }));
  };

  const handleDeleteSession = async (event, sessionId) => {
    event.stopPropagation();
    if (loading) return;

    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    if (!window.confirm(`Delete "${sessionToDelete?.title || "this chat"}"?`))
      return;

    try {
      await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete session on backend:", error);
    }

    const remainingSessions = sessions.filter((s) => s.id !== sessionId);
    if (remainingSessions.length === 0) {
      const newSession = createNewSession();
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      setInput("");
      fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      }).catch(console.error);
      return;
    }

    setSessions(sortSessions(remainingSessions));
    if (sessionId === activeSessionId) {
      setActiveSessionId(remainingSessions[0].id);
      setInput("");
    }
  };

  const handleTogglePin = async (sessionId, newPinStatus) => {
    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: newPinStatus }),
      });

      if (!response.ok) throw new Error("Failed to update pin status.");

      setSessions((prevSessions) => {
        const updated = prevSessions.map((s) =>
          s.id === sessionId ? { ...s, isPinned: newPinStatus } : s,
        );
        return sortSessions(updated);
      });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      setNotice({ severity: "error", message: "Failed to update pin status." });
    }
  };

  const handleOpenRename = () => {
    if (loading || !activeSession) return;
    setIsRenaming(true); // 👈 直接触发原地编辑
  };

  // 👈 修复 2：Clear all chats 接入后端 DELETE /api/sessions 接口
  const handleClearAllChats = async () => {
    if (loading) return;
    if (!window.confirm("确定要清空所有聊天记录吗？此操作不可逆。")) return;

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear sessions.");

      const freshSession = createNewSession();
      await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshSession),
      });

      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
      setInput("");
      setNotice({ severity: "success", message: "All chats cleared." });
    } catch (error) {
      console.error("Failed to clear all chats:", error);
      setNotice({ severity: "error", message: "Failed to clear chats." });
    }
  };

  const handleClearChat = async () => {
    if (loading || !activeSession || activeSession.messages.length === 0)
      return;
    if (!window.confirm("Clear all messages in this chat?")) return;

    const sessionId = activeSession.id;
    try {
      await clearChat(sessionId);
      await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const freshSession = createNewSession(activeSession.mode);
      freshSession.id = sessionId;
      await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshSession),
      });

      patchSession(sessionId, (session) => ({
        ...session,
        title: "New Chat",
        messages: [],
        updatedAt: nowIso(),
      }));
      setInput("");
      setNotice({ severity: "success", message: "Chat cleared." });
    } catch (error) {
      setNotice({
        severity: "error",
        message:
          error instanceof Error ? error.message : "Failed to clear chat.",
      });
    }
  };

  // 👈 修复 1：模型与模式切换持久化到后端
  const handleModeChange = async (event) => {
    const newMode = event.target.value;
    const oldDefault = DEFAULT_MODELS[activeSession.mode];
    const usingOldDefault =
      !activeSession.model || activeSession.model === oldDefault;
    const newModel = usingOldDefault
      ? DEFAULT_MODELS[newMode]
      : activeSession.model;

    try {
      await fetch(`${API_BASE}/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode, model: newModel }),
      });
    } catch (error) {
      console.error("Failed to persist mode change:", error);
    }

    updateActiveSession((session) => ({
      ...session,
      mode: newMode,
      model: newModel,
      updatedAt: nowIso(),
    }));
  };

  const handleModelChange = async (event) => {
    const newModel = event.target.value;

    try {
      await fetch(`${API_BASE}/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: newModel }),
      });
    } catch (error) {
      console.error("Failed to persist model change:", error);
    }

    updateActiveSession((session) => ({
      ...session,
      model: newModel,
      updatedAt: nowIso(),
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
      updatedAt: nowIso(),
    }));
  };

  const handleSelectPromptTemplate = (prompt) => {
    if (loading || !activeSession) return;
    updateActiveSession((session) => ({
      ...session,
      systemPrompt: prompt,
      updatedAt: nowIso(),
    }));
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const startGeneration = async ({
    sessionId,
    baseMessages,
    userMessage,
    mode,
    model,
    systemPrompt,
    apiMessages,
    requestContent,
    sessionPatch = {},
  }) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = createMessageId();
    const timestamp = nowIso();
    const assistantPlaceholder = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: timestamp,
    };

    // 前端持久化的"真相"数组：Stop / 出错时都会移除 assistant
    let finalMessages = [...baseMessages, userMessage, assistantPlaceholder];

    // 👈 恢复：把 title / model fallback 持久化到后端
    const metaPatch = {};
    if (sessionPatch.title && baseMessages.length === 0) {
      metaPatch.title = sessionPatch.title;
    }
    if (sessionPatch.model) {
      metaPatch.model = sessionPatch.model;
    }
    if (Object.keys(metaPatch).length > 0) {
      fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPatch),
      }).catch((err) => console.error("Failed to persist session meta:", err));
    }

    setLoading(true);
    patchSession(sessionId, (session) => ({
      ...session,
      ...sessionPatch,
      messages: finalMessages,
      updatedAt: timestamp,
    }));

    let pending = "";
    let frameId = null;

    const flushPending = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (!pending) return;
      const text = pending;
      pending = "";
      patchMessage(sessionId, assistantId, (message) => ({
        ...message,
        content: message.content + text,
      }));
      finalMessages = finalMessages.map((m) =>
        m.id === assistantId ? { ...m, content: m.content + text } : m,
      );
    };

    const scheduleFlush = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        frameId = null;
        flushPending();
      });
    };

    try {
      await streamChat({
        sessionId,
        message: requestContent,
        mode,
        model,
        systemPrompt,
        messages: apiMessages,
        signal: controller.signal,
        onChunk: (chunk) => {
          pending += chunk;
          scheduleFlush();
        },
      });
      flushPending();
    } catch (error) {
      // 1. 无论发生什么，先把缓存里还没刷新的字刷进去
      flushPending();

      if (isAbortError(error) || controller.signal.aborted) {
        // 2. 如果是用户主动 Stop
        // 检查有没有生成任何内容，如果完全空白，才清掉 UI
        const currentAssistant = finalMessages.find(
          (m) => m.id === assistantId,
        );
        if (!currentAssistant || !currentAssistant.content.trim()) {
          finalMessages = finalMessages.filter((m) => m.id !== assistantId);
          patchSession(sessionId, (session) => ({
            ...session,
            messages: session.messages.filter((m) => m.id !== assistantId),
          }));
        }
        // 如果已经有内容，就保留（不再删除）
      } else {
        // 3. 如果是真错误：UI 里移除 assistant，顶部 Alert 提示
        finalMessages = finalMessages.filter((m) => m.id !== assistantId);
        patchSession(sessionId, (session) => ({
          ...session,
          messages: session.messages.filter((m) => m.id !== assistantId),
        }));

        console.error("Chat request failed:", error);
        const errorText =
          error instanceof ChatApiError
            ? error.message
            : "发生未知错误，请查看控制台。";
        setNotice({ severity: "error", message: errorText });
      }
    } finally {
      // 4. 无论成功、Stop、还是出错，最终都同步给后端
      // 注意：如果是 Stop 且完全没生成内容，finalMessages 里没有 assistant，后端接口也会自动过滤掉
      syncSessionMessages(sessionId, finalMessages).catch((err) =>
        console.error("Failed to sync messages:", err),
      );

      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const userText = input.trim();
    if ((!userText && !attachedFile) || loading || !activeSession) return;
    if (abortRef.current) return;

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;
    const baseMessages = activeSession.messages;

    const { model, changed } = resolveSessionModel(
      activeSession.model,
      sessionMode,
      models,
    );

    const userMessage = {
      id: createMessageId(),
      role: "user",
      content: userText || DEFAULT_FILE_PROMPT,
      file: attachedFile?.name,
      fileContent: attachedFile?.content,
      imageBase64: attachedFile?.imageBase64,
      mimeType: attachedFile?.mimeType,
      createdAt: nowIso(),
    };

    const apiMessages = [...baseMessages, userMessage].map(toApiMessage);
    const requestContent = toApiMessage(userMessage).content;

    const sessionPatch = {
      title:
        baseMessages.length === 0
          ? getTitleFromMessage(userMessage.content)
          : activeSession.title,
    };

    if (changed) {
      sessionPatch.model = model;
      setNotice({
        severity: "info",
        message: `模型 "${activeSession.model}" 不可用，已切换为 "${model}"。`,
      });
    }

    setInput("");
    setAttachedFile(null);

    await startGeneration({
      sessionId,
      baseMessages,
      userMessage,
      mode: sessionMode,
      model,
      systemPrompt: activeSession.systemPrompt,
      apiMessages,
      requestContent,
      sessionPatch,
    });
  };

  const handleEditMessage = async (messageIndex, newContent) => {
    const editedText = newContent.trim();
    if (!editedText || loading || !activeSession) return;
    if (abortRef.current) return;

    const original = activeSession.messages[messageIndex];
    if (!original || original.role !== "user") return;

    const sessionId = activeSession.id;
    const sessionMode = activeSession.mode;
    const baseMessages = activeSession.messages.slice(0, messageIndex);

    const { model, changed } = resolveSessionModel(
      activeSession.model,
      sessionMode,
      models,
    );

    const userMessage = {
      id: createMessageId(),
      role: "user",
      content: editedText,
      file: original.file,
      fileContent: original.fileContent,
      imageBase64: original.imageBase64,
      mimeType: original.mimeType,
      createdAt: nowIso(),
    };

    const apiMessages = [...baseMessages, userMessage].map(toApiMessage);
    const requestContent = toApiMessage(userMessage).content;

    const sessionPatch = {};
    if (changed) {
      sessionPatch.model = model;
      setNotice({
        severity: "info",
        message: `模型 "${activeSession.model}" 不可用，已切换为 "${model}"。`,
      });
    }

    await startGeneration({
      sessionId,
      baseMessages,
      userMessage,
      mode: sessionMode,
      model,
      systemPrompt: activeSession.systemPrompt,
      apiMessages,
      requestContent,
      sessionPatch,
    });
  };

  const handleRegenerate = (assistantIndex) => {
    if (loading || !activeSession || abortRef.current) return;
    const messages = activeSession.messages;

    let targetUserIndex;
    if (messages[assistantIndex]?.role === "user") {
      targetUserIndex = assistantIndex;
    } else {
      targetUserIndex = assistantIndex - 1;
    }

    if (targetUserIndex < 0) return;

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
        document.activeElement?.tagName,
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

  const handleMessagesScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_PX;
    setShowScrollBottom(distanceFromBottom > SHOW_SCROLL_BUTTON_PX);
  };

  const scrollToBottom = () => {
    const container = messagesAreaRef.current;
    if (!container) return;
    isNearBottomRef.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  };

  if (!chatStorageReady) {
    return (
      <main style={themeStyles.page} aria-live="polite">
        Loading chats from MongoDB…
      </main>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
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
            onRenameSession={handleRenameSession}
            onTogglePin={handleTogglePin}
            onClearAllChats={handleClearAllChats} // 👈 传入清空所有会话的回调
            searchInputRef={searchInputRef}
          />

          <div style={themeStyles.mainContent}>
            {notice && (
              <Alert
                severity={notice.severity}
                onClose={() => setNotice(null)}
                sx={{ m: 1, mb: 0 }}
              >
                {notice.message}
              </Alert>
            )}

            <ChatHeader
              activeSession={activeSession}
              loading={loading}
              theme={theme}
              onToggleSidebar={toggleSidebar}
              onRenameSession={handleRenameSession}
              onToggleTheme={toggleTheme}
              isRenaming={isRenaming}
              setIsRenaming={setIsRenaming}
            />

            <div
              ref={messagesAreaRef}
              style={themeStyles.messagesArea}
              id="chat-scroll-container"
              onScroll={handleMessagesScroll}
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
                type="button"
                onClick={scrollToBottom}
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
                  models={models}
                  customPrompts={customPrompts}
                  onAttachFile={setAttachedFile}
                  onRemoveFile={() => setAttachedFile(null)}
                  onInputChange={setInput}
                  onSendMessage={handleSendMessage}
                  onStop={handleStop}
                  onModelChange={handleModelChange}
                  onModeChange={handleModeChange}
                  onRenameSession={handleOpenRename}
                  onOpenSystemPrompt={handleOpenSystemPrompt}
                  onClearChat={handleClearChat}
                  onSelectPromptTemplate={handleSelectPromptTemplate}
                  onOpenPromptManager={() => setIsPromptManagerOpen(true)}
                />
              </div>
            </div>
          </div>

          <SystemPromptDialog
            key={`system-prompt-${activeSession?.id}-${isSystemPromptOpen ? "open" : "closed"}`}
            open={isSystemPromptOpen}
            initialValue={activeSession?.systemPrompt || ""}
            mode={activeSession?.mode || "chat"}
            theme={theme}
            onClose={handleCloseSystemPrompt}
            onSave={handleSaveSystemPrompt}
            onSaveAsTemplate={addPrompt}
          />

          <PromptManagerDialog
            open={isPromptManagerOpen}
            theme={theme}
            customPrompts={customPrompts}
            onAdd={addPrompt}
            onUpdate={updatePrompt}
            onDelete={deletePrompt}
            onClose={() => setIsPromptManagerOpen(false)}
          />
        </section>
      </main>
    </ThemeProvider>
  );
}

export default App;
