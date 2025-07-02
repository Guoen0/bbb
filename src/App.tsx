import React, { useState, useRef } from 'react'
import { Tldraw, useEditor } from 'tldraw'
import { Message } from './types/chat'
import { canvasAiService } from './services/aiService'
import { TLAiSerializedPrompt } from './aiServer/types'
import ChatPanel from './components/ChatPanel'
import ScreenshotButton from './components/ScreenshotButton'
import 'tldraw/tldraw.css'
import './App.css'

function App() {
  const editorRef = useRef<any>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '你好！我是你的 AI 助手，可以帮助你在画布上创作内容。',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedShapes, setSelectedShapes] = useState<any[]>([])
  const [showScreenshotButton, setShowScreenshotButton] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])

    // 检查 API 配置
    if (!canvasAiService.isConfigured()) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '错误：请配置 OpenAI API 密钥。在项目根目录创建 .env 文件并添加 VITE_OPENAI_API_KEY=你的密钥',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    setIsProcessing(true)

    try {
      // 添加处理中的消息
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '正在处理你的请求...',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, processingMessage])

      // 获取当前画布状态
      const editor = editorRef.current
      if (!editor) {
        throw new Error('画布编辑器未初始化')
      }

      // 获取画布状态
      const allShapes = editor.getCurrentPageShapes()
      const viewport = editor.getViewportPageBounds()
      
      console.log('当前画布形状:', allShapes)
      console.log('视口范围:', viewport)
      
      // 构建 AI 提示
      const prompt: TLAiSerializedPrompt = {
        message: text,
        canvasContent: {
          shapes: allShapes,
          bindings: [],
          assets: []
        },
        contextBounds: {
          x: viewport.x,
          y: viewport.y,
          w: viewport.w,
          h: viewport.h
        },
        promptBounds: {
          x: viewport.x,
          y: viewport.y,
          w: viewport.w,
          h: viewport.h
        }
      }

      // 调用 AI 服务
      const result = await canvasAiService.generateCanvasChanges(prompt)

      // 应用变更到画布
      if (result.changes.length > 0) {
        console.log('AI 生成的变更:', result.changes)
        
        // 应用每个变更到画布
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
              default:
                console.warn('未知的变更类型:', change.type)
            }
          } catch (error) {
            console.error('应用变更失败:', change, error)
          }
        }
        
        // 添加 AI 对话消息到聊天面板
        if (talkMessages.length > 0) {
          const aiTalkMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: talkMessages.join('\n'),
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiTalkMessage])
        }
        
        // 如果有画布变更，显示成功消息
        const canvasChanges = result.changes.filter(change => change.type !== 'talk')
        if (canvasChanges.length > 0) {
          const successMessage: Message = {
            id: (Date.now() + 3).toString(),
            text: `成功应用 ${canvasChanges.length} 个画布变更`,
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, successMessage])
        }
      } else {
        const noChangeMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: 'AI 没有生成任何变更',
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noChangeMessage])
      }

    } catch (error) {
      console.error('AI 处理失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  // 监听编辑器选择变化
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor
    
    // 监听选择变化
    const handleSelectionChange = () => {
      const selected = editor.getSelectedShapes()
      setSelectedShapes(selected)
      
      if (selected.length > 1) {
        // 获取选中区域的边界框
        const selectionBounds = editor.getSelectionPageBounds()
        if (selectionBounds) {
          
          // 获取画布容器的位置
          const canvasContainer = document.querySelector('.tl-container')
          if (canvasContainer) {
            const containerRect = canvasContainer.getBoundingClientRect()
            
            // 获取视口信息
            const viewport = editor.getViewportPageBounds()
            const zoom = editor.getZoomLevel()
            
            // 计算按钮位置（相对于画布容器）
            const buttonX = (selectionBounds.x - viewport.x) * zoom + containerRect.left + selectionBounds.w * zoom / 2 - 50
            const buttonY = (selectionBounds.y - viewport.y) * zoom + containerRect.top + selectionBounds.h * zoom + 10
            
            setButtonPosition({
              x: buttonX,
              y: buttonY
            })
            setShowScreenshotButton(true)
          }
        }
      } else {
        setShowScreenshotButton(false)
      }
    }
    
    // 添加选择变化监听器
    editor.store.listen(handleSelectionChange, { scope: 'session' })
    
    // 添加视口变化监听器（处理缩放和平移）
    const handleViewportChange = () => {
      if (selectedShapes.length > 1) {
        handleSelectionChange()
      }
    }
    
    editor.store.listen(handleViewportChange, { scope: 'session' })
    
    // 初始检查
    handleSelectionChange()
  }

  // 添加消息到聊天记录
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  return (
    <div className="app">
      <div className="canvas-container">
        <Tldraw onMount={handleEditorMount} />
        {showScreenshotButton && (
          <ScreenshotButton
            editor={editorRef.current}
            selectedShapes={selectedShapes}
            position={buttonPosition}
            onAddMessage={addMessage}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        )}
      </div>
      <ChatPanel 
        messages={messages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default App 