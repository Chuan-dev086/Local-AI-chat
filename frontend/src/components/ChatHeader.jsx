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
import { getThemeStyles, getToggleHoverColor } from "../theme/theme";

function ChatHeader({
  activeSession,
  loading,
  theme,
  onModeChange,
  onRenameSession,
  onToggleTheme,
}) {
  const { isDark, colors } = getThemeStyles(theme);

  const pageTitle =
    activeSession?.mode === "code"
      ? "Local AI Programming Assistant"
      : "Local AI General Chat";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: "16px 20px",
        borderBottom: `1px solid ${colors.border}`,
        transition: "border-color 0.3s ease",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          title={activeSession?.title}
          style={{
            margin: 0,
            overflow: "hidden",
            color: colors.text,
            fontSize: 20,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 700,
          }}
        >
          {activeSession?.title || "New Chat"}
        </h1>

        <p
          style={{
            margin: "4px 0 0",
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          {pageTitle}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="mode-select-label" sx={{ color: colors.textMuted }}>
            Mode
          </InputLabel>

          <Select
            labelId="mode-select-label"
            id="mode-select"
            value={activeSession?.mode || "chat"}
            onChange={onModeChange}
            disabled={loading}
            label="Mode"
            sx={{
              color: colors.text,
              backgroundColor: colors.inputBg,

              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.border,
              },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.border,
              },

              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.buttonBg,
              },

              "& .MuiSvgIcon-root": {
                color: colors.text,
              },
            }}
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
          sx={{
            borderColor: colors.toggleBtnBorder,
            color: colors.toggleBtnText,
            backgroundColor: colors.toggleBtnBg,
            textTransform: "none",
            fontSize: "0.9rem",

            "&:hover": {
              backgroundColor: getToggleHoverColor(theme),
            },
          }}
        >
          Rename
        </Button>

        <IconButton
          onClick={onToggleTheme}
          disabled={loading}
          size="small"
          sx={{
            borderRadius: 1,
            border: `1px solid ${colors.toggleBtnBorder}`,
            color: colors.toggleBtnText,
            backgroundColor: colors.toggleBtnBg,
            padding: "7px 10px",
            transition: "all 0.3s ease",

            "&:hover": {
              backgroundColor: getToggleHoverColor(theme),
            },
          }}
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
