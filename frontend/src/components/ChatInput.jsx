// src/components/ChatInput.jsx

import { Button, TextField } from "@mui/material";
import { getChatInputStyles } from "../theme/theme";

function ChatInput({
  input,
  loading,
  activeSession,
  theme,
  onInputChange,
  onKeyDown,
  onSendMessage,
}) {
  const isInputEmpty = !input.trim();
  const styles = getChatInputStyles(theme, loading, isInputEmpty);

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <TextField
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            activeSession?.mode === "code"
              ? "Ask a programming question…"
              : "Type your message…"
          }
          disabled={loading}
          multiline
          rows={2}
          variant="outlined"
          size="small"
          fullWidth
          sx={styles.textFieldSx}
        />

        <Button
          type="button"
          onClick={onSendMessage}
          disabled={loading || isInputEmpty}
          variant="contained"
          sx={styles.sendBtnSx}
        >
          {loading ? "Thinking…" : "Send"}
        </Button>
      </div>

      <p style={styles.tipText}>
        Press Enter to send. Use Shift + Enter for a new line.
      </p>
    </div>
  );
}

export default ChatInput;
