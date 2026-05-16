import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Shield, AlertTriangle, Scale, Plus, Star, DollarSign, Activity, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Customer, Reservation } from '../types';
import Layout from '../components/Layout';
import ClientModal from '../components/ClientModal';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */
import { useStatus } from '../contexts/StatusContext';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);

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
      const clientReservations = reservations
        .filter(r => r.customer_phone === client.phone)
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        
      const totalRevenue = clientReservations.reduce((sum, r) => sum + r.total_price, 0);
      const isLicenseExpired = client.license_expiry ? new Date(client.license_expiry) < new Date() : false;
      
      const activeRental = clientReservations.find(r => r.status === 'Confirmed' || r.status === 'Overdue' || r.status === 'In Progress');
      const lastRental = clientReservations[0];
      
      return {
        ...client,
        totalRevenue,
        isLicenseExpired,
        hasActiveRental: !!activeRental,
        displayRental: activeRental || lastRental,
        rentalCount: clientReservations.length
      };
    });
  }, [clients, reservations]);

  const filteredClients = useMemo(() => {
    return enrichedClients
      .filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [enrichedClients, searchTerm]);

  const handleOpenDetails = (client: Customer) => {
    setSelectedClient(client);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white pb-20">
        <PageHeader 
          title="Clients"
          actions={
            <button onClick={handleAddClient} className="header-btn">
              <Plus className="w-4 h-4" />
              {t('common.add')}
            </button>
          }
          className="p-6 md:p-10"
        />
        {/* Main Content */}
        <div className="max-w-[1440px] mx-auto pt-6 pb-12">
          <Section2>
            <div className="w-full flex flex-col gap-8">
              <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse responsive-table">
                    <thead>
                      <tr className="bg-slate-800 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border-b border-slate-800">
                        <th className="py-3 px-6 text-start">{t('crm.table.customer', 'Customer')}</th>
                        <th className="py-3 px-4 text-start">{t('crm.table.identity', 'ID / License')}</th>
                        <th className="py-3 px-4 text-center">{t('crm.table.reservations', 'Res.')}</th>
                        <th className="py-3 px-4 text-start">{t('crm.table.lastRental', 'Last/Active Rental')}</th>
                        <th className="py-3 px-6 text-end">{t('crm.table.ranking', 'Ranking')}</th>
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
                      ) : (
                        <>
                          {filteredClients.length === 0 && (
                            <tr>
                              <td colSpan={5} className="empty-table-cell">
                                {t('common.noData')}
                              </td>
                            </tr>
                          )}
                          {filteredClients.map((client) => (
                            <tr 
                              key={client.id}
                              onClick={() => handleOpenDetails(client)}
                              className="group hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              {/* Customer Info */}
                              <td className="py-2.5 px-6" data-label={t('crm.table.customer')}>
                                <div className="flex items-center gap-3">
                                  <div className="text-start">
                                    <div className={`font-black uppercase tracking-tight text-sm ${client.is_blacklisted ? 'text-red-600' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                      {client.name}
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-400 font-mono">
                                      {client.phone}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* ID / Driver License */}
                              <td className="py-2.5 px-4 text-start" data-label={t('crm.table.identity')}>
                                <span className="text-sm font-bold text-slate-800">{client.national_id || client.id_card_number || '---'} / {client.license_number || '---'}</span>
                              </td>

                              {/* Number of Reservations */}
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-sm" data-label={t('crm.table.reservations')}>
                                {client.rentalCount}
                              </td>

                              {/* Active/Last Rental */}
                              <td className="py-2.5 px-4 text-start" data-label={t('crm.table.lastRental')}>
                                {client.displayRental ? (
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-bold text-slate-900">
                                        {client.displayRental.car?.brand} {client.displayRental.car?.model}
                                      </span>
                                      {client.hasActiveRental && (
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                      )}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400">
                                      {new Date(client.displayRental.start_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{t('common.none', 'None')}</span>
                                )}
                              </td>

                              {/* Ranking */}
                              <td className="py-2.5 px-6 text-end" data-label={t('crm.table.ranking')}>
                                <div className="flex justify-end gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star}
                                      className={`w-3.5 h-3.5 ${star <= Number(client.trust_rank) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                    />
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Section2>
        </div>

        <ClientModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          client={selectedClient}
          reservations={reservations}
          onRefresh={fetchData}
        />
      </div>
    </Layout>
  );
}
