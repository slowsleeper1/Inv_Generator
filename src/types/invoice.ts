export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BusinessDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo?: string;
}

export interface CustomerDetails {
  id?: number; // SQLite ID
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface AccommodationDetails {
  id?: number; // Reservation ID
  unitNumber?: string;
  nightlyRate: number;
  nights: number;
  cleaningFee: number;
  serviceFee: number;
  taxRate: number;
  discount: number;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
}

export interface InvoiceData {
  id?: number; // SQLite ID
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  business: BusinessDetails;
  customer: CustomerDetails;
  accommodation: AccommodationDetails;
  lineItems: LineItem[];
  notes: string;
  reservationId?: number;
  status?: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
}

export interface HistoryItem extends InvoiceData {
  createdAt: string;
  totalAmount: number;
}

export type Theme = 'light' | 'dark';
export type InvoiceFont = 'font-sans' | 'font-mono' | 'font-serif';
