using System;

namespace InvoicingApp.Core.Entities
{
    public class AiChatMessage
    {
        public int Id { get; set; }
        public required string UserId { get; set; }
        public bool IsUserMessage { get; set; }
        public required string Content { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
