/**
 * Tier 1: Scaffold tests
 * Unit tests for config validation, file copy, and variable substitution
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { validateProjectName } from "../src/utils/index.js";
import { validateConfig, scaffoldConfigSchema } from "../src/config.js";
import { copyTemplate } from "../src/generator/index.js";
import { resolveTemplatePath } from "../src/generator/index.js";
import { TEMPLATES_DIR } from "../src/constants.js";
import type { ScaffoldConfig, TemplateVars } from "../src/types.js";

/**
 * Create a temporary directory using Bun's built-in tmpdir
 */
async function mkTempDir(): Promise<string> {
  const tmpBase = await fs.mkdtemp(path.join(Bun.env.TMPDIR || "/tmp", "scaffold-test-"));
  return tmpBase;
}

describe("Config Validation", () => {
  describe("projectNameSchema", () => {
    test("accepts valid project names", () => {
      const validNames = ["my-app", "a", "test-123", "myapp", "my-app-backend"];
      validNames.forEach((name) => {
        expect(validateProjectName(name)).toBeUndefined();
      });
    });

    test("rejects invalid project names", () => {
      const invalidNames = [
        "-start", // starts with hyphen
        "end-", // ends with hyphen
        "Upper", // uppercase
        "My App", // spaces
        "", // empty
        "a".repeat(256), // too long
        "app_name", // underscore
        "App", // uppercase
      ];

      invalidNames.forEach((name) => {
        const error = validateProjectName(name);
        expect(error).toBeDefined();
        expect(error).toMatch(/Project name required|must be|too long/i);
      });
    });
  });

  describe("scaffoldConfigSchema", () => {
    test("accepts valid ScaffoldConfig", () => {
      const config: ScaffoldConfig = {
        projectName: "my-app",
        projects: [
          {
            type: "backend",
            framework: "python-fastapi",
            folderName: "my-app-backend",
          },
        ],
        outputDir: "/tmp",
        initGit: true,
      };

      const result = validateConfig(config);
      expect(result.projectName).toBe("my-app");
      expect(result.projects).toHaveLength(1);
    });

    test("accepts multiple project types", () => {
      const config: ScaffoldConfig = {
        projectName: "my-app",
        projects: [
          {
            type: "backend",
            framework: "python-fastapi",
            folderName: "my-app-backend",
          },
          {
            type: "frontend",
            framework: "react-vite",
            folderName: "my-app-frontend",
          },
        ],
        outputDir: "/tmp",
        initGit: true,
      };

      const result = validateConfig(config);
      expect(result.projects).toHaveLength(2);
    });

    test("rejects empty projects array", () => {
      const config = {
        projectName: "my-app",
        projects: [],
        outputDir: "/tmp",
        initGit: true,
      };

      expect(() => validateConfig(config)).toThrow();
    });

    test("rejects invalid projectName", () => {
      const config = {
        projectName: "-invalid",
        projects: [
          {
            type: "backend",
            framework: "python-fastapi",
            folderName: "my-app-backend",
          },
        ],
        outputDir: "/tmp",
        initGit: true,
      };

      expect(() => validateConfig(config)).toThrow();
    });
  });
});

