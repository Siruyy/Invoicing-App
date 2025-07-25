using InvoicingApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvoicingApp.Infrastructure.Persistence.Configurations
{
    public class ClientConfiguration : IEntityTypeConfiguration<Client>
    {
        public void Configure(EntityTypeBuilder<Client> builder)
        {
            builder.Property(c => c.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(c => c.Email)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(c => c.Phone)
                .HasMaxLength(20);

            builder.Property(c => c.Address)
                .HasMaxLength(200);

            builder.Property(c => c.City)
                .HasMaxLength(100);

            builder.Property(c => c.State)
                .HasMaxLength(50);

            builder.Property(c => c.ZipCode)
                .HasMaxLength(20);

            builder.Property(c => c.Country)
                .HasMaxLength(50);
                
            // Configure new properties
            builder.Property(c => c.CompanyName)
                .HasMaxLength(100);
                
            builder.Property(c => c.ContactPerson)
                .HasMaxLength(100);
                
            builder.Property(c => c.TaxNumber)
                .HasMaxLength(50);
                
            builder.Property(c => c.Notes);
        }
    }
}
