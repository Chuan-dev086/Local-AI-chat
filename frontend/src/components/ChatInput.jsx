// src/components/ChatInput.jsx

import { Box, IconButton, TextField } from "@mui/material";
import { ArrowUpward, Stop } from "@mui/icons-material";
import { useState } from "react";
import { getChatInputStyles } from "../theme/theme";

function ChatInput({
  input,
  loading,
  activeSession,
  theme,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onStop,
}) {
  const isInputEmpty = !input.trim();
  const styles = getChatInputStyles(theme, loading, isInputEmpty);

  // 记录历史输入的索引，-1 表示当前不在历史记录中
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleKeyDown = (event) => {
    const userMessages =
      activeSession?.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content) || [];

    // 👇 上箭头：翻阅历史记录
    if (event.key === "ArrowUp" && userMessages.length > 0) {
      if (historyIndex === -1 && input === "") {
        event.preventDefault();
        const newIndex = userMessages.length - 1;
        setHistoryIndex(newIndex);
        onInputChange(userMessages[newIndex]);
      } else if (historyIndex > 0) {
        event.preventDefault();
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        onInputChange(userMessages[newIndex]);
      }
      return;
    }

    // 👇 下箭头：往回翻
    if (event.key === "ArrowDown" && historyIndex !== -1) {
      event.preventDefault();
      if (historyIndex < userMessages.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        onInputChange(userMessages[newIndex]);
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
        setHistoryIndex(-1); // 发送后重置历史索引
      }
    }

    if (onKeyDown) onKeyDown(event);
  };

  return (
    <div style={styles.wrapper}>
      <Box sx={styles.pillContainer}>
        <TextField
          value={input}
          onChange={(event) => {
            onInputChange(event.target.value);
            setHistoryIndex(-1); // 手动打字时重置历史索引
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
