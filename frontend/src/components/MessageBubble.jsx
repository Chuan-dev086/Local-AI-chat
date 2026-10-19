// src/components/MessageBubble.jsx
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, TextField, Tooltip } from "@mui/material";
import { ContentCopy, Edit, Refresh, Check } from "@mui/icons-material";
import { getMessageBubbleStyles, getThemeStyles } from "../theme/theme";
import CopyButton from "./CopyButton";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";

// 格式化相对时间
function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

// 格式化精确时间
function formatFullTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function MessageBubble({
  message,
  theme,
  index,
  isLast,
  loading,
  onEditMessage,
  onRegenerate,
}) {
  const { isDark, colors } = getThemeStyles(theme);
  const isUser = message.role === "user";
  const styles = getMessageBubbleStyles(theme, isUser);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);

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
    <div
      style={{
        ...styles.container,
        animation: "fadeInUp 0.3s ease-out both",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: isUser ? "85%" : "100%",
          width: isEditing ? "100%" : isUser ? "auto" : "100%",
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
            <>
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
                    const match = /language-(\w+)/.exec(className || "");
                    const codeText = String(children).replace(/\n$/, "");
                    const isCodeBlock =
                      Boolean(className) || String(children).includes("\n");

                    // 如果是单行代码（比如 `useEffect`），保持原样
                    if (!isCodeBlock) {
                      return (
                        <code {...props} style={styles.markdown.inlineCode}>
                          {children}
                        </code>
                      );
                    }

                    // 如果是代码块，使用 SyntaxHighlighter 渲染
                    return (
                      <div style={styles.markdown.codeBlockWrapper}>
                        <CopyButton code={codeText} isDark={isDark} />
                        <SyntaxHighlighter
                          style={nightOwl}
                          language={match ? match[1] : "text"} // 自动识别语言
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: 8,
                            padding: "14px 48px 14px 14px",
                            fontSize: 13,
                            lineHeight: 1.55,
                            backgroundColor: "#0d1117",
                            border: "1px solid #30363d",
                          }}
                        >
                          {codeText}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* AI 流式输出时的闪烁光标 */}
              {isLast && loading && message.content !== "" && (
                <span className="typing-cursor" />
              )}
            </>
          )}
        </article>

        {!isEditing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 4,
              padding: "0 4px",
              color: colors.textMuted,
              fontSize: 12,
            }}
          >
            {/* 相对时间 */}
            {message.createdAt && (
              <Tooltip
                title={formatFullTime(message.createdAt)}
                placement="top"
                arrow
              >
                <span style={{ cursor: "default", opacity: 0.7 }}>
                  {formatRelativeTime(message.createdAt)}
                </span>
              </Tooltip>
            )}

            {/* 图标组 */}
            <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
              {/* 👇 新增：用户消息的“重发”按钮 */}
              {isUser && onRegenerate && (
                <Tooltip title="Resend" placement="top" arrow>
                  <button
                    type="button"
                    onClick={() => onRegenerate(index + 1)}
                    // 如果正在生成中，就禁用按钮防止重复点击
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: loading ? "not-allowed" : "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.2s",
                      opacity: loading ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) =>
                      !loading && (e.currentTarget.style.color = colors.text)
                    }
                    onMouseLeave={(e) =>
                      !loading &&
                      (e.currentTarget.style.color = colors.textMuted)
                    }
                  >
                    <Refresh fontSize="small" />
                  </button>
                </Tooltip>
              )}

              {/* Regenerate 按钮 (最后一条 AI 消息) */}
              {!isUser && isLast && onRegenerate && (
                <Tooltip title="Regenerate" placement="top" arrow>
                  <button
                    type="button"
                    onClick={() => onRegenerate(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = colors.text)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = colors.textMuted)
                    }
                  >
                    <Refresh fontSize="small" />
                  </button>
                </Tooltip>
              )}

              {/* Edit 按钮 (仅限用户消息) */}
              {isUser && (
                <Tooltip title="Edit" placement="top" arrow>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = colors.text)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = colors.textMuted)
                    }
                  >
                    <Edit fontSize="small" />
                  </button>
                </Tooltip>
              )}

              {/* Copy 按钮 (所有消息都有) */}
              <Tooltip
                title={copied ? "Copied!" : "Copy"}
                placement="top"
                arrow
              >
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  style={{
                    background: "none",
                    border: "none",
                    color: copied ? colors.buttonBg : "inherit",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    !copied && (e.currentTarget.style.color = colors.text)
                  }
                  onMouseLeave={(e) =>
                    !copied && (e.currentTarget.style.color = colors.textMuted)
                  }
                >
                  {copied ? (
                    <Check fontSize="small" />
                  ) : (
                    <ContentCopy fontSize="small" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
