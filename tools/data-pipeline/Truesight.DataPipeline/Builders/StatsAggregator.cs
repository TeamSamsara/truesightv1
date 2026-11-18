// TrueSight.DataPipeline
// Builders/StatsAggregator.cs
// @version 1.0.0
//
// Computes all averaged and per-minute stats from a list of games.
// No I/O, no API calls — input in, model out.

using TrueSight.DataPipeline.Models;

namespace TrueSight.DataPipeline.Builders;

public static class StatsAggregator
{
    #region Public API

    // Builds AvgStats from a list of games.
    // Timeline averages are computed only from games that have timeline data.
    public static AvgStats BuildAvgStats(List<(RawMatch match, RawPlayer player)> games)
    {
        if (!games.Any()) return new AvgStats();

        double Avg(Func<RawPlayer, double> fn) =>
            Math.Round(games.Average(x => fn(x.player)), 2);

        var avgKills   = Avg(p => p.Kills);
        var avgDeaths  = Avg(p => p.Deaths);
        var avgAssists = Avg(p => p.Assists);
        var avgKda     = avgDeaths == 0
            ? Math.Round(avgKills + avgAssists, 2)
            : Math.Round((avgKills + avgAssists) / avgDeaths, 2);

        return new AvgStats
        {
            Kills             = avgKills,
            Deaths            = avgDeaths,
            Assists           = avgAssists,
            Kda               = avgKda,
            Cs                = Avg(p => p.TotalMinionsKilled + p.NeutralMinionsKilled),
            Gold              = Avg(p => p.GoldEarned),
            KillParticipation = Avg(p => p.KillParticipation),
            VisionScore       = Avg(p => p.VisionScore),
            CcScore           = Avg(p => p.TimeCCingOthers),
            DmgDealt          = Avg(p => p.TotalDamageDealtToChampions),
            DmgTaken          = Avg(p => p.TotalDamageTaken),
            DmgMitigated      = Avg(p => p.DamageSelfMitigated),
            DmgObjectives     = Avg(p => p.DamageDealtToObjectives),
        };
    }

    // Builds PerMinStats weighted by actual game duration.
    // Not a simple average — each game's per-minute rate is computed
    // individually then averaged, preventing long games from skewing results.
    public static PerMinStats BuildPerMinStats(List<(RawMatch match, RawPlayer player)> games)
    {
        if (!games.Any()) return new PerMinStats();

        double PerMin(Func<RawPlayer, double> stat) => Math.Round(
            games.Average(x =>
            {
                var mins = x.match.Info.GameDuration / 60.0;
                return mins > 0 ? stat(x.player) / mins : 0;
            }), 2);

        return new PerMinStats
        {
            Cs            = PerMin(p => p.TotalMinionsKilled + p.NeutralMinionsKilled),
            Gold          = PerMin(p => p.GoldEarned),
            DmgDealt      = PerMin(p => p.TotalDamageDealtToChampions),
            DmgTaken      = PerMin(p => p.TotalDamageTaken),
            DmgMitigated  = PerMin(p => p.DamageSelfMitigated),
            DmgObjectives = PerMin(p => p.DamageDealtToObjectives),
            VisionScore   = PerMin(p => p.VisionScore),
            CcScore       = PerMin(p => p.TimeCCingOthers),
        };
    }

    // Builds VisionStats from a list of games.
    public static VisionStats BuildVisionStats(List<(RawMatch match, RawPlayer player)> games)
    {
        if (!games.Any()) return new VisionStats();

        double Avg(Func<RawPlayer, double> fn) =>
            Math.Round(games.Average(x => fn(x.player)), 2);

        return new VisionStats
        {
            AvgVisionScore        = Avg(p => p.VisionScore),
            AvgWardsPlaced        = Avg(p => p.WardsPlaced),
            AvgWardsKilled        = Avg(p => p.WardsKilled),
            AvgControlWardsBought = Avg(p => p.VisionWardsBoughtInGame),
        };
    }

    // Builds champion pool breakdown from a list of games.
    // Sorted by games played descending.
    public static List<ChampionStat> BuildChampionStats(List<(RawMatch match, RawPlayer player)> games)
    {
        return games
            .GroupBy(x => x.player.ChampionName)
            .Select(grp => new ChampionStat
            {
                Champion = grp.Key,
                Games    = grp.Count(),
                Wins     = grp.Count(x => x.player.Win),
                WinRate  = Math.Round(grp.Count(x => x.player.Win) / (double)grp.Count() * 100, 1),
            })
            .OrderByDescending(c => c.Games)
            .ToList();
    }

    // Enriches AvgStats with timeline averages computed from game log entries.
    // Only games with a non-null Timeline are included in the average.
    public static void EnrichWithTimelineAverages(AvgStats stats, List<GameLogEntry> gameLog)
    {
        var withTimeline = gameLog.Where(g => g.Timeline != null).ToList();
        if (!withTimeline.Any()) return;

        double Avg(Func<TimelineSnapshot, double> fn) =>
            Math.Round(withTimeline.Average(g => fn(g.Timeline!)), 2);

        stats.CsAt10   = Avg(t => t.CsAt10);
        stats.CsAt15   = Avg(t => t.CsAt15);
        stats.CsAt20   = Avg(t => t.CsAt20);
        stats.CsAt25   = Avg(t => t.CsAt25);
        stats.GoldAt10 = Avg(t => t.GoldAt10);
        stats.GoldAt15 = Avg(t => t.GoldAt15);
        stats.GoldAt20 = Avg(t => t.GoldAt20);
        stats.GoldAt25 = Avg(t => t.GoldAt25);
    }

    #endregion
}