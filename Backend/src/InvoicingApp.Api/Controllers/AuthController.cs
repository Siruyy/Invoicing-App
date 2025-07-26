using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace InvoicingApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.LoginAsync(loginRequest);
            
            if (response == null)
            {
                _logger.LogWarning("Failed login attempt for username: {Username}", loginRequest.Username);
                return Unauthorized(new { message = "Invalid username or password" });
            }

            _logger.LogInformation("User logged in: {Username}", loginRequest.Username);
            return Ok(response);
        }
        
        [HttpGet("seed-admin")]
        public async Task<IActionResult> SeedAdmin()
        {
            // This endpoint is only for development/testing
            if (!HttpContext.Request.Host.Host.Contains("localhost") && 
                !HttpContext.Request.Host.Host.Contains("127.0.0.1"))
            {
                return NotFound();
            }
            
            var result = await _authService.SeedAdminUserAsync();
            
            if (result)
            {
                return Ok(new { message = "Admin user created successfully" });
            }
            
            return Ok(new { message = "Admin user already exists" });
        }
    }
}
