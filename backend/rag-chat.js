// backend/rag-chat.js
import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";

const OLLAMA_URL = "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";
const CHAT_MODEL = "qwen3:4b-instruct-2507-q4_K_M"; // 你的聊天模型
const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "my_knowledge_base";

const qdrant = new QdrantClient({ url: QDRANT_URL });

async function askRAG(query) {
  console.log(`\n🙋 用户提问: "${query}"`);

  // 1. 将问题向量化
  const embedRes = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
    model: EMBEDDING_MODEL,
    prompt: query,
  });
  const queryVector = embedRes.data.embedding;

  // 2. 检索知识库（取最相关的 2 个片段）
  const searchResult = await qdrant.query(COLLECTION_NAME, {
    query: queryVector,
    limit: 2,
    with_payload: true, // 👈 加上这一行
  });

  // 把检索到的文本拼接成上下文
  const context = searchResult.points
    .map((hit) => hit.payload.text)
    .join("\n\n");
  console.log(
    `\n📚 已从知识库检索到 ${searchResult.points.length} 个相关片段。`,
  );

  // 3. 构造严格的 RAG 提示词
  const systemPrompt = `You are a helpful assistant. Answer the user's question based ONLY on the following context. If the answer is not in the context, say "I don't know based on the provided context."\n\nContext:\n${context}`;

  console.log(`\n🤖 AI 正在思考并生成回答...\n`);

  // 4. 调用聊天模型
  try {
    const chatRes = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      stream: false, // 简单起见，这里先用非流式，一次性打印
    });

    console.log("================ 最终回答 ================");
    console.log(chatRes.data.message.content);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ 生成回答失败:", error.message);
  }
}

// --- 执行测试 ---
const query = process.argv[2];
if (!query) {
  console.error('❌ 请提供问题。用法: node rag-chat.js "Python有什么优势？"');
  process.exit(1);
}

askRAG(query).catch(console.error);
