import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { SectionHeader } from '../components/SectionHeader';

export default function Financials() {
  const { t, i18n } = useTranslation();
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
          currentMonthName: now.toLocaleString(i18n.language, { month: 'long' }),
          lastMonthName: new Date(lastMonthYear, lastMonth).toLocaleString(i18n.language, { month: 'long' })
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
  }, [i18n.language]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <Layout title={t('financials.title')}>
      <div className="w-full bg-white min-h-screen">
        <main className="w-full">
          <div className="py-12">
            <div className="max-w-[1440px] mx-auto px-margin">
              {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-bold uppercase tracking-[0.2em] text-midnight/40">{t('financials.calculating')}</p>
              </div>
            ) : (
              <div className="v-section-gap">
                <SectionHeader title={t('financials.overview', 'Financial Overview')} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-fluid-sm font-bold text-slate-blue mb-2 uppercase tracking-widest">{t('financials.totalIncome')}</p>
                    <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2">{formatCurrency(stats.totalIncome)}</h2>
                    <p className="text-primary font-bold text-fluid-base">{t('financials.refCompleted')}</p>
                  </div>

                  <div className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-fluid-sm font-bold text-slate-blue mb-2 uppercase tracking-widest">{t('financials.lastMonth')}</p>
                    <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2">{formatCurrency(stats.lastMonthIncome)}</h2>
                    <p className="text-slate-blue font-semibold text-fluid-base">{stats.lastMonthName}</p>
                  </div>

                  <div className="bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-fluid-sm font-bold text-slate-blue mb-2 uppercase tracking-widest">{t('financials.currentMonth')}</p>
                    <h2 className="text-3xl md:text-4xl text-midnight font-bold mb-2">{formatCurrency(stats.currentMonthIncome)}</h2>
                    <p className="text-primary italic font-bold text-fluid-base">{stats.currentMonthName} ({t('financials.inProgress')})</p>
                  </div>
                </div>

                <section className="max-w-3xl">
                  <SectionHeader title={t('financials.policyTitle')} className="mb-4" />
                  <div className="bg-white p-8 border border-slate-200 shadow-sm">
                    <p className="text-midnight/70 leading-relaxed mb-0">
                      {t('financials.policyText')}
                    </p>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  </Layout>
);
}
