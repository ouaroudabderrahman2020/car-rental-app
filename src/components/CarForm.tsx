import React from 'react';
import { 
  Car as CarIcon, Upload, Camera, FileText, Verified, 
  Settings, Trash2, Plus, Check, ChevronDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import Button1 from './Button1';
import Field1 from './Field1';
import FormSection from './FormSection';

export interface MaintenanceInterval {
  id: string;
  type: string;
  value: string;
  lastCompleted: string;
}

export interface EssentialItem {
  id: string;
  name: string;
  checked: boolean;
}

interface CarFormProps {
  // Vehicle Specs
  brand: string; setBrand: (v: string) => void;
  model: string; setModel: (v: string) => void;
  plate: string; setPlate: (v: string) => void;
  color: string; setColor: (v: string) => void;
  fuelType: string; setFuelType: (v: string) => void;
  transmission: 'Automatic' | 'Manual'; setTransmission: (v: 'Automatic' | 'Manual') => void;
  odometer: string; setOdometer: (v: string) => void;
  dailyRate: string; setDailyRate: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  startingFuelLevel: string; setStartingFuelLevel: (v: string) => void;
  
  // Media & Equipment
  gpsSim: string; setGpsSim: (v: string) => void;
  seats: string; setSeats: (v: string) => void;
  damageNotes: string; setDamageNotes: (v: string) => void;
  carImage?: { base64Data: string; fileName: string; contentType: string } | null;
  setCarImage: (val: { base64Data: string; fileName: string; contentType: string } | null) => void;
  docFile?: { base64Data: string; fileName: string; contentType: string } | null;
  setDocFile: (val: { base64Data: string; fileName: string; contentType: string } | null) => void;
  onOpenPdfTool?: () => void;
  imageUrl?: string;
  docUrl?: string;
  
  // Paperwork
  registrationExpiry: string; setRegistrationExpiry: (v: string) => void;
  insuranceExpiry: string; setInsuranceExpiry: (v: string) => void;
  techInspectionExpiry: string; setTechInspectionExpiry: (v: string) => void;
  taxRenewalExpiry: string; setTaxRenewalExpiry: (v: string) => void;
  
  // Essentials
  essentials: EssentialItem[];
  setEssentials: (val: EssentialItem[]) => void;
  isAddingEssential: boolean;
  setIsAddingEssential: (val: boolean) => void;
  newEssentialText: string;
  setNewEssentialText: (val: string) => void;
  
  // Maintenance
  intervals: MaintenanceInterval[];
  setIntervals: (val: MaintenanceInterval[]) => void;
  
  errors: { [key: string]: string };
  disabled?: boolean;
}

const serviceOptions = [
  "Engine Oil", "Coolant (Antigel)", "Brake Fluid", "Gearbox Oil", "Air Filter", 
  "Fuel Filter", "Cabin/AC Filter", "Brake Pads (Plaquettes de frein)", "Tires", 
  "Wiper Blades", "Timing Belt (Courroie)", "Battery", "Spark Plugs (Bougies)", "Shock Absorbers"
];

const CarForm: React.FC<CarFormProps> = ({
  brand, setBrand,
  model, setModel,
  plate, setPlate,
  color, setColor,
  fuelType, setFuelType,
  transmission, setTransmission,
  odometer, setOdometer,
  dailyRate, setDailyRate,
  status, setStatus,
  startingFuelLevel, setStartingFuelLevel,
  gpsSim, setGpsSim,
  seats, setSeats,
  damageNotes, setDamageNotes,
  carImage, setCarImage,
  docFile, setDocFile,
  onOpenPdfTool,
  imageUrl, docUrl,
  registrationExpiry, setRegistrationExpiry,
  insuranceExpiry, setInsuranceExpiry,
  techInspectionExpiry, setTechInspectionExpiry,
  taxRenewalExpiry, setTaxRenewalExpiry,
  essentials, setEssentials,
  isAddingEssential, setIsAddingEssential,
  newEssentialText, setNewEssentialText,
  intervals, setIntervals,
  errors,
  disabled = false
}) => {
  const { t } = useTranslation();
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const fileData = {
        base64Data,
        fileName: file.name,
        contentType: file.type
      };
      if (type === 'image') setCarImage(fileData);
      else setDocFile(fileData);
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Available': return 'border-green-500';
      case 'In Maintenance': return 'border-amber-500';
      case 'Decommissioned': return 'border-slate-500';
      default: return 'border-form-border';
    }
  };

  const handleAddInterval = () => {
    if (disabled) return;
    setIntervals([...intervals, { 
      id: Date.now().toString(), 
      type: 'Engine Oil', 
      value: '', 
      lastCompleted: '' 
    }]);
  };

  const handleRemoveInterval = (id: string) => {
    if (disabled) return;
    setIntervals(intervals.filter(i => i.id !== id));
  };

  const handleUpdateInterval = (id: string, field: keyof MaintenanceInterval, value: string) => {
    if (disabled) return;
    setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleAddEssential = () => {
    if (disabled) return;
    if (newEssentialText.trim()) {
      setEssentials([...essentials, { 
        id: Date.now().toString(), 
        name: newEssentialText.trim(), 
        checked: true 
      }]);
      setNewEssentialText('');
      setIsAddingEssential(false);
    }
  };

  const handleRemoveEssential = (id: string) => {
    if (disabled) return;
    setEssentials(essentials.filter(e => e.id !== id));
  };

  return (
    <div className="bg-white w-full">
      {/* Section 1: Specifications */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('carForm.specs')}>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: t('carForm.brand'), val: brand, setter: setBrand },
            { label: t('carForm.model'), val: model, setter: setModel },
            { label: t('carForm.plate'), val: plate, setter: setPlate, extra: 'uppercase', error: errors.plate },
            { label: t('carForm.color'), val: color, setter: setColor },
          ].map(field => (
            <Field1 
              key={field.label}
              label={field.label}
              value={field.val}
              onChange={(e) => field.setter(e.target.value)}
              placeholder={t('carForm.placeholder')}
              error={field.error}
              className={field.extra}
              disabled={disabled}
            />
          ))}

          <Field1 
            label={t('carForm.fuelType')}
            as="select"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            disabled={disabled}
          >
            <option value="Petrol">{t('carForm.fuelPetrol', 'Petrol')}</option>
            <option value="Diesel">{t('carForm.fuelDiesel', 'Diesel')}</option>
            <option value="Electric">{t('carForm.fuelElectric', 'Electric')}</option>
            <option value="Hybrid">{t('carForm.fuelHybrid', 'Hybrid')}</option>
          </Field1>

          <div className="space-y-2">
            <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('carForm.transmission')}</label>
            <div className="flex border-2 border-black rounded-[5px] h-[46px] overflow-hidden">
              <button 
                type="button"
                disabled={disabled}
                onClick={() => setTransmission('Automatic')}
                className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors ${transmission === 'Automatic' ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'} disabled:opacity-50`}
              >
                {t('carForm.transAuto', 'Automatic')}
              </button>
              <button 
                type="button"
                disabled={disabled}
                onClick={() => setTransmission('Manual')}
                className={`flex-1 font-bold text-xs uppercase tracking-widest transition-colors border-l border-black ${transmission === 'Manual' ? 'bg-midnight-ink text-white' : 'bg-white text-midnight-ink'} disabled:opacity-50`}
              >
                {t('carForm.transManual', 'Manual')}
              </button>
            </div>
          </div>

          <Field1 
            label={t('carForm.odometer')}
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder={t('carForm.placeholder')}
            disabled={disabled}
          />

          <Field1 
            label={t('carForm.dailyRate')}
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            placeholder={t('carForm.placeholder')}
            disabled={disabled}
          />

          <Field1 
            label={t('carForm.startingFuel')}
            type="number"
            value={startingFuelLevel}
            onChange={(e) => setStartingFuelLevel(e.target.value)}
            placeholder="0-100"
            disabled={disabled}
          />

          <div className="sm:col-span-2 lg:col-span-4 space-y-2">
            <Field1 
              label={t('carForm.status')}
              as="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`border-s-4 ${getStatusColor()} font-bold`}
              disabled={disabled}
            >
              <option value="Available" className="text-green-600 font-bold">{t('common.available')}</option>
              <option value="In Maintenance" className="text-amber-600 font-bold">{t('common.maintenance')}</option>
              <option value="Decommissioned" className="text-slate-600 font-bold">{t('common.decommissioned')}</option>
            </Field1>
          </div>
        </div>
        </FormSection>
      </div>

      {/* Section 2: Media & Equipment */}
      <div className="p-4 sm:p-10 border-t border-muted-cream">
        <FormSection title={t('carForm.media')}>
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.uploadImage')}</label>
              <input 
                type="file" 
                ref={imageInputRef}
                onChange={(e) => handleFileChange(e, 'image')}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={() => !disabled && imageInputRef.current?.click()}
                className={`w-full aspect-video border-2 border-dashed border-form-border bg-slate-50 flex flex-col items-center justify-center transition-all overflow-hidden relative group ${!disabled ? 'cursor-pointer hover:border-primary hover:bg-white' : 'cursor-default opacity-60'}`}
              >
                {carImage || imageUrl ? (
                  <>
                    <img 
                      src={carImage ? `data:${carImage.contentType};base64,${carImage.base64Data}` : imageUrl} 
                      alt="Car Preview" 
                      className="w-full h-full object-cover"
                    />
                    {!disabled && (
                      <div className="absolute inset-0 bg-midnight-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-midnight-ink/20" />
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-midnight-ink/40">{t('carForm.dragOrClick')}</p>
                  </>
                )}
              </div>
              {(carImage || imageUrl) && !disabled && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setCarImage(null); }}
                  className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> {t('common.remove', 'Remove Image')}
                </button>
              )}
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.pdfLabel')}</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={docInputRef}
                      onChange={(e) => handleFileChange(e, 'doc')}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <Button1 
                      onClick={() => !disabled && docInputRef.current?.click()}
                      className="flex-1 !justify-between"
                      icon={<Upload className="w-5 h-5" />}
                      disabled={disabled}
                      type="button"
                    >
                      {t('carForm.uploadPdf', 'Upload PDF')}
                    </Button1>
                    {onOpenPdfTool && (
                      <Button1 
                        onClick={onOpenPdfTool}
                        className="bg-slate-100 text-slate-800"
                        icon={<FileText className="w-5 h-5" />}
                        disabled={disabled}
                        type="button"
                        title={t('tools.imageToPdf')}
                      />
                    )}
                  </div>
                  {(docFile || docUrl) && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 industrial-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center text-white">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-emerald-800 truncate max-w-[200px]">
                            {docFile ? docFile.fileName : t('carForm.viewPdf', 'Car Documentation PDF')}
                          </span>
                          <span className="text-[8px] font-bold text-emerald-600 uppercase">READY FOR UPLOAD</span>
                        </div>
                      </div>
                      {!disabled && (
                        <button 
                          onClick={() => setDocFile(null)}
                          className="p-1 hover:bg-emerald-100 text-emerald-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field1 
                label={t('carForm.gpsSim')}
                value={gpsSim}
                onChange={(e) => setGpsSim(e.target.value)}
                placeholder={t('carForm.placeholder')}
                disabled={disabled}
              />
              <Field1 
                label={t('carForm.seats')}
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                placeholder={t('carForm.placeholder')}
                disabled={disabled}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Field1 
              as="textarea"
              label={t('carForm.damageNotes')}
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder={t('carForm.placeholder')}
              disabled={disabled}
            />
          </div>
        </div>
        </FormSection>
      </div>

      {/* Section 3: Essentials */}
      <div className="p-4 sm:p-10 border-t border-muted-cream">
        <FormSection title={t('carForm.essentials')}>
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.includedItems')}</label>
              {!disabled && (
                <button 
                  onClick={() => setIsAddingEssential(true)}
                  className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> {t('carForm.addItem')}
                </button>
              )}
            </div>
            <AnimatePresence>
              {isAddingEssential && !disabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-white border-1.5 border-primary industrial-shadow overflow-hidden"
                >
                  <div className="flex gap-2 items-end">
                    <Field1
                      className="flex-1"
                      label={t('carForm.itemName')}
                      value={newEssentialText}
                      onChange={(e) => setNewEssentialText(e.target.value)}
                      placeholder={t('carForm.itemName')}
                    />
                    <button 
                      type="button"
                      onClick={handleAddEssential}
                      className="bg-primary text-white w-10 h-10 flex items-center justify-center industrial-shadow shrink-0"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsAddingEssential(false); setNewEssentialText(''); }}
                      className="bg-red-600 text-white w-10 h-10 flex items-center justify-center industrial-shadow shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
              {essentials.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-4 industrial-shadow border-[1.5px] border-form-border group">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input 
                      type="checkbox"
                      checked={item.checked}
                      disabled={disabled}
                      onChange={(e) => setEssentials(essentials.map(ext => ext.id === item.id ? { ...ext, checked: e.target.checked } : ext))}
                      className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none disabled:opacity-50" 
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${disabled ? 'opacity-70' : ''}`}>{item.name}</span>
                  </label>
                  {!disabled && (
                    <button 
                      onClick={() => handleRemoveEssential(item.id)}
                      className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{t('carForm.paperwork')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'registrationExpiry', label: t('carForm.registrationCard'), val: registrationExpiry, setter: setRegistrationExpiry },
                { key: 'insuranceExpiry', label: t('carForm.insuranceExpir'), val: insuranceExpiry, setter: setInsuranceExpiry },
                { key: 'techInspectionExpiry', label: t('carForm.techInspection'), val: techInspectionExpiry, setter: setTechInspectionExpiry },
                { key: 'taxRenewalExpiry', label: t('carForm.taxRenewal'), val: taxRenewalExpiry, setter: setTaxRenewalExpiry }
              ].map(doc => (
                <Field1
                   key={doc.key}
                   label={doc.label}
                   type="date"
                   value={doc.val}
                   onChange={(e) => doc.setter(e.target.value)}
                   disabled={disabled}
                />
              ))}
            </div>
          </div>
        </div>
        </FormSection>
      </div>

      {/* Section 4: Maintenance Intervals */}
      <div className="p-4 sm:p-10 border-t border-muted-cream">
        <FormSection title={t('carForm.maintenance')}>
          <div className="w-full space-y-4">
          {!disabled && (
            <div className="flex justify-between items-center">
              <button 
                onClick={handleAddInterval}
                className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
              >
                <Plus className="w-4 h-4" /> {t('carForm.addInterval')}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="bg-white text-left">
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carForm.intervalType')}</th>
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carForm.intervalValue')}</th>
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest border border-form-border">{t('carForm.lastCompleted')}</th>
                  <th className="p-3 w-[60px] border border-form-border"></th>
                </tr>
              </thead>
              <tbody className="flex flex-col gap-4 md:table-row-group">
                {intervals.map((interval) => (
                  <tr key={interval.id} className="group border border-form-border p-4 md:p-0 flex flex-col md:table-row bg-white industrial-shadow md:shadow-none">
                    <td className="md:p-2 md:border md:border-form-border mb-2 md:mb-0">
                      <Field1
                        as="select"
                        label={t('carForm.intervalType')}
                        value={interval.type}
                        onChange={(e) => handleUpdateInterval(interval.id, 'type', e.target.value)}
                        disabled={disabled}
                      >
                        {serviceOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </Field1>
                    </td>
                    <td className="md:p-2 md:border md:border-form-border mb-2 md:mb-0">
                      <Field1
                        label={t('carForm.intervalValue')}
                        placeholder={t('carForm.placeholder')}
                        value={interval.value}
                        onChange={(e) => handleUpdateInterval(interval.id, 'value', e.target.value)}
                        disabled={disabled}
                      />
                    </td>
                    <td className="md:p-2 md:border md:border-form-border mb-2 md:mb-0">
                      <Field1
                        type="date"
                        label={t('carForm.lastCompleted')}
                        value={interval.lastCompleted}
                        onChange={(e) => handleUpdateInterval(interval.id, 'lastCompleted', e.target.value)}
                        disabled={disabled}
                      />
                    </td>
                    <td className="md:p-2 md:border md:border-form-border text-center">
                      {!disabled && (
                        <button 
                          onClick={() => handleRemoveInterval(interval.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </FormSection>
      </div>
    </div>
  );
};

export default CarForm;
