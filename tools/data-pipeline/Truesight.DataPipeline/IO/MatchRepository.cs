// TrueSight.DataPipeline
// IO/MatchRepository.cs
// @version 1.0.0
//
// Finds and loads raw match and timeline files from disk.
// Knows the folder convention — no other file constructs match paths directly.

using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.Models;

namespace TrueSight.DataPipeline.IO;

public static class MatchRepository
{
    #region Match Files

    // Returns all match IDs available for a given split.
    // Scans the matches subfolder for NA1_*.json files.
    public static List<string> GetMatchIds(PipelineContext context)
    {
        var matchDir = AppConfig.GetMatchDir(context.SplitFolder);
        return FileStore
            .GetFiles(matchDir, "NA1_*.json")
            .Select(f => Path.GetFileNameWithoutExtension(f))
            .ToList();
    }

    // Loads a single raw match from disk.
    // Returns null if the file does not exist or cannot be parsed.
    public static RawMatch? LoadMatch(PipelineContext context, string matchId)
    {
        var path = AppConfig.GetMatchFilePath(context.SplitFolder, matchId);
        return FileStore.Read<RawMatch>(path);
    }

    // Loads all raw matches for a split.
    // Skips files that cannot be parsed and logs a warning.
    public static List<RawMatch> LoadAllMatches(PipelineContext context)
    {
        var matchIds = GetMatchIds(context);
        var matches  = new List<RawMatch>();

        foreach (var matchId in matchIds)
        {
            var match = LoadMatch(context, matchId);
            if (match != null)
                matches.Add(match);
            else
                Console.WriteLine($"  [WARN] Could not load match: {matchId}");
        }

        return matches;
    }

    // Writes a raw match to disk.
    public static bool SaveMatch(PipelineContext context, RawMatch match) =>
        FileStore.Write(
            AppConfig.GetMatchFilePath(context.SplitFolder, match.MatchId),
            match
        );

    // Returns true if a match file already exists on disk.
    public static bool MatchExists(PipelineContext context, string matchId) =>
        FileStore.Exists(AppConfig.GetMatchFilePath(context.SplitFolder, matchId));

    #endregion

    #region Timeline Files

    // Loads a single raw timeline from disk.
    // Returns null if the file does not exist.
    public static RawTimeline? LoadTimeline(PipelineContext context, string matchId)
    {
        var path = AppConfig.GetTimelineFilePath(context.SplitFolder, matchId);
        return FileStore.Read<RawTimeline>(path);
    }

    // Writes a raw timeline to disk.
    public static bool SaveTimeline(PipelineContext context, RawTimeline timeline) =>
        FileStore.Write(
            AppConfig.GetTimelineFilePath(context.SplitFolder, timeline.MatchId),
            timeline
        );

    // Returns true if a timeline file already exists on disk.
    public static bool TimelineExists(PipelineContext context, string matchId) =>
        FileStore.Exists(AppConfig.GetTimelineFilePath(context.SplitFolder, matchId));

    // Returns all match IDs that have a match file but are missing a timeline file.
    // Used by the backfill mode to know what needs fetching.
    public static List<string> GetMatchIdsMissingTimeline(PipelineContext context)
    {
        return GetMatchIds(context)
            .Where(id => !TimelineExists(context, id))
            .ToList();
    }

    #endregion
}