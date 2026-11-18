// TrueSight.DataPipeline
// Pipeline/Compiler.cs
// @version 1.0.0
//
// Mode 3 — Compiles raw match and timeline files into per-player profiles.
// Loads all matches for a split, groups by player, builds SplitRecords.
// Merges into existing player profiles for cross-split accumulation.
// Retroactively enriches empty opponent fields in existing splits.

using TrueSight.DataPipeline.Builders;
using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.IO;
using TrueSight.DataPipeline.Models;
using TrueSight.DataPipeline.Parsers;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.Pipeline;

public static class Compiler
{
    #region Public API

    public static void Run(PipelineContext context)
    {
        ConsoleMenu.RenderSectionHeader($"Compile — {context.Label}");

        var matches = MatchRepository.LoadAllMatches(context);
        if (matches.Count == 0)
        {
            ConsoleMenu.RenderError("No match files found — run Fetch first.");
            return;
        }
        ConsoleMenu.RenderInfo($"Loaded {matches.Count} matches");

        var timelines     = LoadTimelines(context, matches);
        var opponentLookup = OpponentResolver.BuildLookup(matches);
        var playerGames   = GroupGamesByPlayer(matches);

        ConsoleMenu.RenderInfo($"Found {playerGames.Count} unique players");
        ConsoleMenu.RenderInfo($"Timelines available: {timelines.Count}/{matches.Count}");
        Console.WriteLine();

        int written = 0;
        int total   = playerGames.Count;

        foreach (var (riotId, games) in playerGames)
        {
            ConsoleMenu.RenderProgress(written + 1, total, riotId);

            var profile  = LoadOrCreateProfile(riotId);
            var split    = SplitRecordBuilder.Build(games, context, timelines, opponentLookup);

            MergeSplitIntoProfile(profile, split, context);
            OpponentResolver.EnrichExistingParticipation(profile, opponentLookup);

            if (PlayerRepository.Save(profile))
                written++;
            else
                ConsoleMenu.RenderWarning($"Failed to save: {riotId}");
        }

        Console.WriteLine();
        ConsoleMenu.RenderSuccess($"Wrote {written} player profiles to {AppConfig.PlayersOutputDir}");
        ConsoleMenu.RenderDone();
    }

    #endregion

    #region Private Helpers

    // Loads all timeline snapshots for a split keyed by matchId → participantId → snapshot.
    private static Dictionary<string, Dictionary<int, TimelineSnapshot>> LoadTimelines(
        PipelineContext  context,
        List<RawMatch>   matches)
    {
        var timelines = new Dictionary<string, Dictionary<int, TimelineSnapshot>>();

        foreach (var match in matches)
        {
            var raw = MatchRepository.LoadTimeline(context, match.MatchId);
            if (raw == null) continue;

            var snapshots = TimelineParser.ExtractSnapshots(raw);
            if (snapshots.Count > 0)
                timelines[match.MatchId] = snapshots;
        }

        return timelines;
    }

    // Groups all player appearances by RiotId across all matches.
    private static Dictionary<string, List<(RawMatch match, RawPlayer player)>>
        GroupGamesByPlayer(List<RawMatch> matches)
    {
        var playerGames = new Dictionary<string, List<(RawMatch, RawPlayer)>>();

        foreach (var match in matches)
        {
            foreach (var player in match.Info.Participants)
            {
                var riotId = RiotIdHelper.FromRawPlayer(
                    player.RiotIdGameName,
                    player.RiotIdTagline,
                    player.SummonerName
                );

                if (!playerGames.ContainsKey(riotId))
                    playerGames[riotId] = new List<(RawMatch, RawPlayer)>();

                playerGames[riotId].Add((match, player));
            }
        }

        return playerGames;
    }

    // Loads existing profile from disk or creates a fresh one.
    private static PlayerProfile LoadOrCreateProfile(string riotId)
    {
        var existing = PlayerRepository.Load(riotId);
        if (existing != null) return existing;

        var parts = riotId.Split('#');
        return new PlayerProfile
        {
            RiotId   = riotId,
            GameName = parts[0],
            Tag      = parts.Length > 1 ? parts[1] : "",
            Seasons  = new Dictionary<string, SeasonRecord>(),
        };
    }

    // Merges a compiled SplitRecord into the player profile under the correct season.
    private static void MergeSplitIntoProfile(
        PlayerProfile   profile,
        SplitRecord     split,
        PipelineContext context)
    {
        if (!profile.Seasons.ContainsKey(context.SeasonKey))
        {
            profile.Seasons[context.SeasonKey] = new SeasonRecord
            {
                League = context.League,
                Season = context.Season,
                Splits = new Dictionary<string, SplitRecord>(),
            };
        }

        profile.Seasons[context.SeasonKey].Splits[context.SplitKey] = split;
    }

    #endregion
}