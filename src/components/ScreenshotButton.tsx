import React from 'react'
import { TLShape } from 'tldraw'
import { Message } from '../types/chat'
import { canvasAiService } from '../services/aiService'
import { TLAiSerializedPrompt } from '../aiServer/types'
import './ScreenshotButton.css'

interface ScreenshotButtonProps {
  editor: any
  selectedShapes: TLShape[]
  position: { x: number; y: number }
  onAddMessage: (message: Message) => void
  isProcessing?: boolean
  setIsProcessing?: (processing: boolean) => void
}

const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({
  editor,
  selectedShapes,
  position,
  onAddMessage,
  isProcessing = false,
  setIsProcessing
}) => {
  // 发送图片给 AI 分析
  const sendImageToAI = async (imageDataUrl: string, userPrompt: string) => {
    if (!canvasAiService.isConfigured()) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '错误：请配置 OpenAI API 密钥',
        isUser: false,
        timestamp: new Date()
      }
      onAddMessage(errorMessage)
      return
    }

    if (setIsProcessing) {
      setIsProcessing(true)
    }

    try {
      if (!editor) return

      // 构建多模态提示
      const prompt: TLAiSerializedPrompt = {
        message: [
          { type: 'text', text: userPrompt },
          { type: 'image', src: imageDataUrl }
        ],
        canvasContent: {
          shapes: editor.getCurrentPageShapes(),
          bindings: [],
          assets: []
        },
        contextBounds: { x: 0, y: 0, w: 1000, h: 800 },
        promptBounds: { x: 0, y: 0, w: 1000, h: 800 }
      }

      const result = await canvasAiService.generateCanvasChanges(prompt)

      // 处理 AI 响应
      if (result.changes.length > 0) {
        let talkMessages: string[] = []
        
        for (const change of result.changes) {
          try {
            switch (change.type) {
              case 'createShape':
                if (change.shape) {
                  editor.createShapes([change.shape])
                }
                break
              case 'updateShape':
                if (change.shape) {
                  editor.updateShapes([change.shape])
                }
                break
              case 'deleteShape':
                if (change.shapeId) {
                  editor.deleteShapes([change.shapeId])
                }
                break
              case 'talk':
                if (change.text) {
                  talkMessages.push(change.text)
                }
                break
            }
          } catch (error) {
            console.error('应用变更失败:', change, error)
          }
        }
        
        if (talkMessages.length > 0) {
          const aiResponse: Message = {
            id: Date.now().toString(),
            text: talkMessages.join('\n'),
            isUser: false,
            timestamp: new Date()
          }
          onAddMessage(aiResponse)
        }
      }

    } catch (error) {
      console.error('AI 分析失败:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `AI 分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        isUser: false,
        timestamp: new Date()
      }
      onAddMessage(errorMessage)
    } finally {
      if (setIsProcessing) {
        setIsProcessing(false)
      }
    }
  }

  const handleScreenshot = async () => {
    if (!editor || selectedShapes.length === 0) return
    
    try {
      console.log('开始截图，选中形状:', selectedShapes.map(s => ({ id: s.id, type: s.type })))
      
      // 使用tldraw内置的图片导出功能
      const result = await editor.toImage(selectedShapes, {
        padding: 20,
        background: true,
        darkMode: false,
        scale: 1
      })
      
      if (!result) {
        throw new Error('tldraw导出失败')
      }
      
      console.log('tldraw导出成功，图片尺寸:', result.width, 'x', result.height)
      
      // 将blob转换为DataURL
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(result.blob)
      })
      
      console.log('转换为dataUrl成功，长度:', dataUrl.length)
      
      // 添加截图消息到聊天
      const screenshotMessage: Message = {
        id: Date.now().toString(),
        text: `✨ 选中 (${selectedShapes.length} 个元素)`,
        isUser: true,
        timestamp: new Date(),
        image: dataUrl
      }
      onAddMessage(screenshotMessage)
      
      console.log('截图已添加到聊天记录，开始发送给AI分析')
      
      // 发送给AI分析
      await sendImageToAI(dataUrl, "这张图片的意图是什么？")
      
    } catch (error) {
      console.error('截图失败:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `截图失败: ${error instanceof Error ? error.message : '未知错误'}`,
        isUser: false,
        timestamp: new Date()
      }
      onAddMessage(errorMessage)
    }
  }

  return (
    <button
      className="magic-button"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onClick={handleScreenshot}
      disabled={isProcessing}
    >
      ✨ 魔法生成
    </button>
  )
}

export default ScreenshotButton 