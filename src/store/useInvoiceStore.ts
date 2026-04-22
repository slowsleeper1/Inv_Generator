import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InvoiceData, LineItem, Theme, InvoiceFont } from '../types/invoice';
import { format, addDays } from 'date-fns';

interface InvoiceState {
  invoice: InvoiceData;
  history: HistoryItem[];
  theme: Theme;
  font: InvoiceFont;
  fontSize: number;
  
  // Actions
  updateInvoice: (data: Partial<InvoiceData>) => void;
  updateBusiness: (data: Partial<InvoiceData['business']>) => void;
  updateCustomer: (data: Partial<InvoiceData['customer']>) => void;
  updateAccommodation: (data: Partial<InvoiceData['accommodation']>) => void;
  
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, data: Partial<LineItem>) => void;
  
  setTheme: (theme: Theme) => void;
  setFont: (font: InvoiceFont) => void;
  setFontSize: (size: number) => void;
  resetInvoice: () => void;
  
  saveToHistory: () => void;
  deleteFromHistory: (invoiceNumber: string) => void;
  loadFromHistory: (historyItem: HistoryItem) => void;
}

const calculateTotal = (data: InvoiceData) => {
  const accommodationTotal = (data.accommodation.nightlyRate * data.accommodation.nights) + 
                             data.accommodation.cleaningFee + 
                             data.accommodation.serviceFee;
  const lineItemsTotal = data.lineItems.reduce((acc, item) => acc + item.total, 0);
  const subtotal = accommodationTotal + lineItemsTotal;
  const tax = (subtotal * data.accommodation.taxRate) / 100;
  return subtotal + tax - data.accommodation.discount;
};

const initialInvoice: InvoiceData = {
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  issueDate: format(new Date(), 'yyyy-MM-dd'),
  dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  business: {
    name: 'Coastal Haven Accommodations',
    address: '123 Ocean Drive, Malibu, CA 90265',
    email: 'stay@coastalhaven.com',
    phone: '+1 (555) 012-3456',
  },
  customer: {
    name: 'Jane Doe',
    address: '456 Garden St, Austin, TX 78701',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 987-6543',
  },
  accommodation: {
    nightlyRate: 150,
    nights: 3,
    cleaningFee: 75,
    serviceFee: 45,
    taxRate: 12,
    discount: 50,
  },
  lineItems: [
    {
      id: '1',
      description: 'Room Upgrade (Ocean View)',
      quantity: 1,
      unitPrice: 30,
      total: 30,
    }
  ],
  notes: 'Thank you for choosing Coastal Haven! We hope you have a pleasant stay.'
};

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoice: initialInvoice,
      history: [],
      theme: 'light',
      font: 'font-sans',
      fontSize: 14,

      updateInvoice: (data) => set((state) => ({ 
        invoice: { ...state.invoice, ...data } 
      })),
      
      updateBusiness: (data) => set((state) => ({ 
        invoice: { ...state.invoice, business: { ...state.invoice.business, ...data } } 
      })),
      
      updateCustomer: (data) => set((state) => ({ 
        invoice: { ...state.invoice, customer: { ...state.invoice.customer, ...data } } 
      })),
      
      updateAccommodation: (data) => set((state) => ({ 
        invoice: { ...state.invoice, accommodation: { ...state.invoice.accommodation, ...data } } 
      })),

      addLineItem: () => set((state) => {
        const newItem: LineItem = {
          id: Math.random().toString(36).substr(2, 9),
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        };
        return { 
          invoice: { 
            ...state.invoice, 
            lineItems: [...state.invoice.lineItems, newItem] 
          } 
        };
      }),

      removeLineItem: (id) => set((state) => ({
        invoice: {
          ...state.invoice,
          lineItems: state.invoice.lineItems.filter((item) => item.id !== id)
        }
      })),

      updateLineItem: (id, data) => set((state) => {
        const lineItems = state.invoice.lineItems.map((item) => {
          if (item.id === id) {
            const updated = { ...item, ...data };
            updated.total = updated.quantity * updated.unitPrice;
            return updated;
          }
          return item;
        });
        return { invoice: { ...state.invoice, lineItems } };
      }),

      setTheme: (theme) => set({ theme }),
      setFont: (font) => set({ font }),
      setFontSize: (fontSize) => set({ fontSize }),
      resetInvoice: () => set({ 
        invoice: { 
          ...initialInvoice, 
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}` 
        } 
      }),

      saveToHistory: () => {
        const { invoice, history } = get();
        const historyItem: HistoryItem = {
          ...invoice,
          createdAt: new Date().toISOString(),
          totalAmount: calculateTotal(invoice)
        };
        
        // Remove existing if same invoice number
        const newHistory = [
          historyItem,
          ...history.filter(item => item.invoiceNumber !== invoice.invoiceNumber)
        ];
        
        set({ history: newHistory });
      },

      deleteFromHistory: (invoiceNumber) => {
        set((state) => ({
          history: state.history.filter(item => item.invoiceNumber !== invoiceNumber)
        }));
      },

      loadFromHistory: (historyItem) => {
        const { createdAt, totalAmount, ...invoice } = historyItem;
        set({ invoice });
      }
    }),
    {
      name: 'luxebill-storage',
    }
  )
);
