import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Edit, Lock, Trash2, RotateCcw, ArrowRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { useStatus } from '../contexts/StatusContext';
import FormSection from './FormSection';
import ReservationForm from './ReservationForm';

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: any; // Using any for expanded data
}

export default function ReservationDetailsModal({ isOpen, onClose, reservationData }: ReservationDetailsModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [carBrand, setCarBrand] = useState(reservationData?.carBrand || '');
  const [carModel, setCarModel] = useState(reservationData?.car || '');
  const [licensePlate, setLicensePlate] = useState(reservationData?.plate || 'PLATE-01');
  const [pickupDate, setPickupDate] = useState(reservationData?.pickupDate || '2023-10-12T10:00');
  const [returnDate, setReturnDate] = useState(reservationData?.returnDate || '2023-10-15T10:00');
  const [extendedReturnDate, setExtendedReturnDate] = useState(reservationData?.extendedReturnDate || '');
  const [dailyRate, setDailyRate] = useState(reservationData?.rate || 150);
  const [clientName, setClientName] = useState(reservationData?.client || '');
  const [clientPhone, setClientPhone] = useState(reservationData?.phone || '+1 555-0987-654');
  const [clientId, setClientId] = useState(reservationData?.clientId || 'ID-9921102');
  const [clientLicense, setClientLicense] = useState(reservationData?.license || 'DL-K882-9901');
  const [prepayment, setPrepayment] = useState(reservationData?.prepayment || 100);
  const [depositType, setDepositType] = useState(reservationData?.depositType || 'Cash');
  const [depositAmount, setDepositAmount] = useState(reservationData?.depositAmount || 500);
  const [odometerOut, setOdometerOut] = useState(reservationData?.odometerOut || '12,500');
  const [odometerIn, setOdometerIn] = useState(reservationData?.odometerIn || '12,850');
  const [fuelOut, setFuelOut] = useState(reservationData?.fuelOut || '100');
  const [fuelIn, setFuelIn] = useState(reservationData?.fuelIn || '95');
  const [cleanedBefore, setCleanedBefore] = useState(reservationData?.cleanedBefore || 'no');
  const [includedItems, setIncludedItems] = useState([
    'Safety Vest', 'Warning Triangle', 'Fire Extinguisher',
    'Spare Tire', 'Lifting Jack', 'Lug Wrench'
  ]);
  const [notes, setNotes] = useState(reservationData?.notes || 'Vehicle was delivered in immaculate condition. Minor scuff on front left rim already noted.');
  const [rating, setRating] = useState(reservationData?.rating || 4);

  // UI State
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(reservationData?.car_id || null);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [carListActive, setCarListActive] = useState(false);
  const [plateListActive, setPlateListActive] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Calculations
  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reservationData) {
      setCarBrand(reservationData.carBrand || '');
      setCarModel(reservationData.car || '');
      setClientName(reservationData.client || '');
      setSelectedCarId(reservationData.car_id || null);
      setPickupDate(reservationData.start_date?.slice(0, 16) || reservationData.pickupDate || '');
      setReturnDate(reservationData.end_date?.slice(0, 16) || reservationData.returnDate || '');
      setDailyRate(reservationData.daily_rate || reservationData.rate || 0);
      setClientPhone(reservationData.customer_phone || reservationData.phone || '');
      setPrepayment(reservationData.prepayment || 0);
      setOdometerOut(reservationData.odometer_out?.toString() || reservationData.odometerOut || '');
      setFuelOut(reservationData.fuel_level_out?.toString() || reservationData.fuelOut || '');
    }
  }, [reservationData]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cars }, { data: customers }] = await Promise.all([
        supabase
          .from('cars')
          .select('*')
          .neq('status', 'Decommissioned'),
        supabase
          .from('customers')
          .select('*')
      ]);
      
      if (cars) setAvailableCars(cars);
      if (customers) setAllCustomers(customers);
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(pickupDate);
      const end = extendedReturnDate ? new Date(extendedReturnDate) : new Date(returnDate);

      const reservationStateInfo = { 
        label: reservationData?.status || 'Active', 
        color: 'text-primary', 
        borderColor: 'border-primary' 
      };

      if (start.getTime() && end.getTime() && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        const d = Math.floor(totalHours / 24);
        const h = Math.floor(totalHours % 24);
        setDuration(`${d} Days, ${h} Hours`);

        const billableDays = Math.ceil(totalHours / 24);
        const total = billableDays * dailyRate;
        setTotalPrice(total);
        setBalanceDue(total - prepayment);
      } else {
        setDuration('Invalid Range');
        setTotalPrice(0);
        setBalanceDue(0);
      }
    };
    calculate();
  }, [pickupDate, returnDate, extendedReturnDate, dailyRate, prepayment]);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      setIncludedItems([...includedItems, newItemName.trim()]);
      setNewItemName('');
    }
    setIsAddingItem(false);
  };

  const isFormValid = carModel.trim() !== '' && clientName.trim() !== '';

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors] = useState<{ [key: string]: string }>({});

  const validateDates = () => {
    if (pickupDate && returnDate) {
      if (new Date(returnDate) <= new Date(pickupDate)) {
        return t('addReservation.errors.dateRange');
      }
    }
    return null;
  };

  const handleCreateContract = async () => {
    if (!isFormValid) return;
    setIsGeneratingContract(true);
    
    // Prepare reservation data for template
    const reservationDataToGAS = {
      customer_name: clientName,
      customer_phone: clientPhone,
      customer_id: clientId,
      car_brand: carBrand,
      car_model: carModel,
      license_plate: licensePlate,
      pickup_date: pickupDate,
      return_date: returnDate,
      total_price: totalPrice,
      prepayment: prepayment,
      balance_due: balanceDue,
      deposit_amount: depositAmount,
      deposit_type: depositType
    };

    const result = await gasService.generateContract(reservationDataToGAS);
    if (result.success) {
      alert(t('reservations.form.contractSuccess', 'Contract generated successfully in Drive!'));
    } else {
      alert(`${t('common.error')}: ${result.error}`);
    }
    setIsGeneratingContract(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus(t('reservations.form.processingFile'), 'processing', 0);
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setPendingFile({
        base64Data,
        fileName: file.name,
        contentType: file.type
      });
      setUploadedDocUrl(file.name);
      setStatus(t('reservations.form.fileReady'), 'success');
      setIsUploading(false);
    };
    reader.onerror = () => {
      setStatus(t('common.error'), 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerGasSideEffects = async (resData: any) => {
    setStatus(t('common.syncingExternal'), 'processing', 30);
    
    const tasks = [];
    tasks.push(gasService.exportData('reservations', [resData]));
    if (pendingFile) tasks.push(gasService.uploadBase64(pendingFile));
    tasks.push(gasService.generateContract(resData));
    
    try {
      await Promise.allSettled(tasks);
      return true;
    } catch (e) {
      console.error('GAS Side Effects failed', e);
      return false;
    }
  };

  const handleConfirm = async () => {
    if (!isFormValid || !reservationData?.id) return;
    setIsSubmitting(true);
    setStatus(t('common.processingSubmission', 'Processing submission...'), 'processing', 10);

    const reservationUpdateData = {
      customer_name: clientName,
      customer_phone: clientPhone,
      start_date: new Date(pickupDate).toISOString(),
      end_date: new Date(returnDate).toISOString(),
      extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
      total_price: totalPrice,
      prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
      deposit_type: depositType,
      deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
      car_id: selectedCarId!,
      fuel_level_out: parseInt(fuelOut) || null,
      fuel_level_in: parseInt(fuelIn) || null,
      odometer_out: parseInt(odometerOut) || null,
      odometer_in: parseInt(odometerIn) || null,
      cleaned_before: cleanedBefore,
      included_items: includedItems,
      notes: notes,
      rating: rating,
    };

    try {
      const { error } = await supabase
        .from('reservations')
        .update(reservationUpdateData)
        .eq('id', reservationData.id);

      if (error) throw error;

      await triggerGasSideEffects({
        ...reservationUpdateData,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('common.success'), 'success');
      setIsEditMode(false);
      onClose();
    } catch (error: any) {
      console.error('Submission error:', error);
      setStatus(t('common.error'), 'error');
      alert(`${t('common.error')}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClientModified = false;
  const handleAddNewClient = () => {};

  const handleDelete = async () => {
    if (!reservationData?.id) return;
    if (confirm(t('reservationDetails.deleteConfirm'))) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservationData.id);
        
        if (error) throw error;
        alert(t('editReservation.updateSuccess'));
        onClose();
      } catch (error: any) {
        console.error('Delete error:', error);
        alert(t('common.error'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleReactivate = async () => {
    if (!reservationData?.id) return;
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'Confirmed' })
        .eq('id', reservationData.id);
      
      if (error) throw error;
      alert(t('reservationDetails.reactivateSuccess'));
      onClose();
    } catch (error: any) {
      alert(t('reservationDetails.reactivateError'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-10 overflow-y-auto no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl industrial-shadow flex flex-col relative my-auto max-h-[95vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 bg-midnight-ink flex justify-between items-center shrink-0">
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">{t('reservationDetails.title')}</h2>
            <div className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] industrial-shadow">{reservationData?.status?.toUpperCase()}</div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-6 py-3 text-white font-bold text-xs uppercase tracking-widest industrial-shadow transition-all ${isEditMode ? 'bg-slate-700' : 'bg-primary'}`}
            >
              {isEditMode ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditMode ? t('editReservation.lock') : t('editReservation.edit')}
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white w-full">
          <ReservationForm 
            t={t}
            availableCars={availableCars}
            selectedCarId={selectedCarId}
            setSelectedCarId={setSelectedCarId}
            setCarBrand={setCarBrand}
            setCarModel={setCarModel}
            setLicensePlate={setLicensePlate}
            setDailyRate={setDailyRate}
            setOdometerOut={setOdometerOut}
            setFuelOut={setFuelOut}
            pickupDate={pickupDate}
            setPickupDate={setPickupDate}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            extendedReturnDate={extendedReturnDate}
            setExtendedReturnDate={setExtendedReturnDate}
            validateDates={validateDates}
            reservationState={{ 
              label: reservationData?.status || 'Active', 
              color: 'text-primary', 
              borderColor: 'border-primary' 
            }}
            duration={duration}
            dailyRate={dailyRate}
            totalPrice={totalPrice}
            clientName={clientName}
            setClientName={setClientName}
            setClientListActive={setClientListActive}
            clientListActive={clientListActive}
            allCustomers={allCustomers}
            isClientModified={isClientModified}
            handleAddNewClient={handleAddNewClient}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            clientId={clientId}
            setClientId={setClientId}
            clientLicense={clientLicense}
            setClientLicense={setClientLicense}
            errors={errors}
            rating={rating}
            setRating={setRating}
            notes={notes}
            setNotes={setNotes}
            notesRef={notesRef}
            prepayment={prepayment}
            setPrepayment={setPrepayment}
            balanceDue={balanceDue}
            depositType={depositType}
            setDepositType={setDepositType}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            odometerOut={odometerOut}
            odometerIn={odometerIn}
            setOdometerIn={setOdometerIn}
            fuelOut={fuelOut}
            fuelIn={fuelIn}
            setFuelIn={setFuelIn}
            cleanedBefore={cleanedBefore}
            setCleanedBefore={setCleanedBefore}
            isAddingItem={isAddingItem}
            setIsAddingItem={setIsAddingItem}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            handleAddItem={handleAddItem}
            includedItems={includedItems}
            handleFileUpload={handleFileUpload}
            handleCreateContract={handleCreateContract}
            isUploading={isUploading}
            isGeneratingContract={isGeneratingContract}
            disabled={!isEditMode}
          />

          {/* Footer */}

          {/* Footer */}
          <div className="px-6 py-8 sm:px-10 bg-midnight-ink flex flex-col gap-8 shrink-0">
            <div className="flex flex-wrap gap-x-12 gap-y-6 items-center text-white border-l-4 border-primary pl-8 py-2">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">{t('reservations.totalAmount')}</p>
                <p className="text-2xl sm:text-3xl font-black">${totalPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">{t('reservations.form.balanceDue')}</p>
                <p className="text-2xl sm:text-3xl font-black text-primary">${balanceDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 w-full">
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-5 text-red-500 font-bold uppercase tracking-[0.2em] border border-red-500/30 hover:bg-red-500/10 transition-colors min-h-[60px] flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('editReservation.delete')}
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
              >
                {t('reservationDetails.close')}
              </button>
              <button 
                onClick={handleReactivate}
                className="px-4 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" /> {t('reservationDetails.reactivate')}
              </button>
              <button 
                onClick={() => { alert(t('reservationDetails.rebookSuccess')); onClose(); }}
                className="px-4 py-5 bg-slate-700 text-white font-bold uppercase tracking-[0.2em] hover:bg-slate-600 transition-colors min-h-[60px]"
              >
                <ArrowRight className="w-4 h-4 inline mr-2" /> {t('reservationDetails.rebook')}
              </button>
              <button 
                disabled={!isFormValid || !isEditMode || isSubmitting}
                onClick={handleConfirm}
                className={`px-4 py-5 bg-white text-midnight-ink font-black uppercase tracking-[0.2em] industrial-shadow transition-all min-h-[60px] flex items-center justify-center gap-2 ${(!isFormValid || !isEditMode || isSubmitting) ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4 inline mr-2" /> {isSubmitting ? t('common.saving') : t('reservationDetails.confirm')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
