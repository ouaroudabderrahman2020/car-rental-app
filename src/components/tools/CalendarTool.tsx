import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Target, LayoutGrid } from 'lucide-react';

export default function ResponsiveCalendar() {
  const [view, setView] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic scaling logic
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      // Target size for calendar is ~400x600 based on standard view
      const scaleX = (parentRect.width - 20) / 400;
      const scaleY = (parentRect.height - 20) / 600;
      const newScale = Math.min(scaleX, scaleY);
      setScale(Math.max(0.4, Math.min(newScale, 1.05)));
    };
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current.parentElement) observer.observe(containerRef.current.parentElement);
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setView('month');
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const changeYear = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear() + offset, currentDate.getMonth(), 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    // Days from previous month to fill the start
    const prevMonthDays = daysInMonth(year, month - 1);
    
    const cells = [];

    // 1. FILL PREVIOUS MONTH DAYS (GRAY)
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push(
        <div key={`prev-${i}`} className="aspect-square border border-slate-100 bg-slate-50 flex items-center justify-center">
          <span className="text-sm sm:text-base font-bold text-slate-300">{prevMonthDays - i}</span>
        </div>
      );
    }

    // 2. FILL CURRENT MONTH DAYS
    for (let day = 1; day <= totalDays; day++) {
      const isToday = 
        day === new Date().getDate() && 
        month === new Date().getMonth() && 
        year === new Date().getFullYear();
      
      const isSelected = 
        day === selectedDate.getDate() && 
        month === selectedDate.getMonth() && 
        year === selectedDate.getFullYear();

      cells.push(
        <button
          key={`curr-${day}`}
          onClick={() => setSelectedDate(new Date(year, month, day))}
          className={`aspect-square border border-slate-200 flex items-center justify-center transition-all active:scale-90
            ${isSelected ? 'bg-slate-900 text-white z-10' : 'bg-white text-slate-900 hover:bg-slate-50'}
            ${isToday && !isSelected ? 'text-emerald-600 font-black ring-1 ring-inset ring-emerald-100' : ''}
          `}
          style={{ borderRadius: '0px' }}
        >
          <span className="text-sm sm:text-base font-bold">{day}</span>
        </button>
      );
    }

    // 3. FILL NEXT MONTH DAYS (GRAY) TO COMPLETE THE 6-ROW GRID (42 cells)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push(
        <div key={`next-${i}`} className="aspect-square border border-slate-100 bg-slate-50 flex items-center justify-center">
          <span className="text-sm sm:text-base font-bold text-slate-300">{i}</span>
        </div>
      );
    }

    return cells;
  };

  const renderYearView = () => {
    return monthNames.map((month, index) => {
      const isCurrentMonth = index === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
      return (
        <button
          key={month}
          onClick={() => {
            setCurrentDate(new Date(currentDate.getFullYear(), index, 1));
            setView('month');
          }}
          className={`aspect-[4/3] border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all hover:bg-slate-50 active:scale-95
            ${isCurrentMonth ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}
          `}
          style={{ borderRadius: '0px' }}
        >
          <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isCurrentMonth ? 'text-emerald-600' : 'text-slate-400'}`}>
            {month.substring(0, 3)}
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900">{index + 1}</span>
        </button>
      );
    });
  };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-100/30">
      <div 
        ref={containerRef}
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'center center',
          width: '400px', 
          height: '600px', 
          position: 'relative',
          borderRadius: '12px'
        }}
        className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden"
      >
        
        {/* Navigation Bar */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-900 flex flex-col gap-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setView(view === 'month' ? 'year' : 'month')}
                className="p-1.5 sm:p-2 bg-slate-900 text-white hover:bg-slate-800 transition-transform active:scale-90"
                style={{ borderRadius: '12px' }}
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate">
                  {view === 'month' ? monthNames[currentDate.getMonth()] : currentDate.getFullYear()}
                </h2>
                {view === 'month' && <span className="text-[8px] sm:text-[10px] font-black text-slate-400 tracking-widest">{currentDate.getFullYear()}</span>}
              </div>
            </div>
            
            <div className="flex gap-1 sm:gap-1.5 items-center">
              <button 
                onClick={goToToday}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-slate-900 text-[8px] sm:text-[10px] font-black uppercase hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                style={{ borderRadius: '12px' }}
              >
                <Target className="w-3 h-3" /> Today
              </button>

              <div className="flex border-2 border-slate-900 overflow-hidden" style={{ borderRadius: '12px' }}>
                <button onClick={() => view === 'month' ? changeMonth(-1) : changeYear(-1)} className="p-1.5 sm:p-2 hover:bg-slate-100 border-r-2 border-slate-900"><ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                <button onClick={() => view === 'month' ? changeMonth(1) : changeYear(1)} className="p-1.5 sm:p-2 hover:bg-slate-100"><ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="bg-white">
          {view === 'month' ? (
            <>
              <div className="grid grid-cols-7 border-b border-slate-900 bg-slate-50">
                {days.map(day => (
                  <div key={day} className="py-1.5 sm:py-2 text-center text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {renderMonthView()}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3">
              {renderYearView()}
            </div>
          )}
        </div>

        {/* Selection Footer */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-t border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="text-[8px] sm:text-[10px] font-black tracking-widest uppercase text-slate-400">Selected</span>
          </div>
          <span className="font-bold text-xs sm:text-sm">
            {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}