// TrueSight.DataPipeline
// Models/PerMinStats.cs
// @version 1.0.0
//
// Per-minute averaged stats for a split.
// Weighted by actual game duration — not a simple average.

namespace TrueSight.DataPipeline.Models;

public class PerMinStats
{
    public double Cs            { get; set; }
    public double Gold          { get; set; }
    public double DmgDealt      { get; set; }
    public double DmgTaken      { get; set; }
    public double DmgMitigated  { get; set; }
    public double DmgObjectives { get; set; }
    public double VisionScore   { get; set; }
    public double CcScore       { get; set; }
}