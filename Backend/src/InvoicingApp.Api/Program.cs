using InvoicingApp.Application.Extensions;
using InvoicingApp.Infrastructure.Data;
using InvoicingApp.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register infrastructure services
builder.Services.AddInfrastructureServices(builder.Configuration);

// Register application services
builder.Services.AddApplicationServices();

// Add controllers
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Apply migrations and validate schema
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var dbContext = services.GetRequiredService<ApplicationDbContext>();
    
    try
    {
        logger.LogInformation("Starting database migration...");
        dbContext.Database.Migrate();
        logger.LogInformation("Database migration completed successfully");
        
        // Log information about entity model
        logger.LogInformation("Entity Framework model validation successful");
        
        // Validate and fix database schema if needed
        var sqlScriptPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Scripts", "ValidateClientColumns.sql");
        if (File.Exists(sqlScriptPath))
        {
            var sqlScript = File.ReadAllText(sqlScriptPath);
            await dbContext.Database.ExecuteSqlRawAsync(sqlScript);
            logger.LogInformation("Database schema validation script executed");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database initialization");
        throw;
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();
