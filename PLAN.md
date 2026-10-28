# Local AI Chat — Plan

> 整合自 `AI_chat/local AI model todolist.md` 与 `AI_chat/Qwen_markdown_20261028_cqe94rbuw.md`。  
> 图例：`[x]` 已完成，`[ ]` 待办/实验；`P1-P18` 来自 todolist；`—` 表示原文件未提供；重叠项已合并。

## 🌟 Core Chat Experience

| 状态 | 功能                                         | 优先级 | 难度  | 价值 / 说明                                              |
| ---- | -------------------------------------------- | ------ | ----- | -------------------------------------------------------- |
| [x]  | Real-time Streaming / 流式回答               | P5     | 中—高 | AI 边生成边显示，减少等待感                              |
| [x]  | Stop Generation / 中断生成                   | P6     | 中—高 | 通过 UI 或 `Esc` 即时中止回答                            |
| [x]  | Message Editing & Regeneration               | —      | —     | 编辑历史提示或重新生成 AI 回答                           |
| [x]  | Multi-turn Context                           | —      | —     | 保持会话多轮上下文                                       |
| [x]  | Per-session Model Selection / 模型选择器     | P7     | 中    | 在会话内切换本地 Ollama 模型                             |
| [x]  | Custom System Prompts / 自定义 system prompt | P8     | 低—中 | 为单个会话定义 AI 行为                                   |
| [ ]  | Preset Prompt Templates                      | —      | —     | Quick Win：下拉选择“Python Expert”“Socratic Tutor”等预设 |
| [ ]  | Smart Auto-Scroll & Jump to Bottom           | —      | —     | 流式输出时防止滚动劫持，并提供“回到底部”按钮             |
| [ ]  | Auto-Generate Chat Titles / 自动会话标题     | P3     | 低    | 用首条问题或轻量本地模型生成/截断标题                    |
| [ ]  | Token-based Dynamic Context Truncation       | —      | —     | 按 token 限制智能截断历史，避免长输入 OOM                |
| [ ]  | Multi-Model Arena                            | —      | —     | 两个本地模型并排回答同一提示，便于比较                   |
| [ ]  | 多会话 Sidebar                               | P1     | 中    | 像 ChatGPT 一样管理不同主题的聊天                        |
| [ ]  | 删除、重命名会话                             | P4     | 低—中 | 更好管理聊天记录                                         |
| [ ]  | 清空当前聊天                                 | P10    | 低    | 不删除会话，只删除该会话的消息                           |

## 🧠 Advanced AI Capabilities & Settings

| 状态 | 功能                            | 优先级 | 难度  | 价值 / 说明                                               |
| ---- | ------------------------------- | ------ | ----- | --------------------------------------------------------- |
| [ ]  | Advanced Parameter Tuning UI    | —      | —     | 暴露 `temperature`、`top_p`、`top_k`、`num_ctx` 滑块      |
| [ ]  | 设置页                          | P17    | 中    | 配置模型、端口、默认模式、回答语言；可承载参数调优        |
| [ ]  | Multimodal Support (Vision)     | —      | —     | 图片上传并以 base64 传给 `llava`、`qwen2.5-vl` 等视觉模型 |
| [ ]  | Local Function Calling / Agents | —      | —     | 调用本地工具：读文件、沙箱 Python、获取本地时间等         |
| [ ]  | Voice I/O / 语音输入与朗读      | P18    | 中—高 | Web Speech API 实现 STT 输入与 TTS 输出                   |

## 📚 Knowledge & RAG

| 状态 | 功能                         | 优先级 | 难度  | 价值 / 说明                                                 |
| ---- | ---------------------------- | ------ | ----- | ----------------------------------------------------------- |
| [ ]  | RAG Context Indicator        | —      | —     | Quick Win：使用文档时显示“📎 Referenced 3 local chunks”徽标 |
| [ ]  | 文件上传与多格式文档解析     | P12    | 中—高 | 上传 txt、md、PDF、DOCX、CSV，让 AI 基于文件回答            |
| [ ]  | Visual Citations             | —      | —     | AI 回答中可点击脚注 `[1]`，侧栏高亮来源段落                 |
| [ ]  | RAG 知识库与本地向量库       | P13    | 高    | 从多份笔记检索后回答；集成 LanceDB、ChromaDB 或 SQLite-VSS  |
| [ ]  | Knowledge Base Management UI | —      | —     | 查看、删除、手动重建上传文档索引                            |
| [ ]  | 代码文件分析                 | P14    | 中    | 上传 `.js`、`.jsx`、`.py`，请 AI 解释或 review              |

## 🎨 UI/UX & Workflow Details

| 状态 | 功能                                                 | 优先级 | 难度 | 价值 / 说明                                           |
| ---- | ---------------------------------------------------- | ------ | ---- | ----------------------------------------------------- |
| [x]  | Syntax Highlighting & LaTeX / 代码语言与主题基础优化 | P11    | 中   | 代码块高亮与数学公式渲染                              |
| [x]  | Dark & Light Mode                                    | —      | —    | 系统感知或手动切换主题                                |
| [x]  | Markdown Export / 导出聊天记录                       | P9     | 低   | Markdown 导出已完成；TXT 可作为扩展                   |
| [x]  | Session Search / 对话搜索                            | P15    | 中   | 全局搜索会话标题与内容，`Ctrl/Cmd + K`                |
| [ ]  | Streaming Markdown Fix                               | —      | —    | 流式输出时优雅处理未闭合代码围栏或 `**`，防止布局抖动 |
| [ ]  | Advanced Code Block Interactions                     | —      | —    | 行号、长代码自动折叠、“Explain this code”、复制反馈   |
| [ ]  | Expanded Keyboard Shortcuts                          | —      | —    | `Ctrl + /` 聚焦输入，`Alt + Up/Down` 切换会话等       |
| [ ]  | Session Pinning & Tagging                            | —      | —    | 固定重要聊天或打标签，如“Work”“Study”                 |
| [ ]  | PWA Support                                          | —      | —    | 可安装为 PWA，支持离线访问与原生窗口体验              |

## 🛠️ System, Architecture & Engineering

| 状态 | 功能                                              | 优先级 | 难度 | 价值 / 说明                                                                                     |
| ---- | ------------------------------------------------- | ------ | ---- | ----------------------------------------------------------------------------------------------- |
| [x]  | Modular Backend                                   | —      | —    | 路由、控制器、Ollama 代理逻辑清晰分离                                                           |
| [x]  | Environment Variables                             | —      | —    | 通过 `.env` 文件安全配置                                                                        |
| [ ]  | 持久化存储升级：完整会话持久化与 SQLite/IndexedDB | P2/P16 | 中   | 先实现全量 localStorage 保存所有会话；长期迁移 IndexedDB 或 SQLite，突破 5MB 限制并支持复杂查询 |
| [ ]  | Desktop App Packaging (Tauri/Electron)            | —      | —    | 打包前端、后端与内嵌 Ollama 为 `.exe` / `.dmg`                                                  |
| [ ]  | Docker Compose Setup                              | —      | —    | 一键部署前端、后端与向量数据库                                                                  |
| [ ]  | TypeScript Migration                              | —      | —    | 渐进迁移前后端到 TypeScript                                                                     |
| [ ]  | Automated Testing                                 | —      | —    | 使用 Vitest/Jest 测试上下文截断、文本分块等核心逻辑                                             |
