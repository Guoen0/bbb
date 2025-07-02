import React from 'react';
import { Tldraw, Editor } from 'tldraw';
import 'tldraw/tldraw.css';

interface CanvasAreaProps {
  onEditorMount?: (editor: Editor) => void;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ onEditorMount }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Tldraw
        persistenceKey="multimodal-canvas"
        onMount={(editor) => {
          console.log('Canvas mounted:', editor);
          onEditorMount?.(editor);
        }}
      />
    </div>
  );
};

export default CanvasArea;