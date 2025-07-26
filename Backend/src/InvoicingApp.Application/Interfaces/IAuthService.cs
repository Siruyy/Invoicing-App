using InvoicingApp.Application.DTOs;
using System.Threading.Tasks;

namespace InvoicingApp.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequest);
        Task<bool> SeedAdminUserAsync();
    }
}
