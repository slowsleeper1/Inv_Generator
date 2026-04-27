import { useInvoiceStore } from '../store/useInvoiceStore';
import { HistoryItem } from '../types/invoice';
import { Trash2, FileText, Calendar, User, DollarSign, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function InvoiceHistory() {
  const { history, deleteFromHistory, loadFromHistory, addPayment } = useInvoiceStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50/50 dark:bg-black/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
        <FileText size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">No invoices yet</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
          Created invoices will appear here for quick access and management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <AnimatePresence initial={false}>
        {history.map((item, index) => (
          <motion.div
            key={`${item.id || 'idx'}-${item.invoiceNumber}-${index}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "group relative bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer overflow-hidden",
              item.status === 'cancelled' && "opacity-50 grayscale-[0.6]"
            )}
            onClick={() => loadFromHistory(item)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.invoiceNumber}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                    </p>
                    {item.status && (
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full transition-colors",
                        item.status === 'paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        item.status === 'partially_paid' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        item.status === 'issued' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        item.status === 'cancelled' ? "bg-red-500 text-white dark:bg-red-900 dark:text-red-100 px-2" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {item.status === 'cancelled' ? 'CANCELLED / WITHDRAWN' : item.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(() => {
                  // Robust check: don't allow payment if cancelled
                  if (item.status === 'paid' || item.status === 'cancelled') return null;
                  
                  // Double check reservation status if linked
                  if (item.reservationId) {
                    const { reservations } = useInvoiceStore.getState();
                    const res = reservations.find(r => String(r.id) === String(item.reservationId));
                    if (res && res.status === 'cancelled') return null;
                  }

                  return item.id ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await addPayment({
                          invoice_id: item.id as number,
                          amount: item.totalAmount,
                          method: 'Cash/Check'
                        });
                      }}
                      className="p-1.5 bg-green-50 dark:bg-green-600/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-600/30 rounded-lg transition-colors group relative"
                      title="Mark as Paid"
                    >
                      <DollarSign size={16} />
                    </button>
                  ) : null;
                })()}
                
                <div className="flex items-center gap-1">
                  {confirmDeleteId !== null && confirmDeleteId !== undefined && (String(confirmDeleteId) === String(item.id) || confirmDeleteId === item.invoiceNumber) ? (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFromHistory(item.id ? Number(item.id) : undefined, item.invoiceNumber);
                          setConfirmDeleteId(null);
                        }}
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Confirm Delete"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(item.id ?? item.invoiceNumber);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Customer</p>
                <div className="flex items-center gap-1.5">
                  <User size={10} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                    {item.customer.name}
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Amount</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    ${item.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 transform translate-x-full group-hover:translate-x-0 transition-transform" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
