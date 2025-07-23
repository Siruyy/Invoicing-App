using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Enums;

namespace InvoicingApp.Core.Interfaces
{
    public interface IInvoiceRepository : IRepository<Invoice>
    {
        Task<Invoice?> GetInvoiceWithDetailsAsync(int id);
        Task<IEnumerable<Invoice>> GetInvoicesByClientAsync(int clientId);
        Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(InvoiceStatus status);
        Task<IEnumerable<Invoice>> GetOverdueInvoicesAsync();
        Task<string> GenerateInvoiceNumberAsync();
        Task RemoveInvoiceItemsAsync(int invoiceId);
    }
} 