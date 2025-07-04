# AI 智能画布项目

一个基于 tldraw 和 OpenAI Agents 的智能创作平台，支持通过截图和自然语言指令进行 AI 图像生成和画布内容创作。

## ✨ 核心功能

- 🎨 **智能截图生成** - 选中画布元素，AI 自动生成相关图像
- 🤖 **AI 代理系统** - 基于 OpenAI Agents 的双层智能处理
- 💬 **实时对话** - 与 AI 助手进行自然语言交互
- 🔄 **智能画布操作** - AI 根据指令自动创建、修改画布内容
- 🖼️ **图像回写** - AI 生成的图像自动添加到画布

## 🚀 技术栈

- **前端框架**: React 18 + TypeScript
- **画布引擎**: tldraw (最新版本)
- **AI 服务**: OpenAI Agents + GPT-4.1
- **构建工具**: Vite
- **图像处理**: Canvas API + Base64

## 📦 核心文件结构

```
src/
├── components/
│   └── ScreenshotButton.tsx    # 核心：截图生成按钮组件
├── services/
│   └── aiService_agent.ts      # AI 服务包装器
├── aiServer_agent/
│   └── Service.ts              # 核心：AI 代理服务实现
├── aiServer/                   # 传统 AI 服务 (备用)
└── App.tsx                     # 主应用组件
```
其余的文件是多余的试错的。

## 🎯 核心功能详解

### 1. 智能截图生成 (`ScreenshotButton.tsx`)

- **功能**: 选中画布元素后，点击"魔法生成"按钮
- **流程**: 
  1. 截取选中区域的图像
  2. 发送给 AI 分析用户意图
  3. AI 生成新的图像
  4. 自动添加到画布中心位置

```typescript
// 核心截图逻辑
const handleScreenshot = async () => {
  const result = await editor.toImage(selectedShapes, {
    padding: 20,
    background: true,
    scale: 1
  })
  // 发送给 AI 处理...
}
```

### 2. AI 代理服务 (`Service.ts`)

采用双层 AI 代理架构：

- **意图分析代理** (`intentAgent`): 分析用户草图和创作意图
- **图像生成代理** (`drawAgent`): 基于分析结果生成安全美观的图像

```typescript
// 双层代理处理流程
const result_pre = await run(this.intentAgent, thread)  // 意图分析
const result = await run(this.drawAgent, thread)        // 图像生成
```

### 3. 服务包装器 (`aiService_agent.ts`)

提供简化的 AI 服务接口，支持：
- 延迟初始化
- 配置管理
- 错误处理

## 🛠️ 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# OpenAI API 配置
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

## 🎮 使用指南

### 智能截图生成

1. **选择元素**: 在画布上选择要处理的图形元素
2. **点击生成**: 点击出现的"✨ 魔法生成"按钮
3. **AI 处理**: 系统自动分析并生成相关图像
4. **自动添加**: 生成的图像自动添加到画布中心

### 自然语言交互

1. **输入指令**: 在右侧聊天面板输入自然语言指令
2. **AI 分析**: 系统分析当前画布状态和用户意图
3. **自动执行**: AI 自动在画布上创建或修改内容

## 🔧 开发说明

### 添加新的 AI 功能

1. **扩展代理指令**: 在 `Service.ts` 中修改代理的 `instructions`
2. **添加工具**: 在 `drawAgent` 中添加新的工具函数
3. **更新界面**: 在 `ScreenshotButton.tsx` 中添加新的交互逻辑

### 自定义画布功能

1. **扩展 tldraw**: 使用 tldraw 的 API 添加新的画布操作
2. **集成 AI**: 在 `aiService_agent.ts` 中添加新的 AI 服务方法
3. **更新 UI**: 在 `App.tsx` 中集成新的用户界面元素

## 📋 支持的指令类型

### 截图生成
- 选中任意图形元素进行 AI 图像生成
- 支持复杂场景的智能理解