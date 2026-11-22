// backend/rag-pipeline.js
import { PDFParse } from "pdf-parse";
import { QdrantClient } from "@qdrant/js-client-rest";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// --- 配置 ---
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";
const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "my_knowledge_base";
const MAX_PDF_CHARS = Number(process.env.MAX_PDF_CHARS) || 2000000;

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
 * 1.5 清洗 PDF 提取的文本
 * - 删除独占一行的页码标记（如 "-- 2 of 3 --"、"— 1 of 10 —"、"- 2 of 3 -"）
 * - 同一段落内的硬换行替换为空格，保留段落之间的连续换行
 */
export function cleanPDFText(text) {
  if (!text) return "";

  // 统一换行符
  let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 删除独占一行的页码标记
  normalized = normalized.replace(
    /^[ \t]*[-—]{1,2}\s*\d+\s+(?:of|\/)\s+\d+\s*[-—]{1,2}[ \t]*$/gmi,
    "",
  );

  // 按连续空行切分成段落
  const paragraphs = normalized.split(/\n\s*\n/);

  // 对每个段落内部的单个硬换行替换为空格，压缩行内多余空格
  const cleanedParagraphs = paragraphs
    .map((p) => {
      return p
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ");
    })
    .filter((p) => p.length > 0);

  return cleanedParagraphs.join("\n\n");
}

/**
 * 2. 将长文本切分成小块
 * - 优先在句末符号（。！？以及英文 . ! ? 后接空白/结尾）或段落边界断开，不在句子中间切断
 * - 保持 chunkSize 1500 / overlap 200 的量级不变
 */
export function splitTextIntoChunks(text, chunkSize = 1500, overlap = 200) {
  if (!text || typeof text !== "string") return [];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    // 剩余文本若小于等于 chunkSize，直接存入最终切块
    if (text.length - start <= chunkSize) {
      const finalChunk = text.slice(start).trim();
      if (finalChunk) chunks.push(finalChunk);
      break;
    }

    const candidate = text.slice(start, start + chunkSize);

    // 匹配句子末尾：段落分隔符 \n\n，中文标点 [。！？]，或英文标点 [.!?] 后跟随空白符、引号、括号或行尾
    const sentenceEndRegex = /(?:\n\s*\n|[。！？]|[!?.]+(?=\s|$|["'”’\)]))/g;
    let match;
    let bestSplit = -1;

    // 优先在 candidate 较后位置（>= candidate.length * 0.4）寻找自然句末断开点
    while ((match = sentenceEndRegex.exec(candidate)) !== null) {
      const endPos = match.index + match[0].length;
      if (endPos >= candidate.length * 0.4) {
        bestSplit = endPos;
      }
    }

    // 次级回退：若在后半段未找到标点，回退寻找普通空格或单换行
    if (bestSplit === -1) {
      const spaceRegex = /\s+/g;
      while ((match = spaceRegex.exec(candidate)) !== null) {
        const endPos = match.index + match[0].length;
        if (endPos >= candidate.length * 0.4) {
          bestSplit = endPos;
        }
      }
    }

    // 终极保底：若整段无任何空隙，截断候选块全部字符
    if (bestSplit === -1) {
      bestSplit = candidate.length;
    }

    const chunk = candidate.slice(0, bestSplit).trim();
    if (chunk) chunks.push(chunk);

    const cutEnd = start + bestSplit;
    if (cutEnd >= text.length) break;

    // 下一个 chunk 的起始点计算（保持 ~200 字符的 overlap，并在就近的词边界对齐）
    let nextStart = cutEnd - overlap;
    if (nextStart <= start) {
      nextStart = cutEnd;
    } else {
      const spaceIdx = text.indexOf(" ", nextStart);
      if (spaceIdx !== -1 && spaceIdx < cutEnd) {
        nextStart = spaceIdx + 1;
      }
    }
    start = nextStart;
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
 * @param {string} filePath - 本地暂存文件路径
 * @param {string} [originalName] - 原始文件名，用于 Qdrant payload.source 及防重复替换
 */
export async function processPDFToQdrant(filePath, originalName) {
  const docSource = originalName || path.basename(filePath);
  console.log(`🚀 开始 RAG 数据管道处理: "${docSource}"`);

  const rawText = await extractTextFromPDF(filePath);
  const cleanedText = cleanPDFText(rawText);

  if (!cleanedText.trim()) {
    const error = new Error("PDF 解析后纯文本内容为空，无法生成知识库切片。");
    error.code = "EMPTY_PDF_CONTENT";
    throw error;
  }

  if (cleanedText.length > MAX_PDF_CHARS) {
    const error = new Error(
      `PDF 解析后文本字符数 (${cleanedText.length}) 超出允许的上限 (${MAX_PDF_CHARS} 字符)。`,
    );
    error.code = "PDF_TOO_LONG";
    throw error;
  }

  const chunks = splitTextIntoChunks(cleanedText);
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
        source: docSource,
        chunkIndex: i,
      },
    });

    if ((i + 1) % 5 === 0) {
      console.log(`   已处理 ${i + 1}/${chunks.length} 个块...`);
    }
  }

  // 4.1 防重复：切块向量全部生成完毕后，再按 payload.source === docSource 删除该文件已有的旧向量点
  console.log(`🧹 检查并清理 Qdrant 中已有同名文档切片: "${docSource}"...`);
  try {
    await qdrant.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: "source",
            match: {
              value: docSource,
            },
          },
        ],
      },
      wait: true,
    });
  } catch (deleteError) {
    console.warn(`⚠️ 删除旧数据警告 (非致命): ${deleteError.message}`);
  }

  console.log(`📤 正在将 ${points.length} 个向量点存入 Qdrant...`);
  await qdrant.upsert(COLLECTION_NAME, { points: points });

  console.log(`🎉 RAG 数据管道处理完成，文档 "${docSource}" 成功入库 ${points.length} 个切片！`);
}

