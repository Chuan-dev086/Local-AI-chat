// src/components/ChatInput.jsx

import { Box, IconButton, TextField } from "@mui/material";
import { ArrowUpward, Stop } from "@mui/icons-material";
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

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && !isInputEmpty) {
        onSendMessage();
      }
    }
    onKeyDown(event); // 保留外部传入的逻辑
  };

  return (
    <div style={styles.wrapper}>
      <Box sx={styles.pillContainer}>
        <TextField
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
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
          InputProps={{ disableUnderline: true }}
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
