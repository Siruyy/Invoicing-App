export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  clientName: string;
  date: Date;
  dueDate: Date;
  amount: number;
  status: string;
}

export interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  invoicesCount: number;
  averageInvoiceValue: number;
  revenueChange: number;
  outstandingChange: number;
  invoicesChange: number;
  valueChange: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  previousYear?: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  value: number;
}

export interface ClientRevenue {
  clientName: string;
  revenue: number;
  percentage: number;
}

export interface DashboardData {
  totalRevenue: number;
  overdueAmount: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  overdueInvoicesCount: number;
  clientsCount: number;
  // Trend metrics (percentage change compared to previous period)
  revenueChange: number;
  overdueAmountChange: number;
  invoicesCreatedChange: number;
  averageValueChange: number;
  averageInvoiceValue: number;
  monthlyRevenue: MonthlyRevenue[];
  statusBreakdown: StatusDistribution[];
} 