using InvoicingApp.Core.Interfaces;
using InvoicingApp.Infrastructure.Data;
using InvoicingApp.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace InvoicingApp.Infrastructure.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            // Register repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IClientRepository, ClientRepository>();
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();

            return services;
        }
    }
} 