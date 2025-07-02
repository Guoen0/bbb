import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

const CanvasArea: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Tldraw
        persistenceKey="multimodal-canvas"
        onMount={(editor) => {
          console.log('Canvas mounted:', editor);
        }}
      />
    </div>
  );
};

export default CanvasArea;