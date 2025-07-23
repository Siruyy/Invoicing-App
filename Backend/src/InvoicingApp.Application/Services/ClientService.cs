using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Application.Mapping;
using InvoicingApp.Core.Interfaces;

namespace InvoicingApp.Application.Services
{
    public class ClientService : IClientService
    {
        private readonly IClientRepository _clientRepository;

        public ClientService(IClientRepository clientRepository)
        {
            _clientRepository = clientRepository;
        }

        public async Task<IEnumerable<ClientDto>> GetAllClientsAsync()
        {
            var clients = await _clientRepository.GetAllAsync();
            return clients.Select(c => c.ToDto());
        }

        public async Task<ClientDto?> GetClientByIdAsync(int id)
        {
            var client = await _clientRepository.GetByIdAsync(id);
            return client?.ToDto();
        }

        public async Task<ClientDto?> GetClientWithInvoicesAsync(int id)
        {
            var client = await _clientRepository.GetClientWithInvoicesAsync(id);
            return client?.ToDto();
        }

        public async Task<int> CreateClientAsync(CreateClientDto clientDto)
        {
            var client = clientDto.ToEntity();
            await _clientRepository.AddAsync(client);
            await _clientRepository.SaveChangesAsync();

            return client.Id;
        }

        public async Task UpdateClientAsync(UpdateClientDto clientDto)
        {
            var client = await _clientRepository.GetByIdAsync(clientDto.Id);
            
            if (client == null)
            {
                throw new KeyNotFoundException($"Client with ID {clientDto.Id} not found.");
            }

            client.UpdateFromDto(clientDto);
            await _clientRepository.UpdateAsync(client);
            await _clientRepository.SaveChangesAsync();
        }

        public async Task DeleteClientAsync(int id)
        {
            var client = await _clientRepository.GetByIdAsync(id);
            
            if (client == null)
            {
                throw new KeyNotFoundException($"Client with ID {id} not found.");
            }

            // Check if client has any invoices
            var clientWithInvoices = await _clientRepository.GetClientWithInvoicesAsync(id);
            if (clientWithInvoices?.Invoices?.Any() == true)
            {
                throw new InvalidOperationException($"Cannot delete client with ID {id} because they have associated invoices.");
            }

            await _clientRepository.RemoveAsync(client);
            await _clientRepository.SaveChangesAsync();
        }
    }
} 