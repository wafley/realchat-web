import { useState, useRef, useEffect, useCallback, type PointerEvent, type TouchEvent } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import Modal from '@/components/ui/modal';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
  aspectRatio?: number; // default 1 (square)
  outputWidth?: number; // default 512
  outputHeight?: number; // default 512
}

export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  outputWidth = 512,
  outputHeight = 512,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const viewportSize = 256; // 256x256 px crop box in UI

  // Reset offset and zoom when new image opens
  useEffect(() => {
    if (open && imageSrc) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(false);

      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImgLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [open, imageSrc]);

  // Pointer drag handling
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!imgLoaded) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  // Touch drag handling
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!imgLoaded || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    offsetStartRef.current = { ...offset };
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = useCallback(() => {
    if (!imgRef.current || !imgLoaded) return;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate base scale to fit container viewportSize
    const baseScale = Math.max(viewportSize / img.naturalWidth, viewportSize / img.naturalHeight);
    const displayedW = img.naturalWidth * baseScale * zoom;
    const displayedH = img.naturalHeight * baseScale * zoom;

    // Calculate crop rectangle on displayed image
    // Center of viewport is (viewportSize / 2, viewportSize / 2)
    // Image top-left in viewport coords is (viewportSize/2 - displayedW/2 + offset.x, viewportSize/2 - displayedH/2 + offset.y)
    const imgLeft = viewportSize / 2 - displayedW / 2 + offset.x;
    const imgTop = viewportSize / 2 - displayedH / 2 + offset.y;

    // Map viewport crop box (0..viewportSize) to original image pixels
    const srcX = Math.max(0, (0 - imgLeft) / (baseScale * zoom));
    const srcY = Math.max(0, (0 - imgTop) / (baseScale * zoom));
    const srcW = viewportSize / (baseScale * zoom);
    const srcH = viewportSize / (baseScale * zoom);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
        const croppedPreviewUrl = URL.createObjectURL(blob);
        onCropComplete(croppedFile, croppedPreviewUrl);
        onClose();
      },
      'image/jpeg',
      0.92,
    );
  }, [imgLoaded, zoom, offset, viewportSize, outputWidth, outputHeight, onCropComplete, onClose]);

  if (!open || !imageSrc) return null;

  // Base scale calculation for display
  const baseScale = imgSize.width && imgSize.height
    ? Math.max(viewportSize / imgSize.width, viewportSize / imgSize.height)
    : 1;
  const currentWidth = imgSize.width * baseScale * zoom;
  const currentHeight = imgSize.height * baseScale * zoom;

  return (
    <Modal open={open} onClose={onClose} title="Crop Profile Photo">
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-muted-foreground">Drag photo to adjust position and use slider to zoom</p>

        {/* Viewport Box */}
        <div
          className="relative flex h-64 w-64 select-none items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-black/40 shadow-inner cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imgLoaded && (
            <img
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                width: `${currentWidth}px`,
                height: `${currentHeight}px`,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              className="pointer-events-none transition-transform duration-75"
            />
          )}

          {/* Circle Overlay Grid */}
          <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
        </div>

        {/* Zoom Controls */}
        <div className="flex w-full items-center justify-center gap-3 px-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={0.8}
            max={3.0}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="h-1.5 w-44 cursor-pointer accent-accent"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
            title="Reset"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex w-full justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Check size={16} />
            Crop & Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
