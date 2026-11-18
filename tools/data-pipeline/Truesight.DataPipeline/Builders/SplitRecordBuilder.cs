// TrueSight.DataPipeline
// Builders/SplitRecordBuilder.cs
// @version 1.0.0
//
// Builds a complete SplitRecord for one player from their compiled games.
// Orchestrates StatsAggregator and OpponentResolver — never does low-level work itself.
// Timeline data is attached per game when available.

using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.Models;
using TrueSight.DataPipeline.Parsers;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.Builders;

public static class SplitRecordBuilder
{
    #region Public API

    // Builds a SplitRecord for one player from their games in a split.
    // Timelines are keyed by matchId — pass empty dict if not available.
    public static SplitRecord Build(
        List<(RawMatch match, RawPlayer player)>                        games,
        PipelineContext                                                  context,
        Dictionary<string, Dictionary<int, TimelineSnapshot>>           timelines,
        Dictionary<string, Dictionary<string, (string team100, string team200)>> opponentLookup)
    {
        if (!games.Any()) return new SplitRecord();

        var role  = ResolveRole(games);
        var wins  = games.Count(x => x.player.Win);
        var total = games.Count;

        var gameLog      = BuildGameLog(games, context, timelines);
        var avgStats     = StatsAggregator.BuildAvgStats(games);
        StatsAggregator.EnrichWithTimelineAverages(avgStats, gameLog);

        return new SplitRecord
        {
            League   = context.League,
            Season   = context.Season,
            Split    = context.Split,
            Label    = context.Label,
            TeamName = "",   // enriched via dataset cross-reference in normalize mode
            Role     = role,
            Games    = total,
            Wins     = wins,
            Losses   = total - wins,
            WinRate  = total > 0 ? Math.Round(wins / (double)total * 100, 1) : 0,

            PerGame       = avgStats,
            PerMin        = StatsAggregator.BuildPerMinStats(games),
            Vision        = StatsAggregator.BuildVisionStats(games),
            Champions     = StatsAggregator.BuildChampionStats(games),
            GameLog       = gameLog,
            Participation = BuildParticipation(games, role, opponentLookup),
        };
    }

    #endregion

    #region Private Helpers

    // Most common non-empty role across all games in the split.
    private static string ResolveRole(List<(RawMatch match, RawPlayer player)> games)
    {
        return games
            .Select(x => x.player.TeamPosition)
            .Where(r => !string.IsNullOrEmpty(r))
            .GroupBy(r => r)
            .OrderByDescending(grp => grp.Count())
            .FirstOrDefault()?.Key ?? "";
    }

    private static List<GameLogEntry> BuildGameLog(
        List<(RawMatch match, RawPlayer player)>              games,
        PipelineContext                                        context,
        Dictionary<string, Dictionary<int, TimelineSnapshot>> timelines)
    {
        return games
            .OrderBy(x => x.match.Info.GameEndTimestamp)
            .Select(x => BuildGameLogEntry(x.match, x.player, context, timelines))
            .ToList();
    }

    private static GameLogEntry BuildGameLogEntry(
        RawMatch        match,
        RawPlayer       player,
        PipelineContext context,
        Dictionary<string, Dictionary<int, TimelineSnapshot>> timelines)
    {
        var durationMin = match.Info.GameDuration / 60.0;
        var cs          = player.TotalMinionsKilled + player.NeutralMinionsKilled;
        var kda         = player.Deaths == 0
            ? Math.Round((double)(player.Kills + player.Assists), 2)
            : Math.Round((player.Kills + player.Assists) / (double)player.Deaths, 2);

        // Resolve participant ID to get timeline snapshot
        // Participant IDs in timeline are 1-based positional — match by RiotId
        TimelineSnapshot? timeline = null;
        if (timelines.TryGetValue(match.MatchId, out var matchTimeline))
            timeline = ResolveParticipantTimeline(match, player, matchTimeline);

        return new GameLogEntry
        {
            League   = context.League,
            Season   = context.Season,
            Split    = context.Split,
            MatchId  = match.MatchId,
            GameDate = DateTimeHelper.FromUnixMillis(match.Info.GameEndTimestamp),
            Patch    = DateTimeHelper.ParsePatch(match.Info.GameVersion),

            GameDuration = (int)match.Info.GameDuration,
            TeamId       = player.TeamId,
            Champion     = player.ChampionName,
            Win          = player.Win,

            Kills   = player.Kills,
            Deaths  = player.Deaths,
            Assists = player.Assists,
            Kda     = kda,

            Cs    = cs,
            Csm   = durationMin > 0 ? Math.Round(cs / durationMin, 2) : 0,
            Gold  = player.GoldEarned,
            Goldm = durationMin > 0 ? Math.Round(player.GoldEarned / durationMin, 2) : 0,

            DmgDealt      = player.TotalDamageDealtToChampions,
            DmgTaken      = player.TotalDamageTaken,
            DmgMitigated  = player.DamageSelfMitigated,
            DmgObjectives = player.DamageDealtToObjectives,

            VisionScore  = player.VisionScore,
            WardsPlaced  = player.WardsPlaced,
            WardsKilled  = player.WardsKilled,
            ControlWards = player.VisionWardsBoughtInGame,
            CcScore      = player.TimeCCingOthers,

            KillParticipation = player.KillParticipation,
            Timeline          = timeline,
        };
    }

    // Matches a player to their timeline snapshot by finding their participant index.
    // Participant IDs in the timeline are 1-based and ordered by the participants array.
    private static TimelineSnapshot? ResolveParticipantTimeline(
        RawMatch                         match,
        RawPlayer                        player,
        Dictionary<int, TimelineSnapshot> matchTimeline)
    {
        var riotId = RiotIdHelper.FromRawPlayer(
            player.RiotIdGameName,
            player.RiotIdTagline,
            player.SummonerName
        );

        // Find participant index — timeline IDs are 1-based positions
        for (int i = 0; i < match.Info.Participants.Count; i++)
        {
            var p = match.Info.Participants[i];
            var pid = RiotIdHelper.FromRawPlayer(
                p.RiotIdGameName,
                p.RiotIdTagline,
                p.SummonerName
            );

            if (string.Equals(pid, riotId, StringComparison.OrdinalIgnoreCase))
            {
                var participantId = i + 1; // 1-based
                return matchTimeline.TryGetValue(participantId, out var snapshot)
                    ? snapshot
                    : null;
            }
        }

        return null;
    }

    private static List<ParticipationEntry> BuildParticipation(
        List<(RawMatch match, RawPlayer player)>                        games,
        string                                                          role,
        Dictionary<string, Dictionary<string, (string team100, string team200)>> opponentLookup)
    {
        return games
            .OrderBy(x => x.match.Info.GameEndTimestamp)
            .Select(x => new ParticipationEntry
            {
                MatchId   = x.match.MatchId,
                Opponent  = OpponentResolver.Resolve(
                    x.match.MatchId,
                    role,
                    x.player.TeamId,
                    opponentLookup
                ),
                IsPlayoff  = false,  // enriched later via schedule context
                Conference = "",     // enriched later via schedule context
            })
            .ToList();
    }

    #endregion
}