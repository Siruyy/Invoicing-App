# AI-Powered Query Implementation

This document summarizes the implementation of the AI-Powered Query feature for the Invoicing Application.

## Overview

We've implemented a floating chatbot that appears in the bottom right corner of the application. The chatbot allows users to query invoice and client data using natural language, as specified in the requirements.

## Features Implemented

1. **Backend Components**:
   - AI Query Service interface and implementation using OpenAI's gpt-4o-mini model
   - Entity and repository for storing chat history
   - RESTful API endpoints for processing queries and managing chat history
   - Secure handling of OpenAI API integration via backend proxy

2. **Frontend Components**:
   - AI Query service for communicating with the backend
   - Floating chat component with minimizable/expandable UI
   - Chat history display with user and AI messages
   - Example prompts to help users understand capabilities
   - Clear chat functionality

## Database Schema

Added a new table `AiChatMessages` with the following columns:
- `Id` (int, primary key)
- `UserId` (string, indexed)
- `IsUserMessage` (boolean)
- `Content` (string)
- `CreatedAt` (datetime)

## Technologies Used

- **Backend**: 
  - .NET Core API
  - Entity Framework Core
  - OpenAI API

- **Frontend**: 
  - Angular 17
  - PrimeNG UI components
  - RxJS for reactive programming

## Configuration

OpenAI settings are configured in `appsettings.json`:
```json
"OpenAi": {
  "ApiKey": "your-openai-api-key-here",
  "Model": "gpt-4o-mini",
  "Temperature": 0.7,
  "MaxTokens": 1000
}
```

## Next Steps

1. **Apply Database Migration**: Follow the instructions in `migration-instructions.md`
2. **Update OpenAI API Key**: Replace the placeholder in `appsettings.json` with your actual API key
3. **Test the Implementation**: Ensure queries are processed correctly and chat history is persistent

## Sample Queries

The AI assistant is designed to handle the following types of queries:
- "Given the purchase history of my clients, suggest who is most likely to buy Product X"
- "For each customer, based on their purchase history, suggest products to cross-sell"
- "Which clients show signs of churn risk based on declining invoice volume or delayed payments?"
- "Identify clients whose buying patterns have changed significantly in the last 3 months"
