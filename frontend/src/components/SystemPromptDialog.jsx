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
  Box,
} from "@mui/material";

const MAX_LENGTH = 4000;

function SystemPromptDialog({
  open,
  initialValue,
  mode,
  theme,
  onClose,
  onSave,
  onSaveAsTemplate,
}) {
  const [value, setValue] = useState(initialValue || "");
  const [templateName, setTemplateName] = useState("");
  const [isNaming, setIsNaming] = useState(false);

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

  const handleTriggerSaveAsTemplate = () => {
    if (!value.trim()) return;
    if (!isNaming) {
      const defaultName =
        value.trim().slice(0, 12) + (value.trim().length > 12 ? "..." : "");
      setTemplateName(defaultName);
      setIsNaming(true);
      return;
    }

    if (templateName.trim()) {
      // 调用 addPrompt 并接收返回结果
      const result = onSaveAsTemplate?.(templateName.trim(), value.trim());

      if (result && result.success === false) {
        if (result.reason === "duplicate") {
          window.alert("保存失败：已存在相同名称或相同内容的模板！");
        }
        return;
      }

      // 成功后重置状态并关闭命名区
      setIsNaming(false);
      setTemplateName("");
      window.alert("模板保存成功！");
    }
  };

  const isOverLimit = value.length > MAX_LENGTH;

  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog
        open={open}
        onClose={() => {
          setIsNaming(false);
          onClose();
        }}
        fullWidth
        maxWidth="md"
      >
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
            minRows={8}
            maxRows={16}
            fullWidth
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g., You are a patient programming mentor..."
            error={isOverLimit}
            helperText={`${value.length} / ${MAX_LENGTH}`}
          />

          {isNaming && (
            <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                label="Template Name"
                size="small"
                fullWidth
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Give this template a name..."
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleTriggerSaveAsTemplate}
                disabled={!templateName.trim()}
              >
                Confirm
              </Button>
              <Button
                size="small"
                color="inherit"
                onClick={() => setIsNaming(false)}
              >
                Cancel
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClear} color="inherit" sx={{ mr: "auto" }}>
            Clear
          </Button>

          {!isNaming && (
            <Button
              onClick={handleTriggerSaveAsTemplate}
              color="primary"
              disabled={!value.trim()}
            >
              ⭐ Save as Template
            </Button>
          )}

          <Button
            onClick={() => {
              setIsNaming(false);
              onClose();
            }}
            color="inherit"
          >
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
