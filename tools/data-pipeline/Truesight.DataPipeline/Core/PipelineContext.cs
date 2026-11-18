// TrueSight.DataPipeline
// PipelineContext.cs
// @version 1.0.0

// Identifies which league/season/split/ a pipeline operation is running against
// Passed trough every modes so all files, folders and records are stamped
// Single source of truth for split identity — never derive league, season, split from filenames or folder names

namespace TrueSight.DataPipeline.Core;

public class PipelineContext
{
    #region Properties
    public string League {get;}
    public string Season {get;}
    public string Split {get;}
    #endregion

    #region Derived Properties

    // Human readable label - e.g. "ACL Summer 2025"
    public string Label => $"{League} {Split} {Season}";

    // Folder name for match input - match the convention 
    public string SplitFolder => $"{League}_{Season}_{Split}";

    // Split key used as Firestore document ID and in player records
    public string SplitKey => $"{League}_{Split.ToUpper()}_{Season}";

    // Season key used to group split in player profiles
    public string SeasonKey => $"{League}_{Season}";

    // Dataset filename without extension — e.g. "ACL_FALL_2025_DATASET"
    public string DatasetFileName => $"{League}_{Split.ToUpper()}_{Season}_DATASET";
    #endregion

    #region Constructor
    public PipelineContext (string league, string season, string split)
    {
        League = league.ToUpper().Trim();
        Season = season.Trim();
        Split = ToTitleCase(split.Trim());
    }
    #endregion

    #region Static Factory
    // Parse a split folder name back into a PipelineContext
    // Expects format : {LEAGUE}_{SEASON}_{Split} — e.g. "ACL_2025_Summer"
    // Returns null if the folder name does not match the expected format.

    public static PipelineContext? FromFolderName(string foldername)
    {
        var parts = foldername.Split('_');
        if (parts.Length != 3) return null;

        return new PipelineContext(
            league : parts[0],
            season: parts[1],
            split: parts[2]
        );
    }
    #endregion

    #region Helper
    private string ToTitleCase(string value) => 
    string.IsNullOrEmpty(value)
    ? value
    : char.ToUpper(value[0]) + value[1..].ToLower();
    #endregion
}