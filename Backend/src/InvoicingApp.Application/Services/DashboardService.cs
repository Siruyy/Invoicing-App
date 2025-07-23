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
            // Get all invoices for calculations
            var allInvoices = await _invoiceRepository.GetAllAsync();
            var overdueInvoices = await _invoiceRepository.GetOverdueInvoicesAsync();
            var clients = await _clientRepository.GetAllAsync();

            // Calculate metrics
            var totalRevenue = allInvoices.Where(i => i.Status == InvoiceStatus.Paid || i.Status == InvoiceStatus.PartiallyPaid)
                                         .Sum(i => i.TotalAmount);
            
            var overdueAmount = overdueInvoices.Sum(i => i.TotalAmount);
            
            var paidInvoicesCount = allInvoices.Count(i => i.Status == InvoiceStatus.Paid);
            var unpaidInvoicesCount = allInvoices.Count(i => i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid);
            var overdueInvoicesCount = overdueInvoices.Count();
            var clientsCount = clients.Count();

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
    }
} 