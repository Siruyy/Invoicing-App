namespace InvoicingApp.Core.Settings
{
    public class OpenAiSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = "gpt-4o-mini";
        public float Temperature { get; set; } = 0.7f;
        public int MaxTokens { get; set; } = 1000;
    }
}
