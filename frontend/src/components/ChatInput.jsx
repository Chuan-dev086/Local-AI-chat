// src/components/ChatInput.jsx

import { Button, TextField } from "@mui/material";
import { getThemeStyles } from "../theme/theme";

function ChatInput({
  input,
  loading,
  activeSession,
  theme,
  onInputChange,
  onKeyDown,
  onSendMessage,
}) {
  const { colors, inputArea } = getThemeStyles(theme);

  const isInputEmpty = !input.trim();

  return (
    <div
      style={{
        ...inputArea,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
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
          sx={{
            "& .MuiOutlinedInput-root": {
              color: colors.text,
              backgroundColor: loading ? colors.bg : colors.inputBg,

              "& fieldset": {
                borderColor: colors.border,
              },

              "&:hover fieldset": {
                borderColor: colors.border,
              },

              "&.Mui-focused fieldset": {
                borderColor: colors.buttonBg,
              },
            },

            "& .MuiOutlinedInput-input::placeholder": {
              color: colors.textMuted,
              opacity: 1,
            },
          }}
        />

        <Button
          type="button"
          onClick={onSendMessage}
          disabled={loading || isInputEmpty}
          variant="contained"
          sx={{
            minWidth: 92,
            backgroundColor:
              loading || isInputEmpty ? colors.buttonDisabled : "#4f46e5",
            color: "#ffffff",
            fontWeight: 700,
            textTransform: "none",
            fontSize: "1rem",
            padding: "9px 16px",
            borderRadius: "10px",

            "&:hover": {
              backgroundColor:
                loading || isInputEmpty ? colors.buttonDisabled : "#3f3bc4",
            },
          }}
        >
          {loading ? "Thinking…" : "Send"}
        </Button>
      </div>

      <p
        style={{
          margin: "8px 0 0",
          color: colors.textMuted,
          fontSize: 12,
        }}
      >
        Press Enter to send. Use Shift + Enter for a new line.
      </p>
    </div>
  );
}

export default ChatInput;
