import OpenAI from 'openai';
import { CanvasData, AIResponse } from '../types';

/**
 * 现代化 AI 服务类
 * 基于 OpenAI API v5，提供真实的 AI 功能
 */
export class ModernAIService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || null;
    
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true // 仅用于演示，生产环境应使用后端代理
      });
    }
  }

  /**
   * 处理用户消息并生成 AI 响应
   */
  async processUserMessage(
    message: string,
    canvasData?: CanvasData
  ): Promise<AIResponse> {
    try {
      // 分析用户意图
      const intent = await this.analyzeUserIntent(message, canvasData);
      
      // 生成基础响应
      const response: AIResponse = {
        message: await this.generateResponse(message, intent, canvasData),
      };

      // 根据意图执行相应操作
      if (intent.requiresCanvasUpdate) {
        response.canvasUpdate = await this.generateCanvasUpdate(intent, message, canvasData);
      }

      if (intent.type === 'generate_image') {
        response.imageUrl = await this.generateImage(message);
      }

      return response;
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * 使用 GPT-4 分析用户意图
   */
  private async analyzeUserIntent(message: string, canvasData?: CanvasData) {
    if (!this.openai) {
      return this.getBasicIntent(message);
    }

    try {
      const systemPrompt = `你是一个智能画布助手。分析用户的意图并返回 JSON 格式的结果。

用户可能的意图类型：
- create_shape: 创建图形（圆形、矩形、箭头、文本等）
- generate_image: 生成图片
- analyze_canvas: 分析画布内容
- chat: 普通对话

返回格式：
{
  "type": "意图类型",
  "requiresCanvasUpdate": true/false,
  "shapeType": "图形类型或null",
  "action": "动作类型或null",
  "confidence": 0.0-1.0
}`;

      const canvasContext = canvasData ? `当前画布有 ${canvasData.shapes.length} 个元素。` : '画布为空。';

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${canvasContext}\n用户消息：${message}` }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const result = completion.choices[0]?.message?.content;
      return result ? JSON.parse(result) : this.getBasicIntent(message);
    } catch (error) {
      console.error('Intent analysis error:', error);
      return this.getBasicIntent(message);
    }
  }

  /**
   * 基础意图分析（备用方案）
   */
  private getBasicIntent(message: string) {
    const intent = {
      type: 'chat',
      requiresCanvasUpdate: false,
      shapeType: null as string | null,
      action: null as string | null,
      confidence: 0.8
    };

    // 检测形状创建
    if (this.matchesPattern(message, ['画', '创建', '生成', '添加', '做'])) {
      intent.requiresCanvasUpdate = true;
      intent.action = 'create';

      if (this.matchesPattern(message, ['圆', '圆形', '圆圈', 'circle'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'ellipse';
      } else if (this.matchesPattern(message, ['方', '方形', '矩形', '长方形', 'rectangle', 'square'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'rectangle';
      } else if (this.matchesPattern(message, ['线', '直线', '箭头', 'arrow', 'line'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'arrow';
      } else if (this.matchesPattern(message, ['文字', '文本', '标签', 'text'])) {
        intent.type = 'create_shape';
        intent.shapeType = 'text';
      }
    }

    // 检测图像生成
    if (this.matchesPattern(message, ['图片', '图像', '照片', '插图', 'image', 'picture'])) {
      intent.type = 'generate_image';
    }

    // 检测分析请求
    if (this.matchesPattern(message, ['分析', '查看', '解释', '说明', 'analyze'])) {
      intent.type = 'analyze_canvas';
    }

    return intent;
  }

  /**
   * 使用 GPT-4 生成智能响应
   */
  private async generateResponse(message: string, intent: any, canvasData?: CanvasData): Promise<string> {
    if (!this.openai) {
      return this.getBasicResponse(message, intent);
    }

    try {
      const systemPrompt = `你是一个友好的 AI 画布助手。用简洁、自然的中文回复用户。
根据用户意图提供有用的建议。如果用户要创建图形，要表现出积极帮助的态度。`;

      const canvasContext = canvasData ? 
        `画布状态：${canvasData.shapes.length} 个元素` : 
        '画布状态：空白';

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `${canvasContext}\n用户意图：${JSON.stringify(intent)}\n用户消息：${message}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content || this.getBasicResponse(message, intent);
    } catch (error) {
      console.error('Response generation error:', error);
      return this.getBasicResponse(message, intent);
    }
  }

  /**
   * 基础响应生成（备用方案）
   */
  private getBasicResponse(message: string, intent: any): string {
    switch (intent.type) {
      case 'create_shape':
        return `好的！我来为你创建一个${this.getShapeDisplayName(intent.shapeType)}。`;
      case 'generate_image':
        return `我来为你生成一张关于"${message}"的图片。`;
      case 'analyze_canvas':
        return `让我分析一下当前的画布内容...`;
      default:
        return `我理解了！有什么我可以帮你在画布上创作的吗？`;
    }
  }

  /**
   * 生成画布更新数据
   */
  private async generateCanvasUpdate(intent: any, message: string, canvasData?: CanvasData): Promise<CanvasData> {
    const shapes: any[] = [];

    if (intent.type === 'create_shape' && intent.shapeType) {
      const shape = await this.createIntelligentShape(intent.shapeType, message, canvasData);
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
   * 创建智能图形
   */
  private async createIntelligentShape(shapeType: string, message: string, canvasData?: CanvasData) {
    // 智能定位：避免与现有图形重叠
    const position = this.getOptimalPosition(canvasData);
    
    const baseProps = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: position.x,
      y: position.y,
    };

    // 从消息中提取属性
    const color = this.extractColorFromMessage(message);
    const size = this.extractSizeFromMessage(message);
    const text = this.extractTextFromMessage(message);

    switch (shapeType) {
      case 'ellipse':
        return {
          ...baseProps,
          type: 'geo',
          props: {
            geo: 'ellipse',
            w: size.width,
            h: size.height,
            color: color,
            fill: 'solid',
          }
        };

      case 'rectangle':
        return {
          ...baseProps,
          type: 'geo',
          props: {
            geo: 'rectangle',
            w: size.width,
            h: size.height,
            color: color,
            fill: 'solid',
          }
        };

      case 'arrow':
        return {
          ...baseProps,
          type: 'arrow',
          props: {
            start: { x: 0, y: 0 },
            end: { x: size.width, y: 0 },
            color: color,
          }
        };

      case 'text':
        return {
          ...baseProps,
          type: 'text',
          props: {
            text: text || '文本内容',
            size: 'medium',
            color: color,
          }
        };

      default:
        return null;
    }
  }

  /**
   * 获取最佳放置位置
   */
  private getOptimalPosition(canvasData?: CanvasData) {
    if (!canvasData || canvasData.shapes.length === 0) {
      return { x: 200, y: 200 };
    }

    // 简单的位置算法：在现有图形旁边放置
    const lastShape = canvasData.shapes[canvasData.shapes.length - 1];
    return {
      x: (lastShape.x || 0) + 150,
      y: (lastShape.y || 0) + 50,
    };
  }

  /**
   * 从消息中提取颜色
   */
  private extractColorFromMessage(message: string): string {
    const colorMap: { [key: string]: string } = {
      '红': 'red', '红色': 'red',
      '蓝': 'blue', '蓝色': 'blue',
      '绿': 'green', '绿色': 'green',
      '黄': 'yellow', '黄色': 'yellow',
      '紫': 'violet', '紫色': 'violet',
      '橙': 'orange', '橙色': 'orange',
      '黑': 'black', '黑色': 'black',
      '白': 'white', '白色': 'white',
      '灰': 'grey', '灰色': 'grey',
    };

    for (const [keyword, color] of Object.entries(colorMap)) {
      if (message.includes(keyword)) {
        return color;
      }
    }

    return 'blue'; // 默认颜色
  }

  /**
   * 从消息中提取尺寸
   */
  private extractSizeFromMessage(message: string) {
    if (this.matchesPattern(message, ['大', '大的', '大型'])) {
      return { width: 150, height: 150 };
    }
    if (this.matchesPattern(message, ['小', '小的', '小型'])) {
      return { width: 60, height: 60 };
    }
    return { width: 100, height: 100 }; // 默认尺寸
  }

  /**
   * 从消息中提取文本
   */
  private extractTextFromMessage(message: string): string | null {
    // 提取引号内的内容
    const quotedMatch = message.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // 提取关键词后的内容
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
   * 使用 DALL-E 生成图像
   */
  private async generateImage(prompt: string): Promise<string> {
    if (!this.openai) {
      return `https://via.placeholder.com/300x200?text=${encodeURIComponent(prompt)}`;
    }

    try {
             const response = await this.openai.images.generate({
         model: "dall-e-3",
         prompt: prompt,
         n: 1,
         size: "1024x1024",
         quality: "standard",
       });

       return response.data?.[0]?.url || `https://via.placeholder.com/300x200?text=${encodeURIComponent(prompt)}`;
    } catch (error) {
      console.error('Image generation error:', error);
      return `https://via.placeholder.com/300x200?text=${encodeURIComponent(prompt)}`;
    }
  }

  /**
   * 获取备用响应
   */
  private getFallbackResponse(message: string): AIResponse {
    return {
      message: `抱歉，我遇到了一些技术问题。不过我仍然可以帮你创作！你想要画什么呢？`,
    };
  }

  /**
   * 工具方法
   */
  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

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
   * 分析画布内容
   */
  async analyzeCanvas(canvasData: CanvasData): Promise<string> {
    if (!this.openai) {
      return this.getBasicCanvasAnalysis(canvasData);
    }

    try {
      const canvasDescription = this.describeCanvas(canvasData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "你是一个专业的设计分析师。分析用户的画布内容，提供有建设性的反馈和建议。" 
          },
          { 
            role: "user", 
            content: `请分析这个画布：${canvasDescription}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return completion.choices[0]?.message?.content || this.getBasicCanvasAnalysis(canvasData);
    } catch (error) {
      console.error('Canvas analysis error:', error);
      return this.getBasicCanvasAnalysis(canvasData);
    }
  }

  private describeCanvas(canvasData: CanvasData): string {
    if (!canvasData.shapes.length) {
      return '空白画布';
    }

    const shapeTypes = canvasData.shapes.map(shape => shape.type);
    const typeCount: { [key: string]: number } = {};
    
    shapeTypes.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const description = Object.entries(typeCount)
      .map(([type, count]) => `${count}个${type}`)
      .join('、');

    return `包含${description}，共${canvasData.shapes.length}个元素`;
  }

  private getBasicCanvasAnalysis(canvasData: CanvasData): string {
    if (!canvasData.shapes.length) {
      return '画布目前是空的，你可以开始创作任何你想要的内容！';
    }

    const description = this.describeCanvas(canvasData);
    return `画布${description}。整体布局看起来不错，继续发挥你的创意吧！`;
  }
}

// 导出单例实例
export const aiService = new ModernAIService();