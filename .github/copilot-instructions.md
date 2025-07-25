# Invoicing Application - AI Assistant Guidelines

## Project Architecture

This is a full-stack Invoicing Application with a Clean Architecture approach:

### Backend (.NET)
- **InvoicingApp.Core**: Domain entities and interfaces (`Client`, `Invoice`, `InvoiceItem`, etc.)
- **InvoicingApp.Application**: Application services, DTOs, and business logic
- **InvoicingApp.Infrastructure**: Data access with EF Core, external services integration
- **InvoicingApp.Api**: REST API controllers and endpoints

### Frontend (Angular)
- **Core Module**: Models, services, state management with NgRx
- **Shared Module**: Reusable components, directives, pipes
- **Feature Modules**: Dashboard, Clients, Invoices (lazy-loaded)
- **Layout Components**: Header, sidebar, footer

## Key Development Workflows

### Backend
```bash
# Start API (from Backend/src/InvoicingApp.Api directory)
dotnet run

# Run tests (from Backend directory)
dotnet test

# Create new migration (from Infrastructure project)
dotnet ef migrations add MigrationName --startup-project ../InvoicingApp.Api
```

### Frontend
```bash
# Start development server (from Frontend/invoicing-frontend)
npm run start

# Build production version
npm run build

# Run tests
npm run test
```

## Project Conventions

### Backend
- **Repository Pattern**: All data access through repositories defined in `IRepository<T>` interface
- **Service Layer**: Business logic in services implementing interfaces from Core project
- **DTOs**: Transfer objects in Application project with mapping handled by `MappingExtensions`
- **CQRS Pattern**: For complex operations, implement Command/Query separation

### Frontend
- **Component Structure**: Separate component files into `.component.ts`, `.component.html`, `.component.scss`
- **State Management**: Use NgRx for application state with actions, reducers, selectors, effects
- **Reactive Forms**: All forms use reactive approach with validators
- **Dark Mode**: Toggle theme with theme service (already implemented)
- **Responsive Design**: Mobile-first approach with Tailwind's responsive classes

## Data Flow
1. User interacts with Angular component
2. Component dispatches NgRx action
3. NgRx effect calls API service
4. API service makes HTTP request to .NET API
5. API controller invokes application service
6. Service executes business logic via repositories
7. Repository performs database operations
8. Data flows back through the chain with DTOs

## Implementation Status

### Completed Features
- **Client Management**: Full CRUD operations for clients are implemented
- **Invoice Management**: Complete invoice creation, editing, and status management
- **Autosave Functionality**: Draft saving and resuming is fully implemented
- **Dashboard**: KPI cards and metrics visualization are complete
- **Dark Mode**: Theme switching functionality is implemented

### Implementation Notes

### Invoice Status Logic
- Overdue logic is in `InvoiceService.GetOverdueInvoices()`
- Status enum defined in `InvoiceStatus.cs`
- Visual indicators implemented in frontend list components

### Autosave Implementation
- Draft invoices stored in database with draft flag
- Frontend uses local storage as interim backup during form completion

### Dashboard Metrics
- Dashboard calculations in `DashboardService.cs`
- Charts/KPI cards using PrimeNG components

## Future Integration Points
- **OpenAI API**: Will be integrated for natural language queries (not yet implemented)
- **PDF Generation**: Planned for invoice export (not yet implemented)
- **Email Service**: Will use SendGrid for sending invoices (not yet implemented)
- **Authentication**: Basic authentication with default credentials (not yet implemented)
- **Multi-Currency Support**: Currency selection and exchange rates (not yet implemented)

## Critical Files to Understand
- `InvoicingApp.Core/Entities/Invoice.cs`: Core domain model
- `InvoicingApp.Application/Services/InvoiceService.cs`: Main business logic
- `InvoicingApp.Api/Controllers/InvoicesController.cs`: API endpoints
- `Frontend/invoicing-frontend/src/app/features/invoices/invoice.service.ts`: Frontend API service
- `Frontend/invoicing-frontend/src/app/features/invoices/store/invoice.effects.ts`: NgRx effects
