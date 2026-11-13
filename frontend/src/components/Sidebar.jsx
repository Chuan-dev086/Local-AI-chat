// src/components/Sidebar.jsx

import { useRef, useState, useMemo } from "react";
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { Search, PushPin, PushPinOutlined } from "@mui/icons-material";
import { getSidebarStyles, getThemeStyles } from "../theme/theme";

// 辅助函数：转义正则特殊字符，防止搜索时输入特殊符号导致报错
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 高亮组件
const HighlightText = ({ text, highlight, isDark }) => {
  if (!highlight.trim()) return <span>{text}</span>;

  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={i}
            style={{
              backgroundColor: isDark ? "#854d0e" : "#fef08a",
              color: isDark ? "#fef08a" : "#854d0e",
              borderRadius: 2,
              padding: "0 2px",
            }}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
};

function Sidebar({
  sessions,
  activeSessionId,
  loading,
  theme,
  collapsed,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onTogglePin,
  onClearAllChats,
  searchInputRef,
}) {
  const styles = getSidebarStyles(theme, collapsed);
  const { colors, isDark } = getThemeStyles(theme); // 确保拿到 isDark 用于高亮颜色

  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const renameInputRef = useRef(null);

  const startRename = (event, session) => {
    event.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  };

  const finishRename = (sessionId) => {
    const title = editingTitle.trim();
    setEditingSessionId(null);
    if (
      title &&
      title !== sessions.find((session) => session.id === sessionId)?.title
    ) {
      onRenameSession?.(sessionId, title);
    }
  };

  // 核心搜索逻辑：匹配标题和消息内容
  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sessions.map((s) => ({ ...s, matchedMessages: [] }));
    }

    return sessions
      .map((session) => {
        const titleMatch = session.title.toLowerCase().includes(query);

        // 找到包含关键词的消息（最多取前3条用于展示摘要）
        const matchedMessages = session.messages
          .filter((m) => m.content.toLowerCase().includes(query))
          .slice(0, 3);

        // 只要标题匹配或消息内容匹配，就保留该会话
        if (titleMatch || matchedMessages.length > 0) {
          return { ...session, matchedMessages };
        }
        return null;
      })
      .filter(Boolean);
  }, [sessions, searchQuery]);

  return (
    <aside style={styles.aside}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <h2 style={styles.title}>Local AI Chat</h2>

          <Button
            type="button"
            onClick={onNewChat}
            disabled={loading}
            variant="contained"
            fullWidth
            sx={styles.newChatBtnSx(loading)}
          >
            + New Chat
          </Button>

          <Box sx={{ mt: 2 }}>
            <TextField
              inputRef={searchInputRef}
              placeholder="Search chats & messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              variant="outlined"
              sx={styles.searchFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </div>

        <div style={styles.list}>
          {filteredSessions.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">No results found.</Typography>
            </Box>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isPinned = Boolean(session.isPinned);

              return (
                <div key={session.id} style={{ marginBottom: 6 }}>
                  {/* 主会话条目 */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectSession(session.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        onSelectSession(session.id);
                      }
                    }}
                    style={styles.sessionItem(isActive, loading)}
                  >
                    {editingSessionId === session.id ? (
                      <TextField
                        inputRef={renameInputRef}
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                        onDoubleClick={(event) => event.stopPropagation()}
                        onBlur={() => finishRename(session.id)}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === "Enter") {
                            event.preventDefault();
                            finishRename(session.id);
                          } else if (event.key === "Escape") {
                            setEditingSessionId(null);
                          }
                        }}
                        size="small"
                        variant="standard"
                        inputProps={{ "aria-label": `Rename ${session.title}` }}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          "& .MuiInput-root": {
                            height: 24,
                            color: colors.text,
                          },
                          "& .MuiInput-input": {
                            boxSizing: "border-box",
                            height: 24,
                            py: 0,
                            px: 0,
                            fontSize: 14,
                            fontWeight: isActive ? 700 : 500,
                          },
                          "& .MuiInput-root:before, & .MuiInput-root:after": {
                            display: "none",
                          },
                        }}
                      />
                    ) : (
                      <span
                        title={session.title}
                        style={styles.sessionTitle(isActive)}
                        onDoubleClick={(event) => startRename(event, session)}
                      >
                        {session.mode === "code" ? "💻 " : "💬 "}
                        <HighlightText
                          text={session.title}
                          highlight={searchQuery}
                          isDark={isDark}
                        />
                      </span>
                    )}

                    <IconButton
                      size="small"
                      aria-label={isPinned ? "Unpin chat" : "Pin chat"}
                      title={isPinned ? "Unpin chat" : "Pin chat"}
                      disabled={loading}
                      onClick={(event) => {
                        event.stopPropagation();
                        onTogglePin?.(session.id, !isPinned);
                      }}
                      sx={{
                        color: isPinned
                          ? colors.buttonBg || "#4f46e5"
                          : colors.textMuted,
                        padding: "4px",
                        "&:hover": { color: colors.text },
                      }}
                    >
                      {isPinned ? (
                        <PushPin fontSize="small" />
                      ) : (
                        <PushPinOutlined fontSize="small" />
                      )}
                    </IconButton>

                    <button
                      type="button"
                      aria-label={`Delete ${session.title}`}
                      title="Delete chat"
                      onClick={(event) => onDeleteSession(event, session.id)}
                      disabled={loading}
                      style={styles.deleteBtn(loading)}
                    >
                      ×
                    </button>
                  </div>

                  {/* 匹配的消息摘要列表 */}
                  {session.matchedMessages.length > 0 && (
                    <div
                      style={{
                        paddingLeft: 24,
                        paddingRight: 8,
                        marginTop: 4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {session.matchedMessages.map((msg) => {
                        // 截取匹配词前后的片段（+/- 15~25个字符）
                        const idx = msg.content
                          .toLowerCase()
                          .indexOf(searchQuery.toLowerCase());
                        const start = Math.max(0, idx - 15);
                        const end = Math.min(
                          msg.content.length,
                          idx + searchQuery.length + 25,
                        );
                        const snippet =
                          (start > 0 ? "..." : "") +
                          msg.content.slice(start, end).replace(/\n/g, " ") + // 换行替换成空格，防止摘要过高
                          (end < msg.content.length ? "..." : "");

                        return (
                          <div
                            key={msg.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(session.id, msg.id);
                            }}
                            style={{
                              fontSize: 12,
                              color: colors.textMuted,
                              cursor: "pointer",
                              padding: "6px 8px",
                              borderRadius: 6,
                              backgroundColor:
                                theme === "dark"
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.03)",
                              borderLeft: `2px solid ${colors.border}`,
                              lineHeight: 1.4,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                theme === "dark"
                                  ? "rgba(255,255,255,0.08)"
                                  : "rgba(0,0,0,0.06)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                theme === "dark"
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.03)";
                            }}
                          >
                            <HighlightText
                              text={snippet}
                              highlight={searchQuery}
                              isDark={isDark}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            onClick={onClearAllChats}
            style={{
              background: "none",
              border: "none",
              color: colors.textMuted,
              cursor: "pointer",
              fontSize: 12,
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Clear all chats
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
