using InvoicingApp.Core.Entities;

namespace InvoicingApp.Core.Interfaces
{
    public interface IClientRepository : IRepository<Client>
    {
        Task<Client?> GetClientWithInvoicesAsync(int id);
        Task<IEnumerable<Client>> GetClientsWithInvoicesAsync();
    }
} 