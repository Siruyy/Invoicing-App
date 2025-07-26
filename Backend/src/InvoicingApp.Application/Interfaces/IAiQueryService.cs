using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InvoicingApp.Application.DTOs;

namespace InvoicingApp.Application.Interfaces
{
    public interface IAiQueryService
    {
        /// <summary>
        /// Processes a natural language query through OpenAI and returns the response
        /// </summary>
        /// <param name="query">The user's natural language query</param>
        /// <param name="userId">The ID of the user making the query (for history tracking)</param>
        /// <returns>AI response to the query</returns>
        Task<AiQueryResponseDto> ProcessQueryAsync(string query, string userId);

        /// <summary>
        /// Retrieves chat history for a specific user
        /// </summary>
        /// <param name="userId">The ID of the user</param>
        /// <param name="limit">Maximum number of chat messages to retrieve</param>
        /// <returns>List of chat messages</returns>
        Task<List<AiChatMessageDto>> GetChatHistoryAsync(string userId, int limit = 50);

        /// <summary>
        /// Clears chat history for a specific user
        /// </summary>
        /// <param name="userId">The ID of the user</param>
        /// <returns>Success/failure</returns>
        Task<bool> ClearChatHistoryAsync(string userId);
    }
}
