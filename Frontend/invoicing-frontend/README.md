# Invoicing Application Frontend

This project is an invoicing application built with Angular 17, PrimeNG, and Tailwind CSS.

## Features

- Dashboard with KPI cards and analytics
- Client management
- Invoice creation and management
- Responsive design with dark mode support
- Modern UI with PrimeNG components

## Tech Stack

- **Angular 17**: Framework with standalone components
- **PrimeNG**: UI Component Library
- **Tailwind CSS**: Utility-first CSS framework
- **NgRx**: State management
- **PrimeFlex**: Flexible CSS utility library

## Project Structure

- **app/core**: Core functionality (models, services, store)
- **app/shared**: Shared components, directives, and pipes
- **app/layout**: Layout components (header, sidebar, footer)
- **app/features**: Feature modules (dashboard, clients, invoices)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run start
   ```
5. Open your browser and navigate to `http://localhost:4200`

## Development

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Building

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Architecture

This application follows a feature-based architecture with the following components:

- **Shared Components**: Reusable UI components (cards, buttons, etc.)
- **Core Services**: API communication, state management
- **Feature Modules**: Domain-specific functionality

### State Management

We use NgRx for state management with the following pattern:

- **Store**: Single source of truth for application state
- **Actions**: Events that describe state changes
- **Reducers**: Pure functions that implement state transitions
- **Effects**: Side effects for asynchronous operations
- **Selectors**: Pure functions that select slices of state

## Backend Integration

The frontend communicates with the backend via RESTful API endpoints. The API base URL is configured in the environment files.
