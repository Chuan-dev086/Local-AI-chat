// src/components/MessageBubble.jsx

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  codeFontFamily,
  getMessageShadow,
  getThemeStyles,
} from "../theme/theme";
import CopyButton from "./CopyButton";

function MessageBubble({ message, theme }) {
  const { isDark, colors } = getThemeStyles(theme);
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        margin: "12px 0",
      }}
    >
      <article
        style={{
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
        }}
      >
        {isUser ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1
                  style={{
                    margin: "8px 0",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2
                  style={{
                    margin: "8px 0",
                    fontSize: 19,
                    fontWeight: 700,
                  }}
                >
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3
                  style={{
                    margin: "8px 0",
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <div style={{ margin: "8px 0" }}>{children}</div>
              ),

              pre: ({ children }) => <>{children}</>,

              code: ({ className, children, ...props }) => {
                const codeText = String(children).replace(/\n$/, "");
                const isCodeBlock =
                  Boolean(className) || String(children).includes("\n");

                if (!isCodeBlock) {
                  return (
                    <code
                      {...props}
                      style={{
                        padding: "2px 5px",
                        borderRadius: 4,
                        backgroundColor: colors.inlineCodeBg,
                        color: colors.inlineCodeText,
                        fontFamily: codeFontFamily,
                        fontSize: "0.9em",
                      }}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <div
                    style={{
                      position: "relative",
                      margin: "10px 0",
                    }}
                  >
                    <CopyButton code={codeText} isDark={isDark} />

                    <pre
                      style={{
                        margin: 0,
                        overflowX: "auto",
                        padding: "14px 48px 14px 14px",
                        borderRadius: 8,
                        backgroundColor: colors.codeBg,
                        color: colors.codeText,
                        fontFamily: codeFontFamily,
                        fontSize: 13,
                        lineHeight: 1.55,
                      }}
                    >
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
    </div>
  );
}

export default MessageBubble;
