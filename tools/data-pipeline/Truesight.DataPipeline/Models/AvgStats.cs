// TrueSight.DataPipeline
// Models/AvgStats.cs
// @version 1.0.0
//
// Per-game averaged combat and efficiency stats for a split.

namespace TrueSight.DataPipeline.Models;

public class AvgStats
{
    public double Kills             { get; set; }
    public double Deaths            { get; set; }
    public double Assists           { get; set; }
    public double Kda               { get; set; }
    public double Cs                { get; set; }
    public double Gold              { get; set; }
    public double KillParticipation { get; set; }
    public double VisionScore       { get; set; }
    public double CcScore           { get; set; }
    public double DmgDealt          { get; set; }
    public double DmgTaken          { get; set; }
    public double DmgMitigated      { get; set; }
    public double DmgObjectives     { get; set; }

    // Timeline averages — null if timeline data is not available for this split
    public double? CsAt10  { get; set; }
    public double? CsAt15  { get; set; }
    public double? CsAt20  { get; set; }
    public double? CsAt25  { get; set; }
    public double? GoldAt10 { get; set; }
    public double? GoldAt15 { get; set; }
    public double? GoldAt20 { get; set; }
    public double? GoldAt25 { get; set; }
}