using InvoicingApp.Application.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace InvoicingApp.Infrastructure.Services
{
    /// <summary>
    /// Mock email service that logs emails instead of actually sending them.
    /// Use this for development and testing.
    /// </summary>
    public class MockEmailService : IEmailService
    {
        private readonly ILogger<MockEmailService> _logger;

        public MockEmailService(ILogger<MockEmailService> logger)
        {
            _logger = logger;
        }

        public Task<bool> SendEmailAsync(string to, string subject, string htmlContent, byte[]? attachment = null, string? attachmentName = null)
        {
            _logger.LogInformation("MOCK EMAIL: To: {To}, Subject: {Subject}", to, subject);
            _logger.LogInformation("MOCK EMAIL: Content: {Content}", htmlContent);
            if (attachment != null)
            {
                _logger.LogInformation("MOCK EMAIL: Attachment: {Name}, Size: {Size} bytes", attachmentName, attachment.Length);
            }
            
            // Always return success since we're just logging
            return Task.FromResult(true);
        }

        public async Task<bool> SendInvoiceEmailAsync(int invoiceId, string recipientEmail)
        {
            _logger.LogInformation("MOCK EMAIL: Sending invoice {InvoiceId} to {Email}", invoiceId, recipientEmail);
            
            // We would normally get invoice details and generate a PDF here,
            // but since this is a mock, we'll just log and return success
            return true;
        }
    }
}
