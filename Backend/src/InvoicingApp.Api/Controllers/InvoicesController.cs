using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.DependencyInjection;

namespace InvoicingApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IEmailService? _emailService;

        public InvoicesController(IInvoiceService invoiceService, IEmailService? emailService = null)
        {
            _invoiceService = invoiceService;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices(
            [FromQuery] int page = 1, 
            [FromQuery] int limit = 10,
            [FromQuery] InvoiceStatus? status = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string search = null,
            [FromQuery] bool includeDrafts = false,
            [FromQuery] string sortField = null,
            [FromQuery] int? sortOrder = null)
        {
            // Get filtered invoices with pagination
            var result = await _invoiceService.GetFilteredInvoicesAsync(
                page, 
                limit, 
                status, 
                startDate, 
                endDate, 
                search, 
                includeDrafts,
                sortField,
                sortOrder);
            
            // Log information about the invoices for debugging
            foreach (var invoice in result.Items)
            {
                Console.WriteLine($"Invoice ID: {invoice.Id}, Number: {invoice.InvoiceNumber}, Status: {invoice.Status}");
            }
            
            // Return the properly structured response with pagination info
            return Ok(new { items = result.Items, total = result.TotalCount });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDto>> GetInvoice(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

            if (invoice == null)
            {
                return NotFound();
            }

            return Ok(invoice);
        }

        [HttpGet("by-client/{clientId}")]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoicesByClient(int clientId)
        {
            var invoices = await _invoiceService.GetInvoicesByClientAsync(clientId);
            return Ok(invoices);
        }

        [HttpGet("by-status/{status}")]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoicesByStatus(InvoiceStatus status)
        {
            var invoices = await _invoiceService.GetInvoicesByStatusAsync(status);
            return Ok(invoices);
        }

        [HttpGet("overdue")]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetOverdueInvoices()
        {
            var invoices = await _invoiceService.GetOverdueInvoicesAsync();
            return Ok(invoices);
        }

        [HttpPost]
        public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceDto invoiceDto)
        {
            try
            {
                var id = await _invoiceService.CreateInvoiceAsync(invoiceDto);
                var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
                
                return CreatedAtAction(nameof(GetInvoice), new { id }, invoice);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(int id, UpdateInvoiceDto invoiceDto)
        {
            if (id != invoiceDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            try
            {
                await _invoiceService.UpdateInvoiceAsync(invoiceDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            return NoContent();
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<InvoiceDto>> UpdateInvoiceStatus(int id, UpdateInvoiceStatusDto statusDto)
        {
            if (id != statusDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            try
            {
                await _invoiceService.UpdateInvoiceStatusAsync(statusDto);
                // Return the updated invoice with full data
                var updatedInvoice = await _invoiceService.GetInvoiceByIdAsync(id);
                return Ok(updatedInvoice);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<InvoiceDto>> PatchInvoiceStatus(int id, [FromBody] UpdateInvoiceStatusDto statusDto)
        {
            try
            {
                // Make sure the ID in the DTO matches the route ID
                statusDto.Id = id;
                
                await _invoiceService.UpdateInvoiceStatusAsync(statusDto);
                
                // Return the updated invoice with full data
                var updatedInvoice = await _invoiceService.GetInvoiceByIdAsync(id);
                return Ok(updatedInvoice);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [HttpPatch("{id}/mark-as-paid")]
        public async Task<ActionResult<InvoiceDto>> MarkAsPaid(int id)
        {
            try
            {
                var statusDto = new UpdateInvoiceStatusDto
                {
                    Id = id,
                    Status = InvoiceStatus.Paid,
                    PaidAt = DateTime.UtcNow
                };
                
                await _invoiceService.UpdateInvoiceStatusAsync(statusDto);
                
                // Return the updated invoice with full data
                var updatedInvoice = await _invoiceService.GetInvoiceByIdAsync(id);
                return Ok(updatedInvoice);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            try
            {
                await _invoiceService.DeleteInvoiceAsync(id);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            return NoContent();
        }

        [HttpGet("generate-number")]
        public async Task<ActionResult<string>> GenerateInvoiceNumber()
        {
            var invoiceNumber = await _invoiceService.GenerateInvoiceNumberAsync();
            return Ok(new { invoiceNumber });
        }

        [HttpPost("drafts")]
        public async Task<ActionResult<InvoiceDto>> SaveDraft(CreateInvoiceDto invoiceDto)
        {
            try
            {
                var draft = await _invoiceService.SaveDraftAsync(invoiceDto);
                if (draft == null)
                {
                    return BadRequest("Failed to save draft");
                }
                
                return CreatedAtAction(nameof(GetDraft), new { id = draft.Id }, draft);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("drafts/{id}")]
        public async Task<ActionResult<InvoiceDto>> GetDraft(int id)
        {
            var draft = await _invoiceService.GetDraftByIdAsync(id);

            if (draft == null)
            {
                return NotFound();
            }

            return Ok(draft);
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GetInvoicePdf(int id)
        {
            try
            {
                var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id);
                var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

                if (invoice == null)
                {
                    return NotFound();
                }

                string fileName = $"Invoice-{invoice.InvoiceNumber}.pdf";
                
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/send")]
        public async Task<IActionResult> SendInvoiceEmail(int id, [FromBody] Models.SendInvoiceEmailRequest request)
        {
            if (string.IsNullOrEmpty(request.RecipientEmail))
            {
                return BadRequest("Email address is required");
            }

            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            
            if (invoice == null)
            {
                return NotFound("Invoice not found");
            }

            try
            {
                // Ensure we have an email service
                var emailService = _emailService ?? HttpContext.RequestServices.GetService<IEmailService>();

                if (emailService == null)
                {
                    // If we still don't have an email service, return an error
                    return StatusCode(500, "Email service is not configured");
                }

                // For debugging
                Console.WriteLine($"Sending invoice {id} to {request.RecipientEmail}");
                
                // Send the email
                var success = await emailService.SendInvoiceEmailAsync(id, request.RecipientEmail);

                if (success)
                {
                // Update invoice status only if it's a draft
                // We don't modify the status of Pending, Paid, or Cancelled invoices
                if (invoice.Status == Core.Enums.InvoiceStatus.Draft)
                {
                    var updateStatusDto = new UpdateInvoiceStatusDto
                    {
                        Id = id,
                        Status = Core.Enums.InvoiceStatus.Pending
                    };
                    
                    await _invoiceService.UpdateInvoiceStatusAsync(updateStatusDto);
                }                    return Ok(new { message = "Email sent successfully" });
                }
                else
                {
                    return StatusCode(500, "Failed to send email");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
} 