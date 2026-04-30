import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { User, Phone, CreditCard, Calendar, Shield, History, Trash2, X, Check, Edit2 } from 'lucide-react';
import { Customer, Reservation } from '../types';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Customer | null;
  reservations: Reservation[];
  onDelete: (id: string) => void;
  onUpdate: (client: Customer) => void;
}

export default function ClientDetailModal({ isOpen, onClose, client, reservations, onDelete, onUpdate }: ClientDetailModalProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Customer | null>(client);

  React.useEffect(() => {
    setEditedClient(client);
    setIsEditing(false);
  }, [client]);

  if (!client || !editedClient) return null;

  const handleSave = () => {
    onUpdate(editedClient);
    setIsEditing(false);
  };

  const clientReservations = reservations
    .filter(r => r.customer_phone === client.phone)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const isLicenseExpired = new Date(client.license_expiry) < new Date();

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
            className="relative bg-muted-cream w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-midnight-ink flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b-2 border-midnight-ink flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-ink flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                {t('crm.modal.title')}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-muted-mint transition-colors border border-transparent hover:border-midnight-ink/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/70"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('crm.modal.edit')}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-red-50 text-ink/40 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              {/* Profile Overview */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className={`w-24 h-24 flex items-center justify-center border-4 ${client.is_blacklisted ? 'border-red-500 bg-red-50' : 'border-midnight-ink bg-white'} industrial-shadow shrink-0`}>
                  <User className={`w-12 h-12 ${client.is_blacklisted ? 'text-red-500' : 'text-midnight-ink'}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-2xl font-black uppercase tracking-tight ${client.is_blacklisted ? 'text-red-600' : 'text-ink'}`}>
                      {client.name}
                    </h3>
                    {client.is_blacklisted && (
                      <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] industrial-shadow animate-pulse">
                        {t('crm.modal.blacklisted')}
                      </span>
                    )}
                  </div>
                  <p className="text-ink/60 font-mono text-sm">{client.id}</p>
                </div>
              </div>

              {/* Informational Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ink/40 border-b border-ink/10 pb-2">{t('crm.modal.details')}</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50">{t('crm.modal.phone')}</label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={editedClient.phone}
                        onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                        className="w-full bg-white border-2 border-midnight-ink/10 p-3 ps-10 font-bold text-ink focus:border-primary transition-all disabled:bg-transparent disabled:border-transparent disabled:ps-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50">{t('crm.modal.idCard')}</label>
                    <div className="relative">
                      <CreditCard className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={editedClient.id_card_number}
                        onChange={(e) => setEditedClient({...editedClient, id_card_number: e.target.value})}
                        className="w-full bg-white border-2 border-midnight-ink/10 p-3 ps-10 font-bold text-ink focus:border-primary transition-all disabled:bg-transparent disabled:border-transparent disabled:ps-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Compliance Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ink/40 border-b border-ink/10 pb-2 text-end">COMPLIANCE</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50">{t('crm.modal.license')}</label>
                    <div className="relative">
                      <Shield className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input 
                        type="text"
                        disabled={!isEditing}
                        value={editedClient.license_number}
                        onChange={(e) => setEditedClient({...editedClient, license_number: e.target.value})}
                        className="w-full bg-white border-2 border-midnight-ink/10 p-3 ps-10 font-bold text-ink focus:border-primary transition-all disabled:bg-transparent disabled:border-transparent disabled:ps-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50">{t('crm.modal.licenseExpiry')}</label>
                    <div className="relative">
                      <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <input 
                        type="date"
                        disabled={!isEditing}
                        value={editedClient.license_expiry}
                        onChange={(e) => setEditedClient({...editedClient, license_expiry: e.target.value})}
                        className={`w-full bg-white border-2 border-midnight-ink/10 p-3 ps-10 font-bold text-ink focus:border-primary transition-all disabled:bg-transparent disabled:border-transparent disabled:ps-10 ${
                          isLicenseExpired ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      />
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

                <div className="space-y-3">
                  {clientReservations.slice(0, 5).map((res) => (
                    <div key={res.id} className="bg-white border-2 border-midnight-ink/5 p-4 industrial-shadow hover:translate-x-1 transition-transform group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-ink text-sm uppercase tracking-tight">{res.car?.brand} {res.car?.model}</p>
                          <p className="text-[10px] font-mono text-ink/40">{res.start_date} → {res.end_date}</p>
                        </div>
                        <div className="text-end">
                          <p className="font-black text-ink">{res.total_price.toFixed(2)} USD</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${
                            res.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            res.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {clientReservations.length === 0 && (
                    <p className="text-center py-8 text-ink/30 italic text-sm">{t('common.noData')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-6 bg-white border-t-2 border-midnight-ink flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-midnight-ink font-bold text-xs uppercase tracking-widest hover:bg-muted-mint transition-all"
                >
                  {t('crm.modal.close')}
                </button>
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
              </div>
              
              <button 
                onClick={isEditing ? handleSave : onClose}
                className="px-8 py-3 bg-midnight-ink text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all industrial-shadow flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isEditing ? <Check className="w-4 h-4" /> : null}
                {isEditing ? t('crm.modal.save') : 'DONE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
