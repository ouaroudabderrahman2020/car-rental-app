import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Edit, Lock, Trash2, CheckCircle, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { gasService } from '../lib/gas';
import { useReservations } from '../hooks/useReservations';
import { useVerifiedTime } from '../hooks/useVerifiedTime';
import { useStatus } from '../contexts/StatusContext';
import { fileToBase64 } from '../lib/utils';

import BaseModal from './BaseModal';
import Button1 from './Button1';
import ReservationForm from './ReservationForm';
import ImageToPdf from './tools/ImageToPdf';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  reservationData?: any; // For edit mode
  initialData?: any; // For partial rebooking data in add mode
}

export default function ReservationModal({ 
  isOpen, 
  onClose, 
  mode, 
  reservationData, 
  initialData 
}: ReservationModalProps) {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const isEdit = mode === 'edit';
  const [isEditLocked, setIsEditLocked] = useState(isEdit);

  // Form State
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [extendedReturnDate, setExtendedReturnDate] = useState('');
  const [dailyRate, setDailyRate] = useState<string | number>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientLicense, setClientLicense] = useState('');
  const [prepayment, setPrepayment] = useState<string | number>('');
  const [depositType, setDepositType] = useState('');
  const [depositAmount, setDepositAmount] = useState<string | number>('');
  const [odometerOut, setOdometerOut] = useState('');
  const [odometerIn, setOdometerIn] = useState('');
  const [fuelOut, setFuelOut] = useState('');
  const [fuelIn, setFuelIn] = useState('');
  const [cleanedBefore, setCleanedBefore] = useState('yes');
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  const { createReservation, updateReservation, deleteReservation, loading: isSubmitting } = useReservations();
  const { verifiedTime } = useVerifiedTime();

  // Resources
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ base64Data: string; fileName: string; contentType: string } | null>(null);
  const [showPdfTool, setShowPdfTool] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const navigate = useNavigate();
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Initial Data (Add or Edit)
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && reservationData) {
      setCarBrand(reservationData.carBrand || reservationData.car?.brand || '');
      setCarModel(reservationData.carName?.split(' ')[1] || reservationData.car?.model || '');
      setClientName(reservationData.customer_name || reservationData.client || '');
      setLicensePlate(reservationData.carPlate || reservationData.car?.plate || '');
      setPickupDate(reservationData.start_date?.slice(0, 16) || '');
      setReturnDate(reservationData.end_date?.slice(0, 16) || '');
      setExtendedReturnDate(reservationData.extended_return_date?.slice(0, 16) || '');
      setDailyRate(reservationData.daily_rate || reservationData.car?.daily_rate || 0);
      setClientPhone(reservationData.customer_phone || '');
      setPrepayment(reservationData.prepayment || 0);
      setSelectedCarId(reservationData.car_id || null);
      setOdometerOut(reservationData.odometer_out?.toString() || '');
      setOdometerIn(reservationData.odometer_in?.toString() || '');
      setFuelOut(reservationData.fuel_level_out?.toString() || '');
      setFuelIn(reservationData.fuel_level_in?.toString() || '');
      setDepositType(reservationData.deposit_type || '');
      setDepositAmount(reservationData.deposit_amount || 0);
      setCleanedBefore(reservationData.cleaned_before || 'yes');
      setIncludedItems(reservationData.included_items || []);
      setNotes(reservationData.notes || '');
      setRating(reservationData.rating || 0);
      setClientId(reservationData.customer_id || '');
    } else if (initialData) {
      setCarBrand(initialData.carBrand || initialData.car?.brand || '');
      setCarModel(initialData.carModel || initialData.car?.model || '');
      setLicensePlate(initialData.carPlate || initialData.car?.plate || '');
      setClientName(initialData.customer_name || '');
      setClientPhone(initialData.customer_phone || '');
      setSelectedCarId(initialData.car_id || null);
      setDailyRate(initialData.daily_rate || initialData.car?.daily_rate || '');
      setPrepayment(initialData.prepayment || '');
      setDepositType(initialData.deposit_type || '');
      setDepositAmount(initialData.deposit_amount || '');
      setRating(initialData.rating || 0);
      setNotes(initialData.notes || '');
    } else {
      // RESET
      setCarBrand('');
      setCarModel('');
      setLicensePlate('');
      setPickupDate('');
      setReturnDate('');
      setExtendedReturnDate('');
      setDailyRate('');
      setClientName('');
      setClientPhone('');
      setClientId('');
      setClientLicense('');
      setPrepayment('');
      setDepositType('');
      setDepositAmount('');
      setOdometerOut('');
      setOdometerIn('');
      setFuelOut('');
      setFuelIn('');
      setCleanedBefore('yes');
      setIncludedItems([]);
      setNotes('');
      setRating(0);
      setSelectedCarId(null);
    }
  }, [isOpen, mode, reservationData, initialData]);

  // Initial items
  useEffect(() => {
    if (isOpen && includedItems.length === 0 && !isEdit) {
      setIncludedItems([
        t('reservations.form.includedItemsList.vest'),
        t('reservations.form.includedItemsList.triangle'),
        t('reservations.form.includedItemsList.extinguisher'),
        t('reservations.form.includedItemsList.tire'),
        t('reservations.form.includedItemsList.jack'),
        t('reservations.form.includedItemsList.wrench')
      ]);
    }
  }, [isOpen, t, isEdit]);

  // Resources Fetch
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      const [{ data: cars }, { data: customers }] = await Promise.all([
        supabase.from('cars').select('*').neq('status', 'Decommissioned'),
        supabase.from('customers').select('*')
      ]);
      if (cars) setAvailableCars(cars);
      if (customers) setAllCustomers(customers);
    };
    fetchData();
  }, [isOpen]);

  // Calculations
  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [reservationState, setReservationState] = useState({ 
    label: 'N/A', 
    color: 'bg-slate-200 text-slate-700', 
    borderColor: '#475569' 
  });

  useEffect(() => {
    const calculate = () => {
      const now = verifiedTime;
      const start = new Date(pickupDate);
      const standardEnd = new Date(returnDate);
      const extEnd = extendedReturnDate ? new Date(extendedReturnDate) : null;
      const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : standardEnd;

      if (pickupDate && (returnDate || extendedReturnDate)) {
        if (now < start) {
          setReservationState({ 
            label: 'Reserved', 
            color: 'bg-slate-header text-white', 
            borderColor: '#475569' 
          });
        } else if (now > end) {
          setReservationState({ 
            label: 'Overdue', 
            color: 'bg-red-600 text-white', 
            borderColor: '#DC2626' 
          });
        } else {
          setReservationState({ 
            label: 'Active', 
            color: 'bg-primary text-white', 
            borderColor: '#31A984' 
          });
        }
      }

      if (start.getTime() && end.getTime() && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        const d = Math.floor(totalHours / 24);
        const h = Math.floor(totalHours % 24);
        setDuration(`${d} ${t('reservations.form.days')}, ${h} ${t('reservations.form.hours')}`);

        const billableDays = Math.ceil(totalHours / 24);
        const rate = typeof dailyRate === 'string' ? parseFloat(dailyRate) || 0 : dailyRate;
        const total = billableDays * rate;
        setTotalPrice(total);
        const prepay = typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment;
        setBalanceDue(total - prepay);
      } else {
        setDuration(t('reservations.form.invalidRange'));
        setTotalPrice(0);
        setBalanceDue(0);
      }
    };
    calculate();
  }, [pickupDate, returnDate, extendedReturnDate, dailyRate, prepayment, verifiedTime, t]);

  const validateDates = () => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (pickupDate && returnDate && end <= start) {
      return t('reservations.form.errors.returnBeforePickup');
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStatus(t('reservations.form.processingFile'), 'processing', 0);
    try {
      const base64Data = await fileToBase64(file);
      setPendingFile({ base64Data, fileName: file.name, contentType: file.type });
      setStatus(t('reservations.form.fileReady'), 'success');
    } catch (err) {
      setStatus(t('common.error'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerGasSideEffects = async (resData: any) => {
    const tasks = [];
    tasks.push(gasService.exportData('Reservations', [[
      resData.customer_name, resData.customer_phone, 
      resData.car_brand, resData.car_model, resData.license_plate,
      resData.start_date, resData.end_date, resData.total_price, resData.status
    ]]));
    if (pendingFile) tasks.push(gasService.uploadBase64(pendingFile));
    tasks.push(gasService.generateContract(`Contract_${resData.customer_name.replace(/\s+/g, '_')}`, resData));
    await Promise.allSettled(tasks);
  };

  const handleFormSubmit = async (statusOverride?: 'Completed' | 'Confirmed') => {
    const dateError = validateDates();
    if (dateError) { alert(dateError); return; }

    const newErrors: { [key: string]: string } = {};
    if (!selectedCarId) newErrors.selectedCarId = 'required';
    if (!clientName.trim()) newErrors.clientName = 'required';
    if (!pickupDate) newErrors.pickupDate = 'required';
    if (!returnDate) newErrors.returnDate = 'required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatus(t('common.processingSubmission'), 'processing', 10);

    const baseData = {
      car_id: selectedCarId!,
      customer_name: clientName,
      customer_phone: clientPhone,
      start_date: new Date(pickupDate).toISOString(),
      end_date: new Date(returnDate).toISOString(),
      extended_return_date: extendedReturnDate ? new Date(extendedReturnDate).toISOString() : null,
      status: statusOverride || (isEdit ? reservationData.status : 'Confirmed'),
      total_price: totalPrice,
      prepayment: typeof prepayment === 'string' ? parseFloat(prepayment) || 0 : prepayment,
      deposit_type: depositType,
      deposit_amount: typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount,
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
      if (isEdit) {
        const { error } = await updateReservation(reservationData.id, baseData, reservationData.car_id);
        if (error) throw new Error(error);
      } else {
        const { error } = await createReservation(baseData);
        if (error) throw new Error(error);
      }

      if (statusOverride === 'Completed' && selectedCarId) {
        await supabase.from('cars').update({ 
          status: 'Available',
          odometer: parseInt(odometerIn) || undefined,
          starting_fuel_level: parseInt(fuelIn) || undefined
        }).eq('id', selectedCarId);
      }

      await triggerGasSideEffects({
        ...baseData,
        car_brand: carBrand,
        car_model: carModel,
        license_plate: licensePlate
      });

      setStatus(t('common.success'), 'success');
      onClose();
    } catch (err: any) {
      setStatus(t('common.error'), 'error');
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (confirm(t('editReservation.deleteConfirm'))) {
      const { error } = await deleteReservation(reservationData.id, reservationData.car_id);
      if (!error) onClose();
    }
  };

  const handleCreateContract = async () => {
    if (!isFormValid) return;
    setIsGeneratingContract(true);
    
    const resData = {
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

    const filename = `Contract_${clientName.replace(/\s+/g, '_')}_${new Date().getTime()}`;
    const result = await gasService.generateContract(filename, resData);

    if (result.success) {
      alert(t('reservations.form.contractSuccess', 'Contract generated successfully in Drive!'));
    } else {
      alert(`${t('common.error')}: ${result.error}`);
    }
    setIsGeneratingContract(false);
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      setIncludedItems([...includedItems, newItemName.trim()]);
      setNewItemName('');
    }
    setIsAddingItem(false);
  };

  const handleAddNewClient = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: clientName,
          phone: clientPhone,
          id_card_number: clientId,
          license_number: clientLicense,
          trust_rank: rating || 3
        }])
        .select();
      
      if (error) throw error;
      if (data) {
        setAllCustomers([...allCustomers, data[0]]);
        alert(t('common.clientAdded', 'New client profile created'));
      }
    } catch (error: any) {
      alert(`Error creating client: ${error.message}`);
    }
  };

  const isClientModified = clientName.trim() !== '' && !allCustomers.some(c => c.name === clientName);

  const isFormValid = !!selectedCarId && !!clientName.trim() && !!pickupDate && !!returnDate;

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEdit ? t('editReservation.title') : t('reservations.form.title')}
    >
      <div className="bg-white w-full">
        {isEdit && (
          <div className="px-10 py-4 bg-slate-50 border-b flex justify-end">
             <button 
                onClick={() => setIsEditLocked(!isEditLocked)}
                className={`flex items-center gap-2 px-6 py-2 text-white font-bold text-xs uppercase tracking-widest transition-all ${isEditLocked ? 'bg-primary' : 'bg-slate-700'}`}
              >
                {isEditLocked ? <Edit className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isEditLocked ? t('editReservation.edit') : t('editReservation.lock')}
              </button>
          </div>
        )}

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
          reservationState={reservationState}
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
          setIncludedItems={setIncludedItems}
          handleFileUpload={handleFileUpload}
          handleCreateContract={handleCreateContract}
          isUploading={isUploading}
          isGeneratingContract={isGeneratingContract}
          onOpenPdfTool={() => setShowPdfTool(true)}
          disabled={isEdit && isEditLocked}
        />

        <div className="px-6 py-8 sm:px-10 bg-slate-50 flex flex-col gap-8 shrink-0 border-t border-black">
          <div className="flex flex-wrap gap-x-12 gap-y-6 items-center border-l-4 border-primary pl-8 py-2">
            <div>
              <p className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">{t('reservations.form.totalPriceCalc')}</p>
              <p className="text-2xl sm:text-3xl font-black text-ink">${totalPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">{t('reservations.form.balanceDue')}</p>
              <p className="text-2xl sm:text-3xl font-black text-primary">${balanceDue.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full">
            {isEdit && (
              <Button1 
                onClick={handleDelete}
                className="!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700"
                icon={<Trash2 className="w-5 h-5" />}
              >
                {t('common.delete')}
              </Button1>
            )}
            
            <Button1 
              onClick={onClose}
              className="sm:flex-1 !bg-slate-500 !border-slate-500 hover:!bg-slate-600 hover:!border-slate-600"
            >
              {t('common.cancel')}
            </Button1>

            {!isEdit && (
              <Button1 
                disabled={!isFormValid || isSubmitting}
                onClick={() => handleFormSubmit('Completed')}
                className="sm:flex-1"
              >
                {t('reservations.form.archive')}
              </Button1>
            )}

            {isEdit && reservationData.status !== 'Completed' && (
              <Button1 
                onClick={() => handleFormSubmit('Completed')}
                className="!bg-[#475569] !border-[#475569]"
                icon={<CheckCircle className="w-5 h-5" />}
              >
                {t('reservations.form.archive')}
              </Button1>
            )}

            <Button1 
              disabled={!isFormValid || isSubmitting || (isEdit && isEditLocked)}
              onClick={() => handleFormSubmit()}
              className="sm:flex-[1.5] !bg-primary !border-primary"
              icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            >
              {isSubmitting ? t('common.saving') : (isEdit ? t('common.save') : t('common.confirm'))}
            </Button1>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
