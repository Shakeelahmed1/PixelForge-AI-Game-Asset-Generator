
import type { SpriteAnimationMetadata, SpriteFrame } from '../types';

/**
 * Recalculates the frames for a list of animations based on new frame dimensions.
 * @param currentMetadata The existing animation metadata array.
 * @param newFrameWidth The new width for each frame.
 * @param newFrameHeight The new height for each frame.
 * @returns A new array of SpriteAnimationMetadata with updated frame data.
 */
export const rebuildSpriteMetadata = (
  currentMetadata: SpriteAnimationMetadata[],
  newFrameWidth: number,
  newFrameHeight: number
): SpriteAnimationMetadata[] => {
  return currentMetadata.map((anim, rowIndex) => {
    const newFrames: SpriteFrame[] = anim.frames.map((_, frameIndex) => ({
      x: frameIndex * newFrameWidth,
      y: rowIndex * newFrameHeight,
      width: newFrameWidth,
      height: newFrameHeight,
    }));

    return {
      ...anim,
      frameWidth: newFrameWidth,
      frameHeight: newFrameHeight,
      frames: newFrames,
    };
  });
};
