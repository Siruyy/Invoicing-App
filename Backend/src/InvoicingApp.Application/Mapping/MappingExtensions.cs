using InvoicingApp.Application.DTOs;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Enums;

namespace InvoicingApp.Application.Mapping
{
    public static class MappingExtensions
    {
        // Client Mapping
        public static ClientDto ToDto(this Client entity)
        {
            return new ClientDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Email = entity.Email,
                Phone = entity.Phone,
                Address = entity.Address,
                City = entity.City,
                State = entity.State,
                ZipCode = entity.ZipCode,
                Country = entity.Country
            };
        }

        public static Client ToEntity(this CreateClientDto dto)
        {
            return new Client
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                Country = dto.Country,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static void UpdateFromDto(this Client entity, UpdateClientDto dto)
        {
            entity.Name = dto.Name;
            entity.Email = dto.Email;
            entity.Phone = dto.Phone;
            entity.Address = dto.Address;
            entity.City = dto.City;
            entity.State = dto.State;
            entity.ZipCode = dto.ZipCode;
            entity.Country = dto.Country;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        // Invoice Mapping
        public static InvoiceDto ToDto(this Invoice entity)
        {
            return new InvoiceDto
            {
                Id = entity.Id,
                InvoiceNumber = entity.InvoiceNumber,
                ClientId = entity.ClientId,
                Client = entity.Client?.ToDto(),
                IssueDate = entity.IssueDate,
                DueDate = entity.DueDate,
                Subtotal = entity.Subtotal,
                TaxRate = entity.TaxRate,
                TaxAmount = entity.TaxAmount,
                TotalAmount = entity.TotalAmount,
                Notes = entity.Notes,
                Status = entity.Status,
                Items = entity.Items?.Select(item => item.ToDto()).ToList() ?? new List<InvoiceItemDto>()
            };
        }

        public static Invoice ToEntity(this CreateInvoiceDto dto)
        {
            var invoice = new Invoice
            {
                ClientId = dto.ClientId,
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                TaxRate = dto.TaxRate,
                Notes = dto.Notes,
                Status = InvoiceStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                Items = dto.Items.Select(item => item.ToEntity()).ToList()
            };

            // Calculate totals
            invoice.Subtotal = invoice.Items.Sum(item => item.TotalPrice);
            invoice.TaxAmount = invoice.Subtotal * (invoice.TaxRate / 100);
            invoice.TotalAmount = invoice.Subtotal + invoice.TaxAmount;

            return invoice;
        }

        // InvoiceItem Mapping
        public static InvoiceItemDto ToDto(this InvoiceItem entity)
        {
            return new InvoiceItemDto
            {
                Id = entity.Id,
                InvoiceId = entity.InvoiceId,
                Description = entity.Description,
                Quantity = entity.Quantity,
                UnitPrice = entity.UnitPrice,
                TotalPrice = entity.TotalPrice
            };
        }

        public static InvoiceItem ToEntity(this CreateInvoiceItemDto dto)
        {
            return new InvoiceItem
            {
                Description = dto.Description,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                TotalPrice = dto.Quantity * dto.UnitPrice
            };
        }
    }
} 