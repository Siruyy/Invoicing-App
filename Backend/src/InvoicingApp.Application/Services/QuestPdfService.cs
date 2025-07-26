using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Settings;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;
using System.Threading.Tasks;

namespace InvoicingApp.Application.Services
{
    public class QuestPdfService : IPdfService
    {
        private readonly CompanySettings _companySettings;

        public QuestPdfService(IOptions<CompanySettings> companySettings)
        {
            // Set license type to Community - free for open-source and small businesses
            QuestPDF.Settings.License = LicenseType.Community;
            _companySettings = companySettings.Value;
        }

        public Task<byte[]> GenerateInvoicePdfAsync(InvoiceDto invoice)
        {
            try
            {
                // Create the document
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(50);
                        page.DefaultTextStyle(x => x.FontSize(10));

                        page.Header().Element(container => ComposeHeader(container, invoice));
                        page.Content().Element(container => ComposeContent(container, invoice));
                        page.Footer().Element(container => ComposeFooter(container, invoice));
                    });
                });

                // Generate and return the PDF content
                using (var memoryStream = new MemoryStream())
                {
                    document.GeneratePdf(memoryStream);
                    return Task.FromResult(memoryStream.ToArray());
                }
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.Error.WriteLine($"Error generating PDF: {ex.Message}");
                Console.Error.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        private void ComposeHeader(IContainer container, InvoiceDto invoice)
        {
            container.Row(row =>
            {
                // Company information (left side)
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(_companySettings.Name)
                        .FontSize(20)
                        .SemiBold()
                        .FontColor(Colors.Blue.Darken3);
                    
                    column.Item().Text(_companySettings.Address);
                    column.Item().Text($"{_companySettings.City}, {_companySettings.State} {_companySettings.ZipCode}");
                    column.Item().Text($"Phone: {_companySettings.Phone}");
                    column.Item().Text($"Email: {_companySettings.Email}");
                    
                    if (!string.IsNullOrEmpty(_companySettings.Website))
                    {
                        column.Item().Text($"Website: {_companySettings.Website}");
                    }
                });

                // Invoice title and info (right side)
                row.RelativeItem().Column(column =>
                {
                    column.Item().AlignRight().Text("INVOICE")
                        .FontSize(20)
                        .SemiBold()
                        .FontColor(Colors.Blue.Darken3);

                    column.Item().AlignRight().Text($"Invoice #: {invoice.InvoiceNumber}");
                    column.Item().AlignRight().Text($"Issue Date: {invoice.IssueDate:d}");
                    column.Item().AlignRight().Text($"Due Date: {invoice.DueDate:d}");
                    column.Item().AlignRight().Text($"Status: {invoice.Status}");
                });
            });
        }

        private void ComposeContent(IContainer container, InvoiceDto invoice)
        {
            container.PaddingVertical(20).Column(column =>
            {
                // Client information
                column.Item().PaddingBottom(20).Column(client =>
                {
                    client.Item().Text("Bill To:").SemiBold();
                    client.Item().Text(invoice.Client.Name);
                    
                    if (!string.IsNullOrEmpty(invoice.Client.Address))
                        client.Item().Text(invoice.Client.Address);
                    
                    if (!string.IsNullOrEmpty(invoice.Client.Phone))
                        client.Item().Text($"Phone: {invoice.Client.Phone}");
                    
                    if (!string.IsNullOrEmpty(invoice.Client.Email))
                        client.Item().Text($"Email: {invoice.Client.Email}");
                });

                // Table header
                column.Item().Table(table =>
                {
                    // Define columns
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(4); // Description
                        columns.RelativeColumn(1); // Quantity
                        columns.RelativeColumn(1); // Unit Price
                        columns.RelativeColumn(1); // Amount
                    });

                    // Table header
                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Description").SemiBold();
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Quantity").SemiBold().AlignRight();
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Unit Price").SemiBold().AlignRight();
                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Amount").SemiBold().AlignRight();
                    });

                    // Table content
                    foreach (var item in invoice.Items)
                    {
                        var amount = item.Quantity * item.UnitPrice;

                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Description);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Quantity.ToString()).AlignRight();
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"${item.UnitPrice:0.00}").AlignRight();
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"${amount:0.00}").AlignRight();
                    }
                });

                // Summary section
                column.Item().AlignRight().PaddingTop(10).Table(table => 
                {
                    table.ColumnsDefinition(columns => 
                    {
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                    });
                    
                    table.Cell().Text("Subtotal:").SemiBold();
                    table.Cell().Text($"${invoice.Subtotal:0.00}").AlignRight();
                    
                    table.Cell().Text($"Tax ({invoice.TaxRate:0.00}%):").SemiBold();
                    table.Cell().Text($"${invoice.TaxAmount:0.00}").AlignRight();
                    
                    table.Cell().ColumnSpan(2).PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                    
                    table.Cell().Text("TOTAL:").FontSize(12).SemiBold().FontColor(Colors.Blue.Darken3);
                    table.Cell().Text($"${invoice.TotalAmount:0.00}").FontSize(12).SemiBold().AlignRight().FontColor(Colors.Blue.Darken3);
                });

                // Notes section
                if (!string.IsNullOrEmpty(invoice.Notes))
                {
                    column.Item().PaddingTop(20).Column(notes => 
                    {
                        notes.Item().Text("Notes:").SemiBold();
                        notes.Item().Text(invoice.Notes);
                    });
                }

                // Payment instructions
                column.Item().PaddingTop(20).Column(payment => 
                {
                    payment.Item().Text("Payment Instructions:").SemiBold();
                    payment.Item().Text("Please make payment within the due date by bank transfer to the account details below:");
                    payment.Item().Text($"Bank: {_companySettings.BankName}");
                    payment.Item().Text($"Account Name: {_companySettings.AccountName}");
                    payment.Item().Text($"Account Number: {_companySettings.AccountNumber}");
                    payment.Item().Text($"Reference: {invoice.InvoiceNumber}");
                });
            });
        }

        private void ComposeFooter(IContainer container, InvoiceDto invoice)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(text =>
                    {
                        text.Span("Thank you for your business! ").SemiBold();
                        text.Span("Please contact us with any questions regarding this invoice.");
                    });
                    
                    column.Item().Text($"{_companySettings.Name} | {_companySettings.Phone} | {_companySettings.Email}");
                    column.Item().Text($"Generated on: {DateTime.Now:g}");
                });
            });
        }
    }
}
