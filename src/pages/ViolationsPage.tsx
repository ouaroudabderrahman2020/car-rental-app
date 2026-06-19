import { useState, useEffect, useRef } from 'react';
import { Plus, Car, User, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import BaseModal from '../components/BaseModal';
import CarSelectModal from '../components/carSelect';
import { supabase } from '../lib/supabase';
import { useStatus } from '../contexts/StatusContext';
import { generateViolationId } from '../utils/idGenerator';
import type { Violation } from '../types';

export default function ViolationsPage() {
  const { t } = useTranslation();
  const { setStatus } = useStatus();
  const [violations, setViolations] = useState<(Violation & { car?: { brand: string; model: string; plate: string }; client?: { name: string; national_id: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<any | null>(null);
  const [isCarSelectorOpen, setIsCarSelectorOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [violationPlace, setViolationPlace] = useState('');
  const [violationDate, setViolationDate] = useState('');
  const [saving, setSaving] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchViolations();
    fetchCars();
    fetchClients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('violations')
        .select(`*, car:cars(brand, model, plate), client:clients(name, national_id)`)
        .order('violation_date', { ascending: false });
      if (error) throw error;
      setViolations(data || []);
    } catch (err) {
      console.error('Error fetching violations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase.from('cars').select('*').order('brand');
      if (error) throw error;
      setCars(data || []);
    } catch (err) {
      console.error('Error fetching cars:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleCarSelect = (car: any) => {
    setSelectedCar(car);
    setIsCarSelectorOpen(false);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.national_id || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  const resetForm = () => {
    setSelectedCar(null);
    setSelectedClient(null);
    setClientSearch('');
    setViolationType('');
    setViolationPlace('');
    setViolationDate('');
  };

  const handleSave = async () => {
    if (!selectedCar || !selectedClient || !violationType.trim() || !violationPlace.trim() || !violationDate) {
      setStatus('Please fill all fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('violations').insert([{
        id: generateViolationId(),
        car_id: selectedCar.id,
        client_id: selectedClient.id,
        violation_type: violationType.trim(),
        violation_place: violationPlace.trim(),
        violation_date: new Date(violationDate).toISOString(),
      }]);
      if (error) throw error;
      setStatus('Violation saved', 'success');
      setModalOpen(false);
      resetForm();
      fetchViolations();
    } catch (err: any) {
      console.error('Error saving violation:', err);
      setStatus(`Error: ${err.message || ''}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Casablanca', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Casablanca', day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' });
  };

  return (
    <Layout title="Violations">
      <PageHeader
        title="Violations"
        actions={
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="header-btn"
          >
            <Plus className="w-4 h-4" />
            Add Violation
          </button>
        }
      />

      <div className="w-full pt-6 pb-12">
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse responsive-table [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-slate-500 [&_td]:border-slate-200">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border-b border-slate-800">
                  <th className="py-3 px-4 text-center">Car</th>
                  <th className="py-3 px-4 text-center">Client</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Place</th>
                  <th className="py-3 px-4 text-center">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-slate-200 rounded w-full mx-auto" style={{ maxWidth: 120 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <>
                    {violations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-wider">
                          No violations found
                        </td>
                      </tr>
                    )}
                    {violations.map((v) => (
                      <tr key={v.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-center" data-label="Car">
                          <div className="font-bold text-sm text-slate-900">{v.car?.brand} {v.car?.model}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{v.car?.plate}</div>
                        </td>
                        <td className="py-2.5 px-4 text-center" data-label="Client">
                          <div className="font-bold text-sm text-slate-900">{v.client?.name}</div>
                          <div className="text-[10px] font-semibold text-slate-400">{v.client?.national_id}</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-sm text-slate-800" data-label="Type">
                          {v.violation_type}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-sm text-slate-800" data-label="Place">
                          {v.violation_place}
                        </td>
                        <td className="py-2.5 px-4 text-center text-sm font-semibold text-slate-600" data-label="Date & Time">
                          {formatDateTime(v.violation_date)}
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

      <BaseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Add Violation"
      >
        <div className="p-6 flex flex-col gap-5">
          {/* Car Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Car</span>
            {selectedCar ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-[12px] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-bold text-slate-900">{selectedCar.brand} {selectedCar.model}</span>
                  <span className="text-[10px] font-black text-slate-500 bg-sky-100 px-1.5 py-0.5 rounded">{selectedCar.plate}</span>
                </div>
                <button onClick={() => setSelectedCar(null)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCarSelectorOpen(true)}
                className="w-full h-10 bg-white border border-slate-200 rounded-[12px] px-3 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                <Car className="w-4 h-4" />
                Select a car
              </button>
            )}
          </div>

          {/* Client Selection */}
          <div className="flex flex-col gap-1.5" ref={clientRef}>
            <span className="text-xs font-semibold text-slate-600">Client</span>
            {selectedClient ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-[12px] px-3 py-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-slate-900">{selectedClient.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400 ml-2">{selectedClient.national_id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true); }}
                    onFocus={() => setClientDropdownOpen(true)}
                    placeholder="Search client by name or ID..."
                    className="w-full h-10 bg-white border border-slate-200 rounded-[12px] pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                {clientDropdownOpen && clientSearch && (
                  <div className="absolute top-full mt-1 left-0 w-full z-50 bg-white border-2 border-black rounded-[12px] shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="px-4 py-3 text-xs font-bold text-slate-400 text-center">No clients found</div>
                    ) : (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => { setSelectedClient(c); setClientSearch(''); setClientDropdownOpen(false); }}
                          className="px-4 py-2.5 text-sm font-bold border-b border-black/5 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="text-slate-900 uppercase text-[13px]">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.national_id || '---'}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Violation Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Violation Type</span>
            <input
              type="text"
              value={violationType}
              onChange={(e) => setViolationType(e.target.value)}
              placeholder="e.g. Speeding, Parking, Red Light..."
              className="w-full h-10 bg-white border border-slate-200 rounded-[12px] px-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Violation Place */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Violation Place</span>
            <input
              type="text"
              value={violationPlace}
              onChange={(e) => setViolationPlace(e.target.value)}
              placeholder="e.g. Avenue Mohammed V, intersection..."
              className="w-full h-10 bg-white border border-slate-200 rounded-[12px] px-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Violation Date & Time */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Violation Date & Time</span>
            <input
              type="datetime-local"
              value={violationDate}
              onChange={(e) => setViolationDate(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-[12px] px-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => { setModalOpen(false); resetForm(); }}
              className="h-10 px-6 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-[#0066FF] text-white border border-[#0066FF] hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Violation'}
            </button>
          </div>
        </div>
      </BaseModal>

      <CarSelectModal
        isOpen={isCarSelectorOpen}
        onClose={() => setIsCarSelectorOpen(false)}
        cars={cars}
        selectedCarId={selectedCar?.id || null}
        onSelect={handleCarSelect}
      />
    </Layout>
  );
}
