import { useInvoiceStore } from '../store/useInvoiceStore';
import { HistoryItem } from '../types/invoice';
import { Trash2, FileText, Calendar, User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function InvoiceHistory() {
  const { history, deleteFromHistory, loadFromHistory } = useInvoiceStore();

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
        {history.map((item) => (
          <motion.div
            key={item.invoiceNumber}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer overflow-hidden"
            onClick={() => loadFromHistory(item)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.invoiceNumber}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={10} />
                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFromHistory(item.invoiceNumber);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
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
