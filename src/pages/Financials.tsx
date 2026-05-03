import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw, Search, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStatus } from '../contexts/StatusContext';
import Layout from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */

export default function Financials() {
  const { t, i18n } = useTranslation();
  const { setStatus } = useStatus();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    lastMonthIncome: 0,
    currentMonthIncome: 0,
    lastMonthName: '',
    currentMonthName: ''
  });

  const fetchFinancials = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          total_price,
          start_date,
          status,
          customer_name,
          car:cars (
            brand,
            model,
            plate
          )
        `)
        .eq('status', 'Completed')
        .order('start_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data);
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
          currentMonthName: now.toLocaleString(i18n.language, { month: 'long' }),
          lastMonthName: new Date(lastMonthYear, lastMonth).toLocaleString(i18n.language, { month: 'long' })
        });
      }
    } catch (error) {
      console.error('Error fetching financials:', error);
      setStatus(t('common.error', 'An error occurred while fetching data.'), 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [i18n.language]);

  const handleRefresh = () => {
    fetchFinancials(true);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const search = searchQuery.toLowerCase();
      return (
        tx.customer_name?.toLowerCase().includes(search) ||
        tx.id.toLowerCase().includes(search) ||
        (tx.car?.brand + ' ' + tx.car?.model).toLowerCase().includes(search) ||
        tx.car?.plate?.toLowerCase().includes(search)
      );
    });
  }, [transactions, searchQuery]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <Layout>
      <div className="w-full bg-white min-h-screen">
        <PageHeader 
          title={t('financials.title')}
          actions={
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? t('common.refreshing', 'Refreshing...') : t('common.refresh', 'Refresh Data')}</span>
            </button>
          }
          className="p-6 md:p-10 border-b border-slate-200"
        />
        <main className="w-full">
          <div className="py-12">
            <div className="max-w-[1440px] mx-auto">
              {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('financials.calculating')}</p>
              </div>
            ) : (
              <div className="v-section-gap px-4">
                <Section2 title={t('financials.overview', 'Financial Overview')}>
                  <div className="flex flex-col gap-8">
                    {/* Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Button moved to PageHeader */}

                      <div className="relative group w-full md:w-80">
                        <input 
                          type="text" 
                          placeholder={t('financials.searchTransactions', 'Search transactions...')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-ink text-sm focus:bg-white focus:border-primary transition-all outline-none rounded-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-fluid-sm font-bold text-slate-blue uppercase tracking-widest">{t('financials.totalIncome')}</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2 font-mono tracking-tighter">{formatCurrency(stats.totalIncome)}</h2>
                        <p className="text-primary font-bold text-xs uppercase tracking-widest">{t('financials.refCompleted')}</p>
                      </div>

                      <div className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-slate-500/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-slate-500" />
                          </div>
                          <p className="text-fluid-sm font-bold text-slate-blue uppercase tracking-widest">{t('financials.lastMonth')}</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2 font-mono tracking-tighter">{formatCurrency(stats.lastMonthIncome)}</h2>
                        <p className="text-slate-blue font-semibold text-xs uppercase tracking-widest">{stats.lastMonthName}</p>
                      </div>

                      <div className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                          </div>
                          <p className="text-fluid-sm font-bold text-slate-blue uppercase tracking-widest">{t('financials.currentMonth')}</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2 font-mono tracking-tighter">{formatCurrency(stats.currentMonthIncome)}</h2>
                        <p className="text-emerald-600 italic font-bold text-xs uppercase tracking-widest">{stats.currentMonthName} ({t('financials.inProgress')})</p>
                      </div>
                    </div>
                  </div>
                </Section2>

                {/* Transaction History Section */}
                <Section2 title={t('financials.transactions', 'Transaction History')}>
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-ink/60 font-sans text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
                            <th className="py-4 px-6 font-bold text-center border-e border-slate-100">{t('common.date', 'Date')}</th>
                            <th className="py-4 px-6 font-bold text-center border-e border-slate-100">{t('reservations.id', 'Ref')}</th>
                            <th className="py-4 px-6 font-bold text-center border-e border-slate-100">{t('common.customer', 'Customer')}</th>
                            <th className="py-4 px-6 font-bold text-center border-e border-slate-100">{t('common.car', 'Vehicle')}</th>
                            <th className="py-4 px-6 font-bold text-center">{t('common.amount', 'Amount')}</th>
                          </tr>
                        </thead>
                        <tbody className="font-sans text-midnight leading-[1.6]">
                          {filteredTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-midnight/40 font-bold uppercase tracking-widest">
                                {t('common.noData')}
                              </td>
                            </tr>
                          ) : (
                            filteredTransactions.map((tx) => (
                              <tr key={tx.id} className="border-b hover:bg-slate-50/50 transition-all border-slate-100 group">
                                <td className="py-5 px-6 text-center border-e border-slate-100 text-[11px] font-mono opacity-70 tracking-tighter">
                                  {new Date(tx.start_date).toLocaleDateString(i18n.language)}
                                </td>
                                <td className="py-5 px-6 text-center border-e border-slate-100 font-mono text-[11px] font-bold text-primary tracking-tighter">
                                  {tx.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="py-5 px-6 text-center border-e border-slate-100 font-bold text-xs uppercase tracking-tight">
                                  {tx.customer_name}
                                </td>
                                <td className="py-5 px-6 text-center border-e border-slate-100 text-[11px] font-medium">
                                  <div className="flex flex-col">
                                    <span className="font-bold opacity-80 uppercase">{tx.car?.brand} {tx.car?.model}</span>
                                    <span className="text-[10px] font-mono opacity-50 tracking-tighter">{tx.car?.plate}</span>
                                  </div>
                                </td>
                                <td className="py-5 px-6 text-center font-mono font-bold text-midnight tracking-tighter text-sm">
                                  {formatCurrency(parseFloat(tx.total_price || '0'))}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Section2>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  </Layout>
);
}
