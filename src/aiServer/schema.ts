import { z } from 'zod'

const SimpleColor = z.enum([
  'red', 'light-red', 'green', 'light-green', 'blue', 'light-blue',
  'orange', 'yellow', 'black', 'violet', 'light-violet', 'grey', 'white'
])

export type ISimpleColor = z.infer<typeof SimpleColor>

const SimpleFill = z.enum(['none', 'tint', 'semi', 'solid', 'pattern'])
export type ISimpleFill = z.infer<typeof SimpleFill>

const SimpleTextShape = z.object({
  type: z.literal('text'),
  shapeId: z.string(),
  note: z.string().optional().default(''),
  x: z.number(),
  y: z.number(),
  color: SimpleColor.optional(),
  text: z.string().optional().default(''),
  textAlign: z.enum(['start', 'middle', 'end']).optional().default('middle'),
})

const SimpleRectangleShape = z.object({
  type: z.literal('rectangle'),
  shapeId: z.string(),
  note: z.string().optional().default(''),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: SimpleColor.optional(),
  fill: SimpleFill.optional(),
  text: z.string().optional(),
})

const SimpleEllipseShape = z.object({
  type: z.literal('ellipse'),
  shapeId: z.string(),
  note: z.string().optional().default(''),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: SimpleColor.optional(),
  fill: SimpleFill.optional(),
  text: z.string().optional(),
})

const SimpleLineShape = z.object({
  type: z.literal('line'),
  shapeId: z.string(),
  note: z.string().optional().default(''),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  color: SimpleColor.optional(),
})

const SimpleArrowShape = z.object({
  type: z.literal('arrow'),
  shapeId: z.string(),
  note: z.string().optional().default(''),
  fromId: z.string().nullable(),
  toId: z.string().nullable(),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  color: SimpleColor.optional(),
  text: z.string().optional(),
})

const SimpleShape = z.union([
  SimpleTextShape,
  SimpleRectangleShape,
  SimpleEllipseShape,
  SimpleLineShape,
  SimpleArrowShape,
])

export type ISimpleShape = z.infer<typeof SimpleShape>

export const SimpleCreateEvent = z.object({
  type: z.enum(['create', 'update']),
  shape: SimpleShape,
  intent: z.string().optional().default(''),
})

export type ISimpleCreateEvent = z.infer<typeof SimpleCreateEvent>

export const SimpleMoveEvent = z.object({
  type: z.literal('move'),
  shapeId: z.string(),
  x: z.number(),
  y: z.number(),
  intent: z.string().optional().default(''),
})

export type ISimpleMoveEvent = z.infer<typeof SimpleMoveEvent>

const SimpleDeleteEvent = z.object({
  type: z.literal('delete'),
  shapeId: z.string(),
  intent: z.string().optional().default(''),
})

export type ISimpleDeleteEvent = z.infer<typeof SimpleDeleteEvent>

const SimpleThinkEvent = z.object({
  type: z.literal('think'),
  text: z.string().optional().default(''),
  intent: z.string().optional().default(''),
})

export type ISimpleThinkEvent = z.infer<typeof SimpleThinkEvent>

const SimpleTalkEvent = z.object({
  type: z.literal('talk'),
  text: z.string(),
  intent: z.string().optional().default(''),
})

export type ISimpleTalkEvent = z.infer<typeof SimpleTalkEvent>

export const SimpleEvent = z.union([
  SimpleThinkEvent,
  SimpleTalkEvent,
  SimpleCreateEvent,
  SimpleDeleteEvent,
  SimpleMoveEvent,
])

export type ISimpleEvent = z.infer<typeof SimpleEvent>

export const ModelResponse = z.object({
  long_description_of_strategy: z.string(),
  events: z.array(SimpleEvent),
})

export type IModelResponse = z.infer<typeof ModelResponse> 