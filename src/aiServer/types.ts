// 简化的环境配置
export interface Config {
  OPENAI_API_KEY: string
  OPENROUTER_API_KEY?: string
  OPENROUTER_API_URL?: string
  OPENROUTER_MODEL?: string
  USE_OPENROUTER?: boolean
  LOG_LEVEL: 'debug' | 'none'
}

// 从 @tldraw/ai 导入的核心类型
export interface TLAiSerializedPrompt {
  message: string | Array<{ type: 'text' | 'image'; text?: string; src?: string }>
  image?: string
  canvasContent: {
    shapes: any[]
    bindings: any[]
    assets: any[]
  }
  contextBounds: { x: number; y: number; w: number; h: number }
  promptBounds: { x: number; y: number; w: number; h: number }
  meta?: any
}

export interface TLAiChange {
  type: 'createShape' | 'updateShape' | 'deleteShape' | 'createBinding' | 'updateBinding' | 'deleteBinding' | 'talk'
  description: string
  shape?: any
  binding?: any
  shapeId?: string
  bindingId?: string
  text?: string
}

export interface TLAiResult {
  changes: TLAiChange[]
} 