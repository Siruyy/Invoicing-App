using InvoicingApp.Application.Interfaces;
using InvoicingApp.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace InvoicingApp.Application.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IClientService, ClientService>();
            services.AddScoped<IInvoiceService, InvoiceService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IPdfService, QuestPdfService>();
            services.AddScoped<IAiDataFetchService, AiDataFetchService>();

            return services;
        }
    }
} 