import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Crop as CropIcon, Link as LinkIcon } from 'lucide-react';

interface ImageCropResult {
  dataUrl: string;
  blob: Blob;
}

interface ImageCropProps {
  onAssign?: (result: ImageCropResult) => void;
}

type CropMode = 'free' | '16:9';
type DownloadFormat = 'jpeg' | 'png';
type InteractionState = 'idle' | 'drawing' | 'adjust';

export default function ImageCrop({ onAssign }: ImageCropProps) {
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [mode, setMode] = useState<CropMode>('16:9');
  const [interaction, setInteraction] = useState<InteractionState>('idle');
  const [freePath, setFreePath] = useState<{ x: number; y: number }[]>([]);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectCurrent, setRectCurrent] = useState<{ x: number; y: number } | null>(null);
  const [cropResult, setCropResult] = useState<ImageCropResult | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('jpeg');
  const [isAssigning, setIsAssigning] = useState(false);
  const [scale, setScale] = useState(1);
  const [cursor, setCursor] = useState('crosshair');

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInfoRef = useRef({ x: 0, y: 0, w: 0, h: 0, imgW: 0, imgH: 0 });
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const dragOp = useRef<{
    type: 'move' | 'resize';
    handleIdx: number;
    startX: number;
    startY: number;
    initialPath?: { x: number; y: number }[];
    initialRect?: { x: number; y: number; w: number; h: number };
    fixedX?: number;
    fixedY?: number;
    origDist?: number;
    bbCenter?: { x: number; y: number };
  } | null>(null);

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
      const pad = 15;
      const maxW = dw - 2 * pad;
      const maxH = dh - 2 * pad;
      const aspect = 16 / 9;
      let rectW, rectH;
      if (maxW / maxH > aspect) {
        rectH = maxH;
        rectW = rectH * aspect;
      } else {
        rectW = maxW;
        rectH = rectW / aspect;
      }
      setRect({ x: dx + (dw - rectW) / 2, y: dy + (dh - rectH) / 2, w: rectW, h: rectH });
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

  const dist = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const getFreeBB = (path: { x: number; y: number }[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of path) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  const getFreeHandles = (path: { x: number; y: number }[]) => {
    const bb = getFreeBB(path);
    return [
      { x: bb.x, y: bb.y },
      { x: bb.x + bb.w, y: bb.y },
      { x: bb.x + bb.w, y: bb.y + bb.h },
      { x: bb.x, y: bb.y + bb.h },
    ];
  };

  const getRectHandles = (r: { x: number; y: number; w: number; h: number }) => [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];

  const pointInPolygon = (px: number, py: number, poly: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  };

  const pointInRect = (px: number, py: number, r: { x: number; y: number; w: number; h: number }) =>
    px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const drawHandles = (handles: { x: number; y: number }[]) => {
      for (const h of handles) {
        ctx.beginPath();
        ctx.arc(h.x, h.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    };

    const adjust = interaction === 'adjust';

    if (mode === 'free' && freePath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(freePath[0].x, freePath[0].y);
      for (let i = 1; i < freePath.length; i++)
        ctx.lineTo(freePath[i].x, freePath[i].y);
      if (!adjust) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fill();
      }
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (adjust && freePath.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
        drawHandles(getFreeHandles(freePath));
      }
      if (!adjust && freePath.length > 2) {
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

    if (mode === '16:9') {
      if (interaction === 'drawing' && rectStart && rectCurrent) {
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

      if (rect) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('16:9', rect.x + 8, rect.y + 22);
        if (adjust) drawHandles(getRectHandles(rect));
      }
    }
  }, [mode, freePath, interaction, rectStart, rectCurrent, rect]);

  useEffect(() => { drawOverlay(); }, [drawOverlay]);

  const getHandles = () => {
    if (mode === 'free') return getFreeHandles(freePath);
    if (mode === '16:9' && rect) return getRectHandles(rect);
    return [];
  };

  const clampToCanvas = (handles: { x: number; y: number }[], dx: number, dy: number) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const h of handles) {
      minX = Math.min(minX, h.x + dx);
      maxX = Math.max(maxX, h.x + dx);
      minY = Math.min(minY, h.y + dy);
      maxY = Math.max(maxY, h.y + dy);
    }
    if (minX < 0) dx += -minX;
    if (maxX > CANVAS_SIZE) dx -= maxX - CANVAS_SIZE;
    if (minY < 0) dy += -minY;
    if (maxY > CANVAS_SIZE) dy -= maxY - CANVAS_SIZE;
    return { dx, dy };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const pos = getCanvasPos(e);

    if (interaction === 'adjust') {
      const handles = getHandles();
      for (let i = 0; i < handles.length; i++) {
        if (dist(pos.x, pos.y, handles[i].x, handles[i].y) < 12) {
          const bb = mode === 'free' ? getFreeBB(freePath) : rect!;
          const oppIdx = (i + 2) % 4;
          const opp = handles[oppIdx];
          dragOp.current = {
            type: 'resize',
            handleIdx: i,
            startX: pos.x,
            startY: pos.y,
            initialPath: mode === 'free' ? [...freePath] : undefined,
            initialRect: rect ? { ...rect } : undefined,
            fixedX: opp.x,
            fixedY: opp.y,
            origDist: dist(opp.x, opp.y, handles[i].x, handles[i].y),
          };
          return;
        }
      }

      const inside = mode === 'free'
        ? pointInPolygon(pos.x, pos.y, freePath)
        : rect ? pointInRect(pos.x, pos.y, rect) : false;

      if (inside) {
        dragOp.current = {
          type: 'move',
          handleIdx: -1,
          startX: pos.x,
          startY: pos.y,
          initialPath: mode === 'free' ? [...freePath] : undefined,
          initialRect: rect ? { ...rect } : undefined,
        };
        return;
      }
      return;
    }

    if (interaction === 'idle') {
      setCropResult(null);
      setInteraction('drawing');
      if (mode === 'free') {
        setFreePath([pos]);
      } else {
        setRectStart(pos);
        setRectCurrent(pos);
        setRect(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (interaction === 'drawing') {
      if (mode === 'free') {
        setFreePath(prev => [...prev, pos]);
      } else {
        setRectCurrent(pos);
      }
      return;
    }

    if (interaction === 'adjust') {
      const op = dragOp.current;
      if (!op) {
        const handles = getHandles();
        let foundHandle = -1;
        for (let i = 0; i < handles.length; i++) {
          if (dist(pos.x, pos.y, handles[i].x, handles[i].y) < 12) { foundHandle = i; break; }
        }
        if (foundHandle >= 0) {
          const cursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
          setCursor(cursors[foundHandle]);
        } else {
          const inside = mode === 'free'
            ? pointInPolygon(pos.x, pos.y, freePath)
            : rect ? pointInRect(pos.x, pos.y, rect) : false;
          setCursor(inside ? 'grab' : 'crosshair');
        }
        return;
      }

      if (op.type === 'move') {
        const dx = pos.x - op.startX;
        const dy = pos.y - op.startY;
        if (mode === 'free' && op.initialPath) {
          const handles = getFreeHandles(op.initialPath);
          const clamped = clampToCanvas(handles, dx, dy);
          setFreePath(op.initialPath.map(p => ({
            x: p.x + clamped.dx,
            y: p.y + clamped.dy,
          })));
        } else if (mode === '16:9' && op.initialRect) {
          const handles = getRectHandles(op.initialRect);
          const clamped = clampToCanvas(handles, dx, dy);
          setRect({
            ...op.initialRect,
            x: op.initialRect.x + clamped.dx,
            y: op.initialRect.y + clamped.dy,
          });
        }
        setCursor('grabbing');
      } else if (op.type === 'resize') {
        if (mode === 'free' && op.initialPath && op.fixedX !== undefined && op.fixedY !== undefined && op.origDist && op.origDist > 0) {
          const newDist = Math.max(5, dist(op.fixedX, op.fixedY, pos.x, pos.y));
          const s = newDist / op.origDist;
          setFreePath(op.initialPath.map(p => ({
            x: op.fixedX! + (p.x - op.fixedX!) * s,
            y: op.fixedY! + (p.y - op.fixedY!) * s,
          })));
        } else if (mode === '16:9' && op.initialRect && op.fixedX !== undefined && op.fixedY !== undefined) {
          const dx = pos.x - op.fixedX;
          const dy = pos.y - op.fixedY;
          let w = Math.abs(dx), h = Math.abs(dy);
          if (w < 10) w = 10;
          if (h < 10) h = 10;
          const aspect = 16 / 9;
          if (w / h > aspect) h = w / aspect;
          else w = h * aspect;
          let x = dx > 0 ? op.fixedX : op.fixedX - w;
          let y = dy > 0 ? op.fixedY : op.fixedY - h;
          if (x < 0) x = 0;
          if (y < 0) y = 0;
          if (x + w > CANVAS_SIZE) w = CANVAS_SIZE - x;
          if (y + h > CANVAS_SIZE) h = CANVAS_SIZE - y;
          setRect({ x, y, w, h });
        }
        const cursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
        setCursor(cursors[op.handleIdx]);
      }
    }
  };

  const handleMouseUp = () => {
    if (interaction === 'drawing') {
      if (mode === 'free' && freePath.length > 3) {
        setInteraction('adjust');
      } else if (mode === '16:9' && rectStart && rectCurrent) {
        let x = Math.min(rectStart.x, rectCurrent.x);
        let y = Math.min(rectStart.y, rectCurrent.y);
        let w = Math.abs(rectCurrent.x - rectStart.x);
        let h = Math.abs(rectCurrent.y - rectStart.y);
        const aspect = 16 / 9;
        if (w / h > aspect) h = w / aspect;
        else w = h * aspect;
        if (rectCurrent.x < rectStart.x) x = rectStart.x - w;
        if (rectCurrent.y < rectStart.y) y = rectStart.y - h;
        if (w > 5 && h > 5) {
          setRect({ x, y, w, h });
          setInteraction('adjust');
        } else {
          setInteraction('idle');
        }
        setRectStart(null);
        setRectCurrent(null);
      } else {
        setInteraction('idle');
      }
    }
    if (interaction === 'adjust') {
      dragOp.current = null;
      setCursor('crosshair');
    }
  };

  const resetDrawing = () => {
    setFreePath([]);
    setRect(null);
    setRectStart(null);
    setRectCurrent(null);
    setCropResult(null);
    setInteraction('idle');
    dragOp.current = null;
    setCursor('crosshair');
    const canvas = overlayCanvasRef.current;
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetDrawing();
    setInteraction('adjust');
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
      const tl = canvasToImage(
        Math.min(...closedPath.map(p => p.x)),
        Math.min(...closedPath.map(p => p.y))
      );
      const br = canvasToImage(
        Math.max(...closedPath.map(p => p.x)),
        Math.max(...closedPath.map(p => p.y))
      );
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
      for (let i = 1; i < pathImageCoords.length; i++)
        rctx.lineTo(pathImageCoords[i].x - cropX, pathImageCoords[i].y - cropY);
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

  const isSelectionValid = mode === 'free'
    ? freePath.length > 3
    : rect !== null && rect.w > 5 && rect.h > 5;

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
                  className="absolute inset-0"
                  style={{ cursor }}
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
