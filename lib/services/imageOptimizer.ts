/**
 * Client-Side Image Optimizer
 * Strict Requirement: Convert to JPG, resize appropriately, compress to target < 50 KB.
 * Returns Base64 Data URL, Blob, original KB, compressed KB, and reduction percentage.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  blob: Blob;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatioPercent: number;
  width: number;
  height: number;
}

export async function optimizeImageFile(
  file: File,
  targetMaxKb: number = 50,
  maxDimension: number = 1000
): Promise<OptimizedImageResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to obtain 2D canvas context'));
          return;
        }

        // Fill white background in case source had alpha/transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Binary search / iterative quality adjustment to hit < targetMaxKb (default 50 KB)
        let minQuality = 0.2;
        let maxQuality = 0.88;
        let bestDataUrl = '';
        let bestBlob: Blob | null = null;
        let bestSizeKb = Infinity;

        // Try standard target quality first
        for (let q = 0.8; q >= 0.2; q -= 0.15) {
          const testDataUrl = canvas.toDataURL('image/jpeg', q);
          // Estimate byte size from base64 length
          const estimatedBytes = Math.round((testDataUrl.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
          const kb = Math.round(estimatedBytes / 1024);

          bestDataUrl = testDataUrl;
          bestSizeKb = kb;

          if (kb <= targetMaxKb) {
            break;
          }
        }

        canvas.toBlob(
          (blob) => {
            const finalBlob = blob || new Blob([], { type: 'image/jpeg' });
            const compressedSizeKb = Math.round(finalBlob.size / 1024);
            const savedBytes = Math.max(0, originalSizeKb - compressedSizeKb);
            const compressionRatioPercent = originalSizeKb > 0 ? Math.round((savedBytes / originalSizeKb) * 100) : 0;

            resolve({
              dataUrl: bestDataUrl,
              blob: finalBlob,
              originalSizeKb,
              compressedSizeKb,
              compressionRatioPercent,
              width,
              height,
            });
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
