/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useInvoiceStore } from './store/useInvoiceStore';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { Sun, Moon, RefreshCw, Edit3, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const { invoice, theme, setTheme, resetInvoice } = useInvoiceStore();
  const [view, setView] = useState<'editor' | 'preview'>('editor');

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
      <main className="flex-1 flex overflow-hidden bg-bg-window dark:bg-[#0f0f0f]">
        {/* LEFT PANEL: INPUTS (SIDEBAR) */}
        <aside className={cn(
          "w-full md:w-[340px] shrink-0 h-full transition-transform duration-300",
          "md:translate-x-0 md:block",
          view === 'editor' ? "translate-x-0 block" : "-translate-x-full hidden md:block"
        )}>
          <InvoiceForm />
        </aside>

        {/* RIGHT PANEL: PREVIEW */}
        <div className={cn(
          "flex-1 h-full transition-transform duration-300",
          "md:translate-x-0 md:block",
          view === 'preview' ? "translate-x-0 block" : "translate-x-full hidden md:block"
        )}>
          <InvoicePreview />
        </div>
      </main>
      
      {/* STATUS BAR - Hidden on mobile */}
      <footer className="hidden md:flex h-7 px-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] items-center justify-between text-[10px] font-medium text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>v1.0.28 - Persistence Mode</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Adaptive Layer Active
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

