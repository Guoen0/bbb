#!/bin/bash

# 多模态画布项目部署脚本

echo "🚀 开始部署多模态画布项目..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node --version
npm --version

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 dist/ 目录"
    ls -la dist/
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 部署准备完成！"
echo "💡 你可以运行 'npm run preview' 来预览生产版本"