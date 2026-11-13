// backend/rag-query.js
import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";

const OLLAMA_URL = "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";
const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "my_knowledge_base";

const qdrant = new QdrantClient({ url: QDRANT_URL });

async function searchKnowledge(query) {
  console.log(`\n🔍 正在搜索: "${query}"`);

  // 1. 把用户的问题也变成向量
  const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
    model: EMBEDDING_MODEL,
    prompt: query,
  });
  const queryVector = response.data.embedding;

  // 2. 去 Qdrant 里找最相似的 2 个文本块（使用最新的 query 接口）
  const searchResult = await qdrant.query(COLLECTION_NAME, {
    query: queryVector, // 👈 参数名从 vector 变成了 query
    limit: 2,
    with_payload: true,
  });

  // 3. 打印结果
  console.log("✅ 找到最相关的片段:");
  // 👈 新版接口返回的是包含 points 数组的对象
  searchResult.points.forEach((hit, index) => {
    console.log(`\n--- 匹配度: ${hit.score.toFixed(4)} ---`);
    console.log(hit.payload.text);
  });
}

// --- 执行测试 ---
// 用法: node rag-query.js "你的问题"
const query = process.argv[2];
if (!query) {
  console.error('❌ 请提供问题。用法: node rag-query.js "Python有什么优势？"');
  process.exit(1);
}

searchKnowledge(query).catch(console.error);
