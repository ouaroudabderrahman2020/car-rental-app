import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import { Settings, FileText, Calendar, Gauge, Upload, Trash2, X, Check, Loader2 } from 'lucide-react';
import ImageToPdf from './tools/ImageToPdf';
import ImageCrop from './tools/ImageCrop';
import { PDFDocument } from 'pdf-lib';
import { FormattedCar, MaintenanceInterval, EssentialItem } from '../types';
import { getDriveImageUrl } from '../lib/gas';
import { FUEL_TYPES, TRANSMISSIONS } from '../constants';
import ItemSection from './ItemSection';

const colors = [
  { name: 'white', hex: '#FFFFFF', border: 'border-slate-200' },
  { name: 'black', hex: '#000000', border: 'border-black' },
  { name: 'green', hex: '#10B981', border: 'border-green-600' },
  { name: 'yellow', hex: '#FACC15', border: 'border-yellow-600' },
  { name: 'silver', hex: '#94A3B8', border: 'border-slate-400' },
  { name: 'blue', hex: '#3B82F6', border: 'border-blue-600' },
  { name: 'red', hex: '#EF4444', border: 'border-red-600' },
  { name: 'orange', hex: '#F97316', border: 'border-orange-600' },
];

const serviceOptions = [
  { key: 'engineOil', value: "Engine Oil" },
  { key: 'coolant', value: "Coolant (Antigel)" },
  { key: 'brakeFluid', value: "Brake Fluid" },
  { key: 'gearboxOil', value: "Gearbox Oil" },
  { key: 'airFilter', value: "Air Filter" },
  { key: 'fuelFilter', value: "Fuel Filter" },
  { key: 'acFilter', value: "Cabin/AC Filter" },
  { key: 'brakePads', value: "Brake Pads (Plaquettes de frein)" },
  { key: 'tires', value: "Tires" },
  { key: 'wipers', value: "Wiper Blades" },
  { key: 'timingBelt', value: "Timing Belt (Courroie)" },
  { key: 'battery', value: "Battery" },
  { key: 'sparkPlugs', value: "Spark Plugs (Bougies)" },
  { key: 'shocks', value: "Shock Absorbers" }
];

export interface CarFormHandle {
  validate: () => boolean;
}

interface CarFormProps {
  car?: Partial<FormattedCar> | null;
  onChange: (car: Partial<FormattedCar>) => void;
}

const InputField = (props: any) => {
  const { label: _, hasError, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-white border rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'} ${props.className || ''}`}
    />
  );
};

const SelectField = (props: any) => {
  const { label: _, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat ${props.className || ''}`}
    >
      {children}
    </select>
  );
};

const TextareaField = (props: any) => {
  const { label: _, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 resize-none ${props.className || ''}`}
    />
  );
};

