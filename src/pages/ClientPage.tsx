import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Shield, AlertTriangle, Scale, Plus, Star, DollarSign, FileText, Loader2, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Client, Reservation } from '../types';
import { gasService, getFileIdFromUrl } from '../lib/gas';
import Layout from '../components/Layout';
import ClientForm, { type ClientFormHandle } from '../components/ClientForm';
import BaseModal from '../components/BaseModal';
import ClientDetailsView from '../components/ClientDetails';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */
import { useStatus } from '../contexts/StatusContext';
import { useNotification } from '../contexts/NotificationContext';
import { generateClientId } from '../utils/idGenerator';

const PAGE_SIZE = 25;

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);
  const formRef = React.useRef<ClientFormHandle>(null);

  const handleClientFormChange = useCallback((partial: Partial<Client>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    fetchData(0);
  }, []);

  const fetchData = async (pageNum = 0) => {
    setIsLoading(true);
    setStatus(t('common.loading'), 'processing', 0);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      setTotalCount(count || 0);

      const { data: customersData, error: customersError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*, car:cars(*)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (customersError) {
        console.error('Customers fetch error:', customersError);
        setClients([]);
      } else {
        setClients(customersData || []);
        setPage(pageNum);
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
        .filter(r => r.customer_national_id === client.national_id || r.customer_name === client.name)
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

  const handleOpenDetails = (client: Client) => {
    setDetailsClient(client);
    setIsDetailsOpen(true);
  };

  const handleEditFromDetails = () => {
    if (!detailsClient) return;
    setIsDetailsOpen(false);
    setSelectedClient(detailsClient);
    setFormData({ ...detailsClient });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setFormData({});
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formRef.current?.validate()) return;

    const name = formData.name || '';
    const nationalId = formData.national_id || '';
    const licenseNumber = formData.license_number || '';

    setIsSaving(true);
    setStatus('Processing...', 'processing', 0);

    try {
      const folderName = `${name} ${nationalId}`.trim();

      if (modalMode === 'edit' && selectedClient) {
        const oldFolderName = `${selectedClient.name} ${selectedClient.national_id || selectedClient.id_card_number || ''}`.trim();
        if (oldFolderName !== folderName) {
          await gasService.renameClientFolder(oldFolderName, folderName);
        }
      }

      // Track old docs for GDrive cleanup
      const rawDocs = formData.documents || [];
      const oldDocs = modalMode === 'edit' && selectedClient?.documents ? selectedClient.documents : [];

      // Build a map of old docs by doc_type
      const oldByType: Record<string, any> = {};
      const staleFileIds: string[] = [];
      for (const doc of oldDocs) {
        oldByType[doc.doc_type] = doc;
      }

      // Determine which old files need to be deleted from GDrive
      for (const oldDoc of oldDocs) {
        const stillExists = rawDocs.some((d: any) => d.doc_type === oldDoc.doc_type);
        if (!stillExists) {
          const id = getFileIdFromUrl(oldDoc.file_url);
          if (id) staleFileIds.push(id);
        }
      }

      // Upload pending docs to Google Drive via GAS
      const newDocRows: any[] = [];
      for (const doc of rawDocs) {
        let fileUrl = (doc as any).file_url;
        if ((doc as any).file_data) {
          const oldDoc = oldByType[doc.doc_type];
          const oldFileId = oldDoc ? getFileIdFromUrl(oldDoc.file_url) : undefined;

          const ext = (doc as any).mime_type?.includes('pdf') ? 'pdf' : 'png';
          const result = await gasService.uploadClientFile({
            base64: (doc as any).file_data,
            fileName: (doc as any).file_name || `${doc.doc_type}.${ext}`,
            contentType: (doc as any).mime_type || 'image/png',
            clientFolderName: folderName,
            oldFileId,
          });
          if (result?.status === 'success' && result?.fileUrl) {
            fileUrl = result.fileUrl;
          } else {
            throw new Error(`Upload failed for ${(doc as any).doc_type}: ${(doc as any).file_name}`);
          }
        }
        newDocRows.push({ doc_type: doc.doc_type, file_url: fileUrl, file_name: (doc as any).file_name, mime_type: (doc as any).mime_type });
      }

      // Delete truly removed files from GDrive
      if (staleFileIds.length > 0) {
        await gasService.deleteCarFiles(staleFileIds);
      }

      const payload = {
        name,
        national_id: nationalId,
        dob: formData.dob || null,
        nationality: formData.nationality || null,
        license_number: licenseNumber,
        license_expiry: formData.license_expiry || null,
        license_issue: formData.license_issue || null,
        phone: formData.phone || '',
        email: formData.email || null,
        address: formData.address || null,
        trust_rank: formData.trust_rank || 0,
        notes: formData.notes || null,
        is_blacklisted: formData.is_blacklisted || false,
      };

      let savedClient: any;

      if (modalMode === 'edit' && selectedClient?.id) {
        const { data, error } = await supabase
          .from('clients')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', selectedClient.id)
          .select()
          .single();
        if (error) throw error;
        savedClient = data;
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert([{ id: generateClientId(), ...payload, created_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) throw error;
        savedClient = data;
      }

      // Save documents to the client's documents JSONB column
      await supabase.from('clients').update({ documents: newDocRows }).eq('id', savedClient.id);

      setStatus('Action Completed', 'success');
      setIsModalOpen(false);
      setSelectedClient(null);
      setFormData({});
      fetchData(0);
    } catch (err: any) {
      console.error('Save error:', err);
      setStatus(`Error: ${err.message || ''}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient?.id) return;

    setIsSaving(true);
    setStatus('Processing...', 'processing', 0);

    try {
      const folderName = `${selectedClient.name} ${selectedClient.national_id || selectedClient.id_card_number || ''}`.trim();
      await gasService.deleteClientFolder(folderName);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;
      setStatus('Action Completed', 'success');
      setIsModalOpen(false);
      setSelectedClient(null);
      setFormData({});
      fetchData(page);
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatus('Error', 'error');
    } finally {
      setIsSaving(false);
    }
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
                        <th className="py-3 px-4 text-start">{t('crm.table.nationalId', 'ID')}</th>
                        <th className="py-3 px-4 text-start">{t('crm.table.license', 'License')}</th>
                        <th className="py-3 px-4 text-center">{t('crm.table.reservations', 'Res.')}</th>
                        <th className="py-3 px-4 text-start">{t('crm.table.lastRental', 'Last/Active Rental')}</th>
                        <th className="py-3 px-6 text-end">{t('crm.table.ranking', 'Ranking')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            {Array.from({ length: 6 }).map((__, j) => (
                              <td key={j} className="py-3 px-4">
                                <div className="h-4 bg-slate-200 rounded w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <>
                          {filteredClients.length === 0 && (
                            <tr>
                              <td colSpan={6} className="empty-table-cell">
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
                                  </div>
                                </div>
                              </td>

                              {/* ID */}
                              <td className="py-2.5 px-4 text-start" data-label={t('crm.table.nationalId', 'ID')}>
                                <span className="text-sm font-bold text-slate-800">{client.national_id || client.id_card_number || '---'}</span>
                              </td>
                              {/* License */}
                              <td className="py-2.5 px-4 text-start" data-label={t('crm.table.license', 'License')}>
                                <span className="text-sm font-bold text-slate-800">{client.license_number || '---'}</span>
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
              {!isLoading && totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchData(page - 1)}
                      disabled={page === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => fetchData(page + 1)}
                      disabled={page >= Math.ceil(totalCount / PAGE_SIZE) - 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section2>
        </div>

        <BaseModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsClient(null);
          }}
          title={
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em]">
                Client Profile
              </h2>
              {detailsClient?.is_blacklisted && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest border border-black rounded-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Blacklisted</span>
              )}
            </div>
          }
          actions={
            <button
              onClick={handleEditFromDetails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Edit
            </button>
          }
        >
          {detailsClient && <ClientDetailsView client={detailsClient} />}
        </BaseModal>

        <BaseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
            setFormData({});
          }}
          closeDisabled={isSaving}
          title={
            <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-[0.2em]">
              {modalMode === 'add' ? 'Add New Client' : 'Edit Client Profile'}
            </h2>
          }
          actions={
            <>
              {modalMode === 'edit' && (
                <button
                  disabled={isSaving}
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-red-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-[12px] border-2 border-black hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {isSaving ? 'Processing...' : 'Save'}
              </button>
            </>
          }
        >
          <ClientForm ref={formRef} client={formData} onChange={handleClientFormChange} />
        </BaseModal>
      </div>
    </Layout>
  );
}
