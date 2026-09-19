// src/components/Sidebar.jsx


import { Button } from "@mui/material";
import { getSidebarStyles } from "../theme/theme";

function Sidebar({
  sessions,
  activeSessionId,
  loading,
  theme,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}) {
  const styles = getSidebarStyles(theme);

  return (
    <aside style={styles.aside}>
      <div style={styles.header}>
        <h2 style={styles.title}>Local AI Chat</h2>

        <Button
          type="button"
          onClick={onNewChat}
          disabled={loading}
          variant="contained"
          fullWidth
          sx={styles.newChatBtnSx(loading)}
        >
          + New Chat
        </Button>
      </div>

      <div style={styles.list}>
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;

          return (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSession(session.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelectSession(session.id);
                }
              }}
              style={styles.sessionItem(isActive, loading)}
            >
              <span title={session.title} style={styles.sessionTitle(isActive)}>
                {session.mode === "code" ? "💻 " : "💬 "}
                {session.title}
              </span>

              <button
                type="button"
                aria-label={`Delete ${session.title}`}
                title="Delete chat"
                onClick={(event) => onDeleteSession(event, session.id)}
                disabled={loading}
                style={styles.deleteBtn(loading)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.footer}>
        {sessions.length} {sessions.length === 1 ? "chat" : "chats"} saved
        locally
      </div>
    </aside>
  );
}

export default Sidebar;
