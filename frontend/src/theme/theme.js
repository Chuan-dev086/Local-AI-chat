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
    width: "100vw",
    height: "100vh",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    transition: "background-color 0.3s ease, color 0.3s ease",
    overflow: "hidden",
  },

  container: {
    display: "flex",
    width: "100%",
    maxWidth: 1240,
    height: "100%",
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
    height: "100%",
    transition: "background-color 0.3s ease",
  },

  mainContent: {
    display: "flex",
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    height: "100%",
    flexDirection: "column",
    transition: "background-color 0.3s ease",
  },

  messagesArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "18px 20px",
    transition: "background-color 0.3s ease",
  },

  inputArea: {
    padding: "14px 20px 16px",
    flexShrink: 0,
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

export const getMessageBubbleStyles = (theme, isUser) => {
  const { colors } = getThemeStyles(theme);

  return {
    container: {
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      margin: "12px 0",
    },
    bubble: {
      maxWidth: "80%",
      overflowWrap: "anywhere",
      padding: "10px 13px",
      borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
      backgroundColor: isUser ? colors.userMessageBg : colors.messageBg,
      boxShadow: isUser ? "none" : getMessageShadow(theme),
      color: isUser ? colors.userMessageText : colors.text,
      fontSize: 15,
      lineHeight: 1.65,
      transition: "all 0.2s ease",
    },
    userText: {
      whiteSpace: "pre-wrap",
    },
    markdown: {
      h1: {
        margin: "8px 0",
        fontSize: 22,
        fontWeight: 700,
      },
      h2: {
        margin: "8px 0",
        fontSize: 19,
        fontWeight: 700,
      },
      h3: {
        margin: "8px 0",
        fontSize: 17,
        fontWeight: 700,
      },
      p: {
        margin: "8px 0",
      },
      inlineCode: {
        padding: "2px 5px",
        borderRadius: 4,
        backgroundColor: colors.inlineCodeBg,
        color: colors.inlineCodeText,
        fontFamily: codeFontFamily,
        fontSize: "0.9em",
      },
      codeBlockWrapper: {
        position: "relative",
        margin: "10px 0",
      },
      codePre: {
        margin: 0,
        overflowX: "auto",
        padding: "14px 48px 14px 14px",
        borderRadius: 8,
        backgroundColor: colors.codeBg,
        color: colors.codeText,
        fontFamily: codeFontFamily,
        fontSize: 13,
        lineHeight: 1.55,
      },
    },
  };
};

export const getMessageListStyles = (theme) => {
  const { colors } = getThemeStyles(theme);

  return {
    emptyContainer: {
      display: "grid",
      height: "100%",
      placeItems: "center",
      color: colors.textMuted,
      textAlign: "center",
    },
    emptyIcon: {
      marginBottom: 10,
      fontSize: 34,
    },
    emptyText: {
      fontSize: 15,
    },
    loadingWrapper: {
      display: "flex",
      justifyContent: "flex-start",
      margin: "12px 0",
    },
    loadingBubble: {
      padding: "10px 13px",
      borderRadius: "14px 14px 14px 4px",
      backgroundColor: colors.messageBg,
      boxShadow: getMessageShadow(theme),
      color: colors.textMuted,
      fontSize: 14,
    },
  };
};

export const getSidebarStyles = (theme) => {
  const { colors, sidebar } = getThemeStyles(theme);

  return {
    aside: {
      ...sidebar,
    },
    header: {
      padding: 16,
      borderBottom: `1px solid ${colors.border}`,
      flexShrink: 0,
    },
    title: {
      margin: 0,
      color: colors.text,
      fontSize: 19,
      fontWeight: 700,
    },
    newChatBtnSx: (loading) => ({
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
    }),
    list: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: 10,
    },
    sessionItem: (isActive, loading) => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
      padding: "10px 8px 10px 10px",
      borderRadius: 8,
      backgroundColor: isActive ? colors.activeSessionBg : "transparent",
      color: colors.text,
      cursor: loading ? "not-allowed" : "pointer",
      transition: "background-color 0.2s ease, color 0.2s ease",
    }),
    sessionTitle: (isActive) => ({
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 14,
      fontWeight: isActive ? 700 : 500,
    }),
    deleteBtn: (loading) => ({
      border: "none",
      borderRadius: 5,
      padding: "3px 6px",
      backgroundColor: "transparent",
      color: colors.textMuted,
      cursor: loading ? "not-allowed" : "pointer",
      fontSize: 15,
      fontWeight: 700,
      transition: "color 0.2s ease",
    }),
    footer: {
      padding: 12,
      borderTop: `1px solid ${colors.border}`,
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 1.5,
      flexShrink: 0,
    },
  };
};

export const getChatHeaderStyles = (theme) => {
  const { colors } = getThemeStyles(theme);

  return {
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      padding: "16px 20px",
      borderBottom: `1px solid ${colors.border}`,
      transition: "border-color 0.3s ease",
      flexShrink: 0,
    },
    titleContainer: {
      minWidth: 0,
      flex: 1,
    },
    title: {
      margin: 0,
      overflow: "hidden",
      color: colors.text,
      fontSize: 20,
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontWeight: 700,
    },
    subtitle: {
      margin: "4px 0 0",
      color: colors.textMuted,
      fontSize: 13,
    },
    actionsContainer: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    formControlSx: {
      minWidth: 140,
    },
    inputLabelSx: {
      color: colors.textMuted,
    },
    selectSx: {
      color: colors.text,
      backgroundColor: colors.inputBg,
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: colors.border,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: colors.border,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: colors.buttonBg,
      },
      "& .MuiSvgIcon-root": {
        color: colors.text,
      },
    },
    renameBtnSx: {
      borderColor: colors.toggleBtnBorder,
      color: colors.toggleBtnText,
      backgroundColor: colors.toggleBtnBg,
      textTransform: "none",
      fontSize: "0.9rem",
      "&:hover": {
        backgroundColor: getToggleHoverColor(theme),
      },
    },
    themeToggleBtnSx: {
      borderRadius: 1,
      border: `1px solid ${colors.toggleBtnBorder}`,
      color: colors.toggleBtnText,
      backgroundColor: colors.toggleBtnBg,
      padding: "7px 10px",
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: getToggleHoverColor(theme),
      },
    },
  };
};

export const getChatInputStyles = (theme, loading, isInputEmpty) => {
  const { colors, inputArea } = getThemeStyles(theme);

  return {
    container: {
      ...inputArea,
    },
    inputWrapper: {
      display: "flex",
      gap: 10,
    },
    textFieldSx: {
      "& .MuiOutlinedInput-root": {
        color: colors.text,
        backgroundColor: loading ? colors.bg : colors.inputBg,
        "& fieldset": {
          borderColor: colors.border,
        },
        "&:hover fieldset": {
          borderColor: colors.border,
        },
        "&.Mui-focused fieldset": {
          borderColor: colors.buttonBg,
        },
      },
      "& .MuiOutlinedInput-input::placeholder": {
        color: colors.textMuted,
        opacity: 1,
      },
    },
    sendBtnSx: {
      minWidth: 92,
      backgroundColor:
        loading || isInputEmpty ? colors.buttonDisabled : "#4f46e5",
      color: "#ffffff",
      fontWeight: 700,
      textTransform: "none",
      fontSize: "1rem",
      padding: "9px 16px",
      borderRadius: "10px",
      "&:hover": {
        backgroundColor:
          loading || isInputEmpty ? colors.buttonDisabled : "#3f3bc4",
      },
    },
    tipText: {
      margin: "8px 0 0",
      color: colors.textMuted,
      fontSize: 12,
    },
  };
};
