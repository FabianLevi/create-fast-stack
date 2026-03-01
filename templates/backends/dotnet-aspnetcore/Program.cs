using Carter;
using DotNetEnv;
using Serilog;

Env.Load();

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .Enrich.FromLogContext()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog();

builder.Services.AddCors();
builder.Services.AddCarter();

var appHost = Environment.GetEnvironmentVariable("APP_HOST") ?? "0.0.0.0";
var appPort = int.TryParse(Environment.GetEnvironmentVariable("APP_PORT"), out var port) ? port : 8000;

builder.WebHost.UseUrls($"http://{appHost}:{appPort}");

var app = builder.Build();

app.UseSerilogRequestLogging();

app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader()
    .WithExposedHeaders("X-Request-ID"));

app.Use(async (context, next) =>
{
    var requestId = Guid.NewGuid().ToString();
    context.Items["RequestId"] = requestId;
    context.Response.Headers["X-Request-ID"] = requestId;
    await next();
});

app.MapCarter();

Log.Information("Starting server on http://{Host}:{Port}", appHost, appPort);

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
