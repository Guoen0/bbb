import { CanvasData, AIResponse } from '../types';

/**
 * tldraw AI 服务类
 * 基于 tldraw 的 AI 功能，提供画布内容理解和生成能力
 */
export class TldrawAIService {
  private _apiKey: string | null = null;

  constructor(apiKey?: string) {
    this._apiKey = apiKey || null;
  }

  /**
   * 处理用户消息并生成 AI 响应
   * @param message 用户输入的消息
   * @param canvasData 当前画布数据（可选）
   * @returns AI 响应对象
   */
  async processUserMessage(
    message: string,
    canvasData?: CanvasData
  ): Promise<AIResponse> {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 分析用户意图
    const intent = this.analyzeUserIntent(message);
    
    // 生成响应
    const response: AIResponse = {
      message: this.generateContextualResponse(message, intent, canvasData),
    };

    // 根据意图生成画布更新
    if (intent.requiresCanvasUpdate) {
      response.canvasUpdate = await this.generateCanvasUpdate(intent, message, canvasData);
    }

    // 如果是图像生成请求，添加图像 URL
    if (intent.type === 'generate_image') {
      response.imageUrl = await this.generateImageUrl(message);
    }

    return response;
  }

  /**
   * 分析用户意图
   */
  private analyzeUserIntent(message: string) {
    const intent = {
      type: 'chat',
      requiresCanvasUpdate: false,
      shapeType: null as string | null,
      action: null as string | null,
    };

    // 检测形状创建意图
    if (this.matchesPattern(message, ['画', '创建', '生成', '添加'])) {
      intent.requiresCanvasUpdate = true;
      intent.action = 'create';

      // 检测具体形状类型
      if (this.matchesPattern(message, ['圆', '圆形', '圆圈'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'ellipse';
      } else if (this.matchesPattern(message, ['方', '方形', '矩形', '长方形'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'rectangle';
      } else if (this.matchesPattern(message, ['线', '直线', '箭头'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'arrow';
      } else if (this.matchesPattern(message, ['文字', '文本', '标签'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'text';
      } else {
        intent.type = 'create_generic';
      }
    }

    // 检测分析意图
    if (this.matchesPattern(message, ['分析', '查看', '解释', '说明'])) {
      intent.type = 'analyze_canvas';
    }

    // 检测图像生成意图
    if (this.matchesPattern(message, ['图片', '图像', '照片', '插图'])) {
      intent.type = 'generate_image';
    }

    return intent;
  }

  /**
   * 生成上下文相关的响应
   */
  private generateContextualResponse(message: string, intent: any, canvasData?: CanvasData): string {
    switch (intent.type) {
      case 'create_shape':
        return `好的！我来为你创建一个${this.getShapeDisplayName(intent.shapeType)}。`;
        
      case 'create_generic':
        return `我理解你想要创建"${message}"相关的内容。让我帮你在画布上实现这个想法！`;
        
      case 'analyze_canvas':
        if (canvasData && canvasData.shapes.length > 0) {
          return `我看到画布上有 ${canvasData.shapes.length} 个元素。让我为你分析一下当前的内容...`;
        } else {
          return `画布目前是空的。你可以开始创作，或者告诉我你想要画什么！`;
        }
        
      case 'generate_image':
        return `我来为你生成一张关于"${message}"的图片。`;
        
      default:
        return this.generateChatResponse(message);
    }
  }

  /**
   * 生成画布更新数据
   */
  private async generateCanvasUpdate(intent: any, message: string, canvasData?: CanvasData): Promise<CanvasData> {
    const shapes: any[] = [];

    if (intent.type === 'create_shape') {
      const shape = this.createShapeFromIntent(intent, message);
      if (shape) {
        shapes.push(shape);
      }
    }

    return {
      shapes,
      bindings: [],
      assets: [],
    };
  }

  /**
   * 根据意图创建形状
   */
  private createShapeFromIntent(intent: any, message: string) {
    const baseProps = {
      id: `shape_${Date.now()}`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    switch (intent.shapeType) {
      case 'ellipse':
        return {
          ...baseProps,
          type: 'geo',
          props: {
            geo: 'ellipse',
            w: 100,
            h: 100,
            fill: this.extractColorFromMessage(message) || 'blue',
          }
        };

      case 'rectangle':
        return {
          ...baseProps,
          type: 'geo',
          props: {
            geo: 'rectangle',
            w: 120,
            h: 80,
            fill: this.extractColorFromMessage(message) || 'green',
          }
        };

      case 'arrow':
        return {
          ...baseProps,
          type: 'arrow',
          props: {
            start: { x: 0, y: 0 },
            end: { x: 100, y: 0 },
          }
        };

      case 'text':
        return {
          ...baseProps,
          type: 'text',
          props: {
            text: this.extractTextFromMessage(message) || '文本内容',
            size: 'medium',
          }
        };

      default:
        return null;
    }
  }

  /**
   * 从消息中提取颜色
   */
  private extractColorFromMessage(message: string): string | null {
    const colorMap: { [key: string]: string } = {
      '红': 'red',
      '红色': 'red',
      '蓝': 'blue',
      '蓝色': 'blue',
      '绿': 'green',
      '绿色': 'green',
      '黄': 'yellow',
      '黄色': 'yellow',
      '紫': 'purple',
      '紫色': 'purple',
      '橙': 'orange',
      '橙色': 'orange',
    };

    for (const [keyword, color] of Object.entries(colorMap)) {
      if (message.includes(keyword)) {
        return color;
      }
    }

    return null;
  }

  /**
   * 从消息中提取文本内容
   */
  private extractTextFromMessage(message: string): string | null {
    // 简单的文本提取逻辑
    const textMatch = message.match(/["']([^"']+)["']/);
    if (textMatch) {
      return textMatch[1];
    }

    // 如果没有引号，尝试提取关键词后的内容
    const patterns = ['写', '文字', '文本', '标签'];
    for (const pattern of patterns) {
      const index = message.indexOf(pattern);
      if (index !== -1) {
        const afterPattern = message.substring(index + pattern.length).trim();
        if (afterPattern) {
          return afterPattern;
        }
      }
    }

    return null;
  }

  /**
   * 生成图像 URL（模拟）
   */
  private async generateImageUrl(message: string): Promise<string> {
    // 在实际应用中，这里会调用图像生成 API
    // 这里返回一个占位符图像
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(message)}`;
  }

  /**
   * 生成聊天响应
   */
  private generateChatResponse(message: string): string {
    const responses = [
      `我理解你说的"${message}"。有什么我可以帮你在画布上创作的吗？`,
      `这很有趣！你想要我帮你画点什么吗？`,
      `我是你的 AI 创作助手。你可以告诉我想要创建什么图形或内容。`,
      `好的！如果你想要在画布上添加什么内容，随时告诉我。`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 获取形状的显示名称
   */
  private getShapeDisplayName(shapeType: string | null): string {
    const displayNames: { [key: string]: string } = {
      'ellipse': '圆形',
      'rectangle': '矩形',
      'arrow': '箭头',
      'text': '文本',
    };

    return displayNames[shapeType || ''] || '图形';
  }

  /**
   * 检查消息是否匹配指定的模式
   */
  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  /**
   * 解释画布内容（用于分析功能）
   */
  async interpretCanvas(canvasData: CanvasData): Promise<string> {
    if (!canvasData.shapes.length) {
      return '画布目前是空的。';
    }

    const shapeTypes = canvasData.shapes.map(shape => shape.type);
    const typeCount: { [key: string]: number } = {};
    
    shapeTypes.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const description = Object.entries(typeCount)
      .map(([type, count]) => `${count}个${type}`)
      .join('、');

    return `画布上包含：${description}。整体布局看起来${this.analyzeLayout(canvasData)}。`;
  }

  /**
   * 分析布局
   */
  private analyzeLayout(canvasData: CanvasData): string {
    const layouts = ['整齐有序', '创意自由', '层次分明', '简洁清晰'];
    return layouts[Math.floor(Math.random() * layouts.length)];
  }
}

// 导出单例实例
export const aiService = new TldrawAIService();