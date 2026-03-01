/**
 * MCP server installation: writes .claude/mcp.json with selected server configs
 */

import { promises as fs } from "fs";
import path from "path";
import { spinner, log } from "@clack/prompts";
import { MCP_CATALOG } from "../constants.js";

/**
 * Install MCP servers by writing .claude/mcp.json into each project
 */
export async function installMcpServers(
  projectPaths: string[],
  serverIds: string[]
): Promise<void> {
  if (!serverIds || serverIds.length === 0) {
    return;
  }

  const s = spinner();
  s.start("Configuring MCP servers");

  try {
    // Build mcpServers config from catalog
    const mcpServers: Record<string, { command: string; args: string[] }> = {};

    for (const id of serverIds) {
      const entry = MCP_CATALOG.find((e) => e.id === id);
      if (!entry) {
        log.warn(`MCP server "${id}" not found in catalog — skipping`);
        continue;
      }
      mcpServers[entry.id] = {
        command: entry.command,
        args: entry.args,
      };
    }

    const mcpConfig = { mcpServers };

    for (const projectPath of projectPaths) {
      const claudeDir = path.join(projectPath, ".claude");
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, "mcp.json"),
        JSON.stringify(mcpConfig, null, 2) + "\n"
      );
    }

    s.stop("MCP servers configured");
  } catch (error) {
    if (error instanceof Error) {
      log.warn(`MCP configuration error: ${error.message}`);
    } else {
      log.warn("MCP configuration encountered an error");
    }
    s.stop("MCP configuration had issues (continuing)");
  }
}
