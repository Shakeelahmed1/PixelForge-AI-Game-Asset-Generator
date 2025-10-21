// FIX: Removed self-import of LoopType which caused a name conflict.

export type LoopType = 'loop' | 'once' | 'pingpong';
export type PerspectiveType = 'side-scroller' | 'platformer' | 'isometric' | 'fps';


export interface GlobalStyle {
  artStyle: string;
  resolution: string;
  perspective: PerspectiveType;
}

export interface EnvironmentConfig {
  tilesetFloorPrompt: string;
  tilesetWallPrompt: string;
  tilesetPickupPrompt: string;
  backgroundPrompt: string;
  generateParallax: boolean;
  animateBackground: boolean;
  backgroundAnimationFrames: number;
}

export interface AnimationConfig {
  id: string;
  name: string;
  frames: number;
  loop: LoopType;
  transitionTo?: string;
}

export interface SpriteConfig {
  description: string;
  animations: AnimationConfig[];
  isModular: boolean;
  isVector: boolean;
}

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteAnimationMetadata {
  animationName: string;
  frames: SpriteFrame[];
  loop: LoopType;
  transitionTo?: string;
  frameWidth: number;
  frameHeight: number;
}

export interface GeneratedAssets {
  spriteSheetImage?: string; // base64
  spriteSheetMetadata?: SpriteAnimationMetadata[];
  bodyPartsImage?: string; // base64
  tilesetImage: string; // base64
  backgroundImages: {
    background?: string; // base64
    midground?: string; // base64
    foreground?: string; // base64
  };
  animatedBackgroundSheet?: string; // base64
  animatedBackgroundMetadata?: SpriteAnimationMetadata;
}

export interface RandomPrompts {
  description: string;
  tilesetFloorPrompt: string;
  tilesetWallPrompt: string;
  tilesetPickupPrompt: string;
  backgroundPrompt: string;
  artStyle: string;
  resolution: string;
  perspective: PerspectiveType;
}