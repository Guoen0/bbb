import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { TldrawModernAIService } from '../utils/modernAiService';
import { Editor } from 'tldraw';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ModernChatPanelProps {
  editor?: Editor;
}

export function ModernChatPanel({ editor }: ModernChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是你的 AI 画布助手。你可以告诉我想要创建什么图形，我会帮你在画布上实现。试试说"画一个红色的圆形"！',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiServiceRef = useRef<TldrawModernAIService>(new TldrawModernAIService());
  const currentRequestRef = useRef<{ cancel?: () => void } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !editor) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // 直接使用 AI 服务生成更改
      const aiService = aiServiceRef.current;
      const generateFn = aiService.createGenerateFunction();
      
      // 创建模拟的提示对象
      const mockPrompt = {
        message: userInput,
        canvasContent: {
          shapes: editor.getCurrentPageShapes(),
          bindings: [],
          assets: []
        },
        contextBounds: editor.getViewportPageBounds().toJson(),
        promptBounds: editor.getViewportPageBounds().toJson()
      };

      // 生成 AI 更改
      const controller = new AbortController();
      currentRequestRef.current = { cancel: () => controller.abort() };
      
      const changes = await generateFn({ 
        editor, 
        prompt: mockPrompt, 
        signal: controller.signal 
      });

      // 应用更改到编辑器
      if (changes && changes.length > 0) {
        editor.run(() => {
          changes.forEach(change => {
            if (change.type === 'createShape') {
              editor.createShape(change.shape);
            }
          });
        });
      }

      // 添加 AI 响应消息
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '好的！我已经根据你的指令在画布上创建了相应的内容。',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('AI processing error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，处理你的请求时遇到了问题。请稍后再试。',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      currentRequestRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCancel = () => {
    if (currentRequestRef.current?.cancel) {
      currentRequestRef.current.cancel();
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">
          <Bot className="chat-icon" />
          <span>AI 助手</span>
        </div>
        <div className="chat-status">
          {editor ? '已连接画布' : '等待画布连接'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-icon">
              {message.isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai-message loading">
            <div className="message-icon">
              <Loader size={16} className="spinning" />
            </div>
            <div className="message-content">
              <div className="message-text">正在处理你的请求...</div>
              <button 
                onClick={handleCancel}
                className="cancel-button"
              >
                取消
              </button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="告诉我你想要画什么..."
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            <Send size={18} />
          </button>
        </div>
        
        <div className="chat-hints">
          <span>试试说：</span>
          <button 
            onClick={() => setInputValue('画一个红色的圆形')}
            className="hint-button"
          >
            画一个红色的圆形
          </button>
          <button 
            onClick={() => setInputValue('创建一个蓝色的矩形')}
            className="hint-button"
          >
            创建一个蓝色的矩形
          </button>
        </div>
      </div>
    </div>
  );
}