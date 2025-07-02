import React, { useState, useEffect, useRef } from 'react'
import { Message } from '../types/chat'
import './ChatPanel.css'

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (text: string) => void
  isProcessing?: boolean
}

function ChatPanel({ messages, onSendMessage, isProcessing = false }: ChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到最下方
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    onSendMessage(inputText)
    setInputText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI 助手</h2>
      </div>
      <div className="chat-messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.isUser ? 'user' : 'ai'}`}
          >
            <div className="message-content">
              {message.text}
              {message.image && (
                <div className="message-image">
                  <img src={message.image} alt="截图" />
                </div>
              )}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入你的消息..."
          rows={3}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isProcessing}
        >
          {isProcessing ? '处理中...' : '发送'}
        </button>
      </div>
    </div>
  )
}

export default ChatPanel 