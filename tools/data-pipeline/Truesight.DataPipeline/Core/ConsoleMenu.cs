// TrueSight.DataPipeline
// ConsoleMenu.cs
// @version 1.0.0
//
// All user input and menu rendering lives here.
// Program.cs calls this exclusively for any interaction with the user.
// No other file ever reads from Console.ReadLine or renders menus.

namespace TrueSight.DataPipeline.Core;

public static class ConsoleMenu
{
    #region Main Menu

    // Renders the main mode selection menu and returns the selected mode.
    // Returns null if the input is invalid.
    public static PipelineMode? PromptMainMenu()
    {
        RenderHeader();

        Console.WriteLine("  Select a mode:\n");
        Console.WriteLine("  1  —  Fetch         Riot API → match + timeline files");
        Console.WriteLine("  2  —  Backfill       Fetch missing timelines for existing matches");
        Console.WriteLine("  3  —  Compile        Match files → per-player profiles");
        Console.WriteLine("  4  —  Normalize      Aggregate dataset → canonical schema");
        Console.WriteLine("  5  —  Upload         Local files → Firestore");
        Console.WriteLine();
        Console.Write("  > ");

        var input = Console.ReadLine()?.Trim();

        return input switch
        {
            "1" => PipelineMode.Fetch,
            "2" => PipelineMode.Backfill,
            "3" => PipelineMode.Compile,
            "4" => PipelineMode.Normalize,
            "5" => PipelineMode.Upload,
            _   => null,
        };
    }

    #endregion

    #region Context Prompts

    // Prompts the user to select a split from the available folders on disk.
    // Returns a PipelineContext for the selected split, or null if cancelled.
    public static PipelineContext? PromptSplitSelection(string label = "Select a split:")
    {
        var folders = DiscoverSplitFolders();

        if (folders.Count == 0)
        {
            RenderError("No split folders found in input/matches/");
            return null;
        }

        RenderSectionHeader(label);

        for (int i = 0; i < folders.Count; i++)
            Console.WriteLine($"  {i + 1}  —  {folders[i].Label}  ({folders[i].SplitFolder})");

        Console.WriteLine();
        Console.Write("  > ");

        var input = Console.ReadLine()?.Trim();

        if (!int.TryParse(input, out int choice) || choice < 1 || choice > folders.Count)
        {
            RenderError("Invalid selection.");
            return null;
        }

        return folders[choice - 1];
    }

    // Prompts the user to enter split details manually.
    // Used for Mode 1 (Fetch) where the split folder does not exist yet.
    public static PipelineContext? PromptManualContext()
    {
        RenderSectionHeader("Enter split details:");

        Console.Write("  League  (ACL / AVL / AML) : ");
        var league = Console.ReadLine()?.Trim().ToUpper();

        Console.Write("  Season  (e.g. 2025)        : ");
        var season = Console.ReadLine()?.Trim();

        Console.Write("  Split   (Fall/Summer/Spring): ");
        var split  = Console.ReadLine()?.Trim();

        if (string.IsNullOrEmpty(league) || string.IsNullOrEmpty(season) || string.IsNullOrEmpty(split))
        {
            RenderError("All fields are required.");
            return null;
        }

        return new PipelineContext(league, season, split);
    }

    // Prompts for a Riot API key — checks env var and api_key.txt first.
    // Returns null if no key is available.
    public static string? PromptApiKey()
    {
        var key = Environment.GetEnvironmentVariable("RIOT_API_KEY") ?? "";

        if (string.IsNullOrEmpty(key) && File.Exists(AppConfig.ApiKeyFile))
            key = File.ReadAllText(AppConfig.ApiKeyFile).Trim();

        if (!string.IsNullOrEmpty(key))
            return key;

        Console.Write("\n  Riot API key: ");
        key = Console.ReadLine()?.Trim();

        if (string.IsNullOrEmpty(key))
        {
            RenderError("No API key provided.");
            return null;
        }

        return key;
    }

    #endregion

    #region Confirmation Prompts

    // Prompts the user to confirm an action. Returns true if confirmed.
    public static bool PromptConfirm(string message)
    {
        Console.WriteLine();
        Console.Write($"  {message} [y/n]: ");
        var input = Console.ReadLine()?.Trim().ToLower();
        return input == "y";
    }

    #endregion

    #region Render Helpers

    public static void RenderHeader()
    {
        Console.Clear();
        Console.WriteLine();
        Console.WriteLine("  ╔══════════════════════════════════════╗");
        Console.WriteLine("  ║   TrueSight  —  Data Pipeline        ║");
        Console.WriteLine("  ╚══════════════════════════════════════╝");
        Console.WriteLine();
    }

    public static void RenderSectionHeader(string title)
    {
        Console.WriteLine();
        Console.WriteLine($"  ── {title}");
        Console.WriteLine();
    }

    public static void RenderSuccess(string message) =>
        Console.WriteLine($"  [OK]    {message}");

    public static void RenderError(string message) =>
        Console.WriteLine($"  [ERROR] {message}");

    public static void RenderWarning(string message) =>
        Console.WriteLine($"  [WARN]  {message}");

    public static void RenderInfo(string message) =>
        Console.WriteLine($"  [INFO]  {message}");

    public static void RenderProgress(int current, int total, string label) =>
        Console.Write($"\r  [{current}/{total}] {label}".PadRight(80));

    public static void RenderDone() =>
        Console.WriteLine("\n  Done.");

    #endregion

    #region Private Helpers

    private static List<PipelineContext> DiscoverSplitFolders()
    {
        if (!Directory.Exists(AppConfig.MatchesRoot))
            return new List<PipelineContext>();

        return Directory
            .GetDirectories(AppConfig.MatchesRoot)
            .Select(d => PipelineContext.FromFolderName(Path.GetFileName(d)))
            .Where(ctx => ctx != null)
            .Cast<PipelineContext>()
            .OrderBy(ctx => ctx.Season)
            .ThenBy(ctx => ctx.League)
            .ToList();
    }

    #endregion
}

// Pipeline operation modes
public enum PipelineMode
{
    Fetch     = 1,
    Backfill  = 2,
    Compile   = 3,
    Normalize = 4,
    Upload    = 5,
}