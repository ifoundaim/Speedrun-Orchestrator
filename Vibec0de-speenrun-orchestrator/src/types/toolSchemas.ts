import { z } from "zod";

const trimmedString = (field: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(maxLength, `${field} must be ${maxLength} characters or fewer`);

export const generateSpeedrunPlanSchema = {
  productName: trimmedString("productName", 100).describe(
    "Name of the devtool or product being featured",
  ),
  stack: trimmedString("stack", 200).describe(
    "Primary stack or tech selections for the episode (e.g., Next.js + TypeScript)",
  ),
  docSummary: trimmedString("docSummary", 600)
    .describe("Optional summary from analyzeDocs to weave into the plan")
    .optional(),
  keyConcepts: z
    .array(trimmedString("key concept", 160))
    .min(1, "keyConcepts must include at least one entry")
    .max(10, "keyConcepts must include 10 entries or fewer")
    .describe("Key concepts surfaced by analyzeDocs")
    .optional(),
  suggestedFocusAreas: z
    .array(trimmedString("focus area", 160))
    .min(1, "suggestedFocusAreas must include at least one entry")
    .max(10, "suggestedFocusAreas must include 10 entries or fewer")
    .describe("Focus areas pulled from analyzeDocs")
    .optional(),
};

export type SpeedrunPlanInput = {
  productName: string;
  stack: string;
  docSummary?: string;
  keyConcepts?: string[];
  suggestedFocusAreas?: string[];
};

export type SpeedrunPlanOutput = {
  steps: string[];
  notes?: string;
};

export const clipOutlineSchema = {
  productName: trimmedString("productName", 100).describe(
    "Name of the product the clip references",
  ),
  mainWin: trimmedString("mainWin", 200).describe(
    "Primary win or benefit you achieved during the session",
  ),
  mainPain: trimmedString("mainPain", 200).describe(
    "Key pain point the product solves",
  ),
  planSteps: z
    .array(trimmedString("plan step", 240))
    .min(1, "planSteps must include at least one entry")
    .max(10, "planSteps must include 10 entries or fewer")
    .describe("Steps from the speedrun plan to reference in clips")
    .optional(),
  docSummary: trimmedString("docSummary", 600)
    .describe("Docs insight to echo inside clip descriptions")
    .optional(),
};

export type ClipIdea = {
  title: string;
  hook: string;
  description: string;
};

export type ClipOutlineInput = {
  productName: string;
  mainWin: string;
  mainPain: string;
  planSteps?: string[];
  docSummary?: string;
};

export type ClipOutlineOutput = {
  clips: ClipIdea[];
};

export const analyzeDocsSchema = {
  url: z
    .string()
    .trim()
    .url("Provide a valid documentation URL")
    .max(500, "URL must be 500 characters or fewer")
    .describe("Documentation URL to summarize"),
};

export type AnalyzeDocsInput = {
  url: string;
};

export type AnalyzeDocsOutput = {
  summary: string;
  keyConcepts: string[];
  suggestedFocusAreas?: string[];
};

export const orchestrateWorkflowSchema = {
  url: analyzeDocsSchema.url,
  productName: generateSpeedrunPlanSchema.productName,
  stack: generateSpeedrunPlanSchema.stack,
  mainWin: clipOutlineSchema.mainWin,
  mainPain: clipOutlineSchema.mainPain,
};

export type SpeedrunWorkflowInput = {
  url: string;
  productName: string;
  stack: string;
  mainWin: string;
  mainPain: string;
};

export type SpeedrunWorkflowOutput = {
  docs: AnalyzeDocsOutput;
  plan: SpeedrunPlanOutput;
  clips: ClipOutlineOutput;
};

