# 多模态画布项目

一个基于 React + Vite + tldraw 的多模态创作平台，集成 AI 代理功能，帮助用户在无限画布上进行创作。

## 🎯 项目特色

- **左右分屏布局**：左侧为 tldraw 无限画布，右侧为 AI 聊天面板
- **AI 创作助手**：通过自然语言与 AI 对话，生成画布内容
- **实时交互**：AI 可以理解画布内容并提供相应建议
- **现代化界面**：基于 React 18 + TypeScript + Vite 构建

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **画布组件**：tldraw v3.13.4
- **AI 集成**：OpenAI API（可配置）
- **样式**：原生 CSS + 响应式设计

## 📦 安装与运行

### 前置要求

- Node.js 18+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 🚀 功能说明

### 画布功能
- 无限画布绘制
- 支持多种图形工具
- 图层管理
- 导入导出功能

### AI 助手功能
- 自然语言交互
- 理解用户创作意图
- 生成画布内容（开发中）
- 提供创作建议

### 界面特性
- 响应式设计
- 现代化 UI
- 流畅的用户体验
- 中文界面支持

## 🔧 开发说明

### 项目结构

```
src/
├── components/          # React 组件
│   ├── CanvasArea.tsx  # 画布区域组件
│   └── ChatPanel.tsx   # 聊天面板组件
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
│   └── aiService.ts    # AI 服务模块
├── App.tsx             # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 全局样式
```

### 核心组件

- **CanvasArea**: 基于 tldraw 的画布组件
- **ChatPanel**: AI 聊天交互面板
- **AIService**: AI 服务抽象层

## 🎨 自定义配置

### AI 服务配置

在 `src/utils/aiService.ts` 中可以配置：
- OpenAI API 密钥
- 模型参数
- 响应格式

### 样式自定义

在 `src/index.css` 中可以修改：
- 布局比例
- 颜色主题
- 组件样式

## 📝 待实现功能

- [ ] 真实的 OpenAI API 集成
- [ ] 画布内容提取与分析
- [ ] AI 生成内容到画布的反写
- [ ] 多语言支持
- [ ] 用户认证系统
- [ ] 云端同步功能

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [tldraw](https://tldraw.com) - 提供优秀的画布组件
- [OpenAI](https://openai.com) - AI 能力支持
- [Vite](https://vitejs.dev) - 快速的构建工具
- [React](https://reactjs.org) - 强大的前端框架