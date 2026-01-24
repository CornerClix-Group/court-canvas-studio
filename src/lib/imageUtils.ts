// Image compression and annotation flattening utilities

export interface AnnotationElement {
  type: 'line' | 'measurement' | 'arrow' | 'text' | 'rectangle';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  lineWidth?: number;
  text?: string;
  value?: string;
  fontSize?: number;
}

export interface AnnotationsData {
  version: number;
  elements: AnnotationElement[];
}

/**
 * Compress an image file to a maximum width while maintaining aspect ratio
 */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Draw an arrow on canvas
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number
) {
  const headLength = 15;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a measurement line with label
 */
function drawMeasurement(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  value: string,
  color: string,
  lineWidth: number
) {
  const endCapLength = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const perpAngle = angle + Math.PI / 2;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Draw main line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw end caps
  ctx.beginPath();
  ctx.moveTo(
    x1 + endCapLength * Math.cos(perpAngle),
    y1 + endCapLength * Math.sin(perpAngle)
  );
  ctx.lineTo(
    x1 - endCapLength * Math.cos(perpAngle),
    y1 - endCapLength * Math.sin(perpAngle)
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    x2 + endCapLength * Math.cos(perpAngle),
    y2 + endCapLength * Math.sin(perpAngle)
  );
  ctx.lineTo(
    x2 - endCapLength * Math.cos(perpAngle),
    y2 - endCapLength * Math.sin(perpAngle)
  );
  ctx.stroke();

  // Draw label with background
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const fontSize = 14;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const textMetrics = ctx.measureText(value);
  const padding = 4;

  // Background
  ctx.fillStyle = 'white';
  ctx.fillRect(
    midX - textMetrics.width / 2 - padding,
    midY - fontSize / 2 - padding,
    textMetrics.width + padding * 2,
    fontSize + padding * 2
  );

  // Text
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, midX, midY);
}

/**
 * Render annotations onto a canvas
 */
export function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationsData,
  scale: number = 1
) {
  annotations.elements.forEach((el) => {
    const lineWidth = (el.lineWidth || 2) * scale;

    switch (el.type) {
      case 'line':
        if (el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(el.x1 * scale, el.y1 * scale);
          ctx.lineTo(el.x2 * scale, el.y2 * scale);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
          drawArrow(ctx, el.x1 * scale, el.y1 * scale, el.x2 * scale, el.y2 * scale, el.color, lineWidth);
        }
        break;

      case 'measurement':
        if (el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
          drawMeasurement(
            ctx,
            el.x1 * scale,
            el.y1 * scale,
            el.x2 * scale,
            el.y2 * scale,
            el.value || '',
            el.color,
            lineWidth
          );
        }
        break;

      case 'text':
        if (el.x !== undefined && el.y !== undefined && el.text) {
          const fontSize = (el.fontSize || 16) * scale;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = el.color;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          // Draw text with outline for visibility
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3 * scale;
          ctx.strokeText(el.text, el.x * scale, el.y * scale);
          ctx.fillText(el.text, el.x * scale, el.y * scale);
        }
        break;

      case 'rectangle':
        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = lineWidth;
          ctx.strokeRect(el.x * scale, el.y * scale, el.width * scale, el.height * scale);
        }
        break;
    }
  });
}

/**
 * Flatten annotations onto an image and return as a Blob
 */
export async function flattenAnnotatedImage(
  imageUrl: string,
  annotations: AnnotationsData | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Overlay annotations
      if (annotations && annotations.elements.length > 0) {
        renderAnnotations(ctx, annotations);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}
