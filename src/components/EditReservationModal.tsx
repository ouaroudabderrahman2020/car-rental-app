import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Phone, CreditCard, 
  Car as CarIcon, Calendar, Monitor, ClipboardList, 
  Upload, Star, Plus, Check, Edit, Lock, Trash2, CheckCircle, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { useReservations } from '../hooks/useReservations';
import { useVerifiedTime } from '../hooks/useVerifiedTime';
import { Reservation, Car as CarType } from '../types';

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: any; // Using any for the expanded data passed from Reservations list
}

export default function EditReservationModal({ isOpen, onClose, reservationData }: EditReservationModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State (initialized from reservationData if provided)
  const [carBrand, setCarBrand] = useState(reservationData?.carBrand || '');
  const [carModel, setCarModel] = useState(reservationData?.car || '');
  const [licensePlate, setLicensePlate] = useState(reservationData?.plate || 'PLATE-01');
  const [pickupDate, setPickupDate] = useState(reservationData?.pickupDate || '2023-10-12T10:00');
  const [returnDate, setReturnDate] = useState(reservationData?.returnDate || '2023-10-15T10:00');
  const [extendedReturnDate, setExtendedReturnDate] = useState(reservationData?.extendedReturnDate || '');
  const [dailyRate, setDailyRate] = useState(reservationData?.rate || 150);
  const [clientName, setClientName] = useState(reservationData?.client || '');
  const [clientPhone, setClientPhone] = useState(reservationData?.phone || '+1 555-0123-456');
  const [clientId, setClientId] = useState(reservationData?.clientId || 'ID-99388271');
  const [clientLicense, setClientLicense] = useState(reservationData?.license || 'DL-A552-8819');
  const [prepayment, setPrepayment] = useState(reservationData?.prepayment || 100);
  const [depositType, setDepositType] = useState(reservationData?.depositType || 'Cash');
  const [depositAmount, setDepositAmount] = useState(reservationData?.depositAmount || 0);
  const [odometerOut, setOdometerOut] = useState(reservationData?.odometerOut || '');
  const [odometerIn, setOdometerIn] = useState(reservationData?.odometerIn || '');
  const [fuelOut, setFuelOut] = useState(reservationData?.fuelOut || '');
  const [fuelIn, setFuelIn] = useState(reservationData?.fuelIn || '');
  const [cleanedBefore, setCleanedBefore] = useState(reservationData?.cleanedBefore || 'yes');
  const [includedItems, setIncludedItems] = useState(reservationData?.includedItems || [
    'Safety Vest', 'Warning Triangle', 'Fire Extinguisher',
    'Spare Tire', 'Lifting Jack', 'Lug Wrench'
  ]);
  const [notes, setNotes] = useState(reservationData?.notes || '');
  const [rating, setRating] = useState(reservationData?.rating || 0);

  // UI State
  const { updateReservation, deleteReservation, loading: isSubmitting } = useReservations();
  const { verifiedTime } = useVerifiedTime();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [availableCars, setAvailableCars] = useState<CarType[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(reservationData?.car_id || null);
  const [carListActive, setCarListActive] = useState(false);
  const [plateListActive, setPlateListActive] = useState(false);
  const [clientListActive, setClientListActive] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateDates = () => {
    if (pickupDate && returnDate) {
      if (new Date(returnDate) <= new Date(pickupDate)) {
        return "Return date must be after pickup date";
      }
      // If updating, we allows past pickup but generally warn if trying to set new future pickup to past
      if (isEditMode && new Date(pickupDate) < new Date(verifiedTime.getTime() - 600000)) {
        // Just a sanity check: if they move the pickup to 10 mins ago, it's fine for "active" edits
      }
    }
    return null;
  };

  const validatePhone = (phone: string) => /^\+?[0-9\s-]{8,20}$/.test(phone);
  const validateId = (id: string) => /^[a-zA-Z0-9-]{5,30}$/.test(id);

  // Calculations
  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [reservationState, setReservationState] = useState({ 
    label: 'ACTIVE', 
    color: 'text-primary', 
    borderColor: 'border-primary' 
  });

  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reservationData) {
      setCarBrand(reservationData.carBrand || '');
      setCarModel(reservationData.car || '');
      setClientName(reservationData.client || '');
      // Update other fields as needed when reservationData changes
      setLicensePlate(reservationData.carPlate || '');
      setPickupDate(reservationData.start_date?.slice(0, 16) || '');
      setReturnDate(reservationData.end_date?.slice(0, 16) || '');
      setDailyRate(reservationData.daily_rate || 0);
      setClientPhone(reservationData.customer_phone || '');
      setPrepayment(reservationData.prepayment || 0);
      setTotalPrice(reservationData.total_price || 0);
      setSelectedCarId(reservationData.car_id || null);
      setOdometerOut(reservationData.odometer_out?.toString() || '');
      setFuelOut(reservationData.fuel_level_out?.toString() || '');
    }
  }, [reservationData]);

  useEffect(() => {
    const fetchCars = async () => {
      const { data } = await supabase
        .from('cars')
        .select('*')
        .neq('status', 'In Maintenance');
      if (data) setAvailableCars(data as CarType[]);
    };
    if (isOpen) fetchCars();
  }, [isOpen]);

  useEffect(() => {
    const calculate = () => {
      const now = verifiedTime;
      const start = new Date(pickupDate);
      const standardEnd = new Date(returnDate);
      const extEnd = extendedReturnDate ? new Date(extendedReturnDate) : null;
      const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : standardEnd;

      // State Calculation
      if (start.getTime() && end.getTime()) {
        if (start > now) {
          setReservationState({ 
            label: 'RESERVED', 
            color: 'text-amber-600', 
            borderColor: 'border-amber-400' 
          });
        } else if (now > end) {
          setReservationState({ 
            label: 'OVERDUE', 
            color: 'text-red-600', 
            borderColor: 'border-red-500' 
          });
        } else {
          setReservationState({ 
            label: 'ACTIVE', 
            color: 'text-primary', 
            borderColor: 'border-primary' 
          });
        }
      }

      // Price and Duration
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

  const isFormValid = clientName.trim() !== '' && pickupDate !== '' && returnDate !== '';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const result = await gasService.uploadFile(file);
    if (result.success) {
      setUploadedDocUrl(result.fileUrl || 'File Uploaded');
      alert('Updated document uploaded successfully.');
    } else {
      alert(`Upload failed: ${result.error}`);
    }
    setIsUploading(false);
  };

  const handleConfirm = async () => {
    if (!isFormValid || !reservationData.id) return;

    // Strict Validation
    const newErrors: { [key: string]: string } = {};
    const dateError = validateDates();
    if (dateError) newErrors.dates = dateError;
    if (clientPhone && !validatePhone(clientPhone)) newErrors.phone = 'Invalid phone format';
    if (clientId && !validateId(clientId)) newErrors.id = 'Invalid ID format';
    if (clientLicense && !validateId(clientLicense)) newErrors.license = 'Invalid license format';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert(newErrors.dates || 'Please fix validation errors before proceeding.');
      return;
    }

    setErrors({});
    
    try {
      const { error } = await updateReservation(
        reservationData.id,
        {
          customer_name: clientName,
          customer_phone: clientPhone,
          start_date: new Date(pickupDate).toISOString(),
          end_date: new Date(returnDate).toISOString(),
          total_price: totalPrice,
          car_id: selectedCarId!,
          fuel_level_out: parseInt(fuelOut) || null,
          odometer_out: parseInt(odometerOut) || null
        },
        reservationData.car_id
      );

      if (error) throw new Error(error);

      alert('Changes Saved Successfully.');
      setIsEditMode(false);
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`Failed to save changes: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if(confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
      const { error } = await deleteReservation(reservationData.id, reservationData.car_id);
      if (error) {
        alert(`Delete failed: ${error}`);
      } else {
        onClose();
      }
    }
  };

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'Completed',
          odometer_in: parseInt(odometerIn) || null,
          fuel_level_in: parseInt(fuelIn) || null
        })
        .eq('id', reservationData.id);
      
      if (error) throw error;

      // Sync car status and odometer
      if (selectedCarId) {
        await supabase
          .from('cars')
          .update({ 
            status: 'Available',
            odometer: parseInt(odometerIn) || undefined,
            starting_fuel_level: parseInt(fuelIn) || undefined
          })
          .eq('id', selectedCarId);
      }

      alert('Reservation marked as completed and vehicle returned to fleet.');
      onClose();
    } catch (error) {
      console.error('Completion error:', error);
      alert('Status update failed');
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">Edit Reservation</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-6 py-3 text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-opacity-90 transition-all ${isEditMode ? 'bg-slate-700' : 'bg-primary'}`}
            >
              {isEditMode ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditMode ? 'Lock' : 'Edit'}
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white w-full">
          {/* Section 1: Car & Schedule */}
          <div className="p-4 sm:p-10 space-y-8">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CarIcon className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Car & Schedule</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Car Brand Selection</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white p-4 min-h-[60px] industrial-shadow uppercase font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    onFocus={() => isEditMode && setCarListActive(true)}
                    onBlur={() => setTimeout(() => setCarListActive(false), 200)}
                    placeholder="Search Brand - Model (Plate)..."
                    disabled={!isEditMode}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  {carListActive && isEditMode && (
                    <div className="combobox-list active">
                      {availableCars.filter(c => 
                        `${c.brand} ${c.model} ${c.plate}`.toLowerCase().includes(carBrand.toLowerCase())
                      ).map(car => (
                        <div key={car.id} className="combobox-item flex justify-between items-center" onClick={() => {
                          setCarBrand(car.brand);
                          setCarModel(car.model);
                          setLicensePlate(car.plate);
                          setDailyRate(car.daily_rate);
                          setSelectedCarId(car.id);
                          setOdometerOut(car.odometer.toString());
                          setFuelOut(car.starting_fuel_level?.toString() || '100');
                        }}>
                          <span>{car.brand} - {car.model} ({car.plate})</span>
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${
                            car.status === 'Available' ? 'bg-primary/20 text-primary' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {car.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Car Model (Read-Only)</label>
                <input 
                  className="w-full bg-gray-50 p-4 min-h-[60px] industrial-shadow uppercase font-bold text-ink/60 disabled:cursor-not-allowed"
                  value={carModel}
                  readOnly
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">License Plate (Read-Only)</label>
                <input 
                  className="w-full bg-gray-50 p-4 min-h-[60px] industrial-shadow uppercase font-bold text-ink/60 disabled:cursor-not-allowed"
                  value={licensePlate}
                  readOnly
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Pick-up Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Return Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Extended Return Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={extendedReturnDate}
                  onChange={(e) => setExtendedReturnDate(e.target.value)}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">State</label>
                <div className={`w-full bg-muted-cream border-l-4 ${reservationState.borderColor} p-4 min-h-[60px] flex items-center font-black uppercase tracking-widest ${reservationState.color}`}>
                  {reservationState.label}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Duration</label>
                <div className="w-full bg-muted-cream border-l-4 border-midnight-ink p-4 min-h-[60px] flex items-center font-bold text-ink/70">
                  {duration}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Daily Rate ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Total Price Calculation ($)</label>
                <div className="w-full bg-muted-mint p-4 min-h-[60px] flex items-center justify-center font-black text-2xl text-ink industrial-shadow border-[1.5px] border-form-border">
                  {totalPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Client Profile */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <User className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Client Profile</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="sm:col-span-2 space-y-2 relative">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Full Name</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white p-4 min-h-[60px] industrial-shadow uppercase disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onFocus={() => isEditMode && setClientListActive(true)}
                    onBlur={() => setTimeout(() => setClientListActive(false), 200)}
                    placeholder="Search client name..."
                    disabled={!isEditMode}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  {clientListActive && isEditMode && (
                    <div className="combobox-list active">
                      {['Johnathan Doe', 'Jane Smith', 'Michael Scott', 'Alexander Pierce'].map(client => (
                        <div key={client} className="combobox-item" onClick={() => setClientName(client)}>{client}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Phone Number</label>
                <input 
                  type="tel" 
                  className={`w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-100 disabled:cursor-not-allowed ${errors.phone ? 'border-2 border-red-500' : ''}`}
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  disabled={!isEditMode}
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">ID Card Number</label>
                <input 
                  className={`w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-100 disabled:cursor-not-allowed ${errors.id ? 'border-2 border-red-500' : ''}`}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={!isEditMode}
                />
                {errors.id && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.id}</p>}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Driving Licence Number</label>
                <input 
                  className={`w-full bg-white p-4 min-h-[60px] industrial-shadow disabled:bg-slate-100 disabled:cursor-not-allowed ${errors.license ? 'border-2 border-red-500' : ''}`}
                  value={clientLicense}
                  onChange={(e) => setClientLicense(e.target.value)}
                  disabled={!isEditMode}
                />
                {errors.license && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.license}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Financial Alignment */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <CreditCard className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Financial Alignment</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Prepayment</label>
                <input 
                  type="number" 
                  className="w-full p-4 text-xl font-bold bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={prepayment}
                  onChange={(e) => setPrepayment(Number(e.target.value))}
                  placeholder="0.00"
                  disabled={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Balance Due</label>
                <div className="py-4 text-2xl font-black text-primary px-4 border-[1.5px] border-transparent">
                  ${balanceDue.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Deposit Type</label>
                <select 
                  className="w-full p-4 bg-white text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={depositType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setDepositType(newType);
                    if (newType === 'None') {
                      setDepositAmount(0);
                    }
                  }}
                  disabled={!isEditMode}
                >
                  <option>None</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div className={`space-y-2 transition-opacity ${depositType === 'None' || !isEditMode ? 'opacity-50' : 'opacity-100'}`}>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Deposit Amt</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                  disabled={depositType === 'None' || !isEditMode}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Logistics Tracking */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Monitor className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Logistics Tracking</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Odometer Out', val: odometerOut, setter: setOdometerOut, placeholder: 'KM' },
                { label: 'Odometer In', val: odometerIn, setter: setOdometerIn, placeholder: 'KM' },
                { label: 'Fuel Level Out (%)', val: fuelOut, setter: setFuelOut, placeholder: '%' },
                { label: 'Fuel Level In (%)', val: fuelIn, setter: setFuelIn, placeholder: '%' },
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">{field.label}</label>
                  <input 
                    className="w-full p-4 bg-white text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={field.val}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    disabled={!isEditMode}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Details & Condition */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <ClipboardList className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Details & Condition</h3>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Cleaned Before</label>
                <select 
                  className="w-full bg-white p-4 min-h-[60px] industrial-shadow text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={cleanedBefore}
                  onChange={(e) => setCleanedBefore(e.target.value)}
                  disabled={!isEditMode}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Included Items</label>
                {isEditMode && (
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-midnight-ink text-white font-bold text-xs uppercase tracking-widest industrial-shadow hover:bg-ink transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isAddingItem && isEditMode && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-2 flex-wrap"
                  >
                    <input 
                      className="flex-1 p-3 text-sm uppercase industrial-shadow"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="New item name..."
                      autoFocus
                    />
                    <button 
                      onClick={handleAddItem}
                      className="px-4 py-3 bg-primary text-white font-bold text-xs uppercase tracking-widest industrial-shadow flex items-center justify-center min-w-[50px]"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsAddingItem(false)}
                      className="px-4 py-3 bg-slate-200 text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {includedItems.map((item: string) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer bg-white p-4 industrial-shadow border-[1.5px] border-form-border">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-6 h-6 border-2 border-midnight-ink text-primary focus:ring-0 rounded-none disabled:bg-slate-100 disabled:cursor-not-allowed" 
                      disabled={!isEditMode}
                    />
                    <span className="text-sm font-bold uppercase">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Condition Feedback</label>
                <div className={`flex gap-2 text-midnight-ink transition-opacity ${!isEditMode ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button 
                      key={val}
                      onClick={() => isEditMode && setRating(val)}
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

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] bg-midnight-ink/5 px-2 py-1 inline-block text-midnight-ink">Notes</label>
                <textarea 
                  className="w-full bg-white p-4 min-h-[100px] industrial-shadow resize-none overflow-hidden disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (notesRef.current) {
                      notesRef.current.style.height = 'auto';
                      notesRef.current.style.height = notesRef.current.scrollHeight + 'px';
                    }
                  }}
                  ref={notesRef}
                  placeholder="Enter specific observations..."
                  disabled={!isEditMode}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Documentation */}
          <div className="p-4 sm:p-10 space-y-8 border-t border-muted-cream">
            <div className="section-header-rule">
              <div className="section-header-content">
                <Upload className="w-6 h-6 text-midnight-ink" />
                <h3 className="text-lg font-black text-midnight-ink uppercase tracking-[0.2em]">Documentation</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-midnight-ink uppercase">
              <div className="relative">
                <input 
                  type="file" 
                  id="edit-contract-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={!isEditMode}
                />
                <label 
                  htmlFor="edit-contract-upload"
                  className={`flex items-center gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink font-black text-sm uppercase tracking-[0.2em] industrial-shadow transition-all cursor-pointer ${!isEditMode || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted-mint'}`}
                >
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  {isUploading ? 'Uploading...' : 'Update Contract PDF'}
                </label>
              </div>

              {uploadedDocUrl && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 text-primary border border-primary/20">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest text-midnight-ink">New Doc Ready</span>
                </div>
              )}

              <button 
                disabled={!isEditMode}
                className={`flex items-center gap-3 px-8 py-5 bg-muted-cream border-2 border-midnight-ink font-black text-sm uppercase tracking-[0.2em] industrial-shadow transition-all ${!isEditMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted-mint'}`}
              >
                <Monitor className="w-6 h-6" /> Images to PDF
              </button>
            </div>
          </div>

          {/* Footer Card */}
          <div className="px-6 py-8 sm:px-10 bg-midnight-ink flex flex-col gap-8 shrink-0">
            <div className="flex flex-wrap gap-x-12 gap-y-6 items-center text-white border-l-4 border-primary pl-8 py-2">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Total Price</p>
                <p className="text-2xl sm:text-3xl font-black">${totalPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Balance Due</p>
                <p className="text-2xl sm:text-3xl font-black text-primary">${balanceDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
              <button 
                onClick={handleDelete}
                className="px-4 py-5 text-red-500 font-bold uppercase tracking-[0.2em] border border-red-500/30 hover:bg-red-500/10 transition-colors min-h-[60px]"
              >
                <Trash2 className="w-4 h-4 inline mr-2" /> DELETE
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-5 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/20 min-h-[60px]"
              >
                CANCEL
              </button>
              <button 
                onClick={handleComplete}
                className="px-4 py-5 bg-slate-700 text-white font-bold uppercase tracking-[0.2em] hover:bg-slate-600 transition-colors min-h-[60px]"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" /> COMPLETED
              </button>
              <button 
                disabled={!isFormValid || !isEditMode || isSubmitting}
                onClick={handleConfirm}
                className={`px-4 py-5 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow transition-all min-h-[60px] flex items-center justify-center gap-2 ${(!isFormValid || !isEditMode || isSubmitting) ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'SAVING...' : 'CONFIRM CHANGES'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
