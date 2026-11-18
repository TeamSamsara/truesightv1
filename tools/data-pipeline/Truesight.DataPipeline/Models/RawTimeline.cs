// TrueSight.DataPipeline
// Models/RawTimeline.cs
// @version 1.0.0
//
// Riot API timeline response — deserialization target only.
// We only extract the frame data we need — CS and gold per participant
// at minutes 10, 15, 20, 25. Everything else in the timeline is ignored.

namespace TrueSight.DataPipeline.Models;

public class RawTimeline
{
    public string          MatchId { get; set; } = "";
    public RawTimelineInfo Info    { get; set; } = new();
}

public class RawTimelineInfo
{
    public int                  FrameInterval { get; set; }
    public List<RawTimelineFrame> Frames      { get; set; } = new();
}

public class RawTimelineFrame
{
    public int                                     Timestamp         { get; set; }
    public Dictionary<string, RawParticipantFrame> ParticipantFrames { get; set; } = new();
}

public class RawParticipantFrame
{
    public int ParticipantId  { get; set; }
    public int TotalGold      { get; set; }
    public int MinionsKilled  { get; set; }
    public int JungleMinionsKilled { get; set; }
}