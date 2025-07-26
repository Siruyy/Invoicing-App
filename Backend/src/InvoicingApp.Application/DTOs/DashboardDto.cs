namespace InvoicingApp.Application.DTOs
{
    public class DashboardDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal OverdueAmount { get; set; }
        public int PaidInvoicesCount { get; set; }
        public int UnpaidInvoicesCount { get; set; }
        public int OverdueInvoicesCount { get; set; }
        public int ClientsCount { get; set; }
        // Trend metrics (percentage change compared to previous period)
        public decimal RevenueChange { get; set; }
        public decimal OverdueAmountChange { get; set; }
        public decimal InvoicesCreatedChange { get; set; }
        public decimal AverageValueChange { get; set; }
        public decimal AverageInvoiceValue { get; set; }
        public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new List<MonthlyRevenueDto>();
        public List<StatusBreakdownDto> StatusBreakdown { get; set; } = new List<StatusBreakdownDto>();
    }

    public class MonthlyRevenueDto
    {
        public string Month { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class StatusBreakdownDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Amount { get; set; }
    }
} 