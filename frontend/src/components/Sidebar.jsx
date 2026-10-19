// src/components/Sidebar.jsx

import { useState } from "react";
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { getSidebarStyles } from "../theme/theme";

function Sidebar({
  sessions,
  activeSessionId,
  loading,
  theme,
  collapsed,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}) {
  const styles = getSidebarStyles(theme, collapsed);
  const [searchQuery, setSearchQuery] = useState("");

  // 过滤逻辑：搜标题 或 搜消息内容
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchTitle = session.title.toLowerCase().includes(query);
    // 搜索消息内容（防崩处理：确保 messages 是数组）
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
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              variant="outlined"
              sx={styles.searchFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
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
                  <span
                    title={session.title}
                    style={styles.sessionTitle(isActive)}
                  >
                    {session.mode === "code" ? "💻 " : "💬 "}
                    {session.title}
                  </span>

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

        <div style={styles.footer}>
          {sessions.length} {sessions.length === 1 ? "chat" : "chats"} saved
          locally
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
