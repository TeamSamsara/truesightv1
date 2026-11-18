// TrueSight.DataPipeline
// Parsers/MatchParser.cs
// @version 1.0.0
//
// Parses raw Riot match JSON into a RawMatch model.
// Computes kill participation post-parse once all team kills are known.
// No I/O, no API calls — input in, model out.

using Newtonsoft.Json.Linq;
using TrueSight.DataPipeline.Models;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.Parsers;

public static class MatchParser
{
    #region Public API

    // Parses a raw Riot match API response into a RawMatch model.
    // Returns null if the match is a remade or forfeit under 5 minutes.
    public static RawMatch? Parse(string matchId, JObject raw)
    {
        var info = raw["info"];
        if (info == null) return null;

        var duration = info["gameDuration"]?.Value<long>() ?? 0;

        if (duration < 300)
        {
            Console.WriteLine($"  [SKIP] {matchId} — {duration}s, likely remade or forfeit");
            return null;
        }

        var match = new RawMatch
        {
            MatchId = matchId,
            Info    = new RawMatchInfo
            {
                GameVersion      = info["gameVersion"]?.Value<string>()    ?? "",
                GameDuration     = duration,
                GameEndTimestamp = info["gameEndTimestamp"]?.Value<long>() ?? 0,
                Teams            = ParseTeams(info["teams"] as JArray      ?? new JArray()),
                Participants     = ParseParticipants(info["participants"] as JArray ?? new JArray()),
            }
        };

        ComputeKillParticipation(match);

        return match;
    }

    #endregion

    #region Teams

    private static List<RawTeam> ParseTeams(JArray raw)
    {
        var teams = new List<RawTeam>();

        foreach (var t in raw)
        {
            teams.Add(new RawTeam
            {
                TeamId     = t["teamId"]?.Value<int>()  ?? 0,
                Win        = t["win"]?.Value<bool>()    ?? false,
                Objectives = ParseObjectives(t["objectives"]),
            });
        }

        return teams;
    }

    private static RawObjectives ParseObjectives(JToken? raw)
    {
        if (raw == null) return new RawObjectives();

        return new RawObjectives
        {
            Baron      = ParseObjectiveStat(raw["baron"]),
            Dragon     = ParseObjectiveStat(raw["dragon"]),
            Tower      = ParseObjectiveStat(raw["tower"]),
            Inhibitor  = ParseObjectiveStat(raw["inhibitor"]),
            RiftHerald = ParseObjectiveStat(raw["riftHerald"]),
        };
    }

    private static RawObjectiveStat ParseObjectiveStat(JToken? raw) => new()
    {
        First = raw?["first"]?.Value<bool>() ?? false,
        Kills = raw?["kills"]?.Value<int>()  ?? 0,
    };

    #endregion

    #region Participants

    private static List<RawPlayer> ParseParticipants(JArray raw)
    {
        var players = new List<RawPlayer>();

        foreach (var p in raw)
        {
            players.Add(new RawPlayer
            {
                RiotIdGameName  = p["riotIdGameName"]?.Value<string>()  ?? p["summonerName"]?.Value<string>() ?? "",
                RiotIdTagline   = p["riotIdTagline"]?.Value<string>()   ?? "",
                SummonerName    = p["summonerName"]?.Value<string>()    ?? "",
                ChampionName    = p["championName"]?.Value<string>()    ?? "",
                TeamPosition    = p["teamPosition"]?.Value<string>()    ?? "",
                TeamId          = p["teamId"]?.Value<int>()             ?? 0,
                Win             = p["win"]?.Value<bool>()               ?? false,

                Kills           = p["kills"]?.Value<int>()              ?? 0,
                Deaths          = p["deaths"]?.Value<int>()             ?? 0,
                Assists         = p["assists"]?.Value<int>()            ?? 0,

                TotalMinionsKilled        = p["totalMinionsKilled"]?.Value<int>()        ?? 0,
                NeutralMinionsKilled      = p["neutralMinionsKilled"]?.Value<int>()      ?? 0,
                GoldEarned                = p["goldEarned"]?.Value<int>()                ?? 0,

                TotalDamageDealtToChampions = p["totalDamageDealtToChampions"]?.Value<int>() ?? 0,
                TotalDamageTaken            = p["totalDamageTaken"]?.Value<int>()            ?? 0,
                DamageSelfMitigated         = p["damageSelfMitigated"]?.Value<int>()         ?? 0,
                DamageDealtToObjectives     = p["damageDealtToObjectives"]?.Value<int>()     ?? 0,

                VisionScore             = p["visionScore"]?.Value<int>()             ?? 0,
                WardsPlaced             = p["wardsPlaced"]?.Value<int>()             ?? 0,
                WardsKilled             = p["wardsKilled"]?.Value<int>()             ?? 0,
                VisionWardsBoughtInGame = p["visionWardsBoughtInGame"]?.Value<int>() ?? 0,
                TimeCCingOthers         = p["timeCCingOthers"]?.Value<double>()      ?? 0,
            });
        }

        return players;
    }

    #endregion

    #region Kill Participation

    // Computed post-parse once all team kills are known.
    // TeamId is authoritative — never derive team from Win/Loss.
    private static void ComputeKillParticipation(RawMatch match)
    {
        var blueKills = match.Info.Participants
            .Where(p => p.TeamId == 100)
            .Sum(p => p.Kills);

        var redKills = match.Info.Participants
            .Where(p => p.TeamId == 200)
            .Sum(p => p.Kills);

        foreach (var p in match.Info.Participants)
        {
            var teamKills = p.TeamId == 100 ? blueKills : redKills;
            p.KillParticipation = teamKills > 0
                ? Math.Round((p.Kills + p.Assists) / (double)teamKills * 100, 1)
                : 0;
        }
    }

    #endregion
}