const DocField = ({ docType, label, value, onChange, isPdf }: {
  docType: string;
  label: string;
  value?: { file_data?: string; file_name?: string; mime_type?: string; file_url?: string };
  onChange: (doc: { doc_type: string; file_data?: string; file_name?: string; mime_type?: string } | null) => void;
  isPdf?: boolean;
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileDataRef = useRef<string | null>(null);

  const isImage = docType === 'image';
  const fileSrc = previewUrl || value?.file_url || value?.file_data;

  useEffect(() => {
    if (value?.file_data && value.file_data !== fileDataRef.current) {
      fileDataRef.current = value.file_data;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const [header, base64] = value.file_data.split(',');
      if (!base64) return;
      const mimeType = header?.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      setPreviewUrl(URL.createObjectURL(new Blob([bytes], { type: mimeType })));
    }
  }, [value?.file_data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      fileDataRef.current = reader.result as string;
      onChange({
        doc_type: docType,
        file_data: reader.result as string,
        file_name: file.name,
        mime_type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    fileDataRef.current = null;
    onChange(null);
  };

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <input
        type="file"
        ref={inputRef}
        accept={isPdf ? "application/pdf" : "image/*,application/pdf"}
        className="hidden"
        onChange={handleFileChange}
      />
      {isImage ? (
        <div className="relative inline-flex max-w-56">
          <div
            onClick={() => value ? window.open(fileSrc, '_blank') : inputRef.current?.click()}
            className="inline-flex aspect-[16/9] w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            {value ? (
              <img src={getDriveImageUrl(fileSrc)} alt={value.file_name || label} className="h-full w-full object-contain" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
          {value && (
            <div className="absolute top-0 left-0 right-0 flex justify-between p-1 opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
                className="p-1 bg-white/80 rounded-full hover:bg-white shadow-sm"
                title="Replace"
              >
                <Upload className="w-3 h-3 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {value ? (
            <div className="flex items-center justify-between px-3 h-10 bg-blue-50 border border-blue-200 rounded-[12px]">
              <a
                href={fileSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[10px] font-bold text-blue-900 truncate">
                  {value.file_name || label}
                </span>
              </a>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-10 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all w-full"
            >
              <Upload className="w-3.5 h-3.5" />
              {t('clientForm.uploadFile', 'Upload')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SimpleDocSlot = ({ docType, label, value, onChange, isPdf, emptyActions }: {
  docType: string;
  label: string;
  value?: { file_data?: string; file_name?: string; mime_type?: string; file_url?: string };
  onChange: (doc: { doc_type: string; file_data?: string; file_name?: string; mime_type?: string } | null) => void;
  isPdf?: boolean;
  emptyActions?: React.ReactNode;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileDataRef = useRef<string | null>(null);

  const fileSrc = previewUrl || value?.file_url || value?.file_data;
  const hasFile = !!(previewUrl || value?.file_url || value?.file_data);

  useEffect(() => {
    if (value?.file_data && value.file_data !== fileDataRef.current) {
      fileDataRef.current = value.file_data;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const [header, base64] = value.file_data.split(',');
      if (!base64) return;
      const mimeType = header?.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      setPreviewUrl(URL.createObjectURL(new Blob([bytes], { type: mimeType })));
    }
  }, [value?.file_data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      fileDataRef.current = reader.result as string;
      onChange({
        doc_type: docType,
        file_data: reader.result as string,
        file_name: file.name,
        mime_type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    fileDataRef.current = null;
    onChange(null);
  };

  const handleClick = () => {
    if (hasFile) {
      window.open(fileSrc, '_blank');
    } else {
      inputRef.current?.click();
    }
  };

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div className="w-full h-full flex flex-col justify-center p-2">
      <input
        type="file"
        ref={inputRef}
        accept={isPdf ? "application/pdf" : "image/*,application/pdf"}
        className="hidden"
        onChange={handleFileChange}
      />
      {hasFile ? (
        <div
          className="flex items-center justify-between gap-2 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-[8px] cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={handleClick}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[10px] font-semibold text-blue-900 truncate">{value?.file_name || label}</span>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-8 px-3 bg-white border border-dashed border-slate-300 rounded-[8px] flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider hover:bg-slate-50 hover:border-blue-400 transition-all"
          >
            <Upload className="w-3 h-3" />
            {label}
          </button>
          {emptyActions}
        </div>
      )}
    </div>
  );
};

const ImageSlot = ({ value, onChange, onCropRequest }: {
  value?: { file_data?: string; file_name?: string; mime_type?: string; file_url?: string };
  onChange: (doc: { doc_type: string; file_data?: string; file_name?: string; mime_type?: string } | null) => void;
  onCropRequest: (file: File) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileDataRef = useRef<string | null>(null);
  const fileSrc = previewUrl || value?.file_url || value?.file_data;
  const hasFile = !!(previewUrl || value?.file_url || value?.file_data);

  useEffect(() => {
    if (value?.file_data && value.file_data !== fileDataRef.current) {
      fileDataRef.current = value.file_data;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const [header, base64] = value.file_data.split(',');
      if (!base64) return;
      const mimeType = header?.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      setPreviewUrl(URL.createObjectURL(new Blob([bytes], { type: mimeType })));
    }
  }, [value?.file_data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCropRequest(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) onCropRequest(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    fileDataRef.current = null;
    onChange(null);
  };

  const handleClick = () => {
    if (hasFile) {
      window.open(fileSrc, '_blank');
    } else {
      inputRef.current?.click();
    }
  };

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div
      className="relative w-full max-w-56 sm:max-w-72 md:max-w-80 aspect-[16/9] cursor-pointer border-2 border-dashed border-slate-300 rounded-[12px] overflow-hidden bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input type="file" ref={inputRef} accept="image/*" className="hidden" onClick={(e) => e.stopPropagation()} onChange={handleFileChange} />
      {hasFile ? (
        <div className="w-full h-full relative group">
          <img src={getDriveImageUrl(fileSrc)} alt={value?.file_name || 'Vehicle Image'} className="w-full h-full object-contain bg-slate-50" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-white/90 hover:bg-white text-slate-700 rounded-[6px]">Change</button>
            <button type="button" onClick={handleDelete} className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"><X className="w-3 h-3" /></button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-3 hover:bg-slate-50 transition-colors">
          <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
            <span className="text-[11px] sm:text-[13px] font-semibold text-slate-500 text-center leading-tight">Vehicle Image</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 text-center">Drag & Drop or Click</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default forwardRef<CarFormHandle, CarFormProps>(function CarForm({ car, onChange }: CarFormProps, ref) {
  const { t } = useTranslation();
  const { showToast } = useNotification();
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [selectedService, setSelectedService] = React.useState(serviceOptions[0].value);
  const [showImageToPdf, setShowImageToPdf] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);

  const handleCropRequest = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageData(reader.result as string);
      setShowCropTool(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropAssign = (result: { dataUrl: string; blob: Blob }) => {
    const reader = new FileReader();
    reader.onload = () => {
      setDoc('image', {
        file_data: reader.result as string,
        file_name: 'cropped_image.png',
        mime_type: 'image/png',
      });
      setShowCropTool(false);
      setCropImageData(null);
    };
    reader.readAsDataURL(result.blob);
  };

  const handleImageToPdfAssign = async (pdfs: { id: string; name: string; blob: Blob; previewUrl: string }[]) => {
    const pdf = pdfs[0];
    if (!pdf) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDoc('documentation', {
        file_data: reader.result as string,
        file_name: pdf.name,
        mime_type: 'application/pdf',
      });
      setShowImageToPdf(false);
    };
    reader.readAsDataURL(pdf.blob);
  };

  const [mergeAllSuccess, setMergeAllSuccess] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const handleMergeAll = async () => {
    const docTypes = ['image', 'registration_card', 'insurance', 'vignette'];
    const docs = docTypes
      .map(t => getDoc(t))
      .filter(d => !!(d as any)?.file_data) as unknown as { file_data: string; file_name?: string; mime_type?: string }[];

    if (docs.length === 0) {
      showToast('No documents to merge', 'error');
      return;
    }

    setIsMerging(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const doc of docs) {
        const base64 = doc.file_data.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        if (doc.mime_type?.startsWith('image/')) {
          const embedded = doc.mime_type === 'image/jpeg' || doc.mime_type === 'image/jpg'
            ? await pdfDoc.embedJpg(bytes)
            : await pdfDoc.embedPng(bytes);
          const page = pdfDoc.addPage();
          const { width, height } = page.getSize();
          const s = Math.min(width / embedded.width, height / embedded.height) * 0.97;
          page.drawImage(embedded, {
            x: (width - embedded.width * s) / 2,
            y: (height - embedded.height * s) / 2,
            width: embedded.width * s,
            height: embedded.height * s,
          });
        } else if (doc.mime_type === 'application/pdf') {
          const existingPdf = await PDFDocument.load(bytes);
          const pages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
          pages.forEach(p => pdfDoc.addPage(p));
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });

      const reader = new FileReader();
      reader.onload = () => {
        setDoc('documentation', {
          file_data: reader.result as string,
          file_name: 'merged_documents.pdf',
          mime_type: 'application/pdf',
        });
        setMergeAllSuccess(true);
        setIsMerging(false);
        setTimeout(() => setMergeAllSuccess(false), 2000);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Merge failed', error);
      showToast('Failed to merge documents', 'error');
      setIsMerging(false);
    }
  };

  const set = (field: string, value: any) => {
    onChange({ [field]: value } as Partial<FormattedCar>);
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const getDoc = (type: string) => (car?.documents || []).find(d => d.doc_type === type);

  const setDoc = (type: string, data: { file_data?: string; file_name?: string; mime_type?: string } | null) => {
    const docs: any[] = [...(car?.documents || [])];
    if (data === null) {
      set('documents', docs.filter((d: any) => d.doc_type !== type));
    } else {
      const idx = docs.findIndex((d: any) => d.doc_type === type);
      const entry = { ...data, doc_type: type };
      if (idx >= 0) docs[idx] = entry;
      else docs.push(entry);
      set('documents', docs);
    }
  };

  const intervals: MaintenanceInterval[] = car?.intervals || [];
  const currentInterval = intervals.find((i) => i.type === selectedService);

  const updateInterval = (field: 'value' | 'lastCompleted', val: string) => {
    const existing = intervals.findIndex((i) => i.type === selectedService);
    let newIntervals: MaintenanceInterval[];
    if (existing >= 0) {
      newIntervals = [...intervals];
      newIntervals[existing] = { ...newIntervals[existing], [field]: val };
    } else {
      newIntervals = [...intervals, { id: selectedService, type: selectedService, value: '', lastCompleted: '' }];
      newIntervals[newIntervals.length - 1] = { ...newIntervals[newIntervals.length - 1], [field]: val };
    }
    set('intervals', newIntervals);
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const newErrors: Record<string, boolean> = {};
      if (!car?.brand) newErrors.brand = true;
      if (!car?.model) newErrors.model = true;
      if (!car?.plate) newErrors.plate = true;
      if (!car?.daily_rate && car?.daily_rate !== 0) newErrors.daily_rate = true;
      setErrors(newErrors);
      const valid = Object.keys(newErrors).length === 0;
      if (!valid) {
        showToast(t('carForm.requiredFields', 'Please fill in all required fields'), 'error');
      }
      return valid;
    }
  }), [car, showToast, t]);

  const sections = [
    {
      title: `1 ${t('carDetailsView.basicInfo', 'Basic Info')}`,
      icon: <Settings className="w-4 h-4" />,
      fields: [
        { name: 'brand', label: t('carDetailsView.fields.brand', 'Brand'), required: true, input: <InputField hasError={errors.brand} type="text" value={car?.brand || ''} onChange={(e: any) => set('brand', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { name: 'model', label: t('carDetailsView.fields.model', 'Model'), required: true, input: <InputField hasError={errors.model} type="text" value={car?.model || ''} onChange={(e: any) => set('model', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { name: 'plate', label: t('carDetailsView.fields.plate', 'Plate'), required: true, input: <InputField hasError={errors.plate} type="text" value={car?.plate || ''} onChange={(e: any) => set('plate', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} className="uppercase" /> },
        {
          label: t('carDetailsView.fields.color', 'Color'),
          input: (
            <div className="flex flex-col gap-2">
              <InputField type="text" value={car?.color || ''} onChange={(e: any) => set('color', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} />
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button key={c.name} type="button" onClick={() => set('color', c.name)} className={`w-8 h-8 rounded-full border transition-all ${c.border} ${(car?.color || '').toLowerCase() === c.name ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: c.hex }} title={t(`carForm.color${c.name.charAt(0).toUpperCase() + c.name.slice(1)}`, c.name)} />
                ))}
              </div>
            </div>
          ),
        },
        {
          name: 'daily_rate', label: t('carDetailsView.fields.dailyRate', 'Daily Rate'), required: true,
          input: (
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-slate-500">$</span>
              <div className="flex-1"><InputField hasError={errors.daily_rate} type="number" value={car?.daily_rate || ''} onChange={(e: any) => set('daily_rate', parseFloat(e.target.value) || 0)} placeholder="0" /></div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{t('common.perDay')}</span>
            </div>
          ),
        },
        {
          label: t('carDetailsView.fields.odometer', 'Odometer'),
          input: (
            <div className="flex items-center gap-1">
              <div className="flex-1"><InputField type="number" value={car?.odometer || ''} onChange={(e: any) => set('odometer', parseInt(e.target.value) || 0)} placeholder="0" /></div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{t('carForm.odometerUnit', 'km')}</span>
            </div>
          ),
        },
        { label: t('carDetailsView.fields.status', 'Status'), input: <SelectField value={car?.status || ''} onChange={(e: any) => set('status', e.target.value)}>{['available', 'unavailable', 'in maintenance'].map((s) => (<option key={s} value={s}>{t(`common.${s === 'in maintenance' ? 'maintenance' : s}`, s)}</option>))}</SelectField> },
      ],
    },
    {
      title: `2 ${t('carForm.documents', 'Documents')}`,
      icon: <FileText className="w-4 h-4" />,
      fields: [
        { label: t('carForm.uploadImage', 'Vehicle Image'), hideLabel: true, input: <ImageSlot value={getDoc('image')} onChange={(v) => setDoc('image', v)} onCropRequest={handleCropRequest} /> },
        { label: '', hideLabel: true, input: (
          <div className="border border-slate-200 rounded-[12px] overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="border-r border-b border-slate-200">
                <SimpleDocSlot docType="registration_card" label={t('carForm.registrationCard', 'Registration Card')} value={getDoc('registration_card')} onChange={(v) => setDoc('registration_card', v)} />
              </div>
              <div className="border-b border-slate-200">
                <SimpleDocSlot docType="insurance" label={t('carForm.insurance', 'Insurance')} value={getDoc('insurance')} onChange={(v) => setDoc('insurance', v)} />
              </div>
              <div className="border-r border-slate-200">
                <SimpleDocSlot docType="vignette" label={t('carForm.vignette', 'Vignette')} value={getDoc('vignette')} onChange={(v) => setDoc('vignette', v)} />
              </div>
              <div>
                <SimpleDocSlot docType="documentation" label="full car docs" value={getDoc('documentation')} onChange={(v) => setDoc('documentation', v)} isPdf emptyActions={
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowImageToPdf(true)}
                      className="flex-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-[6px] transition-all"
                    >
                      open tool
                    </button>
                    <button
                      type="button"
                      disabled={isMerging}
                      onClick={handleMergeAll}
                      className={`flex-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-1 rounded-[6px] transition-all flex items-center justify-center gap-0.5 ${mergeAllSuccess ? 'bg-green-500 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}
                    >
                      {isMerging ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : mergeAllSuccess ? <Check className="w-2.5 h-2.5" /> : null}
                      merge all
                    </button>
                  </div>
                } />
              </div>
            </div>
          </div>
        ) },
      ],
    },
    {
      title: `3 ${t('carForm.otherDetails', 'Other Details')}`,
      icon: <Calendar className="w-4 h-4" />,
      fields: [
        { label: t('carForm.firstUse', 'First Use'), input: <InputField type="date" value={car?.first_use_date || ''} onChange={(e: any) => set('first_use_date', e.target.value)} /> },
        { label: t('carForm.registrationExpir', 'Registration Expir'), input: <InputField type="date" value={car?.registration_expiry || ''} onChange={(e: any) => set('registration_expiry', e.target.value)} /> },
        { label: t('carForm.insuranceExpir', 'Insurance Expir'), input: <InputField type="date" value={car?.insurance_expiry || ''} onChange={(e: any) => set('insurance_expiry', e.target.value)} /> },
        { label: t('carForm.vignetteExpir', 'Vignette Expir'), input: <InputField type="date" value={car?.vignette_expiry || ''} onChange={(e: any) => set('vignette_expiry', e.target.value)} /> },
        {
          label: t('carForm.transmission', 'Transmission'),
          input: (
            <div className="flex bg-white border border-slate-200 rounded-[12px] overflow-hidden">
              {TRANSMISSIONS.map((trans, index) => (
                <button key={trans} type="button" onClick={() => set('transmission', trans)} className={`flex-1 font-bold text-xs uppercase tracking-wider py-2 transition-all ${index !== 0 ? 'border-l border-slate-200' : ''} ${(car?.transmission || '') === trans ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{t(`carForm.trans${trans}`, trans)}</button>
              ))}
            </div>
          ),
        },
        { label: t('carForm.fuelType', 'Fuel Type'), input: <SelectField value={car?.fuel_type || ''} onChange={(e: any) => set('fuel_type', e.target.value)}><option value="">---</option>{FUEL_TYPES.map((ft) => (<option key={ft} value={ft}>{t(`carForm.fuel${ft}`, ft)}</option>))}</SelectField> },
        { label: t('carForm.gpsSim', 'GPS Sim'), input: <InputField type="text" value={car?.gps_sim || ''} onChange={(e: any) => set('gps_sim', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('carForm.seats', 'Seats'), input: <InputField type="number" value={car?.seats || ''} onChange={(e: any) => set('seats', parseInt(e.target.value) || 0)} placeholder="0" /> },
        {
          label: t('carForm.essentials', 'Essentials'),
          input: (
            <div className="w-full">
              <ItemSection items={car?.essentials?.filter((e: EssentialItem) => e.checked).map((e: EssentialItem) => e.name) || []} onChange={(names: string[]) => { set('essentials', names.map((name) => ({ id: name, name, checked: true }))); }} isEdit disabled={false} />
            </div>
          ),
        },
        { label: t('carForm.notes', 'Notes'), input: <TextareaField value={car?.notes || ''} onChange={(e: any) => set('notes', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} rows={3} /> },
      ],
    },
    {
      title: `4 ${t('carForm.maintenance', 'Maintenance')}`,
      icon: <Gauge className="w-4 h-4" />,
      fields: [
        { label: t('carForm.maintenanceType', 'Select Maintenance Category'), input: <SelectField value={selectedService} onChange={(e: any) => setSelectedService(e.target.value)}>{serviceOptions.map((opt) => (<option key={opt.key} value={opt.value}>{t(`carForm.serviceOptions.${opt.key}`, opt.value)}</option>))}</SelectField> },
        { label: t('carForm.intervalValue', 'Interval Value'), input: <InputField type="number" value={currentInterval?.value || ''} onChange={(e: any) => updateInterval('value', e.target.value)} placeholder={t('carForm.placeholder', 'Enter...')} /> },
        { label: t('carForm.lastCompleted', 'Last Completed'), input: <InputField type="date" value={currentInterval?.lastCompleted || ''} onChange={(e: any) => updateInterval('lastCompleted', e.target.value)} /> },
      ],
    },
  ];

  const renderCard = (section: typeof sections[0]) => (
    <div className="bg-blue-50 border border-slate-200 rounded-[12px] p-5 shadow-sm">
      {section.title && (
        <div className="flex items-center gap-2 text-xs font-semibold text-white pb-3 mb-4 border-b border-slate-200 bg-sky-600 -mx-5 -mt-5 px-5 pt-4 rounded-t-[12px]">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 text-white text-[10px] font-black leading-none shrink-0">{section.title.split(' ')[0]}</span>
          {section.icon && <span className="shrink-0 text-white">{section.icon}</span>}
          <span>{section.title.split(' ').slice(1).join(' ')}</span>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {section.fields.map((field, fIdx) => (
          <div key={fIdx} className="w-full flex flex-col">
            {(field as any).customLabel || ((field as any).hideLabel ? null : (
              <span className="text-xs font-semibold text-slate-600 mb-1">
                {field.label}
                {(field as any).required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
            ))}
            {field.input}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {sections.map((section, i) => (
          <div key={i} className="w-full">
            {renderCard(section)}
          </div>
        ))}
      </div>
      {showImageToPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[90vw] h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowImageToPdf(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <ImageToPdf onAssign={handleImageToPdfAssign} hideSplit />
          </div>
        </div>
      )}
      {showCropTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[90vw] h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => { setShowCropTool(false); setCropImageData(null); }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <ImageCrop onAssign={handleCropAssign} initialImageDataUrl={cropImageData || undefined} simplified />
          </div>
        </div>
      )}
    </div>
  );
});
