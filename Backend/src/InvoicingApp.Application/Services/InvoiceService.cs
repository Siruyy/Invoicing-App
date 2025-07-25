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
        private readonly IPdfService _pdfService;

        public InvoiceService(
            IInvoiceRepository invoiceRepository, 
            IClientRepository clientRepository,
            IPdfService pdfService)
        {
            _invoiceRepository = invoiceRepository;
            _clientRepository = clientRepository;
            _pdfService = pdfService;
        }

        public async Task<PagedResultDto<InvoiceDto>> GetFilteredInvoicesAsync(
            int page = 1, 
            int limit = 10, 
            InvoiceStatus? status = null, 
            DateTime? startDate = null, 
            DateTime? endDate = null, 
            string? search = null, 
            bool includeDrafts = false)
        {
            // Get all invoices with client data
            var allInvoices = await _invoiceRepository.GetAllInvoicesWithClientsAsync();
            
            // Apply filters
            var filteredInvoices = allInvoices.AsQueryable();
            
            // Status filter
            if (status.HasValue)
            {
                filteredInvoices = filteredInvoices.Where(i => i.Status == status.Value);
            }
            else if (!includeDrafts)
            {
                filteredInvoices = filteredInvoices.Where(i => i.Status != InvoiceStatus.Draft);
            }
            
            // Date range filter
            if (startDate.HasValue)
            {
                var start = startDate.Value.Date;
                filteredInvoices = filteredInvoices.Where(i => i.IssueDate >= start);
            }
            
            if (endDate.HasValue)
            {
                var end = endDate.Value.Date.AddDays(1).AddTicks(-1); // End of the day
                filteredInvoices = filteredInvoices.Where(i => i.IssueDate <= end);
            }
            
            // Search filter - search in invoice number or client name
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                filteredInvoices = filteredInvoices.Where(i => 
                    i.InvoiceNumber.ToLower().Contains(search) ||
                    (i.Client != null && i.Client.Name.ToLower().Contains(search)));
            }
            
            // Count total results after filtering but before pagination
            var totalCount = filteredInvoices.Count();
            
            // Apply pagination
            var pagedInvoices = filteredInvoices
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToList();
                
            // Convert to DTOs
            var invoiceDtos = pagedInvoices.Select(i => i.ToDto());
            
            // Return paged result
            return new PagedResultDto<InvoiceDto>(invoiceDtos, totalCount, page, limit);
        }

        public async Task<IEnumerable<InvoiceDto>> GetAllInvoicesAsync(bool includeDrafts = false)
        {
            IEnumerable<Invoice> invoices;
            
            // Let's add the client data by loading all invoices with their clients
            if (includeDrafts)
            {
                // Return all invoices including drafts
                invoices = await _invoiceRepository.GetAllInvoicesWithClientsAsync();
            }
            else
            {
                // Return only non-draft invoices
                invoices = await _invoiceRepository.GetInvoicesByStatusAsync(InvoiceStatus.Draft, exclude: true);
            }
            
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

            // If we're marking as paid, set the PaidAt timestamp
            if (statusDto.Status == InvoiceStatus.Paid)
            {
                // If PaidAt is provided in the DTO, use it; otherwise use current time
                invoice.PaidAt = statusDto.PaidAt ?? DateTime.UtcNow;
            }
            else if (invoice.Status == InvoiceStatus.Paid && statusDto.Status != InvoiceStatus.Paid)
            {
                // If changing from paid to another status, clear the PaidAt timestamp
                invoice.PaidAt = null;
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
        
        public async Task<byte[]> GenerateInvoicePdfAsync(int id)
        {
            var invoice = await GetInvoiceByIdAsync(id);
            if (invoice == null)
            {
                throw new KeyNotFoundException($"Invoice with ID {id} not found");
            }
            
            return await _pdfService.GenerateInvoicePdfAsync(invoice);
        }
    }
} 