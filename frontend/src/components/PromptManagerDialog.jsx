// src/components/PromptManagerDialog.jsx
import { useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Divider,
} from "@mui/material";
import { Delete, Edit, Add } from "@mui/icons-material";

/**
 * PromptManagerDialog component for managing custom user prompt templates.
 * Time Complexity: O(1) for item CRUD operations inside local state.
 * Space Complexity: O(n) for storing form inputs and template lists.
 * Edge Cases: Completely resolves flex overflow and unspaced string wrapping issues.
 */
function PromptManagerDialog({
  open,
  theme,
  customPrompts,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");

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
    if (!name.trim() || !prompt.trim()) return;
    if (editingId) {
      onUpdate(editingId, name, prompt);
      setEditingId(null);
    } else {
      onAdd(name, prompt);
    }
    setName("");
    setPrompt("");
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setPrompt(item.prompt);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setPrompt("");
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Manage Custom Prompt Templates</DialogTitle>
        <DialogContent dividers sx={{ overflowX: "hidden" }}>
          {/* Form Section */}
          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}
          >
            <Typography variant="subtitle2">
              {editingId ? "Edit Template" : "Add New Template"}
            </Typography>
            <TextField
              label="Template Name"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Prompt Content"
              size="small"
              multiline
              rows={3}
              fullWidth
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              {editingId && (
                <Button size="small" onClick={handleCancelEdit} color="inherit">
                  Cancel
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                disabled={!name.trim() || !prompt.trim()}
                startIcon={<Add />}
              >
                {editingId ? "Update" : "Add"}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* List Section */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Existing Custom Templates ({customPrompts.length})
          </Typography>
          <Box sx={{ maxHeight: 260, overflowY: "auto", overflowX: "hidden" }}>
            {customPrompts.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                No custom templates yet. Add one above!
              </Typography>
            ) : (
              <List dense sx={{ overflowX: "hidden" }}>
                {customPrompts.map((item) => (
                  <ListItem
                    key={item.id}
                    divider
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      overflowX: "hidden",
                    }}
                  >
                    {/* Text Container with strict minWidth: 0 to prevent flex blowout */}
                    <Box sx={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          wordBreak: "break-all",
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          wordBreak: "break-all",
                          whiteSpace: "normal",
                          mt: 0.5,
                        }}
                      >
                        {item.prompt}
                      </Typography>
                    </Box>

                    {/* Actions Container */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleStartEdit(item)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(item.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default PromptManagerDialog;
