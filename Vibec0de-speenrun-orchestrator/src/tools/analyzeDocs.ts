import { type ToolMetadata, type InferSchema } from "xmcp";
import {
  analyzeDocsSchema,
  type AnalyzeDocsInput,
  type AnalyzeDocsOutput,
} from "../types/toolSchemas";

export const schema = analyzeDocsSchema;

export const metadata: ToolMetadata = {
  name: "analyzeDocs",
  description: "Summarize a docs page and extract the core concepts to study.",
  annotations: {
    title: "Analyze docs",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

type KnownDocSummary = AnalyzeDocsOutput & {
  aliases?: string[];
};

const knownDocs: Record<string, KnownDocSummary> = {
  "https://xmcp.dev/docs": {
    summary:
      "XMCP describes how to build Model Context Protocol servers with schema-first tools, prompts, and resources.",
    keyConcepts: [
      "XMCP structured project layout",
      "Tools/prompts/resources auto-discovery",
      "Transport adapters (HTTP & STDIO)",
      "Zod-driven schemas",
      "MCP server lifecycle",
    ],
    suggestedFocusAreas: [
      "How tools are exported and annotated",
      "Transport configuration for clients",
      "Using schemas to strongly-type handlers",
    ],
    aliases: ["https://xmcp.dev/docs/", "https://docs.xmcp.dev"],
  },
  "https://supabase.com/docs": {
    summary:
      "Supabase delivers a hosted Postgres stack with auth, storage, realtime, and edge functions accessible via REST, GraphQL, and client SDKs.",
    keyConcepts: [
      "Postgres + Row Level Security",
      "Auth providers & policies",
      "Edge Functions",
      "Realtime channels",
      "Storage buckets",
    ],
    suggestedFocusAreas: [
      "Quickstart for the target stack",
      "Policy authoring workflow",
      "Realtime broadcast demos",
    ],
    aliases: ["https://docs.supabase.com"],
  },
  "https://vercel.com/docs": {
    summary:
      "Vercel's docs cover deployment workflows for frontend frameworks, edge/serverless runtimes, and platform integrations.",
    keyConcepts: [
      "Project configuration (vercel.json)",
      "Edge Functions and regions",
      "Environment variables and secrets",
      "CI/CD previews",
      "Integrations & analytics",
    ],
    suggestedFocusAreas: [
      "Framework-specific quickstarts",
      "Preview deployments process",
      "Edge vs. serverless runtimes",
    ],
  },
};

const aliasLookup = new Map<string, AnalyzeDocsOutput>();
Object.entries(knownDocs).forEach(([url, summary]) => {
  aliasLookup.set(url, summary);
  summary.aliases?.forEach((alias) => aliasLookup.set(alias, summary));
});

const genericFallback = (input: AnalyzeDocsInput): AnalyzeDocsOutput => {
  let host = "the product";
  try {
    const parsed = new URL(input.url);
    host = parsed.hostname.replace("www.", "");
  } catch {
    // leave host as default
  }

  return {
    summary: `Documentation for ${host} likely covers setup, authentication, feature primitives, and integration recipes. Use it to capture the vocabulary you need before the speedrun.`,
    keyConcepts: [
      "Core primitives / nouns",
      "Authentication & authorization",
      "Quickstart or getting-started flow",
      "Integration or SDK usage",
      "Notable constraints / quotas",
    ],
    suggestedFocusAreas: [
      "Identify one flagship workflow worth demoing",
      "Capture terminology to narrate on-camera",
      "Note any setup blockers (auth keys, CLI install)",
    ],
  };
};

const fetchDocsSummary = async (
  url: string,
): Promise<AnalyzeDocsOutput | null> => {
  const known = aliasLookup.get(url) ?? aliasLookup.get(url.replace(/\/$/, ""));
  if (known) {
    return known;
  }

  // Placeholder for future fetch/LLM pipeline.
  return null;
};

export default async function analyzeDocs(
  input: InferSchema<typeof schema>,
): Promise<AnalyzeDocsOutput> {
  const stubbed = await fetchDocsSummary(input.url);
  return stubbed ?? genericFallback(input);
}

