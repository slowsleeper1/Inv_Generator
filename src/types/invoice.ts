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
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface AccommodationDetails {
  nightlyRate: number;
  nights: number;
  cleaningFee: number;
  serviceFee: number;
  taxRate: number;
  discount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  business: BusinessDetails;
  customer: CustomerDetails;
  accommodation: AccommodationDetails;
  lineItems: LineItem[];
  notes: string;
}

export interface HistoryItem extends InvoiceData {
  createdAt: string;
  totalAmount: number;
}

export type Theme = 'light' | 'dark';
export type InvoiceFont = 'font-sans' | 'font-mono' | 'font-serif';
