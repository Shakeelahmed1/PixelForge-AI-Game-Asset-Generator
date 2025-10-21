import React from 'react';
import type { EnvironmentConfig } from '../types';

interface EnvironmentGeneratorProps {
  envConfig: EnvironmentConfig;
  setEnvConfig: React.Dispatch<React.SetStateAction<EnvironmentConfig>>;
}

const EnvironmentGenerator: React.FC<EnvironmentGeneratorProps> = ({ envConfig, setEnvConfig }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumber = type === 'number';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    setEnvConfig(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : isNumber ? parseInt(value, 10) : value
    }));
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Environmental Assets</h2>
      <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Tileset Components</h3>
            <div className="space-y-3">
                 <div>
                    <label htmlFor="tilesetFloorPrompt" className="block text-sm font-medium text-gray-400 mb-1">Floors</label>
                    <textarea
                        id="tilesetFloorPrompt" name="tilesetFloorPrompt" rows={2}
                        value={envConfig.tilesetFloorPrompt} onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Wet, mossy dungeon floors, 5 variants..."
                    />
                </div>
                 <div>
                    <label htmlFor="tilesetWallPrompt" className="block text-sm font-medium text-gray-400 mb-1">Walls</label>
                    <textarea
                        id="tilesetWallPrompt" name="tilesetWallPrompt" rows={2}
                        value={envConfig.tilesetWallPrompt} onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Stone brick walls with mossy variants..."
                    />
                </div>
                 <div>
                    <label htmlFor="tilesetPickupPrompt" className="block text-sm font-medium text-gray-400 mb-1">Pickups (Items)</label>
                    <textarea
                        id="tilesetPickupPrompt" name="tilesetPickupPrompt" rows={2}
                        value={envConfig.tilesetPickupPrompt} onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Gold coins, mana potions, treasure chests..."
                    />
                </div>
            </div>
        </div>
        <div className="border-t border-gray-700 pt-4">
          <div className="grid grid-cols-2 gap-x-4 items-center mb-1">
            <label htmlFor="backgroundPrompt" className="block text-sm font-medium text-gray-400">Background Prompt</label>
            <div className="space-y-2">
                <div className="flex items-center">
                    <input id="generateParallax" name="generateParallax" type="checkbox"
                           checked={envConfig.generateParallax} onChange={handleChange}
                           className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                           disabled={envConfig.animateBackground}
                    />
                    <label htmlFor="generateParallax" className="ml-2 block text-sm text-gray-300">Parallax Layers</label>
                </div>
                <div className="flex items-center">
                    <input id="animateBackground" name="animateBackground" type="checkbox"
                           checked={envConfig.animateBackground} onChange={handleChange}
                           className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="animateBackground" className="ml-2 block text-sm text-gray-300">Animate Background</label>
                     <input type="number" name="backgroundAnimationFrames" value={envConfig.backgroundAnimationFrames}
                           onChange={handleChange} disabled={!envConfig.animateBackground}
                           className="ml-2 w-16 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm disabled:opacity-50"
                    />
                    <span className="ml-1 text-xs text-gray-400">frames</span>
                </div>
            </div>
          </div>
          <textarea
            id="backgroundPrompt" name="backgroundPrompt" rows={3}
            value={envConfig.backgroundPrompt} onChange={handleChange}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., A highly detailed, parallax-ready background..."
          />
        </div>
      </div>
    </div>
  );
};

export default EnvironmentGenerator;