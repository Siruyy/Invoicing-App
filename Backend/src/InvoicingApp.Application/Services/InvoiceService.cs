using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Application.Mapping;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Enums;
using InvoicingApp.Core.Interfaces;

namespace InvoicingApp.Application.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IClientRepository _clientRepository;

        public InvoiceService(IInvoiceRepository invoiceRepository, IClientRepository clientRepository)
        {
            _invoiceRepository = invoiceRepository;
            _clientRepository = clientRepository;
        }

        public async Task<IEnumerable<InvoiceDto>> GetAllInvoicesAsync()
        {
            var invoices = await _invoiceRepository.FindAsync(i => i.Status != InvoiceStatus.Draft);
            return invoices.Select(i => i.ToDto());
        }

        public async Task<InvoiceDto?> GetInvoiceByIdAsync(int id)
        {
            var invoice = await _invoiceRepository.GetInvoiceWithDetailsAsync(id);
            return invoice?.ToDto();
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesByClientAsync(int clientId)
        {
            var invoices = await _invoiceRepository.GetInvoicesByClientAsync(clientId);
            return invoices.Select(i => i.ToDto());
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesByStatusAsync(InvoiceStatus status)
        {
            var invoices = await _invoiceRepository.GetInvoicesByStatusAsync(status);
            return invoices.Select(i => i.ToDto());
        }

        public async Task<IEnumerable<InvoiceDto>> GetOverdueInvoicesAsync()
        {
            var invoices = await _invoiceRepository.GetOverdueInvoicesAsync();
            
            // Also check for invoices that aren't marked as overdue but should be
            foreach (var invoice in invoices)
            {
                if (invoice.Status != InvoiceStatus.Overdue)
                {
                    invoice.Status = InvoiceStatus.Overdue;
                    await _invoiceRepository.UpdateAsync(invoice);
                }
            }
            
            await _invoiceRepository.SaveChangesAsync();
            return invoices.Select(i => i.ToDto());
        }

        public async Task<int> CreateInvoiceAsync(CreateInvoiceDto invoiceDto)
        {
            // Verify client exists
            var client = await _clientRepository.GetByIdAsync(invoiceDto.ClientId);
            if (client == null)
            {
                throw new KeyNotFoundException($"Client with ID {invoiceDto.ClientId} not found.");
            }

            var invoice = invoiceDto.ToEntity();
            
            // Generate invoice number
            invoice.InvoiceNumber = await _invoiceRepository.GenerateInvoiceNumberAsync();
            
            // Set status to pending if not a draft
            invoice.Status = InvoiceStatus.Pending;
            
            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();

            return invoice.Id;
        }

        public async Task UpdateInvoiceAsync(UpdateInvoiceDto invoiceDto)
        {
            var invoice = await _invoiceRepository.GetInvoiceWithDetailsAsync(invoiceDto.Id);
            
            if (invoice == null)
            {
                throw new KeyNotFoundException($"Invoice with ID {invoiceDto.Id} not found.");
            }

            // Cannot update finalized invoices
            if (invoice.Status == InvoiceStatus.Paid || invoice.Status == InvoiceStatus.Cancelled)
            {
                throw new InvalidOperationException($"Cannot update invoice with ID {invoiceDto.Id} because it has been finalized.");
            }

            // Verify client exists
            if (invoice.ClientId != invoiceDto.ClientId)
            {
                var client = await _clientRepository.GetByIdAsync(invoiceDto.ClientId);
                if (client == null)
                {
                    throw new KeyNotFoundException($"Client with ID {invoiceDto.ClientId} not found.");
                }
                invoice.ClientId = invoiceDto.ClientId;
            }

            // Update basic properties
            invoice.IssueDate = invoiceDto.IssueDate;
            invoice.DueDate = invoiceDto.DueDate;
            invoice.TaxRate = invoiceDto.TaxRate;
            invoice.Notes = invoiceDto.Notes;
            invoice.Status = invoiceDto.Status;
            invoice.UpdatedAt = DateTime.UtcNow;

            // Update invoice items (remove existing and add new ones)
            if (invoiceDto.Items != null && invoiceDto.Items.Any())
            {
                // Remove existing items
                await _invoiceRepository.RemoveInvoiceItemsAsync(invoice.Id);
                invoice.Items.Clear();

                // Add new items
                foreach (var itemDto in invoiceDto.Items)
                {
                    var newItem = new InvoiceItem
                    {
                        InvoiceId = invoice.Id,
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.Quantity * itemDto.UnitPrice
                    };
                    invoice.Items.Add(newItem);
                }

                // Recalculate totals
                invoice.Subtotal = invoice.Items.Sum(item => item.TotalPrice);
                invoice.TaxAmount = invoice.Subtotal * (invoice.TaxRate / 100);
                invoice.TotalAmount = invoice.Subtotal + invoice.TaxAmount;
            }

            await _invoiceRepository.UpdateAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();
        }

        public async Task UpdateInvoiceStatusAsync(UpdateInvoiceStatusDto statusDto)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(statusDto.Id);
            
            if (invoice == null)
            {
                throw new KeyNotFoundException($"Invoice with ID {statusDto.Id} not found.");
            }

            // Validate status transitions
            if (invoice.Status == InvoiceStatus.Cancelled)
            {
                throw new InvalidOperationException("Cannot change status of a cancelled invoice.");
            }

            if (invoice.Status == InvoiceStatus.Paid && statusDto.Status != InvoiceStatus.PartiallyPaid)
            {
                throw new InvalidOperationException("Paid invoice can only be changed to partially paid status.");
            }

            invoice.Status = statusDto.Status;
            invoice.UpdatedAt = DateTime.UtcNow;

            await _invoiceRepository.UpdateAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();
        }

        public async Task DeleteInvoiceAsync(int id)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(id);
            
            if (invoice == null)
            {
                throw new KeyNotFoundException($"Invoice with ID {id} not found.");
            }

            // Only draft invoices can be deleted
            if (invoice.Status != InvoiceStatus.Draft)
            {
                throw new InvalidOperationException($"Cannot delete invoice with ID {id} because it is not a draft.");
            }

            // Remove invoice items first
            await _invoiceRepository.RemoveInvoiceItemsAsync(id);
            
            // Then remove the invoice
            await _invoiceRepository.RemoveAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();
        }

        public async Task<string> GenerateInvoiceNumberAsync()
        {
            return await _invoiceRepository.GenerateInvoiceNumberAsync();
        }

        public async Task<InvoiceDto?> SaveDraftAsync(CreateInvoiceDto invoiceDto)
        {
            // Verify client exists
            var client = await _clientRepository.GetByIdAsync(invoiceDto.ClientId);
            if (client == null)
            {
                throw new KeyNotFoundException($"Client with ID {invoiceDto.ClientId} not found.");
            }

            var invoice = invoiceDto.ToEntity();
            
            // Generate draft invoice number
            invoice.InvoiceNumber = "DRAFT-" + Guid.NewGuid().ToString().Substring(0, 8);
            
            // Set status to draft
            invoice.Status = InvoiceStatus.Draft;
            
            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();

            return (await _invoiceRepository.GetInvoiceWithDetailsAsync(invoice.Id))?.ToDto();
        }

        public async Task<InvoiceDto?> GetDraftByIdAsync(int id)
        {
            var invoice = await _invoiceRepository.GetInvoiceWithDetailsAsync(id);
            
            if (invoice == null || invoice.Status != InvoiceStatus.Draft)
            {
                return null;
            }

            return invoice.ToDto();
        }
    }
} 