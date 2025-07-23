using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Enums;
using Microsoft.AspNetCore.Mvc;

namespace InvoicingApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;

        public InvoicesController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices()
        {
            var invoices = await _invoiceService.GetAllInvoicesAsync();
            return Ok(invoices);
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
        public async Task<IActionResult> UpdateInvoiceStatus(int id, UpdateInvoiceStatusDto statusDto)
        {
            if (id != statusDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            try
            {
                await _invoiceService.UpdateInvoiceStatusAsync(statusDto);
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
            return Ok(invoiceNumber);
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
    }
} 