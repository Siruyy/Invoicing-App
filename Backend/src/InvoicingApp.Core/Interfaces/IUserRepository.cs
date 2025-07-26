using InvoicingApp.Core.Entities;
using System.Threading.Tasks;

namespace InvoicingApp.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetByUsernameAsync(string username);
        Task<bool> AnyUsersExistAsync();
        Task CreateUserAsync(User user);
    }
}
