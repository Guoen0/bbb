# 这是一个多模态画布项目
## 技术栈
- react
- vite
- tldraw
- openai-agents

## 目标
一个网站，左边是tldraw画布，右边是Agent对话历史记录。agent帮助用户在tldraw画布里创作任何内容。
利用 tldraw/ai 模块的提供的功能提取画布的内容作为上下文；包含用户的聊天历史共同发给LLM，其生成图像或者画布内容。
拿到LLM的结果之后利用 tldraw/ai 模块的提供的功能反写到画布里。