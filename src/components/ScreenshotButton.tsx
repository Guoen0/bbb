import React from 'react'
import { TLShape, AssetRecordType } from 'tldraw'
import { Message } from '../types/chat'
import { canvasAiService } from '../services/aiService_agent'
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
  const sendImageToAI = async (imageDataUrl: string) => {
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

      const imageB64 = await canvasAiService.screenshotGenerate(imageDataUrl)
      const url = imageB64 ? `data:image/png;base64,${imageB64}` : null


      // 回写到画布
      try {
        // 使用正确的 tldraw API 创建图片
        const assetId = AssetRecordType.createId()
        
        // 创建临时图片元素来获取实际尺寸
        if (!url) {
          throw new Error('AI 生成的图片数据无效')
        }
        
        const img = new Image()
        img.src = url
        await new Promise((resolve) => {
          img.onload = resolve
        })
        
        // 使用实际图片尺寸，但限制最大尺寸以适应画布
        const maxSize = 1024
        let imageWidth = img.width
        let imageHeight = img.height
        
        // 如果图片太大，按比例缩放
        if (imageWidth > maxSize || imageHeight > maxSize) {
          const ratio = Math.min(maxSize / imageWidth, maxSize / imageHeight)
          imageWidth = Math.round(imageWidth * ratio)
          imageHeight = Math.round(imageHeight * ratio)
        }
        
        // 获取画布中心位置，并确保图片完全可见
        const viewport = editor.getViewportPageBounds()
        const centerX = viewport.x + viewport.w / 2 - imageWidth / 2
        const centerY = viewport.y + viewport.h / 2 - imageHeight / 2
        
        // 创建资源
        editor.createAssets([
          {
            id: assetId,
            type: 'image',
            typeName: 'asset',
            props: {
              name: 'AI生成图片.png',
              src: url,
              w: imageWidth,
              h: imageHeight,
              mimeType: 'image/png',
              isAnimated: false,
            },
            meta: {},
          },
        ])
        
        // 创建图片形状
        editor.createShape({
          type: 'image',
          x: centerX,
          y: centerY,
          props: {
            assetId,
            w: imageWidth,
            h: imageHeight,
          },
        })

        // 添加成功消息
        const successMessage: Message = {
          id: Date.now().toString(),
          text: '✨ AI已生成并添加到画布',
          isUser: false,
          timestamp: new Date()
        }
        onAddMessage(successMessage)

      } catch (error) {
        console.error('回写到画布失败:', error)
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: `回写到画布失败: ${error instanceof Error ? error.message : '未知错误'}`,
          isUser: false,
          timestamp: new Date()
        }
        onAddMessage(errorMessage)
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
      await sendImageToAI(dataUrl)
      
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