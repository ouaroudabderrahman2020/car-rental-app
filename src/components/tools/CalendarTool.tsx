import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Reservation } from '../../types';

type ViewMode = 'day' | 'month' | 'year';

export default function CalendarTool() {
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*');
      
      if (error) throw error;
      setReservations(data || []);
    } catch (err) {
      console.error('Error fetching reservations for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDayReservations = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = d.toISOString().split('T')[0];
    return reservations.filter(r => r.start_date === dateStr);
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() + direction);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + direction);
    if (viewMode === 'year') newDate.setFullYear(currentDate.getFullYear() + direction);
    setCurrentDate(newDate);
  };

  const renderHeader = () => {
    let title = '';
    if (viewMode === 'day') title = currentDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (viewMode === 'month') title = currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
    if (viewMode === 'year') title = currentDate.getFullYear().toString();

    return (
      <div className="flex items-center justify-between p-6 bg-midnight-ink text-white border-b-4 border-primary">
        <div className="flex gap-2">
          {(['day', 'month', 'year'] as ViewMode[]).map(mode => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest industrial-shadow transition-all ${viewMode === mode ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            >
              {mode === 'day' ? t('common.days.sun').slice(0, 3) : mode === 'month' ? t('nav.fleet').slice(0, 3) : t('fleet.year')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors"><ChevronLeft /></button>
          <span className="text-sm font-black uppercase tracking-widest">{title}</span>
          <button onClick={() => navigate(1)} className="hover:text-primary transition-colors"><ChevronRight /></button>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayRes = getDayReservations(currentDate.getDate());
    
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-6">
        <div className="text-8xl font-black text-midnight-ink">{currentDate.getDate()}</div>
        <div className="text-2xl font-bold text-primary uppercase tracking-[0.2em]">{currentDate.toLocaleDateString(i18n.language, { weekday: 'long' })}</div>
        
        <div className="w-full max-w-md space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-ink/40 border-b border-ink/10 pb-2">{t('nav.reservations')}</h4>
          {dayRes.length === 0 ? (
            <div className="bg-white p-4 border-l-4 border-midnight-ink/10 text-xs font-bold text-ink/40 uppercase tracking-widest italic">
              {t('common.noData')}
            </div>
          ) : (
            dayRes.map(res => (
              <div key={res.id} className="bg-white p-4 border-l-4 border-primary industrial-shadow space-y-1">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-tighter">
                  <span className="text-midnight-ink">{res.customer_name}</span>
                  <span className="text-primary">{res.status}</span>
                </div>
                <div className="text-[10px] text-ink/50 font-mono italic">
                  REF: {res.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const weekDays = [
      t('common.days.sun'), t('common.days.mon'), t('common.days.tue'), 
      t('common.days.wed'), t('common.days.thu'), t('common.days.fri'), t('common.days.sat')
    ];

    return (
      <div className="p-4 grid grid-cols-7 gap-1 font-sans">
        {weekDays.map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-black uppercase tracking-widest text-midnight-ink/40">{d.slice(0, 3)}</div>
        ))}
        {days.map((day, idx) => {
          const dayRes = day ? getDayReservations(day) : [];
          return (
            <div 
              key={idx} 
              onClick={() => day && setViewMode('day')}
              className={`relative aspect-square flex flex-col items-center justify-center text-sm font-bold border border-midnight-ink/5 transition-all ${day ? 'hover:bg-ink/5 cursor-pointer' : 'bg-transparent'} ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() ? 'bg-primary text-white shadow-inner' : ''}`}
            >
              {day}
              {dayRes.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayRes.slice(0, 3).map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${day === new Date().getDate() ? 'bg-white' : 'bg-primary'}`}></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleDateString(i18n.language, { month: 'short' }));
    return (
      <div className="p-8 grid grid-cols-3 sm:grid-cols-4 gap-4 font-sans">
        {months.map((m, idx) => (
          <div 
            key={m} 
            onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), idx)); setViewMode('month'); }}
            className={`aspect-square flex items-center justify-center text-xs font-black uppercase tracking-widest border-2 border-midnight-ink/10 hover:border-primary hover:text-primary transition-all cursor-pointer industrial-shadow ${currentDate.getMonth() === idx ? 'bg-midnight-ink text-white border-midnight-ink shadow-lg' : 'bg-white'}`}
          >
            {m}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto industrial-shadow bg-white overflow-hidden font-body">
      {renderHeader()}
      <div className="min-h-[400px]">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'year' && renderYearView()}
      </div>
    </div>
  );
}
