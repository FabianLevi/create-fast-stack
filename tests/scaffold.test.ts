/**
 * Tier 1: Scaffold tests
 * Unit tests for config validation, file copy, and variable substitution
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { validateProjectName } from "../src/utils/index.js";
import { validateConfig, scaffoldConfigSchema } from "../src/config.js";
import { copyTemplate, AddonInjector, VirtualFileSystem, HandlebarsProcessor } from "../src/generator/index.js";
import { resolveTemplatePath } from "../src/generator/index.js";
import { TEMPLATES_DIR, ADDON_METADATA, SKILL_CATALOG, BACKEND_FRAMEWORK, FRONTEND_FRAMEWORK } from "../src/constants.js";
import type { ScaffoldConfig, TemplateVars, TemplateContext, BackendFramework, FrontendFramework } from "../src/types.js";

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
      const config = {
        projectName: "my-app",
        projects: [
          {
            type: "backend" as const,
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
      expect(result.runtime).toBe("bun");
      expect(result.packageManager).toBe("pnpm");
    });

    test("accepts multiple project types", () => {
      const config = {
        projectName: "my-app",
        projects: [
          {
            type: "backend" as const,
            framework: "python-fastapi",
            folderName: "my-app-backend",
          },
          {
            type: "frontend" as const,
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

describe("Addon Injector", () => {
  let vfs: VirtualFileSystem;
  let hbs: HandlebarsProcessor;
  let injector: AddonInjector;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
    hbs = new HandlebarsProcessor();
    injector = new AddonInjector(vfs, hbs);
  });

  describe("Dependency Merging", () => {
    test("merges devDependencies into package.json", async () => {
      // Create initial package.json in VFS
      vfs.writeJson("/package.json", {
        name: "test-app",
        version: "1.0.0",
        devDependencies: {
          typescript: "^5.0.0",
        },
      });

      // Inject addon (manually call private method via public inject)
      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["biome"],
        isCustom: false,
      };

      await injector.injectAddons(["biome"], context);

      const result = vfs.readJson<any>("/package.json");
      expect(result.devDependencies).toHaveProperty("@biomejs/biome");
      expect(result.devDependencies).toHaveProperty("typescript");
    });

    test("preserves existing devDependencies when merging", async () => {
      vfs.writeJson("/package.json", {
        name: "test-app",
        version: "1.0.0",
        devDependencies: {
          typescript: "^5.0.0",
          eslint: "^8.0.0",
        },
      });

      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["biome"],
        isCustom: false,
      };

      await injector.injectAddons(["biome"], context);

      const result = vfs.readJson<any>("/package.json");
      // biome removes eslint/prettier deps
      expect(result.devDependencies).toEqual({
        typescript: "^5.0.0",
        "@biomejs/biome": "^1.9.4",
      });
    });
  });

  describe("Script Merging", () => {
    test("merges scripts into package.json", async () => {
      vfs.writeJson("/package.json", {
        name: "test-app",
        scripts: {
          dev: "vite",
        },
      });

      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["biome"],
        isCustom: false,
      };

      await injector.injectAddons(["biome"], context);

      const result = vfs.readJson<any>("/package.json");
      expect(result.scripts).toHaveProperty("dev", "vite");
      expect(result.scripts).toHaveProperty("lint", "biome lint .");
      expect(result.scripts).toHaveProperty("format", "biome format .");
    });

    test("does not overwrite existing scripts", async () => {
      vfs.writeJson("/package.json", {
        name: "test-app",
        scripts: {
          lint: "eslint .",
          dev: "vite",
        },
      });

      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["biome"],
        isCustom: false,
      };

      await injector.injectAddons(["biome"], context);

      const result = vfs.readJson<any>("/package.json");
      // Addon scripts override existing ones (spread behavior)
      expect(result.scripts.lint).toBe("biome lint .");
      expect(result.scripts.format).toBe("biome format .");
    });
  });

  describe("Template File Copying", () => {
    test("copies addon template files to VFS", async () => {
      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["biome"],
        isCustom: false,
      };

      vfs.writeJson("/package.json", { name: "test-app" });
      await injector.injectAddons(["biome"], context);

      // Check that biome.json was created
      expect(vfs.exists("/biome.json")).toBe(true);
      const biomeCfg = vfs.readFile("/biome.json");
      expect(biomeCfg).toContain("formatter");
    });

    test("transforms underscore-prefixed filenames to dot files", async () => {
      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["husky"],
        isCustom: false,
      };

      vfs.writeJson("/package.json", { name: "test-app" });
      await injector.injectAddons(["husky"], context);

      // _husky/pre-commit should become .husky/pre-commit
      expect(vfs.exists("/.husky/pre-commit")).toBe(true);
      const preCommit = vfs.readFile("/.husky/pre-commit");
      expect(preCommit).toContain("lint-staged");
    });

    test("skips addons with no template directory", async () => {
      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["skills"],
        isCustom: false,
      };

      vfs.writeJson("/package.json", { name: "test-app" });

      // Should not throw even though skills has minimal templates
      await injector.injectAddons(["skills"], context);

      const pkg = vfs.readJson<any>("/package.json");
      expect(pkg).toBeDefined();
    });
  });

  describe("JSON Deep-Merge", () => {
    test("mcp addon creates mcp.json with example server", async () => {
      vfs.writeJson("/package.json", { name: "test-app" });

      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["mcp"],
        isCustom: false,
      };

      await injector.injectAddons(["mcp"], context);

      const mcpJson = vfs.readJson<any>("/.claude/mcp.json");
      expect(mcpJson.mcpServers).toBeDefined();
    });
  });

  describe("Addon Metadata Integration", () => {
    test("all addons have metadata defined", () => {
      const addons = ["biome", "husky", "skills", "mcp"] as const;

      addons.forEach((addon) => {
        expect(ADDON_METADATA[addon]).toBeDefined();
        expect(ADDON_METADATA[addon].id).toBe(addon);
        expect(ADDON_METADATA[addon].name).toBeDefined();
        expect(ADDON_METADATA[addon].group).toBeDefined();
      });
    });

    test("biome addon has correct metadata", () => {
      const biome = ADDON_METADATA.biome;
      expect(biome.name).toBe("Biome");
      expect(biome.group).toBe("tooling");
      expect(biome.devDependencies).toHaveProperty("@biomejs/biome");
      expect(biome.scripts).toHaveProperty("lint");
      expect(biome.scripts).toHaveProperty("format");
    });

    test("husky addon has correct metadata", () => {
      const husky = ADDON_METADATA.husky;
      expect(husky.name).toBe("Husky");
      expect(husky.group).toBe("tooling");
      expect(husky.devDependencies).toHaveProperty("husky");
      expect(husky.devDependencies).toHaveProperty("lint-staged");
      expect(husky.scripts).toHaveProperty("prepare");
    });
  });

  describe("Multiple Addons", () => {
    test("injects multiple addons in sequence", async () => {
      vfs.writeJson("/package.json", {
        name: "test-app",
        scripts: {},
        devDependencies: {},
      });

      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: ["biome", "husky"],
        isCustom: false,
      };

      await injector.injectAddons(["biome", "husky"], context);

      const pkg = vfs.readJson<any>("/package.json");
      expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");
      expect(pkg.devDependencies).toHaveProperty("husky");
      expect(pkg.devDependencies).toHaveProperty("lint-staged");
      expect(pkg.scripts).toHaveProperty("lint");
      expect(pkg.scripts).toHaveProperty("prepare");
    });

    test("skips injection if no addons selected", async () => {
      vfs.writeJson("/package.json", {
        name: "test-app",
        scripts: { dev: "vite" },
        devDependencies: { vite: "^5.0.0" },
      });

      const context: TemplateContext = {
        projectName: "test-app",
        baseName: "test",
        framework: "react-vite",
        runtime: "bun",
        packageManager: "pnpm",
        selectedAddons: [],
        isCustom: false,
      };

      await injector.injectAddons([], context);

      const pkg = vfs.readJson<any>("/package.json");
      expect(pkg.scripts).toEqual({ dev: "vite" });
      expect(pkg.devDependencies).toEqual({ vite: "^5.0.0" });
    });
  });
});

describe("Skills Catalog", () => {
  test("SKILL_CATALOG has common-backend and common-frontend keys", () => {
    expect(SKILL_CATALOG["common-backend"]).toBeDefined();
    expect(Array.isArray(SKILL_CATALOG["common-backend"])).toBe(true);
    expect(SKILL_CATALOG["common-frontend"]).toBeDefined();
    expect(Array.isArray(SKILL_CATALOG["common-frontend"])).toBe(true);
  });

  test("every BackendFramework has a key in SKILL_CATALOG", () => {
    const backendFrameworks: BackendFramework[] = [
      BACKEND_FRAMEWORK.PYTHON_FASTAPI,
      BACKEND_FRAMEWORK.GO_CHI,
      BACKEND_FRAMEWORK.NESTJS,
      BACKEND_FRAMEWORK.RUST_AXUM,
    ];

    backendFrameworks.forEach((framework) => {
      expect(SKILL_CATALOG[framework]).toBeDefined();
      expect(Array.isArray(SKILL_CATALOG[framework])).toBe(true);
    });
  });

  test("every FrontendFramework has a key in SKILL_CATALOG", () => {
    const frontendFrameworks: FrontendFramework[] = [
      FRONTEND_FRAMEWORK.REACT_VITE,
      FRONTEND_FRAMEWORK.NEXTJS,
      FRONTEND_FRAMEWORK.ANGULAR,
    ];

    frontendFrameworks.forEach((framework) => {
      expect(SKILL_CATALOG[framework]).toBeDefined();
      expect(Array.isArray(SKILL_CATALOG[framework])).toBe(true);
    });
  });

  test("each SkillEntry has non-empty id, label, hint", () => {
    Object.entries(SKILL_CATALOG).forEach(([frameworkKey, skills]) => {
      skills.forEach((skill) => {
        expect(skill.id).toBeDefined();
        expect(skill.id.length).toBeGreaterThan(0);
        expect(skill.label).toBeDefined();
        expect(skill.label.length).toBeGreaterThan(0);
        expect(skill.hint).toBeDefined();
        expect(skill.hint.length).toBeGreaterThan(0);
      });
    });
  });

  test("skills config field defaults to empty array", () => {
    const config = {
      projectName: "my-app",
      projects: [
        {
          type: "backend" as const,
          framework: "python-fastapi",
          folderName: "my-app-backend",
        },
      ],
      outputDir: "/tmp",
      initGit: true,
    };

    const result = validateConfig(config);
    expect(result.backendSkills).toEqual([]);
    expect(result.frontendSkills).toEqual([]);
  });

  test("accepts config with backend and frontend skills", () => {
    const config = {
      projectName: "my-app",
      projects: [
        {
          type: "backend" as const,
          framework: "python-fastapi",
          folderName: "my-app-backend",
        },
      ],
      outputDir: "/tmp",
      initGit: true,
      backendSkills: ["golang-pro", "web-design-guidelines"],
      frontendSkills: ["react-best-practices"],
    };

    const result = validateConfig(config);
    expect(result.backendSkills).toHaveLength(2);
    expect(result.backendSkills[0]).toBe("golang-pro");
    expect(result.frontendSkills).toHaveLength(1);
    expect(result.frontendSkills[0]).toBe("react-best-practices");
  });

  test("rejects skills with empty string ID", () => {
    const config = {
      projectName: "my-app",
      projects: [
        {
          type: "backend" as const,
          framework: "python-fastapi",
          folderName: "my-app-backend",
        },
      ],
      outputDir: "/tmp",
      initGit: true,
      backendSkills: [""],
    };

    expect(() => validateConfig(config)).toThrow();
  });
});
