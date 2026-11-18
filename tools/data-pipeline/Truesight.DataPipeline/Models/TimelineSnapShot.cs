// TrueSight.DataPipeline
// Models/TimelineSnapshot.cs
// @version 1.0.0
//
// Per-game laning phase snapshots extracted from the Riot timeline API.
// All fields are per-game values, not split averages.
// Critical for laning phase analysis and SOS delta calculations.

namespace TrueSight.DataPipeline.Models;

public class TimelineSnapshot
{
    // CS snapshots
    public int CsAt10 { get; set; }
    public int CsAt15 { get; set; }
    public int CsAt20 { get; set; }
    public int CsAt25 { get; set; }

    // Gold snapshots
    public int GoldAt10 { get; set; }
    public int GoldAt15 { get; set; }
    public int GoldAt20 { get; set; }
    public int GoldAt25 { get; set; }

    // CS delta vs lane opponent at each snapshot
    // Null until SOS opponent resolution is complete
    public int? CsDeltaAt10 { get; set; }
    public int? CsDeltaAt15 { get; set; }
    public int? CsDeltaAt20 { get; set; }
    public int? CsDeltaAt25 { get; set; }

    // Gold delta vs lane opponent at each snapshot
    public int? GoldDeltaAt10 { get; set; }
    public int? GoldDeltaAt15 { get; set; }
    public int? GoldDeltaAt20 { get; set; }
    public int? GoldDeltaAt25 { get; set; }
}