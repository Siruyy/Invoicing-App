using InvoicingApp.Application.DTOs;
using InvoicingApp.Core.Enums;

namespace InvoicingApp.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<IEnumerable<InvoiceDto>> GetAllInvoicesAsync();
        Task<InvoiceDto?> GetInvoiceByIdAsync(int id);
        Task<IEnumerable<InvoiceDto>> GetInvoicesByClientAsync(int clientId);
        Task<IEnumerable<InvoiceDto>> GetInvoicesByStatusAsync(InvoiceStatus status);
        Task<IEnumerable<InvoiceDto>> GetOverdueInvoicesAsync();
        Task<int> CreateInvoiceAsync(CreateInvoiceDto invoiceDto);
        Task UpdateInvoiceAsync(UpdateInvoiceDto invoiceDto);
        Task UpdateInvoiceStatusAsync(UpdateInvoiceStatusDto statusDto);
        Task DeleteInvoiceAsync(int id);
        Task<string> GenerateInvoiceNumberAsync();
        Task<InvoiceDto?> SaveDraftAsync(CreateInvoiceDto invoiceDto);
        Task<InvoiceDto?> GetDraftByIdAsync(int id);
    }
} 