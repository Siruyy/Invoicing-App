using System;

namespace InvoicingApp.Application.DTOs
{
    public class AiQueryResponseDto
    {
        /// <summary>
        /// The response text from the AI
        /// </summary>
        public string Response { get; set; }
        
        /// <summary>
        /// The original query that was processed
        /// </summary>
        public string Query { get; set; }
        
        /// <summary>
        /// The timestamp of when the response was generated
        /// </summary>
        public DateTime Timestamp { get; set; }
        
        /// <summary>
        /// Any error message if the query processing failed
        /// </summary>
        public string Error { get; set; }
        
        /// <summary>
        /// Whether the query was successfully processed
        /// </summary>
        public bool Success { get; set; }
    }
}
