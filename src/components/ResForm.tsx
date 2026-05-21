import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Upload, User, CreditCard, Monitor, X, ChevronDown, CheckCircle, Sparkles, XCircle, Loader2, AlertCircle, Plus, RotateCcw, Car as CarIcon, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDriveImageUrl } from '../lib/gas';
import { fileToBase64 } from '../lib/utils';
import { uploadFile } from '../lib/storage';
import { useReservations } from '../hooks/useReservations';
import ClientModal from './ClientModal';
import BaseModal from './BaseModal';
import ItemSection from './itemSection';

export interface ReservationFormData {
  clientSearchQuery: string;
  clientName: string;
  clientPhone: string;
  clientId: string;
  clientLicense: string;
  pickupDate: string;
  returnDate: string;
  extendedReturnDate: string;
  dailyRate: number;
  prepayment: number;
  prepaymentType: 'fully_paid' | 'amount';
  depositType: string;
  depositAmount: number;
  odometerOut: string;
  odometerIn: string;
  fuelOut: string;
  fuelIn: string;
  cleanedBefore: string;
  includedItems: string[];
  notes: string;
  carBrand: string;
  carModel: string;
  licensePlate: string;
  totalPrice: number;
  balanceDue: number;
  duration: string;
  reservationStateLabel: string;
  reservationStateColor: string;
  selectedCarId: string | null;
  reservationStatus?: string;
}

interface ResFormProps {
  reservation?: Partial<ReservationFormData> | null;
  onChange: (data: Partial<ReservationFormData>) => void;
  onSaved?: () => void;
  mode?: 'add' | 'edit';
  editId?: string | null;
}

