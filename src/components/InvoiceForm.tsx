import { useInvoiceStore } from '../store/useInvoiceStore';
import { Plus, X } from 'lucide-react';
import LogoUpload from './LogoUpload';
import { cn } from '../lib/utils';
import { InvoiceFont } from '../types/invoice';

export default function InvoiceForm() {
  const { 
    invoice, 
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
    setFontSize
  } = useInvoiceStore();

  const handleInputChange = (section: 'business' | 'customer' | 'accommodation' | 'main', field: string, value: any) => {
    switch(section) {
      case 'business': updateBusiness({ [field]: value }); break;
      case 'customer': updateCustomer({ [field]: value }); break;
      case 'accommodation': updateAccommodation({ [field]: value }); break;
      case 'main': updateInvoice({ [field]: value }); break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] border-r border-border-theme dark:border-gray-800 overflow-y-auto no-scrollbar">
      <div className="p-6 space-y-8">
        {/* BRANDING SECTION */}
        <section className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
            Business Details
          </div>
          <LogoUpload />
          <div className="grid grid-cols-1 gap-4">
            <Field label="Business Name" value={invoice.business.name} onChange={(v) => handleInputChange('business', 'name', v)} />
            <Field label="Contact Email" value={invoice.business.email} onChange={(v) => handleInputChange('business', 'email', v)} />
          </div>
          <Field label="Address" value={invoice.business.address} onChange={(v) => handleInputChange('business', 'address', v)} multiline />
        </section>

        {/* INVOICE META */}
        <section className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
            Invoice Meta
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Invoice #" value={invoice.invoiceNumber} onChange={(v) => handleInputChange('main', 'invoiceNumber', v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Issue Date" type="date" value={invoice.issueDate} onChange={(v) => handleInputChange('main', 'issueDate', v)} />
              <Field label="Due Date" type="date" value={invoice.dueDate} onChange={(v) => handleInputChange('main', 'dueDate', v)} />
            </div>
          </div>
        </section>

        {/* CUSTOMER SECTION */}
        <section className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
            Guest Information
          </div>
          <div className="space-y-4">
            <Field label="Full Name" value={invoice.customer.name} onChange={(v) => handleInputChange('customer', 'name', v)} />
            <Field label="Email Address" value={invoice.customer.email} onChange={(v) => handleInputChange('customer', 'email', v)} />
            <Field label="Address" value={invoice.customer.address} onChange={(v) => handleInputChange('customer', 'address', v)} multiline />
          </div>
        </section>

        {/* ACCOMMODATION SECTION */}
        <section className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
            Booking Logic
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <Field label="Nightly Rate" type="number" value={invoice.accommodation.nightlyRate} onChange={(v) => handleInputChange('accommodation', 'nightlyRate', Number(v))} />
            <Field label="Nights" type="number" value={invoice.accommodation.nights} onChange={(v) => handleInputChange('accommodation', 'nights', Number(v))} />
            <Field label="Cleaning Fee" type="number" value={invoice.accommodation.cleaningFee} onChange={(v) => handleInputChange('accommodation', 'cleaningFee', Number(v))} />
            <Field label="Service Fee" type="number" value={invoice.accommodation.serviceFee} onChange={(v) => handleInputChange('accommodation', 'serviceFee', Number(v))} />
            <Field label="Tax Rate (%)" type="number" value={invoice.accommodation.taxRate} onChange={(v) => handleInputChange('accommodation', 'taxRate', Number(v))} />
            <Field label="Discount" type="number" value={invoice.accommodation.discount} onChange={(v) => handleInputChange('accommodation', 'discount', Number(v))} />
          </div>
        </section>

        {/* LINE ITEMS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted dark:text-gray-500">
              Other Line Items
            </div>
            <button 
              onClick={addLineItem}
              className="text-[11px] font-bold uppercase text-accent-theme hover:underline"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {invoice.lineItems.map((item) => (
              <div key={item.id} className="relative p-3 rounded-md border border-border-theme dark:border-gray-800 bg-[#FAFAFA] dark:bg-gray-800/20 group">
                <button 
                  onClick={() => removeLineItem(item.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-full flex items-center justify-center text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X size={10} />
                </button>
                <div className="grid grid-cols-1 gap-2">
                  <Field label="Description" value={item.description} onChange={(v) => updateLineItem(item.id, { description: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Qty" type="number" value={item.quantity} onChange={(v) => updateLineItem(item.id, { quantity: Number(v) })} />
                    <Field label="Rate" type="number" value={item.unitPrice} onChange={(v) => updateLineItem(item.id, { unitPrice: Number(v) })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESIGN SETTINGS */}
        <section className="space-y-4 pb-20">
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
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', multiline = false }: { label: string, value: any, onChange: (val: any) => void, type?: string, multiline?: boolean }) {
  const commonClasses = cn(
    "w-full px-3 py-2 text-[13px] bg-[#FAFAFA] dark:bg-gray-800",
    "border border-border-theme dark:border-gray-700 rounded-md",
    "focus:ring-1 focus:ring-accent-theme outline-none",
    "transition-all duration-200 text-text-main dark:text-gray-100"
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
        />
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={commonClasses}
        />
      )}
    </div>
  );
}
