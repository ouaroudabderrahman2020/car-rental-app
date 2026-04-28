import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

type ViewMode = 'day' | 'month' | 'year';

export default function CalendarTool() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() + direction);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + direction);
    if (viewMode === 'year') newDate.setFullYear(currentDate.getFullYear() + direction);
    setCurrentDate(newDate);
  };

  const renderHeader = () => {
    let title = '';
    if (viewMode === 'day') title = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (viewMode === 'month') title = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
              {mode}
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

  const renderDayView = () => (
    <div className="p-8 flex flex-col items-center justify-center space-y-4">
      <div className="text-8xl font-black text-midnight-ink">{currentDate.getDate()}</div>
      <div className="text-2xl font-bold text-primary uppercase tracking-[0.2em]">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
      <div className="w-full max-w-md bg-muted-cream p-4 border-l-4 border-midnight-ink text-sm font-medium">
        No specific schedule records found for this workstation today.
      </div>
    </div>
  );

  const renderMonthView = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="p-4 grid grid-cols-7 gap-1 font-sans">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-black uppercase tracking-widest text-midnight-ink/40">{d}</div>
        ))}
        {days.map((day, idx) => (
          <div 
            key={idx} 
            className={`aspect-square flex items-center justify-center text-sm font-bold border border-midnight-ink/5 transition-all ${day ? 'hover:bg-muted-mint cursor-pointer' : 'bg-transparent'} ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() ? 'bg-primary text-white shadow-inner' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleDateString('en-US', { month: 'short' }));
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
