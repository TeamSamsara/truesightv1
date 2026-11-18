// TrueSight.DataPipeline
// AppConfig.cs
// @version 1.0.3
//
// Single source of truth for all paths and configuration values.
// No path or magic value is ever hardcoded anywhere else in the codebase.

namespace TrueSight.DataPipeline.Core;

public static class AppConfig
{
    #region Base Paths

    public static string PipelineRoot { get; } =
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    public static string InputRoot  { get; } = Path.Combine(PipelineRoot, "input");
    public static string OutputRoot { get; } = Path.Combine(PipelineRoot, "output");

    #endregion

    #region Input Paths

    // Dataset files: input/split/{splitId}_DATASET.json
    public static string SplitRoot { get; } = Path.Combine(InputRoot, "split");

    // Match folders: input/matches/{splitFolder}/matches/NA1_*.json
    public static string MatchesRoot { get; } = Path.Combine(InputRoot, "matches");

    public static string MappingsRoot { get; } = Path.Combine(InputRoot, "mappings");

    #endregion

    #region Output Paths

    public static string PlayersOutputDir  { get; } = Path.Combine(OutputRoot, "players");
    public static string DatasetsOutputDir { get; } = Path.Combine(OutputRoot, "datasets");

    #endregion

    #region Path Helpers

    // Match files:    input/matches/{splitFolder}/matches/NA1_*.json
    // Timeline files: input/matches/{splitFolder}/timelines/NA1_*_timeline.json
    // Dataset files:  input/split/{splitId}_DATASET.json

    public static string GetMatchDir(string splitFolder) =>
        Path.Combine(MatchesRoot, splitFolder, "matches");

    public static string GetTimelineDir(string splitFolder) =>
        Path.Combine(MatchesRoot, splitFolder, "timelines");

    public static string GetDatasetFilePath(string datasetFileName) =>
        Path.Combine(SplitRoot, $"{datasetFileName}.json");

    public static string GetMatchFilePath(string splitFolder, string matchId) =>
        Path.Combine(GetMatchDir(splitFolder), $"{matchId}.json");

    public static string GetTimelineFilePath(string splitFolder, string matchId) =>
        Path.Combine(GetTimelineDir(splitFolder), $"{matchId}_timeline.json");

    public static string GetPlayerFilePath(string riotIdSafe) =>
        Path.Combine(PlayersOutputDir, $"{riotIdSafe}.json");

    #endregion

    #region Riot API

    public static string RiotApiBase      { get; } = "https://americas.api.riotgames.com";
    public static int    RateLimitDelayMs { get; } = 1200;
    public static int    MaxRetries       { get; } = 3;
    public static int    RetryDelayMs     { get; } = 12000;
    public static int    TimeoutSeconds   { get; } = 15;

    #endregion

    #region Config

    public static string ConfigFile { get; } = "pipeline_config.json";
    public static string ApiKeyFile { get; } = "api_key.txt";

    #endregion
}