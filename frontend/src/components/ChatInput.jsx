// src/components/ChatInput.jsx
import {
  Box,
  IconButton,
  TextField,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Typography,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ArrowUpward,
  Stop,
  AttachFile,
  Close,
  Settings,
  Check,
  DriveFileRenameOutline,
  Download,
  Delete,
  ManageAccounts as PromptIcon,
  Tune as SystemPromptIcon,
} from "@mui/icons-material";
import { useState, useRef } from "react";
import { getChatInputStyles } from "../theme/theme";

function ChatInput({
  input,
  loading,
  activeSession,
  theme,
  attachedFile,
  models = [],
  customPrompts = [],
  onAttachFile,
  onRemoveFile,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onStop,
  onModelChange,
  onModeChange,
  onRenameSession,
  onOpenSystemPrompt,
  onClearChat,
  onSelectPromptTemplate,
  onOpenPromptManager,
}) {
  const isInputEmpty = !input.trim() && !attachedFile;
  const styles = getChatInputStyles(theme, loading, isInputEmpty);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 菜单控制
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [modelAnchor, setModelAnchor] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (
      /^image\/(png|jpeg)$/.test(file.type) ||
      /\.(png|jpe?g)$/i.test(file.name)
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = String(event.target.result || "");
        onAttachFile({
          name: file.name,
          imageBase64: dataUrl.split(",")[1],
          mimeType: file.type || "image/jpeg",
        });
      };
      reader.readAsDataURL(file);
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target.result;
      const MAX_CHARS = 8000;
      let isTruncated = false;
      if (content.length > MAX_CHARS) {
        content = content.slice(0, MAX_CHARS);
        isTruncated = true;
      }
      onAttachFile({ name: file.name, content, isTruncated });
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleKeyDown = (event) => {
    const userMessages =
      activeSession?.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content) || [];

    if (event.key === "ArrowUp" && userMessages.length > 0) {
      if (historyIndex === -1 && input === "") {
        event.preventDefault();
        setHistoryIndex(userMessages.length - 1);
        onInputChange(userMessages[userMessages.length - 1]);
      } else if (historyIndex > 0) {
        event.preventDefault();
        setHistoryIndex(historyIndex - 1);
        onInputChange(userMessages[historyIndex - 1]);
      }
      return;
    }
    if (event.key === "ArrowDown" && historyIndex !== -1) {
      event.preventDefault();
      if (historyIndex < userMessages.length - 1) {
        setHistoryIndex(historyIndex + 1);
        onInputChange(userMessages[historyIndex + 1]);
      } else {
        setHistoryIndex(-1);
        onInputChange("");
      }
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && !isInputEmpty) {
        onSendMessage();
        setHistoryIndex(-1);
      }
    }
    if (onKeyDown) onKeyDown(event);
  };

  const handleExportMarkdown = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    let markdown = `# ${activeSession.title}\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    activeSession.messages.forEach((msg) => {
      const role = msg.role === "user" ? "### 👤 User" : "### 🤖 Assistant";
      markdown += `${role}\n\n${msg.content}\n\n---\n\n`;
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession.title.replace(/[/\\?%*:|"<>]/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSettingsAnchor(null);
  };

  const menuPaperStyle = {
    minWidth: 220,
    mt: 1,
    bgcolor: theme === "dark" ? "#1e293b" : "#ffffff",
    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
    border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`, // 👈 增加细边框
    boxShadow:
      theme === "dark"
        ? "0 4px 20px rgba(0,0,0,0.5)"
        : "0 4px 20px rgba(0,0,0,0.1)",
    "& .MuiList-root": {
      maxHeight: 400,
      // 👈 自定义细滚动条
      "&::-webkit-scrollbar": { width: "6px" },
      "&::-webkit-scrollbar-track": { background: "transparent" },
      "&::-webkit-scrollbar-thumb": {
        background: theme === "dark" ? "#475569" : "#cbd5e1",
        borderRadius: "10px",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: theme === "dark" ? "#64748b" : "#94a3b8",
      },
    },
  };

  return (
    <div
      style={styles.wrapper}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files"))
          event.preventDefault();
      }}
      onDrop={(event) => {
        const file = event.dataTransfer.files?.[0];
        if (
          file &&
          (/^image\/(png|jpeg)$/.test(file.type) ||
            /\.(png|jpe?g)$/i.test(file.name))
        ) {
          event.preventDefault();
          handleFileChange({ target: { files: [file], value: null } });
        }
      }}
    >
      {attachedFile &&
        (attachedFile.imageBase64 ? (
          <Box
            sx={{
              width: "100%",
              mb: 1,
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 76,
                height: 64,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: theme === "dark" ? "#475569" : "#cbd5e1",
                boxShadow: 1,
              }}
            >
              <Box
                component="img"
                src={`data:${attachedFile.mimeType || "image/jpeg"};base64,${attachedFile.imageBase64}`}
                alt={attachedFile.name}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                aria-label="Remove image"
                onClick={onRemoveFile}
                size="small"
                sx={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  p: 0.25,
                  bgcolor: "rgba(15,23,42,.75)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(15,23,42,.95)" },
                }}
              >
                <Close sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              mb: 1,
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <Chip
              icon={<AttachFile fontSize="small" />}
              label={
                attachedFile.name +
                (attachedFile.isTruncated ? " (已截断)" : "")
              }
              onDelete={onRemoveFile}
              deleteIcon={<Close />}
              size="small"
              sx={{
                backgroundColor: theme === "dark" ? "#334155" : "#e2e8f0",
                color: theme === "dark" ? "#e2e8f0" : "#0f172a",
              }}
            />
          </Box>
        ))}

      <Box sx={styles.pillContainer}>
        <input
          type="file"
          accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.html,.css,.csv,.png,.jpg,.jpeg,image/png,image/jpeg"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* 左侧：附件 + 设置 */}
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          sx={{
            ml: 1,
            mb: 0.5,
            color: theme === "dark" ? "#cbd5e1" : "text.secondary",
            "&:hover": { color: theme === "dark" ? "#f1f5f9" : "text.primary" },
          }}
        >
          <AttachFile fontSize="small" />
        </IconButton>

        <IconButton
          aria-label="Settings and tools"
          title="Settings and tools"
          onClick={(e) => setSettingsAnchor(e.currentTarget)}
          disabled={loading}
          sx={{
            mb: 0.5,
            color: theme === "dark" ? "#cbd5e1" : "text.secondary",
            "&:hover": { color: theme === "dark" ? "#f1f5f9" : "text.primary" },
          }}
        >
          <Settings fontSize="small" />
        </IconButton>

        {/* 设置菜单 */}
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          slotProps={{ paper: { sx: menuPaperStyle } }}
        >
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
              onModeChange({ target: { value: "chat" } });
              setSettingsAnchor(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {activeSession?.mode === "chat" && <Check fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary="General Chat" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onModeChange({ target: { value: "code" } });
              setSettingsAnchor(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {activeSession?.mode === "code" && <Check fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary="Programming Assistant" />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

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
            PROMPTS & TOOLS
          </Typography>
          <MenuItem
            onClick={() => {
              setSettingsAnchor(null);
              onOpenSystemPrompt();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <SystemPromptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="System Prompt" />
          </MenuItem>

          {/* 提示词模板列表 */}
          {customPrompts.length > 0 && (
            <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
              {customPrompts.map((template) => (
                <MenuItem
                  key={template.id}
                  onClick={() => {
                    onSelectPromptTemplate?.(template.prompt);
                    setSettingsAnchor(null);
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <PromptIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </MenuItem>
              ))}
            </Box>
          )}
          <MenuItem
            onClick={() => {
              setSettingsAnchor(null);
              onOpenPromptManager?.();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PromptIcon fontSize="small" style={{ opacity: 0.5 }} />
            </ListItemIcon>
            <ListItemText
              primary="Manage Prompts..."
              primaryTypographyProps={{
                color: "text.secondary",
                fontSize: "0.9rem",
              }}
            />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem
            onClick={() => {
              setSettingsAnchor(null);
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
          <MenuItem
            disabled={!activeSession?.messages.length}
            onClick={() => {
              setSettingsAnchor(null);
              onClearChat();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Clear Current Chat" />
          </MenuItem>
        </Menu>

        {/* 中间：输入框 */}
        <TextField
          value={input}
          onChange={(event) => {
            onInputChange(event.target.value);
            setHistoryIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            activeSession?.mode === "code"
              ? "Ask a programming question…"
              : "Type your message…"
          }
          disabled={loading}
          multiline
          maxRows={8}
          variant="standard"
          fullWidth
          slotProps={{ input: { disableUnderline: true } }}
          sx={styles.textFieldSx}
        />

        {/* 右侧：模型下拉 + 发送按钮 */}
        <Box
          onClick={(e) => !loading && setModelAnchor(e.currentTarget)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mb: 1,
            mr: 1,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            cursor: loading ? "default" : "pointer",
            color: theme === "dark" ? "#cbd5e1" : "text.secondary",
            "&:hover": {
              bgcolor:
                theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
            },
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activeSession?.model || "Model"}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.7 }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </Box>

        <Menu
          anchorEl={modelAnchor}
          open={Boolean(modelAnchor)}
          onClose={() => setModelAnchor(null)}
          slotProps={{ paper: { sx: menuPaperStyle } }}
        >
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
                onModelChange({ target: { value: m } });
                setModelAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {activeSession?.model === m && <Check fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={m} />
            </MenuItem>
          ))}
        </Menu>

        <IconButton
          onClick={loading ? onStop : onSendMessage}
          disabled={!loading && isInputEmpty}
          sx={styles.actionBtnSx}
        >
          {loading ? (
            <Stop fontSize="small" />
          ) : (
            <ArrowUpward fontSize="small" />
          )}
        </IconButton>
      </Box>

      <p style={styles.tipText}>
        AI can make mistakes. Consider checking important information.
      </p>
    </div>
  );
}

export default ChatInput;
