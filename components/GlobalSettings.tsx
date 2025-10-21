import React from 'react';
import type { GlobalStyle, PerspectiveType } from '../types';
import { LockIcon } from './icons/LockIcon';
import { UnlockIcon } from './icons/UnlockIcon';

interface GlobalSettingsProps {
  globalStyle: GlobalStyle;
  setGlobalStyle: React.Dispatch<React.SetStateAction<GlobalStyle>>;
  isStyleLocked: boolean;
  onNewProject: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ globalStyle, setGlobalStyle, isStyleLocked, onNewProject }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGlobalStyle(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Global Project Style</h2>
        <button
          onClick={onNewProject}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors ${
            isStyleLocked
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
          }`}
        >
          {isStyleLocked ? <UnlockIcon /> : <LockIcon />}
          {isStyleLocked ? 'Unlock / New Project' : 'Style Locked on Generate'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="artStyle" className="block text-sm font-medium text-gray-400 mb-1">Art Style / Genre</label>
          <input
            type="text"
            id="artStyle"
            name="artStyle"
            value={globalStyle.artStyle}
            onChange={handleChange}
            disabled={isStyleLocked}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            placeholder="e.g., 16-bit pixel art, moody, dark fantasy"
          />
        </div>
        <div>
          <label htmlFor="resolution" className="block text-sm font-medium text-gray-400 mb-1">Asset Scale (Resolution)</label>
          <input
            type="text"
            id="resolution"
            name="resolution"
            value={globalStyle.resolution}
            onChange={handleChange}
            disabled={isStyleLocked}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            placeholder="e.g., 32x32 tiles, 64x64 sprites"
          />
        </div>
        <div>
          <label htmlFor="perspective" className="block text-sm font-medium text-gray-400 mb-1">Camera Perspective</label>
          <select
            id="perspective"
            name="perspective"
            value={globalStyle.perspective}
            onChange={handleChange}
            disabled={isStyleLocked}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="side-scroller">Strict Side-Scroller (2D)</option>
            <option value="platformer">Classic Platformer (2D)</option>
            <option value="isometric">Top-Down Isometric</option>
            <option value="fps">FPS (Hands/Weapon)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;