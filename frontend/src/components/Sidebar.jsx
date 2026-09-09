// src/components/Sidebar.jsx

import { Button } from "@mui/material";
import { getThemeStyles, getToggleHoverColor } from "../theme/theme";

function Sidebar({
  sessions,
  activeSessionId,
  loading,
  theme,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}) {
  const { colors, sidebar } = getThemeStyles(theme);

  return (
    <aside
      style={{
        ...sidebar,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: colors.text,
            fontSize: 19,
            fontWeight: 700,
          }}
        >
          Local AI Chat
        </h2>

        <Button
          type="button"
          onClick={onNewChat}
          disabled={loading}
          variant="contained"
          fullWidth
          sx={{
            marginTop: 1.75,
            backgroundColor: loading ? colors.buttonDisabled : colors.buttonBg,
            color: "#ffffff",
            fontWeight: 700,
            textTransform: "none",
            fontSize: "1rem",
            padding: "10px 12px",
            "&:hover": {
              backgroundColor: loading
                ? colors.buttonDisabled
                : getToggleHoverColor(theme),
            },
          }}
        >
          + New Chat
        </Button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
        }}
      >
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                padding: "10px 8px 10px 10px",
                borderRadius: 8,
                backgroundColor: isActive
                  ? colors.activeSessionBg
                  : "transparent",
                color: colors.text,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease, color 0.2s ease",
              }}
            >
              <span
                title={session.title}
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {session.mode === "code" ? "💻 " : "💬 "}
                {session.title}
              </span>

              <button
                type="button"
                aria-label={`Delete ${session.title}`}
                title="Delete chat"
                onClick={(event) => onDeleteSession(event, session.id)}
                disabled={loading}
                style={{
                  border: "none",
                  borderRadius: 5,
                  padding: "3px 6px",
                  backgroundColor: "transparent",
                  color: colors.textMuted,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  transition: "color 0.2s ease",
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${colors.border}`,
          color: colors.textMuted,
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {sessions.length} {sessions.length === 1 ? "chat" : "chats"} saved
        locally
      </div>
    </aside>
  );
}

export default Sidebar;
