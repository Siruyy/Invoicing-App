using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Infrastructure.Data;
using InvoicingApp.Infrastructure.Repositories;
using InvoicingApp.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SendGrid;
using System;

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
            
            // Register PDF Service
            services.AddScoped<IPdfService, Application.Services.PdfService>();
            
            // Register SendGrid Email Service
            var sendGridApiKey = configuration["SendGrid:ApiKey"];
            if (!string.IsNullOrEmpty(sendGridApiKey))
            {
                Console.WriteLine("Configuring SendGrid email service");
                services.AddScoped<ISendGridClient>(sp => new SendGridClient(sendGridApiKey));
                services.AddScoped<IEmailService, SendGridEmailService>();
            }
            else
            {
                // Log a warning if no API key is found
                Console.WriteLine("WARNING: No SendGrid API key found. Email functionality will not work correctly.");
                throw new Exception("SendGrid API key is missing in configuration. Please check appsettings.json");
            }

            return services;
        }
    }
} 