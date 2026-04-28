import { RefreshCw, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReservationDetailsModal from '../components/ReservationDetailsModal';
import { supabase } from '../lib/supabase';

export default function Archive() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          cars (
            brand,
            model
          )
        `)
        .in('status', ['Completed', 'Cancelled'])
        .order('end_date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(r => ({
          id: r.id.slice(0, 8).toUpperCase(),
          client: r.customer_name,
          clientType: 'Regular',
          car: r.cars ? `${r.cars.brand} ${r.cars.model}` : 'Unknown Car',
          mileage: 'N/A',
          duration: `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}`,
          hours: 'N/A',
          price: `$${parseFloat(r.total_price).toFixed(2)}`
        }));
        setArchiveData(formatted);
      }
    } catch (error) {
      console.error('Error fetching archive:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    fetchArchive().finally(() => setIsSyncing(false));
  };

  const handleOpenDetails = (res: any) => {
    setSelectedReservation(res);
    setIsModalOpen(true);
  };

  const totalRevenue = archiveData.reduce((acc, curr) => acc + parseFloat(curr.price.replace('$', '')), 0);

  return (
    <div className="w-full bg-ice-blue min-h-full pb-10">
      <div className="py-8">
        <div className="max-w-[1440px] mx-auto px-margin">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-gutter">
            <h1 className="font-h1 text-[2.25rem] leading-[1.6] tracking-[0.01em] font-bold text-midnight">Archive History</h1>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="px-6 py-2.5 bg-primary text-white font-button text-sm rounded-none industrial-shadow hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'SYNCING...' : 'REFRESH ARCHIVE'}</span>
            </button>
          </div>
        </div>
      </div>

      <ReservationDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchArchive();
        }} 
        reservationData={selectedReservation}
      />

      <section className="py-lg">
        <div className="max-w-[1440px] mx-auto px-margin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-12">
            <div className="bg-white industrial-shadow p-8 flex flex-col gap-2">
              <p className="font-sans text-xs text-ink/60 uppercase tracking-widest font-bold">Total Archive Revenue</p>
              <h3 className="text-2xl font-bold text-ink">${totalRevenue.toFixed(2)}</h3>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Sum of Completed Records</p>
            </div>
            <div className="bg-white industrial-shadow p-8 flex flex-col gap-2">
              <p className="font-sans text-xs text-ink/60 uppercase tracking-widest font-bold">Total Finished Entries</p>
              <h3 className="text-2xl font-bold text-ink">{archiveData.length}</h3>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mt-1">Status: Completed or Cancelled</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-ink">Rental History</h2>
            <div className="h-[1px] flex-grow bg-ink/10"></div>
            <span className="px-3 py-1 bg-ink text-white text-xs font-bold uppercase tracking-widest">{archiveData.length} Entries</span>
          </div>

          <div className="md:bg-white md:industrial-shadow overflow-hidden min-h-[200px] flex items-center justify-center">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">Loading Archive...</p>
              </div>
            ) : archiveData.length === 0 ? (
              <div className="py-12 text-center text-midnight/40 font-bold uppercase tracking-widest">
                No archived records found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse responsive-table">
                <thead>
                  <tr className="bg-[#1E293B] text-white font-sans text-xs uppercase tracking-[0.1em] border-b border-ink/20">
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Reservation ID</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Client</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Car Details</th>
                    <th className="py-4 px-6 border-r border-white/10 font-extrabold text-center">Duration</th>
                    <th className="py-4 px-6 font-extrabold text-center">Total Price</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-ink">
                  {archiveData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100/50 hover:bg-muted-mint transition-all">
                      <td onClick={() => handleOpenDetails(row)} className="py-6 px-6 font-bold text-ink border-r border-slate-100 text-center cursor-pointer hover:text-primary transition-colors" data-label="Reservation ID">{row.id}</td>
                      <td className="py-6 px-6 border-r border-slate-100 text-center" data-label="Client">
                        <div className="flex flex-col items-center">
                          <div className="font-semibold cursor-pointer hover:text-primary transition-colors">{row.client}</div>
                          <div className={`text-[11px] font-bold uppercase tracking-tighter ${row.clientType === 'Repeat Customer' ? 'text-primary' : 'text-ink/40'}`}>
                            {row.clientType}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6 border-r border-slate-100 text-center" data-label="Car Details">
                        <div className="flex flex-col items-center">
                          <div className="font-semibold cursor-pointer hover:text-primary transition-colors">{row.car}</div>
                          <div className="text-xs text-ink">Mileage Driven: {row.mileage}</div>
                        </div>
                      </td>
                      <td className="py-6 px-6 border-r border-slate-100 text-center" data-label="Duration">
                        <div className="flex flex-col items-center">
                          <div className="font-semibold text-accent-blue">{row.duration}</div>
                          <div className="text-xs text-ink">{row.hours}</div>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-center font-bold text-ink" data-label="Total Price">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
