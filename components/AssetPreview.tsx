import React, { useState, useEffect } from 'react';
import type { GeneratedAssets } from '../types';
import { AnimationPlayer } from './AnimationPlayer';
import { DownloadIcon } from './icons/DownloadIcon';
import { ExpandIcon } from './icons/ExpandIcon';
import DetailedAnimationViewer from './DetailedAnimationViewer';
import { cropSpriteSheetForAnimation, zipAndDownloadParts } from '../utils/imageUtils';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

interface AssetPreviewProps {
  assets: GeneratedAssets | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  onMetadataUpdate: (newWidth: number, newHeight: number) => void;
}

interface PreviewControls {
  [animationName: string]: {
    croppedUrl: string;
    isPlaying: boolean;
  };
}

const AssetPreview: React.FC<AssetPreviewProps> = ({ assets, isLoading, loadingMessage, error, onMetadataUpdate }) => {
    const [previewControls, setPreviewControls] = useState<PreviewControls>({});
    const [detailedViewAnimName, setDetailedViewAnimName] = useState<string | null>(null);
    const [isBgPlaying, setIsBgPlaying] = useState(false);

    useEffect(() => {
        if (assets?.spriteSheetImage && assets.spriteSheetMetadata) {
            const fullSpriteSheetUrl = `data:image/png;base64,${assets.spriteSheetImage}`;
            const cropPromises = assets.spriteSheetMetadata.map(anim =>
                cropSpriteSheetForAnimation(fullSpriteSheetUrl, anim)
                .then(croppedUrl => ({ name: anim.animationName, url: croppedUrl }))
                .catch(e => ({ name: anim.animationName, url: '' }))
            );
            Promise.all(cropPromises).then((croppedAnims) => {
                const newControls = croppedAnims.reduce((acc, croppedAnim) => {
                    acc[croppedAnim.name] = { croppedUrl: croppedAnim.url, isPlaying: false }; // Paused by default
                    return acc;
                }, {} as PreviewControls);
                setPreviewControls(newControls);
            });
        } else {
            setPreviewControls({});
        }
        setIsBgPlaying(false); // Pause background on new assets
    }, [assets]);

    const togglePlay = (animationName: string) => {
        setPreviewControls(prev => ({
            ...prev,
            [animationName]: { ...prev[animationName], isPlaying: !prev[animationName].isPlaying }
        }));
    };

    const downloadAsset = (base64Data: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadMetadata = (metadata: any, filename: string) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(metadata, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <div className="flex flex-col items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div><p className="mt-4 text-gray-300">{loadingMessage || 'Generating...'}</p></div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-400"><div className="bg-red-900/50 border border-red-700 p-4 rounded-md"><p className="font-bold">Error:</p><p>{error}</p></div></div>;
    if (!assets) return <div className="flex items-center justify-center h-full text-gray-500"><p>Generated assets will appear here.</p></div>;

    const renderSpriteContent = () => {
        if (assets.bodyPartsImage) {
            return (
                <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-200">Modular Body Parts</h3>
                        <div className="flex gap-2">
                             <button onClick={() => zipAndDownloadParts(`data:image/png;base64,${assets.bodyPartsImage!}`)} className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md transition-colors"><DownloadIcon /> Download Parts as ZIP</button>
                             <button onClick={() => downloadAsset(assets.bodyPartsImage!, 'body_parts.png')} className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"><DownloadIcon /> Full Sheet</button>
                        </div>
                    </div>
                     <img src={`data:image/png;base64,${assets.bodyPartsImage}`} alt="Generated Body Parts" className="w-full rounded-md bg-black/20" style={{ imageRendering: 'pixelated' }} />
                </div>
            );
        }

        if (assets.spriteSheetImage && assets.spriteSheetMetadata) {
            return (
                 <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-200">Sprite Animations</h3>
                        <div className="flex gap-2">
                            <button onClick={() => downloadAsset(assets.spriteSheetImage!, 'spritesheet.png')} className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"><DownloadIcon /> Spritesheet</button>
                            <button onClick={() => downloadMetadata(assets.spriteSheetMetadata!, 'spritesheet_meta.json')} className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"><DownloadIcon /> Metadata</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {assets.spriteSheetMetadata.map(anim => (
                            <div key={anim.animationName} className="bg-gray-800 p-2 rounded-md flex flex-col items-center justify-center text-center">
                                <div className="relative group">
                                    <AnimationPlayer croppedSpriteSheetUrl={previewControls[anim.animationName]?.croppedUrl || ''} animation={anim} isPlaying={previewControls[anim.animationName]?.isPlaying || false} fps={12} className="w-24 h-24 bg-black/20 rounded" zoom={2} />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => togglePlay(anim.animationName)} className="p-2 text-white">{previewControls[anim.animationName]?.isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                                        <button onClick={() => setDetailedViewAnimName(anim.animationName)} className="p-2 text-white"><ExpandIcon /></button>
                                    </div>
                                </div>
                                <p className="text-xs mt-2 text-gray-300">{anim.animationName} ({anim.frames.length}f)</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-100">Generated Assets</h2>
            {renderSpriteContent()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {assets.tilesetImage && (<div className="bg-gray-900/50 rounded-lg p-4"><div className="flex justify-between items-center mb-2"><h3 className="font-semibold text-gray-200">Tileset</h3><button onClick={() => downloadAsset(assets.tilesetImage, 'tileset.png')} className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"><DownloadIcon /> PNG</button></div><img src={`data:image/png;base64,${assets.tilesetImage}`} alt="Generated Tileset" className="w-full rounded-md" style={{ imageRendering: 'pixelated' }} /></div>)}
                 {assets.animatedBackgroundSheet && assets.animatedBackgroundMetadata && (<div className="bg-gray-900/50 rounded-lg p-4 relative group"><div className="flex justify-between items-center mb-2"><h3 className="font-semibold text-gray-200">Animated Background</h3><button onClick={() => downloadAsset(assets.animatedBackgroundSheet!, 'anim_background.png')} className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"><DownloadIcon /> PNG</button></div><AnimationPlayer croppedSpriteSheetUrl={`data:image/png;base64,${assets.animatedBackgroundSheet}`} animation={assets.animatedBackgroundMetadata} isPlaying={isBgPlaying} fps={12} className="w-full h-auto bg-black/20 rounded" zoom={1} /><div className="absolute inset-0 top-10 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"><button onClick={() => setIsBgPlaying(p => !p)} className="p-2 text-white">{isBgPlaying ? <PauseIcon /> : <PlayIcon />}</button></div></div>)}
                 {Object.keys(assets.backgroundImages).length > 0 && (<div className="bg-gray-900/50 rounded-lg p-4 space-y-3"><h3 className="font-semibold text-gray-200">Background Layers</h3>{Object.entries(assets.backgroundImages).map(([key, value]) => value && (<div key={key}><div className="flex justify-between items-center mb-1"><p className="text-sm text-gray-400 capitalize">{key}</p><button onClick={() => downloadAsset(value, `${key}.png`)} className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 px-2 py-1 rounded-md transition-colors"><DownloadIcon /> PNG</button></div><img src={`data:image/png;base64,${value}`} alt={key} className="w-full rounded-md" /></div>))}</div>)}
            </div>
            {detailedViewAnimName && assets && (<DetailedAnimationViewer assets={assets} initialAnimationName={detailedViewAnimName} onClose={() => setDetailedViewAnimName(null)} onMetadataUpdate={onMetadataUpdate} />)}
        </div>
    );
};

export default AssetPreview;