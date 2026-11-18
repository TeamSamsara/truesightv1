// TrueSight.DataPipeline
// Parsers/DatasetParser.cs
// @version 1.0.0
//
// Parses aggregate league dataset JSON files into a flat list of dataset entries.
// Handles the canonical nested schema only — normalization happens before this step.
// No I/O, no API calls — input in, model out.

using Newtonsoft.Json.Linq;

namespace TrueSight.DataPipeline.Parsers;

public static class DatasetParser
{
    #region Public API

    // Parses an aggregate dataset JSON file into a list of player entries.
    // Returns empty list if the file cannot be parsed or has no players.
    public static List<DatasetEntry> Parse(string json)
    {
        var entries = new List<DatasetEntry>();

        try
        {
            var root    = JObject.Parse(json);
            var players = root["players"] as JArray ?? new JArray();

            foreach (var p in players)
                entries.Add(ParseEntry(p as JObject ?? new JObject()));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] DatasetParser failed — {ex.Message}");
        }

        return entries;
    }

    #endregion

    #region Private Helpers

    private static DatasetEntry ParseEntry(JObject p)
    {
        var perGame  = p["avg_per_game"]      as JObject ?? new JObject();
        var perMin   = p["avg_per_minute"]    as JObject ?? new JObject();
        var delta    = p["delta_vs_opponent"] as JObject ?? new JObject();
        var record   = p["record"]            as JObject ?? new JObject();

        return new DatasetEntry
        {
            Player   = p["player"]?.Value<string>()   ?? "",
            Team     = p["team"]?.Value<string>()     ?? "",
            Role     = p["role"]?.Value<string>()     ?? "",
            Games    = p["games"]?.Value<int>()       ?? 0,
            WinRate  = p["win_rate"]?.Value<double>() ?? 0,
            Wins     = record["wins"]?.Value<int>()   ?? 0,
            Losses   = record["losses"]?.Value<int>() ?? 0,

            // Per game
            Kills             = perGame["kills"]?.Value<double>()              ?? 0,
            Deaths            = perGame["deaths"]?.Value<double>()             ?? 0,
            Assists           = perGame["assists"]?.Value<double>()            ?? 0,
            Kda               = perGame["kda"]?.Value<double>()                ?? 0,
            Cs                = perGame["cs"]?.Value<double>()                 ?? 0,
            Gold              = perGame["gold"]?.Value<double>()               ?? 0,
            KillParticipation = perGame["kill_participation"]?.Value<double>() ?? 0,
            VisionScore       = perGame["vision_score"]?.Value<double>()       ?? 0,
            CcScore           = perGame["cc_score"]?.Value<double>()           ?? 0,
            DmgDealt          = perGame["dmg_dealt"]?.Value<double>()          ?? 0,
            DmgTaken          = perGame["dmg_taken"]?.Value<double>()          ?? 0,
            DmgMitigated      = perGame["dmg_mitigated"]?.Value<double>()      ?? 0,
            DmgObjectives     = perGame["dmg_objectives"]?.Value<double>()     ?? 0,

            // Timeline averages — null if not present
            CsAt10   = perGame["cs_at_10"]?.Value<double>(),
            CsAt15   = perGame["cs_at_15"]?.Value<double>(),
            CsAt20   = perGame["cs_at_20"]?.Value<double>(),
            CsAt25   = perGame["cs_at_25"]?.Value<double>(),
            GoldAt10 = perGame["gold_at_10"]?.Value<double>(),
            GoldAt15 = perGame["gold_at_15"]?.Value<double>(),
            GoldAt20 = perGame["gold_at_20"]?.Value<double>(),
            GoldAt25 = perGame["gold_at_25"]?.Value<double>(),

            // Per minute
            CsPerMin            = perMin["cs"]?.Value<double>()             ?? 0,
            GoldPerMin          = perMin["gold"]?.Value<double>()           ?? 0,
            DmgDealtPerMin      = perMin["dmg_dealt"]?.Value<double>()      ?? 0,
            DmgTakenPerMin      = perMin["dmg_taken"]?.Value<double>()      ?? 0,
            DmgMitigatedPerMin  = perMin["dmg_mitigated"]?.Value<double>()  ?? 0,
            DmgObjectivesPerMin = perMin["dmg_objectives"]?.Value<double>() ?? 0,
            VisionScorePerMin   = perMin["vision_score"]?.Value<double>()   ?? 0,
            CcScorePerMin       = perMin["cc_score"]?.Value<double>()       ?? 0,

            // Delta vs opponent
            CsDelta      = delta["cs"]?.Value<double>()       ?? 0,
            GoldDelta    = delta["gold"]?.Value<double>()     ?? 0,
            CsDeltaAt10  = delta["cs_at_10"]?.Value<double>() ?? 0,
            CsDeltaAt15  = delta["cs_at_15"]?.Value<double>() ?? 0,
            CsDeltaAt20  = delta["cs_at_20"]?.Value<double>() ?? 0,
            CsDeltaAt25  = delta["cs_at_25"]?.Value<double>() ?? 0,
            GoldDeltaAt10 = delta["gold_at_10"]?.Value<double>() ?? 0,
            GoldDeltaAt15 = delta["gold_at_15"]?.Value<double>() ?? 0,
            GoldDeltaAt20 = delta["gold_at_20"]?.Value<double>() ?? 0,
            GoldDeltaAt25 = delta["gold_at_25"]?.Value<double>() ?? 0,
        };
    }

    #endregion
}

// Flat model for a single player row in an aggregate dataset.
// Used only within the parser and normalizer — never stored directly.
public class DatasetEntry
{
    public string Player { get; set; } = "";
    public string Team   { get; set; } = "";
    public string Role   { get; set; } = "";
    public int    Games  { get; set; }
    public int    Wins   { get; set; }
    public int    Losses { get; set; }
    public double WinRate { get; set; }

    // Per game
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

    // Timeline averages — nullable, only present if dataset includes them
    public double? CsAt10   { get; set; }
    public double? CsAt15   { get; set; }
    public double? CsAt20   { get; set; }
    public double? CsAt25   { get; set; }
    public double? GoldAt10 { get; set; }
    public double? GoldAt15 { get; set; }
    public double? GoldAt20 { get; set; }
    public double? GoldAt25 { get; set; }

    // Per minute
    public double CsPerMin            { get; set; }
    public double GoldPerMin          { get; set; }
    public double DmgDealtPerMin      { get; set; }
    public double DmgTakenPerMin      { get; set; }
    public double DmgMitigatedPerMin  { get; set; }
    public double DmgObjectivesPerMin { get; set; }
    public double VisionScorePerMin   { get; set; }
    public double CcScorePerMin       { get; set; }

    // Delta vs opponent
    public double CsDelta      { get; set; }
    public double GoldDelta    { get; set; }
    public double CsDeltaAt10  { get; set; }
    public double CsDeltaAt15  { get; set; }
    public double CsDeltaAt20  { get; set; }
    public double CsDeltaAt25  { get; set; }
    public double GoldDeltaAt10 { get; set; }
    public double GoldDeltaAt15 { get; set; }
    public double GoldDeltaAt20 { get; set; }
    public double GoldDeltaAt25 { get; set; }
}