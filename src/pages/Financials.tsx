import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Financials() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    lastMonthIncome: 0,
    currentMonthIncome: 0,
    lastMonthName: '',
    currentMonthName: ''
  });

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('total_price, start_date, status')
        .eq('status', 'Completed');

      if (error) throw error;

      if (data) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const total = data.reduce((acc, curr) => acc + parseFloat(curr.total_price || '0'), 0);
        
        const currentMonthData = data.filter(r => {
          const d = new Date(r.start_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        
        const lastMonthData = data.filter(r => {
          const d = new Date(r.start_date);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const currentTotal = currentMonthData.reduce((acc, curr) => acc + parseFloat(curr.total_price || '0'), 0);
        const lastTotal = lastMonthData.reduce((acc, curr) => acc + parseFloat(curr.total_price || '0'), 0);

        setStats({
          totalIncome: total,
          currentMonthIncome: currentTotal,
          lastMonthIncome: lastTotal,
          currentMonthName: now.toLocaleString('default', { month: 'long' }),
          lastMonthName: new Date(lastMonthYear, lastMonth).toLocaleString('default', { month: 'long' })
        });
      }
    } catch (error) {
      console.error('Error fetching financials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="w-full bg-muted-cream min-h-screen">
      <main className="w-full">
        <div className="py-12">
          <div className="max-w-[1440px] mx-auto px-margin">
            <h1 className="font-h1 text-4xl sm:text-5xl md:text-6xl text-ink mb-12 font-extrabold">Financials</h1>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">Calculating Financials...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                  <div className="bg-white p-8 border border-border-tint shadow-[0_4px_20px_rgba(19,27,46,0.04)] industrial-shadow">
                    <p className="text-xs font-bold text-slate-blue mb-2 uppercase tracking-widest">Total Business Income (All Time)</p>
                    <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2">{formatCurrency(stats.totalIncome)}</h2>
                    <p className="text-primary font-bold">Reflected from Completed Reservations</p>
                  </div>

                  <div className="bg-white p-8 border border-border-tint shadow-[0_4px_20px_rgba(19,27,46,0.04)] industrial-shadow">
                    <p className="text-xs font-bold text-slate-blue mb-2 uppercase tracking-widest">Last Month’s Income</p>
                    <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2">{formatCurrency(stats.lastMonthIncome)}</h2>
                    <p className="text-slate-blue font-semibold">{stats.lastMonthName}</p>
                  </div>

                  <div className="bg-white p-8 border border-border-tint shadow-[0_4px_20px_rgba(19,27,46,0.04)] industrial-shadow">
                    <p className="text-xs font-bold text-slate-blue mb-2 uppercase tracking-widest">Current Month’s Income</p>
                    <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2">{formatCurrency(stats.currentMonthIncome)}</h2>
                    <p className="text-primary italic font-bold">{stats.currentMonthName} (In Progress)</p>
                  </div>
                </div>

                <section className="max-w-3xl">
                  <h3 className="text-2xl font-bold text-midnight mb-4">Financial Policy</h3>
                  <div className="bg-white p-6 border border-border-tint industrial-shadow">
                    <p className="text-midnight/70 leading-relaxed">
                      Revenue is calculated based on "Completed" reservation status. Confirmed or Cancelled reservations are not factored into the total income logic to ensure fiscal accuracy.
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
