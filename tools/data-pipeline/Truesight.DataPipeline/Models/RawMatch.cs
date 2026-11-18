// TrueSight.DataPipeline
// Models/RawMatch.cs
// @version 1.0.0
//
// Riot API match response — deserialization target only.
// No logic. Fields map directly to the Riot Match V5 API response shape.

namespace TrueSight.DataPipeline.Models;

public class RawMatch
{
    public string   MatchId { get; set; } = "";
    public RawMatchInfo Info { get; set; } = new();
}

public class RawMatchInfo
{
    public string          GameVersion      { get; set; } = "";
    public long            GameDuration     { get; set; }
    public long            GameEndTimestamp { get; set; }
    public List<RawTeam>   Teams            { get; set; } = new();
    public List<RawPlayer> Participants     { get; set; } = new();
}

public class RawTeam
{
    public int          TeamId     { get; set; }
    public bool         Win        { get; set; }
    public RawObjectives Objectives { get; set; } = new();
}

public class RawObjectives
{
    public RawObjectiveStat Baron      { get; set; } = new();
    public RawObjectiveStat Dragon     { get; set; } = new();
    public RawObjectiveStat Tower      { get; set; } = new();
    public RawObjectiveStat Inhibitor  { get; set; } = new();
    public RawObjectiveStat RiftHerald { get; set; } = new();
}

public class RawObjectiveStat
{
    public bool First { get; set; }
    public int  Kills { get; set; }
}

public class RawPlayer
{
    public string RiotIdGameName  { get; set; } = "";
    public string RiotIdTagline   { get; set; } = "";
    public string SummonerName    { get; set; } = "";
    public string ChampionName    { get; set; } = "";
    public string TeamPosition    { get; set; } = "";
    public int    TeamId          { get; set; }
    public bool   Win             { get; set; }

    public int    Kills           { get; set; }
    public int    Deaths          { get; set; }
    public int    Assists         { get; set; }

    public int    TotalMinionsKilled        { get; set; }
    public int    NeutralMinionsKilled      { get; set; }
    public int    GoldEarned                { get; set; }

    public int    TotalDamageDealtToChampions { get; set; }
    public int    TotalDamageTaken            { get; set; }
    public int    DamageSelfMitigated         { get; set; }
    public int    DamageDealtToObjectives     { get; set; }

    public int    VisionScore               { get; set; }
    public int    WardsPlaced               { get; set; }
    public int    WardsKilled               { get; set; }
    public int    VisionWardsBoughtInGame   { get; set; }
    public double TimeCCingOthers           { get; set; }

    // Computed post-parse — not in raw API response
    public double KillParticipation { get; set; }
}