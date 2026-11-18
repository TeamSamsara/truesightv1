// TrueSight.DataPipeline
// Pipeline/Fetcher.cs
// @version 1.0.2
//
// Mode 1 — Fetches match and timeline files from the Riot API.
// Reads match IDs from match_ids.txt in the split folder.
// Skips matches and timelines already cached on disk.
// Writes raw JSON files to input/matches/{splitFolder}/matches/ and /timelines/

using TrueSight.DataPipeline.Client;
using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.IO;
using TrueSight.DataPipeline.Parsers;

namespace TrueSight.DataPipeline.Pipeline;

public static class Fetcher
{
    #region Constants

    private const string IdsFileName = "match_ids.txt";

    #endregion

    #region Private Types

    private enum FetchResult { Saved, Skipped, Failed }

    #endregion

    #region Public API

    public static async Task RunAsync(PipelineContext context, string apiKey)
    {
        ConsoleMenu.RenderSectionHeader($"Fetch — {context.Label}");

        var matchIds = LoadMatchIds(context);
        if (matchIds.Count == 0) return;

        var estimated = matchIds.Count * 2 * AppConfig.RateLimitDelayMs / 1000.0 / 60.0;
        ConsoleMenu.RenderInfo($"Loaded {matchIds.Count} match IDs");
        ConsoleMenu.RenderInfo($"Estimated time: ~{estimated:F1} min (match + timeline per game)");
        Console.WriteLine();

        using var client    = new RiotClient(apiKey);
        var failedMatches   = new List<string>();
        var failedTimelines = new List<string>();
        int savedMatches    = 0;
        int savedTimelines  = 0;
        int skippedMatches  = 0;

        for (int i = 0; i < matchIds.Count; i++)
        {
            var matchId = matchIds[i];
            ConsoleMenu.RenderProgress(i + 1, matchIds.Count, matchId);

            var matchResult    = await FetchAndSaveMatchAsync(context, client, matchId);
            var timelineResult = await FetchAndSaveTimelineAsync(context, client, matchId);

            if (matchResult == FetchResult.Saved)    savedMatches++;
            if (matchResult == FetchResult.Skipped)  skippedMatches++;
            if (matchResult == FetchResult.Failed)   failedMatches.Add(matchId);

            if (timelineResult == FetchResult.Saved)  savedTimelines++;
            if (timelineResult == FetchResult.Failed) failedTimelines.Add(matchId);
        }

        Console.WriteLine();
        ConsoleMenu.RenderSuccess($"Matches   — saved: {savedMatches}  skipped: {skippedMatches}  failed: {failedMatches.Count}");
        ConsoleMenu.RenderSuccess($"Timelines — saved: {savedTimelines}  failed: {failedTimelines.Count}");

        WriteFailedIds(context, failedMatches,   "failed_matches.txt");
        WriteFailedIds(context, failedTimelines, "failed_timelines.txt");

        ConsoleMenu.RenderDone();
    }

    #endregion

    #region Private Helpers

    private static async Task<FetchResult> FetchAndSaveMatchAsync(
        PipelineContext context,
        RiotClient      client,
        string          matchId)
    {
        if (MatchRepository.MatchExists(context, matchId))
            return FetchResult.Skipped;

        var raw = await client.FetchMatchAsync(matchId);
        if (raw == null) return FetchResult.Failed;

        var match = MatchParser.Parse(matchId, raw);
        if (match == null) return FetchResult.Failed;

        return MatchRepository.SaveMatch(context, match)
            ? FetchResult.Saved
            : FetchResult.Failed;
    }

    private static async Task<FetchResult> FetchAndSaveTimelineAsync(
        PipelineContext context,
        RiotClient      client,
        string          matchId)
    {
        if (MatchRepository.TimelineExists(context, matchId))
            return FetchResult.Skipped;

        var raw = await client.FetchTimelineAsync(matchId);
        if (raw == null) return FetchResult.Failed;

        var timeline = TimelineParser.Parse(matchId, raw);
        if (timeline == null) return FetchResult.Failed;

        return MatchRepository.SaveTimeline(context, timeline)
            ? FetchResult.Saved
            : FetchResult.Failed;
    }

    private static List<string> LoadMatchIds(PipelineContext context)
    {
        var idsPath = Path.Combine(AppConfig.GetMatchDir(context.SplitFolder), IdsFileName);

        if (!File.Exists(idsPath))
        {
            ConsoleMenu.RenderError($"match_ids.txt not found at: {idsPath}");
            return new List<string>();
        }

        var ids = File.ReadAllLines(idsPath)
            .Select(l => l.Trim())
            .Where(l => l.StartsWith("NA1_"))
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            ConsoleMenu.RenderError("match_ids.txt contains no valid NA1_ match IDs.");

        return ids;
    }

    private static void WriteFailedIds(PipelineContext context, List<string> failed, string fileName)
    {
        if (!failed.Any()) return;

        var path = Path.Combine(AppConfig.GetMatchDir(context.SplitFolder), fileName);
        File.WriteAllLines(path, failed);
        ConsoleMenu.RenderWarning($"{failed.Count} failed IDs written to {fileName}");
    }

    #endregion
}