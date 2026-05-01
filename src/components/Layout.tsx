import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Languages, Circle, Loader2, CheckCircle2, AlertCircle, Menu, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';
import { useVerifiedTime, SyncStatus } from '../hooks/useVerifiedTime';
import { useStatus } from '../contexts/StatusContext';

import { NavigationOverlay, MenuButton } from './Navigation';

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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Handle body scroll locking
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  // Handle scroll for floating menu
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderVisible(scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen flex flex-col bg-white selection:bg-primary/30">
      {/* Floating Sticky Mobile Menu Icon */}
      <AnimatePresence>
        {(!isHeaderVisible || isMenuOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-2 right-4 rtl:right-auto rtl:left-4 z-[110]"
          >
            <MenuButton 
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 transition-colors ${
                isMenuOpen ? 'text-ink bg-ink/5' : 'text-ink bg-white/80 backdrop-blur-sm shadow-sm hover:bg-ink/5'
              }`}
              iconClassName="w-6 h-6"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: Brand Bar - Integrated & Borderless-ish */}
      <header className="z-[60] w-full flex flex-col items-center bg-white border-b border-slate-100 relative">
        <div className="w-full max-w-[1440px] px-4 md:px-margin flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="text-xl md:text-2xl font-black tracking-tighter text-ink shrink-0 hover:text-primary transition-colors">
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
                      isActive ? 'text-primary' : 'text-ink/60 hover:text-ink'
                    }`
                  }
                >
                  {item.name}
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-6 text-ink">
            <div 
              className="flex items-center gap-2 text-[9px] md:text-xs font-bold opacity-70 whitespace-nowrap uppercase tracking-widest group relative cursor-help"
              title={formatHeaderClock(verifiedTime)}
            >
              <SyncIcon status={syncStatus} />
              <span className="hidden md:inline">{formatHeaderClock(verifiedTime)}</span>
              <Clock className="w-3.5 h-3.5 md:hidden" />
              
              {/* Custom Tooltip for mobile/icon view */}
              <div className="absolute top-full mt-2 right-0 bg-midnight-ink text-white text-[10px] py-2 px-3 industrial-shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 md:hidden">
                {formatHeaderClock(verifiedTime)}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative lang-switcher-container">
                <button 
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 p-1.5 hover:bg-ink/5 rounded-none transition-all border border-transparent hover:border-ink/10"
                >
                  <Languages className="w-4 h-4 md:w-5 md:h-5 text-ink" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">
                    {i18n.language.split('-')[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute end-0 top-full pt-2 z-[70]"
                    >
                      <div className="bg-white text-midnight shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-2 border-midnight min-w-[140px] py-1">
                        <button 
                          onClick={() => { i18n.changeLanguage('en'); setLangDropdownOpen(false); }}
                          className={`w-full text-start block px-5 py-3 text-[10px] font-black tracking-widest transition-colors hover:bg-primary hover:text-white ${i18n.language.startsWith('en') ? 'bg-white text-midnight' : ''}`}
                        >
                          ENGLISH
                        </button>
                        <button 
                          onClick={() => { i18n.changeLanguage('fr'); setLangDropdownOpen(false); }}
                          className={`w-full text-start block px-5 py-3 text-[10px] font-black tracking-widest transition-colors hover:bg-primary hover:text-white ${i18n.language.startsWith('fr') ? 'bg-white text-midnight' : ''}`}
                        >
                          FRANÇAIS
                        </button>
                        <button 
                          onClick={() => { i18n.changeLanguage('ar'); setLangDropdownOpen(false); }}
                          className={`w-full text-start block px-5 py-3 text-[10px] font-black tracking-widest transition-colors hover:bg-primary hover:text-white ${i18n.language.startsWith('ar') ? 'bg-white text-midnight' : ''}`}
                        >
                          العربية
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button - only show when menu is NOT open to avoid double buttons on top of each other */}
              {!isMenuOpen && (
                <MenuButton 
                  isOpen={isMenuOpen}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 hover:bg-ink/5 transition-colors z-[110] text-ink"
                  iconClassName="w-6 h-6"
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Overlay Navigation */}
        <NavigationOverlay 
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          navItems={navItems}
          formatHeaderClock={formatHeaderClock}
          verifiedTime={verifiedTime}
        />
      </header>

      <main className="flex-1 w-full overflow-x-hidden">
        {title && (
          <div className="max-w-[1440px] mx-auto px-4 md:px-margin pt-6 v-title-gap">
            <h1 className="text-fluid-h1 font-black text-ink uppercase tracking-tight break-words m-0">
              {title}
            </h1>
          </div>
        )}
        {children}
      </main>

      {/* Slim Borderless Sticky Footer */}
      <footer className="sticky bottom-0 w-full bg-white text-ink/40 py-3 border-t border-slate-50 z-[50] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-margin flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: connectivity.color }} 
              />
              <span>{connectivity.text === 'Active' ? t('common.active') : t('common.offline', 'Offline')}</span>
            </div>
            
            {status && (
              <div className="flex items-center gap-2">
                {type === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{status}</span>
              </div>
            )}
          </div>

          <div>
            © 2026 RentalCore Enterprise
          </div>
        </div>
      </footer>
    </div>
  );
}
