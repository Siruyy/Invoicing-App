using InvoicingApp.Application.DTOs;
using System.Threading.Tasks;

namespace InvoicingApp.Application.Interfaces
{
    public interface IPdfService
    {
        Task<byte[]> GenerateInvoicePdfAsync(InvoiceDto invoice);
    }
}
