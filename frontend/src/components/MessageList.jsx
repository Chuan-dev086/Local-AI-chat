// src/components/MessageList.jsx

import { getThemeStyles } from "../theme/theme";
import MessageBubble from "./MessageBubble";

function MessageList({
  activeSession,
  loading,
  chatEndRef,
  theme,
}) {
  const { colors, messagesArea } = getThemeStyles(theme);

  const emptyMessage =
    activeSession?.mode === "code"
      ? "Ask a programming question to get started."
      : "Start a new conversation.";

  return (
    <div
      style={{
        ...messagesArea,
      }}
    >
      {activeSession?.messages.length === 0 && (
        <div
          style={{
            display: "grid",
            height: "100%",
            placeItems: "center",
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ marginBottom: 10, fontSize: 34 }}>
              {activeSession?.mode === "code" ? "💻" : "💬"}
            </div>

            <div style={{ fontSize: 15 }}>{emptyMessage}</div>
          </div>
        </div>
      )}

      {activeSession?.messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          message={message}
          theme={theme}
        />
      ))}

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            margin: "12px 0",
          }}
        >
          <div
            style={{
              padding: "10px 13px",
              borderRadius: "14px 14px 14px 4px",
              backgroundColor: colors.messageBg,
              boxShadow:
                theme === "dark"
                  ? "0 1px 3px rgba(0, 0, 0, 0.3)"
                  : "0 1px 3px rgba(15, 23, 42, 0.1)",
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            Thinking…
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}

export default MessageList;