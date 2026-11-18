// TrueSight.DataPipeline
// Builders/OpponentResolver.cs
// @version 1.0.0
//
// Resolves lane opponents per game using TeamId as the authoritative source.
// TeamId is always reliable — Win/Loss is never used for team assignment.
// Builds a lookup used by SplitRecordBuilder to populate ParticipationEntry.Opponent.

using TrueSight.DataPipeline.Models;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.Builders;

public static class OpponentResolver
{
    #region Public API

    // Builds an opponent lookup from a list of matches.
    // Structure: matchId → role → (team100RiotId, team200RiotId)
    public static Dictionary<string, Dictionary<string, (string team100, string team200)>>
        BuildLookup(List<RawMatch> matches)
    {
        var lookup = new Dictionary<string, Dictionary<string, (string, string)>>();

        foreach (var match in matches)
        {
            var byRole = new Dictionary<string, (string team100, string team200)>();

            foreach (var player in match.Info.Participants)
            {
                var role   = player.TeamPosition;
                var riotId = RiotIdHelper.FromRawPlayer(
                    player.RiotIdGameName,
                    player.RiotIdTagline,
                    player.SummonerName
                );

                if (string.IsNullOrEmpty(role)) continue;

                if (!byRole.ContainsKey(role))
                    byRole[role] = ("", "");

                var entry = byRole[role];

                if (player.TeamId == 100)
                    byRole[role] = (riotId, entry.team200);
                else
                    byRole[role] = (entry.team100, riotId);
            }

            lookup[match.MatchId] = byRole;
        }

        return lookup;
    }

    // Resolves the lane opponent for a single game entry.
    // Returns empty string if opponent cannot be resolved.
    public static string Resolve(
        string matchId,
        string role,
        int    teamId,
        Dictionary<string, Dictionary<string, (string team100, string team200)>> lookup)
    {
        if (!lookup.TryGetValue(matchId, out var roleMap))    return "";
        if (!roleMap.TryGetValue(role, out var pair))         return "";

        // TeamId 100 = blue side → opponent is red side (team200)
        // TeamId 200 = red side  → opponent is blue side (team100)
        return teamId == 100 ? pair.team200 : pair.team100;
    }

    // Retroactively fills empty Opponent fields in an existing player profile.
    // Used during backfill — re-running compile patches old participation entries.
    public static void EnrichExistingParticipation(
        PlayerProfile profile,
        Dictionary<string, Dictionary<string, (string team100, string team200)>> lookup)
    {
        foreach (var season in profile.Seasons.Values)
        {
            foreach (var split in season.Splits.Values)
            {
                foreach (var entry in split.Participation)
                {
                    if (!string.IsNullOrEmpty(entry.Opponent)) continue;

                    // Find TeamId from GameLog — TeamId is authoritative
                    var gameLogEntry = split.GameLog
                        .FirstOrDefault(g => g.MatchId == entry.MatchId);

                    if (gameLogEntry == null) continue;

                    entry.Opponent = Resolve(
                        entry.MatchId,
                        split.Role,
                        gameLogEntry.TeamId,
                        lookup
                    );
                }
            }
        }
    }

    #endregion
}