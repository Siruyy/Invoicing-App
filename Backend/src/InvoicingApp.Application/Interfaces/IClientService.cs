using InvoicingApp.Application.DTOs;

namespace InvoicingApp.Application.Interfaces
{
    public interface IClientService
    {
        Task<IEnumerable<ClientDto>> GetAllClientsAsync();
        Task<ClientDto?> GetClientByIdAsync(int id);
        Task<ClientDto?> GetClientWithInvoicesAsync(int id);
        Task<int> CreateClientAsync(CreateClientDto clientDto);
        Task UpdateClientAsync(UpdateClientDto clientDto);
        Task DeleteClientAsync(int id);
    }
} 