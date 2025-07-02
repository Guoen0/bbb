import { AiService } from '../aiServer/Service'
import { Config, TLAiSerializedPrompt, TLAiResult } from '../aiServer/types'

// 延迟初始化 AI 服务
let aiService: AiService | null = null

function getAiService(): AiService {
  if (!aiService) {
    const config: Config = {
      OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
      OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      OPENROUTER_API_URL: import.meta.env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
      OPENROUTER_MODEL: import.meta.env.VITE_OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      USE_OPENROUTER: import.meta.env.VITE_USE_OPENROUTER === 'true',
      LOG_LEVEL: 'debug'
    }
    aiService = new AiService(config)
  }
  return aiService
}

// 简化的 AI 服务接口
export class CanvasAiService {
  // 生成画布变更
  async generateCanvasChanges(prompt: TLAiSerializedPrompt): Promise<TLAiResult> {
    try {
      const service = getAiService()
      return await service.generate(prompt)
    } catch (error) {
      console.error('AI 生成失败:', error)
      throw error
    }
  }

  // 流式生成画布变更
  async *streamCanvasChanges(prompt: TLAiSerializedPrompt): AsyncGenerator<any> {
    try {
      const service = getAiService()
      for await (const change of service.stream(prompt)) {
        yield change
      }
    } catch (error) {
      console.error('AI 流式生成失败:', error)
      throw error
    }
  }

  // 检查 API 密钥是否配置
  isConfigured(): boolean {
    return !!(import.meta.env.VITE_OPENAI_API_KEY || '')
  }
}

export const canvasAiService = new CanvasAiService() 