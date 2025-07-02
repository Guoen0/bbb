export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CanvasData {
  shapes: any[];
  bindings: any[];
  assets: any[];
}

export interface AIResponse {
  message?: string;
  canvasUpdate?: CanvasData;
  imageUrl?: string;
}