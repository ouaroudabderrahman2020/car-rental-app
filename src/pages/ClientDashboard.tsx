import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, Shield, AlertTriangle, Scale, Plus, Star, DollarSign, Activity, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Customer, Reservation } from '../types';
import Layout from '../components/Layout';
import { SectionHeader } from '../components/SectionHeader';
import ClientDetailModal from '../components/ClientDetailModal';
import { useStatus } from '../contexts/StatusContext';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setStatus(t('common.loading'), 'processing', 0);
    try {
      // In a real app we'd fetch from customers table.
      // If table doesn't exist, we might have to infer from reservations, 
      // but let's try fetching companies/customers first.
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*, car:cars(*)');

      if (customersError) {
        console.error('Customers fetch error:', customersError);
        // Fallback or seed some data if empty
        setClients([]);
      } else {
        setClients(customersData || []);
      }

      if (resError) throw resError;
      setReservations(resData || []);
      setStatus(t('common.success'), 'success');
    } catch (error: any) {
      console.error('Data fetch error:', error);
      setStatus(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const enrichedClients = useMemo(() => {
    return clients.map(client => {
      const clientReservations = reservations.filter(r => r.customer_phone === client.phone);
      const totalRevenue = clientReservations.reduce((sum, r) => sum + r.total_price, 0);
      const isLicenseExpired = new Date(client.license_expiry) < new Date();
      const hasActiveRental = clientReservations.some(r => r.status === 'Confirmed' || r.status === 'Overdue' || r.status === 'In Progress');
      
      return {
        ...client,
        totalRevenue,
        isLicenseExpired,
        hasActiveRental,
        rentalCount: clientReservations.length
      };
    });
  }, [clients, reservations]);

  const filteredClients = enrichedClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleUpdateClient = async (updatedClient: Customer) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updatedClient)
        .eq('id', updatedClient.id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <Layout title={t('crm.title')}>
      <div className="min-h-screen bg-white pb-20">
        {/* Main Content */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-margin v-section-gap">
          {/* Toolbar: Search and Actions */}
          <SectionHeader 
            title={t('crm.table.title', 'Client Directory')}
            actions={
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full max-w-md">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder={t('crm.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 ps-12 font-bold text-ink focus:border-primary transition-all shadow-sm text-sm"
                  />
                </div>

                <button className="bg-midnight-ink text-white py-4 px-8 industrial-shadow hover:bg-primary transition-all flex items-center gap-3 font-black uppercase tracking-widest text-fluid-sm shrink-0">
                  <Plus className="w-5 h-5" />
                  {t('common.add')}
                </button>
              </div>
            }
          />

          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border-b border-slate-800">
                    <th className="py-5 px-8 text-start">{t('crm.table.customer')}</th>
                    <th className="py-5 px-6 text-center">{t('crm.table.trust')}</th>
                    <th className="py-5 px-6 text-center">{t('crm.table.documents')}</th>
                    <th className="py-5 px-6 text-center">{t('crm.table.activity')}</th>
                    <th className="py-5 px-8 text-end">{t('crm.table.revenue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Activity className="w-8 h-8 text-primary animate-pulse" />
                          <span className="font-bold text-ink/40 uppercase tracking-widest text-fluid-sm">{t('common.loading')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr 
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          setIsModalOpen(true);
                        }}
                        className="group hover:bg-white cursor-pointer transition-colors"
                      >
                        {/* Customer Info */}
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 flex items-center justify-center border-2 ${client.is_blacklisted ? 'border-red-500 bg-red-50' : 'border-midnight-ink/10 bg-white'} group-hover:border-primary transition-colors`}>
                              <User className={`w-6 h-6 ${client.is_blacklisted ? 'text-red-500' : 'text-ink/40'}`} />
                            </div>
                            <div>
                            <div className={`font-black uppercase tracking-tight text-fluid-base ${client.is_blacklisted ? 'text-red-600' : 'text-ink group-hover:text-primary'}`}>
                              {client.name}
                            </div>
                            <div className="text-fluid-sm font-bold text-ink/40 font-mono tracking-tighter">
                              {client.phone} • {client.id.slice(0, 8)}
                            </div>
                            </div>
                          </div>
                        </td>

                        {/* Trust Rank */}
                        <td className="py-6 px-6 text-center">
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                className={`w-3 h-3 ${star <= client.trust_rank ? 'fill-primary text-primary' : 'text-ink/10'}`} 
                              />
                            ))}
                          </div>
                        </td>

                        {/* Documents Safety Badge */}
                        <td className="py-6 px-6 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-fluid-sm font-black uppercase tracking-widest ${
                          client.isLicenseExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            <Shield className="w-3 h-3" />
                            {client.isLicenseExpired ? t('crm.modal.safety.expired') : t('crm.modal.safety.valid')}
                          </div>
                        </td>

                        {/* Activity Badge */}
                        <td className="py-6 px-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-fluid-sm font-black text-ink">{client.rentalCount} {t('crm.modal.rentals')}</span>
                            {client.hasActiveRental && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px] font-black uppercase tracking-tighter">
                                {t('crm.modal.liveStatus')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="py-6 px-8 text-end">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-fluid-base font-black text-ink whitespace-nowrap">
                              {client.totalRevenue.toLocaleString()} <span className="text-xs text-ink/40 opacity-50 font-medium">MAD</span>
                            </span>
                            <div className="w-full bg-ink/5 h-1 max-w-[80px]">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((client.totalRevenue / 10000) * 100, 100)}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-ink/30 italic">
                        {t('common.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ClientDetailModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          client={selectedClient}
          reservations={reservations}
          onDelete={handleDeleteClient}
          onUpdate={handleUpdateClient}
        />
      </div>
    </Layout>
  );
}
