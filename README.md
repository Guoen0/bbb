# 多模态画布项目

一个集成了 tldraw 和 AI 代理的创作平台，支持通过自然语言指令在画布上创作内容。

## 功能特点

- 🎨 **tldraw 画布** - 强大的绘图和图表工具
- 🤖 **AI 助手** - 基于 OpenAI GPT-4 的智能创作助手
- 💬 **实时对话** - 与 AI 助手进行自然语言交互
- 🔄 **智能生成** - AI 根据指令自动生成画布内容

## 技术栈

- React 18 + TypeScript
- tldraw - 画布组件
- OpenAI GPT-4 - AI 服务
- Vite - 构建工具

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 使用说明

1. 在左侧画布上可以自由绘制
2. 在右侧聊天面板输入自然语言指令
3. AI 助手会根据你的指令在画布上生成相应的内容

## 项目结构

```
src/
├── aiServer/           # AI 服务核心代码
│   ├── aiService.ts    # AI 服务主类
│   ├── eventConverter.ts # 事件转换器
│   ├── schema.ts       # 数据模式定义
│   ├── system-prompt.ts # 系统提示词
│   └── types.ts        # 类型定义
├── components/         # React 组件
│   ├── ChatPanel.tsx   # 聊天面板组件
│   └── ChatPanel.css   # 聊天面板样式
├── services/           # 服务层
│   └── aiService.ts    # AI 服务包装器
├── types/              # 类型定义
│   └── chat.ts         # 聊天相关类型
└── App.tsx             # 主应用组件
```

## AI 功能说明

### 支持的指令类型

- **创建图形** - "画一个红色的圆形"
- **添加文本** - "在画布中央添加标题"
- **绘制图表** - "创建一个流程图"
- **修改内容** - "把圆形改成方形"
- **删除元素** - "删除所有文本"

### AI 处理流程

1. 用户输入自然语言指令
2. 系统获取当前画布状态
3. AI 分析指令并生成结构化事件
4. 将事件转换为 tldraw 可理解的变更
5. 应用变更到画布

## 开发说明

### 添加新的 AI 功能

1. 在 `aiServer/schema.ts` 中定义新的数据结构
2. 在 `aiServer/eventConverter.ts` 中添加转换逻辑
3. 在 `aiServer/system-prompt.ts` 中更新提示词

### 自定义画布功能

1. 使用 tldraw 的 API 扩展画布功能
2. 在 `App.tsx` 中集成新的画布操作
3. 更新 AI 服务以支持新的操作类型

## 注意事项

- 确保 OpenAI API 密钥有效且有足够的配额
- AI 生成的内容可能需要几秒钟时间
- 复杂的指令可能需要多次交互才能完成

## 许可证

ISC 