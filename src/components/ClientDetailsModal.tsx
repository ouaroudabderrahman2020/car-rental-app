import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { User, Phone, CreditCard, Calendar, Shield, History, Trash2, X, Check, Edit2, Mail, MapPin, Globe } from 'lucide-react';
import { Customer, Reservation } from '../types';
import ClientForm from './ClientForm';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Customer | null;
  reservations: Reservation[];
  onDelete: (id: string) => void;
  onUpdate: (client: Customer) => void;
}

export default function ClientDetailsModal({ isOpen, onClose, client, reservations, onDelete, onUpdate }: ClientDetailsModalProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [licenseIssue, setLicenseIssue] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState('5');
  const [notes, setNotes] = useState('');
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  React.useEffect(() => {
    if (client) {
      setName(client.name || '');
      setNationalId(client.national_id || client.id_card_number || '');
      setDob(client.dob || '');
      setNationality(client.nationality || '');
      setLicenseNumber(client.license_number || '');
      setLicenseExpiry(client.license_expiry || '');
      setLicenseIssue(client.license_issue || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
      setRating(client.trust_rank?.toString() || '5');
      setNotes(client.notes || '');
      setIsBlacklisted(client.is_blacklisted || false);
    }
    setIsEditing(false);
  }, [client]);

  if (!client) return null;

  const handleSave = () => {
    onUpdate({
      ...client,
      name,
      national_id: nationalId,
      id_card_number: nationalId,
      dob,
      nationality,
      license_number: licenseNumber,
      license_expiry: licenseExpiry,
      license_issue: licenseIssue,
      phone,
      email,
      address,
      trust_rank: parseInt(rating) || 5,
      notes,
      is_blacklisted: isBlacklisted
    });
    setIsEditing(false);
  };

  const clientReservations = reservations
    .filter(r => r.customer_phone === client.phone)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const isLicenseExpiredCheck = new Date(licenseExpiry) < new Date();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-midnight-ink/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-midnight-ink flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b-2 border-midnight-ink flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                {isEditing ? t('crm.modal.edit') : t('crm.modal.title')}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-ink/5 transition-colors border border-transparent hover:border-midnight-ink/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/70"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('crm.modal.edit')}
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-red-50 text-ink/40 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              {isEditing ? (
                <div className="space-y-6">
                  <ClientForm 
                    name={name} setName={setName}
                    nationalId={nationalId} setNationalId={setNationalId}
                    dob={dob} setDob={setDob}
                    nationality={nationality} setNationality={setNationality}
                    licenseNumber={licenseNumber} setLicenseNumber={setLicenseNumber}
                    licenseExpiry={licenseExpiry} setLicenseExpiry={setLicenseExpiry}
                    licenseIssue={licenseIssue} setLicenseIssue={setLicenseIssue}
                    phone={phone} setPhone={setPhone}
                    email={email} setEmail={setEmail}
                    address={address} setAddress={setAddress}
                    rating={rating} setRating={setRating}
                    notes={notes} setNotes={setNotes}
                  />
                  <div className="flex items-center gap-3 p-6 bg-slate-50 border border-slate-200">
                    <input 
                      type="checkbox" 
                      id="blacklist-check"
                      checked={isBlacklisted}
                      onChange={(e) => setIsBlacklisted(e.target.checked)}
                      className="w-5 h-5 accent-red-600"
                    />
                    <label htmlFor="blacklist-check" className="font-bold uppercase tracking-widest text-xs text-red-600 cursor-pointer">
                      {t('crm.modal.markAsBlacklisted', 'Mark as Blacklisted')}
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Overview */}
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className={`w-24 h-24 flex items-center justify-center border-4 ${isBlacklisted ? 'border-red-500 bg-red-50' : 'border-midnight-ink bg-white'} industrial-shadow shrink-0`}>
                      <User className={`w-12 h-12 ${isBlacklisted ? 'text-red-500' : 'text-midnight-ink'}`} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className={`text-2xl font-black uppercase tracking-tight ${isBlacklisted ? 'text-red-600' : 'text-ink'}`}>
                          {name}
                        </h3>
                        {isBlacklisted && (
                          <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] industrial-shadow animate-pulse">
                            {t('crm.modal.blacklisted')}
                          </span>
                        )}
                      </div>
                      <p className="text-ink/60 font-mono text-sm">{client.id}</p>
                    </div>
                  </div>

                  {/* Informational Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 border-b border-ink/10 pb-2">{t('crm.modal.details')}</h4>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="font-bold">{phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="font-bold">{email || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-bold">{address || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span className="font-bold">{nationalId || '---'}</span>
                      </div>
                    </div>

                    {/* Compliance Info */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 border-b border-ink/10 pb-2">COMPLIANCE</h4>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <Shield className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest">{t('crm.modal.license')}</span>
                          <span className="font-bold">{licenseNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest">{t('crm.modal.licenseExpiry')}</span>
                          <span className={`font-bold ${isLicenseExpiredCheck ? 'text-red-500' : 'text-emerald-600'}`}>
                            {licenseExpiry || '---'} {isLicenseExpiredCheck && `(${t('crm.modal.safety.expired')})`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest">{t('clientForm.nationality')}</span>
                          <span className="font-bold">{nationality || '---'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking History Section */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b-2 border-midnight-ink pb-2">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
                        <History className="w-4 h-4" />
                        {t('crm.modal.bookingHistory')}
                      </h4>
                      <span className="text-[10px] font-bold text-ink/40 bg-ink/5 px-2 py-0.5">{clientReservations.length} {t('crm.modal.rentals')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {clientReservations.slice(0, 4).map((res) => (
                        <div key={res.id} className="bg-slate-50 border border-slate-200 p-4 transition-all hover:border-primary group">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-black text-ink text-xs uppercase tracking-tight">{res.car?.brand} {res.car?.model}</p>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 ${
                              res.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              res.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-primary/20 text-primary'
                            }`}>
                              {res.status}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono text-ink/40 mb-2">{res.start_date} → {res.end_date}</p>
                          <p className="font-black text-midnight-ink text-sm uppercase">{res.total_price.toFixed(0)} MAD</p>
                        </div>
                      ))}
                      {clientReservations.length === 0 && (
                        <p className="col-span-full text-center py-8 text-ink/30 italic text-sm">{t('common.noData')}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  {notes && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">{t('clientForm.notes')}</h4>
                      <p className="text-sm text-amber-900/80 leading-relaxed italic">{notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-6 bg-white border-t-2 border-midnight-ink flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-midnight-ink font-bold text-xs uppercase tracking-widest hover:bg-ink/5 transition-all"
                >
                  {isEditing ? t('common.cancel') : t('crm.modal.close')}
                </button>
                {!isEditing && (
                  <button 
                    onClick={() => {
                      if (window.confirm(t('common.confirmation'))) {
                        onDelete(client.id);
                        onClose();
                      }
                    }}
                    className="px-6 py-3 border-2 border-red-500 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('crm.modal.delete')}
                  </button>
                )}
              </div>
              
              <button 
                onClick={isEditing ? handleSave : onClose}
                className="px-10 py-3 bg-midnight-ink text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all industrial-shadow flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isEditing ? <Check className="w-4 h-4" /> : null}
                {isEditing ? t('common.save', 'SAVE CHANGES') : 'CLOSE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
