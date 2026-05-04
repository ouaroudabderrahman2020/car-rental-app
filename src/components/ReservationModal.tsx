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
import ImageToPdf from './tools/ImageToPdf';
import Field1 from './Field1';
import FormSection from './FormSection';

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

  const handlePdfToolAssign = async (pdfResults: any[]) => {
    if (pdfResults.length === 0) return;
    try {
      const result = pdfResults[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setPendingFile({
          base64Data,
          fileName: result.name,
          contentType: 'application/pdf'
        });
        setShowPdfTool(false);
      };
      reader.readAsDataURL(result.blob);
    } catch (err) {
      console.error('Error assigning PDF tool result:', err);
    }
  };

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
        supabase.from('cars').select('id, brand, model, plate, status, daily_rate, odometer, starting_fuel_level').neq('status', 'Decommissioned'),
        supabase.from('customers').select('id, name, phone, id_card_number, license_number, trust_rank')
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
    setStatus("PROCESSING FILE...", 'processing', 0);
    try {
      const base64Data = await fileToBase64(file);
      setPendingFile({ base64Data, fileName: file.name, contentType: file.type });
      setStatus("FILE READY FOR UPLOAD", 'success');
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
    if (dateError) { 
      setStatus(dateError, 'error'); 
      return; 
    }

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
    setStatus("SAVING RESERVATION...", 'processing', 0);

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

      setStatus("RESERVATION SAVED SUCCESSFULLY", 'success');
      onClose();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`, 'error');
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
    setStatus("GENERATING CONTRACT...", 'processing', 0);
    
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
      setStatus("CONTRACT GENERATED SUCCESSFULLY", 'success');
    } else {
      setStatus(`ERROR: ${result.error}`, 'error');
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
        setStatus(t('common.clientAdded', 'New client profile created'), 'success');
      }
    } catch (error: any) {
      setStatus(`Error creating client: ${error.message}`, 'error');
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
              error={errors.selectedCarId ? t('common.required', 'Required') : ''}
              className="flex-1 min-w-[200px] max-w-[280px]"
              disabled={isEdit && isEditLocked}
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
              error={errors.pickupDate ? t('common.required', 'Required') : ''}
              className="flex-1 min-w-[200px] max-w-[280px]"
              disabled={isEdit && isEditLocked}
              required
            />

            <div className="flex-1 min-w-[200px] max-w-[280px] space-y-0">
              <Field1 
                label={t('reservations.form.returnDate')}
                type="datetime-local"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                error={errors.returnDate ? t('common.required', 'Required') : ''}
                disabled={isEdit && isEditLocked}
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
                disabled={isEdit && isEditLocked}
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
              disabled={isEdit && isEditLocked}
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
                    onFocus={() => !(isEdit && isEditLocked) && setClientListActive(true)}
                    onBlur={() => setTimeout(() => setClientListActive(false), 200)}
                    placeholder={t('reservations.form.clientPlaceholder')}
                    error={errors.clientName ? t('common.required', 'Required') : ''}
                    disabled={isEdit && isEditLocked}
                    required
                  />
                </div>
                {isClientModified && !(isEdit && isEditLocked) && (
                  <button 
                    onClick={handleAddNewClient}
                    className="absolute right-0 top-[6px] px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest border border-black hover:bg-ink transition-colors flex items-center gap-1 z-20"
                  >
                    <Plus className="w-3 h-3" /> {t('common.add', 'Add')}
                  </button>
                )}
              </div>
              <div className="relative">
                {!(isEdit && isEditLocked) && <Search className="absolute end-4 top-[-30px] text-ink/40 pointer-events-none" />}
                {clientListActive && !(isEdit && isEditLocked) && (
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
              disabled={isEdit && isEditLocked}
              style={{ zIndex: 40 }}
            />

            <Field1 
              label={t('reservations.form.idCardNumber')}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1 min-w-[200px] max-w-[280px]"
              disabled={isEdit && isEditLocked}
              style={{ zIndex: 30 }}
            />

            <div className="flex-1 min-w-[200px] max-w-[280px]" style={{ zIndex: 20 }}>
              <Field1 
                label={t('reservations.form.licenseNumber')}
                value={clientLicense}
                onChange={(e) => setClientLicense(e.target.value)}
                disabled={isEdit && isEditLocked}
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
              disabled={isEdit && isEditLocked}
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
              disabled={isEdit && isEditLocked}
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
              disabled={depositType === 'None' || (isEdit && isEditLocked)}
              className={`flex-1 min-w-[200px] max-w-[280px] ${depositType === 'None' || (isEdit && isEditLocked) ? 'opacity-50' : ''}`}
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
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                className="flex-1 min-w-[200px] max-w-[280px]"
                disabled={isEdit && isEditLocked}
              />
            ))}
          </FormSection>
        </div>

        {/* Section 5: Ranking and Feedback */}
        <div className="p-4 sm:p-10">
          <FormSection title={t('reservations.form.rankingFeedback', 'Ranking and Feedback')} style={{ zIndex: 30 }}>
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink border border-black">{t('reservations.form.clientRanking', 'Client Ranking')}</label>
              <div className={`flex gap-2 text-midnight-ink ${isEdit && isEditLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button 
                    key={val}
                    onClick={() => setRating(val)}
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
                disabled={isEdit && isEditLocked}
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
              disabled={isEdit && isEditLocked}
            >
              <option value="">{t('common.select', 'Select...')}</option>
              <option value="yes">{t('common.yes')}</option>
              <option value="no">{t('common.no')}</option>
            </Field1>

            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink border border-black">{t('reservations.form.includedItems')}</label>
                {!(isEdit && isEditLocked) && (
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
                {isAddingItem && !(isEdit && isEditLocked) && (
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
                  <label key={item} className={`flex items-center gap-3 bg-white p-4 border border-black ${isEdit && isEditLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input 
                      type="checkbox" 
                      checked={includedItems.includes(item)}
                      onChange={() => {
                        if (includedItems.includes(item)) {
                          setIncludedItems(includedItems.filter(i => i !== item));
                        } else {
                          setIncludedItems([...includedItems, item]);
                        }
                      }}
                      className="w-6 h-6 border-2 border-black text-primary focus:ring-0 rounded-none bg-white font-bold disabled:opacity-50" 
                      disabled={isEdit && isEditLocked}
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
                disabled={isGeneratingContract || (isEdit && isEditLocked)}
                icon={isGeneratingContract ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                type="button"
              >
                {isGeneratingContract ? t('reservations.form.generating', 'Generating...') : t('reservations.form.createContract', 'Create Contract')}
              </Button1>

              <Button1 
                onClick={() => setShowPdfTool(true)}
                icon={<Monitor className="w-5 h-5" />}
                type="button"
                disabled={isEdit && isEditLocked}
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
                  disabled={isEdit && isEditLocked}
                />
                <Button1 
                  onClick={() => document.getElementById('contract-upload')?.click()}
                  disabled={isUploading || (isEdit && isEditLocked)}
                  icon={isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  type="button"
                >
                  {isUploading ? t('reservations.form.uploading') : t('reservations.form.uploadPdf', 'Upload PDF')}
                </Button1>
              </div>
            </div>
            {/* The Pdf Tool itself */}
            <AnimatePresence>
                {showPdfTool && (
                    <BaseModal isOpen={showPdfTool} onClose={() => setShowPdfTool(false)} title="PDF Tool">
                        <ImageToPdf onAssign={handlePdfToolAssign} />
                    </BaseModal>
                )}
            </AnimatePresence>
          </FormSection>
        </div>
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
