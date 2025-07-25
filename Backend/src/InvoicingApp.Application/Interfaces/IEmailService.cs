using System.Threading.Tasks;

namespace InvoicingApp.Application.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string htmlContent, byte[]? attachment = null, string? attachmentName = null);
        Task<bool> SendInvoiceEmailAsync(int invoiceId, string recipientEmail);
    }
}
