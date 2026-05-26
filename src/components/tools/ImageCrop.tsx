import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Crop as CropIcon, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface ImageCropResult {
  dataUrl: string;
  blob: Blob;
}

interface ImageCropProps {
  onAssign?: (result: ImageCropResult) => void;
}

type CropMode = 'free' | '16:9';
type DownloadFormat = 'jpeg' | 'png';

export default function ImageCrop({ onAssign }: ImageCropProps) {
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [mode, setMode] = useState<CropMode>('free');
  const [isDrawing, setIsDrawing] = useState(false);
  const [freePath, setFreePath] = useState<{ x: number; y: number }[]>([]);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectCurrent, setRectCurrent] = useState<{ x: number; y: number } | null>(null);
  const [cropResult, setCropResult] = useState<ImageCropResult | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('jpeg');
  const [isAssigning, setIsAssigning] = useState(false);
  const [scale, setScale] = useState(1);

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInfoRef = useRef({ x: 0, y: 0, w: 0, h: 0, imgW: 0, imgH: 0 });
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const CANVAS_SIZE = 400;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const pr = parent.getBoundingClientRect();
      const tw = 480, th = 600;
      const sx = (pr.width - 24) / tw;
      const sy = (pr.height - 24) / th;
      setScale(Math.max(0.3, Math.min(Math.min(sx, sy), 1)));
    };
    const obs = new ResizeObserver(updateScale);
    if (containerRef.current.parentElement) obs.observe(containerRef.current.parentElement);
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => { obs.disconnect(); window.removeEventListener('resize', updateScale); };
  }, []);

  useEffect(() => {
    if (!image || !imageCanvasRef.current) return;
    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      imgElementRef.current = img;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const imgAspect = img.width / img.height;
      let dw, dh, dx, dy;
      if (imgAspect > 1) {
        dw = CANVAS_SIZE;
        dh = CANVAS_SIZE / imgAspect;
        dx = 0;
        dy = (CANVAS_SIZE - dh) / 2;
      } else {
        dh = CANVAS_SIZE;
        dw = CANVAS_SIZE * imgAspect;
        dx = (CANVAS_SIZE - dw) / 2;
        dy = 0;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      imageInfoRef.current = { x: dx, y: dy, w: dw, h: dh, imgW: img.width, imgH: img.height };
    };
    img.src = image.url;
  }, [image]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (CANVAS_SIZE / r.width),
      y: (e.clientY - r.top) * (CANVAS_SIZE / r.height),
    };
  }, []);

  const canvasToImage = useCallback((cx: number, cy: number) => {
    const info = imageInfoRef.current;
    return {
      x: ((cx - info.x) / info.w) * info.imgW,
      y: ((cy - info.y) / info.h) * info.imgH,
    };
  }, []);

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (mode === 'free' && freePath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(freePath[0].x, freePath[0].y);
      for (let i = 1; i < freePath.length; i++) {
        ctx.lineTo(freePath[i].x, freePath[i].y);
      }
      if (!isDrawing && freePath.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fill();
      }
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (!isDrawing && freePath.length > 2) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(freePath[0].x, freePath[0].y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(freePath[freePath.length - 1].x, freePath[freePath.length - 1].y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (mode === '16:9' && rectStart && rectCurrent) {
      let x = Math.min(rectStart.x, rectCurrent.x);
      let y = Math.min(rectStart.y, rectCurrent.y);
      let w = Math.abs(rectCurrent.x - rectStart.x);
      let h = Math.abs(rectCurrent.y - rectStart.y);

      const aspect = 16 / 9;
      if (w / h > aspect) h = w / aspect;
      else w = h * aspect;

      if (rectCurrent.x < rectStart.x) x = rectStart.x - w;
      if (rectCurrent.y < rectStart.y) y = rectStart.y - h;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('16:9', x + 8, y + 22);
    }

    if (mode === '16:9' && rect && !isDrawing) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('16:9', rect.x + 8, rect.y + 22);
    }
  }, [mode, freePath, isDrawing, rectStart, rectCurrent, rect]);

  useEffect(() => { drawOverlay(); }, [drawOverlay]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const pos = getCanvasPos(e);
    setIsDrawing(true);
    if (mode === 'free') {
      setFreePath([pos]);
      setCropResult(null);
    } else {
      setRectStart(pos);
      setRectCurrent(pos);
      setRect(null);
      setCropResult(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !image) return;
    const pos = getCanvasPos(e);
    if (mode === 'free') {
      setFreePath(prev => [...prev, pos]);
    } else {
      setRectCurrent(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (mode === '16:9' && rectStart && rectCurrent) {
      let x = Math.min(rectStart.x, rectCurrent.x);
      let y = Math.min(rectStart.y, rectCurrent.y);
      let w = Math.abs(rectCurrent.x - rectStart.x);
      let h = Math.abs(rectCurrent.y - rectStart.y);
      const aspect = 16 / 9;
      if (w / h > aspect) h = w / aspect;
      else w = h * aspect;
      if (rectCurrent.x < rectStart.x) x = rectStart.x - w;
      if (rectCurrent.y < rectStart.y) y = rectStart.y - h;
      if (w > 5 && h > 5) setRect({ x, y, w, h });
    }
  };

  const resetDrawing = () => {
    setFreePath([]);
    setRect(null);
    setRectStart(null);
    setRectCurrent(null);
    setCropResult(null);
    const canvas = overlayCanvasRef.current;
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetDrawing();
    const reader = new FileReader();
    reader.onload = () => {
      setImage({ url: reader.result as string, file });
    };
    reader.readAsDataURL(file);
  };

  const performCrop = () => {
    const img = imgElementRef.current;
    if (!img) return;

    if (mode === 'free' && freePath.length > 3) {
      const closedPath = [...freePath];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of closedPath) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const tl = canvasToImage(minX, minY);
      const br = canvasToImage(maxX, maxY);
      const cropX = Math.max(0, Math.round(tl.x));
      const cropY = Math.max(0, Math.round(tl.y));
      const cropW = Math.min(img.width - cropX, Math.round(br.x - tl.x));
      const cropH = Math.min(img.height - cropY, Math.round(br.y - tl.y));
      if (cropW <= 0 || cropH <= 0) return;

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = cropW;
      resultCanvas.height = cropH;
      const rctx = resultCanvas.getContext('2d')!;
      rctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const pathImageCoords = closedPath.map(p => canvasToImage(p.x, p.y));
      rctx.beginPath();
      rctx.moveTo(pathImageCoords[0].x - cropX, pathImageCoords[0].y - cropY);
      for (let i = 1; i < pathImageCoords.length; i++) {
        rctx.lineTo(pathImageCoords[i].x - cropX, pathImageCoords[i].y - cropY);
      }
      rctx.closePath();
      rctx.globalCompositeOperation = 'destination-in';
      rctx.fill();
      rctx.globalCompositeOperation = 'source-over';

      resultCanvas.toBlob((blob) => {
        if (!blob) return;
        setCropResult({ dataUrl: resultCanvas.toDataURL(), blob });
      }, 'image/png');
    } else if (mode === '16:9' && rect) {
      const tl = canvasToImage(rect.x, rect.y);
      const br = canvasToImage(rect.x + rect.w, rect.y + rect.h);
      const cropX = Math.max(0, Math.round(tl.x));
      const cropY = Math.max(0, Math.round(tl.y));
      const cropW = Math.min(img.width - cropX, Math.round(br.x - tl.x));
      const cropH = Math.min(img.height - cropY, Math.round(br.y - tl.y));
      if (cropW <= 0 || cropH <= 0) return;

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = cropW;
      resultCanvas.height = cropH;
      const rctx = resultCanvas.getContext('2d')!;
      rctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      resultCanvas.toBlob((blob) => {
        if (!blob) return;
        setCropResult({ dataUrl: resultCanvas.toDataURL(), blob });
      }, 'image/png');
    }
  };

  const handleDownload = () => {
    if (!cropResult) return;
    const mimeType = downloadFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = downloadFormat === 'jpeg' ? 'jpg' : 'png';
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      c.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cropped_image.${ext}`;
        link.click();
      }, mimeType, 0.92);
    };
    img.src = cropResult.dataUrl;
  };

  const handleAssign = () => {
    if (!cropResult || !onAssign) return;
    setIsAssigning(true);
    try { onAssign(cropResult); }
    catch (err) { console.error('Assign error:', err); }
    finally { setIsAssigning(false); }
  };

  const isSelectionValid = mode === 'free' ? freePath.length > 3 : rect !== null && rect.w > 5 && rect.h > 5;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        ref={containerRef}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: '480px', height: '600px', flexShrink: 0 }}
        className="flex flex-col bg-white p-4"
      >
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-4 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer flex flex-col items-center justify-center industrial-shadow"
            style={{ borderRadius: '12px' }}
          >
            <Upload className="w-20 h-20 text-slate-300 mb-4" />
            <p className="font-black uppercase tracking-widest text-slate-400 text-2xl text-center">Upload Image</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Single image only</p>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
          </div>
        ) : (
          <div className="flex flex-col h-full gap-3">
            <div className="relative flex-1 flex items-center justify-center bg-slate-50 industrial-shadow min-h-0" style={{ borderRadius: '12px' }}>
              <div className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
                <canvas
                  ref={imageCanvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="absolute inset-0"
                />
                <canvas
                  ref={overlayCanvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="absolute inset-0 cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 z-10 bg-white/90 border-2 border-slate-300 px-3 py-1 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all industrial-shadow"
                  style={{ borderRadius: '8px' }}
                >
                  Change
                </button>
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('free'); resetDrawing(); }}
                  className={`flex-1 py-3 font-black uppercase text-sm tracking-widest transition-all industrial-shadow ${mode === 'free' ? 'bg-midnight-ink text-white' : 'bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  style={{ borderRadius: '12px' }}
                >
                  Custom Shape
                </button>
                <button
                  onClick={() => { setMode('16:9'); resetDrawing(); }}
                  className={`flex-1 py-3 font-black uppercase text-sm tracking-widest transition-all industrial-shadow ${mode === '16:9' ? 'bg-midnight-ink text-white' : 'bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  style={{ borderRadius: '12px' }}
                >
                  16:9
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetDrawing}
                  className="flex-1 py-3 border-2 border-slate-300 font-black uppercase text-sm tracking-widest hover:bg-slate-50 transition-all industrial-shadow"
                  style={{ borderRadius: '12px' }}
                >
                  Reset
                </button>
                <button
                  onClick={performCrop}
                  disabled={!isSelectionValid}
                  className="flex-[2] py-3 bg-midnight-ink text-white font-black uppercase tracking-widest text-sm industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                  style={{ borderRadius: '12px' }}
                >
                  <CropIcon className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                  Crop
                </button>
              </div>

              <div className="flex items-center gap-2 border-t-2 border-slate-200 pt-3">
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
                  disabled={!cropResult}
                  className="px-3 py-3 border-2 border-slate-300 font-black uppercase text-xs tracking-widest bg-white disabled:opacity-30 industrial-shadow"
                  style={{ borderRadius: '12px' }}
                >
                  <option value="jpeg">JPG</option>
                  <option value="png">PNG</option>
                </select>
                <button
                  onClick={handleDownload}
                  disabled={!cropResult}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-black uppercase tracking-widest text-sm industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                  style={{ borderRadius: '12px' }}
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                {onAssign && (
                  <button
                    onClick={handleAssign}
                    disabled={!cropResult || isAssigning}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-sm industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                    style={{ borderRadius: '12px' }}
                  >
                    <LinkIcon className="w-4 h-4" /> Assign
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
