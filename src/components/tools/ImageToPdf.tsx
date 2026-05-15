import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Download, RotateCcw, Link as LinkIcon, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { motion, AnimatePresence } from 'motion/react';
import { useStatus } from '../../contexts/StatusContext';
import { supabase } from '../../lib/supabase';
import { Reservation } from '../../types';

interface ConversionResult {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string;
}

interface ImageToPdfProps {
  onAssign?: (pdfs: ConversionResult[]) => void;
}

export default function ImageToPdf({ onAssign }: ImageToPdfProps) {
  const { setStatus } = useStatus();
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

  // Dynamic scaling logic
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      // Target dimensions for ImageToPdf
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

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const convertImages = async () => {
    if (images.length === 0) return;
    setIsSimulatingConversion(true);
    setProgress(0);
    
    // Simulating progress bar for 1 second
    const duration = 1000;
    const interval = 50;
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(timer);

    setIsProcessing(true);
    setResults([]);
    setSelectedResultIds([]);

    try {
      if (mode === 'single') {
        const pdfDoc = await PDFDocument.create();
        for (const img of images) {
          const imageBytes = await img.file.arrayBuffer();
          let embeddedImg;
          if (img.file.type === 'image/jpeg' || img.file.type === 'image/jpg') {
            embeddedImg = await pdfDoc.embedJpg(imageBytes);
          } else if (img.file.type === 'image/png') {
            embeddedImg = await pdfDoc.embedPng(imageBytes);
          } else {
            continue;
          }

          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();
          const scale = Math.min(width / embeddedImg.width, height / embeddedImg.height) * 0.97;
          const imgWidth = embeddedImg.width * scale;
          const imgHeight = embeddedImg.height * scale;

          page.drawImage(embeddedImg, {
            x: (width - imgWidth) / 2,
            y: (height - imgHeight) / 2,
            width: imgWidth,
            height: imgHeight,
          });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
        setResults([{
          id: 'single-result',
          name: 'converted_images.pdf',
          blob,
          previewUrl: images[0].url
        }]);
      } else {
        const newResults: ConversionResult[] = [];
        for (const img of images) {
          const pdfDoc = await PDFDocument.create();
          const imageBytes = await img.file.arrayBuffer();
          let embeddedImg;
          if (img.file.type === 'image/jpeg' || img.file.type === 'image/jpg') {
            embeddedImg = await pdfDoc.embedJpg(imageBytes);
          } else if (img.file.type === 'image/png') {
            embeddedImg = await pdfDoc.embedPng(imageBytes);
          } else {
            continue;
          }

          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();
          const scale = Math.min(width / embeddedImg.width, height / embeddedImg.height) * 0.97;
          const imgWidth = embeddedImg.width * scale;
          const imgHeight = embeddedImg.height * scale;

          page.drawImage(embeddedImg, {
            x: (width - imgWidth) / 2,
            y: (height - imgHeight) / 2,
            width: imgWidth,
            height: imgHeight,
          });

          const pdfBytes = await pdfDoc.save();
          newResults.push({
            id: img.id,
            name: `${img.name.split('.')[0]}.pdf`,
            blob: new Blob([pdfBytes.buffer], { type: 'application/pdf' }),
            previewUrl: img.url
          });
        }
        setResults(newResults);
      }
    } catch (error) {
      console.error('PDF Generation failed', error);
      setStatus('Error generating PDF. Please ensure all images are JPG or PNG.', 'error');
    } finally {
      setIsProcessing(false);
      setIsSimulatingConversion(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
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
        {results.length === 0 ? (
          <div className="flex flex-col gap-4 overflow-hidden h-full">
            {/* Upload Zone - Initial State Only */}
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
                    Support for JPG, PNG. Max 10MB per file.
                  </p>
                </div>
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  multiple 
                  accept="image/jpeg,image/png" 
                  onChange={handleFileUpload} 
                />
              </div>
            )}

            {/* Mode Selector */}
            {images.length > 0 && (
              <div className="p-4 bg-white industrial-shadow shrink-0" style={{ borderRadius: '12px' }}>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-midnight-ink/40">Actions</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setMode('single')}
                      className={`flex-1 py-4 font-black uppercase text-sm tracking-widest transition-all ${mode === 'single' ? 'bg-midnight-ink text-white' : 'bg-white hover:bg-slate-100'}`}
                      style={{ borderRadius: '12px' }}
                    >
                      Merge into One PDF
                    </button>
                    <button 
                      onClick={() => setMode('separate')}
                      className={`flex-1 py-4 font-black uppercase text-sm tracking-widest transition-all ${mode === 'separate' ? 'bg-midnight-ink text-white' : 'bg-white hover:bg-slate-100'}`}
                      style={{ borderRadius: '12px' }}
                    >
                      Separate PDFs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Image Preview List */}
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
                        <img src={img.url || undefined} alt={img.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 shadow-lg hover:scale-110 transition-transform"
                          style={{ borderRadius: '12px' }}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                    {/* Add More Files Button */}
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
                        accept="image/jpeg,image/png" 
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
                       <div className="relative w-full flex-1 overflow-hidden industrial-shadow border border-midnight-ink" style={{ borderRadius: '12px' }}>
                        <img src={res.previewUrl || undefined} className="w-full h-full object-cover opacity-60" alt="Preview"/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-midnight-ink" />
                        </div>
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
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSimulatingConversion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1100] flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-md"
          >
            <div className="w-full max-w-[300px] space-y-6 text-center">
              <Loader2 className="w-16 h-16 text-midnight-ink animate-spin mx-auto" />
              <h3 className="font-black uppercase tracking-[0.3em] text-midnight-ink text-xl">Converting...</h3>
              
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
