import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Download, RotateCcw, Link as LinkIcon, Image as ImageIcon, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { motion, AnimatePresence } from 'motion/react';

interface ConversionResult {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string; // Since we convert images to PDF, the image itself is a good preview
}

export default function ImageToPdf() {
  const [images, setImages] = useState<{ id: string, name: string, url: string, file: File }[]>([]);
  const [mode, setMode] = useState<'single' | 'separate'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Basic fallback or alert for unsupported types in pdf-lib
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
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
            blob: new Blob([pdfBytes], { type: 'application/pdf' }),
            previewUrl: img.url
          });
        }
        setResults(newResults);
      }
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Error generating PDF. Please ensure all images are JPG or PNG.');
    } finally {
      setIsProcessing(false);
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

  const assignToReservation = () => {
    const targets = results.filter(r => selectedResultIds.includes(r.id));
    if (targets.length === 0) return;
    alert(`Logic to assign ${targets.length} selected PDF(s) to a reservation.`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-body">
      {results.length === 0 ? (
        <>
          {/* Upload Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-4 border-dashed border-midnight-ink/20 bg-muted-cream hover:bg-muted-mint transition-all p-12 flex flex-col items-center justify-center cursor-pointer industrial-shadow"
          >
            <ImageIcon className="w-16 h-16 text-midnight-ink/40 mb-4" />
            <p className="font-black uppercase tracking-[0.2em] text-midnight-ink">Drop images here or click to upload</p>
            <p className="text-[10px] uppercase tracking-widest text-midnight-ink/40 mt-2">Supports JPG, PNG (pdf-lib restricted)</p>
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              multiple 
              accept="image/jpeg,image/png" 
              onChange={handleFileUpload} 
            />
          </div>

          {/* Mode Selector */}
          {images.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-6 p-6 bg-white industrial-shadow">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-midnight-ink/40">Conversion Output Mode</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('single')}
                    className={`flex-1 py-4 font-black uppercase text-xs tracking-widest transition-all ${mode === 'single' ? 'bg-midnight-ink text-white' : 'bg-muted-cream hover:bg-slate-100'}`}
                  >
                    ONE PDF FOR ALL
                  </button>
                  <button 
                    onClick={() => setMode('separate')}
                    className={`flex-1 py-4 font-black uppercase text-xs tracking-widest transition-all ${mode === 'separate' ? 'bg-midnight-ink text-white' : 'bg-muted-cream hover:bg-slate-100'}`}
                  >
                    SEPARATE PDFS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview List */}
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              >
                {images.map((img) => (
                  <motion.div 
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative aspect-square industrial-shadow border-2 border-midnight-ink group"
                  >
                    <img src={img.url} alt="To convert" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-midnight-ink/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      <p className="text-[10px] text-white font-bold truncate uppercase">{img.name}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={convertImages}
            disabled={images.length === 0 || isProcessing}
            className="w-full py-6 bg-midnight-ink text-white font-black uppercase tracking-[0.3em] industrial-shadow hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
          >
            {isProcessing ? 'PROCESSING...' : 'CONVERT TO PDF'}
          </button>
        </>
      ) : (
        <>
          <div className="section-header-rule">
            <div className="section-header-content">
              <FileText className="w-6 h-6 text-midnight-ink" />
              <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Generated Results ({selectedResultIds.length}/{results.length} Selected)</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {results.map((res) => (
              <motion.div 
                key={res.id}
                onClick={() => toggleResultSelection(res.id)}
                className={`relative aspect-[3/4] industrial-shadow border-2 cursor-pointer transition-all ${selectedResultIds.includes(res.id) ? 'border-primary ring-4 ring-primary/20 scale-105' : 'border-midnight-ink'}`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <div className={`w-6 h-6 flex items-center justify-center industrial-shadow ${selectedResultIds.includes(res.id) ? 'bg-primary text-white' : 'bg-white border-2 border-midnight-ink text-transparent'}`}>
                    <Check size={16} />
                  </div>
                </div>
                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4">
                  <div className="relative w-full flex-1 overflow-hidden industrial-shadow border border-midnight-ink">
                    <img src={res.previewUrl} className="w-full h-full object-cover opacity-60" alt="Preview"/>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-midnight-ink" />
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase text-midnight-ink text-center truncate w-full">{res.name}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t-4 border-midnight-ink pt-8">
            <button 
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-midnight-ink font-black uppercase text-xs tracking-widest hover:bg-muted-cream transition-all"
            >
              <RotateCcw className="w-4 h-4" /> RESET TOOL
            </button>
            <button 
              onClick={assignToReservation}
              disabled={selectedResultIds.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-midnight-ink font-black uppercase text-xs tracking-widest hover:bg-warm-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <LinkIcon className="w-4 h-4" /> ASSIGN SELECTED
            </button>
            <button 
              onClick={handleDownload}
              disabled={selectedResultIds.length === 0}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:grayscale disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" /> DOWNLOAD SELECTED ({selectedResultIds.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}
