import React, { useState } from 'react';
import GlobalSettings from './components/GlobalSettings';
import SpriteGenerator from './components/SpriteGenerator';
import EnvironmentGenerator from './components/EnvironmentGenerator';
import AssetPreview from './components/AssetPreview';
import type { SpriteConfig, GlobalStyle, EnvironmentConfig, GeneratedAssets, RandomPrompts, PerspectiveType } from './types';
import { generateSpriteSheetAndMetadata, generateRandomPrompts } from './services/geminiService';
import { rebuildSpriteMetadata } from './utils/metadataUtils';

const initialGlobalStyle: GlobalStyle = {
  artStyle: "16-bit pixel art, moody, dark fantasy",
  resolution: "64x64 sprites",
  perspective: "side-scroller",
};

const initialSpriteConfig: SpriteConfig = {
  description: "A hulking cybernetic knight with a glowing red visor, wielding a large energy sword.",
  animations: [
    { id: '1', name: 'Idle', frames: 8, loop: 'loop' },
    { id: '2', name: 'Walk', frames: 12, loop: 'loop' },
    { id: '3', name: 'Run', frames: 6, loop: 'loop' }
  ],
  isModular: false,
  isVector: false,
};

const initialEnvConfig: EnvironmentConfig = {
    tilesetFloorPrompt: "A seamless 32x32 tileset for a wet, mossy dungeon floor, including 5 variants of standard ground.",
    tilesetWallPrompt: "Stone brick dungeon walls, with cracked and mossy variants.",
    tilesetPickupPrompt: "Gold coins, a glowing blue mana potion, and a wooden treasure chest.",
    backgroundPrompt: "A highly detailed, parallax-ready background of a cavern with glowing crystals.",
    generateParallax: true,
    animateBackground: false,
    backgroundAnimationFrames: 8,
};

function App() {
  const [globalStyle, setGlobalStyle] = useState<GlobalStyle>(initialGlobalStyle);
  const [spriteConfig, setSpriteConfig] = useState<SpriteConfig>(initialSpriteConfig);
  const [envConfig, setEnvConfig] = useState<EnvironmentConfig>(initialEnvConfig);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isStyleLocked, setIsStyleLocked] = useState(false);
  const [nextProjectPrompts, setNextProjectPrompts] = useState<RandomPrompts | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedAssets(null);
    setIsStyleLocked(true);
    try {
        setLoadingMessage("Initiating asset generation...");
        const result = await generateSpriteSheetAndMetadata(spriteConfig, globalStyle, envConfig, setLoadingMessage);
        setGeneratedAssets(result);
        setLoadingMessage("Generating new ideas for your next project...");
        generateRandomPrompts(globalStyle.artStyle).then(setNextProjectPrompts).catch(console.error);
    } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const handleNewProject = () => {
    setIsStyleLocked(false);
    setGeneratedAssets(null);
    if (nextProjectPrompts) {
      setGlobalStyle({
        artStyle: nextProjectPrompts.artStyle,
        resolution: nextProjectPrompts.resolution,
        perspective: nextProjectPrompts.perspective as PerspectiveType,
      });
      setSpriteConfig(prev => ({...prev, description: nextProjectPrompts.description }));
      setEnvConfig(prev => ({
        ...prev,
        tilesetFloorPrompt: nextProjectPrompts.tilesetFloorPrompt,
        tilesetWallPrompt: nextProjectPrompts.tilesetWallPrompt,
        tilesetPickupPrompt: nextProjectPrompts.tilesetPickupPrompt,
        backgroundPrompt: nextProjectPrompts.backgroundPrompt,
      }));
    } else {
      setGlobalStyle(initialGlobalStyle);
      setSpriteConfig(initialSpriteConfig);
      setEnvConfig(initialEnvConfig);
    }
  };

  const handleMetadataUpdate = (newFrameWidth: number, newFrameHeight: number) => {
    if (!generatedAssets || !generatedAssets.spriteSheetMetadata) return;
    const newMetadata = rebuildSpriteMetadata(
        generatedAssets.spriteSheetMetadata,
        newFrameWidth,
        newFrameHeight
    );
    setGeneratedAssets(prev => prev ? { ...prev, spriteSheetMetadata: newMetadata } : null);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <header className="bg-gray-800/30 border-b border-gray-700 p-4 sticky top-0 z-10 backdrop-blur-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-center">PixelForge AI: Game Asset Generator</h1>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-5 gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto">
        <div className="md:col-span-2 flex flex-col gap-6">
            <GlobalSettings globalStyle={globalStyle} setGlobalStyle={setGlobalStyle} isStyleLocked={isStyleLocked} onNewProject={handleNewProject} />
            <SpriteGenerator spriteConfig={spriteConfig} setSpriteConfig={setSpriteConfig} />
            <EnvironmentGenerator envConfig={envConfig} setEnvConfig={setEnvConfig} />
             <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-wait text-white font-bold py-4 px-4 rounded-lg transition-colors text-xl shadow-lg sticky bottom-4"
            >
                {isLoading ? loadingMessage || 'Generating...' : 'Generate Assets'}
            </button>
        </div>
        <div className="md:col-span-3 bg-gray-800/50 rounded-lg border border-gray-700 p-4 md:p-6 min-h-[50vh] md:sticky md:top-24 self-start">
            <AssetPreview assets={generatedAssets} isLoading={isLoading} loadingMessage={loadingMessage} error={error} onMetadataUpdate={handleMetadataUpdate}/>
        </div>
      </main>
    </div>
  );
}

export default App;