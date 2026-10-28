import { Box, IconButton, TextField, Chip, Menu, MenuItem } from "@mui/material";
import { ArrowUpward, Stop, AttachFile, Close, AutoAwesome } from "@mui/icons-material";
import { useState, useRef } from "react";
import { getChatInputStyles } from "../theme/theme";

const PROMPT_TEMPLATES = [
  {
    name: "Default assistant",
    prompt: "",
  },
  {
    name: "Python expert",
    prompt:
      "You are an expert Python developer. Give accurate, idiomatic Python guidance, explain important tradeoffs, and include runnable examples when useful.",
  },
  {
    name: "Socratic tutor",
    prompt:
      "You are a patient Socratic tutor. Help the user learn by asking focused questions and offering hints before giving a full solution. Adapt to their level.",
  },
  {
    name: "Writing assistant",
    prompt:
      "You are a thoughtful writing assistant. Help the user improve clarity, structure, and tone while preserving their meaning and voice.",
  },
];

function ChatInput({
  input,
  loading,
  activeSession,
  theme,
  attachedFile,
  onAttachFile,
  onRemoveFile,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onStop,
  onSelectPromptTemplate,
}) {
  const isInputEmpty = !input.trim() && !attachedFile;
  const styles = getChatInputStyles(theme, loading, isInputEmpty);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [promptMenuAnchor, setPromptMenuAnchor] = useState(null);
  const fileInputRef = useRef(null);

  // 读取本地文件
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (/^image\/(png|jpeg)$/.test(file.type) || /\.(png|jpe?g)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = String(event.target.result || "");
        onAttachFile({ name: file.name, imageBase64: dataUrl.split(",")[1], mimeType: file.type || "image/jpeg" });
      };
      reader.readAsDataURL(file);
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target.result;
      // 限制最大 8000 字符，防止超出模型上下文导致崩溃
      const MAX_CHARS = 8000;
      let isTruncated = false;
      if (content.length > MAX_CHARS) {
        content = content.slice(0, MAX_CHARS);
        isTruncated = true;
      }
      onAttachFile({ name: file.name, content, isTruncated });
    };
    reader.readAsText(file);
    e.target.value = null; // 允许重复上传同名文件
  };

  const handleKeyDown = (event) => {
    const userMessages =
      activeSession?.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content) || [];

    // 上箭头：翻阅历史
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
    // 下箭头：往回翻
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
    // 回车发送
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && !isInputEmpty) {
        onSendMessage();
        setHistoryIndex(-1);
      }
    }
    if (onKeyDown) onKeyDown(event);
  };

  return (
    <div style={styles.wrapper}
      onDragOver={(event) => { if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault(); }}
      onDrop={(event) => {
        const file = event.dataTransfer.files?.[0];
        if (file && (/^image\/(png|jpeg)$/.test(file.type) || /\.(png|jpe?g)$/i.test(file.name))) {
          event.preventDefault();
          handleFileChange({ target: { files: [file], value: null } });
        }
      }}>
      {/* 显示已附加的文件标签 */}
      {attachedFile && (attachedFile.imageBase64 ? (
        <Box sx={{ width: "100%", mb: 1, display: "flex", justifyContent: "flex-start" }}>
          <Box sx={{ position: "relative", width: 76, height: 64, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: theme === "dark" ? "#475569" : "#cbd5e1", boxShadow: 1 }}>
            <Box component="img" src={`data:${attachedFile.mimeType || "image/jpeg"};base64,${attachedFile.imageBase64}`} alt={attachedFile.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <IconButton aria-label="Remove image" onClick={onRemoveFile} size="small" sx={{ position: "absolute", top: 2, right: 2, p: 0.25, bgcolor: "rgba(15,23,42,.75)", color: "white", "&:hover": { bgcolor: "rgba(15,23,42,.95)" } }}><Close sx={{ fontSize: 15 }} /></IconButton>
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
              attachedFile.name + (attachedFile.isTruncated ? " (已截断)" : "")
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
        {/* 隐藏的文件选择器 */}
        <input
          type="file"
          accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.html,.css,.csv,.png,.jpg,.jpeg,image/png,image/jpeg"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* 回形针按钮 */}
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          sx={{
            ml: 1,
            mb: 0.5,
            color: theme === "dark" ? "#cbd5e1" : "text.secondary",
            "&:hover": {
              color: theme === "dark" ? "#f1f5f9" : "text.primary",
            },
          }}
        >
          <AttachFile fontSize="small" />
        </IconButton>

        <IconButton
          aria-label="Choose a prompt template"
          title="Prompt templates"
          onClick={(event) => setPromptMenuAnchor(event.currentTarget)}
          disabled={loading}
          sx={{
            mb: 0.5,
            color: theme === "dark" ? "#cbd5e1" : "text.secondary",
            "&:hover": {
              color: theme === "dark" ? "#f1f5f9" : "text.primary",
            },
          }}
        >
          <AutoAwesome fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={promptMenuAnchor}
          open={Boolean(promptMenuAnchor)}
          onClose={() => setPromptMenuAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: theme === "dark" ? "#1e293b" : "background.paper",
                color: theme === "dark" ? "#e2e8f0" : "text.primary",
              },
            },
          }}
        >
          {PROMPT_TEMPLATES.map((template) => (
            <MenuItem
              key={template.name}
              sx={{
                color: theme === "dark" ? "#e2e8f0" : "text.primary",
                "&:hover": {
                  bgcolor: theme === "dark" ? "#334155" : "action.hover",
                },
              }}
              onClick={() => {
                onSelectPromptTemplate?.(template.prompt);
                setPromptMenuAnchor(null);
              }}
            >
              {template.name}
            </MenuItem>
          ))}
        </Menu>

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
