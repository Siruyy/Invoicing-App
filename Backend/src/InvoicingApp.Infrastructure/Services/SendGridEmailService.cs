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
        private readonly IPdfService _pdfService;
        private readonly ILogger<SendGridEmailService> _logger;
        private readonly string _senderEmail;
        private readonly string _senderName;

        public SendGridEmailService(
            IConfiguration configuration, 
            ISendGridClient client, 
            IPdfService pdfService,
            ILogger<SendGridEmailService> logger)
        {
            _client = client;
            _pdfService = pdfService;
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
                
                // Get the invoice details from the controller instead
                // The controller will use IInvoiceService to get the data and pass it to us
                
                // We need to receive both the invoice details and the PDF data
                // To break the circular dependency, we'll get the invoice details from the controller
                // and receive them here via parameters
                
                // For now, we'll create a simple email without attachments
                // In a complete implementation, we would get invoice details and generate
                // a more detailed email with attachments
                
                string htmlContent = $@"
                <html>
                <body>
                    <p>Dear Valued Client,</p>
                    <p>Please find attached invoice for your recent services.</p>
                    <p>Thank you for your business!</p>
                    <p>Regards,<br/>Your Company Name</p>
                </body>
                </html>";

                // Send the email without attachments for now
                _logger.LogInformation("Sending email to {RecipientEmail}", recipientEmail);
                
                return await SendEmailAsync(
                    recipientEmail,
                    $"Invoice #{invoiceId}",
                    htmlContent
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
