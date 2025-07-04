import { AiService } from '../aiServer_agent/Service'
import { Config, TLAiSerializedPrompt, TLAiResult } from '../aiServer/types'

// 延迟初始化 AI 服务
let aiService: AiService | null = null

function getAiService(): AiService {
  if (!aiService) {
    const config: Config = {
      OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
      OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      OPENROUTER_API_URL: import.meta.env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
      OPENROUTER_MODEL: import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-flash',
      USE_OPENROUTER: import.meta.env.VITE_USE_OPENROUTER === 'true',
      LOG_LEVEL: 'debug'
    }
    aiService = new AiService(config)
  }
  return aiService
}

// 简化的 AI 服务接口
export class CanvasAiService {

  async screenshotGenerate(image: string): Promise<string> {
    try {
      const service = getAiService()
      return await service.screenshotGenerate(image)

    } catch (error) {
      console.error('AI 生成失败:', error)
      throw error
    }
  }

  // 检查 API 密钥是否配置
  isConfigured(): boolean {
    return !!(import.meta.env.VITE_OPENAI_API_KEY || '')
  }
}

export const canvasAiService = new CanvasAiService() 