// backend/rag-pipeline.js
// 将原来的 import pdf from "pdf-parse"; 替换为：
import { PDFParse } from "pdf-parse";
import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// --- 配置 ---
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";
const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "my_knowledge_base";

const qdrant = new QdrantClient({ url: QDRANT_URL });

/**
 * 1. 从 PDF 文件提取文本
 */
async function extractTextFromPDF(filePath) {
  console.log(`📄 正在解析 PDF: ${filePath}`);
  const dataBuffer = await fs.readFile(filePath);

  // 👈 必须使用 new PDFParse
  const parser = new PDFParse({ data: dataBuffer });
  try {
    const result = await parser.getText();
    console.log(`✅ PDF 解析完成，共 ${result.text.length} 个字符。`);
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/**
 * 2. 将长文本切分成小块
 */
function splitTextIntoChunks(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // 尝试在句子边界处切分
    const lastPeriod = chunk.lastIndexOf("。");
    const lastNewline = chunk.lastIndexOf("\n");
    const splitPoint = Math.max(lastPeriod, lastNewline);

    if (splitPoint > chunkSize * 0.5) {
      chunk = text.slice(start, start + splitPoint + 1);
      start += splitPoint + 1;
    } else {
      start += chunkSize - overlap;
    }
    if (chunk.trim()) chunks.push(chunk.trim());
  }
  console.log(`✂️ 文本已切分为 ${chunks.length} 个块。`);
  return chunks;
}

/**
 * 3. 调用 Ollama 生成文本的向量
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text,
    });
    return response.data.embedding;
  } catch (error) {
    console.error("❌ 生成向量失败:", error.message);
    throw error;
  }
}

/**
 * 4. 确保 Qdrant 中的集合存在
 */
async function ensureCollectionExists() {
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME,
    );
    if (!exists) {
      console.log(`🆕 创建 Qdrant 集合: ${COLLECTION_NAME}`);
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: { size: 768, distance: "Cosine" },
      });
    } else {
      console.log(`✅ 集合 "${COLLECTION_NAME}" 已存在。`);
    }
  } catch (error) {
    console.error("❌ 连接 Qdrant 或创建集合失败:", error.message);
    throw error;
  }
}

/**
 * 5. 主流程
 */
async function processPDF(filePath) {
  console.log("🚀 开始 RAG 数据管道处理...");

  const fullText = await extractTextFromPDF(filePath);
  const chunks = splitTextIntoChunks(fullText);
  await ensureCollectionExists();

  console.log("🧠 正在为每个文本块生成向量...");
  const points = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vector = await generateEmbedding(chunk);
    points.push({
      id: uuidv4(),
      vector: vector,
      payload: {
        text: chunk,
        source: filePath,
        chunkIndex: i,
      },
    });

    if ((i + 1) % 5 === 0) {
      console.log(`   已处理 ${i + 1}/${chunks.length} 个块...`);
    }
  }

  console.log(`📤 正在将 ${points.length} 个向量点存入 Qdrant...`);
  await qdrant.upsert(COLLECTION_NAME, { points: points });

  console.log("🎉 RAG 数据管道处理完成！");
}

// --- 执行脚本 ---
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error(
    "❌ 请提供 PDF 文件路径。用法: node rag-pipeline.js <pdf-file-path>",
  );
  process.exit(1);
}

processPDF(pdfPath).catch(console.error);
