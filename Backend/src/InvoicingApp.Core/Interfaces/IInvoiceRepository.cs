using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Enums;

namespace InvoicingApp.Core.Interfaces
{
    public interface IInvoiceRepository : IRepository<Invoice>
    {
        Task<Invoice?> GetInvoiceWithDetailsAsync(int id);
        Task<IEnumerable<Invoice>> GetInvoicesByClientAsync(int clientId);
        Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(InvoiceStatus status, bool exclude = false);
        Task<IEnumerable<Invoice>> GetOverdueInvoicesAsync();
        Task<string> GenerateInvoiceNumberAsync();
        Task RemoveInvoiceItemsAsync(int invoiceId);
        Task<IEnumerable<Invoice>> GetAllInvoicesWithClientsAsync();
        Task<Invoice?> GetByIdWithItemsAndClientAsync(int id);
        Task<int> AddInvoiceAsync(Invoice invoice);
        Task AddItemAsync(InvoiceItem item);
    }
} 