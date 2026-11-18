// TrueSight.DataPipeline
// Utils/DateTimeHelper.cs
// @version 1.0.0
//
// All timestamp and date conversions live here.
// No other file converts timestamps or formats dates directly.

namespace TrueSight.DataPipeline.Utils;

public static class DateTimeHelper
{
    // Converts a Unix millisecond timestamp to a date string
    // e.g. 1759884774956 → "2025-07-30"
    public static string FromUnixMillis(long unixMillis)
    {
        if (unixMillis <= 0) return "";
        return DateTimeOffset
            .FromUnixTimeMilliseconds(unixMillis)
            .ToString("yyyy-MM-dd");
    }

    // Extracts the major.minor patch string from a full game version
    // e.g. "15.19.715.1836" → "15.19"
    public static string ParsePatch(string gameVersion)
    {
        if (string.IsNullOrEmpty(gameVersion)) return "";
        var parts = gameVersion.Split('.');
        return parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : gameVersion;
    }

    // Returns a UTC timestamp string for embedding in output files
    public static string UtcNowString() =>
        DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") + " UTC";
}