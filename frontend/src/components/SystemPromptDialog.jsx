// src/components/SystemPromptDialog.jsx

import { useMemo, useState } from "react";
import {
  Button,
  createTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  ThemeProvider,
} from "@mui/material";

const MAX_LENGTH = 4000;

function SystemPromptDialog({
  open,
  initialValue,
  mode,
  theme,
  onClose,
  onSave,
}) {
  const [value, setValue] = useState(initialValue || "");

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

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const handleClear = () => {
    setValue("");
  };

  const isOverLimit = value.length > MAX_LENGTH;

  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>System Prompt</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Customize the system prompt for this session. Leave blank to use the
            default{" "}
            <strong>
              {mode === "code" ? "Programming Assistant" : "General Chat"}
            </strong>{" "}
            prompt.
          </DialogContentText>

          <TextField
            autoFocus
            multiline
            minRows={10}
            maxRows={20}
            fullWidth
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g., You are a patient programming mentor. When answering questions, explain the concepts first, then provide examples..."
            error={isOverLimit}
            helperText={`${value.length} / ${MAX_LENGTH}`}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClear} color="inherit" sx={{ mr: "auto" }}>
            Clear
          </Button>

          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isOverLimit}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default SystemPromptDialog;
