// TrueSight.DataPipeline
// Models/ChampionStat.cs
// @version 1.0.0
//
// Champion pool breakdown for a player within a split.

namespace TrueSight.DataPipeline.Models;

public class ChampionStat
{
    public string Champion { get; set; } = "";
    public int    Games    { get; set; }
    public int    Wins     { get; set; }
    public double WinRate  { get; set; }
}