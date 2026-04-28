import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Languages, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { supabase } from '../lib/supabase';
import { useVerifiedTime } from '../hooks/useVerifiedTime';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { verifiedTime } = useVerifiedTime();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [connectivity, setConnectivity] = useState({ text: 'Active', color: '#31A984' });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('cars').select('id').limit(1);
        if (error) throw error;
        setConnectivity({ text: 'Active', color: '#31A984' });
      } catch (err) {
        console.error('Supabase connection error:', err);
        setConnectivity({ text: 'Offline', color: '#EF4444' });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 120000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const formatHeaderClock = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    const dateStr = date.toLocaleDateString('en-GB');
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${dayName}, ${dateStr} ${timeStr}`;
  };

  const navItems = [
    { name: 'Reservations', path: '/' },
    { name: 'Archive', path: '/archive' },
    { name: 'Fleet', path: '/fleet' },
    { name: 'Financials', path: '/financials' },
    { name: 'Tools', path: '/tools' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted-mint selection:bg-primary/30">
      {/* Header: Brand Bar */}
      <header className="z-[60] w-full flex flex-col items-center bg-slate-blue pt-2 px-2 sticky top-0">
        <div className="w-full max-w-[1440px] px-8 md:px-margin flex items-center justify-between h-14">
          <div className="text-xl font-black tracking-tighter text-white shrink-0">
            RentalCore
          </div>
          <div className="flex items-center gap-4 md:gap-6 text-white overflow-hidden">
            <div className="text-[10px] md:text-sm font-medium opacity-90 whitespace-nowrap">
              {formatHeaderClock(verifiedTime)}
            </div>
            <div className="relative">
              <button 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 p-1.5 hover:bg-white/10 rounded-none transition-all"
              >
                <Languages className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">EN</span>
              </button>
              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full pt-2"
                  >
                    <div className="bg-white text-midnight shadow-xl border border-border-tint min-w-[120px] py-1">
                      <button className="w-full text-left block px-4 py-2 text-xs font-bold hover:bg-muted-mint transition-colors">ENGLISH</button>
                      <button className="w-full text-left block px-4 py-2 text-xs font-bold hover:bg-muted-mint transition-colors">ARABIC</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="z-50 w-full bg-nav-bg sticky top-16 md:top-[64px] border-b-2 border-midnight">
        <div className="max-w-[1440px] mx-auto flex flex-wrap font-sans font-semibold uppercase tracking-wider text-[10px] md:text-xs justify-center px-4 md:px-margin py-2 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-4 md:px-6 py-3 transition-all border-2 border-midnight ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-midnight hover:bg-black/5'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 w-full bg-slate-blue text-white py-2 z-[100] border-t border-white/5 pb-2 px-2">
        <div className="max-w-[1440px] mx-auto px-4 md:px-margin flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shrink-0">
            <span className="opacity-70 hidden xs:inline">Server Connection</span>
            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5">
              <Circle 
                className="w-2 h-2 fill-current" 
                style={{ color: connectivity.color, filter: `drop-shadow(0 0 4px ${connectivity.color})` }} 
              />
              <span id="conn-status">{connectivity.text}</span>
            </div>
          </div>
          <div className="text-[9px] md:text-[10px] opacity-40 text-right">
            © 2026 RentalCore Enterprise
          </div>
        </div>
      </footer>
    </div>
  );
}