describe("File Copy + Variable Substitution", () => {
  let tempDir: string;
  let templateDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tempDir = await mkTempDir();
    templateDir = path.join(tempDir, "template");
    outputDir = path.join(tempDir, "output");

    // Create test template structure
    await fs.mkdir(templateDir, { recursive: true });
    await fs.mkdir(path.join(templateDir, "src"), { recursive: true });

    // Create template files with variables
    await fs.writeFile(
      path.join(templateDir, "package.json"),
      JSON.stringify({
        name: "{{projectName}}",
        version: "1.0.0",
        description: "Project {{baseName}}",
      }),
      "utf-8"
    );

    await fs.writeFile(
      path.join(templateDir, "README.md"),
      "# {{projectName}}\n\nBase: {{baseName}}",
      "utf-8"
    );

    await fs.writeFile(
      path.join(templateDir, "src", "main.ts"),
      "export const PROJECT = '{{projectName}}';\nexport const BASE = '{{baseName}}';",
      "utf-8"
    );

    // Create a binary file (shouldn't be substituted)
    await fs.writeFile(
      path.join(templateDir, "logo.png"),
      Buffer.from([137, 80, 78, 71]) // PNG magic bytes
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test("copies template directory structure", async () => {
    const vars: TemplateVars = {
      projectName: "my-app-backend",
      baseName: "my-app",
    };

    await copyTemplate(templateDir, outputDir, vars);

    const files = await fs.readdir(outputDir, { recursive: true });
    expect(files).toContain("package.json");
    expect(files).toContain("README.md");
    expect(files).toContain(path.join("src", "main.ts"));
    expect(files).toContain("logo.png");
  });

  test("replaces {{projectName}} in text files", async () => {
    const vars: TemplateVars = {
      projectName: "my-app-backend",
      baseName: "my-app",
    };

    await copyTemplate(templateDir, outputDir, vars);

    const packageJson = await fs.readFile(
      path.join(outputDir, "package.json"),
      "utf-8"
    );
    const pkg = JSON.parse(packageJson);
    expect(pkg.name).toBe("my-app-backend");
    expect(pkg.description).toBe("Project my-app");
  });

  test("replaces {{baseName}} in text files", async () => {
    const vars: TemplateVars = {
      projectName: "my-app-backend",
      baseName: "my-app",
    };

    await copyTemplate(templateDir, outputDir, vars);

    const readme = await fs.readFile(
      path.join(outputDir, "README.md"),
      "utf-8"
    );
    expect(readme).toContain("# my-app-backend");
    expect(readme).toContain("Base: my-app");
  });

  test("replaces variables in nested directories", async () => {
    const vars: TemplateVars = {
      projectName: "test-project",
      baseName: "test",
    };

    await copyTemplate(templateDir, outputDir, vars);

    const mainTs = await fs.readFile(
      path.join(outputDir, "src", "main.ts"),
      "utf-8"
    );
    expect(mainTs).toContain("PROJECT = 'test-project'");
    expect(mainTs).toContain("BASE = 'test'");
  });

  test("does not substitute binary files", async () => {
    const vars: TemplateVars = {
      projectName: "my-app-backend",
      baseName: "my-app",
    };

    await copyTemplate(templateDir, outputDir, vars);

    const pngContent = await fs.readFile(path.join(outputDir, "logo.png"));
    // Binary files should be copied as-is (PNG magic bytes should be preserved)
    expect(pngContent[0]).toBe(137);
    expect(pngContent[1]).toBe(80);
    expect(pngContent[2]).toBe(78);
    expect(pngContent[3]).toBe(71);
  });

  test("no leftover {{ in output files", async () => {
    const vars: TemplateVars = {
      projectName: "my-app-backend",
      baseName: "my-app",
    };

    await copyTemplate(templateDir, outputDir, vars);

    const files = await fs.readdir(outputDir, { recursive: true });
    for (const file of files) {
      const filePath = path.join(outputDir, file as string);
      const stats = await fs.stat(filePath);
      if (!stats.isDirectory()) {
        const ext = path.extname(filePath).toLowerCase();
        // Skip binary files
        if (![".png", ".jpg", ".gif", ".ico"].includes(ext)) {
          const content = await fs.readFile(filePath, "utf-8").catch(() => null);
          if (content) {
            expect(content).not.toMatch(/\{\{/);
          }
        }
      }
    }
  });
});

describe("Template Resolution", () => {
  test("resolveTemplatePath returns correct paths for backends", () => {
    const pythonPath = resolveTemplatePath("backend", "python-fastapi");
    expect(pythonPath).toContain("templates/backends/python-fastapi");

    const goPath = resolveTemplatePath("backend", "go-chi");
    expect(goPath).toContain("templates/backends/go-chi");

    const nestPath = resolveTemplatePath("backend", "nestjs");
    expect(nestPath).toContain("templates/backends/nestjs");
  });

  test("resolveTemplatePath returns correct paths for frontends", () => {
    const vitePath = resolveTemplatePath("frontend", "react-vite");
    expect(vitePath).toContain("templates/frontends/react-vite");

    const nextPath = resolveTemplatePath("frontend", "nextjs");
    expect(nextPath).toContain("templates/frontends/nextjs");
  });

  test("all backend templates exist", async () => {
    const backends = ["python-fastapi", "go-chi", "nestjs", "rust-axum"];

    for (const backend of backends) {
      const templatePath = resolveTemplatePath("backend", backend);
      const stats = await fs
        .stat(templatePath)
        .catch(() => null);
      expect(stats).toBeTruthy();
      expect(stats?.isDirectory()).toBe(true);
    }
  });

  test("all frontend templates exist", async () => {
    const frontends = ["react-vite", "nextjs"];

    for (const frontend of frontends) {
      const templatePath = resolveTemplatePath("frontend", frontend);
      const stats = await fs
        .stat(templatePath)
        .catch(() => null);
      expect(stats).toBeTruthy();
      expect(stats?.isDirectory()).toBe(true);
    }
  });
});
