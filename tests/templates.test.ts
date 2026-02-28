/**
 * Tier 2: Template validation tests
 * Validates all 5 template directories for correct structure and content
 */

import { describe, test, expect } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { TEMPLATES_DIR } from "../src/constants.js";
import type {
  BackendFramework,
  FrontendFramework,
} from "../src/types.js";

/**
 * Helper to check file existence
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to check for unresolved template variables (anything other than {{projectName}} and {{baseName}})
 */
async function hasUnresolvedVars(filePath: string): Promise<boolean> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    // Skip binary files
    if ([".png", ".jpg", ".gif", ".ico", ".woff", ".woff2", ".ttf"].includes(ext)) {
      return false;
    }
    const content = await fs.readFile(filePath, "utf-8");
    // Check for any {{ }} that is NOT {{projectName}} or {{baseName}}
    const matches = content.match(/\{\{[a-zA-Z][^}]*\}\}/g);
    if (!matches) return false;

    for (const match of matches) {
      if (match !== "{{projectName}}" && match !== "{{baseName}}") {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Helper to read JSON file safely
 */
async function readJSON(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Helper to read TOML-like format (just check for key sections)
 */
async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

describe("Backend Templates", () => {
  describe("python-fastapi", () => {
    const templatePath = path.join(TEMPLATES_DIR, "backends", "python-fastapi");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "api/app.py",
        "api/main.py",
        "api/endpoints/health.py",
        "pyproject.toml",
        ".env.example",
        ".gitignore",
        "README.md",
        "CLAUDE.md",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("pyproject.toml is valid and contains [project] section", async () => {
      const filePath = path.join(templatePath, "pyproject.toml");
      const content = await readText(filePath);
      expect(content).toContain("[project]");
      expect(content).toContain("name = ");
    });

    test("health.py contains /health endpoint", async () => {
      const filePath = path.join(templatePath, "api", "endpoints", "health.py");
      const content = await readText(filePath);
      expect(content.toLowerCase()).toContain("health");
    });

    test("app.py uses router pattern and middleware", async () => {
      const filePath = path.join(templatePath, "api", "app.py");
      const content = await readText(filePath);
      expect(content).toContain("include_router");
      expect(content).toContain("create_app");
      expect(content).toContain("add_request_id");
      expect(content).toContain("log_requests");
    });

    test("core layer exists", async () => {
      const hasSettings = await fileExists(path.join(templatePath, "core", "settings.py"));
      const hasLogger = await fileExists(path.join(templatePath, "core", "logger.py"));
      const hasExceptions = await fileExists(path.join(templatePath, "core", "exceptions.py"));
      const hasDatetime = await fileExists(path.join(templatePath, "core", "utils", "datetime_utils.py"));

      expect(hasSettings).toBe(true);
      expect(hasLogger).toBe(true);
      expect(hasExceptions).toBe(true);
      expect(hasDatetime).toBe(true);
    });

    test("api layer has context, deps, middleware", async () => {
      const hasContext = await fileExists(path.join(templatePath, "api", "context.py"));
      const hasDeps = await fileExists(path.join(templatePath, "api", "deps.py"));
      const hasMiddleware = await fileExists(path.join(templatePath, "api", "middleware.py"));

      expect(hasContext).toBe(true);
      expect(hasDeps).toBe(true);
      expect(hasMiddleware).toBe(true);
    });

    test("health.py uses dependency injection", async () => {
      const content = await readText(path.join(templatePath, "api", "endpoints", "health.py"));
      expect(content).toContain("Depends");
      expect(content).toContain("ApiContext");
      expect(content).toContain("request_id");
    });

    test(".env.example contains APP_PORT", async () => {
      const filePath = path.join(templatePath, ".env.example");
      const content = await readText(filePath);
      expect(content).toContain("APP_PORT");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });

  describe("go-chi", () => {
    const templatePath = path.join(TEMPLATES_DIR, "backends", "go-chi");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "cmd/api/main.go",
        "go.mod",
        "Makefile",
        ".env.example",
        ".gitignore",
        ".air.toml",
        "README.md",
        "CLAUDE.md",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("go.mod contains chi and env dependencies", async () => {
      const content = await readText(path.join(templatePath, "go.mod"));
      expect(content).toMatch(/^module /m);
      expect(content).toContain("go-chi/chi");
      expect(content).toContain("caarlos0/env");
    });

    test("internal structure exists", async () => {
      const requiredFiles = [
        "internal/config/config.go",
        "internal/logger/logger.go",
        "internal/api/router.go",
        "internal/handler/health.go",
        "internal/middleware/request_id.go",
        "internal/middleware/logging.go",
        "internal/middleware/recovery.go",
      ];

      for (const file of requiredFiles) {
        const exists = await fileExists(path.join(templatePath, file));
        expect(exists).toBe(true);
      }
    });

    test("router.go mounts middleware and health route", async () => {
      const content = await readText(path.join(templatePath, "internal", "api", "router.go"));
      expect(content).toContain("chi.NewRouter");
      expect(content).toContain("health");
      expect(content).toContain("cors");
    });

    test("health handler returns request_id", async () => {
      const content = await readText(path.join(templatePath, "internal", "handler", "health.go"));
      expect(content).toContain("request_id");
      expect(content).toContain("health");
    });

    test("config uses env struct tags", async () => {
      const content = await readText(path.join(templatePath, "internal", "config", "config.go"));
      expect(content).toContain("env:");
      expect(content).toContain("AppPort");
    });

    test(".env.example contains APP_PORT", async () => {
      const content = await readText(path.join(templatePath, ".env.example"));
      expect(content).toContain("APP_PORT");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });

  describe("nestjs", () => {
    const templatePath = path.join(TEMPLATES_DIR, "backends", "nestjs");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "package.json",
        "tsconfig.json",
        ".env.example",
        ".gitignore",
        "README.md",
        "CLAUDE.md",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("src directory exists with modular structure", async () => {
      const srcDir = path.join(templatePath, "src");
      const hasModule = await fileExists(path.join(srcDir, "app.module.ts"));
      const hasMain = await fileExists(path.join(srcDir, "main.ts"));
      const hasHealthController = await fileExists(
        path.join(srcDir, "modules", "health", "health.controller.ts")
      );
      const hasHealthService = await fileExists(
        path.join(srcDir, "modules", "health", "health.service.ts")
      );
      const hasConfig = await fileExists(
        path.join(srcDir, "config", "app.config.ts")
      );
      const hasDto = await fileExists(
        path.join(srcDir, "modules", "health", "dto", "health-response.dto.ts")
      );
      const hasServiceSpec = await fileExists(
        path.join(srcDir, "modules", "health", "health.service.spec.ts")
      );
      const hasControllerSpec = await fileExists(
        path.join(srcDir, "modules", "health", "health.controller.spec.ts")
      );

      expect(hasModule).toBe(true);
      expect(hasMain).toBe(true);
      expect(hasHealthController).toBe(true);
      expect(hasHealthService).toBe(true);
      expect(hasConfig).toBe(true);
      expect(hasDto).toBe(true);
      expect(hasServiceSpec).toBe(true);
      expect(hasControllerSpec).toBe(true);
    });

    test("package.json is valid JSON", async () => {
      const filePath = path.join(templatePath, "package.json");
      const pkg = (await readJSON(filePath)) as Record<string, unknown>;
      expect(typeof pkg.name).toBe("string");
      expect(typeof pkg.version).toBe("string");
    });

    test("health.controller.ts contains /health endpoint", async () => {
      const filePath = path.join(templatePath, "src", "modules", "health", "health.controller.ts");
      const content = await readText(filePath);
      expect(content.toLowerCase()).toContain("health");
    });

    test(".env.example contains APP_PORT", async () => {
      const filePath = path.join(templatePath, ".env.example");
      const content = await readText(filePath);
      expect(content).toContain("APP_PORT");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });

  describe("rust-axum", () => {
    const templatePath = path.join(TEMPLATES_DIR, "backends", "rust-axum");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "Cargo.toml",
        "src/main.rs",
        "src/config.rs",
        "src/error.rs",
        "src/routes.rs",
        ".env.example",
        ".gitignore",
        "README.md",
        "CLAUDE.md",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("Cargo.toml contains axum and tokio deps", async () => {
      const content = await readText(path.join(templatePath, "Cargo.toml"));
      expect(content).toContain("axum");
      expect(content).toContain("tokio");
      expect(content).toContain("tower-http");
      expect(content).toContain("tracing");
    });

    test("Cargo.toml has clippy lints enabled", async () => {
      const content = await readText(path.join(templatePath, "Cargo.toml"));
      expect(content).toContain("[lints.clippy]");
      expect(content).toContain("pedantic");
    });

    test("internal module structure exists", async () => {
      const requiredFiles = [
        "src/handlers/mod.rs",
        "src/handlers/health.rs",
        "src/middleware/mod.rs",
        "src/middleware/request_id.rs",
      ];

      for (const file of requiredFiles) {
        const exists = await fileExists(path.join(templatePath, file));
        expect(exists).toBe(true);
      }
    });

    test("health handler returns request_id", async () => {
      const content = await readText(path.join(templatePath, "src", "handlers", "health.rs"));
      expect(content).toContain("request_id");
      expect(content).toContain("health");
    });

    test("routes.rs mounts middleware and health route", async () => {
      const content = await readText(path.join(templatePath, "src", "routes.rs"));
      expect(content).toContain("health");
      expect(content).toContain("Cors");
    });

    test(".env.example contains APP_PORT", async () => {
      const content = await readText(path.join(templatePath, ".env.example"));
      expect(content).toContain("APP_PORT");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });
});

describe("Frontend Templates", () => {
  describe("react-vite", () => {
    const templatePath = path.join(TEMPLATES_DIR, "frontends", "react-vite");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "index.html",
        ".env.example",
        ".gitignore",
        "README.md",
        "CLAUDE.md",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("src directory exists with main.tsx and App.tsx", async () => {
      const srcDir = path.join(templatePath, "src");
      const hasMain = await fileExists(path.join(srcDir, "main.tsx"));
      const hasApp = await fileExists(path.join(srcDir, "App.tsx"));

      expect(hasMain).toBe(true);
      expect(hasApp).toBe(true);
    });

    test("shadcn-compatible structure exists", async () => {
      const hasUtils = await fileExists(path.join(templatePath, "src", "lib", "utils.ts"));
      const hasButton = await fileExists(path.join(templatePath, "src", "components", "ui", "button.tsx"));
      const hasCard = await fileExists(path.join(templatePath, "src", "components", "ui", "card.tsx"));

      expect(hasUtils).toBe(true);
      expect(hasButton).toBe(true);
      expect(hasCard).toBe(true);
    });

    test("cn utility uses clsx + tailwind-merge", async () => {
      const content = await readText(path.join(templatePath, "src", "lib", "utils.ts"));
      expect(content).toContain("clsx");
      expect(content).toContain("twMerge");
    });

    test("package.json includes tailwind dependencies", async () => {
      const pkg = (await readJSON(path.join(templatePath, "package.json"))) as Record<string, unknown>;
      const deps = pkg.dependencies as Record<string, string>;
      const devDeps = pkg.devDependencies as Record<string, string>;
      expect(deps["clsx"]).toBeDefined();
      expect(deps["tailwind-merge"]).toBeDefined();
      // tailwindcss can be in deps or devDeps depending on setup
      const hasTailwind = deps["tailwindcss"] || devDeps["tailwindcss"];
      expect(hasTailwind).toBeDefined();
      const hasVitePlugin = deps["@tailwindcss/vite"] || devDeps["@tailwindcss/vite"];
      expect(hasVitePlugin).toBeDefined();
    });

    test("App.css imports tailwind", async () => {
      const content = await readText(path.join(templatePath, "src", "App.css"));
      expect(content).toContain("tailwindcss");
    });

    test("package.json is valid JSON", async () => {
      const filePath = path.join(templatePath, "package.json");
      const pkg = (await readJSON(filePath)) as Record<string, unknown>;
      expect(typeof pkg.name).toBe("string");
      expect(typeof pkg.version).toBe("string");
    });

    test("App.tsx contains health check logic", async () => {
      const filePath = path.join(templatePath, "src", "App.tsx");
      const content = await readText(filePath);
      expect(content.toLowerCase()).toContain("health");
    });

    test(".env.example contains VITE_BACKEND_URL", async () => {
      const filePath = path.join(templatePath, ".env.example");
      const content = await readText(filePath);
      expect(content).toContain("VITE_BACKEND_URL");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });

  describe("nextjs", () => {
    const templatePath = path.join(TEMPLATES_DIR, "frontends", "nextjs");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "package.json",
        "tsconfig.json",
        "next.config.ts",
        ".env.example",
        ".gitignore",
        "README.md",
        "CLAUDE.md",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("src/app directory exists with layout and page", async () => {
      const appDir = path.join(templatePath, "src", "app");
      const hasLayout = await fileExists(path.join(appDir, "layout.tsx"));
      const hasPage = await fileExists(path.join(appDir, "page.tsx"));

      expect(hasLayout).toBe(true);
      expect(hasPage).toBe(true);
    });

    test("shadcn-compatible structure exists", async () => {
      const hasUtils = await fileExists(path.join(templatePath, "src", "lib", "utils.ts"));
      const hasButton = await fileExists(path.join(templatePath, "src", "components", "ui", "button.tsx"));
      const hasCard = await fileExists(path.join(templatePath, "src", "components", "ui", "card.tsx"));

      expect(hasUtils).toBe(true);
      expect(hasButton).toBe(true);
      expect(hasCard).toBe(true);
    });

    test("cn utility uses clsx + tailwind-merge", async () => {
      const content = await readText(path.join(templatePath, "src", "lib", "utils.ts"));
      expect(content).toContain("clsx");
      expect(content).toContain("twMerge");
    });

    test("package.json includes tailwind dependencies", async () => {
      const pkg = (await readJSON(path.join(templatePath, "package.json"))) as Record<string, unknown>;
      const deps = pkg.dependencies as Record<string, string>;
      const devDeps = pkg.devDependencies as Record<string, string>;
      expect(deps["clsx"]).toBeDefined();
      expect(deps["tailwind-merge"]).toBeDefined();
      expect(devDeps["tailwindcss"]).toBeDefined();
      expect(devDeps["@tailwindcss/postcss"]).toBeDefined();
    });

    test("postcss.config.mjs exists", async () => {
      const exists = await fileExists(path.join(templatePath, "postcss.config.mjs"));
      expect(exists).toBe(true);
    });

    test("globals.css imports tailwind", async () => {
      const content = await readText(path.join(templatePath, "src", "app", "globals.css"));
      expect(content).toContain("tailwindcss");
    });

    test("layout.tsx uses Geist font", async () => {
      const content = await readText(path.join(templatePath, "src", "app", "layout.tsx"));
      expect(content).toContain("Geist");
    });

    test("package.json is valid JSON", async () => {
      const filePath = path.join(templatePath, "package.json");
      const pkg = (await readJSON(filePath)) as Record<string, unknown>;
      expect(typeof pkg.name).toBe("string");
      expect(typeof pkg.version).toBe("string");
    });

    test("page.tsx contains tRPC health check", async () => {
      const filePath = path.join(templatePath, "src", "app", "page.tsx");
      const content = await readText(filePath);
      expect(content).toContain("trpc");
      expect(content).toContain("health");
    });

    test(".env.example contains BACKEND_URL", async () => {
      const filePath = path.join(templatePath, ".env.example");
      const content = await readText(filePath);
      expect(content).toContain("BACKEND_URL");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });

  describe("angular", () => {
    const templatePath = path.join(TEMPLATES_DIR, "frontends", "angular");

    test("template directory exists", async () => {
      const exists = await fileExists(templatePath);
      expect(exists).toBe(true);
    });

    test("required files exist", async () => {
      const requiredFiles = [
        "package.json",
        "angular.json",
        "tsconfig.json",
        "tsconfig.app.json",
        ".postcssrc.json",
        ".env.example",
        ".gitignore",
        "README.md",
        "CLAUDE.md",
        "eslint.config.js",
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });

    test("app structure exists with standalone components", async () => {
      const srcDir = path.join(templatePath, "src");
      const hasMain = await fileExists(path.join(srcDir, "main.ts"));
      const hasIndex = await fileExists(path.join(srcDir, "index.html"));
      const hasAppComponent = await fileExists(path.join(srcDir, "app", "app.component.ts"));
      const hasAppConfig = await fileExists(path.join(srcDir, "app", "app.config.ts"));
      const hasAppRoutes = await fileExists(path.join(srcDir, "app", "app.routes.ts"));
      const hasHealthService = await fileExists(path.join(srcDir, "app", "services", "health.service.ts"));
      const hasHome = await fileExists(path.join(srcDir, "app", "pages", "home", "home.component.ts"));

      expect(hasMain).toBe(true);
      expect(hasIndex).toBe(true);
      expect(hasAppComponent).toBe(true);
      expect(hasAppConfig).toBe(true);
      expect(hasAppRoutes).toBe(true);
      expect(hasHealthService).toBe(true);
      expect(hasHome).toBe(true);
    });

    test("app.config.ts uses provideHttpClient", async () => {
      const content = await readText(path.join(templatePath, "src", "app", "app.config.ts"));
      expect(content).toContain("provideHttpClient");
      expect(content).toContain("provideRouter");
      expect(content).toContain("provideZoneChangeDetection");
    });

    test("health.service.ts uses inject()", async () => {
      const content = await readText(path.join(templatePath, "src", "app", "services", "health.service.ts"));
      expect(content).toContain("inject(HttpClient)");
      expect(content).toContain("health");
    });

    test("home.component.ts uses signals, computed, and takeUntilDestroyed", async () => {
      const content = await readText(path.join(templatePath, "src", "app", "pages", "home", "home.component.ts"));
      expect(content).toContain("signal");
      expect(content).toContain("computed");
      expect(content).toContain("inject(HealthService)");
      expect(content).toContain("takeUntilDestroyed");
      expect(content).toContain("ChangeDetectionStrategy.OnPush");
    });

    test("styles.css imports tailwind with theme tokens", async () => {
      const content = await readText(path.join(templatePath, "src", "styles.css"));
      expect(content).toContain("tailwindcss");
      expect(content).toContain("--color-background");
    });

    test("home.component.ts contains FAST STACK banner", async () => {
      const content = await readText(path.join(templatePath, "src", "app", "pages", "home", "home.component.ts"));
      expect(content).toContain("TITLE_TEXT");
      expect(content).toContain("titleText");
    });

    test("package.json is valid JSON with Angular deps", async () => {
      const pkg = (await readJSON(path.join(templatePath, "package.json"))) as Record<string, unknown>;
      expect(typeof pkg.name).toBe("string");
      const deps = pkg.dependencies as Record<string, string>;
      expect(deps["@angular/core"]).toBeDefined();
      expect(deps["@angular/router"]).toBeDefined();
    });

    test(".env.example contains BACKEND_URL", async () => {
      const content = await readText(path.join(templatePath, ".env.example"));
      expect(content).toContain("BACKEND_URL");
    });

    test("no leftover {{ in any file", async () => {
      const files = await fs.readdir(templatePath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(templatePath, file as string);
        const hasUnresolved = await hasUnresolvedVars(filePath);
        expect(hasUnresolved).toBe(false);
      }
    });
  });
});

describe("Cross-Template Validation", () => {
  test("all template directories exist", async () => {
    const backends: BackendFramework[] = [
      "python-fastapi",
      "go-chi",
      "nestjs",
      "rust-axum",
    ];
    const frontends: FrontendFramework[] = ["react-vite", "nextjs", "angular"];

    for (const backend of backends) {
      const path_ = path.join(TEMPLATES_DIR, "backends", backend);
      const exists = await fileExists(path_);
      expect(exists).toBe(true);
    }

    for (const frontend of frontends) {
      const path_ = path.join(TEMPLATES_DIR, "frontends", frontend);
      const exists = await fileExists(path_);
      expect(exists).toBe(true);
    }
  });

  test("all templates contain .gitignore", async () => {
    const backends: BackendFramework[] = [
      "python-fastapi",
      "go-chi",
      "nestjs",
      "rust-axum",
    ];
    const frontends: FrontendFramework[] = ["react-vite", "nextjs", "angular"];

    for (const backend of backends) {
      const filePath = path.join(
        TEMPLATES_DIR,
        "backends",
        backend,
        ".gitignore"
      );
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    }

    for (const frontend of frontends) {
      const filePath = path.join(
        TEMPLATES_DIR,
        "frontends",
        frontend,
        ".gitignore"
      );
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    }
  });

  test("all templates contain CLAUDE.md", async () => {
    const backends: BackendFramework[] = [
      "python-fastapi",
      "go-chi",
      "nestjs",
      "rust-axum",
    ];
    const frontends: FrontendFramework[] = ["react-vite", "nextjs", "angular"];

    for (const backend of backends) {
      const filePath = path.join(
        TEMPLATES_DIR,
        "backends",
        backend,
        "CLAUDE.md"
      );
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    }

    for (const frontend of frontends) {
      const filePath = path.join(
        TEMPLATES_DIR,
        "frontends",
        frontend,
        "CLAUDE.md"
      );
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    }
  });

  test("all templates contain .env.example", async () => {
    const backends: BackendFramework[] = [
      "python-fastapi",
      "go-chi",
      "nestjs",
      "rust-axum",
    ];
    const frontends: FrontendFramework[] = ["react-vite", "nextjs", "angular"];

    for (const backend of backends) {
      const filePath = path.join(
        TEMPLATES_DIR,
        "backends",
        backend,
        ".env.example"
      );
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    }

    for (const frontend of frontends) {
      const filePath = path.join(
        TEMPLATES_DIR,
        "frontends",
        frontend,
        ".env.example"
      );
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    }
  });
});
