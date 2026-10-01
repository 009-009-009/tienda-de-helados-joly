// Utilidad para auto-recortar y centrar imágenes de helados con espacios vacíos a la derecha

const cropCache = new Map<string, string>();

export function autoCenterAndCropImage(
  imageSrc: string,
  onProcessed: (processedSrc: string) => void
): () => void {
  // Si ya fue procesada, retornar desde caché
  if (cropCache.has(imageSrc)) {
    onProcessed(cropCache.get(imageSrc)!);
    return () => {};
  }

  let isCancelled = false;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    if (isCancelled) return;

    try {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      if (!naturalWidth || !naturalHeight) {
        onProcessed(imageSrc);
        return;
      }

      // Crear canvas para analizar los píxeles
      const canvas = document.createElement('canvas');
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        onProcessed(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);
      const data = imgData.data;

      // Paso 1: Comprobar si la imagen usa canal alfa (transparencia)
      let hasTransparency = false;
      const sampleStep = Math.max(1, Math.floor((naturalWidth * naturalHeight) / 5000));
      for (let i = 3; i < data.length; i += 4 * sampleStep) {
        if (data[i] < 30) {
          hasTransparency = true;
          break;
        }
      }

      let minX = naturalWidth;
      let minY = naturalHeight;
      let maxX = 0;
      let maxY = 0;
      let hasContent = false;

      // Paso 2: Detectar los límites del contenido real (paleta + sabor)
      for (let y = 0; y < naturalHeight; y++) {
        for (let x = 0; x < naturalWidth; x++) {
          const idx = (y * naturalWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          let isBackground = false;
          if (hasTransparency) {
            // En imágenes transparentes, el fondo es el canal alfa bajo
            // (evita borrar helados blancos como Paleta Crema)
            isBackground = a < 25;
          } else {
            // En imágenes opacas, el fondo es blanco
            isBackground = r > 242 && g > 242 && b > 242;
          }

          if (!isBackground) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Si no detectó contenido o ya está centrado
      if (!hasContent || maxX <= minX || maxY <= minY) {
        cropCache.set(imageSrc, imageSrc);
        onProcessed(imageSrc);
        return;
      }

      // Ancho y alto del contenido real (paleta + texto de sabor)
      const contentWidth = maxX - minX + 1;
      const contentHeight = maxY - minY + 1;

      // Si el contenido ocupa casi toda la imagen horizontalmente (más del 85%), no necesita recorte drástico
      const horizontalCoverage = contentWidth / naturalWidth;
      if (horizontalCoverage > 0.85 && minX < 20) {
        cropCache.set(imageSrc, imageSrc);
        onProcessed(imageSrc);
        return;
      }

      // Crear un nuevo canvas con margen cómodo alrededor del contenido centrado
      const paddingX = Math.round(contentWidth * 0.08);
      const paddingY = Math.round(contentHeight * 0.06);

      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = contentWidth + paddingX * 2;
      targetCanvas.height = contentHeight + paddingY * 2;
      const targetCtx = targetCanvas.getContext('2d');

      if (!targetCtx) {
        onProcessed(imageSrc);
        return;
      }

      // Dibujar solo la porción de la paleta y su texto centrada
      targetCtx.drawImage(
        canvas,
        minX,
        minY,
        contentWidth,
        contentHeight,
        paddingX,
        paddingY,
        contentWidth,
        contentHeight
      );

      const croppedDataUrl = targetCanvas.toDataURL('image/png');
      cropCache.set(imageSrc, croppedDataUrl);
      onProcessed(croppedDataUrl);
    } catch (e) {
      console.warn('Auto-center fallback to original image', e);
      onProcessed(imageSrc);
    }
  };

  img.onerror = () => {
    if (!isCancelled) onProcessed(imageSrc);
  };

  img.src = imageSrc;

  return () => {
    isCancelled = true;
  };
}
