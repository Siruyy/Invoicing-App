using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Enums;
using InvoicingApp.Core.Interfaces;

namespace InvoicingApp.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IClientRepository _clientRepository;

        public DashboardService(IInvoiceRepository invoiceRepository, IClientRepository clientRepository)
        {
            _invoiceRepository = invoiceRepository;
            _clientRepository = clientRepository;
        }

        public async Task<DashboardDto> GetDashboardMetricsAsync()
        {
            // Debug info
            Console.WriteLine("GetDashboardMetricsAsync called");
            
            // Get all invoices for calculations
            var allInvoices = await _invoiceRepository.GetAllAsync();
            Console.WriteLine($"Total invoices: {allInvoices.Count()}");
            
            var overdueInvoices = await _invoiceRepository.GetOverdueInvoicesAsync();
            Console.WriteLine($"Overdue invoices: {overdueInvoices.Count()}");
            
            var clients = await _clientRepository.GetAllAsync();
            Console.WriteLine($"Total clients: {clients.Count()}");

            // Current period (last 30 days)
            var today = DateTime.UtcNow.Date;
            var thirtyDaysAgo = today.AddDays(-30);
            var sixtyDaysAgo = today.AddDays(-60); // For previous period comparison
            
            Console.WriteLine($"Date ranges - Today: {today:yyyy-MM-dd}, 30 days ago: {thirtyDaysAgo:yyyy-MM-dd}, 60 days ago: {sixtyDaysAgo:yyyy-MM-dd}");

            // Current period invoices
            var currentPeriodInvoices = allInvoices.Where(i => i.IssueDate >= thirtyDaysAgo && i.IssueDate <= today);
            var previousPeriodInvoices = allInvoices.Where(i => i.IssueDate >= sixtyDaysAgo && i.IssueDate < thirtyDaysAgo);

            // Current metrics
            var totalRevenue = allInvoices
                .Where(i => i.Status == InvoiceStatus.Paid || i.Status == InvoiceStatus.PartiallyPaid)
                .Sum(i => i.TotalAmount);
            
            var overdueAmount = overdueInvoices.Sum(i => i.TotalAmount);
            
            var paidInvoicesCount = allInvoices.Count(i => i.Status == InvoiceStatus.Paid);
            var unpaidInvoicesCount = allInvoices.Count(i => i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid);
            var overdueInvoicesCount = overdueInvoices.Count();
            var clientsCount = clients.Count();

            // Current period metrics
            var currentPeriodRevenue = currentPeriodInvoices
                .Where(i => i.Status == InvoiceStatus.Paid || i.Status == InvoiceStatus.PartiallyPaid)
                .Sum(i => i.TotalAmount);

            var currentPeriodInvoiceCount = currentPeriodInvoices.Count();

            // Previous period metrics
            var previousPeriodRevenue = previousPeriodInvoices
                .Where(i => i.Status == InvoiceStatus.Paid || i.Status == InvoiceStatus.PartiallyPaid)
                .Sum(i => i.TotalAmount);
            
            var previousPeriodInvoiceCount = previousPeriodInvoices.Count();
            
            var previousPeriodOverdueAmount = allInvoices
                .Where(i => i.DueDate < thirtyDaysAgo && i.DueDate >= sixtyDaysAgo && 
                      (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.Overdue))
                .Sum(i => i.TotalAmount);

            // Calculate trend changes (as percentages)
            decimal revenueChange = CalculatePercentageChange(previousPeriodRevenue, currentPeriodRevenue);
            decimal invoicesCreatedChange = CalculatePercentageChange(previousPeriodInvoiceCount, currentPeriodInvoiceCount);
            decimal overdueAmountChange = CalculatePercentageChange(previousPeriodOverdueAmount, overdueAmount);

            // Calculate average invoice value
            decimal currentAverageValue = currentPeriodInvoiceCount > 0 
                ? currentPeriodRevenue / currentPeriodInvoiceCount 
                : 0;
                
            decimal previousAverageValue = previousPeriodInvoiceCount > 0 
                ? previousPeriodRevenue / previousPeriodInvoiceCount 
                : 0;
                
            decimal averageValueChange = CalculatePercentageChange(previousAverageValue, currentAverageValue);
            
            // Total average invoice value
            decimal averageInvoiceValue = (paidInvoicesCount + unpaidInvoicesCount) > 0
                ? totalRevenue / (paidInvoicesCount + unpaidInvoicesCount)
                : 0;

            // Get monthly revenue
            var monthlyRevenue = await GetMonthlyRevenueAsync(6);
            
            // Get status breakdown
            var statusBreakdown = await GetStatusBreakdownAsync();

            return new DashboardDto
            {
                TotalRevenue = totalRevenue,
                OverdueAmount = overdueAmount,
                PaidInvoicesCount = paidInvoicesCount,
                UnpaidInvoicesCount = unpaidInvoicesCount,
                OverdueInvoicesCount = overdueInvoicesCount,
                ClientsCount = clientsCount,
                RevenueChange = revenueChange,
                OverdueAmountChange = overdueAmountChange,
                InvoicesCreatedChange = invoicesCreatedChange,
                AverageValueChange = averageValueChange,
                AverageInvoiceValue = averageInvoiceValue,
                MonthlyRevenue = monthlyRevenue.ToList(),
                StatusBreakdown = statusBreakdown.ToList()
            };
        }

        public async Task<IEnumerable<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int months)
        {
            var result = new List<MonthlyRevenueDto>();
            var allInvoices = await _invoiceRepository.GetAllAsync();
            
            // Get paid invoices
            var paidInvoices = allInvoices.Where(i => i.Status == InvoiceStatus.Paid || i.Status == InvoiceStatus.PartiallyPaid);
            
            // Group by month
            var today = DateTime.UtcNow.Date;
            for (int i = 0; i < months; i++)
            {
                var date = today.AddMonths(-i);
                var monthStart = new DateTime(date.Year, date.Month, 1);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                
                var monthlyInvoices = paidInvoices.Where(inv => 
                    inv.IssueDate >= monthStart && inv.IssueDate <= monthEnd);
                    
                var amount = monthlyInvoices.Sum(inv => inv.TotalAmount);
                
                result.Add(new MonthlyRevenueDto
                {
                    Month = monthStart.ToString("MMM yyyy"),
                    Amount = amount
                });
            }

            return result.OrderBy(m => m.Month);
        }

        public async Task<IEnumerable<StatusBreakdownDto>> GetStatusBreakdownAsync()
        {
            var result = new List<StatusBreakdownDto>();
            var allInvoices = await _invoiceRepository.GetAllAsync();
            
            // Group by status
            var statusGroups = allInvoices.GroupBy(i => i.Status);
            
            foreach (var group in statusGroups)
            {
                var statusName = group.Key.ToString();
                var count = group.Count();
                var amount = group.Sum(i => i.TotalAmount);
                
                result.Add(new StatusBreakdownDto
                {
                    Status = statusName,
                    Count = count,
                    Amount = amount
                });
            }

            return result;
        }
        
        /// <summary>
        /// Calculate percentage change between old and new value
        /// </summary>
        /// <param name="oldValue">Previous period value</param>
        /// <param name="newValue">Current period value</param>
        /// <returns>Percentage change (positive means increase, negative means decrease)</returns>
        private decimal CalculatePercentageChange(decimal oldValue, decimal newValue)
        {
            // For debugging
            Console.WriteLine($"Calculating change: oldValue = {oldValue}, newValue = {newValue}");
            
            // Handle division by zero
            if (oldValue == 0)
            {
                var result = newValue > 0 ? 100 : 0; // If new value exists but old didn't, that's 100% increase
                Console.WriteLine($"oldValue is 0, returning {result}");
                return result;
            }
            
            var percentage = Math.Round((newValue - oldValue) / oldValue * 100, 1);
            Console.WriteLine($"Calculated percentage change: {percentage}%");
            return percentage;
        }
    }
} 