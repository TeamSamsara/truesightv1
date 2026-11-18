// TrueSight.DataPipeline
// IO/PlayerRepository.cs
// @version 1.0.0
//
// Loads and saves compiled player profile files.
// Handles cross-split accumulation — loads existing profile before merging new split data.
// No other file constructs player file paths directly.

using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.Models;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.IO;

public static class PlayerRepository
{
    #region Load

    // Loads an existing player profile from disk.
    // Returns null if the file does not exist — caller creates a new profile.
    public static PlayerProfile? Load(string riotId)
    {
        var path = AppConfig.GetPlayerFilePath(RiotIdHelper.ToSafeFileName(riotId));
        return FileStore.Read<PlayerProfile>(path);
    }

    // Loads all player profiles from the output directory.
    // Used by normalize and upload modes.
    public static List<PlayerProfile> LoadAll()
    {
        var files    = FileStore.GetFiles(AppConfig.PlayersOutputDir, "*.json");
        var profiles = new List<PlayerProfile>();

        foreach (var file in files)
        {
            var profile = FileStore.Read<PlayerProfile>(file);
            if (profile != null)
                profiles.Add(profile);
            else
                Console.WriteLine($"  [WARN] Could not load player profile: {Path.GetFileName(file)}");
        }

        return profiles;
    }

    #endregion

    #region Save

    // Saves a player profile to disk.
    // Creates the output directory if it does not exist.
    public static bool Save(PlayerProfile profile)
    {
        var path = AppConfig.GetPlayerFilePath(RiotIdHelper.ToSafeFileName(profile.RiotId));
        return FileStore.Write(path, profile);
    }

    #endregion

    #region Helpers

    // Returns true if a player profile already exists on disk.
    public static bool Exists(string riotId) =>
        FileStore.Exists(AppConfig.GetPlayerFilePath(RiotIdHelper.ToSafeFileName(riotId)));

    // Returns the total number of player profiles in the output directory.
    public static int Count() =>
        FileStore.GetFiles(AppConfig.PlayersOutputDir, "*.json").Count;

    #endregion
}