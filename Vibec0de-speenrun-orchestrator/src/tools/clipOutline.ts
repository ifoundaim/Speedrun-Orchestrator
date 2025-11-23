import { type ToolMetadata, type InferSchema } from "xmcp";
import {
  clipOutlineSchema,
  type ClipIdea,
  type ClipOutlineInput,
  type ClipOutlineOutput,
} from "../types/toolSchemas";

export const schema = clipOutlineSchema;

export const metadata: ToolMetadata = {
  name: "clipOutline",
  description: "Suggest short-form clip hooks derived from a devtool session.",
  annotations: {
    title: "Outline short-form clips",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

type ClipFactory = (input: ClipOutlineInput) => ClipIdea;

const ellipsize = (value: string, maxLength = 160) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trim()}...`;

const heroStep = (planSteps?: string[]): string | undefined => {
  if (!planSteps?.length) {
    return undefined;
  }

  const highlight = planSteps.find((step) => {
    const normalized = step.toLowerCase();
    return (
      normalized.includes("highlight") ||
      normalized.includes("hero") ||
      normalized.includes("stretch goal")
    );
  });

  return highlight ?? planSteps[planSteps.length - 1];
};

const decorateClip = (clip: ClipIdea, input: ClipOutlineInput): ClipIdea => {
  const extraParts: string[] = [];

  if (input.docSummary) {
    extraParts.push(`Tie back to the doc insight: ${ellipsize(input.docSummary, 140)}`);
  }

  const hero = heroStep(input.planSteps);
  if (hero) {
    extraParts.push(`Use the "${hero}" beat as the visual hook.`);
  }

  if (extraParts.length === 0) {
    return clip;
  }

  return {
    ...clip,
    description: `${clip.description} ${extraParts.join(" ")}`.trim(),
  };
};

const clipFactories: ClipFactory[] = [
  (input) => {
    const hero = heroStep(input.planSteps);
    return {
      title: `${input.productName} Hero Moment`,
      hook: hero
        ? `Relive "${hero}" in under 90 seconds.`
        : `Relive the moment ${input.productName} unlocked ${input.mainWin}.`,
      description: `Recreate the aha moment so viewers see the ${input.mainWin} payoff live.`,
    };
  },
  ({ productName, mainPain, mainWin }) => ({
    title: `${productName} vs. ${mainPain}`,
    hook: `Still fighting ${mainPain}? Watch ${productName} erase it in one take.`,
    description: `Contrast the legacy pain with the ${mainWin} moment inside the session.`,
  }),
  ({ productName, mainWin, planSteps }) => {
    const opener = planSteps?.[0];
    return {
      title: `${productName} Speedrun`,
      hook: opener
        ? `Step 1: ${opener}. Step 2: ship ${mainWin}.`
        : `We built ${mainWin} with ${productName} in minutes.`,
      description: `Fast-forward through the setup, highlight the aha moment, and show the final output.`,
    };
  },
  ({ productName, mainPain }) => ({
    title: `From friction to flow with ${productName}`,
    hook: `The fastest way we found to skip ${mainPain}?`,
    description: `Narrate how the tool reframes the workflow and the exact commands/settings used.`,
  }),
  ({ productName, mainWin }) => ({
    title: `${productName} Pro Tip`,
    hook: `Use this one ${productName} trick to unlock ${mainWin}.`,
    description: `Zoom in on the most cinematic moment—UI state, logs, or dashboard—and tease the recipe.`,
  }),
];

const buildClips = (input: ClipOutlineInput): ClipIdea[] => {
  const seen = new Set<string>();
  const clips = clipFactories
    .map((factory) => decorateClip(factory(input), input))
    .filter((clip) => {
      const normalizedTitle = clip.title.toLowerCase();
      if (seen.has(normalizedTitle)) {
        return false;
      }
      seen.add(normalizedTitle);
      return true;
    });

  return clips.slice(0, 5);
};

export default function clipOutline(
  input: InferSchema<typeof schema>,
): ClipOutlineOutput {
  return { clips: buildClips(input) };
}

