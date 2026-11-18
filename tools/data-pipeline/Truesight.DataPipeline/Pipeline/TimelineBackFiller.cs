// TrueSight.DataPipeline
// Pipeline/TimelineBackfiller.cs
// @version 1.0.0
//
// Mode 2 — Fetches missing timeline files for existing match files.
// Scans the split folder for match files that have no matching timeline file.
// Skips timelines already cached on disk.
// Run once to backfill historical splits — not needed for new splits fetched with Mode 1.

using TrueSight.DataPipeline.Client;
using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.IO;
using TrueSight.DataPipeline.Parsers;

namespace TrueSight.DataPipeline.Pipeline;

public static class TimelineBackfiller
{
    #region Private Types

    private enum FetchResult { Saved, Skipped, Failed }

    #endregion

    #region Public API

    public static async Task RunAsync(PipelineContext context, string apiKey)
    {
        ConsoleMenu.RenderSectionHeader($"Backfill Timelines — {context.Label}");

        var missing = MatchRepository.GetMatchIdsMissingTimeline(context);

        if (missing.Count == 0)
        {
            ConsoleMenu.RenderSuccess("All timelines already present — nothing to backfill.");
            return;
        }

        var estimated = missing.Count * AppConfig.RateLimitDelayMs / 1000.0 / 60.0;
        ConsoleMenu.RenderInfo($"Missing timelines: {missing.Count}");
        ConsoleMenu.RenderInfo($"Estimated time: ~{estimated:F1} min");
        Console.WriteLine();

        using var client = new RiotClient(apiKey);
        var failed = new List<string>();
        int saved  = 0;

        for (int i = 0; i < missing.Count; i++)
        {
            var matchId = missing[i];
            ConsoleMenu.RenderProgress(i + 1, missing.Count, matchId);

            var result = await FetchAndSaveTimelineAsync(context, client, matchId);

            if (result == FetchResult.Saved)  saved++;
            if (result == FetchResult.Failed) failed.Add(matchId);
        }

        Console.WriteLine();
        ConsoleMenu.RenderSuccess($"Saved: {saved}  Failed: {failed.Count}");

        WriteFailedIds(context, failed);
        ConsoleMenu.RenderDone();
    }

    #endregion

    #region Private Helpers

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

    private static void WriteFailedIds(PipelineContext context, List<string> failed)
    {
        if (!failed.Any()) return;

        var path = Path.Combine(AppConfig.GetTimelineDir(context.SplitFolder), "failed_timelines.txt");
        File.WriteAllLines(path, failed);
        ConsoleMenu.RenderWarning($"{failed.Count} failed IDs written to failed_timelines.txt");
    }

    #endregion
}