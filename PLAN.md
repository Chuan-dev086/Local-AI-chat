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
| [x]  | Preset Prompt Templates                      | —      | —     | 下拉选择“Python Expert”“Writing Assistant”等预设角色模型 |
| [x]  | Smart Auto-Scroll & Jump to Bottom           | —      | —     | 监听滚动位置，生成中平滑跟随；距离底部超过 300px 显示“回到底部”悬浮按钮 |
| [x]  | Auto-Generate Chat Titles / 自动会话标题     | P3     | 低    | 第一条消息发送时前端先截取前 12 个字作为初始标题，并在第一轮对话完成后由后端 `/api/generate-title` 调用模型提炼简短标题并异步更新落库 |
| [ ]  | Token-based Dynamic Context Truncation       | —      | —     | 当前仅实现了前端字符数安全滑动窗口截断（~8000 字符），真实按 Token 动态计算截断待实现（待验证） |
| [ ]  | Multi-Model Arena                            | —      | —     | 两个本地模型并排回答同一提示，便于比较                   |
| [x]  | 多会话 Sidebar                               | P1     | 中    | 像 ChatGPT 一样管理不同主题的聊天，修复了乱码模式图标    |
| [x]  | 删除、重命名会话                             | P4     | 低—中 | 支持侧边栏无缝双击行内编辑重命名与删除后会话焦点智能切换 |
| [x]  | 清空当前聊天                                 | P10    | 低    | 不删除会话，顶部添加带确认的垃圾桶按钮一键清空消息队列   |

## 🧠 Advanced AI Capabilities & Settings

| 状态 | 功能                            | 优先级 | 难度  | 价值 / 说明                                                                                                  |
| ---- | ------------------------------- | ------ | ----- | ------------------------------------------------------------------------------------------------------------ |
| [ ]  | Advanced Parameter Tuning UI    | —      | —     | 暴露 `temperature`、`top_p`、`top_k`、`num_ctx` 滑块                                                         |
| [ ]  | 设置页                          | P17    | 中    | 配置模型、端口、默认模式、回答语言；可承载参数调优                                                           |
| [x]  | Multimodal Support (Vision)     | —      | —     | 支持拖拽/上传图片并转 base64 预览渲染，后端支持 20MB 扩容与智能模型轮换路由（自动路由到 qwen2.5vl:3b/llava） |
| [ ]  | Local Function Calling / Agents | —      | —     | 调用本地工具：读文件、沙箱 Python、获取本地时间等                                                            |
| [ ]  | Voice I/O / 语音输入与朗读      | P18    | 中—高 | Web Speech API 实现 STT 输入与 TTS 输出                                                                      |

## 📚 Knowledge & RAG

| 状态 | 功能                         | 优先级 | 难度  | 价值 / 说明                                                 |
| ---- | ---------------------------- | ------ | ----- | ----------------------------------------------------------- |
| [ ]  | RAG Context Indicator        | —      | —     | Quick Win：使用文档时显示“📎 Referenced 3 local chunks”徽标 |
| [ ]  | 文件上传与多格式文档解析     | P12    | 中—高 | PDF 上传已支持解析并入库 Qdrant，纯文本附件已支持；DOCX、CSV、Markdown 等多格式解析待实现 |
| [ ]  | Visual Citations             | —      | —     | AI 回答中可点击脚注 `[1]`，侧栏高亮来源段落                 |
| [x]  | RAG 知识库与本地向量库       | P13    | 高    | 已集成 Qdrant 向量库与 `nomic-embed-text`，支持 PDF 上传、自动分块、生成向量并写入知识库，提问时支持 `useRag` 检索 Top 10 相关片段并注入 Prompt（早期基础版） |
| [ ]  | Knowledge Base Management UI | —      | —     | 查看、删除、手动重建上传文档索引、知识库隔离等（未有：文档管理、文档删除、知识库隔离、来源引用） |
| [x]  | 代码文件分析                 | P14    | 中    | 支持上传 `.js`、`.jsx`、`.py` 等纯文本源码文件作为附件，配合编程助手模式 System Prompt 分析或 review（已实现基础版） |

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
| [x]  | Session Pinning & Tagging                            | —      | —    | 会话置顶已完成（`Session.isPinned` 字段、`PATCH /api/sessions/:id/pin` 接口、侧栏图钉按钮与优先排序）；标签管理（Tagging）待实现 |
| [ ]  | PWA Support                                          | —      | —    | 可安装为 PWA，支持离线访问与原生窗口体验              |

## 🛠️ System, Architecture & Engineering

| 状态 | 功能                                              | 优先级 | 难度 | 价值 / 说明                                                                                        |
| ---- | ------------------------------------------------- | ------ | ---- | -------------------------------------------------------------------------------------------------- |
| [x]  | Modular Backend                                   | —      | —    | 路由、控制器、Ollama 代理逻辑清晰分离                                                              |
| [x]  | Environment Variables                             | —      | —    | 通过 `.env` 文件 safe 配置                                                                         |
| [x]  | 持久化存储升级：MongoDB 会话与消息双集合持久化    | P2/P16 | 中   | 采用 Express + Mongoose 将会话与消息分别存储在 MongoDB 的 `sessions` 与 `messages` 集合，支持 `$lookup` 联合查询，彻底突破浏览器 5MB 限制 |
| [ ]  | Desktop App Packaging (Tauri/Electron)            | —      | —    | 打包前端、后端与内嵌 Ollama 为 `.exe` / `.dmg`                                                     |
| [ ]  | Docker Compose Setup                              | —      | —    | 当前已提供 `docker-compose.yml` 用于容器化部署 Qdrant 向量库；前端、后端及 MongoDB 的全栈一键编排待实现 |
| [ ]  | TypeScript Migration                              | —      | —    | 渐进迁移前后端到 TypeScript                                                                        |
| [ ]  | Automated Testing                                 | —      | —    | 使用 Vitest/Jest 测试上下文截断、文本分块等核心逻辑                                                |
