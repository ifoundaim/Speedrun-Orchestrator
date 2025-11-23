import { type ToolMetadata, type InferSchema } from "xmcp";

import analyzeDocs from "./analyzeDocs";
import clipOutline from "./clipOutline";
import generateSpeedrunPlan from "./generateSpeedrunPlan";
import {
  orchestrateWorkflowSchema,
  type SpeedrunWorkflowOutput,
} from "../types/toolSchemas";

export const schema = orchestrateWorkflowSchema;

export const metadata: ToolMetadata = {
  name: "orchestrateSpeedrunWorkflow",
  description: "Run analyzeDocs → generateSpeedrunPlan → clipOutline with shared context.",
  annotations: {
    title: "Orchestrate workflow",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function orchestrateSpeedrunWorkflow(
  input: InferSchema<typeof schema>,
): Promise<SpeedrunWorkflowOutput> {
  const docs = await analyzeDocs({ url: input.url });

  const plan = generateSpeedrunPlan({
    productName: input.productName,
    stack: input.stack,
    docSummary: docs.summary,
    keyConcepts: docs.keyConcepts,
    suggestedFocusAreas: docs.suggestedFocusAreas,
  });

  const clips = clipOutline({
    productName: input.productName,
    mainWin: input.mainWin,
    mainPain: input.mainPain,
    planSteps: plan.steps,
    docSummary: docs.summary,
  });

  return { docs, plan, clips };
}

