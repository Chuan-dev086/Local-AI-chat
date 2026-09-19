// src/components/MessageList.jsx

import { getMessageListStyles, getThemeStyles } from "../theme/theme";
import MessageBubble from "./MessageBubble";

function MessageList({
  activeSession,
  loading,
  chatEndRef,
  theme,
  onEditMessage,
}) {
  const { messagesArea } = getThemeStyles(theme);
  const styles = getMessageListStyles(theme);

  const emptyMessage =
    activeSession?.mode === "code"
      ? "Ask a programming question to get started."
      : "Start a new conversation.";

  return (
    <div
      style={{
        messagesArea,
      }}
    >
      {activeSession?.messages.length === 0 && (
        <div style={styles.emptyContainer}>
          <div>
            <div style={styles.emptyIcon}>
              {activeSession?.mode === "code" ? "💻" : "💬"}
            </div>

            <div style={styles.emptyText}>{emptyMessage}</div>
          </div>
        </div>
      )}

      {activeSession?.messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          index={index}
          message={message}
          theme={theme}
          onEditMessage={onEditMessage}
        />
      ))}

      {loading && (
        <div style={styles.loadingWrapper}>
          <div style={styles.loadingBubble}>Thinking…</div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}

export default MessageList;
