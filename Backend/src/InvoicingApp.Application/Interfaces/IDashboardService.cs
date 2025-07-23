using InvoicingApp.Application.DTOs;

namespace InvoicingApp.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardDto> GetDashboardMetricsAsync();
        Task<IEnumerable<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int months);
        Task<IEnumerable<StatusBreakdownDto>> GetStatusBreakdownAsync();
    }
} 