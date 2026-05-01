import React from 'react';
import { 
  Search, Star, Plus, Check, Loader2, FileText, Monitor, Upload 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Field1 from './Field1';
import FormSection from './FormSection';
import Button1 from './Button1';

interface ReservationFormProps {
  t: any;
  availableCars: any[];
  selectedCarId: string | null;
  setSelectedCarId: (id: string | null) => void;
  setCarBrand: (val: string) => void;
  setCarModel: (val: string) => void;
  setLicensePlate: (val: string) => void;
  setDailyRate: (val: string | number) => void;
  setOdometerOut: (val: string) => void;
  setFuelOut: (val: string) => void;
  pickupDate: string;
  setPickupDate: (val: string) => void;
  returnDate: string;
  setReturnDate: (val: string) => void;
  extendedReturnDate: string;
  setExtendedReturnDate: (val: string) => void;
  validateDates: () => string | null;
  reservationState: { label: string; color: string; borderColor: string };
  duration: string;
  dailyRate: string | number;
  totalPrice: number;
  clientName: string;
  setClientName: (val: string) => void;
  setClientListActive: (val: boolean) => void;
  clientListActive: boolean;
  allCustomers: any[];
  isClientModified: boolean;
  handleAddNewClient: () => void;
  clientPhone: string;
  setClientPhone: (val: string) => void;
  clientId: string;
  setClientId: (val: string) => void;
  clientLicense: string;
  setClientLicense: (val: string) => void;
  errors: { [key: string]: string };
  rating: number;
  setRating: (val: number) => void;
  notes: string;
  setNotes: (val: string) => void;
  notesRef: React.RefObject<HTMLTextAreaElement>;
  prepayment: string | number;
  setPrepayment: (val: string | number) => void;
  balanceDue: number;
  depositType: string;
  setDepositType: (val: string) => void;
  depositAmount: string | number;
  setDepositAmount: (val: string | number) => void;
  odometerOut: string;
  odometerIn: string;
  setOdometerIn: (val: string) => void;
  fuelOut: string;
  fuelIn: string;
  setFuelIn: (val: string) => void;
  cleanedBefore: string;
  setCleanedBefore: (val: string) => void;
  isAddingItem: boolean;
  setIsAddingItem: (val: boolean) => void;
  newItemName: string;
  setNewItemName: (val: string) => void;
  handleAddItem: () => void;
  includedItems: string[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateContract: () => void;
  isUploading: boolean;
  isGeneratingContract?: boolean;
  disabled?: boolean;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  t,
  availableCars,
  selectedCarId,
  setSelectedCarId,
  setCarBrand,
  setCarModel,
  setLicensePlate,
  setDailyRate,
  setOdometerOut,
  setFuelOut,
  pickupDate,
  setPickupDate,
  returnDate,
  setReturnDate,
  extendedReturnDate,
  setExtendedReturnDate,
  validateDates,
  reservationState,
  duration,
  dailyRate,
  totalPrice,
  clientName,
  setClientName,
  setClientListActive,
  clientListActive,
  allCustomers,
  isClientModified,
  handleAddNewClient,
  clientPhone,
  setClientPhone,
  clientId,
  setClientId,
  clientLicense,
  setClientLicense,
  errors,
  rating,
  setRating,
  notes,
  setNotes,
  notesRef,
  prepayment,
  setPrepayment,
  balanceDue,
  depositType,
  setDepositType,
  depositAmount,
  setDepositAmount,
  odometerOut,
  odometerIn,
  setOdometerIn,
  fuelOut,
  fuelIn,
  setFuelIn,
  cleanedBefore,
  setCleanedBefore,
  isAddingItem,
  setIsAddingItem,
  newItemName,
  setNewItemName,
  handleAddItem,
  includedItems,
  handleFileUpload,
  handleCreateContract,
  isUploading,
  isGeneratingContract = false,
  disabled = false
}) => {
  return (
    <>
      {/* Section 1: Car & Schedule */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.carSchedule')} style={{ zIndex: 70 }}>
          <Field1 
            label={t('reservations.form.carSelection', 'Car Selection')}
            as="select"
            value={selectedCarId || ''}
            onChange={(e) => {
              const carId = e.target.value;
              const car = availableCars.find(c => c.id === carId);
              if (car) {
                setCarBrand(car.brand);
                setCarModel(car.model);
                setLicensePlate(car.plate);
                setDailyRate(car.daily_rate);
                setSelectedCarId(car.id);
                setOdometerOut(car.odometer.toString());
                setFuelOut(car.starting_fuel_level?.toString() || '100');
              } else {
                setSelectedCarId(null);
              }
            }}
            error={errors.selectedCarId ? t('common.required') : ''}
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
            required
          >
            <option value="">{t('reservations.form.selectCar', 'Select a Car')}</option>
            {availableCars.map(car => (
              <option key={car.id} value={car.id}>
                {car.brand}, {car.model}, {car.plate} ({car.status})
              </option>
            ))}
          </Field1>

          <Field1 
            label={t('reservations.form.pickupDate')}
            type="datetime-local"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            error={errors.pickupDate ? t('common.required') : ''}
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
            required
          />

          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-0">
            <Field1 
              label={t('reservations.form.returnDate')}
              type="datetime-local"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              error={errors.returnDate ? t('common.required') : ''}
              disabled={disabled}
              required
            />
            {validateDates() && returnDate && pickupDate && new Date(returnDate) <= new Date(pickupDate) && (
              <p className="text-[10px] text-red-500 font-bold uppercase mt-1 px-2">{validateDates()}</p>
            )}
          </div>

          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-0">
            <Field1 
              label={t('reservations.form.extendedReturn')}
              type="datetime-local"
              value={extendedReturnDate}
              onChange={(e) => setExtendedReturnDate(e.target.value)}
              disabled={disabled}
            />
            {validateDates() && extendedReturnDate && returnDate && new Date(extendedReturnDate) <= new Date(returnDate) && (
              <p className="text-[10px] text-red-500 font-bold uppercase mt-1 px-2">{validateDates()}</p>
            )}
          </div>

          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-2">
            <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('reservations.form.state')}</label>
            <div className="w-full bg-white p-[11px_10px] min-h-[46px] flex items-center font-bold border-2 border-black rounded-[5px]" style={{ borderInlineStartWidth: '6px', borderInlineStartColor: reservationState.borderColor }}>
              <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest border border-black ${reservationState.color}`}>
                {reservationState.label}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-2">
            <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('reservations.form.duration')}</label>
            <div className="w-full bg-white p-[11px_10px] min-h-[46px] flex items-center font-bold border-2 border-black rounded-[5px] border-s-4 border-s-midnight-ink text-ink/70">
              {duration}
            </div>
          </div>

          <Field1 
            label={t('reservations.form.dailyRate')}
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(Number(e.target.value))}
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
          />

          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-2">
            <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('reservations.form.totalPriceCalc')}</label>
            <div className="w-full bg-white p-[11px_10px] min-h-[50px] flex items-center justify-center font-black text-2xl text-ink border-2 border-black rounded-[5px]">
              {totalPrice.toFixed(2)}
            </div>
          </div>
        </FormSection>
      </div>

      {/* Section 2: Client Profile */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.clientProfile')} style={{ zIndex: 60 }}>
          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-2 relative" style={{ zIndex: 50 }}>
            <div className="flex justify-between items-end relative z-20">
              <div className="w-full">
                <Field1 
                  label={t('reservations.form.fullName')}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onFocus={() => !disabled && setClientListActive(true)}
                  onBlur={() => setTimeout(() => setClientListActive(false), 200)}
                  placeholder={t('reservations.form.clientPlaceholder')}
                  error={errors.clientName ? t('common.required') : ''}
                  disabled={disabled}
                  required
                />
              </div>
              {isClientModified && !disabled && (
                <button 
                  onClick={handleAddNewClient}
                  className="absolute right-0 top-[6px] px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest border border-black hover:bg-ink transition-colors flex items-center gap-1 z-20"
                >
                  <Plus className="w-3 h-3" /> {t('common.add', 'Add')}
                </button>
              )}
            </div>
            <div className="relative">
              {!disabled && <Search className="absolute end-4 top-[-30px] text-ink/40 pointer-events-none" />}
              {clientListActive && !disabled && (
                <div className="combobox-list active overflow-y-auto max-h-48 border border-black mt-[-2px]">
                  {allCustomers.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).map(customer => (
                    <div key={customer.id} className="combobox-item border-b border-black last:border-b-0" onClick={() => {
                      setClientName(customer.name);
                      setClientPhone(customer.phone);
                      setClientId(customer.id_card_number);
                      setClientLicense(customer.license_number);
                      setRating(customer.trust_rank);
                      setClientListActive(false);
                    }}>
                      {customer.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Field1 
            label={t('reservations.form.phoneNumber')}
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
            style={{ zIndex: 40 }}
          />

          <Field1 
            label={t('reservations.form.idCardNumber')}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
            style={{ zIndex: 30 }}
          />

          <div className="flex-1 min-w-[200px] max-w-[280px]" style={{ zIndex: 20 }}>
            <Field1 
              label={t('reservations.form.licenseNumber')}
              value={clientLicense}
              onChange={(e) => setClientLicense(e.target.value)}
              disabled={disabled}
            />
          </div>
        </FormSection>
      </div>

      {/* Section 3: Financial Alignment */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.financialAlignment')} style={{ zIndex: 50 }}>
          <Field1 
            label={t('reservations.form.prepayment')}
            type="number"
            value={prepayment}
            onChange={(e) => setPrepayment(Number(e.target.value))}
            placeholder="0.00"
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
          />

          <div className="flex-1 min-w-[200px] max-w-[280px] space-y-2">
            <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('reservations.form.balanceDue')}</label>
            <div className="p-[11px_10px] text-2xl font-black text-primary border-2 border-black rounded-[5px] bg-white">
              ${balanceDue.toFixed(2)}
            </div>
          </div>

          <Field1 
            label={t('reservations.form.depositType')}
            as="select"
            value={depositType}
            onChange={(e) => setDepositType(e.target.value)}
            className="flex-1 min-w-[200px] max-w-[280px]"
            disabled={disabled}
          >
            <option value="">{t('common.select', 'Select...')}</option>
            <option value="None">{t('common.noData')}</option>
            <option value="Cash">{t('reservations.form.cash')}</option>
            <option value="Cheque">{t('reservations.form.cheque')}</option>
          </Field1>

          <Field1 
            label={t('reservations.form.depositAmount')}
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            placeholder="0.00"
            disabled={depositType === 'None' || disabled}
            className={`flex-1 min-w-[200px] max-w-[280px] ${depositType === 'None' || disabled ? 'opacity-50' : ''}`}
          />
        </FormSection>
      </div>

      {/* Section 4: Logistics Tracking */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.logisticsTracking')} style={{ zIndex: 40 }}>
          {[
            { label: t('reservations.form.odometerOut'), val: odometerOut, setter: setOdometerOut, placeholder: 'KM' },
            { label: t('reservations.form.odometerIn'), val: odometerIn, setter: setOdometerIn, placeholder: 'KM' },
            { label: t('reservations.form.fuelOut'), val: fuelOut, setter: setFuelOut, placeholder: '%' },
            { label: t('reservations.form.fuelIn'), val: fuelIn, setter: setFuelIn, placeholder: '%' },
          ].map((field) => (
            <Field1 
              key={field.label}
              label={field.label}
              type="number"
              value={field.val}
              onChange={(e: any) => field.setter(e.target.value)}
              placeholder={field.placeholder}
              className="flex-1 min-w-[200px] max-w-[280px]"
              disabled={disabled}
            />
          ))}
        </FormSection>
      </div>

      {/* Section 5: Ranking and Feedback */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.rankingFeedback', 'Ranking and Feedback')} style={{ zIndex: 30 }}>
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink border border-black">{t('reservations.form.clientRanking', 'Client Ranking')}</label>
            <div className={`flex gap-2 text-midnight-ink ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {[1, 2, 3, 4, 5].map((val) => (
                <button 
                  key={val}
                  onClick={() => !disabled && setRating(val)}
                  type="button"
                  className={`transition-all ${rating >= val ? 'fill-midnight-ink' : ''}`}
                >
                  <Star 
                    className={`w-10 h-10 ${rating >= val ? 'fill-current' : 'fill-none'}`} 
                    strokeWidth={1}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[300px]">
            <label className="text-[0.75rem] text-black font-bold relative top-[0.5rem] ml-[7px] px-[3px] bg-white w-fit z-10 uppercase tracking-wider">{t('reservations.form.notes')}</label>
            <textarea 
              className="w-full bg-white p-[11px_10px] min-h-[100px] border-2 border-black rounded-[5px] resize-none overflow-hidden font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (notesRef.current) {
                  notesRef.current.style.height = 'auto';
                  notesRef.current.style.height = notesRef.current.scrollHeight + 'px';
                }
              }}
              ref={notesRef}
              placeholder={t('reservations.form.notesPlaceholder')}
              disabled={disabled}
            />
          </div>
        </FormSection>
      </div>

      {/* Section 6: Additional Service */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.additionalService', 'Service and Condition')} style={{ zIndex: 20 }}>
          <Field1 
            label={t('reservations.form.cleanedBefore')}
            as="select"
            value={cleanedBefore}
            onChange={(e) => setCleanedBefore(e.target.value)}
            className="w-full"
            disabled={disabled}
          >
            <option value="">{t('common.select', 'Select...')}</option>
            <option value="yes">{t('common.yes')}</option>
            <option value="no">{t('common.no')}</option>
          </Field1>

          <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink border border-black">{t('reservations.form.includedItems')}</label>
              {!disabled && (
                <button 
                  onClick={() => setIsAddingItem(true)}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest border border-black hover:bg-ink transition-all"
                >
                  <Plus className="w-4 h-4" /> {t('reservations.form.addItem')}
                </button>
              )}
            </div>

            <AnimatePresence>
              {isAddingItem && !disabled && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-2 flex-wrap"
                >
                  <input 
                    className="flex-1 p-3 text-sm uppercase border border-black"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={t('reservations.form.newItemPlaceholder')}
                    autoFocus
                  />
                  <button 
                    onClick={handleAddItem}
                    type="button"
                    className="px-4 py-3 bg-primary text-white font-bold text-xs uppercase tracking-widest border border-black flex items-center justify-center min-w-[50px]"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsAddingItem(false)}
                    type="button"
                    className="px-4 py-3 bg-slate-200 text-ink font-bold text-xs uppercase tracking-widest border border-black flex items-center justify-center"
                  >
                    {t('common.cancel')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {includedItems.map((item) => (
                <label key={item} className={`flex items-center gap-3 bg-white p-4 border border-black ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-6 h-6 border-2 border-black text-primary focus:ring-0 rounded-none bg-white font-bold disabled:opacity-50" 
                    disabled={disabled}
                  />
                  <span className="text-sm font-bold uppercase">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </FormSection>
      </div>

      {/* Section 7: Documentation */}
      <div className="p-4 sm:p-10">
        <FormSection title={t('reservations.form.documentation')} style={{ zIndex: 10 }}>
          <div className="flex flex-wrap gap-6 w-full">
            <Button1 
              onClick={handleCreateContract}
              disabled={isGeneratingContract || disabled}
              icon={isGeneratingContract ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              type="button"
            >
              {isGeneratingContract ? t('reservations.form.generating', 'Generating...') : t('reservations.form.createContract', 'Create Contract')}
            </Button1>

            <Button1 
              onClick={() => alert('Opening PDF Tool...')}
              icon={<Monitor className="w-5 h-5" />}
              type="button"
              disabled={disabled}
            >
              {t('reservations.form.openPdfTool', 'Open PDF Tool')}
            </Button1>

            <div className="relative">
              <input 
                type="file" 
                id="contract-upload" 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={disabled}
              />
              <Button1 
                onClick={() => document.getElementById('contract-upload')?.click()}
                disabled={isUploading || disabled}
                icon={isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                type="button"
              >
                {isUploading ? t('reservations.form.uploading') : t('reservations.form.uploadPdf', 'Upload PDF')}
              </Button1>
            </div>
          </div>
        </FormSection>
      </div>
    </>
  );
};

export default ReservationForm;
