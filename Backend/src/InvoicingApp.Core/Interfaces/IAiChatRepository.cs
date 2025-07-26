using System.Collections.Generic;
using System.Threading.Tasks;
using InvoicingApp.Core.Entities;

namespace InvoicingApp.Core.Interfaces
{
    public interface IAiChatRepository
    {
        Task<AiChatMessage> AddMessageAsync(AiChatMessage message);
        Task<List<AiChatMessage>> GetChatHistoryAsync(string userId, int limit = 50);
        Task<bool> ClearChatHistoryAsync(string userId);
    }
}
