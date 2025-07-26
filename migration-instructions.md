# Migration Script for AI Chat Message

This document contains instructions for creating and applying the database migration for the AI Chat feature.

## Step 1: Create Migration

Run the following command from the InvoicingApp.Api project directory:

```bash
dotnet ef migrations add AddAiChatMessages -p ../InvoicingApp.Infrastructure/MigrationHelper.csproj
```

## Step 2: Apply Migration

After creating the migration, apply it to the database:

```bash
dotnet ef database update -p ../InvoicingApp.Infrastructure/MigrationHelper.csproj
```

## Alternative: Use Package Manager Console in Visual Studio

If using Visual Studio, you can use the Package Manager Console with these commands:

```powershell
Add-Migration AddAiChatMessages -Project InvoicingApp.Infrastructure
Update-Database
```
