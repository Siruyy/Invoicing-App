using System;
using System.Threading.Tasks;
using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace InvoicingApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiQueryController : ControllerBase
    {
        private readonly IAiQueryService _aiQueryService;
        private readonly ILogger<AiQueryController> _logger;

        public AiQueryController(
            IAiQueryService aiQueryService,
            ILogger<AiQueryController> logger)
        {
            _aiQueryService = aiQueryService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> ProcessQuery([FromBody] AiQueryRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest("Query cannot be empty");
            }

            try
            {
                // For now, use a temporary user ID until authentication is implemented
                var userId = request.UserId ?? "default-user";
                
                var response = await _aiQueryService.ProcessQueryAsync(request.Query, userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI query");
                return StatusCode(500, "An error occurred while processing your query");
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetChatHistory([FromQuery] string userId, [FromQuery] int limit = 50)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                // For now, use a default user ID until authentication is implemented
                userId = "default-user";
            }

            try
            {
                var history = await _aiQueryService.GetChatHistoryAsync(userId, limit);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chat history");
                return StatusCode(500, "An error occurred while retrieving chat history");
            }
        }

        [HttpDelete("history")]
        public async Task<IActionResult> ClearChatHistory([FromQuery] string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                // For now, use a default user ID until authentication is implemented
                userId = "default-user";
            }

            try
            {
                var success = await _aiQueryService.ClearChatHistoryAsync(userId);
                return success ? Ok(new { message = "Chat history cleared" }) : BadRequest("Failed to clear chat history");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing chat history");
                return StatusCode(500, "An error occurred while clearing chat history");
            }
        }
    }
}
