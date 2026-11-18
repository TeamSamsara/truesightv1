// TrueSight.DataPipeline
// IO/FileStore.cs
// @version 1.0.0
//
// All JSON read and write operations live here.
// No other file ever calls File.ReadAllText or File.WriteAllText directly.
// Single place for serialization settings, error handling, and directory creation.

using Newtonsoft.Json;

namespace TrueSight.DataPipeline.IO;

public static class FileStore
{
    #region Settings

    private static readonly JsonSerializerSettings WriteSettings = new()
    {
        Formatting        = Formatting.Indented,
        NullValueHandling = NullValueHandling.Ignore,
    };

    private static readonly JsonSerializerSettings ReadSettings = new()
    {
        NullValueHandling = NullValueHandling.Ignore,
    };

    #endregion

    #region Read

    // Reads and deserializes a JSON file from disk.
    // Returns null if the file does not exist or deserialization fails.
    public static T? Read<T>(string path) where T : class
    {
        if (!File.Exists(path)) return null;

        try
        {
            var json = File.ReadAllText(path);
            return JsonConvert.DeserializeObject<T>(json, ReadSettings);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Read failed: {path} — {ex.Message}");
            return null;
        }
    }

    // Reads raw JSON string from disk without deserializing.
    // Returns null if the file does not exist.
    public static string? ReadRaw(string path)
    {
        if (!File.Exists(path)) return null;

        try
        {
            return File.ReadAllText(path);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] ReadRaw failed: {path} — {ex.Message}");
            return null;
        }
    }

    #endregion

    #region Write

    // Serializes and writes an object to disk as JSON.
    // Creates the directory if it does not exist.
    // Returns true on success.
    public static bool Write<T>(string path, T data) where T : class
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, JsonConvert.SerializeObject(data, WriteSettings));
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  [ERROR] Write failed: {path} — {ex.Message}");
            return false;
        }
    }

    #endregion

    #region Helpers

    // Returns true if a file exists at the given path.
    public static bool Exists(string path) =>
        File.Exists(path);

    // Returns all files matching a pattern in a directory.
    // Returns empty list if the directory does not exist.
    public static List<string> GetFiles(string directory, string pattern = "*")
    {
        if (!Directory.Exists(directory)) return new List<string>();
        return Directory.GetFiles(directory, pattern).ToList();
    }

    // Returns all subdirectory names inside a directory.
    // Returns empty list if the directory does not exist.
    public static List<string> GetDirectories(string directory)
    {
        if (!Directory.Exists(directory)) return new List<string>();
        return Directory.GetDirectories(directory)
            .Select(Path.GetFileName)
            .Where(n => n != null)
            .Cast<string>()
            .ToList();
    }

    #endregion
}