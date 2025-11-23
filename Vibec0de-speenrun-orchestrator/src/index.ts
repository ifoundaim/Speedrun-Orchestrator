/**
 * Central exports so the project can be consumed as a module (e.g., for tests).
 * XMCP still auto-discovers tools/prompts/resources via paths configured in
 * `xmcp.config.ts`, but keeping everything wired here helps with IDE navigation.
 */
export {
  default as greet,
  schema as greetToolSchema,
  metadata as greetMetadata,
} from "./tools/greet";

export {
  default as generateSpeedrunPlan,
  schema as generateSpeedrunPlanToolSchema,
  metadata as generateSpeedrunPlanMetadata,
} from "./tools/generateSpeedrunPlan";

export {
  default as clipOutline,
  schema as clipOutlineToolSchema,
  metadata as clipOutlineMetadata,
} from "./tools/clipOutline";

export {
  default as analyzeDocs,
  schema as analyzeDocsToolSchema,
  metadata as analyzeDocsMetadata,
} from "./tools/analyzeDocs";

export {
  default as orchestrateSpeedrunWorkflow,
  schema as orchestrateSpeedrunWorkflowToolSchema,
  metadata as orchestrateSpeedrunWorkflowMetadata,
} from "./tools/orchestrateWorkflow";

export type {
  SpeedrunPlanInput,
  SpeedrunPlanOutput,
  ClipOutlineInput,
  ClipOutlineOutput,
  AnalyzeDocsInput,
  AnalyzeDocsOutput,
  SpeedrunWorkflowInput,
  SpeedrunWorkflowOutput,
} from "./types/toolSchemas";

