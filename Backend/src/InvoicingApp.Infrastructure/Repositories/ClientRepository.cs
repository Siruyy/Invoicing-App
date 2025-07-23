using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoicingApp.Infrastructure.Repositories
{
    public class ClientRepository : Repository<Client>, IClientRepository
    {
        public ClientRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Client?> GetClientWithInvoicesAsync(int id)
        {
            return await _context.Clients
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Client>> GetClientsWithInvoicesAsync()
        {
            return await _context.Clients
                .Include(c => c.Invoices)
                .ToListAsync();
        }
    }
} 