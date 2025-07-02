import { CanvasData, AIResponse } from '../types';

// 模拟 AI 服务 - 在实际项目中这里会调用真实的 OpenAI API
export class AIService {
  private _apiKey: string | null = null;

  constructor(apiKey?: string) {
    this._apiKey = apiKey || null;
  }

  async processUserMessage(
    message: string,
    _canvasData?: CanvasData
  ): Promise<AIResponse> {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 这里是模拟响应，实际应用中会调用 OpenAI API
    const response: AIResponse = {
      message: this.generateMockResponse(message),
    };

    // 如果用户请求创建图形，添加模拟的画布更新
    if (this.shouldCreateShape(message)) {
      response.canvasUpdate = this.generateMockCanvasUpdate(message);
    }

    return response;
  }

  private generateMockResponse(message: string): string {
    const responses = [
      `我理解你想要${message}。让我帮你在画布上实现这个想法！`,
      `好的，我会帮你创建${message}。请稍等片刻...`,
      `明白了！我正在为你设计${message}，马上就好。`,
      `让我来帮你绘制${message}，这是一个很棒的想法！`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private shouldCreateShape(message: string): boolean {
    const createKeywords = ['画', '绘制', '创建', '做', '添加', '画个', '来个'];
    return createKeywords.some(keyword => message.includes(keyword));
  }

  private generateMockCanvasUpdate(_message: string): CanvasData {
    // 这里会根据用户消息生成相应的画布内容
    // 实际应用中会使用 tldraw 的 AI 功能
    return {
      shapes: [],
      bindings: [],
      assets: [],
    };
  }
}

export const aiService = new AIService();