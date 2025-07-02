import { TLAiChange, TLAiSerializedPrompt } from './types'
import { ISimpleEvent, ISimpleCreateEvent, ISimpleMoveEvent, ISimpleDeleteEvent, ISimpleTalkEvent } from './schema'
import {
	IndexKey,
	TLArrowBinding,
	TLArrowShape,
	TLDefaultFillStyle,
	TLGeoShape,
	TLLineShape,
	TLNoteShape,
	TLTextShape,
	toRichText,
} from 'tldraw'

// 验证和清理文本对齐值
function validateTextAlign(align: string | undefined): string {
  if (!align) return 'middle'
  
  const validAligns = ['start', 'middle', 'end']
  if (validAligns.includes(align)) {
    return align
  }
  
  // 映射常见的错误值
  const alignMap: Record<string, string> = {
    'left': 'start',
    'right': 'end',
    'center': 'middle',
    'centre': 'middle'
  }
  
  const mappedAlign = alignMap[align.toLowerCase()]
  if (mappedAlign) {
    console.warn(`文本对齐 "${align}" 被映射为 "${mappedAlign}"`)
    return mappedAlign
  }
  
  console.warn(`未知文本对齐 "${align}"，使用默认值 "middle"`)
  return 'middle'
}

const FILL_MAP = {
  none: 'none',
  solid: 'fill', 
  semi: 'semi',
  tint: 'solid',
  pattern: 'pattern'
} as const

export function convertSimpleEventsToTldrawChanges(
  prompt: TLAiSerializedPrompt,
  events: ISimpleEvent[]
): TLAiChange[] {
  const changes: TLAiChange[] = []
  
  for (const event of events) {
    try {
      changes.push(...convertSingleEvent(prompt, event))
    } catch (error) {
      console.warn('跳过无效事件:', event, error)
    }
  }
  
  return changes
}

function convertSingleEvent(prompt: TLAiSerializedPrompt, event: ISimpleEvent): TLAiChange[] {
  switch (event.type) {
    case 'create':
    case 'update':
      return convertCreateOrUpdateEvent(event)
    case 'move':
      return convertMoveEvent(event)
    case 'delete':
      return convertDeleteEvent(event)
    case 'think':
      return [] // 思考事件不需要转换
    case 'talk':
      return convertTalkEvent(event)
    default:
      return []
  }
}

function convertCreateOrUpdateEvent(event: ISimpleCreateEvent): TLAiChange[] {
  const { shape } = event
  const changes: TLAiChange[] = []
  const eventType = event.type === 'create' ? 'createShape' : 'updateShape'

  // 确保形状 ID 以 "shape:" 开头
  const shapeId = shape.shapeId.startsWith('shape:') ? shape.shapeId : `shape:${shape.shapeId}`

  switch (shape.type) {
    case 'text':
      changes.push({
        type: eventType,
        description: shape.note || '',
        shape: {
          id: shapeId,
          type: 'text',
          x: shape.x,
          y: shape.y,
          props: {
						richText: toRichText(shape.text ?? ''),
						color: shape.color ?? 'black',
						textAlign: validateTextAlign(shape.textAlign),
          }
        }
      })
      break
    
    case 'rectangle':
    case 'ellipse':
      changes.push({
        type: eventType,
        description: shape.note || '',
        shape: {
          id: shapeId,
          type: 'geo',
          x: shape.x,
          y: shape.y,
          props: {
            geo: shape.type,
            w: shape.width,
            h: shape.height,
            color: shape.color || 'black',
            fill: FILL_MAP[shape.fill || 'none'],
            richText: toRichText(shape.text ?? ''),
          }
        }
      })
      break

    case 'line':
      const minX = Math.min(shape.x1, shape.x2)
      const minY = Math.min(shape.y1, shape.y2)
      changes.push({
        type: eventType,
        description: shape.note || '',
        shape: {
          id: shapeId,
          type: 'line',
          x: minX,
          y: minY,
          props: {
            points: {
              a1: {
                id: 'a1',
                index: 'a1' as IndexKey,
                x: shape.x1 - minX,
                y: shape.y1 - minY
              },
              a2: {
                id: 'a2', 
                index: 'a2' as IndexKey,
                x: shape.x2 - minX,
                y: shape.y2 - minY
              }
            },
            color: shape.color || 'black'
          }
        }
      })
      break

    case 'arrow':
      changes.push({
        type: eventType,
        description: shape.note || '',
        shape: {
          id: shapeId,
          type: 'arrow',
          x: 0,
          y: 0,
          props: {
            start: { x: shape.x1, y: shape.y1 },
            end: { x: shape.x2, y: shape.y2 },
            color: shape.color || 'black',
            text: shape.text || ''
          }
        }
      })
      break
  }

  return changes
}

function convertMoveEvent(event: ISimpleMoveEvent): TLAiChange[] {
  const shapeId = event.shapeId.startsWith('shape:') ? event.shapeId : `shape:${event.shapeId}`
  return [{
    type: 'updateShape',
    description: `Move shape ${event.shapeId}`,
    shape: {
      id: shapeId,
      x: event.x,
      y: event.y
    }
  }]
}

function convertDeleteEvent(event: ISimpleDeleteEvent): TLAiChange[] {
  const shapeId = event.shapeId.startsWith('shape:') ? event.shapeId : `shape:${event.shapeId}`
  return [{
    type: 'deleteShape',
    description: `Delete shape ${event.shapeId}`,
    shapeId: shapeId
  }]
}

function convertTalkEvent(event: ISimpleTalkEvent): TLAiChange[] {
  return [{
    type: 'talk',
    description: event.intent || 'AI 对话',
    text: event.text
  }]
} 