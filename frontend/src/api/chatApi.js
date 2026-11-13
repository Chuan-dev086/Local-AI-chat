// src/api/chatApi.js

// 可通过 frontend/.env.local 中的 VITE_API_BASE 覆盖，例如 VITE_API_BASE=http://localhost:5000/api
export const API_BASE =
  import.meta.env.VITE_API_BASE?.trim() || "http://localhost:5000/api";
const CHAT_URL = `${API_BASE}/chat`;
const MODELS_URL = `${API_BASE}/models`;
const MODELS_TIMEOUT_MS = 5000;

// ========================================
// Error types
// ========================================

export class ChatApiError extends Error {
  constructor(message, { status = null, cause } = {}) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "ChatApiError";
    this.status = status;
  }
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

export async function syncSessionMessages(sessionId, messages) {
  let response;
  try {
    response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch (error) {
    throw new ChatApiError("无法连接到后端，消息未能保存。", { cause: error });
  }

  if (!response.ok) {
    throw new ChatApiError(await readErrorMessage(response), {
      status: response.status,
    });
  }

  return response.json();
}

// ========================================
// Chat title generation
// ========================================
export async function generateChatTitle(messages) {
  try {
    const response = await fetch(`${API_BASE}/generate-title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.title;
  } catch (error) {
    console.error("Failed to generate title:", error);
    return null;
  }
}

// 读取 HTTP 错误响应中的错误信息，解析失败时使用通用提示
async function readErrorMessage(response) {
  const fallback = `后端请求失败（HTTP ${response.status}）。`;
  try {
    const text = await response.text();
    if (!text) return fallback;

    try {
      const data = JSON.parse(text);
      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
    } catch {
      // 响应不是 JSON，使用通用提示
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// ========================================
// Model list
// ========================================

export async function fetchModels({ signal } = {}) {
  // 超时控制器：与外部 signal 合并，任一触发即中止请求
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), MODELS_TIMEOUT_MS);

  const forwardExternalAbort = () => timeoutController.abort();
  if (signal) {
    if (signal.aborted) {
      timeoutController.abort();
    } else {
      signal.addEventListener("abort", forwardExternalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(MODELS_URL, {
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      throw new ChatApiError(await readErrorMessage(response), {
        status: response.status,
      });
    }

    const data = await response.json();
    if (!Array.isArray(data?.models)) {
      throw new ChatApiError("模型列表返回格式不正确。");
    }

    return data.models.filter(
      (name) => typeof name === "string" && name.length > 0,
    );
  } catch (error) {
    // 外部主动取消（例如组件卸载）：原样抛出，由调用方忽略
    if (signal?.aborted) throw error;

    if (error instanceof ChatApiError) throw error;

    if (error instanceof SyntaxError) {
      throw new ChatApiError("模型列表返回了无效的 JSON。", { cause: error });
    }

    if (isAbortError(error)) {
      throw new ChatApiError("获取模型列表超时。", { cause: error });
    }

    throw new ChatApiError("无法连接到后端服务，请确认后端已启动。", {
      cause: error,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardExternalAbort);
  }
}

// ========================================
// Context Window & Token Truncation Helper
// ========================================

const MAX_SAFE_CONTEXT_CHARS = 8000; // 8k characters, ~2k tokens

/**
 * Truncate message history to fit within safe character limits and ensure
 * the first message starts with 'user' to prevent role-alternating errors.
 * Time Complexity: O(n) where n is the number of messages.
 * Space Complexity: O(n) for the filtered message array.
 * Edge Cases: Drops leading 'assistant' messages if the initial user message was truncated.
 */
function truncateMessagesByCharLimit(
  messages,
  maxChars = MAX_SAFE_CONTEXT_CHARS,
) {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  let accumulatedChars = 0;
  const truncated = [];

  // Iterate backwards from the newest message to the oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const contentLen = typeof msg.content === "string" ? msg.content.length : 0;

    if (accumulatedChars + contentLen > maxChars && truncated.length > 0) {
      break;
    }

    accumulatedChars += contentLen;
    truncated.unshift(msg);
  }

  // Ensure the first message in the array is always from the 'user' role
  while (truncated.length > 0 && truncated[0].role !== "user") {
    truncated.shift();
  }

  return truncated;
}

// ========================================
// Streaming chat (NDJSON)
// ========================================

/**
 * 发送聊天请求并逐段读取 NDJSON 响应。
 *
 * - 每个 `{content}` 帧调用一次 onChunk(content)
 * - 收到 `{error}` 帧：抛出 ChatApiError（不会被吞掉）
 * - 流结束但没有 `{done: true}` 帧：抛出 ChatApiError（生成中途断开）
 * - 用户取消（signal.abort）：抛出 AbortError，调用方用 isAbortError 判断
 *
 * 成功时返回 { completed: true }。
 */
export async function streamChat({
  sessionId,
  message,
  mode,
  model,
  systemPrompt,
  messages,
  onChunk,
  signal,
}) {
  if (typeof onChunk !== "function") {
    throw new TypeError("streamChat: onChunk must be a function.");
  }

  // 🛡️ Apply safe context window truncation with role validation
  const safeMessages = truncateMessagesByCharLimit(messages);

  let response;
  try {
    response = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message,
        mode,
        model,
        systemPrompt,
        messages: safeMessages,
      }),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ChatApiError("无法连接到后端服务，请确认后端已启动。", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new ChatApiError(await readErrorMessage(response), {
      status: response.status,
    });
  }

  if (!response.body) {
    throw new ChatApiError("当前浏览器不支持流式响应。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let finished = false;

  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let data;
    try {
      data = JSON.parse(trimmed);
    } catch (parseError) {
      console.error(
        "Failed to parse streaming line:",
        parseError,
        trimmed.slice(0, 200),
      );
      return;
    }

    if (data.error) {
      throw new ChatApiError(String(data.error));
    }

    if (typeof data.content === "string" && data.content) {
      onChunk(data.content);
    }

    if (data.done) {
      finished = true;
    }
  };

  try {
    while (!finished) {
      let result;
      try {
        result = await reader.read();
      } catch (error) {
        if (isAbortError(error)) throw error;
        throw new ChatApiError("读取生成内容时连接中断。", { cause: error });
      }

      const { value, done } = result;
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while (!finished && (newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        handleLine(line);
      }
    }

    if (!finished) {
      buffer += decoder.decode();
      if (buffer.trim()) handleLine(buffer);
    }

    if (!finished) {
      throw new ChatApiError("连接在生成完成前中断。");
    }

    return { completed: true };
  } finally {
    reader.cancel().catch(() => {});
  }
}
