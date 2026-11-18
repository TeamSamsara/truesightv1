// TrueSight.DataPipeline
// Pipeline/DatasetNormalizer.cs
// @version 1.0.0
//
// Mode 4 — Normalizes aggregate league dataset files to the canonical schema.
// Reads from input/split/{splitId}_DATASET.json
// Writes normalized output to output/datasets/{splitId}_DATASET.json
// Drops fields not in the canonical schema — rating, record_str, avg_per_minute kills/deaths/assists, delta cs_per_min.
// TeamName enrichment — matches player RiotId against compiled player profiles to fill TeamName in SplitRecords.

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.IO;
using TrueSight.DataPipeline.Parsers;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.Pipeline;

public static class DatasetNormalizer
{
    #region Public API

    public static void Run(PipelineContext context)
    {
        ConsoleMenu.RenderSectionHeader($"Normalize — {context.Label}");

        var inputPath  = AppConfig.GetDatasetFilePath(context.DatasetFileName);
        var outputPath = Path.Combine(AppConfig.DatasetsOutputDir, $"{context.DatasetFileName}.json");

        var raw = FileStore.ReadRaw(inputPath);
        if (raw == null)
        {
            ConsoleMenu.RenderError($"Dataset file not found: {inputPath}");
            return;
        }

        JObject root;
        try
        {
            root = JObject.Parse(raw);
        }
        catch (Exception ex)
        {
            ConsoleMenu.RenderError($"Failed to parse dataset JSON — {ex.Message}");
            return;
        }

        var players  = root["players"] as JArray ?? new JArray();
        var entries  = DatasetParser.Parse(raw);

        ConsoleMenu.RenderInfo($"Parsed {entries.Count} players");

        var normalized = BuildNormalizedOutput(context, entries, players);

        if (!FileStore.Write(outputPath, normalized))
        {
            ConsoleMenu.RenderError($"Failed to write output: {outputPath}");
            return;
        }

        EnrichPlayerTeamNames(context, entries);

        ConsoleMenu.RenderSuccess($"Normalized dataset written to {outputPath}");
        ConsoleMenu.RenderDone();
    }

    #endregion

    #region Private Helpers

    // Builds the canonical normalized output object.
    // Drops: rating, record_str, avg_per_minute kills/deaths/assists, delta cs_per_min.
    private static object BuildNormalizedOutput(
        PipelineContext      context,
        List<DatasetEntry>   entries,
        JArray               rawPlayers)
    {
        var normalizedPlayers = entries.Select((entry, i) =>
        {
            var raw = rawPlayers[i] as JObject ?? new JObject();
            return BuildNormalizedPlayer(entry, raw);
        }).ToList();

        return new
        {
            league       = context.League,
            season       = context.Season,
            split        = context.Split,
            splitKey     = context.SplitKey,
            generated    = DateTimeHelper.UtcNowString(),
            player_count = normalizedPlayers.Count,
            players      = normalizedPlayers,
        };
    }

    private static object BuildNormalizedPlayer(DatasetEntry entry, JObject raw)
    {
        return new
        {
            player = entry.Player,
            team   = entry.Team,
            role   = entry.Role,
            games  = entry.Games,
            record = new
            {
                wins   = entry.Wins,
                losses = entry.Losses,
            },
            win_rate = entry.WinRate,

            avg_per_game = new
            {
                kills             = entry.Kills,
                deaths            = entry.Deaths,
                assists           = entry.Assists,
                kda               = entry.Kda,
                cs                = entry.Cs,
                gold              = entry.Gold,
                kill_participation = entry.KillParticipation,
                vision_score      = entry.VisionScore,
                cc_score          = entry.CcScore,
                dmg_dealt         = entry.DmgDealt,
                dmg_taken         = entry.DmgTaken,
                dmg_mitigated     = entry.DmgMitigated,
                dmg_objectives    = entry.DmgObjectives,

                // Timeline averages — null if not present in source
                cs_at_10   = entry.CsAt10,
                cs_at_15   = entry.CsAt15,
                cs_at_20   = entry.CsAt20,
                cs_at_25   = entry.CsAt25,
                gold_at_10 = entry.GoldAt10,
                gold_at_15 = entry.GoldAt15,
                gold_at_20 = entry.GoldAt20,
                gold_at_25 = entry.GoldAt25,
            },

            // Drops kills, deaths, assists per minute — no current or planned use
            avg_per_minute = new
            {
                cs             = entry.CsPerMin,
                gold           = entry.GoldPerMin,
                dmg_dealt      = entry.DmgDealtPerMin,
                dmg_taken      = entry.DmgTakenPerMin,
                dmg_mitigated  = entry.DmgMitigatedPerMin,
                dmg_objectives = entry.DmgObjectivesPerMin,
                vision_score   = entry.VisionScorePerMin,
                cc_score       = entry.CcScorePerMin,
            },

            // Drops cs_per_min — derivable from csm, redundant
            delta_vs_opponent = new
            {
                cs        = entry.CsDelta,
                gold      = entry.GoldDelta,
                cs_at_10  = entry.CsDeltaAt10,
                cs_at_15  = entry.CsDeltaAt15,
                cs_at_20  = entry.CsDeltaAt20,
                cs_at_25  = entry.CsDeltaAt25,
                gold_at_10 = entry.GoldDeltaAt10,
                gold_at_15 = entry.GoldDeltaAt15,
                gold_at_20 = entry.GoldDeltaAt20,
                gold_at_25 = entry.GoldDeltaAt25,
            },
        };
    }

    // Enriches TeamName in compiled player profiles using the dataset team field.
    // Matches by normalized RiotId against the dataset player field.
    // Only fills empty TeamName fields — never overwrites an existing value.
    private static void EnrichPlayerTeamNames(
        PipelineContext    context,
        List<DatasetEntry> entries)
    {
        if (!entries.Any()) return;

        ConsoleMenu.RenderInfo("Enriching player profiles with team names...");

        var teamLookup = entries
            .Where(e => !string.IsNullOrEmpty(e.Player) && !string.IsNullOrEmpty(e.Team))
            .ToDictionary(
                e => e.Player.ToLower().Trim(),
                e => e.Team,
                StringComparer.OrdinalIgnoreCase
            );

        var profiles = PlayerRepository.LoadAll();
        int enriched = 0;

        foreach (var profile in profiles)
        {
            if (!profile.Seasons.TryGetValue(context.SeasonKey, out var season)) continue;
            if (!season.Splits.TryGetValue(context.SplitKey, out var split))     continue;
            if (!string.IsNullOrEmpty(split.TeamName))                            continue;

            var normalizedId = profile.RiotId.ToLower().Trim();
            if (!teamLookup.TryGetValue(normalizedId, out var teamName))          continue;

            split.TeamName = teamName;

            if (PlayerRepository.Save(profile))
                enriched++;
        }

        ConsoleMenu.RenderSuccess($"Enriched team names for {enriched} players");
    }

    #endregion
}