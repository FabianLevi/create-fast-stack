using System.Text.Json.Serialization;
using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace App.Modules.Health;

/// <summary>
/// Health check response DTO.
/// </summary>
public record HealthResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("request_id")] string RequestId);

/// <summary>
/// Hello response DTO.
/// </summary>
public record HelloResponse(
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("request_id")] string RequestId);

/// <summary>
/// Carter module for health-related endpoints.
/// </summary>
public class HealthModule : ICarterModule
{
    /// <summary>
    /// Adds health and hello endpoints to the application.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/health", Health);
        app.MapGet("/hello", Hello);
    }

    /// <summary>
    /// Handles GET /health requests.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>Health check response with request ID.</returns>
    private static Ok<HealthResponse> Health(HttpContext context)
    {
        var requestId = context.Items["RequestId"]?.ToString() ?? "";
        return TypedResults.Ok(new HealthResponse("ok", requestId));
    }

    /// <summary>
    /// Handles GET /hello requests.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>Hello response with request ID.</returns>
    private static Ok<HelloResponse> Hello(HttpContext context)
    {
        var requestId = context.Items["RequestId"]?.ToString() ?? "";
        return TypedResults.Ok(new HelloResponse("Hello from {{baseName}}!", requestId));
    }
}
