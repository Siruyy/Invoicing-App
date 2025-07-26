using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using InvoicingApp.Application.DTOs;
using InvoicingApp.Application.Interfaces;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Core.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace InvoicingApp.Infrastructure.Services
{
    public class OpenAiQueryService : IAiQueryService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAiSettings _settings;
        private readonly IAiChatRepository _chatRepository;
        private readonly IAiDataFetchService _dataFetchService;
        private readonly ILogger<OpenAiQueryService> _logger;
        
        private const string OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

        public OpenAiQueryService(
            HttpClient httpClient,
            IOptions<OpenAiSettings> settings,
            IAiChatRepository chatRepository,
            IAiDataFetchService dataFetchService,
            ILogger<OpenAiQueryService> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _chatRepository = chatRepository;
            _dataFetchService = dataFetchService;
            _logger = logger;
            
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        }

        public async Task<AiQueryResponseDto> ProcessQueryAsync(string query, string userId)
        {
            try
            {
                // Save user message
                await _chatRepository.AddMessageAsync(new AiChatMessage
                {
                    UserId = userId,
                    Content = query,
                    IsUserMessage = true
                });

                // Get recent chat history for context
                var chatHistory = await _chatRepository.GetChatHistoryAsync(userId, 10);
                
                // Fetch relevant data based on the query
                var relevantData = await _dataFetchService.GetRelevantDataForQuery(query);
                
                // Prepare messages for OpenAI
                var messages = new List<object>();
                
                // Add system message with instructions
                messages.Add(new 
                {
                    role = "system",
                    content = GetSystemPrompt()
                });
                
                // Add relevant data as context
                messages.Add(new
                {
                    role = "system",
                    content = $"Here is the relevant data from the database to answer the user's query:\n\n{relevantData}"
                });
                
                // Add chat history as context
                foreach (var message in chatHistory)
                {
                    messages.Add(new
                    {
                        role = message.IsUserMessage ? "user" : "assistant",
                        content = message.Content
                    });
                }
                
                // Add the current query
                messages.Add(new
                {
                    role = "user",
                    content = query
                });

                // Prepare the request to OpenAI
                var requestBody = JsonSerializer.Serialize(new
                {
                    model = _settings.Model,
                    messages,
                    temperature = _settings.Temperature,
                    max_tokens = _settings.MaxTokens
                });

                var content = new StringContent(requestBody, Encoding.UTF8, "application/json");
                
                // Send the request to OpenAI
                var response = await _httpClient.PostAsync(OPENAI_API_URL, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"OpenAI API error: {errorContent}");
                    
                    return new AiQueryResponseDto
                    {
                        Query = query,
                        Response = "Sorry, I encountered an error while processing your query.",
                        Timestamp = DateTime.UtcNow,
                        Error = $"API error: {response.StatusCode}",
                        Success = false
                    };
                }

                // Parse the response
                var responseContent = await response.Content.ReadAsStringAsync();
                var openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var aiResponseText = openAiResponse?.Choices?[0]?.Message?.Content ?? "No response generated.";
                
                // Save AI response
                await _chatRepository.AddMessageAsync(new AiChatMessage
                {
                    UserId = userId,
                    Content = aiResponseText,
                    IsUserMessage = false
                });

                return new AiQueryResponseDto
                {
                    Query = query,
                    Response = aiResponseText,
                    Timestamp = DateTime.UtcNow,
                    Success = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing query: {ex.Message}");
                
                return new AiQueryResponseDto
                {
                    Query = query,
                    Response = "Sorry, an unexpected error occurred while processing your query.",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message,
                    Success = false
                };
            }
        }

        public async Task<List<AiChatMessageDto>> GetChatHistoryAsync(string userId, int limit = 50)
        {
            var chatHistory = await _chatRepository.GetChatHistoryAsync(userId, limit);
            
            return chatHistory.Select(m => new AiChatMessageDto
            {
                Id = m.Id,
                UserId = m.UserId,
                Content = m.Content,
                IsUserMessage = m.IsUserMessage,
                CreatedAt = m.CreatedAt
            }).ToList();
        }

        public async Task<bool> ClearChatHistoryAsync(string userId)
        {
            return await _chatRepository.ClearChatHistoryAsync(userId);
        }
        
        private string GetSystemPrompt()
        {
            return @"You are an AI assistant for an invoicing application. You have access to client information, 
invoice data, and business metrics. Please provide helpful, concise answers to questions about the data.

Available data includes:
1. Clients: ID, Name, Email, Phone, Address, City, State, ZipCode, Country, CompanyName, ContactPerson, TaxNumber
2. Invoices: ID, InvoiceNumber, ClientId, IssueDate, DueDate, Subtotal, TaxRate, TaxAmount, TotalAmount, Notes, Status, Currency, ExchangeRate, PaidAt
3. InvoiceItems: ID, InvoiceId, Description, Quantity, UnitPrice, TotalPrice

You can analyze this data to provide insights on:
- Client spending patterns
- Upcoming payment schedules
- Revenue forecasting
- Potential upsell opportunities
- Payment trends and anomalies
- Client churn risk based on declining invoices or late payments

When asked about specific data, provide clear, concise answers. If you don't have enough information, 
politely request more details. Always format currency values appropriately.";
        }
    }
    
    // Classes to deserialize OpenAI response
    class OpenAiResponse
    {
        public List<OpenAiChoice>? Choices { get; set; }
    }
    
    class OpenAiChoice
    {
        public OpenAiMessage? Message { get; set; }
    }
    
    class OpenAiMessage
    {
        public string? Role { get; set; }
        public string? Content { get; set; }
    }
}
