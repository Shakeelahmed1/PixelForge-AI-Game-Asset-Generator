import React, { useState, useEffect, useMemo } from 'react';
import type { GeneratedAssets } from '../types';
import { AnimationPlayer } from './AnimationPlayer';
import { cropSpriteSheetForAnimation, detectSpriteGrid } from '../utils/imageUtils';
// FIX: Corrected icon imports. PlayIcon should be imported from PlayIcon.tsx and PauseIcon from PauseIcon.tsx.
import { PauseIcon } from './icons/PauseIcon';
import { PlayIcon } from './icons/PlayIcon';
import VisualGridEditor from './VisualGridEditor';

interface DetailedAnimationViewerProps {
    assets: GeneratedAssets;
    initialAnimationName: string;
    onClose: () => void;
    onMetadataUpdate: (newWidth: number, newHeight: number) => void;
}

export const DetailedAnimationViewer: React.FC<DetailedAnimationViewerProps> = ({ assets, initialAnimationName, onClose, onMetadataUpdate }) => {
  const [selectedAnimName, setSelectedAnimName] = useState(initialAnimationName);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(12);

  const fullSpriteSheetUrl = useMemo(() => assets.spriteSheetImage ? `data:image/png;base64,${assets.spriteSheetImage}` : '', [assets.spriteSheetImage]);
  const selectedAnimation = useMemo(() => assets.spriteSheetMetadata?.find(a => a.animationName === selectedAnimName), [assets.spriteSheetMetadata, selectedAnimName]);

  const [frameWidth, setFrameWidth] = useState(selectedAnimation?.frameWidth || 0);
  const [frameHeight, setFrameHeight] = useState(selectedAnimation?.frameHeight || 0);

  useEffect(() => {
    if (selectedAnimation) {
      setFrameWidth(selectedAnimation.frameWidth);
      setFrameHeight(selectedAnimation.frameHeight);
    }
  }, [selectedAnimation]);
  
  useEffect(() => {
    let isMounted = true;
    if (selectedAnimation && fullSpriteSheetUrl) {
      setCroppedUrl(null);
      cropSpriteSheetForAnimation(fullSpriteSheetUrl, selectedAnimation)
        .then(url => { if (isMounted) setCroppedUrl(url); })
        .catch(console.error);
    }
    return () => { isMounted = false; };
  }, [selectedAnimation, fullSpriteSheetUrl]);

  const handleMagicGrid = async () => {
    if (!fullSpriteSheetUrl) return;
    try {
        const { width, height } = await detectSpriteGrid(fullSpriteSheetUrl);
        setFrameWidth(width);
        setFrameHeight(height);
    } catch (error) {
        console.error("Magic Grid failed:", error);
        alert("Could not automatically detect grid. Please set it manually.");
    }
  };

  const handleSaveChanges = () => onMetadataUpdate(frameWidth, frameHeight);

  if (!selectedAnimation) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl border border-gray-700 p-6 flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
            <div className="flex-1 flex flex-col">
                 <h4 className="text-lg font-semibold mb-2 text-center">Sprite Sheet Grid Editor</h4>
                 <div className="w-full h-96 bg-gray-900/50 rounded-lg p-2 overflow-auto flex items-center justify-center">
                    <VisualGridEditor 
                        imageUrl={fullSpriteSheetUrl}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        onDimensionsChange={(w, h) => { setFrameWidth(w); setFrameHeight(h); }}
                    />
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                     <div><label className="text-xs text-gray-400">Frame Width</label><input type="number" value={frameWidth} onChange={e => setFrameWidth(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1" /></div>
                     <div><label className="text-xs text-gray-400">Frame Height</label><input type="number" value={frameHeight} onChange={e => setFrameHeight(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1" /></div>
                     <button onClick={handleMagicGrid} className="md:col-start-3 w-full text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors self-end">Magic Grid (Auto-Detect)</button>
                     <button onClick={handleSaveChanges} className="w-full text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors self-end">Apply Grid Changes</button>
                 </div>
            </div>
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-between bg-gray-900/50 p-4 rounded-lg">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold">{selectedAnimation.animationName}</h3>
                        <p className="text-sm text-gray-400">{selectedAnimation.frames.length} frames</p>
                    </div>
                    {croppedUrl ? <AnimationPlayer croppedSpriteSheetUrl={croppedUrl} animation={selectedAnimation} isPlaying={isPlaying} fps={fps} className="w-32 h-32 my-4" onTransition={setSelectedAnimName} zoom={4} /> : <div className="text-gray-500 w-32 h-32 my-4 flex items-center justify-center">Loading...</div>}
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex items-center justify-center gap-4">
                            {/* FIX: Swapped icons to show Pause when playing and Play when paused for better UX. */}
                            <button onClick={() => setIsPlaying(p => !p)} className="p-2 text-gray-300 hover:text-white bg-gray-700 rounded-full">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                            <div className="flex-1"><label htmlFor="fps-slider" className="text-xs text-gray-400">FPS: {fps}</label><input id="fps-slider" type="range" min="1" max="60" value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" /></div></div>
                    </div>
                </div>
                <div className="mt-4 flex-shrink-0">
                    <h4 className="text-lg font-semibold mb-2">Animations</h4>
                    <div className="space-y-1 overflow-y-auto max-h-48">
                        {assets.spriteSheetMetadata?.map(anim => (<button key={anim.animationName} onClick={() => setSelectedAnimName(anim.animationName)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedAnimName === anim.animationName ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-700'}`}>{anim.animationName}</button>))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DetailedAnimationViewer;