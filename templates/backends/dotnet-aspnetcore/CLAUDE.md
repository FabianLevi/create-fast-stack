# {{projectName}} — C# ASP.NET Core Backend

Comprehensive coding standards for this project. Follow these rules in all code.

## Stack

- **Language**: C# 13 / .NET 10
- **Web Framework**: ASP.NET Core Minimal APIs + Carter 8
- **Logging**: Serilog (console sink)
- **Configuration**: DotNetEnv + environment variables
- **Serialization**: System.Text.Json (built-in)

## Commands

```bash
# Development (hot reload)
dotnet watch

# Run
dotnet run

# Build
dotnet build

# Publish (release)
dotnet publish -c Release

# Restore dependencies
dotnet restore

# Format
dotnet format

# Test
dotnet test
```

## Project Structure

```
Program.cs                  Entry point, middleware pipeline, CORS, request ID
Modules/
  Health/
    HealthModule.cs         GET /health + GET /hello (Carter module)
Properties/
  launchSettings.json       IDE launch profiles
appsettings.json            ASP.NET Core configuration
.env.example                Environment variable template
App.csproj                  Project configuration and dependencies
```

## Code Standards

### Documentation

Every public type and method MUST have an XML doc comment.

**Methods**:
```csharp
/// <summary>
/// Handles GET /health requests.
/// </summary>
/// <param name="context">The HTTP context.</param>
/// <returns>Health check response with request ID.</returns>
```

**Types**:
```csharp
/// <summary>
/// Carter module for health-related endpoints.
/// </summary>
public class HealthModule : ICarterModule
```

### Error Handling

**RULE**: Never swallow exceptions silently.

**Pattern 1: Let middleware catch unhandled exceptions**
```csharp
app.UseExceptionHandler(error => error.Run(async context =>
{
    context.Response.StatusCode = 500;
    await context.Response.WriteAsJsonAsync(new { error = "internal server error" });
}));
```

**Pattern 2: Return TypedResults for expected errors**
```csharp
app.MapGet("/items/{id}", (int id) =>
{
    var item = FindItem(id);
    return item is not null
        ? TypedResults.Ok<ItemResponse>(item)
        : TypedResults.NotFound();
});
```

**Pattern 3: Guard clauses with early return**
```csharp
if (string.IsNullOrWhiteSpace(name))
    return Results.BadRequest(new { error = "Name is required" });
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `HealthModule`, `AppConfig` |
| Methods | PascalCase | `AddRoutes`, `GetHealth` |
| Variables | camelCase | `requestId`, `appPort` |
| Properties | PascalCase | `Status`, `RequestId` |
| Interfaces | IPascalCase | `ICarterModule` |
| Constants | PascalCase | `DefaultPort` |
| Private fields | _camelCase | `_logger`, `_config` |
| Namespaces | PascalCase | `{{projectName}}.Modules.Health` |

### Async

**RULE**: Use async/await for all I/O operations.

**RULE**: Always pass `CancellationToken` through async chains.

```csharp
app.MapGet("/data", async (CancellationToken ct) =>
{
    var data = await FetchDataAsync(ct);
    return Results.Ok(data);
});
```

### Nullable Reference Types

Nullable is enabled project-wide. Never suppress nullable warnings without justification.

```csharp
// Good — handle null
var requestId = context.Items["RequestId"]?.ToString() ?? "";

// Bad — suppress without reason
var value = obj!.Property;  // Don't do this
```

### Dependency Injection

Register services in `Program.cs`:
```csharp
builder.Services.AddSingleton<IMyService, MyService>();
builder.Services.AddScoped<IRequestContext, RequestContext>();
```

Inject in Carter modules:
```csharp
public class ItemsModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/items", (IItemService service) =>
            Results.Ok(service.GetAll()));
    }
}
```

## Carter Module Pattern with TypedResults & Record DTOs

### Record DTOs

Use C# records as strongly-typed DTOs. Apply `[JsonPropertyName]` to properties to maintain snake_case JSON:

```csharp
using System.Text.Json.Serialization;

/// <summary>
/// Health check response DTO.
/// </summary>
public record HealthResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("request_id")] string RequestId);
```

**JSON output**:
```json
{
  "status": "ok",
  "request_id": "uuid-here"
}
```

### TypedResults Endpoints

Use `TypedResults.Ok<T>()` for type-safe responses instead of anonymous objects:

```csharp
public class HealthModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/health", Health);
    }

    private static Ok<HealthResponse> Health(HttpContext context)
    {
        var requestId = context.Items["RequestId"]?.ToString() ?? "";
        return TypedResults.Ok(new HealthResponse("ok", requestId));
    }
}
```

**Benefits**:
- Type safety — compiler validates response shape
- OpenAPI generation — auto-generated from return type
- Testability — response types are explicit and mockable

Carter auto-discovers all `ICarterModule` implementations. No manual registration needed.

## Middleware Pattern

Inline middleware in `Program.cs`:
```csharp
app.Use(async (context, next) =>
{
    // Pre-processing
    var start = DateTime.UtcNow;

    await next();

    // Post-processing
    var duration = DateTime.UtcNow - start;
    Log.Information("Request handled in {Duration}ms", duration.TotalMilliseconds);
});
```

## Logging with Serilog

```csharp
Log.Information("Starting server on http://{Host}:{Port}", host, port);
Log.Warning("Request failed: {Error}", error);
Log.Error(ex, "Fatal error occurred");
```

With structured properties:
```csharp
Log.ForContext("RequestId", requestId)
   .Information("Processing request for {Path}", path);
```

## Conventions

### Configuration

Load from `.env` and environment variables:
```csharp
DotNetEnv.Env.Load();
var port = int.TryParse(Environment.GetEnvironmentVariable("APP_PORT"), out var p) ? p : 8000;
```

### CORS

Development — permissive:
```csharp
app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader()
    .WithExposedHeaders("X-Request-ID"));
```

Production — configure specific origins:
```csharp
app.UseCors(policy => policy
    .WithOrigins("https://example.com")
    .AllowAnyMethod()
    .AllowAnyHeader());
```

### Request IDs

Every request gets a UUID via inline middleware:
```csharp
app.Use(async (context, next) =>
{
    var requestId = Guid.NewGuid().ToString();
    context.Items["RequestId"] = requestId;
    context.Response.Headers["X-Request-ID"] = requestId;
    await next();
});
```

Access in endpoints:
```csharp
var requestId = context.Items["RequestId"]?.ToString() ?? "";
```

---

**Last Updated**: 2026-03-01
