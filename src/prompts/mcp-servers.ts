/**
 * MCP server selection prompt (multiselect)
 */

import { multiselect, cancel, isCancel } from "@clack/prompts";
import { MCP_CATALOG } from "../constants.js";

/**
 * Prompt for MCP server selection
 * All servers pre-selected by default
 * Returns array of selected MCP server IDs
 */
export async function promptMcpServers(): Promise<string[]> {
  if (MCP_CATALOG.length === 0) {
    return [];
  }

  const options = MCP_CATALOG.map((entry) => ({
    value: entry.id,
    label: entry.label,
    hint: entry.hint,
  }));

  const allValues = options.map((opt) => opt.value);

  const selected = await multiselect({
    message: "Select MCP servers to configure",
    options,
    initialValues: allValues,
    required: false,
  });

  if (isCancel(selected)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return selected as string[];
}
