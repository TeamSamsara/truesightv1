// TrueSight.DataPipeline
// Models/SplitRecord.cs
// @version 1.0.0
//
// One split's worth of compiled data for a player.
// TeamName is enriched via dataset cross-reference during normalize.
// Participation opponent fields are resolved during compile.

namespace TrueSight.DataPipeline.Models;

public class SplitRecord
{
    // Context
    public string League { get; set; } = "";
    public string Season { get; set; } = "";
    public string Split  { get; set; } = "";
    public string Label  { get; set; } = "";

    // Identity within this split
    // TeamName enriched via dataset cross-reference — empty until then
    public string TeamName { get; set; } = "";
    public string Role     { get; set; } = "";

    // Record
    public int    Games   { get; set; }
    public int    Wins    { get; set; }
    public int    Losses  { get; set; }
    public double WinRate { get; set; }

    // Aggregated stats
    public AvgStats    PerGame  { get; set; } = new();
    public PerMinStats PerMin   { get; set; } = new();
    public VisionStats Vision   { get; set; } = new();

    // Champion pool
    public List<ChampionStat> Champions { get; set; } = new();

    // Per-game log — includes timeline fields when available
    public List<GameLogEntry> GameLog { get; set; } = new();

    // SOS participation — lane opponent per game
    public List<ParticipationEntry> Participation { get; set; } = new();
}