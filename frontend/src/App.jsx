// src/App.jsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Alert } from "@mui/material";

import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import SystemPromptDialog from "./components/SystemPromptDialog";
import RenameDialog from "./components/RenameDialog";
import { getThemeStyles } from "./theme/theme";
import {
  ChatApiError,
  clearChat,
  fetchModels,
  isAbortError,
  streamChat,
} from "./api/chatApi";
import {
  getStorageError,
  setStorageError,
  subscribeStorageError,
} from "./store/storageStatus";
import { readChatState, writeChatState } from "./store/chatStorage";

const STORAGE_KEY = "local_ai_chat_sessions_v2";
const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}_corrupt_backup`;
const THEME_KEY = "local_ai_chat_theme";
const SIDEBAR_KEY = "local_ai_chat_sidebar_collapsed";

const DEFAULT_FILE_PROMPT = "请帮我分析这个文件。";
const NEAR_BOTTOM_PX = 150;
const SHOW_SCROLL_BUTTON_PX = 300;

const DEFAULT_MODELS = {
  chat: "llama3.2:3b",
  code: "qwen2.5-coder:3b",
};

// ========================================
// Identifiers & time helpers
// ========================================

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

// ========================================
// Session & message factories
// ========================================

function createNewSession(mode = "chat") {
  const now = nowIso();
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
  const title = message.slice(0, 12).trim();
  return title || "New Chat";
}

// 将 API 消息转换为发给后端的内容：有附件时把文件内容拼入当前问题
// 注意：每一轮都会重新携带附件内容，保证追问时模型仍能看到文件
function toApiMessage(message) {
  if (message.role === "user" && message.imageBase64) {
    return { role: "user", content: message.content, images: [message.imageBase64] };
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

// 选择本次请求使用的模型：会话模型不在可用列表中时，回退到模式默认模型
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

// ========================================
// Persistence: load & normalize
// ========================================

function normalizeMessage(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.role !== "user" && raw.role !== "assistant") return null;

  const content = typeof raw.content === "string" ? raw.content : "";

  // 上次生成中断留下的空 assistant 消息直接丢弃
  if (raw.role === "assistant" && !content) return null;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createMessageId(),
    role: raw.role,
    content,
    file: typeof raw.file === "string" ? raw.file : undefined,
    fileContent:
      typeof raw.fileContent === "string" ? raw.fileContent : undefined,
    imageBase64: typeof raw.imageBase64 === "string" ? raw.imageBase64 : undefined,
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
    messages,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

// 将损坏的原始数据备份到单独的 key；返回是否备份成功
function backupRawStorage(raw) {
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    return true;
  } catch (error) {
    console.error("Failed to back up corrupted chat data:", error);
    return false;
  }
}

function getInitialChatState(raw) {
  const fallbackSession = createNewSession();
  const fallback = {
    activeSessionId: fallbackSession.id,
    sessions: [fallbackSession],
  };

  if (!raw) {
    return { state: fallback, notice: null, persistBlocked: false };
  }

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse saved chats:", error);
  }

  // JSON 解析失败，或结构不符合预期：视为损坏数据，先备份再回退
  if (!parsed || !Array.isArray(parsed.sessions)) {
    const backedUp = backupRawStorage(raw);
    return {
      state: fallback,
      notice: backedUp
        ? {
            severity: "warning",
            message:
              "检测到损坏的聊天数据，已备份到 localStorage 的 local_ai_chat_sessions_v2_corrupt_backup 中。",
          }
        : {
            severity: "error",
            message:
              "聊天数据已损坏，且备份失败。为避免覆盖原数据，本次不会保存新的聊天记录，请先清理浏览器存储后刷新。",
          },
      persistBlocked: !backedUp,
    };
  }

  const sessions = parsed.sessions.map(normalizeSession).filter(Boolean);

  // 结构正确但没有任何会话：直接使用新会话，不视为损坏
  if (sessions.length === 0) {
    return { state: fallback, notice: null, persistBlocked: false };
  }

  const activeExists = sessions.some(
    (session) => session.id === parsed.activeSessionId,
  );

  return {
    state: {
      activeSessionId: activeExists ? parsed.activeSessionId : sessions[0].id,
      sessions,
    },
    notice: null,
    persistBlocked: false,
  };
}

async function loadChatState() {
  let legacyRaw = null;
  try {
    legacyRaw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Could not access legacy chat storage:", error);
  }

  let stored;
  try {
    stored = await readChatState();
  } catch (error) {
    console.warn("Could not read chats from IndexedDB:", error);
  }

  // A localStorage copy can be a recovery copy left by a previous failed IDB write.
  if (legacyRaw) {
    const legacyState = getInitialChatState(legacyRaw);
    if (legacyState.persistBlocked) return legacyState;
    try {
      await writeChatState(legacyState.state);
      localStorage.removeItem(STORAGE_KEY);
      return legacyState;
    } catch (error) {
      console.warn("Could not migrate chats to IndexedDB; retaining localStorage copy:", error);
      return {
        ...legacyState,
        notice: {
          severity: "warning",
          message: "Chat storage could not be upgraded. Existing chats remain in browser storage.",
        },
      };
    }
  }

  if (stored && Array.isArray(stored.sessions)) {
    return getInitialChatState(JSON.stringify(stored));
  }

  return getInitialChatState(null);
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

// ========================================
// App
// ========================================

function App() {
  const [initialChat] = useState(() => getInitialChatState(null));
  const [chatStorageReady, setChatStorageReady] = useState(false);

  const [theme, setTheme] = useState(getInitialTheme);
  const [sessions, setSessions] = useState(initialChat.state.sessions);
  const [activeSessionId, setActiveSessionId] = useState(
    initialChat.state.activeSessionId,
  );
  const [notice, setNotice] = useState(initialChat.notice);
  const storageError = useSyncExternalStore(
    subscribeStorageError,
    getStorageError,
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  );

  const persistBlockedRef = useRef(initialChat.persistBlocked);
  useEffect(() => {
    let cancelled = false;
    loadChatState().then((loaded) => {
      if (cancelled) return;
      setSessions(loaded.state.sessions);
      setActiveSessionId(loaded.state.activeSessionId);
      if (loaded.notice) setNotice(loaded.notice);
      persistBlockedRef.current = loaded.persistBlocked;
      setChatStorageReady(true);
    }).catch((error) => {
      console.warn("Could not initialize chat storage:", error);
      if (!cancelled) setChatStorageReady(true);
    });
    return () => { cancelled = true; };
  }, []);
  const chatEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const isNearBottomRef = useRef(true);
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

  // Persist chats after streaming settles; initialization prevents overwriting the loaded state.
  useEffect(() => {
    if (!chatStorageReady || loading || persistBlockedRef.current) return;
    const state = { activeSessionId, sessions };
    writeChatState(state).then(() => setStorageError(null)).catch((error) => {
      console.warn("Failed to persist chats in IndexedDB:", error);
      setStorageError("Chat records could not be saved to browser storage.");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (fallbackError) {
        console.warn("Could not save a localStorage recovery copy:", fallbackError);
      }
    });
  }, [activeSessionId, sessions, loading, chatStorageReady]);

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
      // Ignore unavailable localStorage for this nonessential preference.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const controller = new AbortController();

    fetchModels({ signal: controller.signal })
      .then((list) => {
        setModels(list);
      })
      .catch((error) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        console.error("Failed to fetch model list:", error);
        setNotice({
          severity: "warning",
          message:
            error instanceof ChatApiError
              ? `${error.message}（当前无法切换模型）`
              : "无法获取模型列表。",
        });
      });

    return () => controller.abort();
  }, []);

  // 切换会话时，默认认为用户位于底部
  useEffect(() => {
    isNearBottomRef.current = true;
  }, [activeSessionId]);

  // 仅当用户位于底部附近时才自动滚动，避免打断阅读历史消息
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    chatEndRef.current?.scrollIntoView({
      behavior: loading ? "auto" : "smooth",
      block: "end",
    });
  }, [activeSession?.messages, loading]);

  // =========================
  // State helpers
  // =========================

  const patchSession = (sessionId, updater) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? updater(session) : session,
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

  // =========================
  // Session handlers
  // =========================

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

  const handleRenameSession = (sessionId, title) => {
    if (loading) return;
    patchSession(sessionId, (session) => ({
      ...session,
      title,
      updatedAt: nowIso(),
    }));
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
      updatedAt: nowIso(),
    }));
  };

  const handleClearChat = async () => {
    if (loading || !activeSession || activeSession.messages.length === 0) return;
    if (!window.confirm("Clear all messages in this chat?")) return;

    const sessionId = activeSession.id;
    try {
      await clearChat(sessionId);
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
        message: error instanceof Error ? error.message : "Failed to clear chat.",
      });
    }
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
        updatedAt: nowIso(),
      };
    });
  };

  const handleModelChange = (event) => {
    const newModel = event.target.value;
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

  // =========================
  // Generation (shared by send / edit / regenerate)
  // =========================

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
    // 同步设置 abortRef，防止同一帧内的重复调用
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = createMessageId();
    const timestamp = nowIso();

    setLoading(true);
    patchSession(sessionId, (session) => ({
      ...session,
      ...sessionPatch,
      messages: [
        ...baseMessages,
        userMessage,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: timestamp,
        },
      ],
      updatedAt: timestamp,
    }));

    // 将高频 token 合并为每帧一次状态更新，减少重渲染
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
      flushPending();

      if (isAbortError(error) || controller.signal.aborted) {
        // 用户主动停止：移除空的占位消息，保留已生成的部分内容
        patchSession(sessionId, (session) => ({
          ...session,
          messages: session.messages.filter(
            (message) => !(message.id === assistantId && !message.content),
          ),
        }));
      } else {
        console.error("Chat request failed:", error);
        const errorText =
          error instanceof ChatApiError
            ? error.message
            : "发生未知错误，请查看控制台。";

        patchMessage(sessionId, assistantId, (message) => ({
          ...message,
          content: message.content
            ? `${message.content}\n\n**Error:** ${errorText}`
            : `**Error:** ${errorText}`,
        }));
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setLoading(false);
    }
  };

  // =========================
  // Send Message
  // =========================

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

  // =========================
  // Edit & Regenerate
  // =========================

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

    // 编辑时保留原消息的附件，避免文件上下文丢失
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

    // 用户消息的重发按钮传入的是下一条（assistant）索引；assistant 的重生成按钮传入自身索引
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

  // =========================
  // Scroll tracking
  // =========================

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

  // =========================
  // UI
  // =========================

  if (!chatStorageReady) {
    return <main style={themeStyles.page} aria-live="polite">Loading chats…</main>;
  }

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
          onRenameSession={handleRenameSession}
          searchInputRef={searchInputRef}
        />

        <div style={themeStyles.mainContent}>
          {storageError && (
            <Alert
              severity="error"
              onClose={() => setStorageError(null)}
              sx={{ m: 1, mb: 0 }}
            >
              {storageError}
            </Alert>
          )}

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
            models={models}
            onToggleSidebar={toggleSidebar}
            onModeChange={handleModeChange}
            onModelChange={handleModelChange}
            onRenameSession={handleOpenRename}
            onToggleTheme={toggleTheme}
            onOpenSystemPrompt={handleOpenSystemPrompt}
            onClearChat={handleClearChat}
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
                onAttachFile={setAttachedFile}
                onRemoveFile={() => setAttachedFile(null)}
                onInputChange={setInput}
                onSendMessage={handleSendMessage}
                onStop={handleStop}
                onSelectPromptTemplate={handleSelectPromptTemplate}
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
        />

        <RenameDialog
          key={`rename-${activeSession?.id}-${isRenameOpen ? "open" : "closed"}`}
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
