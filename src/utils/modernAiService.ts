import OpenAI from 'openai';
import { Editor, createShapeId } from 'tldraw';
import { useTldrawAi, type TldrawAiGenerateFn, type TldrawAiStreamFn } from '../../ai/src/lib/useTldrawAi';
import type { TLAiChange, TLAiSerializedPrompt } from '../../ai/src/lib/types';

/**
 * 基于官方 tldraw-ai 包的现代化 AI 服务
 * 提供真实的 OpenAI 集成和标准化的 tldraw AI 功能
 */
export class TldrawModernAIService {
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
   * 创建 tldraw AI 生成函数
   */
  createGenerateFunction(): TldrawAiGenerateFn {
    return async ({ editor, prompt, signal }) => {
      if (!this.openai) {
        return this.getFallbackChanges(prompt);
      }

      try {
        const changes = await this.generateChangesWithGPT4(prompt, signal);
        return changes;
      } catch (error) {
        console.error('AI generation error:', error);
        return this.getFallbackChanges(prompt);
      }
    };
  }

  /**
   * 创建 tldraw AI 流式函数
   */
  createStreamFunction(): TldrawAiStreamFn {
    const self = this;
    return async function* ({ editor, prompt, signal }: { editor: any, prompt: any, signal: AbortSignal }) {
      // 对于演示，我们将一次性生成所有更改，然后逐一 yield
      const changes = await self.generateChangesWithGPT4(prompt, signal);
      
      for (const change of changes) {
        if (signal.aborted) break;
        yield change;
        // 添加小延迟以模拟流式效果
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };
  }

  /**
   * 使用 GPT-4 生成画布更改
   */
  private async generateChangesWithGPT4(
    prompt: TLAiSerializedPrompt, 
    signal: AbortSignal
  ): Promise<TLAiChange[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt();
    
    // 构建用户消息
    const userMessage = this.buildUserMessage(prompt);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }, { signal });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return [];
    }

    // 解析 AI 响应为 tldraw 更改
    return this.parseAIResponseToChanges(response, prompt);
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(): string {
    return `你是一个专业的 tldraw 画布 AI 助手。你的任务是根据用户的自然语言指令生成画布更改。

请严格按照以下 JSON 格式返回更改数组：

[
  {
    "type": "createShape",
    "description": "创建描述",
    "shape": {
      "id": "shape_唯一ID",
      "type": "geo|text|arrow|draw",
      "x": 数字,
      "y": 数字,
      "props": {
        // 根据形状类型的属性
      }
    }
  }
]

支持的形状类型和属性：

1. geo (几何图形):
   - geo: "ellipse"|"rectangle"|"triangle"
   - w: 宽度, h: 高度
   - color: "red"|"blue"|"green"|"yellow"|"violet"|"orange"|"black"|"white"|"grey"
   - fill: "none"|"semi"|"solid"|"pattern"

2. text (文本):
   - text: "文本内容"
   - color: 颜色值
   - size: "s"|"m"|"l"|"xl"

3. arrow (箭头):
   - start: {x: 数字, y: 数字}
   - end: {x: 数字, y: 数字}
   - color: 颜色值

规则：
- 每个 shape 必须有唯一的 id
- 坐标应该在画布边界内 (0-800, 0-600)
- 颜色必须使用 tldraw 预定义值
- 描述要简洁明了
- 只返回 JSON 数组，不要其他文本`;
  }

  /**
   * 构建用户消息
   */
  private buildUserMessage(prompt: TLAiSerializedPrompt): string {
    const { message, canvasContent, contextBounds, promptBounds } = prompt;
    
    let userMessage = `用户指令：${typeof message === 'string' ? message : JSON.stringify(message)}

画布状态：
- 当前图形数量：${canvasContent.shapes.length}
- 画布边界：${JSON.stringify(contextBounds)}
- 提示区域：${JSON.stringify(promptBounds)}`;

    if (canvasContent.shapes.length > 0) {
      userMessage += `\n- 现有图形：${canvasContent.shapes.map(s => `${s.type}(${s.id})`).join(', ')}`;
    }

    userMessage += '\n\n请根据用户指令生成相应的画布更改。';

    return userMessage;
  }

  /**
   * 解析 AI 响应为 tldraw 更改
   */
  private parseAIResponseToChanges(response: string, prompt: TLAiSerializedPrompt): TLAiChange[] {
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.getFallbackChanges(prompt);
      }

      const changes = JSON.parse(jsonMatch[0]) as TLAiChange[];
      
      // 验证和修正更改
      return changes.map(change => this.validateAndFixChange(change, prompt));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackChanges(prompt);
    }
  }

  /**
   * 验证和修正更改
   */
  private validateAndFixChange(change: TLAiChange, prompt: TLAiSerializedPrompt): TLAiChange {
    if (change.type === 'createShape') {
      // 确保 ID 唯一
      if (!change.shape.id) {
        change.shape.id = createShapeId();
      }

      // 确保坐标在合理范围内
      if (typeof change.shape.x !== 'number') {
        change.shape.x = Math.random() * 400 + 100;
      }
      if (typeof change.shape.y !== 'number') {
        change.shape.y = Math.random() * 300 + 100;
      }

      // 修正属性
      if (change.shape.type === 'geo' && change.shape.props) {
        const props = change.shape.props as any;
        if (!props.w) props.w = 100;
        if (!props.h) props.h = 100;
        if (!props.fill) props.fill = 'solid';
      }
    }

    return change;
  }

  /**
   * 获取备用更改（当 AI 不可用时）
   */
  private getFallbackChanges(prompt: TLAiSerializedPrompt): TLAiChange[] {
    const message = typeof prompt.message === 'string' ? prompt.message : '';
    
    // 简单的关键词匹配
    if (this.matchesPattern(message, ['圆', '圆形', 'circle'])) {
      return [{
        type: 'createShape',
        description: '创建圆形',
        shape: {
          id: createShapeId(),
          type: 'geo',
          x: 200,
          y: 200,
          props: {
            geo: 'ellipse',
            w: 100,
            h: 100,
            color: this.extractColor(message),
            fill: 'solid'
          }
        }
      }];
    }

    if (this.matchesPattern(message, ['矩形', '方形', 'rectangle'])) {
      return [{
        type: 'createShape',
        description: '创建矩形',
        shape: {
          id: createShapeId(),
          type: 'geo',
          x: 200,
          y: 200,
          props: {
            geo: 'rectangle',
            w: 120,
            h: 80,
            color: this.extractColor(message),
            fill: 'solid'
          }
        }
      }];
    }

    return [];
  }

  /**
   * 工具方法
   */
  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  private extractColor(text: string): string {
    const colorMap: Record<string, string> = {
      '红': 'red', '蓝': 'blue', '绿': 'green', '黄': 'yellow',
      '紫': 'violet', '橙': 'orange', '黑': 'black', '白': 'white', '灰': 'grey'
    };

    for (const [keyword, color] of Object.entries(colorMap)) {
      if (text.includes(keyword)) return color;
    }

    return 'blue';
  }
}

/**
 * React Hook 包装器
 */
export function useModernTldrawAI(editor?: Editor) {
  const aiService = new TldrawModernAIService();
  
  return useTldrawAi({
    editor,
    generate: aiService.createGenerateFunction(),
    stream: aiService.createStreamFunction(),
  });
}