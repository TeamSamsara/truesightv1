// TrueSight.DataPipeline
// Pipeline/FirestoreUploader.cs
// @version 1.0.2
//
// Mode 5 — Uploads compiled player profiles and normalized datasets to Firestore.
// Player profiles → /playerMatchHistory/{riotId_normalized}
// Dataset files   → /datasets/{splitKey}
// Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a Firebase service account key.

using Google.Cloud.Firestore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TrueSight.DataPipeline.Core;
using TrueSight.DataPipeline.IO;
using TrueSight.DataPipeline.Models;
using TrueSight.DataPipeline.Utils;

namespace TrueSight.DataPipeline.Pipeline;

public static class FirestoreUploader
{
    #region Constants

    private const int BatchSize = 400;

    #endregion

    #region Public API

    public static async Task RunAsync(string projectId)
    {
        ConsoleMenu.RenderSectionHeader("Upload — Firestore");

        var db = CreateFirestoreClient(projectId);
        if (db == null) return;

        ConsoleMenu.RenderInfo("What would you like to upload?");
        Console.WriteLine("  1  —  Player profiles  (/playerMatchHistory)");
        Console.WriteLine("  2  —  Datasets          (/datasets)");
        Console.WriteLine("  3  —  Both");
        Console.WriteLine();
        Console.Write("  > ");

        var input = Console.ReadLine()?.Trim();

        switch (input)
        {
            case "1": await UploadPlayerProfilesAsync(db); break;
            case "2": await UploadDatasetsAsync(db);       break;
            case "3":
                await UploadPlayerProfilesAsync(db);
                await UploadDatasetsAsync(db);
                break;
            default:
                ConsoleMenu.RenderError("Invalid selection.");
                break;
        }

        ConsoleMenu.RenderDone();
    }

    #endregion

    #region Player Profiles

    private static async Task UploadPlayerProfilesAsync(FirestoreDb db)
    {
        ConsoleMenu.RenderSectionHeader("Uploading player profiles...");

        var profiles = PlayerRepository.LoadAll();
        if (profiles.Count == 0)
        {
            ConsoleMenu.RenderError("No player profiles found — run Compile first.");
            return;
        }

        ConsoleMenu.RenderInfo($"Found {profiles.Count} player profiles");

        int uploaded = 0;
        int failed   = 0;
        var batches  = profiles.Chunk(BatchSize).ToArray();

        for (int b = 0; b < batches.Length; b++)
        {
            var batch = db.StartBatch();

            foreach (var profile in batches[b])
            {
                var docId  = RiotIdHelper.Normalize(profile.RiotId);
                var docRef = db.Collection("playerMatchHistory").Document(docId);
                batch.Set(docRef, ConvertProfile(profile));
            }

            try
            {
                await batch.CommitAsync();
                uploaded += batches[b].Length;
                ConsoleMenu.RenderProgress(b + 1, batches.Length, $"batch {b + 1}/{batches.Length}");
            }
            catch (Exception ex)
            {
                ConsoleMenu.RenderError($"Batch {b + 1} failed — {ex.Message}");
                failed += batches[b].Length;
            }
        }

        Console.WriteLine();
        ConsoleMenu.RenderSuccess($"Uploaded: {uploaded}  Failed: {failed}");
    }

    #endregion

    #region Datasets

    private static async Task UploadDatasetsAsync(FirestoreDb db)
    {
        ConsoleMenu.RenderSectionHeader("Uploading datasets...");

        var files = FileStore.GetFiles(AppConfig.DatasetsOutputDir, "*_DATASET.json");
        if (files.Count == 0)
        {
            ConsoleMenu.RenderError("No dataset files found — run Normalize first.");
            return;
        }

        ConsoleMenu.RenderInfo($"Found {files.Count} dataset files");

        int uploaded = 0;
        int failed   = 0;

        for (int i = 0; i < files.Count; i++)
        {
            var file     = files[i];
            var fileName = Path.GetFileNameWithoutExtension(file);
            ConsoleMenu.RenderProgress(i + 1, files.Count, fileName);

            var raw = FileStore.ReadRaw(file);
            if (raw == null)
            {
                ConsoleMenu.RenderWarning($"Could not read: {fileName}");
                failed++;
                continue;
            }

            try
            {
                var data     = JsonConvert.DeserializeObject<Dictionary<string, object>>(raw);
                var splitKey = ExtractSplitKey(data);

                if (string.IsNullOrEmpty(splitKey))
                {
                    ConsoleMenu.RenderWarning($"No splitKey found in: {fileName}");
                    failed++;
                    continue;
                }

                var docRef = db.Collection("datasets").Document(splitKey);
                await docRef.SetAsync(ConvertDict(data!));
                uploaded++;
            }
            catch (Exception ex)
            {
                ConsoleMenu.RenderError($"Failed to upload {fileName} — {ex.Message}");
                failed++;
            }
        }

        Console.WriteLine();
        ConsoleMenu.RenderSuccess($"Uploaded: {uploaded}  Failed: {failed}");
    }

    #endregion

    #region Private Helpers

    private static FirestoreDb? CreateFirestoreClient(string projectId)
    {
        var credentials = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");

        if (string.IsNullOrEmpty(credentials) || !File.Exists(credentials))
        {
            ConsoleMenu.RenderError("GOOGLE_APPLICATION_CREDENTIALS env var not set or file not found.");
            ConsoleMenu.RenderInfo("Set googleCredentialsPath in pipeline_config.json.");
            return null;
        }

        try
        {
            return FirestoreDb.Create(projectId);
        }
        catch (Exception ex)
        {
            ConsoleMenu.RenderError($"Failed to connect to Firestore — {ex.Message}");
            return null;
        }
    }

    // Serializes a PlayerProfile through JSON then deserializes into a plain
    // Dictionary tree so Firestore only sees primitives and standard collections.
    // This avoids the need for [FirestoreData] attributes on every model class.
    private static Dictionary<string, object> ConvertProfile(PlayerProfile profile)
    {
        var json = JsonConvert.SerializeObject(profile);
        var dict = JsonConvert.DeserializeObject<Dictionary<string, object>>(json)!;
        return ConvertDict(dict);
    }

    // Recursively unwraps JObject / JArray tokens produced by Newtonsoft
    // so the tree contains only types Firestore can natively serialize:
    // string, bool, long, double, List<object>, Dictionary<string, object>.
    private static Dictionary<string, object> ConvertDict(Dictionary<string, object> dict)
    {
        var result = new Dictionary<string, object>();
        foreach (var (key, value) in dict)
            result[key] = ConvertValue(value);
        return result;
    }

    private static object ConvertValue(object? value) => value switch
    {
        null    => "",
        JObject obj => ConvertDict(obj.ToObject<Dictionary<string, object>>()!),
        JArray  arr => arr.Select(item => ConvertValue(item)).ToList<object>(),
        JValue  jval => jval.Value ?? "",
        _       => value,
    };

    private static string ExtractSplitKey(Dictionary<string, object>? data)
    {
        if (data == null) return "";
        return data.TryGetValue("splitKey", out var val) ? val?.ToString() ?? "" : "";
    }

    #endregion
}