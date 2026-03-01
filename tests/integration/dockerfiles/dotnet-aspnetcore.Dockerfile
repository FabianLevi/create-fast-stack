# dotnet-aspnetcore.Dockerfile
# Multi-stage build: SDK for build, runtime for execution

# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build

WORKDIR /app

COPY *.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /out

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview

LABEL maintainer="create-fast-stack"
LABEL cfs-e2e="true"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /out .

ENV HTTP_PORTS=
ENV APP_HOST=0.0.0.0
ENV APP_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["dotnet", "App.dll"]
