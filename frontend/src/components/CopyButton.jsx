// src/components/CopyButton.jsx

import { useState } from "react";

function CopyButton({ code, isDark }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        padding: "4px 8px",
        border: `1px solid ${isDark ? "#64748b" : "#94a3b8"}`,
        borderRadius: 6,
        backgroundColor: copied ? "#16a34a" : isDark ? "#475569" : "#334155",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        transition: "all 0.2s ease",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default CopyButton;
