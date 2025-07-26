using InvoicingApp.Application.DTOs;
using InvoicingApp.Core.Enums;

namespace InvoicingApp.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<IEnumerable<InvoiceDto>> GetAllInvoicesAsync(bool includeDrafts = false);
        Task<PagedResultDto<InvoiceDto>> GetFilteredInvoicesAsync(
            int page = 1, 
            int limit = 10, 
            InvoiceStatus? status = null, 
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            string? search = null, 
            bool includeDrafts = false,
            string sortField = null,
            int? sortOrder = null);
        Task<InvoiceDto?> GetInvoiceByIdAsync(int id);
        Task<IEnumerable<InvoiceDto>> GetInvoicesByClientAsync(int clientId);
        Task<IEnumerable<InvoiceDto>> GetInvoicesByStatusAsync(InvoiceStatus status);
        Task<IEnumerable<InvoiceDto>> GetOverdueInvoicesAsync();
        Task<byte[]> GenerateInvoicePdfAsync(int id);
        Task<int> CreateInvoiceAsync(CreateInvoiceDto invoiceDto);
        Task UpdateInvoiceAsync(UpdateInvoiceDto invoiceDto);
        Task UpdateInvoiceStatusAsync(UpdateInvoiceStatusDto statusDto);
        Task DeleteInvoiceAsync(int id);
        Task<string> GenerateInvoiceNumberAsync();
        Task<InvoiceDto?> SaveDraftAsync(CreateInvoiceDto invoiceDto);
        Task<InvoiceDto?> GetDraftByIdAsync(int id);
        
        // CSV Import/Export methods
        Task<byte[]> ExportInvoicesToCsvAsync(IEnumerable<int> invoiceIds);
        Task<int> ImportInvoicesFromCsvAsync(Stream csvStream);
    }
} 