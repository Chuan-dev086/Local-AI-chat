# 项目总纲：Local AI Chat

## 项目是什么
本地私有 AI 聊天平台。React 19 + Vite + MUI（frontend/），Express 5 + Mongoose（backend/，ESM），
MongoDB 存会话和消息，Ollama 做聊天与 embedding，Qdrant 做 RAG 向量库。
长期目标是综合型本地 AI 平台（RAG、Agent、工作流），但当前阶段只做“可靠性与安全”，不加新大功能。

## 关键文件
- backend/server.js：所有路由（sessions、chat 流式、generate-title、rag/upload）
- backend/rag-pipeline.js：PDF 解析 → 切块 → embedding → 写入 Qdrant
- backend/rag-chat.js、rag-query.js：命令行测试脚本
- backend/models/Session.js、Message.js
- frontend/src/App.jsx：状态与所有会话操作
- frontend/src/api/chatApi.js：API 封装与 NDJSON 流读取
- 路线图：Local-AI-Chat-Improvement-Roadmap.md；功能清单：PLAN.md

## 工作规则（必须遵守）
1. 一次只做一个任务。不要顺手“优化”任务范围外的代码，不要重构无关文件。
2. 改代码前先读相关文件，并用 3–6 句话说明：当前怎么运行、问题在哪、你打算改什么。说完再改。
3. 最小修改。保持现有代码风格（ESM、双引号、分号、现有注释语言风格）。
4. 不要新增大型依赖。确实需要依赖时，先停下来问我，说明理由。
5. 不要删除或覆盖用户数据，不要运行会清空数据库、Qdrant、qdrant_storage 的命令。
6. 不要修改 .env 里的真实值；新增配置项只写进 .env.example 并给出默认值。
7. 现有功能不能被破坏：流式输出、停止生成、编辑/重发、置顶、搜索、图片 Vision 路由、RAG 开关。
8. 遇到不确定的产品决策或有多种合理方案，停下来问我，不要自己猜。
9. 没法运行 MongoDB/Ollama/Qdrant 验证时，明确写“未验证”，不要声称已测试通过。
10. 任务完成后按下面“汇报格式”回复，不要只说“完成了”。

## 汇报格式
- 问题与根因（2–4 句）
- 修改的文件及每个文件改了什么
- 手动验证步骤（我可以照着做）以及你实际验证了哪些、哪些未验证
- 未解决的风险 / 需要我决定的事
- 建议同步更新到路线图或 PLAN.md 的状态

## 当前阶段
Phase 0 → Phase 1（见路线图）。禁止开始 Agent、Tool Calling、Workflow、Python Sandbox 相关工作。