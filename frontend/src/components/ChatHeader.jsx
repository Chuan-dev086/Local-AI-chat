// src/components/ChatHeader.jsx

import { useState, useEffect, useRef } from "react";
import { IconButton, Box, TextField } from "@mui/material";
import { DarkMode, LightMode, Menu as MenuIcon } from "@mui/icons-material";
import { getChatHeaderStyles, getThemeStyles } from "../theme/theme";

// 👈 提取独立的标题编辑组件，避免在 useEffect 里 setState
function TitleEditor({ initialTitle, onSave, onCancel, styles }) {
  const [editTitle, setEditTitle] = useState(initialTitle);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== initialTitle) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <TextField
      inputRef={inputRef}
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") onCancel();
      }}
      size="small"
      variant="standard"
      fullWidth
      sx={{
        "& .MuiInputBase-root": {
          fontSize: "20px",
          fontWeight: 700,
          color: styles.title.color,
        },
        "& .MuiInputBase-input": { p: 0 },
        "& .MuiInput-underline:before, & .MuiInput-underline:after": {
          borderColor: "#4f46e5",
        },
      }}
    />
  );
}

function ChatHeader({
  activeSession,
  loading,
  theme,
  onToggleSidebar,
  onRenameSession,
  onToggleTheme,
  isRenaming,
  setIsRenaming,
}) {
  const { isDark } = getThemeStyles(theme);
  const styles = getChatHeaderStyles(theme);

  return (
    <header style={styles.header}>
      {/* 左侧：☰ + 主标题 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
          flex: 1,
        }}
      >
        <IconButton
          onClick={onToggleSidebar}
          size="small"
          sx={styles.themeToggleBtnSx}
          title="Toggle sidebar"
        >
          <MenuIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>

        <div
          style={{
            ...styles.titleContainer,
            display: "flex",
            alignItems: "center",
          }}
        >
          {isRenaming ? (
            <TitleEditor
              initialTitle={activeSession?.title || ""}
              onSave={(newTitle) => {
                onRenameSession(activeSession.id, newTitle);
                setIsRenaming(false);
              }}
              onCancel={() => setIsRenaming(false)}
              styles={styles}
            />
          ) : (
            <h1
              title="Double-click to rename"
              onDoubleClick={!loading ? () => setIsRenaming(true) : undefined}
              style={{
                ...styles.title,
                cursor: loading ? "default" : "text",
                userSelect: "none",
                margin: 0,
              }}
            >
              {activeSession?.title || "New Chat"}
            </h1>
          )}
        </div>
      </Box>

      {/* 右侧：仅保留主题切换 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onToggleTheme}
          disabled={loading}
          size="small"
          sx={styles.themeToggleBtnSx}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <LightMode sx={{ fontSize: "1.25rem" }} />
          ) : (
            <DarkMode sx={{ fontSize: "1.25rem" }} />
          )}
        </IconButton>
      </Box>
    </header>
  );
}

export default ChatHeader;
