import { type ToolMetadata, type InferSchema } from "xmcp";
import {
  generateSpeedrunPlanSchema,
  type SpeedrunPlanInput,
  type SpeedrunPlanOutput,
} from "../types/toolSchemas";

export const schema = generateSpeedrunPlanSchema;

export const metadata: ToolMetadata = {
  name: "generateSpeedrunPlan",
  description: "Create a 30–45 minute devtool speedrun outline anchored to the chosen stack.",
  annotations: {
    title: "Generate speedrun plan",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

type Template = {
  id: string;
  matcher: (input: SpeedrunPlanInput) => boolean;
  steps: string[];
  notes?: string;
};

const ellipsize = (value: string, maxLength = 180) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3).trim()}...`;
};

const baseSteps = (input: SpeedrunPlanInput) => [
  `Scan ${input.productName} docs, quickstart, and release notes`,
  `Bootstrap a ${input.stack} sandbox with linting + env ready`,
  `Ship the simplest ${input.productName} hello-world integration`,
  `Highlight one signature ${input.productName} capability end-to-end`,
  `Add a stretch goal, test, or deployment polish`,
];

const templates: Template[] = [
  {
    id: "nextjs",
    matcher: ({ stack }) => stack.toLowerCase().includes("next"),
    steps: [
      "Skim product launch notes + App Router recommendations",
      "Create Next.js (TypeScript) project with Turbopack dev server",
      "Model data/contracts and scaffold API route or server action",
      "Embed the product SDK inside a Route Handler + UI surface",
      "Ship stretch goal: streaming UI or deploy to Vercel preview",
    ],
    notes: "Lean on Next.js App Router conventions and Vercel preview deploys.",
  },
  {
    id: "node-cli",
    matcher: ({ stack }) => {
      const normalized = stack.toLowerCase();
      return normalized.includes("node") || normalized.includes("express");
    },
    steps: [
      "Review product CLI/server quickstart & auth setup",
      "Initialize Node project with tsx + dotenv",
      "Stand up minimal HTTP endpoint or CLI command",
      "Demonstrate one hero workflow end-to-end",
      "Add observability or config tweak as stretch goal",
    ],
    notes: "Favor tsx + nodemon for quick iterations; capture logs for narration.",
  },
  {
    id: "xmcp",
    matcher: ({ productName }) => productName.toLowerCase().includes("xmcp"),
    steps: [
      "Scan XMCP docs & sample MCP servers",
      "Bootstrap create-xmcp-app with HTTP transport",
      "Define schema-driven tool handlers for the key workflow",
      "Run through a mock MCP invocation with captured output",
      "Add extra tool or resource plus README polish",
    ],
    notes: "Highlight schema-driven tooling and how AI clients call MCP endpoints.",
  },
];

const docContextSteps = (input: SpeedrunPlanInput): string[] => {
  const steps: string[] = [];

  if (input.docSummary) {
    steps.push(
      `Narrate the doc takeaway: ${ellipsize(input.docSummary, 140)}`,
    );
  }

  if (input.keyConcepts?.length) {
    const highlights = input.keyConcepts.slice(0, 2).join(", ");
    steps.push(`Thread in the key concepts (${highlights}) while building.`);
  }

  if (input.suggestedFocusAreas?.length) {
    steps.push(
      `Call out why ${input.suggestedFocusAreas[0]} matters before the demo outro.`,
    );
  }

  return steps;
};

const clampSteps = (input: SpeedrunPlanInput, candidateSteps: string[]): string[] => {
  const sanitized = candidateSteps
    .map((step) => step.trim())
    .filter((step) => step.length > 0);

  const filler = baseSteps(input);
  let fillerIndex = 0;

  while (sanitized.length < 4 && fillerIndex < filler.length) {
    sanitized.push(filler[fillerIndex++]);
  }

  if (sanitized.length === 0) {
    return filler.slice(0, 5);
  }

  return sanitized.slice(0, 6);
};

const weaveDocInsights = (baseStepsList: string[], input: SpeedrunPlanInput) => {
  const insights = docContextSteps(input);
  if (!insights.length) {
    return baseStepsList;
  }

  const result = [...baseStepsList];
  insights.forEach((insight, index) => {
    const insertAt = index === 0 ? 0 : Math.min(2 + index, result.length);
    result.splice(insertAt, 0, insight);
  });
  return result;
};

const buildNotes = (input: SpeedrunPlanInput, templateNotes?: string) => {
  const parts: string[] = [];
  if (templateNotes) {
    parts.push(templateNotes);
  }
  if (input.keyConcepts?.length) {
    parts.push(`Hit the docs concepts: ${input.keyConcepts.slice(0, 3).join(", ")}.`);
  }
  if (input.suggestedFocusAreas?.length) {
    parts.push(
      `Keep the narrative focused on ${input.suggestedFocusAreas.slice(0, 2).join(" & ")}.`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
};

const buildPlan = (input: SpeedrunPlanInput): SpeedrunPlanOutput => {
  const match = templates.find((template) => template.matcher(input));
  const candidateSteps = weaveDocInsights(match?.steps ?? baseSteps(input), input);
  const steps = clampSteps(input, candidateSteps);
  const notes = buildNotes(input, match?.notes);

  return {
    steps,
    ...(notes ? { notes } : {}),
  };
};

export default function generateSpeedrunPlan(
  input: InferSchema<typeof schema>,
): SpeedrunPlanOutput {
  return buildPlan(input);
}

