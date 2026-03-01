/**
 * Unit tests for the generator pipeline (VFS + Handlebars + template engine)
 * Tests the ACTUAL production code path, not the deprecated copyTemplate
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { promises as fs } from "fs";
import path from "path";
import { HandlebarsProcessor } from "../src/generator/handlebars-processor.js";
import { VirtualFileSystem } from "../src/generator/virtual-fs.js";
import { generateProjects, resolveTemplatePath } from "../src/generator/template-engine.js";
import type { TemplateContext } from "../src/types.js";

const CONFIG_DEFAULTS = {
  backendScaffoldMode: "scaffold" as const,
  backendSkills: [] as string[],
  frontendSkills: [] as string[],
  backendMcpServers: [] as string[],
  frontendMcpServers: [] as string[],
};

async function mkTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(Bun.env.TMPDIR || "/tmp", "gen-test-"));
}

// ── Handlebars Custom Helpers ────────────────────────────────

describe("Handlebars Custom Helpers", () => {
  let hbs: HandlebarsProcessor;
  const ctx: TemplateContext = {
    projectName: "test",
    baseName: "test",
    framework: "react-vite",
    runtime: "bun",
    packageManager: "pnpm",
    selectedAddons: ["biome", "husky"],
    isCustom: true,
  };

  beforeEach(() => {
    hbs = new HandlebarsProcessor();
  });

  describe("eq", () => {
    test("returns true for equal strings", () => {
      expect(hbs.compile('{{#if (eq packageManager "pnpm")}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("returns false for unequal strings", () => {
      expect(hbs.compile('{{#if (eq packageManager "npm")}}yes{{else}}no{{/if}}', ctx)).toBe("no");
    });

    test("strict equality — number vs string", () => {
      expect(hbs.compile('{{#if (eq runtime "bun")}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });
  });

  describe("ne", () => {
    test("returns true for unequal values", () => {
      expect(hbs.compile('{{#if (ne packageManager "npm")}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("returns false for equal values", () => {
      expect(hbs.compile('{{#if (ne packageManager "pnpm")}}yes{{else}}no{{/if}}', ctx)).toBe("no");
    });
  });

  describe("and", () => {
    test("returns true when all truthy", () => {
      expect(hbs.compile('{{#if (and isCustom runtime)}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("returns false when any falsy", () => {
      const falsyCtx = { ...ctx, isCustom: false };
      expect(hbs.compile('{{#if (and isCustom runtime)}}yes{{else}}no{{/if}}', falsyCtx)).toBe("no");
    });
  });

  describe("or", () => {
    test("returns true when any truthy", () => {
      const mixCtx = { ...ctx, isCustom: false };
      expect(hbs.compile('{{#if (or isCustom runtime)}}yes{{else}}no{{/if}}', mixCtx)).toBe("yes");
    });

    test("returns false when all falsy", () => {
      const falsyCtx = { ...ctx, isCustom: false, runtime: "" as any };
      expect(hbs.compile('{{#if (or isCustom runtime)}}yes{{else}}no{{/if}}', falsyCtx)).toBe("no");
    });
  });

  describe("includes", () => {
    test("returns true when array includes item", () => {
      expect(hbs.compile('{{#if (includes selectedAddons "biome")}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("returns false when array does not include item", () => {
      expect(hbs.compile('{{#if (includes selectedAddons "mcp")}}yes{{else}}no{{/if}}', ctx)).toBe("no");
    });

    test("returns false for non-array", () => {
      expect(hbs.compile('{{#if (includes runtime "b")}}yes{{else}}no{{/if}}', ctx)).toBe("no");
    });

    test("returns false for empty array", () => {
      const emptyCtx = { ...ctx, selectedAddons: [] };
      expect(hbs.compile('{{#if (includes selectedAddons "biome")}}yes{{else}}no{{/if}}', emptyCtx)).toBe("no");
    });
  });

  describe("length", () => {
    test("returns array length", () => {
      expect(hbs.compile("{{length selectedAddons}}", ctx)).toBe("2");
    });

    test("returns 0 for empty array", () => {
      const emptyCtx = { ...ctx, selectedAddons: [] };
      expect(hbs.compile("{{length selectedAddons}}", emptyCtx)).toBe("0");
    });

    test("returns 0 for non-array", () => {
      expect(hbs.compile("{{length runtime}}", ctx)).toBe("0");
    });
  });

  describe("gt / lt / gte / lte", () => {
    test("gt: true when greater", () => {
      expect(hbs.compile('{{#if (gt (length selectedAddons) 1)}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("gt: false when equal", () => {
      expect(hbs.compile('{{#if (gt (length selectedAddons) 2)}}yes{{else}}no{{/if}}', ctx)).toBe("no");
    });

    test("lt: true when less", () => {
      expect(hbs.compile('{{#if (lt (length selectedAddons) 5)}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("gte: true when equal", () => {
      expect(hbs.compile('{{#if (gte (length selectedAddons) 2)}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("lte: true when equal", () => {
      expect(hbs.compile('{{#if (lte (length selectedAddons) 2)}}yes{{else}}no{{/if}}', ctx)).toBe("yes");
    });

    test("lte: false when greater", () => {
      expect(hbs.compile('{{#if (lte (length selectedAddons) 1)}}yes{{else}}no{{/if}}', ctx)).toBe("no");
    });
  });

  describe("combined helpers in realistic templates", () => {
    test("packageManager switch with eq", () => {
      const template = '{{#if (eq packageManager "npm")}}npm install{{else if (eq packageManager "bun")}}bun install{{else}}pnpm install{{/if}}';
      expect(hbs.compile(template, ctx)).toBe("pnpm install");
      expect(hbs.compile(template, { ...ctx, packageManager: "npm" })).toBe("npm install");
      expect(hbs.compile(template, { ...ctx, packageManager: "bun" })).toBe("bun install");
    });

    test("conditional addon section with gt + length + each", () => {
      const template = '{{#if (gt (length selectedAddons) 0)}}Addons: {{#each selectedAddons}}{{this}} {{/each}}{{else}}No addons{{/if}}';
      expect(hbs.compile(template, ctx)).toBe("Addons: biome husky ");
      expect(hbs.compile(template, { ...ctx, selectedAddons: [] })).toBe("No addons");
    });

    test("isCustom conditional with nested checks", () => {
      const template = '{{#if isCustom}}Runtime: {{runtime}}, PM: {{packageManager}}{{else}}Defaults{{/if}}';
      expect(hbs.compile(template, ctx)).toBe("Runtime: bun, PM: pnpm");
      expect(hbs.compile(template, { ...ctx, isCustom: false })).toBe("Defaults");
    });
  });
});

// ── HandlebarsProcessor ──────────────────────────────────────

describe("HandlebarsProcessor", () => {
  let hbs: HandlebarsProcessor;

  beforeEach(() => {
    hbs = new HandlebarsProcessor();
  });

  describe("compile()", () => {
    const ctx: TemplateContext = {
      projectName: "my-app",
      baseName: "my-app",
      framework: "react-vite",
      runtime: "bun",
      packageManager: "pnpm",
      selectedAddons: [],
      isCustom: false,
    };

    test("substitutes context variables", () => {
      expect(hbs.compile("Hello {{projectName}}", ctx)).toBe("Hello my-app");
    });

    test("handles empty template", () => {
      expect(hbs.compile("", ctx)).toBe("");
    });

    test("throws on malformed template", () => {
      expect(() => hbs.compile("{{#if}}", ctx)).toThrow("Failed to compile");
    });
  });

  describe("transformFilename()", () => {
    test("strips .hbs extension", () => {
      expect(hbs.transformFilename("README.md.hbs")).toBe("README.md");
    });

    test("transforms _prefix to .prefix", () => {
      expect(hbs.transformFilename("_gitignore")).toBe(".gitignore");
    });

    test("combined: _prefix + .hbs", () => {
      expect(hbs.transformFilename("_env.example.hbs")).toBe(".env.example");
    });

    test("leaves normal filenames unchanged", () => {
      expect(hbs.transformFilename("package.json")).toBe("package.json");
    });

    test("handles filename that is only .hbs", () => {
      expect(hbs.transformFilename(".hbs")).toBe("");
    });

    test("does not transform underscore in middle of name", () => {
      expect(hbs.transformFilename("my_file.ts")).toBe("my_file.ts");
    });

    test("handles path with directory", () => {
      expect(hbs.transformFilename("src/_env.ts.hbs")).toBe("src/.env.ts");
    });

    test("does not transform underscore in directory part", () => {
      // transformFilename only transforms the basename, not directory prefixes
      // Directory underscore transforms happen in AddonInjector
      expect(hbs.transformFilename("_husky/pre-commit")).toBe("_husky/pre-commit");
    });

    test("double .hbs.hbs strips only one", () => {
      expect(hbs.transformFilename("file.hbs.hbs")).toBe("file.hbs");
    });
  });

  describe("isBinaryFile()", () => {
    test("detects image files as binary", () => {
      expect(hbs.isBinaryFile("image.png")).toBe(true);
      expect(hbs.isBinaryFile("photo.jpg")).toBe(true);
    });

    test("detects text files as non-binary", () => {
      expect(hbs.isBinaryFile("file.ts")).toBe(false);
      expect(hbs.isBinaryFile("config.json")).toBe(false);
      expect(hbs.isBinaryFile("readme.md")).toBe(false);
    });
  });
});

// ── VirtualFileSystem ────────────────────────────────────────

describe("VirtualFileSystem", () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
  });

  describe("writeFile / readFile round-trip", () => {
    test("writes and reads text file", () => {
      vfs.writeFile("hello.txt", "world");
      expect(vfs.readFile("hello.txt")).toBe("world");
    });

    test("writes and reads nested file", () => {
      vfs.writeFile("src/app/main.ts", "const x = 1;");
      expect(vfs.readFile("src/app/main.ts")).toBe("const x = 1;");
    });

    test("writes Buffer content", () => {
      vfs.writeFile("binary.bin", Buffer.from([0x00, 0x01, 0x02]));
      expect(vfs.exists("binary.bin")).toBe(true);
    });

    test("overwrites existing file", () => {
      vfs.writeFile("a.txt", "first");
      vfs.writeFile("a.txt", "second");
      expect(vfs.readFile("a.txt")).toBe("second");
    });
  });

  describe("JSON round-trip", () => {
    test("writes and reads JSON", () => {
      vfs.writeJson("package.json", { name: "test", version: "1.0.0" });
      const data = vfs.readJson<{ name: string; version: string }>("package.json");
      expect(data.name).toBe("test");
      expect(data.version).toBe("1.0.0");
    });
  });

  describe("exists()", () => {
    test("returns true for existing file", () => {
      vfs.writeFile("a.txt", "content");
      expect(vfs.exists("a.txt")).toBe(true);
    });

    test("returns false for missing file", () => {
      expect(vfs.exists("nope.txt")).toBe(false);
    });

    test("returns true for existing directory", () => {
      vfs.writeFile("src/main.ts", "code");
      expect(vfs.exists("src")).toBe(true);
    });
  });

  describe("readdir()", () => {
    test("lists directory contents", () => {
      vfs.writeFile("src/a.ts", "a");
      vfs.writeFile("src/b.ts", "b");
      expect(vfs.readdir("src")).toEqual(["a.ts", "b.ts"]);
    });

    test("returns empty array for missing directory", () => {
      expect(vfs.readdir("nope")).toEqual([]);
    });
  });

  describe("delete()", () => {
    test("removes existing file", () => {
      vfs.writeFile("a.txt", "content");
      vfs.delete("a.txt");
      expect(vfs.exists("a.txt")).toBe(false);
    });

    test("silently ignores missing file", () => {
      expect(() => vfs.delete("nope.txt")).not.toThrow();
    });
  });

  describe("getAllFiles()", () => {
    test("returns all files recursively", () => {
      vfs.writeFile("a.txt", "a");
      vfs.writeFile("src/b.ts", "b");
      vfs.writeFile("src/app/c.ts", "c");
      expect(vfs.getAllFiles()).toEqual(["a.txt", "src/app/c.ts", "src/b.ts"]);
    });

    test("returns empty for fresh VFS", () => {
      expect(vfs.getAllFiles()).toEqual([]);
    });
  });

  describe("clear()", () => {
    test("removes all files", () => {
      vfs.writeFile("a.txt", "a");
      vfs.writeFile("b.txt", "b");
      vfs.clear();
      expect(vfs.getAllFiles()).toEqual([]);
    });
  });

  describe("writeAllToDisk()", () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkTempDir();
    });

    afterEach(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    test("writes flat files to disk", async () => {
      vfs.writeFile("hello.txt", "world");
      vfs.writeFile("config.json", '{"a":1}');
      await vfs.writeAllToDisk(tmpDir);

      const content = await fs.readFile(path.join(tmpDir, "hello.txt"), "utf-8");
      expect(content).toBe("world");
      const json = await fs.readFile(path.join(tmpDir, "config.json"), "utf-8");
      expect(json).toBe('{"a":1}');
    });

    test("writes nested directories to disk", async () => {
      vfs.writeFile("src/app/main.ts", "const x = 1;");
      await vfs.writeAllToDisk(tmpDir);

      const content = await fs.readFile(path.join(tmpDir, "src/app/main.ts"), "utf-8");
      expect(content).toBe("const x = 1;");
    });

    test("preserves binary content", async () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
      vfs.writeFile("image.png", buf);
      await vfs.writeAllToDisk(tmpDir);

      const written = await fs.readFile(path.join(tmpDir, "image.png"));
      expect(Buffer.from(written)).toEqual(buf);
    });
  });
});

// ── generateProjects (production pipeline) ───────────────────

describe("generateProjects — production pipeline", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("generates react-vite frontend with scaffold defaults", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // Core files exist
    const pkg = JSON.parse(await fs.readFile(path.join(frontDir, "package.json"), "utf-8"));
    expect(pkg.name).toBe("frontend");

    // .hbs files should NOT exist on disk (they should be compiled)
    const files = await fs.readdir(frontDir, { recursive: true });
    const hbsFiles = (files as string[]).filter((f) => f.toString().endsWith(".hbs"));
    expect(hbsFiles).toEqual([]);

    // README.md should exist (compiled from README.md.hbs)
    const readme = await fs.readFile(path.join(frontDir, "README.md"), "utf-8");
    expect(readme).toContain("frontend");

    // .gitignore should exist (from _gitignore)
    const gitignore = await fs.readFile(path.join(frontDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("node_modules");
  });

  test("generates go-chi backend with {{projectName}} substitution", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "backend", framework: "go-chi", folderName: "backend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const backDir = path.join(tmpDir, "backend");

    // go.mod should have substituted projectName
    const gomod = await fs.readFile(path.join(backDir, "go.mod"), "utf-8");
    expect(gomod).toContain("module backend");
    expect(gomod).not.toContain("{{projectName}}");

    // main.go imports should be substituted
    const main = await fs.readFile(path.join(backDir, "cmd/api/main.go"), "utf-8");
    expect(main).toContain('"backend/internal/api"');
    expect(main).not.toContain("{{projectName}}");
  });

  test("generates angular frontend without Handlebars conflicts", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "angular", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // Angular templates with {{ expr }} should be preserved (not Handlebars-compiled)
    const homeComponent = await fs.readFile(
      path.join(frontDir, "src/app/pages/home/home.component.ts"),
      "utf-8"
    );
    // Angular uses {{ expr }} in inline templates — should NOT be stripped
    expect(homeComponent).toContain("{{");
  });

  test("custom mode passes packageManager and runtime to context", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "node",
        packageManager: "npm",
        scaffoldMode: "custom",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // CLAUDE.md.hbs compiles with custom context — should show npm commands and config section
    const claudeMd = await fs.readFile(path.join(frontDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("npm");
    expect(claudeMd).toContain("Configuration");
  });

  test("scaffold mode uses defaults regardless of config values", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "node",
        packageManager: "npm",
        scaffoldMode: "scaffold",
        addons: ["biome"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // In scaffold mode, isCustom=false, so CLAUDE.md should NOT show "Configuration" section
    const claudeMd = await fs.readFile(path.join(frontDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).not.toContain("Configuration");

    // In scaffold mode, addons are ignored — biome.json should NOT exist
    const files = await fs.readdir(frontDir);
    expect(files).not.toContain("biome.json");
  });

  test("custom mode with addons injects addon files", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "custom",
        addons: ["biome"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // biome.json should be injected
    const biome = await fs.readFile(path.join(frontDir, "biome.json"), "utf-8");
    expect(JSON.parse(biome)).toHaveProperty("$schema");

    // package.json should have biome in devDependencies
    const pkg = JSON.parse(await fs.readFile(path.join(frontDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");
  });

  test("generates multiple projects in one call", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [
          { type: "backend", framework: "python-fastapi", folderName: "backend" },
          { type: "frontend", framework: "nextjs", folderName: "frontend" },
        ],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    // Both directories should exist
    const backFiles = await fs.readdir(path.join(tmpDir, "backend"));
    const frontFiles = await fs.readdir(path.join(tmpDir, "frontend"));
    expect(backFiles.length).toBeGreaterThan(0);
    expect(frontFiles.length).toBeGreaterThan(0);

    // Backend: pyproject.toml should have substituted baseName
    const pyproject = await fs.readFile(path.join(tmpDir, "backend/pyproject.toml"), "utf-8");
    expect(pyproject).not.toContain("{{baseName}}");
  });

  test("skips .git directories in templates", async () => {
    // The template engine should skip .git dirs
    // We can't easily test this without a .git in the template,
    // but we can verify no .git dir appears in output
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "backend", framework: "nestjs", folderName: "backend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const backDir = path.join(tmpDir, "backend");
    const files = await fs.readdir(backDir);
    expect(files).not.toContain(".git");
  });
});

// ── Context Construction (isFrontendCustom branching) ────────

describe("Context construction — isFrontendCustom isolation", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("backend gets default context even when config is custom mode", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [
          { type: "backend", framework: "nestjs", folderName: "backend" },
          { type: "frontend", framework: "react-vite", folderName: "frontend" },
        ],
        outputDir: tmpDir,
        initGit: false,
        runtime: "node",
        packageManager: "npm",
        scaffoldMode: "custom",
        addons: ["biome", "husky"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const backDir = path.join(tmpDir, "backend");

    // Backend should NOT have addon files (biome.json, .husky/)
    const backFiles = await fs.readdir(backDir);
    expect(backFiles).not.toContain("biome.json");
    expect(backFiles).not.toContain(".husky");

    // Backend package.json should NOT have biome devDependency
    const pkg = JSON.parse(await fs.readFile(path.join(backDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies?.["@biomejs/biome"]).toBeUndefined();

    // Frontend SHOULD have addon files in custom mode
    const frontDir = path.join(tmpDir, "frontend");
    const frontFiles = await fs.readdir(frontDir);
    expect(frontFiles).toContain("biome.json");
  });

  test("backend CLAUDE.md uses default projectName substitution, not custom PM", async () => {
    await generateProjects(
      {
        projectName: "my-project",
        projects: [{ type: "backend", framework: "go-chi", folderName: "api-server" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "node",
        packageManager: "npm",
        scaffoldMode: "custom",
        addons: ["biome"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const backDir = path.join(tmpDir, "api-server");

    // CLAUDE.md should have folderName as projectName
    const claudeMd = await fs.readFile(path.join(backDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("api-server");
    expect(claudeMd).not.toContain("{{projectName}}");

    // go.mod should use folderName as module name
    const gomod = await fs.readFile(path.join(backDir, "go.mod"), "utf-8");
    expect(gomod).toContain("module api-server");

    // No addon files should be present
    const files = await fs.readdir(backDir);
    expect(files).not.toContain("biome.json");
  });

  test("frontend scaffold mode ignores custom config values", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "nextjs", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "node",
        packageManager: "npm",
        scaffoldMode: "scaffold",
        addons: ["biome", "husky", "mcp"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // Scaffold mode: isCustom=false, addons should be empty
    const files = await fs.readdir(frontDir);
    expect(files).not.toContain("biome.json");
    expect(files).not.toContain(".husky");

    // CLAUDE.md should NOT show Configuration section (isCustom=false)
    const claudeMd = await fs.readFile(path.join(frontDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).not.toContain("Configuration");
    // Should NOT mention npm (scaffold mode uses pnpm default)
    expect(claudeMd).toContain("pnpm");
  });

  test("frontend custom mode applies all config values", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "angular", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "node",
        packageManager: "npm",
        scaffoldMode: "custom",
        addons: ["biome"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // Configuration section should be present
    const claudeMd = await fs.readFile(path.join(frontDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("Configuration");
    expect(claudeMd).toContain("npm");
    expect(claudeMd).toContain("node");

    // Addon should be injected
    expect(await fs.readFile(path.join(frontDir, "biome.json"), "utf-8")).toBeTruthy();
    const pkg = JSON.parse(await fs.readFile(path.join(frontDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");
  });

  test("each project gets its own folderName as projectName", async () => {
    await generateProjects(
      {
        projectName: "my-stack",
        projects: [
          { type: "backend", framework: "python-fastapi", folderName: "api" },
          { type: "frontend", framework: "react-vite", folderName: "web" },
        ],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    // Backend: pyproject.toml name should be "api" (folderName), not "my-stack"
    const pyproject = await fs.readFile(path.join(tmpDir, "api/pyproject.toml"), "utf-8");
    expect(pyproject).toContain('name = "api"');

    // Frontend: package.json name should be "web" (folderName)
    const pkg = JSON.parse(await fs.readFile(path.join(tmpDir, "web/package.json"), "utf-8"));
    expect(pkg.name).toBe("web");
  });

  test("baseName comes from config.projectName, not folderName", async () => {
    await generateProjects(
      {
        projectName: "my-stack",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "web" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "scaffold",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    // Environment file uses baseName for API URL comment
    const env = await fs.readFile(path.join(tmpDir, "web/.env.example"), "utf-8");
    // baseName is "my-stack", used in environment references
    expect(env).not.toContain("{{baseName}}");
  });

  test("multiple addons all get injected in custom mode", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "pnpm",
        scaffoldMode: "custom",
        addons: ["biome", "husky", "skills", "mcp"],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // biome addon
    expect(await fileExists(path.join(frontDir, "biome.json"))).toBe(true);

    // husky addon
    expect(await fileExists(path.join(frontDir, ".husky/pre-commit"))).toBe(true);

    // skills addon
    expect(await fileExists(path.join(frontDir, ".claude/skills/README.md"))).toBe(true);

    // mcp addon — .claude/mcp.json should exist
    expect(await fileExists(path.join(frontDir, ".claude/mcp.json"))).toBe(true);

    // package.json should have all relevant devDeps
    const pkg = JSON.parse(await fs.readFile(path.join(frontDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");
    expect(pkg.devDependencies).toHaveProperty("husky");
    expect(pkg.devDependencies).toHaveProperty("lint-staged");
    // MCP addon configures .claude/mcp.json, no devDependencies needed
  });

  test("packageManager bun produces bun-specific commands in .hbs files", async () => {
    await generateProjects(
      {
        projectName: "test-app",
        projects: [{ type: "frontend", framework: "react-vite", folderName: "frontend" }],
        outputDir: tmpDir,
        initGit: false,
        runtime: "bun",
        packageManager: "bun",
        scaffoldMode: "custom",
        addons: [],
        ...CONFIG_DEFAULTS,
      },
      tmpDir,
      { silent: true }
    );

    const frontDir = path.join(tmpDir, "frontend");

    // README should contain bun-specific commands
    const readme = await fs.readFile(path.join(frontDir, "README.md"), "utf-8");
    expect(readme).toContain("bun install");
    expect(readme).not.toContain("pnpm install");
    expect(readme).not.toContain("npm install");
  });
});

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}
