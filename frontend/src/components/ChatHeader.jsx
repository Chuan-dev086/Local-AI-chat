// src/components/ChatHeader.jsx

import { useState, useMemo } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  ThemeProvider, // 👈 新增
  createTheme, // 👈 新增
} from "@mui/material";
import {
  DarkMode,
  LightMode,
  Menu as MenuIcon,
  ArrowDropDown,
  Check,
  Settings,
  DriveFileRenameOutline,
  Download,
} from "@mui/icons-material";
import { getChatHeaderStyles, getThemeStyles } from "../theme/theme";

function ChatHeader({
  activeSession,
  loading,
  theme,
  models,
  onToggleSidebar,
  onModeChange,
  onModelChange,
  onRenameSession,
  onToggleTheme,
  onOpenSystemPrompt,
}) {
  const { isDark } = getThemeStyles(theme);
  const styles = getChatHeaderStyles(theme);

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

  // 菜单控制
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isMenuOpen = Boolean(menuAnchor);

  const handleMenuOpen = (event) => {
    if (loading) return;
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExportMarkdown = () => {
    if (!activeSession || activeSession.messages.length === 0) return;

    // 拼装 Markdown 格式
    let markdown = `# ${activeSession.title}\n\n`;
    markdown += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    activeSession.messages.forEach((msg) => {
      const role = msg.role === "user" ? "### 👤 User" : "### 🤖 Assistant";
      markdown += `${role}\n\n${msg.content}\n\n---\n\n`;
    });

    // 生成文件并触发下载
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 处理文件名，去掉非法字符
    a.download = `${activeSession.title.replace(/[/\\?%*:|"<>]/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    handleMenuClose();
  };

  // 伪造 event 对象，复用父组件逻辑
  const fakeModeEvent = (modeValue) => ({ target: { value: modeValue } });
  const fakeModelEvent = (modelValue) => ({ target: { value: modelValue } });

  const pageTitle =
    activeSession?.mode === "code"
      ? "Local AI Programming Assistant"
      : "Local AI General Chat";

  return (
    <ThemeProvider theme={muiTheme}>
      <header style={styles.header}>
        {/* 左侧：☰ + 标题 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
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

          <div style={styles.titleContainer}>
            <h1 title={activeSession?.title} style={styles.title}>
              {activeSession?.title || "New Chat"}
            </h1>
            <p style={styles.subtitle}>{pageTitle}</p>
          </div>
        </div>

        {/* 右侧：模型按钮 + 主题切换 */}
        <div style={styles.actionsContainer}>
          <Box
            onClick={loading ? undefined : handleMenuOpen}
            sx={styles.modelMenuBtnSx}
          >
            <span>{activeSession?.model || "Select Model"}</span>
            <ArrowDropDown fontSize="small" />
          </Box>

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
        </div>

        {/* 收纳起来的菜单 */}
        <Menu
          anchorEl={menuAnchor}
          open={isMenuOpen}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              sx: {
                minWidth: 220,
                mt: 1,
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                color: theme === "dark" ? "#e2e8f0" : "#0f172a",
              },
            },
          }}
        >
          {/* --- 模型选择 --- */}
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              color: "text.secondary",
              display: "block",
              fontWeight: 600,
            }}
          >
            MODEL
          </Typography>
          {models.map((m) => (
            <MenuItem
              key={m}
              onClick={() => {
                onModelChange(fakeModelEvent(m));
                handleMenuClose();
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {activeSession?.model === m && <Check fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={m} />
            </MenuItem>
          ))}

          <Divider sx={{ my: 1 }} />

          {/* --- 模式选择 --- */}
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              color: "text.secondary",
              display: "block",
              fontWeight: 600,
            }}
          >
            MODE
          </Typography>
          <MenuItem
            onClick={() => {
              onModeChange(fakeModeEvent("chat"));
              handleMenuClose();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {activeSession?.mode === "chat" && <Check fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary="General Chat" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onModeChange(fakeModeEvent("code"));
              handleMenuClose();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {activeSession?.mode === "code" && <Check fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary="Programming Assistant" />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* --- 操作 --- */}
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onOpenSystemPrompt();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="System Prompt" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onRenameSession();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <DriveFileRenameOutline fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Rename Chat" />
          </MenuItem>
          <MenuItem onClick={handleExportMarkdown}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Export Markdown" />
          </MenuItem>
        </Menu>
      </header>
    </ThemeProvider>
  );
}

export default ChatHeader;
