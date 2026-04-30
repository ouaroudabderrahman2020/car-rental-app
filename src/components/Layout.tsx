import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Languages, Circle, Loader2, CheckCircle2, AlertCircle, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';
import { useVerifiedTime, SyncStatus } from '../hooks/useVerifiedTime';
import { useStatus } from '../contexts/StatusContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const SyncIcon = ({ status }: { status: SyncStatus }) => {
  switch (status) {
    case 'syncing':
      return (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
      );
    case 'success':
      return <CheckCircle2 className="w-3 h-3 text-[#31A984]" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return null;
  }
};

export default function Layout({ children, title }: LayoutProps) {
  const { verifiedTime, syncStatus } = useVerifiedTime();
  const { t, i18n } = useTranslation();
  const { status, type } = useStatus();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectivity, setConnectivity] = useState({ text: 'Active', color: '#31A984' });

  // Handle RTL/LTR direction
  useEffect(() => {
    const dir = i18n.language.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!langDropdownOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.lang-switcher-container')) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langDropdownOpen]);

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
    const days = [
      t('common.days.sun', 'Sun'),
      t('common.days.mon', 'Mon'),
      t('common.days.tue', 'Tue'),
      t('common.days.wed', 'Wed'),
      t('common.days.thu', 'Thu'),
      t('common.days.fri', 'Fri'),
      t('common.days.sat', 'Sat')
    ];
    const dayName = days[date.getDay()];
    const dateStr = date.toLocaleDateString('en-GB');
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${dayName}, ${dateStr} ${timeStr}`;
  };

  const navItems = [
    { name: t('nav.reservations'), path: '/' },
    { name: t('nav.archive'), path: '/archive' },
    { name: t('nav.fleet'), path: '/fleet' },
    { name: t('nav.financials'), path: '/financials' },
    { name: t('nav.crm'), path: '/clients' },
    { name: t('nav.tools'), path: '/tools' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted-mint selection:bg-primary/30">
      {/* Header: Brand Bar */}
      <header className="z-[60] w-full flex flex-col items-center bg-slate-blue sticky top-0 border-b border-white/10 shadow-lg">
        <div className="w-full max-w-[1440px] px-4 md:px-margin flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="text-xl md:text-2xl font-black tracking-tighter text-white shrink-0 hover:text-primary transition-colors">
              RentalCore
            </NavLink>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative group ${
                      isActive ? 'text-primary' : 'text-white/70 hover:text-white'
                    }`
                  }
                >
                  {item.name}
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-6 text-white">
            <div className="flex items-center gap-2 text-[9px] md:text-sm font-medium opacity-90 whitespace-nowrap">
              <SyncIcon status={syncStatus} />
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                <span>{formatHeaderClock(verifiedTime)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative lang-switcher-container">
                <button 
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 p-1.5 hover:bg-white/10 rounded-none transition-all border border-transparent hover:border-white/20"
                >
                  <Languages className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest leading-none">
                    {i18n.language.split('-')[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute end-0 top-full pt-2 z-[70]"
                    >
                      <div className="bg-white text-midnight shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-2 border-midnight min-w-[140px] py-1">
                        <button 
                          onClick={() => { i18n.changeLanguage('en'); setLangDropdownOpen(false); }}
                          className={`w-full text-start block px-5 py-3 text-[10px] font-black tracking-widest transition-colors hover:bg-primary hover:text-white ${i18n.language.startsWith('en') ? 'bg-muted-mint text-midnight' : ''}`}
                        >
                          ENGLISH
                        </button>
                        <button 
                          onClick={() => { i18n.changeLanguage('fr'); setLangDropdownOpen(false); }}
                          className={`w-full text-start block px-5 py-3 text-[10px] font-black tracking-widest transition-colors hover:bg-primary hover:text-white ${i18n.language.startsWith('fr') ? 'bg-muted-mint text-midnight' : ''}`}
                        >
                          FRANÇAIS
                        </button>
                        <button 
                          onClick={() => { i18n.changeLanguage('ar'); setLangDropdownOpen(false); }}
                          className={`w-full text-start block px-5 py-3 text-[10px] font-black tracking-widest transition-colors hover:bg-primary hover:text-white ${i18n.language.startsWith('ar') ? 'bg-muted-mint text-midnight' : ''}`}
                        >
                          العربية
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Overlay Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-slate-blue flex flex-col p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-16">
                <div className="text-2xl font-black tracking-tighter text-white">
                  RentalCore
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/10 transition-colors"
                >
                  <X className="w-8 h-8 text-white" />
                </button>
              </div>

              <nav className="flex flex-col gap-8">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) => 
                      `text-4xl md:text-5xl font-black uppercase tracking-tighter transition-all ${
                        isActive ? 'text-primary' : 'text-white/60 hover:text-white'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto pt-16 border-t border-white/10 flex flex-col gap-6">
                <div className="flex items-center justify-between text-white/60">
                  <span className="text-sm font-bold uppercase tracking-widest">Language</span>
                  <div className="flex gap-4">
                    <button onClick={() => i18n.changeLanguage('en')} className={`text-xs font-black p-2 ${i18n.language.startsWith('en') ? 'text-primary' : 'text-white'}`}>EN</button>
                    <button onClick={() => i18n.changeLanguage('fr')} className={`text-xs font-black p-2 ${i18n.language.startsWith('fr') ? 'text-primary' : 'text-white'}`}>FR</button>
                    <button onClick={() => i18n.changeLanguage('ar')} className={`text-xs font-black p-2 ${i18n.language.startsWith('ar') ? 'text-primary' : 'text-white'}`}>AR</button>
                  </div>
                </div>
                <div className="text-white/40 text-xs font-medium">
                  {formatHeaderClock(verifiedTime)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full overflow-x-hidden">
        {title && (
          <div className="max-w-[1440px] mx-auto px-4 md:px-margin pt-12">
            <h1 className="text-fluid-h1 font-black text-ink uppercase tracking-tight break-words m-0">
              {title}
            </h1>
          </div>
        )}
        {children}
      </main>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 w-full bg-slate-blue text-white py-2 z-[100] border-t border-white/5 pb-2 px-2">
        <div className="max-w-[1440px] mx-auto px-4 md:px-margin flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shrink-0">
            <span className="opacity-70 hidden xs:inline">{t('common.serverConnection', 'Server Connection')}</span>
            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5">
              <Circle 
                className="w-2 h-2 fill-current" 
                style={{ color: connectivity.color, filter: `drop-shadow(0 0 4px ${connectivity.color})` }} 
              />
              <span id="conn-status">{connectivity.text === 'Active' ? t('common.active') : t('common.offline', 'Offline')}</span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex-1 flex justify-center px-4 overflow-hidden">
            <motion.div 
              key={status}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 md:px-6 py-1 bg-white/5 border border-white/10 max-w-xs md:max-w-md w-full justify-center"
            >
              {type === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
              {type === 'success' && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
              {type === 'error' && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] truncate ${
                type === 'success' ? 'text-primary' : 
                type === 'error' ? 'text-red-400' : 
                'text-white/90'
              }`}>
                {status || t('common.systemReady')}
              </span>
            </motion.div>
          </div>

          <div className="text-[9px] md:text-[10px] opacity-40 text-end shrink-0">
            © 2026 RentalCore Enterprise
          </div>
        </div>
      </footer>
    </div>
  );
}
