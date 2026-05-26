import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Download, RotateCcw, Link as LinkIcon, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'motion/react';
import { useStatus } from '../../contexts/StatusContext';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface ConversionResult {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string;
}

interface PageInfo {
  id: string;
  pageIndex: number;
  previewUrl: string;
  selected: boolean;
}

const convertToPngBytes = (dataUrl: string): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');
      const base64 = pngDataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      resolve(bytes);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

interface ImageToPdfProps {
  onAssign?: (pdfs: ConversionResult[]) => void;
}

export default function ImageToPdf({ onAssign }: ImageToPdfProps) {
  const { setStatus } = useStatus();
  const [toolMode, setToolMode] = useState<'merge' | 'split'>('merge');
  const [images, setImages] = useState<{ id: string, name: string, url: string, file: File }[]>([]);
  const [mode, setMode] = useState<'single' | 'separate'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [scale, setScale] = useState(1);
  const [isSimulatingConversion, setIsSimulatingConversion] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split mode state
  const [splitFile, setSplitFile] = useState<{ id: string; name: string; url: string; file: File } | null>(null);
  const [splitPages, setSplitPages] = useState<PageInfo[]>([]);
  const [splitResultType, setSplitResultType] = useState<'pdf' | 'images'>('pdf');
  const [splitPdfMode, setSplitPdfMode] = useState<'one' | 'separate'>('one');
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const targetWidth = 600;
      const targetHeight = 800;
      const scaleX = (parentRect.width - 24) / targetWidth;
      const scaleY = (parentRect.height - 24) / targetHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(Math.max(0.3, Math.min(newScale, 1)));
    };
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current.parentElement) observer.observe(containerRef.current.parentElement);
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url: reader.result as string,
          file: file
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSplitFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const item = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        url: reader.result as string,
        file,
      };
      setSplitFile(item);
      setIsLoadingPages(true);
      try {
        const pages = await extractPdfPages(file);
        setSplitPages(pages.map(p => ({ ...p, selected: true })));
      } catch {
        setStatus('Failed to read PDF pages.', 'error');
      } finally {
        setIsLoadingPages(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const extractPdfPages = async (file: File): Promise<Omit<PageInfo, 'selected'>[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
    const pages: Omit<PageInfo, 'selected'>[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      pages.push({
        id: `page-${i}`,
        pageIndex: i,
        previewUrl: canvas.toDataURL('image/png'),
      });
    }
    return pages;
  };

  const renderPageToImage = async (file: File, pageIndex: number, scale: number = 2): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdfDoc.getPage(pageIndex);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'));
  };

  const toggleSplitPage = (id: string) => {
    setSplitPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const simulateProgress = () => new Promise<void>(resolve => {
    const duration = 1000;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(timer); return 100; }
        return prev + step;
      });
    }, interval);
    setTimeout(() => { clearInterval(timer); resolve(); }, duration);
  });

  const convertImages = async () => {
    if (images.length === 0) return;
    setIsSimulatingConversion(true);
    setProgress(0);
    await simulateProgress();
    setIsProcessing(true);
    setResults([]);
    setSelectedResultIds([]);

    const embedImage = async (pdfDoc: PDFDocument, file: File, dataUrl: string) => {
      const bytes = await file.arrayBuffer();
      let embedded;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        embedded = await pdfDoc.embedJpg(bytes);
      } else if (file.type === 'image/png') {
        embedded = await pdfDoc.embedPng(bytes);
      } else {
        const pngBytes = await convertToPngBytes(dataUrl);
        embedded = await pdfDoc.embedPng(pngBytes);
      }
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const s = Math.min(width / embedded.width, height / embedded.height) * 0.97;
      page.drawImage(embedded, {
        x: (width - embedded.width * s) / 2,
        y: (height - embedded.height * s) / 2,
        width: embedded.width * s,
        height: embedded.height * s,
      });
    };

    const embedPdf = async (pdfDoc: PDFDocument, file: File) => {
      const bytes = await file.arrayBuffer();
      const existing = await PDFDocument.load(bytes);
      const pages = await pdfDoc.copyPages(existing, existing.getPageIndices());
      pages.forEach(p => pdfDoc.addPage(p));
    };

    try {
      if (mode === 'single') {
        const pdfDoc = await PDFDocument.create();
        let previewUrl = '';
        for (const item of images) {
          if (item.file.type.startsWith('image/')) {
            await embedImage(pdfDoc, item.file, item.url);
          } else {
            await embedPdf(pdfDoc, item.file);
          }
          if (!previewUrl) previewUrl = item.url;
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
        setResults([{
          id: 'single-result',
          name: 'converted_images.pdf',
          blob,
          previewUrl,
        }]);
      } else {
        const newResults: ConversionResult[] = [];
        for (const item of images) {
          const pdfDoc = await PDFDocument.create();
          if (item.file.type.startsWith('image/')) {
            await embedImage(pdfDoc, item.file, item.url);
          } else {
            await embedPdf(pdfDoc, item.file);
          }
          const pdfBytes = await pdfDoc.save();
          newResults.push({
            id: item.id,
            name: `${item.name.split('.')[0]}.pdf`,
            blob: new Blob([pdfBytes.buffer], { type: 'application/pdf' }),
            previewUrl: item.url,
          });
        }
        setResults(newResults);
      }
    } catch (error) {
      console.error('PDF Generation failed', error);
      setStatus('Error generating PDF. Please ensure all files are valid images or PDFs.', 'error');
    } finally {
      setIsProcessing(false);
      setIsSimulatingConversion(false);
      setProgress(0);
    }
  };

  const downloadSplitPages = async () => {
    const selected = splitPages.filter(p => p.selected);
    if (selected.length === 0 || !splitFile) return;
    setIsProcessing(true);
    try {
      if (splitResultType === 'pdf') {
        const arrayBuffer = await splitFile.file.arrayBuffer();
        const existing = await PDFDocument.load(arrayBuffer);
        if (splitPdfMode === 'one') {
          const pdfDoc = await PDFDocument.create();
          const indices = selected.map(p => p.pageIndex - 1);
          const pages = await pdfDoc.copyPages(existing, indices);
          pages.forEach(p => pdfDoc.addPage(p));
          const bytes = await pdfDoc.save();
          const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `split_${splitFile.name.replace(/\.[^.]+$/, '')}_pages.pdf`;
          link.click();
        } else {
          for (const p of selected) {
            const pdfDoc = await PDFDocument.create();
            const [page] = await pdfDoc.copyPages(existing, [p.pageIndex - 1]);
            pdfDoc.addPage(page);
            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `page_${p.pageIndex}.pdf`;
            link.click();
          }
        }
      } else {
        for (const p of selected) {
          const blob = await renderPageToImage(splitFile.file, p.pageIndex, 2);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `page_${p.pageIndex}.png`;
          link.click();
        }
      }
    } catch {
      setStatus('Error exporting pages.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (toolMode === 'split') {
      downloadSplitPages();
      return;
    }
    const targets = results.filter(r => selectedResultIds.includes(r.id));
    if (targets.length === 0) return;
    targets.forEach(res => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(res.blob);
      link.download = res.name;
      link.click();
    });
  };

  const toggleResultSelection = (id: string) => {
    setSelectedResultIds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setImages([]);
    setResults([]);
    setSelectedResultIds([]);
    setMode('single');
    setSplitFile(null);
    setSplitPages([]);
    setSplitResultType('pdf');
    setSplitPdfMode('one');
  };

  const assignToReservation = async () => {
    const targets = results.filter(r => selectedResultIds.includes(r.id));
    if (targets.length === 0 || !onAssign) return;
    setIsAssigning(true);
    try {
      await onAssign(targets);
      setSelectedResultIds([]);
    } catch (err) {
      console.error('Error assigning document:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const SegmentedBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-4 font-black uppercase text-sm tracking-widest transition-all ${active ? 'bg-midnight-ink text-white' : 'bg-white hover:bg-slate-100 text-slate-600'}`}
      style={{ borderRadius: '12px' }}
    >
      {label}
    </button>
  );

  const renderMergeUi = () => (
    <>
      {results.length === 0 ? (
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          {images.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full border-4 border-dashed border-midnight-ink/20 bg-white hover:bg-ink/5 transition-all p-8 flex flex-col items-center justify-center cursor-pointer industrial-shadow"
              style={{ borderRadius: '12px' }}
            >
              <div className="bg-slate-50 w-full h-full flex flex-col items-center justify-center p-12 border-2 border-midnight-ink/10" style={{ borderRadius: '12px' }}>
                <Upload className="w-24 h-24 text-midnight-ink/40 mb-6" />
                <p className="font-black uppercase tracking-[0.4em] text-midnight-ink text-4xl text-center leading-relaxed">
                  DROP IMAGES HERE
                </p>
                <p className="text-sm uppercase tracking-[0.2em] text-midnight-ink/40 mt-4 text-center font-bold">
                  Support for all images and PDFs
                </p>
              </div>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {images.length > 0 && (
            <div className="p-4 bg-white industrial-shadow shrink-0" style={{ borderRadius: '12px' }}>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-midnight-ink/40">Actions</label>
                <div className="flex gap-3">
                  <SegmentedBtn active={mode === 'single'} onClick={() => setMode('single')} label="Merge into One PDF" />
                  <SegmentedBtn active={mode === 'separate'} onClick={() => setMode('separate')} label="Separate PDFs" />
                </div>
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {images.map((img) => (
                    <motion.div
                      key={img.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative aspect-square industrial-shadow border-2 border-midnight-ink group overflow-hidden"
                      style={{ borderRadius: '12px' }}
                    >
                      {img.file.type.startsWith('image/') ? (
                        <img src={img.url || undefined} alt={img.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center">
                          <FileText className="w-10 h-10 text-slate-400" />
                          <span className="mt-1 text-[8px] font-bold uppercase text-slate-400 text-center truncate px-1 leading-tight">{img.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 shadow-lg hover:scale-110 transition-transform"
                        style={{ borderRadius: '12px' }}
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                  <motion.div
                    layout
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-square bg-slate-50 border-2 border-dashed border-midnight-ink/20 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors industrial-shadow"
                    style={{ borderRadius: '12px' }}
                  >
                    <Upload className="w-8 h-8 text-midnight-ink/20" />
                    <span className="text-xs font-black uppercase tracking-widest text-midnight-ink/40 mt-2">+ Add</span>
                    <input
                      type="file"
                      hidden
                      ref={fileInputRef}
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {images.length > 0 && (
            <div className="flex gap-3 shrink-0">
              <button
                onClick={reset}
                className="flex-1 py-5 border-2 border-midnight-ink font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all text-base"
                style={{ borderRadius: '12px' }}
              >
                Start Over
              </button>
              <button
                onClick={convertImages}
                disabled={images.length === 0 || isProcessing}
                className="flex-[2] py-5 bg-midnight-ink text-white font-black uppercase tracking-[0.3em] industrial-shadow hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale text-base"
                style={{ borderRadius: '12px' }}
              >
                {isProcessing ? 'Processing...' : 'Convert'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          <div className="section-header-rule shrink-0">
            <div className="section-header-content">
              <FileText className="w-6 h-6 text-midnight-ink" />
              <h3 className="text-2xl font-black text-midnight-ink uppercase tracking-[0.2em]">Conversion Results ({selectedResultIds.length}/{results.length})</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
            <div className="grid grid-cols-3 gap-4">
              {results.map((res) => (
                <motion.div
                  key={res.id}
                  onClick={() => toggleResultSelection(res.id)}
                  className={`relative aspect-[3/4] industrial-shadow border-2 cursor-pointer transition-all overflow-hidden ${selectedResultIds.includes(res.id) ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-midnight-ink'}`}
                  style={{ borderRadius: '12px' }}
                >
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <div
                      className={`w-6 h-6 flex items-center justify-center industrial-shadow ${selectedResultIds.includes(res.id) ? 'bg-primary text-white' : 'bg-white border-2 border-midnight-ink text-transparent'}`}
                      style={{ borderRadius: '12px' }}
                    >
                      <Check size={14} />
                    </div>
                  </div>
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-2">
                    <div className="relative w-full flex-1 overflow-hidden industrial-shadow border border-midnight-ink flex items-center justify-center" style={{ borderRadius: '12px' }}>
                      {res.previewUrl && res.previewUrl.startsWith('data:image/') ? (
                        <img src={res.previewUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                      ) : (
                        <FileText className="w-14 h-14 text-midnight-ink/40" />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-black uppercase text-midnight-ink text-center truncate w-full">{res.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-midnight-ink pt-4 shrink-0">
            {onAssign ? (
              <button
                onClick={assignToReservation}
                disabled={selectedResultIds.length === 0 || isAssigning}
                className="w-full flex items-center justify-center gap-2 px-4 py-5 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:grayscale disabled:cursor-not-allowed text-base font-bold"
                style={{ borderRadius: '12px' }}
              >
                {isAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
                Assign ({selectedResultIds.length})
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-5 border-2 border-midnight-ink font-black uppercase text-base tracking-widest hover:bg-ink/5 transition-all font-bold"
                  style={{ borderRadius: '12px' }}
                >
                  <RotateCcw className="w-5 h-5" /> Reset
                </button>
                <button
                  onClick={handleDownload}
                  disabled={selectedResultIds.length === 0}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-5 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:grayscale disabled:cursor-not-allowed text-base font-bold"
                  style={{ borderRadius: '12px' }}
                >
                  <Download className="w-5 h-5" /> Download Selected ({selectedResultIds.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const renderSplitUi = () => (
    <div className="flex flex-col gap-4 overflow-hidden h-full">
      {!splitFile ? (
        <div
          onClick={() => document.getElementById('split-pdf-input')?.click()}
          className="w-full h-full border-4 border-dashed border-midnight-ink/20 bg-white hover:bg-ink/5 transition-all p-8 flex flex-col items-center justify-center cursor-pointer industrial-shadow"
          style={{ borderRadius: '12px' }}
        >
          <div className="bg-slate-50 w-full h-full flex flex-col items-center justify-center p-12 border-2 border-midnight-ink/10" style={{ borderRadius: '12px' }}>
            <FileText className="w-24 h-24 text-midnight-ink/40 mb-6" />
            <p className="font-black uppercase tracking-[0.4em] text-midnight-ink text-3xl text-center leading-relaxed">
              UPLOAD A PDF FILE
            </p>
            <p className="text-sm uppercase tracking-[0.2em] text-midnight-ink/40 mt-4 text-center font-bold">
              Select a PDF to split into separate pages
            </p>
          </div>
          <input
            id="split-pdf-input"
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleSplitFileUpload}
          />
        </div>
      ) : isLoadingPages ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-midnight-ink animate-spin" />
            <p className="font-black uppercase tracking-[0.2em] text-midnight-ink">Reading pages...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 shrink-0">
            <FileText className="w-5 h-5 text-midnight-ink" />
            <span className="text-xs font-black uppercase tracking-widest text-midnight-ink/60">
              {splitFile.name} &mdash; {splitPages.length} pages
            </span>
            <button
              onClick={reset}
              className="ml-auto text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-midnight-ink hover:bg-slate-50 transition-all"
              style={{ borderRadius: '12px' }}
            >
              Start Over
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
            <div className="grid grid-cols-3 gap-3">
              {splitPages.map((p) => (
                <div
                  key={p.id}
                  onClick={() => toggleSplitPage(p.id)}
                  className={`relative aspect-[3/4] industrial-shadow border-2 cursor-pointer transition-all overflow-hidden ${p.selected ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-midnight-ink opacity-70 hover:opacity-100'}`}
                  style={{ borderRadius: '12px' }}
                >
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <div
                      className={`w-6 h-6 flex items-center justify-center industrial-shadow ${p.selected ? 'bg-primary text-white' : 'bg-white border-2 border-midnight-ink text-transparent'}`}
                      style={{ borderRadius: '12px' }}
                    >
                      <Check size={14} />
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 z-10">
                    <span className="text-[10px] font-black bg-white/90 border border-midnight-ink px-2 py-0.5 industrial-shadow">
                      {p.pageIndex}
                    </span>
                  </div>
                  <img
                    src={p.previewUrl}
                    alt={`Page ${p.pageIndex}`}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-midnight-ink pt-4 shrink-0">
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-midnight-ink/40 shrink-0">Result Type</label>
              <div className="flex gap-2 flex-1">
                <SegmentedBtn active={splitResultType === 'pdf'} onClick={() => setSplitResultType('pdf')} label="PDF" />
                <SegmentedBtn active={splitResultType === 'images'} onClick={() => setSplitResultType('images')} label="Images" />
              </div>
            </div>
            {splitResultType === 'pdf' && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-black uppercase tracking-widest text-midnight-ink/40 shrink-0">PDF Mode</label>
                <div className="flex gap-2 flex-1">
                  <SegmentedBtn active={splitPdfMode === 'one'} onClick={() => setSplitPdfMode('one')} label="One File" />
                  <SegmentedBtn active={splitPdfMode === 'separate'} onClick={() => setSplitPdfMode('separate')} label="Separate Files" />
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-5 border-2 border-midnight-ink font-black uppercase text-base tracking-widest hover:bg-slate-50 transition-all font-bold"
                style={{ borderRadius: '12px' }}
              >
                <RotateCcw className="w-5 h-5" /> Reset
              </button>
              <button
                onClick={handleDownload}
                disabled={splitPages.filter(p => p.selected).length === 0 || isProcessing}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-5 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:grayscale disabled:cursor-not-allowed text-base font-bold"
                style={{ borderRadius: '12px' }}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Download Selected ({splitPages.filter(p => p.selected).length})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '600px',
          height: '800px',
          flexShrink: 0
        }}
        className={`space-y-4 font-body flex flex-col p-4 bg-white transition-all ${isSimulatingConversion ? 'blur-md pointer-events-none' : ''}`}
      >
        <div className="p-1 bg-white industrial-shadow shrink-0" style={{ borderRadius: '12px' }}>
          <div className="flex gap-1">
            <SegmentedBtn active={toolMode === 'merge'} onClick={() => { reset(); setToolMode('merge'); }} label="Merge PDF" />
            <SegmentedBtn active={toolMode === 'split'} onClick={() => { reset(); setToolMode('split'); }} label="Split PDF" />
          </div>
        </div>

        {toolMode === 'merge' ? renderMergeUi() : renderSplitUi()}
      </div>

      <AnimatePresence>
        {(isSimulatingConversion || isLoadingPages) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1100] flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-md"
          >
            <div className="w-full max-w-[300px] space-y-6 text-center">
              <Loader2 className="w-16 h-16 text-midnight-ink animate-spin mx-auto" />
              <h3 className="font-black uppercase tracking-[0.3em] text-midnight-ink text-xl">{isLoadingPages ? 'Reading PDF...' : 'Converting...'}</h3>

              <div className="w-full h-4 bg-slate-200 border-2 border-midnight-ink industrial-shadow overflow-hidden" style={{ borderRadius: '12px' }}>
                <motion.div
                  className="h-full bg-midnight-ink"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="font-black text-midnight-ink text-sm uppercase tracking-widest">{Math.round(progress)}%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
