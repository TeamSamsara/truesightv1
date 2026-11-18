// TrueSight.DataPipeline
// Utils/RiotIdHelper.cs
// @version 1.0.0
//
// All Riot ID manipulation lives here.
// No other file formats, parses, or normalizes Riot IDs directly.

namespace TrueSight.DataPipeline.Utils;

public static class RiotIdHelper
{
    // Normalizes a Riot ID to lowercase for consistent Firestore keying
    // e.g. "Ablazeolive#NA1" → "ablazeolive#na1"
    public static string Normalize(string riotId) =>
        riotId.Trim().ToLower();

    // Builds a Riot ID from game name and tagline
    // e.g. "Ablazeolive" + "NA1" → "Ablazeolive#NA1"
    public static string Build(string gameName, string tagline) =>
        string.IsNullOrEmpty(tagline) ? gameName : $"{gameName}#{tagline}";

    // Builds a Riot ID from a RawPlayer — prefers RiotIdGameName over SummonerName
    public static string FromRawPlayer(string riotIdGameName, string riotIdTagline, string summonerName)
    {
        var name = !string.IsNullOrEmpty(riotIdGameName) ? riotIdGameName : summonerName;
        return Build(name, riotIdTagline);
    }

    // Converts a Riot ID to a safe filename
    // e.g. "Ablazeolive#NA1" → "Ablazeolive_NA1.json"
    public static string ToSafeFileName(string riotId)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var safe    = string.Concat(riotId.Select(c =>
            c == '#'              ? '_'  :
            invalid.Contains(c)  ? '-'  :
            c));
        return $"{safe}.json";
    }

    // Parses a safe filename back into a Riot ID
    // e.g. "Ablazeolive_NA1.json" → "Ablazeolive#NA1"
    public static string FromSafeFileName(string fileName)
    {
        var withoutExt = Path.GetFileNameWithoutExtension(fileName);
        var lastUnderscore = withoutExt.LastIndexOf('_');
        if (lastUnderscore < 0) return withoutExt;
        return withoutExt[..lastUnderscore] + "#" + withoutExt[(lastUnderscore + 1)..];
    }

    // Returns true if a string looks like a valid Riot ID
    public static bool IsValid(string riotId) =>
        !string.IsNullOrWhiteSpace(riotId) && riotId.Contains('#');
}