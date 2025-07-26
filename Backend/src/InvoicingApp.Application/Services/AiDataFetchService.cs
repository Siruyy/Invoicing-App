using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Enums;
using InvoicingApp.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace InvoicingApp.Application.Services
{
    public class AiDataFetchService : IAiDataFetchService
    {
        private readonly IClientService _clientService;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<AiDataFetchService> _logger;

        public AiDataFetchService(
            IClientService clientService,
            IInvoiceService invoiceService,
            ILogger<AiDataFetchService> logger)
        {
            _clientService = clientService;
            _invoiceService = invoiceService;
            _logger = logger;
        }

        public async Task<string> GetRelevantDataForQuery(string query)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("Here is the relevant data from the invoicing database:");
                sb.AppendLine();

                // Parse the query to determine what data to fetch
                if (query.Contains("purchase history", StringComparison.OrdinalIgnoreCase) ||
                    query.Contains("buying patterns", StringComparison.OrdinalIgnoreCase) ||
                    query.Contains("likely to buy", StringComparison.OrdinalIgnoreCase))
                {
                    // Get all clients
                    var clients = await _clientService.GetAllClientsAsync();
                    
                    // For each client, get their invoices
                    foreach (var client in clients)
                    {
                        var clientInvoices = await _invoiceService.GetInvoicesByClientAsync(client.Id);
                        var clientInvoicesList = clientInvoices.ToList();
                        
                        // Skip clients with no invoices
                        if (clientInvoicesList.Count == 0) continue;
                        
                        sb.AppendLine($"Client: {client.Name} (ID: {client.Id})");
                        sb.AppendLine($"  Total Invoices: {clientInvoicesList.Count}");
                        
                        // Get invoice item categories and frequencies
                        var invoiceItems = new List<string>();
                        foreach (var invoice in clientInvoicesList)
                        {
                            foreach (var item in invoice.Items)
                            {
                                invoiceItems.Add(item.Description);
                            }
                        }
                        
                        var itemCounts = invoiceItems
                            .GroupBy(i => i)
                            .Select(g => new { Item = g.Key, Count = g.Count() })
                            .OrderByDescending(x => x.Count)
                            .Take(5);
                        
                        sb.AppendLine("  Top purchased items:");
                        foreach (var item in itemCounts)
                        {
                            sb.AppendLine($"    - {item.Item}: {item.Count} times");
                        }
                        
                        // Recent purchase date
                        var latestInvoice = clientInvoicesList.OrderByDescending(i => i.IssueDate).FirstOrDefault();
                        if (latestInvoice != null)
                        {
                            sb.AppendLine($"  Most recent purchase: {latestInvoice.IssueDate:yyyy-MM-dd}");
                        }
                        
                        // Purchase frequency
                        if (clientInvoicesList.Count > 1)
                        {
                            var firstInvoice = clientInvoicesList.OrderBy(i => i.IssueDate).First();
                            var daysSinceFirst = (DateTime.Now - firstInvoice.IssueDate).TotalDays;
                            var purchaseFrequency = daysSinceFirst / clientInvoicesList.Count;
                            sb.AppendLine($"  Average days between purchases: {purchaseFrequency:F1}");
                        }
                        
                        sb.AppendLine();
                    }
                }
                else if (query.Contains("churn risk", StringComparison.OrdinalIgnoreCase) ||
                         query.Contains("delayed payment", StringComparison.OrdinalIgnoreCase))
                {
                    var clients = await _clientService.GetAllClientsAsync();
                    
                    foreach (var client in clients)
                    {
                        var clientInvoices = await _invoiceService.GetInvoicesByClientAsync(client.Id);
                        var clientInvoicesList = clientInvoices.ToList();
                        
                        if (clientInvoicesList.Count == 0) continue;
                        
                        var overdueInvoices = clientInvoicesList.Count(i => i.DueDate < DateTime.Now && i.Status != InvoiceStatus.Paid);
                        var latePaymentPercentage = clientInvoicesList.Count > 0 ? 
                            (double)overdueInvoices / clientInvoicesList.Count * 100 : 0;
                            
                        sb.AppendLine($"Client: {client.Name} (ID: {client.Id})");
                        sb.AppendLine($"  Total Invoices: {clientInvoicesList.Count}");
                        sb.AppendLine($"  Overdue Invoices: {overdueInvoices}");
                        sb.AppendLine($"  Late Payment Rate: {latePaymentPercentage:F1}%");
                        
                        // Check purchase trend (declining?)
                        if (clientInvoicesList.Count >= 3)
                        {
                            var invoicesByMonth = clientInvoicesList
                                .GroupBy(i => new { i.IssueDate.Year, i.IssueDate.Month })
                                .OrderBy(g => g.Key.Year)
                                .ThenBy(g => g.Key.Month)
                                .Select(g => new { 
                                    YearMonth = $"{g.Key.Year}-{g.Key.Month:D2}", 
                                    Count = g.Count(),
                                    Value = g.Sum(i => i.TotalAmount)
                                })
                                .ToList();
                                
                            sb.AppendLine("  Purchase trend by month:");
                            foreach (var month in invoicesByMonth.TakeLast(6))
                            {
                                sb.AppendLine($"    - {month.YearMonth}: {month.Count} invoices, ${month.Value:F2}");
                            }
                        }
                        
                        sb.AppendLine();
                    }
                }
                else
                {
                    // For general queries, provide summary data
                    var clients = await _clientService.GetAllClientsAsync();
                    var invoices = await _invoiceService.GetAllInvoicesAsync();
                    
                    sb.AppendLine($"Total Clients: {clients.Count()}");
                    sb.AppendLine($"Total Invoices: {invoices.Count()}");
                    
                    var paidInvoices = invoices.Count(i => i.Status == InvoiceStatus.Paid);
                    var overdueInvoices = invoices.Count(i => i.DueDate < DateTime.Now && i.Status != InvoiceStatus.Paid);
                    
                    sb.AppendLine($"Paid Invoices: {paidInvoices}");
                    sb.AppendLine($"Overdue Invoices: {overdueInvoices}");
                    
                    // Top clients by spending
                    var topClients = invoices
                        .GroupBy(i => i.ClientId)
                        .Select(g => new { 
                            ClientId = g.Key,
                            TotalSpent = g.Sum(i => i.TotalAmount)
                        })
                        .OrderByDescending(x => x.TotalSpent)
                        .Take(5)
                        .ToList();
                        
                    sb.AppendLine("\nTop Clients by Spending:");
                    foreach (var topClient in topClients)
                    {
                        var client = clients.FirstOrDefault(c => c.Id == topClient.ClientId);
                        if (client != null)
                        {
                            sb.AppendLine($"  - {client.Name}: ${topClient.TotalSpent:F2}");
                        }
                    }
                    
                    // Most common invoice items
                    var allItems = invoices.SelectMany(i => i.Items).ToList();
                    var topItems = allItems
                        .GroupBy(i => i.Description)
                        .Select(g => new { Item = g.Key, Count = g.Count() })
                        .OrderByDescending(x => x.Count)
                        .Take(5);
                        
                    sb.AppendLine("\nMost Common Invoice Items:");
                    foreach (var item in topItems)
                    {
                        sb.AppendLine($"  - {item.Item}: {item.Count} times");
                    }
                }

                return sb.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching data for AI query");
                return "Error: Unable to fetch relevant data from the database.";
            }
        }
    }
}
