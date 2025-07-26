using System;

namespace InvoicingApp.Application.DTOs
{
    public class AiQueryRequestDto
    {
        /// <summary>
        /// The natural language query from the user
        /// </summary>
        public string Query { get; set; }
        
        /// <summary>
        /// The ID of the user making the query
        /// </summary>
        public string UserId { get; set; }
    }
}
