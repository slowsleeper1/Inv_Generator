import { useInvoiceStore } from '../store/useInvoiceStore';
import { Calendar, User, FileText, CheckCircle, Clock, XCircle, Edit2, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useState } from 'react';
import ReservationModal from './ReservationModal';

export default function ReservationList({ onGenerateInvoice }: { onGenerateInvoice: () => void }) {
  const { 
    reservations, 
    history,
    updateReservationStatus, 
    updateBookingPaymentStatus,
    deleteReservation,
    selectReservation, 
    addPayment,
    saveToHistory
  } = useInvoiceStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [editingRes, setEditingRes] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filteredReservations = reservations.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  const handleStatusChange = async (e: any, id: number, status: string) => {
    e.stopPropagation();
    await updateReservationStatus(id, status);
  };

  const handleGenerateInvoice = async (id: number) => {
    const res = reservations.find(r => r.id === id);
    if (res?.status === 'cancelled') {
      if (!confirm('This reservation is currently CANCELLED. Are you sure you want to reactivate and invoice it?')) {
        return;
      }
    }
    
    try {
      // 1. Load the reservation data into the store's invoice state
      await selectReservation(id);
      
      // 2. Auto-confirm the booking status if it's not already
      await updateReservationStatus(id, 'confirmed');
      
      // 3. Always UPSERT to history. 
      // If it exists, update it with current reservation details.
      // If it doesn't, create it.
      await saveToHistory(false);
      
      // 4. Switch to editor tab
      onGenerateInvoice();
    } catch (err) {
      console.error("Failed to generate/log invoice:", err);
    }
  };

  const handlePaymentToggle = async (e: any, res: any) => {
    e.stopPropagation();
    const newStatus = res.payment_status === 'paid' ? 'unpaid' : 'paid';
    
    // Using simple confirm for toggles is usually okay but let's be consistent if needed. 
    // However, for destructive actions like delete we NEED custom UI.
    if (confirm(`Mark booking for ${res.guest_name} as ${newStatus.toUpperCase()}?`)) {
      await updateBookingPaymentStatus(res.id, newStatus);
      
      // If there's an invoice, also record it there if marking as paid
      if (newStatus === 'paid' && res.invoice_id) {
        await addPayment({
          invoice_id: res.invoice_id,
          amount: 0, 
          method: 'Direct Toggle',
          notes: 'Marked as paid from bookings tab'
        });
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReservation(id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Delete res error:', err);
      alert('Failed to delete reservation: ' + (err.message || 'Unknown error'));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Filters */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
              filter === f 
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar pb-20">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Calendar size={32} className="mx-auto text-gray-200 dark:text-gray-800" />
            <p className="text-xs text-gray-400 font-medium tracking-tight">No reservations found</p>
          </div>
        ) : (
          filteredReservations.map((res) => (
            <div 
              key={res.id}
              className={cn(
                "p-4 bg-white dark:bg-[#222] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden",
                res.status === 'cancelled' && "opacity-60 grayscale-[0.4]"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">
                        {res.guest_name}
                      </h4>
                      <button 
                        onClick={() => setEditingRes(res)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(res.id); }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Reservation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="text-blue-500 font-bold uppercase">{res.unit_name || 'Unit N/A'}</span>
                      <span className="text-gray-300">•</span>
                      <span>{format(new Date(res.check_in), 'MMM dd')} - {format(new Date(res.check_out), 'MMM dd, yyyy')}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 max-w-[120px] md:max-w-none">
                  <button 
                    onClick={(e) => handlePaymentToggle(e, res)}
                    disabled={res.status === 'cancelled'}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      res.status === 'cancelled'
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                        : res.payment_status === 'paid' 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-green-600 hover:text-white"
                    )}
                  >
                    {res.status === 'cancelled' ? 'Locked' : (res.payment_status === 'paid' ? 'Paid' : 'Unpaid')}
                  </button>
                  <StatusBadge status={res.status} />
                </div>
              </div>

              {confirmDeleteId === res.id && (
                <div className="top-0 left-0 right-0 bottom-0 absolute bg-red-600/95 dark:bg-red-900/95 z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-200 rounded-2xl">
                  <p className="text-white text-[11px] font-bold mb-3 leading-tight uppercase tracking-wider">
                    Delete this booking?<br/>
                    <span className="opacity-75 text-[9px]">Will also remove associated invoice data.</span>
                  </p>
                  <div className="flex gap-2 w-full max-w-[200px]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                      className="flex-1 py-1.5 bg-white text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="flex-1 py-1.5 bg-red-800/50 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-800 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between mt-4 md:mt-2 pt-3 border-t border-gray-50 dark:border-gray-800 gap-2">
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleGenerateInvoice(res.id)}
                    className={cn(
                      "px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5",
                      res.invoice_number 
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default" 
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white"
                    )}
                    disabled={!!res.invoice_number}
                  >
                    <FileText size={12} />
                    {res.invoice_number ? `Invoice ${res.invoice_number}` : 'Generate'}
                  </button>
                </div>

                <div className="flex gap-1 bg-gray-50 dark:bg-black/20 p-1 rounded-lg">
                  <ActionButton 
                    icon={<Clock size={11} />} 
                    label="Pending" 
                    active={res.status === 'pending'} 
                    onClick={(e) => handleStatusChange(e, res.id, 'pending')}
                  />
                  <ActionButton 
                    icon={<CheckCircle size={11} />} 
                    label="Confirm" 
                    active={res.status === 'confirmed'} 
                    onClick={(e) => handleStatusChange(e, res.id, 'confirmed')}
                  />
                  <ActionButton 
                    icon={<XCircle size={11} />} 
                    label="Cancel" 
                    active={res.status === 'cancelled'} 
                    onClick={(e) => handleStatusChange(e, res.id, 'cancelled')}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingRes && (
        <ReservationModal 
          initialData={editingRes} 
          onClose={() => setEditingRes(null)} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    confirmed: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  }[status] || "bg-gray-100 text-gray-600";

  return (
    <div className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", styles)}>
      {status}
    </div>
  );
}

function ActionButton({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: (e: any) => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "p-1.5 rounded-lg transition-all",
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500"
      )}
    >
      {icon}
    </button>
  );
}
