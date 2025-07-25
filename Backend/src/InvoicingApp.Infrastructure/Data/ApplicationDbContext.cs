using InvoicingApp.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace InvoicingApp.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Client> Clients { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<InvoiceItem> InvoiceItems { get; set; } = null!;
        public DbSet<AiChatMessage> AiChatMessages { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Client configuration
            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                
                // Optional fields with explicit nullability
                entity.Property(e => e.Phone).HasMaxLength(20).IsRequired(false);
                entity.Property(e => e.Address).HasMaxLength(200).IsRequired(false);
                entity.Property(e => e.City).HasMaxLength(100).IsRequired(false);
                entity.Property(e => e.State).HasMaxLength(50).IsRequired(false);
                entity.Property(e => e.ZipCode).HasMaxLength(20).IsRequired(false);
                entity.Property(e => e.Country).HasMaxLength(50).IsRequired(false);
                
                // New properties - with explicit column name mapping and nullability
                entity.Property(e => e.CompanyName)
                    .HasColumnName("CompanyName")
                    .HasMaxLength(100)
                    .IsRequired(false);
                entity.Property(e => e.ContactPerson)
                    .HasColumnName("ContactPerson")
                    .HasMaxLength(100)
                    .IsRequired(false);
                entity.Property(e => e.TaxNumber)
                    .HasColumnName("TaxNumber")
                    .HasMaxLength(50)
                    .IsRequired(false);
                entity.Property(e => e.Notes)
                    .HasColumnName("Notes")
                    .IsRequired(false);
            });

            // Invoice configuration
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TaxRate).HasColumnType("decimal(5,2)");
                entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Notes).HasMaxLength(500);

                // Relationships
                entity.HasOne(e => e.Client)
                    .WithMany(c => c.Invoices)
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // InvoiceItem configuration
            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

                // Relationships
                entity.HasOne(e => e.Invoice)
                    .WithMany(i => i.Items)
                    .HasForeignKey(e => e.InvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // AiChatMessage configuration
            modelBuilder.Entity<AiChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Content).IsRequired();
                entity.Property(e => e.IsUserMessage).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                
                entity.HasIndex(e => e.UserId); // Index for faster queries by user
            });
            
            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Salt).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.LastLoginAt).IsRequired(false);
                
                entity.HasIndex(e => e.Username).IsUnique(); // Ensure unique usernames
            });
        }
    }
} 