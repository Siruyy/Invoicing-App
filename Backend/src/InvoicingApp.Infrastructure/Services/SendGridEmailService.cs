using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.IO;
using System.Threading.Tasks;

namespace InvoicingApp.Infrastructure.Services
{
    public class SendGridEmailService : IEmailService
    {
        private readonly ISendGridClient _client;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<SendGridEmailService> _logger;
        private readonly string _senderEmail;
        private readonly string _senderName;

        public SendGridEmailService(
            IConfiguration configuration, 
            ISendGridClient client, 
            IInvoiceService invoiceService,
            ILogger<SendGridEmailService> logger)
        {
            _client = client;
            _invoiceService = invoiceService;
            _logger = logger;
            _senderEmail = configuration["SendGrid:SenderEmail"] ?? "no-reply@yourdomain.com";
            _senderName = configuration["SendGrid:SenderName"] ?? "Invoicing Application";
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent, byte[]? attachment = null, string? attachmentName = null)
        {
            try
            {
                _logger.LogInformation("Preparing email to: {To}, subject: {Subject}", to, subject);
                
                var message = new SendGridMessage
                {
                    From = new EmailAddress(_senderEmail, _senderName),
                    Subject = subject,
                    HtmlContent = htmlContent
                };

                message.AddTo(new EmailAddress(to));

                if (attachment != null && attachmentName != null)
                {
                    var attachmentContent = Convert.ToBase64String(attachment);
                    message.AddAttachment(attachmentName, attachmentContent);
                    _logger.LogInformation("Added attachment: {AttachmentName}, size: {Size} bytes", attachmentName, attachment.Length);
                }

                _logger.LogInformation("Sending email via SendGrid");
                var response = await _client.SendEmailAsync(message);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {To}", to);
                    return true;
                }
                else
                {
                    var responseBody = await response.Body.ReadAsStringAsync();
                    _logger.LogError("SendGrid API returned error: Status {StatusCode}, Body: {ResponseBody}", 
                        response.StatusCode, responseBody);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {To}: {ErrorMessage}", to, ex.Message);
                return false;
            }
        }

        public async Task<bool> SendInvoiceEmailAsync(int invoiceId, string recipientEmail)
        {
            try
            {
                _logger.LogInformation("Starting to send invoice email for invoice ID {InvoiceId} to {RecipientEmail}", invoiceId, recipientEmail);
                
                // Get the invoice
                _logger.LogInformation("Retrieving invoice data for ID {InvoiceId}", invoiceId);
                var invoice = await _invoiceService.GetInvoiceByIdAsync(invoiceId);
                
                if (invoice == null)
                {
                    _logger.LogError("Invoice not found with ID {InvoiceId}", invoiceId);
                    return false;
                }
                
                // Generate the PDF for attachment
                _logger.LogInformation("Generating PDF for invoice {InvoiceId}", invoiceId);
                byte[] pdfBytes;
                
                try 
                {
                    // Use our invoice service to generate the PDF
                    pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(invoiceId);
                    _logger.LogInformation("Successfully generated PDF, size: {Size} bytes", pdfBytes.Length);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to generate PDF for invoice {InvoiceId}: {Message}", invoiceId, ex.Message);
                    return false;
                }
                
                string clientName = invoice.Client?.Name ?? "Valued Client";
                
                string htmlContent = $@"
                <html>
                <body>
                    <p>Dear {clientName},</p>
                    <p>Thank you for your business! Please find your invoice #{invoice.InvoiceNumber} attached to this email.</p>
                    <p>Invoice Amount: ${invoice.TotalAmount:N2}</p>
                    <p>Due Date: {invoice.DueDate:d}</p>
                    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                    <p>Best regards,<br/>{_senderName}</p>
                </body>
                </html>";

                _logger.LogInformation("Sending email to {RecipientEmail} with PDF attachment", recipientEmail);
                
                // Send with the attachment
                return await SendEmailAsync(
                    recipientEmail,
                    $"Invoice #{invoice.InvoiceNumber}",
                    htmlContent,
                    pdfBytes,
                    $"Invoice-{invoice.InvoiceNumber}.pdf"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending invoice email for invoice ID {InvoiceId} to {RecipientEmail}", invoiceId, recipientEmail);
                return false;
            }
        }
    }
}
