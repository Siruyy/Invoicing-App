using System.Threading.Tasks;

namespace InvoicingApp.Application.Interfaces
{
    public interface IAiDataFetchService
    {
        /// <summary>
        /// Analyzes a query and fetches relevant data from the database
        /// </summary>
        /// <param name="query">The natural language query from the user</param>
        /// <returns>Formatted string containing relevant data from the database</returns>
        Task<string> GetRelevantDataForQuery(string query);
    }
}
