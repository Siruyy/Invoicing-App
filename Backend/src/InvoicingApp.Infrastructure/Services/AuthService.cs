using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace InvoicingApp.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtTokenService _jwtTokenService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            JwtTokenService jwtTokenService,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _jwtTokenService = jwtTokenService;
            _logger = logger;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userRepository.GetByUsernameAsync(loginRequest.Username);
            
            if (user == null)
            {
                _logger.LogWarning("Login attempt with invalid username: {Username}", loginRequest.Username);
                return null;
            }

            if (!PasswordHasher.VerifyPasswordHash(loginRequest.Password, user.PasswordHash, user.Salt))
            {
                _logger.LogWarning("Login attempt with invalid password for user: {Username}", loginRequest.Username);
                return null;
            }

            // Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            
            // Generate JWT token
            var (token, expiration) = _jwtTokenService.GenerateJwtToken(user);

            return new LoginResponseDto
            {
                Token = token,
                Username = user.Username,
                Expiration = expiration
            };
        }

        public async Task<bool> SeedAdminUserAsync()
        {
            if (await _userRepository.AnyUsersExistAsync())
            {
                // Users already exist, no need to seed
                return false;
            }

            try
            {
                // Create default admin user
                PasswordHasher.CreatePasswordHash("admin", out string passwordHash, out string salt);
                
                var adminUser = new User
                {
                    Username = "admin",
                    PasswordHash = passwordHash,
                    Salt = salt,
                    CreatedAt = DateTime.UtcNow
                };

                await _userRepository.CreateUserAsync(adminUser);
                _logger.LogInformation("Default admin user created successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating default admin user");
                return false;
            }
        }
    }
}
