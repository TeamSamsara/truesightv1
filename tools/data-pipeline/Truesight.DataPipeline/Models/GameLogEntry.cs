// TrueSight.DataPipeline
// Models/GameLogEntry.cs
// @version 1.0.0
//
// Individual game record for a player within a split.
// Timeline fields (CsAt10, GoldAt15 etc) are nullable —
// null means timeline was not available for this game, not zero.

namespace TrueSight.DataPipeline.Models;

public class GameLogEntry
{
    // Context
    public string League { get; set; } = "";
    public string Season { get; set; } = "";
    public string Split  { get; set; } = "";

    // Match identity
    public string MatchId      { get; set; } = "";
    public string GameDate     { get; set; } = "";
    public string Patch        { get; set; } = "";
    public int    GameDuration { get; set; }

    // TeamId is authoritative for opponent resolution — 100 = blue, 200 = red
    public int    TeamId   { get; set; }
    public string Champion { get; set; } = "";
    public bool   Win      { get; set; }

    // Combat stats
    public int    Kills   { get; set; }
    public int    Deaths  { get; set; }
    public int    Assists { get; set; }
    public double Kda     { get; set; }

    // Farming
    public int    Cs   { get; set; }
    public double Csm  { get; set; }
    public int    Gold { get; set; }
    public double Goldm { get; set; }

    // Damage
    public int DmgDealt      { get; set; }
    public int DmgTaken      { get; set; }
    public int DmgMitigated  { get; set; }
    public int DmgObjectives { get; set; }

    // Vision
    public int    VisionScore  { get; set; }
    public int    WardsPlaced  { get; set; }
    public int    WardsKilled  { get; set; }
    public int    ControlWards { get; set; }
    public double CcScore      { get; set; }

    public double KillParticipation { get; set; }

    // Timeline snapshots — null if timeline was not fetched for this game
    public TimelineSnapshot? Timeline { get; set; }
}