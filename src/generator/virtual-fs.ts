/**
 * Virtual File System using memfs
 * Provides in-memory file operations before atomic disk write
 */

import { promises as fs } from "fs";
import { join, dirname, normalize } from "pathe";
import { memfs } from "memfs";

export class VirtualFileSystem {
  private fs: ReturnType<typeof memfs>["fs"];
  private vol: ReturnType<typeof memfs>["vol"];

  constructor() {
    const { fs: memfsFs, vol } = memfs();
    this.fs = memfsFs;
    this.vol = vol;
  }

  /**
   * Write a file to the virtual filesystem
   * Automatically creates parent directories
   */
  writeFile(filePath: string, content: string | Buffer): void {
    const normalized = this.normalizePath(filePath);
    const dir = dirname(normalized);

    // Ensure parent directory exists
    if (dir && dir !== "/" && dir !== ".") {
      this.fs.mkdirSync(dir, { recursive: true });
    }

    this.fs.writeFileSync(normalized, content);
  }

  /**
   * Read a file from the virtual filesystem
   */
  readFile(filePath: string): string {
    return this.fs.readFileSync(this.normalizePath(filePath), "utf-8") as string;
  }

  /**
   * Read and parse a JSON file
   */
  readJson<T>(filePath: string): T {
    const content = this.readFile(filePath);
    return JSON.parse(content) as T;
  }

  /**
   * Write a JSON object to the virtual filesystem
   */
  writeJson<T>(filePath: string, data: T, indent: number = 2): void {
    this.writeFile(filePath, JSON.stringify(data, null, indent) + '\n');
  }

  /**
   * Check if a file or directory exists
   */
  exists(filePath: string): boolean {
    try {
      this.fs.statSync(this.normalizePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read directory contents
   */
  readdir(dirPath: string): string[] {
    try {
      return (this.fs.readdirSync(this.normalizePath(dirPath)) as string[]).sort();
    } catch {
      return [];
    }
  }

  /**
   * Create a directory (recursive, like mkdir -p)
   */
  mkdir(dirPath: string): void {
    this.fs.mkdirSync(this.normalizePath(dirPath), { recursive: true });
  }

  /**
   * Delete a file
   */
  delete(filePath: string): void {
    try {
      this.fs.unlinkSync(this.normalizePath(filePath));
    } catch {
      // Silently ignore if file doesn't exist
    }
  }

  /**
   * Clear all files from virtual filesystem
   */
  clear(): void {
    const { fs: newFs, vol } = memfs();
    this.fs = newFs;
    this.vol = vol;
  }

  /**
   * Write all files from virtual filesystem to real disk
   */
  async writeAllToDisk(outputDir: string): Promise<void> {
    const writeEntry = async (vfsPath: string, realPath: string): Promise<void> => {
      try {
        const stat = this.fs.statSync(vfsPath);

        if (stat.isDirectory()) {
          // Create directory
          await fs.mkdir(realPath, { recursive: true });

          // Recursively write children
          const entries = this.fs.readdirSync(vfsPath) as string[];
          for (const entry of entries) {
            await writeEntry(
              join(vfsPath, entry),
              join(realPath, entry)
            );
          }
        } else {
          // Write file
          const content = this.fs.readFileSync(vfsPath);
          await fs.mkdir(dirname(realPath), { recursive: true });
          await fs.writeFile(realPath, content);
        }
      } catch (error) {
        console.error(`Failed to write ${realPath}:`, error);
        throw error;
      }
    };

    await writeEntry("/", outputDir);
  }

  /**
   * Get all file paths relative to root (for debugging/testing)
   */
  getAllFiles(): string[] {
    const files: string[] = [];

    const walk = (dir: string): void => {
      try {
        const entries = this.fs.readdirSync(dir, { withFileTypes: true }) as any[];
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
          } else {
            files.push(fullPath.replace(/^\//, ""));
          }
        }
      } catch {
        // Silently ignore errors
      }
    };

    walk("/");
    return files.sort();
  }

  /**
   * Normalize path to absolute within VFS
   */
  private normalizePath(filePath: string): string {
    const normalized = normalize(filePath);
    return normalized.startsWith("/") ? normalized : "/" + normalized;
  }
}
