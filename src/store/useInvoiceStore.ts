import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InvoiceData, LineItem, Theme, InvoiceFont, HistoryItem } from '../types/invoice';
import { format, addDays } from 'date-fns';

interface InvoiceState {
  invoice: InvoiceData;
  history: HistoryItem[];
  reservations: any[];
  guests: any[];
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
  
  // Database Actions
  fetchReservations: () => Promise<void>;
  fetchGuests: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  createReservation: (res: any) => Promise<void>;
  updateReservation: (id: number, res: any) => Promise<void>;
  deleteReservation: (id: number) => Promise<void>;
  updateReservationStatus: (id: number, status: string) => Promise<void>;
  updateBookingPaymentStatus: (id: number, status: string) => Promise<void>;
  createGuest: (guest: any) => Promise<number>;
  updateGuest: (id: number, guest: any) => Promise<void>;
  deleteGuest: (id: number) => Promise<void>;
  saveToHistory: (shouldReset?: boolean) => Promise<void>;
  addPayment: (payment: { invoice_id: number; amount: number; method: string; notes?: string }) => Promise<void>;
  deleteFromHistory: (id: number | undefined, invoiceNumber: string) => Promise<void>;
  loadFromHistory: (historyItem: HistoryItem) => void;
  selectReservation: (id: number) => Promise<void>;
  
  // Dashboard / Stats
  stats: {
    monthlyRevenue: any[];
    unitRevenue: any[];
    summary: {
      totalRevenue: number;
      unpaidInvoices: number;
      guestCount: number;
      activeReservations: number;
      cancelledCount: number;
      cancelledAmount: number;
    };
  };
  fetchStats: () => Promise<void>;
}

declare global {
  interface Window {
    api: any;
  }
}

const calculateTotal = (data: InvoiceData) => {
  const accommodationTotal = (data.accommodation.nightlyRate * data.accommodation.nights) + 
                             data.accommodation.cleaningFee + 
                             data.accommodation.serviceFee;
  const lineItemsTotal = (data.lineItems || []).reduce((acc, item) => acc + (item.total || 0), 0);
  const subtotal = accommodationTotal + lineItemsTotal;
  const discountedSubtotal = Math.max(0, subtotal - data.accommodation.discount);
  const tax = (discountedSubtotal * data.accommodation.taxRate) / 100;
  return discountedSubtotal + tax;
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
    nightlyRate: 0,
    nights: 1,
    cleaningFee: 0,
    serviceFee: 0,
    taxRate: 0,
    discount: 0,
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
  notes: 'Thank you for choosing Coastal Haven! We hope you have a pleasant stay.',
  status: 'issued'
};

