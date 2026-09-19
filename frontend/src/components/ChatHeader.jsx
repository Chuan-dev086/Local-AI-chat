// src/components/ChatHeader.jsx

import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { getChatHeaderStyles, getThemeStyles } from "../theme/theme";

function ChatHeader({
  activeSession,
  loading,
  theme,
  onModeChange,
  onRenameSession,
  onToggleTheme,
}) {
  const { isDark } = getThemeStyles(theme);
  const styles = getChatHeaderStyles(theme);

  const pageTitle =
    activeSession?.mode === "code"
      ? "Local AI Programming Assistant"
      : "Local AI General Chat";

  return (
    <header style={styles.header}>
      <div style={styles.titleContainer}>
        <h1 title={activeSession?.title} style={styles.title}>
          {activeSession?.title || "New Chat"}
        </h1>

        <p style={styles.subtitle}>{pageTitle}</p>
      </div>

      <div style={styles.actionsContainer}>
        <FormControl size="small" sx={styles.formControlSx}>
          <InputLabel id="mode-select-label" sx={styles.inputLabelSx}>
            Mode
          </InputLabel>

          <Select
            labelId="mode-select-label"
            id="mode-select"
            value={activeSession?.mode || "chat"}
            onChange={onModeChange}
            disabled={loading}
            label="Mode"
            sx={styles.selectSx}
          >
            <MenuItem value="chat">General Chat</MenuItem>
            <MenuItem value="code">Programming Assistant</MenuItem>
          </Select>
        </FormControl>

        <Button
          type="button"
          onClick={onRenameSession}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={styles.renameBtnSx}
        >
          Rename
        </Button>

        <IconButton
          onClick={onToggleTheme}
          disabled={loading}
          size="small"
          sx={styles.themeToggleBtnSx}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Brightness7 sx={{ fontSize: "1.25rem" }} />
          ) : (
            <Brightness4 sx={{ fontSize: "1.25rem" }} />
          )}
        </IconButton>
      </div>
    </header>
  );
}

export default ChatHeader;
