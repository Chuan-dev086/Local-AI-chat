// src/components/Sidebar.jsx

import { useRef, useState } from "react";
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { clearChatState } from "../store/chatStorage";
import { getSidebarStyles, getThemeStyles } from "../theme/theme"; // 👈 引入 getThemeStyles

function Sidebar({
  sessions,
  activeSessionId,
  loading,
  theme,
  collapsed,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession, // 👈 新增：接收重命名函数
  searchInputRef,
}) {
  const styles = getSidebarStyles(theme, collapsed);
  const { colors } = getThemeStyles(theme); // 👈 获取颜色配置
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
    if (title && title !== sessions.find((session) => session.id === sessionId)?.title) {
      onRenameSession?.(sessionId, title);
    }
  };

  // 过滤逻辑：搜标题 或 搜消息内容
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchTitle = session.title.toLowerCase().includes(query);
    const matchContent =
      Array.isArray(session.messages) &&
      session.messages.some((msg) => msg.content.toLowerCase().includes(query));
    return matchTitle || matchContent;
  });

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

          {/* 搜索框 */}
          <Box sx={{ mt: 2 }}>
            <TextField
              inputRef={searchInputRef}
              placeholder="Search chats..."
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
              <Typography variant="body2">No chats found.</Typography>
            </Box>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <div
                  key={session.id}
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
                      onChange={(event) => setEditingTitle(event.target.value)}
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
                        flex: 1, minWidth: 0,
                        "& .MuiInput-root": { height: 24, color: colors.text },
                        "& .MuiInput-input": { boxSizing: "border-box", height: 24, py: 0, px: 0, fontSize: 14, fontWeight: isActive ? 700 : 500 },
                        "& .MuiInput-root:before, & .MuiInput-root:after": { display: "none" },
                      }}
                    />
                  ) : (
                    <span
                      title={session.title}
                      style={styles.sessionTitle(isActive)}
                      onDoubleClick={(event) => startRename(event, session)}
                    >
                      {session.mode === "code" ? "\u{1F4BB} " : "\u{1F4AC} "}
                      {session.title}
                    </span>
                  )}

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
              );
            })
          )}
        </div>

        {/* 底部：一键清空 */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("确定要清空所有聊天记录吗？此操作不可逆。")) {
                clearChatState().then(() => {
                  localStorage.removeItem("local_ai_chat_sessions_v2");
                  window.location.reload();
                }).catch((error) => {
                  console.warn("Could not clear saved chats:", error);
                });
              }
            }}
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
