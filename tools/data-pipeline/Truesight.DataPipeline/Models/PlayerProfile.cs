// TrueSight.DataPipeline
// Models/PlayerProfile.cs
// @version 1.0.0
//
// Top-level player file — one per player across all splits and seasons.
// Grows each time a new split is compiled — never overwritten, only merged.

namespace TrueSight.DataPipeline.Models;

public class PlayerProfile
{
    public string RiotId   { get; set; } = "";
    public string GameName { get; set; } = "";
    public string Tag      { get; set; } = "";

    // Keyed by season key e.g. "ACL_2025"
    public Dictionary<string, SeasonRecord> Seasons { get; set; } = new();
}
