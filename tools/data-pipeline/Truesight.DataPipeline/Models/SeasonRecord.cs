// TrueSight.DataPipeline
// Models/SeasonRecord.cs
// @version 1.0.0
//
// One season across all splits for a given league.

namespace TrueSight.DataPipeline.Models;

public class SeasonRecord
{
    public string League { get; set; } = "";
    public string Season { get; set; } = "";

    // Keyed by split key e.g. "ACL_SUMMER_2025"
    public Dictionary<string, SplitRecord> Splits { get; set; } = new();
}