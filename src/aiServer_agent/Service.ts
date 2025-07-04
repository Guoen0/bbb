import OpenAI from 'openai'
import { 
  Agent, run, 
  setDefaultOpenAIClient,
  setTracingDisabled,
  imageGenerationTool,
  AgentInputItem
} from '@openai/agents';
import { Config } from '../aiServer/types'

export class AiService {
  private openai: OpenAI
  private config: Config
  private intentAgent: Agent
  private drawAgent: Agent

  constructor(config: Config) {
    this.config = config
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })
    
    setDefaultOpenAIClient(this.openai)
    setTracingDisabled(true)

    this.intentAgent = new Agent({
      name: 'intent_agent',
      instructions: '你是一个艺术图像助手，根据用户的需求生成图像。你有强大的用户意图理解能力，能根据用户的草图理解用户想要什么。最终输出的图像不仅内容要符合用户意图，还要保证图像艺术风格与意图相匹配。必须给出目标图像的尺寸比率建议（目标图像有可能不是输入的草图的初始的大小，而是草图上某个区域作业区域的尺寸）。',
      model: 'gpt-4.1-mini',
    })

    this.drawAgent = new Agent({
      name: 'draw_agent',
      instructions: '你是一个安全的图像生成助手。根据用户提供的草图分析，生成符合以下要求的图像：1) 内容安全、积极向上 2) 风格现代、美观 3) 符合用户创作意图 4) 避免任何可能违反内容政策的内容。请使用imageGenerationTool生成图像，必须遵从上下文给出的尺寸比率建议，如果上下文没有给出尺寸比率建议，则生成图像的尺寸是1024*1024。如果有角色，竟可能保持角色长相气质与原来一致。',
      tools: [imageGenerationTool(
        {
          model: 'gpt-image-1',
          quality: 'high',
        }
      )],
      model: 'gpt-4.1-mini',
      toolUseBehavior: 'stop_on_first_tool',
    })
  }

  async screenshotGenerate(image: string): Promise<string> {
    try {
      let thread: AgentInputItem[] = [];
      thread.push({
        role: 'user',
        content: [
          {
            type: 'input_image',
            image: image,
          },
          {
            type: 'input_text',
            text: '请分析这张草图或图像，描述你看到的主要元素和可能的创作意图。'
          }
        ]
      })

      const result_pre = await run(this.intentAgent, thread)
      console.log(result_pre.finalOutput)
      thread = result_pre.history

      thread.push({ 
        role: 'user', 
        content: [
          {
            type: 'input_text',
            text: '基于上述分析，请生成一个安全、美观的图像。确保内容积极向上，适合所有年龄段。'
          }
        ]
      })
      const result = await run(this.drawAgent, thread)
      console.log(result)

      let B64 = ''
      for (const item of result.newItems) {
        if (
          item.type === 'tool_call_item' &&
          (item.rawItem as any).type === 'hosted_tool_call'
        ) {
          B64 = (item.rawItem as any).output as string;
        }
      }
      console.log(B64)
      return B64 ?? '没有生成图像'

    } catch (error) {
      console.error('AI generation error:', error)
      throw error
    }
  }
  
} 