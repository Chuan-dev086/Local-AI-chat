import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434";

const MODELS = {
  chat: "llama3.2:3b",
  code: "qwen2.5-coder:3b",
};

const SYSTEM_PROMPTS = {
  chat: `
You are a friendly, natural, and empathetic virtual AI companion.

【CRITICAL LANGUAGE RULE - STRICT COMPLIANCE】
Detect the language of the user's latest message and reply STRICTLY in that same language:
- If the user sends English (e.g. "who invent java ?", "wassup", "how are you ?") -> You MUST reply ENTIRELY in English.
- If the user sends Chinese -> You MUST reply ENTIRELY in Chinese.
- If the user sends Malay -> You MUST reply ENTIRELY in Malay.

Guidelines:
1. Speak like a natural friend with a casual and warm tone. Keep responses brief and natural (1-3 sentences).
2. Respond to the user's emotions and topic directly without generating long lectures.
3. Do NOT invent real-life human experiences (e.g. do NOT pretend to go to offline parties, eat meals, or shop).
4. Unless explicitly asked, do NOT output code or technical tutorials.
`,

  code: `
You are a professional, efficient, and reliable coding assistant.

【STRICT LANGUAGE RULE - MUST FOLLOW】
Detect the language of the user's message and reply strictly in the same language:
1. If the user asks in English (e.g. "what is JavaScript?") -> You MUST reply ENTIRELY in English.
2. If the user asks in Chinese -> You MUST reply ENTIRELY in Chinese.

Your main tasks:
- Read and explain code across different programming languages.
- Generate complete, clean, and runnable code.
- Find and fix code bugs and explain error messages.
- Improve code structure, performance, and readability.

Supported languages include but are not limited to: JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, SQL, and Bash.

Strict Guidelines:
1. For clear coding requests, directly provide complete, standardized, and runnable code in Markdown code blocks with the correct language tag.
2. When explaining provided code, identify the language and purpose first, then explain key logic.
3. Keep existing functionality when modifying files, and provide full replacement code.
4. Write code comments in the same language as the user's prompt (or Chinese if requested), commenting only key logic.
5. Pay attention to input validation, edge cases, exception handling, and async error handling.
6. Never assume the user only uses JavaScript, React, Node.js, or Express.
7. Keep explanations clear, direct, and concise, avoiding unnecessary lengthy theory.
8. For error messages, explain the most likely cause first, then provide fix code and test steps.
9. Do not fabricate non-existent APIs, dependencies, files, or project structures.
10. State your assumptions clearly if key information is missing; ask questions only when unable to answer reliably.
`,
};

const sessions = new Map();

app.post("/api/chat", async (req, res) => {
  const { sessionId, message, mode = "chat" } = req.body;

  if (
    typeof sessionId !== "string" ||
    typeof message !== "string" ||
    !sessionId.trim() ||
    !message.trim()
  ) {
    return res.status(400).json({
      error: "less effective sessionId 或 message",
    });
  }

  const normalizedMode = mode === "code" ? "code" : "chat";
  const selectedModel = MODELS[normalizedMode];

  let session = sessions.get(sessionId);

  if (!session) {
    session = {
      mode: normalizedMode,
      messages: [],
    };

    sessions.set(sessionId, session);
  }

  session.mode = normalizedMode;

  const systemMessage = {
    role: "system",
    content: SYSTEM_PROMPTS[normalizedMode],
  };

  const userMessage = {
    role: "user",
    content: message.trim(),
  };

  const ollamaMessages = [systemMessage, ...session.messages, userMessage];

  console.log(
    `[Chat] session=${sessionId} mode=${normalizedMode} model=${selectedModel}`,
  );

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: selectedModel,
        messages: ollamaMessages,
        stream: false,
      },
      {
        timeout: 300000,
      },
    );

    const aiContent =
      response.data?.message?.content?.trim() ||
      "No response was returned by the model.";

    session.messages.push(userMessage);
    session.messages.push({
      role: "assistant",
      content: aiContent,
    });

    res.json({
      content: aiContent,
      model: selectedModel,
    });
  } catch (error) {
    const ollamaError =
      error.response?.data?.error || error.response?.data || error.message;

    console.error(`[Ollama Error] model=${selectedModel}`, ollamaError);

    res.status(500).json({
      error:
        "Model invocation failed. Please ensure Ollama is running and the model has been downloaded.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Node server running at http://localhost:${PORT}`);
  console.log(`General Chat model: ${MODELS.chat}`);
  console.log(`Programming Assistant model: ${MODELS.code}`);
});
