import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { GeneratedAssets, SpriteAnimationMetadata, SpriteFrame, SpriteConfig, GlobalStyle, EnvironmentConfig, RandomPrompts, PerspectiveType } from '../types';

// Add a delay helper function and a constant for the delay duration.
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const API_CALL_DELAY = 12000; // 12 seconds to stay under a 5 RPM limit.

// Helper to get Gemini AI client instance
const getAi = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper function to generate an image from a prompt (and optional base image)
const generateImage = async (prompt: string, baseImage?: string): Promise<string> => {
    const ai = getAi();
    const parts: any[] = [{ text: prompt }];
    if (baseImage) {
        parts.unshift({
            inlineData: { data: baseImage, mimeType: 'image/png' }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
            return firstPart.inlineData.data;
        }
        throw new Error('Image generation failed or returned no data.');
    } catch (error) {
        console.error('Error generating image with Gemini:', error);
        const errorMessage = (error as any).message || JSON.stringify(error) || 'An unknown error occurred during image generation.';
        throw new Error(`Gemini API Error: ${errorMessage}`);
    }
};

// Helper to parse resolution string like "64x64 sprites"
export const parseResolution = (resolution: string): { width: number, height: number } => {
    const match = resolution.match(/(\d+)x(\d+)/);
    if (match) {
        return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
    }
    console.warn(`Could not parse resolution string: "${resolution}". Falling back to 64x64.`);
    return { width: 64, height: 64 };
};

// Builds the deterministic metadata for the sprite sheet
const buildSpriteMetadata = (spriteConfig: SpriteConfig, globalStyle: GlobalStyle): SpriteAnimationMetadata[] => {
    const { width: frameWidth, height: frameHeight } = parseResolution(globalStyle.resolution);
    return spriteConfig.animations.map((anim, rowIndex) => {
        const frames: SpriteFrame[] = [];
        for (let i = 0; i < anim.frames; i++) {
            frames.push({
                x: i * frameWidth, y: rowIndex * frameHeight, width: frameWidth, height: frameHeight
            });
        }
        return {
            animationName: anim.name, frames, loop: anim.loop, transitionTo: anim.transitionTo, frameWidth, frameHeight
        };
    });
};

// The main function to orchestrate asset generation
export const generateSpriteSheetAndMetadata = async (
    spriteConfig: SpriteConfig, globalStyle: GlobalStyle, envConfig: EnvironmentConfig,
    setLoadingMessage: (message: string) => void
): Promise<GeneratedAssets> => {
    const effectiveArtStyle = `${globalStyle.artStyle}${spriteConfig.isVector ? ', clean line art, flat colors, vector illustration style, suitable for auto-tracing' : ''}`;

    let spriteSheetImage: string | undefined;
    let spriteSheetMetadata: SpriteAnimationMetadata[] | undefined;
    let bodyPartsImage: string | undefined;

    // --- Generate Character Assets First ---
    setLoadingMessage('Generating character...');
    if (spriteConfig.isModular) {
        const modularPrompt = `A single PNG image with a transparent background containing cleanly separated body parts for a 2D game character. The character is: "${spriteConfig.description}". Lay out the following parts with space between them: head, torso, upper left arm, lower left arm, left hand, upper right arm, lower right arm, right hand, upper left leg, lower left leg, left foot, upper right leg, lower right leg, right foot. Style: ${effectiveArtStyle}, ${globalStyle.resolution}, ${globalStyle.perspective}. CRITICAL: Face right.`;
        bodyPartsImage = await generateImage(modularPrompt);
    } else {
        const baseCharacterPrompt = `A single, high-quality, full-body image of a character based on this description: "${spriteConfig.description}". Neutral T-pose. Style: ${effectiveArtStyle}, ${globalStyle.resolution}, ${globalStyle.perspective}. CRITICAL: Must face right. CRITICAL: 100% transparent background, no shadows.`;
        const baseCharacterImage = await generateImage(baseCharacterPrompt);
        
        await delay(API_CALL_DELAY);

        setLoadingMessage('Animating character...');
        const { width: frameWidth, height: frameHeight } = parseResolution(globalStyle.resolution);
        const animationLayout = spriteConfig.animations.map((anim, i) => `Row ${i + 1} (${anim.name}): ${anim.frames} frames of '${anim.name}'.`).join('\n');
        const spriteSheetPrompt = `CRITICAL: Animate the character from the input image. DO NOT change it. Generate a PNG sprite sheet with a transparent background. Layout: ${spriteConfig.animations.length} rows. Frame Size: ${frameWidth}x${frameHeight}px. Each frame must be a unique, sequential step in the motion. No repeated frames. Must face right.\n${animationLayout}`;
        
        spriteSheetImage = await generateImage(spriteSheetPrompt, baseCharacterImage);
        spriteSheetMetadata = buildSpriteMetadata(spriteConfig, globalStyle);
    }

    await delay(API_CALL_DELAY);

    // --- Generate Environmental Assets Sequentially ---
    setLoadingMessage('Generating tileset...');
    const tilesetPrompt = `A seamless, tileable tileset image, organized into three logical sections based on these descriptions.
- Section 1 (Floor Tiles): ${envConfig.tilesetFloorPrompt}
- Section 2 (Wall Tiles): ${envConfig.tilesetWallPrompt}
- Section 3 (Pickup Items like coins, gems, powerups): ${envConfig.tilesetPickupPrompt}
Style: ${effectiveArtStyle}, ${globalStyle.resolution}.`;
    const tilesetImage = await generateImage(tilesetPrompt);

    const backgroundImagesResult: { [key: string]: string } = {};
    if (envConfig.generateParallax) {
        await delay(API_CALL_DELAY);
        setLoadingMessage('Generating background...');
        const bgPrompt = `A seamless, tileable background (deep, distant layer) for: "${envConfig.backgroundPrompt}". Style: ${effectiveArtStyle}.`;
        backgroundImagesResult.background = await generateImage(bgPrompt);
        
        await delay(API_CALL_DELAY);
        setLoadingMessage('Generating midground...');
        const mgPrompt = `A seamless, tileable midground (with transparency) for: "${envConfig.backgroundPrompt}". Style: ${effectiveArtStyle}.`;
        backgroundImagesResult.midground = await generateImage(mgPrompt);
        
        await delay(API_CALL_DELAY);
        setLoadingMessage('Generating foreground...');
        const fgPrompt = `A seamless, tileable foreground (close elements, significant transparency) for: "${envConfig.backgroundPrompt}". Style: ${effectiveArtStyle}.`;
        backgroundImagesResult.foreground = await generateImage(fgPrompt);

    } else if (!envConfig.animateBackground) {
        await delay(API_CALL_DELAY);
        setLoadingMessage('Generating background...');
        const singleBgPrompt = `A single, seamless, tileable background image. Description: "${envConfig.backgroundPrompt}". Style: ${effectiveArtStyle}.`;
        backgroundImagesResult.background = await generateImage(singleBgPrompt);
    }
    
    let animatedBackgroundSheet: string | undefined;
    if (envConfig.animateBackground) {
        await delay(API_CALL_DELAY);
        setLoadingMessage('Generating animated background...');
        const animBgPrompt = `A seamless, looping animated background as a horizontal sprite sheet with ${envConfig.backgroundAnimationFrames} frames. Description: "${envConfig.backgroundPrompt}". Style: ${effectiveArtStyle}.`;
        animatedBackgroundSheet = await generateImage(animBgPrompt);
    }

    let animatedBackgroundMetadata: SpriteAnimationMetadata | undefined;
    if (animatedBackgroundSheet) {
        const assumedWidth = 1920; 
        const assumedHeight = 1080;
        const frameWidth = assumedWidth / envConfig.backgroundAnimationFrames;
        animatedBackgroundMetadata = {
            animationName: 'Background',
            frames: Array.from({ length: envConfig.backgroundAnimationFrames }, (_, i) => ({
                x: i * frameWidth, y: 0, width: frameWidth, height: assumedHeight
            })),
            loop: 'loop', frameWidth, frameHeight: assumedHeight,
        };
    }

    setLoadingMessage('Finalizing assets...');
    return {
        spriteSheetImage,
        spriteSheetMetadata,
        bodyPartsImage,
        tilesetImage,
        backgroundImages: backgroundImagesResult,
        animatedBackgroundSheet,
        animatedBackgroundMetadata,
    };
};

export const generateRandomPrompts = async (artStyle: string): Promise<RandomPrompts> => {
    const ai = getAi();
    const prompt = `Based on an existing art style of "${artStyle}", generate a cohesive and creative set of prompts for a NEW 2D game. Provide a compelling character description, detailed prompts for tileset floors, walls, and pickup items, a vivid background prompt, and also suggest a new art style, resolution, and camera perspective that would fit this new theme. The perspective must be one of: 'side-scroller', 'platformer', 'isometric', 'fps'.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        tilesetFloorPrompt: { type: Type.STRING },
                        tilesetWallPrompt: { type: Type.STRING },
                        tilesetPickupPrompt: { type: Type.STRING },
                        backgroundPrompt: { type: Type.STRING },
                        artStyle: { type: Type.STRING },
                        resolution: { type: Type.STRING },
                        perspective: { type: Type.STRING, enum: ['side-scroller', 'platformer', 'isometric', 'fps'] },
                    },
                    required: ['description', 'tilesetFloorPrompt', 'tilesetWallPrompt', 'tilesetPickupPrompt', 'backgroundPrompt', 'artStyle', 'resolution', 'perspective'],
                },
            },
        });
        return JSON.parse(response.text.trim()) as RandomPrompts;
    } catch (error) {
        console.error('Error generating random prompts:', error);
        return {
            description: "A cheerful robot made of polished chrome, with a single, expressive blue eye.",
            tilesetFloorPrompt: "Clean, white futuristic laboratory tiles with glowing blue data conduits.",
            tilesetWallPrompt: "Metallic silver wall panels with occasional warning signs and computer consoles.",
            tilesetPickupPrompt: "Glowing blue energy cells, shiny golden cogs, and small red health packs.",
            backgroundPrompt: "A sprawling, utopian sci-fi city under a bright, clear sky, with flying vehicles zipping between towering skyscrapers.",
            artStyle: "Modern vector art, clean lines, bright and optimistic sci-fi",
            resolution: "128x128 sprites",
            perspective: "platformer"
        };
    }
};