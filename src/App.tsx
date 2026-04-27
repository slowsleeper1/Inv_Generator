/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useInvoiceStore } from './store/useInvoiceStore';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Dashboard from './components/Dashboard';
import { Sun, Moon, RefreshCw, Edit3, Eye, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const { 
    invoice, 
    theme, 
    setTheme, 
    resetInvoice, 
    fetchReservations,
    fetchInvoices,
    fetchGuests,
    fetchStats
  } = useInvoiceStore();
  const [view, setView] = useState<'editor' | 'preview' | 'dashboard'>('dashboard');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved, 10) : 340;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 280 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    fetchReservations();
    fetchInvoices();
    fetchGuests();
    fetchStats();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-bg-window dark:bg-[#121212] text-text-main dark:text-gray-100 transition-colors duration-300 font-sans">
      {/* DESKTOP APP TITLE BAR - Traffic Lights */}
      <header 
        style={{ WebkitAppRegion: 'drag' } as any}
        className="h-[38px] min-h-[38px] flex items-center px-4 border-b border-border-theme dark:border-gray-800 bg-white dark:bg-[#1a1a1a] z-50 select-none"
      >
        <div className="hidden md:flex w-[68px] shrink-0" /> {/* Spacer for macOS Traffic Lights */}
        
        <div className="flex-1 text-center truncate pointer-events-none">
          <span className="text-[12px] md:text-[13px] font-semibold text-text-muted dark:text-gray-400">
            LuxeBill &mdash; {invoice.invoiceNumber}
          </span>
        </div>

        <div 
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="flex items-center gap-2"
        >
          <button 
            onClick={() => setView('editor')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
              view !== 'dashboard' ? "bg-accent-theme text-white shadow-lg shadow-accent-theme/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Edit3 size={14} />
            Editor
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
              view === 'dashboard' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <LayoutDashboard size={14} />
            Stats
          </button>
          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
          <button 
            onClick={() => setSidebarWidth(prev => prev === 0 ? 340 : 0)}
            className="p-1.5 text-gray-400 hover:text-accent-theme transition-colors hidden md:block"
            title={sidebarWidth === 0 ? "Show Sidebar" : "Hide Sidebar"}
          >
            <Eye size={14} />
          </button>
          <button 
            onClick={resetInvoice}
            className="p-1.5 text-gray-400 hover:text-accent-theme transition-colors"
            title="Reset"
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={toggleTheme}
            className="relative p-1.5 text-gray-400 hover:text-accent-theme transition-colors"
          >
            <AnimatePresence mode="wait">
              {theme === 'light' ? (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Moon size={14} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Sun size={14} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* MOBILE TAB SWITCHER */}
      <div className="flex md:hidden bg-white dark:bg-[#1a1a1a] border-b border-border-theme dark:border-gray-800">
        <button 
          onClick={() => setView('editor')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
            view === 'editor' ? "text-accent-theme border-b-2 border-accent-theme bg-accent-theme/5" : "text-text-muted"
          )}
        >
          <Edit3 size={14} />
          Edit
        </button>
        <button 
          onClick={() => setView('preview')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
            view === 'preview' ? "text-accent-theme border-b-2 border-accent-theme bg-accent-theme/5" : "text-text-muted"
          )}
        >
          <Eye size={14} />
          Preview
        </button>
      </div>

      {/* MAIN CONTENT AREA: Split View */}
      <main 
        className="flex-1 flex overflow-hidden bg-bg-window dark:bg-[#0f0f0f]"
        style={{ '--sidebar-width': `${sidebarWidth}px` } as any}
      >
        {view === 'dashboard' ? (
          <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-8">
            <Dashboard />
          </div>
        ) : (
          <>
            {/* LEFT PANEL: INPUTS (SIDEBAR) */}
            <aside 
              className={cn(
                "shrink-0 h-full transition-all duration-300 relative w-full md:w-[var(--sidebar-width)] overflow-hidden",
                sidebarWidth === 0 ? "md:opacity-0 md:pointer-events-none md:border-none" : "md:opacity-100",
                "md:translate-x-0 md:block",
                view === 'editor' ? "translate-x-0 block" : "-translate-x-full hidden md:block"
              )}
            >
              <InvoiceForm />
              
              {/* Resize Handle */}
              <div 
                onMouseDown={startResizing}
                className={cn(
                  "hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-50",
                  isResizing && "bg-blue-500"
                )}
              />
            </aside>

            {/* RIGHT PANEL: PREVIEW */}
            <div className={cn(
              "flex-1 h-full transition-transform duration-300",
              "md:translate-x-0 md:block",
              view === 'preview' ? "translate-x-0 block" : "translate-x-full hidden md:block"
            )}>
              <InvoicePreview />
            </div>
          </>
        )}
      </main>
      
      {/* STATUS BAR - Hidden on mobile */}
      <footer className="hidden md:flex h-7 px-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] items-center justify-between text-[10px] font-medium text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>v1.0.29 - Database Integrated</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            SQLite Local Storage
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Responsive SaaS Split Pane</span>
          <span>© 2026 LuxeBill OSS</span>
        </div>
      </footer>
    </div>
  );
}

