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
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  discount?: number;
  total?: number;
  notes?: string;
  terms?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paidAt?: Date;
} 