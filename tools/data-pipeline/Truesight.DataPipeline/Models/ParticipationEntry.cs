// TrueSight.DataPipeline
// Models/ParticipationEntry.cs
// @version 1.0.0
//
// One game's SOS participation record.
// Opponent is the lane opponent's RiotId — resolved during compile via TeamId.
// IsPlayoff and Conference are enriched later via schedule context.

namespace TrueSight.DataPipeline.Models;

public class ParticipationEntry
{
    public string MatchId    { get; set; } = "";
    public string Opponent   { get; set; } = "";
    public bool   IsPlayoff  { get; set; }
    public string Conference { get; set; } = "";
}