const InputField = (props: any) => {
  const { label: _, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-500 ${props.className || ''}`}
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

export default function ResForm({ reservation, onChange, onSaved, mode = 'add', editId = null }: ResFormProps) {
  const { t } = useTranslation();
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [isClientSearchListActive, setIsClientSearchListActive] = useState(false);

  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [isCarSelectorOpen, setIsCarSelectorOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [isClientViewModalOpen, setIsClientViewModalOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [docFiles, setDocFiles] = useState<{
    vehicle_state: any[];
    paper_contract: any[];
  }>({
    vehicle_state: [],
    paper_contract: [],
  });
  const { createReservation, updateReservation } = useReservations();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [duration, setDuration] = useState('0 Days, 0 Hours');
  const [totalPrice, setTotalPrice] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [reservationState, setReservationState] = useState({
    label: 'measuring...',
    color: 'bg-slate-200 text-slate-700',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cars }, { data: customers }] = await Promise.all([
        supabase.from('cars').select('id, brand, model, plate, status, daily_rate, odometer, starting_fuel_level, image_url, essentials').neq('status', 'Decommissioned'),
        supabase.from('customers').select('*')
      ]);
      if (cars) setAvailableCars(cars);
      if (customers) setAllCustomers(customers);
    };
    fetchData();
  }, []);

  const handleRegisterClient = async () => {
    if (!reservation?.clientName || !reservation?.clientId || !reservation?.clientLicense) return;
    setIsRegistering(true);
    setRegistrationStatus(null);
    try {
      const { data: existingClients, error: checkError } = await supabase
        .from('customers')
        .select('national_id, license_number')
        .or(`national_id.eq.${reservation.clientId},license_number.eq.${reservation.clientLicense}`);
      if (checkError) throw checkError;
      if (existingClients && existingClients.length > 0) {
        const idExists = existingClients.some(c => c.national_id === reservation.clientId);
        const licenseExists = existingClients.some(c => c.license_number === reservation.clientLicense);
        let msg = "";
        if (idExists && licenseExists) msg = "id card and driving number already exist";
        else if (idExists) msg = "id card already exist";
        else msg = "driving number already exist";
        setRegistrationStatus({ type: 'warning', message: msg });
        setIsRegistering(false);
        return;
      }
      const { error: insertError } = await supabase
        .from('customers')
        .insert([{
          name: reservation.clientName,
          national_id: reservation.clientId,
          license_number: reservation.clientLicense,
          phone: reservation.clientPhone || '',
          trust_rank: 3,
          is_blacklisted: false
        }]);
      if (insertError) throw insertError;
      setRegistrationStatus({ type: 'success', message: 'client added' });
      const { data: updatedCustomers } = await supabase.from('customers').select('*');
      if (updatedCustomers) setAllCustomers(updatedCustomers);
    } catch (err) {
      console.error(err);
      setRegistrationStatus({ type: 'error', message: 'error happened, try again' });
    } finally {
      setIsRegistering(false);
    }
  };

  const isRegisterEnabled = !!(reservation?.clientName?.trim() && reservation?.clientId?.trim() && reservation?.clientLicense?.trim() && !selectedCustomer);

  const handleResetCustomerSection = () => {
    setSelectedCustomer(null);
    setRegistrationStatus(null);
    onChange({
      ...(reservation || {}),
      clientSearchQuery: '',
      clientName: '',
      clientPhone: '',
      clientId: '',
      clientLicense: '',
    } as Partial<ReservationFormData>);
  };

  const set = (field: string, value: any) => {
    onChange({ ...(reservation || {}), [field]: value } as Partial<ReservationFormData>);
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFileUploadList = async (key: keyof typeof docFiles, e: any) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = [...docFiles[key]];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await fileToBase64(file);
        newFiles.push({ base64Data, name: file.name, contentType: file.type });
      } catch (err) {
        console.error('File conversion error:', err);
      }
    }
    setDocFiles(prev => ({ ...prev, [key]: newFiles }));
  };

  const handleRemoveFile = (key: keyof typeof docFiles, index: number) => {
    const newFiles = [...docFiles[key]];
    newFiles.splice(index, 1);
    setDocFiles(prev => ({ ...prev, [key]: newFiles }));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!reservation?.clientName?.trim()) newErrors.clientName = 'required';
    if (!reservation?.clientId?.trim()) newErrors.clientId = 'required';
    if (!reservation?.clientLicense?.trim()) newErrors.clientLicense = 'required';
    if (!reservation?.selectedCarId) newErrors.selectedCarId = 'required';
    if (!reservation?.pickupDate) newErrors.pickupDate = 'required';
    if (!reservation?.returnDate) newErrors.returnDate = 'required';
    if (reservation?.dailyRate === undefined || reservation?.dailyRate === null || reservation?.dailyRate === 0) newErrors.dailyRate = 'required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDates = () => {
    const start = new Date(reservation?.pickupDate || '');
    const end = new Date(reservation?.returnDate || '');
    if (reservation?.pickupDate && reservation?.returnDate && end <= start) {
      return t('reservations.form.errors.returnBeforePickup', 'Return date must be after pickup date');
    }
    return null;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const dateError = validateDates();
    if (dateError) {
      setErrors(prev => ({ ...prev, returnDate: dateError }));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const baseData: any = {
      car_id: reservation?.selectedCarId || undefined,
      customer_name: reservation?.clientName || '',
      customer_phone: reservation?.clientPhone || '',
      start_date: reservation?.pickupDate ? new Date(reservation.pickupDate).toISOString() : undefined,
      end_date: reservation?.returnDate ? new Date(reservation.returnDate).toISOString() : undefined,
      extended_return_date: reservation?.extendedReturnDate ? new Date(reservation.extendedReturnDate).toISOString() : null,
      status: (mode === 'edit' && reservation?.reservationStatus) ? reservation.reservationStatus : 'Confirmed',
      total_price: totalPrice,
      prepayment: reservation?.prepayment || 0,
      deposit_type: reservation?.depositType || null,
      deposit_amount: reservation?.depositAmount || 0,
      odometer_out: reservation?.odometerOut ? parseInt(reservation.odometerOut, 10) : undefined,
      odometer_in: reservation?.odometerIn ? parseInt(reservation.odometerIn, 10) : undefined,
      fuel_level_out: reservation?.fuelOut ? parseInt(reservation.fuelOut, 10) : undefined,
      fuel_level_in: reservation?.fuelIn ? parseInt(reservation.fuelIn, 10) : undefined,
      cleaned_before: reservation?.cleanedBefore || null,
      included_items: reservation?.includedItems || [],
      notes: reservation?.notes || null,
    };

    try {
      let result;
      if (mode === 'edit' && editId) {
        result = await updateReservation(editId, baseData);
      } else {
        result = await createReservation(baseData);
      }

      if (result.error) throw new Error(result.error);

      const resData = result.data?.[0];
      if (resData?.id) {
        const resFolderName = `${resData.id}_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_');
        const tasks: Promise<any>[] = [];
        Object.entries(docFiles).forEach(([key, fileList]) => {
          (fileList as any[]).forEach((fileObj: any) => {
            tasks.push(
              uploadFile('reservation-files', fileObj.base64Data, `${key}_${fileObj.name}`, fileObj.contentType, resFolderName)
            );
          });
        });
        await Promise.allSettled(tasks);
      }

      onSaved?.();
    } catch (err: any) {
      setSaveError(err.message || 'Error saving reservation');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const pickup = reservation?.pickupDate;
    const ret = reservation?.returnDate;
    const ext = reservation?.extendedReturnDate;
    const rate = reservation?.dailyRate;
    const prepay = reservation?.prepayment;
    const prepayType = reservation?.prepaymentType;

    const now = new Date();
    const start = new Date(pickup || '');
    const standardEnd = new Date(ret || '');
    const extEnd = ext ? new Date(ext) : null;
    const end = (extEnd && !isNaN(extEnd.getTime())) ? extEnd : standardEnd;

    if (pickup && (ret || ext)) {
      if (now < start) {
        setReservationState({ label: 'Reserved', color: 'bg-slate-header text-white' });
      } else if (now > end) {
        setReservationState({ label: 'Overdue', color: 'bg-red-600 text-white' });
      } else {
        setReservationState({ label: 'Active', color: 'bg-primary text-white' });
      }
    }

    if (start.getTime() && end.getTime() && end > start) {
      const diffMs = end.getTime() - start.getTime();
      const totalHours = diffMs / (1000 * 60 * 60);
      const d = Math.floor(totalHours / 24);
      const h = Math.floor(totalHours % 24);
      setDuration(`${d} ${t('reservations.form.days', 'Days')}, ${h} ${t('reservations.form.hours', 'Hours')}`);

      const billableDays = Math.ceil(totalHours / 24);
      const dailyRateNum = typeof rate === 'number' ? rate : 0;
      const total = billableDays * dailyRateNum;
      setTotalPrice(total);
      const effectivePrepay = prepayType === 'fully_paid' ? total : (typeof prepay === 'number' ? prepay : 0);
      setBalanceDue(total - effectivePrepay);
    } else {
      setDuration(t('reservations.form.invalidRange', 'Invalid duration'));
      setTotalPrice(0);
      setBalanceDue(0);
      if (!pickup && !ret) {
        setReservationState({ label: 'measuring...', color: 'bg-slate-200 text-slate-700' });
      }
    }
  }, [
    reservation?.pickupDate,
    reservation?.returnDate,
    reservation?.extendedReturnDate,
    reservation?.dailyRate,
    reservation?.prepayment,
    reservation?.prepaymentType,
    t,
  ]);

  const sections = [
    {
      title: t('reservations.form.customer', 'Customer'),
      icon: <User className="w-4 h-4" />,
      fields: [
        {
          label: t('reservations.form.searchClient', 'Search Client'),
          input: (
            <div className="flex flex-col relative w-full">
              <div className="relative group w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
                <input
                  type="text"
                  value={reservation?.clientSearchQuery || ''}
                  onChange={(e) => {
                    set('clientSearchQuery', e.target.value);
                    setIsClientSearchListActive(e.target.value.length > 0);
                  }}
                  onFocus={() => (reservation?.clientSearchQuery?.length || 0) > 0 && setIsClientSearchListActive(true)}
                  onBlur={() => setTimeout(() => setIsClientSearchListActive(false), 200)}
                  placeholder={t('reservations.form.searchPlaceholder', 'Type name, ID or license to search...')}
                  className="w-full h-9 bg-white border border-slate-200 rounded-[12px] pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all truncate"
                />
                {reservation?.clientSearchQuery && (
                  <button
                    onClick={() => {
                      set('clientSearchQuery', '');
                      setIsClientSearchListActive(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all z-20"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <AnimatePresence>
                  {isClientSearchListActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-[calc(100%+8px)] left-0 w-full z-[100] bg-white border-2 border-black rounded-[12px] shadow-2xl overflow-hidden overflow-y-auto max-h-64"
                    >
                      {allCustomers.filter(c =>
                        c.name.toLowerCase().includes((reservation?.clientSearchQuery || '').toLowerCase()) ||
                        (c.national_id || '').toLowerCase().includes((reservation?.clientSearchQuery || '').toLowerCase()) ||
                        (c.license_number || '').toLowerCase().includes((reservation?.clientSearchQuery || '').toLowerCase())
                      ).map(customer => (
                        <div
                          key={customer.id}
                          className="px-4 py-2 text-sm font-bold border-b border-black/5 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors group"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            onChange({
                              ...(reservation || {}),
                              clientName: customer.name,
                              clientPhone: customer.phone_number || customer.phone || '',
                              clientId: customer.national_id || '',
                              clientLicense: customer.license_number || '',
                              clientSearchQuery: customer.name,
                            } as Partial<ReservationFormData>);
                            setIsClientSearchListActive(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-black group-hover:text-blue-600 transition-colors uppercase text-[13px] leading-tight">{customer.name}</span>
                            <div className="flex items-center gap-4 text-[10px] text-black/40 font-black uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> {customer.national_id || '---'}</span>
                              <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> {customer.license_number || '---'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ),
        },
        ...(selectedCustomer
          ? [
              {
                label: t('reservations.form.fullName', 'Full Name'),
                input: (
                  <button
                    onClick={() => setIsClientViewModalOpen(true)}
                    className="w-full h-9 bg-blue-50 border border-blue-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-blue-900 hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                  >
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate uppercase">{reservation?.clientName || ''}</span>
                  </button>
                ),
              },
              {
                label: t('reservations.form.idCardNumber', 'ID Card Number'),
                input: (
                  <button
                    onClick={() => setIsClientViewModalOpen(true)}
                    className="w-full h-9 bg-blue-50 border border-blue-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-blue-900 hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                  >
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate uppercase">{reservation?.clientId || ''}</span>
                  </button>
                ),
              },
              {
                label: t('reservations.form.licenseNumber', 'License Number'),
                input: (
                  <button
                    onClick={() => setIsClientViewModalOpen(true)}
                    className="w-full h-9 bg-blue-50 border border-blue-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-blue-900 hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                  >
                    <Monitor className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate uppercase">{reservation?.clientLicense || ''}</span>
                  </button>
                ),
              },
            ]
          : [
              {
              label: t('reservations.form.fullName', 'Full Name'),
              required: true,
              input: (
                <div className="flex">
                  <InputField
                    type="text"
                    value={reservation?.clientName || ''}
                    onChange={(e: any) => set('clientName', e.target.value)}
                    placeholder={t('reservations.form.clientPlaceholder', 'Enter client name...')}
                    className={`flex-1 min-w-0 ${errors.clientName ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                  />
                    <button
                      type="button"
                      onClick={() => set('clientName', reservation?.clientSearchQuery || '')}
                      className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                      title="Copy from search"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
                    </button>
                  </div>
                ),
              },
              {
              label: t('reservations.form.idCardNumber', 'ID Card Number'),
              required: true,
              input: (
                <div className="flex">
                  <InputField
                    type="text"
                    value={reservation?.clientId || ''}
                    onChange={(e: any) => set('clientId', e.target.value)}
                    placeholder={t('reservations.form.idPlaceholder', 'ID Card...')}
                    className={`flex-1 min-w-0 ${errors.clientId ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                  />
                    <button
                      type="button"
                      onClick={() => set('clientId', reservation?.clientSearchQuery || '')}
                      className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
                    </button>
                  </div>
                ),
              },
              {
              label: t('reservations.form.licenseNumber', 'License Number'),
              required: true,
              input: (
                <div className="flex">
                  <InputField
                    type="text"
                    value={reservation?.clientLicense || ''}
                    onChange={(e: any) => set('clientLicense', e.target.value)}
                    placeholder={t('reservations.form.licensePlaceholder', 'License Num...')}
                    className={`flex-1 min-w-0 ${errors.clientLicense ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                  />
                    <button
                      type="button"
                      onClick={() => set('clientLicense', reservation?.clientSearchQuery || '')}
                      className="px-3 bg-slate-50 border border-slate-200 border-l-0 rounded-r-[12px] text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
                    </button>
                  </div>
                ),
              },
            ]
        ),
        {
          label: '',
          input: (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handleResetCustomerSection}
                  disabled={isRegistering}
                  className="h-9 px-4 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border border-slate-200 transition-all flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('common.reset', 'Reset')}
                </button>
                <button
                  onClick={handleRegisterClient}
                  disabled={!isRegisterEnabled || isRegistering}
                  className={`h-9 px-6 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                    !isRegisterEnabled
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-[#0066FF] text-white border-[#0066FF] hover:bg-blue-700'
                  }`}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {t('common.processing', 'Processing...')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      {t('reservations.form.registerClientButton', 'Register')}
                    </>
                  )}
                </button>
              </div>
              {registrationStatus && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border text-[10px] font-bold uppercase tracking-wider ${
                  registrationStatus.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                  registrationStatus.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                  'bg-red-50 border-red-500 text-red-700'
                }`}>
                  {registrationStatus.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {registrationStatus.message}
                </div>
              )}
            </div>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.schedule', 'Schedule'),
      icon: <Search className="w-4 h-4" />,
      fields: [
        {
          label: t('reservations.form.carSelection', 'Car Selection'),
          required: true,
          input: (
            <button
              type="button"
              onClick={() => setIsCarSelectorOpen(true)}
              className={`w-full h-9 bg-white border border-slate-200 rounded-[12px] px-3 flex items-center justify-between text-sm group hover:bg-slate-50 transition-all ${errors.selectedCarId ? 'border-red-500 ring-2 ring-red-100' : ''}`}
            >
              <div className="flex items-center gap-2 truncate">
                <CarIcon className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate text-slate-900 font-medium">
                  {reservation?.selectedCarId && reservation?.licensePlate
                    ? `${reservation.licensePlate} - ${reservation.carBrand || ''} ${reservation.carModel || ''}`
                    : t('reservations.form.selectCar', 'Select Car')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ),
        },
        { label: t('reservations.form.pickupDate', 'Pick-up Date & Time'), required: true, input: <InputField type="datetime-local" value={reservation?.pickupDate || ''} onChange={(e: any) => set('pickupDate', e.target.value)} className={errors.pickupDate ? 'border-red-500 ring-2 ring-red-100' : ''} /> },
        {
          label: t('reservations.form.returnDate', 'Return Date & Time'),
          required: true,
          input: (
            <div className="flex flex-col gap-1 w-full">
              <InputField type="datetime-local" value={reservation?.returnDate || ''} onChange={(e: any) => set('returnDate', e.target.value)} className={errors.returnDate ? 'border-red-500 ring-2 ring-red-100' : ''} />
              {validateDates() && reservation?.returnDate && reservation?.pickupDate && new Date(reservation.returnDate) <= new Date(reservation.pickupDate) && (
                <span className="text-[10px] font-semibold text-red-500">{validateDates()}</span>
              )}
            </div>
          ),
        },
        {
          label: t('reservations.form.extendedReturn', 'Extended Return'),
          input: (
            <div className="flex flex-col gap-1 w-full">
              <InputField type="datetime-local" value={reservation?.extendedReturnDate || ''} onChange={(e: any) => set('extendedReturnDate', e.target.value)} />
              {validateDates() && reservation?.extendedReturnDate && reservation?.returnDate && new Date(reservation.extendedReturnDate) <= new Date(reservation.returnDate) && (
                <span className="text-[10px] font-semibold text-red-500">{validateDates()}</span>
              )}
            </div>
          ),
        },
        {
          label: t('reservations.form.state', 'RESERVATION STATE'),
          input: (
            <div className={`h-9 flex items-center justify-center rounded-[12px] ${reservationState.color}`}>
              <span className="text-[11px] font-black uppercase tracking-widest">
                {reservationState.label}
              </span>
            </div>
          ),
        },
        {
          label: t('reservations.form.duration', 'Duration'),
          input: (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 font-medium">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {duration}
            </div>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.billing', 'Billing'),
      icon: <CreditCard className="w-4 h-4" />,
      fields: [
        { label: t('reservations.form.dailyRate', 'Daily Rate'), required: true, input: <InputField type="number" value={reservation?.dailyRate || ''} onChange={(e: any) => set('dailyRate', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" className={errors.dailyRate ? 'border-red-500 ring-2 ring-red-100' : ''} /> },
        {
          label: t('reservations.form.totalPriceCalc', 'Total Price'),
          input: (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[12px] px-3 py-2 text-sm text-slate-900 font-semibold">
              <CreditCard className="w-4 h-4 text-slate-400" />
              {`${totalPrice.toFixed(2)} DH`}
            </div>
          ),
        },
        {
          label: t('reservations.form.prepayment', 'Prepayment'),
          input: (
            <div className="flex flex-col gap-2">
              <div className="flex border border-slate-200 rounded-[12px] overflow-hidden bg-white">
                <select
                  value={reservation?.prepaymentType || 'fully_paid'}
                  onChange={(e: any) => {
                    set('prepaymentType', e.target.value);
                    if (e.target.value === 'fully_paid') set('prepayment', 0);
                  }}
                  className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="fully_paid">{t('reservations.form.fullyPaid', 'Fully Paid')}</option>
                  <option value="amount">{t('reservations.form.partial', 'Partial')}</option>
                </select>
                <input
                  type="number"
                  value={reservation?.prepayment || ''}
                  onChange={(e: any) => set('prepayment', e.target.value === '' ? '' : parseFloat(e.target.value))}
                  disabled={reservation?.prepaymentType === 'fully_paid'}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 text-sm font-medium focus:outline-none disabled:bg-slate-50"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-semibold">{t('reservations.form.balanceDue', 'Balance Due')}:</span>
                <span className={`font-bold ${balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {balanceDue <= 0 ? 'none' : `${balanceDue.toFixed(2)} DH`}
                </span>
              </div>
            </div>
          ),
        },
        {
          label: t('reservations.form.depositType', 'Deposit Type'),
          input: (
            <SelectField value={reservation?.depositType || ''} onChange={(e: any) => {
              const val = e.target.value;
              const payload: any = { depositType: val };
              if (val === '' || val === 'None') payload.depositAmount = 0;
              onChange({ ...(reservation || {}), ...payload } as Partial<ReservationFormData>);
              if (errors.depositType) {
                setErrors(prev => {
                  const next = { ...prev };
                  delete next.depositType;
                  return next;
                });
              }
            }}>
              <option value="">{t('common.select', 'Select')}</option>
              <option value="None">{t('common.none', 'None')}</option>
              <option value="Cash">{t('reservations.form.cash', 'Cash')}</option>
              <option value="Cheque">{t('reservations.form.cheque', 'Cheque')}</option>
            </SelectField>
          ),
        },
        { label: t('reservations.form.depositAmount', 'Deposit Amount'), input: <InputField type="number" value={reservation?.depositAmount || ''} onChange={(e: any) => set('depositAmount', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" disabled={!reservation?.depositType || reservation?.depositType === 'None'} /> },
      ],
    },
    {
      title: t('reservations.form.documentation', 'Documentation'),
      icon: <FileText className="w-4 h-4" />,
      fields: [
        {
          label: t('reservations.form.vehicleState', 'Vehicle State (Before/After)'),
          input: (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,application/pdf';
                  input.onchange = (e: any) => handleFileUploadList('vehicle_state', e);
                  input.click();
                }}
                className="h-9 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                {t('common.upload', 'Upload Files')}
              </button>
              {docFiles.vehicle_state.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {docFiles.vehicle_state.map((file: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-500/20 rounded-[12px]">
                      <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="text-[9px] font-bold text-emerald-900 truncate max-w-[80px]">{file.name}</span>
                      <button onClick={() => handleRemoveFile('vehicle_state', idx)} className="p-0.5 hover:bg-emerald-100 rounded-full text-emerald-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          label: t('reservations.form.paperContract', 'Paper Contract PDF'),
          input: (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,application/pdf';
                  input.onchange = (e: any) => handleFileUploadList('paper_contract', e);
                  input.click();
                }}
                className="h-9 px-4 bg-white border border-slate-200 rounded-[12px] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                {t('common.upload', 'Upload Files')}
              </button>
              {docFiles.paper_contract.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {docFiles.paper_contract.map((file: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-500/20 rounded-[12px]">
                      <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="text-[9px] font-bold text-emerald-900 truncate max-w-[80px]">{file.name}</span>
                      <button onClick={() => handleRemoveFile('paper_contract', idx)} className="p-0.5 hover:bg-emerald-100 rounded-full text-emerald-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ],
    },
    {
      title: t('reservations.form.vehicleInspection', 'Vehicle Inspection'),
      icon: <Monitor className="w-4 h-4" />,
      fields: [
        { label: 'Starting KM', input: <InputField type="number" value={reservation?.odometerOut || ''} onChange={(e: any) => set('odometerOut', e.target.value)} placeholder="KM" /> },
        { label: 'Arrival KM', input: <InputField type="number" value={reservation?.odometerIn || ''} onChange={(e: any) => set('odometerIn', e.target.value)} placeholder="KM" /> },
        { label: 'Starting Fuel', input: <InputField type="number" value={reservation?.fuelOut || ''} onChange={(e: any) => set('fuelOut', e.target.value)} placeholder="%" /> },
        { label: 'Arrival Fuel', input: <InputField type="number" value={reservation?.fuelIn || ''} onChange={(e: any) => set('fuelIn', e.target.value)} placeholder="%" /> },
        {
          label: t('reservations.form.cleaningState', 'Pick-up clean state'),
          input: (
            <SelectField value={reservation?.cleanedBefore || ''} onChange={(e: any) => set('cleanedBefore', e.target.value)}>
              <option value="">{t('common.select', 'Select')}</option>
              <option value="yes">{t('common.yes', 'Yes')}</option>
              <option value="no">{t('common.no', 'No')}</option>
            </SelectField>
          ),
        },
        {
          label: t('reservations.form.includedItems', 'Included Items'),
          input: (
            <div className="w-full">
              <ItemSection items={reservation?.includedItems || []} onChange={(names: string[]) => set('includedItems', names)} isEdit disabled={false} />
            </div>
          ),
        },
        { label: t('reservations.form.notes', 'Notes'), input: <TextareaField value={reservation?.notes || ''} onChange={(e: any) => set('notes', e.target.value)} placeholder={t('reservations.form.notesPlaceholder', 'Add any additional information...')} rows={3} /> },
      ],
    },
  ];

  return (
    <>
    <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto black-scrollbar">
      <div className="flex flex-wrap gap-6">
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="bg-blue-50 border border-slate-200 rounded-[12px] p-5 shadow-sm"
            style={{ flexBasis: '300px', flexShrink: 1, minWidth: '250px', maxWidth: '100%' }}
          >
            {section.title && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-3 mb-4 border-b border-slate-200 bg-slate-50 -mx-5 -mt-5 px-5 pt-4 rounded-t-[12px]">
                {section.icon && <span className="shrink-0 text-slate-500">{section.icon}</span>}
                {section.title}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {section.fields.map((field, fIdx) => (
                <div key={fIdx} className="w-full flex flex-col">
                  <span className="text-xs font-semibold text-slate-600 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  {field.input}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-200 mt-6 -mx-6 -mb-6 rounded-b-[12px] sticky bottom-0">
        <div>
          {saveError && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              {saveError}
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
        </button>
      </div>
    </div>
      {isCarSelectorOpen && (
        <BaseModal
          isOpen={isCarSelectorOpen}
          onClose={() => setIsCarSelectorOpen(false)}
          title={t('reservations.form.selectCar', 'Select Car')}
        >
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {availableCars.map(car => (
                <div
                  key={car.id}
                  onClick={() => {
                    onChange({
                      ...(reservation || {}),
                      selectedCarId: car.id,
                      carBrand: car.brand,
                      carModel: car.model,
                      licensePlate: car.plate,
                      dailyRate: car.daily_rate,
                      odometerOut: car.odometer?.toString() || '0',
                      includedItems: car.essentials
                        ? car.essentials.filter((e: any) => e.checked).map((e: any) => e.name)
                        : [],
                    } as Partial<ReservationFormData>);
                    setIsCarSelectorOpen(false);
                  }}
                  className={`group flex flex-col p-3 cursor-pointer transition-all duration-200 border-2 border-black rounded-[12px] bg-white relative ${
                    reservation?.selectedCarId === car.id
                      ? 'shadow-[0px_0px_0px_1px_rgba(0,0,0,1),0px_0px_0px_4px_rgba(59,130,246,0.1),-3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 translate-x-0.5 bg-blue-50/50'
                      : 'shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[-3px_3px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="w-full aspect-[4/3] bg-slate-50 border border-black/5 rounded-[12px] mb-3 overflow-hidden flex items-center justify-center p-2">
                    {car.image_url ? (
                      <img
                        alt={car.model}
                        className="w-full h-full object-contain mix-blend-multiply"
                        src={getDriveImageUrl(car.image_url)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full opacity-5 flex items-center justify-center" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 12px, transparent 12px, transparent 24px)' }}>
                        <CarIcon className="w-10 h-10 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-[13px] font-black text-black uppercase leading-tight tracking-tight truncate">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">
                      {car.plate}
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter border border-black/10 rounded-[12px] transition-transform group-hover:scale-105 ${
                        car.status === 'Available' ? 'bg-[#22C55E] text-white' : 'bg-[#F59E0B] text-white'
                      }`}>
                        {car.status}
                      </span>
                      <div className="text-[12px] font-black text-black whitespace-nowrap">
                        {car.daily_rate} <span className="text-[9px] font-bold opacity-30">DH/D</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BaseModal>
      )}
      <ClientModal
        isOpen={isClientViewModalOpen}
        onClose={() => setIsClientViewModalOpen(false)}
        mode="edit"
        client={selectedCustomer}
      />
    </>
  );
}
