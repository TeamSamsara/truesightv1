// TrueSight.DataPipeline
// Client/RiotClient.cs
// @version 1.0.0
//
// All Riot API HTTP communication lives here.
// No other file makes HTTP calls or knows about API endpoints.
// Handles rate limiting, retries, and error cases consistently.

using System.Net;
using Newtonsoft.Json.Linq;
using TrueSight.DataPipeline.Core;

namespace TrueSight.DataPipeline.Client;

public class RiotClient : IDisposable
{
    #region Fields

    private readonly HttpClient _http;
    private DateTime            _lastRequest = DateTime.MinValue;

    #endregion

    #region Constructor

    public RiotClient(string apiKey)
    {
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Add("X-Riot-Token", apiKey);
        _http.Timeout = TimeSpan.FromSeconds(AppConfig.TimeoutSeconds);
    }

    #endregion

    #region Public API

    // Fetches raw match JSON from Riot Match V5 API.
    // Returns null on 404 (forfeit/removed) or unrecoverable error.
    public async Task<JObject?> FetchMatchAsync(string matchId)
    {
        var url = $"{AppConfig.RiotApiBase}/lol/match/v5/matches/{matchId}";
        return await FetchAsync(url, matchId);
    }

    // Fetches raw timeline JSON from Riot Match V5 API.
    // Returns null on 404 or unrecoverable error.
    public async Task<JObject?> FetchTimelineAsync(string matchId)
    {
        var url = $"{AppConfig.RiotApiBase}/lol/match/v5/matches/{matchId}/timeline";
        return await FetchAsync(url, matchId);
    }

    #endregion

    #region Private Helpers

    private async Task<JObject?> FetchAsync(string url, string label)
    {
        await ThrottleAsync();

        for (int attempt = 1; attempt <= AppConfig.MaxRetries; attempt++)
        {
            try
            {
                _lastRequest = DateTime.UtcNow;
                var response = await _http.GetAsync(url);

                switch (response.StatusCode)
                {
                    case HttpStatusCode.OK:
                        var json = await response.Content.ReadAsStringAsync();
                        return JObject.Parse(json);

                    case HttpStatusCode.NotFound:
                        Console.WriteLine($"  [404] {label} — not found (forfeit or purged)");
                        return null;

                    case (HttpStatusCode)429:
                        Console.WriteLine($"  [429] Rate limited — backing off {AppConfig.RetryDelayMs / 1000}s (attempt {attempt}/{AppConfig.MaxRetries})");
                        await Task.Delay(AppConfig.RetryDelayMs);
                        break;

                    default:
                        Console.WriteLine($"  [{(int)response.StatusCode}] {label} — unexpected status");
                        return null;
                }
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine($"  [TIMEOUT] {label} — attempt {attempt}/{AppConfig.MaxRetries}");
                await Task.Delay(3000);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] {label} — {ex.Message}");
                return null;
            }
        }

        Console.WriteLine($"  [FAILED] {label} — gave up after {AppConfig.MaxRetries} attempts");
        return null;
    }

    private async Task ThrottleAsync()
    {
        var elapsed = DateTime.UtcNow - _lastRequest;
        var delay   = TimeSpan.FromMilliseconds(AppConfig.RateLimitDelayMs);
        if (elapsed < delay)
            await Task.Delay(delay - elapsed);
    }

    #endregion

    #region Dispose

    public void Dispose() => _http.Dispose();

    #endregion
}