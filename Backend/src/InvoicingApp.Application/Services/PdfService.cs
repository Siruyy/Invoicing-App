using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using System;
using System.IO;
using System.Threading.Tasks;

namespace InvoicingApp.Application.Services
{
    public class PdfService : IPdfService
    {
        public Task<byte[]> GenerateInvoicePdfAsync(InvoiceDto invoice)
        {
            // Configure PDFSharp to work without fonts on the server
            // https://docs.pdfsharp.net/PDFsharp/GettingStarted/Hello-World.html
            PdfSharp.Fonts.GlobalFontSettings.FontResolver = new SimpleFontResolver();

            // Create a new PDF document
            var document = new PdfDocument();
            document.Info.Title = $"Invoice {invoice.InvoiceNumber}";
            document.Info.Author = "Invoicing Application";
            document.Info.Subject = "Invoice";
            document.Info.Keywords = "Invoice, Billing";

            // Add a page to the document
            var page = document.AddPage();
            var graphics = XGraphics.FromPdfPage(page);
            var font = new XFont("Arial", 12);
            var boldFont = new XFont("Arial", 12, XFontStyleEx.Bold);
            var titleFont = new XFont("Arial", 20, XFontStyleEx.Bold);
            var headerFont = new XFont("Arial", 14, XFontStyleEx.Bold);

            // Set margins and positions
            double margin = 50;
            double currentY = margin;
            double pageWidth = page.Width.Point;
            
            // Company Information
            graphics.DrawString("Your Company Name", titleFont, XBrushes.DarkBlue, margin, currentY);
            currentY += 30;
            graphics.DrawString("123 Business Street", font, XBrushes.Black, margin, currentY);
            currentY += 15;
            graphics.DrawString("Business City, State 12345", font, XBrushes.Black, margin, currentY);
            currentY += 15;
            graphics.DrawString("Phone: (555) 123-4567", font, XBrushes.Black, margin, currentY);
            currentY += 15;
            graphics.DrawString("Email: billing@yourcompany.com", font, XBrushes.Black, margin, currentY);
            currentY += 30;

            // Invoice Header
            var rect = new XRect(margin, currentY, pageWidth - 2 * margin, 30);
            graphics.DrawRectangle(new XSolidBrush(XColor.FromArgb(220, 230, 240)), rect);
            currentY += 8;
            graphics.DrawString("INVOICE", headerFont, XBrushes.DarkBlue, rect, XStringFormats.Center);
            currentY += 40;

            // Invoice Details
            graphics.DrawString($"Invoice Number:", boldFont, XBrushes.Black, margin, currentY);
            graphics.DrawString(invoice.InvoiceNumber, font, XBrushes.Black, margin + 150, currentY);
            currentY += 20;
            
            graphics.DrawString($"Issue Date:", boldFont, XBrushes.Black, margin, currentY);
            graphics.DrawString(invoice.IssueDate.ToShortDateString(), font, XBrushes.Black, margin + 150, currentY);
            currentY += 20;
            
            graphics.DrawString($"Due Date:", boldFont, XBrushes.Black, margin, currentY);
            graphics.DrawString(invoice.DueDate.ToShortDateString(), font, XBrushes.Black, margin + 150, currentY);
            currentY += 20;

            // Client Information
            graphics.DrawString("Bill To:", headerFont, XBrushes.DarkBlue, margin, currentY);
            currentY += 25;
            graphics.DrawString(invoice.Client.Name, boldFont, XBrushes.Black, margin, currentY);
            currentY += 15;
            if (!string.IsNullOrEmpty(invoice.Client.Address))
            {
                graphics.DrawString(invoice.Client.Address, font, XBrushes.Black, margin, currentY);
                currentY += 15;
            }
            if (!string.IsNullOrEmpty(invoice.Client.Phone))
            {
                graphics.DrawString($"Phone: {invoice.Client.Phone}", font, XBrushes.Black, margin, currentY);
                currentY += 15;
            }
            if (!string.IsNullOrEmpty(invoice.Client.Email))
            {
                graphics.DrawString($"Email: {invoice.Client.Email}", font, XBrushes.Black, margin, currentY);
                currentY += 15;
            }
            currentY += 20;

            // Table Headers
            var columnWidth = (pageWidth - 2 * margin) / 4;
            var tableHeaderY = currentY;
            rect = new XRect(margin, currentY, pageWidth - 2 * margin, 25);
            graphics.DrawRectangle(new XSolidBrush(XColor.FromArgb(220, 230, 240)), rect);
            currentY += 17;
            
            graphics.DrawString("Description", boldFont, XBrushes.Black, margin + 10, currentY);
            graphics.DrawString("Quantity", boldFont, XBrushes.Black, margin + columnWidth + 10, currentY);
            graphics.DrawString("Price", boldFont, XBrushes.Black, margin + columnWidth * 2 + 10, currentY);
            graphics.DrawString("Amount", boldFont, XBrushes.Black, margin + columnWidth * 3 + 10, currentY);
            currentY += 20;

            // Draw item rows
            foreach (var item in invoice.Items)
            {
                var rowHeight = 25;
                rect = new XRect(margin, currentY, pageWidth - 2 * margin, rowHeight);
                graphics.DrawRectangle(XPens.LightGray, rect);
                currentY += 17;
                
                graphics.DrawString(item.Description, font, XBrushes.Black, margin + 10, currentY);
                graphics.DrawString(item.Quantity.ToString(), font, XBrushes.Black, margin + columnWidth + 10, currentY);
                graphics.DrawString($"${item.UnitPrice:0.00}", font, XBrushes.Black, margin + columnWidth * 2 + 10, currentY);
                graphics.DrawString($"${(item.Quantity * item.UnitPrice):0.00}", font, XBrushes.Black, margin + columnWidth * 3 + 10, currentY);
                currentY += rowHeight - 10;
                
                // Check if we need a new page
                if (currentY > page.Height - 100)
                {
                    // Add a new page
                    page = document.AddPage();
                    graphics = XGraphics.FromPdfPage(page);
                    currentY = margin;
                }
            }

            // Draw Summary
            currentY += 20;
            graphics.DrawString("Subtotal:", boldFont, XBrushes.Black, margin + columnWidth * 2, currentY);
            graphics.DrawString($"${invoice.Subtotal:0.00}", font, XBrushes.Black, margin + columnWidth * 3 + 10, currentY);
            currentY += 20;
            
            graphics.DrawString($"Tax ({invoice.TaxRate:0.00}%):", boldFont, XBrushes.Black, margin + columnWidth * 2, currentY);
            graphics.DrawString($"${invoice.TaxAmount:0.00}", font, XBrushes.Black, margin + columnWidth * 3 + 10, currentY);
            currentY += 20;

            // Total
            rect = new XRect(margin + columnWidth * 2 - 10, currentY - 5, columnWidth * 2 + 10, 30);
            graphics.DrawRectangle(new XSolidBrush(XColor.FromArgb(220, 230, 240)), rect);
            currentY += 17;
            graphics.DrawString("TOTAL:", new XFont("Arial", 14, XFontStyleEx.Bold), XBrushes.DarkBlue, 
                margin + columnWidth * 2, currentY);
            graphics.DrawString($"${invoice.TotalAmount:0.00}", new XFont("Arial", 14, XFontStyleEx.Bold), 
                XBrushes.DarkBlue, margin + columnWidth * 3 + 10, currentY);
            currentY += 40;

            // Notes
            if (!string.IsNullOrEmpty(invoice.Notes))
            {
                graphics.DrawString("Notes:", boldFont, XBrushes.Black, margin, currentY);
                currentY += 20;
                graphics.DrawString(invoice.Notes, font, XBrushes.Black, margin, currentY);
            }

            // Save the PDF to a memory stream
            using var stream = new MemoryStream();
            document.Save(stream);
            return Task.FromResult(stream.ToArray());
        }
    }
}
