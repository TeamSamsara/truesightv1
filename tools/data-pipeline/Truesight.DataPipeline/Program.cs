// TrueSight.DataPipeline
// Program.cs
// @version 1.0.1
//
// Entry point — loads config, shows menu, delegates to the selected pipeline mode.
// No business logic lives here.

using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.Pipeline;

var config = PipelineConfig.Load();
if (config == null) return;

if (!config.IsValid()) return;

// Temporary debug — remove after confirming key is correct
Console.WriteLine($"  [DEBUG] API key loaded: {config.RiotApiKey[..8]}...");
Console.WriteLine($"  [DEBUG] Config path: {Path.Combine(AppContext.BaseDirectory, AppConfig.ConfigFile)}");

// Set Google credentials env var before any Firestore calls
Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", config.GoogleCredentialsPath);

while (true)
{
    var mode = ConsoleMenu.PromptMainMenu();

    if (mode == null)
    {
        ConsoleMenu.RenderError("Invalid selection — enter 1 through 5.");
        continue;
    }

    switch (mode)
    {
        case PipelineMode.Fetch:
            var fetchContext = ConsoleMenu.PromptManualContext();
            if (fetchContext != null)
                await Fetcher.RunAsync(fetchContext, config.RiotApiKey);
            break;

        case PipelineMode.Backfill:
            var backfillContext = ConsoleMenu.PromptSplitSelection("Select split to backfill:");
            if (backfillContext != null)
                await TimelineBackfiller.RunAsync(backfillContext, config.RiotApiKey);
            break;

        case PipelineMode.Compile:
            var compileContext = ConsoleMenu.PromptSplitSelection("Select split to compile:");
            if (compileContext != null)
                Compiler.Run(compileContext);
            break;

        case PipelineMode.Normalize:
            var normalizeContext = ConsoleMenu.PromptSplitSelection("Select split to normalize:");
            if (normalizeContext != null)
                DatasetNormalizer.Run(normalizeContext);
            break;

        case PipelineMode.Upload:
            await FirestoreUploader.RunAsync(config.FirebaseProjectId);
            break;
    }

    Console.WriteLine();
    if (!ConsoleMenu.PromptConfirm("Run another mode?")) break;
}