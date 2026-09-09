// src/theme/theme.js

export const lightColors = {
  bg: "#f8fafc",
  containerBg: "#ffffff",
  sidebarBg: "#f1f5f9",
  border: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#64748b",
  messageBg: "#ffffff",
  userMessageBg: "#4f46e5",
  userMessageText: "#ffffff",
  inputBg: "#ffffff",
  codeBg: "#0f172a",
  codeText: "#e2e8f0",
  inlineCodeBg: "#dbeafe",
  inlineCodeText: "#1e3a8a",
  activeSessionBg: "#dbeafe",
  buttonBg: "#2563eb",
  buttonDisabled: "#94a3b8",
  toggleBtnBg: "#ffffff",
  toggleBtnBorder: "#cbd5e1",
  toggleBtnText: "#334155",
  linkColor: "#2563eb",
};

export const darkColors = {
  bg: "#0f172a",
  containerBg: "#1e293b",
  sidebarBg: "#334155",
  border: "#475569",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  messageBg: "#334155",
  userMessageBg: "#4f46e5",
  userMessageText: "#ffffff",
  inputBg: "#1e293b",
  codeBg: "#0d1117",
  codeText: "#e2e8f0",
  inlineCodeBg: "#1e293b",
  inlineCodeText: "#e2e8f0",
  activeSessionBg: "#1e40af",
  buttonBg: "#3b82f6",
  buttonDisabled: "#94a3b8",
  toggleBtnBg: "#475569",
  toggleBtnBorder: "#64748b",
  toggleBtnText: "#e2e8f0",
  linkColor: "#60a5fa",
};

export const getColors = (theme) => {
  return theme === "dark" ? darkColors : lightColors;
};

export const layoutStyles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    transition: "background-color 0.3s ease, color 0.3s ease",
  },

  container: {
    display: "flex",
    width: "100%",
    maxWidth: 1240,
    height: "calc(100vh - 48px)",
    minHeight: 620,
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: 16,
    transition:
      "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
  },

  sidebar: {
    display: "flex",
    flexDirection: "column",
    width: 270,
    flexShrink: 0,
    transition: "background-color 0.3s ease",
  },

  mainContent: {
    display: "flex",
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    transition: "background-color 0.3s ease",
  },

  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "18px 20px",
    transition: "background-color 0.3s ease",
  },

  inputArea: {
    padding: "14px 20px 16px",
    transition: "background-color 0.3s ease",
  },
};

export const shadowStyles = {
  lightContainer: "0 12px 36px rgba(15, 23, 42, 0.1)",
  darkContainer: "0 12px 36px rgba(0, 0, 0, 0.4)",

  lightMessage: "0 1px 3px rgba(15, 23, 42, 0.1)",
  darkMessage: "0 1px 3px rgba(0, 0, 0, 0.3)",
};

export const getThemeStyles = (theme) => {
  const isDark = theme === "dark";
  const colors = getColors(theme);

  return {
    isDark,
    colors,

    page: {
      ...layoutStyles.page,
      backgroundColor: colors.bg,
    },

    container: {
      ...layoutStyles.container,
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.containerBg,
      boxShadow: isDark
        ? shadowStyles.darkContainer
        : shadowStyles.lightContainer,
    },

    sidebar: {
      ...layoutStyles.sidebar,
      borderRight: `1px solid ${colors.border}`,
      backgroundColor: colors.sidebarBg,
    },

    mainContent: {
      ...layoutStyles.mainContent,
      backgroundColor: colors.containerBg,
    },

    messagesArea: {
      ...layoutStyles.messagesArea,
      backgroundColor: colors.bg,
    },

    inputArea: {
      ...layoutStyles.inputArea,
      borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.inputBg,
    },
  };
};

export const getMessageShadow = (theme) => {
  return theme === "dark"
    ? shadowStyles.darkMessage
    : shadowStyles.lightMessage;
};

export const getButtonHoverColor = (theme) => {
  return theme === "dark" ? "#1e40af" : "#1e40af";
};

export const getToggleHoverColor = (theme) => {
  return theme === "dark" ? "#526178" : "#f5f5f5";
};

export const codeFontFamily = 'Consolas, "Courier New", monospace';
