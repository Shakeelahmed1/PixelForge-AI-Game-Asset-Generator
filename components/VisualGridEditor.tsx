import React, { useState, useRef, useEffect } from 'react';

interface VisualGridEditorProps {
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  onDimensionsChange: (width: number, height: number) => void;
}

const VisualGridEditor: React.FC<VisualGridEditorProps> = ({ imageUrl, frameWidth, frameHeight, onDimensionsChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageRef.current) {
      const updateSize = () => {
        if (imageRef.current) {
          setImageSize({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight });
        }
      };
      // Check on load and on resize
      const observer = new ResizeObserver(updateSize);
      observer.observe(imageRef.current);
      imageRef.current.onload = updateSize;
      if (imageRef.current.complete) updateSize();
      return () => observer.disconnect();
    }
  }, [imageUrl]);

  const scale = imageRef.current ? imageRef.current.naturalWidth / imageSize.width : 1;
  const scaledWidth = frameWidth / scale;
  const scaledHeight = frameHeight / scale;

  const gridStyle: React.CSSProperties = {
    width: imageSize.width,
    height: imageSize.height,
    backgroundImage: `
      linear-gradient(to right, rgba(0, 180, 255, 0.4) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 180, 255, 0.4) 1px, transparent 1px)
    `,
    backgroundSize: `${scaledWidth}px ${scaledHeight}px`,
  };

  const handleResize = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = scaledWidth;
    const startH = scaledHeight;

    const doDrag = (moveEvent: MouseEvent) => {
      let newW = startW;
      let newH = startH;
      if (corner.includes('right')) newW = startW + (moveEvent.clientX - startX);
      if (corner.includes('left')) newW = startW - (moveEvent.clientX - startX);
      if (corner.includes('bottom')) newH = startH + (moveEvent.clientY - startY);
      if (corner.includes('top')) newH = startH - (moveEvent.clientY - startY);
      onDimensionsChange(Math.max(1, Math.round(newW * scale)), Math.max(1, Math.round(newH * scale)));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const selectionStyle: React.CSSProperties = {
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
    top: 0,
    left: 0,
  };

  return (
    <div ref={containerRef} className="relative select-none w-full h-full flex items-center justify-center">
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Sprite Sheet"
        className="max-w-full max-h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
      />
      
      {imageSize.width > 0 && frameWidth > 0 && frameHeight > 0 && (
          <>
            <div className="absolute inset-0 pointer-events-none" style={gridStyle}></div>
            <div className="absolute border-2 border-yellow-400 pointer-events-none" style={selectionStyle}>
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
                    <div 
                        key={corner} 
                        onMouseDown={(e) => handleResize(e, corner)}
                        className="absolute w-3 h-3 bg-yellow-400 border border-black -m-1.5 cursor-nwse-resize pointer-events-auto"
                        style={{
                            top: corner.includes('top') ? 0 : '100%',
                            left: corner.includes('left') ? 0 : '100%',
                            cursor: (corner === 'top-left' || corner === 'bottom-right') ? 'nwse-resize' : 'nesw-resize'
                        }}
                    />
                ))}
            </div>
          </>
      )}
    </div>
  );
};

export default VisualGridEditor;