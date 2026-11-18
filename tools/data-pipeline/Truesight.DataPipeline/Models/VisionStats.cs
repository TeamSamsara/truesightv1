// TrueSight.DataPipeline
// Models/VisionStats.cs
// @version 1.0.0
//
// Vision-specific averaged stats for a split.

namespace TrueSight.DataPipeline.Models;

public class VisionStats
{
    public double AvgVisionScore        { get; set; }
    public double AvgWardsPlaced        { get; set; }
    public double AvgWardsKilled        { get; set; }
    public double AvgControlWardsBought { get; set; }
}