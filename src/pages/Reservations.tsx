import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Loader2, Download } from 'lucide-react';
import AddReservationModal from '../components/AddReservationModal';
import EditReservationModal from '../components/EditReservationModal';
import ReservationDetailsModal from '../components/ReservationDetailsModal';
import { supabase } from '../lib/supabase';
import { gasService } from '../services/gasService';
import { Reservation } from '../types';

interface FormattedReservation extends Reservation {
  id_short: string;
  client: string;
  carName: string;
  carPlate: string;
  pickup: string;
  return: string;
  state: string;
  price: string;
  statusColor?: string;
  clientType?: string;
  mileage?: string;
  durationString?: string;
  hours?: string;
}

export default function Reservations() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<FormattedReservation | null>(null);
  const [activeReservations, setActiveReservations] = useState<FormattedReservation[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<FormattedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          cars (
            brand,
            model,
            plate
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const active: FormattedReservation[] = data
          .filter(r => r.status !== 'Completed' && r.status !== 'Cancelled')
          .map(r => ({
            ...r,
            id_short: r.id.slice(0, 8).toUpperCase(),
            client: r.customer_name,
            carName: r.cars ? `${r.cars.brand} ${r.cars.model}` : 'Unknown Car',
            carPlate: r.cars?.plate || '—',
            pickup: new Date(r.start_date).toLocaleDateString(),
            return: new Date(r.end_date).toLocaleDateString(),
            state: r.status,
            price: `$${parseFloat(String(r.total_price || 0)).toFixed(2)}`,
            statusColor: r.status === 'Confirmed' ? 'bg-primary/10 text-primary' : 
                         r.status === 'In Progress' ? 'bg-accent-blue/10 text-accent-blue' :
                         'bg-overdue-red/10 text-overdue-red'
          }));

        const completed: FormattedReservation[] = data
          .filter(r => r.status === 'Completed')
          .map(r => ({
            ...r,
            id_short: r.id.slice(0, 8).toUpperCase(),
            client: r.customer_name,
            clientType: 'Regular',
            carName: r.cars ? `${r.cars.brand} ${r.cars.model}` : 'Unknown Car',
            carPlate: r.cars?.plate || '—',
            mileage: 'N/A',
            durationString: `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}`,
            hours: 'N/A',
            pickup: new Date(r.start_date).toLocaleDateString(),
            return: new Date(r.end_date).toLocaleDateString(),
            state: r.status,
            price: `$${parseFloat(String(r.total_price || 0)).toFixed(2)}`
          }));

        setActiveReservations(active);
        setRecentlyCompleted(completed);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const allData = [...activeReservations, ...recentlyCompleted];
    const { success, error } = await gasService.exportData('reservations', allData);
    if (!success) {
      alert(`Export failed: ${error}`);
    } else {
      alert('Data exported to Google Sheets successfully!');
    }
    setIsExporting(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleOpenEdit = (res: FormattedReservation) => {
    setSelectedReservation(res);
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (res: FormattedReservation) => {
    setSelectedReservation(res);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="w-full">
      {/* Page Header Section */}
      <div className="bg-muted-mint py-8">
        <div className="max-w-[1440px] mx-auto px-margin">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-gutter pl-0">
            <div>
              <h1 className="font-h1 text-h3 md:text-h2 text-midnight font-extrabold">Reservations</h1>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2.5 bg-midnight text-white font-button text-sm rounded-none industrial-shadow hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'EXPORTING...' : 'EXPORT TO SHEETS'}
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-2.5 bg-primary text-white font-button text-sm rounded-none industrial-shadow hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Reservation
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddReservationModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          fetchReservations();
        }} 
      />

      {selectedReservation && (
        <EditReservationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            fetchReservations();
          }}
          reservationData={selectedReservation}
        />
      )}

      {selectedReservation && (
        <ReservationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            fetchReservations();
          }}
          reservationData={selectedReservation}
        />
      )}

      {/* Section: Active Reservations */}
      <section className="bg-muted-mint py-lg">
        <div className="max-w-[1440px] mx-auto px-margin">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-accent-blue">Active Reservations</h2>
            <div className="h-[1px] flex-grow bg-midnight/10"></div>
            <span className="px-3 py-1 bg-accent-blue text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap">{activeReservations.length} Active</span>
          </div>
          <div className="lg:bg-white lg:industrial-shadow overflow-hidden min-h-[200px] flex items-center justify-center">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">Fetching Reservations...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse responsive-table">
                <thead>
                  <tr className="bg-[#1E293B] text-white font-sans text-xs uppercase tracking-widest border-b border-midnight/20">
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Reservation ID</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Client</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Car</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Pickup</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Return</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">State</th>
                    <th className="py-4 px-6 text-center font-extrabold">Total Price</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-midnight leading-[1.6]">
                  {activeReservations.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted-mint transition-all border-border-tint">
                      <td 
                        onClick={() => handleOpenEdit(row)}
                        className="py-6 px-6 text-center border-r border-border-tint standard-row-text cursor-pointer hover:text-primary transition-colors" 
                        data-label="Reservation ID"
                      >
                        {row.id_short}
                      </td>
                      <td className="py-6 px-6 text-center border-r border-border-tint standard-row-text" data-label="Client"><span className="cursor-pointer hover:underline" onClick={() => handleOpenEdit(row)}>{row.client}</span></td>
                      <td className="py-6 px-6 text-center border-r border-border-tint standard-row-text" data-label="Car"><span className="cursor-pointer hover:underline" onClick={() => handleOpenEdit(row)}>{row.carName}</span></td>
                      <td className="py-6 px-6 text-center border-r border-border-tint standard-row-text" data-label="Pickup">{row.pickup}</td>
                      <td className="py-6 px-6 text-center border-r border-border-tint standard-row-text" data-label="Return">{row.return}</td>
                      <td className="py-6 px-6 text-center border-r border-border-tint" data-label="State">
                        <span className={`px-2 py-1 ${row.statusColor} text-[11px] font-black uppercase tracking-tighter inline-block`}>{row.state}</span>
                      </td>
                      <td className="py-6 px-6 text-center standard-row-text" data-label="Total Price">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* Section: Recently Completed */}
      <section className="bg-muted-mint py-lg pb-12">
        <div className="max-w-[1440px] mx-auto px-margin">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-primary">Recently Completed</h2>
            <div className="h-[1px] flex-grow bg-midnight/10"></div>
            <a className="px-4 py-1 bg-midnight text-white text-xs font-bold uppercase tracking-widest hover:brightness-125 transition-colors flex items-center gap-2 whitespace-nowrap" href="#">
              History
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="lg:bg-white lg:industrial-shadow overflow-hidden">
            <table className="w-full text-left border-collapse responsive-table">
              <thead>
                <tr className="bg-[#1E293B] text-white font-sans text-xs uppercase tracking-[0.1em] border-b border-midnight/20">
                  <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Reservation ID</th>
                  <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Client</th>
                  <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Car Details</th>
                  <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Duration</th>
                  <th className="py-4 px-6 font-extrabold text-center">Total Price</th>
                </tr>
              </thead>
              <tbody className="font-sans text-midnight leading-[1.6]">
                {recentlyCompleted.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100/50 hover:bg-muted-mint transition-all">
                    <td onClick={() => handleOpenDetails(row)} className="py-6 px-6 font-bold text-midnight border-r border-slate-100 text-center cursor-pointer hover:text-primary transition-colors" data-label="Reservation ID">{row.id_short}</td>
                    <td className="py-6 px-6 border-r border-slate-100 text-center" data-label="Client">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold cursor-pointer hover:text-primary transition-colors">{row.client}</div>
                        <div className={`text-[11px] font-bold uppercase tracking-tighter ${row.clientType === 'Repeat Customer' ? 'text-primary' : 'text-midnight/40'}`}>
                          {row.clientType}
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 border-r border-slate-100 text-center" data-label="Car Details">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold cursor-pointer hover:text-primary transition-colors">{row.carName}</div>
                        <div className="text-xs text-midnight">Mileage Driven: {row.mileage}</div>
                      </div>
                    </td>
                    <td className="py-6 px-6 border-r border-slate-100 text-center" data-label="Duration">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold text-accent-blue">{row.durationString}</div>
                        <div className="text-xs text-midnight">{row.hours}</div>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center font-bold text-midnight" data-label="Total Price">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

