using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InvoicingApp.Core.Entities;
using InvoicingApp.Core.Interfaces;
using InvoicingApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoicingApp.Infrastructure.Repositories
{
    public class AiChatRepository : IAiChatRepository
    {
        private readonly ApplicationDbContext _dbContext;

        public AiChatRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<AiChatMessage> AddMessageAsync(AiChatMessage message)
        {
            await _dbContext.AiChatMessages.AddAsync(message);
            await _dbContext.SaveChangesAsync();
            return message;
        }

        public async Task<List<AiChatMessage>> GetChatHistoryAsync(string userId, int limit = 50)
        {
            return await _dbContext.AiChatMessages
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ClearChatHistoryAsync(string userId)
        {
            var messages = await _dbContext.AiChatMessages
                .Where(m => m.UserId == userId)
                .ToListAsync();
                
            _dbContext.AiChatMessages.RemoveRange(messages);
            var result = await _dbContext.SaveChangesAsync();
            return result > 0;
        }
    }
}
