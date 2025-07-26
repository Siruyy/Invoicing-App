using System;

namespace InvoicingApp.Application.DTOs
{
    public class AiChatMessageDto
    {
        /// <summary>
        /// Unique identifier for the chat message
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// The ID of the user this message belongs to
        /// </summary>
        public required string UserId { get; set; }
        
        /// <summary>
        /// Whether the message is from the user (true) or the AI (false)
        /// </summary>
        public bool IsUserMessage { get; set; }
        
        /// <summary>
        /// The content of the message
        /// </summary>
        public required string Content { get; set; }
        
        /// <summary>
        /// When the message was created
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }
}
