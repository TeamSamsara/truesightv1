// TrueSight.DataPipeline
// Parsers/TimelineParser.cs
// @version 1.0.1
//
// Parses raw Riot timeline JSON into a RawTimeline model.
// Extracts only the frame data needed — CS and gold per participant
// at minutes 10, 15, 20, 25. Everything else in the timeline is ignored.
// No I/O, no API calls — input in, model out.

using Newtonsoft.Json.Linq;
using TrueSight.DataPipeline.Models;

namespace TrueSight.DataPipeline.Parsers;

public static class TimelineParser
{
    #region Constants

    // Target timestamps in milliseconds
    private const int Ms10 = 600_000;
    private const int Ms15 = 900_000;
    private const int Ms20 = 1_200_000;
    private const int Ms25 = 1_500_000;

    // Tolerance window — accept frames within 65 seconds of target
    private const int ToleranceMs = 65_000;

    #endregion

    #region Public API

    // Parses a raw Riot timeline API response into a RawTimeline model.
    // Returns null if the response cannot be parsed.
    public static RawTimeline? Parse(string matchId, JObject raw)
    {
        var info = raw["info"];
        if (info == null) return null;

        var frames = ParseFrames(info["frames"] as JArray ?? new JArray());

        return new RawTimeline
        {
            MatchId = matchId,
            Info    = new RawTimelineInfo
            {
                FrameInterval = info["frameInterval"]?.Value<int>() ?? 0,
                Frames        = frames,
            }
        };
    }

    // Extracts CS and gold snapshots per participant at target minutes.
    // Returns a dictionary keyed by participantId (1-10).
    // Returns empty dictionary if no usable frames found.
    public static Dictionary<int, TimelineSnapshot> ExtractSnapshots(RawTimeline timeline)
    {
        var snapshots = new Dictionary<int, TimelineSnapshot>();

        var at10 = FindClosestFrame(timeline, Ms10);
        var at15 = FindClosestFrame(timeline, Ms15);
        var at20 = FindClosestFrame(timeline, Ms20);
        var at25 = FindClosestFrame(timeline, Ms25);

        // Collect all participant IDs from available frames as strings
        var participantIds = new HashSet<string>();
        foreach (var frame in new[] { at10, at15, at20, at25 })
        {
            if (frame != null)
                foreach (var id in frame.ParticipantFrames.Keys)
                    participantIds.Add(id);
        }

        foreach (var id in participantIds)
        {
            // Parse string key to int for the output dictionary
            if (!int.TryParse(id, out int intId)) continue;

            snapshots[intId] = new TimelineSnapshot
            {
                CsAt10   = GetCs(at10,   id),
                CsAt15   = GetCs(at15,   id),
                CsAt20   = GetCs(at20,   id),
                CsAt25   = GetCs(at25,   id),
                GoldAt10 = GetGold(at10, id),
                GoldAt15 = GetGold(at15, id),
                GoldAt20 = GetGold(at20, id),
                GoldAt25 = GetGold(at25, id),
            };
        }

        return snapshots;
    }

    #endregion

    #region Private Helpers

    private static List<RawTimelineFrame> ParseFrames(JArray raw)
    {
        var frames = new List<RawTimelineFrame>();

        foreach (var f in raw)
        {
            var participantFrames = new Dictionary<string, RawParticipantFrame>();
            var pfRaw = f["participantFrames"] as JObject;

            if (pfRaw != null)
            {
                foreach (var prop in pfRaw.Properties())
                {
                    participantFrames[prop.Name] = new RawParticipantFrame
                    {
                        ParticipantId       = prop.Value["participantId"]?.Value<int>()       ?? 0,
                        TotalGold           = prop.Value["totalGold"]?.Value<int>()           ?? 0,
                        MinionsKilled       = prop.Value["minionsKilled"]?.Value<int>()       ?? 0,
                        JungleMinionsKilled = prop.Value["jungleMinionsKilled"]?.Value<int>() ?? 0,
                    };
                }
            }

            frames.Add(new RawTimelineFrame
            {
                Timestamp         = f["timestamp"]?.Value<int>() ?? 0,
                ParticipantFrames = participantFrames,
            });
        }

        return frames;
    }

    // Finds the frame closest to the target timestamp within tolerance.
    // Returns null if no frame is within the tolerance window.
    private static RawTimelineFrame? FindClosestFrame(RawTimeline timeline, int targetMs)
    {
        return timeline.Info.Frames
            .Where(f => Math.Abs(f.Timestamp - targetMs) <= ToleranceMs)
            .OrderBy(f => Math.Abs(f.Timestamp - targetMs))
            .FirstOrDefault();
    }

    private static int GetCs(RawTimelineFrame? frame, string participantId)
    {
        if (frame == null) return 0;
        if (!frame.ParticipantFrames.TryGetValue(participantId, out var pf)) return 0;
        return pf.MinionsKilled + pf.JungleMinionsKilled;
    }

    private static int GetGold(RawTimelineFrame? frame, string participantId)
    {
        if (frame == null) return 0;
        if (!frame.ParticipantFrames.TryGetValue(participantId, out var pf)) return 0;
        return pf.TotalGold;
    }

    #endregion
}