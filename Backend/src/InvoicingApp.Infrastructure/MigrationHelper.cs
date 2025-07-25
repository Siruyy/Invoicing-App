using System;
using System.IO;
using Npgsql;

namespace DatabaseMigrationHelper
{
    class Program
    {
        static void Main(string[] args)
        {
            // Connection string from your appsettings.json
            string connectionString = "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.chtmxfbmdgbpmrawmgnw;Password=neelroda0703";
            
            try
            {
                // Read the SQL script
                string sqlScript = File.ReadAllText("Data/CustomMigration.sql");
                
                // Execute the script
                using (var connection = new NpgsqlConnection(connectionString))
                {
                    connection.Open();
                    
                    using (var command = new NpgsqlCommand(sqlScript, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                    
                    Console.WriteLine("Migration successfully applied!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error applying migration: {ex.Message}");
            }
        }
    }
}
