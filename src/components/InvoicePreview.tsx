import { useEffect, useRef, useState } from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Download, FileText, Image as ImageIcon, CheckCircle2, Loader2, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { InvoiceFont } from '../types/invoice';

export default function InvoicePreview() {
  const { invoice, theme, setTheme, font, setFont, fontSize, saveToHistory } = useInvoiceStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      // Use clientWidth for more reliable measurement of the available viewport
      const containerWidth = containerRef.current.clientWidth - 32; // 16px padding on each side
      const paperWidth = 595;
      
      if (containerWidth < paperWidth) {
        // Set a floor for scaling (e.g., 0.6) so it's still readable
        // If it's even smaller, let the user scroll horizontally
        const calculatedScale = Math.max(0.4, containerWidth / paperWidth);
        setScale(calculatedScale);
      } else {
        setScale(1);
      }
    };

    // Initial delay to allow layout to settle
    const timeoutId = setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleFont = () => {
    const fonts: InvoiceFont[] = ['font-sans', 'font-serif', 'font-mono'];
    const nextIndex = (fonts.indexOf(font) + 1) % fonts.length;
    setFont(fonts[nextIndex]);
  };

  const calculateSubtotal = () => {
    const accommodationTotal = invoice.accommodation.nightlyRate * invoice.accommodation.nights;
    const itemsTotal = invoice.lineItems.reduce((acc, item) => acc + item.total, 0);
    return accommodationTotal + itemsTotal + invoice.accommodation.cleaningFee + invoice.accommodation.serviceFee;
  };

  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal - invoice.accommodation.discount) * (invoice.accommodation.taxRate / 100);
  const total = subtotal - invoice.accommodation.discount + taxAmount;

  const exportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      saveToHistory();
      showSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPNG = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `Invoice_${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      saveToHistory();
      showSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const showSuccess = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#E5E7EB] dark:bg-[#0f0f0f] overflow-hidden">
      {/* TOOLBAR */}
      <div className="h-14 md:h-16 flex items-center justify-center px-4 md:px-8 z-20 shrink-0 bg-white dark:bg-[#1a1a1a] shadow-sm border-b border-border-theme dark:border-gray-800">
        <div className="w-full md:w-[595px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={toggleFont}
              className="whitespace-nowrap px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-md text-[12px] md:text-[13px] font-semibold text-text-main dark:text-gray-200 hover:bg-gray-100 transition-colors capitalize shadow-sm"
            >
              <span className="md:inline hidden">Font: </span>{font.replace('font-', '')}
            </button>
            <button 
              onClick={toggleTheme}
              className="whitespace-nowrap px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-md text-[12px] md:text-[13px] font-semibold text-text-main dark:text-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
            >
              {theme === 'light' ? 'Light' : 'Dark'}
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={exportPNG}
              disabled={isExporting}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-border-theme dark:border-gray-700 rounded-md text-[12px] md:text-[13px] font-semibold text-text-main dark:text-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-sm"
            >
              PNG
            </button>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="px-3 md:px-6 py-1.5 bg-accent-theme text-white border-none rounded-md text-[12px] md:text-[13px] font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-accent-theme/20"
            >
              {isExporting ? <Loader2 className="animate-spin" size={12} /> : null}
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW CONTAINER */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto p-4 md:p-10 no-scrollbar flex justify-center items-start bg-[#F3F4F6] dark:bg-[#0f0f0f]"
      >
        <div 
          className="relative origin-top transition-transform duration-300 shadow-2xl" 
          style={{ 
            transform: `scale(${scale})`,
            width: '595px',
            height: `${780 * scale}px`, // This helps the parent scroll container understand the actual height
            minHeight: '780px' // Keep original size reference for scaling
          }}
        >
          <AnimatePresence>
            {exportSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-green-600 bg-white shadow-md border border-green-100 px-4 py-2 rounded-full z-50 whitespace-nowrap"
              >
                <CheckCircle2 size={14} />
                Invoice Saved Successfully
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            ref={previewRef}
            className={cn(
              "w-[595px] h-[780px] bg-white dark:bg-[#1a1a1a] shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-12 transition-all duration-300 flex flex-col",
              font
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              {invoice.business.logo ? (
                <img src={invoice.business.logo} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-accent-theme rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {invoice.business.name.charAt(0)}
                </div>
              )}
              
              <div className="text-right">
                <div className="text-2xl font-bold text-text-main dark:text-white uppercase leading-none mb-1">INVOICE</div>
                <div className="text-[13px] text-text-muted mt-1 font-medium">#{invoice.invoiceNumber}</div>
              </div>
            </div>

            {/* Details Row */}
            <div className="flex justify-between mb-8 text-[13px]">
              <div className="space-y-1">
                <div className="font-bold text-text-main dark:text-gray-100 mb-1">From</div>
                <div className="text-text-muted dark:text-gray-400 leading-relaxed whitespace-pre-wrap max-w-[200px]">
                  <span className="text-text-main dark:text-gray-200 font-semibold">{invoice.business.name}</span><br />
                  {invoice.business.address}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-bold text-text-main dark:text-gray-100 mb-1">Bill To</div>
                <div className="text-text-muted dark:text-gray-400 leading-relaxed whitespace-pre-wrap max-w-[200px] ml-auto">
                  <span className="text-text-main dark:text-gray-200 font-semibold">{invoice.customer.name}</span><br />
                  {invoice.customer.address}
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="border-b-2 border-text-main dark:border-white pb-2 mb-4 flex text-[12px] font-bold uppercase tracking-tight text-text-main dark:text-white">
              <div className="flex-[3]">Description</div>
              <div className="flex-1 text-center">Qty/Nights</div>
              <div className="flex-1 text-right">Rate</div>
              <div className="flex-1 text-right">Total</div>
            </div>

            {/* Line Items Container */}
            <div className="flex-1 overflow-hidden space-y-0 text-[13px]">
              {/* Accommodation */}
              <div className="border-b border-border-theme dark:border-gray-800 py-3 flex items-start">
                <div className="flex-[3]">
                  <div className="font-bold text-text-main dark:text-gray-100 italic">Accommodation</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {format(new Date(invoice.issueDate), 'MMM dd')} — {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="flex-1 text-center text-text-muted dark:text-gray-400">{invoice.accommodation.nights}</div>
                <div className="flex-1 text-right text-text-muted dark:text-gray-400">${invoice.accommodation.nightlyRate.toFixed(2)}</div>
                <div className="flex-1 text-right font-bold text-text-main dark:text-gray-100">${(invoice.accommodation.nights * invoice.accommodation.nightlyRate).toFixed(2)}</div>
              </div>

              {/* Cleaning & Service */}
              {invoice.accommodation.cleaningFee > 0 && (
                <div className="border-b border-border-theme dark:border-gray-800 py-3 flex">
                  <div className="flex-[3] text-text-muted dark:text-gray-400">Cleaning Fee</div>
                  <div className="flex-1 text-center text-text-muted">1</div>
                  <div className="flex-1 text-right text-text-muted">${invoice.accommodation.cleaningFee.toFixed(2)}</div>
                  <div className="flex-1 text-right font-bold text-text-main dark:text-gray-100">${invoice.accommodation.cleaningFee.toFixed(2)}</div>
                </div>
              )}
              {invoice.accommodation.serviceFee > 0 && (
                <div className="border-b border-border-theme dark:border-gray-800 py-3 flex">
                  <div className="flex-[3] text-text-muted dark:text-gray-400">Service Fee</div>
                  <div className="flex-1 text-center text-text-muted">1</div>
                  <div className="flex-1 text-right text-text-muted">${invoice.accommodation.serviceFee.toFixed(2)}</div>
                  <div className="flex-1 text-right font-bold text-text-main dark:text-gray-100">${invoice.accommodation.serviceFee.toFixed(2)}</div>
                </div>
              )}

              {/* Custom Items */}
              {invoice.lineItems.map((item) => (
                <div key={item.id} className="border-b border-border-theme dark:border-gray-800 py-3 flex">
                  <div className="flex-[3] text-text-muted dark:text-gray-400">{item.description || 'Custom Item'}</div>
                  <div className="flex-1 text-center text-text-muted">{item.quantity}</div>
                  <div className="flex-1 text-right text-text-muted">${item.unitPrice.toFixed(2)}</div>
                  <div className="flex-1 text-right font-bold text-text-main dark:text-gray-100">${item.total.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 ml-auto w-[220px] space-y-1.5 text-[13px]">
              <div className="flex justify-between items-center text-text-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-text-main dark:text-gray-200">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-text-muted">
                <span>Tax <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded ml-1 font-bold">{invoice.accommodation.taxRate}%</span></span>
                <span className="font-semibold text-text-main dark:text-gray-200">${taxAmount.toFixed(2)}</span>
              </div>
              {invoice.accommodation.discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-${invoice.accommodation.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-border-theme dark:border-gray-800 text-[16px] font-bold text-text-main dark:text-white">
                <span>Total Due</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-5 border-t border-border-theme dark:border-gray-800">
              <div className="text-[11px] text-text-muted leading-relaxed">
                <strong className="text-text-main dark:text-gray-200">Payment Instructions:</strong> {invoice.notes || 'Please pay via the link provided in your booking confirmation. Thank you for staying with us!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
