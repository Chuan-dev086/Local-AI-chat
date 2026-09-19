// src/components/MessageBubble.jsx
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, TextField } from "@mui/material";
import { getMessageBubbleStyles, getThemeStyles } from "../theme/theme";
import CopyButton from "./CopyButton";

function MessageBubble({ message, theme, index, onEditMessage }) {
  const { isDark, colors } = getThemeStyles(theme);
  const isUser = message.role === "user";
  const styles = getMessageBubbleStyles(theme, isUser);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);

  // copy message function
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    setIsEditing(false);
    if (onEditMessage) {
      onEditMessage(index, editText.trim());
    }
  };

  const handleCancelEdit = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: "80%",
          width: isEditing ? "80%" : "auto",
        }}
      >
        <article
          style={{
            ...styles.bubble,
            maxWidth: "100%",
            width: "100%",
          }}
        >
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <TextField
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.text,
                    backgroundColor: colors.inputBg,
                    "& fieldset": { borderColor: colors.border },
                  },
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="small"
                  onClick={handleCancelEdit}
                  sx={{ color: colors.textMuted, textTransform: "none" }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveEdit}
                  sx={{
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#3f3bc4" },
                  }}
                >
                  Save & Resend
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <div style={styles.userText}>{message.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 style={styles.markdown.h1}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 style={styles.markdown.h2}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 style={styles.markdown.h3}>{children}</h3>
                ),
                p: ({ children }) => (
                  <div style={styles.markdown.p}>{children}</div>
                ),
                pre: ({ children }) => <>{children}</>,
                code: ({ className, children, ...props }) => {
                  const codeText = String(children).replace(/\n$/, "");
                  const isCodeBlock =
                    Boolean(className) || String(children).includes("\n");

                  if (!isCodeBlock) {
                    return (
                      <code {...props} style={styles.markdown.inlineCode}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div style={styles.markdown.codeBlockWrapper}>
                      <CopyButton code={codeText} isDark={isDark} />
                      <pre style={styles.markdown.codePre}>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </article>

        {!isEditing && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 4,
              padding: "0 4px",
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            <button
              type="button"
              onClick={handleCopyMessage}
              style={{
                background: "none",
                border: "none",
                color: colors.textMuted,
                cursor: "pointer",
                fontSize: 12,
                padding: 0,
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>

            {isUser && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.textMuted,
                  cursor: "pointer",
                  fontSize: 12,
                  padding: 0,
                }}
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
