// cropUtils.ts — Canvas-based image cropping utilities

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generates a cropped 800×800 JPEG Blob from an image URL,
 * given the pixel crop area and rotation angle.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation: number = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Output: always 800×800
  const OUTPUT_SIZE = 800;
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Translate to center for rotation
  ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-OUTPUT_SIZE / 2, -OUTPUT_SIZE / 2);

  // Draw the cropped region scaled to 800×800
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      },
      'image/jpeg',
      0.95
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}