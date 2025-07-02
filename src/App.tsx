import React, { useState, useCallback, useRef } from 'react';
import CanvasArea from './components/CanvasArea';
import ChatPanel from './components/ChatPanel';
import { Message } from './types';
import { aiService } from './utils/aiService';
import { Editor, createShapeId } from 'tldraw';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是你的 AI 创作助手。我可以帮助你在画布上创作任何内容。请告诉我你想要创作什么，或者直接在画布上开始绘制！',
      timestamp: Date.now(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  // 设置编辑器引用
  const handleEditorMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    console.log('Canvas mounted:', editor);
  }, []);

  // 应用画布更新
  const applyCanvasUpdate = useCallback((canvasUpdate: any) => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      // 创建形状
      if (canvasUpdate.shapes && canvasUpdate.shapes.length > 0) {
        canvasUpdate.shapes.forEach((shapeData: any) => {
          // 生成唯一的形状 ID
          const shapeId = createShapeId();
          
          // 根据形状类型创建对应的形状
          if (shapeData.type === 'geo') {
            editor.createShape({
              id: shapeId,
              type: 'geo',
              x: shapeData.x || 100,
              y: shapeData.y || 100,
              props: {
                geo: shapeData.props.geo || 'rectangle',
                w: shapeData.props.w || 100,
                h: shapeData.props.h || 100,
                fill: shapeData.props.fill || 'blue',
              }
            });
          } else if (shapeData.type === 'text') {
            editor.createShape({
              id: shapeId,
              type: 'text',
              x: shapeData.x || 100,
              y: shapeData.y || 100,
              props: {
                text: shapeData.props.text || '文本',
                size: shapeData.props.size || 'medium',
              }
            });
          } else if (shapeData.type === 'arrow') {
            editor.createShape({
              id: shapeId,
              type: 'arrow',
              x: shapeData.x || 100,
              y: shapeData.y || 100,
              props: {
                start: shapeData.props.start || { x: 0, y: 0 },
                end: shapeData.props.end || { x: 100, y: 0 },
              }
            });
          }
        });
        
        // 将视图居中到新创建的形状
        editor.zoomToFit();
      }
    } catch (error) {
      console.error('Error applying canvas update:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 调用 AI 服务
      const aiResponse = await aiService.processUserMessage(content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.message || '抱歉，我无法处理这个请求。',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 如果有画布更新，应用到编辑器
      if (aiResponse.canvasUpdate && editorRef.current) {
        console.log('Canvas update received:', aiResponse.canvasUpdate);
        applyCanvasUpdate(aiResponse.canvasUpdate);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了错误。请稍后再试。',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <CanvasArea onEditorMount={handleEditorMount} />
      </div>
      <div className="chat-container">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;