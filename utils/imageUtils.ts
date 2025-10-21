import type { SpriteAnimationMetadata } from '../types';
import JSZip from 'jszip';

/**
 * Crops a large sprite sheet to extract a single animation's row of frames.
 * @param base64SpriteSheet The full sprite sheet as a base64 data URL.
 * @param animation The metadata for the animation to extract.
 * @returns A promise that resolves to a new base64 data URL of the cropped image.
 */
export const cropSpriteSheetForAnimation = (base64SpriteSheet: string, animation: SpriteAnimationMetadata): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!animation.frames || animation.frames.length === 0) return reject(new Error("Animation has no frames."));
      
      const firstFrame = animation.frames[0];
      const cropWidth = animation.frames.length * animation.frameWidth;
      const cropHeight = animation.frameHeight;
      
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Could not get canvas context."));
      
      ctx.drawImage(img, firstFrame.x, firstFrame.y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(new Error(`Failed to load image for cropping: ${err}`));
    img.src = base64SpriteSheet;
  });
};

/**
 * Analyzes a sprite sheet to automatically detect the grid size of the first sprite.
 */
export const detectSpriteGrid = (imageUrl: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject("Canvas context not found");
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const { data, width, height } = imageData;

            let firstPixel = { x: -1, y: -1 };
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (data[(y * width + x) * 4 + 3] > 0) { // Check alpha channel
                        firstPixel = { x, y };
                        break;
                    }
                }
                if (firstPixel.x !== -1) break;
            }

            if (firstPixel.x === -1) return reject("Could not find any non-transparent pixels.");

            let frameWidth = 0;
            for (let x = firstPixel.x; x < width; x++) {
                let columnIsTransparent = true;
                for (let y = firstPixel.y; y < height; y++) {
                    if (data[(y * width + x) * 4 + 3] > 0) {
                        columnIsTransparent = false;
                        break;
                    }
                }
                if (columnIsTransparent) break;
                frameWidth++;
            }

            let frameHeight = 0;
            for (let y = firstPixel.y; y < height; y++) {
                let rowIsTransparent = true;
                for (let x = firstPixel.x; x < firstPixel.x + frameWidth; x++) {
                    if (data[(y * width + x) * 4 + 3] > 0) {
                        rowIsTransparent = false;
                        break;
                    }
                }
                if (rowIsTransparent) break;
                frameHeight++;
            }
            
            if (frameWidth === 0 || frameHeight === 0) return reject("Detected a zero-sized frame.");
            resolve({ width: frameWidth, height: frameHeight });
        };
        img.onerror = () => reject("Failed to load image for grid detection.");
        img.src = imageUrl;
    });
};

/**
 * Finds all separate body parts on a sheet, crops them, and downloads them as a ZIP.
 */
export const zipAndDownloadParts = async (imageUrl: string) => {
    const zip = new JSZip();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context failed");

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = imageUrl;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const { data, width, height } = imageData;
    const visited = new Uint8Array(width * height);
    let partIndex = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (data[index * 4 + 3] > 0 && !visited[index]) {
                partIndex++;
                const bounds = { minX: x, minY: y, maxX: x, maxY: y };
                const stack = [{ x, y }];
                visited[index] = 1;

                while (stack.length > 0) {
                    const p = stack.pop()!;
                    bounds.minX = Math.min(bounds.minX, p.x);
                    bounds.maxX = Math.max(bounds.maxX, p.x);
                    bounds.minY = Math.min(bounds.minY, p.y);
                    bounds.maxY = Math.max(bounds.maxY, p.y);

                    [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx, dy]) => {
                        const nx = p.x + dx, ny = p.y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = ny * width + nx;
                            if (data[nIndex * 4 + 3] > 0 && !visited[nIndex]) {
                                visited[nIndex] = 1;
                                stack.push({ x: nx, y: ny });
                            }
                        }
                    });
                }
                
                const partWidth = bounds.maxX - bounds.minX + 1;
                const partHeight = bounds.maxY - bounds.minY + 1;
                const partCanvas = document.createElement('canvas');
                partCanvas.width = partWidth;
                partCanvas.height = partHeight;
                const partCtx = partCanvas.getContext('2d');
                if (partCtx) {
                    partCtx.drawImage(canvas, bounds.minX, bounds.minY, partWidth, partHeight, 0, 0, partWidth, partHeight);
                    const blob = await new Promise<Blob | null>(res => partCanvas.toBlob(res));
                    if (blob) zip.file(`part_${partIndex}.png`, blob);
                }
            }
        }
    }
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "body_parts.zip";
    link.click();
    URL.revokeObjectURL(link.href);
};