const calculateStatsFromState = (state: { history: HistoryItem[], guests: any[], reservations: any[] }) => {
  // Get unique reservation IDs from history to avoid double counting
  const loggedReservationIds = new Set(
    state.history
      .filter(inv => inv.reservationId)
      .map(inv => inv.reservationId)
  );

  const historyRevenue = state.history
    .filter(inv => {
      if (inv.status !== 'paid') return false;
      
      // Secondary check: if it's linked to a cancelled reservation, it shouldn't count as revenue
      if (inv.reservationId) {
        const res = state.reservations.find(r => String(r.id) === String(inv.reservationId));
        if (res && res.status === 'cancelled') return false;
      }
      return true;
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Add revenue from paid reservations that aren't logged in history yet
  const unloggedPaidReservationRevenue = state.reservations
    .filter(r => r.status !== 'cancelled' && r.payment_status === 'paid' && !loggedReservationIds.has(r.id))
    .reduce((sum, r) => {
      const nights = Math.max(1, Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 3600 * 24)));
      
      // Construct a temporary invoice object to use calculateTotal
      const tempInvoice: any = {
        accommodation: {
          nightlyRate: r.nightly_rate,
          nights: nights,
          cleaningFee: r.cleaning_fee,
          serviceFee: r.service_fee,
          taxRate: r.tax_rate,
          discount: r.discount
        },
        lineItems: []
      };
      
      return sum + calculateTotal(tempInvoice);
    }, 0);

  const totalRevenue = historyRevenue + unloggedPaidReservationRevenue;
  
  const unpaidInvoices = state.history
    .filter(inv => {
      // Basic invoice status check
      if (inv.status === 'paid' || inv.status === 'cancelled') return false;
      
      // Secondary check: if it's linked to a cancelled reservation, it's not outstanding
      if (inv.reservationId) {
        const res = state.reservations.find(r => String(r.id) === String(inv.reservationId));
        if (res && res.status === 'cancelled') return false;
      }
      
      return true;
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Add outstanding amount from confirmed unpaid reservations that aren't logged yet
  const unloggedOutstandingRevenue = state.reservations
    .filter(r => r.status === 'confirmed' && r.payment_status === 'unpaid' && !loggedReservationIds.has(r.id))
    .reduce((sum, r) => {
      const nights = Math.max(1, Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 3600 * 24)));
      const tempInvoice: any = {
        accommodation: {
          nightlyRate: r.nightly_rate,
          nights: nights,
          cleaningFee: r.cleaning_fee,
          serviceFee: r.service_fee,
          taxRate: r.tax_rate,
          discount: r.discount
        },
        lineItems: []
      };
      return sum + calculateTotal(tempInvoice);
    }, 0);
  
  const totalOutstanding = unpaidInvoices + unloggedOutstandingRevenue;
  
  // Count unique guest profiles
  const guestCount = state.guests.length;
    
  // Count confirmed reservations for active stays
  const activeReservations = state.reservations.filter(r => r.status === 'confirmed').length;

  const cancelledReservations = state.reservations.filter(r => r.status === 'cancelled');
  const cancelledCount = cancelledReservations.length;
  const cancelledAmount = cancelledReservations.reduce((sum, r) => {
    // Priority 1: Use invoice total if it exists to capture custom line items
    const linkedInvoice = state.history.find(inv => String(inv.reservationId) === String(r.id));
    if (linkedInvoice) return sum + linkedInvoice.totalAmount;

    // Priority 2: Recalculate if no invoice exists
    const nights = Math.max(1, Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 3600 * 24)));
    
    const tempInvoice: any = {
      accommodation: {
        nightlyRate: r.nightly_rate,
        nights: nights,
        cleaningFee: r.cleaning_fee,
        serviceFee: r.service_fee,
        taxRate: r.tax_rate,
        discount: r.discount
      },
      lineItems: []
    };
    
    return sum + calculateTotal(tempInvoice);
  }, 0);

  return {
    totalRevenue,
    unpaidInvoices: totalOutstanding,
    guestCount,
    activeReservations,
    cancelledCount,
    cancelledAmount
  };
};

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoice: initialInvoice,
      history: [],
      reservations: [],
      guests: [],
      theme: 'light',
      font: 'font-sans',
      fontSize: 14,
      stats: {
        monthlyRevenue: [],
        unitRevenue: [],
        summary: {
          totalRevenue: 0,
          unpaidInvoices: 0,
          guestCount: 0,
          activeReservations: 0,
          cancelledCount: 0,
          cancelledAmount: 0
        }
      },

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
      resetInvoice: async () => {
        let nextNumber = `INV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
        if (window.api) {
          try {
            nextNumber = await window.api.invoices.getNextNumber();
          } catch (e) {
            console.error("Failed to get next number:", e);
          }
        }
        set({ 
          invoice: { 
            ...initialInvoice, 
            invoiceNumber: nextNumber 
          } 
        });
      },

      fetchReservations: async () => {
        try {
          if (!window.api) return;
          const reservations = await window.api.reservations.list();
          set({ reservations });
        } catch (err) {
          console.error("Failed to fetch reservations:", err);
        }
      },

      fetchGuests: async () => {
        try {
          if (!window.api) return;
          const guests = await window.api.guests.list();
          set({ guests });
        } catch (err) {
          console.error("Failed to fetch guests:", err);
        }
      },

      fetchInvoices: async () => {
        try {
          if (!window.api) return;
          const invoices = await window.api.invoices.list();
          const reservations = await window.api.reservations.list();
          
          const mappedHistory = invoices.map((inv: any) => {
            const snapshot = JSON.parse(inv.snapshot_data);
            
            // Sync with current reservation status
            const linkedRes = reservations.find((r: any) => String(r.id) === String(inv.reservation_id));
            
            let finalStatus = inv.status;
            if (linkedRes && (linkedRes.status === 'cancelled' || linkedRes.status === 'CANCELLED')) {
              finalStatus = 'cancelled';
            }

            return {
              ...snapshot,
              id: inv.id,
              reservationId: inv.reservation_id,
              createdAt: inv.created_at,
              totalAmount: inv.total_amount,
              status: finalStatus
            };
          });
          set({ history: mappedHistory });
        } catch (err) {
          console.error("Failed to fetch invoices:", err);
        }
      },

      createReservation: async (res) => {
        if (window.api) {
          await window.api.reservations.create(res);
          await get().fetchReservations();
          await get().fetchStats();
        } else {
          // Preview Mode Fallback
          const newRes = { 
            ...res, 
            id: Math.floor(Math.random() * 1000), 
            guest_name: get().guests.find(g => g.id === res.guest_id)?.name || 'Guest',
            status: res.status || 'confirmed',
            payment_status: res.payment_status || 'unpaid'
          };
          set((state) => {
            const nextReservations = [newRes, ...state.reservations];
            return {
              reservations: nextReservations,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, reservations: nextReservations })
              }
            };
          });
        }
      },

      updateReservation: async (id, res) => {
        if (window.api) {
          await window.api.reservations.update(id, res);
          
          // If this reservation is currently being edited in the invoice form, update it
          const currentInvoice = get().invoice;
          if (currentInvoice.reservationId === id) {
            await get().selectReservation(id);
          }

            // Force sync all linked invoices in history if they exist
          const { history } = get();
          const linkedInvoices = history.filter(inv => String(inv.reservationId) === String(id));
          
          for (const linkedInvoice of linkedInvoices) {
            // Recalculate the snapshot data based on the updated reservation
            const guest = get().guests.find(g => g.id === res.guest_id);
            const nights = Math.max(1, Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 3600 * 24)));
            
            // Build the updated snapshot
            const updatedInvoiceSnapshot = {
              ...linkedInvoice,
              customer: guest ? {
                id: guest.id,
                name: guest.name,
                email: guest.email,
                address: guest.address,
                phone: guest.phone
              } : linkedInvoice.customer,
              accommodation: {
                ...linkedInvoice.accommodation,
                unitNumber: res.unit_name || '',
                nightlyRate: res.nightly_rate,
                cleaningFee: res.cleaning_fee,
                serviceFee: res.service_fee,
                taxRate: res.tax_rate,
                discount: res.discount,
                checkIn: res.check_in,
                checkOut: res.check_out,
                guestCount: res.guest_count,
                nights
              },
              status: res.status === 'cancelled' ? 'cancelled' : (res.payment_status === 'paid' ? 'paid' : 'issued')
            };

            // Use the unified total calculation
            const total = calculateTotal(updatedInvoiceSnapshot as any);
            (updatedInvoiceSnapshot as any).totalAmount = total;

            await window.api.invoices.update(linkedInvoice.id as number, {
              reservation_id: linkedInvoice.reservationId,
              invoice_number: linkedInvoice.invoiceNumber,
              issue_date: linkedInvoice.issueDate,
              due_date: linkedInvoice.dueDate,
              total_amount: total,
              snapshot_data: JSON.stringify(updatedInvoiceSnapshot),
              status: updatedInvoiceSnapshot.status
            });
          }

          await get().fetchInvoices();
          await get().fetchReservations();
          await get().fetchStats();
        } else {
          // Preview Mode Fallback
          set((state) => {
            const guest = state.guests.find(g => g.id === res.guest_id);
            const nextReservations = state.reservations.map(r => r.id === id ? { ...res, id, guest_name: guest?.name || 'Guest' } : r);
            
            // Sync history/log for this reservation
            const nextHistory = state.history.map(inv => {
              if (inv.reservationId === id) {
                const updatedRes = nextReservations.find(r => r.id === id);
                if (updatedRes) {
                  const nights = Math.max(1, Math.ceil((new Date(updatedRes.check_out).getTime() - new Date(updatedRes.check_in).getTime()) / (1000 * 3600 * 24)));
                  const subtotal = (updatedRes.nightly_rate * nights) + updatedRes.cleaning_fee + updatedRes.service_fee;
                  const tax = (subtotal - updatedRes.discount) * (updatedRes.tax_rate / 100);
                  const total = subtotal - updatedRes.discount + tax;
                  
                  return {
                    ...inv,
                    customer: guest ? {
                      id: guest.id,
                      name: guest.name,
                      email: guest.email,
                      address: guest.address,
                      phone: guest.phone
                    } : inv.customer,
                    accommodation: {
                      ...inv.accommodation,
                      unitNumber: updatedRes.unit_name || '',
                      nightlyRate: updatedRes.nightly_rate,
                      cleaningFee: updatedRes.cleaning_fee,
                      serviceFee: updatedRes.service_fee,
                      taxRate: updatedRes.tax_rate,
                      discount: updatedRes.discount,
                      checkIn: updatedRes.check_in,
                      checkOut: updatedRes.check_out,
                      guestCount: updatedRes.guest_count,
                      nights
                    },
                    totalAmount: total,
                    status: (updatedRes.payment_status === 'paid' ? 'paid' : 'issued') as any
                  };
                }
              }
              return inv;
            });

            return {
              reservations: nextReservations,
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, reservations: nextReservations, history: nextHistory })
              }
            };
          });
        }
      },

      deleteReservation: async (id) => {
        if (window.api) {
          // Find any linked invoice first to delete it too
          const { history } = get();
          const linkedInv = history.find(inv => inv.reservationId === id);
          
          if (linkedInv && linkedInv.id) {
            await window.api.invoices.delete(linkedInv.id);
          }
          
          await window.api.reservations.delete(id);
          await get().fetchReservations();
          await get().fetchInvoices();
          await get().fetchStats();
        } else {
          // Preview Mode Fallback
          set((state) => {
            const nextReservations = state.reservations.filter(r => r.id !== id);
            const nextHistory = state.history.filter(inv => inv.reservationId !== id);
            return {
              reservations: nextReservations,
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, reservations: nextReservations, history: nextHistory })
              }
            };
          });
        }
      },

      updateReservationStatus: async (id, status) => {
        if (window.api) {
          await window.api.reservations.updateStatus(id, status);
          
          // Sync current editor if it's the same reservation
          const currentInvoice = get().invoice;
          if (currentInvoice.reservationId === id) {
            await get().selectReservation(id);
          }
          
          // Sync with all linked invoices in history if they exist
          const { history } = get();
          const linkedInvoices = history.filter(i => String(i.reservationId) === String(id));
          
          for (const inv of linkedInvoices) {
            let nextStatus: HistoryItem['status'] = 'issued';
            if (status === 'cancelled') {
              nextStatus = 'cancelled';
            } else if (inv.status === 'paid') {
              nextStatus = 'paid';
            } else if (inv.status === 'partially_paid') {
              nextStatus = 'partially_paid';
            }
            
            await window.api.invoices.updateStatus(inv.id as number, nextStatus);
          }

          // Fetch fresh data in the correct order
          await get().fetchReservations(); // Ensure reservations list is fresh first
          await get().fetchInvoices();
          await get().fetchStats();
        } else {
          // Preview Mode Fallback
          set((state) => {
            const nextReservations = state.reservations.map(r => r.id === id ? { ...r, status } : r);
            const nextHistory = state.history.map(inv => {
              if (inv.reservationId === id) {
                if (status === 'cancelled') return { ...inv, status: 'cancelled' as const };
                // If un-cancelling, we might need more logic, but for now let's just restore from payment status
                const res = nextReservations.find(r => r.id === id);
                return { ...inv, status: (res?.payment_status === 'paid' ? 'paid' : 'issued') as any };
              }
              return inv;
            });
            return {
              reservations: nextReservations,
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, reservations: nextReservations, history: nextHistory })
              }
            };
          });
        }
      },

      updateBookingPaymentStatus: async (id, status) => {
        if (window.api) {
          await window.api.reservations.updatePaymentStatus(id, status);
          
          // Sync current editor if it's the same reservation
          const currentInvoice = get().invoice;
          if (currentInvoice.reservationId === id) {
            await get().selectReservation(id);
          }
          
          const { history, reservations } = get();
          const linkedInvoices = history.filter(i => String(i.reservationId) === String(id));
          const res = reservations.find(r => String(r.id) === String(id));

          if (linkedInvoices.length > 0) {
            for (const inv of linkedInvoices) {
              let nextStatus: HistoryItem['status'] = status === 'paid' ? 'paid' : 'issued';
              if (res?.status === 'cancelled') {
                nextStatus = 'cancelled';
              }
              
              await window.api.invoices.updateStatus(inv.id as number, nextStatus);
            }
          }
          
          await get().fetchReservations();
          await get().fetchInvoices();
          await get().fetchStats();
        } else {
          // Preview Mode Fallback
          set((state) => {
            const nextReservations = state.reservations.map(r => r.id === id ? { ...r, payment_status: status } : r);
            const nextHistory = state.history.map(inv => {
              if (inv.reservationId === id) {
                const res = nextReservations.find(r => r.id === id);
                if (res?.status === 'cancelled') return { ...inv, status: 'cancelled' as const };
                return { ...inv, status: (status === 'paid' ? 'paid' : 'issued') as any };
              }
              return inv;
            });
            return {
              reservations: nextReservations,
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, reservations: nextReservations, history: nextHistory })
              }
            };
          });
        }
      },

      createGuest: async (guest) => {
        if (window.api) {
          const id = await window.api.guests.create(guest);
          await get().fetchGuests();
          await get().fetchStats();
          return id;
        } else {
          // Preview Mode Fallback
          const newId = Math.floor(Math.random() * 1000);
          const newGuest = { ...guest, id: newId };
          set((state) => {
            const nextGuests = [newGuest, ...state.guests];
            return {
              guests: nextGuests,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, guests: nextGuests })
              }
            };
          });
          return newId;
        }
      },

      updateGuest: async (id, guest) => {
        if (window.api) {
          await window.api.guests.update(id, guest);
          await get().fetchGuests();
          await get().fetchStats();
        } else {
          // Preview Mode Fallback
          set((state) => {
            const nextGuests = state.guests.map(g => g.id === id ? { ...guest, id } : g);
            return {
              guests: nextGuests,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, guests: nextGuests })
              }
            };
          });
        }
      },

      deleteGuest: async (id) => {
        console.log('Store: deleteGuest called with id:', id);
        if (window.api) {
          try {
            await window.api.guests.delete(id);
            console.log('Store: backend delete success');
            await get().fetchGuests();
            await get().fetchReservations();
            await get().fetchInvoices();
            await get().fetchStats(); // Update dashboard too
          } catch (err) {
            console.error('Store: backend delete failed:', err);
            throw err;
          }
        } else {
          // Preview Mode Fallback
          set((state) => {
            const nextGuests = state.guests.filter(g => g.id !== id);
            const nextReservations = state.reservations.filter(r => r.guest_id !== id);
            const nextHistory = state.history.filter(inv => inv.customer.id !== id);
            return {
              guests: nextGuests,
              reservations: nextReservations,
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, guests: nextGuests, reservations: nextReservations, history: nextHistory })
              }
            };
          });
        }
      },

      selectReservation: async (id) => {
        // Reset status immediately to prevent stale "PAID" stamps from showing
        set((state) => ({ 
          invoice: { ...state.invoice, status: 'issued', reservationId: id }
        }));

        if (window.api) {
          const res = await window.api.reservations.getById(id);
          if (res) {
            const { 
              guest_id, guest_name, guest_email, guest_address, guest_phone,
              check_in, check_out, unit_name,
              ...acc 
            } = res;
            
            set((state) => ({
              invoice: {
                ...state.invoice,
                reservationId: id,
                customer: {
                  id: guest_id,
                  name: guest_name,
                  email: guest_email,
                  address: guest_address,
                  phone: guest_phone
                },
                accommodation: {
                  ...state.invoice.accommodation,
                  unitNumber: unit_name || '',
                  nightlyRate: acc.nightly_rate,
                  cleaningFee: acc.cleaning_fee,
                  serviceFee: acc.service_fee,
                  taxRate: acc.tax_rate,
                  discount: acc.discount,
                  checkIn: check_in,
                  checkOut: check_out,
                  guestCount: res.guest_count,
                  nights: Math.ceil((new Date(check_out).getTime() - new Date(check_in).getTime()) / (1000 * 3600 * 24))
                },
                status: (res.status === 'cancelled' || res.status === 'CANCELLED') ? 'cancelled' : (res.payment_status === 'paid' ? 'paid' : 'issued')
              }
            }));
          }
        } else {
          // Preview Mode Fallback
          const res = get().reservations.find(r => r.id === id);
          if (res) {
            const guest = get().guests.find(g => g.id === res.guest_id);
            set((state) => ({
              invoice: {
                ...state.invoice,
                reservationId: id,
                customer: guest ? {
                  id: guest.id,
                  name: guest.name,
                  email: guest.email,
                  address: guest.address,
                  phone: guest.phone
                } : state.invoice.customer,
                accommodation: {
                  ...state.invoice.accommodation,
                  unitNumber: res.unit_name || '',
                  nightlyRate: res.nightly_rate,
                  cleaningFee: res.cleaning_fee,
                  serviceFee: res.service_fee,
                  taxRate: res.tax_rate,
                  discount: res.discount,
                  checkIn: res.check_in,
                  checkOut: res.check_out,
                  guestCount: res.guest_count,
                  nights: Math.max(1, Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 3600 * 24)))
                },
                status: (res.status === 'cancelled' || res.status === 'CANCELLED') ? 'cancelled' : (res.payment_status === 'paid' ? 'paid' : 'issued')
              }
            }));
          }
        }
      },

      saveToHistory: async (shouldReset = true) => {
        const { invoice, history } = get();
        const totalAmount = calculateTotal(invoice);
        
        // Check if we are updating an existing invoice from history
        const existingInHistory = history.find(item => 
          (String(item.id) === String(invoice.id)) || 
          (invoice.reservationId && item.reservationId === invoice.reservationId) ||
          (item.invoiceNumber === invoice.invoiceNumber)
        );

        if (window.api) {
          const invoiceData = {
            reservation_id: invoice.reservationId,
            invoice_number: invoice.invoiceNumber,
            issue_date: invoice.issueDate,
            due_date: invoice.dueDate,
            total_amount: totalAmount,
            snapshot_data: JSON.stringify(invoice),
            status: invoice.status || 'issued'
          };

          if (existingInHistory && existingInHistory.id) {
            await window.api.invoices.update(existingInHistory.id, invoiceData);
          } else {
            await window.api.invoices.create(invoiceData);
          }

          await get().fetchInvoices();
          await get().fetchReservations(); 
          await get().fetchStats(); 
          if (shouldReset) await get().resetInvoice(); 
        } else {
          // Preview/Browser Fallback
          const newItem: HistoryItem = {
            ...invoice,
            id: existingInHistory?.id || Math.floor(Math.random() * 1000000),
            createdAt: existingInHistory?.createdAt || new Date().toISOString(),
            totalAmount: totalAmount,
            status: invoice.status || 'issued'
          };

          set((state) => {
            // Deduplicate by both ID and invoiceNumber to be extremely safe
            const otherHistory = state.history.filter(h => 
              h.id !== newItem.id && h.invoiceNumber !== newItem.invoiceNumber
            );
            const nextHistory = [newItem, ...otherHistory];
            return {
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, history: nextHistory })
              }
            };
          });
          if (shouldReset) await get().resetInvoice();
        }
      },

      addPayment: async (payment) => {
        // Priority check: block payment for cancelled reservations/invoices
        const { history, reservations } = get();
        const inv = history.find(i => String(i.id) === String(payment.invoice_id) || i.invoiceNumber === (payment as any).invoiceNumber);
        if (inv) {
          if (inv.status === 'cancelled') return;
          const res = reservations.find(r => String(r.id) === String(inv.reservationId));
          if (res && res.status === 'cancelled') return;
        }

        if (window.api) {
          await window.api.payments.add({
            ...payment,
            payment_date: new Date().toISOString().split('T')[0]
          });
          
          // Sync back to reservation payment status
          const invAfter = get().history.find(i => String(i.id) === String(payment.invoice_id));
          if (invAfter?.reservationId) {
            await window.api.reservations.updatePaymentStatus(invAfter.reservationId, 'paid');
          }

          await get().fetchInvoices();
          await get().fetchReservations(); 
          await get().fetchStats(); // Update stats after payment
        } else {
          // Preview/Fallback
          set((state) => {
            const nextHistory = state.history.map(inv => {
              if (String(inv.id) === String(payment.invoice_id) || inv.invoiceNumber === (payment as any).invoiceNumber) {
                return { ...inv, status: 'paid' as const };
              }
              return inv;
            });
            
            // Also update currently active invoice if it matches
            const currentInvoice = state.invoice;
            const isMatch = String(currentInvoice.id) === String(payment.invoice_id) || currentInvoice.invoiceNumber === (payment as any).invoiceNumber;
            const updatedInvoice = isMatch ? { ...currentInvoice, status: 'paid' as const } : currentInvoice;

            // Also update reservation status if linked
            const matchingInvoice = nextHistory.find(inv => String(inv.id) === String(payment.invoice_id) || inv.invoiceNumber === (payment as any).invoiceNumber);
            let nextReservations = state.reservations;
            if (matchingInvoice?.reservationId) {
              nextReservations = state.reservations.map(res => 
                res.id === matchingInvoice.reservationId ? { ...res, payment_status: 'paid' } : res
              );
            }

            return {
              history: nextHistory,
              invoice: updatedInvoice,
              reservations: nextReservations,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, history: nextHistory, reservations: nextReservations })
              }
            };
          });
        }
      },

      deleteFromHistory: async (id, invoiceNumber) => {
        if (window.api && id) {
          await window.api.invoices.delete(id);
          await get().fetchInvoices();
          await get().fetchStats();
        } else {
          // Preview/Fallback
          set((state) => {
            const nextHistory = state.history.filter(item => {
              const matchesId = id ? String(item.id) === String(id) : false;
              const matchesNum = item.invoiceNumber === invoiceNumber;
              return !(matchesId || matchesNum);
            });
            return {
              history: nextHistory,
              stats: {
                ...state.stats,
                summary: calculateStatsFromState({ ...state, history: nextHistory })
              }
            };
          });
        }
      },

      loadFromHistory: (historyItem) => {
        const { createdAt, totalAmount, ...invoice } = historyItem;
        set({ invoice });
      },

      fetchStats: async () => {
        if (window.api && window.api.stats) {
          const [monthlyRevenue, unitRevenue, summary] = await Promise.all([
            window.api.stats.getMonthlyRevenue(),
            window.api.stats.getUnitRevenue(),
            window.api.stats.getSummary()
          ]);
          set({ stats: { monthlyRevenue, unitRevenue, summary } });
        } else {
          // Preview/Browser Fallback - Calculate from local history
          const { history, guests, reservations } = get();
          const summary = calculateStatsFromState({ history, guests, reservations });

          set((state) => ({ 
            stats: { 
              ...state.stats,
              summary
            } 
          }));
        }
      }
    }),
    {
      name: 'luxebill-storage',
    }
  )
);
