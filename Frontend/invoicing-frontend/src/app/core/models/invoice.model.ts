import { Client } from './client.model';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  total?: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  client: Client | number;
  clientId?: number;
  companyName?: string;
  companyAddress?: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  totalAmount?: number; // Match the backend field name 
  total?: number;       // Keep for backward compatibility
  notes?: string;
  terms?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paidAt?: Date;
  currency?: string;
  exchangeRate?: number;
} 