using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Core.Settings;
using InvoicingApp.Infrastructure.Data;
using InvoicingApp.Infrastructure.Repositories;
using InvoicingApp.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SendGrid;
using System;
using System.Net.Http;
using System.Text;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace InvoicingApp.Infrastructure.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IClientRepository, ClientRepository>();
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            
            // Register Auth Services
            // Configure JWT Settings
            var jwtSettings = new JwtSettings
            {
                Secret = configuration["JwtSettings:Secret"] ?? "YOUR_SUPER_SECRET_KEY_WITH_AT_LEAST_32_CHARACTERS",
                Issuer = configuration["JwtSettings:Issuer"] ?? "InvoicingApp",
                Audience = configuration["JwtSettings:Audience"] ?? "InvoicingAppClient",
                ExpiryMinutes = int.Parse(configuration["JwtSettings:ExpiryMinutes"] ?? "60")
            };
            
            services.AddSingleton(jwtSettings);
            services.AddScoped<JwtTokenService>();
            services.AddScoped<IAuthService, AuthService>();
            
            // Register PDF Service
            services.AddScoped<IPdfService, Application.Services.QuestPdfService>();
            
            // Register Email Service
            var sendGridApiKey = configuration["SendGrid:ApiKey"];
            if (string.IsNullOrEmpty(sendGridApiKey))
            {
                throw new InvalidOperationException("SendGrid API key is not configured in appsettings.json. Please add a valid API key under 'SendGrid:ApiKey'.");
            }
            
            Console.WriteLine("Configuring SendGrid email service");
            services.AddScoped<ISendGridClient>(sp => new SendGridClient(sendGridApiKey));
            services.AddScoped<IEmailService, SendGridEmailService>();
            
            // Register AI Query Services
            services.AddScoped<IAiChatRepository, AiChatRepository>();
            
            // Register HttpClient factory manually
            services.AddSingleton<HttpClient>();
            
            services.AddScoped<IAiQueryService, OpenAiQueryService>();
            
            // Configure OpenAI Settings
            var openAiSettings = new OpenAiSettings
            {
                ApiKey = configuration["OpenAi:ApiKey"] ?? "your-api-key-placeholder",
                Model = configuration["OpenAi:Model"] ?? "gpt-4o-mini",
                Temperature = float.TryParse(configuration["OpenAi:Temperature"], out float temp) ? temp : 0.7f,
                MaxTokens = int.TryParse(configuration["OpenAi:MaxTokens"], out int tokens) ? tokens : 1000
            };
            services.AddSingleton(Options.Create(openAiSettings));

            return services;
        }
    }
} 