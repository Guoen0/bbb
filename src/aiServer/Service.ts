import OpenAI from 'openai'
import { Config, TLAiSerializedPrompt, TLAiResult, TLAiChange } from './types'
import { SYSTEM_PROMPT } from './system-prompt'
import { ModelResponse, IModelResponse, ISimpleEvent } from './schema'
import { convertSimpleEventsToTldrawChanges } from './eventConverter'

export class AiService {
  private openai: OpenAI
  private config: Config

  constructor(config: Config) {
    this.config = config
    this.openai = new OpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: config.OPENROUTER_API_URL,
      dangerouslyAllowBrowser: true
    })
  }

  async generate(prompt: TLAiSerializedPrompt): Promise<TLAiResult> {
    try {
      // 1. 调用 OpenAI API
      const events = await this.generateEvents(prompt)
      
      if (this.config.LOG_LEVEL === 'debug') {
        console.log('Generated events:', events)
      }

      // 2. 转换为 tldraw 变更
      const changes = convertSimpleEventsToTldrawChanges(prompt, events)
      
      if (this.config.LOG_LEVEL === 'debug') {
        console.log('Converted changes:', changes)
      }

      return { changes }
    } catch (error) {
      console.error('AI generation error:', error)
      throw error
    }
  }

  async *stream(prompt: TLAiSerializedPrompt): AsyncGenerator<TLAiChange> {
    try {
      // 简化版流式处理 - 先生成所有事件，然后逐个返回变更
      const events = await this.generateEvents(prompt)
      const changes = convertSimpleEventsToTldrawChanges(prompt, events)
      
      for (const change of changes) {
        yield change
        // 添加小延迟以模拟流式效果
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('AI streaming error:', error)
      throw error
    }
  }

  private async generateEvents(prompt: TLAiSerializedPrompt): Promise<ISimpleEvent[]> {
    const messages = this.buildPromptMessages(prompt)
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    let parsed: IModelResponse
    try {
      parsed = JSON.parse(content)
      
      // 清理和验证事件数据
      if (parsed.events) {
        parsed.events = parsed.events.map(event => this.cleanEvent(event))
      }
      
      ModelResponse.parse(parsed) // 验证结构
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content)
      console.error('Parse error details:', error)
      throw new Error(`Invalid response format: ${error}`)
    }

    return parsed.events
  }

  private cleanEvent(event: any): any {
    // 清理事件数据，确保符合 schema
    if (event.type === 'create' || event.type === 'update') {
      if (event.shape) {
        // 清理文本对齐值
        if (event.shape.textAlign) {
          const alignMap: Record<string, string> = {
            'left': 'start',
            'right': 'end',
            'center': 'middle',
            'centre': 'middle'
          }
          const mappedAlign = alignMap[event.shape.textAlign.toLowerCase()]
          if (mappedAlign) {
            event.shape.textAlign = mappedAlign
          } else if (!['start', 'middle', 'end'].includes(event.shape.textAlign)) {
            event.shape.textAlign = 'middle'
          }
        }
        
        // 确保必需字段存在
        if (event.shape.type === 'text') {
          event.shape.text = event.shape.text || ''
          event.shape.note = event.shape.note || ''
        }
      }
    } else if (event.type === 'think') {
      // 确保 think 事件的 text 字段存在
      if (!event.text) {
        event.text = ''
      }
    } else if (event.type === 'talk') {
      // 确保 talk 事件的 text 字段存在
      if (!event.text) {
        event.text = ''
      }
    }
    
    // 确保 intent 字段存在
    if (!event.intent) {
      event.intent = ''
    }
    
    return event
  }

  private formatShapesInfo(shapes: any[]): string {
    if (!shapes || shapes.length === 0) {
      return '  (画布为空)'
    }
    
    return shapes.map((shape, index) => {
      const basicInfo = `  ${index + 1}. ${shape.type} (id: ${shape.id})`
      const position = `位置: (${shape.x?.toFixed(0) || 0}, ${shape.y?.toFixed(0) || 0})`
      
      let details = ''
      if (shape.type === 'text' || shape.type === 'note') {
        const text = shape.props?.text || shape.props?.richText || ''
        details = `文本: "${typeof text === 'string' ? text : JSON.stringify(text)}"`
      } else if (shape.type === 'geo') {
        const geo = shape.props?.geo || 'unknown'
        const size = shape.props?.w && shape.props?.h ? `大小: ${shape.props.w.toFixed(0)}x${shape.props.h.toFixed(0)}` : ''
        details = `几何: ${geo} ${size}`
      } else if (shape.props?.w && shape.props?.h) {
        details = `大小: ${shape.props.w.toFixed(0)}x${shape.props.h.toFixed(0)}`
      }
      
      return `${basicInfo}, ${position}${details ? ', ' + details : ''}`
    }).join('\n')
  }

  private buildPromptMessages(prompt: TLAiSerializedPrompt) {
    const messages: Array<{role: 'system' | 'user', content: any}> = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ]

    // 格式化画布状态信息
    const shapesInfo = this.formatShapesInfo(prompt.canvasContent.shapes)
    const canvasInfo = `
当前画布状态:
- 视口范围: x=${prompt.contextBounds.x.toFixed(0)}, y=${prompt.contextBounds.y.toFixed(0)}, w=${prompt.contextBounds.w.toFixed(0)}, h=${prompt.contextBounds.h.toFixed(0)}
- 画布中的形状:
${shapesInfo}
- 现有绑定数量: ${prompt.canvasContent.bindings?.length || 0}
`

    // 处理用户消息 - 支持多模态内容
    if (typeof prompt.message === 'string') {
      messages.push({
        role: 'user',
        content: canvasInfo + '\n用户指令: ' + prompt.message
      })
    } else {
      // 构建多模态消息内容
      const contentParts: Array<{type: 'text' | 'image_url', text?: string, image_url?: {url: string}}> = []
      
      // 添加画布信息作为文本
      contentParts.push({
        type: 'text',
        text: canvasInfo + '\n用户指令: '
      })
      
      // 处理用户消息中的各个部分
      for (const msg of prompt.message) {
        if (msg.type === 'text') {
          contentParts.push({
            type: 'text',
            text: msg.text || ''
          })
        } else if (msg.type === 'image' && msg.src) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: msg.src
            }
          })
        }
      }

      messages.push({
        role: 'user',
        content: contentParts
      })
    }

    return messages
  }
} 