// TrueSight.DataPipeline
// Core/PipelineConfig.cs
// @version 1.0.0
//
// Loads pipeline_config.json from disk at startup.
// Single source of truth for API keys and Firebase credentials.
// Never hardcode keys anywhere else in the codebase.

using Newtonsoft.Json;

namespace TrueSight.DataPipeline.Core;

public class PipelineConfig
{
    #region Properties

    public string RiotApiKey            { get; set; } = "";
    public string FirebaseProjectId     { get; set; } = "";
    public string GoogleCredentialsPath { get; set; } = "";

    #endregion

    #region Static Loader

    // Loads config from pipeline_config.json next to the executable.
    // Returns null if the file is missing or cannot be parsed.
    public static PipelineConfig? Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, AppConfig.ConfigFile);

        if (!File.Exists(path))
        {
            Console.WriteLine($"  [ERROR] Config file not found: {path}");
            Console.WriteLine($"  Create pipeline_config.json next to the executable.");
            return null;
        }

        try
        {
            var json = File.ReadAllText(path);
            return JsonConvert.DeserializeObject<PipelineConfig>(json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Failed to load config — {ex.Message}");
            return null;
        }
    }

    // Returns true if all required fields are present.
    public bool IsValid()
    {
        if (string.IsNullOrEmpty(RiotApiKey))
        {
            Console.WriteLine("  [ERROR] riotApiKey is missing from pipeline_config.json");
            return false;
        }

        if (string.IsNullOrEmpty(FirebaseProjectId))
        {
            Console.WriteLine("  [ERROR] firebaseProjectId is missing from pipeline_config.json");
            return false;
        }

        if (string.IsNullOrEmpty(GoogleCredentialsPath) || !File.Exists(GoogleCredentialsPath))
        {
            Console.WriteLine("  [ERROR] googleCredentialsPath is missing or file not found.");
            return false;
        }

        return true;
    }

    #endregion
}