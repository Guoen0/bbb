import React, { useState, useCallback } from 'react';
import CanvasArea from './components/CanvasArea';
import ChatPanel from './components/ChatPanel';
import { Message } from './types';
import { aiService } from './utils/aiService';

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
      
      // 如果有画布更新，可以在这里处理
      if (aiResponse.canvasUpdate) {
        console.log('Canvas update received:', aiResponse.canvasUpdate);
        // TODO: 实现画布更新逻辑
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
        <CanvasArea />
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