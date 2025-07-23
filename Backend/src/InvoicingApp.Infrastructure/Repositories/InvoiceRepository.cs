using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Enums;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoicingApp.Infrastructure.Repositories
{
    public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
    {
        public InvoiceRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Invoice?> GetInvoiceWithDetailsAsync(int id)
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<IEnumerable<Invoice>> GetInvoicesByClientAsync(int clientId)
        {
            return await _context.Invoices
                .Include(i => i.Items)
                .Where(i => i.ClientId == clientId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(InvoiceStatus status)
        {
            return await _context.Invoices
                .Include(i => i.Client)
                .Include(i => i.Items)
                .Where(i => i.Status == status)
                .ToListAsync();
        }

        public async Task<IEnumerable<Invoice>> GetOverdueInvoicesAsync()
        {
            var currentDate = DateTime.UtcNow.Date;
            return await _context.Invoices
                .Include(i => i.Client)
                .Where(i => i.DueDate < currentDate && i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled)
                .ToListAsync();
        }

        public async Task<string> GenerateInvoiceNumberAsync()
        {
            // Format: INV-{YEAR}{MONTH}{DAY}-{SEQUENTIAL_NUMBER}
            var today = DateTime.UtcNow;
            var prefix = $"INV-{today:yyyyMMdd}";
            
            // Find the latest invoice with today's prefix
            var lastInvoice = await _context.Invoices
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            int sequentialNumber = 1;
            
            if (lastInvoice != null)
            {
                // Extract the sequential number from the last invoice number and increment it
                var parts = lastInvoice.InvoiceNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int number))
                {
                    sequentialNumber = number + 1;
                }
            }

            return $"{prefix}-{sequentialNumber:D4}";
        }
        
        public async Task RemoveInvoiceItemsAsync(int invoiceId)
        {
            var items = await _context.InvoiceItems.Where(i => i.InvoiceId == invoiceId).ToListAsync();
            _context.InvoiceItems.RemoveRange(items);
        }
    }
} 