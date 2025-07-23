using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InvoicingApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;

        public ClientsController(IClientService clientService)
        {
            _clientService = clientService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClientDto>>> GetClients()
        {
            var clients = await _clientService.GetAllClientsAsync();
            return Ok(clients);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ClientDto>> GetClient(int id)
        {
            var client = await _clientService.GetClientByIdAsync(id);

            if (client == null)
            {
                return NotFound();
            }

            return Ok(client);
        }

        [HttpGet("{id}/with-invoices")]
        public async Task<ActionResult<ClientDto>> GetClientWithInvoices(int id)
        {
            var client = await _clientService.GetClientWithInvoicesAsync(id);

            if (client == null)
            {
                return NotFound();
            }

            return Ok(client);
        }

        [HttpPost]
        public async Task<ActionResult<ClientDto>> CreateClient(CreateClientDto clientDto)
        {
            var id = await _clientService.CreateClientAsync(clientDto);
            var client = await _clientService.GetClientByIdAsync(id);
            
            return CreatedAtAction(nameof(GetClient), new { id }, client);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(int id, UpdateClientDto clientDto)
        {
            if (id != clientDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            try
            {
                await _clientService.UpdateClientAsync(clientDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            try
            {
                await _clientService.DeleteClientAsync(id);
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
    }
} 