// src/components/SystemPromptDialog.jsx

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";

const MAX_LENGTH = 4000;

function SystemPromptDialog({ open, initialValue, mode, onClose, onSave }) {
  // 组件挂载时用 initialValue 初始化一次；父组件通过 key 控制重新挂载
  const [value, setValue] = useState(initialValue || "");

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const handleClear = () => {
    setValue("");
  };

  const isOverLimit = value.length > MAX_LENGTH;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>System Prompt</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          自定义这个会话的系统提示词。留空则使用{" "}
          <strong>
            {mode === "code" ? "Programming Assistant" : "General Chat"}
          </strong>{" "}
          的默认提示词。
        </DialogContentText>

        <TextField
          autoFocus
          multiline
          minRows={10}
          maxRows={20}
          fullWidth
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="例如：你是一个耐心的编程导师，回答问题时要先解释概念，再给例子..."
          error={isOverLimit}
          helperText={`${value.length} / ${MAX_LENGTH}`}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClear} color="inherit" sx={{ mr: "auto" }}>
          清空
        </Button>

        <Button onClick={onClose} color="inherit">
          取消
        </Button>

        <Button onClick={handleSave} variant="contained" disabled={isOverLimit}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SystemPromptDialog;
