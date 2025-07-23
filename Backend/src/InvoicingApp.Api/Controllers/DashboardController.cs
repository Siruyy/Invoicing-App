using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InvoicingApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardDto>> GetDashboardMetrics()
        {
            var metrics = await _dashboardService.GetDashboardMetricsAsync();
            return Ok(metrics);
        }

        [HttpGet("monthly-revenue/{months}")]
        public async Task<ActionResult<IEnumerable<MonthlyRevenueDto>>> GetMonthlyRevenue(int months = 6)
        {
            if (months <= 0 || months > 36)
            {
                return BadRequest("Months parameter must be between 1 and 36");
            }

            var monthlyRevenue = await _dashboardService.GetMonthlyRevenueAsync(months);
            return Ok(monthlyRevenue);
        }

        [HttpGet("status-breakdown")]
        public async Task<ActionResult<IEnumerable<StatusBreakdownDto>>> GetStatusBreakdown()
        {
            var statusBreakdown = await _dashboardService.GetStatusBreakdownAsync();
            return Ok(statusBreakdown);
        }
    }
} 