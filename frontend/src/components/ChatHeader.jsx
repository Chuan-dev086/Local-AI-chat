// src/components/ChatHeader.jsx

import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { DarkMode, LightMode, Settings } from "@mui/icons-material";
import { getChatHeaderStyles, getThemeStyles } from "../theme/theme";

function ChatHeader({
  activeSession,
  loading,
  theme,
  models,
  onModeChange,
  onModelChange,
  onRenameSession,
  onToggleTheme,
  onOpenSystemPrompt,
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

        <FormControl size="small" sx={styles.formControlSx}>
          <InputLabel id="model-select-label" sx={styles.inputLabelSx}>
            Model
          </InputLabel>

          <Select
            labelId="model-select-label"
            id="model-select"
            value={activeSession?.model || ""}
            onChange={onModelChange}
            disabled={loading || models.length === 0}
            label="Model"
            sx={styles.selectSx}
          >
            {models.length === 0 ? (
              <MenuItem value="" disabled>
                No models found
              </MenuItem>
            ) : (
              models.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))
            )}
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
          onClick={onOpenSystemPrompt}
          disabled={loading}
          size="small"
          sx={styles.themeToggleBtnSx}
          title="Edit system prompt"
        >
          <Settings sx={{ fontSize: "1.25rem" }} />
        </IconButton>

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
    </header>
  );
}

export default ChatHeader;
