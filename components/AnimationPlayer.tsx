
import React, { useState, useEffect, useRef } from 'react';
import type { SpriteAnimationMetadata } from '../types';

interface AnimationPlayerProps {
  croppedSpriteSheetUrl: string;
  animation: SpriteAnimationMetadata;
  isPlaying: boolean;
  fps: number;
  className?: string;
  zoom?: number;
  onTransition?: (nextAnimationName: string) => void;
}

export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  croppedSpriteSheetUrl,
  animation,
  isPlaying,
  fps,
  className = 'w-20 h-20',
  zoom = 3,
  onTransition,
}) => {
    const [frameIndex, setFrameIndex] = useState(0);
    const directionRef = useRef<'forward' | 'backward'>('forward');

    useEffect(() => {
        setFrameIndex(0); // Reset on animation change
    }, [animation]);

    useEffect(() => {
        if (!isPlaying || !animation.frames || animation.frames.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            setFrameIndex(currentFrame => {
                switch (animation.loop) {
                    // Fix: Added logic to handle animation transitions.
                    case 'once': {
                        const isLastFrame = currentFrame >= animation.frames.length - 1;
                        if (isLastFrame && animation.transitionTo && onTransition) {
                            onTransition(animation.transitionTo);
                        }
                        return Math.min(currentFrame + 1, animation.frames.length - 1);
                    }
                    
                    case 'pingpong':
                        if (directionRef.current === 'forward') {
                            if (currentFrame >= animation.frames.length - 1) {
                                directionRef.current = 'backward';
                                return currentFrame - 1;
                            }
                            return currentFrame + 1;
                        } else { // backward
                            if (currentFrame <= 0) {
                                directionRef.current = 'forward';
                                return currentFrame + 1;
                            }
                            return currentFrame - 1;
                        }

                    case 'loop':
                    default:
                        return (currentFrame + 1) % animation.frames.length;
                }
            });
        }, 1000 / fps);
        
        // Fix: Added onTransition to dependency array.
        return () => clearInterval(interval);
    }, [animation, isPlaying, fps, onTransition]);

    if (!animation.frames || animation.frames.length === 0 || !croppedSpriteSheetUrl) {
        return <div className={`flex items-center justify-center bg-gray-800 rounded-md ${className}`}><span className="text-gray-500 text-xs">...</span></div>;
    }
    
    const currentFrameData = animation.frames[frameIndex];
    if (!currentFrameData) return null; // Should not happen with current logic

    const frameWidth = animation.frameWidth;
    const frameHeight = animation.frameHeight;

    const style: React.CSSProperties = {
        width: `${frameWidth * zoom}px`,
        height: `${frameHeight * zoom}px`,
        backgroundImage: `url(${croppedSpriteSheetUrl})`,
        backgroundPosition: `-${frameIndex * (frameWidth * zoom)}px 0px`,
        backgroundSize: `${animation.frames.length * frameWidth * zoom}px ${frameHeight * zoom}px`,
        imageRendering: 'pixelated',
    };

    return (
      <div className={`overflow-hidden relative ${className}`} style={{ width: `${frameWidth * zoom}px`, height: `${frameHeight * zoom}px` }}>
          <div style={style}></div>
      </div>
    );
};