/**
 * 6. 自测函数：对硬换行、页码标记与切块做独立验证
 */
export function runSelfTest() {
  const sampleText = `Python is an interpreted, high-level, general-purpose
programming language. Created by Guido van Rossum and first
released in 1991, Python's design philosophy emphasizes code readability.

-- 1 of 3 --

Its language constructs and object-oriented approach aim to help
programmers write clear, logical code for small and large-scale projects.
Is Python dynamically-typed? Yes, it is! Garbage collection is supported.

-- 2 of 3 --

In Python, memory management is handled automatically.
It supports multiple programming paradigms, including structured,
object-oriented and functional programming.`;

  console.log("=== 1. 原始样例文本 (含硬换行与页码标记) ===");
  console.log(sampleText);

  console.log("\n=== 2. cleanPDFText 清洗后文本 ===");
  const cleaned = cleanPDFText(sampleText);
  console.log(cleaned);

  console.log("\n=== 3. splitTextIntoChunks 切块测试 (chunkSize=140, overlap=30) ===");
  const testChunks = splitTextIntoChunks(cleaned, 140, 30);
  testChunks.forEach((chunk, idx) => {
    console.log(`[块 ${idx + 1}] (${chunk.length} 字): ${JSON.stringify(chunk)}`);
  });

  return { cleaned, testChunks };
}

// --- 执行脚本 ---
if (process.argv[1] && process.argv[1].endsWith("rag-pipeline.js")) {
  if (process.argv.includes("--test")) {
    runSelfTest();
    process.exit(0);
  }

  const pdfPath = process.argv[2];
  const originalName =
    process.argv[3] || (pdfPath ? path.basename(pdfPath) : "");
  if (!pdfPath) {
    console.error(
      "❌ 请提供 PDF 文件路径。用法: node rag-pipeline.js <pdf-file-path> [original-name] 或 node rag-pipeline.js --test",
    );
    process.exit(1);
  }
  processPDFToQdrant(pdfPath, originalName).catch(console.error);
}
