import { useInvoiceStore } from '../store/useInvoiceStore';
import { Plus, X, History, FileEdit, Calendar, RefreshCcw, Users } from 'lucide-react';
import LogoUpload from './LogoUpload';
import InvoiceHistory from './InvoiceHistory';
import ReservationModal from './ReservationModal';
import GuestList from './GuestList';
import ReservationList from './ReservationList';
import Dashboard from './Dashboard';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { InvoiceFont } from '../types/invoice';
import { LayoutDashboard } from 'lucide-react';

export default function InvoiceForm() {
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'guests' | 'bookings' | 'stats'>('edit');
  const [showResModal, setShowResModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);

  const { 
    invoice, 
    reservations,
    history,
    fetchReservations,
    fetchInvoices,
    fetchGuests,
    selectReservation,
    updateInvoice, 
    updateBusiness, 
    updateCustomer, 
    updateAccommodation,
    addLineItem,
    removeLineItem,
    updateLineItem,
    font,
    setFont,
    fontSize,
    setFontSize,
    resetInvoice,
    saveToHistory
  } = useInvoiceStore();
  
  // Check if current invoice is paid or cancelled to lock editor
  const isLocked = (() => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return true;
    
    // Also lock if linked to a cancelled reservation
    if (invoice.reservationId) {
      const res = reservations.find(r => String(r.id) === String(invoice.reservationId));
      if (res && res.status === 'cancelled') return true;
    }
    
    return false;
  })();

  const handleSave = async () => {
    setIsSaving(true);
    await saveToHistory();
    setIsSaving(false);
    setSaveComplete(true);
    setTimeout(() => {
      setSaveComplete(false);
      setActiveTab('history');
    }, 800);
  };

  useEffect(() => {
    fetchReservations();
    fetchInvoices();
    fetchGuests();
    
    // Auto-fetch next invoice number if we're starting fresh
    if (invoice.invoiceNumber.startsWith('INV-')) {
      resetInvoice();
    }
  }, []);

  const handleInputChange = (section: 'business' | 'customer' | 'accommodation' | 'main', field: string, value: any) => {
    switch(section) {
      case 'business': updateBusiness({ [field]: value }); break;
      case 'customer': updateCustomer({ [field]: value }); break;
      case 'accommodation': updateAccommodation({ [field]: value }); break;
      case 'main': updateInvoice({ [field]: value }); break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] border-r border-border-theme dark:border-gray-800 overflow-hidden">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-border-theme dark:border-gray-800">
        <TabButton 
          active={activeTab === 'edit'} 
          onClick={() => setActiveTab('edit')} 
          icon={<FileEdit size={12} />} 
          label="Editor" 
        />
        <TabButton 
          active={activeTab === 'bookings'} 
          onClick={() => setActiveTab('bookings')} 
          icon={<Calendar size={12} />} 
          label="Bookings" 
        />
        <TabButton 
          active={activeTab === 'guests'} 
          onClick={() => setActiveTab('guests')} 
          icon={<Users size={12} />} 
          label="Guests" 
        />
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History size={12} />} 
          label="Log" 
        />
      </div>

      {activeTab === 'edit' ? (
        <>
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
            {/* BRANDING SECTION - NOW AT THE TOP */}
            <section className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
                Business Details
              </div>
              <LogoUpload />
              <div className="grid grid-cols-1 gap-4">
                <Field label="Business Name" value={invoice.business.name} onChange={(v) => handleInputChange('business', 'name', v)} readOnly={isLocked} />
                <Field label="Contact Email" value={invoice.business.email} onChange={(v) => handleInputChange('business', 'email', v)} readOnly={isLocked} />
              </div>
              <Field label="Address" value={invoice.business.address} onChange={(v) => handleInputChange('business', 'address', v)} multiline readOnly={isLocked} />
            </section>

            {/* Main reservation selector and other fields */}
            <section className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/5 rounded-2xl border border-blue-100 dark:border-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Calendar size={14} />
                  Link to Reservation
                </div>
                <button 
                  onClick={() => setShowResModal(true)}
                  className="text-[11px] font-bold text-accent-theme flex items-center gap-1 hover:underline"
                >
                  <Plus size={12} />
                  New Reservation
                </button>
              </div>
            
            <div className="flex gap-2">
              <select 
                onChange={(e) => selectReservation(Number(e.target.value))}
                value={invoice.reservationId || ''}
                className="flex-1 px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">-- [ Select Reservation ] --</option>
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.guest_name} ({r.check_in})
                  </option>
                ))}
              </select>
              <button 
                onClick={() => fetchReservations()}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Refresh reservations"
              >
                <RefreshCcw size={16} />
              </button>
            </div>
          </section>

          {/* CUSTOMER SECTION */}
          <section className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
              Guest Information
            </div>
            <div className="space-y-4">
              <Field label="Full Name" value={invoice.customer.name} onChange={(v) => handleInputChange('customer', 'name', v)} readOnly={isLocked} />
              <Field label="Email Address" value={invoice.customer.email} onChange={(v) => handleInputChange('customer', 'email', v)} readOnly={isLocked} />
              <Field label="Address" value={invoice.customer.address} onChange={(v) => handleInputChange('customer', 'address', v)} multiline readOnly={isLocked} />
            </div>
          </section>

          {/* ACCOMMODATION SECTION */}
          <section className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
              Booking Logic
            </div>
            <div className="space-y-4">
              <Field label="Unit # / Name" value={invoice.accommodation.unitNumber || ''} onChange={(v) => handleInputChange('accommodation', 'unitNumber', v)} readOnly={isLocked} />
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <Field label="Check-in" type="date" value={invoice.accommodation.checkIn || ''} onChange={(v) => handleInputChange('accommodation', 'checkIn', v)} readOnly={isLocked} />
                <Field label="Check-out" type="date" value={invoice.accommodation.checkOut || ''} onChange={(v) => handleInputChange('accommodation', 'checkOut', v)} readOnly={isLocked} />
                <Field label="Nightly Rate" type="number" value={invoice.accommodation.nightlyRate} onChange={(v) => handleInputChange('accommodation', 'nightlyRate', Number(v))} readOnly={isLocked} />
                <Field label="Nights" type="number" value={invoice.accommodation.nights} onChange={(v) => handleInputChange('accommodation', 'nights', Number(v))} readOnly={isLocked} />
                <Field label="Cleaning Fee" type="number" value={invoice.accommodation.cleaningFee} onChange={(v) => handleInputChange('accommodation', 'cleaningFee', Number(v))} readOnly={isLocked} />
                <Field label="Service Fee" type="number" value={invoice.accommodation.serviceFee} onChange={(v) => handleInputChange('accommodation', 'serviceFee', Number(v))} readOnly={isLocked} />
                <Field label="Tax Rate (%)" type="number" value={invoice.accommodation.taxRate} onChange={(v) => handleInputChange('accommodation', 'taxRate', Number(v))} readOnly={isLocked} />
                <Field label="Discount" type="number" value={invoice.accommodation.discount} onChange={(v) => handleInputChange('accommodation', 'discount', Number(v))} readOnly={isLocked} />
                <Field label="Total Guests" type="number" value={invoice.accommodation.guestCount || 0} onChange={(v) => handleInputChange('accommodation', 'guestCount', Number(v))} readOnly={isLocked} />
              </div>
            </div>
          </section>

          {/* LINE ITEMS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
                Other Line Items
              </div>
              {!isLocked && (
                <button 
                  onClick={addLineItem}
                  className="text-[11px] font-bold uppercase text-accent-theme hover:underline"
                >
                  + Add Item
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {invoice.lineItems.map((item) => (
                <div key={item.id} className="relative p-3 rounded-md border border-border-theme dark:border-gray-800 bg-[#FAFAFA] dark:bg-gray-800/20 group">
                  {!isLocked && (
                    <button 
                      onClick={() => removeLineItem(item.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-white dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-full flex items-center justify-center text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    <Field label="Description" value={item.description} onChange={(v) => updateLineItem(item.id, { description: v })} readOnly={isLocked} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Qty" type="number" value={item.quantity} onChange={(v) => updateLineItem(item.id, { quantity: Number(v) })} readOnly={isLocked} />
                      <Field label="Rate" type="number" value={item.unitPrice} onChange={(v) => updateLineItem(item.id, { unitPrice: Number(v) })} readOnly={isLocked} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* INVOICE META */}
          <section className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
              Invoice Meta
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Invoice #" value={invoice.invoiceNumber} onChange={(v) => handleInputChange('main', 'invoiceNumber', v)} readOnly />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Issue Date" type="date" value={invoice.issueDate} onChange={(v) => handleInputChange('main', 'issueDate', v)} readOnly={isLocked} />
                <Field label="Due Date" type="date" value={invoice.dueDate} onChange={(v) => handleInputChange('main', 'dueDate', v)} readOnly={isLocked} />
              </div>
            </div>
          </section>

          {/* DESIGN SETTINGS */}
          <section className="space-y-4 pb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
              Display Settings
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-[12px] font-medium text-text-main dark:text-gray-300">Font Family</label>
                <select 
                  value={font}
                  onChange={(e) => setFont(e.target.value as InvoiceFont)}
                  className="w-full px-3 py-2 text-[13px] bg-[#FAFAFA] dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-md focus:ring-1 focus:ring-accent-theme outline-none transition-all"
                >
                  <option value="font-sans">Inter</option>
                  <option value="font-serif">Merriweather</option>
                  <option value="font-mono">JetBrains Mono</option>
                </select>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[12px] font-medium text-text-main dark:text-gray-300">Base Size: {fontSize}px</label>
                <input 
                  type="range"
                  min="10"
                  max="20"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-theme mt-1"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[12px] font-medium text-text-main dark:text-gray-300">Notes</label>
                <textarea 
                  value={invoice.notes}
                  onChange={(e) => handleInputChange('main', 'notes', e.target.value)}
                  rows={3}
                  placeholder="e.g. WiFi code, Check-out instructions..."
                  className="w-full px-3 py-2 text-[13px] bg-[#FAFAFA] dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-md focus:ring-1 focus:ring-accent-theme outline-none transition-all resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* SAVE ACTION BAR */}
        <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-border-theme dark:border-gray-800 flex flex-col gap-2 z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <button 
            onClick={handleSave}
            disabled={!invoice.customer.name || isLocked || isSaving}
            className={cn(
              "w-full py-3 font-bold rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm",
              saveComplete 
                ? "bg-green-500 text-white shadow-green-500/20" 
                : "bg-accent-theme hover:brightness-110 text-white shadow-accent-theme/20",
              (isSaving || !invoice.customer.name || isLocked) && "opacity-50"
            )}
          >
            {isSaving ? (
              <RefreshCcw className="animate-spin" size={16} />
            ) : saveComplete ? (
              <History size={16} />
            ) : (
              <FileEdit size={16} />
            )}
            {isSaving ? 'Logging...' : saveComplete ? 'Logged to History' : isLocked ? 'Invoice Saved' : 'Save & Log Invoice'}
          </button>
          <button 
            onClick={resetInvoice}
            className="w-full py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted dark:text-gray-400 font-bold rounded-lg transition-all text-[11px] uppercase tracking-widest"
          >
            Clear / New Invoice
          </button>
        </div>
      </>
      ) : activeTab === 'bookings' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          <ReservationList onGenerateInvoice={() => setActiveTab('edit')} />
        </div>
      ) : activeTab === 'guests' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          <GuestList />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          <InvoiceHistory />
        </div>
      )}
      {showResModal && (
        <ReservationModal onClose={() => setShowResModal(false)} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: import('react').ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-3 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all",
        active 
          ? "bg-accent-theme/5 text-accent-theme border-b-2 border-accent-theme" 
          : "text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800/40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', multiline = false, readOnly = false }: { label: string, value: any, onChange: (val: any) => void, type?: string, multiline?: boolean, readOnly?: boolean }) {
  const commonClasses = cn(
    "w-full px-3 py-2 text-[13px] bg-[#FAFAFA] dark:bg-gray-800",
    "border border-border-theme dark:border-gray-700 rounded-md",
    "focus:ring-1 focus:ring-accent-theme outline-none",
    "transition-all duration-200 text-text-main dark:text-gray-100",
    readOnly && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900 border-dashed"
  );

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[12px] font-medium text-text-main dark:text-gray-300">{label}</label>
      {multiline ? (
        <textarea 
          rows={2}
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={cn(commonClasses, "resize-none")}
          readOnly={readOnly}
        />
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={commonClasses}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
