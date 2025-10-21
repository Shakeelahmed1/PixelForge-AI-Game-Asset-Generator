
import React from 'react';
import type { SpriteConfig, AnimationConfig } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SpriteGeneratorProps {
  spriteConfig: SpriteConfig;
  setSpriteConfig: React.Dispatch<React.SetStateAction<SpriteConfig>>;
}

const SpriteGenerator: React.FC<SpriteGeneratorProps> = ({ spriteConfig, setSpriteConfig }) => {
  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    setSpriteConfig(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleAnimationChange = (id: string, field: 'name' | 'frames' | 'loop' | 'transitionTo', value: string | number | undefined) => {
    const finalValue = field === 'transitionTo' && value === '' ? undefined : value;
    setSpriteConfig(prev => ({
      ...prev,
      animations: prev.animations.map(anim =>
        anim.id === id ? { ...anim, [field]: finalValue } : anim
      ),
    }));
  };

  const addAnimation = () => {
    const newAnimation: AnimationConfig = {
      id: Date.now().toString(), name: 'New Animation', frames: 8, loop: 'loop', transitionTo: undefined,
    };
    setSpriteConfig(prev => ({
      ...prev,
      animations: [...prev.animations, newAnimation],
    }));
  };

  const removeAnimation = (id: string) => {
    setSpriteConfig(prev => ({
      ...prev,
      animations: prev.animations.filter(anim => anim.id !== id),
    }));
  };
  
  const autoAddAnimations = () => {
    const existingNames = new Set(spriteConfig.animations.map(a => a.name.toLowerCase()));
    const toAdd = ['Attack', 'Hurt', 'Die'];
    const newAnimations: AnimationConfig[] = toAdd
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({
            id: `${Date.now()}-${name}`, name: name, frames: 8, loop: 'once' as const, transitionTo: name !== 'Die' ? 'Idle' : undefined,
        }));

    if (newAnimations.length > 0) {
        setSpriteConfig(prev => ({ ...prev, animations: [...prev.animations, ...newAnimations] }));
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Sprite Character</h2>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Character Description</label>
        <textarea
          id="description" name="description" rows={3}
          value={spriteConfig.description} onChange={handleConfigChange}
          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., A brave knight with a shiny sword..."
        />
      </div>
      <div className="flex justify-between items-center mt-4 gap-4">
        <div className="flex items-center">
            <input id="isModular" name="isModular" type="checkbox"
                   checked={spriteConfig.isModular} onChange={handleConfigChange}
                   className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
            />
            <label htmlFor="isModular" className="ml-2 block text-sm text-gray-300">Generate Modular Body Parts</label>
        </div>
        <div className="flex items-center">
            <input id="isVector" name="isVector" type="checkbox"
                   checked={spriteConfig.isVector} onChange={handleConfigChange}
                   className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
            />
            <label htmlFor="isVector" className="ml-2 block text-sm text-gray-300">Generate as clean vector-style art</label>
        </div>
      </div>
      <div className={`mt-4 transition-opacity ${spriteConfig.isModular ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-200">Animations</h3>
            <div className="flex gap-2">
                <button onClick={autoAddAnimations} className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 text-gray-200 px-3 py-1.5 rounded-md transition-colors">Add Common</button>
                <button onClick={addAnimation} className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"><PlusIcon /> Add New</button>
            </div>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {spriteConfig.animations.map((anim) => (
            <div key={anim.id} className="grid grid-cols-[1fr_auto_auto_1fr_auto] items-center gap-2 p-2 bg-gray-900/50 rounded-md">
              <input type="text" value={anim.name} onChange={(e) => handleAnimationChange(anim.id, 'name', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-blue-500 text-sm" />
              <input type="number" value={anim.frames} onChange={(e) => handleAnimationChange(anim.id, 'frames', parseInt(e.target.value, 10))} className="w-20 bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-blue-500 text-sm" />
              <select value={anim.loop} onChange={(e) => handleAnimationChange(anim.id, 'loop', e.target.value)} className="w-32 bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-blue-500 text-sm">
                <option value="loop">Loop</option>
                <option value="once">Play Once</option>
                <option value="pingpong">Ping Pong</option>
              </select>
               <select value={anim.transitionTo || ''} onChange={(e) => handleAnimationChange(anim.id, 'transitionTo', e.target.value)} disabled={anim.loop !== 'once'} title={anim.loop !== 'once' ? "Only available for 'Play Once' animations" : "On Finish: Transition To"} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-blue-500 text-sm disabled:opacity-50">
                <option value="">On Finish: None</option>
                {spriteConfig.animations.filter(a => a.id !== anim.id).map(a => (<option key={a.id} value={a.name}>On Finish: {a.name}</option>))}
              </select>
              <button onClick={() => removeAnimation(anim.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded-md transition-colors" title="Remove Animation"><TrashIcon /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpriteGenerator;