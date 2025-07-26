using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Application.Mapping;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Interfaces;
using System.Text;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using System.Runtime.CompilerServices;

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
        
        // CSV Client record class for CsvHelper
        private class ClientCsvRecord
        {
            public string Name { get; set; } = "";
            public string Email { get; set; } = "";
            public string Phone { get; set; } = "";
            public string Address { get; set; } = "";
            public string City { get; set; } = "";
            public string State { get; set; } = "";
            public string ZipCode { get; set; } = "";
            public string Country { get; set; } = "";
            public string CompanyName { get; set; } = "";
            public string ContactPerson { get; set; } = "";
            public string TaxNumber { get; set; } = "";
            public string Notes { get; set; } = "";
        }
        
        public async Task<byte[]> ExportClientsToCsvAsync(IEnumerable<int> clientIds)
        {
            try
            {
                // Get clients data
                List<Client> clientsList = new List<Client>();
                
                if (clientIds != null && clientIds.Any())
                {
                    // Get specific clients by IDs
                    foreach (var id in clientIds)
                    {
                        var client = await _clientRepository.GetByIdAsync(id);
                        if (client != null)
                        {
                            clientsList.Add(client);
                        }
                    }
                }
                else
                {
                    // Get all clients
                    var allClients = await _clientRepository.GetAllAsync();
                    clientsList.AddRange(allClients);
                }
                
                // Convert domain entities to CSV records
                var records = clientsList.Select(c => new ClientCsvRecord
                {
                    Name = c.Name ?? "",
                    Email = c.Email ?? "",
                    Phone = c.Phone ?? "",
                    Address = c.Address ?? "",
                    City = c.City ?? "",
                    State = c.State ?? "",
                    ZipCode = c.ZipCode ?? "",
                    Country = c.Country ?? "",
                    CompanyName = c.CompanyName ?? "",
                    ContactPerson = c.ContactPerson ?? "",
                    TaxNumber = c.TaxNumber ?? "",
                    Notes = c.Notes ?? ""
                }).ToList();
                
                // Use CsvHelper to generate the CSV
                using (var memoryStream = new MemoryStream())
                using (var writer = new StreamWriter(memoryStream, Encoding.UTF8))
                using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                {
                    // Write records
                    await csv.WriteRecordsAsync(records);
                    await writer.FlushAsync();
                    
                    // Return the CSV as byte array
                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"CSV Export Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // For any error, return a simple CSV with error details
                using (var memoryStream = new MemoryStream())
                using (var writer = new StreamWriter(memoryStream, Encoding.UTF8))
                using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                {
                    // Create a simple error record
                    var errorRecord = new[]
                    {
                        new { Error = "Export Error", Message = ex.Message }
                    };
                    
                    await csv.WriteRecordsAsync(errorRecord);
                    await writer.FlushAsync();
                    
                    return memoryStream.ToArray();
                }
            }
        }
        
        public async Task<int> ImportClientsFromCsvAsync(Stream csvStream)
        {
            int importCount = 0;
            
            try
            {
                using (var reader = new StreamReader(csvStream))
                using (var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HeaderValidated = null,  // Don't throw if headers don't match
                    MissingFieldFound = null // Don't throw if fields are missing
                }))
                {
                    // Read all records from CSV
                    var recordsEnumerable = csv.GetRecordsAsync<ClientCsvRecord>();
                    
                    // Process each record
                    await foreach (var record in recordsEnumerable)
                    {
                        // Skip rows without required fields
                        if (string.IsNullOrWhiteSpace(record.Name) || string.IsNullOrWhiteSpace(record.Email))
                        {
                            continue;
                        }
                        
                        // Create client DTO from CSV record
                        var clientDto = new CreateClientDto
                        {
                            Name = record.Name,
                            Email = record.Email,
                            Phone = record.Phone,
                            Address = record.Address,
                            City = record.City,
                            State = record.State,
                            ZipCode = record.ZipCode,
                            Country = record.Country,
                            CompanyName = record.CompanyName,
                            ContactPerson = record.ContactPerson,
                            TaxNumber = record.TaxNumber,
                            Notes = record.Notes
                        };
                        
                        // Save client to database
                        await CreateClientAsync(clientDto);
                        importCount++;
                    }
                }
                
                return importCount;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CSV Import Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new InvalidOperationException($"Failed to import CSV: {ex.Message}", ex);
            }
        }
    }
} 