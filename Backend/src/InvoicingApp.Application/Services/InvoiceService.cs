using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Application.Mapping;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Enums;
using InvoicingApp.Core.Interfaces;
using System.Text;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;

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
        
        // CSV Invoice record class for CsvHelper
        private class InvoiceCsvRecord
        {
            public string InvoiceNumber { get; set; } = "";
            public int ClientId { get; set; }
            public string ClientName { get; set; } = "";  // For display purposes in CSV
            public string IssueDate { get; set; } = "";
            public string DueDate { get; set; } = "";
            public decimal Subtotal { get; set; }
            public decimal TaxRate { get; set; }
            public decimal TaxAmount { get; set; }
            public decimal TotalAmount { get; set; }
            public string Notes { get; set; } = "";
            public string Status { get; set; } = "";
            public string Currency { get; set; } = "";
            public decimal ExchangeRate { get; set; } = 1.0M;
            public string PaidAt { get; set; } = "";
        }
        
        // CSV InvoiceItem record class for handling items in CSV
        private class InvoiceItemCsvRecord
        {
            public string InvoiceNumber { get; set; } = ""; // To link items to invoices during import
            public string Description { get; set; } = "";
            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalPrice { get; set; }
        }
        
        public async Task<byte[]> ExportInvoicesToCsvAsync(IEnumerable<int> invoiceIds)
        {
            try
            {
                // Get invoices data
                List<Invoice> invoicesList = new List<Invoice>();
                
                if (invoiceIds != null && invoiceIds.Any())
                {
                    // Get specific invoices by IDs
                    foreach (var id in invoiceIds)
                    {
                        var invoice = await _invoiceRepository.GetByIdWithItemsAndClientAsync(id);
                        if (invoice != null)
                        {
                            invoicesList.Add(invoice);
                        }
                    }
                }
                else
                {
                    // Get all invoices
                    var allInvoices = await _invoiceRepository.GetAllInvoicesWithClientsAsync();
                    invoicesList.AddRange(allInvoices);
                }
                
                // Convert domain entities to CSV records
                var records = invoicesList.Select(i => new InvoiceCsvRecord
                {
                    InvoiceNumber = i.InvoiceNumber ?? "",
                    ClientId = i.ClientId,
                    ClientName = i.Client?.Name ?? "",
                    IssueDate = i.IssueDate.ToString("yyyy-MM-dd"),
                    DueDate = i.DueDate.ToString("yyyy-MM-dd"),
                    Subtotal = i.Subtotal,
                    TaxRate = i.TaxRate,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    Notes = i.Notes ?? "",
                    Status = i.Status.ToString(),
                    Currency = i.Currency ?? "USD",
                    ExchangeRate = i.ExchangeRate,
                    PaidAt = i.PaidAt.HasValue ? i.PaidAt.Value.ToString("yyyy-MM-dd") : ""
                }).ToList();
                
                // Also export invoice items in a separate sheet (for the same file)
                var itemRecords = new List<InvoiceItemCsvRecord>();
                foreach (var invoice in invoicesList)
                {
                    if (invoice.Items != null)
                    {
                        foreach (var item in invoice.Items)
                        {
                            itemRecords.Add(new InvoiceItemCsvRecord
                            {
                                InvoiceNumber = invoice.InvoiceNumber ?? "",
                                Description = item.Description ?? "",
                                Quantity = item.Quantity,
                                UnitPrice = item.UnitPrice,
                                TotalPrice = item.TotalPrice
                            });
                        }
                    }
                }
                
                // Use CsvHelper to generate the CSV
                using (var memoryStream = new MemoryStream())
                {
                    using (var writer = new StreamWriter(memoryStream, Encoding.UTF8, leaveOpen: true))
                    {
                        // First write the invoices
                        writer.WriteLine("# INVOICES");
                        using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                        {
                            await csv.WriteRecordsAsync(records);
                        }
                        
                        // Then add a separator and write the items
                        writer.WriteLine();
                        writer.WriteLine("# INVOICE ITEMS");
                        using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                        {
                            await csv.WriteRecordsAsync(itemRecords);
                        }
                        
                        await writer.FlushAsync();
                    }
                    
                    // Return the CSV as byte array
                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"CSV Export Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // For any error, return a simple CSV with error details
                using (var memoryStream = new MemoryStream())
                using (var writer = new StreamWriter(memoryStream, Encoding.UTF8))
                using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                {
                    // Create a simple error record
                    var errorRecord = new[]
                    {
                        new { Error = "Export Error", Message = ex.Message }
                    };
                    
                    await csv.WriteRecordsAsync(errorRecord);
                    await writer.FlushAsync();
                    
                    return memoryStream.ToArray();
                }
            }
        }
        
        public async Task<int> ImportInvoicesFromCsvAsync(Stream csvStream)
        {
            int importCount = 0;
            
            try
            {
                using (var reader = new StreamReader(csvStream))
                {
                    string? line;
                    bool processingInvoices = false;
                    bool processingItems = false;
                    
                    // Dictionary to store invoice numbers mapped to their IDs (for linking items later)
                    var invoiceNumberToIdMap = new Dictionary<string, int>();
                    
                    // Create CSV configurations that don't throw on missing fields
                    var csvConfig = new CsvConfiguration(CultureInfo.InvariantCulture)
                    {
                        HeaderValidated = null,
                        MissingFieldFound = null
                    };
                    
                    // Parse the CSV file which has two sections: INVOICES and INVOICE ITEMS
                    while ((line = reader.ReadLine()) is not null)
                    {
                        // Check for section headers
                        if (line.Trim().Equals("# INVOICES", StringComparison.OrdinalIgnoreCase))
                        {
                            processingInvoices = true;
                            processingItems = false;
                            continue;
                        }
                        else if (line.Trim().Equals("# INVOICE ITEMS", StringComparison.OrdinalIgnoreCase))
                        {
                            processingInvoices = false;
                            processingItems = true;
                            continue;
                        }
                        
                        // Skip empty lines
                        if (string.IsNullOrWhiteSpace(line))
                        {
                            continue;
                        }
                        
                        // If we're in the invoices section, process invoices
                        if (processingInvoices)
                        {
                            // Reset the stream to the current position and read invoices
                            var currentPosition = reader.BaseStream.Position - line.Length - Environment.NewLine.Length;
                            reader.BaseStream.Position = currentPosition;
                            
                            using (var csv = new CsvReader(reader, csvConfig))
                            {
                                // Read invoice records
                                var invoiceRecords = csv.GetRecords<InvoiceCsvRecord>();
                                
                                foreach (var record in invoiceRecords)
                                {
                                    // Skip rows without required fields
                                    if (string.IsNullOrWhiteSpace(record.InvoiceNumber) || record.ClientId <= 0)
                                    {
                                        continue;
                                    }
                                    
                                    // Verify client exists
                                    var client = await _clientRepository.GetByIdAsync(record.ClientId);
                                    if (client == null)
                                    {
                                        Console.WriteLine($"Client with ID {record.ClientId} not found for invoice {record.InvoiceNumber}");
                                        continue;
                                    }
                                    
                                    // Parse dates
                                    DateTime issueDate = DateTime.TryParse(record.IssueDate, out DateTime parsedIssueDate)
                                        ? parsedIssueDate
                                        : DateTime.UtcNow;
                                    
                                    DateTime dueDate = DateTime.TryParse(record.DueDate, out DateTime parsedDueDate)
                                        ? parsedDueDate
                                        : DateTime.UtcNow.AddDays(30);
                                    
                                    DateTime? paidAt = string.IsNullOrEmpty(record.PaidAt) ? null :
                                        (DateTime.TryParse(record.PaidAt, out DateTime parsedPaidAt) ? parsedPaidAt : (DateTime?)null);
                                    
                                    // Parse status
                                    if (!Enum.TryParse<InvoiceStatus>(record.Status, true, out var status))
                                    {
                                        status = InvoiceStatus.Draft;
                                    }
                                    
                                    // Create invoice
                                    var invoice = new Invoice
                                    {
                                        InvoiceNumber = record.InvoiceNumber,
                                        ClientId = record.ClientId,
                                        IssueDate = issueDate,
                                        DueDate = dueDate,
                                        Subtotal = record.Subtotal,
                                        TaxRate = record.TaxRate,
                                        TaxAmount = record.TaxAmount,
                                        TotalAmount = record.TotalAmount,
                                        Notes = record.Notes,
                                        Status = status,
                                        Currency = record.Currency,
                                        ExchangeRate = record.ExchangeRate,
                                        PaidAt = paidAt,
                                        CreatedAt = DateTime.UtcNow,
                                        Items = new List<InvoiceItem>() // Will add items in the next section
                                    };
                                    
                                    // Save invoice to database
                                    var invoiceId = await _invoiceRepository.AddInvoiceAsync(invoice);
                                    
                                    // Map invoice number to ID for linking items later
                                    invoiceNumberToIdMap[record.InvoiceNumber] = invoiceId;
                                    
                                    importCount++;
                                }
                            }
                            
                            // Break after processing invoices section to avoid reading the rest of the file again
                            processingInvoices = false;
                        }
                        
                        // If we're in the items section, process items
                        else if (processingItems)
                        {
                            // Reset the stream to the current position and read items
                            var currentPosition = reader.BaseStream.Position - line.Length - Environment.NewLine.Length;
                            reader.BaseStream.Position = currentPosition;
                            
                            using (var csv = new CsvReader(reader, csvConfig))
                            {
                                // Read item records
                                var itemRecords = csv.GetRecords<InvoiceItemCsvRecord>();
                                
                                foreach (var record in itemRecords)
                                {
                                    // Skip rows without required fields
                                    if (string.IsNullOrWhiteSpace(record.InvoiceNumber) || string.IsNullOrWhiteSpace(record.Description))
                                    {
                                        continue;
                                    }
                                    
                                    // Check if we have the invoice ID for this item
                                    if (!invoiceNumberToIdMap.TryGetValue(record.InvoiceNumber, out int invoiceId))
                                    {
                                        Console.WriteLine($"Invoice number {record.InvoiceNumber} not found for item {record.Description}");
                                        continue;
                                    }
                                    
                                    // Create invoice item
                                    var item = new InvoiceItem
                                    {
                                        InvoiceId = invoiceId,
                                        Description = record.Description,
                                        Quantity = record.Quantity,
                                        UnitPrice = record.UnitPrice,
                                        TotalPrice = record.TotalPrice
                                    };
                                    
                                    // Add item to the invoice
                                    await _invoiceRepository.AddItemAsync(item);
                                }
                            }
                            
                            break;
                        }
                    }
                }
                
                await _invoiceRepository.SaveChangesAsync();
                return importCount;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CSV Import Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new InvalidOperationException($"Failed to import CSV: {ex.Message}", ex);
            }
        }
    }
}